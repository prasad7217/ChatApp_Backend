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
    let roomId;
    socket.on("joinChat", (data) => {
        
        roomId = getRoomId(data);

    });

    socket.on("sendMessages", (data) => {

      const {message, userName, userId, targetUserId} = data;

      io.to(roomId).emit("recieveMessage", {message, userName, userId, targetUserId});

    });

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;