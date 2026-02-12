const FoodLog = require('../models/FoodLog');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');

function calculateTargets(user) {
  if (!user.height || !user.weight || !user.age || !user.goal || !user.activityLevel) {
    return null;
  }

  // BMR (Mifflin-St Jeor)
  let bmr;

  if (user.gender === 'Male') {
    bmr =
      10 * user.weight +
      6.25 * user.height -
      5 * user.age +
      5;
  } else {
    bmr =
      10 * user.weight +
      6.25 * user.height -
      5 * user.age -
      161;
  }

  const activityMap = {
    Sedentary: 1.2,
    Light: 1.375,
    Moderate: 1.55,
    Active: 1.725,
  };

  const tdee = bmr * (activityMap[user.activityLevel] || 1.2);

  let calorieTarget = tdee;

  if (user.goal === 'Cutting') calorieTarget -= 500;
  if (user.goal === 'Bulking') calorieTarget += 300;

  const proteinTarget = user.weight * 1.8;

  return {
    calorieTarget: Math.round(calorieTarget),
    proteinTarget: Math.round(proteinTarget),
  };
}

async function dashboard(req, res) {
  try {
    const userId = req.user._id;

    const user = await User.findById(userId);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Daily totals
    const daily = await FoodLog.aggregate([
      { $match: { userId, createdAt: { $gte: today } } },
      {
        $group: {
          _id: null,
          calories: { $sum: '$calories' },
          protein: { $sum: '$protein' },
        },
      },
    ]);

    const foodTotals = daily[0] || { calories: 0, protein: 0 };

    // Burned calories
    const workouts = await WorkoutLog.aggregate([
      { $match: { userId, createdAt: { $gte: today } } },
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

    const targets = calculateTargets(user);

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
