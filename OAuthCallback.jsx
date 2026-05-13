import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenManually } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const name  = searchParams.get('name');
    const role  = searchParams.get('role');
    const id    = searchParams.get('id');
    const email = searchParams.get('email');
    const error = searchParams.get('error');

    if (error) {
      const messages = {
        no_code:      'No authorization code received from Google.',
        oauth_failed: 'Google login failed. Please try again.',
        no_email:     'Could not retrieve email from Google.',
      };
      toast.error(messages[error] || 'Google login failed.');
      navigate('/login');
      return;
    }

    if (token) {
      setTokenManually({ token, user: { id, name, email, role } });
      toast.success(`Welcome, ${name}!`);
      navigate('/dashboard');
    } else {
      toast.error('No token received.');
      navigate('/login');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Completing Google login...</p>
      </div>
    </div>
  );
};

export default OAuthCallback;
