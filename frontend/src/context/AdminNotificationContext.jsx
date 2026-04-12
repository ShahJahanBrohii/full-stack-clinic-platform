import React, { createContext, useState, useCallback } from 'react';

export const AdminNotificationContext = createContext();

export function AdminNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now();
    const notification = {
      id,
      message,
      type, // 'info', 'success', 'warning', 'error'
      timestamp: new Date(),
    };

    setNotifications((prev) => [notification, ...prev]);

    if (duration > 0) {
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <AdminNotificationContext.Provider value={{ notifications, addNotification, removeNotification, clearAll }}>
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotification() {
  const context = React.useContext(AdminNotificationContext);
  if (!context) {
    throw new Error('useAdminNotification must be used within AdminNotificationProvider');
  }
  return context;
}
