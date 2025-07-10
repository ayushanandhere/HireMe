const asyncHandler = require('express-async-handler');
const Application = require('../models/applicationModel');
const PipelineService = require('../services/pipelineService');
const Job = require('../models/jobModel');
const Candidate = require('../models/candidateModel');
const AIService = require('../services/aiService');
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const pdfParse = require('pdf-parse');

/**
 * Create a new application
 * @route   POST /api/applications
 * @access  Private
 */
const createApplication = asyncHandler(async (req, res) => {
  try {
    const { candidateId, jobId, notes } = req.body;
    let resumePath = null;
    
    // Validate input
    if (!candidateId || !jobId) {
      return res.status(400).json({
        success: false,
        message: 'Candidate ID and Job ID are required'
      });
    }
    
    // Check if application already exists
    const existingApplication = await Application.findOne({
      candidate: candidateId,
      job: jobId
    });
    
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'Application already exists for this candidate and job'
      });
    }
    
    // Get candidate and job
    const [candidate, job] = await Promise.all([
      Candidate.findById(candidateId),
      Job.findById(jobId)
    ]);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Handle resume upload if present
    if (req.file) {
      resumePath = req.file.path;
      console.log(`Job-specific resume uploaded for application: ${resumePath}`);
    } else {
      console.log('No job-specific resume uploaded, will use candidate\'s generic resume if available');
    }
    
    // Process the application through the pipeline service
    const applicationData = await PipelineService.processNewApplication(candidateId, jobId, resumePath);
    
    // Create application in database
    const application = new Application({
      candidate: candidateId,
      job: jobId,
      stage: applicationData.stage,
      history: applicationData.history,
      matchScore: applicationData.matchScore || 0,
      skillsMatch: applicationData.skillsMatch || 0,
      experienceRelevance: applicationData.experienceRelevance || 0,
      matchedSkills: applicationData.matchedSkills || [],
      missingSkills: applicationData.missingSkills || [],
      atsScore: applicationData.atsScore || 0,
      notes,
      resumePath: resumePath || candidate.resumePath, // Store the resume path
      createdBy: req.user._id
    });
    
    await application.save();
    
    res.status(201).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Update application stage
 * @route   PUT /api/applications/:id/stage
 * @access  Private (recruiter only)
 */
