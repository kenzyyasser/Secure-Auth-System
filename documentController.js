const path = require('path');
const fs   = require('fs');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

const db       = require('../db');
const logEvent = require('../utils/audit');

const { generateDEK, wrapDEK, unwrapDEK, encryptBuffer, decryptBuffer } = require('../utils/encryption');
const { signFile, verifyFile } = require('../security/signature/signatureService');

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads', 'encrypted');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// ✅ نجيب الـ public key من الـ DB أو من الملف
function getPublicKey() {
  try {
    const row = db.prepare('SELECT public_key FROM system_keys ORDER BY id DESC LIMIT 1').get();
    if (row) return row.public_key;
  } catch {}
  try {
    return fs.readFileSync(
      path.join(__dirname, '..', 'security', 'signature', 'public.pem'), 'utf8'
    );
  } catch { return null; }
}

const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'image/jpeg',
  'image/png',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
const MAX_SIZE = 10 * 1024 * 1024;

//////////////////////////////////////////////////////////
// 🔐 UPLOAD DOCUMENT
//////////////////////////////////////////////////////////
const uploadDocument = (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file provided' });

  const { originalname, mimetype, size, buffer } = req.file;

  if (!ALLOWED_TYPES.includes(mimetype))
    return res.status(400).json({ message: 'File type not allowed' });
  if (size > MAX_SIZE)
    return res.status(400).json({ message: 'File too large. Max 10MB' });

  try {
    // ✅ 1. SHA-256 hash للملف الأصلي
    const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');

    // ✅ 2. Sign الملف الأصلي (مش الـ ciphertext)
    const signature = signFile(buffer);

    // ✅ 3. جيب الـ public key عشان نحفظه مع الـ document
    const publicKey = getPublicKey();

    // 🔐 4. Encrypt
    const dek = generateDEK();
    const { ciphertext, fileIv, fileTag } = encryptBuffer(buffer, dek);
    const { encryptedKey, keyIv, keyTag } = wrapDEK(dek);

    const storedName = `${uuidv4()}.enc`;
    fs.writeFileSync(path.join(UPLOAD_DIR, storedName), ciphertext);

    // ✅ 5. احفظ file_hash و public_key مع الـ document
    const result = db.prepare(`
      INSERT INTO documents (
        uploader_id, uploader_email, original_name, stored_name,
        mime_type, file_size,
        encrypted_key, key_iv, key_tag,
        file_iv, file_tag,
        signature, public_key, file_hash
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).run(
      req.user.userId, req.user.email, originalname, storedName,
      mimetype, size,
      encryptedKey, keyIv, keyTag,
      fileIv, fileTag,
      signature, publicKey, fileHash
    );

    logEvent(req.user.userId, req.user.email, 'DOCUMENT_UPLOAD', req,
      `Uploaded "${originalname}" doc_id=${result.lastInsertRowid}`);

    return res.status(201).json({
      message: 'Encrypted & stored',
      document: {
        id: result.lastInsertRowid,
        original_name: originalname,
        mime_type: mimetype,
        file_size: size,
        created_at: new Date().toISOString(),
        file_hash: fileHash,
        signature
      }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Upload failed', error: err.message });
  }
};

//////////////////////////////////////////////////////////
// 🔍 VERIFY INTEGRITY (PASS / FAIL)
// ✅ الـ verify بيتعمل على الـ plaintext مش الـ ciphertext
//////////////////////////////////////////////////////////
const verifyDocument = (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Document not found' });

    if (req.user.role !== 'Admin' && req.user.role !== 'Manager' && doc.uploader_id !== req.user.userId)
      return res.status(403).json({ message: 'Access denied' });

    // 🔓 فك التشفير أولاً
    const ciphertext = fs.readFileSync(path.join(UPLOAD_DIR, doc.stored_name));
    const dek = unwrapDEK({ encryptedKey: doc.encrypted_key, keyIv: doc.key_iv, keyTag: doc.key_tag });
    const plaintext = decryptBuffer(ciphertext, dek, doc.file_iv, doc.file_tag);

    // ✅ حساب الـ hash الحالي للـ plaintext
    const currentHash = crypto.createHash('sha256').update(plaintext).digest('hex');
    const storedHash  = doc.file_hash;
    const hashMatch   = storedHash ? storedHash === currentHash : null;

    // ✅ التحقق من الـ RSA signature على الـ plaintext
    let signatureValid = false;
    if (doc.signature) {
      try { signatureValid = verifyFile(plaintext, doc.signature); }
      catch { signatureValid = false; }
    }

    const passed = signatureValid && (hashMatch !== false);

    logEvent(req.user.userId, req.user.email, 'DOCUMENT_VERIFY', req,
      `Verified doc_id=${req.params.id} result=${passed ? 'PASS' : 'FAIL'}`);

    return res.json({
      document_id: doc.id,
      file_name:   doc.original_name,
      integrity:   passed ? 'PASS' : 'FAIL',
      passed,
      signatureValid,
      hashMatch:   hashMatch ?? true,
      storedHash:  storedHash  || '(not stored)',
      currentHash
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Verification failed', error: err.message });
  }
};

//////////////////////////////////////////////////////////
// 📄 LIST DOCUMENTS
//////////////////////////////////////////////////////////
const listDocuments = (req, res) => {
  try {
    const docs =
      req.user.role === 'Admin' || req.user.role === 'Manager'
        ? db.prepare(`SELECT id, uploader_id, uploader_email, original_name,
                             mime_type, file_size, created_at, signature, file_hash
                      FROM documents ORDER BY created_at DESC`).all()
        : db.prepare(`SELECT id, uploader_id, uploader_email, original_name,
                             mime_type, file_size, created_at, signature, file_hash
                      FROM documents WHERE uploader_id = ? ORDER BY created_at DESC`).all(req.user.userId);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list documents' });
  }
};

//////////////////////////////////////////////////////////
// ⬇️ DOWNLOAD DOCUMENT
//////////////////////////////////////////////////////////
const downloadDocument = (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    if (req.user.role !== 'Admin' && doc.uploader_id !== req.user.userId)
      return res.status(403).json({ message: 'Access denied' });

    const ciphertext = fs.readFileSync(path.join(UPLOAD_DIR, doc.stored_name));
    const dek = unwrapDEK({ encryptedKey: doc.encrypted_key, keyIv: doc.key_iv, keyTag: doc.key_tag });
    const plaintext = decryptBuffer(ciphertext, dek, doc.file_iv, doc.file_tag);

    logEvent(req.user.userId, req.user.email, 'DOCUMENT_DOWNLOAD', req, `Downloaded doc_id=${req.params.id}`);

    res.set({
      'Content-Type': doc.mime_type,
      'Content-Disposition': `attachment; filename="${doc.original_name}"`,
      'Content-Length': plaintext.length
    });
    res.send(plaintext);

  } catch (err) {
    res.status(500).json({ message: 'Decryption error', error: err.message });
  }
};

//////////////////////////////////////////////////////////
// 🗑️ DELETE DOCUMENT
//////////////////////////////////////////////////////////
const deleteDocument = (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
    if (!doc) return res.status(404).json({ message: 'Not found' });

    if (req.user.role !== 'Admin' && doc.uploader_id !== req.user.userId)
      return res.status(403).json({ message: 'Access denied' });

    const filePath = path.join(UPLOAD_DIR, doc.stored_name);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM documents WHERE id = ?').run(req.params.id);

    logEvent(req.user.userId, req.user.email, 'DOCUMENT_DELETE', req, `Deleted doc_id=${req.params.id}`);
    res.json({ message: 'Deleted successfully' });

  } catch (err) {
    res.status(500).json({ message: 'Delete failed' });
  }
};

//////////////////////////////////////////////////////////
// 👁️ VIEW DOCUMENT (METADATA)
//////////////////////////////////////////////////////////
const viewDocument = (req, res) => {
  try {
    const doc = db.prepare(`
      SELECT id, uploader_id, uploader_email, original_name,
             mime_type, file_size, created_at, file_hash
      FROM documents WHERE id = ?
    `).get(req.params.id);

    if (!doc) return res.status(404).json({ message: 'Not found' });

    if (req.user.role !== 'Admin' && doc.uploader_id !== req.user.userId)
      return res.status(403).json({ message: 'Access denied' });

    res.json(doc);
  } catch (err) {
    res.status(500).json({ message: 'Failed' });
  }
};

module.exports = { uploadDocument, listDocuments, downloadDocument, deleteDocument, viewDocument, verifyDocument };
