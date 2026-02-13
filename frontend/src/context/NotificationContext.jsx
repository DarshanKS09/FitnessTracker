import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notif, setNotif] = useState(null);

  const notify = useCallback((message, type = 'info', options = {}) => {
    setNotif({ message, type, ...options });
  }, []);

  const clear = useCallback(() => setNotif(null), []);

  useEffect(() => {
    if (!notif) return;
    const t = setTimeout(() => setNotif(null), notif.duration || 4000);
    return () => clearTimeout(t);
  }, [notif]);

  return (
    <NotificationContext.Provider value={{ notify, clear }}>
      {children}

      {notif && (
        <div className={`fixed top-4 right-4 z-50 max-w-sm p-3 rounded shadow-md text-white ${notif.type === 'success' ? 'bg-green-600' : notif.type === 'error' ? 'bg-red-600' : 'bg-blue-600'}`}>
          <div className="flex items-center justify-between gap-4">
            <div className="text-sm">{notif.message}</div>
            <button onClick={clear} className="text-white opacity-80 hover:opacity-100">âœ | </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => useContext(NotificationContext);

export default NotificationProvider;
