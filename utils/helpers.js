const validator = require("validator");
const bcrypt = require("bcrypt");

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


module.exports = {
    isValidData,
    generateHash
}