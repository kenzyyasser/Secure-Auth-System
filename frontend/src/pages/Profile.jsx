import React, { useEffect, useState } from 'react';
import { User, Mail, Award, Calendar, ShieldCheck } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/profile');
        setProfile(response.data);
      } catch (error) {
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div></div>;

  return (
    <div className="container mx-auto px-6 py-12 max-w-3xl">
      <div className="glass-card p-8 animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <User size={48} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-gray-400">Your account information</p>
        </div>

        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1"><User size={16} /> Full Name</div>
            <p className="text-lg font-semibold">{profile?.name}</p>
          </div>
          <div className="border-b border-gray-700 pb-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1"><Mail size={16} /> Email Address</div>
            <p className="text-lg font-semibold">{profile?.email}</p>
          </div>
          <div className="border-b border-gray-700 pb-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1"><Award size={16} /> Role</div>
            <p><span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm">{profile?.role}</span></p>
          </div>
          <div className="border-b border-gray-700 pb-3">
            <div className="flex items-center gap-2 text-gray-400 mb-1"><Calendar size={16} /> Member Since</div>
            <p>{new Date(profile?.created_at).toLocaleDateString()}</p>
          </div>
          <div className="pt-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 flex items-center gap-3">
              <ShieldCheck className="text-green-400" size={20} />
              <div><p className="text-green-400 text-sm">2FA is enabled on this account</p><p className="text-gray-400 text-xs">Protected with two-factor authentication</p></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;