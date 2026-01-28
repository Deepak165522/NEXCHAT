const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },

    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    content: {
      type: String,
      default:"",
    },

    imageOrVideoUrl: {
      type: String,
    },

    contentType: {
      type: String,
      enum: ["image", "video", "text", "call", "audio","location","poll"],
      default: "text",
    },

    callType: {
  type: String,
  enum: ["audio", "video"],
},

callStatus: {
  type: String,
  enum: ["missed", "ended", "rejected"],
},

callDuration: {
  type: Number,
  default: 0, // seconds
},

endedBy: {
  type: String,
  enum: ["caller", "receiver", "system"],
},


replyTo: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Message",
  default: null,
},


visibleTo: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],





replyToStatus: {
  id: {
    type: String, // status id (custom id)
  },
  media: {
    type: String, // text / image / video url
  },
  contentType: {
    type: String,
    enum: ["text", "image", "video"],
  },
  timestamp: {
    type: Number,
  },
  owner: {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    username: String,
    profilePicture: String,
  },
},









deletedFor: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],

deletedForEveryone: {
  type: Boolean,
  default: false,
},


location: {
    lat: Number,
    lng: Number,
    isLive: Boolean,
    expiresAt: Date,
  },


isForwarded: {
  type: Boolean,
  default: false,
},

forwardedFrom: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "User",
},




  poll: {
  question: String,
  options: [
    {
      text: String,
      votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },
  ],
  allowMultiple: Boolean,
},

starredBy: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }
],



isPinned: {
  type: Boolean,
  default: false,
},

pinExpiresAt: {
  type: Date,
  default: null,
},






   reactions: [
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    emojis: {
      type: [String], // 👈 ek user ke multiple emojis
      default: [],
    },
  },
],


    messageStatus: {
      type: String,
      default: "sent", // delivered, seen, etc.
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;
