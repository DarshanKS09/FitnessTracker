const mongoose = require('mongoose');

const FoodLogSchema = new mongoose.Schema({
  name: { type: String, required: true },
  calories: { type: Number, required: true },
  protein: { type: Number, required: true },
  date: { type: Date, default: Date.now },
});

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: { 
    type: String, 
    required: true,
  },
  foodLog: [FoodLogSchema], 
});

module.exports = mongoose.model('User', UserSchema);
