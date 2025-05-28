const express = require('express');
const app = express();
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB error:', err));


  async function addFoodLogToUser(userId, foodData) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { foodLog: foodData } },
      { new: true, runValidators: true }
    );
    console.log('Updated User with Food Log:', updatedUser);
  } catch (error) {
    console.error('Error adding food log:', error.message);
  }
}


app.use('/api/auth', require('./routes/auth'));
app.use('/api/foodlogs', require('./routes/foodLogs'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
