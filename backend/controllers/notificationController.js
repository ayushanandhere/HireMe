const Notification = require('../models/notificationModel');
const Interview = require('../models/interviewModel');
const nodemailer = require('nodemailer');

/**
 * Get all notifications for the current user
 * @route GET /api/notifications
 * @access Private
 */
const getUserNotifications = async (req, res) => {
  try {
    // Check if req.user exists before accessing properties
    if (!req.user || !req.user._id) {
      console.error('getUserNotifications called with null user or user._id');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated or not found in database'
      });
    }

    const notifications = await Notification.find({
      recipient: req.user._id,
      recipientModel: req.user.role === 'candidate' ? 'Candidate' : 'Recruiter'
    }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications'
    });
  }
};

/**
 * Mark a notification as read
 * @route PUT /api/notifications/:id/read
 * @access Private
 */
const markNotificationAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }
    
    notification.isRead = true;
    await notification.save();
    
    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notification'
    });
  }
};

/**
 * Mark all notifications as read
 * @route PUT /api/notifications/read-all
 * @access Private
 */
const markAllNotificationsAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        recipient: req.user._id,
        recipientModel: req.user.role === 'candidate' ? 'Candidate' : 'Recruiter',
        isRead: false
      },
      { isRead: true }
    );
    
    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating notifications'
    });
  }
};

/**
 * Delete a notification
 * @route DELETE /api/notifications/:id
 * @access Private
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    
    // Check if the notification belongs to the user
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }
    
    await notification.deleteOne();
    
    res.status(200).json({
      success: true,
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification'
    });
  }
};

/**
 * Create a notification
 * @param {Object} notificationData - The notification data
 * @returns {Promise<Object>} The created notification
 */
