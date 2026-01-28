const { uploadFileToCloudinary } = require('../config/cloudinaryConfig');
const Conversation = require('../models/Conversation');
const response = require('../utils/responseHandler');
const Message = require('../models/Message');
const mongoose = require("mongoose");

// ========================== SEND MESSAGE ==============================
exports.sendMessage = async (req, res) => {
  try {

    console.log("🔥 SEND MESSAGE API HIT");
    console.log("BODY:", req.body);
    console.log("FILE:", req.file);
    // const senderId = req.user.userId;
    const { senderId, receiverId, content, messageStatus, contentType: bodyContentType, location:locationString } = req.body;
    // const file = req.files?.[0] || null;
    const file= req.file;


  let replyToStatus = null;

if (
  req.body.replyToStatus &&
  req.body.replyToStatus !== "undefined" &&
  req.body.replyToStatus !== ""
) {
  try {
    const parsed = JSON.parse(req.body.replyToStatus);

    replyToStatus = {
      id: parsed.id,
      media: parsed.media,
      contentType: parsed.contentType,

      // 🔥 FIXED HERE
      timestamp: new Date(parsed.timestamp).getTime(),

      owner: {
        _id: new mongoose.Types.ObjectId(parsed.owner._id),
        username: parsed.owner.username,
        profilePicture: parsed.owner.profilePicture,
      },
    };
  } catch (err) {
    console.error("❌ replyToStatus parse error:", err);
    replyToStatus = null;
  }
}




    


   let conversation;

if (senderId === receiverId) {
  // 🔥 SELF CHAT (Saved Messages)
  conversation = await Conversation.findOne({
    participants: [senderId],
    isSelf: true,
  });

  if (!conversation) {
    conversation = new Conversation({
      participants: [senderId],
      isSelf: true,
    });
    await conversation.save();
  }
} else {
  // 🔥 NORMAL CHAT (tera existing logic)
  const participants = [senderId, receiverId].sort();

  conversation = await Conversation.findOne({ participants });

  if (!conversation) {
    conversation = new Conversation({ participants });
    await conversation.save();
  }
}

    
let contentType = bodyContentType || "text";
let location = null;
let imageOrVideoUrl = null;
let poll=null;


// ✅ POLL FIRST
if (contentType === "poll" && req.body.poll) {
  poll = JSON.parse(req.body.poll);
}

if (contentType === "poll" && poll && !content) {
  content = poll.question;
}


if (contentType === "location") {
  if (!locationString) {
    return response(res, 400, "Location data missing");
  }

  location = JSON.parse(locationString);
}

else if (file) {
  const uploadFile = await uploadFileToCloudinary(file);
  if (!uploadFile?.secure_url) {
    return response(res, 400, "Failed to upload media");
  }

  imageOrVideoUrl = uploadFile.secure_url;

  if (file.mimetype.startsWith("image")) contentType = "image";
  else if (file.mimetype.startsWith("video")) contentType = "video";
  else if (file.mimetype.startsWith("audio")) contentType = "audio";
}

else if (content?.trim() && contentType !== "poll") {
  contentType = "text";
}

else if (contentType !== "poll") {
  return response(res, 400, "Message content is required");
}





const { replyTo } = req.body;
const { isForwarded, forwardedFrom } = req.body;




   const message = new Message({
  conversation: conversation._id,
  sender: senderId,
  receiver: senderId === receiverId ? senderId : receiverId,
 // 🔥 ALWAYS SET

  visibleTo: senderId === receiverId
    ? [senderId]
    : [senderId, receiverId],
  content,
  contentType,
  location,
  poll,
  imageOrVideoUrl,
  messageStatus,
  isForwarded: isForwarded === "true",
  forwardedFrom: forwardedFrom || null,
  replyTo:
    replyTo && replyTo !== "undefined" && replyTo !== ""
      ? replyTo
      : null,
      replyToStatus,
});

console.log("✅ FINAL replyToStatus:", replyToStatus);

    await message.save();

    // last message set
    if(message?.content){
conversation.lastMessage = message?._id;
    }

    
    if (senderId !== receiverId) {
  conversation.unreadCount =
    (conversation.unreadCount || 0) + 1;
}



// // ✅ unread sirf RECEIVER ke liye
// if (receiverId.toString() !== senderId.toString()) {
//   conversation.unreadCount = (conversation.unreadCount || 0) + 1;
// }

await conversation.save();

    const populatedMessage = await Message.findById(message._id)
  .populate("sender", "username profilePicture")
  .populate("receiver", "username profilePicture")
  .populate("poll.options.votes", "username profilePicture") // 🔥 ADD THIS
  .populate({
  path: "replyTo",
  populate: {
    path: "sender",
    select: "username profilePicture",
  },
})



    // Emit socket event for real-time messaging
    if (senderId !== receiverId && req.io && req.socketUserMap) {
  const receiverSocketId = req.socketUserMap.get(receiverId);

  if (receiverSocketId) {
    req.io.to(receiverSocketId).emit("receive_message", populatedMessage);

    message.messageStatus = "delivered";
    await message.save();
  }
}


    return response(res, 201, "Message sent successfully", populatedMessage);

  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);
    return response(res, 500, "Server error");
  }
};




