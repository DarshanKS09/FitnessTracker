import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import OTPVerification from './pages/OTPVerification';
import FoodTracker from './pages/FoodTracker';
import DietPlan from './pages/DietPlan';
import WorkoutTracker from './pages/WorkoutTracker';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import  ProtectedRoute from './components/ProtectedRoute'
function Protected({ children }) {
  const { user } = useContext(AuthContext);
  if (!user) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify" element={<OTPVerification />} />

     <Route
  path="/dashboard"
  element={
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  }
/>

      <Route path="/food" element={<Protected><FoodTracker /></Protected>} />
      <Route path="/diet" element={<Protected><DietPlan /></Protected>} />
      <Route path="/workout" element={<Protected><WorkoutTracker /></Protected>} />
      <Route path="/profile" element={<Protected><Profile /></Protected>} />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
