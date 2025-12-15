const express = require("express");
const authController = require("../controllers/authController");

const authRouter = express.Router();

authRouter.post("/signup", authController.signupPost);
authRouter.post("/login", authController.loginPost);

module.exports = authRouter;
