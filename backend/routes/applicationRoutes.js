const express = require('express');
const router = express.Router();
const { protect, recruiterOnly, candidateOnly } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const {
  createApplication,
  updateApplicationStage,
  getJobApplications,
  getCandidateApplications,
  getPipelineAnalytics,
  parseResumeForJobApplication,
  acceptForInterview,
  rejectApplication,
  getResumeAnalysis,
  getApplicationById
} = require('../controllers/applicationController');

// Create application - accessible to candidates and recruiters
router.post('/', protect, upload.single('resume'), createApplication);

// Update application stage - recruiter only
router.put('/:id/stage', protect, recruiterOnly, updateApplicationStage);

// Get job applications - recruiter only
router.get('/job/:jobId', protect, recruiterOnly, getJobApplications);

// Get candidate applications - accessible to the candidate and recruiters
router.get('/candidate/:candidateId', protect, getCandidateApplications);

// Get pipeline analytics - recruiter only
router.get('/pipeline/analytics', protect, recruiterOnly, getPipelineAnalytics);

// Parse resume for a specific job application - recruiter only
router.post('/:id/parse-resume', protect, recruiterOnly, parseResumeForJobApplication);

// Accept candidate for interview - recruiter only
router.post('/:id/accept-for-interview', protect, recruiterOnly, acceptForInterview);

// Reject application - recruiter only
router.post('/:id/reject', protect, recruiterOnly, rejectApplication);

// Get resume analysis data for an application - recruiter only
router.get('/:id/resume-analysis', protect, recruiterOnly, getResumeAnalysis);

// Get a single application by ID - accessible to the candidate who applied and recruiters
router.get('/:id', protect, getApplicationById);

module.exports = router; 