import React, { useEffect, useState } from 'react';
import { addFood, getMyFood, dailyTotals, weeklyFood } from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mealTypes = [
  'Breakfast',
  'Morning Snack',
  'Lunch',
  'Evening Snack',
  'Dinner',
];

const units = ['grams', 'bowl', 'piece', 'cup'];

export default function FoodTracker() {
  const [selectedMeal, setSelectedMeal] = useState(null);

  const [food, setFood] = useState({
    foodName: '',
    quantity: '',
    unit: 'grams',
  });

  const [logs, setLogs] = useState([]);
  const [daily, setDaily] = useState({ calories: 0, protein: 0 });
  const [weekly, setWeekly] = useState([]);

  const { notify } = useNotification();

  useEffect(() => {
    fetchLogs();
    fetchDaily();
    fetchWeekly();
  }, []);

  async function fetchLogs() {
    try {
      const res = await getMyFood();
      setLogs(res.data || res);
    } catch {
      notify('Failed to fetch food logs', 'error');
    }
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedMeal) return notify('Select meal type', 'error');

    try {
      await addFood({
        foodName: food.foodName,
        grams: food.quantity,
        mealType: selectedMeal,
      });

      notify('Food logged', 'success');
      setFood({ foodName: '', quantity: '', unit: 'grams' });
      fetchLogs();
      fetchDaily();
      fetchWeekly();
    } catch {
      notify('Failed to add food', 'error');
    }
  };

  const fetchDaily = async () => {
    try {
      const res = await dailyTotals();
      setDaily(res.data || res);
    } catch {}
  };

  const fetchWeekly = async () => {
    try {
      const res = await weeklyFood();
      setWeekly(res.data || res);
    } catch {}
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <h2 className="text-3xl font-bold text-emerald-800">Food Tracker</h2>

        {/* Meal Selector */}
        <div className="flex flex-wrap gap-3">
          {mealTypes.map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition
                ${
                  selectedMeal === meal
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                }`}
            >
              {meal}
            </button>
          ))}
        </div>

        {/* Expandable Form */}
        {selectedMeal && (
          <form
            onSubmit={submit}
            className="bg-white rounded-2xl shadow-lg p-6 grid md:grid-cols-4 gap-4"
          >
            <input
              value={food.foodName}
              onChange={(e) =>
                setFood({ ...food, foodName: e.target.value })
              }
              placeholder="Food name"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />

            <input
              value={food.quantity}
              onChange={(e) =>
                setFood({ ...food, quantity: e.target.value })
              }
              placeholder="Quantity"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />

            <select
              value={food.unit}
              onChange={(e) =>
                setFood({ ...food, unit: e.target.value })
              }
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>

            <button
              type="submit"
              className="bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition"
            >
              Add
            </button>
          </form>
        )}

        {/* Daily Stats */}
        <div className="grid md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-emerald-700 text-sm">Calories Today</p>
            <p className="text-xl font-bold">{daily.calories}</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-emerald-700 text-sm">Protein Today</p>
            <p className="text-xl font-bold">{daily.protein}</p>
          </div>

          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-emerald-700 text-sm">Entries</p>
            <p className="text-xl font-bold">{logs.length}</p>
          </div>
        </div>

        {/* Today's Logged Foods */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">
            Today's Meals — {dayName}, {formattedDate}
          </h3>

          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No food logged today.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((item) => (
                <div
                  key={item._id}
                  className="border border-emerald-100 rounded-xl p-4 bg-emerald-50 flex justify-between items-center"
                >
                  <div>
                    <p className="font-semibold text-emerald-800">
                      {item.foodName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {item.grams} g • {item.mealType}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-sm font-medium text-emerald-700">
                      {item.calories} kcal
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.protein}g protein
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 text-emerald-800">
            Weekly Calories Trend
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={weekly}>
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
}
