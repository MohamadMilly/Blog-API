const express = require("express");

// requiring dotenv to access .env file
require("dotenv").config();

// apicache built-in express
const apicache = require("apicache");
const cache = apicache.middleware;

// routers
const authRouter = require("./routes/auth");
const postsRouter = require("./routes/posts");
const usersRouter = require("./routes/users");

const app = express();

// caching for 2 minutes
app.use(cache("2 minutes"));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRouter);
app.use("/posts", postsRouter);
app.use("/users", usersRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, (error) => {
  if (error) {
    throw new Error(error);
  }
  console.log("app is listening on port: ", PORT);
});
