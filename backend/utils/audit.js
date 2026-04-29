const db = require('../db');

function logEvent(userId, userEmail, eventType, req, details = null) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  const userAgent = req.headers['user-agent'] || 'unknown';
  const stmt = db.prepare(`
    INSERT INTO audit_log (user_id, user_email, event_type, ip_address, user_agent, details)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(userId || null, userEmail || null, eventType, ip, userAgent, details);
}

module.exports = logEvent;