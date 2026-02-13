import React, { useEffect, useState } from 'react';
import {
  addFood,
  getMyFood,
  dailyTotals,
  weeklyFood,
  updateFood,
  deleteFood,
} from '../utils/api';
import { useNotification } from '../context/NotificationContext';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const mealTypes = [
  'Breakfast',
  'Morning Snack',
  'Lunch',
  'Evening Snack',
  'Dinner',
];

const units = ['grams', 'bowl', 'cup'];

export default function FoodTracker() {
  const emitDashboardRefresh = () => {
    window.dispatchEvent(new Event('fitness-data-updated'));
  };
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [food, setFood] = useState({
    foodName: '',
    quantity: '',
    unit: 'grams',
  });
  const [logs, setLogs] = useState([]);
  const [daily, setDaily] = useState({ calories: 0, protein: 0 });
  const [weekly, setWeekly] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    foodName: '',
    quantity: '',
    unit: 'grams',
    mealType: 'Breakfast',
  });

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
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to fetch food logs', 'error');
    }
  }

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedMeal) return notify('Select meal type', 'error');

    try {
      await addFood({
        foodName: food.foodName,
        quantity: Number(food.quantity),
        unit: food.unit,
        mealType: selectedMeal,
      });

      notify('Food logged', 'success');
      emitDashboardRefresh();
      setFood({ foodName: '', quantity: '', unit: 'grams' });
      fetchLogs();
      fetchDaily();
      fetchWeekly();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to add food', 'error');
    }
  };

  const fetchDaily = async () => {
    try {
      const res = await dailyTotals();
      setDaily(res.data || res);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to fetch daily totals', 'error');
    }
  };

  const fetchWeekly = async () => {
    try {
      const res = await weeklyFood();
      setWeekly(res.data || res);
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to fetch weekly food', 'error');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      foodName: item.foodName || '',
      quantity: item.quantity || item.grams || '',
      unit: item.unit || 'grams',
      mealType: item.mealType || 'Breakfast',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      foodName: '',
      quantity: '',
      unit: 'grams',
      mealType: 'Breakfast',
    });
  };

  const saveEdit = async (id) => {
    try {
      await updateFood(id, {
        foodName: editForm.foodName,
        quantity: Number(editForm.quantity),
        unit: editForm.unit,
        mealType: editForm.mealType,
      });
      notify('Food updated', 'success');
      emitDashboardRefresh();
      cancelEdit();
      fetchLogs();
      fetchDaily();
      fetchWeekly();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update food', 'error');
    }
  };

  const removeFood = async (id) => {
    try {
      await deleteFood(id);
      notify('Food deleted', 'success');
      emitDashboardRefresh();
      if (editingId === id) cancelEdit();
      fetchLogs();
      fetchDaily();
      fetchWeekly();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete food', 'error');
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-3xl font-bold text-emerald-800">Food Tracker</h2>

        <div className="flex flex-wrap gap-3">
          {mealTypes.map((meal) => (
            <button
              key={meal}
              onClick={() => setSelectedMeal(meal)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedMeal === meal
                  ? 'bg-emerald-500 text-white'
                  : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              {meal}
            </button>
          ))}
        </div>

        {selectedMeal && (
          <form
            onSubmit={submit}
            className="bg-white rounded-2xl shadow-lg p-6 grid md:grid-cols-4 gap-4"
          >
            <input
              value={food.foodName}
              onChange={(e) => setFood({ ...food, foodName: e.target.value })}
              placeholder="Food name"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
            <input
              value={food.quantity}
              onChange={(e) => setFood({ ...food, quantity: e.target.value })}
              placeholder="Quantity"
              className="p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
            <select
              value={food.unit}
              onChange={(e) => setFood({ ...food, unit: e.target.value })}
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

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">
            Today's Meals - {dayName}, {formattedDate}
          </h3>

          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No food logged today.</p>
          ) : (
            <div className="space-y-4">
              {logs.map((item) => (
                <div
                  key={item._id}
                  className="border border-emerald-100 rounded-xl p-4 bg-emerald-50"
                >
                  {editingId === item._id ? (
                    <div className="grid md:grid-cols-6 gap-3 items-center">
                      <input
                        value={editForm.foodName}
                        onChange={(e) => setEditForm({ ...editForm, foodName: e.target.value })}
                        className="p-2 border rounded-lg"
                      />
                      <input
                        value={editForm.quantity}
                        onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })}
                        className="p-2 border rounded-lg"
                      />
                      <select
                        value={editForm.unit}
                        onChange={(e) => setEditForm({ ...editForm, unit: e.target.value })}
                        className="p-2 border rounded-lg"
                      >
                        {units.map((u) => (
                          <option key={u}>{u}</option>
                        ))}
                      </select>
                      <select
                        value={editForm.mealType}
                        onChange={(e) => setEditForm({ ...editForm, mealType: e.target.value })}
                        className="p-2 border rounded-lg"
                      >
                        {mealTypes.map((m) => (
                          <option key={m}>{m}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => saveEdit(item._id)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold text-emerald-800">{item.foodName}</p>
                        <p className="text-sm text-gray-600">
                          {item.grams} g - {item.mealType}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="text-sm font-medium text-emerald-700">{item.calories} kcal</p>
                          <p className="text-xs text-gray-500">{item.protein}g protein</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                        >
                          Edit Food
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFood(item._id)}
                          className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="font-semibold mb-4 text-emerald-800">Weekly Calories Trend</h3>
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
