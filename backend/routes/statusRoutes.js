const express = require("express");
const statusController = require("../controllers/statusController");
const authMiddleware = require("../middleware/authMiddleware");
const { multermiddleware } = require("../config/cloudinaryConfig");

const router = express.Router();

// protected routes
router.post("/", authMiddleware, multermiddleware, statusController.createStatus);
router.get("/", authMiddleware, statusController.getStatuses);
router.put("/:statusId/view", authMiddleware, statusController.viewStatus);
router.delete("/:statusId", authMiddleware, statusController.deleteStatus);
router.put("/:statusId/like", authMiddleware, statusController.toggleLikeStatus); // ❤️
module.exports = router;
