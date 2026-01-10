const { body } = require("express-validator");

const errorMessages = require("../utils/errorMessages");

const validateTitle = body("title")
  .notEmpty()
  .withMessage(`Title ${errorMessages.emptyErrorMessage}`);

const validateSlug = body("slug")
  .notEmpty()
  .withMessage(`Slug ${errorMessages.emptyErrorMessage}`)
  .isSlug()
  .withMessage(`Slug field ${errorMessages.notSlugErrorMessage}`);

const validateContent = body("content")
  .notEmpty()
  .withMessage(`Content ${errorMessages.emptyErrorMessage}`)
  .isLength({ min: 200 })
  .withMessage(
    `Content ${errorMessages.lengthBoundariesErrorMessage} 200 chars.`
  );

const validatePublished = body("published")
  .isBoolean()
  .withMessage(`Publish state ${errorMessages.notBooleanErrorMessage}`);

const validateFeaturedImageURL = body("featuredImageURL")
  .isURL()
  .withMessage(`Featured image URL ${errorMessages.notURLErrorMessage}`);

const validateCategories = body("categories")
  .isArray()
  .withMessage(`Categories ${errorMessages.notArrayErrorMessage}`)
  .custom((value, { req }) => {
    const categories = value;
    const allStrings = categories.every(
      (category) => typeof category === "string"
    );
    if (!allStrings) {
      throw new Error("Categories should be strings");
    }
    return true;
  });

const validatePost = [
  validateTitle,
  validateSlug,
  validatePublished,
  validateContent,
  validateCategories,
  validateFeaturedImageURL,
];
module.exports = validatePost;
