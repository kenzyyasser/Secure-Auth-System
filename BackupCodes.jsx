import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Shield, Copy, Download, CheckCircle } from 'lucide-react';

const BackupCodes = () => {
  const { token } = useAuth();
  const [codes, setCodes] = useState([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const generateCodes = async () => {
    setLoading(true);
    try {
      const response = await api.post('/generate-backup-codes');
      setCodes(response.data.backupCodes);
      setGenerated(true);
      toast.success('8 backup codes generated. Save them securely!');
    } catch (error) {
      toast.error('Failed to generate codes');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    const text = codes.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('Codes copied to clipboard');
  };

  const downloadCodes = () => {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'authshield-backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      <div className="glass-card p-8 animate-slide-up">
        <div className="text-center mb-8">
          <Shield size={48} className="mx-auto text-indigo-400 mb-4" />
          <h1 className="text-3xl font-bold">Two‑Factor Backup Codes</h1>
          <p className="text-gray-400 mt-2">
            Generate one‑time backup codes to access your account if you lose your authenticator device.
          </p>
        </div>

        {!generated ? (
          <button onClick={generateCodes} disabled={loading} className="auth-button">
            {loading ? 'Generating...' : 'Generate Backup Codes'}
          </button>
        ) : (
          <>
            <div className="bg-black/30 rounded-lg p-6 mb-6">
              <p className="text-sm text-yellow-400 mb-4">
                ⚠️ Save these codes in a secure place. Each code can be used only once.
              </p>
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {codes.map((code, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <CheckCircle size={14} className="text-green-400" />
                    <span>{code}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-4">
              <button onClick={copyToClipboard} className="flex-1 auth-button-secondary flex items-center justify-center gap-2">
                <Copy size={16} /> Copy
              </button>
              <button onClick={downloadCodes} className="flex-1 auth-button-secondary flex items-center justify-center gap-2">
                <Download size={16} /> Download
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BackupCodes;