const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, (req, res) => {
  res.json({ message: 'Diet route working' });
});

router.post('/', authMiddleware, (req, res) => {
  res.json({ message: 'Diet POST working' });
});

module.exports = router;
