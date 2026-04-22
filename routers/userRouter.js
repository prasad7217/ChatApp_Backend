const express = require('express');
const User = require("../schemas/userSchema")

const userRouter = express.Router();

userRouter.post("/api/signup", async (req, res, next) => {

    try {

        const allowedFields = ['userName', 'email', 'password', 'bio', 'profilePic'];

        const isInvalid = Object.keys(req.body).some(item => !allowedFields.includes(item));

        if (isInvalid) {
            return res.status(401).json({ sucess: false, Error: "Invalid request body.", message: "Unknown field." })
        }

        const { userName, email, password, bio, profilePic } = req.body;

        if (userName === "" || email === "" || password === "") {
            return res.status(400).json({
                sucess: false,
                Error: "Missing required field.",
                message: "User name, email, and password are required to create an account."
            })
        }

        if (bio) {

            const user = User({
                userName,
                email,
                password,
                bio
            })

            await user.save();

            return res.status(200).json({ status: true, message: "Register successfully." });
        }

        if (profilePic) {
            const user = User({
                userName,
                email,
                password,
                profilePic
            })

            await user.save()

            return res.status(200).json({ status: true, message: "Register successfully." });
        }

        const user = User({
            userName,
            email,
            password
        })

        await user.save();
        res.status(200).json({ status: true, message: "Register successfully." });
    } catch (error) {
        res.status(500).json({ status: false, message: "Something went wrong." + error })
    }

})

module.exports = userRouter;
