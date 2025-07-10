const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true
    },
    recruiter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Recruiter',
      required: true
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application'
    },
    position: {
      title: {
        type: String,
        required: true
      },
      description: String
    },
    scheduledDateTime: {
      type: Date,
      required: true
    },
    duration: {
      type: Number,
      default: 60, // minutes
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
      default: 'pending'
    },
    notes: String,
    meetingId: String,
    meetingLink: String,
    feedback: {
      technical: {
        score: { type: Number, min: 0, max: 10 },
        comments: String
      },
      communication: {
        score: { type: Number, min: 0, max: 10 },
        comments: String
      },
      problemSolving: {
        score: { type: Number, min: 0, max: 10 },
        comments: String
      },
      overall: {
        score: { type: Number, min: 0, max: 10 },
        comments: String
      },
      isShared: {
        type: Boolean,
        default: false
      }
    }
  },
  {
    timestamps: true
  }
);

const Interview = mongoose.model('Interview', interviewSchema);

module.exports = Interview; 