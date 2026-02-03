import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getDashboard } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ daily: { calories: 0, protein: 0 }, burned: 0, weekly: [], diet: null });

  useEffect(() => {
    (async () => {
      try {
        const res = await getDashboard();
        setData(res.data || res);
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Welcome, {user?.name || 'User'}</h1>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">Calories today<div className="text-2xl font-semibold">{data.daily.calories}</div></div>
        <div className="bg-white p-4 rounded shadow">Protein today<div className="text-2xl font-semibold">{data.daily.protein}</div></div>
        <div className="bg-white p-4 rounded shadow">Calories burned<div className="text-2xl font-semibold">{data.burned}</div></div>
        <div className="bg-white p-4 rounded shadow">Diet target<div className="text-2xl font-semibold">{data.diet?.calorieTarget || '-'}</div></div>
      </div>

      <div className="bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Weekly calories</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.weekly}>
            <XAxis dataKey="_id" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="calories" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;
