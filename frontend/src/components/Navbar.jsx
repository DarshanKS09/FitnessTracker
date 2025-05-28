import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="bg-blue-600 p-4 flex justify-between items-center text-white">
      <div className="text-xl font-bold">Health Tracker</div>
      <div>
        {user ? (
          <>
            <span className="mr-4">Hello, {user.name}</span>
            <button
              onClick={logout}
              className="bg-red-500 hover:bg-red-700 px-3 py-1 rounded"
            >
              Logout
            </button>
          </>
        ) : (
          <></>
        )}
      </div>
    </nav>
  );
}
