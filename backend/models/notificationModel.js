const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'recipientModel'
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ['Candidate', 'Recruiter']
    },
    type: {
      type: String,
      required: true,
      enum: [
        'interview_request',
        'interview_accepted',
        'interview_rejected',
        'interview_cancelled',
        'interview_reminder',
        'feedback_submitted',
        'feedback_shared',
        'system'
      ]
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    relatedTo: {
      model: {
        type: String,
        enum: ['Interview', 'Feedback']
      },
      id: {
        type: mongoose.Schema.Types.ObjectId
      }
    },
    isRead: {
      type: Boolean,
      default: false
    },
    actionUrl: String,
    createdAt: {
      type: Date,
      default: Date.now,
      expires: '30d' // Notifications expire after 30 days
    }
  }
);

// Index for faster lookups
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification; 