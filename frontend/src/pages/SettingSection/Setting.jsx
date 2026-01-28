import React, { useState } from "react";
import useThemeStore from "../../store/themeStore";
import { logoutUser } from "../../services/user.service";
import useUserStore from "../../store/useUserStore";
import { toast } from "react-toastify";
import Layout from "../../components/Layout";
import { FaComments, FaMoon, FaSearch, FaSignInAlt, FaSun } from "react-icons/fa";
import { FaComment, FaQuestionCircle,  FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";

const Setting = () => {
  const [isThemeDialogOpen, setIsDialogOpen] = useState(false);

  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();

  const toggleThemeDialog = () => {
    setIsDialogOpen(!isThemeDialogOpen);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      toast.success("user logged out successfully");
    } catch (error) {
      toast.error("failed to logout",error);
    }
  };

 return (
    <Layout
      isThemeDialogOpen={isThemeDialogOpen}
      toggleThemeDialog={toggleThemeDialog}
    >
      <div
        className={`flex h-screen ${
          theme === "dark"
            ? "bg-[#111b21] text-gray-100"
            : "bg-white text-gray-900"
        }`}
      >
        {/* LEFT SIDEBAR */}
        <div
          className={`w-[400px] border-r ${
            theme === "dark" ? "border-[#2a3942]" : "border-gray-200"
          }`}
        >
           <div className="p-4 h-full flex flex-col">
            {/* TITLE */}
            <h1 className="text-xl font-semibold mb-4">Settings</h1>

            {/* SEARCH */}
            <div className="relative mb-4">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                placeholder="Search settings"
                className={`w-full h-10 pl-11 rounded-full outline-none text-sm
                ${
                  theme === "dark"
                    ? "bg-[#202c33] text-gray-100 placeholder-gray-400"
                    : "bg-[#f0f2f5] text-gray-900 placeholder-gray-500"
                }`}
              />
            </div>

            {/* USER PROFILE */}
            <div
              className={`flex items-center gap-4 p-3 rounded-lg cursor-pointer mb-4 transition
              ${
                theme === "dark"
                  ? "hover:bg-[#202c33]"
                  : "hover:bg-[#f0f2f5]"
              }`}
            >

              <img
                src={user?.profilePicture}
                alt="profile"
                className="w-14 h-14 rounded-full object-cover"
              />
              <div className="min-w-0">
                <h2 className="font-semibold truncate">{user?.username}</h2>
                <p className="text-sm text-gray-400 truncate">
                  {user?.about || "Hey there! I am using NashApp"}
                </p>
              </div>
            </div>

            {/* SETTINGS LIST */}
            <div className="flex-1 overflow-y-auto">
              <div className="space-y-1">
                {[
                  { icon: FaUser, label: "Account", href: "/user-profile" },
                  { icon: FaComments, label: "Chats", href: "/" },
                  { icon: FaQuestionCircle, label: "Help",
                    // href: "/help" 
                  },
                ].map((item) => (
                  <Link
                    to={item.href}
                    key={item.label}
                    className={`flex items-center gap-4 p-3 rounded-lg transition
                    ${
                      theme === "dark"
                        ? "hover:bg-[#202c33]"
                        : "hover:bg-[#f0f2f5]"
                    }`}
                  >
                    <item.icon className="h-5 w-5 text-gray-400" />
                    <div
                      className={`w-full pb-3 border-b
                      ${
                        theme === "dark"
                          ? "border-[#2a3942]"
                          : "border-gray-200"
                      }`}
                    >
                      {item.label}
                    </div>
                  </Link>
                ))}

                <button
  onClick={toggleThemeDialog}
  className={`w-full flex items-center gap-3 p-2 rounded ${
    theme === "dark"
      ? "text-white hover:bg-[#202c33]"
      : "text-black hover:bg-gray-100"
  }`}
>
  {theme === "dark" ? <FaSun className="h-5 w-5" /> : <FaMoon className="h-5 w-5" />}

  <div
    className={`flex flex-col text-start border-b w-full ${
      theme === "dark" ? "border-gray-700" : "border-gray-200"
    }`}
  >
    <span className="font-medium">Theme</span>
    <span className="text-sm text-gray-400">
      {theme.charAt(0).toUpperCase() + theme.slice(1)}
    </span>
  </div>
</button>

             </div>
<button
  onClick={handleLogout}
  className={`w-full flex items-center gap-3 p-2 rounded mt-10 md:mt-36 ${
    theme === "dark"
      ? "text-white hover:bg-[#202c33]"
      : "text-black hover:bg-gray-100"
  }`}
>
  <FaSignInAlt className="h-5 w-5 text-red-500" />
  <span className="text-red-500">Log Out</span>
</button>

</div>
</div>
</div>


        {/* RIGHT EMPTY PANEL (WhatsApp Style) */}
        <div className="flex-1" />
      </div>
    </Layout>
  );
};

export default Setting;
