const { verifyHmac } = require('../utils/hmac');

const hmacProtection = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  const signature = req.headers['x-signature'];

  if (!token || !signature) {
    return res.status(401).json({ message: 'Missing HMAC or token' });
  }

  const isValid = verifyHmac(token, signature);

  if (!isValid) {
    return res.status(403).json({
      message: 'Tampered request detected (HMAC failed)'
    });
  }

  next();
};

module.exports = hmacProtection;