exports.clearChatForMe = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;
    const { keepStarred } = req.body;

    const query = {
      conversation: conversationId,
      deletedFor: { $ne: userId },
    };

    // ⭐ keep starred messages
    if (keepStarred) {
      query.starredBy = { $ne: userId };
    }

    await Message.updateMany(
      query,
      { $push: { deletedFor: userId } }
    );

    return res.status(200).json({
      success: true,
      message: "Chat cleared",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteChatForMe = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.userId;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    // already deleted?
    if (conversation.deletedFor.includes(userId)) {
      return res.status(200).json({ success: true });
    }

    conversation.deletedFor.push(userId);
    conversation.lastMessage = null; // 👈 important
    await conversation.save();

    return res.status(200).json({
      success: true,
      message: "Chat deleted"
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};





exports.toggleStarMessage = async (req, res) => {
  const userId = req.user.userId;
  const { id: messageId } = req.params;

  const message = await Message.findById(messageId);
  if (!message) {
    return response(res, 404, "Message not found");
  }

  const alreadyStarred = message.starredBy.includes(userId);

  if (alreadyStarred) {
    message.starredBy.pull(userId); // ⭐ UNSTAR
  } else {
    message.starredBy.push(userId); // ⭐ STAR
  }

  await message.save();

  return response(res, 200, "Star updated", {
    messageId,
    starred: !alreadyStarred,
  });
};


exports.votePoll = async (req, res) => {
  try {
    const { messageId, optionIndex } = req.body;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message || !message.poll) {
      return res.status(404).json({ message: "Poll not found" });
    }

    const index = Number(optionIndex);
    const option = message.poll.options[index];

    // SINGLE SELECT
    if (!message.poll.allowMultiple) {
      message.poll.options.forEach((opt) => {
        opt.votes = opt.votes.filter(
          (id) => id.toString() !== userId.toString()
        );
      });
    }

    const alreadyVoted = option.votes.some(
      (id) => id.toString() === userId.toString()
    );

    if (message.poll.allowMultiple && alreadyVoted) {
      option.votes = option.votes.filter(
        (id) => id.toString() !== userId.toString()
      );
    } else if (!alreadyVoted) {
      option.votes.push(userId);
    }

    await message.save();

    // ✅ RE-FETCH WITH POPULATION
    const populatedMessage = await Message.findById(message._id)
      .populate("poll.options.votes", "_id username profilePicture")
      .lean();

    // ✅ SOCKET EMIT (deep cloned)
    const cleanPoll = JSON.parse(JSON.stringify(populatedMessage.poll));

req.io.to(message.conversation.toString()).emit("poll_updated", {
  messageId: message._id.toString(),
  poll: cleanPoll,
});

return res.json({
  success: true,
  poll: cleanPoll,
});


   
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
};


// PIN MESSAGE
exports.pinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { duration } = req.body; // 24 | 7 | 30
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }

    // sirf sender pin kar sakta hai
    if (message.sender.toString() !== userId.toString()) {
      return response(res, 403, "Not allowed");
    }

    const expiresAt = new Date(
      Date.now() + duration * 24 * 60 * 60 * 1000
    );

    message.isPinned = true;
    message.pinExpiresAt = expiresAt;
    await message.save();

    return response(res, 200, "Message pinned", message);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Server error");
  }
};


