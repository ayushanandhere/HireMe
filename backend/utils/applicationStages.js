const path = require('path');
const {
  buildCandidateApplicationSnapshot,
  buildCandidatePayload,
  buildRecruiterPublicPayload,
  toPublicUploadPath
} = require('./profileSerializers');

const APPLICATION_STAGES = {
  NEW: 'new_application',
  SCREENED: 'resume_screened',
  MATCHED: 'job_matched',
  INTERVIEW_REQUESTED: 'interview_requested',
  INTERVIEW_SCHEDULED: 'interview_scheduled',
  INTERVIEW_COMPLETED: 'interview_completed',
  INTERVIEW_CANCELLED: 'interview_cancelled',
  OFFER_EXTENDED: 'offer_extended',
  OFFER_ACCEPTED: 'offer_accepted',
  REJECTED: 'rejected',
  WITHDRAWN: 'withdrawn'
};

const APPLICATION_STAGE_ORDER = [
  APPLICATION_STAGES.NEW,
  APPLICATION_STAGES.SCREENED,
  APPLICATION_STAGES.MATCHED,
  APPLICATION_STAGES.INTERVIEW_REQUESTED,
  APPLICATION_STAGES.INTERVIEW_SCHEDULED,
  APPLICATION_STAGES.INTERVIEW_COMPLETED,
  APPLICATION_STAGES.OFFER_EXTENDED,
  APPLICATION_STAGES.OFFER_ACCEPTED,
  APPLICATION_STAGES.INTERVIEW_CANCELLED,
  APPLICATION_STAGES.REJECTED,
  APPLICATION_STAGES.WITHDRAWN
];

const APPLICATION_STAGE_LABELS = {
  [APPLICATION_STAGES.NEW]: 'New application',
  [APPLICATION_STAGES.SCREENED]: 'Resume screened',
  [APPLICATION_STAGES.MATCHED]: 'Job matched',
  [APPLICATION_STAGES.INTERVIEW_REQUESTED]: 'Interview requested',
  [APPLICATION_STAGES.INTERVIEW_SCHEDULED]: 'Interview scheduled',
  [APPLICATION_STAGES.INTERVIEW_COMPLETED]: 'Interview completed',
  [APPLICATION_STAGES.INTERVIEW_CANCELLED]: 'Interview cancelled',
  [APPLICATION_STAGES.OFFER_EXTENDED]: 'Offer extended',
  [APPLICATION_STAGES.OFFER_ACCEPTED]: 'Offer accepted',
  [APPLICATION_STAGES.REJECTED]: 'Rejected',
  [APPLICATION_STAGES.WITHDRAWN]: 'Withdrawn'
};

const TERMINAL_APPLICATION_STAGES = new Set([
  APPLICATION_STAGES.INTERVIEW_CANCELLED,
  APPLICATION_STAGES.OFFER_ACCEPTED,
  APPLICATION_STAGES.REJECTED,
  APPLICATION_STAGES.WITHDRAWN
]);

const ALLOWED_STAGE_TRANSITIONS = {
  [APPLICATION_STAGES.NEW]: [
    APPLICATION_STAGES.SCREENED,
    APPLICATION_STAGES.MATCHED,
    APPLICATION_STAGES.INTERVIEW_REQUESTED,
    APPLICATION_STAGES.REJECTED,
    APPLICATION_STAGES.WITHDRAWN
  ],
  [APPLICATION_STAGES.SCREENED]: [
    APPLICATION_STAGES.MATCHED,
    APPLICATION_STAGES.INTERVIEW_REQUESTED,
    APPLICATION_STAGES.REJECTED,
    APPLICATION_STAGES.WITHDRAWN
  ],
  [APPLICATION_STAGES.MATCHED]: [
    APPLICATION_STAGES.INTERVIEW_REQUESTED,
    APPLICATION_STAGES.REJECTED,
    APPLICATION_STAGES.WITHDRAWN
  ],
  [APPLICATION_STAGES.INTERVIEW_REQUESTED]: [
    APPLICATION_STAGES.INTERVIEW_SCHEDULED,
    APPLICATION_STAGES.REJECTED,
    APPLICATION_STAGES.WITHDRAWN
  ],
  [APPLICATION_STAGES.INTERVIEW_SCHEDULED]: [
    APPLICATION_STAGES.INTERVIEW_COMPLETED,
    APPLICATION_STAGES.INTERVIEW_CANCELLED,
    APPLICATION_STAGES.WITHDRAWN
  ],
  [APPLICATION_STAGES.INTERVIEW_COMPLETED]: [
    APPLICATION_STAGES.OFFER_EXTENDED,
    APPLICATION_STAGES.REJECTED,
    APPLICATION_STAGES.WITHDRAWN
  ],
  [APPLICATION_STAGES.OFFER_EXTENDED]: [
    APPLICATION_STAGES.OFFER_ACCEPTED,
    APPLICATION_STAGES.REJECTED,
    APPLICATION_STAGES.WITHDRAWN
  ],
  [APPLICATION_STAGES.OFFER_ACCEPTED]: [],
  [APPLICATION_STAGES.INTERVIEW_CANCELLED]: [],
  [APPLICATION_STAGES.REJECTED]: [],
  [APPLICATION_STAGES.WITHDRAWN]: []
};

