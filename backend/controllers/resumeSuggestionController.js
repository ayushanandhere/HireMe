const asyncHandler = require('express-async-handler');
const Candidate = require('../models/candidateModel');
const Job = require('../models/jobModel');
const AIService = require('../services/aiService');

/**
 * Get resume improvement suggestions based on a specific job
 * @route   GET /api/resume-suggestions/:candidateId/job/:jobId
 * @access  Private
 */
const getResumeSuggestionsForJob = asyncHandler(async (req, res) => {
  try {
    const { candidateId, jobId } = req.params;
    
    // Get candidate and verify ownership or recruiter permissions
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if user has permission to access this candidate's resume
    if (req.user.role === 'candidate' && req.user._id.toString() !== candidate._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume'
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
    
    // Get job details
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Prepare candidate data
    const candidateData = {
      skills: candidate.parsedSkills || [],
      experience: candidate.parsedExperience || [],
      education: candidate.parsedEducation || []
    };
    
    // Prepare job data
    const jobData = {
      title: job.title,
      description: job.description,
      skills: job.skills,
      experienceLevel: job.experienceLevel,
      experienceYears: job.experienceYears,
      educationRequirements: job.educationRequirements
    };
    
    // Generate suggestions
    const suggestions = await AIService.generateResumeImprovementSuggestions(candidateData, jobData);
    
    res.status(200).json({
      success: true,
      candidateId: candidate._id,
      candidateName: candidate.name,
      jobId: job._id,
      jobTitle: job.title,
      suggestions
    });
  } catch (error) {
    console.error('Error generating resume suggestions:', error);
    res.status(500).json({
      success: false,
      message: `Failed to generate resume suggestions: ${error.message}`
    });
  }
});

/**
 * Get general resume improvement suggestions not specific to any job
 * @route   GET /api/resume-suggestions/:candidateId
 * @access  Private
 */
const getGeneralResumeSuggestions = asyncHandler(async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    // Get candidate and verify ownership
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Check if user has permission to access this candidate's resume
    if (req.user.role === 'candidate' && req.user._id.toString() !== candidate._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resume'
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
    
    // Prepare candidate data
    const candidateData = {
      skills: candidate.parsedSkills || [],
      experience: candidate.parsedExperience || [],
      education: candidate.parsedEducation || []
    };
    
    // Create a fake job that encompasses common requirements
    const genericJobData = {
      title: 'Professional Position',
      description: 'A professional position requiring strong communication skills, technical expertise, and organizational abilities.',
      skills: ['communication', 'organization', 'teamwork', 'problem-solving', 'time management'],
      experienceLevel: 'intermediate',
      experienceYears: { min: 2, max: 5 },
      educationRequirements: 'Bachelor\'s degree or equivalent experience'
    };
    
    // Generate suggestions
    const suggestions = await AIService.generateResumeImprovementSuggestions(candidateData, genericJobData);
    
    res.status(200).json({
      success: true,
      candidateId: candidate._id,
      candidateName: candidate.name,
      suggestions
    });
  } catch (error) {
    console.error('Error generating general resume suggestions:', error);
    res.status(500).json({
      success: false,
      message: `Failed to generate resume suggestions: ${error.message}`
    });
  }
});

module.exports = {
  getResumeSuggestionsForJob,
  getGeneralResumeSuggestions
}; 