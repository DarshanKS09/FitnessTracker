const express = require('express');
const router = express.Router();
const FoodLog = require('../models/FoodLog');
const { authMiddleware } = require('../middleware/authMiddleware');

router.post('/add-food', authMiddleware, async (req, res) => {
  const { name, calories, protein } = req.body;

  console.log('Add food called with:', req.body);
  console.log('Authenticated user:', req.user);

  try {
    const newFoodLog = new FoodLog({
      userId: req.user.id,
      food: name,
      calories: Number(calories),
      protein: Number(protein),
    });

    await newFoodLog.save();
    res.status(201).json({ message: 'Food added', food: newFoodLog });
  } catch (err) {
    console.error('Add food error:', err);
    res.status(500).json({ message: 'Failed to add food', error: err.message });
  }
});

router.get('/my-food', authMiddleware, async (req, res) => {
  try {
    const logs = await FoodLog.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ foodLog: logs });
  } catch (err) {
    console.error('Fetch food log error:', err);
    res.status(500).json({ message: 'Failed to fetch food logs' });
  }
});

router.put('/update-food/:id', authMiddleware, async (req, res) => {
  const { name, calories, protein, mealType } = req.body;
  try {
    const foodLog = await FoodLog.findById(req.params.id);
    if (!foodLog) {
      return res.status(404).json({ message: 'Food log not found' });
    }
    if (foodLog.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    foodLog.food = name || foodLog.food;
    foodLog.calories = calories !== undefined ? Number(calories) : foodLog.calories;
    foodLog.protein = protein !== undefined ? Number(protein) : foodLog.protein;
    if (mealType) foodLog.mealType = mealType;

    await foodLog.save();
    res.status(200).json({ message: 'Food log updated', food: foodLog });
  } catch (err) {
    console.error('Update food log error:', err);
    res.status(500).json({ message: 'Failed to update food log' });
  }
});

router.delete('/delete-food/:id', authMiddleware, async (req, res) => {
  try {
    const foodLog = await FoodLog.findById(req.params.id);
    if (!foodLog) {
      return res.status(404).json({ message: 'Food log not found' });
    }
    if (foodLog.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    await FoodLog.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Food log deleted' });
  } catch (err) {
    console.error('Delete food log error:', err);
    res.status(500).json({ message: 'Failed to delete food log' });
  }
});

module.exports = router;