// UNPIN MESSAGE
exports.unpinMessage = async (req, res) => {
  try {
    const { messageId } = req.params;

    await Message.findByIdAndUpdate(messageId, {
      isPinned: false,
      pinExpiresAt: null,
    });

    return response(res, 200, "Message unpinned");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Server error");
  }
};







// ========================== GET ALL CONVERSATIONS ==============================
// exports.getMessages = async (req, res) => {
//   const userId = req.user.userId;

//   try {
//     const conversations = await Conversation.find({ participants: userId })
//       .populate("participants", "username profilePicture isOnline lastSeen")
//       .populate({
//         path: "lastMessage",
//         populate: { path: "sender receiver", select: "username profilePicture" }
//       })
//       .sort({ updatedAt: -1 });

//     return response(res, 201, "Conversations retrieved successfully", conversations);

//   } catch (error) {
//     console.error("GET MESSAGES ERROR:", error);
//     return response(res, 500, "Server error");
//   }
// };



// DELETE FOR EVERYONE
exports.deleteMessageForEveryone = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }

    // ❗ sirf sender delete-for-everyone kar sakta hai
   // ❌ block delete-for-everyone in self chat
const conversation = await Conversation.findById(message.conversation);

if (conversation?.isSelf === true) {
  return response(
    res,
    400,
    "Delete for everyone not allowed in Saved Messages"
  );
}

// normal rule
if (message.sender.toString() !== userId) {
  return response(res, 403, "Not allowed");
}


    message.deletedForEveryone = true;
    message.content = "This message was deleted";
    message.imageOrVideoUrl = null;
if (message.location?.isLive) {
  message.location.isLive = false;
  message.location.expiresAt = new Date();
}

    await message.save();

    // 🔔 socket notify BOTH USERS
    if (req.io && req.socketUserMap) {
      const receiverSocketId = req.socketUserMap.get(
        message.receiver.toString()
      );

      const senderSocketId = req.socketUserMap.get(
        message.sender.toString()
      );

      if (receiverSocketId) {
        req.io.to(receiverSocketId).emit("message_deleted_everyone", {
          messageId,
        });
      }

      if (senderSocketId) {
        req.io.to(senderSocketId).emit("message_deleted_everyone", {
          messageId,
        });
      }
    }

    return response(res, 200, "Message deleted for everyone");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Server error");
  }
};








exports.getMessages=async(req,res) => {
  const {conversationId}=req.params;
  const userId=req.user.userId;
  try {
    const conversation=await Conversation.findById(conversationId);
    if(!conversation){
      return response(res, 404, "Converstion not found")
    }

  const isParticipant = conversation.participants
  .map(id => id.toString())
  .includes(userId.toString());

if (!isParticipant) {
  return response(res, 403, "Not authorized");
}


const messages = await Message.find({
  conversation: conversationId,
  visibleTo: userId,
  deletedFor: { $ne: userId },
   

  ...(conversation.isSelf
    ? {sender: userId, receiver: userId}
    : {})
    
  
})

  .populate("sender", "username profilePicture")
  .populate("receiver", "username profilePicture")
  .populate("poll.options.votes", "username profilePicture") // 🔥 ADD THIS
  .populate({
  path: "replyTo",
  populate: {
    path: "sender",
    select: "username profilePicture",
  },
})

 
  .sort("createdAt");

if (!conversation.isSelf) {
  await Message.updateMany({
    conversation: conversationId,
    receiver: userId,
    sender: { $ne: userId },
    messageStatus: { $in: ["send", "delivered"] },
  },
  { $set: { messageStatus: "read" } });
}


if (!conversation.isSelf) {
  conversation.unreadCount = 0;
  await conversation.save();
}


return response(
  res,
  200,
  "Messages fetched successfully",
  messages
);

  }catch(error){
    console.error(error);
    return response(res, 500, "Internal Server error")
  }
}


