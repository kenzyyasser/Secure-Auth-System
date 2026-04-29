# 🔐 AuthShield – Secure Authentication System

A **production‑ready authentication system** with Two‑Factor Authentication (2FA), JWT tokens, Role‑Based Access Control (RBAC), and a modern UI (dark/light mode). Built for the **Data Integrity and Authentication** course assignment.

---

## 📋 Feature Checklist

| Requirement | Implementation |
|-------------|----------------|
| ✅ User registration & login | Full flow with email/password |
| ✅ Password hashing | bcrypt (10 salt rounds) – no plain text |
| ✅ JWT token protection | All protected routes require valid token |
| ✅ 2FA (TOTP) | Google Authenticator / Authy compatible |
| ✅ 3 roles (Admin, Manager, User) | RBAC on frontend & backend |
| ✅ Role‑based route restriction | `PrivateRoute` + `authorizeRoles` middleware |

### ✨ Extra Enhancements

- **Account lockout** – 5 failed attempts → 15 min lock; Admin can unlock.
- **Remember Me** – Extends JWT expiry from 24h to 7 days.
- **Backup codes** – 8 one‑time use hashed codes to bypass 2FA.
- **Audit log** – Records all security events (login, 2FA, lockouts, deletions, unlocks) – Admin view.
- **Dark / Light mode** – Toggle with persistence.
- **Password strength meter** – Live validation with visual feedback.
- **Show/hide password toggle** – Both login and register.
- **Empty field validation** – Toast errors on missing email/password.
- **Premium glassmorphic UI** – Icons, animations, responsive.

---

## 🚀 Technology Stack

**Backend:** Node.js, Express, SQLite (better‑sqlite3), bcrypt, jsonwebtoken, speakeasy, qrcode, dotenv  
**Frontend:** React 18, Vite, Tailwind CSS, React Router, Axios, react‑hot‑toast, lucide‑react

---

## 📦 Installation & Running

Make sure you have Node.js v20 or v22 (LTS) installed.

Clone the repository and enter the project folder:
```bash
git clone <your-repo-url>
cd SecureAuthSystem

Step 2:Set up the backend:

cd backend
npm install
cp .env.example .env
# Edit .env – set strong values for JWT_SECRET and JWT_TEMP_SECRET
npm run dev

The backend API will be available at http://localhost:5000.

Step 3: Frontend setup (new terminal)

Open a new terminal for the frontend:
cd frontend
npm install
npm run dev

The frontend will run at http://localhost:5173. The database (auth.db) is created automatically in the backend folder.

Registration & 2FA Setup
Open http://localhost:5173/register. Fill in name, email, and a strong password – the password requirements are shown live with checkmarks. Choose role Admin (for full access). After submitting, a QR code appears. Scan it with Google Authenticator (or any TOTP app). Click “Continue to Login”.

Login + 2FA + JWT Token Display
At /login, enter the same email and password. After correct password, you are sent to /verify-2fa. Enter the 6‑digit code from the authenticator app. On success, you land on the Dashboard, which shows the JWT token (fulfilling the “show generated token” requirement).

Password Hashing Proof
While logged in as Admin, click Admin Panel in the navbar. The Users tab lists all registered users. The password_hash column contains bcrypt hashes (starting with $2b$10$) – no plain text passwords are stored.

Role‑Based Access Control
Register two more users: one with role Manager and one with role User.

    Log in as Manager: you can access /manager and /user. Trying to access /admin shows an Access Denied page.

    Log in as User: you can only access /user. Access to /admin or /manager is blocked with Access Denied.

    Admin has unrestricted access to all panels.

Token‑Based API Protection
Open browser DevTools → Network tab. After login, any request to /api/... includes the header Authorization: Bearer <JWT>. Using Postman or curl to call /api/dashboard without the token returns 401 Unauthorized.

Extra Features (Optional but Impressive)

    Account lockout: Enter wrong password 5 times for a user → account locked for 15 minutes. Admin can unlock from the Users tab.

    Remember Me: Login with the checkbox selected – the JWT expiry becomes 7 days (visible in the token payload).

    Backup Codes: After login, go to /backup-codes, generate 8 codes. Use one to bypass 2FA (simulates lost device).

    Audit Log: Admin panel → Audit Log tab shows a complete history of security events (login, 2FA, lockouts, deletions, unlocks).

📁 Project Structure


SecureAuthSystem/
├── backend/
│   ├── controllers/authController.js
│   ├── middleware/auth.js, role.js
│   ├── routes/auth.js, protected.js
│   ├── utils/audit.js
│   ├── db.js, server.js
│   ├── auth.db (auto‑created)
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── components/ (Navbar, PrivateRoute, QRCodeModal)
    │   ├── contexts/ (AuthContext, ThemeContext)
    │   ├── pages/ (Login, Register, TwoFactorVerify, Dashboard, Profile, AdminPage, ManagerPage, UserPage, BackupCodes)
    │   ├── utils/api.js
    │   ├── App.jsx, index.css, main.jsx
    │   └── ...
    ├── index.html, package.json, tailwind.config.js, vite.config.js

🔒 Security Highlights

    Passwords hashed with bcrypt (10 salt rounds).

    Two‑factor authentication using TOTP (RFC 6238).

    JWT tokens signed with a strong secret; expiry 24h or 7d (Remember Me).

    Account lockout after 5 failed attempts (15 minutes).

    Full audit trail for all security events.

    Backup codes are bcrypt‑hashed one‑time recovery codes.

    Protected routes enforce roles both on the UI and API layers.

🛠️ Troubleshooting

Issue	Solution
Backend crashes on startup	Delete backend/auth.db and restart – tables will be recreated.
QR code not showing	Restart backend; ensure not in production mode.
2FA code invalid	Check system time; re‑scan the QR code.
Frontend icons missing	Run npm install lucide-react inside frontend.
Pattern or styles not visible	Hard refresh (Ctrl+Shift+R) or clear Vite cache (rm -rf node_modules/.vite).
📝 Requirements Traceability (Assignment #2)
Requirement	Fulfilled?	Where to see
1. User registration & login	✅	/register, /login
2. Password hashing	✅	Admin panel – user table
3. Token protection	✅	Network tab / API tests
4. 2FA verification	✅	/verify-2fa after password
5. 3 roles with permissions	✅	Admin, Manager, User panels
6. Role‑based route restriction	✅	Access Denied page









