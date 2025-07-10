import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { FaBell } from 'react-icons/fa';

const SimpleNotification = () => {
  // Try to use the context with a fallback
  let unreadCount = 0;
  let error = null;
  
  try {
    const context = useNotifications();
    
    if (context) {
      unreadCount = context.unreadCount || 0;
      error = context.error;
    } else {
      console.warn('Notification context is undefined');
    }
  } catch (err) {
    console.error('Error accessing notification context:', err);
  }

  return (
    <div className="nav-link" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <FaBell />
      {unreadCount > 0 && (
        <span 
          style={{ 
            position: 'absolute', 
            top: '0', 
            right: '0', 
            background: 'red', 
            color: 'white', 
            borderRadius: '50%', 
            width: '18px', 
            height: '18px', 
            fontSize: '12px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}
        >
          {unreadCount}
        </span>
      )}
    </div>
  );
};

export default SimpleNotification; 