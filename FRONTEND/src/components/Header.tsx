import React, { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, UserIcon, LogOutIcon, Settings } from 'lucide-react';
import { useAuth } from './AuthContext';
export const Header: React.FC = () => {
  const {
    user,
    isAuthenticated,
    logout
  } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoMissing, setLogoMissing] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate('/login');
  };
  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  return <header className="bg-white border-b border-gray-200 py-3 px-4 shadow-sm dark:bg-gray-900 dark:border-gray-700">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="flex items-center space-x-2.5">
          {/* Use custom logo if available; otherwise show inline SVG fallback */}
          {!logoMissing ? (
            <img
              src="/logo.jpg"
              alt="Fixit"
              className="h-7 w-7"
              onError={() => setLogoMissing(true)}
            />
          ) : (
            <svg
              className="h-7 w-7"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <circle cx="24" cy="24" r="22" fill="url(#g1)" opacity="0.15" />
              <path d="M14 24a10 10 0 0 1 20 0c0 5.523-4.477 6-10 6s-10-.477-10-6z" fill="#fff" />
              <path d="M21 18v12m6-12v12" stroke="#111827" strokeWidth="2" strokeLinecap="round" />
            </svg>
          )}
          <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100">Fixit</h1>
        </Link>
        <div className="relative" ref={menuRef}>
          {isAuthenticated ? <button className="flex items-center space-x-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 p-1 transition-colors duration-200" onClick={() => setMenuOpen(!menuOpen)}>
              <img src={user?.avatar} alt={user?.name || 'User'} className="w-8 h-8 rounded-full border border-gray-200" />
            </button> : <Link to="/login" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium">
              <UserIcon className="h-5 w-5" />
              <span>Sign in</span>
            </Link>}
          {menuOpen && isAuthenticated && <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 animate-fadeIn">
              <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                <p className="font-medium text-gray-800 dark:text-gray-100">{user?.name}</p>
                <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              </div>
              <Link to="/profile" className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center" onClick={() => setMenuOpen(false)}>
                <UserIcon className="h-4 w-4 mr-2" />
                Profile
              </Link>
              <Link to="/settings" className="block px-4 py-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center" onClick={() => setMenuOpen(false)}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
              <button className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center" onClick={handleLogout}>
                <LogOutIcon className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>}
        </div>
      </div>
    </header>;
};