const createNotification = async (notificationData) => {
  try {
    const notification = await Notification.create(notificationData);
    
    // Emit the notification through socket.io if available
    if (global.io) {
      console.log(`Emitting notification to recipient: ${notificationData.recipient}`);
      
      // Use a try-catch block since toObject might cause issues
      try {
        // Convert mongoose document to plain object for socket emission
        const notificationObject = notification.toObject ? notification.toObject() : JSON.parse(JSON.stringify(notification));
        
        global.io.emit('notification', {
          ...notificationObject,
          recipientId: notificationData.recipient.toString()
        });
        
        console.log('Notification emitted successfully');
      } catch (socketError) {
        console.error('Error emitting notification via socket:', socketError);
      }
    } else {
      console.warn('Socket.io not available for sending notification');
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

/**
 * Send an email notification
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} html - Email HTML content
 * @returns {Promise<Object>} The result of sending the email
 */
const sendEmailNotification = async (email, subject, html) => {
  try {
    // Create reusable transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    
    // Send email
    const info = await transporter.sendMail({
      from: `"HireMe" <${process.env.EMAIL_USER}>`,
      to: email,
      subject,
      html
    });
    
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

/**
 * Create a notification for a new interview request
 * @param {Object} interview - The interview object
 * @returns {Promise<Object>} The created notification
 */
const createInterviewRequestNotification = async (interview) => {
  try {
    const candidate = await interview.populate('candidate');
    const recruiter = await interview.populate('recruiter');
    
    // Create notification
    const notification = await createNotification({
      recipient: interview.candidate,
      recipientModel: 'Candidate',
      type: 'interview_request',
      title: 'New Interview Request',
      message: `You have a new interview request from ${recruiter.name || 'a recruiter'} at ${recruiter.company || 'a company'} for the ${interview.position.title} position.`,
      relatedTo: {
        model: 'Interview',
        id: interview._id
      },
      actionUrl: `/dashboard/candidate/interviews`
    });
    
    // Send email notification
    if (candidate.email) {
      const subject = 'New Interview Request on HireMe';
      const html = `
        <h1>New Interview Request</h1>
        <p>Hello ${candidate.name},</p>
        <p>You have received a new interview request from ${recruiter.name || 'a recruiter'} at ${recruiter.company || 'a company'} for the ${interview.position.title} position.</p>
        <p><strong>Date:</strong> ${new Date(interview.scheduledDateTime).toLocaleString()}</p>
        <p><strong>Duration:</strong> ${interview.duration} minutes</p>
        <p><strong>Position:</strong> ${interview.position.title}</p>
        ${interview.notes ? `<p><strong>Notes:</strong> ${interview.notes}</p>` : ''}
        <p>Please log in to your account to accept or decline this interview request.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/candidate/interviews" style="display:inline-block;background-color:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">View Interview Details</a>
      `;
      
      await sendEmailNotification(candidate.email, subject, html);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating interview request notification:', error);
    throw error;
  }
};

/**
 * Create a notification for an interview status update
 * @param {Object} interview - The interview object
 * @param {string} status - The new status
 * @returns {Promise<Object>} The created notification
 */
const createInterviewStatusNotification = async (interview, status) => {
  try {
    let recipientId, recipientModel, recipient, sender;
    
    // Determine recipient and sender
    if (status === 'accepted' || status === 'rejected') {
      // Notify recruiter
      recipientId = interview.recruiter;
      recipientModel = 'Recruiter';
      recipient = await interview.populate('recruiter');
      sender = await interview.populate('candidate');
    } else {
      // Notify candidate
      recipientId = interview.candidate;
      recipientModel = 'Candidate';
      recipient = await interview.populate('candidate');
      sender = await interview.populate('recruiter');
    }
    
    // Create notification title and message
    let title, message;
    
    switch (status) {
      case 'accepted':
        title = 'Interview Accepted';
        message = `${sender.name || 'The candidate'} has accepted your interview request for the ${interview.position.title} position.`;
        break;
      case 'rejected':
        title = 'Interview Declined';
        message = `${sender.name || 'The candidate'} has declined your interview request for the ${interview.position.title} position.`;
        break;
      case 'cancelled':
        title = 'Interview Cancelled';
        message = `${sender.name || 'The recruiter'} has cancelled the interview for the ${interview.position.title} position.`;
        break;
      case 'completed':
        title = 'Interview Completed';
        message = `Your interview for the ${interview.position.title} position has been marked as completed.`;
        break;
      default:
        title = 'Interview Status Update';
        message = `Your interview for the ${interview.position.title} position has been updated to ${status}.`;
    }
    
    // Create notification
    const notification = await createNotification({
      recipient: recipientId,
      recipientModel,
      type: `interview_${status}`,
      title,
      message,
      relatedTo: {
        model: 'Interview',
        id: interview._id
      },
      actionUrl: `/dashboard/${recipientModel.toLowerCase()}/interviews`
    });
    
    // Send email notification
    if (recipient.email) {
      const subject = `Interview ${status.charAt(0).toUpperCase() + status.slice(1)} on HireMe`;
      const html = `
        <h1>Interview ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
        <p>Hello ${recipient.name},</p>
        <p>${message}</p>
        <p><strong>Date:</strong> ${new Date(interview.scheduledDateTime).toLocaleString()}</p>
        <p><strong>Position:</strong> ${interview.position.title}</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/${recipientModel.toLowerCase()}/interviews" style="display:inline-block;background-color:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">View Interview Details</a>
      `;
      
      await sendEmailNotification(recipient.email, subject, html);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating interview status notification:', error);
    throw error;
  }
};

/**
 * Create a notification for interview feedback
 * @param {Object} interview - The interview object
 * @param {boolean} isShared - Whether the feedback is shared with the candidate
 * @returns {Promise<Object>} The created notification
 */
const createFeedbackNotification = async (interview, isShared = false) => {
  try {
    const recipient = await interview.populate('candidate');
    const sender = await interview.populate('recruiter');
    
    // Only notify the candidate if feedback is shared
    if (!isShared) {
      return null;
    }
    
    // Create notification
    const notification = await createNotification({
      recipient: interview.candidate,
      recipientModel: 'Candidate',
      type: 'feedback_shared',
      title: 'Interview Feedback Available',
      message: `${sender.name || 'The recruiter'} has shared feedback for your interview for the ${interview.position.title} position.`,
      relatedTo: {
        model: 'Interview',
        id: interview._id
      },
      actionUrl: `/dashboard/candidate/interviews/${interview._id}`
    });
    
    // Send email notification
    if (recipient.email) {
      const subject = 'Interview Feedback Available on HireMe';
      const html = `
        <h1>Interview Feedback Available</h1>
        <p>Hello ${recipient.name},</p>
        <p>${sender.name || 'The recruiter'} has shared feedback for your interview for the ${interview.position.title} position.</p>
        <p>Please log in to your account to view the feedback.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/candidate/interviews/${interview._id}" style="display:inline-block;background-color:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">View Feedback</a>
      `;
      
      await sendEmailNotification(recipient.email, subject, html);
    }
    
    return notification;
  } catch (error) {
    console.error('Error creating feedback notification:', error);
    throw error;
  }
};

/**
 * Create a reminder notification for upcoming interviews
 * @param {Object} interview - The interview object
 * @returns {Promise<Object>} The created notification
 */
const createInterviewReminderNotification = async (interview) => {
  try {
    // Create notifications for both candidate and recruiter
    const candidateNotification = await createNotification({
      recipient: interview.candidate,
      recipientModel: 'Candidate',
      type: 'interview_reminder',
      title: 'Upcoming Interview Reminder',
      message: `You have an interview for the ${interview.position.title} position in 24 hours.`,
      relatedTo: {
        model: 'Interview',
        id: interview._id
      },
      actionUrl: `/interviews/conference/${interview._id}`
    });
    
    const recruiterNotification = await createNotification({
      recipient: interview.recruiter,
      recipientModel: 'Recruiter',
      type: 'interview_reminder',
      title: 'Upcoming Interview Reminder',
      message: `You have an interview with a candidate for the ${interview.position.title} position in 24 hours.`,
      relatedTo: {
        model: 'Interview',
        id: interview._id
      },
      actionUrl: `/interviews/conference/${interview._id}`
    });
    
    // Populate candidate and recruiter objects
    const candidate = await interview.populate('candidate');
    const recruiter = await interview.populate('recruiter');
    
    // Send email notification to candidate
    if (candidate.email) {
      const subject = 'Upcoming Interview Reminder - HireMe';
      const html = `
        <h1>Upcoming Interview Reminder</h1>
        <p>Hello ${candidate.name},</p>
        <p>This is a reminder that you have an interview scheduled in 24 hours.</p>
        <p><strong>Date:</strong> ${new Date(interview.scheduledDateTime).toLocaleString()}</p>
        <p><strong>Position:</strong> ${interview.position.title}</p>
        <p><strong>Company:</strong> ${recruiter.company || 'Not specified'}</p>
        <p>Please be prepared and join the video call on time.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/interviews/conference/${interview._id}" style="display:inline-block;background-color:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">Join Interview</a>
      `;
      
      await sendEmailNotification(candidate.email, subject, html);
    }
    
    // Send email notification to recruiter
    if (recruiter.email) {
      const subject = 'Upcoming Interview Reminder - HireMe';
      const html = `
        <h1>Upcoming Interview Reminder</h1>
        <p>Hello ${recruiter.name},</p>
        <p>This is a reminder that you have an interview scheduled in 24 hours with ${candidate.name} for the ${interview.position.title} position.</p>
        <p><strong>Date:</strong> ${new Date(interview.scheduledDateTime).toLocaleString()}</p>
        <p><strong>Position:</strong> ${interview.position.title}</p>
        <p>Please be prepared and join the video call on time.</p>
        <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/interviews/conference/${interview._id}" style="display:inline-block;background-color:#4f46e5;color:white;padding:10px 20px;text-decoration:none;border-radius:5px;margin-top:10px;">Join Interview</a>
      `;
      
      await sendEmailNotification(recruiter.email, subject, html);
    }
    
    return { candidateNotification, recruiterNotification };
  } catch (error) {
    console.error('Error creating interview reminder notification:', error);
    throw error;
  }
};

/**
 * Send upcoming interview reminders (to be called by a scheduler)
 */
const sendInterviewReminders = async () => {
  try {
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    // Find interviews scheduled to start in the next 24 hours
    const interviews = await Interview.find({
      status: 'accepted',
      scheduledDateTime: {
        $gte: now,
        $lte: in24Hours
      }
    });
    
    console.log(`Sending reminders for ${interviews.length} upcoming interviews`);
    
    for (const interview of interviews) {
      await createInterviewReminderNotification(interview);
    }
    
    return interviews.length;
  } catch (error) {
    console.error('Error sending interview reminders:', error);
    throw error;
  }
};

module.exports = {
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createNotification,
  sendEmailNotification,
  createInterviewRequestNotification,
  createInterviewStatusNotification,
  createFeedbackNotification,
  createInterviewReminderNotification,
  sendInterviewReminders
}; 