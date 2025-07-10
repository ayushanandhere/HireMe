/**
 * Analytics Service
 * Provides recruiting and applicant tracking insights
 */
const Candidate = require('../models/candidateModel');
const Job = require('../models/jobModel');
const Interview = require('../models/interviewModel');

class AnalyticsService {
  /**
   * Get job application analytics
   * @param {Object} filters - Optional filters (date range, job types, etc.)
   * @returns {Promise<Object>} - Job application statistics
   */
  async getJobAnalytics(filters = {}) {
    try {
      // Get all jobs, possibly filtered
      const query = {};
      
      // Apply date filter if provided
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }
      
      // Apply status filter if provided
      if (filters.status) {
        query.status = filters.status;
      }
      
      // Apply recruiter filter if provided
      if (filters.recruiterId) {
        query.recruiter = filters.recruiterId;
      }
      
      // Get jobs
      const jobs = await Job.find(query);
      
      // Calculate basic statistics
      const totalJobs = jobs.length;
      const activeJobs = jobs.filter(job => job.status === 'published').length;
      const closedJobs = jobs.filter(job => job.status === 'closed').length;
      const archivedJobs = jobs.filter(job => job.status === 'archived').length;
      
      // Calculate jobs by type
      const jobsByType = {};
      jobs.forEach(job => {
        jobsByType[job.type] = (jobsByType[job.type] || 0) + 1;
      });
      
      // Calculate jobs by experience level
      const jobsByExperienceLevel = {};
      jobs.forEach(job => {
        jobsByExperienceLevel[job.experienceLevel] = (jobsByExperienceLevel[job.experienceLevel] || 0) + 1;
      });
      
      // Calculate jobs by creation date (for trend analysis)
      const jobsByDate = {};
      jobs.forEach(job => {
        const date = job.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        jobsByDate[date] = (jobsByDate[date] || 0) + 1;
      });
      
      // Return compiled analytics
      return {
        totalJobs,
        activeJobs,
        closedJobs,
        archivedJobs,
        jobsByType,
        jobsByExperienceLevel,
        jobsByDate,
        rawJobs: filters.includeRaw ? jobs : undefined
      };
    } catch (error) {
      console.error('Error getting job analytics:', error);
      throw new Error(`Failed to get job analytics: ${error.message}`);
    }
  }

  /**
   * Get candidate analytics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Candidate statistics
   */
  async getCandidateAnalytics(filters = {}) {
    try {
      // Get all candidates, possibly filtered
      const query = {};
      
      // Apply date filter if provided
      if (filters.startDate && filters.endDate) {
        query.createdAt = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }
      
      // Get candidates
      const candidates = await Candidate.find(query);
      
      // Calculate basic statistics
      const totalCandidates = candidates.length;
      const candidatesWithResumes = candidates.filter(c => c.resumePath).length;
      const candidatesWithParsedResumes = candidates.filter(c => c.resumeParsingStatus === 'completed').length;
      
      // Calculate average ATS score
      let totalAtsScore = 0;
      let atsScoreCount = 0;
      candidates.forEach(candidate => {
        if (candidate.atsScore) {
          totalAtsScore += candidate.atsScore;
          atsScoreCount++;
        }
      });
      const averageAtsScore = atsScoreCount > 0 ? Math.round(totalAtsScore / atsScoreCount) : 0;
      
      // Calculate skill distribution
      const skillsDistribution = {};
      candidates.forEach(candidate => {
        if (candidate.parsedSkills && candidate.parsedSkills.length > 0) {
          candidate.parsedSkills.forEach(skill => {
            skillsDistribution[skill] = (skillsDistribution[skill] || 0) + 1;
          });
        }
      });
      
      // Sort skills by frequency
      const topSkills = Object.entries(skillsDistribution)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .reduce((obj, [key, value]) => {
          obj[key] = value;
          return obj;
        }, {});
      
      // Calculate candidates by creation date (for trend analysis)
      const candidatesByDate = {};
      candidates.forEach(candidate => {
        const date = candidate.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD
        candidatesByDate[date] = (candidatesByDate[date] || 0) + 1;
      });
      
      // Return compiled analytics
      return {
        totalCandidates,
        candidatesWithResumes,
        candidatesWithParsedResumes,
        averageAtsScore,
        topSkills,
        candidatesByDate,
        rawCandidates: filters.includeRaw ? candidates : undefined
      };
    } catch (error) {
      console.error('Error getting candidate analytics:', error);
      throw new Error(`Failed to get candidate analytics: ${error.message}`);
    }
  }

  /**
   * Get interview analytics
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Interview statistics
   */
  async getInterviewAnalytics(filters = {}) {
    try {
      // Get all interviews, possibly filtered
      const query = {};
      
      // Apply date filter if provided
      if (filters.startDate && filters.endDate) {
        query.scheduledDateTime = {
          $gte: new Date(filters.startDate),
          $lte: new Date(filters.endDate)
        };
      }
      
      // Apply recruiter filter if provided
      if (filters.recruiterId) {
        query.recruiter = filters.recruiterId;
      }
      
      // Get interviews
      const interviews = await Interview.find(query)
        .populate('candidate', 'name email')
        .populate('recruiter', 'name email');
      
      // Calculate basic statistics
      const totalInterviews = interviews.length;
      const pendingInterviews = interviews.filter(i => i.status === 'pending').length;
      const scheduledInterviews = interviews.filter(i => i.status === 'scheduled').length;
      const completedInterviews = interviews.filter(i => i.status === 'completed').length;
      const cancelledInterviews = interviews.filter(i => i.status === 'cancelled').length;
      
      // Calculate interview completion rate
      const completionRate = totalInterviews > 0 
        ? Math.round((completedInterviews / totalInterviews) * 100) 
        : 0;
      
      // Calculate interviews by date
      const interviewsByDate = {};
      interviews.forEach(interview => {
        const date = interview.scheduledDateTime.toISOString().split('T')[0]; // YYYY-MM-DD
        interviewsByDate[date] = (interviewsByDate[date] || 0) + 1;
      });
      
      // Return compiled analytics
      return {
        totalInterviews,
        pendingInterviews,
        scheduledInterviews,
        completedInterviews,
        cancelledInterviews,
        completionRate,
        interviewsByDate,
        rawInterviews: filters.includeRaw ? interviews : undefined
      };
    } catch (error) {
      console.error('Error getting interview analytics:', error);
      throw new Error(`Failed to get interview analytics: ${error.message}`);
    }
  }

  /**
   * Get dashboard analytics (combined overview)
   * @param {Object} filters - Optional filters
   * @returns {Promise<Object>} - Dashboard overview statistics
   */
  async getDashboardAnalytics(filters = {}) {
    try {
      // Get analytics from each domain
      const [jobAnalytics, candidateAnalytics, interviewAnalytics] = await Promise.all([
        this.getJobAnalytics(filters),
        this.getCandidateAnalytics(filters),
        this.getInterviewAnalytics(filters)
      ]);
      
      // Calculate additional cross-domain metrics
      const candidatesPerJob = jobAnalytics.activeJobs > 0 
        ? (candidateAnalytics.totalCandidates / jobAnalytics.activeJobs).toFixed(1) 
        : 0;
      
      const interviewsPerCandidate = candidateAnalytics.totalCandidates > 0 
        ? (interviewAnalytics.totalInterviews / candidateAnalytics.totalCandidates).toFixed(1) 
        : 0;
      
      // Return compiled dashboard
      return {
        jobs: {
          total: jobAnalytics.totalJobs,
          active: jobAnalytics.activeJobs,
          byType: jobAnalytics.jobsByType
        },
        candidates: {
          total: candidateAnalytics.totalCandidates,
          withResumes: candidateAnalytics.candidatesWithResumes,
          averageAtsScore: candidateAnalytics.averageAtsScore,
          topSkills: candidateAnalytics.topSkills
        },
        interviews: {
          total: interviewAnalytics.totalInterviews,
          pending: interviewAnalytics.pendingInterviews,
          completed: interviewAnalytics.completedInterviews,
          completionRate: interviewAnalytics.completionRate
        },
        metrics: {
          candidatesPerJob,
          interviewsPerCandidate
        },
        trends: {
          jobsByDate: jobAnalytics.jobsByDate,
          candidatesByDate: candidateAnalytics.candidatesByDate,
          interviewsByDate: interviewAnalytics.interviewsByDate
        }
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      throw new Error(`Failed to get dashboard analytics: ${error.message}`);
    }
  }
}

module.exports = new AnalyticsService(); 