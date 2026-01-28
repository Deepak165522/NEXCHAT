const { Server } = require("socket.io");
const User = require("../models/User");
const Message = require("../models/Message");
const handleVideoCallEvent = require("./video-call-events");

const handleAudioCallEvent = require("./audio-call-events");
const socketMiddleware = require("../middleware/socketMiddleware");





// Map to store online users → userId : socketId
const onlineUsers = new Map(); // userId -> socketId

// Map to track typing status → userId : boolean
const typingUsers = new Map();




const initializeSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    },
    pingTimeout: 60000,
  });

  io.use(socketMiddleware);

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    let userId = null;



    
      
     socket.on("join_conversation", (conversationId) => {
  socket.join(conversationId);
});


    // ------------------------
    // 1️⃣ USER ONLINE
    // ------------------------
    socket.on("user-connected", async (connectingUserId) => {
      try {
        userId = connectingUserId;
        socket.userId=userId;
        onlineUsers.set(userId, socket.id);
        socket.join(userId);

        await User.findByIdAndUpdate(userId, {
          isOnline: true,
          lastSeen: new Date(),
        });

        io.emit("user_status", { userId, isOnline: true });
      } catch (error) {
        console.error("Error handling user connection", error);
      }
    });

    socket.on("check_user_status", (requestedUserId, callback) => {
      const isOnline = onlineUsers.has(requestedUserId);

      callback({
        userId: requestedUserId,
        isOnline,
        lastSeen: isOnline ? new Date() : null,
      });
    });

    // Forward message
    socket.on("send_message", async (message) => {
  try {
    const senderId = socket.userId;
    const receiverId = message?.receiver?._id;

    if (!senderId || !receiverId) return;

    const receiver = await User.findById(receiverId).select("blockedUsers");
    const sender = await User.findById(senderId).select("blockedUsers");

    // ❌ receiver blocked sender
    if (
      receiver?.blockedUsers?.some(
        (id) => id.toString() === senderId.toString()
      )
    ) {
      return; // 🔥 SILENT DROP (WhatsApp behaviour)
    }

    // ❌ sender blocked receiver
    if (
      sender?.blockedUsers?.some(
        (id) => id.toString() === receiverId.toString()
      )
    ) {
      return;
    }

    const receiverSocketId = onlineUsers.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("receive_message", message);
    }
  } catch (err) {
    console.error("socket send_message error", err);
  }
});


    // Update messages as read
    socket.on("messages_read", async ({ messageIds, senderId }) => {
      try {
        await Message.updateMany(
          { _id: { $in: messageIds } },
          { $set: { messageStatus: "read" } }
        );

        const senderSocketId = onlineUsers.get(senderId);

        if (senderSocketId) {
          messageIds.forEach((messageId) => {
            io.to(senderSocketId).emit(
              "message_status_update",
              {
                messageId,
                messageStatus: "read",
              }
            );
          });
        }
      } catch (error) {
        console.error(
          "Error updating message read status",
          error
        );
      }
    });

    // Typing start
    socket.on("typing_start", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (!typingUsers.has(userId)) typingUsers.set(userId, {});
      const userTyping = typingUsers.get(userId);

      userTyping[conversationId] = true;

      if (userTyping[`${conversationId}_timeout`]) {
        clearTimeout(
          userTyping[`${conversationId}_timeout`]
        );
      }

      userTyping[`${conversationId}_timeout`] = setTimeout(
        () => {
          userTyping[conversationId] = false;

          socket.to(receiverId).emit("user_typing", {
            userId,
            conversationId,
            isTyping: false,
          });
        },
        3000
      );

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: true,
      });
    });

    // Typing stop
    socket.on("typing_stop", ({ conversationId, receiverId }) => {
      if (!userId || !conversationId || !receiverId) return;

      if (typingUsers.has(userId)) {
        const userTyping = typingUsers.get(userId);

        userTyping[conversationId] = false;

        if (userTyping[`${conversationId}_timeout`]) {
          clearTimeout(
            userTyping[`${conversationId}_timeout`]
          );
          delete userTyping[`${conversationId}_timeout`];
        }
      }

      socket.to(receiverId).emit("user_typing", {
        userId,
        conversationId,
        isTyping: false,
      });
    });

    // Reactions
   socket.on(
  "add_reaction",
  async ({ messageId, emoji, userId: reactionUserId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      // 🔍 user ka reaction find karo (SAFE)
      const existingIndex = message.reactions.findIndex(
        (r) => String(r.user) === String(reactionUserId)
      );

      if (existingIndex > -1) {
        const existing = message.reactions[existingIndex];

        // ❌ SAME EMOJI → IGNORE (REMOVE NAHI)
        if (existing.emojis.includes(emoji)) {
          // kuch bhi mat karo
          return;
        }

        // 🔥 MAX 2 EMOJIS RULE
        if (existing.emojis.length >= 2) {
          existing.emojis.shift(); // oldest remove
        }

        existing.emojis.push(emoji);
      } else {
        // 🆕 FIRST REACTION BY USER
        message.reactions.push({
          user: reactionUserId,
          emojis: [emoji],
        });
      }

      await message.save();

      const populatedMessage = await Message.findById(message._id)
        .populate("sender", "username profilePicture")
        .populate("receiver", "username profilePicture")
        .populate("reactions.user", "username profilePicture");

      const reactionUpdated = {
        messageId,
        reactions: populatedMessage.reactions,
      };

      const senderSocket = onlineUsers.get(
        populatedMessage.sender._id.toString()
      );
      const receiverSocket = onlineUsers.get(
        populatedMessage.receiver?._id.toString()
      );

      if (senderSocket) {
        io.to(senderSocket).emit("reaction_update", reactionUpdated);
      }
      if (receiverSocket) {
        io.to(receiverSocket).emit("reaction_update", reactionUpdated);
      }
    } catch (error) {
      console.error("Error adding reaction", error);
    }
  }
);


