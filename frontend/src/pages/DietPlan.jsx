import React, { useEffect, useState } from 'react';
import { generateDiet, getDiet } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import ThemedSelect from '../components/ThemedSelect';

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

  useEffect(() => {
    const loadLastPlan = async () => {
      try {
        const res = await getDiet();
        if (res.data) setResult(res.data);
      } catch {}
    };
    loadLastPlan();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        age: Number(form.age),
        gender: form.gender,
        height: Number(form.height),
        weight: Number(form.weight),
        activityLevel: form.activityLevel,
        goal: form.goal,
        preference: form.preference,
      };
      const res = await generateDiet(payload);
      setResult(res.data || res);
      notify('Diet plan generated', 'success');
    } catch (err) {
      notify(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          'Failed to generate diet',
        'error'
      );
    }
  };

  return (
    <div className="min-h-screen page-enter bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-8">

        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800">
          Diet Plan Generator
        </h2>

        <form
          onSubmit={submit}
          className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 fx-card reveal"
          style={{ '--d': '40ms' }}
        >
          <input
            type="number"
            placeholder="Age"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="p-3 border rounded-lg focus:ring-2 focus:ring-emerald-400"
            required
          />

          <ThemedSelect
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
            options={['Male', 'Female']}
          />

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

          <ThemedSelect
            value={form.activityLevel}
            onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}
            options={['Sedentary', 'Light', 'Moderate', 'Active']}
          />

          <ThemedSelect
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
            options={['Maintenance', 'Cutting', 'Bulking']}
          />

          <ThemedSelect
            value={form.preference}
            onChange={(e) => setForm({ ...form, preference: e.target.value })}
            options={['Veg', 'Non-Veg']}
          />

          <button
            type="submit"
            className="bg-emerald-600 text-white rounded-lg py-3 font-semibold hover:bg-emerald-700 transition md:col-span-2"
          >
            Generate Diet
          </button>
        </form>

        {result && (
          <div className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 space-y-3 fx-card reveal" style={{ '--d': '90ms' }}>
            <h3 className="text-xl font-semibold text-emerald-800">
              Your Plan
            </h3>
            <p>BMR: {Math.round(result.bmr || 0)}</p>
            <p>TDEE: {Math.round(result.tdee || 0)}</p>
            <p>Calories Target: {Math.round(result.calorieTarget || 0)}</p>
            <p>Protein Target: {Math.round(result.proteinTarget || 0)}g</p>

            <div className="pt-4">
              <h4 className="text-lg font-semibold text-emerald-800 mb-3">Meals</h4>
              {!Array.isArray(result.meals) || result.meals.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Gemini did not return structured meals for this attempt. Try generating again.
                </p>
              ) : (
                <div className="space-y-3">
                  {result.meals.map((meal, idx) => (
                    <div key={idx} className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                      <p className="font-semibold text-emerald-900">
                        {meal.name || `Meal ${idx + 1}`}
                      </p>
                      <p className="text-sm text-gray-700">
                        {Array.isArray(meal.items) ? meal.items.join(', ') : String(meal.items || '')}
                      </p>
                      <p className="text-sm text-emerald-800 mt-1">
                        {Math.round(Number(meal.calories) || 0)} kcal  |  {Math.round(Number(meal.protein) || 0)}g protein
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


