import React from 'react';
import { QrCode, X } from 'lucide-react';

const QRCodeModal = ({ isOpen, qrCode, onClose }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="glass-card p-8 max-w-md w-full mx-4 text-center relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={24} /></button>
        <div className="flex justify-center mb-4"><QrCode size={48} className="text-indigo-400" /></div>
        <h2 className="text-2xl font-bold mb-4">Scan QR Code</h2>
        <p className="text-gray-300 mb-4">Scan this QR code with Google Authenticator, Microsoft Authenticator, or Authy</p>
        <div className="flex justify-center mb-6"><img src={qrCode} alt="2FA QR Code" className="rounded-lg shadow-lg" /></div>
        <button onClick={onClose} className="auth-button">Continue to Login</button>
      </div>
    </div>
  );
};

export default QRCodeModal;