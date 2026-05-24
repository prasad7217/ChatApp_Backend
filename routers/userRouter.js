const express = require("express");
const User = require("../schemas/userSchema");
const { isEmail, isStrongPassword } = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { sendOtp, resetPasswordLimits } = require("../utils/helpers");
const userAuth = require("../middlewares/userAuth");
const { default: rateLimit } = require("express-rate-limit");
const upload = require("../utils/imageUpload");

const userRouter = express.Router();

//============= User signup ===================

userRouter.post("/signup", upload.single("profilePic"), async (req, res, next) => {
  try {

    const allowedFields = [
      "userName",
      "email",
      "password",
      "bio",
      "designation"
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

    const { userName, email, password, bio, designation } = req.body;
    const profilePic = req.file?.path

    if (!userName?.trim() || !designation?.trim() || !email?.trim() || !password?.trim()) {
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
      designation,
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

userRouter.post("/login", async (req, res, next) => {
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

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
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
      .json({ success: true, message: "otp sent successfully", data: { id: isValidUser._id, otpExpiry, email: isValidUser.email, mode: "User-login" } });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Something went wrong." + error });
  }
});


//============= otp_verify ===================

userRouter.post("/otp_verify", async (req, res) => {
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

userRouter.get("/profile", userAuth, async (req, res) => {
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


userRouter.get("/allusers", userAuth, async (req, res) => {

  try {

    const user = req.user;

    if (!user) {
      return res.status(400).json({ success: false, Error: "user not found." });
    }

    const allUsers = await User.find({ _id: { $ne: user._id } }).select("userName designation bio profilePic");

    return res.status(200).json({ success: true, data: allUsers })

  } catch (error) {
    return res.status(500).json({ message: "Something went wrong." });
  }

})



userRouter.post("/logout", (req, res) => {
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


// ========================= forgot password ===========================

userRouter.post(
  "/reset-password",
  resetPasswordLimits,
  async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !isEmail(email)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid email address." });
      }

      const isUserPresent = await User.findOne({ email });

      if (!isUserPresent) {
        return res.status(200).json({
          success: true,
          message: "If the email exists, OTP has been sent.",
        });
      }

      const otp = Math.floor(1000 + Math.random() * 9000).toString();
      const currentTimeStamp = Date.now();
      const otpExpiry = currentTimeStamp + 60 * 1000;

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

      res.cookie("resetPassToken", resetPassToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 5 * 60 * 1000,
      });

      res
        .status(200)
        .json({ success: true, message: "Otp sent successfully.", data: { email, otpExpiry, mode: "Reset-password" } });
    } catch (error) {
      return res.status(500).json({ message: "Something went wrong." + error });
    }
  },
);


// ============================= forgot password verify =========================

userRouter.post(
  "/reset-password/verify",
  resetPasswordLimits,
  async (req, res) => {
    try {
      const { resetPassToken } = req.cookies;
      const userOtp = req.body;

      let isValidToken;
      try {
        isValidToken = await jwt.verify(
          resetPassToken,
          process.env.jwtSecretKey,
        );
      } catch (error) {
        return res
          .status(401)
          .json({ success: false, message: "Unautherized access." });
      }

      if (!isValidToken) {
        return res
          .status(401)
          .json({ success: false, message: "Unautherized access." });
      }

      const isValidUser = await User.findOne({ email: isValidToken.userEmail });

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

        if (userOtp.otp !== isValidUser.otp) {
          return res.status(400).json({
            success: false,
            error: "Authentication Failed",
            message: "Invalid or expired verification code.",
          });
        }
      }

      await User.findOneAndUpdate(
        { email: isValidToken.userEmail },
        {
          $unset: {
            otp: "",
            otpExpiry: "",
          },
        },
      );

      const verificationToken = await jwt.sign(
        { email: isValidUser.email, verified: true },
        process.env.jwtSecretKey,
        { expiresIn: "5m" },
      );

      res.cookie("resetPassToken", null, {
        expires: new Date(Date.now()),
      });

      res.cookie("verificationToken", verificationToken, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 5 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: "Allowed for reset password.",
      });
    } catch (error) {
      return res
        .status(400)
        .json({ success: false, message: "Something went  wrong." + error });
    }
  },
);


// ================================== new password =========================================

userRouter.post("/reset-password/new", async (req, res) => {
  try {
    const { verificationToken } = req.cookies;
    const { password } = req.body;

    if (!verificationToken) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized access." });
    }

    const decodedToken = await jwt.verify(
      verificationToken,
      process.env.jwtSecretKey,
    );

    if (!decodedToken.verified) {
      return res
        .status(401)
        .json({ success: false, message: "Otp verification required." });
    }

    const { email } = decodedToken;

    if (!isEmail(email)) {
      return res.status(400).json({
        success: false,
        Error: "Invalid email address.",
        message: "Please enter a valid email address",
      });
    }

    if (!isStrongPassword(password)) {
      return res
        .status(400)
        .json({ success: false, message: "Not a strong password" });
    }

    const isValidUser = await User.findOne({ email });

    if (!isValidUser) {
      return res.status(400).json({
        success: false,
        Error: "User not found.",
        message: "Invalid credentials.",
      });
    }

    const isSame = await bcrypt.compare(password, isValidUser.password);

    if (isSame) {
      return res.status(401).json({
        success: false,
        message: "New password and old password should not be same.",
      });
    }

    const newPasswordHash = await bcrypt.hash(password, 10);

    const updatedUser = await User.findOneAndUpdate(
      { email },
      {
        $set: {
          password: newPasswordHash,
        },
      },
    );

    if (!updatedUser) {
      return res.status(401).json({ success: false, message: "Bad request." });
    }

    res.cookie("verificationToken", null, {
      expires: new Date(Date.now()),
    });

    return res
      .status(200)
      .json({ success: true, massage: "Password reset successfully." });
  } catch (error) {
    return res
      .status(400)
      .json({ success: true, message: "Something went wrong." });
  }
});


// =============================== resend otp ==============================

userRouter.post("/resend/otp", resetPasswordLimits, async (req, res) => {

  try {

    const { email } = req.body;

    if (!isEmail(email)) {
      return res.status(400).json({ success: false, message: "Invalid email address." });
    }

    const isUser = await User.findOne({ email });

    if (!isUser) {
      return res.status(401).json({ success: false, message: "Unauthorized request." });
    }

    if (isUser.otp && isUser.otpExpiry) {

      const currentTimeStamp = Date.now();
      const existingOtpExpiry = isUser.otpExpiry;

      if (existingOtpExpiry > currentTimeStamp) {
        return res.status(400).json({ success: false, message: "OTP is still valid please check it once." })
      }
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpExpiry = Date.now() + 5 * 60 * 1000;

    const userValues = await User.findByIdAndUpdate(isUser._id, {
      $set: {
        otp,
        otpExpiry
      }
    })

    try {
      await sendOtp(email, otp)
    } catch (emailError) {
      return res.status(500).json({ success: false, message: "Failed to send OTP, please try again." })
    }

    res.status(200).json({ success: true, message: "Otp sent successfully", data: { id: isUser._id, otpExpiry, email: isUser.email } })

  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong." })
  }

})


module.exports = userRouter;
