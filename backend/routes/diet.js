const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const controller = require('../controllers/dietController');
const validate = require('../middleware/validate');
const { dietSchema } = require('../utils/validators');

router.post('/generate', auth, validate(dietSchema), controller.generatePlan);
router.get('/my', auth, controller.getPlan);

module.exports = router;
