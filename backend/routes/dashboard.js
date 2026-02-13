const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { dashboard } = require('../controllers/dashboardController');

router.get('/', authMiddleware, dashboard);

module.exports = router;
