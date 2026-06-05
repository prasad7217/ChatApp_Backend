const express = require("express");
const userAuth = require("../middlewares/userAuth");
const instance = require("../utils/rezerpay_config");
const Payment = require("../schemas/paymentSchema");
const dotenv = require("dotenv");
const crypto = require("crypto");
const User = require("../schemas/userSchema");

dotenv.config();
const paymentRouter = express.Router();

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { _id, userName, email } = req.user;
    // const {} = req.body;

    const isPaid = await Payment.findOne({ userId: _id });

    if (isPaid) {
      return res.status(201).json({ success: true, message: "User subscribed already." });
    }

    const order = await instance.orders.create({
      amount: 39900,
      currency: "INR",
      receipt: "receipt#1",
      notes: {
        key1: userName,
        key2: email,
      },
    });

    const payment = new Payment({
      amount: order?.amount,
      currency: order?.currency,
      reciept: order?.receipt,
      userId: _id,
      status: order.status,
      orderId: order.id,
      notes: {
        userName: order.notes.key1,
        email: order.notes.key2,
      },
    });

    const savedPayment = await payment.save();

    res
      .status(200)
      .json({
        success: true,
        message: "Payment success.",
        paymentData: savedPayment,
        key: process.env.RZP_KEY_ID
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong." });
  }
});



//Verify Payment
paymentRouter.post("/payment/verify", userAuth, async (req, res) => {

  try {

    const { rzp_order_id, rzp_payment_id, rzp_signature } = req.body;

    const body = rzp_order_id + "|" + rzp_payment_id;

    const expectedRzpSignature = crypto.createHmac("sha256", process.env.RZP_KEY_SECRET).update(body).digest("hex");

    if (expectedRzpSignature === rzp_signature) {

      const {_id} = req.user;

      await User.findOneAndUpdate({_id}, {isSubscribed: true});

      await Payment.findOneAndUpdate({userId:_id}, {status: "Completed"});

      const updatedUserProfile = await User.findOne({ _id }).select("-password -otp -otpExpiry")
      .populate("recievedRequests", "userName designation email bio profilePic")
      .populate("followers", "userName designation email bio profilePic")
      .populate("following", "userName designation email bio profilePic")
      .populate("sentRequests", "userName designation email bio profilePic")
      .lean()

      return res.status(201).json({ success: true, message: "Payment verification successfull.", data: updatedUserProfile })
    }

  } catch (error) {
    return res.status(500).json({ success: true, message: "Something went wrong." + error })
  }

})

module.exports = paymentRouter;
