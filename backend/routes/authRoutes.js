const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const { protect, candidateOnly, recruiterOnly } = require('../middleware/authMiddleware');
const {
  googleCredentialLimiter,
  loginLimiter,
  passwordResetLimiter,
  registrationLimiter
} = require('../middleware/authRateLimitMiddleware');
const {
  registerCandidate,
  loginCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  getCandidateDashboardSummary
} = require('../controllers/candidateController');
const {
  registerRecruiter,
  loginRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
  getRecruiterDashboardSummary
} = require('../controllers/recruiterController');
const {
  startGoogleAuth,
  handleGoogleAuthCallback,
  authenticateWithGoogleCredential
} = require('../controllers/googleAuthController');
const {
  requestPasswordReset,
  resetPassword
} = require('../controllers/passwordResetController');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Candidate routes
router.get('/:role/google', startGoogleAuth);
router.get('/google/callback', handleGoogleAuthCallback);
router.post('/google/credential', googleCredentialLimiter, authenticateWithGoogleCredential);
router.post('/:role/forgot-password', passwordResetLimiter, requestPasswordReset);
router.post('/:role/reset-password/:token', passwordResetLimiter, resetPassword);
router.post('/candidate/register', registrationLimiter, upload.single('resume'), registerCandidate);
router.post('/candidate/login', loginLimiter, loginCandidate);
router.get('/candidate/profile', protect, candidateOnly, getCandidateProfile);
router.put(
  '/candidate/profile',
  protect,
  candidateOnly,
  upload.fields([
    { name: 'resume', maxCount: 1 },
    { name: 'profilePicture', maxCount: 1 },
  ]),
  updateCandidateProfile
);
router.get('/candidate/dashboard-summary', protect, candidateOnly, getCandidateDashboardSummary);

// Recruiter routes
router.post('/recruiter/register', registrationLimiter, registerRecruiter);
router.post('/recruiter/login', loginLimiter, loginRecruiter);
router.get('/recruiter/profile', protect, recruiterOnly, getRecruiterProfile);
router.put(
  '/recruiter/profile',
  protect,
  recruiterOnly,
  upload.fields([{ name: 'profilePicture', maxCount: 1 }]),
  updateRecruiterProfile
);
router.get('/recruiter/dashboard-summary', protect, recruiterOnly, getRecruiterDashboardSummary);

module.exports = router; 
