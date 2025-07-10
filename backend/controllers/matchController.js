const asyncHandler = require('express-async-handler');
const Job = require('../models/jobModel');
const Candidate = require('../models/candidateModel');
const AIService = require('../services/aiService');

// @desc    Match candidate to jobs
// @route   GET /api/match/candidate/:id
// @access  Private (recruiters only)
const matchCandidateToJobs = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.params.id;
    
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
    
    // Get active jobs
    const jobs = await Job.find({ status: 'published' }).limit(10);
    
    // If no jobs found
    if (!jobs || jobs.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No active jobs found to match against',
        matches: []
      });
    }
    
    // Prepare candidate data
    const candidateData = {
      skills: candidate.parsedSkills || [],
      experience: candidate.parsedExperience || [],
      education: candidate.parsedEducation || []
    };
    
    // Match candidate to each job
    const matchResults = await Promise.all(jobs.map(async (job) => {
      try {
        const jobData = {
          title: job.title,
          description: job.description,
          skills: job.skills,
          experienceLevel: job.experienceLevel,
          experienceYears: job.experienceYears,
          educationRequirements: job.educationRequirements
        };
        
        const matchResult = await AIService.matchResumeToJob(candidateData, jobData);
        
        return {
          jobId: job._id,
          jobTitle: job.title,
          company: job.company,
          matchPercentage: matchResult.matchPercentage,
          overallMatch: matchResult.overallMatch,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          experienceRelevance: matchResult.experienceRelevance,
          suggestions: matchResult.suggestions
        };
      } catch (error) {
        console.error(`Error matching candidate to job ${job._id}:`, error);
        return {
          jobId: job._id,
          jobTitle: job.title,
          error: 'Failed to calculate match score',
          matchPercentage: 0,
          overallMatch: 0
        };
      }
    }));
    
    // Sort results by overall match score (highest first)
    const sortedMatches = matchResults.sort((a, b) => b.overallMatch - a.overallMatch);
    
    res.status(200).json({
      success: true,
      candidateId: candidate._id,
      candidateName: candidate.name,
      matches: sortedMatches
    });
  } catch (error) {
    console.error('Error in candidate matching:', error);
    res.status(500).json({
      success: false,
      message: `Failed to match candidate to jobs: ${error.message}`
    });
  }
});

// @desc    Match job to candidates
// @route   GET /api/match/job/:id
// @access  Private (recruiters only)
const matchJobToCandidates = asyncHandler(async (req, res) => {
  try {
    const jobId = req.params.id;
    
    // Find the job
    const job = await Job.findById(jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }
    
    // Get candidates with parsed resumes
    const candidates = await Candidate.find({ 
      resumeParsingStatus: 'completed'
    }).limit(20);
    
    // If no candidates found
    if (!candidates || candidates.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No candidates with parsed resumes found',
        matches: []
      });
    }
    
    // Prepare job requirements
    const jobData = {
      title: job.title,
      description: job.description,
      skills: job.skills,
      experienceYears: job.experienceYears,
      experienceLevel: job.experienceLevel,
      educationRequirements: job.educationRequirements
    };
    
    // Match job to each candidate
    const matchResults = await Promise.all(candidates.map(async (candidate) => {
      try {
        // Prepare candidate data
        const candidateData = {
          skills: candidate.parsedSkills || [],
          experience: candidate.parsedExperience || [],
          education: candidate.parsedEducation || []
        };
        
        const matchResult = await AIService.matchResumeToJob(candidateData, jobData);
        
        return {
          candidateId: candidate._id,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          matchPercentage: matchResult.matchPercentage,
          overallMatch: matchResult.overallMatch,
          matchedSkills: matchResult.matchedSkills,
          missingSkills: matchResult.missingSkills,
          experienceRelevance: matchResult.experienceRelevance,
          suggestions: matchResult.suggestions
        };
      } catch (error) {
        console.error(`Error matching job to candidate ${candidate._id}:`, error);
        return {
          candidateId: candidate._id,
          candidateName: candidate.name,
          error: 'Failed to calculate match score',
          matchPercentage: 0,
          overallMatch: 0
        };
      }
    }));
    
    // Sort results by overall match score (highest first)
    const sortedMatches = matchResults.sort((a, b) => b.overallMatch - a.overallMatch);
    
    res.status(200).json({
      success: true,
      jobId: job._id,
      jobTitle: job.title,
      matches: sortedMatches
    });
  } catch (error) {
    console.error('Error in job matching:', error);
    res.status(500).json({
      success: false,
      message: `Failed to match job to candidates: ${error.message}`
    });
  }
});

// @desc    Calculate ATS Score for a resume
// @route   GET /api/match/ats/:id
// @access  Private
const calculateAtsScore = asyncHandler(async (req, res) => {
  try {
    const candidateId = req.params.id;
    
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
    
    // Recalculate ATS score if we have parsed skills
    if (!candidate.parsedSkills || candidate.parsedSkills.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Resume does not have parsed skills for ATS scoring'
      });
    }
    
    // Generate an object with the parsed resume data
    const parsedData = {
      skills: candidate.parsedSkills || [],
      experience: candidate.parsedExperience || [],
      education: candidate.parsedEducation || []
    };
    
    // Calculate ATS score using the AI service
    const atsScore = AIService.calculateAtsScore(parsedData, candidate.resumeText || '');
    
    // Update candidate with ATS score
    candidate.atsScore = atsScore;
    await candidate.save();
    
    res.status(200).json({
      success: true,
      candidateId: candidate._id,
      candidateName: candidate.name,
      atsScore: atsScore
    });
  } catch (error) {
    console.error('Error calculating ATS score:', error);
    res.status(500).json({
      success: false,
      message: `Failed to calculate ATS score: ${error.message}`
    });
  }
});

module.exports = {
  matchCandidateToJobs,
  matchJobToCandidates,
  calculateAtsScore
}; 