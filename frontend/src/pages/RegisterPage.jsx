import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  sendOtp as sendOtpApi,
  verifyOtp as verifyOtpApi,
  register as registerApi,
} from '../utils/api';

function getPasswordChecks(password) {
  return {
    minLength: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
}

function getPasswordStrength(password) {
  if (!password) return 0;
  const checks = getPasswordChecks(password);
  const passed = Object.values(checks).filter(Boolean).length;
  return Math.round((passed / 5) * 100);
}

const RegisterPage = () => {
  const [step, setStep] = useState('email'); // 'email' | 'verify' | 'password' | 'done'
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e && e.preventDefault();
    if (loading) return;
    setError('');
    setMessage('');
    setPreviewUrl(null);
    try {
      setLoading(true);
      const res = await sendOtpApi(email);
      setMessage(res.data.message || 'OTP sent');
      // If the backend returned a previewUrl (dev Ethereal), store it so user can open email in browser
      if (res.data.previewUrl) setPreviewUrl(res.data.previewUrl);
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e && e.preventDefault();
    if (loading) return;
    setError('');
    setMessage('');
    try {
      setLoading(true);
      const res = await verifyOtpApi({ email, code });
      setMessage(res.data.message || 'OTP verified');
      setStep('password');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const setPasswordAndRegister = async (e) => {
    e && e.preventDefault();
    if (loading) return;
    setError('');
    setMessage('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    const checks = getPasswordChecks(password);
    const isStrongPassword = Object.values(checks).every(Boolean);
    if (!isStrongPassword) {
      setError('Password must include uppercase, lowercase, number, special character, and be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      const res = await registerApi({ email, password, name });
      const onboardingKey = `ft_onboard_${email.trim().toLowerCase()}`;
      localStorage.setItem(onboardingKey, '1');
      setMessage(res.data.message || 'Registered successfully');
      setStep('done');
      setTimeout(() => navigate('/'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const passwordChecks = getPasswordChecks(password);
  const passwordStrength = getPasswordStrength(password);
  const passwordStrengthLabel =
    passwordStrength >= 100
      ? 'Strong'
      : passwordStrength >= 80
        ? 'Good'
        : passwordStrength >= 60
          ? 'Fair'
          : passwordStrength > 0
            ? 'Weak'
            : 'Start typing';
  const strengthBarClass =
    passwordStrength >= 100
      ? 'bg-emerald-600'
      : passwordStrength >= 80
        ? 'bg-lime-500'
        : passwordStrength >= 60
          ? 'bg-amber-500'
          : 'bg-red-500';

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-green-100 px-4 py-8 md:py-12">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-6 items-stretch">
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 p-8 md:p-10 text-white shadow-2xl">
            <div className="absolute -top-24 -right-24 h-56 w-56 rounded-full bg-white/10" />
            <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-white/10" />

            <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">
              FitnessTracker
            </p>
            <h1 className="mt-4 text-3xl md:text-4xl font-bold leading-tight">
              Build Habits.
              <br />
              Fuel Right.
              <br />
              Get Stronger.
            </h1>
            <p className="mt-4 text-emerald-100 max-w-md">
              Create your account and start tracking meals, workouts, and daily progress in one place.
            </p>

            <div className="mt-8 space-y-4">
              <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 border border-white/20">
                <div className="flex justify-between text-sm">
                  <span>Account Setup</span>
                  <span>{step === 'email' ? '25%' : step === 'verify' ? '50%' : step === 'password' ? '80%' : '100%'}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-white/20">
                  <div
                    className={`h-2 rounded-full bg-lime-300 ${
                      step === 'email'
                        ? 'w-1/4'
                        : step === 'verify'
                          ? 'w-1/2'
                          : step === 'password'
                            ? 'w-4/5'
                            : 'w-full'
                    }`}
                  />
                </div>
              </div>
              <div className="rounded-xl bg-white/10 backdrop-blur px-4 py-3 border border-white/20">
                <p className="text-sm">Secure OTP verification enabled for registration.</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl bg-white/90 backdrop-blur p-8 md:p-10 shadow-xl border border-emerald-100">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-emerald-900">Create Account</h2>
              <span className="text-xs px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 font-medium">
                Get Started
              </span>
            </div>

            <p className="mt-2 text-sm text-gray-600">
              {step === 'email' && 'Enter your email to receive OTP.'}
              {step === 'verify' && 'Verify the OTP sent to your email.'}
              {step === 'password' && 'Set your profile name and password.'}
              {step === 'done' && 'Registration completed successfully.'}
            </p>

            {step === 'email' && (
              <form onSubmit={handleSendOtp} className="mt-8 space-y-4">
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
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              </form>
            )}

            {step === 'verify' && (
              <form onSubmit={handleVerifyOtp} className="mt-8 space-y-4">
                <div className="text-sm text-gray-600">
                  OTP sent to <strong>{email}</strong>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-900">OTP</label>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
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
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                >
                  Resend OTP
                </button>
                {previewUrl && (
                  <div className="text-center">
                    <a
                      href={previewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-700 hover:underline"
                    >
                      Open email (dev preview)
                    </a>
                  </div>
                )}
              </form>
            )}

            {step === 'password' && (
              <form onSubmit={setPasswordAndRegister} className="mt-8 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-900">Full Name</label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-900">Password</label>
                  <input
                    type="password"
                    placeholder="Strong password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 border border-emerald-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-3">
                    <div className="flex items-center justify-between text-xs text-emerald-800">
                      <span>Password Strength</span>
                      <span className="font-semibold">{passwordStrengthLabel}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-white/80 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${strengthBarClass}`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                      <p className={passwordChecks.minLength ? 'text-emerald-700' : 'text-gray-500'}>At least 8 characters</p>
                      <p className={passwordChecks.uppercase ? 'text-emerald-700' : 'text-gray-500'}>One uppercase letter</p>
                      <p className={passwordChecks.lowercase ? 'text-emerald-700' : 'text-gray-500'}>One lowercase letter</p>
                      <p className={passwordChecks.number ? 'text-emerald-700' : 'text-gray-500'}>One number</p>
                      <p className={passwordChecks.special ? 'text-emerald-700' : 'text-gray-500'}>One special character</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-emerald-900">Confirm Password</label>
                  <input
                    type="password"
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                  {loading ? 'Creating Account...' : 'Register'}
                </button>
              </form>
            )}

            {step === 'done' && (
              <div className="mt-8 text-center text-emerald-700 font-semibold">
                {message || 'Registered successfully. Redirecting to login...'}
              </div>
            )}

            {message && step !== 'done' && (
              <div className="mt-4 text-emerald-700 text-sm">{message}</div>
            )}
            {error && (
              <div className="mt-4 text-red-600 text-sm">{error}</div>
            )}

            <p className="text-sm text-center mt-6 text-gray-600">
              Already have an account?{' '}
              <Link to="/" className="text-emerald-700 font-semibold hover:underline">
                Go to Login
              </Link>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
