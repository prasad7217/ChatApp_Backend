const userAuth = async (req, res, next) => {

    try {

        const { userToken } = req.cookies;

        if (!userToken) {
            return res.status(401).json({ success: false, Error: "Token not found." });
        }

        const token = await jwt.verify(userToken, process.env.jwtSecretKey)

    } catch (error) {

    }

}

module.exports = userAuth;