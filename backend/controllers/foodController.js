const FoodLog = require('../models/FoodLog');

// ADD FOOD (stores for today)
exports.addFood = async (req, res) => {
  try {
    const { foodName, grams, mealType } = req.body;

    if (!foodName || !grams || !mealType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Basic calorie/protein calculation (replace later with real nutrition DB)
    const calories = Math.round(Number(grams) * 1.5);
    const protein = Math.round(Number(grams) * 0.1);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const food = await FoodLog.create({
      userId: req.user.id,
      foodName,
      grams,
      mealType,
      calories,
      protein,
      date: today,
    });

    return res.status(201).json(food);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to add food' });
  }
};

// GET TODAY FOOD LOGS
exports.getMyFood = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const logs = await FoodLog.find({
      userId: req.user.id,
      date: today,
    }).sort({ createdAt: -1 });

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch food logs' });
  }
};

// DAILY TOTALS
exports.dailyTotals = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totals = await FoodLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: today,
        },
      },
      {
        $group: {
          _id: null,
          calories: { $sum: '$calories' },
          protein: { $sum: '$protein' },
        },
      },
    ]);

    return res.json(
      totals[0] || { calories: 0, protein: 0 }
    );
  } catch (err) {
    return res.status(500).json({ message: 'Failed to calculate totals' });
  }
};

// WEEKLY FOOD
exports.weeklyFood = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const weekly = await FoodLog.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: start },
        },
      },
      {
        $group: {
          _id: '$date',
          calories: { $sum: '$calories' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json(weekly);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch weekly data' });
  }
};
