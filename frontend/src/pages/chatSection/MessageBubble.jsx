import React, { useRef, useState, useEffect  } from "react";
import { FaCheck, FaCheckDouble, FaDownload, FaForward, FaInfoCircle, FaPlus, FaRegCopy, FaShare, FaSmile, FaThumbtack } from "react-icons/fa";
import { HiDotsVertical } from "react-icons/hi";
import { RxCross2 } from "react-icons/rx";
import { format } from "date-fns";
import EmojiPicker from "emoji-picker-react";
import useOutsideClick from "../../hooks/useOutsideclick";
import axiosInstance from "../../services/url.service";
import ViewVotesModal from "../../components/ViewVotesModal.jsx";
import { getSocket } from "../../services/chat.service";


import { useChatStore } from "../../store/chatStore";
import { FaReply } from "react-icons/fa";
import { useForwardStore } from "../../store/useForwardStore";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FaStar, FaRegStar } from "react-icons/fa";

import {
  FaPhoneAlt,
  FaPhoneSlash,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

import {
  FaImage,
  FaVideo,
  FaMicrophone,
  FaMapMarkerAlt,
  FaMapMarkedAlt,
  FaPoll,
   FaBroadcastTower,
} from "react-icons/fa";
import { MdDeleteForever, MdOutlineCheckCircle, MdOutlineDelete } from "react-icons/md";




const MessageBubble = ({
  message,
  theme,
  onReaction,
  currentUser,
  deleteMessage,
 deleteMessageForEveryone,
  setSelectedPinMessage,
  selectedMessages,
  setSelectedMessages,
  setShowPinModal,
    setInfoMessage, 
 messageRef,
 onReplyClick,
   openStatusPreview  

}) => {
  const setReplyToMessage = useChatStore(
  (state) => state.setReplyToMessage
);

  const [showReactions, setShowReactions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  
  



  const [audioPreview, setAudioPreview] = useState(null);
const [audioFile, setAudioFile] = useState(null);
const [audioCaption, setAudioCaption] = useState("");
const [reactionAction, setReactionAction] = useState(null);
// { reaction, index }


  const reactionsRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const optionsRef = useRef(null);

  const [showVotes, setShowVotes] = useState(false);

  const longPressTimer = useRef(null);
const navigate = useNavigate();


const { openForward } = useForwardStore();

const isSelfChat =
  message?.conversation?.isSelf === true ||
  message?.sender?._id === message?.receiver?._id;


  const isSelected = selectedMessages?.some(
  (m) => m._id === message._id
);


const isCall = message.contentType === "call";

const isOutgoingCall =
  isCall && message.sender === currentUser._id;

const isIncomingCall =
  isCall && message.receiver === currentUser._id;




const isOutgoing =
  message.contentType === "call"
    ? message.visibleTo?.[0] === currentUser._id
    : message.sender._id === currentUser._id;


    const isReactionMine = (reaction, currentUser) => {
  if (!reaction?.user || !currentUser?._id) return false;

  // user can be ObjectId OR populated object
  if (typeof reaction.user === "string") {
    return reaction.user === currentUser._id;
  }

  return reaction.user._id === currentUser._id;
};





  const isUserMessage =
    message?.sender?._id === currentUser?._id;

  const bubbleClass = isUserMessage ? "chat-end" : "chat-start";

 const bubbleContentClass = isUserMessage
  ? `
    chat-bubble
    max-w-[75%] md:max-w-[50%]
    min-w-[80px]
    px-3 py-2
    break-words
    relative
    rounded-2xl rounded-br-sm
    shadow-sm
    ${theme === "dark"
      ? "bg-[#005c4b] text-white"
      : "bg-[#dcf8c6] text-black"}
  `
  : `
    chat-bubble
    max-w-[75%] md:max-w-[50%]
    min-w-[80px]
    px-3 py-2
    break-words
    relative
    rounded-2xl rounded-bl-sm
    shadow-sm
    ${theme === "dark"
      ? "bg-[#202c33] text-white"
      : "bg-white text-black"}
  `;




  const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

  const reactingRef = useRef(false);

const handleReact = (emoji) => {
  if (reactingRef.current) return; // 🔒 block spam
  reactingRef.current = true;

  onReaction(message._id, emoji);

  setTimeout(() => {
    reactingRef.current = false;
  }, 300); // 👈 WhatsApp jaisa debounce

  setShowReactions(false);
  setShowEmojiPicker(false);
};




  // 🔥 SAFETY FIX: replyToStatus string → object
const replyToStatus = useMemo(() => {
  if (!message?.replyToStatus) return null;

  try {
    return typeof message.replyToStatus === "string"
      ? JSON.parse(message.replyToStatus)
      : message.replyToStatus;
  } catch {
    return null;
  }
}, [message.replyToStatus]);




  const getRemainingTime = (expiresAt) => {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `${minutes}m ${seconds}s left`;
};

const toggleStarMessage = useChatStore(
  (state) => state.toggleStarMessage
);


const getVoteUsers = (votes = []) => {
  return votes.filter(
    (v) =>
      v &&
      typeof v === "object" &&
      v._id &&
      v.profilePicture
  );
};



const formatCallDuration = (seconds = 0) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};


const startLongPress = () => {
  // agar already selection mode hai → kuch mat karo
  if (selectedMessages.length > 0) return;

  longPressTimer.current = setTimeout(() => {
    setSelectedMessages([message]); // 🔥 select start
  }, 400); // ⏱️ 400ms = WhatsApp feel
};

const cancelLongPress = () => {
  if (longPressTimer.current) {
    clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
  }
};




const [mediaDuration, setMediaDuration] = useState(null);
useEffect(() => {
  if (
    message?.replyTo &&
    (message.replyTo.contentType === "audio" ||
     message.replyTo.contentType === "video") &&
    message.replyTo.imageOrVideoUrl
  ) {
    const media = document.createElement(
      message.replyTo.contentType === "audio" ? "audio" : "video"
    );

    media.src = message.replyTo.imageOrVideoUrl;
    media.preload = "metadata";

    media.onloadedmetadata = () => {
      const totalSeconds = Math.floor(media.duration || 0);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;

      setMediaDuration(
        `${minutes}:${seconds.toString().padStart(2, "0")}`
      );
    };
  }
}, [message]);






useOutsideClick(reactionsRef, () => {
  if (reactionAction) setReactionAction(null);
});




const [liveTimeLeft, setLiveTimeLeft] = useState(null);

useEffect(() => {
  if (
    message?.replyTo?.contentType !== "location" ||
    !message.replyTo.location?.isLive
  ) return;

  const update = () => {
    const diff =
      new Date(message.replyTo.location.expiresAt).getTime() - Date.now();

    if (diff <= 0) {
      setLiveTimeLeft("ended");
      return;
    }

    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    setLiveTimeLeft(`${m}m ${s.toString().padStart(2, "0")}s`);
  };

  update();
  const i = setInterval(update, 1000);
  return () => clearInterval(i);
}, [
  message?.replyTo?._id,
  message?.replyTo?.location?.expiresAt,
]);








const [, forceUpdate] = useState(0);

useEffect(() => {
  if (message?.location?.isLive) {
    const interval = setInterval(() => {
      forceUpdate(v => v + 1);
    }, 1000);

    return () => clearInterval(interval);
  }
}, [message]);


const handleCopy = async () => {
  try {
    // TEXT
    if (message.contentType === "text") {
      await navigator.clipboard.writeText(message.content);
    }

    // IMAGE / VIDEO
    else if (
      message.contentType === "image" ||
      message.contentType === "video"
    ) {
      const response = await fetch(message.imageOrVideoUrl);
      const blob = await response.blob();

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob }),
        ]);
      } else {
        throw new Error("Clipboard not supported");
      }
    }

    setShowOptions(false);
  } catch (err) {
    alert("Copy not supported. Please use Download.");
  }
};


  

  useOutsideClick(emojiPickerRef, () => {
    if(showEmojiPicker) setShowEmojiPicker(false)
  })

  useOutsideClick(reactionsRef, () => {
    if(showReactions) setShowReactions(false)
  })

  useOutsideClick(optionsRef, () => {
    if(showOptions) setShowOptions(false)
  })

