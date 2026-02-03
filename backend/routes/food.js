const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { foodLogSchema } = require('../utils/validators');
const controller = require('../controllers/foodController');

router.post('/add', auth, validate(foodLogSchema), controller.addFood);
router.get('/my', auth, controller.getMyFood);
router.put('/update/:id', auth, controller.updateFood);
router.delete('/delete/:id', auth, controller.deleteFood);
router.get('/daily-totals', auth, controller.dailyTotals);
router.get('/weekly', auth, controller.weeklyAggregation);

module.exports = router;