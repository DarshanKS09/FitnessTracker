const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshTokens');
  res.json(user);
});

router.put('/me', auth, async (req, res) => {
  const updates = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password -refreshTokens');
  res.json(user);
});

module.exports = router;