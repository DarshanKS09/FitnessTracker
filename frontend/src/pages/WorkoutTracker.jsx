import React, { useState, useEffect } from 'react';
import { addWorkout, getMyWorkouts } from '../utils/api';
import { useNotification } from '../context/NotificationContext';

const workoutTypes = [
  'Walking',
  'Running',
  'Swimming',
  'Cardio',
  'Strength Training',
];

export default function Workout() {
  const { notify } = useNotification();

  const [type, setType] = useState('Walking');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [logs, setLogs] = useState([]); // ALWAYS array

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await getMyWorkouts();
      const data = res?.data ?? res;

      // Defensive protection
      if (Array.isArray(data)) {
        setLogs(data);
      } else if (Array.isArray(data?.workouts)) {
        setLogs(data.workouts);
      } else {
        setLogs([]);
      }
    } catch {
      setLogs([]);
    }
  }

  const submit = async (e) => {
    e.preventDefault();

    let payload = {
      type,
      distance: null,
      minutes: null,
    };

    if (type === 'Walking' || type === 'Running') {
      if (!distance) return notify('Enter distance (km)', 'error');
      payload.distance = Number(distance);
    } else {
      if (!minutes) return notify('Enter duration (minutes)', 'error');
      payload.minutes = Number(minutes);
    }

    try {
      await addWorkout(payload);
      notify('Workout logged', 'success');
      setDistance('');
      setMinutes('');
      fetchLogs();
    } catch {
      notify('Failed to log workout', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        <h2 className="text-3xl font-bold text-emerald-800">
          Workout Tracker
        </h2>

        {/* Form */}
        <form
          onSubmit={submit}
          className="bg-white rounded-3xl shadow-lg p-8 space-y-6"
        >
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setDistance('');
              setMinutes('');
            }}
            className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
          >
            {workoutTypes.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </select>

          {(type === 'Walking' || type === 'Running') && (
            <input
              type="number"
              placeholder="Distance (km)"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
            />
          )}

          {(type !== 'Walking' && type !== 'Running') && (
            <input
              type="number"
              placeholder="Duration (minutes)"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className="p-3 border rounded-lg w-full focus:ring-2 focus:ring-emerald-400"
            />
          )}

          <button
            type="submit"
            className="bg-emerald-600 text-white rounded-lg py-3 w-full font-semibold hover:bg-emerald-700 transition"
          >
            Log Workout
          </button>
        </form>

        {/* Logged Workouts */}
        <div className="bg-white rounded-3xl shadow-lg p-8 space-y-4">
          <h3 className="text-lg font-semibold text-emerald-800">
            Today's Workouts
          </h3>

          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No workouts logged today.</p>
          ) : (
            logs.map((item) => (
              <div
                key={item._id}
                className="border border-emerald-100 rounded-xl p-4 bg-emerald-50 flex justify-between"
              >
                <div>
                  <p className="font-semibold text-emerald-800">
                    {item.type}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.distance
                      ? `${item.distance} km`
                      : `${item.minutes} minutes`}
                  </p>
                </div>
                <p className="text-emerald-700 font-medium">
                  {item.caloriesBurned || 0} kcal
                </p>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
