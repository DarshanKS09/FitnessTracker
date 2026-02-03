const WorkoutLog = require('../models/WorkoutLog');

const METS = {
  walking: 3.5,
  running: 9.8,
  cycling: 7.5,
  swimming: 8,
  rowing: 7,
  default: 6,
};

function caloriesFromMet(met, weightKg, minutes) {
  return (met * 3.5 * (weightKg || 70) / 200) * minutes;
}

async function logWorkout(req, res) {
  try {
    const { cardioType, cardioMinutes, strengthMinutes, weightKg } = req.body;
    const userId = req.user._id;
    const met = METS[cardioType] || METS.default;
    const cardioCalories = caloriesFromMet(met, weightKg, cardioMinutes || 0);
    const strengthCalories = (strengthMinutes || 0) * 6; // rough estimate
    const total = Math.round(cardioCalories + strengthCalories);

    const rec = await WorkoutLog.create({ userId, cardioType, cardioMinutes, strengthMinutes, caloriesBurned: total });

    // PR tracking: if strengthMinutes > pr, update
    // Simplified PR logic
    if (strengthMinutes && strengthMinutes > (req.user.pr || 0)) {
      req.user.pr = strengthMinutes;
      await req.user.save();
    }

    res.json(rec);
  } catch (err) {
    res.status(500).json({ message: 'Failed to log workout' });
  }
}

async function getWorkouts(req, res) {
  const userId = req.user._id;
  const logs = await WorkoutLog.find({ userId }).sort({ createdAt: -1 });
  res.json(logs);
}

async function weeklySummary(req, res) {
  try {
    const userId = req.user._id;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0,0,0,0);

    const agg = await WorkoutLog.aggregate([
      { $match: { userId, createdAt: { $gte: weekStart } } },
      { $group: { _id: null, totalCalories: { $sum: '$caloriesBurned' }, sessions: { $sum: 1 } } }
    ]);

    res.json(agg[0] || { totalCalories: 0, sessions: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to summarize' });
  }
}

module.exports = { logWorkout, getWorkouts, weeklySummary };