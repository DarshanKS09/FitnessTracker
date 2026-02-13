const axios = require('axios');

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizePer100g(item) {
  const servingSize = toNum(item.serving_size_g) || 100;
  if (servingSize <= 0) return null;
  const scale = 100 / servingSize;

  const caloriesRaw = toNum(item.calories);
  const proteinRaw = toNum(item.protein_g);
  const carbsRaw = toNum(item.carbohydrates_total_g);
  const fatsRaw = toNum(item.fat_total_g);

  if (caloriesRaw === null || proteinRaw === null || carbsRaw === null || fatsRaw === null) {
    return null;
  }

  return {
    calories: Number((caloriesRaw * scale).toFixed(2)),
    protein: Number((proteinRaw * scale).toFixed(2)),
    carbs: Number((carbsRaw * scale).toFixed(2)),
    fats: Number((fatsRaw * scale).toFixed(2)),
    source: 'calorieninjas',
  };
}

async function fetchFromCalorieNinjas(food) {
  const key = process.env.CALORIE_NINJAS_KEY || process.env.API_KEY;
  if (!key) return null;

  const res = await axios.get('https://api.calorieninjas.com/v1/nutrition', {
    params: { query: `100g ${food}` },
    headers: { 'X-Api-Key': key },
    timeout: 12000,
  });

  const item = res.data?.items?.[0];
  if (!item) return null;
  return normalizePer100g(item);
}

function getNutrientAmount(nutrients = [], keys = []) {
  for (const n of nutrients) {
    const name = String(n.nutrientName || '').toLowerCase();
    const number = String(n.nutrientNumber || '').trim();
    const unit = String(n.unitName || '').toLowerCase();

    for (const key of keys) {
      const matchName = key.name ? name.includes(key.name) : false;
      const matchNumber = key.number ? number === key.number : false;
      const matchUnit = key.unit ? unit === key.unit : true;
      if ((matchName || matchNumber) && matchUnit) {
        const v = toNum(n.value);
        if (v !== null) return v;
      }
    }
  }
  return null;
}

function normalizeUsdaFood(food) {
  const nutrients = Array.isArray(food.foodNutrients) ? food.foodNutrients : [];

  let calories = getNutrientAmount(nutrients, [
    { number: '1008', unit: 'kcal' },
    { name: 'energy', unit: 'kcal' },
  ]);
  let protein = getNutrientAmount(nutrients, [
    { number: '1003' },
    { name: 'protein' },
  ]);
  let carbs = getNutrientAmount(nutrients, [
    { number: '1005' },
    { name: 'carbohydrate' },
  ]);
  let fats = getNutrientAmount(nutrients, [
    { number: '1004' },
    { name: 'total lipid (fat)' },
    { name: 'fat' },
  ]);

  if ([calories, protein, carbs, fats].some((v) => v === null)) return null;

  // Branded foods can be per serving. Normalize to per 100g when serving size in g is available.
  const servingSize = toNum(food.servingSize);
  const servingUnit = String(food.servingSizeUnit || '').toLowerCase();
  if (servingSize && servingSize > 0 && (servingUnit === 'g' || servingUnit === 'gram' || servingUnit === 'grams')) {
    const scale = 100 / servingSize;
    calories *= scale;
    protein *= scale;
    carbs *= scale;
    fats *= scale;
  }

  return {
    calories: Number(calories.toFixed(2)),
    protein: Number(protein.toFixed(2)),
    carbs: Number(carbs.toFixed(2)),
    fats: Number(fats.toFixed(2)),
    source: 'usda',
  };
}

async function fetchFromUSDA(food) {
  const key = process.env.USDA_FDC_API_KEY;
  if (!key) return null;

  const res = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
    params: {
      api_key: key,
      query: food,
      pageSize: 10,
    },
    timeout: 15000,
  });

  const foods = Array.isArray(res.data?.foods) ? res.data.foods : [];
  for (const candidate of foods) {
    const normalized = normalizeUsdaFood(candidate);
    if (normalized) return normalized;
  }
  return null;
}

function parseOpenAIJson(text) {
  const match = String(text || '').match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const data = JSON.parse(match[0]);
    const calories = toNum(data.calories);
    const protein = toNum(data.protein);
    const carbs = toNum(data.carbs);
    const fats = toNum(data.fats);

    if ([calories, protein, carbs, fats].some((v) => v === null)) return null;
    if (calories < 0 || protein < 0 || carbs < 0 || fats < 0) return null;

    return {
      calories: Number(calories.toFixed(2)),
      protein: Number(protein.toFixed(2)),
      carbs: Number(carbs.toFixed(2)),
      fats: Number(fats.toFixed(2)),
      source: 'openai',
    };
  } catch {
    return null;
  }
}

async function fetchFromOpenAI(food) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;

  const prompt =
    `Return ONLY JSON for nutrition per 100g edible portion of "${food}". ` +
    `Use keys exactly: calories, protein, carbs, fats. ` +
    `All values must be numbers (no units, no text).`;

  const res = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model: 'gpt-4o-mini',
      temperature: 0.1,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const text = res.data?.choices?.[0]?.message?.content || '';
  return parseOpenAIJson(text);
}

function pickOpenFoodFactsProduct(products = []) {
  for (const p of products) {
    const n = p?.nutriments || {};
    const protein = toNum(n.proteins_100g);
    const carbs = toNum(n.carbohydrates_100g);
    const fats = toNum(n.fat_100g);

    let calories = toNum(n['energy-kcal_100g']);
    if (calories === null) {
      const kj = toNum(n.energy_100g);
      if (kj !== null) calories = kj / 4.184;
    }

    if (protein !== null && carbs !== null && fats !== null && calories !== null) {
      return { calories, protein, carbs, fats };
    }
  }
  return null;
}

async function fetchFromOpenFoodFacts(food) {
  const res = await axios.get('https://world.openfoodfacts.org/cgi/search.pl', {
    params: {
      search_terms: food,
      search_simple: 1,
      action: 'process',
      json: 1,
      page_size: 20,
    },
    timeout: 12000,
  });

  const picked = pickOpenFoodFactsProduct(res.data?.products);
  if (!picked) return null;

  return {
    calories: Number(picked.calories.toFixed(2)),
    protein: Number(picked.protein.toFixed(2)),
    carbs: Number(picked.carbs.toFixed(2)),
    fats: Number(picked.fats.toFixed(2)),
    source: 'openfoodfacts',
  };
}

async function fetchNutrition(food) {
  const normalized = String(food || '').trim().toLowerCase();
  if (!normalized) throw new Error('Food name is required');

  const fromUSDA = await fetchFromUSDA(normalized).catch(() => null);
  if (fromUSDA) return fromUSDA;

  const fromOpenAI = await fetchFromOpenAI(normalized).catch(() => null);
  if (fromOpenAI) return fromOpenAI;

  const fromNinjas = await fetchFromCalorieNinjas(normalized).catch(() => null);
  if (fromNinjas) return fromNinjas;

  const fromOpenFoodFacts = await fetchFromOpenFoodFacts(normalized).catch(() => null);
  if (fromOpenFoodFacts) return fromOpenFoodFacts;

  throw new Error('Unable to fetch reliable nutrition data for this food');
}

module.exports = { fetchNutrition };
