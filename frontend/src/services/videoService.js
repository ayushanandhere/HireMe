import axios from 'axios';
import { API_URL } from './api';

// Create an axios instance with authentication
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Video conferencing service
const videoService = {
  /**
   * Get meeting details for an interview
   * @param {string} interviewId - The interview ID
   * @returns {Promise<Object>} - Meeting details
   */
  async getMeetingDetails(interviewId) {
    try {
      const response = await api.get(`/video/${interviewId}/details`);
      return response.data;
    } catch (error) {
      console.error('Error getting meeting details:', error);
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  /**
   * Get meeting URL for an interview
   * @param {string} interviewId - The interview ID
   * @returns {Promise<Object>} - Meeting URL
   */
  async getMeetingUrl(interviewId) {
    try {
      // Get the base URL of the current application
      const baseUrl = window.location.origin;
      const response = await api.get(`/video/${interviewId}/url?baseUrl=${baseUrl}`);
      return response.data;
    } catch (error) {
      console.error('Error getting meeting URL:', error);
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  /**
   * Join a meeting by interview ID
   * @param {string} interviewId - The interview ID
   * @returns {string} - The URL to redirect to
   */
  getJoinMeetingUrl(interviewId) {
    return `/interview/${interviewId}/meeting`;
  }
};

export default videoService;