function getApplicationStageLabel(stage) {
  return APPLICATION_STAGE_LABELS[stage] || 'Unknown stage';
}

function isValidApplicationStage(stage) {
  return Boolean(APPLICATION_STAGE_LABELS[stage]);
}

function canTransitionApplicationStage(currentStage, nextStage) {
  if (!isValidApplicationStage(nextStage)) {
    return false;
  }

  if (!currentStage || currentStage === nextStage) {
    return true;
  }

  const allowedTransitions = ALLOWED_STAGE_TRANSITIONS[currentStage] || [];
  return allowedTransitions.includes(nextStage);
}

function getApplicationStageCounts() {
  return APPLICATION_STAGE_ORDER.reduce((counts, stage) => {
    counts[stage] = 0;
    return counts;
  }, {});
}

function serializeApplication(application) {
  if (!application) {
    return null;
  }

  const source = typeof application.toObject === 'function'
    ? application.toObject({ virtuals: true })
    : { ...application };

  const candidate = source.candidate && typeof source.candidate === 'object' && source.candidate._id
    ? buildCandidatePayload(source.candidate)
    : source.candidate;

  const job = source.job && typeof source.job === 'object' && source.job._id
    ? {
        ...source.job,
        recruiterProfile: source.job.recruiter && typeof source.job.recruiter === 'object' && source.job.recruiter._id
          ? buildRecruiterPublicPayload(source.job.recruiter)
          : source.job.recruiterProfile,
      }
    : source.job;

  const inferredResumeSource = source.resumeSource || 'profile';
  const submittedResumePath = source.resumePath || '';
  const profileResumePath = source.candidate?.resumePath || '';
  const fallbackCandidateNotes = source.candidateNotes
    || (source.stage === APPLICATION_STAGES.NEW ? source.notes || '' : '');
  const submittedProfile = source.submittedProfile && typeof source.submittedProfile === 'object'
    ? {
        ...source.submittedProfile,
        profilePictureUrl: source.submittedProfile.profilePictureUrl
          || toPublicUploadPath(source.submittedProfile.profilePicturePath || ''),
      }
    : buildCandidateApplicationSnapshot(source.candidate || {});

  return {
    ...source,
    candidate,
    job,
    resumeSource: inferredResumeSource,
    candidateNotes: fallbackCandidateNotes,
    submittedProfile,
    submittedResume: {
      available: Boolean(submittedResumePath),
      source: inferredResumeSource,
      path: submittedResumePath,
      publicUrl: toPublicUploadPath(submittedResumePath),
      fileName: submittedResumePath ? path.basename(submittedResumePath) : '',
    },
    profileResume: {
      available: Boolean(profileResumePath),
      path: profileResumePath,
      publicUrl: toPublicUploadPath(profileResumePath),
      fileName: profileResumePath ? path.basename(profileResumePath) : '',
    },
    stageLabel: getApplicationStageLabel(source.stage),
    isTerminalStage: TERMINAL_APPLICATION_STAGES.has(source.stage),
    stageOrder: APPLICATION_STAGE_ORDER.indexOf(source.stage)
  };
}

function transitionApplication(application, nextStage, {
  notes,
  updatedBy
} = {}) {
  const currentStage = application.stage;

  if (!canTransitionApplicationStage(currentStage, nextStage)) {
    const fromLabel = getApplicationStageLabel(currentStage);
    const toLabel = getApplicationStageLabel(nextStage);
    throw new Error(`Invalid application stage transition from ${fromLabel} to ${toLabel}`);
  }

  application.stage = nextStage;
  application.history.push({
    stage: nextStage,
    timestamp: new Date(),
    notes: notes || `Moved to ${getApplicationStageLabel(nextStage)}`,
    updatedBy
  });

  return application;
}

module.exports = {
  APPLICATION_STAGES,
  APPLICATION_STAGE_ORDER,
  APPLICATION_STAGE_LABELS,
  TERMINAL_APPLICATION_STAGES,
  getApplicationStageLabel,
  getApplicationStageCounts,
  canTransitionApplicationStage,
  isValidApplicationStage,
  serializeApplication,
  transitionApplication
};
