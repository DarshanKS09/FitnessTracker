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
    },

    // grams per bowl (optional)
    gramsPerBowl: {
      type: Number,
    },

    source: {
      type: String,
      enum: ['manual', 'usda', 'openai', 'calorieninjas', 'openfoodfacts'],
      default: 'manual',
    },
  },
  { timestamps: true }
);
module.exports =
  mongoose.models.FoodMaster ||
  mongoose.model('FoodMaster', FoodMasterSchema);

