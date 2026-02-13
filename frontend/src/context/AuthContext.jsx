import React, { createContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { setAuthToken } from '../utils/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() =>
    JSON.parse(sessionStorage.getItem('user')) || null
  );

  const [accessToken, setAccessToken] = useState(() =>
    sessionStorage.getItem('accessToken') || null
  );

  useEffect(() => {
    if (accessToken) setAuthToken(accessToken);
    else setAuthToken(null);

    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;

        if (err.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const r = await api.post('/auth/refresh');
            const newToken = r.data.accessToken;

            if (newToken) {
              setAccessToken(newToken);
              sessionStorage.setItem('accessToken', newToken);
              setAuthToken(newToken);

              original.headers['Authorization'] = `Bearer ${newToken}`;
              return api(original);
            }
          } catch (e) {
            logout();
          }
        }

        return Promise.reject(err);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [accessToken]);

  const login = (token, userData) => {
    setAccessToken(token);
    sessionStorage.setItem('accessToken', token);
    setAuthToken(token);

    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}

    setUser(null);
    setAccessToken(null);

    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');

    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
