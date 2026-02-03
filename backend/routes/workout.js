const express = require('express');
const router = express.Router();
const controller = require('../controllers/workoutController');
const { auth } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');
const { workoutSchema } = require('../utils/validators');

router.post('/log', auth, validate(workoutSchema), controller.logWorkout);
router.get('/my', auth, controller.getWorkouts);
router.get('/weekly', auth, controller.weeklySummary);

module.exports = router;