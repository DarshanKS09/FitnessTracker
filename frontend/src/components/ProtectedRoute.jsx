import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, accessToken, isAuthReady } = useContext(AuthContext);

  if (!isAuthReady) return null;

  if (!accessToken || !user) {
    return <Navigate to="/" replace />;
  }

  return children;
}
