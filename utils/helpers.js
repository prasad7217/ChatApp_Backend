const validator = require("validator");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");
const { default: rateLimit } = require("express-rate-limit");
const FriendRequest = require("../schemas/friendRequestSchema");
const User = require("../schemas/userSchema");

dotenv.config()

const isValidData = (data) => {

    const { fullName, email, password } = data;

    if (!fullName || !email || !password) {
        throw new Error("All fields are required.!");
    }

    if (!validator.isEmail(email)) {
        throw new Error("Invalid Email address.");
    }

    if (!validator.isStrongPassword(password)) {
        throw new Error("Password must be strong.!");
    }
    return true;
}

const generateHash = async (password) => {
    const passwordHash = await bcrypt.hash(password, 10);
    return passwordHash;
}

let transporter;

const initTransporter = async () => {
   console.log("ETHEREAL_USER:", process.env.ETHEREAL_USER);
    console.log("ETHEREAL_PASS:", process.env.ETHEREAL_PASS);
    if (process.env.NODE_ENV === "production") {

        transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.PASSKEY
            }
        });

    } else {
// console.log("ethereal",  process.env.ETHEREAL_USER)
        // const testAccount = nodemailer.createTransport(); // ✅ await added

        transporter = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            auth: {
                user: process.env.ETHEREAL_USER, // ✅ Ethereal credentials
                pass: process.env.ETHEREAL_PASS  // ✅ Ethereal credentials
            }
        });
    }
};

// ✅ Call once when this file is loaded
initTransporter();

const sendOtp = (toEmail, otp) => {

    return transporter.sendMail({
        from: process.env.USER_EMAIL,
        to: toEmail,
        subject: "Your Verification Code",
        text: `Your verification code is ${otp}. It will expire in 5 minutes.`,
        html: `
      <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
        <h2 style="color: #333;">Verification Required</h2>
        <p>Please use the following code to complete your login:</p>
        <h1 style="color: #038018; letter-spacing: 5px;">${otp}</h1>
        <p style="font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
      </div>
    `
    },
        (err, info) => {
            if (err) {
                console.error("Error sending mail:", err);
            } else {
                // console.log("Mail sent:", info.envelope);
                // console.log("Response:", info.response); // Usually 'Messages queued for delivery'
            }
        })

}

const resetPasswordLimits = rateLimit({
    windowMs: 60 * 1000,
    limit: 4,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
    // console.log("Rate limit hit for:", req.ip);
    res.status(429).json({
      success: false,
      message: `Too many requests, try again after.`,
    });
  },
})

const getMutualFrnds = async (fromUserId) => {

    const Irequested = await FriendRequest.find({ fromUserId, status: "accepted" }).select("toUserId");

    const theyRequested = await FriendRequest.find({ toUserId: fromUserId, status: "accepted" }).select("fromUserId");

    const IrequestedIds = Irequested.map(id => id.toUserId.toString())

    const theyRequestedIds = theyRequested.map(id => id.fromUserId.toString())

    const mutualfrds = IrequestedIds.filter(id => theyRequestedIds.includes(id));

    const mutualfrdsProfiles = await Promise.all(mutualfrds.map(id => User.find({ _id: id })))

    return mutualfrdsProfiles.flat();

}

module.exports = {
    isValidData,
    generateHash,
    sendOtp,
    getMutualFrnds,
    resetPasswordLimits
}