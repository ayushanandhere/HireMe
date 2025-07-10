const express = require('express');
const router = express.Router();
const { protect, recruiterOnly } = require('../middleware/authMiddleware');
const {
  matchCandidateToJobs,
  matchJobToCandidates,
  calculateAtsScore
} = require('../controllers/matchController');

// Match candidate to jobs
router.get('/candidate/:id', protect, recruiterOnly, matchCandidateToJobs);

// Match job to candidates
router.get('/job/:id', protect, recruiterOnly, matchJobToCandidates);

// Calculate ATS score
router.get('/ats/:id', protect, calculateAtsScore);

module.exports = router; 