const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Job description is required']
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true
    },
    location: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'internship', 'remote'],
      default: 'full-time'
    },
    skills: [{
      type: String,
      trim: true
    }],
    experienceLevel: {
      type: String,
      enum: ['entry', 'intermediate', 'senior', 'executive'],
      default: 'intermediate'
    },
    experienceYears: {
      min: {
        type: Number,
        default: 0
      },
      max: {
        type: Number,
        default: null
      }
    },
    salaryRange: {
      min: {
        type: Number,
        default: null
      },
      max: {
        type: Number,
        default: null
      },
      currency: {
        type: String,
        default: 'USD'
      }
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'closed', 'archived'],
      default: 'draft'
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: true
    },
    applicationDeadline: {
      type: Date
    },
    educationRequirements: {
      type: String
    },
    created_at: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for searching
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

// Create a virtual for calculating days since posting
jobSchema.virtual('daysActive').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job; 