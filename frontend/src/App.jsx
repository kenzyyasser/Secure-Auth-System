import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Register from './pages/Register';
import Login from './pages/Login';
import TwoFactorVerify from './pages/TwoFactorVerify';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import AdminPage from './pages/AdminPage';
import ManagerPage from './pages/ManagerPage';
import UserPage from './pages/UserPage';
import BackupCodes from './pages/BackupCodes';   // <-- new

function App() {
  return (
    <Router>
      <ThemeProvider>
        <AuthProvider>
          <div className="min-h-screen">
            <Navbar />
            <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: '#1e293b', color: '#fff', borderRadius: '12px' } }} />
            <Routes>
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/verify-2fa" element={<TwoFactorVerify />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
              <Route path="/admin" element={<PrivateRoute allowedRoles={['Admin']}><AdminPage /></PrivateRoute>} />
              <Route path="/manager" element={<PrivateRoute allowedRoles={['Manager', 'Admin']}><ManagerPage /></PrivateRoute>} />
              <Route path="/user" element={<PrivateRoute><UserPage /></PrivateRoute>} />
              <Route path="/backup-codes" element={<PrivateRoute><BackupCodes /></PrivateRoute>} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Routes>
          </div>
        </AuthProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;