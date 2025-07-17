import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';

const openaiService = {
  // Send a message to the AI assistant
  sendMessage: async (message, interviewId, candidateId, jobId, responseMode = 'normal') => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      const response = await axios.post(
        `${API_URL}/api/ai/interview-assistant`, 
        {
          message,
          interviewId,
          candidateId,
          jobId,
          responseMode
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error sending message to AI assistant:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to communicate with AI assistant'
      };
    }
  },
  
  // Get the initial context for the AI assistant
  getInitialContext: async (interviewId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        return {
          success: false,
          message: 'Authentication required'
        };
      }
      
      const response = await axios.get(
        `${API_URL}/api/ai/interview-context/${interviewId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching AI assistant context:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch AI assistant context'
      };
    }
  }
};

export default openaiService;
