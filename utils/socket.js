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

    });

    socket.on("sendMessages", () => {});

    socket.on("disconnect", () => {});
  });
};

module.exports = initializeSocket;