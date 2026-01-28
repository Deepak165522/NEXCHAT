import React, { useEffect, useState , useRef } from "react";
import useUserStore from "../store/useUserStore";
import useThemeStore from "../store/themeStore";
import { updateUserProfile } from "../services/user.service";
import { toast } from "react-toastify";
import Layout from "./Layout";
import { motion } from "framer-motion";
import { FaCamera, FaCheck, FaPencilAlt, FaSmile } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
import EmojiPicker from "emoji-picker-react";

const UserDetails = () => {
  const [name, setName] = useState("");
  const [about, setAbout] = useState("");
  const [profilePicture, setProfilePicture] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingAbout, setIsEditingAbout] = useState(false);
  const [showNameEmoji, setShowNameEmoji] = useState(false);
  const [showAboutEmoji, setShowAboutEmoji] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user, setUser } = useUserStore();
  const { theme } = useThemeStore();


  const emojiRef = useRef(null);
const emojiBtnRef = useRef(null);


useEffect(() => {
  const handleClickOutside = (e) => {
    if (
      emojiRef.current &&
      !emojiRef.current.contains(e.target) &&
      emojiBtnRef.current &&
      !emojiBtnRef.current.contains(e.target)
    ) {
      setShowNameEmoji(false);
      setShowAboutEmoji(false);
    }
  };

  document.addEventListener("mousedown", handleClickOutside);

  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);



  useEffect(() => {
    if (user) {
      setName(user.username || "");
      setAbout(user.about || "");
    }
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
    setProfilePicture(file);
    setPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (field) => {
    try {
      setLoading(true);
      const formData = new FormData();

      if (field === "name") {
        formData.append("username", name);
        setIsEditingName(false);
        setShowNameEmoji(false);
      }

     else if (field === "about") {
        formData.append("about", about);
        setIsEditingAbout(false);
        setShowAboutEmoji(false);
      }

      if (field === "profile" && profilePicture) {
        formData.append("media", profilePicture);
      }

      const updated = await updateUserProfile(formData);
      setUser(updated?.data);
      setPreview(null);
      setProfilePicture(null);
      toast.success("Profile updated");
      setLoading(false)
    } catch (error) {
      console.error(error);
      toast.error("failed to update profile")
    } 
  };

  const handleEmojiSelect = (emoji, field) => {
    if (field === "name") {
      setName((prev) => prev + emoji.emoji);
      setShowNameEmoji(false);
    } else {
      setAbout((prev) => prev + emoji.emoji);
      setShowAboutEmoji(false);
    }
  };

  return (
  <Layout>
    <motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.4 }}
  className={`w-full min-h-screen flex
  ${theme === "dark"
    ? "bg-[#0b141a] text-white border-r border-[#2a3942]"
    : "bg-[#f0f2f5] text-black border-r border-gray-200"}
  `}
>

     <div className="w-full max-w-3xl mx-auto px-6 py-4 space-y-6">

  {/* HEADER */}
  <div className="flex items-center mb-4">
    <h1 className="text-2xl font-semibold">Profile</h1>
  </div>

  {/* PROFILE IMAGE */}
  <div className="flex flex-col items-center space-y-4">
    <div className="relative group">
      <img
        src={preview || user?.profilePicture}
        alt="profile"
        className="w-40 h-40 rounded-full object-cover border-2 border-[#25D366]"
      />

      <label
        htmlFor="profileUpload"
        className="absolute inset-0 rounded-full
        bg-black/60 flex flex-col items-center justify-center
        opacity-0 group-hover:opacity-100
        transition-all duration-300 cursor-pointer"
      >
        <FaCamera className="h-7 w-7 text-white mb-1" />
        <span className="text-sm text-white">Change</span>

        <input
          id="profileUpload"
          type="file"
          hidden
          accept="image/*"
          onChange={handleImageChange}
        />
      </label>
    </div>

    {preview && (
      <div className="flex gap-3">
        <button
          onClick={() => handleSave("profile")}
          className="px-5 py-2 rounded-full
          bg-[#25D366] hover:bg-[#1ebe5d]
          text-white text-sm font-medium"
        >
          {loading ? "Saving..." : "Save"}
        </button>

        <button
          onClick={() => {
            setPreview(null);
            setProfilePicture(null);
          }}
          className="px-5 py-2 rounded-full
          bg-gray-300 hover:bg-gray-400
          text-black text-sm"
        >
          Cancel
        </button>
      </div>
    )}
  </div>

  {/* NAME */}
  <div
    className={`relative p-4 rounded-lg shadow-sm
    ${theme === "dark" ? "bg-[#202c33]" : "bg-white"}`}
  >
    <label className="block text-sm text-gray-500 mb-1">
      Your name
    </label>

    <div className="flex items-center gap-2">
      {isEditingName ? (
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`flex-1 px-3 py-2 rounded-md
          focus:outline-none focus:ring-2 focus:ring-[#25D366]
          ${theme === "dark"
            ? "bg-[#2a3942] text-white"
            : "bg-[#f0f2f5] text-black"}`}
        />
      ) : (
        <span className="flex-1 px-3 py-2">
          {user?.username || name}
        </span>
      )}

      {isEditingName ? (
        <>
          <button onClick={() => handleSave("name")}>
            <FaCheck className="text-[#25D366]" />
          </button>
          <button 
          ref={emojiBtnRef}
          onClick={() => setShowNameEmoji(!showNameEmoji)}>
            <FaSmile className="text-[#25D366]" />
          </button>
          <button
            onClick={() => {
              setIsEditingName(false);
              setShowNameEmoji(false);
            }}
          >
            <MdCancel className="text-gray-400" />
          </button>
        </>
      ) : (
        <button onClick={() => setIsEditingName(true)}>
          <FaPencilAlt className="text-gray-400" />
        </button>
      )}
    </div>

    {showNameEmoji && (
      <div 
      ref={emojiRef}
      className="absolute right-0 top-full mt-2 z-50">
        <EmojiPicker
          theme={theme === "dark" ? "dark" : "light"}
          onEmojiClick={(e) =>
            handleEmojiSelect(e, "name")
          }
        />
      </div>
    )}
  </div>

  {/* ABOUT */}
  <div
    className={`relative p-4 rounded-lg shadow-sm
    ${theme === "dark" ? "bg-[#202c33]" : "bg-white"}`}
  >
    <label className="block text-sm text-gray-500 mb-1">
      About
    </label>

    <div className="flex items-center gap-2">
      {isEditingAbout ? (
        <input
          value={about}
          onChange={(e) => setAbout(e.target.value)}
          className={`flex-1 px-3 py-2 rounded-md
          focus:outline-none focus:ring-2 focus:ring-[#25D366]
          ${theme === "dark"
            ? "bg-[#2a3942] text-white"
            : "bg-[#f0f2f5] text-black"}`}
        />
      ) : (
        <span className="flex-1 px-3 py-2">
          {user?.about || about}
        </span>
      )}

      {isEditingAbout ? (
        <>
          <button onClick={() => handleSave("about")}>
            <FaCheck className="text-[#25D366]" />
          </button>
          <button 
           ref={emojiBtnRef}
          onClick={() => setShowAboutEmoji(!showAboutEmoji)}>
            <FaSmile className="text-[#25D366]" />
          </button>
          <button
            onClick={() => {
              setIsEditingAbout(false);
              setShowAboutEmoji(false);
            }}
          >
            <MdCancel className="text-gray-400" />
          </button>
        </>
      ) : (
        <button onClick={() => setIsEditingAbout(true)}>
          <FaPencilAlt className="text-gray-400" />
        </button>
      )}
    </div>

    {showAboutEmoji && (
      <div 
      ref={emojiRef}
      className="absolute right-0 top-full mt-2 z-50">
        <EmojiPicker
          theme={theme === "dark" ? "dark" : "light"}
          onEmojiClick={(e) =>
            handleEmojiSelect(e, "about")
          }
        />
      </div>
    )}
  </div>

</div>

      
      
      
    </motion.div>
  </Layout>
);

};

export default UserDetails;
