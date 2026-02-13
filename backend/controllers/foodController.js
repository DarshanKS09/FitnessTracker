const FoodLog = require('../models/FoodLog');
const FoodMaster = require('../models/FoodMaster');
const { fetchNutrition } = require('../services/nutritionService');
const mongoose = require('mongoose');

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function findOrCreateFood(normalizedName) {
  let food = await FoodMaster.findOne({ name: normalizedName });

  if (!food) {
    food = await FoodMaster.findOne({
      name: { $regex: escapeRegExp(normalizedName), $options: 'i' },
    });
  }

  if (!food) {
    const nutrition = await fetchNutrition(normalizedName);

    food = await FoodMaster.create({
      name: normalizedName,
      caloriesPer100g: Number(nutrition.calories),
      proteinPer100g: Number(nutrition.protein),
      carbsPer100g: Number(nutrition.carbs),
      fatsPer100g: Number(nutrition.fats),
      gramsPerCup: 240,
      gramsPerBowl: 300,
      source: nutrition.source,
    });
  } else if (!food.source) {
    // Backfill legacy rows that were created before source tracking.
    const nutrition = await fetchNutrition(normalizedName);
    food.caloriesPer100g = Number(nutrition.calories);
    food.proteinPer100g = Number(nutrition.protein);
    food.carbsPer100g = Number(nutrition.carbs);
    food.fatsPer100g = Number(nutrition.fats);
    food.source = nutrition.source;
    await food.save();
  }

  return food;
}

function calculateGrams(food, qty, unit) {
  if (unit === 'g' || unit === 'grams') return qty;

  if (unit === 'cup') {
    if (!food.gramsPerCup) throw new Error('Cup conversion unavailable');
    return qty * food.gramsPerCup;
  }

  if (unit === 'bowl') {
    if (!food.gramsPerBowl) throw new Error('Bowl conversion unavailable');
    return qty * food.gramsPerBowl;
  }

  throw new Error('Invalid unit');
}

/* ======================
   ADD FOOD
====================== */

exports.addFood = async (req, res) => {
  try {
    const { foodName, quantity, unit, mealType } = req.body;

    if (!foodName || !quantity || !unit || !mealType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const normalizedName = String(foodName).trim().toLowerCase();
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    if (!['g', 'grams', 'cup', 'bowl'].includes(unit)) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    const food = await findOrCreateFood(normalizedName);
    let grams;
    try {
      grams = calculateGrams(food, qty, unit);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    const calories = Math.round((grams / 100) * food.caloriesPer100g);
    const protein = Math.round((grams / 100) * food.proteinPer100g);
    const carbs = Math.round((grams / 100) * food.carbsPer100g);
    const fats = Math.round((grams / 100) * food.fatsPer100g);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const log = await FoodLog.create({
      userId: req.user.id,
      foodId: food._id,
      foodName: food.name,
      quantity: qty,
      unit,
      grams,
      mealType,
      calories,
      protein,
      carbs,
      fats,
      date: today,
    });

    return res.status(201).json(log);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to add food' });
  }
};

/* ======================
   UPDATE FOOD
====================== */

exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params;
    const { foodName, quantity, unit, mealType } = req.body;

    const log = await FoodLog.findById(id);
    if (!log) return res.status(404).json({ message: 'Food log not found' });
    if (String(log.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const nextName = String(foodName || log.foodName).trim().toLowerCase();
    const qty = quantity !== undefined ? Number(quantity) : Number(log.quantity || log.grams);
    const nextUnit = unit || log.unit || 'grams';
    const nextMealType = mealType || log.mealType;

    if (!nextName || !nextMealType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    if (!['g', 'grams', 'cup', 'bowl'].includes(nextUnit)) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    const food = await findOrCreateFood(nextName);

    let grams;
    try {
      grams = calculateGrams(food, qty, nextUnit);
    } catch (e) {
      return res.status(400).json({ message: e.message });
    }

    log.foodId = food._id;
    log.foodName = food.name;
    log.quantity = qty;
    log.unit = nextUnit;
    log.grams = grams;
    log.mealType = nextMealType;
    log.calories = Math.round((grams / 100) * food.caloriesPer100g);
    log.protein = Math.round((grams / 100) * food.proteinPer100g);
    log.carbs = Math.round((grams / 100) * food.carbsPer100g);
    log.fats = Math.round((grams / 100) * food.fatsPer100g);

    await log.save();
    return res.json(log);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: err.message || 'Failed to update food log' });
  }
};

/* ======================
   DELETE FOOD
====================== */

exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await FoodLog.findById(id);

    if (!log) return res.status(404).json({ message: 'Food log not found' });
    if (String(log.userId) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await FoodLog.findByIdAndDelete(id);
    return res.json({ message: 'Food deleted' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Failed to delete food log' });
  }
};

/* ======================
   GET TODAY FOOD LOGS
====================== */

exports.getMyFood = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const logs = await FoodLog.find({
      userId: req.user.id,
      createdAt: { $gte: today, $lt: tomorrow },
    })
      .populate('foodId', 'caloriesPer100g proteinPer100g')
      .sort({ createdAt: -1 });

    return res.json(logs);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch food logs' });
  }
};

/* ======================
   DAILY TOTALS
====================== */

exports.dailyTotals = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const totals = await FoodLog.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: today, $lt: tomorrow },
        },
      },
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

    return res.json(
      totals[0] || { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  } catch (err) {
    return res.status(500).json({ message: 'Failed to calculate totals' });
  }
};

/* ======================
   WEEKLY FOOD
====================== */

exports.weeklyFood = async (req, res) => {
  try {
    const start = new Date();
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const weekly = await FoodLog.aggregate([
      {
        $match: {
          userId,
          createdAt: { $gte: start },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          calories: { $sum: '$calories' },
          protein: { $sum: '$protein' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json(weekly);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch weekly data' });
  }
};
