const express = require("express");

const cors = require("cors");

// requiring dotenv to access .env file
require("dotenv").config();

// apicache built-in express
const apicache = require("apicache");
const cache = apicache.middleware;

// routers
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const usersRouter = require("./routes/users");
const categoriesRouter = require("./routes/categories");

const app = express();

// caching for 2 minutes

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/users", usersRouter);
app.use("/categories", categoriesRouter);

app.use(cache("2 minutes"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw new Error(error);
  }
  console.log("app is listening on port: ", PORT);
});
