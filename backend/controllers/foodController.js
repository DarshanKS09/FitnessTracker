const FoodLog = require('../models/FoodLog');
const FoodMaster = require('../models/FoodMaster');
const {
  searchDatasetSuggestions,
  lookupDatasetFood,
} = require('../services/foodDatasetService');
const mongoose = require('mongoose');

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreName(name, query) {
  const n = normalizeText(name);
  const q = normalizeText(query);
  if (!n || !q) return 0;

  let score = 0;
  if (n === q) score += 100;
  if (n.startsWith(q)) score += 70;

  const words = n.split(' ').filter(Boolean);
  const qWords = q.split(' ').filter(Boolean);
  for (const token of qWords) {
    if (n.includes(token)) score += 10;
    if (words.some((w) => w.startsWith(token))) score += 20;
  }
  return score;
}

const DEFAULT_CONVERSIONS = {
  gramsPerCup: 240,
  gramsPerBowl: 300,
  gramsPerPiece: 50,
  gramsPerGlass: 250,
  gramsPerKatori: 150,
};

function inferPieceGrams(datasetMatch) {
  const name = normalizeText(datasetMatch?.name || '');
  const category = normalizeText(datasetMatch?.category || '');

  if (name.includes('egg')) return 50;
  if (name.includes('idli')) return 55;
  if (name.includes('dosa')) return 100;
  if (name.includes('chapati') || name.includes('roti') || name.includes('thepla')) return 40;
  if (name.includes('paratha') || name.includes('naan')) return 80;
  if (name.includes('banana')) return 118;
  if (name.includes('apple')) return 182;
  if (name.includes('orange')) return 130;
  if (name.includes('burger bun') || name.includes('bun')) return 70;
  if (name.includes('bread')) return 30;
  if (name.includes('samosa')) return 90;

  if (category.includes('beverage') || String(datasetMatch?.servingUnit || '').toLowerCase().includes('ml')) {
    return 250;
  }

  return DEFAULT_CONVERSIONS.gramsPerPiece;
}

function getConversionProfile(datasetMatch) {
  const servingUnit = String(datasetMatch?.servingUnit || '').toLowerCase();
  const isLiquid = servingUnit.includes('ml') || normalizeText(datasetMatch?.category || '').includes('beverage');

  return {
    gramsPerCup: isLiquid ? 240 : DEFAULT_CONVERSIONS.gramsPerCup,
    gramsPerBowl: isLiquid ? 300 : DEFAULT_CONVERSIONS.gramsPerBowl,
    gramsPerPiece: inferPieceGrams(datasetMatch),
    gramsPerGlass: isLiquid ? 250 : DEFAULT_CONVERSIONS.gramsPerGlass,
    gramsPerKatori: isLiquid ? 150 : DEFAULT_CONVERSIONS.gramsPerKatori,
  };
}

async function ensureFoodConversions(food, datasetMatch) {
  const profile = getConversionProfile(datasetMatch);
  let changed = false;

  for (const [field, fallback] of Object.entries(profile)) {
    if (!Number.isFinite(Number(food[field])) || Number(food[field]) <= 0) {
      food[field] = fallback;
      changed = true;
    }
  }

  if (changed) {
    await food.save();
  }
}

async function findOrCreateFood(normalizedName) {
  let food = await FoodMaster.findOne({ name: normalizedName });
  const datasetMatch = await lookupDatasetFood(normalizedName);

  if (!datasetMatch) {
    throw new Error('Food not in dataset. Please select from suggestions.');
  }

  if (!food) {
    food = await FoodMaster.findOne({
      name: { $regex: escapeRegExp(normalizedName), $options: 'i' },
    });
  }

  if (!food) {
    const conv = getConversionProfile(datasetMatch);
    food = await FoodMaster.create({
      name: datasetMatch.name,
      caloriesPer100g: Number(datasetMatch.calories),
      proteinPer100g: Number(datasetMatch.protein),
      carbsPer100g: Number(datasetMatch.carbs),
      fatsPer100g: Number(datasetMatch.fats),
      gramsPerCup: conv.gramsPerCup,
      gramsPerBowl: conv.gramsPerBowl,
      gramsPerPiece: conv.gramsPerPiece,
      gramsPerGlass: conv.gramsPerGlass,
      gramsPerKatori: conv.gramsPerKatori,
      source: 'dataset',
    });
  } else if (!food.source || food.source === 'manual') {
    food.caloriesPer100g = Number(datasetMatch.calories);
    food.proteinPer100g = Number(datasetMatch.protein);
    food.carbsPer100g = Number(datasetMatch.carbs);
    food.fatsPer100g = Number(datasetMatch.fats);
    food.source = 'dataset';
    await food.save();
  }

  await ensureFoodConversions(food, datasetMatch);
  return food;
}

