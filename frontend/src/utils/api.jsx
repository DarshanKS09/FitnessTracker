import axios from 'axios';

/* ======================
   BASE CONFIG
====================== */

const API_URL =
  import.meta.env.VITE_API_URL ||
  'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

/* ======================
   TOKEN HANDLING
====================== */

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

/* ======================
   AUTH
====================== */

export const sendOtp = (email) =>
  api.post('/auth/send-otp', { email });

export const verifyOtp = (data) =>
  api.post('/auth/verify-otp', data);

export const register = (data) =>
  api.post('/auth/register', data);

export const login = (data) =>
  api.post('/auth/login', data);

export const refresh = () =>
  api.post('/auth/refresh');

export const logout = () =>
  api.post('/auth/logout');

export const forgotPassword = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPassword = (token, password) =>
  api.post(`/auth/reset-password/${token}`, { password });

/* ======================
   FOOD
====================== */

export const addFood = (data) =>
  api.post('/food/add', data);

export const getMyFood = () =>
  api.get('/food/my');

export const dailyTotals = () =>
  api.get('/food/daily');

export const weeklyFood = () =>
  api.get('/food/weekly');

export const updateFood = (id, data) =>
  api.put(`/food/update/${id}`, data);

export const deleteFood = (id) =>
  api.delete(`/food/delete/${id}`);

/* ======================
   DIET
====================== */

export const generateDiet = (data) =>
  api.post('/diet/generate', data);

export const getDiet = () =>
  api.get('/diet/my');

/* ======================
   WORKOUT
====================== */

export const addWorkout = (data) =>
  api.post('/workout', data);

export const getMyWorkouts = () =>
  api.get('/workout');

export const updateWorkout = (id, data) =>
  api.put(`/workout/${id}`, data);

export const deleteWorkout = (id) =>
  api.delete(`/workout/${id}`);

/* ======================
   DASHBOARD
====================== */

export const getDashboard = () =>
  api.get('/dashboard');

/* ======================
   USER
====================== */

export const updateProfile = (data) =>
  api.put('/users/me', data);

export const getProfile = () =>
  api.get('/users/me');

export default api;
