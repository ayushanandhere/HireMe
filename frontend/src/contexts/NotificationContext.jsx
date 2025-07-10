import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

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
        console.log('No authentication token found, skipping notification fetch');
        setLoading(false);
        return;
      }

      console.log('Fetching notifications from API...');
      const apiUrl = 'http://localhost:5000/api/notifications';
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log('API response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Notifications data:', data);
      
      if (data.success) {
        setNotifications(data.data || []);
        setUnreadCount((data.data || []).filter(notification => !notification.isRead).length);
        console.log('Successfully loaded notifications:', data.data?.length || 0);
      } else {
        console.error('API returned success: false', data);
        setError(data.message || 'Unknown error loading notifications');
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(`Failed to load notifications: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Initialize socket connection
  useEffect(() => {
    console.log('Creating socket connection...');
    try {
      const serverUrl = 'http://localhost:5000';
      console.log('Connecting to server:', serverUrl);
      
      // Retrieve auth token for socket authentication
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No auth token found for socket connection');
      }
      
      const newSocket = io(serverUrl, {
        // Send token for backend socket authentication
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5,
      });
      
      setSocket(newSocket);
      
      return () => {
        console.log('Cleaning up socket connection...');
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
      console.log('Socket not yet initialized, skipping event setup');
      return;
    }

    console.log('Setting up socket event listeners');

    // Listen for new notifications
    socket.on('notification', (notification) => {
      console.log('Received notification:', notification);
      
      // Only add notification if it's for the current user
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      console.log('Current user:', currentUser);
      
      const isForCurrentUser = currentUser._id === notification.recipientId;
      console.log('Is for current user:', isForCurrentUser);
      
      if (isForCurrentUser) {
        setNotifications(prev => [notification, ...prev]);
        setUnreadCount(prev => prev + 1);
      }
    });

    // Listen for new interview requests
    socket.on('new_interview_request', (interview) => {
      console.log('Received new interview request:', interview);
      
      // Refresh notifications since a new interview request should create a notification
      fetchNotifications();
    });

    // Listen for interview status updates
    socket.on('interview_status_update', (interview) => {
      console.log('Received interview status update:', interview);
      
      // Refresh notifications since status changes should create notifications
      fetchNotifications();
    });

    // Handle errors
    socket.on('error', (err) => {
      console.error('Socket error:', err);
      setError('Failed to connect to notification service');
    });

    // Handle connection/disconnection
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
    });
    
    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => {
      console.log('Cleaning up socket event listeners');
      socket.off('notification');
      socket.off('new_interview_request');
      socket.off('interview_status_update');
      socket.off('error');
      socket.off('connect');
      socket.off('disconnect');
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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      setNotifications(prev => 
        prev.map(notification => 
          notification._id === id 
            ? { ...notification, read: true } 
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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/read-all`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
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

      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      const notificationToDelete = notifications.find(n => n._id === id);
      const wasUnread = notificationToDelete && !notificationToDelete.read;

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