const express = require('express');
const router = express.Router();
const foodController = require('../controllers/foodController');
const authMiddleware = require('../middleware/authMiddleware');

// Primary REST-style routes used by frontend
router.post('/', authMiddleware, foodController.addFood);
router.get('/', authMiddleware, foodController.getMyFood);
router.put('/:id', authMiddleware, foodController.updateFood);
router.delete('/:id', authMiddleware, foodController.deleteFood);
router.get('/daily-totals', authMiddleware, foodController.dailyTotals);
router.get('/weekly', authMiddleware, foodController.weeklyFood);

// Backward-compatible aliases
router.post('/add', authMiddleware, foodController.addFood);
router.get('/my', authMiddleware, foodController.getMyFood);
router.put('/update/:id', authMiddleware, foodController.updateFood);
router.delete('/delete/:id', authMiddleware, foodController.deleteFood);
router.get('/daily', authMiddleware, foodController.dailyTotals);

module.exports = router;
