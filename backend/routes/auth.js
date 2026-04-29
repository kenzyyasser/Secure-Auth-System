const express = require('express');
const { register, login, verify2FA, generateBackupCodes, verifyBackupCode, getAuditLog } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-2fa', verify2FA);
router.post('/generate-backup-codes', authenticateToken, generateBackupCodes);
router.post('/verify-backup-code', verifyBackupCode);
router.get('/admin/audit-log', authenticateToken, authorizeRoles('Admin'), getAuditLog);

module.exports = router;