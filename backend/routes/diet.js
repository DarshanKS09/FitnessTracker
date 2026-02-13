const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { generatePlan, getPlan } = require('../controllers/dietController');

router.post('/generate', authMiddleware, generatePlan);
router.get('/my', authMiddleware, getPlan);

// Backward-compatible endpoints
router.post('/', authMiddleware, generatePlan);
router.get('/', authMiddleware, getPlan);

module.exports = router;
