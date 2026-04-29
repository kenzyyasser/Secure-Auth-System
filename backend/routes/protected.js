const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const authorizeRoles = require('../middleware/role');
const db = require('../db');
const logEvent = require('../utils/audit');
const router = express.Router();

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, created_at FROM users WHERE id = ?').get(req.user.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// Dashboard (any authenticated user)
router.get('/dashboard', authenticateToken, (req, res) => {
  res.json({ message: `Welcome to Dashboard, ${req.user.name}!`, user: req.user });
});

// Admin: get all users with lockout info
router.get('/admin/users', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const users = db.prepare(`
    SELECT id, name, email, role, password_hash, created_at, 
           failed_login_attempts, locked_until 
    FROM users
  `).all();
  res.json(users);
});

// Admin: unlock a user
router.post('/admin/unlock/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) return res.status(404).json({ message: 'User not found' });
  logEvent(req.user.userId, req.user.email, 'ADMIN_UNLOCK_USER', req, `Unlocked user ID ${id}`);
  res.json({ message: 'User unlocked successfully' });
});

// Admin: get audit log
router.get('/admin/audit-log', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const logs = db.prepare('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 200').all();
  res.json(logs);
});

// Admin only dashboard
router.get('/admin/dashboard', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  res.json({ message: 'Admin Dashboard - You have full system access', role: req.user.role });
});

// Manager dashboard
router.get('/manager/dashboard', authenticateToken, authorizeRoles('Manager', 'Admin'), (req, res) => {
  res.json({ message: 'Manager Dashboard - You can manage team resources', role: req.user.role });
});

// User dashboard
router.get('/user/dashboard', authenticateToken, authorizeRoles('User', 'Manager', 'Admin'), (req, res) => {
  res.json({ message: 'User Dashboard - Your personal workspace', role: req.user.role });
});



module.exports = router;