function calculateGrams(food, qty, unit) {
  if (unit === 'g' || unit === 'grams') return qty;

  if (unit === 'cup') {
    return qty * Number(food.gramsPerCup || DEFAULT_CONVERSIONS.gramsPerCup);
  }

  if (unit === 'bowl') {
    return qty * Number(food.gramsPerBowl || DEFAULT_CONVERSIONS.gramsPerBowl);
  }

  if (unit === 'piece' || unit === 'pieces') {
    return qty * Number(food.gramsPerPiece || DEFAULT_CONVERSIONS.gramsPerPiece);
  }

  if (unit === 'glass') {
    return qty * Number(food.gramsPerGlass || DEFAULT_CONVERSIONS.gramsPerGlass);
  }

  if (unit === 'katori') {
    return qty * Number(food.gramsPerKatori || DEFAULT_CONVERSIONS.gramsPerKatori);
  }

  throw new Error('Invalid unit');
}

function normalizeUnit(unit) {
  const raw = String(unit || '').trim().toLowerCase();

  if (['g', 'gram', 'grams', 'gm', 'gms'].includes(raw)) return 'grams';
  if (['cup', 'cups'].includes(raw)) return 'cup';
  if (['bowl', 'bowls'].includes(raw)) return 'bowl';
  if (['piece', 'pieces', 'pc', 'pcs'].includes(raw)) return 'piece';
  if (['glass', 'glasses'].includes(raw)) return 'glass';
  if (['katori', 'katoris'].includes(raw)) return 'katori';

  return '';
}

/* ======================
   FOOD SUGGESTIONS
====================== */

exports.getFoodSuggestions = async (req, res) => {
  try {
    const q = String(req.query?.q || '').trim();
    if (q.length < 1) return res.json([]);

    const datasetSuggestions = await searchDatasetSuggestions(q, 12).catch(() => []);

    const seen = new Set();
    const merged = [];

    for (const item of datasetSuggestions) {
      const name = String(item.name || '').trim();
      if (!name) continue;
      const k = name.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      merged.push({
        name,
        source: 'dataset',
        calories: Number(item.calories || 0),
        protein: Number(item.protein || 0),
        carbs: Number(item.carbs || 0),
        fats: Number(item.fats || 0),
        score: scoreName(name, q),
      });
    }

    merged.sort((a, b) => (b.score || 0) - (a.score || 0));
    return res.json(
      merged.slice(0, 12).map(({ score, ...rest }) => rest)
    );
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch food suggestions' });
  }
};

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
    const normalizedUnit = normalizeUnit(unit);
    if (!normalizedUnit) {
      return res.status(400).json({ message: 'Invalid unit' });
    }

    const food = await findOrCreateFood(normalizedName);
    let grams;
    try {
      grams = calculateGrams(food, qty, normalizedUnit);
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
      unit: normalizedUnit,
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
    const msg = err.message || 'Failed to add food';
    if (msg.toLowerCase().includes('dataset')) {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: msg });
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
    const nextUnitRaw = unit || log.unit || 'grams';
    const nextUnit = normalizeUnit(nextUnitRaw);
    const nextMealType = mealType || log.mealType;

    if (!nextName || !nextMealType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Quantity must be a positive number' });
    }
    if (!nextUnit) {
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
    const msg = err.message || 'Failed to update food log';
    if (msg.toLowerCase().includes('dataset')) {
      return res.status(400).json({ message: msg });
    }
    return res.status(500).json({ message: msg });
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
