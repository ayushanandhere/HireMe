const asyncHandler = require('express-async-handler');
const Application = require('../models/applicationModel');
const PipelineService = require('../services/pipelineService');
const Job = require('../models/jobModel');
const Candidate = require('../models/candidateModel');
const AIService = require('../services/aiService');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const pdfParse = require('pdf-parse');
const { safeRemoveFile } = require('../utils/fileCleanup');
const { resolveStoredFilePath, storedFileExists, getStoredFileName } = require('../utils/storedFiles');
const { buildCandidateApplicationSnapshot } = require('../utils/profileSerializers');
const {
  APPLICATION_STAGES,
  getApplicationStageCounts,
  isValidApplicationStage,
  serializeApplication,
  transitionApplication
} = require('../utils/applicationStages');

const assertRecruiterOwnsJob = async (jobId, recruiterId) => {
  const job = await Job.findById(jobId);

  if (!job) {
    const error = new Error('Job not found');
    error.statusCode = 404;
    throw error;
  }

  if (job.recruiter.toString() !== recruiterId.toString()) {
    const error = new Error('Not authorized to access applications for this job');
    error.statusCode = 403;
    throw error;
  }

  return job;
};

const getAuthorizedApplication = async (applicationId, user) => {
  const application = await Application.findById(applicationId)
    .populate({
      path: 'job',
      populate: {
        path: 'recruiter',
        select: 'name company title location bio companyWebsite companySize industry profilePicturePath'
      }
    })
    .populate('candidate', '-password');

  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  const recruiterOwnsJob = user.role === 'recruiter'
    && application.job?.recruiter?._id?.toString() === user._id.toString();
  const candidateOwnsApplication = user.role === 'candidate'
    && application.candidate?._id?.toString() === user._id.toString();

  if (!recruiterOwnsJob && !candidateOwnsApplication) {
    const error = new Error('You do not have permission to access this application');
    error.statusCode = 403;
    throw error;
  }

  return application;
};

const getApplicationResumeContext = (application, scope = 'submitted') => {
  if (scope === 'profile') {
    return {
      filePath: application.candidate?.resumePath || '',
      source: 'profile',
      label: 'candidate profile resume'
    };
  }

  return {
    filePath: application.resumePath || '',
    source: application.resumeSource || 'profile',
    label: application.resumeSource === 'job-specific'
      ? 'job-specific submitted resume'
      : 'submitted profile resume'
  };
};

/**
 * Create a new application
 * @route   POST /api/applications
 * @access  Private
 */
