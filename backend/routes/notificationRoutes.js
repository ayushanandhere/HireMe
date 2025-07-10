const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} = require('../controllers/notificationController');

// Base route: /api/notifications

// Get all notifications for the current user
router.get('/', protect, getUserNotifications);

// Mark a notification as read
router.put('/:id/read', protect, markNotificationAsRead);

// Mark all notifications as read
router.put('/read-all', protect, markAllNotificationsAsRead);

// Delete a notification
router.delete('/:id', protect, deleteNotification);

module.exports = router; 