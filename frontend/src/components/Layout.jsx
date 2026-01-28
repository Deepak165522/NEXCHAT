import React, { useEffect, useState } from "react";
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
    
    
    </>
  );
};

export default Layout;
