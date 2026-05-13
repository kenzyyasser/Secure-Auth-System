const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../db');

// ==================== HASH TOKEN ====================
const hashToken = (token) => {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
};

// ==================== HMAC ====================
const HMAC_SECRET =
  process.env.HMAC_SECRET ||
  'default_hmac_secret_change_in_production';

// Generate signature
const signHmac = (token) => {
  return crypto
    .createHmac('sha256', HMAC_SECRET)
    .update(token)
    .digest('hex');
};

// Verify signature
const verifyHmac = (token, signature) => {

  try {

    const expected = signHmac(token);

    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );

  } catch {

    return false;
  }
};

// ==================== MAIN AUTH ====================
const authenticateToken = (req, res, next) => {

  try {

    const authHeader = req.headers['authorization'];

    const token =
      authHeader &&
      authHeader.startsWith('Bearer ')
        ? authHeader.split(' ')[1]
        : null;

    if (!token) {
      return res.status(401).json({
        message: 'Access token required'
      });
    }

    // ==================== OPTIONAL HMAC CHECK ====================
    const signature = req.headers['x-token-signature'];

    if (signature) {

      const isValidHmac = verifyHmac(token, signature);

      if (!isValidHmac) {

        return res.status(403).json({
          message: 'Tampered token detected 🚨'
        });
      }
    }

    // ==================== BLACKLIST CHECK ====================
    const tokenHash = hashToken(token);

    const blacklisted = db.prepare(`
      SELECT id
      FROM token_blacklist
      WHERE token_hash = ?
    `).get(tokenHash);

    if (blacklisted) {

      return res.status(401).json({
        message: 'Token invalidated. Please login again.'
      });
    }

    // ==================== JWT VERIFY ====================
    jwt.verify(
      token,
      process.env.JWT_SECRET,
      (err, user) => {

        if (err) {

          console.error('JWT VERIFY ERROR:', err);

          return res.status(403).json({
            message: 'Invalid or expired token'
          });
        }

        req.user = user;
        req.rawToken = token;

        next();
      }
    );

  } catch (error) {

    console.error('AUTH ERROR:', error);

    return res.status(500).json({
      message: 'Authentication failed'
    });
  }
};

// ==================== TEMP TOKEN (2FA) ====================
const authenticateTempToken = (req, res, next) => {

  try {

    const { tempToken } = req.body;

    console.log('TEMP TOKEN:', tempToken);

    if (!tempToken) {

      return res.status(401).json({
        message: 'Temporary token required'
      });
    }

    if (!process.env.JWT_TEMP_SECRET) {

      console.error('JWT_TEMP_SECRET missing');

      return res.status(500).json({
        message: 'Server configuration error'
      });
    }

    jwt.verify(
      tempToken,
      process.env.JWT_TEMP_SECRET,
      (err, payload) => {

        if (err) {

          console.error('TEMP TOKEN ERROR:', err);

          return res.status(403).json({
            message: 'Invalid or expired temporary token'
          });
        }

        req.tempUser = payload;

        next();
      }
    );

  } catch (error) {

    console.error('TEMP AUTH ERROR:', error);

    return res.status(500).json({
      message: 'Temporary authentication failed'
    });
  }
};

module.exports = {
  authenticateToken,
  authenticateTempToken,
  hashToken,
  signHmac
};