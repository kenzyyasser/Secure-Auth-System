import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Activity, ShieldCheck, Settings, HelpCircle } from 'lucide-react';
import toast from 'react-hot-toast';
const UserPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">User Dashboard</h1>
            <p className="text-gray-400">Your personal workspace</p>
          </div>
          <div className="bg-green-600 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"><User size={16} /> Standard User</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4"><Activity className="text-green-400" size={24} /><h2 className="text-xl font-semibold">Your Activity</h2></div>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2"><span>Last Login</span><span className="text-gray-300">Today, 10:30 AM</span></div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2"><span>Account Status</span><span className="text-green-400">Active</span></div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2"><span>2FA Status</span><span className="text-green-400">Enabled</span></div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4"><Settings className="text-purple-400" size={24} /><h2 className="text-xl font-semibold">Quick Links</h2></div>
            <div className="space-y-3">
              <button className="w-full auth-button-secondary text-sm flex items-center justify-center gap-2"><User size={16} /> View My Profile</button>
              <button className="w-full auth-button-secondary text-sm flex items-center justify-center gap-2"><Settings size={16} /> Account Settings</button>
              <button className="w-full auth-button-secondary text-sm flex items-center justify-center gap-2"><HelpCircle size={16} /> Help Center</button>
            </div>
          </div>
        </div>

        <div className="mt-8 glass-card p-6">
          <h3 className="text-lg font-semibold mb-3">Your Permissions</h3>
          <div className="bg-black/30 rounded-lg p-3">
            <p className="text-sm text-gray-300">✓ Access user dashboard</p>
            <p className="text-sm text-gray-300">✓ View personal profile</p>
            <p className="text-sm text-gray-300">✓ Update account settings</p>
            <p className="text-sm text-gray-400 mt-2">Welcome back, {user?.name}!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserPage;
