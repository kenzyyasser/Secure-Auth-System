import React, { useState, useEffect, useRef } from 'react';
import { Upload, Download, Trash2, FileText, File, Image, FileSpreadsheet, Shield, Lock, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import CryptoJS from 'crypto-js';
const API = 'http://localhost:5000/api/documents';
const HMAC_SECRET = 'frontend_secret_key';

const formatSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const formatDate = (iso) => new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const mimeIcon = (mime) => {
  if (!mime) return <File size={20} className="text-gray-400" />;
  if (mime.startsWith('image/')) return <Image size={20} className="text-blue-400" />;
  if (mime === 'application/pdf') return <FileText size={20} className="text-red-400" />;
  if (mime.includes('spreadsheet') || mime.includes('excel')) return <FileSpreadsheet size={20} className="text-green-400" />;
  return <FileText size={20} className="text-indigo-400" />;
};

export default function DocumentsPage() {
  const { token, user } = useAuth();
  const fileInputRef = useRef(null);
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [toast, setToast] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [downloading, setDownloading] = useState(null);

  const showToast = (type, msg) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };
  const generateHmac = (token) => {
  return CryptoJS.HmacSHA256(token, HMAC_SECRET).toString();
};

const headers = () => {
  return {
    Authorization: `Bearer ${token}`,
    'x-signature': generateHmac(token)
  };
};

  const fetchDocs = async () => {
    setLoading(true);
    try {
      const res = await fetch(API, { headers: headers() });
      if (!res.ok) throw new Error();
      setDocs(await res.json());
    } catch { showToast('error', 'Failed to load documents'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDocs(); }, []);

  const handleFileSelect = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('error', 'File too large — max 10 MB'); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true); setProgress(0);
    const interval = setInterval(() => setProgress((p) => p < 85 ? p + Math.random() * 15 : p), 200);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      const res = await fetch(`${API}/upload`, { method: 'POST', headers: headers(), body: form });
      clearInterval(interval); setProgress(100);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      showToast('success', `"${selectedFile.name}" encrypted & stored ✓`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchDocs();
    } catch (err) { clearInterval(interval); showToast('error', err.message); }
    finally { setUploading(false); setTimeout(() => setProgress(0), 1000); }
  };

  const handleDownload = async (doc) => {
    setDownloading(doc.id);
    try {
      const res = await fetch(`${API}/${doc.id}/download`, { headers: headers() });
      if (!res.ok) { const err = await res.json(); throw new Error(err.message); }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = doc.original_name; a.click();
      URL.revokeObjectURL(url);
      showToast('success', `Decrypted & downloaded "${doc.original_name}" ✓`);
    } catch (err) { showToast('error', err.message || 'Download failed'); }
    finally { setDownloading(null); }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.original_name}"? This cannot be undone.`)) return;
    setDeleting(doc.id);
    try {
      const res = await fetch(`${API}/${doc.id}`, { method: 'DELETE', headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast('success', `Deleted "${doc.original_name}" ✓`);
      setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    } catch (err) { showToast('error', err.message); }
    finally { setDeleting(null); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30">
              <Lock size={22} className="text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Encrypted Documents</h1>
              <p className="text-sm text-gray-400 mt-0.5">AES-256-GCM · KEK/DEK key hierarchy · Authenticated encryption</p>
            </div>
          </div>
          <button onClick={fetchDocs} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm transition">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {toast && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {toast.msg}
          </div>
        )}

        <div className="rounded-2xl border border-gray-700 bg-gray-900/60 backdrop-blur p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Upload size={17} className="text-indigo-400" /> Upload Document
          </h2>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all ${dragOver ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/40'}`}
          >
            <Shield size={32} className="mx-auto mb-3 text-indigo-500/60" />
            {selectedFile ? (
              <div><p className="text-white font-medium">{selectedFile.name}</p><p className="text-sm text-gray-400 mt-1">{formatSize(selectedFile.size)}</p></div>
            ) : (
              <div><p className="text-gray-300">Drop file here or <span className="text-indigo-400 underline">browse</span></p><p className="text-xs text-gray-500 mt-1">.pdf .doc .docx .txt .jpg .png .xls .xlsx · Max 10 MB</p></div>
            )}
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xls,.xlsx" className="hidden" onChange={(e) => handleFileSelect(e.target.files[0])} />
          </div>

          {uploading && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-gray-400 mb-1"><span>Encrypting & uploading…</span><span>{Math.round(progress)}%</span></div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          <button onClick={handleUpload} disabled={!selectedFile || uploading} className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition">
            {uploading ? <><RefreshCw size={16} className="animate-spin" /> Encrypting…</> : <><Lock size={16} /> Encrypt & Upload</>}
          </button>
          <p className="mt-3 text-xs text-gray-500 text-center">Files are encrypted with AES-256-GCM before touching disk. Unique DEK per file, wrapped with server KEK.</p>
        </div>

        <div className="rounded-2xl border border-gray-700 bg-gray-900/60 backdrop-blur p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileText size={17} className="text-indigo-400" />
            {user?.role === 'Admin' ? 'All Documents' : 'My Documents'}
            <span className="ml-auto text-xs text-gray-500 font-normal">{docs.length} file{docs.length !== 1 ? 's' : ''}</span>
          </h2>
          {loading ? (
            <div className="text-center py-10 text-gray-400"><RefreshCw size={22} className="animate-spin mx-auto mb-2" />Loading…</div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><Shield size={36} className="mx-auto mb-3 opacity-30" /><p>No documents yet. Upload one above.</p></div>
          ) : (
            <div className="space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 transition group">
                  <div className="flex-shrink-0">{mimeIcon(doc.mime_type)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{doc.original_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {formatSize(doc.file_size)} · {formatDate(doc.created_at)}
                      {user?.role === 'Admin' && <span className="ml-2 text-indigo-400">{doc.uploader_email}</span>}
                    </p>
                  </div>
                  <span className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Lock size={10} /> AES-256-GCM
                  </span>
                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition">
                    <button onClick={() => handleDownload(doc)} disabled={downloading === doc.id} title="Decrypt & Download" className="p-2 rounded-lg hover:bg-indigo-600/20 text-indigo-400 hover:text-indigo-300 transition disabled:opacity-40">
                      {downloading === doc.id ? <RefreshCw size={16} className="animate-spin" /> : <Download size={16} />}
                    </button>
                    {(user?.role === 'Admin' || doc.uploader_id === user?.id) && (
                      <button onClick={() => handleDelete(doc)} disabled={deleting === doc.id} title="Delete" className="p-2 rounded-lg hover:bg-red-600/20 text-red-400 hover:text-red-300 transition disabled:opacity-40">
                        {deleting === doc.id ? <RefreshCw size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-700/50 bg-gray-900/30 p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2"><Shield size={15} className="text-indigo-400" /> Encryption Architecture</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-400">
            <div className="bg-gray-800/40 rounded-lg p-3"><p className="text-white font-medium mb-1">🔑 Key Hierarchy</p><p>Each file gets a unique DEK. Wrapped with Master KEK in .env — never stored in plaintext.</p></div>
            <div className="bg-gray-800/40 rounded-lg p-3"><p className="text-white font-medium mb-1">🛡️ AES-256-GCM</p><p>Authenticated encryption — guarantees confidentiality + integrity. Tampering is detectable.</p></div>
            <div className="bg-gray-800/40 rounded-lg p-3"><p className="text-white font-medium mb-1">🔒 Access Control</p><p>Only uploader and Admin can download or delete. All actions recorded in audit log.</p></div>
          </div>
        </div>

      </div>
    </div>
  );
}
