import React, { useState, useContext, useRef, useEffect } from 'react';
import { FaBell, FaCheck, FaTrash, FaTimes } from 'react-icons/fa';
import { NotificationContext } from '../context/NotificationContext';
import '../styles/NotificationDropdown.css';

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification
  } = useContext(NotificationContext);

  // Toggle dropdown open/closed
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  // Handle click outside to close dropdown
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

  // Format the date to a more readable format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // If yesterday, show "Yesterday"
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    
    // Otherwise show date
    return date.toLocaleDateString();
  };

  // Handle read notification
  const handleMarkAsRead = (e, notificationId) => {
    e.stopPropagation();
    markAsRead(notificationId);
  };

  // Handle delete notification
  const handleDelete = (e, notificationId) => {
    e.stopPropagation();
    deleteNotification(notificationId);
  };

  // Handle mark all as read
  const handleMarkAllAsRead = (e) => {
    e.stopPropagation();
    markAllAsRead();
  };

  return (
    <div className="notification-dropdown-container" ref={dropdownRef}>
      <button 
        className="notification-bell-button" 
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <FaBell className="notification-bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllAsRead}
                  className="mark-all-read-button"
                  aria-label="Mark all as read"
                >
                  <FaCheck /> Mark all as read
                </button>
              )}
              <button 
                onClick={toggleDropdown}
                className="close-button"
                aria-label="Close notifications"
              >
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="notification-content">
            {loading ? (
              <div className="notification-loading">Loading notifications...</div>
            ) : error ? (
              <div className="notification-error">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">No notifications</div>
            ) : (
              <ul className="notification-list">
                {notifications.map((notification) => (
                  <li 
                    key={notification._id} 
                    className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  >
                    <div className="notification-item-content">
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">{formatDate(notification.createdAt)}</div>
                    </div>
                    <div className="notification-actions">
                      {!notification.read && (
                        <button 
                          onClick={(e) => handleMarkAsRead(e, notification._id)}
                          className="mark-read-button"
                          aria-label="Mark as read"
                        >
                          <FaCheck />
                        </button>
                      )}
                      <button 
                        onClick={(e) => handleDelete(e, notification._id)}
                        className="delete-button"
                        aria-label="Delete notification"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown; 