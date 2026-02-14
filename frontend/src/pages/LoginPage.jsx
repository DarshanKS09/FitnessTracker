import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { login as loginApi, getProfile, setAuthToken } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const LoginPage = () => {
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    try {
      setLoading(true);

      const normalizedEmail = email.trim().toLowerCase();
      const res = await loginApi({ email: normalizedEmail, password });
      const token = res.data?.accessToken;
      const refreshToken = res.data?.refreshToken;

      if (!token) {
        throw new Error('No access token received');
      }

      setAuthToken(token);
      const me = await getProfile();
      login(token, me.data, refreshToken);

      const onboardingKey = `ft_onboard_${normalizedEmail}`;
      const shouldOpenProfileFirst = localStorage.getItem(onboardingKey) === '1';
      if (shouldOpenProfileFirst) {
        localStorage.removeItem(onboardingKey);
        navigate('/profile');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      notify(
        err.response?.data?.message || err.message || 'Login failed',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen page-enter bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          <section className="relative reveal fx-card overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 md:p-10 text-white shadow-2xl" style={{ '--d': '40ms' }}>
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-white/10" />

            <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">
              FitnessTracker
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
              Train Hard.
              <br />
              Recover Better.
              <br />
              Track Everything.
            </h1>
            <p className="mt-4 text-emerald-100 max-w-md">
              Your daily calories, protein targets, workouts, and progress in one clean health dashboard.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 border border-white/20">
                <div className="flex justify-between text-sm">
                  <span>Weekly Consistency</span>
                  <span>84%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/20">
                  <div className="h-2 w-[84%] rounded-full bg-lime-300" />
                </div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 border border-white/20">
                <div className="flex justify-between text-sm">
                  <span>Nutrition Adherence</span>
                  <span>91%</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/20">
                  <div className="h-2 w-[91%] rounded-full bg-cyan-300" />
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl reveal fx-card bg-white/90 backdrop-blur p-8 md:p-10 shadow-xl border border-emerald-100" style={{ '--d': '90ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-emerald-900">Welcome Back</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                Health First
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              Log in to continue your fitness journey today.
            </p>

            <form onSubmit={handleLogin} className="mt-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-900">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-900">Password</label>
                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div className="text-right">
                <Link
                  to="/forgot-password"
                  className="text-sm text-emerald-700 hover:text-emerald-900 hover:underline"
                >
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-semibold transition ${
                  loading
                    ? 'bg-emerald-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? 'Logging in...' : 'Login'}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-gray-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-emerald-700 font-semibold hover:underline">
                Register here
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
