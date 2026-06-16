const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const getRoomId = require("./getRoomId");
const User = require("../schemas/userSchema");
const Chat = require("../schemas/chatSchema");
const { getMutualFrnds } = require("./helpers");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://192.168.6.3:5173",
        "http://13.49.64.158",
      ],
    },
  });

  //******************* Connection ********************/

  io.on("connection", async (socket) => {

    try {
      console.log("connection estabhlised to " + socket?.handshake?.query?.userId)
      const userId = socket?.handshake?.query?.userId;

      if (!userId || userId === "undefined") {
        console.log("No valid userId, skipping online status update");
        return;
      }

      const isValidUserId = await User.findOne({ _id: userId });

      if (!isValidUserId) {
        socket.emit("error", { success: false, message: "User not found." });
        return;
      }

      await User.findOneAndUpdate(
        { _id: userId },
        {
          isOnline: true,
          lastseen: null,
        },
      );

      const updatedUser = await User.findOne({ _id: userId })
        .select("-password -otp -otpExpiry")
        .populate(
          "recievedRequests",
          "userName designation email bio profilePic isSubscribed",
        )
        .populate(
          "followers",
          "userName designation email bio profilePic isSubscribed",
        )
        .populate(
          "following",
          "userName designation email bio profilePic isSubscribed",
        )
        .populate(
          "sentRequests",
          "userName designation email bio profilePic isSubscribed",
        )
        .lean();

      const fromUserId = updatedUser._id.toString();

      const mutualfrds = await getMutualFrnds(fromUserId);
      updatedUser.mutualfrds = mutualfrds;

      io.emit("success", updatedUser);
      
    } catch (error) {
      socket.emit("error :", {
        success: false,
        message: "Something went wrong.",
      });
    }

    //*************************** Joining chat  ****************/
    socket.on("joinChat", async (data) => {
      try {
        const { userId, targetUserId } = data;

        const isValidTargetUserId = await User.findOne({ _id: targetUserId });

        if (!isValidTargetUserId) {
          socket.emit("error", { success: false, message: "User not found." });
          return;
        }

        if (!isValidTargetUserId?.isSubscribed) {
          socket.emit("error", {
            success: false,
            message: "User not subscribed.",
          });
          return;
        }

        const user = await User.findOne({ _id: userId });

        const arr = user?.followers;

        const newArr = [...arr, ...user?.following];

        const isMutualFrnd = newArr.some(
          (each) => each.toString() === isValidTargetUserId?._id.toString(),
        );

        if (!isMutualFrnd) {
          socket.emit("error", {
            success: false,
            message: "Invalid user to chat.",
          });

          return;
        }

        const roomId = getRoomId(data);

        socket.join(roomId);
        console.log("joined in chat");
      } catch (error) {
        socket.emit("error :", {
          success: false,
          message: "Something went wrong.",
        });
      }
    });

    //********************* Send messages ***********************/
    socket.on("sendMessages", async (data) => {
      console.log("username :", data)
      try {

        const { message, userName, userId, targetUserId } = data;
        const roomId = getRoomId(data);

        const isChatExist = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!isChatExist) {
          const chat = await Chat({
            participants: [userId, targetUserId],
            message: [
              {
                senderId: userId,
                targetUserId,
                text: message,
              },
            ],
          });

          await chat.save();

          const messageDoc = await Chat.findOne({
            participants: { $all: [userId, targetUserId] },
          })
            .populate("message.senderId", "userName profilePic")
            .populate("message.targetUserId", "userName profilePic");

          io.to(roomId).emit("recieveMessage", messageDoc);
          return;
        }

        const updated = await Chat.findOneAndUpdate(
          { participants: { $all: [userId, targetUserId] } },
          {
            $push: {
              message: {
                senderId: userId,
                targetUserId,
                text: message,
              },
            },
          },
        );

        const messageDoc = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        })
          .populate("message.senderId", "userName profilePic")
          .populate("message.targetUserId", "userName profilePic");

        io.to(roomId).emit("recieveMessage", messageDoc);
        return;
      } catch (error) {
        socket.emit("error :", {
          success: false,
          message: "Something went wrong.",
        });
      }
    });

    //**************** Disconnect  *****************/
    socket.on("disconnect", async (reason) => {

      try {
        
        const userId = socket?.handshake?.query?.userId;

        if (!userId) {
          socket.emit("error", {
            success: false,
            message: "User id not found",
          });
          return;
        }

        await User.findOneAndUpdate(
          { _id: userId },
          {
            isOnline: false,
            lastseen: new Date(),
          },
        );

        const updated = await User.findOne({ _id: userId });

        io.emit("lastSeenStatus", updated)
        console.log("disconnnected")
      } catch (error) {
        console.log("Error :", error)
       }
    });
  });
};

module.exports = initializeSocket;
