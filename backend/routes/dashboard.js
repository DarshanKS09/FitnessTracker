const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/authMiddleware');
const controller = require('../controllers/dashboardController');

router.get('/', auth, controller.dashboard);

module.exports = router;