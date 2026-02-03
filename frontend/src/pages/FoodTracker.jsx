import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { addFood, getMyFood, dailyTotals, weeklyFood } from '../utils/api';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function FoodTracker() {
  const { accessToken } = useContext(AuthContext);
  const [food, setFood] = useState({ foodName: '', grams: '', bodyWeight: '' });
  const [logs, setLogs] = useState([]);
  const [daily, setDaily] = useState({ calories: 0, protein: 0 });
  const [weekly, setWeekly] = useState([]);

  async function fetchLogs() {
    try {
      const res = await getMyFood();
      setLogs(res.data || res);
    } catch (err) {
      toast.error('Failed to fetch food logs');
    }
  }

  useEffect(() => { fetchLogs(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      await addFood(food);
      toast.success('Food logged');
      setFood({ foodName: '', grams: '', bodyWeight: '' });
      fetchLogs();
    } catch (err) { toast.error('Failed to add food'); }
  };

  const fetchDaily = async () => {
    try {
      const res = await dailyTotals();
      setDaily(res.data || res);
    } catch (err) {}
  };

  const fetchWeekly = async () => {
    try {
      const res = await weeklyFood();
      setWeekly(res.data || res);
    } catch (err) {}
  };

  useEffect(() => { fetchDaily(); fetchWeekly(); }, []);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Food Tracker</h2>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-4">
        <input value={food.foodName} onChange={e => setFood({ ...food, foodName: e.target.value })} placeholder="Food name" className="p-2 border rounded" />
        <input value={food.grams} onChange={e => setFood({ ...food, grams: e.target.value })} placeholder="Grams" className="p-2 border rounded" />
        <input value={food.bodyWeight} onChange={e => setFood({ ...food, bodyWeight: e.target.value })} placeholder="Body weight (kg)" className="p-2 border rounded" />
        <button className="bg-green-600 text-white rounded p-2">Add</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-white shadow rounded">Calories today: <strong>{daily.calories}</strong></div>
        <div className="p-4 bg-white shadow rounded">Protein today: <strong>{daily.protein}</strong></div>
        <div className="p-4 bg-white shadow rounded">Entries: <strong>{logs.length}</strong></div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Weekly calories</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={weekly}>
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="calories" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
