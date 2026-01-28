import React, { useRef, useState, useEffect } from "react";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { useChatStore } from "../../store/chatStore";
import { isToday, isYesterday, format } from "date-fns";
import whatsappImage from "../../images/whatsappImage.png";
import { FaArrowLeft, FaEllipsisV, FaFile, FaImage, FaLock, FaPaperclip, FaPaperPlane, FaPhone, FaPoll, FaSmile, FaTimes, FaVideo, FaTrash, FaEraser, FaBan, FaDownload, FaShare, FaStar, FaCopy, FaThumbtack, FaMicrophone } from "react-icons/fa";
import MessageBubble from "./MessageBubble";
import EmojiPicker from 'emoji-picker-react';
import { FaMapMarkerAlt, FaClock } from "react-icons/fa";

import { FaCamera } from "react-icons/fa";
import CameraModal from "./CameraModal";
import VoiceRecorder from "./VoiceRecorder";


import useVideoCallStore from "../../store/videoCallStore";
import { getSocket } from "../../services/chat.service";
import MessageInfo from "../MessageInfo";
import { FaSearch } from "react-icons/fa";

import useAudioCallStore from "../../store/audioCallStore";
import { useNavigate } from "react-router-dom";


import { useForwardStore } from "../../store/useForwardStore";
import PinnedBar from "./PinnedBar";
import { RxCross2 } from "react-icons/rx";



const isValidateDate = (date) => {
  return date instanceof Date && !isNaN(date);
};

const ChatWindow = ({ selectedContact, setSelectedContact }) => {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileInputRef = useRef(null);
  const messageRefs = useRef({});

   const navigate = useNavigate();


  const [showLiveLocationMenu, setShowLiveLocationMenu] = useState(false);


  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const socket= getSocket();

  const { isOpen } = useForwardStore();

  const [showPollModal, setShowPollModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

const [audioPreview, setAudioPreview] = useState(null);
const [audioFile, setAudioFile] = useState(null);
const [audioCaption, setAudioCaption] = useState("");


const [showPinModal, setShowPinModal] = useState(false);
const [pinDuration, setPinDuration] = useState(24);
const [selectedPinMessage, setSelectedPinMessage] = useState(null);

const pinnedRef = useRef([]);
const [pinnedMessages, _setPinnedMessages] = useState([]);

const [infoMessage, setInfoMessage] = useState(null);


const [selectedMessages, setSelectedMessages] = useState([]);
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

const [showSearch, setShowSearch] = useState(false);
const [searchText, setSearchText] = useState("");
const [searchResults, setSearchResults] = useState([]);

const [showHeaderMenu, setShowHeaderMenu] = useState(false);
const [showClearChatModal, setShowClearChatModal] = useState(false);
const [keepStarred, setKeepStarred] = useState(false);

const [showDeleteChatModal, setShowDeleteChatModal] = useState(false);


const optionsRef = useRef(null);


// 🔐 BLOCK STATES
const [isBlocked, setIsBlocked] = useState(false);
const [showBlockModal, setShowBlockModal] = useState(false);
const [showUnblockModal, setShowUnblockModal] = useState(false);

const emojiContainerRef = useRef(null);
const fileMenuRef = useRef(null);


const isSelectMode = selectedMessages.length > 0;


const toggleStarMessage = useChatStore(
  (state) => state.toggleStarMessage
);

const { openForward } = useForwardStore();




  const {
    messages,
    loading,
    sendMessage,
    receivedMessage,
   fetchMassages,
     fetchConversations,
    conversations,
    isUserTyping,
    startTyping,
    stopTyping,
    getUserLastSeen,
    isUserOnline,
    deleteMessage,
    addReaction,
    cleanup,
    deleteMessageForEveryone,
    replyToMessage,
  clearReplyToMessage,
  replyToStatus,
  clearReplyToStatus,
 
   clearChat,
 
  setMessages,

  deleteChatForMe
 
  } = useChatStore();

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);


  
 


  const handleSendCurrentLocation = () => {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;

    const formData = new FormData();
    formData.append("senderId", user._id);
    formData.append("receiverId", selectedContact._id);
    formData.append("contentType", "location");
    formData.append("content", "📍 Location");


    formData.append(
      "location",
      JSON.stringify({
        lat: latitude,
        lng: longitude,
        isLive: false,
        expiresAt: null,
      })
    );

    await sendMessage(formData);
    setShowFileMenu(false);
  });
};

const handleOpenPoll = () => {
  setShowFileMenu(false);
  setShowPollModal(true);
};

const handleVideoCall = () => {
  if(selectedContact && online){
    const {initiateCall} = useVideoCallStore.getState();
    initiateCall(
      selectedContact?._id,
      selectedContact?.username,
      selectedContact?.profilePicture,
      "video"
    )
  }else{
alert("User is offline. Cannot initiate call.")
    }
  }


const clearChatMessages = async (keepStarred) => {
  if (!conversationId) return;

  await clearChat(conversationId, keepStarred);

  // 🔥 UI clear
  setMessages([]);
  setShowClearChatModal(false);
};


const handleAudioCall = () => {
  if (!selectedContact || !online) {
    alert("User is offline");
    return;
  }

  useAudioCallStore.getState().initiateAudioCall({
    user,
    receiver: selectedContact,
    socket,
  });
};







 



const handleSendLiveLocation = (minutes) => {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const expiresAt = Date.now() + minutes * 60 * 1000;

    const formData = new FormData();
    formData.append("senderId", user._id);
    formData.append("receiverId", selectedContact._id);
    formData.append("contentType", "location");
    formData.append("content", "📍Live Location");


    formData.append(
      "location",
      JSON.stringify({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        isLive: true,
        expiresAt,
      })
    );

    await sendMessage(formData);
    setShowLiveLocationMenu(false);
    setShowFileMenu(false);
  });
};



