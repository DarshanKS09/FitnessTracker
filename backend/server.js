require('dotenv').config();

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

// Middleware
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
});
app.use('/api/', apiLimiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/food', foodRoutes);
app.use('/api/diet', dietRoutes);
app.use('/api/workout', workoutRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Start cron jobs (reminders & weekly summary)
cronJobs.start();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

module.exports = app;
