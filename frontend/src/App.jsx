import { Routes, Route, Navigate } from 'react-router-dom';
import { useContext } from 'react';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import OTPVerification from './pages/OTPVerification';
import FoodTracker from './pages/FoodTracker';
import DietPlan from './pages/DietPlan';
import WorkoutTracker from './pages/WorkoutTracker';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ProteinToday from './pages/ProteinToday';
import CarbsToday from './pages/CarbsToday';
import FatsToday from './pages/FatsToday';

import ProtectedRoute from './components/ProtectedRoute';
import { AuthContext } from './context/AuthContext';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/"
        element={user ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />

      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<OTPVerification />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/food"
        element={
          <ProtectedRoute>
            <FoodTracker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/diet"
        element={
          <ProtectedRoute>
            <DietPlan />
          </ProtectedRoute>
        }
      />

      <Route
        path="/workout"
        element={
          <ProtectedRoute>
            <WorkoutTracker />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/protein-today"
        element={
          <ProtectedRoute>
            <ProteinToday />
          </ProtectedRoute>
        }
      />

      <Route
        path="/protein-today"
        element={
          <ProtectedRoute>
            <ProteinToday />
          </ProtectedRoute>
        }
      />

      <Route
        path="/carbs-today"
        element={
          <ProtectedRoute>
            <CarbsToday />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/carbs-today"
        element={
          <ProtectedRoute>
            <CarbsToday />
          </ProtectedRoute>
        }
      />

      <Route
        path="/fats-today"
        element={
          <ProtectedRoute>
            <FatsToday />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard/fats-today"
        element={
          <ProtectedRoute>
            <FatsToday />
          </ProtectedRoute>
        }
      />
      <Route path="/reset-password/:token" element={<ResetPassword />} />


      {/* Fallback */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
