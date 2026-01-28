import React, { useEffect, useMemo, useRef, useState } from "react";
import { useForwardStore } from "../../store/useForwardStore";
import { useChatStore } from "../../store/chatStore";
import useUserStore from "../../store/useUserStore";
import { urlToFile } from "../../utils/urlToFile";
import { FaSearch, FaShare, FaSmile } from "react-icons/fa";
import EmojiPicker from "emoji-picker-react";

import { getAllUsers } from "../../services/user.service";


const ForwardModal = () => {
  const { forwardMessage, isOpen, closeForward } = useForwardStore();
  const { sendMessage, conversations } = useChatStore();
  const { user } = useUserStore();

  const [selectedIds, setSelectedIds] = useState([]);
  const [search, setSearch] = useState("");
  const [caption, setCaption] = useState("");
  const [useOriginalText, setUseOriginalText] = useState(true);
  const [showEmoji, setShowEmoji] = useState(false);

  const emojiRef = useRef(null);
const emojiButtonRef = useRef(null); // ✅ YE ADD KARNA THA
  const [allUsers, setAllUsers] = useState([]);

useEffect(() => {
  if (!isOpen) return;

  getAllUsers().then((res) => {
    if (res?.status === "success") {
      setAllUsers(res.data);
    }
  });
}, [isOpen]);


  /* 🔴 OUTSIDE CLICK FOR EMOJI */
 useEffect(() => {
  if (!showEmoji) return;

  const handler = (e) => {
    // ❌ picker ke andar click → ignore
    if (emojiRef.current?.contains(e.target)) return;

    // ❌ emoji button par click → ignore
    if (emojiButtonRef.current?.contains(e.target)) return;

    // ✅ baahar click → close
    setShowEmoji(false);
  };

  document.addEventListener("mousedown", handler);

  return () => {
    document.removeEventListener("mousedown", handler);
  };
}, [showEmoji]);


 const chatUsers = useMemo(() => {
  if (!allUsers?.length || !user?._id) return [];

  // 1️⃣ valid users only
  const validUsers = allUsers.filter(
    (u) => u && u._id && typeof u.username === "string"
  );

  // 2️⃣ ensure self exists (Saved Messages)
  const usersWithSelf = validUsers.some(
    (u) => u._id === user._id
  )
    ? validUsers
    : [user, ...validUsers];

  // 3️⃣ attach conversation + isSelf
  return usersWithSelf
    .map((u) => {
      const conv = conversations?.data?.find((c) =>
        c.participants.some((p) => p._id === u._id)
      );

      return {
        ...u,
        isSelf: u._id === user._id,
        conversation: u._id === user._id ? null : conv || null,
      };
    })
    .sort((a, b) => {
      const t1 = a.conversation?.lastMessage?.createdAt || 0;
      const t2 = b.conversation?.lastMessage?.createdAt || 0;
      return new Date(t2) - new Date(t1);
    });
}, [allUsers, conversations, user?._id]);





  /* 🔍 SEARCH */
  const filteredUsers = useMemo(() => {
  const q = search.toLowerCase();
  return chatUsers.filter(
  (u) => typeof u.username === "string" &&
         u.username.toLowerCase().includes(q)
);

}, [chatUsers, search]);


  if (!isOpen || !forwardMessage) return null;

 const toggle = (id) => {
  setSelectedIds((prev) =>
    prev.includes(id)
      ? prev.filter((x) => x !== id)
      : [...prev, id]
  );
};




  /* 🚀 SEND */
const handleSend = async () => {
  for (const receiverId of selectedIds) {
    const fd = new FormData();

    fd.append("senderId", user._id);
    fd.append("receiverId", receiverId);
    fd.append("contentType", forwardMessage.contentType);
    fd.append("isForwarded", true);

    // 🧠 FINAL CONTENT DECISION (ONLY ONCE)
    let finalContent = "";

    if (forwardMessage.contentType === "text") {
      // 🔹 TEXT → ONLY ORIGINAL
      finalContent = forwardMessage.content || "";
    } else {
      // 🔹 NON-TEXT
      if (caption.trim()) {
        finalContent = caption.trim(); // user typed
      } else if (useOriginalText) {
        finalContent = forwardMessage.content || "";
      }
    }

    fd.append("content", finalContent);

    // 🖼 IMAGE / VIDEO / AUDIO
    if (["image", "video", "audio"].includes(forwardMessage.contentType)) {
      const file = await urlToFile(
        forwardMessage.imageOrVideoUrl,
        "forwarded"
      );
      fd.append("media", file);
    }

    // 📍 LOCATION
    if (forwardMessage.contentType === "location") {
      fd.append(
        "location",
        JSON.stringify(forwardMessage.location)
      );
    }

    // 📊 POLL
    if (forwardMessage.contentType === "poll") {
      fd.append(
        "poll",
        JSON.stringify(forwardMessage.poll)
      );
    }

    await sendMessage(fd);
  }

  setSelectedIds([]);
  setCaption("");
  closeForward();
};







  return (
   <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center">

      <div
  className="
    bg-white dark:bg-[#111b21]
    w-full sm:w-[420px]
    h-[85vh] sm:h-auto
    rounded-t-2xl sm:rounded-xl
    flex flex-col
    shadow-xl
  "
>

       <h3 className="font-semibold text-base px-4 py-3
  text-gray-900 dark:text-gray-100
  border-b border-gray-200 dark:border-[#2a3942]"
>
  Forward to
</h3>


        {/* 🔍 SEARCH */}
        <div className="relative px-3 py-2">
           <FaSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats"
           className="
      w-full pl-9 pr-3 py-2
      rounded-full text-sm
      bg-gray-100 dark:bg-[#202c33]
      text-gray-900 dark:text-gray-100
      placeholder-gray-400
      focus:outline-none
    "
          />
        </div>

        {/* 🧑 CHAT LIST */}
        <div className="flex-1 overflow-y-auto px-1">

          {filteredUsers.map((u) => {
  const isMe = u._id === user._id;


//   console.log("allUsers", allUsers);
// console.log("current user", user);



  return (
    <div
      key={u._id}
      onClick={() => toggle(u._id, u.isSelf)}
      className={`
  flex items-center gap-3 px-4 py-2 cursor-pointer
  transition
  ${
    u.isSelf
      ? "bg-[#e7fce3] dark:bg-[#1f2c33]"
      : selectedIds.includes(u._id)
      ? "bg-[#d9fdd3] dark:bg-[#134d37]"
      : "hover:bg-gray-100 dark:hover:bg-[#202c33]"
  }
`}

    >
      {/* 🔒 Checkbox */}
    <input
  type="checkbox"
  checked={selectedIds.includes(u._id)}
  readOnly
  className="
    accent-green-500
    w-4 h-4
  "
/>



      {/* Avatar */}
      <img
        src={u.profilePicture}
        className="w-10 h-10 rounded-full object-cover"
        alt={u.username}
      />

      {/* Name */}
      <div className="flex flex-col">
        <span
  className={`text-sm font-medium ${
    u.isSelf ? "text-green-600" : ""
  }`}
>
  {u.isSelf ? "Saved Messages" : u.username}

  {u.isSelf && (
    <span className="ml-1 text-xs text-gray-500">(You)</span>
  )}
</span>



        {u.conversation?.lastMessage && (
          <span className="text-xs text-gray-400 truncate">
            {u.conversation.lastMessage.content}
          </span>
        )}
      </div>
    </div>
  );
})}

        </div>

        {/* 🔘 ORIGINAL TEXT TOGGLE (MEDIA ONLY) */}
        {forwardMessage.contentType !== "text" &&
          forwardMessage.content && (
            <label className="flex items-center gap-2 text-sm px-4 mt-2
  text-gray-700 dark:text-gray-300">

              <input
                type="checkbox"
                checked={useOriginalText}
                onChange={() =>
                  setUseOriginalText((v) => !v)
                }
              />
              Send existing text
            </label>
          )}

        {/* 📝 CAPTION */}
       {/* 📝 CAPTION (ONLY FOR NON-TEXT) */}
{forwardMessage.contentType !== "text" && (
  <div className="relative mt-2">
    <textarea
      value={caption}
      onChange={(e) => setCaption(e.target.value)}
      placeholder="Add a caption..."
      className="
    w-full px-4 py-2 text-sm resize-none
    bg-gray-100 dark:bg-[#202c33]
    text-gray-900 dark:text-gray-100
    placeholder-gray-400
    rounded-lg
    focus:outline-none
  "
/>

    <button
      type="button"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={() => setShowEmoji((p) => !p)}
      className="absolute right-2 bottom-2 text-gray-500"
    >
      <FaSmile />
    </button>

    {showEmoji && (
      <div
        ref={emojiRef}
        className="absolute right-0 bottom-full z-50"
      >
        <EmojiPicker
          onEmojiClick={(e) =>
            setCaption((p) => p + e.emoji)
          }
        />
      </div>
    )}
  </div>
)}


        {/* 🚀 FOOTER */}
        <div className="flex justify-end gap-3 px-4 py-3
  border-t border-gray-200 dark:border-[#2a3942]"
>
          <button onClick={closeForward}
           className="text-sm text-gray-600 dark:text-gray-300">
          
            Cancel
          </button>

          <button
            onClick={handleSend}
            disabled={!selectedIds.length}
            className={`
    flex items-center gap-2 px-4 py-2 rounded-full text-sm
    ${
      selectedIds.length
        ? "bg-[#25d366] text-white hover:bg-[#1ebe5d]"
        : "bg-gray-300 text-gray-500"
    }
  `}
>
            <FaShare />
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForwardModal;