if (!message) return null;


 return (
<div
  ref={messageRef}
  data-message-id={message._id}
  className={`
    chat
    ${bubbleClass}
    px-2
    py-[2px]
    relative   👈🔥 YE MOST IMPORTANT HAI
    transition-colors
    last:mb-[96px] 
    last:pb-[env(safe-area-inset-bottom)]
    ${
      isSelected
        ? theme === "dark"
          ? "bg-[#005c4b]/20"
          : "bg-black/5"
        : ""
    }
  `}






  /* 🟢 MOBILE LONG PRESS */
  onTouchStart={startLongPress}
  onTouchEnd={cancelLongPress}
  onTouchMove={cancelLongPress}


  onClick={() => {
    if (selectedMessages.length > 0) {
      setSelectedMessages((prev) =>
        isSelected
          ? prev.filter((m) => m._id !== message._id)
          : [...prev, message]
      );
    }
  }}
>

<div
  className={`
    relative group
    ${bubbleContentClass}
px-[6px]
pt-[6px]
pb-[6px]

    
  `}
>
  {/* 🔁 FORWARDED LABEL (WhatsApp style) */}
 {message.isForwarded && (
  <div
    className={`
      flex items-center gap-1
      text-[11px]
      mb-1
      italic
      tracking-wide
      select-none
      ${
        theme === "dark"
          ? "text-white/40"
          : "text-black/40"
      }
    `}
  >
    <FaShare size={10} className="opacity-80" />
    <span>Forwarded</span>
  </div>
)}


  {/* ☑️ SELECTION CHECKBOX (WhatsApp style) */}
 {selectedMessages.length > 0 && (
  <div className="absolute top-1 right-1 z-30">
    <div
      className={`
        flex items-center justify-center
        w-6 h-6
        rounded-full
        backdrop-blur-sm
        transition-all duration-150
        active:scale-95
        ${
          theme === "dark"
            ? "bg-black/50"
            : "bg-white/90 shadow-md"
        }
      `}
    >
      <input
        type="checkbox"
        checked={isSelected}
        readOnly
        className="
          w-4 h-4
          cursor-pointer
          accent-[#25D366]
        "
      />
    </div>
  </div>
)}











{message?.reactions?.length > 0 && (
  <div
    className={`
      absolute -bottom-3 z-20
      flex items-center gap-1
      ${isUserMessage ? "right-3" : "left-3"}
    `}
  >
    {message.reactions.map((reaction, i) => {
      const emojis = reaction.emoji ? [reaction.emoji] : [];

      return (
        <button
          key={i}
          onClick={(e) => {
            e.stopPropagation();
            setReactionAction({ reaction, index: i });
          }}
          className={`
            flex items-center gap-1
            px-2 py-[2px]
            rounded-full
            text-[12px] leading-none
            shadow-md
            backdrop-blur-sm
            transition-all duration-150
            active:scale-95
            ${
              theme === "dark"
                ? "bg-[#202c33]/90 text-white"
                : "bg-white/95 text-gray-800 border border-black/5"
            }
          `}
        >
          {emojis.map((emo, idx) => (
            <span
              key={idx}
              className="leading-none select-none"
            >
              {emo}
            </span>
          ))}
        </button>
      );
    })}
  </div>
)}



{reactionAction && (
  <div
    ref={reactionsRef}
    className={`
      absolute -top-12 left-1/2 -translate-x-1/2
      flex items-center gap-4
      px-4 py-2
      rounded-xl
      backdrop-blur-sm
      shadow-2xl
      z-50
      transition-all duration-150
      ${
        theme === "dark"
          ? "bg-[#233138]/95 text-white border border-white/10"
          : "bg-white/95 text-gray-800 border border-black/10"
      }
    `}
  >
    {/* 🗑 DELETE */}
    <button
      onClick={() => {
        const socket = getSocket();
        if (!socket) return;

        socket.emit("remove_reaction", {
          messageId: reactionAction.messageId,
          emoji: reactionAction.emoji,
          userId: currentUser._id,
        });

        setReactionAction(null);
      }}
      className={`
        px-2 py-1
        rounded-md
        text-[13px]
        font-medium
        transition-colors
        ${
          theme === "dark"
            ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
            : "text-red-500 hover:bg-red-500/10 hover:text-red-600"
        }
      `}
    >
      Delete
    </button>

    {/* ❌ CANCEL */}
    <button
      onClick={() => setReactionAction(null)}
      className={`
        px-2 py-1
        rounded-md
        text-[13px]
        font-medium
        transition-colors
        ${
          theme === "dark"
            ? "text-gray-300 hover:bg-white/10 hover:text-white"
            : "text-gray-600 hover:bg-black/5 hover:text-black"
        }
      `}
    >
      Cancel
    </button>
  </div>
)}




{/* 🔁 REPLY PREVIEW (WHATSAPP STYLE) */}
{message.replyTo && (
  <div
    onClick={() => onReplyClick(message.replyTo._id)}
    className={`
      mb-1 px-2.5 py-1.5
      rounded-lg
      text-xs
      flex justify-between items-center gap-2
      cursor-pointer
      border-l-[4px]
      backdrop-blur-sm
      transition-all duration-150
      hover:brightness-105
      ${
        isUserMessage
          ? theme === "dark"
            ? "border-[#25D366] bg-[#0b141a]/90"
            : "border-[#25D366] bg-[#e7fce3]"
          : theme === "dark"
          ? "border-[#53bdeb] bg-[#0b141a]/90"
          : "border-[#53bdeb] bg-[#eef7fd]"
      }
    `}
  >
    {/* LEFT SIDE */}
    <div className="flex flex-col overflow-hidden min-w-0">
      <span
        className={`
          text-[11px] font-semibold truncate
          ${
            theme === "dark"
              ? "text-white/80"
              : "text-black/80"
          }
        `}
      >
        {message.replyTo.sender?._id === currentUser?._id
          ? "You"
          : message.replyTo.sender?.username}
      </span>

      {message.replyTo.contentType === "text" && (
        <span className="truncate text-[11px] opacity-70">
          {message.replyTo.content}
        </span>
      )}

      {message.replyTo.contentType === "image" && (
        <span className="flex items-center gap-1 text-[11px] opacity-70">
          <FaImage size={11} /> Photo
        </span>
      )}

      {message.replyTo.contentType === "video" && (
        <span className="flex items-center gap-1 text-[11px] opacity-70">
          <FaVideo size={11} /> Video · {mediaDuration || "…"}
        </span>
      )}

      {message.replyTo.contentType === "audio" && (
        <span className="flex items-center gap-1 text-[11px] opacity-70">
          <FaMicrophone size={11} /> Voice message
        </span>
      )}

      {message.replyTo.contentType === "location" && (
        <span className="flex items-center gap-1 text-[11px] opacity-70">
          <FaMapMarkerAlt size={11} />
          {message.replyTo.location?.isLive ? "Live location" : "Location"}
        </span>
      )}

      {message.replyTo.contentType === "poll" && (
        <span className="flex items-center gap-1 text-[11px] opacity-70">
          <FaPoll size={11} /> Poll
        </span>
      )}
    </div>

    {/* RIGHT SIDE PREVIEW */}
    <div className="flex-shrink-0 ml-2">
      {message.replyTo.contentType === "image" && (
        <img
          src={message.replyTo.imageOrVideoUrl}
          className="w-9 h-9 rounded-md object-cover"
          alt="reply"
        />
      )}

      {message.replyTo.contentType === "video" && (
        <video
          src={message.replyTo.imageOrVideoUrl}
          className="w-9 h-9 rounded-md object-cover"
          muted
        />
      )}

      {message.replyTo.contentType === "audio" && (
        <div className="flex items-end gap-[2px] h-8">
          {[...Array(4)].map((_, i) => (
            <span
              key={i}
              className="w-[2px] bg-[#25D366] rounded-full"
              style={{ height: `${8 + i * 4}px` }}
            />
          ))}
        </div>
      )}

      {message.replyTo.contentType === "location" && (
        <div className="w-9 h-9 rounded-md bg-[#25D366] flex items-center justify-center">
          {message.replyTo.location?.isLive ? (
            <FaBroadcastTower size={14} className="text-white" />
          ) : (
            <FaMapMarkedAlt size={14} className="text-white" />
          )}
        </div>
      )}

      {message.replyTo.contentType === "poll" && (
        <div className="w-9 h-9 rounded-md bg-[#7f66ff] flex items-center justify-center">
          <FaPoll size={14} className="text-white" />
        </div>
      )}
    </div>
  </div>
)}





{/* 🟢 STATUS REPLY PREVIEW */}
{/* 🟢 STATUS REPLY PREVIEW (ORIGINAL MEDIA) */}
{replyToStatus?.id && replyToStatus?.owner?._id && (
  <div
    onClick={(e) => {
      e.stopPropagation();

      if (!replyToStatus?.id || !replyToStatus?.owner?._id) return;

      navigate("/status", {
        state: {
          fromChat: true,
          statusId: replyToStatus.id,
          ownerId: replyToStatus.owner._id,
        },
      });
    }}
    className={`
      mb-1 px-2.5 py-1.5
      rounded-lg
      border-l-[4px] border-[#25D366]
      text-xs
      cursor-pointer
      flex items-center gap-2
      max-w-full
      backdrop-blur-sm
      transition-all duration-150
      hover:brightness-105
      ${
        theme === "dark"
          ? "bg-[#0b141a]/90"
          : "bg-[#e7fce3]"
      }
    `}
  >
    {/* LEFT: STATUS MEDIA */}
    <div className="flex-shrink-0">
      {replyToStatus.contentType === "image" && (
        <img
          src={replyToStatus.media}
          alt="status"
          className="w-9 h-9 rounded-md object-cover"
        />
      )}

      {replyToStatus.contentType === "video" && (
        <video
          src={replyToStatus.media}
          className="w-9 h-9 rounded-md object-cover"
          muted
        />
      )}

      {replyToStatus.contentType === "text" && (
        <div className="w-9 h-9 rounded-md bg-[#25D366] flex items-center justify-center text-white text-xs font-bold">
          T
        </div>
      )}
    </div>

    {/* RIGHT: STATUS INFO */}
    <div className="flex flex-col overflow-hidden min-w-0">
      <span
        className={`
          text-[11px] font-semibold truncate
          ${
            theme === "dark"
              ? "text-[#25D366]"
              : "text-[#128c7e]"
          }
        `}
      >
        {replyToStatus.owner.username}'s status
      </span>

      {replyToStatus.contentType === "text" && (
        <span className="truncate text-[11px] opacity-70">
          {replyToStatus.media}
        </span>
      )}

      {replyToStatus.contentType === "image" && (
        <span className="text-[11px] opacity-70">Photo</span>
      )}

      {replyToStatus.contentType === "video" && (
        <span className="text-[11px] opacity-70">Video</span>
      )}
    </div>
  </div>
)}






      <div className="flex flex-col gap-1.5 max-w-full overflow-x-hidden">

   {message.contentType === "text" && (
  <p
    className="
      text-[14px]
      leading-[1.45]
      whitespace-pre-wrap
      break-words
      max-w-full
      tracking-[0.01em]
    "
    style={{
      wordBreak: "break-word",
      overflowWrap: "anywhere",
    }}
  >
    {message.content}
  </p>
)}



{message.contentType === "image" && (
  <div className="flex flex-col gap-1.5">
    <img
      src={message.imageOrVideoUrl}
      alt="image"
      className="
        block
        w-full
        max-w-[280px]
        max-h-[360px]
        rounded-2xl
        object-contain
        bg-black/10
        shadow-sm
      "
    />

    {message.content && (
      <p className="text-[13px] leading-[1.35] break-words opacity-90">
        {message.content}
      </p>
    )}
  </div>
)}



{message.contentType === "audio" && (
  <div className="flex flex-col gap-1.5">
    <audio
      controls
      className="
        w-[240px]
        rounded-lg
      "
    >
      <source src={message.imageOrVideoUrl} />
    </audio>

    {message.content && (
      <p className="text-[13px] opacity-80">
        {message.content}
      </p>
    )}
  </div>
)}




{message.contentType === "video" && (
  <div className="flex flex-col gap-1.5">
    <video
      src={message.imageOrVideoUrl}
      controls
      className="
        block
        w-full
        max-w-[280px]
        max-h-[360px]
        rounded-2xl
        object-contain
        bg-black
        shadow-sm
      "
    />

    {message.content && (
      <p className="text-[13px] leading-[1.35] break-words opacity-90">
        {message.content}
      </p>
    )}
  </div>
)}


{message.contentType === "poll" && message.poll && (
  <div
    className={`
      p-3
      rounded-2xl
      max-w-[260px]
      shadow-sm
      border
      ${
        theme === "dark"
          ? "bg-[#202c33] text-white border-white/10"
          : "bg-[#f0f2f5] text-black border-black/10"
      }
    `}
  >
    {/* QUESTION */}
    <p className="font-semibold text-[14px] mb-1.5 leading-snug">
      {message.poll.question}
    </p>

    {/* INFO */}
    <div className="flex items-center gap-2 text-xs opacity-70 mb-2">
      {message.poll.allowMultiple ? (
        <FaCheckDouble className="text-[#53bdeb]" />
      ) : (
        <FaCheck className="text-[#53bdeb]" />
      )}
      <span>
        {message.poll.allowMultiple
          ? "Select one or more options"
          : "Select one option"}
      </span>
    </div>

    {/* OPTIONS */}
    {message.poll.options.map((opt, i) => {
      const voteUsers = getVoteUsers(opt.votes);
      const totalVotes = opt.votes?.length || 0;

      const isSelected = opt.votes?.some(
        (v) => String(v?._id) === String(currentUser?._id)
      );

      return (
        <div key={i} className="mb-2">
          {/* OPTION BUTTON */}
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              axiosInstance.post("/chats/poll/vote", {
                messageId: message._id,
                optionIndex: i,
              });
            }}
            className={`
              w-full
              px-3 py-2
              rounded-xl
              cursor-pointer
              transition
              flex justify-between items-center
              ${
                isSelected
                  ? theme === "dark"
                    ? "bg-[#25D366] text-black"
                    : "bg-[#d9fdd3] text-black"
                  : theme === "dark"
                  ? "bg-[#2a3942] hover:bg-[#31444f]"
                  : "bg-white hover:bg-black/5"
              }
            `}
          >
            {/* LEFT */}
            <div className="flex items-center gap-2">
              <input
                type={message.poll.allowMultiple ? "checkbox" : "radio"}
                checked={isSelected}
                readOnly
                className="pointer-events-none accent-[#25D366]"
              />
              <span className="text-sm">{opt.text}</span>
            </div>

            {/* RIGHT */}
            <div className="flex items-center gap-1">
              {/* USERS */}
              <div className="flex items-center -space-x-2">
                {voteUsers.slice(0, 3).map((user) => (
                  <img
                    key={user._id}
                    src={user.profilePicture}
                    alt={user.username}
                    title={user.username}
                    className="w-4 h-4 rounded-full border-2 border-[#202c33] bg-white"
                  />
                ))}
                {voteUsers.length > 3 && (
                  <span className="text-xs opacity-70 ml-2">
                    +{voteUsers.length - 3}
                  </span>
                )}
              </div>

              {/* COUNT */}
              <span className="text-xs opacity-70 ml-1 select-none">
                {totalVotes}
              </span>
            </div>
          </div>

          {/* VIEW VOTERS */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowVotes(true);
            }}
            className="text-xs text-[#53bdeb] mt-1 ml-1 hover:underline"
          >
            View voters
          </button>
        </div>
      );
    })}
  </div>
)}



