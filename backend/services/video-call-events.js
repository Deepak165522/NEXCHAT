
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const activeVideoCalls = new Map();
// callId -> { startedAt }




const handleAutoEndCall = async (socket, io, onlineUsers, callId) => {
  const call = activeVideoCalls.get(callId);
  if (!call) return;

  const { callerId, receiverId, startedAt } = call;

  const wasConnected = startedAt !== null;

  let duration = 0;
  if (wasConnected) {
    duration = Math.floor((Date.now() - startedAt) / 1000);
  }

  activeVideoCalls.delete(callId);

  // notify receiver UI
// receiver UI close
io.to(onlineUsers.get(receiverId))?.emit("call_ended", { callId });

// 🔥🔥🔥 caller UI close (THIS WAS MISSING)
io.to(onlineUsers.get(callerId))?.emit("call_ended", { callId });


  const conversation = await Conversation.findOne({
    participants: { $all: [callerId, receiverId] },
  });
  if (!conversation) return;

  // CALLER → ended
  await Message.create({
    conversation: conversation._id,
    sender: callerId,
    receiver: receiverId,
    contentType: "call",
    callType: "video",
    callStatus: "ended",
    callDuration: 0,
    visibleTo: [callerId],
  });

  // RECEIVER → missed
  await Message.create({
    conversation: conversation._id,
    sender: callerId,
    receiver: receiverId,
    contentType: "call",
    callType: "video",
    callStatus: "missed",
    callDuration: 0,
    visibleTo: [receiverId],
  });
};




















