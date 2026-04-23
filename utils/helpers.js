const validator = require("validator");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config()

const isValidData = (data) => {

    const { fullName, email, password, role } = data;

    if (!fullName || !email || !password || !role) {
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

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.PASSKEY
    }
})

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
                console.log("Mail sent:", info.envelope);
                console.log("Response:", info.response); // Usually 'Messages queued for delivery'
            }
        })

}

module.exports = {
    isValidData,
    generateHash,
    sendOtp
}