useEffect(() => {
  const handleClickOutside = (e) => {
    // 😀 Emoji picker outside click
    if (
      showEmojiPicker &&
      emojiContainerRef.current &&
      !emojiContainerRef.current.contains(e.target)
    ) {
      setShowEmojiPicker(false);
    }

    // 📎 File menu outside click
    if (
      showFileMenu &&
      fileMenuRef.current &&
      !fileMenuRef.current.contains(e.target)
    ) {
      setShowFileMenu(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showEmojiPicker, showFileMenu]);



useEffect(() => {
  if (!selectedContact || !user) return;

  // 🔥 assume backend se blockedUsers aata hai
  const blocked =
    selectedContact.blockedUsers?.includes(user._id);

  setIsBlocked(blocked);
}, [selectedContact, user]);



useEffect(() => {
  if (!searchText.trim()) {
    setSearchResults([]);
    return;
  }

  const results = messages.filter(
    (m) =>
      m.contentType === "text" &&
      m.content?.toLowerCase().includes(searchText.toLowerCase())
  )

  .sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  setSearchResults(results);
}, [searchText, messages]);


useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      optionsRef.current &&
      !optionsRef.current.contains(e.target)
    ) {
      setShowHeaderMenu(false);
    }
  };

  if (showHeaderMenu) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showHeaderMenu]);







  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations.data.find((conv) =>
        conv.participants.some(
          (participant) => participant._id === selectedContact._id
        )
      );

      if (conversation?._id) {
        fetchMassages(conversation._id);

        
      const socket = getSocket();
      if (socket) {
        socket.emit("join_conversation", conversation._id);
      }
      }
    }
  }, [selectedContact, conversations, fetchMassages]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const scrollToBottom = () => {
    messageEndRef.current?.scrollIntoView({ behavior: "auto" });
  };

const lastMessageIdRef = useRef(null);

useEffect(() => {
  if (!messages || messages.length === 0) return;

  const lastMsg = messages[messages.length - 1];

  // 🔥 sirf NEW MESSAGE pe scroll karo
  if (lastMessageIdRef.current !== lastMsg._id) {
    scrollToBottom();
    lastMessageIdRef.current = lastMsg._id;
  }
}, [messages]);




 useEffect(() => {
  if (!selectedContact || selectedContact.isSelf) return;

  if (message) {
    startTyping(selectedContact._id);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(selectedContact._id);
    }, 2000);
  }

  return () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };
}, [message, selectedContact, startTyping, stopTyping]);


const conversationId = conversations?.data?.find((conv) =>
  conv.participants.some(
    (p) => p._id === selectedContact?._id
  )
)?._id;

const pinKey = conversationId
  ? `pinned_${user._id}_${conversationId}`
  : null;


  const setPinnedMessages = (updater) => {
  const next =
    typeof updater === "function"
      ? updater(pinnedRef.current)
      : updater;

  pinnedRef.current = next;
  _setPinnedMessages(next);

  if (pinKey) {
    localStorage.setItem(pinKey, JSON.stringify(next));
  }
};




const jumpToDate = (dateString) => {
  if (!dateString || !messages?.length) return;

  const targetTime = new Date(dateString).setHours(0, 0, 0, 0);

  let nearestMessage = null;
  let smallestDiff = Infinity;

  messages.forEach((msg) => {
    if (!msg.createdAt) return;

    const msgTime = new Date(msg.createdAt).setHours(0, 0, 0, 0);
    const diff = Math.abs(msgTime - targetTime);

    if (diff < smallestDiff) {
      smallestDiff = diff;
      nearestMessage = msg;
    }
  });

  if (nearestMessage && messageRefs.current[nearestMessage._id]) {
    const el = messageRefs.current[nearestMessage._id];

    // ✅ CHAT WINDOW ME JUMP
    el.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    // 🔥 HIGHLIGHT ANIMATION
    el.classList.add("jump-highlight");
    setTimeout(() => {
      el.classList.remove("jump-highlight");
    }, 1200);
  }
};









useEffect(() => {
  if (!pinKey) return;

  const savedPins = localStorage.getItem(pinKey);
  if (savedPins) {
    const parsed = JSON.parse(savedPins);
    const now = Date.now();

    const validPins = parsed.filter(
      (p) => !p.expiresAt || p.expiresAt > now
    );

    pinnedRef.current = validPins;
    _setPinnedMessages(validPins);
  }
}, [pinKey]);


