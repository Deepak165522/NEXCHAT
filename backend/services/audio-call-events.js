const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const mongoose = require("mongoose");

const activeCalls = new Map(); 
// callId -> { callerId, receiverId, startedAt, connectedAt }




const saveCallMessage = async ({
  callerId,
  receiverId,
  callStatus,
  callDuration = 0,
  visibleTo,
}) => {
  const conversation = await Conversation.findOne({
    participants: { $all: [callerId, receiverId] },
  });

  if (!conversation) return;

  await Message.create({
    conversation: conversation._id,

    // ✅ FIXED — kabhi flip nahi
    sender: callerId,
    receiver: receiverId,

    contentType: "call",
    callType: "audio",
    callStatus,
    callDuration,

    // ✅ hamesha ObjectId array
    visibleTo: Array.isArray(visibleTo)
      ? visibleTo.map(id => new mongoose.Types.ObjectId(id))
      : [new mongoose.Types.ObjectId(visibleTo)],
  });
};






const handleAudioCallEvent = (socket, io, onlineUsers) => {

  // =============================
  // 📞 INITIATE AUDIO CALL
  // =============================
 socket.on("initiate_audio_call", async ({
  callerId,
  receiverId,
  callerInfo,
}) => {

  // 1️⃣ receiver socket id sabse pehle
  const receiverSocketId = onlineUsers.get(receiverId);

  // 2️⃣ block check (same as tumhara)
  const receiver = await User.findById(receiverId);
  if (receiver?.blockedUsers?.includes(callerId)) {
    socket.emit("call_failed", { reason: "blocked" });
    return;
  }

  // 3️⃣ callId sabse pehle CREATE karo
  const callId = new mongoose.Types.ObjectId().toString();

  // 4️⃣ activeCalls me store
  activeCalls.set(callId, {
    callerId,
    receiverId,
    startedAt: Date.now(),
    connectedAt: null,
  });

  // 5️⃣ caller ko hamesha batao (Calling…)
  io.to(onlineUsers.get(callerId))?.emit("call_started", { callId });

  // 6️⃣ receiver ko sirf tab incoming_call jab online ho
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("incoming_call", {
      callerId,
      callerName: callerInfo.username,
      callerAvatar: callerInfo.profilePicture,
      callId,
      callType: "audio",
    });
  }

  // 7️⃣ 30 sec timeout (same logic)
  setTimeout(async () => {
    const call = activeCalls.get(callId);
    if (!call || call.connectedAt) return;

    console.log("⏱️ Call auto-ended after 30s:", callId);

    io.to(onlineUsers.get(callerId))?.emit("call_ended", {
      callId,
      reason: "timeout",
    });

    io.to(onlineUsers.get(receiverId))?.emit("call_ended", {
      callId,
      reason: "timeout",
    });

    // receiver → missed
    await saveCallMessage({
      callerId,
      receiverId,
      callStatus: "missed",
      visibleTo: [receiverId],
    });

    // sender → ended
    await saveCallMessage({
      callerId,
      receiverId,
      callStatus: "ended",
      visibleTo: [callerId],
    });

    activeCalls.delete(callId);
  }, 30000);
});



  socket.on("terminate_call", async ({ callId, type }) => {
  const call = activeCalls.get(callId);
  if (!call) return;

  const { callerId, receiverId, connectedAt } = call;

  // 🔥🔥🔥 MOST IMPORTANT — CLOSE UI FOR BOTH
  io.to(onlineUsers.get(callerId))?.emit("call_ended", {
    callId,
    reason: type,
  });

  io.to(onlineUsers.get(receiverId))?.emit("call_ended", {
    callId,
    reason: type,
  });

  // ============================
  // 🔴 BEFORE CONNECT
  // ============================
  if (!connectedAt) {
    if (type === "reject") {
      // caller → rejected
      await saveCallMessage({
        callerId,
        receiverId,
        callStatus: "rejected",
        visibleTo: [callerId],
      });

      // receiver → missed
      await saveCallMessage({
        callerId,
        receiverId,
        callStatus: "missed",
        visibleTo: [receiverId],
      });
    }

    if (type === "cancel") {
      // caller → ended
      await saveCallMessage({
        callerId,
        receiverId,
        callStatus: "ended",
        visibleTo: [callerId],
      });

      // receiver → missed
      await saveCallMessage({
        callerId,
        receiverId,
        callStatus: "missed",
        visibleTo: [receiverId],
      });
    }

    activeCalls.delete(callId);
    return;
  }

  // ============================
  // 🟢 AFTER CONNECT
  // ============================
  const duration = Math.floor((Date.now() - connectedAt) / 1000);

  await saveCallMessage({
    callerId,
    receiverId,
    callStatus: "ended",
    callDuration: duration,
    visibleTo: [callerId],
  });

  await saveCallMessage({
    callerId,
    receiverId,
    callStatus: "ended",
    callDuration: duration,
    visibleTo: [receiverId],
  });

  activeCalls.delete(callId);
});



  // =============================
  // ✅ ACCEPT CALL
  // =============================
  socket.on("accept_audio_call", ({ callerId, callId }) => {
    const call = activeCalls.get(callId);
    if (!call) return;

    call.connectedAt = Date.now();

    io.to(onlineUsers.get(callerId))?.emit("call_accepted", { callId });
  });

  // =============================
  // ❌ REJECT CALL (before connect)
  // =============================
  // socket.on("reject_audio_call", async ({ callId }) => {
  //   const call = activeCalls.get(callId);
  //   if (!call) return;

  //   const { callerId, receiverId } = call;

  //   await saveCallMessage({
  //     callerId,
  //     receiverId,
  //     callStatus: "rejected",
  //   });

  //   activeCalls.delete(callId);
  // });

  // =============================
  // ☎️ END CALL (after connect)
  // =============================
  // socket.on("end_audio_call", async ({ callId }) => {
  //   const call = activeCalls.get(callId);
  //   if (!call) return;

  //   const { callerId, receiverId, connectedAt } = call;

  //   const duration = connectedAt
  //     ? Math.floor((Date.now() - connectedAt) / 1000)
  //     : 0;

  //   await saveCallMessage({
  //     callerId,
  //     receiverId,
  //     callStatus: "ended",
  //     callDuration: duration,
  //   });

  //   activeCalls.delete(callId);
  // });
};

module.exports = handleAudioCallEvent;
