const mongoose = require('mongoose');

const trainingMessageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ['assistant', 'user'],
      required: true
    },
    content: {
      type: String,
      required: true,
      trim: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const trainingConversationSchema = new mongoose.Schema(
  {
    candidate: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Candidate',
      required: true,
      index: true
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: true,
      index: true
    },
    title: {
      type: String,
      trim: true,
      default: 'New chat'
    },
    isStarred: {
      type: Boolean,
      default: false
    },
    messages: {
      type: [trainingMessageSchema],
      default: []
    },
    lastUsedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

trainingConversationSchema.index({ candidate: 1, application: 1, isStarred: -1, lastUsedAt: -1 });

const TrainingConversation = mongoose.model('TrainingConversation', trainingConversationSchema);

module.exports = TrainingConversation;
