const cron = require('node-cron');
const User = require('../models/User');
const FoodLog = require('../models/FoodLog');
const mailer = require('../services/mailer');

const start = () => {
  // Daily reminder at 23:00
  cron.schedule('0 23 * * *', async () => {
    try {
      const users = await User.find({ isVerified: true });
      const today = new Date();
      today.setHours(0,0,0,0);
      for (const user of users) {
        const hasFood = await FoodLog.exists({ userId: user._id, createdAt: { $gte: today } });
        if (!hasFood) {
          await mailer.sendMail({
            to: user.email,
            subject: 'Reminder: Log your food today',
            text: `Hi ${user.name || ''}, we noticed you haven't logged any food today. Keep your streak alive!`,
          });
        }
      }
      console.log('Daily reminders sent');
    } catch (err) {
      console.error('Daily reminder error:', err.message);
    }
  }, {
    timezone: process.env.TIMEZONE || 'Etc/UTC',
  });

  // Weekly summary every Monday 08:00
  cron.schedule('0 8 * * MON', async () => {
    try {
      const users = await User.find({ isVerified: true });
      for (const user of users) {
        // Simple weekly summary: count food logs and workouts
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - 7);
        const foodCount = await FoodLog.countDocuments({ userId: user._id, createdAt: { $gte: weekStart } });
        await mailer.sendMail({
          to: user.email,
          subject: 'Weekly Summary',
          text: `Hi ${user.name || ''}, this week you logged ${foodCount} food entries. Keep going!`,
        });
      }
      console.log('Weekly summaries sent');
    } catch (err) {
      console.error('Weekly summary error:', err.message);
    }
  }, {
    timezone: process.env.TIMEZONE || 'Etc/UTC',
  });
};

module.exports = { start };
