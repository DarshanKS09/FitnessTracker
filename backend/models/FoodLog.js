const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    foodName: {
      type: String,
      required: true,
      trim: true,
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

module.exports = mongoose.model('FoodLog', foodLogSchema);