useEffect(() => {
  if (!pinKey) return;

  const interval = setInterval(() => {
    const now = Date.now();

    setPinnedMessages((prev) =>
      prev.filter(
        (msg) => !msg.expiresAt || msg.expiresAt > now
      )
    );
  }, 60 * 1000); // ⏱️ har 1 minute check

  return () => clearInterval(interval);
}, [pinKey]);











  const handleFileChange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // 🔴 AUDIO STATE CLEAR (MOST IMPORTANT)
  setAudioFile(null);
  setAudioPreview(null);
  setAudioCaption("");

  // 🔴 CAMERA / OTHER PREVIEW CLEAR
  setShowCamera(false);

  // ✅ FILE SET
  setSelectedFile(file);
  setShowFileMenu(false);

  // ✅ IMAGE / VIDEO PREVIEW
  if (
    file.type.startsWith("image/") ||
    file.type.startsWith("video/")
  ) {
    setFilePreview(URL.createObjectURL(file));
  } else {
    setFilePreview(null);
  }
};



  const handleSendMessage = async () => {
    if (!selectedContact) return;

    setFilePreview(null);

 

    try {
      const formData = new FormData();

      if (replyToMessage?._id) {
  formData.append("replyTo", replyToMessage._id);
}


 // 🔥🔥🔥 STATUS REPLY (THIS WAS MISSING)
  if (replyToStatus) {
  formData.append(
    "replyToStatus",
    JSON.stringify({
      id: replyToStatus.id,
      media: replyToStatus.media,
      contentType: replyToStatus.contentType,
      timestamp: replyToStatus.timestamp,
      owner: {
        _id:
          replyToStatus.user?._id ||
          replyToStatus.owner?._id,
        username:
          replyToStatus.user?.username ||
          replyToStatus.owner?.username,
        profilePicture:
          replyToStatus.user?.profilePicture ||
          replyToStatus.owner?.profilePicture,
      },
    })
  );
}




      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);

      const status = online ? "delivered" : "send";
      formData.append("messageStatus", status);

      if (message?.trim()) {
        formData.append("content", message.trim());
        formData.append("contentType", "text");
      }

      if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name);
      }

      if(!message?.trim() && !selectedFile){
        return;
      }

      await sendMessage(formData);

      setMessage("");
      clearReplyToMessage();
     clearReplyToStatus(); 
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false);
    } catch (error) {
       if (error?.response?.status === 403) {
      setIsBlocked(true);
      setShowUnblockModal(true);
      return;
    }
      console.error("Failed to send message", error);
    }
  };

  const renderDateSeparator = (date) => {
    if (!isValidateDate(date)) return null;

    let dateString;

    if (isToday(date)) dateString = "Today";
    else if (isYesterday(date)) dateString = "Yesterday";
    else dateString = format(date, "EEEE, dd MMM yyyy");

    return (
      <div className="flex justify-center my-4">
        <span
          className={`px-4 py-2 rounded-full text-sm ${
            theme === "dark"
              ? "bg-gray-700 text-gray-300"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {dateString}
        </span>
      </div>
    );
  };


const handleSendAudio = (file) => {
  // 🔥 image/video clear
  setSelectedFile(null);
  setFilePreview(null);

  // 🔥 audio set
  setAudioFile(file);
  setAudioPreview(URL.createObjectURL(file));
  setAudioCaption("");
};





const handleSendAudioMessage = async () => {
  if (!audioFile || !selectedContact) return;

  try {
    const formData = new FormData();

    formData.append("senderId", user._id);
    formData.append("receiverId", selectedContact._id);
    formData.append("media", audioFile);        // 🔥 audio file
    formData.append("content", audioCaption);  // 🔥 caption
    formData.append("contentType", "audio");   // 🔥 IMPORTANT

    await sendMessage(formData);

    // 🧹 CLEANUP
    setAudioPreview(null);
    setAudioFile(null);
    setAudioCaption("");
  } catch (err) {
    console.error("Audio send failed", err);
  }
};







  const groupedMessages = Array.isArray(messages)
    ? messages.reduce((acc, message) => {
        if (!message.createdAt) return acc;

        const date = new Date(message.createdAt);

        if (isValidateDate(date)) {
          const dateString = format(date, "yyyy-MM-dd");

          if (!acc[dateString]) acc[dateString] = [];
          acc[dateString].push(message);
        }

        return acc;
      }, {})
    : {};

  const handleReaction = (messageId, emoji) => {
    addReaction(messageId, emoji);
  };

  if (!selectedContact) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        h-full w-full
        text-center
        px-6
        ${
          theme === "dark"
            ? "bg-[#0b141a]"
            : "bg-[#f0f2f5]"
        }
      `}
    >
      <div className="max-w-md flex flex-col items-center">
        {/* IMAGE */}
        <img
          src={whatsappImage}
          alt="chat-app"
          className="
            w-64
            mb-6
            opacity-90
            select-none
            pointer-events-none
          "
        />

        {/* TITLE */}
        <h2
          className={`
            text-[26px]
            font-semibold
            mb-3
            ${
              theme === "dark"
                ? "text-white"
                : "text-[#111b21]"
            }
          `}
        >
          Select a conversation
        </h2>

        {/* SUB TEXT */}
        <p
          className={`
            text-[14px]
            leading-relaxed
            max-w-sm
            ${
              theme === "dark"
                ? "text-white/60"
                : "text-[#667781]"
            }
          `}
        >
          Choose a contact from the list to start chatting.
        </p>

        {/* ENCRYPTION NOTE */}
        <div
          className={`
            mt-10
            flex items-center gap-2
            text-[12px]
            ${
              theme === "dark"
                ? "text-white/40"
                : "text-[#8696a0]"
            }
          `}
        >
          <FaLock className="text-[13px]" />
          <span>End-to-end encrypted</span>
        </div>
      </div>
    </div>
  );
}


  return (
<>

 <div className="flex w-full flex-1 flex-col h-screen overflow-hidden">

   
   {/* ================= CHAT HEADER ================= */}
<div
  className={`
    sticky top-0 z-40
    flex items-center justify-between
    px-4 py-3
    border-b
    ${
      theme === "dark"
        ? "bg-[#202c33] border-white/10 text-white"
        : "bg-[#f0f2f5] border-black/10 text-[#111b21]"
    }
  `}
>
  {/* LEFT */}
  <div className="flex items-center gap-3 min-w-0">
    {/* BACK */}
    <button
      onClick={() => setSelectedContact(null)}
      className="md:hidden"
    >
      <FaArrowLeft className="text-xl" />
    </button>

    {/* AVATAR */}
    <img
      src={selectedContact?.profilePicture}
      alt={selectedContact?.username}
      className="w-10 h-10 rounded-full object-cover"
    />

    {/* NAME + STATUS */}
    <div className="flex flex-col min-w-0">
      <span className="font-semibold truncate">
        {selectedContact?.isSelf
          ? "Saved Messages"
          : selectedContact?.username}
      </span>

      {!selectedContact?.isSelf && (
        <span
          className={`text-[12px] truncate ${
            theme === "dark"
              ? "text-white/60"
              : "text-[#667781]"
          }`}
        >
          {isTyping
            ? "typing…"
            : online
            ? "online"
            : lastSeen
            ? `last seen ${format(new Date(lastSeen), "HH:mm")}`
            : "offline"}
        </span>
      )}
    </div>
  </div>

  {/* RIGHT ACTIONS */}
  <div className="flex items-center gap-5">
    <button onClick={handleAudioCall}>
      <FaPhone className="text-green-500 text-lg" />
    </button>

    <button onClick={handleVideoCall}>
      <FaVideo className="text-green-500 text-lg" />
    </button>

    <button onClick={() => setShowSearch(true)}>
      <FaSearch className="text-green-500 text-lg" />
    </button>

    {/* MENU */}
    <div className="relative" ref={optionsRef}>
      <button onClick={() => setShowHeaderMenu(p => !p)}>
        <FaEllipsisV className="text-green-500 text-lg" />
      </button>

      {showHeaderMenu && (
  <div
    className={`
      absolute right-0 top-11 z-50
      w-52
      rounded-xl
      shadow-2xl
      border
      overflow-hidden
      ${
        theme === "dark"
          ? "bg-[#233138] text-white border-white/10"
          : "bg-white text-[#111b21] border-black/10"
      }
    `}
  >
    {/* CLEAR CHAT */}
    <button
      onClick={() => {
        setShowClearChatModal(true);
        setShowHeaderMenu(false);
      }}
      className={`
        w-full
        flex items-center gap-3
        px-4 py-2.5
        text-sm
        transition-colors
        ${
          theme === "dark"
            ? "hover:bg-white/10"
            : "hover:bg-black/5"
        }
      `}
    >
      <FaEraser className="text-red-500 text-[14px]" />
      <span>Clear chat</span>
    </button>
  </div>
)}

    </div>
  </div>
</div>



    {conversations.lastMessage ? (
  <p>{conversations.lastMessage.content}</p>
) : (
  <p className="italic opacity-50"></p>
)}




{showBlockModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-[#202c33] w-[380px] rounded-lg p-6">

      <h2 className="text-lg font-semibold mb-2">
        Block {selectedContact.username}?
      </h2>

      <p className="text-sm opacity-70 mb-4">
        This person won't be able to message or call you.
        They won't know you blocked or reported them.
      </p>

      <label className="flex items-center gap-2 mb-4">
        <input type="checkbox" />
        <span className="text-sm">Report to NashApp</span>
      </label>

      <p className="text-xs opacity-60 mb-6">
        The last 5 messages will be sent to NashApp.{" "}
        <a href="/help" className="text-green-500">Learn more</a>
      </p>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => setShowBlockModal(false)}
          className="text-green-600"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            await fetch("/block/block", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                blockUserId: selectedContact._id,
              }),
            });

            setIsBlocked(true);
            setShowBlockModal(false);
          }}
          className="text-red-600 font-medium"
        >
          Block
        </button>
      </div>
    </div>
  </div>
)}




