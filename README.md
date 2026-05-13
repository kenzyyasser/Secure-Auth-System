

# 🛡️ Secure Document Vault System

![Node.js](https://img.shields.io/badge/Node.js-v24+-green?logo=node.js)
![React](https://img.shields.io/badge/React-18.x-blue?logo=react)
![SQLite](https://img.shields.io/badge/SQLite-Better--SQLite3-blue?logo=sqlite)
![Security](https://img.shields.io/badge/Security-AES256%20%7C%20RSA%20%7C%20SHA256-red)

## 📌 Project Overview
The **Secure Document Vault** is an enterprise-grade, web-based platform designed to allow users to securely upload, store, manage, encrypt, sign, and verify digital documents. This project simulates a real-world secure system that protects sensitive documents against unauthorized access, tampering, and interception.

The system integrates multiple security mechanisms into a single application to achieve **Confidentiality, Integrity, Authenticity, and Secure Access Control**.

---

## 🚀 Development Phases & Features

Our team divided the development into 5 strategic phases to ensure a robust security architecture:

### Phase 1: Authentication Core & OAuth
* **JWT Token System:** Secure session management using JSON Web Tokens (access and temporary tokens).
* **Two-Factor Authentication (2FA):** TOTP implementation with QR code generation for Google Authenticator.
* **OAuth 2.0 Integration:** Secure third-party login via Google for streamlined user access.

### Phase 2: Password Security & Access Control
* **Secure Hashing:** Password protection using `bcrypt` with high salt rounds to prevent rainbow table attacks.
* **Role-Based Access Control (RBAC):** Strict permission levels for **Admin, Manager, and User**.
* **Administrative Controls:** Dynamic user management, including account unlocking and role assignment.

### Phase 3: Document Encryption & Storage
* **Data-at-Rest Protection:** Documents are encrypted using the **AES-256** algorithm before being saved to storage.
* **Secure File Handling:** Strict validation of file types and sizes to prevent malicious uploads.
* **Controlled Access:** Only authorized users can decrypt and download documents.

### Phase 4: Digital Signatures & Integrity
* **Asymmetric Cryptography:** RSA Key Pair generation for secure digital signatures.
* **Integrity Verification:** Automated **SHA-256** hashing to detect document tampering.
* **Signature Validation:** PASS/FAIL verification flow to ensure document authenticity post-upload.

### Phase 5: Infrastructure & Network Security
* **Secure Communication:** HTTPS implementation via SSL certificates to protect data in transit.
* **Network Analysis:** Wireshark-based demonstrations of MITM attacks and the importance of encryption.
* **Security Headers:** Integration of HSTS and X-Frame-Options to harden the web server.

---

### 🛠️ Technology Stack
* **Frontend:** React.js, Tailwind CSS, Lucide Icons.
* **Backend:** Node.js, Express.js.
* **Database:** SQLite (Better-SQLite3).
* **Security:** `bcrypt`, `jsonwebtoken`, `speakeasy`, `crypto`, `qrcode`.





### 2. Backend Configuration

```bash
cd backend
npm install

```

Create a `.env` file in the `backend` folder:

```env
PORT=5000
JWT_SECRET=your_jwt_secret
JWT_TEMP_SECRET=your_2fa_temp_secret
GOOGLE_CLIENT_ID=your_google_id
GOOGLE_CLIENT_SECRET=your_google_secret
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:5000

```

### 3. Frontend Configuration

```bash
cd ../frontend
npm install

```

Create a `.env` file in the `frontend` folder:

```env
VITE_API_URL=http://localhost:5000/api

```

---

## 🏃‍♂️ Running the Project

1. **Start the Backend:**
```bash
cd backend
npm run dev

```


2. **Start the Frontend:**
```bash
cd frontend
npm run dev

```



---

## 👥 Project Team

* **Phase 1:** Authentication Core & OAuth
* **Phase 2:** Password Security & RBAC
* **Phase 3:** Document Encryption & Storage
* **Phase 4:** Digital Signatures & Integrity
* **Phase 5:** HTTPS & Integration Testing

```

```
