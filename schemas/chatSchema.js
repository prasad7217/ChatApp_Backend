const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({

    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    targetUserId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    text: {
        type: String,
        required: true,
    }

}, { timestamps: true })

const chatSchema = new mongoose.Schema({

    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    }],

    message: [messageSchema]

}, { timestamps: true });

const Chat = new mongoose.model("chat", chatSchema);

module.exports = Chat;