require("dotenv").config();
// prisma client after `npx prisma generate`
const prisma = require("../lib/prisma");

const jwt = require("jsonwebtoken");

// for hashing and comparing passwords
const bcrypt = require("bcryptjs");

const SECRET_KEY = process.env.SECRET_KEY;

const currentUserGet = async (req, res) => {
  const token = req.token;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const currentUserId = authData.user.id;
    const currentUserData = await prisma.user.findUnique({
      where: {
        id: currentUserId,
      },
      select: {
        profile: true,
        username: true,
        lastname: true,
        firstname: true,
        role: true,
        profile: true,
      },
    });
    return res.json({
      currentUser: currentUserData,
    });
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

const updateCurrentUserProfilePatch = async (req, res) => {
  const token = req.token;
  const { bio, avatar, location } = req.body;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const currentUser = authData.user;
    const data = {};
    if (bio !== undefined) {
      data.bio = bio;
    }
    if (avatar !== undefined) {
      data.avatar = avatar;
    }
    if (location !== undefined) {
      data.location = location;
    }
    const updatedProfile = await prisma.profile.upsert({
      where: {
        userId: currentUser.id,
      },
      update: {
        ...data,
      },
      create: {
        userId: currentUser.id,
        ...data,
      },
    });
    return res.json({
      profile: updatedProfile,
    });
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token.",
    });
  }
};

const changePasswordPatch = async (req, res) => {
  const token = req.token;
  const { password, newPassword } = req.body;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const currentUserId = authData.user.id;

    const currentUserData = await prisma.user.findUnique({
      where: {
        id: currentUserId,
      },
    });
    if (!currentUserData) {
      return res.status(404).json({
        message: "User is not found.",
      });
    }
    const oldPassword = currentUserData.password;
    const doesMatch = await bcrypt.compare(password, oldPassword);
    if (!doesMatch) {
      return res.status(400).json({
        message: "password is incorrect",
      });
    }
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: {
        id: currentUserId,
      },
      data: {
        password: hashedNewPassword,
      },
    });
    return res.json({ message: "The password has been changed successfully" });
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

const deleteAccountDelete = async (req, res) => {
  const token = req.token;
  try {
    const authData = jwt.verify(token, SECRET_KEY);
    const currentUserId = authData.user.id;

    await prisma.user.update({
      where: {
        id: currentUserId,
      },
      data: {
        deleted: true,
        email: `deleted_${currentUserId}@deleted.local`,
        password: await bcrypt.hash(crypto.randomUUID(), 10),
        username: `deleted_${currentUserId}`,
      },
    });
    return res.json({
      message: "Your Account has been deleted successfully.",
    });
  } catch (err) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};

const userInfoGet = async (req, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    return res.status(400).json({ message: "Invalid user ID." });
  }
  try {
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        firstname: true,
        lastname: true,
        username: true,
        role: true,
        email: true,
        profile: true,
      },
    });
    if (!user) {
      return res.status(404).json({
        message: "User is not found.",
      });
    }
    if (user.deleted) {
      user.email = null;
      user.username = "Deleted Account";
    }
    return res.json({ user: user });
  } catch (err) {
    return res.status(500).json({
      message: "Server Error",
    });
  }
};

module.exports = {
  currentUserGet,
  updateCurrentUserProfilePatch,
  changePasswordPatch,
  deleteAccountDelete,
  userInfoGet,
};
