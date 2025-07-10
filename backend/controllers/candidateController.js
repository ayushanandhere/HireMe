const Candidate = require('../models/candidateModel');
const generateToken = require('../utils/generateToken');
const fs = require('fs');
const path = require('path');

/**
 * Register a new candidate
 * @route POST /api/auth/candidate/register
 * @access Public
 */
const registerCandidate = async (req, res) => {
  try {
    const { name, email, password, skills, experience } = req.body;

    // Check if candidate already exists
    const candidateExists = await Candidate.findOne({ email });

    if (candidateExists) {
      // Clean up uploaded file if user exists
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Candidate with this email already exists',
      });
    }

    // Process resume file path if uploaded
    let resumePath = null;
    if (req.file) {
      resumePath = req.file.path;
    }

    // Create new candidate
    const candidate = await Candidate.create({
      name,
      email,
      password,
      skills,
      experience,
      resumePath,
    });

    if (candidate) {
      res.status(201).json({
        success: true,
        data: {
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          skills: candidate.skills,
          experience: candidate.experience,
          role: candidate.role,
          token: generateToken(candidate._id, candidate.role),
        },
      });
    } else {
      // Clean up uploaded file if user creation fails
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }
      
      res.status(400).json({
        success: false,
        message: 'Invalid candidate data',
      });
    }
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Authenticate candidate and get token
 * @route POST /api/auth/candidate/login
 * @access Public
 */
const loginCandidate = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find candidate by email
    const candidate = await Candidate.findOne({ email });

    // Check if candidate exists and password matches
    if (candidate && (await candidate.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          skills: candidate.skills,
          experience: candidate.experience,
          resumePath: candidate.resumePath,
          hasResume: !!candidate.resumePath,
          role: candidate.role,
          token: generateToken(candidate._id, candidate.role),
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get candidate profile
 * @route GET /api/auth/candidate/profile
 * @access Private
 */
const getCandidateProfile = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.user._id);

    if (candidate) {
      res.json({
        success: true,
        data: {
          _id: candidate._id,
          name: candidate.name,
          email: candidate.email,
          skills: candidate.skills,
          experience: candidate.experience,
          role: candidate.role,
          resumePath: candidate.resumePath,
          hasResume: !!candidate.resumePath,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update candidate profile
 * @route PUT /api/auth/candidate/profile
 * @access Private
 */
const updateCandidateProfile = async (req, res) => {
  try {
    const { skills, experience } = req.body;
    
    // Get candidate from database
    const candidate = await Candidate.findById(req.user._id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }
    
    // Update fields if provided
    if (skills !== undefined) {
      candidate.skills = skills;
    }
    
    if (experience !== undefined) {
      candidate.experience = experience;
    }
    
    // Handle resume file upload
    if (req.file) {
      // If candidate already has a resume, delete the old file
      if (candidate.resumePath) {
        try {
          fs.unlinkSync(candidate.resumePath);
        } catch (err) {
          console.error('Error deleting old resume file:', err);
          // Continue even if delete fails
        }
      }
      
      // Update with new file path
      candidate.resumePath = req.file.path;
    }
    
    // Save updated candidate
    const updatedCandidate = await candidate.save();
    
    res.json({
      success: true,
      data: {
        _id: updatedCandidate._id,
        name: updatedCandidate.name,
        email: updatedCandidate.email,
        skills: updatedCandidate.skills,
        experience: updatedCandidate.experience,
        resumePath: updatedCandidate.resumePath,
        hasResume: !!updatedCandidate.resumePath,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

module.exports = {
  registerCandidate,
  loginCandidate,
  getCandidateProfile,
  updateCandidateProfile,
}; 