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

// Delete user (Admin only)
router.delete('/admin/users/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const { id } = req.params;
  if (parseInt(id) === req.user.userId) {
    return res.status(400).json({ message: 'You cannot delete your own account' });
  }
  const stmt = db.prepare('DELETE FROM users WHERE id = ?');
  const result = stmt.run(id);
  if (result.changes === 0) return res.status(404).json({ message: 'User not found' });
  logEvent(req.user.userId, req.user.email, 'ADMIN_DELETE_USER', req, `Deleted user ID ${id}`);
  res.json({ message: 'User deleted successfully' });
});

// ==========================================
// Admin: Change user role (NEW)
// ==========================================
router.put('/admin/users/:id/role', authenticateToken, authorizeRoles('Admin'), (req, res) => {
  const { id } = req.params;
  const { role } = req.body;
  
  // 1. التأكد إن الرتبة اللي مبعوتة صحيحة وموجودة في النظام
  if (!['Admin', 'Manager', 'User'].includes(role)) {
    return res.status(400).json({ message: 'Invalid role' });
  }
  
  // 2. حماية: منع الأدمن إنه يغير رتبة نفسه لرتبة أقل (عشان ميفقدش صلاحياته بالغلط)
  if (parseInt(id) === req.user.userId && role !== 'Admin') {
     return res.status(400).json({ message: 'You cannot demote yourself' });
  }

  // 3. تحديث الرتبة في قاعدة البيانات
  const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
  const result = stmt.run(role, id);
  
  if (result.changes === 0) return res.status(404).json({ message: 'User not found' });
  
  // 4. تسجيل الحدث في الـ Audit Log
  logEvent(req.user.userId, req.user.email, 'ADMIN_CHANGE_ROLE', req, `Changed user ID ${id} role to ${role}`);
  
  res.json({ message: 'Role updated successfully' });
});

module.exports = router;