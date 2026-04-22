const express = require('express');
const User = require("../schemas/userSchema");
const { isEmail, isStrongPassword } = require('validator');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');

const userRouter = express.Router();

userRouter.post("/api/signup", async (req, res, next) => {

    try {

        const allowedFields = ['userName', 'email', 'password', 'bio', 'profilePic'];

        const isInvalid = Object.keys(req.body).some(item => !allowedFields.includes(item));

        if (isInvalid) {
            return res.status(401).json({ success: false, Error: "Invalid request body.", message: "Unknown field." })
        }

        const { userName, email, password, bio, profilePic } = req.body;

        if (!userName?.trim() || !email?.trim() || !password?.trim()) {
            return res.status(400).json({
                success: false,
                message: "UserName, Email, and Password are mandatory."
            });
        }

        if (!isStrongPassword(password)) {
            return res.status(400).json({ success: false, Error: "Not a strong password.", message: "Password must be strong." })
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = new User({
            userName,
            email,
            password: passwordHash,
            bio,
            profilePic
        });

        await user.save();
        res.status(200).json({ success: true, message: "Register successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Something went wrong." + error })
    }

})

userRouter.post("/api/login", async (req, res, next) => {

    try {

        const allowedFields = ['email', 'password'];

        const isInvalid = Object.keys(req.body).some(item => !allowedFields.includes(item))

        if (isInvalid) {
            return res.status(401).json({ success: false, Error: "Invalid request body.", message: "Unknown field." })
        }

        const { email, password } = req.body;

        if (!isEmail(email)) {
            return res.status(400).json({ success: false, Error: "Invalid email address.", message: "Please enter a valid email address" })
        }

        const isValidUser = await User.findOne({ email });

        if (!isValidUser) {
            return res.status(400).json({ success: false, Error: "User not found.", message: "Invalid credentials." })
        }

        const isValidPass = await bcrypt.compare(password, isValidUser.password);

        if (!isValidPass) {
            return res.status(400).json({ success: false, Error: "Unmatched password", message: "Invalid credentials." })
        }

        const userToken = await jwt.sign({
            role: isValidUser.role,
            id: isValidUser._id
        },
            process.env.jwtSecretKey,
            { expiresIn: "1d" }
        )

        res.cookie("userToken", userToken)
        res.status(200).json({ success: true, message: "User logged in successfully" })

    } catch (error) {
        res.status(500).json({ success: false, message: "Something went wrong." })
    }
})

userRouter.get("/api/profile", async (req, res, next) => {

    try {

    } catch (error) {

    }

})

module.exports = userRouter;
