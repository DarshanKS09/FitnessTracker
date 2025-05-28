// frontend/src/components/FoodLogForm.jsx
import React, { useState } from 'react';

export default function FoodLogForm({ onSuccess }) {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    

    if (!name || !calories) {
      alert('Name and calories are required!');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please login first!');

      const response = await fetch('/api/foodlogs/add-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name, calories, protein })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to add food');

      
      setName('');
      setCalories('');
      setProtein('');
      if (onSuccess) onSuccess();
    } catch (err) {
      alert(err.message);
      console.error('Error:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="food-form">
      <input
        type="text"
        placeholder="Food Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <input
        type="number"
        placeholder="Calories"
        value={calories}
        onChange={(e) => setCalories(e.target.value)}
        min="0"
        required
      />
      <input
        type="number"
        placeholder="Protein (g)"
        value={protein}
        onChange={(e) => setProtein(e.target.value)}
        min="0"
        step="0.1"
      />
      <button type="submit">Save</button>
    </form>
  );
}