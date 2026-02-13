const WorkoutLog = require('../models/WorkoutLog');

function calculateCalories(type, distance, minutes) {
  if (type === 'Walking') return (distance || 0) * 60;
  if (type === 'Running') return (distance || 0) * 90;
  if (type === 'Strength Training') return (minutes || 0) * 6;
  if (type === 'Cardio') return (minutes || 0) * 8;
  if (type === 'Swimming') return (minutes || 0) * 7;
  return 0;
}

// Add Workout
exports.addWorkout = async (req, res) => {
  try {
    const { type, distance, minutes } = req.body;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const caloriesBurned = calculateCalories(type, Number(distance), Number(minutes));

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

// Update Workout
exports.updateWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, distance, minutes } = req.body;

    const workout = await WorkoutLog.findById(id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    if (String(workout.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const nextType = type || workout.type;
    let nextDistance = distance !== undefined ? Number(distance) : workout.distance;
    let nextMinutes = minutes !== undefined ? Number(minutes) : workout.minutes;

    if (nextType === 'Walking' || nextType === 'Running') {
      if (!Number.isFinite(nextDistance) || nextDistance <= 0) {
        return res.status(400).json({ message: 'Distance must be a positive number' });
      }
      nextMinutes = null;
    } else {
      if (!Number.isFinite(nextMinutes) || nextMinutes <= 0) {
        return res.status(400).json({ message: 'Minutes must be a positive number' });
      }
      nextDistance = null;
    }

    workout.type = nextType;
    workout.distance = nextDistance;
    workout.minutes = nextMinutes;
    workout.caloriesBurned = calculateCalories(nextType, nextDistance, nextMinutes);

    await workout.save();
    return res.json(workout);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to update workout' });
  }
};

// Delete Workout
exports.deleteWorkout = async (req, res) => {
  try {
    const { id } = req.params;
    const workout = await WorkoutLog.findById(id);
    if (!workout) return res.status(404).json({ message: 'Workout not found' });
    if (String(workout.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await WorkoutLog.findByIdAndDelete(id);
    return res.json({ message: 'Workout deleted' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to delete workout' });
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
