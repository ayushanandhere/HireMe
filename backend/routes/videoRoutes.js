const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const videoService = require('../services/videoService');

/**
 * @route   GET /api/video/:interviewId/details
 * @desc    Get meeting details for an interview
 * @access  Private
 */
router.get('/:interviewId/details', protect, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const meetingDetails = await videoService.getMeetingDetails(interviewId);
    
    res.json({
      success: true,
      data: meetingDetails
    });
  } catch (error) {
    console.error('Error getting meeting details:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting meeting details'
    });
  }
});

/**
 * @route   GET /api/video/:interviewId/url
 * @desc    Get meeting URL for an interview
 * @access  Private
 */
router.get('/:interviewId/url', protect, async (req, res) => {
  try {
    const { interviewId } = req.params;
    const baseUrl = req.query.baseUrl || '';
    const meetingUrl = await videoService.getMeetingUrl(interviewId, baseUrl);
    
    res.json({
      success: true,
      data: { url: meetingUrl }
    });
  } catch (error) {
    console.error('Error getting meeting URL:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting meeting URL'
    });
  }
});

module.exports = router;
