const express = require("express");

const usersRouter = express.Router();

const verifyToken = require("../middlewares/verifytoken");

const usersController = require("../controllers/usersController");

// get resources
/* -> current user resources  */
usersRouter.get("/me", verifyToken, usersController.currentUserGet);
usersRouter.get("/me/posts", verifyToken, usersController.currentUserPostsGet);
/* -> global users resources  */
usersRouter.get("/id/:userId", usersController.userInfoByIdGet);
usersRouter.get("/name/:username", usersController.userInfoByNameGet);

// patch resources
usersRouter.patch(
  "/me",
  verifyToken,
  usersController.updateCurrentUserProfilePatch
);
usersRouter.patch(
  "/me/password",
  verifyToken,
  usersController.changePasswordPatch
);

// delete resources
usersRouter.delete("/me", verifyToken, usersController.deleteAccountDelete);

module.exports = usersRouter;
