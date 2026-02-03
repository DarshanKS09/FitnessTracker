const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date: { type: Date, default: Date.now, index: true },
  weight: Number,
  bodyFat: Number,
  caloriesConsumed: Number,
  caloriesBurned: Number,
  protein: Number,
}, { timestamps: true });

module.exports = mongoose.model('ProgressStat', ProgressSchema);