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

    const isExist = await FriendRequest.findOne({ fromUserId, toUserId });

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

    await User.findOneAndUpdate({ _id: fromUserId }, {
      $push: { sentRequests: toUserId }
    }, { returnDocument: "after" })

    const updatedUser = await User.findById({ _id: fromUserId })
      .select("-password -otp -otpExpiry")
      .populate("recievedRequests", "userName designation email bio profilePic")
      .populate("followers", "userName designation email bio profilePic")
      .populate("following", "userName designation email bio profilePic")
      .populate("sentRequests", "userName designation email bio profilePic")
      .lean()

    return res
      .status(200)
      .json({ success: true, message: "request sent successfully!", data: updatedUser });
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
        await FriendRequest.deleteOne({
          fromUserId: toUserId,
          toUserId: fromUserId,
        });

        const updatedUser = await User.findOne({ _id: fromUserId })
          .select("-password -otp -otpExpiry")
          .populate("recievedRequests", "userName designation email bio profilePic")
          .populate("followers", "userName designation email bio profilePic")
          .populate("following", "userName designation email bio profilePic")
          .populate("sentRequests", "userName designation email bio profilePic")
          .lean()

        return res
          .status(200)
          .json({ success: true, message: "Request rejected.", data: updatedUser });
      }

      await User.findByIdAndUpdate(
        { _id: fromUserId },
        {
          $push: { followers: toUserId },
        },
      );

      await User.findByIdAndUpdate(
        { _id: toUserId },
        {
          $push: { following: fromUserId },
        },
      );

      await User.findOneAndUpdate({ _id: toUserId }, {
        $pull: { sentRequests: fromUserId }
      })

      const updatedUser = await User.findById({ _id: fromUserId })
        .select("-password -otp -otpExpiry")
        .populate("recievedRequests", "userName designation email bio profilePic")
        .populate("followers", "userName designation email bio profilePic")
        .populate("following", "userName designation email bio profilePic")
        .populate("sentRequests", "userName designation email bio profilePic")
        .lean()

      return res
        .status(200)
        .json({ success: true, message: "Request accepted.", data: updatedUser });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
        error: error,
      });
    }
  },
);


requestRouter.post("/request/status/:toUserId", userAuth, async (req, res) => {

  try {

    const { toUserId } = req.params;
    const { status } = req.body;
    const fromUserId = req.user._id.toString();

    const isValidUser = await User.findOne({ _id: toUserId });

    if (!isValidUser) {
      return res.status(401).json({ success: false, message: "User not found." });
    }

    const isFollower = await User.findOne({ _id: fromUserId }).select("followers following");

    if (status === "remove") {

      const id = isFollower?.followers.filter(e => e.toString() === toUserId)

      if (id.length === 0) {
        return res.status(401).json({ success: false, message: "He is not follower." })
      }

      await FriendRequest.findOneAndDelete({ fromUserId: toUserId, toUserId: fromUserId, status: "accepted" })

      await User.findOneAndUpdate({ _id: fromUserId }, {
        $pull: { followers: toUserId }
      })

      await User.findOneAndUpdate({ _id: toUserId }, {
        $pull: { following: fromUserId }
      })

      const updatedUser = await User.findById({ _id: fromUserId })
        .select("-password -otp -otpExpiry")
        .populate("recievedRequests", "userName designation email bio profilePic")
        .populate("followers", "userName designation email bio profilePic")
        .populate("following", "userName designation email bio profilePic")
        .populate("sentRequests", "userName designation email bio profilePic")
        .lean()

      return res.status(200).json({ success: true, message: "Removed from followers successfully.", data: updatedUser })

    }

    if (status === "unfollow") {

      const id = isFollower?.following.filter(e => e.toString() === toUserId)

      if (id.length === 0) {
        return res.status(401).json({ success: false, message: "You are not following this guy." })
      }

      await User.findOneAndUpdate({ _id: fromUserId }, {
        $pull: { following: toUserId }
      })

      await User.findOneAndUpdate({ _id: toUserId }, {
        $pull: { followers: fromUserId }
      })

      const updatedUser = await User.findById({ _id: fromUserId })
        .select("-password -otp -otpExpiry")
        .populate("recievedRequests", "userName designation email bio profilePic")
        .populate("followers", "userName designation email bio profilePic")
        .populate("following", "userName designation email bio profilePic")
        .populate("sentRequests", "userName designation email bio profilePic")
        .lean()

      await FriendRequest.findOneAndDelete({ fromUserId, toUserId, status: "accepted" })

      return res.status(200).json({ success: true, message: "Unfollowed successfully.", data: updatedUser })

    }

  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Something went wrong" + error
    });

  }

})



requestRouter.post("/request/remove/:toUserId", userAuth, async (req, res) => {

  try {

    const { toUserId } = req.params;
    const { status } = req.body;
    const fromUserId = req.user._id.toString();

    if (!toUserId || !status) {
      return res.status(400).json({ success: false, message: "All fieds required." });
    }

    const isValidUser = await User.findOne({ _id: toUserId });

    if (!isValidUser) {
      return res.status(401).json({ success: false, message: "User not found." })
    }

    const isRequestExist = await FriendRequest.findOne({ fromUserId, toUserId, status: "requested" });

    if (!isRequestExist) {
      return res.status(400).json({ success: false, message: "Request not found." })
    }

    if (status === "cancel") {

      await User.findOneAndUpdate({ _id: fromUserId }, { $pull: { sentRequests: toUserId } }, { returnDocument: "after" });

      await FriendRequest.findOneAndDelete({ fromUserId, toUserId, status: "requested" });

      await User.findOneAndUpdate({ _id: toUserId }, { $pull: { recievedRequests: fromUserId } });

      const updatedUser = await User.findById({ _id: fromUserId })
        .select("-password -otp -otpExpiry")
        .populate("recievedRequests", "userName designation email bio profilePic")
        .populate("followers", "userName designation email bio profilePic")
        .populate("following", "userName designation email bio profilePic")
        .populate("sentRequests", "userName designation email bio profilePic")
        .lean()

      return res.status(200).json({ success: true, message: "request cancelled successfully.", data: updatedUser })

    }

  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong." })
  }

})

module.exports = requestRouter;
