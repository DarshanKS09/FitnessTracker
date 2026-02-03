import React, { useState } from 'react';
import { logWorkout } from '../utils/api';
import { toast } from 'react-toastify';

export default function WorkoutTracker() {
  const [form, setForm] = useState({ cardioType: 'walking', cardioMinutes: 30, strengthMinutes: 20, weightKg: 70 });

  const submit = async (e) => {
    e.preventDefault();
    try {
      await logWorkout(form);
      toast.success('Workout logged');
    } catch (err) { toast.error('Failed to log workout'); }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl mb-4">Workout Tracker</h2>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <select value={form.cardioType} onChange={e=>setForm({...form, cardioType:e.target.value})} className="p-2 border rounded">
          <option value="walking">Walking</option>
          <option value="running">Running</option>
          <option value="cycling">Cycling</option>
          <option value="swimming">Swimming</option>
        </select>
        <input value={form.cardioMinutes} onChange={e=>setForm({...form, cardioMinutes:e.target.value})} className="p-2 border rounded" />
        <input value={form.strengthMinutes} onChange={e=>setForm({...form, strengthMinutes:e.target.value})} className="p-2 border rounded" />
        <input value={form.weightKg} onChange={e=>setForm({...form, weightKg:e.target.value})} className="p-2 border rounded" />
        <button className="bg-green-600 text-white p-2 rounded">Log</button>
      </form>
    </div>
  );
}
