import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, Shield, LayoutDashboard, UserCircle, Users, Briefcase, LogOut, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Manager', 'User'] },
    { path: '/profile', label: 'Profile', icon: UserCircle, roles: ['Admin', 'Manager', 'User'] },
    { path: '/admin', label: 'Admin Panel', icon: Shield, roles: ['Admin'] },
    { path: '/manager', label: 'Manager Panel', icon: Briefcase, roles: ['Manager', 'Admin'] },
    { path: '/user', label: 'User Panel', icon: Users, roles: ['User', 'Manager', 'Admin'] },
  ];

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-md border-b transition-all duration-300 bg-black/30 border-gray-700">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/dashboard" className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            AuthShield
          </Link>

          {isAuthenticated && (
            <div className="flex items-center space-x-6">
              <div className="hidden md:flex space-x-4">
                {navItems.map((item) => 
                  item.roles.includes(user?.role) && (
                    <Link key={item.path} to={item.path} className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                      <item.icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  )
                )}
                {/* Backup Codes link – added only once */}
                <Link to="/backup-codes" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors">
                  <Key size={18} />
                  <span>Backup Codes</span>
                </Link>
              </div>
              <div className="flex items-center space-x-4">
                <button onClick={toggleTheme} className="theme-toggle">
                  {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>
                <span className="text-sm text-gray-300">
                  <span className="font-medium">{user?.name}</span>
                  <span className="ml-2 text-indigo-400 text-xs px-2 py-0.5 rounded-full bg-indigo-500/20">{user?.role}</span>
                </span>
                <button onClick={logout} className="flex items-center gap-1 bg-indigo-600/80 hover:bg-indigo-600 px-4 py-2 rounded-lg text-sm font-medium transition">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}

          {!isAuthenticated && (
            <div className="space-x-4">
              <Link to="/login" className="text-gray-300 hover:text-white">Login</Link>
              <Link to="/register" className="bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;