const mongoose = require("mongoose");

const db_conncetion = async () => {
    await mongoose.connect("mongodb+srv://prasadkasa2_db_user:isp%40123@cluster0.4ntxwht.mongodb.net/isp_database");
}

module.exports = db_conncetion;