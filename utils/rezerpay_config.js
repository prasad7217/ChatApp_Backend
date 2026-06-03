const Razorpay = require("razorpay");
const dotenv = require("dotenv");

var instance = new Razorpay({
  key_id: process.env.RZP_KEY_ID,
  key_secret: process.env.RZP_KEY_SECRET,
});

module.exports = instance;