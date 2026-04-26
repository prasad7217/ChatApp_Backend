const mongoose = require("mongoose");
const { isStrongPassword } = require("validator");
const { default: isEmail } = require("validator/lib/isEmail");

const userSchema = new mongoose.Schema({

    userName: {
        type: String,
        maxLength: 50,
        minLength: 4,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        validate: (value) => {
            if (!isEmail(value)) {
                throw new Error("Invalid email address.")
            }
        }
    },
    password: {
        type: String,
        required: true,
        trim: true,
        validate: (value) => {
            if (!isStrongPassword(value)) {
                throw new Error("Not a strong password.")
            }
        }
    },
    bio: {
        type: String,
        maxLength: 255,
        trim: true,
        default: " "
    },
    role: {
        type: String,
        default: "user",
        trim: true
    },
    profilePic: {
        type: String,
        trim: true,
        validate: (value) => {

            if (!value || value.length === 0) return true;

            if (!/^(https?:\/\/.*\.(?:png|jpg|jpeg|webp))($|\?|&)/i.test(value)) {
                throw new Error("Invalid photo url.")
            }
        },
        default: "https://static.vecteezy.com/system/resources/previews/024/983/914/non_2x/simple-user-default-icon-free-png.png"
    },
    otp: {
        type: String,
    },
    otpExpiry: {
        type: Date
    }

},
    {
        timestamps: true
    })

const User = mongoose.model("user", userSchema);

module.exports = User;