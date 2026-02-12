const mongoose = require('mongoose');

const OTPSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, index: true },
  codeHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  attempts: { type: Number, default: 0 },
  used: { type: Boolean, default: false },
}, { timestamps: true });

OTPSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('OTP', OTPSchema);
