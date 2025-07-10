const asyncHandler = require('express-async-handler');
const AnalyticsService = require('../services/analyticsService');

/**
 * Get dashboard analytics
 * @route   GET /api/analytics/dashboard
 * @access  Private (recruiter only)
 */
const getDashboardAnalytics = asyncHandler(async (req, res) => {
  try {
    // Parse filters from query params
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      recruiterId: req.query.recruiterId || (req.user.role === 'recruiter' ? req.user._id : null)
    };
    
    // Get dashboard analytics
    const analytics = await AnalyticsService.getDashboardAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting dashboard analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get job analytics
 * @route   GET /api/analytics/jobs
 * @access  Private (recruiter only)
 */
const getJobAnalytics = asyncHandler(async (req, res) => {
  try {
    // Parse filters from query params
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      status: req.query.status,
      recruiterId: req.query.recruiterId || (req.user.role === 'recruiter' ? req.user._id : null),
      includeRaw: req.query.includeRaw === 'true'
    };
    
    // Get job analytics
    const analytics = await AnalyticsService.getJobAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting job analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get candidate analytics
 * @route   GET /api/analytics/candidates
 * @access  Private (recruiter only)
 */
const getCandidateAnalytics = asyncHandler(async (req, res) => {
  try {
    // Parse filters from query params
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      includeRaw: req.query.includeRaw === 'true'
    };
    
    // Get candidate analytics
    const analytics = await AnalyticsService.getCandidateAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting candidate analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

/**
 * Get interview analytics
 * @route   GET /api/analytics/interviews
 * @access  Private (recruiter only)
 */
const getInterviewAnalytics = asyncHandler(async (req, res) => {
  try {
    // Parse filters from query params
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      recruiterId: req.query.recruiterId || (req.user.role === 'recruiter' ? req.user._id : null),
      includeRaw: req.query.includeRaw === 'true'
    };
    
    // Get interview analytics
    const analytics = await AnalyticsService.getInterviewAnalytics(filters);
    
    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('Error getting interview analytics:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = {
  getDashboardAnalytics,
  getJobAnalytics,
  getCandidateAnalytics,
  getInterviewAnalytics
}; 