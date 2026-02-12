const WorkoutLog = require('../models/WorkoutLog');

// Add Workout
exports.addWorkout = async (req, res) => {
  try {
    const { type, distance, minutes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let caloriesBurned = 0;

    if (type === 'Walking') caloriesBurned = distance * 60;
    if (type === 'Running') caloriesBurned = distance * 90;
    if (type === 'Strength Training') caloriesBurned = minutes * 6;
    if (type === 'Cardio') caloriesBurned = minutes * 8;
    if (type === 'Swimming') caloriesBurned = minutes * 7;

    const workout = await WorkoutLog.create({
      userId: req.user.id,
      type,
      distance: distance || null,
      minutes: minutes || null,
      caloriesBurned,
      date: today, // IMPORTANT
    });

    res.status(201).json(workout);
  } catch (err) {
    res.status(500).json({ message: 'Failed to log workout' });
  }
};

// Get Today's Workouts
exports.getMyWorkouts = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const workouts = await WorkoutLog.find({
      userId: req.user.id,
      date: today,
    }).sort({ createdAt: -1 });

    res.json(workouts); // MUST be array
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch workouts' });
  }
};
