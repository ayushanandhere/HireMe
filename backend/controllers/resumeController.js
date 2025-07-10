const path = require('path');
const asyncHandler = require('express-async-handler');
const Candidate = require('../models/candidateModel');
const ResumeParserService = require('../services/resumeParserService');
const AIService = require('../services/aiService');

// @desc    Upload and parse resume
// @route   POST /api/resume/parse
// @access  Private
const parseResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('No resume file uploaded');
  }

  try {
    const filePath = req.file.path;
    
    // First update candidate status to pending if it's a candidate
    if (req.user && req.user.role === 'candidate') {
      try {
        const candidate = req.user.role === 'candidate' ? 
          await Candidate.findById(req.user._id) : 
          await Candidate.findOne({ user: req.user._id });
        
        if (candidate) {
          candidate.resumeParsingStatus = 'pending';
          await candidate.save();
        }
      } catch (statusUpdateError) {
        // Log but continue
        console.error('Error updating parsing status to pending:', statusUpdateError);
      }
    }
    
    // Get AI-enhanced parsing results
    let parsedData;
    try {
      parsedData = await ResumeParserService.parseResume(filePath);
      
      if (!parsedData) {
        throw new Error('No data returned from resume parser');
      }
      
      // If there's an error property in the parsed data but overall parsing succeeded
      if (parsedData.error) {
        console.warn('Partial parsing success with warnings:', parsedData.error);
      }
    } catch (parsingError) {
      // Handle parsing errors
      console.error('Resume parsing error:', parsingError);
      
      // Update candidate status to failed
      await updateParsingStatus(req.user, 'failed');
      
      return res.status(400).json({
        success: false,
        message: 'Failed to parse the resume. Please try a different file.',
        error: parsingError.message
      });
    }
    
    // If the user is a candidate, update their profile with parsed data
    if (req.user && req.user.role === 'candidate') {
      try {
        // Find candidate by user ID or directly if candidate model
        const candidate = req.user.role === 'candidate' ? 
          await Candidate.findById(req.user._id) : 
          await Candidate.findOne({ user: req.user._id });
        
        if (candidate) {
          // Update with parsed data
          candidate.parsedSkills = parsedData.skills || [];
          candidate.skills = Array.isArray(parsedData.skills) ? 
            parsedData.skills.join(', ') : parsedData.skills;
          
          // Handle experience data
          if (Array.isArray(parsedData.experience)) {
            // AI format - convert to string representation
            candidate.experience = parsedData.experience
              .map(exp => `${exp.role || ''} at ${exp.company || ''}`).join(', ');
            
            // Store structured experience data
            candidate.parsedExperience = parsedData.experience;
          } else {
            candidate.experience = parsedData.experience || '';
          }
          
          // Store structured education data if available
          if (Array.isArray(parsedData.education)) {
            candidate.parsedEducation = parsedData.education;
          }
          
          // Store ATS score
          candidate.atsScore = parsedData.atsScore || 0;
          
          candidate.resumePath = filePath;
          candidate.parsedResumeDate = new Date();
          candidate.resumeParsingStatus = 'completed';
          
          await candidate.save();
        }
      } catch (candidateUpdateError) {
        console.error('Error updating candidate profile:', candidateUpdateError);
        // Don't fail the request, but log and include warning in response
        parsedData.warnings = ['Your profile was not fully updated due to an error. Please try again or contact support.'];
      }
    }

    res.status(200).json({
      success: true,
      data: parsedData
    });
  } catch (error) {
    console.error('Resume parsing error:', error);
    
    // Update status to failed if candidate exists
    await updateParsingStatus(req.user, 'failed');
    
    // Provide more helpful error messages based on error type
    let errorMessage = 'Resume parsing failed';
    if (error.code === 'ENOENT') {
      errorMessage = 'File not found or inaccessible';
    } else if (error.message && error.message.includes('password')) {
      errorMessage = 'PDF file is password protected';
    } else if (error.message && error.message.includes('corrupted')) {
      errorMessage = 'File appears to be corrupted';
    }
    
    res.status(500).json({
      success: false,
      message: `${errorMessage}: ${error.message}`
    });
  }
});

// Helper function to update the parsing status of a candidate
const updateParsingStatus = async (user, status) => {
  if (!user || !user.role) return;
  
  try {
    if (user.role === 'candidate') {
      const candidate = user.role === 'candidate' ? 
        await Candidate.findById(user._id) : 
        await Candidate.findOne({ user: user._id });
      
      if (candidate) {
        candidate.resumeParsingStatus = status;
        await candidate.save();
      }
    }
  } catch (e) {
    console.error(`Error updating parsing status to ${status}:`, e);
  }
};

