const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const db = require('../db');
const logEvent = require('../utils/audit');

const register = async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role)
    return res.status(400).json({ message: 'All fields are required' });
  const validRoles = ['Admin', 'Manager', 'User'];
  if (!validRoles.includes(role))
    return res.status(400).json({ message: 'Invalid role' });
  try {
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) return res.status(400).json({ message: 'Email already registered' });
    const hashedPassword = await bcrypt.hash(password, 10);
    const secret = speakeasy.generateSecret({ name: `AuthShield (${email})` });
    const qrCodeDataURL = await QRCode.toDataURL(secret.otpauth_url);
    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, twofa_secret)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(name, email, hashedPassword, role, secret.base32);
    logEvent(null, email, 'REGISTER_SUCCESS', req, `Role: ${role}`);
    res.status(201).json({ message: 'User registered successfully', qrCode: qrCodeDataURL, secret: secret.base32 });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

const login = async (req, res) => {
  const { email, password, rememberMe } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) {
      logEvent(null, email, 'LOGIN_FAIL', req, 'User not found');
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check lockout
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      logEvent(user.id, email, 'LOGIN_BLOCKED', req, 'Account locked');
      return res.status(423).json({ message: 'Account locked. Try again later.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      let attempts = (user.failed_login_attempts || 0) + 1;
      let lockedUntil = null;
      if (attempts >= 5) {
        lockedUntil = new Date(Date.now() + 15 * 60000).toISOString();
        logEvent(user.id, email, 'ACCOUNT_LOCKED', req, 'Too many failed attempts');
      }
      db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?')
        .run(attempts, lockedUntil, user.id);
      logEvent(user.id, email, 'LOGIN_FAIL', req, `Invalid password (attempt ${attempts})`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset failed attempts on success
    db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?').run(user.id);

    const tempToken = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_TEMP_SECRET, { expiresIn: '5m' });
    logEvent(user.id, email, 'PASSWORD_VERIFIED', req, 'Awaiting 2FA');
    res.json({ tempToken, message: 'Password verified, please enter 2FA code' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

const verify2FA = async (req, res) => {
  const { tempToken, twoFACode, rememberMe } = req.body;
  if (!tempToken || !twoFACode) return res.status(400).json({ message: 'Temporary token and 2FA code required' });
  try {
    const decoded = jwt.verify(tempToken, process.env.JWT_TEMP_SECRET);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });
    const verified = speakeasy.totp.verify({ secret: user.twofa_secret, encoding: 'base32', token: twoFACode, window: 1 });
    if (!verified) {
      logEvent(user.id, user.email, '2FA_FAIL', req, 'Invalid TOTP code');
      return res.status(401).json({ message: 'Invalid 2FA code' });
    }

    const expiresIn = rememberMe === 'true' ? '7d' : '24h';
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn }
    );
    logEvent(user.id, user.email, 'LOGIN_SUCCESS', req, `Role: ${user.role}`);
    res.json({
      token: accessToken,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    console.error(error);
    res.status(403).json({ message: 'Invalid or expired temporary token' });
  }
};

const generateBackupCodes = async (req, res) => {
  const userId = req.user.userId;
  const user = db.prepare('SELECT email FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // Delete old unused codes
  db.prepare('DELETE FROM backup_codes WHERE user_id = ? AND used = 0').run(userId);

  const codes = [];
  for (let i = 0; i < 8; i++) {
    const plainCode = crypto.randomBytes(4).toString('hex').toUpperCase();
    const hashedCode = await bcrypt.hash(plainCode, 10);
    db.prepare('INSERT INTO backup_codes (user_id, code_hash) VALUES (?, ?)').run(userId, hashedCode);
    codes.push(plainCode);
  }
  logEvent(userId, user.email, 'BACKUP_CODES_GENERATED', req, '8 codes generated');
  res.json({ backupCodes: codes });
};

const verifyBackupCode = async (req, res) => {
  const { userId, code } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  const backupRow = db.prepare('SELECT * FROM backup_codes WHERE user_id = ? AND used = 0').get(userId);
  if (!backupRow) return res.status(404).json({ message: 'No unused backup codes' });

  const valid = await bcrypt.compare(code, backupRow.code_hash);
  if (valid) {
    db.prepare('UPDATE backup_codes SET used = 1 WHERE id = ?').run(backupRow.id);
    logEvent(userId, user.email, 'BACKUP_CODE_USED', req, 'Used a backup code');
    return res.json({ valid: true });
  }
  res.json({ valid: false });
};

// Admin endpoint to view audit log
const getAuditLog = (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200').all();
  res.json(logs);
};

module.exports = { register, login, verify2FA, generateBackupCodes, verifyBackupCode, getAuditLog };