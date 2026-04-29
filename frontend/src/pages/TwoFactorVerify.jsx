import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, KeyRound, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const TwoFactorVerify = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const { verify2FA, tempToken } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code) {
      toast.error(useBackupCode ? 'Please enter a backup code' : 'Please enter a 6-digit code');
      return;
    }
    if (!useBackupCode && code.length !== 6) {
      toast.error('Please enter a valid 6-digit code');
      return;
    }
    if (useBackupCode && code.length !== 8) {
      toast.error('Backup codes are 8 characters long');
      return;
    }

    setLoading(true);

    if (useBackupCode) {
      try {
        const decoded = JSON.parse(atob(tempToken.split('.')[1]));
        const response = await api.post('/verify-backup-code', {
          userId: decoded.userId,
          code: code.toUpperCase()
        });
        
        if (response.data.valid) {
          // Handle new backup codes if any were generated
          if (response.data.newBackupCodes && response.data.newBackupCodes.length > 0) {
            const fileName = `authshield-backup-codes-${Date.now()}.txt`;
            const blob = new Blob([response.data.newBackupCodes.join('\n')], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            URL.revokeObjectURL(url);
            
            // Shown notification with longer duration
            toast.success(
              `🔐 New backup codes generated!\n\n8 fresh codes have been downloaded as "${fileName}".\nPlease save them securely.`,
              { duration: 8000 }
            );
            
            // Wait 2 seconds so the user can read the notification
            await new Promise(resolve => setTimeout(resolve, 2000));
          }
          
          // Complete the login process (skip real 2FA)
          const rememberMe = sessionStorage.getItem('rememberMe') === 'true';
          const finalResponse = await api.post('/verify-2fa', {
            tempToken,
            twoFACode: '000000',
            rememberMe,
            isBackupCode: true
          });
          const { token: newToken, user: userData } = finalResponse.data;
          localStorage.setItem('authToken', newToken);
          window.location.href = '/dashboard';
        } else {
          toast.error('Invalid backup code');
        }
      } catch (error) {
        console.error('Backup code error:', error);
        toast.error(error.response?.data?.message || 'Backup code verification failed');
      } finally {
        setLoading(false);
      }
    } else {
      await verify2FA(code);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass-card p-8 max-w-md w-full animate-slide-up">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            {useBackupCode ? <Lock size={48} className="text-yellow-400" /> : <Shield size={48} className="text-indigo-400" />}
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            {useBackupCode ? 'Enter Backup Code' : 'Two-Factor Authentication'}
          </h1>
          <p className="text-gray-400 mt-2">
            {useBackupCode 
              ? 'Enter one of your 8-character backup codes' 
              : 'Enter the 6-digit code from your authenticator app'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {useBackupCode ? 'Backup Code' : 'Verification Code'}
            </label>
            <div className="relative">
              {useBackupCode ? (
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              ) : (
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              )}
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  if (useBackupCode) {
                    setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8));
                  } else {
                    setCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  }
                }}
                maxLength={useBackupCode ? 8 : 6}
                className="auth-input pl-10 text-center text-2xl tracking-widest"
                placeholder={useBackupCode ? 'A7F3K9M2' : '000000'}
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Verifying...' : (useBackupCode ? 'Verify Backup Code' : 'Verify & Login')}
          </button>
        </form>

        <div className="text-center mt-6">
          <button
            onClick={() => {
              setUseBackupCode(!useBackupCode);
              setCode('');
            }}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition"
          >
            {useBackupCode 
              ? '← Use Authenticator App Instead' 
              : 'Lost your device? Use a backup code →'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TwoFactorVerify;
