const mongoose = require("mongoose");
const validator = require("validator");

const adminShema = new mongoose.Schema({

    fullName: {
        type: String,
        trim: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true,
        validate: (value) => {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid Email address.!!")
            }
        }
    },
    password: {
        type: String,
        trim: true,
        required: true,
        validate: (value) => {
            if (!validator.isStrongPassword(value)) {
                throw new Error("Not a strong password.!!")
            }
        }
    },
    role: {
        type: String,
        trim: true,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    loginAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Admin = mongoose.model("admin", adminShema);

module.exports = Admin;