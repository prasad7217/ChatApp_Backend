const express = require("express");
const userAuth = require("../middlewares/userAuth");
const User = require("../schemas/userSchema");
const FriendRequest = require("../schemas/friendRequestSchema");

const requestRouter = express.Router();

requestRouter.post("/request/sent/:toUserId", userAuth, async (req, res) => {
  try {
    
    const { status } = req.body;
    const { toUserId } = req.params;
    const fromUserId = req.user._id;

    console.log(fromUserId.toString());

    if (!toUserId || !status) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required." });
    }

    const isValidId = await User.findOne({ _id: toUserId });

    if (!isValidId) {
      return res
        .status(401)
        .json({ success: false, message: "Unregistered user." });
    }

    const isExist = await FriendRequest.findOne({
      $or: [
        { fromUserId, toUserId },
        { fromUserId: toUserId, toUserId: fromUserId },
      ],
    });

    if (isExist) {
      return res.status(401).json({
        success: false,
        message: "Request already exist!. do not make another one.",
      });
    }

    const requestData = new FriendRequest({
      fromUserId,
      toUserId,
      status,
    });

    await requestData.save();

    return res
      .status(200)
      .json({ success: true, message: "request sent successfully!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong", error });
  }
});

module.exports = requestRouter;
