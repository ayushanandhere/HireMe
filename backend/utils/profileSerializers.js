const {
  isCandidateProfileComplete,
  isRecruiterProfileComplete,
  needsCandidateProfileCompletion,
  needsRecruiterProfileCompletion,
} = require('./profileCompletion');

const toPublicUploadPath = (filePath) => {
  if (!filePath) {
    return '';
  }

  const normalized = filePath.replace(/\\/g, '/');
  const uploadsSegment = '/uploads/';
  const uploadsIndex = normalized.lastIndexOf(uploadsSegment);

  if (uploadsIndex >= 0) {
    return normalized.slice(uploadsIndex);
  }

  const relativeUploadsSegment = 'uploads/';
  const relativeIndex = normalized.lastIndexOf(relativeUploadsSegment);
  if (relativeIndex >= 0) {
    return `/${normalized.slice(relativeIndex)}`;
  }

  return '';
};

const buildCandidatePayload = (candidate) => ({
  _id: candidate._id,
  name: candidate.name,
  email: candidate.email,
  headline: candidate.headline || '',
  location: candidate.location || '',
  phone: candidate.phone || '',
  linkedin: candidate.linkedin || '',
  bio: candidate.bio || '',
  skills: candidate.skills || '',
  experience: candidate.experience || '',
  parsedSkills: candidate.parsedSkills || [],
  atsScore: candidate.atsScore || 0,
  parsedResumeDate: candidate.parsedResumeDate || null,
  resumeParsingStatus: candidate.resumeParsingStatus || 'not_started',
  resumePath: candidate.resumePath || '',
  hasResume: Boolean(candidate.resumePath),
  profilePictureUrl: toPublicUploadPath(candidate.profilePicturePath),
  role: candidate.role,
  updatedAt: candidate.updatedAt,
  createdAt: candidate.createdAt,
  profileComplete: isCandidateProfileComplete(candidate),
  needsProfileCompletion: needsCandidateProfileCompletion(candidate),
});

const buildCandidateApplicationSnapshot = (candidate) => ({
  name: candidate?.name || '',
  email: candidate?.email || '',
  headline: candidate?.headline || '',
  location: candidate?.location || '',
  phone: candidate?.phone || '',
  linkedin: candidate?.linkedin || '',
  bio: candidate?.bio || '',
  skills: candidate?.skills || '',
  experience: candidate?.experience || '',
  profilePicturePath: candidate?.profilePicturePath || '',
});

const buildRecruiterPayload = (recruiter) => ({
  _id: recruiter._id,
  name: recruiter.name,
  email: recruiter.email,
  company: recruiter.company || '',
  phone: recruiter.phone || '',
  title: recruiter.title || '',
  location: recruiter.location || '',
  bio: recruiter.bio || '',
  companyWebsite: recruiter.companyWebsite || '',
  companySize: recruiter.companySize || '',
  industry: recruiter.industry || '',
  profilePictureUrl: toPublicUploadPath(recruiter.profilePicturePath),
  role: recruiter.role,
  updatedAt: recruiter.updatedAt,
  createdAt: recruiter.createdAt,
  profileComplete: isRecruiterProfileComplete(recruiter),
  needsProfileCompletion: needsRecruiterProfileCompletion(recruiter),
});

const buildRecruiterPublicPayload = (recruiter) => ({
  _id: recruiter._id,
  name: recruiter.name,
  company: recruiter.company || '',
  title: recruiter.title || '',
  location: recruiter.location || '',
  bio: recruiter.bio || '',
  companyWebsite: recruiter.companyWebsite || '',
  companySize: recruiter.companySize || '',
  industry: recruiter.industry || '',
  profilePictureUrl: toPublicUploadPath(recruiter.profilePicturePath),
});

module.exports = {
  buildCandidatePayload,
  buildCandidateApplicationSnapshot,
  buildRecruiterPayload,
  buildRecruiterPublicPayload,
  toPublicUploadPath,
};
