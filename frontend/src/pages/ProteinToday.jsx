import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyFood } from '../utils/api';

export default function ProteinToday() {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await getMyFood();
        if (!active) return;
        setLogs(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!active) return;
        setLogs([]);
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const proteinFoods = useMemo(
    () => logs.filter((item) => Number(item.protein || 0) > 0),
    [logs]
  );

  const totalProtein = proteinFoods.reduce(
    (sum, item) => sum + Number(item.protein || 0),
    0
  );

  return (
    <div className="min-h-screen page-enter bg-gradient-to-br from-[#e8fff5] via-[#dff7ef] to-[#d8f2e9] p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="rounded-3xl border border-emerald-200 bg-white/95 shadow-lg p-5 sm:p-7 fx-card reveal" style={{ '--d': '40ms' }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900">Today&apos;s Protein Foods</h1>
              <p className="mt-1 text-sm text-emerald-700">
                Foods logged today with protein content
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="rounded-lg bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition"
            >
              Close
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
            <p className="text-sm text-emerald-700">
              Total protein today:{' '}
              <span className="font-bold text-emerald-900">{Math.round(totalProtein)}g</span>
            </p>
          </div>

          {loading ? (
            <div className="mt-6 space-y-3 animate-pulse">
              <div className="h-16 rounded-xl bg-emerald-100" />
              <div className="h-16 rounded-xl bg-emerald-100" />
              <div className="h-16 rounded-xl bg-emerald-100" />
            </div>
          ) : proteinFoods.length === 0 ? (
            <div className="mt-6 rounded-xl border border-emerald-100 bg-white p-4 text-sm text-gray-600">
              No protein foods logged today.
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {proteinFoods.map((item) => (
                <div
                  key={item._id}
                  className="rounded-xl border border-emerald-100 bg-white p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
                >
                  <div>
                    <p className="font-semibold text-emerald-900">{item.foodName}</p>
                    <p className="text-xs text-emerald-700">
                      {item.mealType} | {item.grams}g | {item.calories} kcal
                    </p>
                  </div>
                  <p className="text-lg font-bold text-emerald-800">{item.protein}g protein</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
