import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  sendOtp as sendOtpApi,
  verifyOtp as verifyOtpApi,
  register as registerApi,
} from '../utils/api';

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

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e && e.preventDefault();
    setError('');
    setMessage('');
    setPreviewUrl(null);
    try {
      const res = await sendOtpApi(email);
      setMessage(res.data.message || 'OTP sent');
      // If the backend returned a previewUrl (dev Ethereal), store it so user can open email in browser
      if (res.data.previewUrl) setPreviewUrl(res.data.previewUrl);
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    }
  };

  const handleVerifyOtp = async (e) => {
    e && e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await verifyOtpApi({ email, code });
      setMessage(res.data.message || 'OTP verified');
      setStep('password');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    }
  };

  const setPasswordAndRegister = async (e) => {
    e && e.preventDefault();
    setError('');
    setMessage('');

    if (name.trim().length < 2) {
      setError('Name must be at least 2 characters');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const res = await registerApi({ email, password, name });
      setMessage(res.data.message || 'Registered successfully');
      setStep('done');
      setTimeout(() => navigate('/'), 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-4">Register</h2>

        {step === 'email' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full mb-2 p-2 border border-gray-300 rounded"
            />
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Send OTP</button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-sm mb-2 text-gray-600">OTP sent to <strong>{email}</strong></div>
            <input
              type="text"
              placeholder="Enter OTP"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              className="w-full mb-2 p-2 border border-gray-300 rounded"
            />
            <button className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Verify OTP</button>
            <button type="button" onClick={handleSendOtp} className="mt-2 w-full bg-gray-200 text-black px-4 py-2 rounded">Resend OTP</button>
            {previewUrl && (
              <div className="mt-2 text-center">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 underline">Open email (dev preview)</a>
              </div>
            )}
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={setPasswordAndRegister} className="space-y-4">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mb-2 p-2 border border-gray-300 rounded"
            />
            <input
              type="password"
              placeholder="Password (min 8 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full mb-2 p-2 border border-gray-300 rounded"
            />
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full mb-2 p-2 border border-gray-300 rounded"
            />
            <button className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Register</button>
          </form>
        )}

        {step === 'done' && (
          <div className="text-center text-green-600 font-semibold">{message || 'Registered successfully. Redirecting to login...'}</div>
        )}

        {message && step !== 'done' && <div className="mt-4 text-green-600 text-center">{message}</div>}
        {error && <div className="mt-4 text-red-600 text-center">{error}</div>}

        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-4 w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
};

export default RegisterPage;