const handleVideoCallEvent = (socket, io, onlineUsers) => {
  // Initiate video call


  socket.on("initiate_call", ({ callerId, receiverId, callerInfo, callType }) => {

  const callId = `${callerId}-${receiverId}-${Date.now()}`;

  // 🔥🔥🔥 MOST IMPORTANT FIX
  const timeoutId = setTimeout(() => {
  handleAutoEndCall(socket, io, onlineUsers, callId);
}, 30000);


activeVideoCalls.set(callId, {
  callerId,
  receiverId,
  startedAt: null,
  timeoutId, // 🔥 store timer
});


  const receiverSocketId = onlineUsers.get(receiverId);

  if (receiverSocketId) {
    io.to(receiverSocketId).emit("incoming_call", {
      callerId,
      callerName: callerInfo.username,
      callerAvatar: callerInfo.profilePicture,
      callId,
      callType,
    });
  }
});





  // Accept call

  socket.on("accept_call", ({ callerId, callId, receiverInfo }) => {

  const call = activeVideoCalls.get(callId);
  if (call) {
    call.startedAt = Date.now(); // 🔥 duration anchor
  }

  if (call?.timeoutId) {
  clearTimeout(call.timeoutId); // 🔥 stop auto-miss
}


  const callerSocketId = onlineUsers.get(callerId);

  if (callerSocketId) {
    io.to(callerSocketId).emit("call_accepted", {
      callerName: receiverInfo.username,
      callerAvatar: receiverInfo.profilePicture,
      callId,
    });
  }
});


// Reject call

 socket.on("reject_call", async ({ callerId, callId }) => {

const call = activeVideoCalls.get(callId);
if (call?.timeoutId) {
  clearTimeout(call.timeoutId);
}
activeVideoCalls.delete(callId);


  const callerSocketId = onlineUsers.get(callerId);

  if (callerSocketId) {
    io.to(callerSocketId).emit("call_rejected", { callId });
  }

  // 🔥 FIND CONVERSATION
  const conversation = await Conversation.findOne({
    participants: { $all: [callerId, socket.userId] },
  });

  if (!conversation) return;

  // ✅ CHAT MESSAGE SAVE
  // 🔹 Receiver (jisne reject kiya) → OUTGOING
await Message.create({
  conversation: conversation._id,
  sender: callerId,          // 🔥 original caller
  receiver: socket.userId,   // 🔥 original receiver
  contentType: "call",
  callType: "video",
  callStatus: "missed",
  callDuration: 0,
  visibleTo: [socket.userId], // ✅ OUTGOING for receiver
});

// 🔹 Caller → INCOMING (missed)
await Message.create({
  conversation: conversation._id,
  sender: callerId,
  receiver: socket.userId,
  contentType: "call",
  callType: "video",
  callStatus: "rejected",
  callDuration: 0,
  visibleTo: [callerId], // ✅ INCOMING for caller
});

});





// End call

socket.on("end_call", async ({ participantId, callId }) => {

  const call = activeVideoCalls.get(callId);
if (!call) return;

if (call.timeoutId) {
  clearTimeout(call.timeoutId);
}


 

  // ✅ 1️⃣ PEHLE destructure
  const { callerId, receiverId, startedAt } = call;

  // ✅ 2️⃣ PHIR decision lo
  const wasConnected = startedAt !== null;

  // ✅ 3️⃣ duration calculate
  let duration = 0;
  if (wasConnected) {
    duration = Math.floor((Date.now() - startedAt) / 1000);
  }

  // ✅ 4️⃣ cleanup
  activeVideoCalls.delete(callId);

  // UI close
  io.to(onlineUsers.get(participantId))?.emit("call_ended", { callId });

  const conversation = await Conversation.findOne({
    participants: { $all: [callerId, receiverId] },
  });
  if (!conversation) return;

  // 🔹 CUTTER → hamesha ended
  await Message.create({
    conversation: conversation._id,
    sender: callerId,
    receiver: receiverId,
    contentType: "call",
    callType: "video",
    callStatus: "ended",
    callDuration: wasConnected ? duration : 0,
    visibleTo: [socket.userId],
  });

  // 🔹 OTHER SIDE → decision yahin hota hai
  await Message.create({
    conversation: conversation._id,
    sender: callerId,
    receiver: receiverId,
    contentType: "call",
    callType: "video",
    callStatus: wasConnected ? "ended" : "missed", // 🔥 FINAL FIX
    callDuration: wasConnected ? duration : 0,
    visibleTo: [participantId],
  });
});










const User = require("../models/User");

socket.on("initiate_call", async ({ callerId, receiverId }) => {
  const receiver = await User.findById(receiverId);

  if (receiver.blockedUsers.includes(callerId)) {
    // 🔥 fake ringing + auto disconnect
    socket.emit("call_failed", {
      reason: "Call ended"
    });
    return;
  }

  // existing logic continues
});






// WebRTC signaling event - OFFER

  socket.on("webrtc_offer", ({ offer, receiverId, callId }) => {
  const  receiverSocketId = onlineUsers.get(receiverId);

  if ( receiverSocketId ) {
    
      io.to( receiverSocketId).emit("webrtc_offer", {
        offer,
        senderId: socket.userId,
        callId
     
    });

     console.log(`Server: offer forwarded to ${receiverId}`);
  } else {
    console.log(`Server: receiver forwarded to ${receiverId} not found the offer`);
  }
});


  // WebRTC signaling event - ANSWER

  socket.on("webrtc_answer", ({ answer, receiverId, callId }) => {
  const receiverSocketId= onlineUsers.get(receiverId);

  if (receiverSocketId ) {
    
      io.to(receiverSocketId).emit("webrtc_answer", {
        answer,
        senderId: socket.userId,
        callId,
      });
   

    console.log(`Server: answer forwarded to ${receiverId}`);
  } else {
    console.log(`Server: Receiver ${receiverId} not found for answer`);
  }
});

// WebRTC signaling event - ICE CANDIDATE

  socket.on("webrtc_ice_candidate", ({ candidate, receiverId, callId }) => {
  const receiverSocketId = onlineUsers.get(receiverId);

  if (receiverSocketId ) {
    
      io.to(receiverSocketId).emit("webrtc_ice_candidate", {
        candidate,
        senderId: socket.userId,
        callId,
      });
    
  } else {
    console.log(`Server: Receiver ${receiverId} not found for ICE`);
  }
});
};


module.exports = handleVideoCallEvent;


