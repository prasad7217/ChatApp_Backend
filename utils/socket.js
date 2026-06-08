const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const getRoomId = require("./getRoomId");
const User = require("../schemas/userSchema");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {

    socket.on("joinChat", async (data) => {

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
        socket.emit("error", { success: false, message: "Invalid user to chat."})
      }

      const roomId = getRoomId(data);

      console.log(data?.userName + "Joined in :" + roomId);
      socket.join(roomId)
    });

    socket.on("sendMessages", (data) => {

      const { message, userName, userId, targetUserId } = data;

      const roomId = getRoomId(data);

      io.to(roomId).emit("recieveMessage", { message, userName, userId, targetUserId });

    });

    socket.on("disconnect", (reason) => {
      // console.log("disconnect", reason)
    });
  });
};

module.exports = initializeSocket;