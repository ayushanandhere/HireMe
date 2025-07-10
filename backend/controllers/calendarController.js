const { google } = require('googleapis');
const axios = require('axios');
const qs = require('querystring');
const Interview = require('../models/interviewModel');

// Google OAuth2 configuration
const googleOAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Generate iCal file for an interview
const generateICalFile = async (req, res) => {
  try {
    const interview = await Interview.findById(req.params.interviewId)
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email company');
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if user is authorized to view this interview
    if (
      req.user.role === 'candidate' && interview.candidate._id.toString() !== req.user._id.toString() ||
      req.user.role === 'recruiter' && interview.recruiter._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }
    
    // Create iCal content
    const startDate = new Date(interview.scheduledDateTime);
    const endDate = new Date(startDate.getTime() + interview.duration * 60 * 1000);
    
    // Format dates for iCal (YYYYMMDDTHHmmssZ)
    const formatDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d+/g, '');
    };
    
    const startFormatted = formatDate(startDate);
    const endFormatted = formatDate(endDate);
    
    // Generate unique ID for the event
    const uid = `interview-${interview._id}-${Date.now()}@hireme.com`;
    
    const organizerName = interview.recruiter.name;
    const organizerEmail = interview.recruiter.email;
    const attendeeName = interview.candidate.name;
    const attendeeEmail = interview.candidate.email;
    
    // Create iCal content
    const iCalContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//HireMe//Interview Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${startFormatted}`,
      `DTEND:${endFormatted}`,
      `SUMMARY:Interview: ${interview.position.title}`,
      `DESCRIPTION:Interview with ${interview.recruiter.company || 'Recruiter'} for ${interview.position.title} position.${interview.notes ? '\\n\\nNotes: ' + interview.notes.replace(/\r?\n/g, '\\n') : ''}`,
      `LOCATION:${interview.meetingLink || 'Video Conference'}`,
      `ORGANIZER;CN=${organizerName}:mailto:${organizerEmail}`,
      `ATTENDEE;CUTYPE=INDIVIDUAL;ROLE=REQ-PARTICIPANT;PARTSTAT=NEEDS-ACTION;RSVP=TRUE;CN=${attendeeName}:mailto:${attendeeEmail}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder for your upcoming interview',
      'TRIGGER:-PT30M',  // 30 minute reminder
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    // Set response headers for .ics file download
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename=interview-${interview._id}.ics`);
    res.send(iCalContent);
  } catch (error) {
    console.error('Error generating iCal file:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating calendar file'
    });
  }
};

// Generate Google Calendar authentication URL
const googleAuthUrl = (req, res) => {
  try {
    // Save interview ID to session for later use
    req.session.interviewId = req.query.interviewId;
    
    // Generate OAuth URL with calendar scope
    const scopes = [
      'https://www.googleapis.com/auth/calendar.events'
    ];
    
    const authUrl = googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: req.user._id.toString() // Pass user ID as state
    });
    
    res.json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    console.error('Error generating Google auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting Google Calendar authentication'
    });
  }
};

// Handle Google Calendar OAuth callback
const googleCallback = async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // Exchange code for tokens
    const { tokens } = await googleOAuth2Client.getToken(code);
    googleOAuth2Client.setCredentials(tokens);
    
    // Store tokens in user session or database
    // For production, you'd want to store these securely in a database
    req.session.googleTokens = tokens;
    
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/calendar/success?provider=google`);
  } catch (error) {
    console.error('Error in Google callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/calendar/error?provider=google`);
  }
};

