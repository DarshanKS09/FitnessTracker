const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password -refreshTokens');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch {
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

router.put('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      req.body,
      { new: true }
    ).select('-password -refreshTokens');

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json(user);
  } catch {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
