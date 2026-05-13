const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../middleware/auth');
const {
  uploadDocument,
  listDocuments,
  downloadDocument,
  deleteDocument,
  viewDocument,
  verifyDocument
} = require('../controllers/documentController');

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }
});

// ✅ authenticateToken كافي - هو بيعمل HMAC check تلقائي لو موجودة
// ❌ شيلنا hmacProtection لأنه كان بيبلوك كل الـ requests
router.use(authenticateToken);

router.post('/upload', upload.single('file'), uploadDocument);
router.get('/', listDocuments);
router.get('/:id', viewDocument);
router.get('/:id/download', downloadDocument);
router.get('/:id/verify', verifyDocument);
router.delete('/:id', deleteDocument);

module.exports = router;