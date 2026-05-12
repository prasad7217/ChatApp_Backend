const { cloudinary } = require("cloudinary").v2;
const dotenv = require("dotenv");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secrete: process.env.CLOUDINARY_API_SECRETE
})


const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "uploads",
        allowed_formates: ["jpg", "jpeg", "png"]
    }
})

const upload = multer({ storage });

module.exports = upload;