// ========================== GET MESSAGES OF ONE CONVERSATION ==============================
// exports.getConversationMessages = async (req, res) => {
//   const userId = req.user.userId;
//   // const { conversationId } = req.params;

//   try {
//     const conversation = await Conversation.findById(conversationId);
//     if (!conversation) return response(res, 404, "Conversation not found");
//     if (!conversation.participants.includes(userId)) return response(res, 403, "Access denied");

//     const messages = await Message.find({ conversation: conversationId })
//       .populate('sender', 'username profilePicture')
//       .populate('receiver', 'username profilePicture')
//       .sort({ createdAt: 1 }); // fix here

//     await Message.updateMany(
//       { conversation: conversationId, receiver: userId, messageStatus: { $in: ["send", "delivered"] } },
//       { $set: { messageStatus: "read" } }
//     );

//     conversation.unreadCount = 0;
//     await conversation.save();

//     return response(res, 200, "Messages retrieved successfully", messages);

//   } catch (error) {
//     console.error(error);
//     return response(res, 500, "Internal Server error");
//   }
// };

// ========================== MARK MESSAGES AS READ ==============================
exports.markAsRead = async (req, res) => {
  const { messageIds } = req.body;
  const userId = req.user.userId;

  try {
    let messages = await Message.find({ _id: { $in: messageIds }, receiver: userId });

    await Message.updateMany(
      { _id: { $in: messageIds }, receiver: userId },
      { $set: { messageStatus: "read" } }
    );

    // Emit socket event for marking messages as read
if (req.io && req.socketUserMap) {
  for (const message of messages) {
    const senderSocketId = req.socketUserMap.get(message.sender.toString());

    if (senderSocketId) {
      const updatedMessage = {
        _id: message._id,
        messageStatus: "read",
      };

      // Emit read event to the sender
      req.io.to(senderSocketId).emit("message_read", updatedMessage);

      // Update message status in DB
      // message.messageStatus = "read";
      await message.save();
    }
  }
}


    return response(res, 200, "Messages marked as read", messages);
  } catch (error) {
    console.error(error);
    return response(res, 500, "Server error");
  }
};


exports.getConversation = async (req, res) => {
   
  try {
    const userId = req.user.userId;

    const conversations = await Conversation.find({
      deletedFor: { $ne: userId },
      $or: [
        { participants: { $all: [userId], $size: 1 }, isSelf: true }, // ✅ Saved Messages
        { participants: userId, isSelf: { $ne: true } } 
                      // ✅ Normal chats
      ]

       
    })
      .populate(
        "participants",
        "username profilePicture isOnline lastSeen"
      )
      .populate({
        path: "lastMessage",
        populate: {
          path: "sender receiver",
          select: "username profilePicture",
        },
      })
      .sort({ updatedAt: -1 });

    return response(
      res,
      200,
      "Conversation get successfully",
      conversations
    );

  } catch (error) {
    console.error(error);
    return response(res, 500, "Internal server error");
  }
};




// ========================== DELETE MESSAGE ==============================
// ========================== DELETE MESSAGE (FOR ME) ==========================
exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return response(res, 404, "Message not found");
    }

    // ✅ sender OR receiver dono delete-for-me kar sakte hain
    const isParticipant =
      message.sender.toString() === userId.toString() ||
      message.receiver.toString() === userId.toString();

    if (!isParticipant) {
      return response(res, 403, "Not authorized");
    }

    // 🔁 already deleted?
    if (message.deletedFor.includes(userId)) {
      return response(res, 200, "Already deleted");
    }

    // 🔥 soft delete (WhatsApp style)
    message.deletedFor.push(userId);
    await message.save();

    return response(res, 200, "Message deleted for you");
  } catch (error) {
    console.error(error);
    return response(res, 500, "Server error");
  }
};




