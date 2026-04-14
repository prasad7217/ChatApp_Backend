const mongoose = require("mongoose");
const validator = require("validator");

const companySchema = new mongoose.Schema({

    compName: {
        type: String,
        required: true,
        trim: true
    },
    compLogo: {
        type: String,
        required: true,
        trim: true
    },
    compPhone1: {
        type: String,
        required: true,
        trim: true,
        validate: (value) => {
            if (!validator.isMobilePhone(value)) {
                throw new Error("Invalid mobile number.")
            }
        }
    },
    compPhone2: {
        type: String,
        required: true,
        trim: true,
        validate: (value) => {
            if (!validator.isMobilePhone(value)) {
                throw new Error("Invalid mobile number.")
            }
        }
    },
    compEmail1: {
        type: String,
        required: true,
        trim: true,
        validate: (value) => {
            if (!validator.isEmail(value)) {
                throw new Error("Invalid email address.")
            }
        }
    },
    compAddress1: {
        type: String,
        required: true,
        trim: true
    },
    compOffice1Name: {
        type: String,
        required: true,
        trim: true
    },
    compOffice2Name: {
        type: String,
        required: true,
        trim: true
    },
    compAddress2: {
        type: String,
        required: true,
        trim: true
    },
    compTimings: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
})

const Company = mongoose.model("Company", companySchema);

module.exports = Company;