// utils/tokenUtils.js
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString('hex');
};

const generateOTP = (length = 6) => {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

module.exports = {
  generateToken,
  generateResetToken,
  generateRefreshToken,
  generateOTP
};