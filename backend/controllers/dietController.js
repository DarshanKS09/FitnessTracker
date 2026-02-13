const DietPlan = require('../models/DietPlan');
const axios = require('axios');

function parseNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeGender(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v.startsWith('m')) return 'male';
  if (v.startsWith('f')) return 'female';
  return 'other';
}

function normalizeActivity(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v.includes('sedentary')) return 'sedentary';
  if (v.includes('light')) return 'light';
  if (v.includes('moderate')) return 'moderate';
  if (v.includes('active')) return 'active';
  return 'moderate';
}

function normalizeGoal(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v.includes('cut') || v.includes('fat')) return 'fat loss';
  if (v.includes('bulk') || v.includes('muscle')) return 'muscle gain';
  return 'maintenance';
}

function normalizePreference(value) {
  const v = String(value || '').trim().toLowerCase();
  if (v.includes('veg')) return v.includes('non') ? 'non-veg' : 'veg';
  return 'non-veg';
}

function calculateBMR({ weight, height, age, gender }) {
  // Mifflin-St Jeor
  if (gender === 'male') return 10 * weight + 6.25 * height - 5 * age + 5;
  if (gender === 'female') return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age; // neutral
}

function activityMultiplier(level) {
  if (level === 'sedentary') return 1.2;
  if (level === 'light') return 1.375;
  if (level === 'moderate') return 1.55;
  if (level === 'active') return 1.725;
  return 1.55;
}

function parseMealsFromGemini(text) {
  const src = String(text || '');
  const objMatch = src.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const parsed = JSON.parse(objMatch[0]);
      if (Array.isArray(parsed.meals)) return parsed.meals;
    } catch {}
  }
  const arrMatch = src.match(/\[[\s\S]*\]/);
  if (arrMatch) {
    try {
      const parsed = JSON.parse(arrMatch[0]);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
  }
  return [];
}

function buildFallbackMeals({ preference, calorieTarget, proteinTarget }) {
  const veg = preference === 'veg';
  if (veg) {
    return [
      {
        name: 'Breakfast',
        items: ['Oats with milk', 'Banana', 'Almonds'],
        calories: Math.round(calorieTarget * 0.25),
        protein: Math.round(proteinTarget * 0.22),
      },
      {
        name: 'Lunch',
        items: ['Brown rice', 'Dal', 'Paneer sabzi', 'Salad'],
        calories: Math.round(calorieTarget * 0.35),
        protein: Math.round(proteinTarget * 0.33),
      },
      {
        name: 'Evening Snack',
        items: ['Greek yogurt', 'Roasted chana'],
        calories: Math.round(calorieTarget * 0.15),
        protein: Math.round(proteinTarget * 0.18),
      },
      {
        name: 'Dinner',
        items: ['Chapati', 'Tofu/paneer curry', 'Vegetables'],
        calories: Math.round(calorieTarget * 0.25),
        protein: Math.round(proteinTarget * 0.27),
      },
    ];
  }

  return [
    {
      name: 'Breakfast',
      items: ['Oats with milk', 'Boiled eggs', 'Fruit'],
      calories: Math.round(calorieTarget * 0.25),
      protein: Math.round(proteinTarget * 0.25),
    },
    {
      name: 'Lunch',
      items: ['Rice/chapati', 'Chicken breast', 'Vegetables'],
      calories: Math.round(calorieTarget * 0.35),
      protein: Math.round(proteinTarget * 0.35),
    },
    {
      name: 'Evening Snack',
      items: ['Yogurt', 'Peanuts'],
      calories: Math.round(calorieTarget * 0.15),
      protein: Math.round(proteinTarget * 0.15),
    },
    {
      name: 'Dinner',
      items: ['Fish/chicken', 'Chapati', 'Salad'],
      calories: Math.round(calorieTarget * 0.25),
      protein: Math.round(proteinTarget * 0.25),
    },
  ];
}

async function generatePlan(req, res) {
  try {
    const userId = req.user.id;
    const age = parseNum(req.body?.age);
    const height = parseNum(req.body?.height);
    const weight = parseNum(req.body?.weight);
    const gender = normalizeGender(req.body?.gender);
    const activityLevel = normalizeActivity(req.body?.activityLevel);
    const goal = normalizeGoal(req.body?.goal);
    const preference = normalizePreference(req.body?.preference);

    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    if (!age || !height || !weight) {
      return res.status(400).json({ message: 'Age, height, and weight are required' });
    }

    const bmr = calculateBMR({ weight, height, age, gender });
    const tdee = Math.round(bmr * activityMultiplier(activityLevel));

    let calorieTarget = tdee;
    if (goal === 'fat loss') calorieTarget = Math.round(tdee * 0.8);
    if (goal === 'muscle gain') calorieTarget = Math.round(tdee * 1.15);

    const proteinPerKg = goal === 'muscle gain' ? 1.8 : 1.4;
    const proteinTarget = Math.round(proteinPerKg * weight);

    // Ask Gemini for a structured meal plan.
    const prompt =
      `Create a practical Indian-friendly 4-meal plan for one day. ` +
      `Profile: age ${age}, gender ${gender}, height ${height}cm, weight ${weight}kg, ` +
      `activity ${activityLevel}, goal ${goal}, preference ${preference}. ` +
      `Targets: ${calorieTarget} kcal and ${proteinTarget}g protein/day. ` +
      `Return ONLY JSON object with key "meals": ` +
      `[{"name":"Breakfast","items":["..."],"calories":number,"protein":number}]`;

    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    let meals = [];
    let aiSource = 'fallback';

    if (geminiKey) {
      try {
        const aiRes = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`,
          {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2 },
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 20000 }
        );

        const text = aiRes.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        meals = parseMealsFromGemini(text);
        if (meals.length > 0) aiSource = 'gemini';
      } catch (err) {
        console.error('Gemini diet generation failed:', err.response?.data || err.message);
      }
    } else {
      console.error('Gemini key missing: set GEMINI_API_KEY or GOOGLE_API_KEY in backend/.env');
    }

    if (!Array.isArray(meals) || meals.length === 0) {
      meals = buildFallbackMeals({ preference, calorieTarget, proteinTarget });
    }

    const plan = await DietPlan.create({
      userId,
      age,
      gender,
      height,
      weight,
      activityLevel,
      goal,
      preference,
      bmr,
      tdee,
      calorieTarget,
      proteinTarget,
      meals,
      aiSource,
    });

    res.json(plan);
  } catch (err) {
    console.error('Generate plan error', err);
    res.status(500).json({ message: 'Failed to generate plan', detail: err.message });
  }
}

async function getPlan(req, res) {
  const userId = req.user.id;
  if (!userId) return res.status(401).json({ message: 'Unauthorized' });
  const plan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });
  res.json(plan);
}

module.exports = { generatePlan, getPlan };