const createApplication = asyncHandler(async (req, res) => {
  try {
    const { jobId, notes } = req.body;
    const candidateId = req.user._id.toString();
    let resumePath = null;
    
    // Validate input
    if (!jobId) {
      safeRemoveFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: 'Job ID is required'
      });
    }
    
    // Check if application already exists
    const existingApplication = await Application.findOne({
      candidate: candidateId,
      job: jobId
    });
    
    if (existingApplication) {
      safeRemoveFile(req.file?.path);
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
      safeRemoveFile(req.file?.path);
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    if (!job) {
      safeRemoveFile(req.file?.path);
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'published') {
      safeRemoveFile(req.file?.path);
      return res.status(400).json({
        success: false,
        message: 'Applications can only be created for published jobs'
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
      candidateNotes: notes,
      resumePath: resumePath || candidate.resumePath, // Store the resume path
      resumeSource: resumePath ? 'job-specific' : 'profile',
      submittedProfile: buildCandidateApplicationSnapshot(candidate),
      createdBy: req.user._id
    });
    
    await application.save();

    const createdApplication = await Application.findById(application._id)
      .populate('job', 'title company location type')
      .populate('candidate', 'name email skills experience');
    
    res.status(201).json({
      success: true,
      data: serializeApplication(createdApplication)
    });
  } catch (error) {
    safeRemoveFile(req.file?.path);
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

    if (!isValidApplicationStage(stage)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application stage'
      });
    }
    
    // Find application
    const application = await Application.findById(id).populate('job');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    transitionApplication(application, stage, {
      notes,
      updatedBy: req.user._id
    });
    
    // Update notes if provided
    if (notes) {
      application.notes = notes;
    }
    
    // Save changes
    await application.save();

    const updatedApplication = await Application.findById(id)
      .populate('job', 'title company location type')
      .populate('candidate', 'name email skills experience');
    
    res.status(200).json({
      success: true,
      data: serializeApplication(updatedApplication)
    });
  } catch (error) {
    console.error('Error updating application stage:', error);
    res.status(error.statusCode || 500).json({
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

    await assertRecruiterOwnsJob(jobId, req.user._id);
    
    // Build query
    const query = { job: jobId };
    
    // Add stage filter if provided
    if (stage && isValidApplicationStage(stage)) {
      query.stage = stage;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Determine sort order
    const sortOptions = {};
    sortOptions[sort] = order === 'asc' ? 1 : -1;
    
    // Execute query
    const applications = await Application.find(query)
      .populate('candidate', 'name email skills experience headline location phone linkedin bio resumePath profilePicturePath parsedSkills atsScore parsedResumeDate resumeParsingStatus updatedAt createdAt')
      .populate({
        path: 'job',
        select: 'title company location type recruiter',
        populate: {
          path: 'recruiter',
          select: 'name company title location bio companyWebsite companySize industry profilePicturePath'
        }
      })
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
      data: applications.map(serializeApplication)
    });
  } catch (error) {
    console.error('Error getting job applications:', error);
    res.status(error.statusCode || 500).json({
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
    
    // Candidates may only access their own application history.
    if (req.user._id.toString() !== candidateId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these applications'
      });
    }
    
    // Get applications
    const applications = await Application.find({ candidate: candidateId })
      .populate({
        path: 'job',
        select: 'title company location type recruiter',
        populate: {
          path: 'recruiter',
          select: 'name company title location bio companyWebsite companySize industry profilePicturePath'
        }
      })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: applications.length,
      data: applications.map(serializeApplication)
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
    const recruiterJobs = await Job.find({ recruiter: req.user._id }).select('_id');
    const jobIds = recruiterJobs.map((job) => job._id);
    const applications = await Application.find({ job: { $in: jobIds } }).select('stage createdAt history');
    const stageCounts = getApplicationStageCounts();

    applications.forEach((application) => {
      if (stageCounts[application.stage] !== undefined) {
        stageCounts[application.stage] += 1;
      }
    });

    const interviewStages = (
      stageCounts[APPLICATION_STAGES.INTERVIEW_REQUESTED] +
      stageCounts[APPLICATION_STAGES.INTERVIEW_SCHEDULED] +
      stageCounts[APPLICATION_STAGES.INTERVIEW_COMPLETED]
    );

    const offerStages = (
      stageCounts[APPLICATION_STAGES.OFFER_EXTENDED] +
      stageCounts[APPLICATION_STAGES.OFFER_ACCEPTED]
    );

    const analytics = {
      stageCounts,
      conversionRates: {
        application_to_interview: applications.length ? Math.round((interviewStages / applications.length) * 100) : 0,
        interview_to_offer: interviewStages ? Math.round((offerStages / interviewStages) * 100) : 0,
        offer_to_acceptance: offerStages ? Math.round((stageCounts[APPLICATION_STAGES.OFFER_ACCEPTED] / offerStages) * 100) : 0,
        overall_conversion: applications.length ? Math.round((stageCounts[APPLICATION_STAGES.OFFER_ACCEPTED] / applications.length) * 100) : 0
      }
    };
    
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
    const application = await getAuthorizedApplication(id, req.user);
    
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
    
    if (!resumePath || !storedFileExists(resumePath)) {
      return res.status(400).json({
        success: false,
        message: 'No resume found for this application'
      });
    }
    
    // Read the resume file
    let resumeText = '';
    try {
      const resolvedResumePath = resolveStoredFilePath(resumePath);
      if (resolvedResumePath.endsWith('.pdf')) {
        const dataBuffer = await readFile(resolvedResumePath);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text;
      } else {
        // For other file types, you might need different parsers
        resumeText = await readFile(resolvedResumePath, 'utf8');
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
    const resumeSource = application.resumeSource === 'job-specific' ? 'job-specific' : 'profile';
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
    transitionApplication(application, APPLICATION_STAGES.SCREENED, {
      notes: 'Resume screened by recruiter',
      updatedBy: req.user._id
    });
    
    await application.save();
    
    res.status(200).json({
      success: true,
      data: {
        application: serializeApplication(application),
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

    if (application.job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this application'
      });
    }

    transitionApplication(application, APPLICATION_STAGES.INTERVIEW_REQUESTED, {
      notes: 'Candidate selected for interview',
      updatedBy: req.user._id
    });
    
    await application.save();
    
    // Send notification to candidate (would be implemented in a notification service)
    
    res.status(200).json({
      success: true,
      data: serializeApplication(application),
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

    const job = await Job.findById(application.job);
    if (!job || job.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to reject this application'
      });
    }

    transitionApplication(application, APPLICATION_STAGES.REJECTED, {
      notes: reason || 'Application rejected',
      updatedBy: req.user._id
    });
    
    await application.save();
    
    // Send notification to candidate (would be implemented in a notification service)
    
    res.status(200).json({
      success: true,
      data: serializeApplication(application),
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
    const application = await getAuthorizedApplication(id, req.user);
    
    // Check if application has been parsed
    if (application.stage === APPLICATION_STAGES.NEW) {
      return res.status(400).json({
        success: false,
        message: 'Resume has not been parsed for this application'
      });
    }
    
    // Determine which resume was used
    const resumeSource = application.resumeSource === 'job-specific' ? 'job-specific' : 'profile';
    
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
    
    if (!resumePath || !storedFileExists(resumePath)) {
      return res.status(400).json({
        success: false,
        message: 'No resume found for this application'
      });
    }
    
    // Read the resume file
    let resumeText = '';
    try {
      const resolvedResumePath = resolveStoredFilePath(resumePath);
      if (resolvedResumePath.endsWith('.pdf')) {
        const dataBuffer = await readFile(resolvedResumePath);
        const pdfData = await pdfParse(dataBuffer);
        resumeText = pdfData.text;
      } else {
        // For other file types, you might need different parsers
        resumeText = await readFile(resolvedResumePath, 'utf8');
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
        application: serializeApplication(application),
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
    const application = await getAuthorizedApplication(id, req.user);

    return res.status(200).json({
      success: true,
      data: serializeApplication(application)
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Server error while fetching application'
    });
  }
});

const viewApplicationResume = asyncHandler(async (req, res) => {
  try {
    const application = await getAuthorizedApplication(req.params.id, req.user);
    const scope = req.query.scope === 'profile' ? 'profile' : 'submitted';
    const resumeContext = getApplicationResumeContext(application, scope);
    const resolvedPath = resolveStoredFilePath(resumeContext.filePath);

    if (!resumeContext.filePath || !storedFileExists(resumeContext.filePath)) {
      return res.status(404).json({
        success: false,
        message: `The ${resumeContext.label} is not available`
      });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${getStoredFileName(resolvedPath)}"`);
    fs.createReadStream(resolvedPath).pipe(res);
  } catch (error) {
    console.error('Error viewing application resume:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error viewing resume'
    });
  }
});

const downloadApplicationResume = asyncHandler(async (req, res) => {
  try {
    const application = await getAuthorizedApplication(req.params.id, req.user);
    const scope = req.query.scope === 'profile' ? 'profile' : 'submitted';
    const resumeContext = getApplicationResumeContext(application, scope);
    const resolvedPath = resolveStoredFilePath(resumeContext.filePath);

    if (!resumeContext.filePath || !storedFileExists(resumeContext.filePath)) {
      return res.status(404).json({
        success: false,
        message: `The ${resumeContext.label} is not available`
      });
    }

    res.download(resolvedPath, getStoredFileName(resolvedPath));
  } catch (error) {
    console.error('Error downloading application resume:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Error downloading resume'
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
  getApplicationById,
  viewApplicationResume,
  downloadApplicationResume
};
