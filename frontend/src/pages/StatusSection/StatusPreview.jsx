import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";
import { FaChevronDown, FaChevronLeft, FaChevronRight, FaEye, FaPaperPlane, FaTimes, FaTrash } from "react-icons/fa";

import { FaSmile } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";
import { useRef } from "react";


import { FaHeart, FaRegHeart } from "react-icons/fa";
import useStatusStore from "../../store/useStatusStore";


// Tabnine | Edit | Explain
const StatusPreview = ({
  contact,
  currentIndex,
  onClose,
  onPrev,
  onNext,
  onDelete,
  theme,
  currentUser,
  loading,
  onReply
}) => {
  const [progress, setProgress] = useState(0);
  const [showViewers, setShowViewers] = useState(false);

  const currentStatus = contact?.statuses[currentIndex];
  const isOwnerStatus = contact?.id === currentUser?._id;

  const [replyText, setReplyText] = useState("");
const [showEmoji, setShowEmoji] = useState(false);
const emojiRef = useRef(null);
const emojiButtonRef = useRef(null);


const { toggleLikeStatus } = useStatusStore();


const [isPaused, setIsPaused] = useState(false);
const intervalRef = useRef(null);
const startX = useRef(0);
const videoRef = useRef(null);

const [isTyping, setIsTyping] = useState(false);

const onNextRef = useRef(onNext);
const onCloseRef = useRef(onClose);

useEffect(() => {
  onNextRef.current = onNext;
  onCloseRef.current = onClose;
}, [onNext, onClose]);



useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      emojiRef.current &&
      !emojiRef.current.contains(e.target) &&
      !emojiButtonRef.current.contains(e.target)
    ) {
      setShowEmoji(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);
  return () => document.removeEventListener("mousedown", handleClickOutside);
}, []);



  useEffect(() => {
    setProgress(0);
    let current = 0;

    const interval = setInterval(() => {
      current += 2; // INCREASE PROGRESS BY 2% every 100ms = 50 steps = 5 second
      setProgress(current);

      if (current >= 100) {
        clearInterval(interval);
        // onNext();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex]);



  const handleViewersToggle = () => {
  setShowViewers(!showViewers);
};



const getStatusDuration = () => {
  if (currentStatus.contentType === "video") {
    return Math.min(
      (videoRef.current?.duration || 5),
      30
    );
  }
  return 5; // image & text
};



useEffect(() => {
  if (!contact?.statuses?.length) return;

  clearInterval(intervalRef.current);
  setProgress(0);

  const duration =
    currentStatus?.contentType === "video"
      ? Math.min(videoRef.current?.duration || 5, 30)
      : 5;

  const stepTime = 100;
  const step = 100 / (duration * 1000 / stepTime);

  intervalRef.current = setInterval(() => {
    if (isPaused || isTyping) return;

    setProgress((prev) => {
      const next = prev + step;

      if (next >= 100) {
        clearInterval(intervalRef.current);

        if (currentIndex < contact.statuses.length - 1) {
          onNextRef.current();   // ✅ next status
        } else {
          onCloseRef.current();  // ✅ close preview
        }

        return 100;
      }

      return next;
    });
  }, stepTime);

  return () => clearInterval(intervalRef.current);
}, [currentIndex, isPaused, isTyping]);



useEffect(() => {
  console.log("STATUS INDEX:", currentIndex);
}, [currentIndex]);



const handleReplySend = () => {
  if (!replyText.trim()) return;

onReply({
  text: replyText,
  status: {
    id: currentStatus.id,
    content: currentStatus.media,
 media: currentStatus.media,   // ✅ FIXED
    contentType: currentStatus.contentType,
    timestamp: currentStatus.timestamp,

    // 🔥 ADD THIS
    owner: {
      _id: contact.id,
      username: contact.name,
      profilePicture: contact.avatar,
    },
  },
});


  setReplyText("");
  onClose();
};


const isLiked = currentStatus?.likes?.some(
  (u) => String(u._id) === String(currentUser._id)
);



const handleDeleteStatus = () => {
  if (onDelete && currentStatus?.id) {
    onDelete(currentStatus.id);
  }

  if (contact.statuses.length === 1) {
    onClose();
  } else {
    onPrev();
  }
};

if (!currentStatus) return null;


  return (
 <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4 }}
  exit={{ opacity: 0 }}
  className={`fixed inset-0 w-full h-full z-50 flex items-center justify-center
  ${theme === "dark"
    ? "bg-black/80"
    : "bg-white/70"}`}
  style={{ backdropFilter: "blur(6px)" }}
>


{/* BACKGROUND CLICK */}
<div
  className={`absolute inset-0 z-0
  ${theme === "dark"
    ? "bg-black/30"
    : "bg-white/30"}`}
  onClick={onClose}
/>




   <div
  className="relative z-10 w-full h-full max-w-md mx-auto flex justify-center items-center"
  onClick={(e) => e.stopPropagation()}
>
      <div
    className={`w-full h-full relative overflow-hidden
    ${theme === "dark"
      ? "bg-[#0b141a]"
      : "bg-black"}`}
  >
        {/* TOP PROGRESS BAR */}
         <div className="absolute top-2 left-2 right-2 flex gap-1 z-20">
      {contact.statuses.map((_, index) => (
        <div
          key={index}
          className="flex-1 h-[2px] bg-white/30 rounded-full overflow-hidden"
        >
          <div
            className="h-full bg-white transition-all duration-100 ease-linear"
            style={{
              width:
                index < currentIndex
                  ? "100%"
                  : index === currentIndex
                  ? `${progress}%`
                  : "0%",
            }}
          />
        </div>
      ))}
    </div>

        {/* HEADER */}
       {/* HEADER */}
<div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-3 pt-4">
      <div className="flex items-center gap-3">
        <img
          src={contact.avatar}
          alt={contact.name}
          className="w-9 h-9 rounded-full object-cover border border-white/30"
        />
        <div>
          <p className="text-white text-sm font-semibold leading-tight">
            {contact.name}
          </p>
          <p className="text-white/70 text-xs">
            {formatTimestamp(currentStatus.timestamp)}
          </p>
        </div>
      </div>

  {/* RIGHT ACTIONS */}
  <div className="flex items-center gap-2">
        {isOwnerStatus && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteStatus();
            }}
            className="bg-black/50 text-white p-2 rounded-full"
          >
            <FaTrash size={14} />
          </button>
        )}

    {/* ❌ CLOSE */}
    <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="bg-black/50 text-white p-2 rounded-full"
        >
          <FaTimes size={14} />
        </button>
      </div>
    </div>


        {/* STATUS CONTENT */}
         <div
      className="w-full h-full flex items-center justify-center select-none"
      onMouseDown={() => setIsPaused(true)}
      onMouseUp={() => setIsPaused(false)}
      onTouchStart={(e) => {
        setIsPaused(true);
        startX.current = e.touches[0].clientX;
      }}
      onTouchEnd={(e) => {
        setIsPaused(false);
        const diff = startX.current - e.changedTouches[0].clientX;
        if (diff > 50) onNext();
        else if (diff < -50) onPrev();
      }}
    >


          {currentStatus.contentType === "text" && (
        <div className="px-6 text-center">
          <p className="text-white text-2xl font-medium leading-snug">
            {currentStatus.media}
          </p>
        </div>
      )}

      {currentStatus.contentType === "image" && (
        <img
          src={currentStatus.media}
          alt="status"
          className="max-w-full max-h-full object-contain"
        />
      )}

      {currentStatus.contentType === "video" && (
        <video
          src={currentStatus.media}
          className="max-w-full max-h-full object-contain"
          autoPlay
          muted
          controls
          onPlay={() => setIsPaused(false)}
          onPause={() => setIsPaused(true)}
          onEnded={() => onNextRef.current()}
        />
      )}
    </div>


        {/* CLOSE */}
       

        {/* NAVIGATION */}
       {currentIndex > 0 && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
        className="absolute left-3 top-1/2 -translate-y-1/2
        bg-black/50 text-white p-3 rounded-full"
      >
        <FaChevronLeft />
      </button>
    )}

       {currentIndex < contact.statuses.length - 1 && (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
        className="absolute right-3 top-1/2 -translate-y-1/2
        bg-black/50 text-white p-3 rounded-full"
      >
        <FaChevronRight />
      </button>
    )}


        {/* 👁 VIEWERS (ONLY OWNER) */}
        {isOwnerStatus && (
  <div className="absolute bottom-4 left-4 right-4 z-40">

    {/* 👁 VIEW BUTTON */}
    <button
      onClick={handleViewersToggle}
      className={`flex items-center justify-between w-full
      px-4 py-2 rounded-full backdrop-blur-md border
      transition
      ${theme === "dark"
        ? "bg-[#1f2c34]/90 border-[#2a3942] text-white"
        : "bg-white/90 border-gray-200 text-gray-800 shadow-md"}`}
    >
      <div className="flex items-center gap-2 text-sm">
        <FaEye className="opacity-80" />
        <span>{currentStatus.viewers.length}</span>
      </div>

      <FaChevronDown
        className={`transition-transform duration-300 ${
          showViewers ? "rotate-180" : ""
        }`}
      />
    </button>

    {/* 👥 VIEWERS LIST */}
    <AnimatePresence>
      {showViewers && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className={`mt-2 rounded-2xl p-3 max-h-48 overflow-y-auto border backdrop-blur-md
          ${theme === "dark"
            ? "bg-[#1f2c34]/95 border-[#2a3942]"
            : "bg-white/95 border-gray-200 shadow-lg"}`}
        >
          {currentStatus.viewers.length > 0 ? (
            currentStatus.viewers.map((viewer) => {
              const liked = currentStatus.likes?.some(
                (u) => String(u._id) === String(viewer._id)
              );

              return (
                <div
                  key={viewer._id}
                  className="flex items-center justify-between gap-3 py-2 px-2 rounded-lg
                  hover:bg-black/5 transition"
                >
                  {/* 👤 LEFT */}
                  <div className="flex items-center gap-3">
                    <img
                      src={viewer.profilePicture}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <span
                      className={`text-sm font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}
                    >
                      {viewer.username}
                    </span>
                  </div>

                  {/* ❤️ RIGHT */}
                  {liked && (
                    <FaHeart className="text-red-500 text-sm" />
                  )}
                </div>
              );
            })
          ) : (
            <p
              className={`text-sm text-center py-3 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}
            >
              No viewers yet
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>

  </div>
)}


        
{!isOwnerStatus && (
  <div className="absolute bottom-4 left-3 right-3 z-30">

    {/* ❤️ FLOATING LIKE */}
    <button
      onClick={(e) => {
        e.stopPropagation();
        toggleLikeStatus(currentStatus.id);
      }}
      className={`absolute -top-14 right-2 p-3 rounded-full
      backdrop-blur-md transition active:scale-90
      ${theme === "dark"
        ? "bg-black/60"
        : "bg-white/80 shadow-md"}`}
    >
      {isLiked ? (
        <FaHeart className="text-red-500 text-xl" />
      ) : (
        <FaRegHeart
          className={`text-xl ${
            theme === "dark" ? "text-white" : "text-gray-700"
          }`}
        />
      )}
    </button>

    {/* 💬 REPLY BAR */}
    <div
      className={`flex items-center gap-2 px-3 py-2 rounded-full
      backdrop-blur-md border
      ${theme === "dark"
        ? "bg-[#1f2c34]/90 border-[#2a3942]"
        : "bg-white/95 border-gray-200 shadow-lg"}`}
    >
      {/* 😊 EMOJI */}
      <button
        ref={emojiButtonRef}
        onClick={(e) => {
          e.stopPropagation();
          setShowEmoji((p) => !p);
        }}
        className={`opacity-80 hover:opacity-100 transition
        ${theme === "dark" ? "text-white" : "text-gray-600"}`}
      >
        <FaSmile size={20} />
      </button>

      {/* ✍️ INPUT */}
      <input
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        onFocus={() => setIsTyping(true)}
        onBlur={() => setIsTyping(false)}
        placeholder="Reply to status…"
        className={`flex-1 bg-transparent text-sm outline-none
        ${theme === "dark"
          ? "text-white placeholder-gray-400"
          : "text-gray-800 placeholder-gray-500"}`}
      />

      {/* ✈️ SEND */}
      <button
        onClick={handleReplySend}
        className="text-[#25D366] hover:scale-110 transition"
      >
        <FaPaperPlane size={18} />
      </button>
    </div>

    {/* 😃 EMOJI PICKER */}
    {showEmoji && (
      <div
        ref={emojiRef}
        className="absolute bottom-14 left-0 z-50"
        onClick={(e) => e.stopPropagation()}
      >
        <EmojiPicker
          theme={theme}
          onEmojiClick={(e) =>
            setReplyText((prev) => prev + e.emoji)
          }
        />
      </div>
    )}
  </div>
)}


      </div>
    </div>
  </motion.div>
);

};

export default StatusPreview;
