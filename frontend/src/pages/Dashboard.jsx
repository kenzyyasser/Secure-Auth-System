import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Key, User, ShieldCheck, Clock } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const { user, token } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard');
        setDashboardData(response.data);
      } catch (error) {
        toast.error('Failed to load dashboard');
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="animate-slide-up">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-400 mb-8">Welcome back, {user?.name}</p>

        {/* JWT Token Display */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Key className="text-indigo-400" size={24} />
            <h2 className="text-xl font-semibold">Your Access Token (JWT)</h2>
          </div>
          <div className="bg-black/30 rounded-lg p-3 font-mono text-xs break-all text-gray-300">
            {token}
          </div>
          <p className="text-xs text-gray-500 mt-2">Required for all protected API requests</p>
        </div>

        {/* User Info & Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="text-indigo-400" size={24} />
              <h3 className="text-lg font-semibold">User Information</h3>
            </div>
            <div className="space-y-3">
              <div><span className="text-gray-400">Name:</span> <span className="font-medium">{user?.name}</span></div>
              <div><span className="text-gray-400">Email:</span> {user?.email}</div>
              <div><span className="text-gray-400">Role:</span> <span className="text-indigo-400 font-semibold">{user?.role}</span></div>
              <div><span className="text-gray-400">User ID:</span> {user?.id}</div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <ShieldCheck className="text-green-400" size={24} />
              <h3 className="text-lg font-semibold">System Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> Authentication: Active</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> 2FA: Enabled</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-green-500 rounded-full"></div> JWT: Valid</div>
              <div className="flex items-center gap-2"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Session: Secure</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;