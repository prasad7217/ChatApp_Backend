const mongoose = require("mongoose");
const requestRouter = require("../routers/requestRouter");
const userAuth = require("../middlewares/userAuth");

const friendRequestSchema = new mongoose.Schema({
  fromUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  toUserId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },

  status: {
    type: String,
    enum: {
      values: ["requested", "accepted", "rejected"],
      message: `{Value} incorrect status type`,
    },
  },
});

const FriendRequest = new mongoose.model("Request", friendRequestSchema);

module.exports = FriendRequest;
