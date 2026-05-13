import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Briefcase, Users, Calendar, CheckCircle, Clock } from 'lucide-react';

const ManagerPage = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Manager Dashboard</h1>
            <p className="text-gray-400">Team management & resource oversight</p>
          </div>
          <div className="bg-blue-600 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2"><Briefcase size={16} /> Manager</div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4"><Users className="text-blue-400" size={24} /><h2 className="text-xl font-semibold">Team Overview</h2></div>
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-gray-700 pb-2"><span>Team Members</span><span className="text-green-400">8</span></div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2"><span>Active Projects</span><span className="text-green-400">3</span></div>
              <div className="flex justify-between items-center border-b border-gray-700 pb-2"><span>Pending Approvals</span><span className="text-yellow-400">2</span></div>
            </div>
          </div>

          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-4"><Calendar className="text-purple-400" size={24} /><h2 className="text-xl font-semibold">Quick Actions</h2></div>
            <div className="space-y-3">
              <button className="w-full auth-button-secondary text-sm flex items-center justify-center gap-2"><CheckCircle size={16} /> View Team Reports</button>
              <button className="w-full auth-button-secondary text-sm flex items-center justify-center gap-2"><Users size={16} /> Manage Resources</button>
              <button className="w-full auth-button-secondary text-sm flex items-center justify-center gap-2"><Clock size={16} /> Schedule Meeting</button>
            </div>
          </div>
        </div>

        <div className="mt-8 glass-card p-6">
          <h3 className="text-lg font-semibold mb-3">Manager Permissions</h3>
          <div className="bg-black/30 rounded-lg p-3 space-y-1">
            <p className="text-sm text-gray-300">✓ Access manager dashboard</p>
            <p className="text-sm text-gray-300">✓ View team analytics</p>
            <p className="text-sm text-gray-300">✓ Manage team resources</p>
            <p className="text-sm text-gray-400 mt-2">Current user: {user?.name} ({user?.role})</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerPage;