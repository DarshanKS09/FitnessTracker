import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { getDashboard } from '../utils/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({
    daily: { calories: 0, protein: 0 },
    burned: 0,
    weekly: [],
    diet: null
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await getDashboard();
        setData(res.data || res);
      } catch {}
    })();
  }, []);

  const calorieTarget = data.diet?.calorieTarget || 2000;
  const proteinTarget = data.diet?.proteinTarget || 150;

  const caloriePercent = Math.min((data.daily.calories / calorieTarget) * 100, 100);
  const proteinPercent = Math.min((data.daily.protein / proteinTarget) * 100, 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* Hero */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">
              Welcome back, {user?.name}
            </h1>
            <p className="text-emerald-600">
              Stay consistent. Small steps every day.
            </p>
          </div>
          <div className="bg-white/60 backdrop-blur rounded-xl px-4 py-2 shadow">
            <p className="text-sm text-gray-500">Daily Target</p>
            <p className="text-lg font-semibold text-emerald-700">
              {calorieTarget} kcal
            </p>
          </div>
        </div>

        {/* Progress Section */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* Calories Ring */}
          <div className="bg-white rounded-3xl shadow-lg p-6 flex flex-col items-center border border-emerald-100">
            <div className="relative w-44 h-44">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="75"
                  stroke="#d1fae5"
                  strokeWidth="14"
                  fill="none"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="75"
                  stroke="#10b981"
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray={471}
                  strokeDashoffset={471 - (471 * caloriePercent) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-emerald-700">
                  {data.daily.calories}
                </span>
                <span className="text-sm text-gray-500">
                  / {calorieTarget}
                </span>
              </div>
            </div>
            <p className="mt-4 text-emerald-700 font-medium">
              Daily Calories
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-5">

            <div className="bg-gradient-to-br from-emerald-100 to-emerald-50 p-5 rounded-2xl shadow">
              <p className="text-emerald-700 text-sm">Protein</p>
              <p className="text-xl font-bold text-emerald-900">
                {data.daily.protein}g
              </p>
              <div className="w-full bg-white h-2 rounded mt-3">
                <div
                  className="bg-emerald-500 h-2 rounded"
                  style={{ width: `${proteinPercent}%` }}
                />
              </div>
            </div>

            <div className="bg-gradient-to-br from-teal-100 to-teal-50 p-5 rounded-2xl shadow">
              <p className="text-teal-700 text-sm">Calories Burned</p>
              <p className="text-xl font-bold text-teal-900">
                {data.burned}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-100 to-green-50 p-5 rounded-2xl shadow">
              <p className="text-green-700 text-sm">Net Calories</p>
              <p className="text-xl font-bold text-green-900">
                {data.daily.calories - data.burned}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-200 to-emerald-100 p-5 rounded-2xl shadow">
              <p className="text-emerald-700 text-sm">Protein Target</p>
              <p className="text-xl font-bold text-emerald-900">
                {proteinTarget}g
              </p>
            </div>

          </div>
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-3xl shadow-lg p-6 border border-emerald-100">
          <h3 className="font-semibold mb-4 text-lg text-emerald-800">
            Weekly Calories Trend
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.weekly}>
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="calories"
                stroke="#10b981"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
