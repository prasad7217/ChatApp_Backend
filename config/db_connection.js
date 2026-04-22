const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
console.log("mongo check ", process.env.mongoDB_Connection_String)
const db_conncetion = async () => {
    await mongoose.connect(process.env.mongoDB_Connection_String);
}

module.exports = db_conncetion;