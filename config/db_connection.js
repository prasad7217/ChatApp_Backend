const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const db_conncetion = async () => {
    await mongoose.connect(process.env.mongoDB_Connection_String);
}

module.exports = db_conncetion;