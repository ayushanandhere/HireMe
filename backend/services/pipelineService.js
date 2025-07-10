/**
 * Pipeline Service
 * Manages the automated candidate-job pipeline and application stages
 * Handles job-specific resume parsing and application processing
 */
const Candidate = require('../models/candidateModel');
const Job = require('../models/jobModel');
const AIService = require('./aiService');

// Define pipeline stages
const PIPELINE_STAGES = {
  NEW: 'new_application',
  SCREENED: 'resume_screened',
  MATCHED: 'job_matched',
  INTERVIEW_REQUESTED: 'interview_requested',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_COMPLETED: 'interview_completed',
  OFFER_EXTENDED: 'offer_extended',
  OFFER_ACCEPTED: 'offer_accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

class PipelineService {
  /**
   * Process a new candidate application for a job
   * @param {string} candidateId - Candidate ID
   * @param {string} jobId - Job ID
   * @returns {Promise<Object>} - Application details with pipeline stage
   */
  async processNewApplication(candidateId, jobId, resumePath = null) {
    try {
      // Get candidate and job
      const [candidate, job] = await Promise.all([
        Candidate.findById(candidateId),
        Job.findById(jobId)
      ]);
      
      if (!candidate || !job) {
        throw new Error('Candidate or job not found');
      }
      
      // Create application object
      const application = {
        candidateId: candidate._id,
        candidateName: candidate.name,
        jobId: job._id,
        jobTitle: job.title,
        company: job.company,
        stage: PIPELINE_STAGES.NEW,
        history: [
          {
            stage: PIPELINE_STAGES.NEW,
            timestamp: new Date(),
            notes: 'Application received'
          }
        ],
        atsScore: 0,
        matchScore: 0,
        resumePath: resumePath || candidate.resumePath
      };
      
      // The application is created but not yet analyzed
      // The resume will be parsed job-specifically when requested by the recruiter
      
      return application;
    } catch (error) {
      console.error('Error processing new application:', error);
      throw error;
    }
  }

  /**
   * Update an application stage
   * @param {string} applicationId - Application ID
   * @param {string} stage - New pipeline stage
   * @param {string} notes - Optional notes for the stage change
   * @returns {Promise<Object>} - Updated application
   */
  async updateApplicationStage(applicationId, stage, notes = '') {
    try {
      // In a real implementation, you would:
      // 1. Find the application in the database
      // 2. Update its stage
      // 3. Add to the history
      // 4. Save changes
      
      // For this example, we'll just return a mock updated application
      return {
        _id: applicationId,
        stage,
        updatedAt: new Date(),
        history: [
          // Previous history would be here
          {
            stage,
            timestamp: new Date(),
            notes: notes || `Moved to ${stage} stage`
          }
        ]
      };
    } catch (error) {
      console.error('Error updating application stage:', error);
      throw error;
    }
  }

  /**
   * Get all applications for a job
   * @param {string} jobId - Job ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - List of applications
   */
  async getJobApplications(jobId, filters = {}) {
    try {
      // In a real implementation, you would query the database
      // For this example, return a mock empty array
      return [];
    } catch (error) {
      console.error('Error getting job applications:', error);
      throw error;
    }
  }

  /**
   * Get all applications for a candidate
   * @param {string} candidateId - Candidate ID
   * @param {Object} filters - Optional filters
   * @returns {Promise<Array>} - List of applications
   */
  async getCandidateApplications(candidateId, filters = {}) {
    try {
      // In a real implementation, you would query the database
      // For this example, return a mock empty array
      return [];
    } catch (error) {
      console.error('Error getting candidate applications:', error);
      throw error;
    }
  }

  /**
   * Get pipeline analytics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Pipeline analytics
   */
  async getPipelineAnalytics(filters = {}) {
    try {
      // In a real implementation, you would gather statistics from applications
      // For this example, return mock data
      return {
        stageCounts: {
          [PIPELINE_STAGES.NEW]: 0,
          [PIPELINE_STAGES.SCREENED]: 0,
          [PIPELINE_STAGES.MATCHED]: 0,
          [PIPELINE_STAGES.INTERVIEW_REQUESTED]: 0,
          [PIPELINE_STAGES.INTERVIEW_SCHEDULED]: 0,
          [PIPELINE_STAGES.INTERVIEW_COMPLETED]: 0,
          [PIPELINE_STAGES.OFFER_EXTENDED]: 0,
          [PIPELINE_STAGES.OFFER_ACCEPTED]: 0,
          [PIPELINE_STAGES.REJECTED]: 0,
          [PIPELINE_STAGES.WITHDRAWN]: 0
        },
        conversionRates: {
          application_to_interview: 0,
          interview_to_offer: 0,
          offer_to_acceptance: 0,
          overall_conversion: 0
        },
        averageTimeInStage: {
          [PIPELINE_STAGES.NEW]: 0,
          [PIPELINE_STAGES.SCREENED]: 0,
          [PIPELINE_STAGES.MATCHED]: 0,
          [PIPELINE_STAGES.INTERVIEW_REQUESTED]: 0,
          [PIPELINE_STAGES.INTERVIEW_SCHEDULED]: 0
        }
      };
    } catch (error) {
      console.error('Error getting pipeline analytics:', error);
      throw error;
    }
  }
}

module.exports = new PipelineService(); 