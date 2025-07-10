const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getResumeSuggestionsForJob,
  getGeneralResumeSuggestions
} = require('../controllers/resumeSuggestionController');

// Get general resume suggestions
router.get('/:candidateId', protect, getGeneralResumeSuggestions);

// Get job-specific resume suggestions
router.get('/:candidateId/job/:jobId', protect, getResumeSuggestionsForJob);

module.exports = router; 