{message.contentType === "call" && (
  <div
    className={`
      flex items-center gap-2
      px-2 py-1.5
      rounded-xl
      text-[12.5px]
      leading-tight
      select-none
      ${
        theme === "dark"
          ? "bg-[#202c33]/40 text-white"
          : "bg-black/5 text-black"
      }
    `}
  >
    {/* 📞 CALL ICON */}
    <span
      className={`
        flex items-center justify-center
        w-6 h-6
        rounded-full
        shrink-0
        ${
          message.callStatus === "missed"
            ? "bg-red-500/15 text-red-500"
            : message.callStatus === "rejected"
            ? "bg-orange-400/15 text-orange-400"
            : "bg-green-500/15 text-green-500"
        }
      `}
    >
      {message.callStatus === "missed" ? (
        <FaPhoneSlash size={12} />
      ) : (
        <FaPhoneAlt size={12} />
      )}
    </span>

    {/* ⬆️ ⬇️ IN / OUT */}
    {isOutgoingCall && (
  <FaArrowUp className="text-gray-400 text-[11px]" />
)}

{isIncomingCall && (
  <FaArrowDown className="text-gray-400 text-[11px]" />
)}


    {/* 📞 CALL TEXT */}
    <div className="flex flex-col leading-tight">
      <span className="font-medium">
        {message.callType === "audio" ? "Voice call" : "Video call"}
      </span>

      {/* STATUS */}
      {message.callStatus === "missed" && (
        <span className="text-red-500 text-[11px] font-medium">
          Missed
        </span>
      )}

      {message.callStatus === "rejected" && (
        <span className="text-orange-400 text-[11px] font-medium">
          Rejected
        </span>
      )}

      {message.callStatus === "ended" && (
        <span className="text-gray-400 text-[11px]">
          {message.callDuration > 0
            ? `${Math.floor(message.callDuration / 60)}:${String(
                message.callDuration % 60
              ).padStart(2, "0")}`
            : "Ended"}
        </span>
      )}
    </div>
  </div>
)}








