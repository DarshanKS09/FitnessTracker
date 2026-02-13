const axios = require('axios');

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeNutritionValues({ calories, protein, carbs, fats }, source) {
  let cals = toNum(calories);
  let prot = toNum(protein);
  let carb = toNum(carbs);
  let fat = toNum(fats);

  if (prot === null) return null;
  if (carb === null) carb = 0;
  if (fat === null) fat = 0;

  if (cals === null) {
    const macroKcal = prot * 4 + carb * 4 + fat * 9;
    if (macroKcal > 0) cals = macroKcal;
  }
  if (cals === null) return null;

  if (cals < 0 || cals > 900) return null;
  if (prot < 0 || prot > 100) return null;
  if (carb < 0 || carb > 100) return null;
  if (fat < 0 || fat > 100) return null;

  return {
    calories: Number(cals.toFixed(2)),
    protein: Number(prot.toFixed(2)),
    carbs: Number(carb.toFixed(2)),
    fats: Number(fat.toFixed(2)),
    source,
  };
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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

  // Safety guardrails for per-100g values.
  if (calories < 0 || calories > 900) return null;
  if (protein < 0 || protein > 100) return null;
  if (carbs < 0 || carbs > 100) return null;
  if (fats < 0 || fats > 100) return null;

  // Optional extra consistency check (kcal from macros).
  const macroKcal = protein * 4 + carbs * 4 + fats * 9;
  if (macroKcal > 0) {
    const delta = Math.abs(macroKcal - calories) / macroKcal;
    if (delta > 1.2) return null;
  }

  return {
    calories: Number(calories.toFixed(2)),
    protein: Number(protein.toFixed(2)),
    carbs: Number(carbs.toFixed(2)),
    fats: Number(fats.toFixed(2)),
    source: 'usda',
  };
}

function scoreUsdaCandidate(food, query) {
  const name = normalizeText(food.description || '');
  const dataType = String(food.dataType || '').toLowerCase();
  const normalizedQuery = normalizeText(query);
  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  const words = name.split(/\s+/).filter(Boolean);

  let score = 0;

  if (name === normalizedQuery) score += 60;
  if (name.startsWith(normalizedQuery)) score += 35;

  for (const t of tokens) {
    if (name.includes(t)) score += 8;
    if (words.some((w) => w.startsWith(t))) score += 12;
  }

  if (dataType.includes('foundation')) score += 5;
  if (dataType.includes('sr legacy')) score += 4;
  if (dataType.includes('survey')) score += 3;
  if (dataType.includes('branded')) score += 1;

  const badTerms = [
    'powder',
    'mix',
    'supplement',
    'extract',
    'concentrate',
    'seasoning',
    'flavor',
    'peel',
    'dehydrated',
  ];
  for (const bad of badTerms) {
    if (name.includes(bad)) score -= 4;
  }

  return score;
}

async function fetchFromUSDA(food) {
  const key = process.env.USDA_FDC_API_KEY;
  if (!key) return null;

  const res = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
    params: {
      api_key: key,
      query: food,
      pageSize: 25,
    },
    timeout: 15000,
  });

  const foods = Array.isArray(res.data?.foods) ? res.data.foods : [];
  const ranked = foods
    .map((f) => ({ f, s: scoreUsdaCandidate(f, food) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.f);

  for (const candidate of ranked) {
    const normalized = normalizeUsdaFood(candidate);
    if (normalized) return normalized;
  }
  return null;
}

async function searchUSDASuggestions(query, limit = 8) {
  const q = String(query || '').trim();
  if (!q) return [];

  const key = process.env.USDA_FDC_API_KEY;
  if (!key) return [];

  const res = await axios.get('https://api.nal.usda.gov/fdc/v1/foods/search', {
    params: {
      api_key: key,
      query: q,
      pageSize: Math.max(limit * 5, 40),
    },
    timeout: 15000,
  });

  const foods = Array.isArray(res.data?.foods) ? res.data.foods : [];
  const ranked = foods
    .map((f) => ({ f, s: scoreUsdaCandidate(f, q) }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.f);

  const seen = new Set();
  const out = [];
  for (const f of ranked) {
    const name = String(f.description || '').trim();
    if (!name) continue;
    if (scoreUsdaCandidate(f, q) <= 0) continue;
    const keyName = name.toLowerCase();
    if (seen.has(keyName)) continue;
    seen.add(keyName);
    out.push({
      name,
      dataType: f.dataType || '',
      fdcId: f.fdcId || null,
    });
    if (out.length >= limit) break;
  }
  return out;
}

function parseJSONArray(text) {
  const src = String(text || '');
  const match = src.match(/\[[\s\S]*\]/);
  if (match) {
    try {
      const arr = JSON.parse(match[0]);
      if (!Array.isArray(arr)) return [];
      return arr
        .map((x) => String(x || '').trim())
        .filter(Boolean);
    } catch {}
  }

  // Fallback parse for bullet/line responses if model ignores JSON instruction.
  const lineItems = src
    .split('\n')
    .map((line) => line.replace(/^[-*0-9.)\s]+/, '').trim())
    .filter(Boolean)
    .filter((line) => line.length <= 120);
  if (lineItems.length > 0) return lineItems.slice(0, 20);

  // Fallback parse for comma-separated values in one line.
  return src
    .split(',')
    .map((x) => x.replace(/^[-*0-9.)\s]+/, '').trim())
    .filter(Boolean)
    .filter((x) => x.length <= 80)
    .slice(0, 20);
}

