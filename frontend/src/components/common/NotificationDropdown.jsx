import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBell, FaCheck, FaTrash, FaBug } from 'react-icons/fa';
import { useNotifications } from '../../contexts/NotificationContext';
import '../../styles/NotificationDropdown.css';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  
  // Safely get notification context
  let notifications = [];
  let unreadCount = 0;
  let loading = false;
  let error = null;
  let markAsRead = () => {};
  let markAllAsRead = () => {};
  let deleteNotification = () => {};
  
  try {
    const context = useNotifications();
    if (context) {
      notifications = context.notifications || [];
      unreadCount = context.unreadCount || 0;
      loading = context.loading || false;
      error = context.error;
      markAsRead = context.markAsRead || (() => {});
      markAllAsRead = context.markAllAsRead || (() => {});
      deleteNotification = context.deleteNotification || (() => {});
    } else {
      setHasError(true);
    }
  } catch (err) {
    console.error('Error accessing notification context:', err);
    setHasError(true);
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification._id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    }
    setIsOpen(false);
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <button 
        className="notification-bell-button" 
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        {hasError ? <FaBug /> : <FaBell />}
        {!hasError && unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            {notifications.length > 0 && (
              <button 
                className="mark-all-read-button" 
                onClick={markAllAsRead}
                aria-label="Mark all as read"
              >
                <FaCheck /> Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list">
            {hasError ? (
              <div className="notification-error">Notification system unavailable</div>
            ) : loading ? (
              <div className="notification-loading">Loading notifications...</div>
            ) : error ? (
              <div className="notification-error">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">No notifications</div>
            ) : (
              notifications.map((notification) => (
                <div 
                  key={notification._id} 
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div 
                    className="notification-content"
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-time">{formatTimestamp(notification.createdAt)}</div>
                  </div>
                  <div className="notification-actions">
                    <button
                      className="notification-action-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification._id);
                      }}
                      aria-label="Delete notification"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 