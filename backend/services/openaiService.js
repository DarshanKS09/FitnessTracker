const axios = require('axios');

const OPENAI_API = 'https://api.openai.com/v1/chat/completions';

async function fetchNutrition(food) {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY not set');

  const prompt = `Return a JSON object containing per 100g nutrition values for "${food}" with keys: calories, protein, carbs, fats. All numeric values only.`;

  const res = await axios.post(OPENAI_API, {
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.2,
    max_tokens: 200,
  }, {
    headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
  });

  const text = res.data.choices?.[0]?.message?.content || '';

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
    throw new Error('Failed to parse nutrition from OpenAI response');
  }
}

module.exports = { fetchNutrition };