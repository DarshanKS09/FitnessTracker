const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async (opts = { retries: 5, retryDelayMs: 5000 }) => {
  const { retries, retryDelayMs } = opts;
  let attempts = 0;

  const tryConnect = async () => {
    attempts += 1;
    try {
      await mongoose.connect(process.env.MONGO_URI || '', { useNewUrlParser: true, useUnifiedTopology: true });
      isConnected = true;
      console.log('MongoDB connected');
    } catch (err) {
      isConnected = false;
      console.error(`MongoDB connection error (attempt ${attempts}):`, err.message);
      if (attempts < retries) {
        console.log(`Retrying in ${retryDelayMs}ms...`);
        setTimeout(tryConnect, retryDelayMs);
      } else {
        console.warn('MongoDB connection failed after retries. Server will continue to run but DB operations will fail.');
      }
    }
  };

  await tryConnect();
};

const getDbStatus = () => ({ connected: isConnected, readyState: mongoose.connection.readyState });

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;