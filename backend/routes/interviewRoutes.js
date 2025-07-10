const express = require('express');
const router = express.Router();
const { protect, candidateOnly, recruiterOnly } = require('../middleware/authMiddleware');
const {
  createInterview,
  getRecruiterInterviews,
  getCandidateInterviews,
  updateInterviewStatus,
  addInterviewFeedback,
  getInterviewById,
  submitFeedback,
  getFeedback,
  updateFeedbackVisibility
} = require('../controllers/interviewController');

// Base route: /api/interviews

// Create new interview (recruiter only)
router.post('/', protect, recruiterOnly, createInterview);

// Get interviews by role
router.get('/recruiter', protect, recruiterOnly, getRecruiterInterviews);
router.get('/candidate', protect, candidateOnly, getCandidateInterviews);

// Get single interview
router.get('/:id', protect, getInterviewById);

// Update interview status
router.put('/:id/status', protect, updateInterviewStatus);

// Legacy feedback endpoint
router.put('/:id/feedback', protect, recruiterOnly, addInterviewFeedback);

// New feedback endpoints (Phase 3)
router.post('/:id/feedback', protect, recruiterOnly, submitFeedback);
router.get('/:id/feedback', protect, getFeedback);
router.patch('/:id/feedback/visibility', protect, recruiterOnly, updateFeedbackVisibility);

module.exports = router; 