// @desc    Get resume analysis for a candidate
// @route   GET /api/resume/analysis/:id
// @access  Private
const getResumeAnalysis = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    // Check if current user is authorized to view this candidate's data
    // Allow if user is a recruiter or if candidate is viewing their own data
    if (req.user.role !== 'recruiter') {
      // If not a recruiter, check if user is viewing their own profile
      const isOwnProfile = req.user.role === 'candidate' && req.user._id.toString() === candidateId;
      
      if (!isOwnProfile) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to view this resume analysis'
        });
      }
    }
    
    // Find the candidate
    const candidate = await Candidate.findById(candidateId);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if resume has been parsed
    if (candidate.resumeParsingStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Resume has not been parsed yet',
        status: candidate.resumeParsingStatus
      });
    }
    
    // Return the analysis
    res.status(200).json({
      success: true,
      data: {
        candidateId: candidate._id,
        name: candidate.name,
        email: candidate.email,
        skills: candidate.parsedSkills || [],
        experience: candidate.parsedExperience || [],
        education: candidate.parsedEducation || [],
        atsScore: candidate.atsScore || 0,
        parsedDate: candidate.parsedResumeDate,
        resumePath: candidate.resumePath,
        status: candidate.resumeParsingStatus
      }
    });
  } catch (error) {
    console.error('Error getting resume analysis:', error);
    res.status(500).json({
      success: false,
      message: `Failed to get resume analysis: ${error.message}`
    });
  }
});

// @desc    Parse resume for a specific candidate
// @route   POST /api/resume/parse/:id
// @access  Private
const parseResumeById = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.params.id;
    
    // Check if current user is authorized to parse this candidate's resume
    // Allow if user is a recruiter or if candidate is parsing their own resume
    if (req.user.role !== 'recruiter') {
      // If not a recruiter, check if user is parsing their own resume
      const isOwnProfile = req.user.role === 'candidate' && req.user._id.toString() === candidateId;
      
      if (!isOwnProfile) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to parse this resume'
        });
      }
    }
    
    // Find the candidate
    const candidate = await Candidate.findById(candidateId);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if candidate has a resume
    if (!candidate.resumePath) {
      return res.status(400).json({
        success: false,
        message: 'Candidate does not have a resume uploaded'
      });
    }
    
    // Set parsing status to pending
    candidate.resumeParsingStatus = 'pending';
    await candidate.save();
    
    // Get AI-enhanced parsing results
    let parsedData;
    try {
      parsedData = await ResumeParserService.parseResume(candidate.resumePath);
      
      if (!parsedData) {
        throw new Error('No data returned from resume parser');
      }
      
      // If there's an error property in the parsed data but overall parsing succeeded
      if (parsedData.error) {
        console.warn('Partial parsing success with warnings:', parsedData.error);
      }
    } catch (parsingError) {
      // Handle parsing errors
      console.error('Resume parsing error:', parsingError);
      
      // Update candidate status to failed
      await updateParsingStatus(req.user, 'failed');
      
      return res.status(400).json({
        success: false,
        message: 'Failed to parse the resume. Please try a different file.',
        error: parsingError.message
      });
    }
    
    // Update candidate with parsed data
    candidate.parsedSkills = parsedData.skills || [];
    candidate.skills = Array.isArray(parsedData.skills) ? 
      parsedData.skills.join(', ') : parsedData.skills;
    
    // Handle experience data
    if (Array.isArray(parsedData.experience)) {
      // AI format - convert to string representation
      candidate.experience = parsedData.experience
        .map(exp => `${exp.role || ''} at ${exp.company || ''}`).join(', ');
      
      // Store structured experience data
      candidate.parsedExperience = parsedData.experience;
    } else {
      candidate.experience = parsedData.experience || '';
    }
    
    // Store structured education data if available
    if (Array.isArray(parsedData.education)) {
      candidate.parsedEducation = parsedData.education;
    }
    
    // Store ATS score
    candidate.atsScore = parsedData.atsScore || 0;
    
    candidate.parsedResumeDate = new Date();
    candidate.resumeParsingStatus = 'completed';
    
    await candidate.save();
    
    res.status(200).json({
      success: true,
      message: 'Resume parsed successfully',
      data: parsedData
    });
  } catch (error) {
    console.error('Error parsing resume by ID:', error);
    
    // Update parsing status to failed if candidate exists
    if (req.params.id) {
      try {
        const candidate = await Candidate.findById(req.params.id);
        if (candidate) {
          candidate.resumeParsingStatus = 'failed';
          await candidate.save();
        }
      } catch (e) {
        console.error('Error updating parsing status:', e);
      }
    }
    
    res.status(500).json({
      success: false,
      message: `Failed to parse resume: ${error.message}`
    });
  }
});

module.exports = {
  parseResume,
  getResumeAnalysis,
  parseResumeById
}; 