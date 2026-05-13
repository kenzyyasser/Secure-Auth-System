const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const speakeasy = require('speakeasy');
const crypto = require('crypto');
const db = require('../db');
const logEvent = require('../utils/audit');

// ==================== GOOGLE OAUTH ====================
const oauthGoogleRedirect = (req, res) => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

const oauthGoogleCallback = async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_code`);

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code'
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      console.error('Google token error:', tokenData);
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Get user info from Google
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` }
    });
    const googleUser = await userRes.json();

    if (!googleUser.email) {
      return res.redirect(`${process.env.FRONTEND_URL}/login?error=no_email`);
    }

    // Find or create user
    let user = db.prepare('SELECT * FROM users WHERE email = ?').get(googleUser.email);
    if (!user) {
      const secret = speakeasy.generateSecret({ name: `AuthShield (${googleUser.email})` });
      const fakePassword = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      db.prepare(`INSERT INTO users (name, email, password_hash, role, twofa_secret) VALUES (?, ?, ?, ?, ?)`)
        .run(googleUser.name || googleUser.email, googleUser.email, fakePassword, 'User', secret.base32);
      user = db.prepare('SELECT * FROM users WHERE email = ?').get(googleUser.email);
      logEvent(user.id, googleUser.email, 'OAUTH_REGISTER', req, 'Google OAuth new user');
    }

    // Issue JWT
    const jwtToken = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    logEvent(user.id, user.email, 'OAUTH_LOGIN_SUCCESS', req, 'Google OAuth login');

    res.redirect(
      `${process.env.FRONTEND_URL}/oauth-callback?token=${jwtToken}&name=${encodeURIComponent(user.name)}&role=${user.role}&id=${user.id}&email=${encodeURIComponent(user.email)}`
    );
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

module.exports = { oauthGoogleRedirect, oauthGoogleCallback };
