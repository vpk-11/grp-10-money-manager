import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {api} from '../utils/api';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    // Safe defaults if provider isn't mounted yet / at all
    return {
      notifications: [],
      unreadCount: 0,
      loading: false,
      fetchNotifications: () => {},
      markAsRead: () => {},
      markAllAsRead: () => {},
      deleteNotification: () => {},
      deleteAllRead: () => {},
      addNotification: () => {},
    };
  }

  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=50');
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [user]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await api.put(`/notifications/${notificationId}/read`);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/notifications/${notificationId}`);
      const deletedNotif = notifications.find(n => n._id === notificationId);
      setNotifications(prev => prev.filter(notif => notif._id !== notificationId));
      if (!deletedNotif?.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  // Delete all read notifications
  const deleteAllRead = async () => {
    try {
      await api.delete('/notifications');
      setNotifications(prev => prev.filter(notif => !notif.isRead));
    } catch (error) {
      console.error('Failed to delete read notifications:', error);
    }
  };

  // Add a new notification (for real-time updates)
  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.isRead) {
      setUnreadCount(prev => prev + 1);
    }
  };

  // Initial fetch and polling
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);

      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications, fetchUnreadCount]);

  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllRead,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
