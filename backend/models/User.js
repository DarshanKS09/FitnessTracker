const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: '',
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },

    password: {
      type: String,
    },

    roles: {
      type: [String],
      default: ['user'],
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    refreshTokens: [
      {
        token: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // 🔥 FITNESS PROFILE FIELDS

    age: {
      type: Number,
    },

    gender: {
      type: String,
      enum: ['Male', 'Female'],
    },

    height: {
      type: Number, // cm
    },

    weight: {
      type: Number, // kg
    },

    goal: {
      type: String,
      enum: ['Maintenance', 'Cutting', 'Bulking'],
    },

    activityLevel: {
      type: String,
      enum: ['Sedentary', 'Light', 'Moderate', 'Active'],
    },

    preferences: {
      type: [String],
      default: [],
    },

    streak: {
      type: Number,
      default: 0,
    },

    bmi: {
      type: Number,
    },

    bodyFat: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('User', UserSchema);
