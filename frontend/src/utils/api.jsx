import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function setAuthToken(token) {
  if (token) axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  else delete axios.defaults.headers.common['Authorization'];
}

// Auth
export const sendOtp = (email) => axios.post(`${API_URL}/auth/send-otp`, { email });
export const verifyOtp = (data) => axios.post(`${API_URL}/auth/verify-otp`, data);
export const register = (data) => axios.post(`${API_URL}/auth/register`, data);
export const login = (data) => axios.post(`${API_URL}/auth/login`, data);
export const refresh = () => axios.post(`${API_URL}/auth/refresh`);
export const logout = () => axios.post(`${API_URL}/auth/logout`);

// Food
export const addFood = (data) => axios.post(`${API_URL}/food/add`, data);
export const getMyFood = (params) => axios.get(`${API_URL}/food/my`, { params });
export const updateFood = (id, data) => axios.put(`${API_URL}/food/update/${id}`, data);
export const deleteFood = (id) => axios.delete(`${API_URL}/food/delete/${id}`);
export const dailyTotals = (params) => axios.get(`${API_URL}/food/daily-totals`, { params });
export const weeklyFood = () => axios.get(`${API_URL}/food/weekly`);

// Diet
export const generateDiet = (data) => axios.post(`${API_URL}/diet/generate`, data);
export const getDiet = () => axios.get(`${API_URL}/diet/my`);

// Workout
export const logWorkout = (data) => axios.post(`${API_URL}/workout/log`, data);
export const getWorkouts = () => axios.get(`${API_URL}/workout/my`);

// Dashboard
export const getDashboard = () => axios.get(`${API_URL}/dashboard`);

