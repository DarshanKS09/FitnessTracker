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
  const [refreshToken, setRefreshToken] = useState(() =>
    sessionStorage.getItem('refreshToken') || null
  );
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    if (accessToken) setAuthToken(accessToken);
    else setAuthToken(null);
  }, [accessToken]);

  useEffect(() => {
    let mounted = true;
    const boot = async () => {
      if (accessToken) {
        if (mounted) setIsAuthReady(true);
        return;
      }

      if (!refreshToken) {
        if (mounted) setIsAuthReady(true);
        return;
      }

      try {
        const r = await api.post('/auth/refresh', { refreshToken });
        const newToken = r.data?.accessToken;
        if (newToken && mounted) {
          setAccessToken(newToken);
          sessionStorage.setItem('accessToken', newToken);
          setAuthToken(newToken);
        }
      } catch {
        if (mounted) {
          setUser(null);
          setAccessToken(null);
          setRefreshToken(null);
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('accessToken');
          sessionStorage.removeItem('refreshToken');
          setAuthToken(null);
        }
      } finally {
        if (mounted) setIsAuthReady(true);
      }
    };

    boot();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const hardLogout = () => {
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      sessionStorage.removeItem('user');
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('refreshToken');
      setAuthToken(null);
    };

    const interceptor = api.interceptors.response.use(
      (res) => res,
      async (err) => {
        const original = err.config;

        if (err.response?.status === 401 && !original._retry) {
          original._retry = true;
          try {
            const tokenToUse = sessionStorage.getItem('refreshToken') || refreshToken;
            const r = tokenToUse
              ? await api.post('/auth/refresh', { refreshToken: tokenToUse })
              : await api.post('/auth/refresh');
            const newToken = r.data?.accessToken;

            if (newToken) {
              setAccessToken(newToken);
              sessionStorage.setItem('accessToken', newToken);
              setAuthToken(newToken);

              original.headers['Authorization'] = `Bearer ${newToken}`;
              return api(original);
            }
          } catch (e) {
            hardLogout();
          }
        }

        return Promise.reject(err);
      }
    );

    return () => api.interceptors.response.eject(interceptor);
  }, [refreshToken]);

  const login = (token, userData, refresh) => {
    setAccessToken(token);
    sessionStorage.setItem('accessToken', token);
    setAuthToken(token);

    setUser(userData);
    sessionStorage.setItem('user', JSON.stringify(userData));

    if (refresh) {
      setRefreshToken(refresh);
      sessionStorage.setItem('refreshToken', refresh);
    }
  };

  const logout = async () => {
    const tokenToUse = sessionStorage.getItem('refreshToken') || refreshToken;
    try {
      if (tokenToUse) {
        await api.post('/auth/logout', { refreshToken: tokenToUse });
      } else {
        await api.post('/auth/logout');
      }
    } catch (e) {}

    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);

    sessionStorage.removeItem('user');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');

    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, refreshToken, isAuthReady, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
