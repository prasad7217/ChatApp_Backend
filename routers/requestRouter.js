const express = require("express");
const userAuth = require("../middlewares/userAuth");
const User = require("../schemas/userSchema");
const FriendRequest = require("../schemas/friendRequestSchema");

const requestRouter = express.Router();

requestRouter.post("/request/sent/:toUserId", userAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const { toUserId } = req.params;
    const fromUserId = req.user._id.toString();

    if (fromUserId === toUserId) {
      return res.status(201).json({
        success: false,
        message: "You can't able to make a request your self.",
      });
    }

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

    await User.findOneAndUpdate(
      { _id: toUserId },
      { $push: { recievedRequests: fromUserId } },
    );

    return res
      .status(200)
      .json({ success: true, message: "request sent successfully!" });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong", error });
  }
});

requestRouter.post(
  "/request/response/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const { toUserId } = req.params;
      const { status } = req.body;
      const fromUserId = req.user._id.toString();

      const allowedFields = ["accepted", "rejected"];

      if (!allowedFields.includes(status)) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid status." });
      }

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

      const isResponseExist = await FriendRequest.findOne({
        fromUserId: toUserId,
        toUserId: fromUserId,
      });

      if (!isResponseExist) {
        return res.status(404).json({
          success: false,
          message: "No pending request found from this user.",
        });
      }

      if (isResponseExist.status === "accepted") {
        return res.status(401).json({
          success: false,
          message: "Request already accepted!. do not make another one.",
        });
      }

      if (isResponseExist.status === "rejected") {
        return res.status(401).json({
          success: false,
          message: "Request already rejected!. do not make another one.",
        });
      }

      isResponseExist.status = status;

      const updatedRequest = await isResponseExist.save();

      await User.findByIdAndUpdate(
          { _id: fromUserId },
          {
            $pull: { recievedRequests: toUserId },
          },
        );

      if (updatedRequest.status === "rejected") {

        await FriendRequest.deleteOne({fromUserId: toUserId, toUserId: fromUserId});

        return res
          .status(200)
          .json({ success: true, message: "Request rejected." });
      }

      await User.findByIdAndUpdate(
        { _id: fromUserId },
        {
          $push: { followers: toUserId },
        },
      );

      return res
        .status(200)
        .json({ success: true, message: "Request accepted." });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error,
      });
    }
  },
);

module.exports = requestRouter;
