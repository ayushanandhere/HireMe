const Candidate = require('../models/candidateModel');
const Application = require('../models/applicationModel');
const Interview = require('../models/interviewModel');
const Job = require('../models/jobModel');
const generateToken = require('../utils/generateToken');
const { getUploadedFile } = require('../middleware/uploadMiddleware');
const { safeRemoveFile } = require('../utils/fileCleanup');
const {
  APPLICATION_STAGES,
  getApplicationStageCounts,
  serializeApplication
} = require('../utils/applicationStages');

const hasPopulatedJob = (application) => Boolean(application?.job?._id || application?.job);
const {
  isCandidateProfileComplete,
  needsCandidateProfileCompletion,
} = require('../utils/profileCompletion');
const { buildCandidatePayload } = require('../utils/profileSerializers');

const getCandidateSkillSet = (candidate) => {
  const rawSkills = [
    ...(candidate.parsedSkills || []),
    ...(candidate.skills || '').split(',')
  ];

  return new Set(
    rawSkills
      .map((skill) => skill.trim().toLowerCase())
      .filter(Boolean)
  );
};

const scoreJobForCandidate = (job, skillSet) => {
  const jobSkills = (job.skills || [])
    .map((skill) => skill.trim().toLowerCase())
    .filter(Boolean);

  if (!jobSkills.length || !skillSet.size) {
    return 0;
  }

  const matchedSkills = jobSkills.filter((skill) => skillSet.has(skill));
  return Math.round((matchedSkills.length / jobSkills.length) * 100);
};

/**
 * Register a new candidate
 * @route POST /api/auth/candidate/register
 * @access Public
 */
