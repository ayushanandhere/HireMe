import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const API_URL = `${BACKEND_URL}/api`;
const SESSION_VALIDATION_TTL_MS = 5 * 60 * 1000;
const SESSION_VALIDATED_AT_KEY = 'authValidatedAt';
const SESSION_VALIDATED_TOKEN_KEY = 'authValidatedToken';

export { API_URL, BACKEND_URL };

export const buildAssetUrl = (path = '') => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${BACKEND_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const openBlobInNewTab = (blob) => {
  const objectUrl = window.URL.createObjectURL(blob);
  window.open(objectUrl, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => window.URL.revokeObjectURL(objectUrl), 60_000);
};

const downloadBlob = (blob, filename) => {
  const objectUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(objectUrl);
};

const getStoredValidationTimestamp = () => Number(localStorage.getItem(SESSION_VALIDATED_AT_KEY) || 0);

const markSessionValidated = (token) => {
  if (!token) return;
  localStorage.setItem(SESSION_VALIDATED_AT_KEY, String(Date.now()));
  localStorage.setItem(SESSION_VALIDATED_TOKEN_KEY, token);
};

const clearSessionValidation = () => {
  localStorage.removeItem(SESSION_VALIDATED_AT_KEY);
  localStorage.removeItem(SESSION_VALIDATED_TOKEN_KEY);
};

const hasFreshValidatedSession = (token) => {
  if (!token) return false;

  const validatedAt = getStoredValidationTimestamp();
  const validatedToken = localStorage.getItem(SESSION_VALIDATED_TOKEN_KEY);

  if (!validatedAt || validatedToken !== token) {
    return false;
  }

  return Date.now() - validatedAt < SESSION_VALIDATION_TTL_MS;
};

export const persistAuthSession = (role, userData) => {
  localStorage.setItem('token', userData.token);
  localStorage.setItem('userRole', role);
  localStorage.setItem('user', JSON.stringify(userData));
  markSessionValidated(userData.token);
  window.dispatchEvent(new Event('auth-change'));
};

export const getGoogleAuthUrl = (role, mode = 'login') => {
  const params = new URLSearchParams({ mode });
  return `${API_URL}/auth/${role}/google?${params.toString()}`;
};

export const googleAuthService = {
  async authenticate(role, credential) {
    try {
      const response = await api.post('/auth/google/credential', { role, credential });

      if (response.data.success) {
        persistAuthSession(role, response.data.data);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Google authentication failed' };
    }
  },
};

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
        persistAuthSession('candidate', response.data.data);
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
        persistAuthSession('candidate', response.data.data);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  getGoogleAuthUrl(mode = 'login') {
    return getGoogleAuthUrl('candidate', mode);
  },

  async getProfile() {
    try {
      const response = await api.get('/auth/candidate/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async getDashboardSummary() {
    try {
      const response = await api.get('/auth/candidate/dashboard-summary');
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
          ...response.data.data,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('auth-change'));
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
        persistAuthSession('recruiter', response.data.data);
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
        persistAuthSession('recruiter', response.data.data);
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

  async getDashboardSummary() {
    try {
      const response = await api.get('/auth/recruiter/dashboard-summary');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async updateProfile(userData) {
    try {
      const requestConfig =
        userData instanceof FormData
          ? {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            }
          : undefined;
      const response = await api.put('/auth/recruiter/profile', userData, requestConfig);

      if (response.data.success) {
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        const updatedUser = {
          ...currentUser,
          ...response.data.data,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        window.dispatchEvent(new Event('auth-change'));
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  getGoogleAuthUrl(mode = 'login') {
    return getGoogleAuthUrl('recruiter', mode);
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

  getDefaultRoute(user = authService.getUser()) {
    if (!user?.role) {
      return '/login';
    }

    if (user.needsProfileCompletion === true) {
      return `/complete-profile/${user.role}`;
    }

    return user.role === 'candidate' ? '/dashboard/candidate' : '/dashboard/recruiter';
  },

  async validateSession() {
    const token = localStorage.getItem('token');
    if (!token) {
      return { isValid: false };
    }

    const role = localStorage.getItem('userRole');
    const existingUser = authService.getUser();

    if (!role || !['candidate', 'recruiter'].includes(role)) {
      authService.logout();
      return { isValid: false };
    }

    if (existingUser?.role === role && hasFreshValidatedSession(token)) {
      return {
        isValid: true,
        user: {
          ...existingUser,
          token,
        },
      };
    }

    try {
      const response = await api.get(`/auth/${role}/profile`);

      if (!response.data?.success) {
        throw new Error('Session validation failed');
      }

      const nextUser = {
        ...(existingUser || {}),
        ...response.data.data,
        token,
      };

      localStorage.setItem('user', JSON.stringify(nextUser));
      localStorage.setItem('userRole', role);
      markSessionValidated(token);
      return { isValid: true, user: nextUser };
    } catch (error) {
      const status = error.response?.status;

      if ([401, 403, 404].includes(status)) {
        authService.logout();
        return { isValid: false };
      }

      if (existingUser?.role === role) {
        return {
          isValid: true,
          user: {
            ...existingUser,
            token,
          },
          stale: true,
        };
      }

      return {
        isValid: false,
        message: error.response?.data?.message || 'Session validation failed',
      };
    }
  },

  async requestPasswordReset(role, email) {
    try {
      const response = await api.post(`/auth/${role}/forgot-password`, { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Unable to start password reset' };
    }
  },

  async resetPassword(role, token, password) {
    try {
      const response = await api.post(`/auth/${role}/reset-password/${token}`, { password });

      if (response.data.success) {
        persistAuthSession(role, response.data.data);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Unable to reset password' };
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    clearSessionValidation();
    
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
  },

  async viewResume(candidateId) {
    try {
      const response = await api.get(`/candidates/resume/view/${candidateId}`, {
        responseType: 'blob',
      });
      openBlobInNewTab(response.data);
      return { success: true };
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Unable to open resume' };
    }
  },

  async downloadResume(candidateId, fileName = `candidate-${candidateId}-resume.pdf`) {
    try {
      const response = await api.get(`/candidates/resume/${candidateId}`, {
        responseType: 'blob',
      });
      downloadBlob(response.data, fileName);
      return { success: true };
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Unable to download resume' };
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

  async getApplicationById(applicationId) {
    try {
      const response = await api.get(`/applications/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async parseResume(applicationId) {
    try {
      const response = await api.post(`/applications/${applicationId}/parse-resume`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async viewApplicationResume(applicationId, scope = 'submitted') {
    try {
      const response = await api.get(`/applications/${applicationId}/resume/view?scope=${scope}`, {
        responseType: 'blob',
      });
      openBlobInNewTab(response.data);
      return { success: true };
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Unable to open resume' };
    }
  },

  async downloadApplicationResume(applicationId, scope = 'submitted', fileName = 'resume.pdf') {
    try {
      const response = await api.get(`/applications/${applicationId}/resume/download?scope=${scope}`, {
        responseType: 'blob',
      });
      downloadBlob(response.data, fileName);
      return { success: true };
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Unable to download resume' };
    }
  },

  async acceptForInterview(applicationId) {
    try {
      const response = await api.post(`/applications/${applicationId}/accept-for-interview`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async reject(applicationId, reason) {
    try {
      const response = await api.post(`/applications/${applicationId}/reject`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async getResumeAnalysis(applicationId) {
    try {
      const response = await api.get(`/applications/${applicationId}/resume-analysis`);
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

export const aiTrainingService = {
  async getTrainingContext(applicationId) {
    try {
      const response = await api.get(`/ai/training-context/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async sendTrainingMessage(payload) {
    try {
      const response = await api.post('/ai/training-assistant', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async listTrainingConversations(applicationId) {
    try {
      const response = await api.get(`/ai/training-conversations/${applicationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async createTrainingConversation(applicationId, payload = {}) {
    try {
      const response = await api.post(`/ai/training-conversations/${applicationId}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async getTrainingConversation(conversationId) {
    try {
      const response = await api.get(`/ai/training-conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async updateTrainingConversation(conversationId, payload) {
    try {
      const response = await api.patch(`/ai/training-conversation/${conversationId}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async deleteTrainingConversation(conversationId) {
    try {
      const response = await api.delete(`/ai/training-conversation/${conversationId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

export const mockInterviewService = {
  async initialize(payload) {
    try {
      const response = await api.post('/ai/mock-interview/initialize', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async processAnswer(payload) {
    try {
      const response = await api.post('/ai/mock-interview/process-answer', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  },

  async finalize(payload) {
    try {
      const response = await api.post('/ai/mock-interview/finalize', payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Network error' };
    }
  }
};

export default api; 