{showDeleteChatModal && (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-[#202c33] w-[360px] rounded-lg p-6">

      <h2 className="text-lg font-semibold mb-2">
        Delete chat with {selectedContact.username}?
      </h2>

      <p className="text-sm opacity-70 mb-6">
        Messages will be removed from all devices.
      </p>

      <div className="flex justify-end gap-4">
        <button
          onClick={() => setShowDeleteChatModal(false)}
          className="text-green-600 font-medium"
        >
          Cancel
        </button>

        <button
          onClick={async () => {
            await deleteChatForMe(conversationId);
            setShowDeleteChatModal(false);
            setSelectedContact(null); // 🔥 CLOSE CHAT WINDOW
          }}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete chat
        </button>
      </div>

    </div>
  </div>
)}





{showClearChatModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[1px]">
    <div
      className={`
        w-[360px]
        rounded-xl
        p-6
        shadow-2xl
        ${
          theme === "dark"
            ? "bg-[#202c33] text-white"
            : "bg-white text-[#111b21]"
        }
      `}
    >
      {/* TITLE */}
      <h2 className="text-[17px] font-semibold mb-2">
        Clear this chat?
      </h2>

      {/* SUB TEXT */}
      <p
        className={`text-[14px] mb-5 ${
          theme === "dark" ? "text-white/60" : "text-black/60"
        }`}
      >
        This chat will be empty but will remain in your chat list.
      </p>

      {/* CHECKBOX */}
      <label className="flex items-center gap-3 mb-6 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={keepStarred}
          onChange={(e) => setKeepStarred(e.target.checked)}
          className="w-4 h-4 accent-[#25D366]"
        />
        <span className="text-[14px]">
          Keep starred messages
        </span>
      </label>

      {/* ACTIONS */}
      <div className="flex justify-end gap-6">
        {/* CANCEL */}
        <button
          onClick={() => {
            setShowClearChatModal(false);
            setKeepStarred(false);
          }}
          className="text-[#25D366] text-[14px] font-medium hover:opacity-80"
        >
          Cancel
        </button>

        {/* CLEAR */}
        <button
          onClick={() => {
            clearChatMessages(keepStarred);
            setShowClearChatModal(false);
            setKeepStarred(false);
          }}
          className="text-red-500 text-[14px] font-medium hover:opacity-80"
        >
          Clear chat
        </button>
      </div>
    </div>
  </div>
)}





