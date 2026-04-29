import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Mail, Lock, ShieldCheck, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';
import QRCodeModal from '../components/QRCodeModal';

const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'User' });
  const [showQR, setShowQR] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChecks, setPasswordChecks] = useState({
    minLen: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'password') validatePassword(value);
  };

  const validatePassword = (pass) => {
    setPasswordChecks({
      minLen: pass.length >= 8,
      upper: /[A-Z]/.test(pass),
      lower: /[a-z]/.test(pass),
      number: /[0-9]/.test(pass),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(pass),
    });
  };

  const isPasswordValid = () => {
    return Object.values(passwordChecks).every(Boolean);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.password) {
      toast.error('Please enter a password');
      return;
    }
    if (!isPasswordValid()) {
      toast.error('Password does not meet requirements. Please follow the rules below.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/register', formData);
      setQrData(response.data.qrCode);
      setShowQR(true);
      toast.success('Registration successful! Scan QR code with Google Authenticator');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQR = () => { setShowQR(false); navigate('/login'); };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="glass-card p-8 max-w-md w-full animate-slide-up">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Create Account
          </h1>
          <p className="text-gray-400 mt-2">Join AuthShield with a strong password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" name="name" value={formData.name} onChange={handleChange} required className="auth-input pl-10" placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="email" name="email" value={formData.email} onChange={handleChange} required className="auth-input pl-10" placeholder="user@example.com" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="auth-input pl-10 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {/* Password instructions */}
            <div className="mt-2 space-y-1 text-xs border-t border-gray-700 pt-2">
              <p className="text-gray-400 font-semibold">Password must contain:</p>
              <div className="grid grid-cols-2 gap-1">
                <div className="flex items-center gap-1">
                  {passwordChecks.minLen ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-red-400" />}
                  <span className={passwordChecks.minLen ? 'text-green-400' : 'text-red-400'}>At least 8 characters</span>
                </div>
                <div className="flex items-center gap-1">
                  {passwordChecks.upper ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-red-400" />}
                  <span className={passwordChecks.upper ? 'text-green-400' : 'text-red-400'}>One uppercase letter</span>
                </div>
                <div className="flex items-center gap-1">
                  {passwordChecks.lower ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-red-400" />}
                  <span className={passwordChecks.lower ? 'text-green-400' : 'text-red-400'}>One lowercase letter</span>
                </div>
                <div className="flex items-center gap-1">
                  {passwordChecks.number ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-red-400" />}
                  <span className={passwordChecks.number ? 'text-green-400' : 'text-red-400'}>One number (0-9)</span>
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  {passwordChecks.special ? <CheckCircle size={12} className="text-green-400" /> : <XCircle size={12} className="text-red-400" />}
                  <span className={passwordChecks.special ? 'text-green-400' : 'text-red-400'}>One special character (!@#$%^&* etc.)</span>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <select name="role" value={formData.role} onChange={handleChange} className="auth-input pl-10 appearance-none">
                <option value="User">User</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
          </div>

          <button type="submit" disabled={loading} className="auth-button">
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <p className="text-center text-gray-400 mt-6">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-indigo-400 hover:text-indigo-300">
            Login
          </button>
        </p>
      </div>
      <QRCodeModal isOpen={showQR} qrCode={qrData} onClose={handleCloseQR} />
    </div>
  );
};

export default Register;