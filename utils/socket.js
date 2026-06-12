const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const getRoomId = require("./getRoomId");
const User = require("../schemas/userSchema");
const Chat = require("../schemas/chatSchema");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: ["http://localhost:5173", "http://192.168.6.3:5173", "http://13.49.64.158"],
    },
  });

  //******************* Connection ********************/

  io.on("connection", (socket) => {

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
          socket.emit("error", { success: false, message: "User not subscribed." });
          return;
        }

        const user = await User.findOne({ _id: userId });

        const arr = user?.followers

        const newArr = [...arr, ...user?.following]

        const isMutualFrnd = newArr.some(each => each.toString() === isValidTargetUserId?._id.toString())

        if (!isMutualFrnd) {

          socket.emit("error", { success: false, message: "Invalid user to chat." });

          return;
        }

        const roomId = getRoomId(data);

        socket.join(roomId)
      } catch (error) {
        socket.emit("error :", { success: false, message: "Something went wrong." })
      }

    });


    //********************* Send messages ***********************/
    socket.on("sendMessages", async (data) => {

      const { message, userName, userId, targetUserId } = data;
      const roomId = getRoomId(data);

      const isChatExist = await Chat.findOne({ participants: { $all: [userId, targetUserId] } });

      if (!isChatExist) {
        const chat = await Chat({
          participants: [userId, targetUserId],
          message: [
            {
              senderId: userId,
              targetUserId,
              text: message
            }
          ]
        })

        await chat.save();

        const messageDoc = await Chat.findOne({ participants: { $all: [userId, targetUserId] } }).populate("message.senderId", "userName profilePic").populate("message.targetUserId", "userName profilePic");

        io.to(roomId).emit("recieveMessage", messageDoc);
        return;
      }

      const updated = await Chat.findOneAndUpdate({ participants: { $all: [userId, targetUserId] } }, {
        $push: {
          message: {
            senderId: userId,
            targetUserId,
            text: message
          }
        }
      });

      const messageDoc = await Chat.findOne({ participants: { $all: [userId, targetUserId] } }).populate("message.senderId", "userName profilePic").populate("message.targetUserId", "userName profilePic");

      io.to(roomId).emit("recieveMessage", messageDoc);
      return;
    });

    //****************** Disconnect  *****************/
    socket.on("disconnect", (reason) => {
      // console.log("disconnect", reason)
    });
  })
};

module.exports = initializeSocket;