require('dotenv').config();

if (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET) {
  console.warn(
    'Warning: JWT_SECRET and/or REFRESH_SECRET not set. Add them to .env for production.'
  );
}

const express = require('express');
const app = express();
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const connectDB = require('./config/db');
const cronJobs = require('./jobs/reminders');

// Routers
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const foodRoutes = require('./routes/food');
const dietRoutes = require('./routes/diet');
const workoutRoutes = require('./routes/workout');
const dashboardRoutes = require('./routes/dashboard');

// Connect DB
connectDB();

// Initialize mailer
require('./services/mailer');

// ==================
// Middleware
// ==================
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});

app.use('/api/', apiLimiter);

// ==================
// Versioned API Routes
// ==================

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/food', foodRoutes);
app.use('/api/v1/diet', dietRoutes);
app.use('/api/v1/workout', workoutRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

// ==================
// Health Check
// ==================
const dbStatus = require('./config/db').getDbStatus;

app.get('/health', (req, res) => {
  const dbInfo = dbStatus ? dbStatus() : { connected: false };
  return res.json({ status: 'ok', db: dbInfo });
});

// ==================
// Error Logging
// ==================
process.on('unhandledRejection', (reason, p) => {
  console.error('Unhandled Rejection at:', p, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

// Start cron jobs
cronJobs.start();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
