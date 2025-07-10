const express = require('express');
const router = express.Router();
const { protect, recruiterOnly } = require('../middleware/authMiddleware');
const { getAllCandidates, scheduleInterview, getCandidateById } = require('../controllers/candidatesController');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');
const Recruiter = require('../models/recruiterModel');

// Protected routes for recruiters only
router.get('/', protect, recruiterOnly, getAllCandidates);
router.post('/interviews', protect, recruiterOnly, scheduleInterview);
router.get('/:id', protect, recruiterOnly, getCandidateById);

// Common function to verify token from query param
const verifyTokenFromQuery = async (req, res, next) => {
  try {
    const token = req.query.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided'
      });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a recruiter
    if (decoded.role !== 'recruiter') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized, recruiters only'
      });
    }
    
    // Find the recruiter
    const recruiter = await Recruiter.findById(decoded.id);
    if (!recruiter) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    // Add user to request
    req.user = recruiter;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Public resume download route with token in query
router.get('/resume/download/:id', verifyTokenFromQuery, async (req, res) => {
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
    const resumePath = path.join(__dirname, '..', candidate.resumePath);
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume file not found' 
      });
    }
    
    // Send file
    res.download(resumePath);
  } catch (error) {
    console.error('Error downloading resume:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error downloading resume', 
      error: error.message 
    });
  }
});

// Public resume view route with token in query
router.get('/resume/view/:id', verifyTokenFromQuery, async (req, res) => {
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
    const resumePath = path.join(__dirname, '..', candidate.resumePath);
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume file not found' 
      });
    }
    
    // Set headers to display in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
    
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
    const resumePath = path.join(__dirname, '..', candidate.resumePath);
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume file not found' 
      });
    }
    
    // Send file
    res.download(resumePath);
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
    const resumePath = path.join(__dirname, '..', candidate.resumePath);
    if (!fs.existsSync(resumePath)) {
      return res.status(404).json({ 
        success: false, 
        message: 'Resume file not found' 
      });
    }
    
    // Set headers to display in browser
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="resume.pdf"');
    
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