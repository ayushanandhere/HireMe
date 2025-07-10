const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const calendarController = require('../controllers/calendarController');

// Base route: /api/calendar

// Generate iCal file for an interview
router.get('/ical/:interviewId', protect, calendarController.generateICalFile);

// Add to Google Calendar (OAuth2 flow)
router.get('/google/auth', protect, calendarController.googleAuthUrl);
router.get('/google/callback', calendarController.googleCallback);
router.post('/google', protect, calendarController.addToGoogleCalendar);

// Add to Outlook Calendar (OAuth2 flow)
router.get('/outlook/auth', protect, calendarController.outlookAuthUrl);
router.get('/outlook/callback', calendarController.outlookCallback);
router.post('/outlook', protect, calendarController.addToOutlookCalendar);

module.exports = router; 