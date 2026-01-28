import React, { useState, useMemo } from "react";
import useLayoutStore from "../../store/layoutStore";
import useThemeStore from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import { FaPlus, FaSearch } from "react-icons/fa";
import { motion } from "framer-motion";
import formatTimestamp from "../../utils/formatTime";

import { useChatStore } from "../../store/chatStore";



const ChatList = ({ contacts }) => {
   const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  // const { conversations } = useChatStore();


  const [searchTerms, setSearchTerms] = useState("");

// 🔥 FIX 4: Inject "Saved Messages" (You) if missing



  const filteredContacts = contacts.filter((contact) =>
  contact?.username?.toLowerCase().includes(searchTerms.toLowerCase())
);


























  return (
  <div
    className={`
      h-screen w-full border-r
      ${theme === "dark"
        ? "bg-[#111b21] border-white/10"
        : "bg-white border-black/10"}
    `}
  >
    {/* ================= HEADER ================= */}
    <div
      className={`
        px-4 py-3 flex items-center justify-between
        ${theme === "dark" ? "text-white" : "text-[#111b21]"}
      `}
    >
      <h2 className="text-xl font-semibold">Chats</h2>

      <button
        className="
          p-2 rounded-full
          hover:bg-black/10 dark:hover:bg-white/10
        "
      >
        <FaPlus />
      </button>
    </div>

    {/* ================= SEARCH ================= */}
    <div className="px-3 pb-3">
      <div
        className={`
          flex items-center gap-2 px-3 py-2 rounded-full
          ${theme === "dark"
            ? "bg-[#202c33] text-white"
            : "bg-[#f0f2f5] text-black"}
        `}
      >
        <FaSearch className="text-[14px] opacity-60" />

        <input
          type="text"
          placeholder="Search or start new chat"
          value={searchTerms}
          onChange={(e) => setSearchTerms(e.target.value)}
          className="
            flex-1 bg-transparent outline-none text-sm
            placeholder:opacity-60
          "
        />
      </div>
    </div>

    {/* ================= CHAT LIST ================= */}
    <div className="overflow-y-auto h-[calc(100vh-112px)]">
      {filteredContacts.map((contact) => {
        const isActive = selectedContact?._id === contact?._id;

        return (
          <motion.div
            key={`${contact._id}-${contact?.conversation?._id || "self"}`}
            onClick={() => setSelectedContact(contact)}
            className={`
              px-4 py-3 flex items-center gap-3 cursor-pointer
              transition-colors
              ${theme === "dark"
                ? isActive
                  ? "bg-[#202c33]"
                  : "hover:bg-[#202c33]/70"
                : isActive
                ? "bg-[#f0f2f5]"
                : "hover:bg-[#f5f6f6]"}
            `}
          >
            {/* AVATAR */}
            <img
              src={contact?.profilePicture}
              alt={contact?.username}
              className="w-12 h-12 rounded-full object-cover"
            />

            {/* CONTENT */}
            <div className="flex-1 min-w-0 border-b border-black/5 dark:border-white/5 pb-3">
              {/* TOP */}
              <div className="flex items-center justify-between">
                <h3
                  className={`
                    text-[15px] font-medium truncate
                    ${theme === "dark" ? "text-white" : "text-[#111b21]"}
                  `}
                >
                  {contact?.isSelf ? "Saved Messages" : contact?.username}
                </h3>

                {contact?.conversation?.lastMessage && (
                  <span
                    className={`
                      text-[11px]
                      ${theme === "dark"
                        ? "text-white/50"
                        : "text-[#667781]"}
                    `}
                  >
                    {formatTimestamp(
                      contact?.conversation?.lastMessage?.createdAt
                    )}
                  </span>
                )}
              </div>

              {/* BOTTOM */}
              <div className="flex items-center justify-between mt-1 gap-2">
                <p
                  className={`
                    text-[13px] truncate
                    ${theme === "dark"
                      ? "text-white/60"
                      : "text-[#667781]"}
                  `}
                >
                  {contact?.conversation?.lastMessage?.content ||
                    " "}
                </p>

                {/* UNREAD */}
                {contact?.conversation?.unreadCount > 0 &&
                  contact?.conversation?.lastMessage?.receiver ===
                    user?._id && (
                    <span
                      className="
                        min-w-[20px] h-[20px]
                        px-1
                        bg-[#25D366]
                        text-white
                        text-[11px]
                        font-semibold
                        flex items-center justify-center
                        rounded-full
                      "
                    >
                      {contact?.conversation?.unreadCount}
                    </span>
                  )}
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  </div>
);

};

export default ChatList;
