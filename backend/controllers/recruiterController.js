const Recruiter = require('../models/recruiterModel');
const generateToken = require('../utils/generateToken');

/**
 * Register a new recruiter
 * @route POST /api/auth/recruiter/register
 * @access Public
 */
const registerRecruiter = async (req, res) => {
  try {
    const { name, email, password, company, phone } = req.body;

    // Check if recruiter already exists
    const recruiterExists = await Recruiter.findOne({ email });

    if (recruiterExists) {
      return res.status(400).json({
        success: false,
        message: 'Recruiter with this email already exists',
      });
    }

    // Create new recruiter
    const recruiter = await Recruiter.create({
      name,
      email,
      password,
      company,
      phone,
    });

    if (recruiter) {
      res.status(201).json({
        success: true,
        data: {
          _id: recruiter._id,
          name: recruiter.name,
          email: recruiter.email,
          company: recruiter.company,
          phone: recruiter.phone,
          role: recruiter.role,
          token: generateToken(recruiter._id, recruiter.role),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid recruiter data',
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
 * Authenticate recruiter and get token
 * @route POST /api/auth/recruiter/login
 * @access Public
 */
const loginRecruiter = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find recruiter by email
    const recruiter = await Recruiter.findOne({ email });

    // Check if recruiter exists and password matches
    if (recruiter && (await recruiter.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          _id: recruiter._id,
          name: recruiter.name,
          email: recruiter.email,
          company: recruiter.company,
          phone: recruiter.phone,
          role: recruiter.role,
          token: generateToken(recruiter._id, recruiter.role),
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
 * Get recruiter profile
 * @route GET /api/auth/recruiter/profile
 * @access Private
 */
const getRecruiterProfile = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user._id);

    if (recruiter) {
      res.json({
        success: true,
        data: {
          _id: recruiter._id,
          name: recruiter.name,
          email: recruiter.email,
          company: recruiter.company,
          phone: recruiter.phone,
          role: recruiter.role,
        },
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Recruiter not found',
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
 * Update recruiter profile
 * @route PUT /api/auth/recruiter/profile
 * @access Private
 */
const updateRecruiterProfile = async (req, res) => {
  try {
    const { name, company, phone } = req.body;
    
    // Get recruiter from database
    const recruiter = await Recruiter.findById(req.user._id);
    
    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found',
      });
    }
    
    // Update fields if provided
    if (name !== undefined) {
      recruiter.name = name;
    }
    
    if (company !== undefined) {
      recruiter.company = company;
    }
    
    if (phone !== undefined) {
      recruiter.phone = phone;
    }
    
    // Save updated recruiter
    const updatedRecruiter = await recruiter.save();
    
    res.json({
      success: true,
      data: {
        _id: updatedRecruiter._id,
        name: updatedRecruiter.name,
        email: updatedRecruiter.email,
        company: updatedRecruiter.company,
        phone: updatedRecruiter.phone,
        role: updatedRecruiter.role,
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
  registerRecruiter,
  loginRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
}; 