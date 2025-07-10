const mongoose = require('mongoose');

const applicationHistorySchema = new mongoose.Schema({
  stage: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  notes: {
    type: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const applicationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true
    },
    stage: {
      type: String,
      enum: [
        'new_application',
        'resume_screened',
        'job_matched',
        'interview_requested',
        'interview_scheduled',
        'interview_completed',
        'interview_cancelled',
        'offer_extended',
        'offer_accepted',
        'rejected',
        'withdrawn'
      ],
      default: 'new_application'
    },
    history: [applicationHistorySchema],
    matchScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    skillsMatch: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    experienceRelevance: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    matchedSkills: [String],
    missingSkills: [String],
    atsScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    candidateRoleFit: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    candidateRoleFitExplanation: {
      type: String,
      default: ''
    },
    interviewScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    feedbackScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    notes: {
      type: String
    },
    resumePath: {
      type: String,
      default: null
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for efficient queries
applicationSchema.index({ candidate: 1, job: 1 }, { unique: true });
applicationSchema.index({ job: 1, stage: 1 });
applicationSchema.index({ candidate: 1, stage: 1 });
applicationSchema.index({ stage: 1 });
applicationSchema.index({ createdAt: 1 });

// Create a virtual for days in current stage
applicationSchema.virtual('daysInCurrentStage').get(function() {
  // Get the timestamp of the most recent stage change
  if (this.history && this.history.length > 0) {
    const lastStageChange = this.history[this.history.length - 1].timestamp;
    return Math.floor((Date.now() - lastStageChange) / (1000 * 60 * 60 * 24));
  }
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application; 