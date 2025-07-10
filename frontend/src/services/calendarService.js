import api from './api';
import { saveAs } from 'file-saver';

/**
 * Calendar Service for handling calendar integrations
 * Supports Google Calendar, Outlook, and iCal formats
 */
class CalendarService {
  /**
   * Generate an iCal file for a single interview
   * @param {Object} interview - The interview object with date, time, and details
   * @returns {Blob} - iCal file as a Blob
   */
  generateICalFile(interview) {
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
      `DESCRIPTION:Interview with ${interview.recruiter?.company || 'Recruiter'} for ${interview.position.title} position.${interview.notes ? '\\n\\nNotes: ' + interview.notes.replace(/\r?\n/g, '\\n') : ''}`,
      `LOCATION:${interview.meetingLink || 'Video Conference'}`,
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Reminder for your upcoming interview',
      'TRIGGER:-PT30M',  // 30 minute reminder
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');
    
    // Create Blob from iCal content
    const iCalBlob = new Blob([iCalContent], { type: 'text/calendar;charset=utf-8' });
    return iCalBlob;
  }
  
  /**
   * Download an iCal file for a single interview
   * @param {Object} interview - The interview object
   */
  downloadICalFile(interview) {
    const iCalBlob = this.generateICalFile(interview);
    const fileName = `interview-${interview.position.title.replace(/\s+/g, '-').toLowerCase()}-${new Date(interview.scheduledDateTime).toISOString().split('T')[0]}.ics`;
    saveAs(iCalBlob, fileName);
  }
  
  /**
   * Generate a Google Calendar event URL
   * @param {Object} interview - The interview object
   * @returns {string} - Google Calendar event URL
   */
  getGoogleCalendarUrl(interview) {
    const startDate = new Date(interview.scheduledDateTime);
    const endDate = new Date(startDate.getTime() + interview.duration * 60 * 1000);
    
    // Format dates for Google Calendar (YYYYMMDDTHHMMSSZ)
    const formatDate = (date) => {
      return date.toISOString().replace(/-|:|\.\d+/g, '');
    };
    
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: `Interview: ${interview.position.title}`,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Interview with ${interview.recruiter?.company || 'Recruiter'} for ${interview.position.title} position.${interview.notes ? '\n\nNotes: ' + interview.notes : ''}`,
      location: interview.meetingLink || 'Video Conference',
      trp: 'true',
      sprop: 'website:hireme.com'
    });
    
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }
  
  /**
   * Generate an Outlook.com calendar event URL
   * @param {Object} interview - The interview object
   * @returns {string} - Outlook Calendar event URL
   */
  getOutlookCalendarUrl(interview) {
    const startDate = new Date(interview.scheduledDateTime);
    const endDate = new Date(startDate.getTime() + interview.duration * 60 * 1000);
    
    // Format dates for Outlook (YYYY-MM-DDTHH:MM:SS)
    const formatDate = (date) => {
      return date.toISOString().slice(0, 19);
    };
    
    const params = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      startdt: formatDate(startDate),
      enddt: formatDate(endDate),
      subject: `Interview: ${interview.position.title}`,
      body: `Interview with ${interview.recruiter?.company || 'Recruiter'} for ${interview.position.title} position.${interview.notes ? '\n\nNotes: ' + interview.notes : ''}`,
      location: interview.meetingLink || 'Video Conference'
    });
    
    return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
  }
  
  /**
   * Add an interview to Google Calendar via the API
   * (Note: This requires OAuth2 authentication)
   * @param {Object} interview - The interview object
   * @returns {Promise} - Result of the API call
   */
  async addToGoogleCalendar(interview) {
    try {
      const response = await api.post('/calendar/google', { interviewId: interview._id });
      return response.data;
    } catch (error) {
      console.error('Error adding to Google Calendar:', error);
      throw error;
    }
  }
  
  /**
   * Add an interview to Outlook Calendar via the API
   * (Note: This requires OAuth2 authentication)
   * @param {Object} interview - The interview object
   * @returns {Promise} - Result of the API call
   */
  async addToOutlookCalendar(interview) {
    try {
      const response = await api.post('/calendar/outlook', { interviewId: interview._id });
      return response.data;
    } catch (error) {
      console.error('Error adding to Outlook Calendar:', error);
      throw error;
    }
  }
}

export default new CalendarService(); 