{showSearch && (
  <div
    className={`
      fixed inset-0 z-50 flex flex-col
      ${theme === "dark" ? "bg-[#0b141a] text-white" : "bg-[#efeae2] text-[#111b21]"}
    `}
  >
    {/* ================= HEADER ================= */}
    <div
      className={`
        flex items-center gap-3 px-4 py-3
        border-b
        ${theme === "dark" ? "border-white/10 bg-[#202c33]" : "border-black/10 bg-[#f0f2f5]"}
      `}
    >
      <button
        onClick={() => setShowSearch(false)}
        className="p-1 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
      >
        <RxCross2 className="text-[18px]" />
      </button>

      <h2 className="font-semibold text-[16px]">
        Search messages
      </h2>
    </div>

    {/* ================= DATE PICKER ================= */}
    <div
      className={`
        px-4 py-3 border-b
        ${theme === "dark" ? "border-white/10" : "border-black/10"}
      `}
    >
      <input
        type="date"
        className={`
          w-full px-3 py-2 rounded-lg text-[14px] outline-none
          ${theme === "dark"
            ? "bg-[#202c33] text-white"
            : "bg-white text-black border border-black/10"}
        `}
        onChange={(e) => {
          jumpToDate(e.target.value);
          setShowSearch(false);
        }}
      />
    </div>

    {/* ================= SEARCH INPUT ================= */}
    <div className="px-4 pt-4">
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full
          ${theme === "dark" ? "bg-[#202c33]" : "bg-white border border-black/10"}
        `}
      >
        <FaSearch
          className={`text-[14px] ${theme === "dark" ? "text-white/50" : "text-black/50"}`}
        />

        <input
          type="text"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search messages"
          className={`
            flex-1 bg-transparent outline-none text-[14px]
            ${theme === "dark" ? "text-white" : "text-black"}
          `}
        />

        {searchText && (
          <button onClick={() => setSearchText("")}>
            <RxCross2
              className={`text-[16px] ${theme === "dark" ? "text-white/60" : "text-black/60"}`}
            />
          </button>
        )}
      </div>
    </div>

    {/* ================= RESULTS ================= */}
    <div
  className="
    flex-1
    overflow-y-auto
    px-4 pt-3
    pb-[88px]
  "
>

      {searchText && searchResults.length === 0 && (
        <p className="text-center text-[14px] opacity-60 mt-10">
          No message found
        </p>
      )}

      {searchResults.map((msg) => (
        <div
          key={msg._id}
          onClick={() => {
            messageRefs.current[msg._id]?.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
            setShowSearch(false);
            setSearchText("");
          }}
          className={`
            px-3 py-2 cursor-pointer rounded-md mb-1
            transition-colors
            ${theme === "dark"
              ? "hover:bg-white/5"
              : "hover:bg-black/5"}
          `}
        >
          <p className="text-[14px] truncate">
            {msg.content}
          </p>

          <span className="text-[11px] opacity-60">
            {format(new Date(msg.createdAt), "dd MMM yyyy, HH:mm")}
          </span>
        </div>
      ))}
    </div>
  </div>
)}



{showUnblockModal && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div className="bg-white dark:bg-[#202c33] p-6 rounded-lg w-80">

      <h2 className="font-semibold mb-4">
        Unblock {selectedContact.username}?
      </h2>

      <div className="flex justify-end gap-4">
        <button onClick={() => setShowUnblockModal(false)}>
          Cancel
        </button>

        <button
          onClick={async () => {
            await fetch("/block/unblock", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                unblockUserId: selectedContact._id,
              }),
            });

            setIsBlocked(false);
            setShowUnblockModal(false);
          }}
          className="text-green-600"
        >
          Unblock
        </button>
      </div>
    </div>
  </div>
)}




   {selectedContact && pinnedMessages.length > 0 && (
  <PinnedBar
    pinnedMessages={pinnedMessages}
    messageRefs={messageRefs}
    setPinnedMessages={setPinnedMessages}
  />
)}



    {/* MESSAGES */}
   <div
  className={`
    flex-1
    overflow-y-auto
    px-3 sm:px-4
    py-4
    pb-[160px]
    pb-[calc(96px+env(safe-area-inset-bottom))]
    space-y-1
    ${
      theme === "dark"
        ? "bg-[#0b141a]"
        : "bg-[#efeae2]"
    }
  `}
>

  {Object.entries(groupedMessages).map(([date, msgs]) => (
    <React.Fragment key={date}>
      {renderDateSeparator(new Date(date))}

      {msgs
        .filter((msg) => msg.conversation)
        .map((msg) => (
          <MessageBubble
            key={msg._id || msg.tempId}
            message={msg}
            theme={theme}
            currentUser={user}
            selectedMessages={selectedMessages}
            setSelectedMessages={setSelectedMessages}
            onReaction={handleReaction}
            setInfoMessage={setInfoMessage}
            deleteMessage={deleteMessage}
            deleteMessageForEveryone={deleteMessageForEveryone}
            setSelectedPinMessage={setSelectedPinMessage}
            setShowPinModal={setShowPinModal}
            openStatusPreview={({ statusId, ownerId }) => {
              navigate("/status", {
                state: {
                  fromChat: true,
                  statusId,
                  ownerId,
                },
              });
            }}
            messageRef={(el) => {
              if (el) messageRefs.current[msg._id] = el;
            }}
            onReplyClick={(replyId) => {
              const target = messageRefs.current[replyId];
              if (target) {
                target.scrollIntoView({
                  behavior: "smooth",
                  block: "center",
                });

                // WhatsApp-like highlight
                target.classList.add("reply-jump");
                setTimeout(() => {
                  target.classList.remove("reply-jump");
                }, 900);
              }
            }}
          />
        ))}
    </React.Fragment>
  ))}

  <div ref={messageEndRef} />
</div>

    
{filePreview && (
  <div
    className={`
      relative
      mx-auto
      my-2
      max-w-[320px]
      rounded-xl
      overflow-hidden
      shadow-lg
      ${
        theme === "dark"
          ? "bg-[#202c33]"
          : "bg-white"
      }
    `}
  >
    {/* MEDIA */}
    {selectedFile?.type.startsWith("video/") ? (
      <video
        src={filePreview}
        controls
        className="
          w-full
          max-h-[360px]
          object-cover
          bg-black
        "
      />
    ) : (
      <img
        src={filePreview}
        alt="preview"
        className="
          w-full
          max-h-[360px]
          object-cover
        "
      />
    )}

    {/* ❌ CLOSE BUTTON (WHATSAPP STYLE) */}
    <button
      onClick={() => {
        setSelectedFile(null);
        setFilePreview(null);
      }}
      className="
        absolute top-2 right-2
        w-7 h-7
        flex items-center justify-center
        rounded-full
        bg-black/60
        hover:bg-black/80
        text-white
        transition
      "
    >
      <FaTimes size={14} />
    </button>
  </div>
)}


{audioPreview && audioFile && (
  <div
    className={`
      fixed bottom-[64px] left-0 right-0 z-50
      px-3 py-3
      border-t
      ${
        theme === "dark"
          ? "bg-[#202c33] border-white/10"
          : "bg-white border-black/10"
      }
    `}
  >
    {/* AUDIO PLAYER */}
    <div className="max-w-3xl mx-auto">
      <audio
        controls
        className="w-full rounded-lg mb-3"
      >
        <source src={audioPreview} type="audio/webm" />
      </audio>

      {/* CAPTION + ACTIONS */}
      <div className="flex items-center gap-2">
        {/* CAPTION INPUT */}
        <input
          type="text"
          value={audioCaption}
          onChange={(e) => setAudioCaption(e.target.value)}
          placeholder="Add a caption…"
          className={`
            flex-1
            px-4 py-2
            rounded-full
            text-sm
            outline-none
            ${
              theme === "dark"
                ? "bg-[#2a3942] text-white placeholder:text-white/50"
                : "bg-[#f0f2f5] text-black placeholder:text-black/50"
            }
          `}
        />

        {/* CANCEL */}
        <button
          onClick={() => {
            setAudioPreview(null);
            setAudioFile(null);
            setAudioCaption("");
          }}
          className={`
            px-4 py-2
            rounded-full
            text-sm font-medium
            ${
              theme === "dark"
                ? "text-red-400 hover:bg-white/10"
                : "text-red-500 hover:bg-black/5"
            }
          `}
        >
          Cancel
        </button>

        {/* SEND */}
        <button
          onClick={handleSendAudioMessage}
          className="
            px-5 py-2
            rounded-full
            text-sm font-semibold
            bg-[#25D366]
            text-white
            hover:brightness-110
            transition
          "
        >
          Send
        </button>
      </div>
    </div>
  </div>
)}



{infoMessage && (
  <MessageInfo
    message={infoMessage}
    onClose={() => setInfoMessage(null)}
  />
)}


{/* ================= SELECT MODE BOTTOM BAR ================= */}
{selectedMessages.length > 0 && (
  <div
    className={`
      fixed bottom-0 left-0 right-0 z-50
      flex items-center justify-between
      px-4 py-3
      border-t
      ${
        theme === "dark"
          ? "bg-[#202c33] text-white border-white/10"
          : "bg-white text-[#111b21] border-black/10"
      }
    `}
  >
    {/* ===== LEFT SIDE ===== */}
    <div className="flex items-center gap-4">
      {/* ❌ CANCEL SELECTION */}
      <button
        onClick={() => setSelectedMessages([])}
        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        title="Cancel selection"
      >
        <FaTimes size={18} />
      </button>

      {/* COUNT */}
      <span className="text-sm font-medium">
        {selectedMessages.length} selected
      </span>
    </div>

    {/* ===== RIGHT SIDE ACTIONS ===== */}
    <div className="flex items-center gap-5">
      {/* 📋 COPY – ONLY TEXT */}
      {selectedMessages.every(m => m.contentType === "text") && (
        <button
          onClick={() => {
            const text = selectedMessages
              .map(m => m.content)
              .join("\n");
            navigator.clipboard.writeText(text);
            setSelectedMessages([]);
          }}
          className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          title="Copy"
        >
          <FaCopy size={18} />
        </button>
      )}

      {/* ⭐ STAR */}
      <button
        onClick={() => {
          selectedMessages.forEach(m =>
            toggleStarMessage(m._id)
          );
          setSelectedMessages([]);
        }}
        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        title="Star"
      >
        <FaStar size={18} className="text-yellow-400" />
      </button>

      {/* 🗑 DELETE */}
      <button
        onClick={() => setShowDeleteConfirm(true)}
        className="p-2 rounded-full hover:bg-red-500/10 text-red-500"
        title="Delete"
      >
        <FaTrash size={18} />
      </button>

      {/* ↪️ FORWARD */}
      <button
        onClick={() => {
          selectedMessages.forEach(m =>
            openForward(m)
          );
          setSelectedMessages([]);
        }}
        className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
        title="Forward"
      >
        <FaShare size={18} />
      </button>

      {/* ⬇️ DOWNLOAD – ONLY MEDIA */}
      {selectedMessages.every(m =>
        ["image", "video", "audio"].includes(m.contentType)
      ) && (
        <button
          onClick={() => {
            selectedMessages.forEach(m => {
              const link = document.createElement("a");
              link.href = m.imageOrVideoUrl;
              link.download = "media";
              link.click();
            });
            setSelectedMessages([]);
          }}
          className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10"
          title="Download"
        >
          <FaDownload size={18} />
        </button>
      )}
    </div>
  </div>
)}


{/* ================= CHAT FOOTER ================= */}
<div
  className={`
    fixed bottom-0 left-0 right-0 z-40
    px-0.5 sm:px-2 md:px-3
    py-1 sm:py-2
    flex items-center gap-0.5 sm:gap-1
    border-t
    ${theme === "dark"
      ? "bg-[#202c33] border-white/10"
      : "bg-white border-black/10"}
    pb-[env(safe-area-inset-bottom)]
  `}
>
  {/* 😀 EMOJI */}
  <button
    onClick={() => setShowEmojiPicker(p => !p)}
    className="p-1.5 sm:p-2 flex-shrink-0"
  >
    <FaSmile
      className={`
        h-4 w-4
        sm:h-5 sm:w-5
        ${theme === "dark" ? "text-gray-300" : "text-gray-600"}
      `}
    />
  </button>

  {/* 📎 ATTACH */}
  <button
    onClick={() => setShowFileMenu(p => !p)}
    className="p-1.5 sm:p-2 flex-shrink-0"
  >
    <FaPaperclip
      className={`
        h-4 w-4
        sm:h-5 sm:w-5
        ${theme === "dark" ? "text-gray-400" : "text-gray-500"}
      `}
    />
  </button>

  {/* 📷 CAMERA */}
  <button
    onClick={() => setShowCamera(true)}
    className="p-1.5 sm:p-2 flex-shrink-0"
  >
    <FaCamera
      className={`
        h-4 w-4
        sm:h-5 sm:w-5
        ${theme === "dark" ? "text-gray-300" : "text-gray-600"}
      `}
    />
  </button>

  {/* 📝 INPUT + MIC */}
  <div
    className={`
      flex items-center flex-1
      px-2 sm:px-3 md:px-4
      py-1.5 sm:py-2
      
      rounded-full
      ${theme === "dark"
        ? "bg-[#2a3942]"
        : "bg-[#f0f2f5]"}
    `}
  >
    <input
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && message.trim()) {
          handleSendMessage();
        }
      }}
      placeholder="Type a message"
      className={`
        flex-1 bg-transparent outline-none
        text-xs sm:text-sm md:text-base
        ${theme === "dark" ? "text-white" : "text-black"}
      `}
    />

    {/* 🎤 MIC */}
    <div className="ml-1 sm:ml-2 flex-shrink-0">
      <VoiceRecorder onSendAudio={handleSendAudio} />
    </div>
  </div>

  {/* ➤ SEND */}
  <button
    onClick={handleSendMessage}
    className="p-1.5 sm:p-2 flex-shrink-0"
  >
    <FaPaperPlane className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
  </button>
</div>







{showDeleteConfirm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div
      className={`
        w-[320px] rounded-xl p-5 shadow-xl
        ${
          theme === "dark"
            ? "bg-[#202c33] text-white"
            : "bg-white text-[#111b21]"
        }
      `}
    >
      {/* TITLE */}
      <h2 className="text-base font-semibold mb-2">
        Delete message?
      </h2>

      {/* SUB TEXT (WhatsApp style) */}
      <p className="text-sm opacity-70 mb-6">
        This message will be deleted only for you.
      </p>

      {/* ACTIONS */}
      <div className="flex justify-end gap-6">
        {/* CANCEL */}
        <button
          onClick={() => setShowDeleteConfirm(false)}
          className="
            flex items-center gap-2
            text-sm font-medium
            text-green-500
            hover:opacity-80
          "
        >
          <FaTimes size={14} />
          Cancel
        </button>

        {/* DELETE */}
        <button
          onClick={() => {
            selectedMessages.forEach(m =>
              deleteMessage(m._id)
            );
            setSelectedMessages([]);
            setShowDeleteConfirm(false);
          }}
          className="
            flex items-center gap-2
            text-sm font-medium
            text-red-500
            hover:opacity-80
          "
        >
          <FaTrash size={14} />
          Delete
        </button>
      </div>
    </div>
  </div>
)}





{showPinModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
    <div
      className={`
        w-[320px] rounded-xl p-5 shadow-xl
        ${
          theme === "dark"
            ? "bg-[#202c33] text-white"
            : "bg-white text-[#111b21]"
        }
      `}
    >
      {/* HEADER */}
      <h2 className="text-base font-semibold mb-1">
        Choose how long to pin
      </h2>

      <p className="text-sm opacity-70 mb-4">
        You can unpin this message at any time.
      </p>

      {/* OPTIONS */}
      <div className="flex flex-col gap-3 mb-5">
        {[24, 7, 30].map((d) => (
          <label
            key={d}
            className="
              flex items-center gap-3 cursor-pointer
              text-sm
            "
          >
            <input
              type="radio"
              name="pinDuration"
              checked={pinDuration === d}
              onChange={() => setPinDuration(d)}
              className="accent-[#25D366]"
            />
            <span>
              {d === 24 ? "24 hours" : `${d} days`}
            </span>
          </label>
        ))}
      </div>

      {/* ACTIONS */}
      <div className="flex justify-end gap-6">
        {/* CANCEL */}
        <button
          onClick={() => setShowPinModal(false)}
          className="
            flex items-center gap-2
            text-sm font-medium
            text-green-500
            hover:opacity-80
          "
        >
          <FaTimes size={14} />
          Cancel
        </button>

        {/* PIN */}
        <button
          onClick={() => {
            if (!selectedPinMessage?._id) return;

            const durationMs =
              pinDuration === 24
                ? 24 * 60 * 60 * 1000
                : pinDuration === 7
                ? 7 * 24 * 60 * 60 * 1000
                : 30 * 24 * 60 * 60 * 1000;

            const expiresAt = Date.now() + durationMs;

            setPinnedMessages((prev) => {
              const alreadyPinned = prev.some(
                (m) => m._id === selectedPinMessage._id
              );
              if (alreadyPinned) return prev;

              return [
                ...prev,
                {
                  ...selectedPinMessage,
                  pinnedAt: Date.now(),
                  expiresAt,
                },
              ];
            });

            setShowPinModal(false);
          }}
          className="
            flex items-center gap-2
            text-sm font-medium
            text-green-600
            hover:opacity-80
          "
        >
          <FaThumbtack size={14} />
          Pin
        </button>
      </div>
    </div>
  </div>
)}













 {replyToMessage && (
  <div
   className={`
      fixed
      bottom-[64px]  /* 👈 footer ki height */
      left-0 right-0
      z-50
      px-3 py-2
      flex items-center justify-between
      border-l-[3px]
      ${
        theme === "dark"
          ? "bg-[#202c33] border-[#25D366] text-white"
          : "bg-[#f0f2f5] border-[#25D366] text-[#111b21]"
      }
    `}
  >
    {/* LEFT */}
    <div className="flex flex-col min-w-0 text-sm">
      <span className="font-medium text-[#25D366] leading-tight">
        {replyToMessage.sender?._id === user._id
          ? "You"
          : replyToMessage.sender?.username}
      </span>

      <span className="flex items-center gap-1 truncate max-w-[240px] opacity-80 text-[13px]">
        {replyToMessage.contentType === "image" && (
          <>
            <FaImage size={13} />
            Photo
          </>
        )}
        {replyToMessage.contentType === "video" && (
          <>
            <FaVideo size={13} />
            Video
          </>
        )}
        {replyToMessage.contentType === "location" && (
          <>
            <FaMapMarkerAlt size={13} />
            Location
          </>
        )}
        {replyToMessage.contentType === "poll" && (
          <>
            <FaPoll size={13} />
            Poll
          </>
        )}
        {replyToMessage.contentType === "audio" && (
          <>
            <FaMicrophone size={13} />
            Voice message
          </>
        )}
        {replyToMessage.contentType === "text" &&
          replyToMessage.content}
      </span>
    </div>

    {/* CLOSE */}
    <button
      onClick={clearReplyToMessage}
      className="
        ml-3 p-1 rounded-full
        text-gray-400
        hover:bg-black/10 dark:hover:bg-white/10
        hover:text-red-500
        transition-colors
      "
    >
      <FaTimes size={14} />
    </button>
  </div>
)}









<div
  // className={`p-4  ${
  //   theme === "dark" ? "bg-[#303430]" : "bg-white"
  // } flex items-center gap-2  relative`}
>
  {/* <button
    className="focus:outline-none p-2 flex-shrink-0"
    onClick={() =>
      setShowEmojiPicker(!showEmojiPicker)
    }
  >
    <FaSmile
      className={`h-6 w-6 ${
        theme === "dark"
          ? "text-gray-300"
          : "text-gray-600"
      }`}
    />
  </button> */}

  {showEmojiPicker && (
    <div
      ref={emojiContainerRef}
      className="absolute left-0 bottom-16 z-50"
    >
      <EmojiPicker
      onEmojiClick={(emojiObject)=>{
        setMessage((prev) => prev +emojiObject.emoji)
        setShowEmojiPicker(false)
      }}

      theme={theme}
      />
    </div>
  )}


<div className="relative">
  {/* <button className="focus:outline-none p-2 flex-shrink-0 sm:block"
  onClick={()=> setShowFileMenu(!showFileMenu)}
  >

    <FaPaperclip className={`h-6 w-6 mr-2 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}mt-2`}/>


  </button> */}

  {showLiveLocationMenu && (
  <div className="absolute bottom-full left-40 mb-2 bg-white dark:bg-[#303430] rounded-lg shadow-lg z-50">
    {[15, 60, 480].map((min) => (
      <button
        key={min}
        onClick={() => handleSendLiveLocation(min)}
        className="px-4 py-2 w-full hover:bg-black/10"
      >
        Share for {min === 480 ? "8 hours" : `${min} minutes`}
      </button>
    ))}
  </div>
)}

{showFileMenu && (
  <div
    ref={fileMenuRef}
    onClick={(e) => e.stopPropagation()}
    className={`
      absolute bottom-14 left-2 z-50
      w-56
      rounded-xl
      shadow-2xl
      border
      overflow-hidden
      ${
        theme === "dark"
          ? "bg-[#233138] border-white/10 text-white"
          : "bg-white border-black/10 text-[#111b21]"
      }
    `}
  >
    {/* FILE INPUT */}
    <input
      type="file"
      onChange={handleFileChange}
      accept="image/*,video/*"
      className="hidden"
      ref={fileInputRef}
    />

    {/* SCROLL SAFE */}
    <div className="max-h-[280px] overflow-y-auto">

      {/* IMAGE / VIDEO */}
      <button
        onClick={() => fileInputRef.current.click()}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5"
      >
        <FaImage className="text-blue-400 text-lg" />
        <span>Photos & Videos</span>
      </button>

      {/* DOCUMENT */}
      <button
        onClick={() => fileInputRef.current.click()}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5"
      >
        <FaFile className="text-purple-400 text-lg" />
        <span>Documents</span>
      </button>

      <div className="h-px bg-black/10 dark:bg-white/10 my-1" />

      {/* CURRENT LOCATION */}
      <button
        onClick={handleSendCurrentLocation}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5"
      >
        <FaMapMarkerAlt className="text-green-500 text-lg" />
        <span>Current location</span>
      </button>

      {/* LIVE LOCATION */}
      <button
        onClick={() => setShowLiveLocationMenu(true)}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5"
      >
        <FaClock className="text-blue-500 text-lg" />
        <span>Live location</span>
      </button>

      <div className="h-px bg-black/10 dark:bg-white/10 my-1" />

      {/* POLL */}
      <button
        onClick={() => {
          setShowFileMenu(false);
          setShowPollModal(true);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-black/5 dark:hover:bg-white/5"
      >
        <FaPoll className="text-pink-500 text-lg" />
        <span>Poll</span>
      </button>

    </div>
  </div>
)}



{/* <button
  onClick={() => setShowCamera(true)}
  className="focus:outline-none p-2 flex-shrink-0  sm:block"
>
  <FaCamera
    className={`h-6 w-6 ${
      theme === "dark" ? "text-gray-300" : "text-gray-600"
    }`}
  />
</button> */}

</div>


{/* <button
  className="focus:outline-none p-2 flex-shrink-0"
  onClick={() => setShowEmojiPicker((p) => !p)}
>
  <FaSmile
    className={`h-6 w-6  ${
      theme === "dark"
        ? "text-gray-300"
        : "text-gray-600"
    }`}
  />
</button>


<button className="focus:outline-none p-2 flex-shrink-0 sm:block"
  onClick={()=> setShowFileMenu(!showFileMenu)}
  >

    <FaPaperclip className={`h-6 w-6 mr-0 ${theme === 'dark' ? "text-gray-400" : "text-gray-500"}mt-2`}/>


  </button>

<button
  onClick={() => setShowCamera(true)}
  className="focus:outline-none p-2 flex-shrink-0  sm:block"
>
  <FaCamera
    className={`h-6 w-6 ${
      theme === "dark" ? "text-gray-300" : "text-gray-600"
    }`}
  />
</button> */}


{/* <input
  type="text"
  value={message}
  onChange={(e) => setMessage(e.target.value)}
  onKeyPress={(e) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  }}
  placeholder="Type a message"
  className={`flex-grow px-4 py-2 border rounded-full focus:ring-2 focus:ring-green-500 ${
    theme === "dark"
      ? "text-white border-gray-600 bg-gray-700"
      : "text-black border-gray-300 bg-white"
  }`}
/>


<VoiceRecorder onSendAudio={handleSendAudio} />

<button onClick={handleSendMessage} className="focus:outline-none">
  <FaPaperPlane className="h-6 w-6 text-green-500"/>


</button> */}


{/* {isBlocked ? (
  // 🔒 BLOCKED STATE
  <div className="w-full flex justify-center gap-6 text-sm text-gray-400">
    <button
      onClick={() => setShowDeleteChatModal(true)}
      className="text-red-500"
    >
      Delete chat
    </button>

    <button
      onClick={() => setShowUnblockModal(true)}
      className="text-green-500"
    >
      Unblock
    </button>
  </div>
) : (
  // ✅ NORMAL CHAT INPUT (TERA PURANA CODE)
  <>
    <input
      type="text"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === "Enter") {
          handleSendMessage();
        }
      }}
      placeholder="Type a message"
      className={`flex-grow px-4 py-2 border rounded-full focus:ring-2 focus:ring-green-500 ${
        theme === "dark"
          ? "text-white border-gray-600 bg-gray-700"
          : "text-black border-gray-300 bg-white"
      }`}
    />

    <VoiceRecorder onSendAudio={handleSendAudio} />

    <button onClick={handleSendMessage} className="focus:outline-none p-2 flex-shrink-0">
      <FaPaperPlane className="h-6 w-6 text-green-500" />
    </button>
  </>
)} */}




{showCamera && (
  <CameraModal className="focus:outline-none p-2 ml-4"
    onClose={() => setShowCamera(false)}
    onCapture={(file) => {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setShowCamera(false);
    }}
  />
)}


</div>

      


    

  


  </div>

  {/* <VideoCallManager socket={socket} /> */}
  {/* <AudioCallManager socket={socket} />
  <AudioCallModal socket={socket} /> */}

  
  
  
  </>
);
};
export default ChatWindow;
