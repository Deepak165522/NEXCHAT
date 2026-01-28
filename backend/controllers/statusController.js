const { uploadFileToCloudinary } = require("../config/cloudinaryConfig");
const Status = require("../models/Status");
const response = require("../utils/responseHandler");
const Message = require("../models/Message");

exports.createStatus = async (req, res) => {
  try {
    const { content, contentType } = req.body;
    const userId = req.user.userId;
    const file = req.file;

    let mediaUrl = null;
    let finalContentType = contentType || "text";

    // Handle file upload
    if (file) {
      const uploadFile = await uploadFileToCloudinary(file);
      if (!uploadFile?.secure_url) {
        return response(res, 400, "Failed to upload media");
      }

      mediaUrl = uploadFile?.secure_url;

      if (file.mimetype.startsWith("image")) {
        finalContentType = "image";
      } else if (file.mimetype.startsWith("video")) {
        finalContentType = "video";
      } else {
        return response(res, 400, "Unsupported file type");
      }
    }else if (content?.trim()){
      finalContentType="text";
    }else {
      return response(res, 400, "Message content is required");
    }

    const expiresAt = new Date(); 
    expiresAt.setHours(expiresAt.getHours() + 24)      // 24 hours from now


    // ❗ FIXED: `imageOrVideoUrl` variable missing
    const status = new Status({
      user: userId,
      content: content || mediaUrl,
      contentType: finalContentType,
      
     expiresAt
      
    });

    await status.save();

    console.log("Saved status:", status);


    const populatedStatus = await Status.findOne(status?._id)
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .populate("likes", "username profilePicture"); // ❤️ ADD THIS
      

    // Emit socket event
if (req.io && req.socketUserMap) {
  // Broadcast to all connecting users except the creator
  for (const [connectedUserId, socketId] of req.socketUserMap) {
    if (connectedUserId !== userId) {
      req.io.to(socketId).emit("new_status", populatedStatus);
    }
  }
}



    return response(res, 201, "Status created successfully", populatedStatus);
  } catch (error) {
    console.error("STATUS ERROR:", error);
    return response(res, 500, "Server error");
  }
};



exports.toggleLikeStatus = async (req, res) => {
  try {
    const { statusId } = req.params;
    const userId = req.user.userId;

    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }

    // 🔥 SAFETY FIX (MOST IMPORTANT)
    if (!status.likes) {
      status.likes = [];
    }

    const alreadyLiked = status.likes.some(
      (id) => String(id) === String(userId)
    );

    if (alreadyLiked) {
      status.likes = status.likes.filter(
        (id) => String(id) !== String(userId)
      );
    } else {
      status.likes.push(userId);
    }

    await status.save();

    const populatedStatus = await Status.findById(statusId)
      .populate("likes", "username profilePicture");

    return response(res, 200, "Like updated", populatedStatus.likes);
  } catch (error) {
    console.error("LIKE STATUS ERROR:", error);
    return response(res, 500, "Server error");
  }
};












exports.getStatuses = async (req, res) => {
  try {
    const statuses = await Status.find({
      expiresAt: { $gt: new Date() } // Only fetch non-expired statuses
    })
      .populate("user", "username profilePicture")
      .populate("viewers", "username profilePicture")
      .populate("likes", "username profilePicture") // ❤️ ADD THIS
      .sort({ createdAt: -1 });

    return response(res, 200, "Statuses fetched successfully", statuses);
  } catch (error) {
    console.error("GET STATUSES ERROR:", error);
    return response(res, 500, "Server error");
  }
};

exports.viewStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }

    if (!status.viewers.includes(userId)) {
      status.viewers.push(userId);
      await status.save();

      const updatedStatus = await Status.findById(statusId)
        .populate("user", "username profilePicture")
        .populate("viewers", "username profilePicture");


        // Emit socket event
if (req.io && req.socketUserMap) {
  // Broadcast to all connecting users except the creator
  const statusOwnerSocketId = req.socketUserMap.get(status.user.toString());
  if (statusOwnerSocketId) {
    const viewerUser = updatedStatus.viewers.find(
  (v) => String(v._id) === String(userId)
);

const viewData = {
  statusId,
  viewer: {
    _id: viewerUser._id,
    username: viewerUser.username,
    profilePicture: viewerUser.profilePicture,
  },
};

    req.io.to(statusOwnerSocketId).emit("status_viewed", viewData);
  } else {
    console.log("status owner not connected");
  }
}


      return response(res, 200, "Status viewed", updatedStatus);
    } else {
      console.log("User has already viewed this status");
      return response(res, 200, "Status viewed");
    }
  } catch (error) {
    console.error("VIEW STATUS ERROR:", error);
    return response(res, 500, "Server error");
  }
};

exports.deleteStatus = async (req, res) => {
  const { statusId } = req.params;
  const userId = req.user.userId;

  try {
    const status = await Status.findById(statusId);
    if (!status) {
      return response(res, 404, "Status not found");
    }

    if (status.user.toString() !== userId) {
      return response(res, 403, "You are not authorized to delete this status");
    }

    await Status.deleteOne();


// Emit socket event
if (req.io && req.socketUserMap) {
  for (const [connectedUserId, socketId] of req.socketUserMap) {
    if (connectedUserId !== userId) {
      req.io.to(socketId).emit("status_deleted", statusId);
    }
  }
}


    return response(res, 200, "Status deleted successfully");
  } catch (error) {
    console.error("DELETE STATUS ERROR:", error);
    return response(res, 500, "Server error");
  }
};