{message.contentType === "location" && message.location && (() => {
  const isExpired =
    message.location.isLive &&
    message.location.expiresAt &&
    new Date(message.location.expiresAt).getTime() < Date.now();

  return (
    <div
      className={`
        relative
        w-[240px]
        rounded-xl
        px-3 py-2.5
        cursor-pointer
        shadow-sm
        transition-colors
        ${
          theme === "dark"
            ? "bg-[#1f4033] text-white"
            : "bg-[#dcf8c6] text-black"
        }
      `}
    >
      {/* 📍 HEADER */}
      <div className="flex items-center gap-2 font-medium text-sm">
        <span
          className="
            w-6 h-6
            rounded-full
            bg-green-500/15
            flex items-center justify-center
            shrink-0
          "
        >
          <FaMapMarkerAlt className="text-green-500 text-[14px]" />
        </span>

        <span>
          {message.location.isLive ? "Live location" : "Current location"}
        </span>
      </div>

      {/* ⏱ TIME */}
      <p className="text-[11px] opacity-70 mt-[2px]">
        {message.location.isLive
          ? isExpired
            ? "Live location ended"
            : getRemainingTime(message.location.expiresAt)
          : `Shared at ${format(new Date(message.createdAt), "HH:mm")}`}
      </p>

      {/* 🗺 OPEN MAP */}
      {!isExpired && (
        <a
          href={`https://www.google.com/maps?q=${message.location.lat},${message.location.lng}`}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="
            inline-block
            mt-2
            text-[12px]
            font-medium
            text-blue-500
            hover:underline
          "
        >
          Open in Google Maps
        </a>
      )}

      {/* ❌ STOP SHARING (ONLY SENDER) */}
      {isUserMessage && message.location.isLive && !isExpired && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteMessageForEveryone(message._id);
          }}
          className="
            block
            mt-1
            text-[12px]
            font-medium
            text-red-500
            hover:underline
          "
        >
          Stop sharing
        </button>
      )}
    </div>
  );
})()}


 </div>

      {/* TIME + STATUS */}
     <div
  className={`
    flex items-center justify-end gap-1.5
    mt-1
    text-[11px]
    leading-none
    ${theme === "dark" ? "text-white/60" : "text-gray-600"}
  `}
