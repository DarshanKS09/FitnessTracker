const DietPlan = require('../models/DietPlan');
const { fetchNutrition } = require('../services/openaiService');
const axios = require('axios');

function calculateBMR({ weight, height, age, gender }) {
  // Mifflin-St Jeor
  if (gender === 'male') return 10 * weight + 6.25 * height - 5 * age + 5;
  if (gender === 'female') return 10 * weight + 6.25 * height - 5 * age - 161;
  return 10 * weight + 6.25 * height - 5 * age; // neutral
}

function activityMultiplier(level) {
  if (level === 'sedentary') return 1.2;
  if (level === 'moderate') return 1.55;
  if (level === 'active') return 1.725;
  return 1.2;
}

async function generatePlan(req, res) {
  try {
    const userId = req.user._id;
    const { age, gender, height, weight, activityLevel, goal, preference } = req.body;

    const bmr = calculateBMR({ weight, height, age, gender });
    const tdee = Math.round(bmr * activityMultiplier(activityLevel));

    let calorieTarget = tdee;
    if (goal === 'fat loss') calorieTarget = Math.round(tdee * 0.8);
    if (goal === 'muscle gain') calorieTarget = Math.round(tdee * 1.15);

    const proteinPerKg = goal === 'muscle gain' ? 1.8 : 1.4;
    const proteinTarget = Math.round(proteinPerKg * weight);

    // Ask AI for a sample meal plan (structured JSON)
    const prompt = `Provide a 3-meal sample meal plan for a ${preference} eater with daily calories ~${calorieTarget} and protein ~${proteinTarget}g. Return JSON with meals: [{name, items, calories, protein}]`;

    const aiRes = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 400
    }, { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } });

    let meals = [];
    try {
      const text = aiRes.data.choices?.[0]?.message?.content || aiRes.data.choices?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        meals = parsed.meals || [];
      }
    } catch (err) {
      meals = [];
    }

    const plan = await DietPlan.create({ userId, age, gender, height, weight, activityLevel, goal, preference, bmr, tdee, calorieTarget, proteinTarget, meals });

    res.json(plan);
  } catch (err) {
    console.error('Generate plan error', err.message);
    res.status(500).json({ message: 'Failed to generate plan' });
  }
}

async function getPlan(req, res) {
  const userId = req.user._id;
  const plan = await DietPlan.findOne({ userId }).sort({ createdAt: -1 });
  res.json(plan);
}

module.exports = { generatePlan, getPlan };