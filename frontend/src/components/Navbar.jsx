import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const navLink = (path, label) => (
    <Link
      to={path}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
        location.pathname === path
          ? 'bg-emerald-100 text-emerald-700'
          : 'text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-white/95 backdrop-blur shadow-sm border-b border-emerald-200 reveal" style={{ '--d': '10ms' }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex justify-between items-center">
          <Link
            to="/dashboard"
            className="text-lg sm:text-xl font-bold text-emerald-700 tracking-tight inline-flex items-center gap-2"
          >
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 float-soft">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <path d="M2 9h2v6H2V9zm3-2h2v10H5V7zm3 4h8v2H8v-2zm9-4h2v10h-2V7zm3 2h2v6h-2V9z" />
              </svg>
            </span>
            FitnessTracker
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-700 hover:bg-emerald-100 transition font-medium fx-card"
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? 'Close' : 'Menu'}
          </button>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                {navLink('/dashboard', 'Dashboard')}
                {navLink('/food', 'Food')}
                {navLink('/diet', 'Diet')}
                {navLink('/workout', 'Workout')}
                {navLink('/profile', 'Profile')}

                <div className="hidden lg:block bg-emerald-50 px-3 py-1 rounded-full text-xs text-emerald-700 fx-card">
                  Streak: {user?.streak || 0} days
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

        <div className={`${menuOpen ? 'block' : 'hidden'} md:hidden mt-3 border-t border-emerald-100 pt-3`}>
          <div className="flex flex-col gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-2">
            {user ? (
              <>
                {navLink('/dashboard', 'Dashboard')}
                {navLink('/food', 'Food')}
                {navLink('/diet', 'Diet')}
                {navLink('/workout', 'Workout')}
                {navLink('/profile', 'Profile')}
                <div className="px-3 py-2 rounded-lg text-sm bg-emerald-50 text-emerald-700">
                  Streak: {user?.streak || 0} days
                </div>
                <button
                  onClick={() => {
                    logout();
                    navigate('/');
                    setMenuOpen(false);
                  }}
                  className="text-left px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition"
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
      </div>
    </nav>
  );
}