>
  {/* ⏰ TIME */}
  <span className="tracking-tight">
    {format(new Date(message.createdAt), "HH:mm")}
  </span>

  {/* ⭐ STAR */}
  {message.starredBy?.includes(currentUser._id) && (
    <FaStar className="text-yellow-400 ml-0.5" size={11} />
  )}

  {/* ✅ MESSAGE STATUS */}
  {isUserMessage && (
    <>
      {message.messageStatus === "send" && (
        <FaCheck
          size={12}
          className={theme === "dark" ? "text-white/60" : "text-gray-600"}
        />
      )}

      {message.messageStatus === "delivered" && (
        <FaCheckDouble
          size={12}
          className={theme === "dark" ? "text-white/60" : "text-gray-600"}
        />
      )}

      {message.messageStatus === "read" && (
        <FaCheckDouble size={12} className="text-blue-400" />
      )}
    </>
  )}
</div>



      {/* THREE DOT MENU */}
      {/* THREE DOT MENU */}
<div
  className="
    absolute top-1 right-1
    opacity-0 group-hover:opacity-100
    transition-opacity duration-200
    z-20
  "
>
  <button
    ref={optionsRef}
    onClick={() => setShowOptions((prev) => !prev)}
    className={`
      w-7 h-7
      flex items-center justify-center
      rounded-full
      transition-colors
      ${
        theme === "dark"
          ? "text-white/70 hover:bg-white/10 active:bg-white/20"
          : "text-gray-500 hover:bg-black/5 active:bg-black/10"
      }
    `}
  >
    <HiDotsVertical size={16} />
  </button>
