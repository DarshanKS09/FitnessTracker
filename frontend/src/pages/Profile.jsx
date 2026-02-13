import React, { useEffect, useState } from 'react';
import { getProfile, updateProfile } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

export default function Profile() {
  const { notify } = useNotification();

  const [form, setForm] = useState({
    name: '',
    age: '',
    gender: 'Other',
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
      const res = await getProfile();
      const user = res.data;

      setForm({
        name: user.name || '',
        age: user.age || '',
        gender: user.gender || 'Other',
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
      const h = Number(form.height) / 100;
      const bmiValue = (Number(form.weight) / (h * h)).toFixed(1);
      setBmi(bmiValue);
    } else {
      setBmi(null);
    }
  }, [form.height, form.weight]);

  const submit = async (e) => {
    e.preventDefault();

    try {
      await updateProfile({
        ...form,
        age: form.age ? Number(form.age) : undefined,
        height: form.height ? Number(form.height) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
      });
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
              placeholder="Age"
              value={form.age}
              onChange={(e) => setForm({ ...form, age: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            />

            <select
              value={form.gender}
              onChange={(e) => setForm({ ...form, gender: e.target.value })}
              className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            >
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>

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
