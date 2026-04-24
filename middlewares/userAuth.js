const jwt = require("jsonwebtoken");
const User = require("../schemas/userSchema");

const userAuth = async (req, res, next) => {

    try {

        const { userToken } = req.cookies;

        if (!userToken) {
            return res.status(401).json({ success: false, Error: "Token not found." });
        }

        const token = await jwt.verify(userToken, process.env.jwtSecretKey)

        const { role, id } = token;

        if (role !== "user") {
            return res.status(400).json({ success: false, Error: "Role is not matching" });
        }

        const isValidUser = await User.findOne({ _id: id });

        req.user = isValidUser;

        next();

    } catch (error) {
        return res.status(500).json({ 'message': 'Something went wrong.' })
    }

}

module.exports = userAuth;