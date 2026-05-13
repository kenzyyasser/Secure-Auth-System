const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { authenticateToken } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();
router.use(authenticateToken);

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'encrypted');

const { unwrapDEK, decryptBuffer } = require('../utils/encryption');
const { verifyFile } = require('../security/signature/signatureService');

// =============================================
// GET /api/signatures/:id/verify
// بيرجع: passed, hashMatch, signatureValid, storedHash, currentHash
// =============================================
router.get('/:id/verify', (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    // access check
    if (req.user.role !== 'Admin' && req.user.role !== 'Manager' && doc.uploader_id !== req.user.userId)
      return res.status(403).json({ message: 'Access denied' });

    // قراءة الملف المشفر
    const ciphertext = fs.readFileSync(path.join(UPLOAD_DIR, doc.stored_name));

    // فك التشفير
    const dek = unwrapDEK({
      encryptedKey: doc.encrypted_key,
      keyIv: doc.key_iv,
      keyTag: doc.key_tag
    });
    const plaintext = decryptBuffer(ciphertext, dek, doc.file_iv, doc.file_tag);

    // حساب الـ hash الحالي
    const currentHash = crypto.createHash('sha256').update(plaintext).digest('hex');
    const storedHash  = doc.file_hash || null;
    const hashMatch   = storedHash ? storedHash === currentHash : null;

    // التحقق من الـ signature
    let signatureValid = false;
    if (doc.signature) {
      try {
        signatureValid = verifyFile(plaintext, doc.signature);
      } catch { signatureValid = false; }
    }

    const passed = signatureValid && (hashMatch !== false);

    return res.json({
      document_id: doc.id,
      file_name: doc.original_name,
      passed,
      signatureValid,
      hashMatch: hashMatch ?? true,   // لو مفيش stored hash نعتبره match
      storedHash:  storedHash  || '(not stored)',
      currentHash
    });

  } catch (err) {
    console.error('VERIFY ERROR:', err);
    return res.status(500).json({ message: 'Verification failed', error: err.message });
  }
});

// =============================================
// GET /api/signatures/:id/info
// بيرجع: publicKey, signature preview
// =============================================
router.get('/:id/info', (req, res) => {
  try {
    const doc = db.prepare(
      'SELECT id, original_name, signature, public_key FROM documents WHERE id = ?'
    ).get(req.params.id);

    if (!doc) return res.status(404).json({ message: 'Document not found' });

    return res.json({
      document_id: doc.id,
      file_name:   doc.original_name,
      publicKey:   doc.public_key || '(not stored — system key used)',
      signaturePreview: doc.signature
        ? doc.signature.substring(0, 40) + '...'
        : '(no signature)'
    });

  } catch (err) {
    return res.status(500).json({ message: 'Failed to load info' });
  }
});

module.exports = router;