const registerCandidate = async (req, res) => {
  try {
    const { name, password, skills, experience, headline, location, phone, linkedin, bio } = req.body;
    const email = req.body.email?.trim().toLowerCase();
    const resumeFile = getUploadedFile(req, 'resume');

    if (!email) {
      safeRemoveFile(resumeFile?.path);
      return res.status(400).json({
        success: false,
        message: 'Email is required',
      });
    }

    // Check if candidate already exists
    const candidateExists = await Candidate.findOne({ email });

    if (candidateExists) {
      // Clean up uploaded file if user exists
      safeRemoveFile(resumeFile?.path);
      
      return res.status(400).json({
        success: false,
        message: 'Candidate with this email already exists',
      });
    }

    // Process resume file path if uploaded
    let resumePath = null;
    if (resumeFile) {
      resumePath = resumeFile.path;
    }

    // Create new candidate
    const candidate = await Candidate.create({
      name,
      email,
      password,
      headline,
      location,
      phone,
      linkedin,
      bio,
      skills,
      experience,
      resumePath,
    });

    if (candidate) {
      res.status(201).json({
        success: true,
        data: {
          ...buildCandidatePayload(candidate),
          token: generateToken(candidate._id, candidate.role),
        },
      });
    } else {
      // Clean up uploaded file if user creation fails
      safeRemoveFile(resumeFile?.path);
      
      res.status(400).json({
        success: false,
        message: 'Invalid candidate data',
      });
    }
  } catch (error) {
    // Clean up uploaded file on error
    safeRemoveFile(getUploadedFile(req, 'resume')?.path);
    safeRemoveFile(getUploadedFile(req, 'profilePicture')?.path);
    
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
    const password = req.body.password;
    const email = req.body.email?.trim().toLowerCase();

    // Find candidate by email
    const candidate = await Candidate.findOne({ email });

    if (candidate && !candidate.password) {
      return res.status(400).json({
        success: false,
        message: 'This account uses Google sign-in. Continue with Google to access it.',
      });
    }

    // Check if candidate exists and password matches
    if (candidate && (await candidate.matchPassword(password))) {
      res.json({
        success: true,
        data: {
          ...buildCandidatePayload(candidate),
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
        data: buildCandidatePayload(candidate),
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
    const {
      name,
      skills,
      experience,
      headline,
      location,
      phone,
      linkedin,
      bio
    } = req.body;
    const resumeFile = getUploadedFile(req, 'resume');
    const profilePictureFile = getUploadedFile(req, 'profilePicture');
    
    // Get candidate from database
    const candidate = await Candidate.findById(req.user._id);
    
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }
    
    // Update fields if provided
    if (name !== undefined) {
      candidate.name = name;
    }

    if (skills !== undefined) {
      candidate.skills = skills;
    }
    
    if (experience !== undefined) {
      candidate.experience = experience;
    }

    if (headline !== undefined) {
      candidate.headline = headline;
    }

    if (location !== undefined) {
      candidate.location = location;
    }

    if (phone !== undefined) {
      candidate.phone = phone;
    }

    if (linkedin !== undefined) {
      candidate.linkedin = linkedin;
    }

    if (bio !== undefined) {
      candidate.bio = bio;
    }
    
    // Handle resume file upload
    if (resumeFile) {
      // Preserve the old resume if an application record still references it.
      if (candidate.resumePath) {
        const existingReferenceCount = await Application.countDocuments({ resumePath: candidate.resumePath });
        if (existingReferenceCount === 0) {
          safeRemoveFile(candidate.resumePath);
        }
      }
      
      // Update with new file path
      candidate.resumePath = resumeFile.path;
      candidate.parsedSkills = [];
      candidate.parsedExperience = [];
      candidate.parsedEducation = [];
      candidate.atsScore = 0;
      candidate.parsedResumeDate = undefined;
      candidate.resumeParsingStatus = 'not_started';
    }

    if (profilePictureFile) {
      if (candidate.profilePicturePath) {
        safeRemoveFile(candidate.profilePicturePath);
      }

      candidate.profilePicturePath = profilePictureFile.path;
    }
    
    // Save updated candidate
    const updatedCandidate = await candidate.save();
    
    res.json({
      success: true,
      data: buildCandidatePayload(updatedCandidate),
      message: 'Profile updated successfully',
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    safeRemoveFile(getUploadedFile(req, 'resume')?.path);
    safeRemoveFile(getUploadedFile(req, 'profilePicture')?.path);
    res.status(500).json({
      success: false,
      message: error.message || 'Error updating profile',
    });
  }
};

/**
 * Get candidate dashboard summary
 * @route GET /api/auth/candidate/dashboard-summary
 * @access Private
 */
const getCandidateDashboardSummary = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.user._id);

    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found',
      });
    }

    const [applications, interviews, publishedJobs] = await Promise.all([
      Application.find({ candidate: candidate._id })
        .populate('job', 'title company location type skills status createdAt')
        .sort({ createdAt: -1 }),
      Interview.find({ candidate: candidate._id })
        .populate('recruiter', 'name company')
        .sort({ scheduledDateTime: 1 }),
      Job.find({ status: 'published' })
        .select('title company location type skills createdAt')
        .sort({ createdAt: -1 })
        .limit(12)
    ]);

    const visibleApplications = applications.filter(hasPopulatedJob);

    const stageCounts = getApplicationStageCounts();
    visibleApplications.forEach((application) => {
      if (stageCounts[application.stage] !== undefined) {
        stageCounts[application.stage] += 1;
      }
    });

    const now = new Date();
    const upcomingInterviews = interviews
      .filter((interview) => interview.scheduledDateTime >= now && interview.status !== 'cancelled')
      .slice(0, 5);

    const candidateSkillSet = getCandidateSkillSet(candidate);
    const appliedJobIds = new Set(visibleApplications.map((application) => String(application.job?._id)));
    const recommendedJobs = publishedJobs
      .filter((job) => !appliedJobIds.has(String(job._id)))
      .map((job) => ({
        ...job.toObject(),
        recommendationScore: scoreJobForCandidate(job, candidateSkillSet)
      }))
      .sort((a, b) => b.recommendationScore - a.recommendationScore || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);

    res.json({
      success: true,
      data: {
        profile: {
          ...buildCandidatePayload(candidate)
        },
        applicationSummary: {
          total: visibleApplications.length,
          stageCounts,
          recent: visibleApplications.slice(0, 4).map(serializeApplication)
        },
        interviewSummary: {
          total: interviews.length,
          upcoming: upcomingInterviews.length,
          items: upcomingInterviews
        },
        resumeStatus: {
          hasResume: Boolean(candidate.resumePath),
          parsingStatus: candidate.resumeParsingStatus,
          atsScore: candidate.atsScore || 0
        },
        recommendedJobs
      },
    });
  } catch (error) {
    console.error('Error getting candidate dashboard summary:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching candidate dashboard summary',
    });
  }
};

module.exports = {
  registerCandidate,
  loginCandidate,
  getCandidateProfile,
  updateCandidateProfile,
  getCandidateDashboardSummary,
};
