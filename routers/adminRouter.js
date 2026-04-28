const express = require("express");
const Admin = require("../schemas/adminShema");
const { isValidData, generateHash } = require("../utils/helpers");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { adminAuth } = require("../middlewares/adminAuth");
const dotenv = require("dotenv");

const adminRouter = express.Router();
dotenv.config();
//Admin signup.......................................
adminRouter.post("/api/admin/signup", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    isValidData(req.body);

    const isPresent = await Admin.findOne({ email });

    if (isPresent) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exist.!" });
    }

    const passwordHash = await generateHash(password);

    const admin = new Admin({
      fullName,
      email,
      password: passwordHash
    });

    await admin.save();

    return res
      .status(200)
      .json({ status: "success", message: "admin register successful" });
  } catch (error) {
    return res.status(400).json({ message: "Something went wrong" });
  }
});

//Admin login........................................................
adminRouter.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (req.cookies && req.cookies.adminToken) {
      return res.status(401).json({ message: "User is already authenticated." });
    }

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email." });
    }

    // if (!validator.isStrongPassword(password)) {
    //   return res.status(400).json({ message: "Invalid password." });
    // }

    const isAdminPresent = await Admin.findOne({ email });

    if (!isAdminPresent) {
      return res.status(400).json({ message: "Wrong credentials." });
    }

    if (isAdminPresent?.role !== "admin") {
      return res.status(401).json({ message: "unauthorised access." });
    }

    const isValidPass = await bcrypt.compare(password, isAdminPresent.password);

    if (!isValidPass) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    const adminToken = await jwt.sign(
      {
        id: isAdminPresent._id,
        role: isAdminPresent.role,
      },
      process.env.jwtSecretKey,
      { expiresIn: "1d" },
    );

    if (!adminToken) {
      return res.status(400).json({ message: "Something went wrong." });
    }

    res.cookie("adminToken", adminToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000
    });
    return res
      .status(200)
      .json({ status: "success", message: "Login successfull." });
  } catch (error) {
    res.status(500).json({ message: "something went wrong.!" });
  }
});


adminRouter.post("/api/adminrole", async (req, res) => {

  try {
    const { id, role } = req.body;

    if (!id || !role) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    const isValid = await Admin.findOne({ _id: id });

    if (!isValid) {
      return res.status(401).json({ success: false, message: "Unautherized user." });
    }

    const actualRole = isValid?.role;

    if (role !== actualRole) {
      return res.status(401).json({ success: false, message: "Unauthorized access." });
    }

    res.status(200).json({ success: true, message: "Access granted." })

  } catch (error) {
    return res.status(401).json({ success: false, message: "Something went wrong." });
  }

})


//admin profile.........................................
adminRouter.get("/api/admin/profile", adminAuth, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "admin not found." });
    }

    res.status(200).json({ success: true, data: req.admin });
  } catch (error) {
    res.status(401).json({ message: "something went wrong.!" });
  }
});

module.exports = adminRouter;
