import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Set token in axios headers globally
export function setAuthToken(token) {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete axios.defaults.headers.common['Authorization'];
  }
}

// Auth APIs
export async function registerApi({ username, password }) {
  const res = await axios.post(`${API_URL}/auth/register`, { username, password });
  return res.data;
}

export async function loginApi({ username, password }) {
  const res = await axios.post(`${API_URL}/auth/login`, { username, password });
  return res.data;
}

// Food Logs APIs - note these paths and token use

export async function fetchFoodLogs() {
  // GET /foodlogs/my-food (requires auth)
  const res = await axios.get(`${API_URL}/foodlogs/my-food`);
  return res.data;
}

export async function createFoodLog(data) {
  // POST /foodlogs/add-food
  const res = await axios.post(`${API_URL}/foodlogs/add-food`, data);
  return res.data;
}

export async function updateFoodLog(id, data) {
  // PUT /foodlogs/update-food/:id
  const res = await axios.put(`${API_URL}/foodlogs/update-food/${id}`, data);
  return res.data;
}

export async function deleteFoodLog(id) {
  // DELETE /foodlogs/delete-food/:id
  const res = await axios.delete(`${API_URL}/foodlogs/delete-food/${id}`);
  return res.data;
}
