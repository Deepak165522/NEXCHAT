const express = require('express');
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');
const { multermiddleware } = require('../config/cloudinaryConfig');




const router = express.Router();

// SEND MESSAGE
router.post('/send-message', authMiddleware, multermiddleware, chatController.sendMessage);

// GET ALL CONVERSATIONS
router.get('/conversations', authMiddleware, chatController.getConversation);

// GET MESSAGES FOR ONE CONVERSATION
router.get('/conversations/:conversationId/messages', authMiddleware, chatController.getMessages);

// MARK AS READ
router.put('/messages/read', authMiddleware, chatController.markAsRead);

// DELETE FOR ME
router.delete(
  "/messages/:messageId",
  authMiddleware,
  chatController.deleteMessage
);


// PIN MESSAGE
router.post(
  "/messages/:messageId/pin",
  authMiddleware,
  chatController.pinMessage
);

// UNPIN MESSAGE
router.post(
  "/messages/:messageId/unpin",
  authMiddleware,
  chatController.unpinMessage
);


router.put(
  "/conversations/:conversationId/clear",
  authMiddleware,
  chatController.clearChatForMe
);



router.post(
  "/messages/:id/star",
  authMiddleware,
  chatController.toggleStarMessage
);

router.delete(
  "/conversations/:conversationId/delete",
  authMiddleware,
  chatController.deleteChatForMe
);


// DELETE FOR EVERYONE
router.delete(
  "/messages/:messageId/delete-everyone",
  authMiddleware,
  chatController.deleteMessageForEveryone
);

router.post("/poll/vote", authMiddleware, chatController.votePoll);




module.exports = router;
