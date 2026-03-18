const isCandidateProfileComplete = (candidate) =>
  Boolean(
    candidate &&
      candidate.skills?.trim() &&
      candidate.experience?.trim() &&
      candidate.resumePath
  );

const isRecruiterProfileComplete = (recruiter) =>
  Boolean(
    recruiter &&
      recruiter.name?.trim() &&
      recruiter.company?.trim() &&
      !recruiter.companyAutofilled
  );

const needsCandidateProfileCompletion = (candidate) =>
  Boolean(candidate?.googleId) && !isCandidateProfileComplete(candidate);

const needsRecruiterProfileCompletion = (recruiter) =>
  Boolean(recruiter?.googleId) && !isRecruiterProfileComplete(recruiter);

module.exports = {
  isCandidateProfileComplete,
  isRecruiterProfileComplete,
  needsCandidateProfileCompletion,
  needsRecruiterProfileCompletion,
};
