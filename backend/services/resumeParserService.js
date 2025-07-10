/**
 * Resume Parser Service
 * Handles parsing of resumes and extraction of relevant information
 * Uses AI for enhanced parsing
 */

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);
const AIService = require('./aiService');

/**
 * Resume Parser Service
 * 
 * Provides methods to extract information from resume files
 * Supports PDF and DOCX formats with AI-enhanced parsing
 */
class ResumeParserService {
  /**
   * Parse a resume file and extract text content and information
   * @param {string} filePath - Path to the resume file
   * @returns {Promise<Object>} - Extracted data from the resume
   */
  async parseResume(filePath) {
    try {
      // First check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error('Resume file not found');
      }

      const fileExtension = path.extname(filePath).toLowerCase();
      let text = '';
      
      // Try to extract text from file but don't fail if it doesn't work
      try {
        if (fileExtension === '.pdf') {
          text = await this.parsePdf(filePath);
        } else if (fileExtension === '.docx') {
          text = await this.parseDocx(filePath);
        } else {
          // For unsupported formats, just get the file info
          text = `File: ${path.basename(filePath)} (${fileExtension})`;
        }
      } catch (extractionError) {
        console.log('Basic text extraction failed, proceeding with AI parsing:', extractionError.message);
        // Don't throw error here, we'll try AI parsing with minimal info
        text = `Resume file: ${path.basename(filePath)}`;
      }
      
      // Use AI to parse the resume regardless of whether we got text or not
      try {
        const aiResults = await AIService.parseResumeWithAI(text);
        
        // AI service will return a complete structured result
        return {
          ...aiResults,
          rawText: text.substring(0, 500) + '...' // Include part of the raw text for debugging
        };
      } catch (aiError) {
        console.error('AI parsing failed:', aiError);
        
        // If AI failed, fall back to very basic information
        return {
          skills: [],
          experience: "Could not extract experience",
          education: [],
          atsScore: 0,
          rawText: text.substring(0, 500) + '...',
          error: aiError.message
        };
      }
    } catch (error) {
      console.error('Resume parsing failed:', error);
      throw error;
    }
  }

  /**
   * Parse PDF file and extract text (basic implementation)
   * @param {string} filePath 
   * @returns {Promise<string>}
   */
  async parsePdf(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text || '';
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw error;
    }
  }

  /**
   * Parse DOCX file and extract text
   * @param {string} filePath 
   * @returns {Promise<string>}
   */
  async parseDocx(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value || '';
    } catch (error) {
      console.error('Error parsing DOCX:', error);
      throw error;
    }
  }

  /**
   * Main method to parse a resume file
   * @param {string} filePath Path to the resume file
   * @returns {Promise<Object>} Parsed resume data
   */
  static async parseResume(filePath) {
    try {
      const instance = new ResumeParserService();
      return await instance.parseResume(filePath);
    } catch (error) {
      throw new Error(`Resume parsing failed: ${error.message}`);
    }
  }
}

module.exports = ResumeParserService; 