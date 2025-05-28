import React from 'react';

export default function SummaryDashboard({ foodLogs, workoutLogs }) {
  // Calculate total calories consumed
  const totalCalories = foodLogs.reduce((sum, log) => sum + log.calories, 0);

  // Calculate total workout duration
  const totalWorkoutMinutes = workoutLogs.reduce((sum, log) => sum + log.duration, 0);

  return (
    <div className="bg-white p-6 rounded shadow-md max-w-3xl mx-auto my-6">
      <h2 className="text-2xl font-bold mb-4">Summary Dashboard</h2>
      <div className="flex justify-around text-center">
        <div>
          <h3 className="text-lg font-semibold">Total Calories</h3>
          <p className="text-3xl text-red-600">{totalCalories}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold">Workout Minutes</h3>
          <p className="text-3xl text-green-600">{totalWorkoutMinutes}</p>
        </div>
      </div>
    </div>
  );
}
