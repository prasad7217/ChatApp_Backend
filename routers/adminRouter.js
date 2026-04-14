const express = require("express");
const Admin = require("../schemas/adminShema");
const { isValidData, generateHash } = require("../utils/helpers");
const validator = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { adminAuth } = require("../middlewares/adminAuth");

const adminRouter = express.Router();

//Admin signup.......................................
adminRouter.post("/api/admin/signup", async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    isValidData(req.body);

    const isPresent = await Admin.findOne({ email });

    if (isPresent) {
      return res
        .status(400)
        .json({ message: "Admin with this email already exist.!" });
    }

    if (role !== "admin") {
      return res.status(400).json({ message: "Role should be as admin.!" });
    }

    const passwordHash = await generateHash(password);

    const admin = new Admin({
      fullName,
      email,
      password: passwordHash,
      role,
    });

    await admin.save();

    return res
      .status(200)
      .json({ status: "success", message: "admin register successful" });
  } catch (error) {
    return res.status(500).json({ message: error });
  }
});

//Admin login........................................................
adminRouter.post("/api/admin/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Invalid email." });
    }

    if (!validator.isStrongPassword(password)) {
      return res.status(400).json({ message: "Invalid password." });
    }

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
      "prasad@123",
      { expiresIn: "1d" },
    );

    if (!adminToken) {
      return res.status(400).json({ message: "Something went wrong." });
    }

    res.cookie("adminToken", adminToken);
    return res
      .status(200)
      .json({ status: "success", message: "Login successfull." });
  } catch (error) {
    res.status(500).json({ message: "something went wrong.!" });
  }
});

//admin profile.........................................
adminRouter.get("/api/admin/profile", adminAuth, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({ message: "admin not found." });
    }

    res.status(200).json(req.admin);
  } catch (error) {
    res.status(401).json({ message: "something went wrong.!" });
  }
});

module.exports = adminRouter;
