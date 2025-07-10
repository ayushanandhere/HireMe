const express = require('express');
const router = express.Router();
const { protect, recruiterOnly } = require('../middleware/authMiddleware');
const {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  matchCandidateToJob,
  getRecruiterJobs
} = require('../controllers/jobController');

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobById);

// Recruiter routes
router.post('/', protect, recruiterOnly, createJob);
router.put('/:id', protect, recruiterOnly, updateJob);
router.delete('/:id', protect, recruiterOnly, deleteJob);
router.get('/recruiter/list', protect, recruiterOnly, getRecruiterJobs);

// Resume-job matching route - DEPRECATED: Use /api/match/job/:id instead
router.get('/:jobId/match/:candidateId', protect, recruiterOnly, matchCandidateToJob);

module.exports = router; 