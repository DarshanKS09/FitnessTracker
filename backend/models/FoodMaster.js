const mongoose = require('mongoose');

const FoodMasterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    caloriesPer100g: {
      type: Number,
      required: true,
    },

    proteinPer100g: {
      type: Number,
      required: true,
    },

    carbsPer100g: {
      type: Number,
      required: true,
    },

    fatsPer100g: {
      type: Number,
      required: true,
    },

    // grams per cup (for conversion)
    gramsPerCup: {
      type: Number,
      default: 240,
    },

    // grams per bowl (optional)
    gramsPerBowl: {
      type: Number,
      default: 300,
    },

    // grams per piece (generic default; can be adjusted per item later)
    gramsPerPiece: {
      type: Number,
      default: 50,
    },

    // grams per glass (for liquids)
    gramsPerGlass: {
      type: Number,
      default: 250,
    },

    // grams per katori
    gramsPerKatori: {
      type: Number,
      default: 150,
    },

    source: {
      type: String,
      enum: ['manual', 'dataset', 'usda', 'openai', 'gemini', 'calorieninjas', 'openfoodfacts'],
      default: 'manual',
    },
  },
  { timestamps: true }
);
module.exports =
  mongoose.models.FoodMaster ||
  mongoose.model('FoodMaster', FoodMasterSchema);

