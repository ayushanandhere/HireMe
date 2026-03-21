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

// Training conversation management
router.get('/training-conversations/:applicationId', protect, candidateOnly, aiController.listTrainingConversations);
router.post('/training-conversations/:applicationId', protect, candidateOnly, aiController.createTrainingConversation);
router.get('/training-conversation/:conversationId', protect, candidateOnly, aiController.getTrainingConversation);
router.patch('/training-conversation/:conversationId', protect, candidateOnly, aiController.updateTrainingConversation);
router.delete('/training-conversation/:conversationId', protect, candidateOnly, aiController.deleteTrainingConversation);

// Handle AI training assistant messages
router.post('/training-assistant', protect, candidateOnly, aiController.handleTrainingMessage);

module.exports = router;
