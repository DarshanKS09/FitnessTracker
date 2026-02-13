import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      await resetPassword(token, password);

      notify('Password reset successful', 'success');
      navigate('/');
    } catch (err) {
      notify(
        err.response?.data?.message || 'Invalid or expired token',
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
              Secure Update
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
              Set New Password.
              <br />
              Stay Protected.
            </h1>
            <p className="mt-4 text-emerald-100 max-w-md">
              Choose a strong password to secure your account and continue your fitness journey.
            </p>
          </section>

          <section className="rounded-3xl reveal fx-card bg-white/90 backdrop-blur p-8 md:p-10 shadow-xl border border-emerald-100" style={{ '--d': '90ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-emerald-900">Set New Password</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                Verified Link
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              Enter your new password below to complete reset.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-emerald-900">New Password</label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
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
                {loading ? 'Updating...' : 'Reset Password'}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
