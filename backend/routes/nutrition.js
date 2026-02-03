// backend/routes/nutrition.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const API_KEY = process.env.CALORIE_NINJAS_KEY;

// POST /api/nutrition/get-nutrition
router.post("/get-nutrition", async (req, res) => {
  try {
    const { food, weight } = req.body;

    if (!food || !weight) {
      return res.status(400).json({ error: "Food name and weight are required" });
    }

    // Build query like "150g chicken breast"
    const query = `${weight}g ${food}`;

    const response = await axios.get("https://api.calorieninjas.com/v1/nutrition", {
      params: { query },
      headers: { "X-Api-Key": API_KEY },
    });

    if (!response.data.items || response.data.items.length === 0) {
      return res.status(404).json({ error: "Food not found" });
    }

    const item = response.data.items[0];

    res.json({
      name: item.name,
      calories: item.calories,
      protein: item.protein_g,
      carbs: item.carbohydrates_total_g,
      fats: item.fat_total_g,
      serving_size: item.serving_size_g,
    });
  } catch (err) {
    console.error("Nutrition API error:", err.message);
    res.status(500).json({ error: "Failed to fetch nutrition data" });
  }
});

module.exports = router;