const updateApplicationStage = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { stage, notes } = req.body;
    
    // Validate input
    if (!stage) {
      return res.status(400).json({
        success: false,
        message: 'Stage is required'
      });
    }
    
    // Find application
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update stage
    application.stage = stage;
    
    // Add to history
    application.history.push({
      stage,
      timestamp: new Date(),
      notes: notes || `Moved to ${stage} stage`,
      updatedBy: req.user._id
    });
    
    // Update notes if provided
    if (notes) {
      application.notes = notes;
    }
    
    // Save changes
    await application.save();
    
    res.status(200).json({
      success: true,
      data: application
    });
  } catch (error) {
    console.error('Error updating application stage:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get applications for a job
 * @route   GET /api/applications/job/:jobId
 * @access  Private (recruiter only)
 */
const getJobApplications = asyncHandler(async (req, res) => {
  try {
    const { jobId } = req.params;
    const { stage, sort = 'createdAt', order = 'desc', limit = 100, page = 1 } = req.query;
    
    // Build query
    const query = { job: jobId };
    
    // Add stage filter if provided
    if (stage) {
      query.stage = stage;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort order
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Execute query
    const applications = await Application.find(query)
      .populate('candidate', 'name email skills')
      .skip(skip)
      .limit(parseInt(limit))
      .sort(sortOptions);
    
    // Get total count
    const totalApplications = await Application.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: applications.length,
      total: totalApplications,
      pages: Math.ceil(totalApplications / parseInt(limit)),
      currentPage: parseInt(page),
      data: applications
    });
  } catch (error) {
    console.error('Error getting job applications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get applications for a candidate
 * @route   GET /api/applications/candidate/:candidateId
 * @access  Private
 */
const getCandidateApplications = asyncHandler(async (req, res) => {
  try {
    const { candidateId } = req.params;
    
    // Ensure the user has access to this candidate's applications
    if (req.user.role === 'candidate' && req.user._id.toString() !== candidateId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these applications'
      });
    }
    
    // Get applications
    const applications = await Application.find({ candidate: candidateId })
      .populate('job', 'title company location type')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications
    });
  } catch (error) {
    console.error('Error getting candidate applications:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get pipeline analytics
 * @route   GET /api/applications/pipeline/analytics
 * @access  Private (recruiter only)
 */
const getPipelineAnalytics = asyncHandler(async (req, res) => {
  try {
    // Get analytics from pipeline service
    const analytics = await PipelineService.getPipelineAnalytics();
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting pipeline analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Parse resume for a specific job application
 * @route   POST /api/applications/:id/parse-resume
 * @access  Private (recruiter only)
 */
const parseResumeForJobApplication = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find application
    const application = await Application.findById(id)
      .populate('job')
      .populate('candidate');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Determine which resume to use based on context
    // Priority: 1. Application-specific resume (if exists), 2. Candidate's generic resume
    let resumePath = null;
    
    // Check if application has a specific resume attached
    if (application.resumePath) {
      resumePath = application.resumePath;
      console.log(`Using job-specific resume for application ${id}: ${resumePath}`);
    } else if (application.candidate.resumePath) {
      // Fall back to candidate's generic resume if no specific resume was uploaded
      resumePath = application.candidate.resumePath;
      console.log(`Using candidate's generic resume for application ${id}: ${resumePath}`);
    }
    
    if (!resumePath) {
      return res.status(400).json({
        success: false,
        message: 'No resume found for this application'
      });
    }
    
    // Read the resume file
    let resumeText = '';
    try {
      if (resumePath.endsWith('.pdf')) {
        const dataBuffer = await readFile(resumePath);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text;
      } else {
        // For other file types, you might need different parsers
        resumeText = await readFile(resumePath, 'utf8');
      }
    } catch (fileError) {
      console.error('Error reading resume file:', fileError);
      return res.status(500).json({
        success: false,
        message: 'Error reading resume file'
      });
    }
    
    // Prepare job data
    const jobData = {
      title: application.job.title,
      description: application.job.description,
      skills: application.job.skills,
      experienceLevel: application.job.experienceLevel,
      experienceYears: application.job.experienceYears,
      educationRequirements: application.job.educationRequirements
    };
    
    // Determine resume source for logging and tracking
    const resumeSource = application.resumePath ? 'job-specific' : 'generic';
    console.log(`Using ${resumeSource} resume for application ${id}`);
    
    // Parse resume for this specific job
    const parsedData = await AIService.parseResumeForJob(resumeText, jobData, resumeSource);
    
    // Update application with parsed data
    // Use Candidate-Role Fit score from enhanced analysis if available
    if (parsedData.enhancedAnalysis && parsedData.enhancedAnalysis.candidateRoleFit) {
      application.candidateRoleFit = parsedData.enhancedAnalysis.candidateRoleFit.score || 0;
      application.candidateRoleFitExplanation = parsedData.enhancedAnalysis.candidateRoleFit.explanation || '';
    } else {
      application.candidateRoleFit = 0;
      application.candidateRoleFitExplanation = '';
    }
    
    // Still store these for backward compatibility
    application.matchScore = parsedData.jobMatch.overallMatch;
    application.skillsMatch = parsedData.jobMatch.matchPercentage;
    application.experienceRelevance = parsedData.jobMatch.experienceRelevance;
    application.matchedSkills = parsedData.jobMatch.matchedSkills;
    application.missingSkills = parsedData.jobMatch.missingSkills;
    application.atsScore = parsedData.jobSpecificAtsScore;
    
    // Update stage to SCREENED
    application.stage = 'resume_screened';
    application.history.push({
      stage: 'resume_screened',
      timestamp: new Date(),
      notes: 'Resume screened by recruiter',
      updatedBy: req.user._id
    });
    
    await application.save();
    
    res.status(200).json({
      success: true,
      data: {
        application,
        parsedResume: parsedData
      }
    });
  } catch (error) {
    console.error('Error parsing resume for job application:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Accept candidate for interview
 * @route   POST /api/applications/:id/accept-for-interview
 * @access  Private (recruiter only)
 */
const acceptForInterview = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find application
    const application = await Application.findById(id)
      .populate('job')
      .populate('candidate');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update stage to INTERVIEW_REQUESTED
    application.stage = 'interview_requested';
    application.history.push({
      stage: 'interview_requested',
      timestamp: new Date(),
      notes: 'Candidate accepted for interview',
      updatedBy: req.user._id
    });
    
    await application.save();
    
    // Send notification to candidate (would be implemented in a notification service)
    
    res.status(200).json({
      success: true,
      data: application,
      message: 'Candidate accepted for interview'
    });
  } catch (error) {
    console.error('Error accepting candidate for interview:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Reject application
 * @route   POST /api/applications/:id/reject
 * @access  Private (recruiter only)
 */
const rejectApplication = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Find application
    const application = await Application.findById(id);
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Update stage to REJECTED
    application.stage = 'rejected';
    application.history.push({
      stage: 'rejected',
      timestamp: new Date(),
      notes: reason || 'Application rejected',
      updatedBy: req.user._id
    });
    
    await application.save();
    
    // Send notification to candidate (would be implemented in a notification service)
    
    res.status(200).json({
      success: true,
      data: application,
      message: 'Application rejected'
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get resume analysis data for an application
 * @route   GET /api/applications/:id/resume-analysis
 * @access  Private (recruiter only)
 */
const getResumeAnalysis = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find application
    const application = await Application.findById(id)
      .populate('job')
      .populate('candidate');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Check if application has been parsed
    if (application.stage === 'new') {
      return res.status(400).json({
        success: false,
        message: 'Resume has not been parsed for this application'
      });
    }
    
    // Determine which resume was used
    const resumeSource = application.resumePath ? 'job-specific' : 'generic';
    
    // If we have the enhanced analysis data stored in the application, return it
    // Otherwise, we need to parse the resume again to get the enhanced analysis
    let enhancedAnalysis = null;
    
    // Determine which resume to use based on context
    let resumePath = null;
    
    // Check if application has a specific resume attached
    if (application.resumePath) {
      resumePath = application.resumePath;
    } else if (application.candidate.resumePath) {
      // Fall back to candidate's generic resume if no specific resume was uploaded
      resumePath = application.candidate.resumePath;
    }
    
    if (!resumePath) {
      return res.status(400).json({
        success: false,
        message: 'No resume found for this application'
      });
    }
    
    // Read the resume file
    let resumeText = '';
    try {
      if (resumePath.endsWith('.pdf')) {
        const dataBuffer = await readFile(resumePath);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text;
      } else {
        // For other file types, you might need different parsers
        resumeText = await readFile(resumePath, 'utf8');
      }
    } catch (fileError) {
      console.error('Error reading resume file:', fileError);
      return res.status(500).json({
        success: false,
        message: 'Error reading resume file'
      });
    }
    
    // Prepare job data
    const jobData = {
      title: application.job.title,
      description: application.job.description,
      skills: application.job.skills,
      experienceLevel: application.job.experienceLevel,
      experienceYears: application.job.experienceYears,
      educationRequirements: application.job.educationRequirements
    };
    
    // Parse resume for this specific job to get enhanced analysis
    const parsedData = await AIService.parseResumeForJob(resumeText, jobData, resumeSource);
    
    res.status(200).json({
      success: true,
      data: {
        application,
        resumeSource,
        enhancedAnalysis: parsedData.enhancedAnalysis,
        jobMatch: parsedData.jobMatch,
        atsScore: parsedData.jobSpecificAtsScore
      }
    });
  } catch (error) {
    console.error('Error getting resume analysis:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get a single application by ID
 * @route   GET /api/applications/:id
 * @access  Private
 */
const getApplicationById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find application with populated job and candidate
    const application = await Application.findById(id)
      .populate('job')
      .populate('candidate', '-password');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Check if the user has permission to access this application
    const user = req.user;
    
    // Allow access if the user is a recruiter or the candidate who submitted the application
    if (user.role === 'recruiter' || 
        (user.role === 'candidate' && user._id.toString() === application.candidate._id.toString())) {
      return res.status(200).json({
        success: true,
        data: application
      });
    } else {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this application'
      });
    }
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching application'
    });
  }
});

module.exports = {
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
}; 