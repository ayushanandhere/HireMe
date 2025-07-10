/**
 * Video Conferencing Service
 * Handles video meeting creation and management
 */

const crypto = require('crypto');
const Interview = require('../models/interviewModel');

class VideoService {
  /**
   * Generate a unique meeting ID for an interview
   * @param {string} interviewId - The MongoDB ID of the interview
   * @returns {string} - A unique meeting ID
   */
  generateMeetingId(interviewId) {
    // Create a hash of the interview ID to ensure uniqueness
    // We'll use a shorter hash (10 characters) for better UX
    return crypto
      .createHash('sha256')
      .update(interviewId.toString())
      .digest('hex')
      .substring(0, 10);
  }

  /**
   * Create or update meeting details for an interview
   * @param {string} interviewId - The MongoDB ID of the interview
   * @returns {Promise<Object>} - The meeting details
   */
  async createOrUpdateMeeting(interviewId) {
    try {
      const interview = await Interview.findById(interviewId);
      
      if (!interview) {
        throw new Error('Interview not found');
      }
      
      // Generate a meeting ID if one doesn't exist
      if (!interview.meetingId) {
        const meetingId = this.generateMeetingId(interviewId);
        
        // Update the interview with the meeting ID
        interview.meetingId = meetingId;
        await interview.save();
      }
      
      return {
        meetingId: interview.meetingId,
        interviewId: interview._id,
        scheduledDateTime: interview.scheduledDateTime
      };
    } catch (error) {
      console.error('Error creating/updating meeting:', error);
      throw error;
    }
  }

  /**
   * Get meeting details for an interview
   * @param {string} interviewId - The MongoDB ID of the interview
   * @returns {Promise<Object>} - The meeting details
   */
  async getMeetingDetails(interviewId) {
    try {
      const interview = await Interview.findById(interviewId);
      
      if (!interview) {
        throw new Error('Interview not found');
      }
      
      // If no meeting ID exists, create one
      if (!interview.meetingId) {
        return this.createOrUpdateMeeting(interviewId);
      }
      
      return {
        meetingId: interview.meetingId,
        interviewId: interview._id,
        scheduledDateTime: interview.scheduledDateTime
      };
    } catch (error) {
      console.error('Error getting meeting details:', error);
      throw error;
    }
  }

  /**
   * Generate a direct meeting URL for an interview
   * @param {string} interviewId - The MongoDB ID of the interview
   * @param {string} baseUrl - The base URL of the frontend application
   * @returns {Promise<string>} - The meeting URL
   */
  async getMeetingUrl(interviewId, baseUrl = '') {
    try {
      const meeting = await this.getMeetingDetails(interviewId);
      return `${baseUrl}/interview/${interviewId}/meeting`;
    } catch (error) {
      console.error('Error generating meeting URL:', error);
      throw error;
    }
  }
}

module.exports = new VideoService();
