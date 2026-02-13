import React, { useState, useEffect } from 'react';
import {
  addWorkout,
  getMyWorkouts,
  updateWorkout,
  deleteWorkout,
} from '../utils/api';
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
  const emitDashboardRefresh = () => {
    window.dispatchEvent(new Event('fitness-data-updated'));
  };

  const [type, setType] = useState('Walking');
  const [distance, setDistance] = useState('');
  const [minutes, setMinutes] = useState('');
  const [logs, setLogs] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    type: 'Walking',
    distance: '',
    minutes: '',
  });

  useEffect(() => {
    fetchLogs();
  }, []);

  async function fetchLogs() {
    try {
      const res = await getMyWorkouts();
      const data = res?.data ?? res;

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

    const payload = {
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
      emitDashboardRefresh();
      setDistance('');
      setMinutes('');
      fetchLogs();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to log workout', 'error');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      type: item.type || 'Walking',
      distance: item.distance ?? '',
      minutes: item.minutes ?? '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({
      type: 'Walking',
      distance: '',
      minutes: '',
    });
  };

  const saveEdit = async (id) => {
    const payload = {
      type: editForm.type,
      distance: null,
      minutes: null,
    };

    if (editForm.type === 'Walking' || editForm.type === 'Running') {
      if (!editForm.distance) return notify('Enter distance (km)', 'error');
      payload.distance = Number(editForm.distance);
    } else {
      if (!editForm.minutes) return notify('Enter duration (minutes)', 'error');
      payload.minutes = Number(editForm.minutes);
    }

    try {
      await updateWorkout(id, payload);
      notify('Workout updated', 'success');
      emitDashboardRefresh();
      cancelEdit();
      fetchLogs();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to update workout', 'error');
    }
  };

  const removeWorkout = async (id) => {
    try {
      await deleteWorkout(id);
      notify('Workout deleted', 'success');
      emitDashboardRefresh();
      if (editingId === id) cancelEdit();
      fetchLogs();
    } catch (err) {
      notify(err.response?.data?.message || 'Failed to delete workout', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-emerald-800">
          Workout Tracker
        </h2>

        <form
          onSubmit={submit}
          className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 space-y-6"
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

          {type !== 'Walking' && type !== 'Running' && (
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

        <div className="bg-white rounded-3xl shadow-lg p-5 sm:p-8 space-y-4">
          <h3 className="text-lg font-semibold text-emerald-800">
            Today's Workouts
          </h3>

          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No workouts logged today.</p>
          ) : (
            logs.map((item) => (
              <div
                key={item._id}
                className="border border-emerald-100 rounded-xl p-4 bg-emerald-50"
              >
                {editingId === item._id ? (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                    <select
                      value={editForm.type}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        setEditForm({
                          ...editForm,
                          type: nextType,
                          distance: '',
                          minutes: '',
                        });
                      }}
                      className="p-2 border rounded-lg"
                    >
                      {workoutTypes.map((w) => (
                        <option key={w}>{w}</option>
                      ))}
                    </select>

                    {(editForm.type === 'Walking' || editForm.type === 'Running') ? (
                      <input
                        type="number"
                        value={editForm.distance}
                        onChange={(e) => setEditForm({ ...editForm, distance: e.target.value })}
                        placeholder="Distance (km)"
                        className="p-2 border rounded-lg"
                      />
                    ) : (
                      <input
                        type="number"
                        value={editForm.minutes}
                        onChange={(e) => setEditForm({ ...editForm, minutes: e.target.value })}
                        placeholder="Duration (minutes)"
                        className="p-2 border rounded-lg"
                      />
                    )}

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
                    <div className="text-sm text-gray-600">
                      {item.caloriesBurned || 0} kcal
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
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
                    <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <p className="text-emerald-700 font-medium">
                        {item.caloriesBurned || 0} kcal
                      </p>
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100 w-full sm:w-auto"
                      >
                        Edit Workout
                      </button>
                      <button
                        type="button"
                        onClick={() => removeWorkout(item._id)}
                        className="px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 w-full sm:w-auto"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
