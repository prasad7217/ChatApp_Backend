const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
const db_conncetion = async () => {
    await mongoose.connect(process.env.MONGODB_CONNECT_STRING);
}

module.exports = db_conncetion;