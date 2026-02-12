const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Ensure secrets exist. In production, these must be provided via environment variables.
let JWT_SECRET = process.env.JWT_SECRET;
let REFRESH_SECRET = process.env.REFRESH_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  JWT_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('WARNING: JWT_SECRET not set. Using a generated secret for development. Set JWT_SECRET in .env for persistence.');
}
if (!REFRESH_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('REFRESH_SECRET environment variable is required in production');
  }
  REFRESH_SECRET = crypto.randomBytes(48).toString('hex');
  console.warn('WARNING: REFRESH_SECRET not set. Using a generated secret for development. Set REFRESH_SECRET in .env for persistence.');
}

const createAccessToken = (payload) => jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' });
const createRefreshToken = (payload) => jwt.sign(payload, REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' });

const verifyAccess = (token) => jwt.verify(token, JWT_SECRET);
const verifyRefresh = (token) => jwt.verify(token, REFRESH_SECRET);

module.exports = { createAccessToken, createRefreshToken, verifyAccess, verifyRefresh };