const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'auth.db'));

// Users table (original)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('Admin', 'Manager', 'User')),
    twofa_secret TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Add lockout columns safely (ignore if already exist)
try {
  db.exec(`ALTER TABLE users ADD COLUMN failed_login_attempts INTEGER DEFAULT 0`);
} catch (e) { /* column may already exist */ }
try {
  db.exec(`ALTER TABLE users ADD COLUMN locked_until DATETIME`);
} catch (e) { /* column may already exist */ }

// Audit log table
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    user_email TEXT,
    event_type TEXT NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Backup codes table
db.exec(`
  CREATE TABLE IF NOT EXISTS backup_codes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    code_hash TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

module.exports = db;