async function searchGeminiSuggestions(query, limit = 6) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  const q = String(query || '').trim();
  if (!key || !q) return [];

  const primaryPrompt =
    `Autocomplete task: user typed "${q}". ` +
    `Return up to ${limit} food names that START with or strongly match this text. ` +
    `Include common regional spellings and synonyms where useful (example: roti/chapati). ` +
    `Prefer common edible foods only. No brands, no supplements. ` +
    `Return ONLY a JSON array of strings.`;

  const callGemini = async (promptText, useJsonMime = false) => {
    const payload = {
      contents: [{ parts: [{ text: promptText }] }],
      generationConfig: {
        temperature: 0.1,
      },
    };
    if (useJsonMime) {
      payload.generationConfig.responseMimeType = 'application/json';
    }
    return axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`,
      payload,
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 12000,
      }
    );
  };

  const prompts = [
    { text: primaryPrompt, jsonMime: true },
    {
      text:
        `User typed "${q}" in a food search box. ` +
        `Return ${limit} likely food names as JSON array of strings. ` +
        `Each item should start with "${q[0]}" when possible.`,
      jsonMime: false,
    },
    {
      text:
        `STRICT: Return EXACTLY ${limit} edible food names for query "${q}". ` +
        `If exact prefix matches are few, include nearest common foods. ` +
        `Output only JSON array of strings.`,
      jsonMime: false,
    },
  ];

  const collected = [];
  for (const p of prompts) {
    try {
      const res = await callGemini(p.text, p.jsonMime);
      const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const parsed = parseJSONArray(text);
      if (parsed.length > 0) collected.push(...parsed);
      if (collected.length >= limit) break;
    } catch {}
  }

  const namesClean = collected
    .map((name) => name.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((name) => /^[a-zA-Z][a-zA-Z0-9\s,'/-]*$/.test(name))
    .filter((name, idx, arr) => arr.findIndex((x) => x.toLowerCase() === name.toLowerCase()) === idx)
    .slice(0, limit);

  return namesClean.map((name) => ({ name, source: 'gemini' }));
}

function parseAIJson(text, source = 'gemini') {
  const src = String(text || '');
  const match = src.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      const data = JSON.parse(match[0]);
      const normalized = normalizeNutritionValues(
        {
          calories: data.calories ?? data.kcal ?? data.energy,
          protein: data.protein ?? data.protein_g,
          carbs: data.carbs ?? data.carbohydrates ?? data.carbohydrate ?? data.carbs_g,
          fats: data.fats ?? data.fat ?? data.fat_g,
        },
        source
      );
      if (normalized) return normalized;
    } catch {}
  }

  const findNum = (patterns) => {
    for (const p of patterns) {
      const m = src.match(p);
      if (m && m[1] !== undefined) {
        const n = toNum(m[1]);
        if (n !== null) return n;
      }
    }
    return null;
  };

  const calories = findNum([
    /calories?\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
    /kcal\s*[:=]?\s*([0-9]+(?:\.[0-9]+)?)/i,
    /energy\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
  ]);
  const protein = findNum([
    /protein(?:_g)?\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
    /proteins?\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
  ]);
  const carbs = findNum([
    /carbs?(?:_g)?\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
    /carbohydrates?\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
  ]);
  const fats = findNum([
    /fats?(?:_g)?\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
    /lipids?\s*[:=]\s*([0-9]+(?:\.[0-9]+)?)/i,
  ]);

  return normalizeNutritionValues({ calories, protein, carbs, fats }, source);
}

async function fetchFromGemini(food) {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!key) return null;

  const prompt =
    `You are estimating nutrition for a food log. ` +
    `Interpret "${food}" as the closest common edible food item. ` +
    `Return ONLY one JSON object per 100g with numeric keys exactly: calories, protein, carbs, fats. ` +
    `No markdown, no explanations, no units.`;

  const res = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(key)}`,
    {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
      },
    },
    {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 15000,
    }
  );

  const text = res.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseAIJson(text, 'gemini');
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

  const fromGemini = await fetchFromGemini(normalized).catch(() => null);
  if (fromGemini) return fromGemini;

  const fromUSDA = await fetchFromUSDA(normalized).catch(() => null);
  if (fromUSDA) return fromUSDA;

  const fromNinjas = await fetchFromCalorieNinjas(normalized).catch(() => null);
  if (fromNinjas) return fromNinjas;

  const fromOpenFoodFacts = await fetchFromOpenFoodFacts(normalized).catch(() => null);
  if (fromOpenFoodFacts) return fromOpenFoodFacts;

  throw new Error('Unable to fetch reliable nutrition data for this food');
}

module.exports = { fetchNutrition, searchUSDASuggestions, searchGeminiSuggestions };
