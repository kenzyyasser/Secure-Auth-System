require('dotenv').config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const crypto = require("crypto");

const authRoutes      = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const documentRoutes  = require('./routes/documents');
const signatureRoutes = require('./routes/signatures');  // ✅ جديد

const app = express();

/* =========================
   🌐 MIDDLEWARE
========================= */
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true
}));
app.use(express.json());

/* =========================
   📦 MEMORY DATABASE
========================= */
const documents = new Map();

/* =========================
   📁 MULTER SETUP
========================= */
const storage = multer.memoryStorage();
const upload = multer({ storage });

/* =========================
   🔐 HASH FUNCTION (SHA-256)
========================= */
const hashFile = (data) => {
  return crypto.createHash("sha256").update(data).digest("hex");
};

/* =========================
   🔑 AUTH ROUTES
========================= */
app.use('/api/auth', authRoutes);
app.use('/api', authRoutes);

/* =========================
   🔒 PROTECTED ROUTES
========================= */
app.use('/api', protectedRoutes);

/* =========================
   📄 DOCUMENT ROUTES
========================= */
app.use('/api/documents', documentRoutes);

/* =========================
   🔏 SIGNATURE ROUTES        ✅ جديد
========================= */
app.use('/api/signatures', signatureRoutes);

/* =========================
   📤 UPLOAD DOCUMENT (MEMORY)
========================= */
app.post("/api/memory/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const id        = Date.now().toString();
    const content   = req.file.buffer.toString("base64");
    const file_hash = hashFile(content);
    documents.set(id, { id, filename: req.file.originalname, content, file_hash, createdAt: new Date().toISOString() });
    return res.status(200).json({ message: "Uploaded successfully", id, file_hash });
  } catch (err) {
    return res.status(500).json({ message: "Upload failed" });
  }
});

/* =========================
   📄 GET ALL DOCUMENTS (MEMORY)
========================= */
app.get("/api/memory/documents", (req, res) => {
  try {
    const list = Array.from(documents.values()).map(doc => ({
      id: doc.id, filename: doc.filename, createdAt: doc.createdAt
    }));
    return res.status(200).json(list);
  } catch (err) {
    return res.status(500).json({ message: "Failed to load documents" });
  }
});

/* =========================
   🔍 VERIFY DOCUMENT (MEMORY)
========================= */
app.get("/api/memory/documents/:id/verify", (req, res) => {
  try {
    const doc = documents.get(req.params.id);
    if (!doc) return res.status(404).json({ integrity: "FAIL", message: "Document not found" });
    const recalculatedHash = hashFile(doc.content);
    const isValid = recalculatedHash === doc.file_hash;
    return res.status(200).json({ integrity: isValid ? "PASS" : "FAIL", checkedAt: new Date().toISOString() });
  } catch (err) {
    return res.status(500).json({ integrity: "FAIL", message: "Verification error" });
  }
});

/* =========================
   ❌ GLOBAL ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

/* =========================
   🟢 START SERVER
========================= */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔥 Server running on http://localhost:${PORT}`);
});
