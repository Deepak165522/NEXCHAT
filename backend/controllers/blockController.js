const User = require("../models/User");

// BLOCK
exports.blockUser = async (req, res) => {
  const userId = req.user.userId;
  const { blockUserId } = req.body;

  await User.findByIdAndUpdate(userId, {
    $addToSet: { blockedUsers: blockUserId }
  });

  return res.json({ success: true });
};

// UNBLOCK
exports.unblockUser = async (req, res) => {
  const userId = req.user.userId;
  const { unblockUserId } = req.body;

  await User.findByIdAndUpdate(userId, {
    $pull: { blockedUsers: unblockUserId }
  });

  return res.json({ success: true });
};
