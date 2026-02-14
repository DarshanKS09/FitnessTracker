import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { dailyTotals, getDashboard, getProfile } from '../utils/api';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profilePic, setProfilePic] = useState('');
  const [data, setData] = useState({
    daily: { calories: 0, protein: 0, carbs: 0, fats: 0 },
    burned: 0,
    diet: null,
  });

  const loadDashboard = async () => {
    try {
      const [dashboardRes, dailyRes] = await Promise.all([
        getDashboard(),
        dailyTotals(),
      ]);

      const dashboardData = dashboardRes.data || dashboardRes || {};
      const dailyData = dailyRes.data || dailyRes || {};

      setData({
        ...dashboardData,
        daily: {
          calories: Number(
            dailyData.calories ?? dashboardData.daily?.calories ?? 0
          ),
          protein: Number(
            dailyData.protein ?? dashboardData.daily?.protein ?? 0
          ),
          carbs: Number(
            dailyData.carbs ?? dashboardData.daily?.carbs ?? 0
          ),
          fats: Number(
            dailyData.fats ?? dashboardData.daily?.fats ?? 0
          ),
        },
      });
    } catch {}
  };

  const loadProfilePic = async () => {
    try {
      const res = await getProfile();
      const me = res.data || res;
      setProfilePic(me?.profilePic || '');
    } catch {
      setProfilePic(user?.profilePic || '');
    }
  };

  useEffect(() => {
    loadDashboard();
    loadProfilePic();

    const onDataUpdated = () => {
      loadDashboard();
      loadProfilePic();
    };
    const onFocus = () => {
      loadDashboard();
      loadProfilePic();
    };

    window.addEventListener('fitness-data-updated', onDataUpdated);
    window.addEventListener('focus', onFocus);

    const interval = setInterval(loadDashboard, 15000);

    return () => {
      window.removeEventListener('fitness-data-updated', onDataUpdated);
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (user?.profilePic) setProfilePic(user.profilePic);
  }, [user?.profilePic]);

  const calorieTarget = Number(data.diet?.calorieTarget ?? 0);
  const proteinTarget = Number(data.diet?.proteinTarget ?? 0);
  const carbsTarget = calorieTarget > 0 ? Math.round((calorieTarget * 0.5) / 4) : 0;
  const fatsTarget = calorieTarget > 0 ? Math.round((calorieTarget * 0.25) / 9) : 0;
  const caloriesToday = Number(data.daily?.calories ?? 0);
  const proteinToday = Number(data.daily?.protein ?? 0);
  const carbsToday = Number(data.daily?.carbs ?? 0);
  const fatsToday = Number(data.daily?.fats ?? 0);
  const burnedToday = Number(data.burned ?? 0);

  const caloriePercent = calorieTarget > 0 ? Math.min((caloriesToday / calorieTarget) * 100, 100) : 0;
  const proteinPercent = proteinTarget > 0 ? Math.min((proteinToday / proteinTarget) * 100, 100) : 0;
  const carbsPercent = carbsTarget > 0 ? Math.min((carbsToday / carbsTarget) * 100, 100) : 0;
  const fatsPercent = fatsTarget > 0 ? Math.min((fatsToday / fatsTarget) * 100, 100) : 0;

  const ringRadius = 86;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const ringOffset = ringCircumference - (ringCircumference * caloriePercent) / 100;

  return (
    <div className="min-h-screen page-enter bg-gradient-to-br from-[#e8fff5] via-[#dff7ef] to-[#d8f2e9] p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8">
        <section className="relative reveal overflow-hidden rounded-3xl border border-emerald-200 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 p-5 sm:p-8 shadow-xl fx-card" style={{ '--d': '30ms' }}>
          <div className="absolute -top-20 -right-16 h-44 w-44 rounded-full bg-white/15" />
          <div className="absolute -bottom-16 -left-16 h-40 w-40 rounded-full bg-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent" />

          <div className="relative flex flex-col gap-5">
            <div className="absolute right-0 top-0">
              <img
                src={profilePic || user?.profilePic || 'https://placehold.co/48x48?text=U'}
                alt={user?.name ? `${user.name} profile` : 'Profile'}
                className="h-14 w-14 sm:h-16 sm:w-16 lg:h-24 lg:w-24 xl:h-28 xl:w-28 rounded-full object-cover border-2 border-white/70 shadow-lg bg-white/20 fx-pulse"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/48x48?text=U';
                }}
              />
            </div>
            <div className="pr-16 sm:pr-20 lg:pr-24 xl:pr-28">
              <p className="text-xs uppercase tracking-[0.2em] text-emerald-100">Daily Performance</p>
              <h1 className="mt-2 text-2xl sm:text-4xl font-bold text-white leading-tight">Welcome back,</h1>
              <p className="text-2xl sm:text-4xl font-bold text-white leading-tight">{user?.name || 'User'}</p>
              <p className="mt-2 text-emerald-100 text-sm sm:text-base">Stay consistent. Small steps every day.</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5 sm:gap-6 items-start">
          <div className="rounded-3xl reveal fx-card border border-emerald-200 bg-white/95 p-5 sm:p-6 shadow-lg xl:self-start" style={{ '--d': '90ms' }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg sm:text-xl font-semibold text-emerald-900">Calorie Progress</h2>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                {Math.round(caloriePercent)}% complete
              </span>
            </div>
            <p className="mt-2 text-sm text-emerald-700">
              Daily Target:{' '}
              <span className="font-semibold text-emerald-900">
                {calorieTarget > 0 ? `${calorieTarget} kcal` : 'Set in Profile'}
              </span>
            </p>

            <div className="mt-5 flex flex-col items-center">
              <div className="relative h-44 w-44 sm:h-56 sm:w-56 float-soft">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 240 240" aria-hidden="true">
                  <circle cx="120" cy="120" r={ringRadius} stroke="#d1fae5" strokeWidth="16" fill="none" />
                  <circle
                    cx="120"
                    cy="120"
                    r={ringRadius}
                    stroke="#059669"
                    strokeWidth="16"
                    fill="none"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringOffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl sm:text-4xl font-bold text-emerald-800">{caloriesToday}</span>
                  <span className="text-sm text-emerald-600">/ {calorieTarget || 0} kcal</span>
                </div>
              </div>
              <p className="mt-3 text-sm font-medium text-emerald-700">Daily Calories</p>
              <button
                type="button"
                onClick={() => navigate('/food')}
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition fx-card"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-700" fill="currentColor" aria-hidden="true">
                  <path d="M3 3h2v18H3V3zm4 4h2v10H7V7zm4-2h2v14h-2V5zm4 3h2v8h-2V8zm4-5h2v18h-2V3z" />
                </svg>
                <span>Add Food Log</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
            <div className="rounded-2xl reveal fx-card border border-emerald-200 bg-gradient-to-br from-emerald-100 to-emerald-50 p-5 shadow" style={{ '--d': '120ms' }}>
              <p className="text-xs uppercase tracking-wide text-emerald-700">Protein</p>
              <p className="mt-1 text-2xl font-bold text-emerald-900">{proteinToday}g</p>
              <div className="mt-3 h-2 w-full rounded-full bg-white/80">
                <div className="h-2 rounded-full bg-emerald-600" style={{ width: `${proteinPercent}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-emerald-700">Target: {proteinTarget}g</p>
                <button
                  type="button"
                  onClick={() => navigate('/protein-today')}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
                >
                  View
                </button>
              </div>
            </div>

            <div className="rounded-2xl reveal fx-card border border-cyan-200 bg-gradient-to-br from-cyan-100 to-sky-50 p-5 shadow" style={{ '--d': '160ms' }}>
              <p className="text-xs uppercase tracking-wide text-cyan-700">Carbs</p>
              <p className="mt-1 text-2xl font-bold text-cyan-900">{carbsToday}g</p>
              <div className="mt-3 h-2 w-full rounded-full bg-white/80">
                <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${carbsPercent}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-cyan-700">Target: {carbsTarget}g</p>
                <button
                  type="button"
                  onClick={() => navigate('/carbs-today')}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-cyan-600 text-white hover:bg-cyan-700 transition"
                >
                  View
                </button>
              </div>
            </div>

            <div className="rounded-2xl reveal fx-card border border-amber-200 bg-gradient-to-br from-amber-100 to-yellow-50 p-5 shadow" style={{ '--d': '200ms' }}>
              <p className="text-xs uppercase tracking-wide text-amber-700">Fats</p>
              <p className="mt-1 text-2xl font-bold text-amber-900">{fatsToday}g</p>
              <div className="mt-3 h-2 w-full rounded-full bg-white/80">
                <div className="h-2 rounded-full bg-amber-600" style={{ width: `${fatsPercent}%` }} />
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs text-amber-700">Target: {fatsTarget}g</p>
                <button
                  type="button"
                  onClick={() => navigate('/fats-today')}
                  className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition"
                >
                  View
                </button>
              </div>
            </div>

            <div className="rounded-2xl reveal fx-card border border-teal-200 bg-gradient-to-br from-teal-100 to-cyan-50 p-5 shadow" style={{ '--d': '240ms' }}>
              <p className="text-xs uppercase tracking-wide text-teal-700">Calories Burned</p>
              <p className="mt-1 text-2xl font-bold text-teal-900">{burnedToday}</p>
              <p className="mt-2 text-xs text-teal-700">Tracked from workout logs</p>
            </div>

          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
