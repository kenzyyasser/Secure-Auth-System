import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShieldOff } from 'lucide-react';

const PrivateRoute = ({ children, allowedRoles = [] }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="glass-card p-8 text-center max-w-md">
          <ShieldOff size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-2xl font-bold text-red-500 mb-4">Access Denied</h2>
          <p className="text-gray-300">You don't have permission to access this page.</p>
          <button onClick={() => window.history.back()} className="mt-6 auth-button-secondary w-auto px-6">Go Back</button>
        </div>
      </div>
    );
  }
  return children;
};

export default PrivateRoute;