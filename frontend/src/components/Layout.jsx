import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "./Sidebar";
import AudioCallManager from "../pages/AudioCall/AudioCallManager";
import AudioCallModal from "../pages/AudioCall/AudioCallModal";
import { getSocket } from "../services/chat.service";

import useLayoutStore from "../store/layoutStore";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import ChatWindow from "../pages/chatSection/ChatWindow";
import ForwardModal from "./Forward/ForwardModal";
import FloatingCallBar from "../pages/AudioCall/FloatingCallBar";
import { useChatStore } from "../store/chatStore";

import useAudioCallStore from "../store/audioCallStore";

import useVideoCallStore from "../store/videoCallStore";

import VideoCallManager from "../pages/VideoCall/VideoCallManager";

console.log("ChatWindow =", ChatWindow)

const Layout = ({ children , isStatusPreviewOpen, statusPreviewContent }) => {
  
  const selectedContact = useLayoutStore((s) => s.selectedContact);
  const setSelectedContact = useLayoutStore((s) => s.setSelectedContact);
const socket = getSocket(); // 🔥 ADD THIS LINE

  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  const notificationAudioRef = useRef(null);
const prevUnreadRef = useRef(0);

const { conversations } = useChatStore();



useEffect(() => {
  if (theme === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}, [theme]);


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
  const unlockAudio = () => {
    if (window.__CALL_AUDIO__) return;

    const audio = new Audio("/incoming-call.mp3");
    audio.volume = 0;
    audio.loop = true;

    audio.play()
      .then(() => {
        audio.pause();
        audio.volume = 1;

        window.__CALL_AUDIO__ = audio; // 🔥 STORE INSTANCE
        console.log("🔓 Audio fully unlocked");
      })
      .catch(err => {
        console.log("❌ unlock failed", err);
      });

    document.removeEventListener("click", unlockAudio);
  };

  document.addEventListener("click", unlockAudio);
}, []);





useEffect(() => {
  if (!user?._id) return;

  const conversationArray = Array.isArray(conversations?.data)
    ? conversations.data
    : [];

  let totalUnread = 0;

  conversationArray.forEach((conv, i) => {
    if (
      conv?.unreadCount > 0 &&
      conv?.lastMessage?.receiver?._id === user._id
    ) {
      totalUnread += conv.unreadCount;
    }
  });

  console.log(
    "🔔 NOTIFICATION CHECK:",
    totalUnread,
    "prev:",
    prevUnreadRef.current
  );




  if (
    totalUnread > prevUnreadRef.current &&
    notificationAudioRef.current
  ) {
    notificationAudioRef.current.currentTime = 0;
    notificationAudioRef.current.play().catch(() => {});
  }

  prevUnreadRef.current = totalUnread;
}, [conversations, user?._id]);






useEffect(() => {
  const unlockNotificationAudio = () => {
    const audio = notificationAudioRef.current;
    if (!audio) return;

    audio.volume = 0;
    audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = 1;
        console.log("🔓 Notification audio unlocked");
      })
      .catch(() => {});

    document.removeEventListener("click", unlockNotificationAudio);
  };

  document.addEventListener("click", unlockNotificationAudio);

  return () => {
    document.removeEventListener("click", unlockNotificationAudio);
  };
}, []);




  return (
    <>
    <div
      className={`min-h-screen flex ${
        theme === "dark" ? "bg-[#111b21] text-white" : "bg-gray-100 text-black"
      }`}
    >
      {!isMobile && <Sidebar />}

      <div className={`flex-1 flex overflow-hidden ${isMobile ? "flex-col" : ""}`}>
        <AnimatePresence initial={false}>
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatlist"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="h-full w-full md:w-2/5"
            >
              {children}
            </motion.div>
          )}

          {(selectedContact || !isMobile) && (
            <motion.div
              key="chatWindow"
              initial={{ x: isMobile ? "100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              className="h-full w-full"
            >
              <ChatWindow
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isMobile && <Sidebar />}
    </div>
{/* 🔥 JUST ADD THIS */}
    <AudioCallManager socket={socket} />
    <FloatingCallBar />
    <AudioCallModal socket={socket} />

     {isStatusPreviewOpen && statusPreviewContent}
    <ForwardModal />
<VideoCallManager socket={socket} />
    
<audio
  ref={notificationAudioRef}
  src="/notification.wav"
  preload="auto"
/>


    
    </>
  );
};

export default Layout;
