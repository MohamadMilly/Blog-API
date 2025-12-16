const express = require("express");

const postsRouter = express.Router();

const verifyToken = require("../middlewares/verifytoken");

const postsController = require("../controllers/postsController");

// get resources
postsRouter.get("/", postsController.allPostsGet);
postsRouter.get("/:slug", postsController.specificPostGet);
postsRouter.get("/:slug/comments", postsController.allcommentsForPostGet);

// post resources
postsRouter.post("/", verifyToken, postsController.newPost_Post);
postsRouter.post(
  "/:slug/comments",
  verifyToken,
  postsController.newCommentPost
);

// put resources
postsRouter.put("/:slug", verifyToken, postsController.updatePostPut);
postsRouter.put(
  "/:slug/comments/:commentId",
  verifyToken,
  postsController.updateCommentPut
);

// patch resoruces
postsRouter.patch(
  "/:slug/publish",
  verifyToken,
  postsController.publishPostPatch
);
postsRouter.patch(
  "/:slug/unpublish",
  verifyToken,
  postsController.unpublishPostPatch
);

// delete resources
postsRouter.delete("/:slug", verifyToken, postsController.deletePostDelete);
postsRouter.delete(
  "/:slug/comments/:commentId",
  verifyToken,
  postsController.deleteCommentDelete
);

module.exports = postsRouter;
