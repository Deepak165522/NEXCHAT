const mongoose = require('mongoose');

const statusSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    content: {
      type: String,
      required: true
    },

    contentType: {
      type: String,
      enum: ['image', 'video', 'text'],
      default: 'text'
    },

    viewers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],

  likes: {
  type: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  default: [],   // 🔥 THIS LINE
},



    expiresAt: {
      type: Date,
      required: true
    }
  },
  { timestamps: true }
);

const Status = mongoose.model('Status', statusSchema);
module.exports = Status;
