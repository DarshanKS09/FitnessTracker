const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },
    profilePic: {
      type: String,
      trim: true,
      default: '',
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshTokens: {
      type: [refreshTokenSchema],
      default: [],
    },
    passwordResetToken: {
      type: String,
    },
    passwordResetExpires: {
      type: Date,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      default: 'Other',
    },
    height: {
      type: Number,
    },
    weight: {
      type: Number,
    },
    goal: {
      type: String,
      enum: ['Maintenance', 'Cutting', 'Bulking'],
      default: 'Maintenance',
    },
    activityLevel: {
      type: String,
      enum: ['Sedentary', 'Light', 'Moderate', 'Active'],
      default: 'Moderate',
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.User ||
  mongoose.model('User', userSchema);
