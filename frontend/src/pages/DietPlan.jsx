import React, { useState } from 'react';
import { generateDiet } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

export default function Diet() {
  const { notify } = useNotification();

  const [form, setForm] = useState({
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    activityLevel: 'Moderate',
    goal: 'Maintenance',
    preference: 'Non-Veg',
  });

  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await generateDiet(form);
      setResult(res.data || res);
      notify('Diet plan generated', 'success');
    } catch {
      notify('Failed to generate diet', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        <h2 className="text-3xl font-bold text-emerald-800">
          Diet Plan Generator
        </h2>

        <form
          onSubmit={submit}
          className="bg-white rounded-3xl shadow-lg p-8 grid md:grid-cols-2 gap-6"
        >
          <input
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            required
          />

          <select
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
          >
            <option>Male</option>
            <option>Female</option>
          </select>

          <input
            type="number"
            placeholder="Height (cm)"
            value={form.height}
            onChange={(e) => setForm({ ...form, height: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            required
          />

          <input
            type="number"
            placeholder="Weight (kg)"
            value={form.weight}
            onChange={(e) => setForm({ ...form, weight: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            required
          />

          <select
            value={form.activityLevel}
            onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
          >
            <option>Sedentary</option>
            <option>Light</option>
            <option>Moderate</option>
            <option>Active</option>
          </select>

          <select
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
          >
            <option>Maintenance</option>
            <option>Cutting</option>
            <option>Bulking</option>
          </select>

          <select
            value={form.preference}
            onChange={(e) => setForm({ ...form, preference: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
          >
            <option>Veg</option>
            <option>Non-Veg</option>
          </select>

          <button
            type="submit"
            className="bg-emerald-600 text-white rounded-lg py-3 font-semibold hover:bg-emerald-700 transition col-span-2"
          >
            Generate Diet
          </button>
        </form>

        {result && (
          <div className="bg-white rounded-3xl shadow-lg p-8 space-y-3">
            <h3 className="text-xl font-semibold text-emerald-800">
              Your Plan
            </h3>
            <p>BMR: {result.bmr}</p>
            <p>TDEE: {result.tdee}</p>
            <p>Calories Target: {result.calorieTarget}</p>
            <p>Protein Target: {result.proteinTarget}g</p>
          </div>
        )}
      </div>
    </div>
  );
}
