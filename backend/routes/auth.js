const express = require('express');
const router = express.Router();
const validate = require('../middleware/validate');
const { sendOtpSchema, verifyOtpSchema, registerSchema, loginSchema } = require('../utils/validators');
const authController = require('../controllers/authController');

router.post('/send-otp', validate(sendOtpSchema), authController.sendOtp);
router.post('/verify-otp', validate(verifyOtpSchema), authController.verifyOtp);
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
