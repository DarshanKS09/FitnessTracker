const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const FoodLog = require('../models/FoodLog');

// GET Dashboard Data
router.get('/', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await FoodLog.find({
      userId: req.user.id,
      date: today,
    });

    const calories = logs.reduce((sum, item) => sum + item.calories, 0);
    const protein = logs.reduce((sum, item) => sum + item.protein, 0);

    res.json({
      daily: { calories, protein },
      burned: 0,
      weekly: [],
      diet: null,
    });
  } catch (err) {
    res.status(500).json({ message: 'Dashboard error' });
  }
});

module.exports = router;
