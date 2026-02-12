const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const workoutController = require('../controllers/workoutController');

router.post('/', authMiddleware, workoutController.addWorkout);
router.get('/', authMiddleware, workoutController.getMyWorkouts);

module.exports = router;
