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

  const fromNinjas = await fetchFromCalorieNinjas(normalized).catch(() => null);
  if (fromNinjas) return fromNinjas;

  const fromOpenFoodFacts = await fetchFromOpenFoodFacts(normalized).catch(() => null);
  if (fromOpenFoodFacts) return fromOpenFoodFacts;

  throw new Error('Unable to fetch reliable nutrition data for this food');
}

module.exports = { fetchNutrition };
