const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    orderId: {
      type: String,
      required: true,
    },
    amount: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    paymentId: {
      type: String,
    },
    notes: {
      userName: {
        type: String,
      },
      email: {
        type: String,
      }
    },
    reciept: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Payment = new mongoose.model("payment", paymentSchema);

module.exports = Payment;