// Add interview to Google Calendar
const addToGoogleCalendar = async (req, res) => {
  try {
    const { interviewId } = req.body;
    
    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }
    
    const interview = await Interview.findById(interviewId)
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email company');
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if user is authorized to access this interview
    if (
      req.user.role === 'candidate' && interview.candidate._id.toString() !== req.user._id.toString() ||
      req.user.role === 'recruiter' && interview.recruiter._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }
    
    // Ensure we have Google tokens
    if (!req.session.googleTokens) {
      return res.status(401).json({
        success: false,
        message: 'Google Calendar authentication required',
        authUrl: `/api/calendar/google/auth?interviewId=${interviewId}`
      });
    }
    
    // Set credentials
    googleOAuth2Client.setCredentials(req.session.googleTokens);
    
    // Create calendar event
    const calendar = google.calendar({ version: 'v3', auth: googleOAuth2Client });
    
    const startDate = new Date(interview.scheduledDateTime);
    const endDate = new Date(startDate.getTime() + interview.duration * 60 * 1000);
    
    const event = {
      summary: `Interview: ${interview.position.title}`,
      location: interview.meetingLink || 'Video Conference',
      description: `Interview with ${interview.recruiter.company || 'Recruiter'} for ${interview.position.title} position.\n\n${interview.notes || ''}`,
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC'
      },
      attendees: [
        { email: interview.candidate.email, displayName: interview.candidate.name },
        { email: interview.recruiter.email, displayName: interview.recruiter.name }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 }
        ]
      }
    };
    
    const result = await calendar.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: 'all'
    });
    
    res.status(200).json({
      success: true,
      data: {
        eventId: result.data.id,
        htmlLink: result.data.htmlLink
      },
      message: 'Interview added to Google Calendar'
    });
  } catch (error) {
    console.error('Error adding to Google Calendar:', error);
    
    // Check if token expired
    if (error.code === 401) {
      return res.status(401).json({
        success: false,
        message: 'Google Calendar authentication expired',
        authUrl: `/api/calendar/google/auth?interviewId=${req.body.interviewId}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error adding event to Google Calendar'
    });
  }
};

// Generate Outlook Calendar authentication URL
const outlookAuthUrl = (req, res) => {
  try {
    // Save interview ID to session for later use
    req.session.interviewId = req.query.interviewId;
    
    // Generate Microsoft OAuth URL
    const authParams = {
      client_id: process.env.MICROSOFT_CLIENT_ID,
      response_type: 'code',
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      scope: 'openid profile offline_access Calendars.ReadWrite',
      response_mode: 'query',
      state: req.user._id.toString() // Pass user ID as state
    };
    
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${qs.stringify(authParams)}`;
    
    res.json({
      success: true,
      url: authUrl
    });
  } catch (error) {
    console.error('Error generating Outlook auth URL:', error);
    res.status(500).json({
      success: false,
      message: 'Error starting Outlook Calendar authentication'
    });
  }
};

// Handle Outlook Calendar OAuth callback
const outlookCallback = async (req, res) => {
  const { code, state } = req.query;
  
  try {
    // Exchange code for tokens
    const tokenParams = {
      client_id: process.env.MICROSOFT_CLIENT_ID,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET,
      code,
      redirect_uri: process.env.MICROSOFT_REDIRECT_URI,
      grant_type: 'authorization_code'
    };
    
    const response = await axios.post(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      qs.stringify(tokenParams),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    // Store tokens in user session or database
    // For production, you'd want to store these securely in a database
    req.session.outlookTokens = response.data;
    
    // Redirect to frontend with success
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/calendar/success?provider=outlook`);
  } catch (error) {
    console.error('Error in Outlook callback:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/calendar/error?provider=outlook`);
  }
};

// Add interview to Outlook Calendar
const addToOutlookCalendar = async (req, res) => {
  try {
    const { interviewId } = req.body;
    
    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }
    
    const interview = await Interview.findById(interviewId)
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email company');
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Check if user is authorized to access this interview
    if (
      req.user.role === 'candidate' && interview.candidate._id.toString() !== req.user._id.toString() ||
      req.user.role === 'recruiter' && interview.recruiter._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this interview'
      });
    }
    
    // Ensure we have Outlook tokens
    if (!req.session.outlookTokens) {
      return res.status(401).json({
        success: false,
        message: 'Outlook Calendar authentication required',
        authUrl: `/api/calendar/outlook/auth?interviewId=${interviewId}`
      });
    }
    
    const startDate = new Date(interview.scheduledDateTime);
    const endDate = new Date(startDate.getTime() + interview.duration * 60 * 1000);
    
    // Create calendar event
    const event = {
      subject: `Interview: ${interview.position.title}`,
      body: {
        contentType: 'HTML',
        content: `<p>Interview with ${interview.recruiter.company || 'Recruiter'} for ${interview.position.title} position.</p><p>${interview.notes || ''}</p>`
      },
      start: {
        dateTime: startDate.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'UTC'
      },
      location: {
        displayName: interview.meetingLink || 'Video Conference'
      },
      attendees: [
        {
          emailAddress: {
            address: interview.candidate.email,
            name: interview.candidate.name
          },
          type: 'required'
        },
        {
          emailAddress: {
            address: interview.recruiter.email,
            name: interview.recruiter.name
          },
          type: 'required'
        }
      ],
      isReminderOn: true,
      reminderMinutesBeforeStart: 30
    };
    
    // Add to Outlook Calendar
    const response = await axios.post(
      'https://graph.microsoft.com/v1.0/me/events',
      event,
      {
        headers: {
          'Authorization': `Bearer ${req.session.outlookTokens.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.status(200).json({
      success: true,
      data: {
        eventId: response.data.id,
        webLink: response.data.webLink
      },
      message: 'Interview added to Outlook Calendar'
    });
  } catch (error) {
    console.error('Error adding to Outlook Calendar:', error);
    
    // Check if token expired
    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        success: false,
        message: 'Outlook Calendar authentication expired',
        authUrl: `/api/calendar/outlook/auth?interviewId=${req.body.interviewId}`
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error adding event to Outlook Calendar'
    });
  }
};

module.exports = {
  generateICalFile,
  googleAuthUrl,
  googleCallback,
  addToGoogleCalendar,
  outlookAuthUrl,
  outlookCallback,
  addToOutlookCalendar
}; 