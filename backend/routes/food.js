const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/add', authMiddleware, foodController.addFood);
router.get('/my', authMiddleware, foodController.getMyFood);
router.get('/daily', authMiddleware, foodController.dailyTotals);
router.get('/weekly', authMiddleware, foodController.weeklyFood);

module.exports = router;
