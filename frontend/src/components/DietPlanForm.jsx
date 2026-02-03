import React, { useState, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";

const DietPlanForm = ({ userId }) => {
  const { token } = useContext(AuthContext); // 🔴 Get token from context
  const [preferences, setPreferences] = useState([]);
  const [dietPlan, setDietPlan] = useState([]);

  const handleChange = (e) => {
    const { value, checked } = e.target;
    setPreferences((prev) =>
      checked ? [...prev, value] : prev.filter((item) => item !== value)
    );
  };

  const handleSubmit = async () => {
  try {
    const res = await axios.post('http://localhost:5000/api/diet/generate', {
      preferences,
    });

    setDietPlan(res.data.dietPlan);
  } catch (err) {
    console.error('Error generating plan:', err);
  }
};


  return (
    <div className="bg-white rounded p-6 shadow mt-8">
      <h2 className="text-xl font-semibold mb-4">Select Your Dietary Preferences</h2>
      <div className="flex gap-4 mb-4">
        <label className="flex items-center gap-2">
          <input type="checkbox" value="vegetarian" onChange={handleChange} /> Veg
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" value="chicken" onChange={handleChange} /> Chicken
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" value="egg" onChange={handleChange} /> Eggs
        </label>
      </div>
      <button
        onClick={handleSubmit}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Generate Diet Plan
      </button>

      {dietPlan.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold mb-2">Your Diet Plan</h3>
          <ul className="list-disc pl-5 space-y-1">
            {dietPlan.map((item, i) => (
              <li key={i}>{item.strMeal}</li> // assumes TheMealDB format
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default DietPlanForm;
