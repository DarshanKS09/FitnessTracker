import React, { useState } from 'react';
import { verifyOtp } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';

export default function OTPVerification() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const { notify } = useNotification();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp({ email, code });
      notify('OTP verified. Set your password on Register page.', 'success');
      navigate('/register');
    } catch (err) {
      notify(err.response?.data?.message || 'Verification failed', 'error');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h2 className="text-2xl font-semibold mb-4">Verify OTP</h2>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="p-3 border rounded" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6-digit code" className="p-3 border rounded" />
        <button type="submit" className="bg-blue-600 text-white p-3 rounded">Verify</button>
      </form>
    </div>
  );
}
