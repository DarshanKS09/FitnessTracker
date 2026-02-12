import React, { useEffect, useState } from 'react';
import { updateProfile, setAuthToken } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Profile() {
  const { notify } = useNotification();

  const [form, setForm] = useState({
    name: '',
    height: '',
    weight: '',
    goal: 'Maintenance',
    activityLevel: 'Moderate',
  });

  const [bmi, setBmi] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) setAuthToken(token);

      const res = await axios.get(`${API_URL}/users/me`);
      const user = res.data;

      setForm({
        name: user.name || '',
        height: user.height || '',
        weight: user.weight || '',
        goal: user.goal || 'Maintenance',
        activityLevel: user.activityLevel || 'Moderate',
      });
    } catch {
      notify('Failed to load profile', 'error');
    }
  }

  useEffect(() => {
    if (form.height && form.weight) {
      const h = form.height / 100;
      const bmiValue = (form.weight / (h * h)).toFixed(1);
      setBmi(bmiValue);
    }
  }, [form.height, form.weight]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      await updateProfile(form);
      notify('Profile updated', 'success');
    } catch {
      notify('Failed to update profile', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        <h2 className="text-3xl font-bold text-emerald-800">
          Fitness Profile
        </h2>

        <form
          onSubmit={submit}
          className="bg-white rounded-3xl shadow-lg p-8 space-y-6"
        >

          <input
            type="text"
            value={form.name}
            placeholder="Full Name"
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
          />

          <div className="grid md:grid-cols-2 gap-6">
            <input
              type="number"
              placeholder="Height (cm)"
              value={form.height}
              onChange={(e) => setForm({ ...form, height: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            />

            <input
              type="number"
              placeholder="Weight (kg)"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            />
          </div>

          <select
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
          >
            <option>Maintenance</option>
            <option>Cutting</option>
            <option>Bulking</option>
          </select>

          <select
            value={form.activityLevel}
            onChange={(e) =>
              setForm({ ...form, activityLevel: e.target.value })
            }
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
          >
            <option>Sedentary</option>
            <option>Light</option>
            <option>Moderate</option>
            <option>Active</option>
          </select>

          {bmi && (
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
              <p className="text-emerald-800 font-semibold">
                BMI: {bmi}
              </p>
              <p className="text-sm text-gray-600">
                {bmi < 18.5
                  ? 'Underweight'
                  : bmi < 25
                  ? 'Normal'
                  : bmi < 30
                  ? 'Overweight'
                  : 'Obese'}
              </p>
            </div>
          )}

          <button
            type="submit"
            className="bg-emerald-600 text-white rounded-lg py-3 w-full font-semibold hover:bg-emerald-700 transition"
          >
            Save Profile
          </button>

        </form>
      </div>
    </div>
  );
}
