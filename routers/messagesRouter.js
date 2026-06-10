const express = require("express");
const userAuth = require("../middlewares/userAuth");
const User = require("../schemas/userSchema");
const Chat = require("../schemas/chatSchema");

const messagesRouter = express.Router();

messagesRouter.post("/chat/:targetUserId", userAuth, async(req, res) =>{

     try {
        
        const {targetUserId} = req.params;

        if(!targetUserId){
            return res.status(400).json({success: false, message: "Data not found.!"});
        }

        const isValidUser = await User.findOne({_id: targetUserId});

        if(!isValidUser){
            return res.status(401).json({success: false, message: "User not found."})
        }

        const {_id} = req.user;

        const isChatExist = await Chat.findOne({participants:{$all:[_id, targetUserId]}});

        if(!isChatExist){
            return res.status(401).json({success: false, message: "Chat not found.!"})
        }

        return res.status(200).json({success: true, message:"Chat fetched.", data: isChatExist})

     } catch (error) {
        return res.status(500).json({success: false, message: "Something went wrong."})
     }

})

module.exports = messagesRouter;