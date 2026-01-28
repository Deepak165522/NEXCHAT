import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import useThemeStore from "../store/themeStore";
import useUserStore from "../store/useUserStore";
import useLayoutStore from "../store/layoutStore";
import { FaWhatsapp,FaUserCircle, FaCog, FaPhoneAlt } from "react-icons/fa";
import { motion } from "framer-motion";
import { MdRadioButtonChecked } from "react-icons/md";

const Sidebar = () => {
  const location = useLocation();

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ PATH FIXED (with slash)
  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("chats");
    } else if (location.pathname === "/status") {
      setActiveTab("status");
    } else if (location.pathname === "/user-profile") {
      setActiveTab("profile");
    } else if (location.pathname === "/setting") {
      setActiveTab("setting");
    }
    else if (location.pathname === "/calls") {
  setActiveTab("calls");
}

  }, [location, setActiveTab]);

  // Hide sidebar on mobile when chat is selected
  if (isMobile && selectedContact) {
    return null;
  }

  const SidebarContent = (
  <>
    {/* CHATS */}
    <Link
      to="/"
      className={`p-2 rounded-full transition
      ${!isMobile ? "mb-6" : ""}
      ${activeTab === "chats"
        ? theme === "dark"
          ? "bg-[#111b21]"
          : "bg-gray-200"
        : "hover:bg-black/5"}`}
    >
      <FaWhatsapp
        className={`h-6 w-6
        ${activeTab === "chats"
          ? "text-[#25D366]"
          : theme === "dark"
          ? "text-gray-300"
          : "text-gray-600"}`}
      />
    </Link>

    {/* STATUS */}
    <Link
      to="/status"
      className={`p-2 rounded-full transition
      ${!isMobile ? "mb-6" : ""}
      ${activeTab === "status"
        ? theme === "dark"
          ? "bg-[#111b21]"
          : "bg-gray-200"
        : "hover:bg-black/5"}`}
    >
      <MdRadioButtonChecked
        className={`h-6 w-6
        ${activeTab === "status"
          ? "text-[#25D366]"
          : theme === "dark"
          ? "text-gray-300"
          : "text-gray-600"}`}
      />
    </Link>

    {!isMobile && <div className="flex-grow" />}


    {/* CALLS */}
<Link
  // to="/calls"
  className={`p-2 rounded-full transition
  ${activeTab === "calls"
    ? theme === "dark"
      ? "bg-[#111b21]"
      : "bg-gray-200"
    : "hover:bg-black/5"}`}
>
  <FaPhoneAlt
    className={`h-6 w-6
    ${activeTab === "calls"
      ? "text-[#25D366]"
      : theme === "dark"
      ? "text-gray-300"
      : "text-gray-600"}`}
  />
</Link>



    {/* PROFILE */}
    <Link
      to="/user-profile"
      className={`p-1 rounded-full transition
      ${!isMobile ? "mb-6" : ""}
      ${activeTab === "profile"
        ? theme === "dark"
          ? "ring-2 ring-[#25D366]"
          : "ring-2 ring-green-500"
        : ""}`}
    >
      {user?.profilePicture ? (
        <img
          src={user.profilePicture}
          alt="user"
          className="h-7 w-7 rounded-full object-cover"
        />
      ) : (
        <FaUserCircle
          className={`h-7 w-7
          ${theme === "dark" ? "text-gray-300" : "text-gray-600"}`}
        />
      )}
    </Link>

    {/* SETTINGS */}
    <Link
      to="/setting"
      className={`p-2 rounded-full transition
      ${!isMobile ? "mb-6" : ""}
      ${activeTab === "setting"
        ? theme === "dark"
          ? "bg-[#111b21]"
          : "bg-gray-200"
        : "hover:bg-black/5"}`}
    >
      <FaCog
        className={`h-6 w-6
        ${activeTab === "setting"
          ? "text-[#25D366]"
          : theme === "dark"
          ? "text-gray-300"
          : "text-gray-600"}`}
      />
    </Link>
  </>
);


return (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.25 }}
    className={`
      flex items-center
      ${isMobile
        ? "fixed bottom-0 left-0 right-0 h-16 flex-row justify-around border-t z-50"
        : "flex-col w-16 py-4 border-r gap-6"}
      ${theme === "dark"
        ? "bg-[#202c33] border-[#2a3942]"
        : "bg-white border-gray-200"}
    `}
  >
    {SidebarContent}
  </motion.div>
);



};

export default Sidebar;
