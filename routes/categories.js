const express = require("express");

const categoriesRouter = express.Router();

const categoriesController = require("../controllers/categoriesController");

// get requests
categoriesRouter.get("/", categoriesController.allCategoriesGet);

// post requests
// categoriesRouter.post("/", categoriesController.newCategoryPost);

module.exports = categoriesRouter;
