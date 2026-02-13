const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    foodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FoodMaster',
      index: true,
    },

    foodName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
    },

    unit: {
      type: String,
      enum: ['g', 'grams', 'cup', 'bowl'],
      required: true,
    },

    grams: {
      type: Number,
      required: true,
    },

    mealType: {
      type: String,
      enum: ['Breakfast', 'Morning Snack', 'Lunch', 'Evening Snack', 'Dinner'],
      required: true,
    },

    calories: {
      type: Number,
      required: true,
    },

    protein: {
      type: Number,
      required: true,
    },

    carbs: {
      type: Number,
      default: 0,
    },

    fats: {
      type: Number,
      default: 0,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

foodLogSchema.index({ userId: 1, date: 1 });

module.exports =
  mongoose.models.FoodLog ||
  mongoose.model('FoodLog', foodLogSchema);

