const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access token required' });
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

const authenticateTempToken = (req, res, next) => {
  const { tempToken } = req.body;
  if (!tempToken) return res.status(401).json({ message: 'Temporary token required' });
  jwt.verify(tempToken, process.env.JWT_TEMP_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired temporary token' });
    req.tempUser = payload;
    next();
  });
};

module.exports = { authenticateToken, authenticateTempToken };