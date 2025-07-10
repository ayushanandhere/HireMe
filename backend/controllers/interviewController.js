const Interview = require('../models/interviewModel');
const Candidate = require('../models/candidateModel');
const Recruiter = require('../models/recruiterModel');
const mongoose = require('mongoose');
const { createInterviewRequestNotification, createInterviewStatusNotification, createFeedbackNotification } = require('./notificationController');
const { io } = require('../server');

/**
 * Create a new interview request
 * @route POST /api/interviews
 * @access Private/Recruiter
 */
const createInterview = async (req, res) => {
  try {
    const { candidateId, position, scheduledDateTime, duration, notes } = req.body;
    
    // Validate required fields
    if (!candidateId || !position?.title || !scheduledDateTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Check if candidate exists
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid candidate ID'
      });
    }
    
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }
    
    // Create the interview request
    const interview = await Interview.create({
      candidate: candidateId,
      recruiter: req.user._id,
      position,
      scheduledDateTime: new Date(scheduledDateTime),
      duration: duration || 60,
      notes,
      status: 'pending',
      applicationId: req.body.applicationId || null // Save the applicationId if provided
    });
    
    // Populate the interview with candidate and recruiter data
    const populatedInterview = await Interview.findById(interview._id)
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email company');
    
    // Create notification for the candidate
    try {
      await createInterviewRequestNotification(populatedInterview);
    } catch (notificationError) {
      console.error('Error creating interview notification:', notificationError);
      // Continue even if notification fails
    }

    // ---> ADDED: Emit socket event to the specific candidate <---
    // Assumes candidate model has a 'user' field linking to the User model _id
    // Also assumes the frontend client joins a room 'user-<userId>' upon connection
    if (populatedInterview.candidate && populatedInterview.candidate.user) {
       const candidateUserId = populatedInterview.candidate.user.toString();
       io.to(`user-${candidateUserId}`).emit('new_interview_request', populatedInterview);
       console.log(`Emitted 'new_interview_request' to user room: user-${candidateUserId}`);
    } else {
       console.warn('Could not emit new_interview_request: Candidate or candidate.user field missing/not populated.');
       // Attempt to populate candidate.user if necessary - requires schema change if 'user' field doesn't exist
       // Or adjust logic to find the correct user ID if the structure is different
    }
    // ---> END ADDED <---
    
    res.status(201).json({
      success: true,
      data: populatedInterview,
      message: 'Interview request created successfully'
    });
  } catch (error) {
    console.error('Error creating interview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating interview request'
    });
  }
};

/**
 * Get all interviews for a recruiter
 * @route GET /api/interviews/recruiter
 * @access Private/Recruiter
 */
const getRecruiterInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ recruiter: req.user._id })
      .populate('candidate', 'name email skills experience')
      .sort({ scheduledDateTime: 1 });
    
    res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error('Error fetching recruiter interviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching interviews'
    });
  }
};

/**
 * Get all interviews for a candidate
 * @route GET /api/interviews/candidate
 * @access Private/Candidate
 */
const getCandidateInterviews = async (req, res) => {
  try {
    const interviews = await Interview.find({ candidate: req.user._id })
      .populate('recruiter', 'name email company')
      .sort({ scheduledDateTime: 1 });
    
    res.json({
      success: true,
      data: interviews
    });
  } catch (error) {
    console.error('Error fetching candidate interviews:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching interviews'
    });
  }
};

/**
 * Update interview status (accept/reject/cancel)
 * @route PUT /api/interviews/:id/status
 * @access Private
 */
const updateInterviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    if (!status || !['pending', 'accepted', 'rejected', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status'
      });
    }
    
    // Find the interview
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check permissions
    // If candidate, can only accept or reject
    if (req.user.role === 'candidate') {
      if (interview.candidate.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this interview'
        });
      }
      
      if (!['accepted', 'rejected'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Candidates can only accept or reject interview requests'
        });
      }
    }
    
    // If recruiter, can cancel or mark as completed
    if (req.user.role === 'recruiter') {
      if (interview.recruiter.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to update this interview'
        });
      }
      
      if (!['cancelled', 'completed'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Recruiters can only cancel or complete interviews'
        });
      }
    }
    
    // Update status
    interview.status = status;
    
    // If accepting, generate meeting link
    if (status === 'accepted' && !interview.meetingLink) {
      // For now, just create a simple placeholder
      // In a real implementation, integrate with Google Meet API or similar
      const meetingId = Math.random().toString(36).substring(2, 12);
      interview.meetingLink = `https://meet.example.com/${meetingId}`;
    }
    
    // If cancelling, update the associated application status
    if (status === 'cancelled' && interview.applicationId) {
      try {
        // Import the Application model
        const Application = require('../models/applicationModel');
        
        // Find and update the application
        const application = await Application.findById(interview.applicationId);
        
        if (application) {
          // Update the application stage to 'interview_cancelled'
          application.stage = 'interview_cancelled';
          
          // Add to history
          application.history.push({
            stage: 'interview_cancelled',
            timestamp: Date.now(),
            notes: 'Interview was cancelled by the recruiter',
            updatedBy: req.user._id
          });
          
          await application.save();
          console.log(`Updated application ${application._id} stage to interview_cancelled`);
        }
      } catch (appError) {
        console.error('Error updating application stage:', appError);
        // Continue even if application update fails
      }
    }
    
    await interview.save();
    
    // Populate data for notification and socket emission
    // Ensure 'user' field is populated if it exists on Candidate/Recruiter models
    const populatedInterview = await Interview.findById(req.params.id)
      .populate('candidate', 'name email user')
      .populate('recruiter', 'name email company user')
      .populate('applicationId');

    // Create notification based on status change
    try {
      // Pass the user role who initiated the change if needed by notificationController
      await createInterviewStatusNotification(populatedInterview, status, req.user.role);
    } catch (notificationError) {
      console.error('Error creating status update notification:', notificationError);
      // Continue even if notification fails
    }

    // ---> ADDED: Emit socket event to both candidate and recruiter <---
    // Assumes candidate/recruiter models have a 'user' field linking to the User model _id
    // Also assumes the frontend client joins a room 'user-<userId>' upon connection
    if (populatedInterview.candidate && populatedInterview.candidate.user) {
        const candidateUserId = populatedInterview.candidate.user.toString();
        io.to(`user-${candidateUserId}`).emit('interview_status_update', populatedInterview);
        console.log(`Emitted 'interview_status_update' to candidate room: user-${candidateUserId}`);
    } else {
      console.warn('Could not emit interview_status_update to candidate: Candidate or candidate.user field missing/not populated.');
    }

    if (populatedInterview.recruiter && populatedInterview.recruiter.user) {
        const recruiterUserId = populatedInterview.recruiter.user.toString();
        io.to(`user-${recruiterUserId}`).emit('interview_status_update', populatedInterview);
        console.log(`Emitted 'interview_status_update' to recruiter room: user-${recruiterUserId}`);
    } else {
      console.warn('Could not emit interview_status_update to recruiter: Recruiter or recruiter.user field missing/not populated.');
    }
    // ---> END ADDED <---

    res.json({
      success: true,
      data: populatedInterview,
      message: `Interview ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating interview status:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating interview status'
    });
  }
};

/**
 * Add feedback to an interview
 * @route PUT /api/interviews/:id/feedback
 * @access Private/Recruiter
 */
const addInterviewFeedback = async (req, res) => {
  try {
    const { technical, communication, problemSolving, overall, isShared } = req.body;
    
    // Find the interview
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check permissions
    if (interview.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add feedback to this interview'
      });
    }
    
    // Update feedback
    interview.feedback = {
      technical,
      communication,
      problemSolving,
      overall,
      isShared: isShared || false
    };
    
    // If interview is completed, mark it as such
    if (interview.status !== 'completed') {
      interview.status = 'completed';
    }
    
    await interview.save();
    
    res.json({
      success: true,
      data: interview,
      message: 'Feedback added successfully'
    });
  } catch (error) {
    console.error('Error adding feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error adding feedback'
    });
  }
};

/**
 * Get a single interview by ID
 * @route GET /api/interviews/:id
 * @access Private
 */
const getInterviewById = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.id)
      .populate('candidate', 'name email skills experience')
      .populate('recruiter', 'name email company');
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // For video conferencing, we need to be more permissive with authorization
    // Allow access if the user is either the candidate or recruiter associated with this interview
    let isAuthorized = false;
    
    if (req.user.role === 'candidate') {
      // Check if the logged-in candidate is the one in the interview
      // The candidate field might be populated or just an ID
      const candidateId = interview.candidate._id || interview.candidate;
      isAuthorized = candidateId.toString() === req.user._id.toString();
    } else if (req.user.role === 'recruiter') {
      // Check if the logged-in recruiter is the one in the interview
      // The recruiter field might be populated or just an ID
      const recruiterId = interview.recruiter._id || interview.recruiter;
      isAuthorized = recruiterId.toString() === req.user._id.toString();
    }
    
    if (!isAuthorized) {
      console.log(`Authorization failed for ${req.user.role} ${req.user._id} to view interview ${interview._id}`);
      console.log(`Interview candidate: ${interview.candidate}, recruiter: ${interview.recruiter}`);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this interview'
      });
    }
    
    // If user is a candidate and feedback is not shared, remove it
    if (req.user.role === 'candidate' && interview.feedback && !interview.feedback.isShared) {
      interview.feedback = undefined;
    }
    
    res.json({
      success: true,
      data: interview
    });
  } catch (error) {
    console.error('Error fetching interview:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching interview'
    });
  }
};

/**
 * Submit feedback for an interview
 * @route POST /api/interviews/:id/feedback
 * @access Private/Recruiter
 */
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { technical, communication, problemSolving, overall, comments, isShared } = req.body;
    
    // Validate input
    if (!technical || !communication || !problemSolving || !overall) {
      return res.status(400).json({
        success: false,
        message: 'Please provide scores for all categories'
      });
    }
    
    // Validate score ranges
    const scores = [technical, communication, problemSolving, overall];
    if (scores.some(score => score < 0 || score > 10)) {
      return res.status(400).json({
        success: false,
        message: 'Scores must be between 0 and 10'
      });
    }
    
    // Find the interview
    const interview = await Interview.findById(id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if the recruiter owns this interview
    if (interview.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to submit feedback for this interview'
      });
    }
    
    // Update interview with feedback
    interview.feedback = {
      technical: {
        score: technical,
        comments: comments?.technical || ''
      },
      communication: {
        score: communication,
        comments: comments?.communication || ''
      },
      problemSolving: {
        score: problemSolving,
        comments: comments?.problemSolving || ''
      },
      overall: {
        score: overall,
        comments: comments?.overall || ''
      },
      isShared: isShared || false
    };
    
    // Update status to completed if not already
    if (interview.status !== 'completed') {
      interview.status = 'completed';
    }
    
    await interview.save();
    
    res.status(200).json({
      success: true,
      data: interview.feedback,
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error submitting feedback'
    });
  }
};

/**
 * Get feedback for an interview
 * @route GET /api/interviews/:id/feedback
 * @access Private
 */
const getFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the interview with populated data
    const interview = await Interview.findById(id)
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email company');
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if user is authorized to view this feedback
    const isCandidate = interview.candidate._id.toString() === req.user._id.toString();
    const isRecruiter = interview.recruiter._id.toString() === req.user._id.toString();
    
    if (!isCandidate && !isRecruiter) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to view this feedback'
      });
    }
    
    // If user is candidate and feedback is not shared, deny access
    if (isCandidate && !interview.feedback?.isShared) {
      return res.status(403).json({
        success: false,
        message: 'This feedback has not been shared with you yet'
      });
    }
    
    // Return feedback data
    res.status(200).json({
      success: true,
      data: {
        interviewId: interview._id,
        candidateName: interview.candidate.name,
        recruiterName: interview.recruiter.name,
        position: interview.position,
        scheduledDateTime: interview.scheduledDateTime,
        feedback: interview.feedback || null
      }
    });
  } catch (error) {
    console.error('Error getting feedback:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error retrieving feedback'
    });
  }
};

/**
 * Update feedback visibility
 * @route PATCH /api/interviews/:id/feedback/visibility
 * @access Private/Recruiter
 */
const updateFeedbackVisibility = async (req, res) => {
  try {
    const { isShared } = req.body;
    
    if (typeof isShared !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isShared must be a boolean value'
      });
    }
    
    const interview = await Interview.findById(req.params.id);
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Only recruiters can update feedback visibility
    if (interview.recruiter.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this interview'
      });
    }
    
    // Check if feedback exists
    if (!interview.feedback || !interview.feedback.overall) {
      return res.status(400).json({
        success: false,
        message: 'No feedback available to share'
      });
    }
    
    // Update feedback visibility
    interview.feedback.isShared = isShared;
    await interview.save();
    
    // Get the fully populated interview
    const updatedInterview = await Interview.findById(req.params.id)
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email company');
    
    // Create notification if feedback is being shared
    if (isShared) {
      try {
        await createFeedbackNotification(updatedInterview, true);
      } catch (notificationError) {
        console.error('Error creating feedback notification:', notificationError);
        // Continue even if notification fails
      }
    }
    
    res.json({
      success: true,
      data: updatedInterview,
      message: `Feedback is now ${isShared ? 'visible' : 'hidden'} to the candidate`
    });
  } catch (error) {
    console.error('Error updating feedback visibility:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating feedback visibility'
    });
  }
};

module.exports = {
  createInterview,
  getRecruiterInterviews,
  getCandidateInterviews,
  updateInterviewStatus,
  addInterviewFeedback,
  getInterviewById,
  submitFeedback,
  getFeedback,
  updateFeedbackVisibility
}; 