import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";


import "./App.css";
import Login from "./pages/user-login/Login";
import HomePage from "./components/HomePage";
import UserDetails from "./components/UserDetails";
import Status from "./pages/StatusSection/Status";
import Setting from "./pages/SettingSection/Setting";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { ProtectedRoute, PublicRoute } from "./Protected";
import useUserStore from "./store/useUserStore";
import { initializeSocket } from "./services/chat.service";
import { useChatStore } from "./store/chatStore";
import CallHistoryPage from "./pages/callhistory/CallHistoryPage";
import CallsPage from "./pages/Calls/CallsPage";


function App() {
  const { user } = useUserStore();
  const { setCurrentUser, initSocketListeners, cleanup } = useChatStore();

  useEffect(() => {
    if (user?._id) {
      initializeSocket(); // 🔥 ONLY HERE
      setCurrentUser(user);
      initSocketListeners();
    }

    return () => {
      cleanup(); // ❌ socket disconnect mat karo
    };
  }, [user]);

  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/user-login" element={<Login />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/user-profile" element={<UserDetails />} />
            <Route path="/status" element={<Status />} />
            <Route path="/setting" element={<Setting />} />
            {/* <Route path="/calls" element={<CallHistoryPage />} /> */}
            <Route path="/calls" element={<CallsPage />} />


          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
