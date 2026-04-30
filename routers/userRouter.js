const express = require("express");
const User = require("../schemas/userSchema");
const { isEmail, isStrongPassword } = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOtp } = require("../utils/helpers");
const userAuth = require("../middlewares/userAuth");

const userRouter = express.Router();

//============= User signup ===================

userRouter.post("/api/signup", async (req, res, next) => {
  try {
    const allowedFields = [
      "userName",
      "email",
      "password",
      "bio",
      "profilePic",
    ];

    const isInvalid = Object.keys(req.body).some(
      (item) => !allowedFields.includes(item),
    );

    if (isInvalid) {
      return res.status(401).json({
        success: false,
        Error: "Invalid request body.",
        message: "Unknown field.",
      });
    }

    const { userName, email, password, bio, profilePic } = req.body;

    if (!userName?.trim() || !email?.trim() || !password?.trim()) {
      return res.status(400).json({
        success: false,
        message: "UserName, Email, and Password are mandatory.",
      });
    }

    if (!isStrongPassword(password)) {
      return res.status(400).json({
        success: false,
        Error: "Not a strong password.",
        message: "Password must be strong.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = new User({
      userName,
      email,
      password: passwordHash,
      bio,
      profilePic,
    });

    await user.save();
    res.status(200).json({ success: true, message: "Register successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Something went wrong." + error });
  }
});

//============= User login ===================

userRouter.post("/api/login", async (req, res, next) => {
  try {
    const allowedFields = ["email", "password"];

    const isInvalid = Object.keys(req.body).some(
      (item) => !allowedFields.includes(item),
    );

    if (isInvalid) {
      return res.status(401).json({
        success: false,
        Error: "Invalid request body.",
        message: "Unknown field.",
      });
    }

    const { email, password } = req.body;

    if (!isEmail(email)) {
      return res.status(400).json({
        success: false,
        Error: "Invalid email address.",
        message: "Please enter a valid email address",
      });
    }

    const isValidUser = await User.findOne({ email });

    if (!isValidUser) {
      return res.status(400).json({
        success: false,
        Error: "User not found.",
        message: "Invalid credentials.",
      });
    }

    const isValidPass = await bcrypt.compare(password, isValidUser.password);

    if (!isValidPass) {
      return res.status(400).json({
        success: false,
        Error: "Unmatched password",
        message: "Invalid credentials.",
      });
    }

    //request for otp

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const currentTimeStamp = Date.now();
    const otpExpiry = currentTimeStamp + 5 * 60 * 1000;

    const value = await User.updateOne(
      { email: isValidUser.email },
      {
        $set: {
          otp: otp,
          otpExpiry: otpExpiry,
        },
      },
    );

    await sendOtp(email, otp);

    res
      .status(200)
      .json({ success: true, message: "otp sent successfully", data: email });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Something went wrong." + error });
  }
});

//============= otp_verify ===================

userRouter.post("/api/otp_verify", async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        success: false,
        Error: "Required data not found.",
        message: "Please fill the required fields.",
      });
    }

    const { email, otp } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        Error: "Email not found.",
        message: "Please fill the required fields.",
      });
    }

    if (!isEmail(email)) {
      return res.status(400).json({
        success: false,
        Error: "Invalid email address.",
        message: "Please sent a valid email address",
      });
    }

    const isValidUser = await User.findOne({ email });

    if (!isValidUser || !isValidUser.otp) {
      return res.status(400).json({
        success: false,
        Error: "Session expired.",
        message: "Please login again.",
      });
    }

    if (isValidUser.otpExpiry) {
      const currentTimeStamp = Date.now();
      const otpExpiryTime = new Date(isValidUser.otpExpiry).getTime();

      if (otpExpiryTime < currentTimeStamp) {
        return res.status(400).json({
          success: false,
          Error: "otp Expired.",
          message: "otp expired",
        });
      }

      if (otp !== isValidUser.otp) {
        return res.status(400).json({
          success: false,
          error: "Authentication Failed",
          message: "Invalid or expired verification code.",
        });
      }

      const userToken = await jwt.sign(
        {
          role: isValidUser.role,
          id: isValidUser._id,
        },
        process.env.jwtSecretKey,
        { expiresIn: "1d" },
      );

      await User.updateOne(
        { email: isValidUser.email },
        { $unset: { otp: " ", otpExpiry: " " } },
      );

      res.cookie("userToken", userToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ success: true, message: "Logged in successfull" });
    }
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Something went wrong." + error });
  }
});

// userRouter.post("/api/role", async (req, res) => {

//     try {
//         const { id, role } = req.body;

//         if (!id || !role) {
//             return res.status(400).json({ success: false, message: "All fields are required." });
//         }

//         const isValid = await User.findOne({ _id: id });

//         if (!isValid) {
//             return res.status(401).json({ success: false, message: "Unautherized user." });
//         }

//         const actualRole = isValid?.role;

//         if (role !== actualRole) {
//             return res.status(401).json({ success: false, message: "Unauthorized access." });
//         }

//         res.status(200).json({ success: true, message: "Access granted." })

//     } catch (error) {
//         return res.status(401).json({ success: false, message: "Something went wrong." });
//     }

// })

//============= profile ===================

userRouter.get("/api/profile", userAuth, async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(400).json({ success: false, Error: "user not found." });
    }

    res
      .status(200)
      .json({ success: true, message: "user fecthed", data: user });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong." });
  }
});

userRouter.post("/api/logout", (req, res) => {
  res.cookie("userToken", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    path: "/",
  });

  return res.status(200).json({
    success: true,
    message: "Logout successfully.",
  });
});

userRouter.post("/api/reset-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email && !isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email address." });
    }

    const isUserPresent = await User.findOne({ email });

    if (!isUserPresent) {
      return res
        .status(401)
        .json({ success: false, message: "Wrong Creadentials" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const currentTimeStamp = Date.now();
    const otpExpiry = currentTimeStamp + 5 * 60 * 1000;

    await User.findOneAndUpdate(
      { email },
      {
        $set: {
          otp: otp,
          otpExpiry: otpExpiry,
        },
      },
    );

    await sendOtp(email, otp);

    const resetPassToken = await jwt.sign(
      { userEmail: isUserPresent.email },
      process.env.jwtSecretKey,
      {
        expiresIn: "5m",
      },
    );

    res.cookie("resetPassToken", resetPassToken);

    res.status(200).json({ success: true, message: "Otp sent successfully." });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong." + error });
  }
});

userRouter.post("/api/reset-password/verify", async (req, res) => {
  try {
    const { resetPassToken } = req.cookies;
    const userOtp = req.body;

    const isValidToken = await jwt.verify(
      resetPassToken,
      process.env.jwtSecretKey,
    );

    if (!isValidToken) {
      return res
        .status(401)
        .json({ success: false, message: "Unautherized access." });
    }

    const isValidUser = await User.findOne({ email: isValidToken.userEmail });

    if (!isValidUser) {
      return res
        .status(400)
        .json({ success: false, message: "Wrong credentials." });
    }

    const { otp, otpExpiry } = isValidUser;

  } catch (error) {
    return res
      .status(400)
      .json({ success: false, message: "Something went  wrong." + error });
  }
});

module.exports = userRouter;
