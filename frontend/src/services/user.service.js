import axiosInstance from "./url.service";

import axios from "axios";

// 📌 Send OTP
export const sendOtp = async (phoneNumber,phoneSuffix,email) => {
  try {
    const response = await axiosInstance.post("/auth/send-otp", { phoneNumber, phoneSuffix, email });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// 📌 Verify OTP
export const verifyOtp = async (phoneNumber,phoneSuffix,email,otp) => {
  try {
    const response = await axiosInstance.post("/auth/verify-otp", { phoneNumber, phoneSuffix, otp, email });
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};


// 📌 Update User Profile
export const updateUserProfile = async (updateData) => {
  try {
    const response = await axiosInstance.put("/auth/update-profile", updateData);
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// 📌 Check User Authentication
export const checkUserAuth = async () => {
  try {
    const response = await axiosInstance.get("/auth/check-auth");

    if (response.data.status === "success") {
      return { isAuthenticated: true, user: response?.data?.data };
    } else if (response.data.status === "error") {
      return { isAuthenticated: false };
    }
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// 📌 Logout User
export const logoutUser = async () => {
  try {
    const response = await axiosInstance.get("/auth/logout");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};

// 📌 Get All Users
export const getAllUsers = async () => {
  try {
    const response = await axiosInstance.get("/auth/users");
    return response.data;
  } catch (error) {
    throw error.response ? error.response.data : error.message;
  }
};
