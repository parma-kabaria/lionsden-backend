import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { config } from '../../config/index.js';

/**
 * Generates an Access Token with user identity and authorization claims
 * @param {object} payload
 * @returns {string}
 */
export const generateAccessToken = payload => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiry,
  });
};

/**
 * Generates a Refresh Token with minimum payload
 * @param {object} payload
 * @returns {string}
 */
export const generateRefreshToken = payload => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });
};

/**
 * Verifies and decodes an Access Token
 * @param {string} token
 * @returns {object}
 */
export const verifyAccessToken = token => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Verifies and decodes a Refresh Token
 * @param {string} token
 * @returns {object}
 */
export const verifyRefreshToken = token => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Hashes a token using SHA-256 for secure database storage
 * @param {string} token
 * @returns {string}
 */
export const hashToken = token => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
