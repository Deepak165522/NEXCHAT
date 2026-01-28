const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");

const sendOtpToEmail = require("../services/emailService");
const otpGenerate = require("../utils/otpGenerater");
const response = require("../utils/responseHandler");
const twilioService = require("../services/twilloService");
const generateToken = require("../utils/generatrToken");
const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");

// -------------------------------------------------------
// SEND OTP
// -------------------------------------------------------
const sendOtp = async (req, res) => {
  const { phoneNumber, phoneSuffix, email } = req.body;
  const otp = otpGenerate();
  const expiry = new Date(Date.now() + 5 * 60 * 1000);

  let user;

  try {
    if (email) {
      user = await User.findOne({ email });
      if (!user) user = new User({ email });

      user.emailOtp = otp;
      user.emailOtpExpiry = expiry;
      await user.save();
      await sendOtpToEmail(email, otp);

      return response(res, 200, "OTP sent to your email");
    }

    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and phone suffix are required");
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
    user = await User.findOne({ phoneNumber: fullPhoneNumber });
    if (!user) user = new User({ phoneNumber: fullPhoneNumber });

    await twilioService.sendOtpToPhoneNumber(fullPhoneNumber);
    await user.save();

    return response(res, 200, "OTP sent to your phone");
  } catch (err) {
    console.error(err);
    return response(res, 500, "Server error");
  }
};

// -------------------------------------------------------
// VERIFY OTP
// -------------------------------------------------------
const verifyOtp = async (req, res) => {
  const { email, otp, phoneNumber, phoneSuffix } = req.body;

  try {
    let user;

    if (email) {
      user = await User.findOne({ email });
      if (!user) return response(res, 404, "User not found");

      const now = new Date();
      if (
        !user.emailOtp ||
        String(user.emailOtp) !== String(otp) ||
        now > new Date(user.emailOtpExpiry)
      ) {
        return response(res, 400, "Invalid or expired OTP");
      }

      user.isVerified = true;
      user.emailOtp = null;
      user.emailOtpExpiry = null;
      await user.save();

      const token = generateToken(user._id);
      res.cookie("auth_token", token, {
        httpOnly: true,
        maxAge: 365 * 24 * 60 * 60 * 1000,
      });

      return response(res, 200, "Email verified successfully", { token, user });
    }

    if (!phoneNumber || !phoneSuffix) {
      return response(res, 400, "Phone number and phone suffix are required");
    }

    const fullPhoneNumber = `${phoneSuffix}${phoneNumber}`;
    user = await User.findOne({ phoneNumber: fullPhoneNumber });
    if (!user) return response(res, 404, "User not found");

    const result = await twilioService.verifyOtp(fullPhoneNumber, otp);
    if (result.status !== "approved") {
      return response(res, 400, "Invalid OTP");
    }

    user.isVerified = true;
    await user.save();

    const token = generateToken(user?._id);
    res.cookie("auth_token", token, {
      httpOnly: true,
      maxAge: 365 * 24 * 60 * 60 * 1000,
    });

    return response(res, 200, "Phone verified successfully", { token, user });
  } catch (err) {
    console.error(err);
    return response(res, 500, "Server error");
  }
};

// -------------------------------------------------------
// UPDATE PROFILE
// -------------------------------------------------------
const updateProfile = async (req, res) => {
  const { username, agreed, about } = req.body;
  const userId = req.user.userId;

  try {
    const user = await User.findById(userId);
    const file = req.file;

    if (file) {
      const uploadResult = await uploadFileToCloudinary(file);
      user.profilePicture = uploadResult?.secure_url;
    } else if (req.body.profilePicture) {
      user.profilePicture = req.body.profilePicture;
    }

    if (username) user.username = username;
    if (agreed) user.agreed = agreed;
    if (about) user.about = about;

    await user.save();
    return response(res, 200, "Profile updated successfully", user);
  } catch (err) {
    console.error(err);
    return response(res, 500, "Server error");
  }
};

// -------------------------------------------------------
// LOGOUT
// -------------------------------------------------------
const logout = (req, res) => {
  try {
  res.cookie("auth_token", "", { expires: new Date(0) });
  return response(res, 200, "Logged out successfully");
} catch (error) {
  console.log(error);
  return response(res, 500, "Internal server error");
}
}

// -------------------------------------------------------
// CHECK AUTH
// -------------------------------------------------------
const checkAuthenticated = async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId);
  if (!user) return response(res, 404, "User not found");
  return response(res, 200, "Authenticated", user);
};

// -------------------------------------------------------
// GET ALL USERS (CHAT LIST)
// -------------------------------------------------------
const getAllUsers = async (req, res) => {
  const loggedInUser = req.user.userId;

  try {
    // 1️⃣ Get all users except logged-in user
    const users = await User.find({ _id: { $ne: loggedInUser } })
      .select("username profilePicture lastSeen isOnline")
      .lean();

    // 2️⃣ Attach conversation with each user
    const usersWithConversation = await Promise.all(
      users.map(async (user) => {
        const conversation = await Conversation.findOne({
          participants: { $all: [loggedInUser, user._id] },
        })
          .select("lastMessage unreadCount updatedAt")
          .populate({
            path: "lastMessage",
            select: "content createdAt sender receiver",
          })
          .lean();

        return {
          ...user,
          conversation: conversation || null,
        };
      })
    );


    // 3️⃣ Sort chats by latest message (WhatsApp style)
    // usersWithConversation.sort((a, b) => {
    //   const timeA = a.conversation?.lastMessage?.createdAt || 0;
    //   const timeB = b.conversation?.lastMessage?.createdAt || 0;
    //   return new Date(timeB) - new Date(timeA);
    // });

    // 4️⃣ Send response
    return response(
      res,
      200,
      "Users retrieved successfully",
      usersWithConversation
    );

  } catch (error) {
    console.error("GET ALL USERS ERROR:", error);
    return response(res, 500, "Server error");
  }
};


// -------------------------------------------------------
// SEND MESSAGE (MERGED FROM messageController)
// -------------------------------------------------------
const sendMessage = async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.userId;

    if (!receiverId || !content) {
      return response(res, 400, "Receiver and content required");
    }

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    const newMessage = await Message.create({
      sender: senderId,
      receiver: receiverId,
      content,
      conversation: conversation._id,
    });

    conversation.lastMessage = newMessage._id;
    conversation.unreadCount = (conversation.unreadCount || 0) + 1;
    await conversation.save();

    return response(res, 200, "Message sent", newMessage);
  } catch (err) {
    console.error(err);
    return response(res, 500, "Server error");
  }
};

// -------------------------------------------------------
// EXPORTS
// -------------------------------------------------------
module.exports = {
  sendOtp,
  verifyOtp,
  updateProfile,
  logout,
  checkAuthenticated,
  getAllUsers,
  sendMessage
};
