const fs = require('fs');
const path = require('path');

let cached = null;
let cachedMtimeMs = 0;

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function getDatasetPath() {
  const raw = process.env.FOOD_DATASET_PATH || 'data/foods.json';
  if (path.isAbsolute(raw)) return raw;
  return path.join(__dirname, '..', raw);
}

function parseAliases(value) {
  if (Array.isArray(value)) return value.map((x) => String(x || '').trim()).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function mapRow(row) {
  const name =
    row.name ||
    row.food ||
    row.foodName ||
    row.item ||
    row.description ||
    row.title;
  if (!name) return null;

  const calories =
    toNum(row?.macros?.calories) ??
    toNum(row.calories_per_100g) ??
    toNum(row.calories) ??
    toNum(row.kcal) ??
    toNum(row.energy_kcal) ??
    toNum(row.energy);

  const protein =
    toNum(row?.macros?.protein) ??
    toNum(row.protein_per_100g) ??
    toNum(row.protein) ??
    toNum(row.protein_g);

  const carbs =
    toNum(row?.macros?.carbs) ??
    toNum(row.carbs_per_100g) ??
    toNum(row.carbs) ??
    toNum(row.carbohydrates) ??
    toNum(row.carbohydrate_g) ??
    0;

  const fats =
    toNum(row?.macros?.fat) ??
    toNum(row.fats_per_100g) ??
    toNum(row.fats) ??
    toNum(row.fat) ??
    toNum(row.fat_g) ??
    0;

  if (calories === null || protein === null) return null;

  const aliases = parseAliases(row.aliases);
  const implicitAliases = norm(name)
    .split(' ')
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  const aliasesAll = [...aliases, ...implicitAliases];
  return {
    id: row.id || row.foodId || null,
    name: String(name).trim(),
    category: String(row.category || '').trim().toLowerCase(),
    servingUnit: String(row.servingUnit || row.unit || '100g').trim().toLowerCase(),
    nameNorm: norm(name),
    aliases: aliasesAll,
    aliasesNorm: aliasesAll.map(norm).filter(Boolean),
    calories: Number(calories),
    protein: Number(protein),
    carbs: Number(carbs),
    fats: Number(fats),
  };
}

async function loadDataset() {
  const filePath = getDatasetPath();
  let stat;
  try {
    stat = await fs.promises.stat(filePath);
  } catch {
    return [];
  }

  if (cached && cachedMtimeMs === stat.mtimeMs) return cached;

  const raw = await fs.promises.readFile(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    data = [];
  }

  const arr = Array.isArray(data)
    ? data
    : Array.isArray(data?.foods)
      ? data.foods
      : [];

  cached = arr.map(mapRow).filter(Boolean);
  cachedMtimeMs = stat.mtimeMs;
  return cached;
}

function scoreCandidate(item, queryNorm) {
  const names = [item.nameNorm, ...item.aliasesNorm];
  let score = 0;
  for (const n of names) {
    if (!n) continue;
    if (n === queryNorm) score = Math.max(score, 120);
    else if (n.startsWith(queryNorm)) score = Math.max(score, 90);
    else if (n.includes(queryNorm)) score = Math.max(score, 60);
    else {
      const tokens = queryNorm.split(' ').filter(Boolean);
      let tScore = 0;
      for (const t of tokens) {
        if (n.includes(t)) tScore += 10;
      }
      score = Math.max(score, tScore);
    }

    // Strong word-level matching so second-name searches work ("mudde" -> "ragi mudde").
    const words = n.split(' ').filter(Boolean);
    if (words.some((w) => w === queryNorm)) score = Math.max(score, 110);
    if (words.some((w) => w.startsWith(queryNorm))) score = Math.max(score, 95);
  }
  return score;
}

async function searchDatasetSuggestions(query, limit = 10) {
  const q = norm(query);
  if (!q) return [];
  const items = await loadDataset();
  if (!items.length) return [];

  return items
    .map((item) => ({ item, score: scoreCandidate(item, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ item }) => ({
      name: item.name,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fats: item.fats,
      source: 'dataset',
    }));
}

async function lookupDatasetFood(name) {
  const q = norm(name);
  if (!q) return null;
  const items = await loadDataset();
  if (!items.length) return null;

  const ranked = items
    .map((item) => ({ item, score: scoreCandidate(item, q) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.item || null;
}

module.exports = {
  loadDataset,
  searchDatasetSuggestions,
  lookupDatasetFood,
};
