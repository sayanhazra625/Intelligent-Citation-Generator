const jwt = require('jsonwebtoken');
const crypto = require('crypto');

/**
 * Generate a JWT access token (short-lived).
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
};

/**
 * Generate a random refresh token string (will be hashed before storing).
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(40).toString('hex');
};

/**
 * Generate a random token for email verification or password reset.
 */
const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  generateRandomToken,
};
