const Candidate = require('../models/candidateModel');
const Interview = require('../models/interviewModel');
const mongoose = require('mongoose');
const { createInterviewRequestNotification } = require('./notificationController');
const { io } = require('../server');

/**
 * Get all candidates
 * @route GET /api/candidates
 * @access Private/Recruiter
 */
const getAllCandidates = async (req, res) => {
  try {
    // Get all candidates but exclude the password field
    const candidates = await Candidate.find({}).select('-password');
    
    // Format the response data
    const formattedCandidates = candidates.map(candidate => ({
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      skills: candidate.skills,
      experience: candidate.experience,
      resumeId: candidate.resumePath ? candidate._id : null,
      hasResume: !!candidate.resumePath,
      role: candidate.role,
      createdAt: candidate.createdAt
    }));
    
    res.json({
      success: true,
      data: formattedCandidates
    });
  } catch (error) {
    console.error('Error fetching candidates:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving candidates'
    });
  }
};

/**
 * Get a candidate by ID
 * @route GET /api/candidates/:id
 * @access Private/Recruiter
 */
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).select('-password');
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Format the candidate data
    const formattedCandidate = {
      _id: candidate._id,
      name: candidate.name,
      email: candidate.email,
      skills: candidate.skills,
      experience: candidate.experience,
      resumeId: candidate.resumePath ? candidate._id : null,
      hasResume: !!candidate.resumePath,
      role: candidate.role,
      createdAt: candidate.createdAt,
      // Include resume parsing fields if they exist
      parsedSkills: candidate.parsedSkills || [],
      parsedExperience: candidate.parsedExperience || [],
      parsedEducation: candidate.parsedEducation || [],
      atsScore: candidate.atsScore || 0,
      parsedResumeDate: candidate.parsedResumeDate,
      resumeParsingStatus: candidate.resumeParsingStatus || 'not_started'
    };
    
    res.json({
      success: true,
      data: formattedCandidate
    });
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving candidate'
    });
  }
};

/**
 * Schedule an interview
 * @route POST /api/candidates/interviews
 * @access Private/Recruiter
 */
const scheduleInterview = async (req, res) => {
  try {
    const { candidateId, interviewerName, dateTime, round } = req.body;
    
    // Validate the candidateId
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate ID'
      });
    }
    
    // Check if the candidate exists
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Create the interview data
    const interviewData = {
      candidate: candidateId,
      recruiter: req.user._id,
      position: {
        title: round, // Using round as the position title for now
        department: interviewerName // Using interviewerName as department for now 
      },
      scheduledDateTime: new Date(dateTime),
      duration: 60, // Default duration in minutes
      status: 'pending' // Set as pending until candidate accepts
    };
    
    // Create the interview in the database
    const interview = await Interview.create(interviewData);
    
    // Populate the interview with candidate and recruiter data for notifications
    const populatedInterview = await Interview.findById(interview._id)
      .populate('candidate', 'name email user')
      .populate('recruiter', 'name email company user');
    
    // Create notification for the candidate
    try {
      await createInterviewRequestNotification(populatedInterview);
    } catch (notificationError) {
      console.error('Error creating interview notification:', notificationError);
      // Continue even if notification fails
    }

    // Emit socket event to the specific candidate if user ID available
    try {
      if (candidate.user) {
        io.to(`user-${candidate.user.toString()}`).emit('new_interview_request', populatedInterview);
        console.log(`Emitted 'new_interview_request' to user room: user-${candidate.user.toString()}`);
      } else {
        console.warn('Could not emit socket event: candidate.user field missing');
        // Still continue without socket emission
      }
    } catch (socketError) {
      console.error('Error emitting socket event:', socketError);
      // Continue even if socket emission fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Interview scheduled successfully',
      data: populatedInterview
    });
  } catch (error) {
    console.error('Error scheduling interview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error scheduling interview'
    });
  }
};

module.exports = {
  getAllCandidates,
  scheduleInterview,
  getCandidateById
}; 