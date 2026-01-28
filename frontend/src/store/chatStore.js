import { create } from "zustand";
import { getSocket } from "../services/chat.service";
import axiosInstance from "../services/url.service.js";
import { deleteChatForMe as deleteChatAPI } from "../services/chat.service";


export const useChatStore = create((set, get) => ({
  conversations: [],
  currentConversation: null,
  messages: [],
  replyToMessage: null,
  replyToStatus: null,



  

   setMessages: (msgs) => set({ messages: msgs }),

setReplyToMessage: (message) => set({ replyToMessage: message }),

clearReplyToMessage: () => set({ replyToMessage: null }),


setReplyToStatus: (status) => set({ replyToStatus: status }),
clearReplyToStatus: () => set({ replyToStatus: null }),


  loading: false,
  error: null,

  onlineUsers: new Map(),
  typingUsers: new Map(),

  // socket event listeners setup
  initSocketListeners: () => {
    const socket = getSocket();
    if (!socket) return;

    socket.off("receive_message");
    socket.off("user_typing");
    socket.off("user_status");
    socket.off("message_send");
    socket.off("message_error");
    socket.off("message_deleted");
    socket.off("message_status_update");


socket.off("poll_updated");

    socket.on("receive_message", (message) => {
      get().receiveMessage(message);
    });

    socket.on("message_send", (message) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === message._id ? { ...msg } : msg
        ),
      }));
      get().clearReplyToMessage();

    });

    socket.on("message_status_update", ({ messageId, messageStatus }) => {
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === messageId ? { ...msg, messageStatus } : msg
        ),
      }));
      

    });

    socket.on("reaction_update", ({messageId,reactions})=>{
      set((state)=>({
        messages: state.messages.map((msg)=>
        msg._id===messageId ? {...msg, reactions} : msg
        )
      }))
    })

    socket.on("message_deleted", ({ deletedMessageId }) => {
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg._id !== deletedMessageId
        ),
      }));
    });

    socket.on("message_deleted_everyone", ({ messageId }) => {
  set((state) => ({
    messages: state.messages.map((msg) =>
      msg._id === messageId
        ? {
            ...msg,
            content: "This message was deleted",
            contentType: "text",
            imageOrVideoUrl: null,
            deletedForEveryone: true,
          }
        : msg
    ),
  }));
});


 // 🔥🔥🔥 POLL REAL-TIME UPDATE (FIX-3)
socket.on("poll_updated", ({ messageId, poll }) => {
  set((state) => ({
    messages: state.messages.map((msg) =>
      msg._id === messageId
        ? {
            ...msg,
            poll: JSON.parse(JSON.stringify(poll)), // 🔥 FULL DEEP CLONE
          }
        : msg
    ),
  }));
});







    socket.on("message_error", (error) => {
      console.error("Message error:", error);
    });

    socket.on("user_typing", ({ userId, conversationId, isTyping }) => {
      set((state) => {
        const newTypingUsers = new Map(state.typingUsers);

        if (!newTypingUsers.has(conversationId)) {
          newTypingUsers.set(conversationId, new Set());
        }

        const typingSet = newTypingUsers.get(conversationId);

        if (isTyping){

         typingSet.add(userId)
        }
        else {
          typingSet.delete(userId)
        }

        return { typingUsers: newTypingUsers };
      });
    });

    socket.on("user_status", ({ userId, isOnline, lastSeen }) => {
      set((state) => {
        const newOnlineUsers = new Map(state.onlineUsers);
        newOnlineUsers.set(userId, { isOnline, lastSeen });
        return { onlineUsers: newOnlineUsers };
      });
    });

    const { conversations} = get();

    if (conversations?.data?.length > 0) {
      conversations.data.forEach((conv) => {
        const otherUser = conv.participants.find(
          (p) => p._id !== get().currentUser._id
        );

        if (otherUser?._id) {
          socket.emit("get_user_status", otherUser._id, (status) => {
            set((state) => {
              const newOnlineUsers = new Map(state.onlineUsers);
              newOnlineUsers.set(state.userId, {
                isOnline: state.isOnline,
                lastSeen: state.lastSeen,
              });
              return { onlineUsers: newOnlineUsers };
            });
          });
        }
      });
    }
  },


  setCurrentUser :(user)=> set({currentUser:user}),

  fetchConversations: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await axiosInstance.get("/chats/conversations");
      set({ conversations: data, loading: false });
      get().initSocketListeners();
      return data;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return null;
    }
  },

  fetchMassages: async (conversationId) => {
    if (!conversationId) return;
    set({ loading: true, error: null });

    try {
      const { data } = await axiosInstance.get(
        `/chats/conversations/${conversationId}/messages`
      );

      const messageArray = data?.data || data || [];

      // 🔥 FIX: parse replyToStatus for old messages
messageArray.forEach((msg) => {
  if (msg.replyToStatus && typeof msg.replyToStatus === "string") {
    try {
      msg.replyToStatus = JSON.parse(msg.replyToStatus);
    } catch (e) {
      console.error("Invalid replyToStatus JSON", e);
    }
  }
});


      set({
        messages: messageArray,
        currentConversation: conversationId,
        loading: false,
      });

      const {markMessagesAsRead}=get();
      markMessagesAsRead();
      // get().markMessagesAsRead();
      return messageArray;
    } catch (error) {
      set({
        error: error?.response?.data?.message || error?.message,
        loading: false,
      });
      return [];
    }
  },



