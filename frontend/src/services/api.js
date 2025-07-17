import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL ? `${import.meta.env.VITE_BACKEND_URL}/api` : 'http://localhost:5001/api';

export { API_URL };

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});


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


export const candidateService = {

  async register(formData) {
    try {
      const response = await axios.post(
        `${API_URL}/auth/candidate/register`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('userRole', 'candidate');
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },


  async login(email, password) {
    try {
      const response = await api.post('/auth/candidate/login', { email, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('userRole', 'candidate');
        localStorage.setItem('user', JSON.stringify(response.data.data));
        

        window.dispatchEvent(new Event('auth-change'));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },


  async getProfile() {
    try {
      const response = await api.get('/auth/candidate/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Update candidate profile
  async updateProfile(formData) {
    try {
      const response = await api.put('/auth/candidate/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        // Update cached user data
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          skills: response.data.data.skills,
          experience: response.data.data.experience,
          resumePath: response.data.data.resumePath,
          hasResume: response.data.data.hasResume
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
};

// Recruiter Auth Services
export const recruiterService = {
  // Register recruiter
  async register(userData) {
    try {
      const response = await api.post('/auth/recruiter/register', userData);
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('userRole', 'recruiter');
        localStorage.setItem('user', JSON.stringify(response.data.data));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Login recruiter
  async login(email, password) {
    try {
      const response = await api.post('/auth/recruiter/login', { email, password });
      
      if (response.data.success) {
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('userRole', 'recruiter');
        localStorage.setItem('user', JSON.stringify(response.data.data));
        
        // Notify of authentication change
        window.dispatchEvent(new Event('auth-change'));
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get recruiter profile
  async getProfile() {
    try {
      const response = await api.get('/auth/recruiter/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
};

// Common Auth Services
export const authService = {
  // Check if user is logged in
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  // Get user role
  getUserRole() {
    return localStorage.getItem('userRole');
  },

  // Get user data
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    
    // Dispatch an event to notify components of auth change
    window.dispatchEvent(new Event('auth-change'));
  },
  
  // Helper to notify components of login
  notifyLogin() {
    window.dispatchEvent(new Event('auth-change'));
  }
};

// Candidates Service
export const candidatesService = {
  // Get all candidates
  async getAllCandidates() {
    try {
      const response = await api.get('/candidates');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Schedule an interview
  async scheduleInterview(interviewData) {
    try {
      const response = await api.post('/candidates/interviews', interviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get resume analysis for a candidate
  async getResumeAnalysis(candidateId) {
    try {
      const response = await api.get(`/resume/analysis/${candidateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Parse a resume for a candidate
  async parseResume(candidateId) {
    try {
      const response = await api.post(`/resume/parse/${candidateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get a candidate by ID
  async getCandidateById(candidateId) {
    try {
      const response = await api.get(`/candidates/${candidateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

// Resume Suggestions Service
export const resumeSuggestionService = {
  // Get general resume improvement suggestions
  async getGeneralSuggestions(candidateId) {
    try {
      const response = await api.get(`/resume-suggestions/${candidateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get job-specific resume improvement suggestions
  async getJobSpecificSuggestions(candidateId, jobId) {
    try {
      const response = await api.get(`/resume-suggestions/${candidateId}/job/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

// Job-Candidate Matching Service
export const matchingService = {
  // Match a candidate to a job
  async matchCandidateToJob(candidateId, jobId) {
    try {
      const response = await api.get(`/match/job/${jobId}/candidate/${candidateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Match a candidate to all jobs
  async matchCandidateToJobs(candidateId) {
    try {
      const response = await api.get(`/match/candidate/${candidateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Match a job to all candidates
  async matchJobToCandidates(jobId) {
    try {
      const response = await api.get(`/match/job/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

// Application Pipeline Service
export const applicationService = {
  // Create a new application
  async createApplication(applicationData) {
    try {
      const response = await api.post('/applications', applicationData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Update application stage
  async updateApplicationStage(applicationId, stageData) {
    try {
      const response = await api.put(`/applications/${applicationId}/stage`, stageData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get applications for a job
  async getJobApplications(jobId, filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/applications/job/${jobId}?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get applications for a candidate
  async getCandidateApplications(candidateId) {
    try {
      const response = await api.get(`/applications/candidate/${candidateId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get pipeline analytics
  async getPipelineAnalytics() {
    try {
      const response = await api.get('/applications/pipeline/analytics');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Check if candidate has already applied for a job
  async checkApplicationExists(jobId) {
    try {
      const response = await api.get(`/applications/check/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

// Analytics Service
export const analyticsService = {
  // Get dashboard analytics
  async getDashboardAnalytics(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/analytics/dashboard?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get job analytics
  async getJobAnalytics(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/analytics/jobs?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get candidate analytics
  async getCandidateAnalytics(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/analytics/candidates?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get interview analytics
  async getInterviewAnalytics(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const response = await api.get(`/analytics/interviews?${queryParams}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

// Job Services
export const jobService = {
  // Create a new job
  async createJob(jobData) {
    try {
      const response = await api.post('/jobs', jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get all jobs (with optional filters)
  async getJobs(filters = {}) {
    try {
      const response = await api.get('/jobs', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get a job by ID
  async getJobById(jobId) {
    try {
      const response = await api.get(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Update a job
  async updateJob(jobId, jobData) {
    try {
      const response = await api.put(`/jobs/${jobId}`, jobData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Delete a job
  async deleteJob(jobId) {
    try {
      const response = await api.delete(`/jobs/${jobId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  // Get jobs created by the recruiter
  async getRecruiterJobs() {
    try {
      const response = await api.get('/jobs/recruiter/list');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

// Interview Services
export const interviewService = {
  // Create a new interview request (recruiter)
  async createInterview(interviewData) {
    try {
      const response = await api.post('/interviews', interviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Get interviews for recruiters
  async getRecruiterInterviews() {
    try {
      const response = await api.get('/interviews/recruiter');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Get interviews for candidates
  async getCandidateInterviews() {
    try {
      const response = await api.get('/interviews/candidate');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Get a single interview by ID
  async getInterviewById(id) {
    try {
      const response = await api.get(`/interviews/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Update interview status
  async updateInterviewStatus(id, status) {
    try {
      // First, get the interview details to ensure we have the applicationId
      const interviewDetails = await this.getInterviewById(id);
      const applicationId = interviewDetails.data?.applicationId;
      
      // Update the interview status
      const response = await api.put(`/interviews/${id}/status`, { status });
      
      // If interview is cancelled and we have an applicationId, update the application stage
      if (status === 'cancelled' && applicationId) {
        try {
          console.log(`Updating application ${applicationId} stage to interview_cancelled`);
          // Update the application stage to reflect the interview cancellation
          await applicationService.updateApplicationStage(applicationId, {
            stage: 'interview_cancelled',
            notes: 'Interview was cancelled by the recruiter'
          });
        } catch (appError) {
          console.error('Error updating application stage:', appError);
          // We don't throw this error as the interview status update was successful
        }
      } else if (status === 'cancelled' && response.data.success && response.data.data.applicationId) {
        // Fallback to using the applicationId from the response if available
        try {
          console.log(`Fallback: Updating application ${response.data.data.applicationId} stage to interview_cancelled`);
          await applicationService.updateApplicationStage(response.data.data.applicationId, {
            stage: 'interview_cancelled',
            notes: 'Interview was cancelled by the recruiter'
          });
        } catch (appError) {
          console.error('Error updating application stage (fallback):', appError);
        }
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Add feedback to an interview
  async addFeedback(id, feedbackData) {
    try {
      const response = await api.put(`/interviews/${id}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Submit feedback for an interview
  async submitFeedback(id, feedbackData) {
    try {
      const response = await api.post(`/interviews/${id}/feedback`, feedbackData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Get feedback for an interview
  async getFeedback(id) {
    try {
      const response = await api.get(`/interviews/${id}/feedback`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },
  
  // Update feedback visibility
  async updateFeedbackVisibility(id, isShared) {
    try {
      const response = await api.patch(`/interviews/${id}/feedback/visibility`, { isShared });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

export default api; 