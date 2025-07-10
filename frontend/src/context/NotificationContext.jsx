import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Create the context
export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // API base URL (should match your backend)
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Function to fetch notifications from the server
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the authentication token from localStorage
      const token = localStorage.getItem('token');
      
      if (!token) {
        setNotifications([]);
        setUnreadCount(0);
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setNotifications(response.data);
      
      // Calculate unread count
      const unreadNotifications = response.data.filter(notification => !notification.read);
      setUnreadCount(unreadNotifications.length);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // Function to mark a notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      await axios.patch(`${API_URL}/notifications/${notificationId}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification._id === notificationId 
            ? { ...notification, read: true } 
            : notification
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
      setError('Failed to mark notification as read');
    }
  }, [API_URL]);

  // Function to mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      await axios.patch(`${API_URL}/notifications/mark-all-read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      
      // Reset unread count
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
      setError('Failed to mark all notifications as read');
    }
  }, [API_URL]);

  // Function to delete a notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) return;
      
      await axios.delete(`${API_URL}/notifications/${notificationId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      const updatedNotifications = notifications.filter(
        notification => notification._id !== notificationId
      );
      setNotifications(updatedNotifications);
      
      // Update unread count if needed
      const deletedNotification = notifications.find(n => n._id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
      setError('Failed to delete notification');
    }
  }, [API_URL, notifications]);

  // Add a function to add a new notification (for testing purposes)
  const addNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    if (!notification.read) {
      setUnreadCount(prev => prev + 1);
    }
  }, []);

  // Fetch notifications on component mount and set up polling
  useEffect(() => {
    // Initial fetch
    fetchNotifications();
    
    // Set up polling every 30 seconds
    const intervalId = setInterval(fetchNotifications, 30000);
    
    // Clean up
    return () => clearInterval(intervalId);
  }, [fetchNotifications]);

  // Context value
  const contextValue = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 