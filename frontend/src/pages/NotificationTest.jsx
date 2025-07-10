import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationTest = () => {
  const [socketStatus, setSocketStatus] = useState('Checking...');
  const notificationContext = useNotifications();
  
  const isContextAvailable = !!notificationContext;
  
  const { 
    notifications = [], 
    unreadCount = 0, 
    loading = false, 
    error = null 
  } = notificationContext || {};
  
  useEffect(() => {
    const checkSocket = async () => {
      try {
        const socket = window.io('http://localhost:5000', {
          transports: ['websocket'],
          timeout: 5000
        });
        
        socket.on('connect', () => {
          setSocketStatus(`Connected (ID: ${socket.id})`);
          
          // Disconnect after successful connection test
          setTimeout(() => {
            socket.disconnect();
          }, 3000);
        });
        
        socket.on('connect_error', (err) => {
          setSocketStatus(`Connection Error: ${err.message}`);
        });
        
        socket.on('disconnect', () => {
          setSocketStatus('Disconnected');
        });
        
      } catch (err) {
        setSocketStatus(`Error: ${err.message}`);
      }
    };
    
    checkSocket();
  }, []);
  
  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h2>Notification System Test</h2>
            </div>
            <div className="card-body">
              <h4>Context Status</h4>
              <p>
                <strong>Context Available:</strong> {isContextAvailable ? 'Yes' : 'No'}
              </p>
              
              <h4>Socket Status</h4>
              <p>{socketStatus}</p>
              
              <h4>Notification Data</h4>
              <ul className="list-group mb-3">
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Loading:
                  <span className={loading ? 'text-warning' : 'text-success'}>
                    {loading ? 'Loading...' : 'Complete'}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Error:
                  <span className={error ? 'text-danger' : 'text-success'}>
                    {error || 'None'}
                  </span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Unread Notifications:
                  <span className="badge bg-primary rounded-pill">{unreadCount}</span>
                </li>
                <li className="list-group-item d-flex justify-content-between align-items-center">
                  Total Notifications:
                  <span className="badge bg-secondary rounded-pill">{notifications.length}</span>
                </li>
              </ul>
              
              <h4>Recent Notifications</h4>
              {notifications.length === 0 ? (
                <div className="alert alert-info">No notifications found</div>
              ) : (
                <div className="list-group">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div key={notification._id || index} className="list-group-item list-group-item-action">
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{notification.title}</h5>
                        <small>{new Date(notification.createdAt).toLocaleString()}</small>
                      </div>
                      <p className="mb-1">{notification.message}</p>
                      <small>Type: {notification.type}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationTest; 