const FoodLog = require('../models/FoodLog');
const { fetchNutrition } = require('../services/openaiService');

async function addFood(req, res) {
  try {
    const { foodName, grams, bodyWeight, mealType } = req.body;
    const userId = req.user._id;

    const nutrition = await fetchNutrition(foodName);
    // nutrition is per 100g
    const multiplier = grams / 100;

    const log = await FoodLog.create({
      userId,
      foodName,
      grams,
      bodyWeight,
      mealType,
      calories: Number((nutrition.calories * multiplier).toFixed(2)),
      protein: Number((nutrition.protein * multiplier).toFixed(2)),
      carbs: Number((nutrition.carbs * multiplier).toFixed(2)),
      fats: Number((nutrition.fats * multiplier).toFixed(2)),
    });

    res.status(201).json(log);
  } catch (err) {
    console.error('Add food error', err.message);
    res.status(500).json({ message: 'Failed to add food' });
  }
}

async function getMyFood(req, res) {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    const filter = { userId };
    if (startDate || endDate) filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate);
    if (endDate) filter.createdAt.$lte = new Date(endDate);

    const logs = await FoodLog.find(filter).sort({ createdAt: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch logs' });
  }
}

async function updateFood(req, res) {
  try {
    const id = req.params.id;
    const entry = await FoodLog.findById(id);
    if (!entry) return res.status(404).json({ message: 'Not found' });
    if (!entry.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });

    const updates = req.body;
    if (updates.foodName && updates.grams) {
      const nutrition = await fetchNutrition(updates.foodName);
      const m = updates.grams / 100;
      updates.calories = Number((nutrition.calories * m).toFixed(2));
      updates.protein = Number((nutrition.protein * m).toFixed(2));
      updates.carbs = Number((nutrition.carbs * m).toFixed(2));
      updates.fats = Number((nutrition.fats * m).toFixed(2));
    }

    Object.assign(entry, updates);
    await entry.save();
    res.json(entry);
  } catch (err) {
    res.status(500).json({ message: 'Failed to update' });
  }
}

async function deleteFood(req, res) {
  try {
    const id = req.params.id;
    const entry = await FoodLog.findById(id);
    if (!entry) return res.status(404).json({ message: 'Not found' });
    if (!entry.userId.equals(req.user._id)) return res.status(403).json({ message: 'Forbidden' });
    await entry.remove();
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete' });
  }
}

async function dailyTotals(req, res) {
  try {
    const userId = req.user._id;
    const day = new Date(req.query.day || Date.now());
    const start = new Date(day);
    start.setHours(0,0,0,0);
    const end = new Date(start);
    end.setDate(end.getDate() + 1);

    const agg = await FoodLog.aggregate([
      { $match: { userId: userId, createdAt: { $gte: start, $lt: end } } },
      { $group: { _id: null, calories: { $sum: '$calories' }, protein: { $sum: '$protein' }, carbs: { $sum: '$carbs' }, fats: { $sum: '$fats' } } }
    ]);

    res.json(agg[0] || { calories: 0, protein: 0, carbs: 0, fats: 0 });
  } catch (err) {
    res.status(500).json({ message: 'Failed to get totals' });
  }
}

async function weeklyAggregation(req, res) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0,0,0,0);

    const agg = await FoodLog.aggregate([
      { $match: { userId: userId, createdAt: { $gte: weekStart } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, calories: { $sum: '$calories' }, protein: { $sum: '$protein' } } },
      { $sort: { _id: 1 } }
    ]);

    res.json(agg);
  } catch (err) {
    res.status(500).json({ message: 'Failed to aggregate' });
  }
}

module.exports = { addFood, getMyFood, updateFood, deleteFood, dailyTotals, weeklyAggregation };