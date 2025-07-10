const jwt = require('jsonwebtoken');
const Candidate = require('../models/candidateModel');
const Recruiter = require('../models/recruiterModel');

/**
 * Protect routes that require authentication
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];
      console.log(`Received token: ${token ? 'Valid token received' : 'No token'}`);

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log(`Token decoded successfully for user ID: ${decoded.id}, role: ${decoded.role}`);

      // Find user based on role
      if (decoded.role === 'candidate') {
        req.user = await Candidate.findById(decoded.id).select('-password');
      } else if (decoded.role === 'recruiter') {
        req.user = await Recruiter.findById(decoded.id).select('-password');
      }

      // Check if user exists in database
      if (!req.user) {
        console.error(`User not found in database for ID: ${decoded.id}, role: ${decoded.role}`);
        return res.status(401).json({
          success: false,
          message: 'User not found or account deleted'
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token failed or expired'
      });
    }
  } else {
    console.log('Request without token attempted on protected route');
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided'
    });
  }
};

/**
 * Middleware to restrict access to candidate routes
 */
const candidateOnly = (req, res, next) => {
  if (req.user && req.user.role === 'candidate') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized, candidates only'
    });
  }
};

/**
 * Middleware to restrict access to recruiter routes
 */
const recruiterOnly = (req, res, next) => {
  if (req.user && req.user.role === 'recruiter') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Not authorized, recruiters only'
    });
  }
};

module.exports = { protect, candidateOnly, recruiterOnly }; 