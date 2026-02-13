const axios = require('axios');

const GEMINI_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

async function fetchNutrition(food) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY (or GOOGLE_API_KEY) not set');

  const prompt = `Return ONLY JSON for per 100g nutrition values for "${food}" with keys: calories, protein, carbs, fats. All values must be numbers.`;

  const res = await axios.post(
    `${GEMINI_API}?key=${encodeURIComponent(key)}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2 },
    },
    {
      headers: { 'Content-Type': 'application/json' },
    }
  );

  const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  try {
    // Try to find JSON in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON returned');
    const data = JSON.parse(jsonMatch[0]);
    return {
      calories: Number(data.calories) || 0,
      protein: Number(data.protein) || 0,
      carbs: Number(data.carbs) || 0,
      fats: Number(data.fats) || 0,
    };
  } catch (err) {
    throw new Error('Failed to parse nutrition from Gemini response');
  }
}

module.exports = { fetchNutrition };
