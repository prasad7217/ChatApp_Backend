const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();
<<<<<<< HEAD

=======
>>>>>>> dad99379e8b10191491f734a6ec052ba6af13f2d
const db_conncetion = async () => {
    await mongoose.connect(process.env.mongoDB_Connection_String);
}

module.exports = db_conncetion;