import React, { useState } from 'react';
import { verifyOtp } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

export default function OTPVerification() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      await verifyOtp({ email, code });
      toast.success('OTP verified. Set your password on Register page.');
      navigate('/register');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
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