socket.on(
  "remove_reaction",
  async ({ messageId, emoji, userId }) => {
    try {
      const message = await Message.findById(messageId);
      if (!message) return;

      const idx = message.reactions.findIndex(
        (r) => String(r.user) === String(userId)
      );
      if (idx === -1) return;

      message.reactions[idx].emojis =
        message.reactions[idx].emojis.filter(
          (e) => e !== emoji
        );

      // agar user ke emojis empty ho gaye
      if (message.reactions[idx].emojis.length === 0) {
        message.reactions.splice(idx, 1);
      }

      await message.save();

      const populated = await Message.findById(messageId)
        .populate("reactions.user", "username profilePicture");

      io.to(message.conversation.toString()).emit(
        "reaction_update",
        {
          messageId,
          reactions: populated.reactions,
        }
      );
    } catch (err) {
      console.error("remove reaction error", err);
    }
  }
);




     
    // handle video call events
    handleVideoCallEvent(socket, io, onlineUsers);

    // handle audio call events

handleAudioCallEvent(socket, io, onlineUsers);

    const handleDisconnected = async () => {
      if (!userId) return;

      try {
        onlineUsers.delete(userId);

        if (typingUsers.has(userId)) {
          const userTyping = typingUsers.get(userId);
          Object.keys(userTyping).forEach((key) => {
            if (key.endsWith("_timeout"))
              clearTimeout(userTyping[key]);
          });

          typingUsers.delete(userId);
        }

        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        io.emit("user_status", {
          userId,
          isOnline: false,
          lastSeen: new Date(),
        });

        socket.leave(userId);
        console.log(`user ${userId} disconnected`);
      } catch (error) {
        console.error(
          "Error in disconnect handler",
          error
        );
      }
    };

    socket.on("disconnect", handleDisconnected);
  });

  io.socketUserMap = onlineUsers;
  return io;
};

module.exports = initializeSocket;
