import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ShieldX, Hash, Key, FileText,
  CheckCircle2, XCircle, RefreshCw, ChevronDown, ChevronUp, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_DOCS = 'http://localhost:5000/api/documents';
const API_SIG  = 'http://localhost:5000/api/signatures';

export default function VerificationPage() {
  const { token, user } = useAuth();
  const [docs, setDocs]             = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [results, setResults]       = useState({});   // { docId: verifyResult }
  const [infos, setInfos]           = useState({});   // { docId: infoResult }
  const [verifying, setVerifying]   = useState(null);
  const [expanded, setExpanded]     = useState(null);
  const [toast, setToast]           = useState(null);

  const headers = () => ({ Authorization: `Bearer ${token}` });

  const showToast = (type, msg) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  // Load documents list
  useEffect(() => {
    (async () => {
      setLoadingDocs(true);
      try {
        const res = await fetch(API_DOCS, { headers: headers() });
        if (!res.ok) throw new Error();
        setDocs(await res.json());
      } catch { showToast('error', 'Failed to load documents'); }
      finally { setLoadingDocs(false); }
    })();
  }, []);

  // Verify signature for a document
  const handleVerify = async (doc) => {
    setVerifying(doc.id);
    try {
      const res = await fetch(`${API_SIG}/${doc.id}/verify`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResults(prev => ({ ...prev, [doc.id]: data }));
      showToast(data.passed ? 'success' : 'error',
        data.passed ? `✓ Signature VALID — "${doc.original_name}"` : `✗ Signature FAILED — "${doc.original_name}"`);
    } catch (err) {
      showToast('error', err.message || 'Verification failed');
    } finally { setVerifying(null); }
  };

  // Load signature info (public key, hash)
  const handleInfo = async (docId) => {
    if (infos[docId]) {
      setExpanded(prev => prev === docId ? null : docId);
      return;
    }
    try {
      const res = await fetch(`${API_SIG}/${docId}/info`, { headers: headers() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setInfos(prev => ({ ...prev, [docId]: data }));
      setExpanded(docId);
    } catch (err) {
      showToast('error', err.message || 'Failed to load signature info');
    }
  };

  const result = (id) => results[id];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-violet-600/20 border border-violet-500/30">
            <ShieldCheck size={22} className="text-violet-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Digital Signatures & Integrity</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              RSA-2048 + SHA-256 · HMAC Tamper Detection · Per-document key pairs
            </p>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium
            ${toast.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
            {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {toast.msg}
          </div>
        )}

        {/* How it works */}
        <div className="rounded-2xl border border-gray-700/50 bg-gray-900/40 p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
            <Lock size={14} className="text-violet-400" /> How It Works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-gray-400">
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-white font-medium mb-1">🔑 On Upload</p>
              <p>RSA-2048 key pair generated per document. File hashed (SHA-256) and signed with private key.</p>
            </div>
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-white font-medium mb-1">📋 Stored</p>
              <p>Signature + public key + SHA-256 hash saved in DB. Private key retained server-side.</p>
            </div>
            <div className="bg-gray-800/40 rounded-lg p-3">
              <p className="text-white font-medium mb-1">✅ Verify</p>
              <p>File decrypted, re-hashed, signature checked with public key → clear PASS or FAIL.</p>
            </div>
          </div>
        </div>

        {/* Documents list */}
        <div className="rounded-2xl border border-gray-700 bg-gray-900/60 backdrop-blur p-6">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <FileText size={17} className="text-violet-400" />
            {user?.role === 'Admin' || user?.role === 'Manager' ? 'All Documents' : 'My Documents'}
            <span className="ml-auto text-xs text-gray-500 font-normal">
              {docs.length} file{docs.length !== 1 ? 's' : ''}
            </span>
          </h2>

          {loadingDocs ? (
            <div className="text-center py-10 text-gray-400">
              <RefreshCw size={22} className="animate-spin mx-auto mb-2" /> Loading…
            </div>
          ) : docs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShieldCheck size={36} className="mx-auto mb-3 opacity-30" />
              <p>No documents found. Upload one in the Documents page first.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {docs.map(doc => {
                const r = result(doc.id);
                const info = infos[doc.id];
                const isExpanded = expanded === doc.id;

                return (
                  <div key={doc.id}
                    className="rounded-xl border border-gray-700 bg-gray-800/40 overflow-hidden">
                    
                    {/* Main row */}
                    <div className="flex items-center gap-3 px-4 py-3">
                      <FileText size={18} className="text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{doc.original_name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {doc.uploader_email} · {new Date(doc.created_at).toLocaleDateString('en-GB')}
                        </p>
                      </div>

                      {/* Result badge */}
                      {r && (
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border
                          ${r.passed
                            ? 'bg-green-500/10 border-green-500/30 text-green-400'
                            : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
                          {r.passed ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {r.passed ? 'PASS' : 'FAIL'}
                        </span>
                      )}

                      {/* Action buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleVerify(doc)}
                          disabled={verifying === doc.id}
                          title="Verify Signature"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600/20
                            hover:bg-violet-600/40 text-violet-400 text-xs font-medium transition
                            disabled:opacity-40 disabled:cursor-not-allowed border border-violet-500/20">
                          {verifying === doc.id
                            ? <RefreshCw size={13} className="animate-spin" />
                            : <ShieldCheck size={13} />}
                          Verify
                        </button>
                        <button
                          onClick={() => handleInfo(doc.id)}
                          title="Show signature details"
                          className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400
                            hover:text-gray-200 transition">
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>
                    </div>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="border-t border-gray-700 px-4 py-4 space-y-3 bg-gray-900/30">

                        {/* Verification result breakdown */}
                        {r && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg
                              ${r.hashMatch ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              <Hash size={12} />
                              Hash Match: <strong>{r.hashMatch ? '✓ Yes' : '✗ No'}</strong>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg
                              ${r.signatureValid ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                              <Key size={12} />
                              RSA Signature: <strong>{r.signatureValid ? '✓ Valid' : '✗ Invalid'}</strong>
                            </div>
                          </div>
                        )}

                        {/* SHA-256 hashes */}
                        {r && (
                          <div className="space-y-1.5 text-xs">
                            <p className="text-gray-400 font-medium">SHA-256 Hashes</p>
                            <div className="bg-gray-800 rounded-lg p-2 font-mono text-gray-300 break-all">
                              <span className="text-gray-500">Stored: </span>{r.storedHash}
                            </div>
                            <div className={`rounded-lg p-2 font-mono break-all
                              ${r.hashMatch ? 'bg-gray-800 text-gray-300' : 'bg-red-900/20 text-red-300'}`}>
                              <span className="text-gray-500">Current: </span>{r.currentHash}
                            </div>
                          </div>
                        )}

                        {/* Public key */}
                        {info && (
                          <div className="text-xs space-y-1.5">
                            <p className="text-gray-400 font-medium flex items-center gap-1">
                              <Key size={11} /> Public Key (RSA-2048)
                            </p>
                            <pre className="bg-gray-800 rounded-lg p-3 text-gray-300 text-[10px]
                              overflow-x-auto whitespace-pre-wrap break-all max-h-32">
                              {info.publicKey}
                            </pre>
                          </div>
                        )}

                        {!r && !info && (
                          <p className="text-xs text-gray-500 text-center py-2">
                            Click <strong>Verify</strong> to run the signature check.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tamper warning note */}
        <div className="rounded-xl border border-yellow-700/30 bg-yellow-500/5 px-4 py-3 text-xs text-yellow-400 flex items-start gap-2">
          <ShieldX size={14} className="mt-0.5 flex-shrink-0" />
          <span>
            If a document is modified after upload (even 1 byte), the SHA-256 hash will differ and the RSA
            signature check will fail — clearly shown as <strong>FAIL</strong> above.
          </span>
        </div>

      </div>
    </div>
  );
}
