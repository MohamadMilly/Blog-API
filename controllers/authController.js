require("dotenv").config();
// prisma client after `npx prisma generate`
const prisma = require("../lib/prisma");

const jwt = require("jsonwebtoken"); // jsonwebtoken
// bcrypt for hashing
const bcrypt = require("bcryptjs");

const SECRET_KEY = process.env.SECRET_KEY;

const signupPost = async (req, res) => {
  const { firstname, lastname, username, password, email } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await prisma.user.create({
      data: {
        firstname,
        lastname,
        username,
        password: hashedPassword,
        email,
      },
    });
    return res.json({
      message: "Your account has been created successfully.",
    });
  } catch (error) {
    return res.status(500).json({
      message: "There has been an error creating the account",
    });
  }
};

const loginPost = async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await prisma.user.findUnique({
    where: {
      username: username,
    },
  });
  if (!existingUser) {
    return res.status(401).json({
      message: "Username is incorrect.",
    });
  }
  const hashedPassword = existingUser.password;
  const doesMatch = await bcrypt.compare(password, hashedPassword);
  if (!doesMatch) {
    return res.status(401).json({
      message: "Password is incorrect.",
    });
  }
  const payload = {
    user: {
      id: existingUser.id,
      firstname: existingUser.firstname,
      lastname: existingUser.lastname,
      username: existingUser.username,
      role: existingUser.role,
    },
  };

  jwt.sign(payload, SECRET_KEY, (err, token) => {
    if (err) {
      return res.json({
        message: "Token error",
      });
    }
    return res.json({ token: token });
  });
};

module.exports = {
  signupPost,
  loginPost,
};
