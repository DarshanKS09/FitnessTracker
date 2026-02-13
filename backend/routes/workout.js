const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const workoutController = require('../controllers/workoutController');

router.post('/', authMiddleware, workoutController.addWorkout);
router.get('/', authMiddleware, workoutController.getMyWorkouts);
router.put('/:id', authMiddleware, workoutController.updateWorkout);
router.delete('/:id', authMiddleware, workoutController.deleteWorkout);

module.exports = router;
