const { body } = require("express-validator");
const { emptyErrorMessage } = require("../utils/errorMessages");

const validateContent = body("content")
  .trim()
  .notEmpty()
  .withMessage(`Comment ${emptyErrorMessage}`);

const validateComment = [validateContent];

module.exports = validateComment;
