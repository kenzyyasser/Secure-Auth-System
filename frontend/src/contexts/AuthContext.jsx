import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [tempToken, setTempToken] = useState(sessionStorage.getItem('tempToken'));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      try {
        const decoded = JSON.parse(atob(token.split('.')[1]));
        setUser({ id: decoded.userId, email: decoded.email, name: decoded.name, role: decoded.role });
      } catch (e) {
        localStorage.removeItem('authToken');
      }
    }
    setLoading(false);
  }, [token]);

  const login = async (email, password, rememberMe = false) => {
    try {
      const response = await api.post('/login', { email, password, rememberMe });
      const { tempToken: newTempToken } = response.data;
      sessionStorage.setItem('tempToken', newTempToken);
      sessionStorage.setItem('rememberMe', rememberMe);
      setTempToken(newTempToken);
      toast.success('Password verified! Please enter 2FA code');
      navigate('/verify-2fa');
      return true;
    } catch (error) {
      if (error.response?.status === 423) {
        toast.error('Account locked. Please try again in 15 minutes.');
      } else {
        toast.error(error.response?.data?.message || 'Login failed');
      }
      return false;
    }
  };

  const verify2FA = async (twoFACode) => {
    try {
      const rememberMe = sessionStorage.getItem('rememberMe') === 'true';
      const response = await api.post('/verify-2fa', {
        tempToken,
        twoFACode,
        rememberMe
      });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser(userData);
      sessionStorage.removeItem('tempToken');
      sessionStorage.removeItem('rememberMe');
      setTempToken(null);
      toast.success('2FA verified! Login successful');
      navigate('/dashboard');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid 2FA code');
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('tempToken');
    sessionStorage.removeItem('rememberMe');
    setToken(null);
    setTempToken(null);
    setUser(null);
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const value = { user, token, tempToken, loading, login, verify2FA, logout, isAuthenticated: !!token };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};