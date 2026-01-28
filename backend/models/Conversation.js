const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
      }
    ],

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
    },

    isSelf: {
      type: Boolean,
      default: false,
    },

   deletedFor: [
  {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
],



 

    unreadCount: {
      type: Number,
      default: 0,
    }
  },
  {
    timestamps: true
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
