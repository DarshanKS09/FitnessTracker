import React, { useEffect, useState } from 'react';
import {
  addFood,
  getMyFood,
  getFoodSuggestions,
  dailyTotals,
  updateFood,
  deleteFood,
} from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const mealTypes = [
  'Breakfast',
  'Morning Snack',
  'Lunch',
  'Evening Snack',
  'Dinner',
];

const units = ['grams', 'bowl', 'cup', 'piece', 'glass', 'katori'];

export default function FoodTracker() {
  const emitDashboardRefresh = () => {
    window.dispatchEvent(new Event('fitness-data-updated'));
  };
  const [selectedMeal, setSelectedMeal] = useState('Breakfast');
  const [viewMeal, setViewMeal] = useState('Breakfast');
  const [food, setFood] = useState({
    foodName: '',
    quantity: '',
    unit: 'grams',
  });
  const [logs, setLogs] = useState([]);
  const [daily, setDaily] = useState({ calories: 0, protein: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [expandedLogId, setExpandedLogId] = useState(null);
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
  }, []);

  useEffect(() => {
    const q = food.foodName.trim();
    if (q.length < 1) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await getFoodSuggestions(q);
        setSuggestions(res.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [food.foodName]);

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
    if (!selectedSuggestion) {
      return notify('Select a food from dataset suggestions', 'error');
    }

    try {
      await addFood({
        foodName: selectedSuggestion.name,
        quantity: Number(food.quantity),
        unit: food.unit,
        mealType: selectedMeal,
      });

      notify('Food logged', 'success', { duration: 1000 });
      emitDashboardRefresh();
      setFood({ foodName: '', quantity: '', unit: 'grams' });
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestion(null);
      fetchLogs();
      fetchDaily();
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

  const startEdit = (item) => {
    setExpandedLogId(item._id);
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
      if (expandedLogId === id) setExpandedLogId(null);
      fetchLogs();
      fetchDaily();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete food', 'error');
    }
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString();
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
  const selectedMealLogs = logs.filter((log) => log.mealType === viewMeal);
  const selectedMealTotals = selectedMealLogs.reduce(
    (acc, item) => {
      acc.calories += Number(item.calories || 0);
      acc.protein += Number(item.protein || 0);
      acc.carbs += Number(item.carbs || 0);
      acc.fats += Number(item.fats || 0);
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fats: 0 }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800">Food Tracker</h2>

        <div className="bg-white rounded-2xl shadow p-4 sm:p-5 border border-emerald-200">
          <p className="text-xs uppercase tracking-wide font-semibold text-emerald-700 mb-1">
            Log Section
          </p>
          <p className="text-sm font-medium text-emerald-900 mb-3">Select Meal Type for Logging</p>
          <div className="flex flex-wrap gap-3">
            {mealTypes.map((meal) => (
              <button
                key={meal}
                onClick={() => setSelectedMeal(meal)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedMeal === meal
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                }`}
              >
                {meal}
              </button>
            ))}
          </div>
        </div>

        <form
          onSubmit={submit}
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 grid grid-cols-1 md:grid-cols-4 gap-4 border border-emerald-200"
        >
            <div className="relative">
              <input
                value={food.foodName}
                onChange={(e) => {
                  setFood({ ...food, foodName: e.target.value });
                  setSelectedSuggestion(null);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                placeholder="Food name"
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                required
              />
              {showSuggestions && food.foodName.trim().length > 0 && (
                <div className="absolute z-20 mt-1 w-full bg-white border border-emerald-100 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                  {suggestions.length > 0 ? (
                    suggestions.map((s, idx) => (
                      <button
                        key={`${s.name}-${idx}`}
                        type="button"
                        className="w-full text-left px-3 py-2 hover:bg-emerald-50 text-sm"
                        onMouseDown={() => {
                          setFood({ ...food, foodName: s.name });
                          setSelectedSuggestion(s);
                          setShowSuggestions(false);
                        }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-emerald-900">{s.name}</span>
                          <span className="text-xs text-gray-500">{s.source || 'dataset'}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {Number(s.calories || 0)} kcal  |  {Number(s.protein || 0)}g protein  |  {Number(s.fats || 0)}g fats
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">No dataset suggestions</div>
                  )}
                </div>
              )}
              {!selectedSuggestion && food.foodName.trim().length > 0 && (
                <p className="mt-1 text-xs text-amber-600">Select a suggestion from the list</p>
              )}
            </div>
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
              className="p-3 border rounded-lg transition-all duration-150 hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.18)] focus:outline-none focus:ring-2 focus:ring-emerald-400"
            >
              {units.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!selectedSuggestion}
              className={`rounded-lg font-medium transition ${
                selectedSuggestion
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-gray-300 text-gray-600 cursor-not-allowed'
              }`}
            >
              Add
            </button>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-emerald-700 text-sm">Calories Today</p>
            <p className="text-xl font-bold">{daily.calories} kcal</p>
          </div>
          <div className="bg-white rounded-2xl shadow p-5">
            <p className="text-emerald-700 text-sm">Protein Today</p>
            <p className="text-xl font-bold">{daily.protein} g</p>
          </div>
          <div className="bg-gradient-to-br from-teal-100 to-cyan-50 rounded-2xl shadow p-5 border border-teal-200">
            <p className="text-xs uppercase tracking-wide font-semibold text-teal-700 mb-1">
              View Section
            </p>
            <p className="text-teal-800 text-sm mb-2 font-medium">Choose Meal to View Logs</p>
            <select
              value={viewMeal}
              onChange={(e) => setViewMeal(e.target.value)}
              className="w-full p-2.5 border border-teal-300 rounded-lg bg-white transition-all duration-150 hover:border-teal-400 hover:shadow-[0_0_0_3px_rgba(45,212,191,0.2)] focus:outline-none focus:ring-2 focus:ring-teal-400"
            >
              {mealTypes.map((meal) => (
                <option key={meal} value={meal}>
                  {meal}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-3 sm:p-6">
          <h3 className="text-lg font-semibold text-emerald-800 mb-4">
            {viewMeal} - {dayName}, {formattedDate}
          </h3>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-2.5 sm:p-4">
            <div className="text-[11px] sm:text-xs text-emerald-800 bg-white border border-emerald-200 rounded-lg px-2 py-1.5 sm:px-3 sm:py-2 w-full sm:w-auto mb-2 sm:mb-3">
              <span className="mr-3">{selectedMealTotals.calories} kcal</span>
              <span className="mr-3">{selectedMealTotals.protein}g protein</span>
              <span className="mr-3">{selectedMealTotals.carbs}g carbs</span>
              <span>{selectedMealTotals.fats}g fats</span>
            </div>

            {selectedMealLogs.length === 0 ? (
              <p className="text-gray-400 text-sm">No food logged for {viewMeal.toLowerCase()}.</p>
            ) : (
              <div className="space-y-1.5 sm:space-y-3">
                {selectedMealLogs.map((item) => (
                  <div
                    key={item._id}
                    className="border border-emerald-100 rounded-lg p-2 sm:p-4 bg-white"
                  >
                    {editingId === item._id ? (
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-center">
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
                          className="p-2 border rounded-lg transition-all duration-150 hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
                        >
                          {units.map((u) => (
                            <option key={u}>{u}</option>
                          ))}
                        </select>
                        <select
                          value={editForm.mealType}
                          onChange={(e) => setEditForm({ ...editForm, mealType: e.target.value })}
                          className="p-2 border rounded-lg transition-all duration-150 hover:border-emerald-400 hover:shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
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
                      <>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() =>
                            setExpandedLogId((prev) => (prev === item._id ? null : item._id))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              setExpandedLogId((prev) => (prev === item._id ? null : item._id));
                            }
                          }}
                          className="sm:hidden flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] leading-5 truncate">
                              <span className="font-semibold text-emerald-800">{item.foodName}</span>
                              <span className="text-gray-600"> | {item.grams}g | {item.calories} kcal</span>
                            </p>
                          </div>
                          <span className="text-[10px] text-emerald-700 border border-emerald-200 rounded px-1.5 py-0.5 shrink-0">
                            {expandedLogId === item._id ? 'Hide' : 'View'}
                          </span>
                        </div>

                        {expandedLogId === item._id && (
                          <div className="sm:hidden mt-1.5 flex flex-col gap-1.5">
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="px-2 py-1 rounded-lg text-xs bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 w-full"
                            >
                              Edit Food
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFood(item._id)}
                              className="px-2 py-1 rounded-lg text-xs bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 w-full"
                            >
                              Delete
                            </button>
                          </div>
                        )}

                        <div className="hidden sm:flex sm:flex-row sm:justify-between sm:items-center gap-3">
                          <div>
                            <p className="font-semibold text-emerald-800">{item.foodName}</p>
                            <p className="text-sm text-gray-600">{item.grams} g</p>
                          </div>

                          <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <div className="text-left sm:text-right">
                              <p className="text-sm font-medium text-emerald-700">{item.calories} kcal</p>
                              <p className="text-xs text-gray-500">
                                {item.protein}g protein  |  {item.carbs || 0}g carbs  |  {item.fats || 0}g fats
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => startEdit(item)}
                              className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 w-full sm:w-auto"
                            >
                              Edit Food
                            </button>
                            <button
                              type="button"
                              onClick={() => removeFood(item._id)}
                              className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 w-full sm:w-auto"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}

