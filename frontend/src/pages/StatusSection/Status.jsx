import React, { useEffect, useRef, useState } from "react";
import  useThemeStore  from "../../store/themeStore";
import useUserStore from "../../store/useUserStore";
import useStatusStore from "../../store/useStatusStore";
import StatusPreview from "./StatusPreview";
import { useLocation } from "react-router-dom";
import Layout from "../../components/Layout"
import { useMemo } from "react";
import { motion } from "framer-motion";
import { RxCross2 } from "react-icons/rx";
import { FaCamera, FaEllipsisH, FaPlus, FaTimes } from "react-icons/fa";
import formatTimestamp from "../../utils/formatTime";
import StatusList from "./StatusList";
import { useChatStore } from "../../store/chatStore";
import { useNavigate } from "react-router-dom";
import EmojiPicker from "emoji-picker-react";
// Tabnine | Edit | Explain
const Status = () => {

  const [previewContact, setPreviewContact] = useState(null);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showOption, setShowOption] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [filePreview, setFilePreview] = useState(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();

  // status store
  const { cleanupSocket, statuses, loading, error, fetchStatuses, createStatus, viewStatus, deleteStatus, getStatusViewers, getUserStatuses, getOtherStatuses, clearError, reset, initializeSocket, } = useStatusStore();


const location = useLocation();

const { sendMessage } = useChatStore();
const navigate = useNavigate();

const pendingOpenRef = useRef(null);

const [showEmojiPicker, setShowEmojiPicker] = useState(false);
const emojiRef = useRef(null);

const isDeletedRef = useRef(false);



const userStatuses = useMemo(() => {
  return getUserStatuses(user?._id);
}, [user?._id, statuses]);

const otherStatuses = useMemo(() => {
  return getOtherStatuses(user?._id);
}, [user?._id, statuses]);

useEffect(() => {
  if (!pendingOpenRef.current) return;

  const { statusId, ownerId } = pendingOpenRef.current;

  const contact =
    ownerId === user?._id
      ? userStatuses
      : otherStatuses.find(
          (c) => String(c.id) === String(ownerId)
        );

  if (!contact) return;

  const index = contact.statuses.findIndex(
    (s) => String(s.id) === String(statusId)
  );

  if (index === -1) return;

  console.log("✅ Opening pending status");

  setPreviewContact({
    ...contact,
    statuses: [...contact.statuses],
  });
  setCurrentStatusIndex(index);

  pendingOpenRef.current = null;
}, [userStatuses, otherStatuses, user?._id]);


useEffect(() => {
  const handleClickOutside = (e) => {
    if (emojiRef.current && !emojiRef.current.contains(e.target)) {
      setShowEmojiPicker(false);
    }
  };

  if (showEmojiPicker) {
    document.addEventListener("mousedown", handleClickOutside);
  }

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, [showEmojiPicker]);




useEffect(() => {
  const handler = (e) => {
    if (isDeletedRef.current) return; 
     if (previewContact) return; 
    console.log("🔥 OPEN STATUS EVENT", e.detail);

    const { statusId, ownerId } = e.detail;

    const contact =
      ownerId === user?._id
        ? userStatuses
        : otherStatuses.find(
            (c) => String(c.id) === String(ownerId)
          );

    if (!contact) {
      pendingOpenRef.current = { statusId, ownerId };
      return;
    }

    const index = contact.statuses.findIndex(
      (s) => String(s.id) === String(statusId)
    );

    if (index === -1) return;

    setPreviewContact({
      ...contact,
      statuses: [...contact.statuses],
    });
    setCurrentStatusIndex(index);
  };

  window.addEventListener("open-status", handler);
  return () => window.removeEventListener("open-status", handler);
}, [userStatuses, otherStatuses, user?._id]);



useEffect(() => {
  isDeletedRef.current = false;
}, []);


useEffect(() => {

  if (isDeletedRef.current) return;
  if (
    !location.state?.fromChat ||
    !location.state?.statusId ||
    !location.state?.ownerId
  ) return;

  const { statusId, ownerId } = location.state;

  const contact =
    ownerId === user?._id
      ? getUserStatuses(user._id)
      : getOtherStatuses(user._id).find(
          (c) => String(c.id) === String(ownerId)
        );

  if (!contact || !contact.statuses?.length) {
    pendingOpenRef.current = { statusId, ownerId };
    return;
  }

  const index = contact.statuses.findIndex(
    (s) => String(s.id) === String(statusId)
  );

  if (index === -1) return;

  setPreviewContact({
    ...contact,
    statuses: [...contact.statuses],
  });

  setCurrentStatusIndex(index);

  // 🔥 VERY IMPORTANT
  navigate("/status", { replace: true });

}, [location.state, statuses, user?._id]);








useEffect(() => {
  fetchStatuses();
  initializeSocket();

  return () => {
    cleanupSocket();
  };
}, [user?._id]);


useEffect(() => {
  if (!previewContact) return;

  const updated =
    previewContact.id === user?._id
      ? getUserStatuses(user._id)
      : getOtherStatuses(user._id).find(
          (c) => String(c.id) === String(previewContact.id)
        );

  // 🔥 YE LINE GAME CHANGER HAI
  if (!updated || updated.statuses.length === 0) {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
    return;
  }

  setPreviewContact({
    ...updated,
    statuses: [...updated.statuses],
  });
}, [statuses]);





useEffect(() => {
  return () => clearError();
}, []);

const handleFileChange = (e) => {
  const file = e.target.files[0];

  if (file) {
    setSelectedFile(file);
   

    if (
      file.type.startsWith("image/") ||
      file.type.startsWith("video/")
    ) {
      setFilePreview(URL.createObjectURL(file));
    }
  }
};








const handleStatusReply = ({ text, status }) => {
  if (!text.trim()) return;

  const formData = new FormData();

  formData.append("senderId", user._id);

  // ✅ IMPORTANT: STATUS OWNER = CHAT RECEIVER
  formData.append("receiverId", status.owner._id);

  formData.append("content", text);
  formData.append("contentType", "text");

  // ✅ STATUS TAG (ONLY PLACE)
 formData.append(
  "replyToStatus",
  JSON.stringify({
    id: status.id,
    media: status.content || null,
 // ✅ ALWAYS content
    contentType: status.contentType,
    timestamp: status.timestamp,
    owner: {
      _id: status.owner._id,
      username: status.owner.username,
      profilePicture: status.owner.profilePicture,
    },
  })
);


  sendMessage(formData);

  // 🔥 WHATSAPP BEHAVIOUR
  handlePreviewClose();   // status band
  navigate("/");          // direct chat list
};







const handleCreateStatus = async () => {
  if (!newStatus.trim() && !selectedFile) return;

  try {
    await createStatus({
      content: newStatus,
      file: selectedFile,
    });

    setNewStatus("");
    setSelectedFile(null);
    setFilePreview(null);
    setShowCreateModal(false);
  } catch (error) {
    console.error("Error creating status", error);
  }
};


const handleViewStatus = async (statusId) => {
  try {
    await viewStatus(statusId);
  } catch (error) {
    console.error("Error to view status", error);
  }
};



const handleDeleteStatus = async (statusId) => {
  try {

    isDeletedRef.current = true;   // 🔥 MARK AS DELETED
    await deleteStatus(statusId);

    // 🔥 FORCE CLEAN UI STATE
    setPreviewContact(null);
    setCurrentStatusIndex(0);
    pendingOpenRef.current = null;

    // 🔥 BACK + REFRESH SAFE
    navigate("/status", { replace: true });

    setShowOption(false);

  } catch (error) {
    console.error("Error deleting status", error);
  }
};




const handlePreviewClose = () => {
  setPreviewContact(null);
  setCurrentStatusIndex(0);

   pendingOpenRef.current = null;

  // 🔥 CLEAR ROUTE STATE
  navigate("/status", { replace: true });
};


const handlePreviewNext = () => {
  // 👉 same user ke andar
  if (currentStatusIndex < previewContact.statuses.length - 1) {
    setCurrentStatusIndex((prev) => prev + 1);
    return;
  }

  // 👉 next user dhundo
  const allContacts = [
    ...(userStatuses ? [userStatuses] : []),
    ...otherStatuses,
  ];

  const currentUserIndex = allContacts.findIndex(
    (c) => String(c.id) === String(previewContact.id)
  );

  const nextContact = allContacts[currentUserIndex + 1];

  if (nextContact) {
    setPreviewContact({
      ...nextContact,
      statuses: [...nextContact.statuses],
    });
    setCurrentStatusIndex(0);
  } else {
    // ❗ last user ka last status
    handlePreviewClose();
  }
};


const handlePreviewPrev = () => {
  setCurrentStatusIndex((prev) =>
    Math.max(prev - 1, 0)
  );
};



const handleStatusPreview = (contact, statusIndex = 0) => {
  setPreviewContact({
    ...contact,
    statuses: [...contact.statuses],
  });
  setCurrentStatusIndex(statusIndex);
};


useEffect(() => {
  if (!previewContact) return;
   if (isDeletedRef.current) return;

  const status = previewContact.statuses[currentStatusIndex];
  if (!status) return;

  // 🔥 THIS IS THE FIX
  handleViewStatus(status.id);
}, [currentStatusIndex, previewContact]);







  return (
   <Layout
  isStatusPreviewOpen={!!previewContact}
  statusPreviewContent={
    previewContact && (
      <StatusPreview
        contact={previewContact}
        currentIndex={currentStatusIndex}
        onClose={handlePreviewClose}
        onNext={handlePreviewNext}
        onPrev={handlePreviewPrev}
        onDelete={handleDeleteStatus}
        onReply={handleStatusReply}  
        theme={theme}
        currentUser={user}
      />
    )
  }
>

<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4 }}
  className={`flex-1 h-screen border-r
  ${theme === "dark"
    ? "bg-[#111b21] text-gray-100 border-[#2a3942]"
    : "bg-[#f0f2f5] text-gray-900 border-gray-200"}`}
>

  <div
  className={`flex justify-between items-center px-4 py-3
  ${theme === "dark" ? "bg-[#202c33]" : "bg-white"}
  border-b ${theme === "dark" ? "border-[#2a3942]" : "border-gray-200"}`}
>
  <h2 className="text-xl font-semibold">Status</h2>
</div>


{error && (
  <div
    className={`mx-4 mt-2 flex items-center justify-between gap-3
    px-4 py-2 rounded-lg border text-sm
    ${theme === "dark"
      ? "bg-[#202c33] border-[#2a3942] text-red-400"
      : "bg-[#fff3f3] border-[#ffd6d6] text-red-600"}`}
  >
    <span className="truncate">{error}</span>

    <button
      onClick={clearError}
      className={`p-1 rounded hover:bg-black/5
      ${theme === "dark" ? "hover:bg-white/10" : ""}`}
      aria-label="Close error"
    >
      <RxCross2 className="h-4 w-4" />
    </button>
  </div>
)}



<div className="overflow-y-auto h-[calc(100vh-64px)]">

  {/* MY STATUS */}
  <div
    className={`flex items-center p-3 gap-4
    border-b
    ${theme === "dark"
      ? "bg-[#202c33] border-[#2a3942]"
      : "bg-white border-gray-200"}`}
  >
    <div
      className="relative cursor-pointer"
      onClick={() =>
        userStatuses
          ? handleStatusPreview(userStatuses)
          : setShowCreateModal(true)
      }
    >
      <img
        src={user?.profilePicture}
        alt={user?.username}
        className="w-12 h-12 rounded-full object-cover"
      />

      {userStatuses && (
        <svg
          className="absolute top-0 left-0 w-12 h-12"
          viewBox="0 0 100 100"
        >
          {userStatuses.statuses.map((_, index) => {
            const circumference = 2 * Math.PI * 48;
            const segmentLength =
              circumference / userStatuses.statuses.length;
            const offset = index * segmentLength;

            return (
              <circle
                key={index}
                cx="50"
                cy="50"
                r="48"
                fill="none"
                stroke="#25D366"
                strokeWidth="4"
                strokeDasharray={`${segmentLength - 5} 5`}
                strokeDashoffset={-offset}
                transform="rotate(-90 50 50)"
              />
            );
          })}
        </svg>
      )}

      <button
        className="absolute bottom-0 right-0 bg-[#25D366]
        text-white p-1 rounded-full border-2 border-white"
        onClick={(e) => {
          e.stopPropagation();
          setShowCreateModal(true);
        }}
      >
        <FaPlus className="h-2.5 w-2.5" />
      </button>
    </div>

    <div className="flex flex-col flex-1">
      <p className="font-medium">My Status</p>
      <p
        className={`text-sm ${
          theme === "dark" ? "text-gray-400" : "text-gray-500"
        }`}
      >
        {userStatuses
          ? `${userStatuses.statuses.length} update • ${formatTimestamp(
              userStatuses.statuses.at(-1).timestamp
            )}`
          : "Tap to add status update"}
      </p>
    </div>

    {userStatuses && (
      <button onClick={() => setShowOption(!showOption)}>
        <FaEllipsisH
          className={`h-5 w-5 ${
            theme === "dark" ? "text-gray-400" : "text-gray-500"
          }`}
        />
      </button>
    )}
  </div>

  {/* MY STATUS OPTIONS */}
  {showOption && userStatuses && (
    <div
      className={`mx-3 mt-2 rounded-lg shadow-md
      ${theme === "dark" ? "bg-[#202c33]" : "bg-white"}`}
    >
      <button
        className="w-full text-left px-3 py-2 text-sm
        text-[#25D366]
        hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]
        flex items-center gap-2 rounded-t-lg"
        onClick={() => {
          setShowCreateModal(true);
          setShowOption(false);
        }}
      >
        <FaCamera /> Add Status
      </button>

      <button
        className="w-full text-left px-3 py-2 text-sm
        text-blue-500
        hover:bg-[#f0f2f5] dark:hover:bg-[#2a3942]
        rounded-b-lg"
        onClick={() => {
          handleStatusPreview(userStatuses);
          setShowOption(false);
        }}
      >
        View Status
      </button>
    </div>
  )}

  {/* LOADING */}
  {loading && (
    <div className="flex justify-center items-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#25D366]" />
    </div>
  )}

  {/* RECENT UPDATES */}
  {!loading && otherStatuses.length > 0 && (
    <div
      className={`mt-4
      ${theme === "dark" ? "bg-[#202c33]" : "bg-white"}`}
    >
      <h3
        className={`px-4 pt-4 text-sm font-medium
        ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}
      >
        Recent updates
      </h3>

      <div className="px-4 pb-4 space-y-3">
        {otherStatuses.map((contact, index) => (
          <React.Fragment key={contact?.id}>
            <StatusList
              contact={contact}
              onPreview={() => handleStatusPreview(contact)}
              theme={theme}
            />

            {index < otherStatuses.length - 1 && (
              <hr
                className={`${
                  theme === "dark"
                    ? "border-[#2a3942]"
                    : "border-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )}

  {/* EMPTY STATE */}
  {!loading && statuses.length === 0 && (
    <div className="flex flex-col items-center p-8 text-center">
      <h3
        className={`text-base font-medium mb-1
        ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}
      >
        No status updates
      </h3>
      <p
        className={`text-sm
        ${theme === "dark" ? "text-gray-500" : "text-gray-500"}`}
      >
        Updates from your contacts will appear here
      </p>
    </div>
  )}

</div>



 {showCreateModal && (
  <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
    <div
      className={`w-full max-w-md mx-4 rounded-xl p-5
      ${theme === "dark"
        ? "bg-[#202c33] text-white"
        : "bg-white text-gray-900"}`}
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold">Create status</h3>
        <button
          onClick={() => {
            setShowCreateModal(false);
            setNewStatus("");
            setSelectedFile(null);
            setFilePreview(null);
          }}
          className="p-1 rounded hover:bg-black/5 dark:hover:bg-white/10"
        >
          <FaTimes className="h-4 w-4" />
        </button>
      </div>

      {/* PREVIEW */}
      {filePreview && (
        <div className="mb-4">
          {selectedFile?.type.startsWith("video/") ? (
            <video
              src={filePreview}
              controls
              className="w-full h-40 object-cover rounded-lg"
            />
          ) : (
            <img
              src={filePreview}
              alt="Preview"
              className="w-full h-40 object-cover rounded-lg"
            />
          )}
        </div>
      )}

      {/* TEXT */}
      <div className="relative">

  {/* TEXTAREA */}
  <textarea
    value={newStatus}
    onChange={(e) => setNewStatus(e.target.value)}
    placeholder="Type a status"
    rows={3}
    className={`w-full p-3 pr-10 rounded-lg text-sm resize-none
    ${theme === "dark"
      ? "bg-[#2a3942] text-white placeholder-gray-400"
      : "bg-[#f0f2f5] text-gray-800 placeholder-gray-500"}
    focus:outline-none focus:ring-2 focus:ring-[#25D366]`}
  />

  {/* 🙂 SMILE ICON (WhatsApp style) */}
  <button
    type="button"
    onClick={() => setShowEmojiPicker((prev) => !prev)}
    className={`absolute bottom-2 right-2 text-xl
    ${theme === "dark" ? "text-gray-300" : "text-gray-500"}
    hover:text-[#25D366] transition`}
  >
    🙂
  </button>

  {/* EMOJI PICKER */}
  {showEmojiPicker && (
  <div
    ref={emojiRef}
    className="
      fixed z-50
      top-1/2 left-1/2
      -translate-x-1/2 -translate-y-1/2
      w-[90vw] max-w-[360px]
      h-[360px] max-h-[50vh]
      overflow-hidden
      rounded-2xl
      shadow-xl
      bg-white dark:bg-[#202c33]
    "
  >
    <EmojiPicker
      width="100%"
      height="100%"
      theme={theme === "dark" ? "dark" : "light"}
      onEmojiClick={(emojiData) => {
        setNewStatus((prev) => prev + emojiData.emoji);
      }}
    />
  </div>
)}


</div>


      {/* FILE INPUT */}
      <label
        className={`flex items-center gap-2 text-sm mb-4 cursor-pointer
        ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
      >
        <FaCamera className="text-[#25D366]" />
        Add photo or video
        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </label>

      {/* ACTIONS */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => {
            setShowCreateModal(false);
            setNewStatus("");
            setSelectedFile(null);
            setFilePreview(null);
          }}
          disabled={loading}
          className="px-4 py-2 text-sm rounded-lg
          text-gray-500 hover:bg-black/5 dark:hover:bg-white/10"
        >
          Cancel
        </button>

        <button
          onClick={handleCreateStatus}
          disabled={loading || (!newStatus.trim() && !selectedFile)}
          className="px-4 py-2 text-sm rounded-lg
          bg-[#25D366] text-white
          hover:bg-[#1ebe5d]
          disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  </div>
)}




</motion.div>

</Layout>

  );
};

export default Status;
