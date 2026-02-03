const mongoose = require('mongoose');

const WorkoutSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  cardioType: { type: String },
  cardioMinutes: { type: Number, default: 0 },
  strengthMinutes: { type: Number, default: 0 },
  caloriesBurned: { type: Number, default: 0 },
  pr: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('WorkoutLog', WorkoutSchema);