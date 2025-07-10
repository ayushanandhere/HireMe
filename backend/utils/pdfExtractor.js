/**
 * PDF Text Extractor
 * Extracts text content from PDF files for processing by the AI resume parser
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

/**
 * Extract text from a PDF file
 * @param {string} filePath - Path to the PDF file
 * @returns {Promise<string>} - The extracted text content
 */
const extractTextFromPDF = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`PDF file not found at path: ${filePath}`);
    }
    
    // Read the PDF file as a buffer
    const dataBuffer = fs.readFileSync(filePath);
    
    // Parse the PDF content
    const data = await pdfParse(dataBuffer);
    
    // Return the extracted text
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    throw new Error('Failed to extract text from PDF file');
  }
};

module.exports = {
  extractTextFromPDF
}; 