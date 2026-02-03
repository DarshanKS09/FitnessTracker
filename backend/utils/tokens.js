const jwt = require('jsonwebtoken');

const createAccessToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' });
const createRefreshToken = (payload) => jwt.sign(payload, process.env.REFRESH_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' });

const verifyAccess = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefresh = (token) => jwt.verify(token, process.env.REFRESH_SECRET);

module.exports = { createAccessToken, createRefreshToken, verifyAccess, verifyRefresh };