import api from './api';
import { toast } from 'react-toastify';

/**
 * Notification Service for handling all application notifications
 * Includes in-app notifications, toast messages, and browser notifications
 */
class NotificationService {
  constructor() {
    this.hasNotificationPermission = false;
    this.checkNotificationPermission();
    this.listeners = new Map();
    this.notifications = [];
  }

  // Check if browser notifications are supported and permitted
  async checkNotificationPermission() {
    if (!('Notification' in window)) {
      console.warn('This browser does not support desktop notification');
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasNotificationPermission = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasNotificationPermission = permission === 'granted';
      return this.hasNotificationPermission;
    }

    return false;
  }

  // Request permission to display browser notifications
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.hasNotificationPermission = permission === 'granted';
      return this.hasNotificationPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show a browser notification
  showBrowserNotification(title, options = {}) {
    if (!this.hasNotificationPermission) {
      this.requestNotificationPermission().then(granted => {
        if (granted) {
          this.createNotification(title, options);
        }
      });
      return;
    }

    this.createNotification(title, options);
  }

  // Create and display the actual notification
  createNotification(title, options = {}) {
    const notification = new Notification(title, {
      icon: '/logo.png',
      badge: '/logo.png',
      ...options
    });

    notification.onclick = function() {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    return notification;
  }

  // Show a toast notification using react-toastify
  showToast(message, type = 'info', options = {}) {
    const defaultOptions = {
      position: 'top-right',
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true
    };

    const toastOptions = { ...defaultOptions, ...options };

    switch(type) {
      case 'success':
        toast.success(message, toastOptions);
        break;
      case 'error':
        toast.error(message, toastOptions);
        break;
      case 'warning':
        toast.warning(message, toastOptions);
        break;
      case 'info':
      default:
        toast.info(message, toastOptions);
        break;
    }
  }

  // Fetch user notifications from API
  async getUserNotifications() {
    try {
      const response = await api.get('/notifications');
      if (response.data.success) {
        this.notifications = response.data.data;
        this.notifyListeners('notifications-updated', this.notifications);
        return this.notifications;
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId) {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`);
      if (response.data.success) {
        // Update local notifications
        this.notifications = this.notifications.map(notification => 
          notification._id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        );
        this.notifyListeners('notifications-updated', this.notifications);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead() {
    try {
      const response = await api.put('/notifications/read-all');
      if (response.data.success) {
        // Update local notifications
        this.notifications = this.notifications.map(notification => 
          ({ ...notification, isRead: true })
        );
        this.notifyListeners('notifications-updated', this.notifications);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete a notification
  async deleteNotification(notificationId) {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);
      if (response.data.success) {
        // Update local notifications
        this.notifications = this.notifications.filter(
          notification => notification._id !== notificationId
        );
        this.notifyListeners('notifications-updated', this.notifications);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Register a listener for notifications
  addListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    };
  }

  // Notify all listeners of an event
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in notification listener:', error);
      }
    });
  }

  // Get number of unread notifications
  getUnreadCount() {
    return this.notifications.filter(notification => !notification.isRead).length;
  }
}

export default new NotificationService(); 