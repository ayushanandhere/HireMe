const express = require('express');
const router = express.Router();
const { protect, recruiterOnly } = require('../middleware/authMiddleware');
const { getAllCandidates, scheduleInterview, getCandidateById } = require('../controllers/candidatesController');
const fs = require('fs');
const { resolveStoredFilePath, storedFileExists, getStoredFileName } = require('../utils/storedFiles');

// Protected routes for recruiters only
router.get('/', protect, recruiterOnly, getAllCandidates);
router.post('/interviews', protect, recruiterOnly, scheduleInterview);
router.get('/:id', protect, recruiterOnly, getCandidateById);

// Keep the original protected routes for API usage
router.get('/resume/:id', protect, recruiterOnly, async (req, res) => {
  try {
    const Candidate = require('../models/candidateModel');
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate || !candidate.resumePath) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume not found' 
      });
    }
    
    // Check if file exists
    const resumePath = resolveStoredFilePath(candidate.resumePath);
    if (!storedFileExists(candidate.resumePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume file not found' 
      });
    }
    
    // Send file
    res.download(resumePath, getStoredFileName(resumePath));
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading resume', 
      error: error.message 
    });
  }
});

router.get('/resume/view/:id', protect, recruiterOnly, async (req, res) => {
  try {
    const Candidate = require('../models/candidateModel');
    const candidate = await Candidate.findById(req.params.id);
    
    if (!candidate || !candidate.resumePath) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume not found' 
      });
    }
    
    // Check if file exists
    const resumePath = resolveStoredFilePath(candidate.resumePath);
    if (!storedFileExists(candidate.resumePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume file not found' 
      });
    }
    
    // Set headers to display in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${getStoredFileName(resumePath)}"`);
    
    // Stream file
    const fileStream = fs.createReadStream(resumePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error viewing resume:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error viewing resume', 
      error: error.message 
    });
  }
});

module.exports = router; 
