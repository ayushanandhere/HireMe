const asyncHandler = require('express-async-handler');
const Job = require('../models/jobModel');
const AIService = require('../services/aiService');

/**
 * Create a new job posting
 * @route POST /api/jobs
 * @access Private (recruiters only)
 */
const createJob = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    company,
    location,
    type,
    skills,
    experienceLevel,
    experienceYears,
    salaryRange,
    applicationDeadline,
    educationRequirements
  } = req.body;

  // Validate required fields
  if (!title || !description || !company) {
    res.status(400);
    throw new Error('Please provide job title, description, and company');
  }

  try {
    // Create job
    const job = await Job.create({
      title,
      description,
      company,
      location,
      type,
      skills: Array.isArray(skills) ? skills : skills?.split(',').map(s => s.trim()),
      experienceLevel,
      experienceYears,
      salaryRange,
      applicationDeadline,
      educationRequirements,
      recruiter: req.user._id,
      status: 'published'
    });

    res.status(201).json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get all job postings
 * @route GET /api/jobs
 * @access Public
 */
const getJobs = asyncHandler(async (req, res) => {
  try {
    const { search, skills, type, experienceLevel, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = {};
    
    // Add search term
    if (search) {
      query.$text = { $search: search };
    }
    
    // Add filters
    if (skills) {
      const skillsArray = skills.split(',').map(s => s.trim());
      query.skills = { $in: skillsArray };
    }
    
    if (type) {
      query.type = type;
    }
    
    if (experienceLevel) {
      query.experienceLevel = experienceLevel;
    }
    
    // Only published jobs
    query.status = 'published';
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const jobs = await Job.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // Get total count
    const totalJobs = await Job.countDocuments(query);
    
    res.json({
      success: true,
      count: jobs.length,
      total: totalJobs,
      pages: Math.ceil(totalJobs / parseInt(limit)),
      currentPage: parseInt(page),
      data: jobs
    });
  } catch (error) {
    console.error('Error getting jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get a single job by ID
 * @route GET /api/jobs/:id
 * @access Public
 */
const getJobById = asyncHandler(async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error getting job:', error);
    res.status(error.kind === 'ObjectId' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Update a job
 * @route PUT /api/jobs/:id
 * @access Private (job creator only)
 */
const updateJob = asyncHandler(async (req, res) => {
  try {
    // Find job
    let job = await Job.findById(req.params.id);
    
    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }
    
    // Check ownership
    if (job.recruiter.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this job');
    }
    
    // Format skills if provided
    if (req.body.skills && !Array.isArray(req.body.skills)) {
      req.body.skills = req.body.skills.split(',').map(s => s.trim());
    }
    
    // Update job
    job = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.json({
      success: true,
      data: job
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(error.kind === 'ObjectId' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Delete a job
 * @route DELETE /api/jobs/:id
 * @access Private (job creator only)
 */
const deleteJob = asyncHandler(async (req, res) => {
  try {
    // Find job
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }
    
    // Check ownership
    if (job.recruiter.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this job');
    }
    
    // Delete job
    await job.deleteOne();
    
    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting job:', error);
    res.status(error.kind === 'ObjectId' ? 404 : 500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Match a candidate to a job - Deprecated, use matchController instead
 * This endpoint is maintained for backward compatibility but redirects to the new endpoint
 * @route GET /api/jobs/:jobId/match/:candidateId
 * @access Private (recruiters only)
 */
const matchCandidateToJob = asyncHandler(async (req, res) => {
  // Redirect to the new endpoint
  res.status(308).json({
    success: false,
    message: 'This endpoint is deprecated. Please use /api/match/job/:id for job-candidate matching.',
    redirectTo: `/api/match/job/${req.params.jobId}`
  });
});

/**
 * Get jobs created by the recruiter
 * @route GET /api/jobs/recruiter
 * @access Private (recruiters only)
 */
const getRecruiterJobs = asyncHandler(async (req, res) => {
  try {
    const { status, limit = 10, page = 1 } = req.query;
    
    // Build query
    const query = { recruiter: req.user._id };
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Execute query
    const jobs = await Job.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });
    
    // Get total count
    const totalJobs = await Job.countDocuments(query);
    
    res.json({
      success: true,
      count: jobs.length,
      total: totalJobs,
      pages: Math.ceil(totalJobs / parseInt(limit)),
      currentPage: parseInt(page),
      data: jobs
    });
  } catch (error) {
    console.error('Error getting recruiter jobs:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  matchCandidateToJob,
  getRecruiterJobs
}; 