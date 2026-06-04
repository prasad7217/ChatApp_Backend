const express = require("express");
const userAuth = require("../middlewares/userAuth");
const instance = require("../utils/rezerpay_config");
const Payment = require("../schemas/paymentSchema");
const dotenv = require("dotenv");

dotenv.config();
const paymentRouter = express.Router();

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
  try {
    const { _id, userName, email } = req.user;
    // const {} = req.body;

    const isPaid = await Payment.findOne({userId: _id});

    if(isPaid){
        return res.status(201).json({success: true, message: "User subscribed already."});
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
        key:process.env.RZP_KEY_ID
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong." });
  }
});

module.exports = paymentRouter;
