const express = require("express");

const postsRouter = express.Router();

const verifyToken = require("../middlewares/verifytoken");

const postsController = require("../controllers/postsController");

// validators for comments and posts (express-validator middlewares)
const validatePost = require("../middlewares/validatePosts");
const validateComment = require("../middlewares/validateComments");

// get resources
postsRouter.get("/", postsController.allPostsGet);
postsRouter.get("/:slug", postsController.specificPostGet);
postsRouter.get("/:slug/comments", postsController.allcommentsForPostGet);

// post resources
postsRouter.post("/", verifyToken, validatePost, postsController.newPost_Post);
postsRouter.post(
  "/:slug/comments",
  verifyToken,
  validateComment,
  postsController.newCommentPost
);

// put resources
postsRouter.put(
  "/:slug",
  verifyToken,
  validatePost,
  postsController.updatePostPut
);
postsRouter.put(
  "/:slug/comments/:commentId",
  verifyToken,
  validateComment,
  postsController.updateCommentPut
);

// patch resoruces
postsRouter.patch(
  "/:slug",
  verifyToken,
  postsController.togglePublishPostPatch
);
postsRouter.patch("/", verifyToken, postsController.togglePublishPostsPatch);

// delete resources
postsRouter.delete("/:slug", verifyToken, postsController.deletePostDelete);
postsRouter.delete(
  "/:slug/comments/:commentId",
  verifyToken,
  postsController.deleteCommentDelete
);

module.exports = postsRouter;
