const FoodLog = require('../models/FoodLog');
const WorkoutLog = require('../models/WorkoutLog');
const DietPlan = require('../models/DietPlan');

async function dashboard(req, res) {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0,0,0,0);

    // Daily totals
    const daily = await FoodLog.aggregate([
      { $match: { userId, createdAt: { $gte: today } } },
      { $group: { _id: null, calories: { $sum: '$calories' }, protein: { $sum: '$protein' } } }
    ]);

    const foodTotals = daily[0] || { calories: 0, protein: 0 };

    const workouts = await WorkoutLog.aggregate([
      { $match: { userId, createdAt: { $gte: today } } },
      { $group: { _id: null, caloriesBurned: { $sum: '$caloriesBurned' } } }
    ]);

    const burned = workouts[0]?.caloriesBurned || 0;

    // Weekly progress - last 7 days calories consumed
    const last7 = new Date();
    last7.setDate(last7.getDate() - 6);
    last7.setHours(0,0,0,0);

    const weekly = await FoodLog.aggregate([
      { $match: { userId, createdAt: { $gte: last7 } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, calories: { $sum: '$calories' } } },
      { $sort: { _id: 1 } }
    ]);

    const diet = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });

    res.json({ daily: foodTotals, burned, weekly, diet });
  } catch (err) {
    res.status(500).json({ message: 'Dashboard error' });
  }
}

module.exports = { dashboard };