deleteChatForMe: async (conversationId) => {
  try {
    await deleteChatAPI(conversationId);

    set((state) => ({
      conversations: {
        ...state.conversations,
        data: state.conversations.data.filter(
          (c) => c._id !== conversationId
        ),
      },
      messages: [],               // 🔥 current chat clear
      currentConversation: null,  // 🔥 reset
    }));
  } catch (err) {
    console.error("Delete chat failed", err);
  }
},







clearChat: async (conversationId, keepStarred) => {
  await axiosInstance.put(
    `/chats/conversations/${conversationId}/clear`,
    {
      keepStarred,
    }
  );
},






  sendMessage: async (formData) => {
   
    const senderId = formData.get("senderId");
    const receiverId = formData.get("receiverId");
    const media = formData.get("media");
    const content = formData.get("content");
    const messageStatus = formData.get("messageStatus");
    
   
    const poll=formData.get("poll");
    const replyToMessage = get().replyToMessage;
const rawReplyToStatus = formData.get("replyToStatus");
const replyToStatus = rawReplyToStatus
  ? JSON.parse(rawReplyToStatus)
  : null;


      const isSelfChat = senderId === receiverId;
   



    const { conversations } = get();
    let conversationId = null;

    if (conversations?.data?.length > 0) {
      const conversation = conversations.data.find((conv) => {
  // ❌ self chat ko ignore karo
  if (conv.isSelf) return false;

  const ids = conv.participants.map(p => p._id.toString());
  return (
    ids.includes(senderId) &&
    ids.includes(receiverId)
  );
});







      if (conversation) {
        conversationId = conversation._id;
        set({ currentConversation: conversationId });
      }
    }

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = {
      _id: tempId,
      sender: { _id: senderId },
      receiver: isSelfChat ? { _id: senderId } : { _id: receiverId },
      conversation: isSelfChat ? "self" : conversationId,
      // content,
      // contentType,

      poll: poll ? JSON.parse(poll) : null,
      imageOrVideoUrl:
        media && typeof media !== "string"
          ? URL.createObjectURL(media)
          : null,
      content,
    contentType: poll
    ? "poll"
    : media
  ? media.type.startsWith("image/")
    ? "image"
    : media.type.startsWith("video/")
    ? "video"
    : media.type.startsWith("audio/")
    ? "audio"
    : "file"
  : "text",

  replyTo: replyToMessage
  ? {
      _id: replyToMessage._id,
      sender: replyToMessage.sender,
      content: replyToMessage.content,
      contentType: replyToMessage.contentType,
      imageOrVideoUrl: replyToMessage.imageOrVideoUrl,
    }
  : null,


replyToStatus: replyToStatus
  ? {
      id: replyToStatus.id,
      media: replyToStatus.media,
      contentType: replyToStatus.contentType,
      timestamp: replyToStatus.timestamp,
       owner: replyToStatus.owner,
    }
  : null,






      createdAt: new Date().toISOString(),
      messageStatus,
    };

    set((state) => ({
      messages: [...state.messages, optimisticMessage],
    }));

    try {




      const { data } = await axiosInstance.post(
        "/chats/send-message",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      const messageData = data.data || data;

      set((state) => ({
        messages: state.messages.map((msg) =>
          msg._id === tempId ? messageData : msg
        ),
        replyToMessage: null,
        replyToStatus: null,

      }));

      

      return messageData;
    
      
    } catch (error){
      console.error("Error sending message", error);
      set((state) => ({
        messages:state.messages.map((msg) =>
          msg._id === tempId
            ? {...msg, messageStatus: "failed" }
            : msg),
           error: error?.response?.data?.message || error?.message,
        
      }))

      throw error;
      
    }
  },


 pinMessage: async (messageId, duration) => {
  await axiosInstance.post(
    `/chats/messages/${messageId}/pin`,
    { duration }
  );
},

unpinMessage: async (messageId) => {
  await axiosInstance.post(
    `/chats/messages/${messageId}/unpin`
  );
},


toggleStarMessage: async (messageId) => {
    try {
      await axiosInstance.post(
        `/chats/messages/${messageId}/star`
      );

      const userId = get().currentUser?._id;

      set((state) => ({
        messages: state.messages.map((msg) => {
          if (msg._id !== messageId) return msg;

          const alreadyStarred =
            msg.starredBy?.includes(userId);

          return {
            ...msg,
            starredBy: alreadyStarred
              ? msg.starredBy.filter((id) => id !== userId)
              : [...(msg.starredBy || []), userId],
          };
        }),
      }));
    } catch (err) {
      console.error("Star toggle failed", err);
    }
  },





deleteMessageForEveryone: async (messageId) => {
  try {
    await axiosInstance.delete(
      `/chats/messages/${messageId}/delete-everyone`
    );

    set((state) => ({
      messages: state.messages.map((msg) =>
        msg._id === messageId
          ? {
              ...msg,
              content: "This message was deleted",
              contentType: "text",
              imageOrVideoUrl: null,
              deletedForEveryone: true,
            }
          : msg
      ),
    }));
  } catch (error) {
    console.error("Delete for everyone failed", error);
  }
},






receiveMessage: (message) => {


  // 🔥 FIX: replyToStatus string → object
if (
  message.replyToStatus &&
  typeof message.replyToStatus === "string"
) {
  try {
    message.replyToStatus = JSON.parse(message.replyToStatus);
  } catch (e) {
    console.error("Invalid replyToStatus JSON", e);
  }
}

  if (!message || !message._id) return;

  const { currentUser, messages, currentConversation } = get();

  // ✅ FIX: array par .some()
  const messageExits = messages.some(
    (msg) => msg._id === message._id
  );
  if (messageExits) return;

  if (message.conversation === currentConversation) {
    set((state) => ({
      messages: [...state.messages, message],
    }));

    if (message.receiver?._id === currentUser?._id) {
      get().markMessagesAsRead();
    }
  }

  // conversation list update (tera code same)
  set((state) => {
    const updateConversations = state.conversations?.data?.map((conv) => {
      if (conv._id === message.conversation) {
        return {
          ...conv,
          lastMessage: message,
          unreadCount:
            message?.receiver?._id === currentUser?._id
              ? (conv.unreadCount || 0) + 1
              : conv.unreadCount || 0,
        };
      }
      return conv;
    });

    return {
      conversations: {
        ...state.conversations,
        data: updateConversations,
      },
    };
  });
},


  markMessagesAsRead: async () => {
    const { messages, currentUser } = get();
    if (!messages.length || !currentUser) return;

    const unreadIds = messages
      .filter(
        (msg) =>
          msg.messageStatus !== "read" &&
          msg.receiver?._id === currentUser?._id
      )
      .map((msg) => msg._id).filter(Boolean);

   if (unreadIds.length === 0) return;


    try {
      await axiosInstance.put("/chats/messages/read", {
        messageIds: unreadIds,
      });

      set((state) => ({
        messages: state.messages.map((msg) =>
          unreadIds.includes(msg._id)
            ? { ...msg, messageStatus: "read" }
            : msg
        ),
      }));

      const socket= getSocket();
      if(socket){
     socket.emit("message_read", {
        messageIds: unreadIds,
        senderId: messages[0]?.sender?._id
      })
    }
    } catch (error) {
      console.error("failed to mark message as read", error);
    }
  },

  deleteMessage: async (messageId) => {
    try {
      await axiosInstance.delete(`/chats/messages/${messageId}`);
      set((state) => ({
        messages: state.messages.filter(
          (msg) => msg._id !== messageId
        ),
      }));
      return true;
    } catch (error) {
      console.log("error deleting message", error)
      
      set({
        error: error.response?.data?.message || error.message,
      })
      return false;
    }
  },

addReaction: (messageId, emoji) => {
  const socket = getSocket();
  const { currentUser } = get();
  if (!socket || !currentUser) return;

  socket.emit("add_reaction", {
    messageId,
    emoji,
    userId: currentUser._id,
  });
},



removeReaction: (messageId, emoji) => {
  const socket = getSocket();
  const { currentUser } = get();
  if (!socket || !currentUser) return;

  socket.emit("remove_reaction", {
    messageId,
    emoji,
    userId: currentUser._id,
  });
},






  startTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (socket && currentConversation && receiverId) {
      socket.emit("typing_start", {
        conversationId:currentConversation,
        receiverId
      })
    }

    
   
  },

  stopTyping: (receiverId) => {
    const { currentConversation } = get();
    const socket = getSocket();
    if (!socket || !currentConversation || !receiverId) return;

    socket.emit("typing_stop", {
      conversationId: currentConversation,
      receiverId,
    });
  },

  isUserTyping: (userId) => {
    const { typingUsers, currentConversation } = get();
    if (!currentConversation || !typingUsers.has(currentConversation) || !userId){
 return false;
    }
    return typingUsers.get(currentConversation)?.has(userId)
  },

  isUserOnline: (userId) => {
    if (!userId) return null;
    const {onlineUsers}=get();
    return onlineUsers.get(userId)?.isOnline || false;
  },

  getUserLastSeen: (userId) => {
    if (!userId) return null;
    const {onlineUsers}=get();
    return onlineUsers.get(userId)?.lastSeen || null;
  },


//   replyToMessage: null,

// setReplyToMessage: (message) =>
//   set({ replyToMessage: message }),

// clearReplyToMessage: () =>
//   set({ replyToMessage: null }),

// forwardMessage: null,

// setForwardMessage: (message) => set({ forwardMessage: message }),

// clearForwardMessage: () => set({ forwardMessage: null }),



  cleanup: () => {
    set({
      conversations: [],
      currentConversation: null,
      messages: [],
      replyToMessage: null, 
       replyToStatus: null,
      onlineUsers: new Map(),
      typingUsers: new Map(),
    });
  },
}));
