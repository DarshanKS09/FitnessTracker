import React, { useEffect, useState } from 'react';
import { generateDiet, getDiet } from '../utils/api';
import { toast } from 'react-toastify';

export default function DietPlan() {
  const [form, setForm] = useState({ age: '', gender: 'male', height: '', weight: '', activityLevel: 'moderate', goal: 'maintenance', preference: 'non-veg' });
  const [plan, setPlan] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await generateDiet(form);
      setPlan(res.data || res);
      toast.success('Diet plan generated');
    } catch (err) { toast.error('Failed to generate'); }
  };

  useEffect(() => { (async () => { try { const r = await getDiet(); setPlan(r.data || r); } catch (e){} })(); }, []);

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl mb-4">Diet Plan Generator</h2>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <input placeholder="Age" value={form.age} onChange={e=>setForm({...form, age:e.target.value})} className="p-2 border rounded" />
        <select value={form.gender} onChange={e=>setForm({...form, gender:e.target.value})} className="p-2 border rounded"><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
        <input placeholder="Height (cm)" value={form.height} onChange={e=>setForm({...form, height:e.target.value})} className="p-2 border rounded" />
        <input placeholder="Weight (kg)" value={form.weight} onChange={e=>setForm({...form, weight:e.target.value})} className="p-2 border rounded" />
        <select value={form.activityLevel} onChange={e=>setForm({...form, activityLevel:e.target.value})} className="p-2 border rounded"><option value="sedentary">Sedentary</option><option value="moderate">Moderate</option><option value="active">Active</option></select>
        <select value={form.goal} onChange={e=>setForm({...form, goal:e.target.value})} className="p-2 border rounded"><option value="fat loss">Fat Loss</option><option value="maintenance">Maintenance</option><option value="muscle gain">Muscle Gain</option></select>
        <select value={form.preference} onChange={e=>setForm({...form, preference:e.target.value})} className="p-2 border rounded"><option value="veg">Veg</option><option value="non-veg">Non-Veg</option></select>
        <button className="bg-blue-600 text-white p-2 rounded">Generate</button>
      </form>

      {plan && (
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold">Targets</h3>
          <p>Calories: {plan.calorieTarget}</p>
          <p>Protein target: {plan.proteinTarget} g</p>
          <div className="mt-2">
            <h4 className="font-semibold">Sample meals</h4>
            <pre className="text-sm bg-gray-100 p-2 rounded">{JSON.stringify(plan.meals, null, 2)}</pre>
          </div>
        </div>
      )}

    </div>
  );
}
