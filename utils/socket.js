const express = require("express");
const socket = require("socket.io");
const cors = require("cors");
const getRoomId = require("./getRoomId");

const initializeSocket = (server) => {
  const io = socket(server, {
    cors: {
      origin: "http://localhost:5173",
    },
  });

  io.on("connection", (socket) => {

    socket.on("joinChat", (data) => {

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