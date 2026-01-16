require("dotenv").config();
// prisma client after `npx prisma generate`
const prisma = require("../lib/prisma");

const jwt = require("jsonwebtoken");

const { matchedData, validationResult } = require("express-validator");

const SECRET_KEY = process.env.SECRET_KEY;

const allPostsGet = async (req, res) => {
  const { sort, author, categories, slug, page } = req.query;
  const orderSymbol = sort ? sort.at(0) : undefined;
  const order = orderSymbol === "+" ? "asc" : "desc";
  const sortBy = sort ? sort.slice(1) : undefined;
  const categoriesList = categories
    ? Array.isArray(categories)
      ? categories
      : categories.split(",")
    : null;
  const normalizeSlug = (s) => s.trim().toLowerCase().replace(/\s+/g, "-");
  const slugAsDashedString = slug ? normalizeSlug(slug) : undefined;

  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true,
        authorId: author || undefined,
        AND: categories
          ? categoriesList.map((category) => ({
              categories: { some: { title: category } },
            }))
          : [],
        OR: slug
          ? [
              { slug: { contains: slugAsDashedString, mode: "insensitive" } },
              { title: { contains: slug, mode: "insensitive" } },
            ]
          : undefined,
      },
      include: {
        categories: true,
        author: {
          include: {
            profile: true,
          },
        },
      },
      orderBy: sort ? { [sortBy]: order } : { createdAt: "desc" },
      skip: page ? page * 5 : 0,
      take: 5,
    });
    return res.json({
      posts: posts,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Unexpected Error has happened , ${error.message}`,
    });
  }
};

const specificPostGet = async (req, res) => {
  try {
    const slug = req.params.slug;
    const post = await prisma.post.findUnique({
      where: {
        slug: slug,
      },
      include: {
        author: {
          include: {
            profile: true,
          },
        },
        categories: true,
        comments: true,
      },
    });
    if (!post) {
      res.status(404).json({
        message: "Post is not found.",
      });
    }
    return res.json({
      post: post,
    });
  } catch (error) {
    return res.status(500).json({
      message: `Unexpected Error has happened , ${error.message}`,
    });
  }
};

/* const getPostsBySearch = async (req, res) => {
  const query = req.params.slug;
  try {
    const posts = await prisma.post.findMany({
      where: {
        slug: {
          contains: query,
        },
      },
    });
    return res.json({
      posts: posts || [],
    });
  } catch (err) {
    return res.status(500).json({
      message: "Error searching for posts",
    });
  }
};
*/

const newPost_Post = async (req, res) => {
  jwt.verify(req.token, SECRET_KEY, async (err, authData) => {
    if (err) {
      return res.status(403).json({
        message: "Invalid or expired token.",
      });
    }
    const currentUser = authData.user;
    if (currentUser.role !== "Author") {
      return res.status(403).json({
        message: "You're not authorized to post",
      });
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const { title, content, published, categories, slug, featuredImageURL } =
      matchedData(req);
    try {
      const post = await prisma.post.create({
        data: {
          title,
          content,
          published,
          slug,
          featuredImageURL: featuredImageURL ? featuredImageURL : null,
          categories: {
            connectOrCreate: categories.map((categoryName) => {
              return {
                where: { title: categoryName },
                create: { title: categoryName },
              };
            }),
          },
          author: {
            connect: {
              id: currentUser.id,
            },
          },
        },
      });
      res.json({
        post: post,
      });
    } catch (error) {
      res.status(500).json({
        message: `An unexpected error happened while creating the post , ${error.message}`,
      });
    }
  });
};

const newCommentPost = async (req, res) => {
  const token = req.token;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const { content } = matchedData(req);
    const postSlug = req.params.slug;

    let isAborted = false;
    req.on("aborted", () => {
      console.log("The client has aborted the request");
      isAborted = true;
    });

    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
      },
    });
    if (!post) {
      return res.status(404).json({
        message: "Post is not found.",
      });
    }
    if (isAborted) return;

    const comment = await prisma.comment.create({
      data: {
        content: content,
        post: {
          connect: {
            id: post.id,
          },
        },
        author: {
          connect: {
            id: user.id,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            profile: {
              select: {
                avatar: true,
              },
            },
          },
        },
      },
    });
    if (isAborted) return;
    return res.json({
      comment: comment,
      post: post,
    });
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

const allcommentsForPostGet = async (req, res) => {
  const postSlug = req.params.slug;
  try {
    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
      },
      include: {
        comments: {
          include: {
            author: {
              select: {
                firstname: true,
                lastname: true,
                username: true,
                profile: true,
                id: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            profile: true,
          },
        },
      },
    });
    return res.json({
      comments: post.comments,
      post: post,
    });
  } catch (err) {
    return res.status(500).json({
      message: `Unexpected Error has happened, ${err.message}`,
    });
  }
};

const updatePostPut = async (req, res) => {
  const token = req.token;
  const postSlug = req.params.slug;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }
  const { title, content, published, categories, slug, featuredImageURL } =
    matchedData(req);

  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;
    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
      },
    });
    if (!post) {
      return res.status(404).json({
        message: "Post is not found.",
      });
    }
    if (post.authorId !== user.id) {
      return res.status(403).json({
        message: "You're not authorized to update this post.",
      });
    }
    const updatedPost = await prisma.post.update({
      where: {
        slug: postSlug,
      },
      data: {
        title,
        content,
        published,
        slug,
        featuredImageURL: featuredImageURL ? featuredImageURL : null,
        categories: {
          set: [],
          connectOrCreate: categories.map((categoryName) => {
            return {
              where: { title: categoryName },
              create: { title: categoryName },
            };
          }),
        },
      },
    });
    return res.json({
      post: updatedPost,
    });
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
};

const updateCommentPut = async (req, res) => {
  const token = req.token;

  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    }
    const { content } = matchedData(req);
    const postSlug = req.params.slug;
    const commentId = req.params.commentId;

    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
      },
    });
    if (!post) {
      return res.status(404).json({
        message: "Post is not found.",
      });
    }
    const oldComment = await prisma.comment.findUnique({
      where: {
        id: parseInt(commentId),
      },
    });
    if (!oldComment) {
      return res.status(404).json({
        message: "Comment is not found.",
      });
    }
    if (oldComment.authorId !== user.id) {
      return res.status(403).json({
        message: "You're not authorized to update this comment",
      });
    }
    const updatedComment = await prisma.comment.update({
      where: {
        id: parseInt(commentId),
      },
      data: {
        content: content,
      },
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            username: true,
            profile: {
              select: {
                avatar: true,
              },
            },
          },
        },
      },
    });
    return res.json({
      comment: updatedComment,
    });
  } catch (err) {
    return res.status(403).json({
      message: `Invalid or expired token ${err}`,
    });
  }
};

const deletePostDelete = async (req, res) => {
  const token = req.token;
  const postSlug = req.params.slug;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;

    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
      },
      include: {
        comments: true,
      },
    });
    if (!post) {
      return res.status(404).json({
        message: "Post is not found.",
      });
    }
    if (post.authorId !== user.id) {
      return res.status(403).json({
        message: "You're not authorized to delete this post.",
      });
    }

    const deleteCommentsPromise = prisma.comment.deleteMany({
      where: {
        postId: post.id,
      },
    });
    const deletePostPromise = prisma.post.delete({
      where: {
        slug: postSlug,
      },
    });

    const [deletedComments, deletedPost] = await prisma.$transaction([
      deleteCommentsPromise,
      deletePostPromise,
    ]);
    return res.json({
      post: deletedPost,
    });
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

const deleteCommentDelete = async (req, res) => {
  const token = req.token;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;
    const postSlug = req.params.slug;
    const commentId = parseInt(req.params.commentId);

    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
      },
    });
    if (!post) {
      return res.status(404).json({
        message: "Post is not found.",
      });
    }
    const comment = await prisma.comment.findUnique({
      where: {
        id: commentId,
      },
    });
    if (!comment) {
      return res.status(404).json({
        message: "Comment is not found.",
      });
    }
    if (comment.authorId !== user.id) {
      return res.status(403).json({
        message: "You're not authorized to delete this comment.",
      });
    }
    const deletedComment = await prisma.comment.delete({
      where: {
        id: commentId,
      },
    });
    return res.json({
      comment: deletedComment,
    });
  } catch (err) {
    return res.status(403).json({
      message: `Invalid or expired token.`,
    });
  }
};

const publishPostPatch = async (req, res) => {
  const token = req.token;
  const postSlug = req.params.slug;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;

    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
      },
    });
    if (!post) {
      return res.status(404).json({
        message: "Post is not found.",
      });
    }
    if (post.authorId !== user.id) {
      return res.status(403).json({
        message: "You're not authorized to update this post status",
      });
    }
    const publishedPost = await prisma.post.update({
      where: {
        slug: postSlug,
      },
      data: {
        published: true,
      },
    });
    return res.json({
      post: publishedPost,
    });
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
};

const togglePublishPostPatch = async (req, res) => {
  const token = req.token;
  const postSlug = req.params.slug;
  const publish = req.body.publish;
  if (typeof publish !== "boolean")
    return res.status(400).json({
      message: "Invalid input.",
    });
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;

    const post = await prisma.post.findUnique({
      where: {
        slug: postSlug,
      },
    });
    if (!post) {
      return res.status(404).json({
        message: "Post is not found.",
      });
    }
    if (post.authorId !== user.id) {
      return res.status(403).json({
        message: "You're not authorized to update this post status",
      });
    }
    const unpublishedPost = await prisma.post.update({
      where: {
        slug: postSlug,
      },
      data: {
        published: publish,
      },
    });
    return res.json({
      post: unpublishedPost,
    });
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
};

const togglePublishPostsPatch = async (req, res) => {
  const token = req.token;
  const publish = req.body.publish;
  if (typeof publish !== "boolean")
    return res.status(400).json({
      message: "Invalid input",
    });
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;

    const updatedPosts = await prisma.post.updateManyAndReturn({
      where: {
        authorId: user.id,
      },
      data: {
        published: publish,
      },
    });
    return res.json({
      posts: updatedPosts,
    });
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
};

module.exports = {
  allPostsGet,
  newPost_Post,
  specificPostGet,
  newCommentPost,
  allcommentsForPostGet,
  updatePostPut,
  updateCommentPut,
  deletePostDelete,
  deleteCommentDelete,
  publishPostPatch,
  togglePublishPostPatch,
  togglePublishPostsPatch,
};
