/**
 * Video Conferencing Service
 * Handles video meeting creation and management
 */

const crypto = require('crypto');
const Interview = require('../models/interviewModel');

const DEFAULT_STUN_SERVERS = [
  'stun:stun.l.google.com:19302',
  'stun:stun1.l.google.com:19302'
];

const createHttpError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class VideoService {
  normalizeBaseUrl(baseUrl = '') {
    return (baseUrl || process.env.FRONTEND_URL || '').replace(/\/+$/, '');
  }

  buildMeetingLink(interviewId, baseUrl = '') {
    const normalizedBaseUrl = this.normalizeBaseUrl(baseUrl);
    const meetingPath = `/interview/${interviewId}/meeting`;
    return normalizedBaseUrl ? `${normalizedBaseUrl}${meetingPath}` : meetingPath;
  }

  getIceServers() {
    const configuredJson = process.env.WEBRTC_ICE_SERVERS_JSON;

    if (configuredJson) {
      try {
        const parsed = JSON.parse(configuredJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (error) {
        console.warn('Failed to parse WEBRTC_ICE_SERVERS_JSON. Falling back to default ICE servers.');
      }
    }

    const stunUrls = (process.env.WEBRTC_STUN_URLS || DEFAULT_STUN_SERVERS.join(','))
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const iceServers = stunUrls.length > 0 ? [{ urls: stunUrls }] : [];

    if (process.env.WEBRTC_TURN_URL) {
      iceServers.push({
        urls: process.env.WEBRTC_TURN_URL,
        username: process.env.WEBRTC_TURN_USERNAME || '',
        credential: process.env.WEBRTC_TURN_CREDENTIAL || ''
      });
    }

    return iceServers;
  }

  async getAuthorizedInterview(interviewId, user) {
    const interview = await Interview.findById(interviewId);

    if (!interview) {
      throw createHttpError('Interview not found', 404);
    }

    if (!user?._id || !user?.role) {
      throw createHttpError('Authentication required', 401);
    }

    const userId = user._id.toString();
    const isCandidate = user.role === 'candidate' && interview.candidate.toString() === userId;
    const isRecruiter = user.role === 'recruiter' && interview.recruiter.toString() === userId;

    if (!isCandidate && !isRecruiter) {
      throw createHttpError('Not authorized to access this meeting', 403);
    }

    if (['cancelled', 'rejected'].includes(interview.status)) {
      throw createHttpError(`This interview has been ${interview.status}`, 409);
    }

    return interview;
  }

  serializeMeeting(interview, user, baseUrl = '') {
    return {
      meetingId: interview.meetingId,
      meetingLink: interview.meetingLink || this.buildMeetingLink(interview._id, baseUrl),
      interviewId: interview._id,
      scheduledDateTime: interview.scheduledDateTime,
      duration: interview.duration,
      status: interview.status,
      participantRole: user?.role || null,
      iceServers: this.getIceServers()
    };
  }

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
  async createOrUpdateMeeting(interviewId, baseUrl = '') {
    try {
      const interview = await Interview.findById(interviewId);
      
      if (!interview) {
        throw createHttpError('Interview not found', 404);
      }
      
      let didChange = false;

      // Generate a meeting ID if one doesn't exist
      if (!interview.meetingId) {
        interview.meetingId = this.generateMeetingId(interviewId);
        didChange = true;
      }

      const nextMeetingLink = this.buildMeetingLink(interview._id, baseUrl);
      if (nextMeetingLink && interview.meetingLink !== nextMeetingLink) {
        interview.meetingLink = nextMeetingLink;
        didChange = true;
      }

      if (didChange) {
        await interview.save();
      }
      
      return this.serializeMeeting(interview, null, baseUrl);
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
  async getMeetingDetails(interviewId, user, baseUrl = '') {
    try {
      const interview = await this.getAuthorizedInterview(interviewId, user);
      const expectedMeetingLink = this.buildMeetingLink(interview._id, baseUrl);

      if (!interview.meetingId || interview.meetingLink !== expectedMeetingLink) {
        return this.createOrUpdateMeeting(interviewId, baseUrl);
      }
      
      return this.serializeMeeting(interview, user, baseUrl);
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
  async getMeetingUrl(interviewId, user, baseUrl = '') {
    try {
      const meeting = await this.getMeetingDetails(interviewId, user, baseUrl);
      return meeting.meetingLink;
    } catch (error) {
      console.error('Error generating meeting URL:', error);
      throw error;
    }
  }
}

module.exports = new VideoService();
