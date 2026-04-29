import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

const TwoFactorVerify = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { verify2FA } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!code || code.length !== 6) {
      const msg = 'Please enter a valid 6-digit verification code';
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    await verify2FA(code);
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass-card p-8 max-w-md w-full animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Shield size={48} className="text-indigo-400" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Two-Factor Authentication
          </h1>
          <p className="text-gray-400 mt-2">Enter the 6-digit code from your authenticator app</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Verification Code</label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                className="auth-input pl-10 text-center text-2xl tracking-widest"
                placeholder="000000"
              />
            </div>
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Verifying...' : 'Verify & Login'}
          </button>
        </form>

        <p className="text-center text-gray-400 text-sm mt-6">
          Open Google Authenticator or Microsoft Authenticator to get your code
        </p>
      </div>
    </div>
  );
};

export default TwoFactorVerify;