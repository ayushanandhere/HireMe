const express = require('express');
const router = express.Router();
const { protect, recruiterOnly } = require('../middleware/authMiddleware');
const {
  getDashboardAnalytics,
  getJobAnalytics,
  getCandidateAnalytics,
  getInterviewAnalytics
} = require('../controllers/analyticsController');

// All routes are protected for recruiters only
router.get('/dashboard', protect, recruiterOnly, getDashboardAnalytics);
router.get('/jobs', protect, recruiterOnly, getJobAnalytics);
router.get('/candidates', protect, recruiterOnly, getCandidateAnalytics);
router.get('/interviews', protect, recruiterOnly, getInterviewAnalytics);

module.exports = router; 