const express = require('express');
const router = express.Router();
const { upload } = require('../middleware/uploadMiddleware');
const { protect, candidateOnly, recruiterOnly } = require('../middleware/authMiddleware');
const { registerCandidate, loginCandidate, getCandidateProfile, updateCandidateProfile } = require('../controllers/candidateController');
const { registerRecruiter, loginRecruiter, getRecruiterProfile, updateRecruiterProfile } = require('../controllers/recruiterController');
const fs = require('fs');
const path = require('path');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Candidate routes
router.post('/candidate/register', upload.single('resume'), registerCandidate);
router.post('/candidate/login', loginCandidate);
router.get('/candidate/profile', protect, candidateOnly, getCandidateProfile);
router.put('/candidate/profile', protect, candidateOnly, upload.single('resume'), updateCandidateProfile);

// Recruiter routes
router.post('/recruiter/register', registerRecruiter);
router.post('/recruiter/login', loginRecruiter);
router.get('/recruiter/profile', protect, recruiterOnly, getRecruiterProfile);
router.put('/recruiter/profile', protect, recruiterOnly, updateRecruiterProfile);

module.exports = router; 