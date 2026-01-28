import { io } from "socket.io-client";
import useUserStore from "../store/useUserStore";
import axiosInstance from "../services/url.service.js";
let socket = null;

const token = () => localStorage.getItem("auth_token")

export const initializeSocket = () => {
  if (socket) return socket;

  

  const BACKEND_URL = process.env.REACT_APP_API_URL;

  socket = io(BACKEND_URL, {
    // withCredentials: true,
    auth: {
      token: token(), // ✅ correct usage
    },
    transports: ["websocket", "polling"], // 🔥 stable
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);

    const user = useUserStore.getState().user;
    if (user?._id) {
      socket.emit("user-connected", user._id);
    }
  });

  socket.on("connect_error", (err) => {
    console.error("Socket connection error:", err.message);
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", reason);
  });

  return socket;
};

// ❌ NEVER disconnect socket on route change
export const disconnectSocket = () => {
  if(socket){
    socket.disconnect();
    socket=null;
  }
};

// ✅ always use this
export const getSocket = () => {
  if (!socket) return initializeSocket();
  return socket;
};


export const deleteChatForMe = (conversationId) => {
  return axiosInstance.delete(
    `/chats/conversations/${conversationId}/delete`
  );
};

