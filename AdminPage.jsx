import React, { useEffect, useState } from 'react';
import { Shield, Users, Database, Lock, Trash2, Unlock, Activity, X } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ open: false, userId: null, userName: null, action: null });

  const fetchUsers = async () => {
    try {
      const response = await api.get('/admin/users');
      setUsers(response.data);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const response = await api.get('/admin/audit-log');
      setAuditLogs(response.data);
    } catch (error) {
      toast.error('Failed to load audit log');
    }
  };

  const loadData = async () => {
    setLoading(true);
    if (activeTab === 'users') await fetchUsers();
    else await fetchAuditLogs();
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleDeleteClick = (userId, userName) => {
    setConfirmModal({ open: true, userId, userName, action: 'delete' });
  };

  const handleUnlockClick = (userId, userName) => {
    setConfirmModal({ open: true, userId, userName, action: 'unlock' });
  };

  const confirmAction = async () => {
    const { userId, userName, action } = confirmModal;
    setActionLoading(userId);
    setConfirmModal({ open: false, userId: null, userName: null, action: null });

    try {
      if (action === 'delete') {
        await api.delete(`/admin/users/${userId}`);
        toast.success(`User "${userName}" deleted`);
      } else if (action === 'unlock') {
        await api.post(`/admin/unlock/${userId}`);
        toast.success(`User "${userName}" unlocked`);
      }
      // Refresh current tab data
      if (activeTab === 'users') await fetchUsers();
      else await fetchAuditLogs();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(null);
    }
  };

  const cancelModal = () => {
    setConfirmModal({ open: false, userId: null, userName: null, action: null });
  };

  // Helper to format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="animate-slide-up">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-gray-400">Full system access & user management</p>
          </div>
          <div className="bg-indigo-600 px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
            <Shield size={16} /> Admin
          </div>
        </div>

        {/* Password Hashing Demo Card */}
        <div className="glass-card p-6 mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Database className="text-green-400" size={24} />
            <h2 className="text-xl font-semibold">Password Hashing Demonstration</h2>
          </div>
          <p className="text-gray-300 mb-2">
            All passwords stored using <strong className="text-yellow-400">bcrypt</strong> (salt rounds = 10).
          </p>
          <div className="bg-black/30 rounded-lg p-2 text-xs text-gray-400 font-mono">
            Example hash: $2b$10$N9qo8uLOickgx2ZMRZoMy.MqrqbKFJj4iFhY9.xRq0ZiFkQ6jI8dW
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'users'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users size={18} className="inline mr-2" /> Users
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'audit'
                ? 'text-indigo-400 border-b-2 border-indigo-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity size={18} className="inline mr-2" /> Audit Log
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
          </div>
        ) : activeTab === 'users' ? (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Locked</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Attempts</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-sm">{user.id}</td>
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-sm">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          user.role === 'Admin' ? 'bg-indigo-500/20 text-indigo-400' :
                          user.role === 'Manager' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-green-500/20 text-green-400'
                        }`}>{user.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        {user.locked_until && new Date(user.locked_until) > new Date() ? (
                          <span className="text-red-400 text-xs">Locked</span>
                        ) : (
                          <span className="text-green-400 text-xs">Active</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">{user.failed_login_attempts || 0}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {user.locked_until && new Date(user.locked_until) > new Date() && (
                            <button
                              onClick={() => handleUnlockClick(user.id, user.name)}
                              disabled={actionLoading === user.id}
                              className="text-yellow-400 hover:text-yellow-300 transition"
                              title="Unlock user"
                            >
                              <Unlock size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteClick(user.id, user.name)}
                            disabled={actionLoading === user.id}
                            className="text-red-400 hover:text-red-300 transition"
                            title="Delete user"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-black/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">IP Address</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-white/5">
                      <td className="px-4 py-3 text-xs">{formatDate(log.created_at)}</td>
                      <td className="px-4 py-3 text-sm">{log.user_email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          log.event_type.includes('SUCCESS') ? 'bg-green-500/20 text-green-400' :
                          log.event_type.includes('FAIL') || log.event_type.includes('LOCKED') ? 'bg-red-500/20 text-red-400' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>{log.event_type}</span>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono">{log.ip_address || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{log.details || '—'}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr><td colSpan="5" className="text-center py-8 text-gray-400">No audit logs yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="glass-card p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Confirm {confirmModal.action === 'delete' ? 'Delete' : 'Unlock'}</h3>
              <button onClick={cancelModal} className="text-gray-400 hover:text-white"><X size={20} /></button>
            </div>
            <p className="text-gray-300 mb-6">
              {confirmModal.action === 'delete' 
                ? `Are you sure you want to delete "${confirmModal.userName}"? This action cannot be undone.`
                : `Unlock "${confirmModal.userName}"? They will be able to log in again.`}
            </p>
            <div className="flex gap-3">
              <button onClick={cancelModal} className="flex-1 auth-button-secondary">Cancel</button>
              <button onClick={confirmAction} className={`flex-1 ${confirmModal.action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white font-semibold py-2 rounded-lg transition`}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;