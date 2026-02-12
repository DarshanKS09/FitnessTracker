const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const OTP = require('../models/OTP');
const mailer = require('../services/mailer');
const { createAccessToken, createRefreshToken, verifyRefresh } = require('../utils/tokens');

const OTP_EXP_MINUTES = Number(process.env.OTP_EXP_MINUTES) || 5;

async function sendOtp(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email required' });

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.password) {
    return res.status(400).json({ message: 'User already registered' });
  }

  const code = crypto.randomInt(100000, 999999).toString();
  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  const expiresAt = new Date(Date.now() + OTP_EXP_MINUTES * 60 * 1000);

  await OTP.deleteMany({ email });
  await OTP.create({ email, codeHash, expiresAt });

  try {
    await mailer.sendMail({
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${code}. It expires in ${OTP_EXP_MINUTES} minutes.`,
    });

    return res.json({ message: 'OTP sent' });
  } catch (err) {
    return res.status(500).json({ message: 'Failed to send OTP' });
  }
}

async function verifyOtp(req, res) {
  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ message: 'Email and code required' });

  const otpRecord = await OTP.findOne({ email, used: false }).sort({ createdAt: -1 });
  if (!otpRecord) return res.status(400).json({ message: 'No OTP requested' });

  if (otpRecord.expiresAt < new Date()) {
    return res.status(400).json({ message: 'OTP expired' });
  }

  const codeHash = crypto.createHash('sha256').update(code).digest('hex');
  if (codeHash !== otpRecord.codeHash) {
    otpRecord.attempts += 1;
    await otpRecord.save();
    return res.status(400).json({ message: 'Invalid OTP' });
  }

  otpRecord.used = true;
  await otpRecord.save();

  return res.json({ message: 'OTP verified' });
}

async function register(req, res) {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

  const otpRecord = await OTP.findOne({ email, used: true });
  if (!otpRecord) return res.status(400).json({ message: 'Please verify OTP first' });

  const existingUser = await User.findOne({ email });
  if (existingUser && existingUser.password) {
    return res.status(400).json({ message: 'Already registered' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    email,
    password: hashed,
    name: name || '',
    isVerified: true,
  });

  await OTP.deleteMany({ email });

  const access = createAccessToken({ id: user._id, email: user.email });
  const refresh = createRefreshToken({ id: user._id, email: user.email });

  user.refreshTokens.push({ token: refresh, createdAt: new Date() });
  await user.save();

  res.cookie('refreshToken', refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.status(201).json({ accessToken: access, refreshToken: refresh });
}

async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email & password required' });

  const user = await User.findOne({ email });
  if (!user || !user.password) return res.status(400).json({ message: 'User not registered' });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(400).json({ message: 'Invalid credentials' });

  const access = createAccessToken({ id: user._id, email: user.email });
  const refresh = createRefreshToken({ id: user._id, email: user.email });

  user.refreshTokens.push({ token: refresh, createdAt: new Date() });
  await user.save();

  res.cookie('refreshToken', refresh, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({ accessToken: access, refreshToken: refresh });
}

async function refreshToken(req, res) {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.status(401).json({ message: 'No refresh token' });

  try {
    const payload = verifyRefresh(token);
    const user = await User.findById(payload.id);
    if (!user) return res.status(401).json({ message: 'User not found' });

    const stored = user.refreshTokens.find(r => r.token === token);
    if (!stored) return res.status(401).json({ message: 'Refresh token invalid' });

    const access = createAccessToken({ id: user._id, email: user.email });
    res.json({ accessToken: access });
  } catch {
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
}

async function logout(req, res) {
  const token = req.cookies?.refreshToken || req.body?.refreshToken;
  if (!token) return res.json({ message: 'Logged out' });

  try {
    const payload = verifyRefresh(token);
    const user = await User.findById(payload.id);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(r => r.token !== token);
      await user.save();
    }
  } catch {}

  res.clearCookie('refreshToken');
  return res.json({ message: 'Logged out' });
}

module.exports = { sendOtp, verifyOtp, register, login, refreshToken, logout };
