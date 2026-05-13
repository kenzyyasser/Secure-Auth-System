const express = require('express');
const {
  register, login, verify2FA, logout,
  generateBackupCodes, verifyBackupCode, getAuditLog
} = require('../controllers/authController');
const { oauthGoogleRedirect, oauthGoogleCallback } = require('../controllers/oauthController');
const { authenticateToken } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const router = express.Router();

// Auth
router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/logout', authenticateToken, logout);

// Google OAuth — server.js mounts on /api/auth, so these become /api/auth/google
router.get('/google', oauthGoogleRedirect);
router.get('/google/callback', oauthGoogleCallback);

// Backup codes
router.post('/generate-backup-codes', authenticateToken, generateBackupCodes);
router.post('/verify-backup-code', verifyBackupCode);

// Admin
router.get('/admin/audit-log', authenticateToken, authorizeRoles('Admin'), getAuditLog);

module.exports = router;
