import React, { useState } from 'react';
import { forgotPassword } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useNotification();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      await forgotPassword(email);

      notify('If an account exists, reset email sent', 'success');
      setEmail('');
    } catch (err) {
      notify(
        err.response?.data?.message || 'Something went wrong',
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
              Account Recovery
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
              Reset Password.
              <br />
              Reclaim Progress.
            </h1>
            <p className="mt-4 text-emerald-100 max-w-md">
              Enter your account email and we will send a reset link instantly.
            </p>
          </section>

          <section className="rounded-3xl reveal fx-card bg-white/90 backdrop-blur p-8 md:p-10 shadow-xl border border-emerald-100" style={{ '--d': '90ms' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-emerald-900">Reset Password</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                Secure Link
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              We will send you a one-time password reset link.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white font-semibold transition ${
                  loading
                    ? 'bg-emerald-300 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-sm text-center mt-6 text-gray-600">
              Remember your password?{' '}
              <Link to="/" className="text-emerald-700 font-semibold hover:underline">
                Back to Login
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
