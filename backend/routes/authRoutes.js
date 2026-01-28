const express = require("express");
const router = express.Router();


const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware"); 
const { multermiddleware } = require("../config/cloudinaryConfig");

router.post("/send-otp", authController.sendOtp);
router.post("/verify-otp", authController.verifyOtp);

router.get("/logout", authController.logout);
router.post("/send-message", authMiddleware, authController.sendMessage);














router.put(
  "/update-profile",
  authMiddleware,
  multermiddleware,
  authController.updateProfile
);

router.get('/check-auth', authMiddleware, authController.checkAuthenticated);

router.get('/users', authMiddleware, authController.getAllUsers);

module.exports = router;
