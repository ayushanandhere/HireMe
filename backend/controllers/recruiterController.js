const Recruiter = require('../models/recruiterModel');
const Job = require('../models/jobModel');
const Application = require('../models/applicationModel');
const Interview = require('../models/interviewModel');
const generateToken = require('../utils/generateToken');
const { getUploadedFile } = require('../middleware/uploadMiddleware');
const { safeRemoveFile } = require('../utils/fileCleanup');
const {
  getApplicationStageCounts,
  serializeApplication
} = require('../utils/applicationStages');
const {
  isRecruiterProfileComplete,
  needsRecruiterProfileCompletion,
} = require('../utils/profileCompletion');
const { buildRecruiterPayload } = require('../utils/profileSerializers');

/**
 * Register a new recruiter
 * @route POST /api/auth/recruiter/register
 * @access Public
 */
const registerRecruiter = async (req, res) => {
  try {
    const {
      name,
      password,
      company,
      phone,
      title,
      location,
      bio,
      companyWebsite,
      companySize,
      industry
    } = req.body;
    const email = req.body.email?.trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

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
      title,
      location,
      bio,
      companyWebsite,
      companySize,
      industry,
    });

    if (recruiter) {
      res.status(201).json({
        success: true,
        data: {
          ...buildRecruiterPayload(recruiter),
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
    const password = req.body.password;
    const email = req.body.email?.trim().toLowerCase();

    // Find recruiter by email
    const recruiter = await Recruiter.findOne({ email });

    if (recruiter && !recruiter.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Continue with Google to access it.',
      });
    }

    // Check if recruiter exists and password matches
    if (recruiter && (await recruiter.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          ...buildRecruiterPayload(recruiter),
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
        data: buildRecruiterPayload(recruiter),
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
    const {
      name,
      company,
      phone,
      title,
      location,
      bio,
      companyWebsite,
      companySize,
      industry
    } = req.body;
    const profilePictureFile = getUploadedFile(req, 'profilePicture');
    
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
      recruiter.companyAutofilled = false;
    }
    
    if (phone !== undefined) {
      recruiter.phone = phone;
    }

    if (title !== undefined) {
      recruiter.title = title;
    }

    if (location !== undefined) {
      recruiter.location = location;
    }

    if (bio !== undefined) {
      recruiter.bio = bio;
    }

    if (companyWebsite !== undefined) {
      recruiter.companyWebsite = companyWebsite;
    }

    if (companySize !== undefined) {
      recruiter.companySize = companySize;
    }

    if (industry !== undefined) {
      recruiter.industry = industry;
    }

    if (profilePictureFile) {
      if (recruiter.profilePicturePath) {
        safeRemoveFile(recruiter.profilePicturePath);
      }

      recruiter.profilePicturePath = profilePictureFile.path;
    }
    
    // Save updated recruiter
    const updatedRecruiter = await recruiter.save();

    if (company !== undefined) {
      await Job.updateMany(
        { recruiter: updatedRecruiter._id },
        { $set: { company: updatedRecruiter.company } }
      );
    }
    
    res.json({
      success: true,
      data: buildRecruiterPayload(updatedRecruiter),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    safeRemoveFile(getUploadedFile(req, 'profilePicture')?.path);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

/**
 * Get recruiter dashboard summary
 * @route GET /api/auth/recruiter/dashboard-summary
 * @access Private
 */
const getRecruiterDashboardSummary = async (req, res) => {
  try {
    const recruiter = await Recruiter.findById(req.user._id);

    if (!recruiter) {
      return res.status(404).json({
        success: false,
        message: 'Recruiter not found',
      });
    }

    const jobs = await Job.find({ recruiter: recruiter._id })
      .sort({ createdAt: -1 })
      .select('title company status createdAt');
    const jobIds = jobs.map((job) => job._id);

    const [applications, interviews] = await Promise.all([
      Application.find({ job: { $in: jobIds } })
        .populate('candidate', 'name email skills experience')
        .populate('job', 'title company')
        .sort({ createdAt: -1 }),
      Interview.find({ recruiter: recruiter._id })
        .populate('candidate', 'name email skills experience')
        .sort({ scheduledDateTime: 1 })
    ]);

    const stageCounts = getApplicationStageCounts();
    applications.forEach((application) => {
      if (stageCounts[application.stage] !== undefined) {
        stageCounts[application.stage] += 1;
      }
    });

    const activeJobs = jobs.filter((job) => job.status === 'published');
    const now = new Date();
    const upcomingInterviews = interviews
      .filter((interview) => interview.scheduledDateTime >= now && interview.status !== 'cancelled')
      .slice(0, 6);

    const candidateCount = new Set(applications.map((application) => String(application.candidate?._id))).size;
    const priorityApplications = applications
      .slice()
      .sort((a, b) => {
        const scoreA = a.candidateRoleFit || a.matchScore || 0;
        const scoreB = b.candidateRoleFit || b.matchScore || 0;
        return scoreB - scoreA || new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 5)
      .map(serializeApplication);

    res.json({
      success: true,
      data: {
        recruiter: {
          ...buildRecruiterPayload(recruiter)
        },
        jobs: {
          total: jobs.length,
          active: activeJobs.length,
          draft: jobs.filter((job) => job.status === 'draft').length,
          recent: jobs.slice(0, 4)
        },
        pipeline: {
          totalApplications: applications.length,
          totalCandidates: candidateCount,
          stageCounts,
          priorityApplications
        },
        interviews: {
          total: interviews.length,
          upcoming: upcomingInterviews.length,
          items: upcomingInterviews
        }
      },
    });
  } catch (error) {
    console.error('Error getting recruiter dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching recruiter dashboard summary',
    });
  }
};

module.exports = {
  registerRecruiter,
  loginRecruiter,
  getRecruiterProfile,
  updateRecruiterProfile,
  getRecruiterDashboardSummary,
};
