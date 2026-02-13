const FoodLog = require('../models/FoodLog');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');
const { calculateTargetsFromProfile } = require('../utils/fitnessTargets');
const mongoose = require('mongoose');

async function dashboard(req, res) {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const user = await User.findById(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Daily totals
    const daily = await FoodLog.aggregate([
      { $match: { userId, createdAt: { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: null,
          calories: { $sum: '$calories' },
          protein: { $sum: '$protein' },
          carbs: { $sum: '$carbs' },
          fats: { $sum: '$fats' },
        },
      },
    ]);

    const foodTotals = daily[0] || { calories: 0, protein: 0, carbs: 0, fats: 0 };

    // Burned calories
    const workouts = await WorkoutLog.aggregate([
      { $match: { userId, createdAt: { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: null,
          caloriesBurned: { $sum: '$caloriesBurned' },
        },
      },
    ]);

    const burned = workouts[0]?.caloriesBurned || 0;

    // Weekly calories (last 7 days)
    const last7 = new Date();
    last7.setDate(last7.getDate() - 6);
    last7.setHours(0, 0, 0, 0);

    const weekly = await FoodLog.aggregate([
      { $match: { userId, createdAt: { $gte: last7 } } },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          calories: { $sum: '$calories' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const targets = calculateTargetsFromProfile(user);

    res.json({
      daily: foodTotals,
      burned,
      weekly,
      diet: targets, // now calculated from profile
    });
  } catch (err) {
    res.status(500).json({ message: 'Dashboard error' });
  }
}

module.exports = { dashboard };