</div>



      {/* SMILE BUTTON */}
      <div
  className={`
    absolute top-1/2 -translate-y-1/2
    opacity-0 group-hover:opacity-100
    transition-all duration-200
    flex flex-col
    ${isUserMessage ? "-left-9" : "-right-9"}
  `}
>
  <button
    onClick={() => setShowReactions(!showReactions)}
    className={`
      w-8 h-8
      flex items-center justify-center
      rounded-full
      shadow-md
      active:scale-95
      transition
      ${
        theme === "dark"
          ? "bg-[#202c33] hover:bg-[#2a3942] text-white/80"
          : "bg-white hover:bg-gray-100 text-gray-600"
      }
    `}
  >
    <FaSmile className="text-[15px]" />
  </button>
</div>


      {/* QUICK REACTIONS + PLUS */}
      {showReactions && (
  <div
    ref={reactionsRef}
    className={`
      absolute -top-11
      ${isUserMessage ? "right-2" : "left-10"}
      flex items-center gap-1.5
      px-2 py-1
      rounded-full
      shadow-lg
      z-50
      transition-all duration-200
      ${
        theme === "dark"
          ? "bg-[#202c33] border border-white/5"
          : "bg-white border border-black/10"
      }
    `}
  >
    {quickReactions.map((emoji, i) => (
      <button
        key={i}
        onClick={() => handleReact(emoji)}
        className="
          w-8 h-8
          flex items-center justify-center
          rounded-full
          text-lg
          transition
          hover:bg-black/10
          active:scale-95
        "
      >
        {emoji}
      </button>
    ))}

    {/* Divider */}
    <div
      className={`
        h-5 w-px mx-1
        ${theme === "dark" ? "bg-white/20" : "bg-black/20"}
      `}
    />

    {/* ➕ Button */}
    <button
      onClick={() => setShowEmojiPicker(true)}
      className={`
        w-8 h-8
        flex items-center justify-center
        rounded-full
        transition
        active:scale-95
        ${
          theme === "dark"
            ? "hover:bg-white/10 text-white/80"
            : "hover:bg-black/10 text-gray-600"
        }
      `}
    >
      <FaPlus size={14} />
    </button>
  </div>
)}


      {/* FULL EMOJI PICKER */}
      {showEmojiPicker && (
  <div
    ref={emojiPickerRef}
    className={`
      absolute bottom-full mb-3 z-50
      ${isUserMessage ? "right-0" : "left-0"}
    `}
  >
    <div
      className={`
        relative
        rounded-xl
        shadow-2xl
        overflow-hidden
        ${
          theme === "dark"
            ? "bg-[#202c33] border border-white/10"
            : "bg-white border border-black/10"
        }
      `}
    >
      {/* ❌ CLOSE BUTTON (WHATSAPP STYLE) */}
      <button
        onClick={() => setShowEmojiPicker(false)}
        className={`
          absolute top-2 right-2 z-10
          w-7 h-7
          flex items-center justify-center
          rounded-full
          transition
          ${
            theme === "dark"
              ? "text-white/60 hover:bg-white/10"
              : "text-gray-600 hover:bg-black/10"
          }
        `}
      >
        <RxCross2 size={14} />
      </button>

      {/* 😊 EMOJI PICKER */}
      <EmojiPicker
        theme={theme}
        onEmojiClick={(e) => handleReact(e.emoji)}
        width={320}
        height={380}
      />
    </div>
  </div>
)}


      {/* REACTIONS (FIXED POSITION) */}
{/* ✅ FINAL REACTIONS UI */}
{Array.isArray(message.reactions) && message.reactions.length > 0 && (
  <div
    className={`
      absolute -bottom-3 z-20
      flex items-center gap-1
      ${isUserMessage ? "right-3" : "left-3"}
    `}
  >
    {message.reactions.map((reaction, i) => {
      const isMine = isReactionMine(reaction, currentUser);

      return (
        <div
          key={i}
          className={`
            flex items-center gap-1
            px-2 py-[1.5px]
            rounded-full
            text-[13px]
            shadow-sm
            border
            ${
              isMine
                ? "bg-[#25D366] text-white border-[#25D366]" // ✅ WhatsApp green
                : theme === "dark"
                ? "bg-[#2a3942] text-white border-white/10"
                : "bg-white text-gray-900 border-black/10"
            }
          `}
        >
          {reaction.emojis.map((emo, idx) => (
            <span
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                if (!isMine) return;

                setReactionAction({
                  messageId: message._id,
                  emoji: emo,
                });
              }}
              className={`
                leading-none
                select-none
                ${isMine ? "cursor-pointer" : "cursor-default"}
              `}
            >
              {emo}
            </span>
          ))}
        </div>
      );
    })}
  </div>
)}



      {/* OPTIONS MENU */}
   {showOptions && (
  <div
    ref={optionsRef}
    className={`
      absolute z-50
      min-w-[180px]
      max-w-[220px]
      rounded-xl
      py-1
      text-[13px]
      shadow-2xl
      border
      select-none

      /* DESKTOP POSITION */
      ${isUserMessage ? "right-1" : "left-1"}
      top-9

      /* MOBILE – CENTER BELOW MESSAGE (WhatsApp like) */
      max-md:left-1/2
      max-md:-translate-x-1/2
      max-md:top-10

      ${
        theme === "dark"
          ? "bg-[#233138] text-white border-white/10"
          : "bg-white text-gray-900 border-black/10"
      }
    `}
  >
    {/* ITEM */}
    <button
      onClick={() => {
        setInfoMessage(message);
        setShowOptions(false);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        transition
        hover:bg-black/5 dark:hover:bg-white/10
      "
    >
      <FaInfoCircle className="text-[14px] opacity-70" />
      <span>Message info</span>
    </button>

    <button
      onClick={() => {
        setReplyToMessage(message);
        setShowOptions(false);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        transition
        hover:bg-black/5 dark:hover:bg-white/10
      "
    >
      <FaReply className="opacity-70" />
      Reply
    </button>

    <button
      onClick={() => openForward(message)}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        transition
        hover:bg-black/5 dark:hover:bg-white/10
      "
    >
      <FaForward className="opacity-70" />
      Forward
    </button>

    <button
      onClick={handleCopy}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        transition
        hover:bg-black/5 dark:hover:bg-white/10
      "
    >
      <FaRegCopy className="text-[14px] opacity-70" />
      Copy
    </button>

    {message.contentType !== "text" && (
      <a
        href={message.imageOrVideoUrl}
        download
        className="
          w-full flex items-center gap-3
          px-4 py-2.5
          transition
          hover:bg-black/5 dark:hover:bg-white/10
        "
      >
        <FaDownload className="text-[14px] opacity-70" />
        Download
      </a>
    )}

    <div className="my-1 border-t border-black/10 dark:border-white/10" />

    <button
      onClick={() => {
        setSelectedPinMessage(message);
        setShowPinModal(true);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        transition
        hover:bg-black/5 dark:hover:bg-white/10
      "
    >
      <FaThumbtack className="text-[14px] opacity-70" />
      Pin
    </button>

    <button
      onClick={() => {
        toggleStarMessage(message._id);
        setShowOptions(false);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        transition
        hover:bg-black/5 dark:hover:bg-white/10
      "
    >
      {message.starredBy?.includes(currentUser._id) ? (
        <>
          <FaStar className="text-yellow-400" />
          Unstar
        </>
      ) : (
        <>
          <FaRegStar />
          Star
        </>
      )}
    </button>

    <button
      onClick={() => {
        setSelectedMessages([message]);
        setShowOptions(false);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        transition
        hover:bg-black/5 dark:hover:bg-white/10
      "
    >
      <MdOutlineCheckCircle className="text-[18px] opacity-70" />
      Select
    </button>

    <div className="my-1 border-t border-black/10 dark:border-white/10" />

    <button
      onClick={() => {
        deleteMessage(message._id);
        setShowOptions(false);
      }}
      className="
        w-full flex items-center gap-3
        px-4 py-2.5
        transition
        hover:bg-black/5 dark:hover:bg-white/10
      "
    >
      <MdOutlineDelete className="text-[18px] opacity-70" />
      Delete for me
    </button>

    {isUserMessage && !isSelfChat && !message.deletedForEveryone && (
      <button
        onClick={() => {
          deleteMessageForEveryone(message._id);
          setShowOptions(false);
        }}
        className="
          w-full flex items-center gap-3
          px-4 py-2.5
          text-red-600
          transition
          hover:bg-red-500/10
        "
      >
        <MdDeleteForever className="text-[18px]" />
        Delete for everyone
      </button>
    )}
  </div>
)}





<ViewVotesModal
  isOpen={showVotes}
  onClose={() => setShowVotes(false)}
  poll={message.poll}
/>





       
    </div>
  </div>
);


};
export default MessageBubble;


