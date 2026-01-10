require("dotenv").config();
// prisma client after `npx prisma generate`
const prisma = require("../lib/prisma");

const jwt = require("jsonwebtoken"); // jsonwebtoken
// bcrypt for hashing
const bcrypt = require("bcryptjs");

const { validationResult, matchedData } = require("express-validator");

const SECRET_KEY = process.env.SECRET_KEY;

const signupPost = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      errors: errors.array(),
    });
  }
  const {
    firstname,
    lastname,
    username,
    password,
    passwordConfirmation,
    email,
  } = matchedData(req);
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
    const payLoad = {
      user: {
        id: user.id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    };
    jwt.sign(payLoad, SECRET_KEY, (err, token) => {
      if (err) {
        return res.json({
          message: "Token error",
        });
      }
      return res.json({
        message: "Your account has been created successfully.",
        token: token,
        user: payLoad.user,
      });
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
      email: existingUser.email,
      role: existingUser.role,
    },
  };

  jwt.sign(payload, SECRET_KEY, (err, token) => {
    if (err) {
      return res.status(500).json({
        message: "Token error",
      });
    }
    return res.json({ token: token, user: payload.user });
  });
};

const issuedCodePost = async (req, res) => {
  const token = req.body.token;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const user = authData.user;
    const userId = user.id;

    jwt.sign(
      {
        id: userId,
        purpose: "exchange",
      },
      SECRET_KEY,
      { expiresIn: "60s" },
      (err, token) => {
        if (err) {
          return res.status(500).json({
            message: "Token Error",
          });
        }
        return res.json({
          tempToken: token,
        });
      }
    );
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

const issuedCodeValidatePost = async (req, res) => {
  const { tempToken } = req.body;
  if (!tempToken) {
    return res.status(401).json({
      message: "Token is missing.",
    });
  }
  try {
    const data = jwt.verify(tempToken, SECRET_KEY);
    if (data.purpose !== "exchange") {
      return res.status(401).json({
        message: "Invalid purpose.",
      });
    }
    const existingUser = await prisma.user.findUnique({
      where: {
        id: data.id,
      },
    });
    const payload = {
      user: {
        id: existingUser.id,
        firstname: existingUser.firstname,
        lastname: existingUser.lastname,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role,
      },
    };
    jwt.sign(payload, SECRET_KEY, (err, token) => {
      if (err) {
        return res.status(500).json({
          message: "Token error",
        });
      }
      return res.json({ token: token, user: payload.user });
    });
  } catch (err) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

module.exports = {
  signupPost,
  loginPost,
  issuedCodePost,
  issuedCodeValidatePost,
};
