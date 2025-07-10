const express = require('express');
const router = express.Router();
const { protect, recruiterOnly, candidateOnly } = require('../middleware/authMiddleware');
const aiController = require('../controllers/aiController');

// Recruiter routes
// Get initial context for the AI assistant
router.get('/interview-context/:interviewId', protect, recruiterOnly, aiController.getInitialContext);

// Handle AI assistant messages
router.post('/interview-assistant', protect, recruiterOnly, aiController.handleMessage);

// Candidate routes
// Get initial context for the candidate AI training assistant
router.get('/training-context/:applicationId', protect, candidateOnly, aiController.getTrainingContext);

// Handle AI training assistant messages
router.post('/training-assistant', protect, candidateOnly, aiController.handleTrainingMessage);

module.exports = router;
