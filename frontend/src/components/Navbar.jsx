import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  return (
    <nav className="bg-white shadow p-4">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <h1 className="font-bold text-lg"><Link to="/dashboard">Fitness Tracker</Link></h1>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link to="/food" className="text-sm">Food</Link>
              <Link to="/diet" className="text-sm">Diet</Link>
              <Link to="/workout" className="text-sm">Workout</Link>
              <Link to="/profile" className="text-sm">Profile</Link>
              <button onClick={() => { logout(); navigate('/'); }} className="text-sm text-red-600">Logout</button>
            </>
          ) : (
            <>
              <Link to="/" className="text-sm">Login</Link>
              <Link to="/register" className="text-sm">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
