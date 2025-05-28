import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

const Dashboard = () => {
  const { user, logout, token } = useContext(AuthContext);
  const [foodList, setFoodList] = useState([]);
  const [food, setFood] = useState({ name: '', calories: '', protein: '' });
  const [editingFoodId, setEditingFoodId] = useState(null);
  const [editingFoodData, setEditingFoodData] = useState({ name: '', calories: '', protein: '' });

  const fetchFoodLogs = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/foodlogs/my-food', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFoodList(res.data.foodLog);
    } catch (err) {
      console.error('Failed to fetch food logs', err);
    }
  };

  useEffect(() => {
    if (user && token) {
      fetchFoodLogs();
    }
  }, [user, token]);

  const handleChange = (e) => {
    setFood({ ...food, [e.target.name]: e.target.value });
  };

  const addFood = async () => {
    const { name, calories, protein } = food;
    if (
      !name ||
      isNaN(Number(calories)) ||
      isNaN(Number(protein)) ||
      Number(protein) <= 0
    ) {
      alert('Please enter valid food, calories, and protein.');
      return;
    }

    const data = {
      name,
      calories: Number(calories),
      protein: parseFloat(protein),
    };

    console.log('Submitting food data:', data); 

    try {
      await axios.post('http://localhost:5000/api/foodlogs/add-food', data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFood({ name: '', calories: '', protein: '' });
      fetchFoodLogs();
    } catch (err) {
      alert('Failed to add food');
    }
  };

  const deleteFood = async (id) => {
    if (!window.confirm('Are you sure you want to delete this food entry?')) return;
    try {
      await axios.delete(`http://localhost:5000/api/foodlogs/delete-food/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFoodLogs();
    } catch (err) {
      alert('Failed to delete food');
    }
  };

  const startEdit = (item) => {
    setEditingFoodId(item._id);
    setEditingFoodData({
      name: item.food,
      calories: item.calories,
      protein: item.protein,
    });
  };

  const handleEditChange = (e) => {
    setEditingFoodData({ ...editingFoodData, [e.target.name]: e.target.value });
  };

  const saveEdit = async () => {
    const { name, calories, protein } = editingFoodData;
    if (
      !name ||
      isNaN(Number(calories)) ||
      isNaN(Number(protein)) ||
      Number(protein) <= 0
    ) {
      alert('Please enter valid values.');
      return;
    }

    try {
      await axios.put(
        `http://localhost:5000/api/foodlogs/update-food/${editingFoodId}`,
        {
          name,
          calories: Number(calories),
          protein: parseFloat(protein),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingFoodId(null);
      setEditingFoodData({ name: '', calories: '', protein: '' });
      fetchFoodLogs();
    } catch (err) {
      alert('Failed to update food');
    }
  };

  const cancelEdit = () => {
    setEditingFoodId(null);
    setEditingFoodData({ name: '', calories: '', protein: '' });
  };

  return (
    <div className="max-w-3xl mx-auto p-6 font-sans text-gray-800">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
        >
          Logout
        </button>
      </header>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">Add Food Eaten Today</h2>
        <div className="flex gap-3 flex-wrap">
          <input
            type="text"
            name="name"
            placeholder="Food Name"
            value={food.name}
            onChange={handleChange}
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <input
            type="number"
            name="calories"
            placeholder="Calories"
            value={food.calories}
            onChange={handleChange}
            className="w-24 p-2 border border-gray-300 rounded"
          />
          <input
            type="number"
            name="protein"
            placeholder="Protein (g)"
            value={food.protein}
            onChange={handleChange}
            className="w-24 p-2 border border-gray-300 rounded"
          />
          <button
            onClick={addFood}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 rounded"
          >
            Add Food
          </button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Food Log</h2>
        {foodList.length === 0 && <p>No food entries yet.</p>}
        <ul>
          {foodList.map((item) => (
            <li
              key={item._id}
              className="bg-gray-100 p-4 rounded mb-3 flex justify-between items-center"
            >
              {editingFoodId === item._id ? (
                <div className="flex gap-3 flex-wrap items-center flex-grow">
                  <input
                    name="name"
                    value={editingFoodData.name}
                    onChange={handleEditChange}
                    className="flex-1 p-2 border border-gray-300 rounded"
                  />
                  <input
                    name="calories"
                    type="number"
                    value={editingFoodData.calories}
                    onChange={handleEditChange}
                    className="w-24 p-2 border border-gray-300 rounded"
                  />
                  <input
                    name="protein"
                    type="number"
                    value={editingFoodData.protein}
                    onChange={handleEditChange}
                    className="w-24 p-2 border border-gray-300 rounded"
                  />
                </div>
              ) : (
                <div className="flex flex-col">
                  <strong className="text-lg">{item.food}</strong>
                  <span className="text-yellow-600 font-semibold">Calories: {item.calories} kcal</span>
                  <span className="text-green-600 font-semibold">Protein: {item.protein}g</span>
                </div>
              )}

              <div className="flex gap-2">
                {editingFoodId === item._id ? (
                  <>
                    <button
                      onClick={saveEdit}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => startEdit(item)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteFood(item._id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default Dashboard;
