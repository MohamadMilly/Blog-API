const express = require("express");
const authController = require("../controllers/authController");

const authRouter = express.Router();

authRouter.post("/signup", authController.signupPost);
authRouter.post("/login", authController.loginPost);
authRouter.post("/code/exchange", authController.issuedCodePost);
authRouter.post("/code/validate", authController.issuedCodeValidatePost);

module.exports = authRouter;
