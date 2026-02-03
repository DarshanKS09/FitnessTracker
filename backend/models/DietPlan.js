const mongoose = require('mongoose');

const DietPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  activityLevel: String,
  goal: String,
  preference: String,
  bmr: Number,
  tdee: Number,
  calorieTarget: Number,
  proteinTarget: Number,
  meals: { type: Array, default: [] },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('DietPlan', DietPlanSchema);