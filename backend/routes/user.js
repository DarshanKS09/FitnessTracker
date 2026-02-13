const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const User = require('../models/User');
const { calculateTargetsFromProfile } = require('../utils/fitnessTargets');

function pickProfileUpdates(body = {}) {
  const numericFields = ['age', 'height', 'weight'];
  const textFields = ['name', 'gender', 'goal', 'activityLevel'];
  const updates = {};

  for (const field of textFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      updates[field] = body[field];
    }
  }

  for (const field of numericFields) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      const n = Number(body[field]);
      if (Number.isFinite(n)) updates[field] = n;
    }
  }

  return updates;
}

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
    const updates = pickProfileUpdates(req.body);

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password -refreshTokens');

    if (!user) return res.status(404).json({ message: 'User not found' });

    const targets = calculateTargetsFromProfile(user);
    res.json({ ...user.toObject(), targets });
  } catch {
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

module.exports = router;
