import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { setAuthToken } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem('accessToken') || null);

  useEffect(() => {
    if (accessToken) setAuthToken(accessToken);
    else setAuthToken(null);

    // Setup interceptor for refresh
    const interceptor = axios.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;
        if (err.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const r = await axios.post('/api/auth/refresh');
            const newToken = r.data.accessToken || r.data.access;
            if (newToken) {
              setAccessToken(newToken);
              localStorage.setItem('accessToken', newToken);
              setAuthToken(newToken);
              original.headers['Authorization'] = `Bearer ${newToken}`;
              return axios(original);
            }
          } catch (e) {
            // ignore
          }
        }
        return Promise.reject(err);
      }
    );

    return () => axios.interceptors.response.eject(interceptor);
  }, [accessToken]);

  const login = (token, userData) => {
    setAccessToken(token);
    localStorage.setItem('accessToken', token);
    setAuthToken(token);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
    } catch (e) {}
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
