const express = require('express');
const router = express.Router();
const { protect, candidateOnly } = require('../middleware/authMiddleware');
const mockInterviewController = require('../controllers/mockInterviewController');

// Initialize a mock interview
router.post('/initialize', protect, candidateOnly, mockInterviewController.initializeMockInterview);

// Process audio answer
router.post('/process-answer', protect, candidateOnly, mockInterviewController.processAnswer);

// Get next question
router.post('/next-question', protect, candidateOnly, mockInterviewController.getNextQuestion);

// Finalize interview and get feedback
router.post('/finalize', protect, candidateOnly, mockInterviewController.finalizeMockInterview);

// Text to speech conversion
router.post('/text-to-speech', protect, candidateOnly, mockInterviewController.textToSpeech);

// Determine interview mode
router.post('/determine-mode', protect, candidateOnly, mockInterviewController.determineInterviewMode);

module.exports = router;
