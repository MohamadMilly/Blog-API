require("dotenv").config();
// prisma client after `npx prisma generate`
const prisma = require("../lib/prisma");

const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.SECRET_KEY;

const allCategoriesGet = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: {
        title: "asc",
      },
    });
    return res.json({
      categories: categories,
    });
  } catch (error) {
    return res.status(500).json({
      message: "An error happened while getting the categories",
    });
  }
};

module.exports = {
  allCategoriesGet,
};
