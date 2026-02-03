const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  password: { type: String },
  roles: { type: [String], default: ['user'] },
  isVerified: { type: Boolean, default: false },
  refreshTokens: [{ token: String, createdAt: Date }],
  preferences: { type: [String], default: [] },
  streak: { type: Number, default: 0 },
  bmi: { type: Number },
  bodyFat: { type: Number },
  createdAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);
