import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { api, BACKEND_URL } from '../services/api';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Function to fetch notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }

      const response = await api.get('/notifications');
      const data = response.data;
      
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount((data.data || []).filter(notification => !notification.isRead).length);
        setError(null);
      } else {
        setError(data.message || 'Unknown error loading notifications');
      }
    } catch (err) {
      setError(`Failed to load notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return undefined;
      
      const newSocket = io(BACKEND_URL, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      
      setSocket(newSocket);
      
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    } catch (socketError) {
      console.error('Error initializing socket:', socketError);
      setError('Failed to connect to notification service');
    }
  }, []);

  // Set up socket event listeners
  useEffect(() => {
    if (!socket) {
      return;
    }

    // Listen for new notifications
    socket.on('notification', (notification) => {
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      const isForCurrentUser = currentUser._id === notification.recipientId;
      
      if (isForCurrentUser) {
        setNotifications(prev => [notification, ...prev.filter((item) => item._id !== notification._id)]);
        setUnreadCount(prev => prev + (notification.isRead ? 0 : 1));
      }
    });

    // Listen for new interview requests
    socket.on('new_interview_request', () => {
      fetchNotifications();
    });

    // Listen for interview status updates
    socket.on('interview_status_update', () => {
      fetchNotifications();
    });

    socket.on('connect_error', () => {
      setError('Failed to connect to notification service');
    });

    return () => {
      socket.off('notification');
      socket.off('new_interview_request');
      socket.off('interview_status_update');
      socket.off('connect_error');
    };
  }, [socket]);

  // Fetch notifications on initial load
  useEffect(() => {
    fetchNotifications();
  }, []);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.put(`/notifications/${id}/read`);

      setNotifications(prev => 
        prev.map(notification => 
          notification._id === id 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.put('/notifications/read-all');

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  // Delete notification
  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await api.delete(`/notifications/${id}`);

      const notificationToDelete = notifications.find(n => n._id === id);
      const wasUnread = notificationToDelete && !notificationToDelete.isRead;

      setNotifications(prev => prev.filter(notification => notification._id !== id));
      
      if (wasUnread) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        error,
        markAsRead,
        markAllAsRead,
        deleteNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Export the context as well for direct import
export default NotificationProvider; 
