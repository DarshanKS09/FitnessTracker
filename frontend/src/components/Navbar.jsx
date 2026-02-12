import React, { useContext } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const navLink = (path, label) => (
    <Link
      to={path}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition
        ${
          location.pathname === path
            ? 'bg-emerald-100 text-emerald-700'
            : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
        }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white shadow-sm border-b border-emerald-100">
      <div className="max-w-6xl mx-auto px-6 py-3 flex justify-between items-center">

        {/* Logo */}
        <Link
          to="/dashboard"
          className="text-xl font-bold text-emerald-700 tracking-tight"
        >
          FitnessTracker
        </Link>

        <div className="flex items-center gap-4">

          {user ? (
            <>
              {navLink('/dashboard', 'Dashboard')}
              {navLink('/food', 'Food')}
              {navLink('/diet', 'Diet')}
              {navLink('/workout', 'Workout')}
              {navLink('/profile', 'Profile')}

              {/* Streak badge */}
              <div className="hidden md:block bg-emerald-50 px-3 py-1 rounded-full text-xs text-emerald-700">
                🔥 {user?.streak || 0} Day Streak
              </div>

              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {navLink('/', 'Login')}
              {navLink('/register', 'Register')}
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
