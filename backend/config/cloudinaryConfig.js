// backend/config/cloudinary.js

const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const dotenv = require("dotenv");

dotenv.config();

// 🔹 Cloudinary configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 🔹 Multer (memory storage for AUDIO)
const storage = multer.memoryStorage();
const multermiddleware = multer({ storage }).single("media");

// 🔹 Upload AUDIO to Cloudinary
const uploadFileToCloudinary = async (file) => {
  if (!file) throw new Error("No file received");

  const base64Audio = `data:${file.mimetype};base64,${file.buffer.toString(
    "base64"
  )}`;

  const result = await cloudinary.uploader.upload(base64Audio, {
    resource_type: "auto", // 🔥 AUDIO FIX
  });

  return result;
};



module.exports = {
  multermiddleware,
  uploadFileToCloudinary,
};
