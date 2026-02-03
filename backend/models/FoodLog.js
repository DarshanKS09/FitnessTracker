const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  foodName: { type: String, required: true, index: true },
  grams: { type: Number, required: true },
  bodyWeight: { type: Number },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  carbs: { type: Number, default: 0 },
  fats: { type: Number, default: 0 },
  mealType: { type: String, default: 'General' },
  createdAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

module.exports = mongoose.model('FoodLog', foodLogSchema);
