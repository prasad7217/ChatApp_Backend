const crypto = require("crypto");

const getRoomId = (data) => {

    const roomId = crypto.createHmac("sha256", "prasad@123").update([data.userId, data.targetUserId].sort().join("_")).digest("hex");

    return roomId;

}

module.exports = getRoomId;