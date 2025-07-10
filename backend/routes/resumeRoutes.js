const express = require('express');
const router = express.Router();
const { parseResume, getResumeAnalysis, parseResumeById } = require('../controllers/resumeController');
const { upload } = require('../middleware/uploadMiddleware');
const { protect, recruiterOnly } = require('../middleware/authMiddleware');

// General resume upload and parsing (for candidates)
// @route   POST /api/resume/parse
// @desc    Upload and parse resume
// @access  Private
router.post('/parse', protect, upload.single('resume'), parseResume);

// Get analysis of a parsed resume (for recruiters and the candidate themselves)
// @route   GET /api/resume/analysis/:id
// @desc    Get resume analysis for a candidate
// @access  Private
router.get('/analysis/:id', protect, getResumeAnalysis);

// Parse existing resume for a specific candidate (for recruiters and the candidate themselves)
// @route   POST /api/resume/parse/:id
// @desc    Parse resume for a specific candidate
// @access  Private
router.post('/parse/:id', protect, parseResumeById);

module.exports = router; 