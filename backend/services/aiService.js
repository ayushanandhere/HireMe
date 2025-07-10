/**
 * AI Service for Resume Parsing
 * Handles integration with OpenAI for advanced resume analysis and job-specific matching
 */

const OpenAI = require('openai');
const dotenv = require('dotenv');
dotenv.config();

// Initialize OpenAI client with API key from environment variables
let openai;
try {
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY is not set in environment variables');
  }
  
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  console.log('OpenAI client initialized successfully');
} catch (error) {
  console.error('Error initializing OpenAI client:', error);
}

// AI Provider configuration
const AI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

// Helper function for making API calls to OpenAI
const callLLM = async (prompt, systemPrompt = '') => {
  try {
    const messages = [
      { role: 'system', content: systemPrompt || 'You are an expert AI assistant for resume parsing and job matching.' },
      { role: 'user', content: prompt }
    ];

    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages,
      temperature: 0.2,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error calling AI service:', error);
    throw new Error(`AI service error: ${error.message}`);
  }
};

/**
 * AI Service for enhanced resume parsing
 */
class AIService {
  /**
   * Extract structured information from resume text using AI
   * @param {string} text - The resume text content
   * @returns {Promise<Object>} - Structured data extracted from the resume
   */
  async parseResumeWithAI(text) {
    try {
      // Truncate text if too long (OpenAI has token limits)
      const truncatedText = text.length > 15000 ? text.substring(0, 15000) + '...' : text;
      
      // Prepare the prompt for skills extraction
      const systemPrompt = `
        You are an expert resume parser and ATS system. Extract the following information from the resume text:
        1. Skills (both technical and soft skills)
        2. Work experience with company names, job titles, dates, and descriptions
        3. Education information with institution names, degrees, fields of study, and dates
        4. Any projects or certifications mentioned
        
        Format your response as a valid JSON object with the following structure:
        {
          "skills": ["skill1", "skill2", ...],
          "experience": [
            {
              "company": "Company Name",
              "role": "Job Title",
              "startDate": "YYYY-MM" or null if not specified,
              "endDate": "YYYY-MM" or "Present" or null if not specified,
              "description": "Job description summary",
              "current": true/false
            }
          ],
          "education": [
            {
              "institution": "Institution Name",
              "degree": "Degree Name",
              "fieldOfStudy": "Field of Study",
              "startDate": "YYYY" or null if not specified,
              "endDate": "YYYY" or "Present" or null if not specified,
              "current": true/false
            }
          ],
          "certifications": ["certification1", "certification2", ...],
          "projects": [
            {
              "name": "Project Name",
              "description": "Project description",
              "technologies": ["tech1", "tech2", ...]
            }
          ]
        }
        
        Ensure all dates are formatted properly or null if not specified.
        Include only the JSON object in your response, with no additional text.
      `;
      
      console.log('Using OpenAI API with model:', AI_MODEL);
      
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `Parse the following resume:\n\n${truncatedText}`
          }
        ],
        temperature: 0.3, // Lower temperature for more consistent results
        max_tokens: 1500, // Adjust based on needs and OpenAI limits
        response_format: { type: 'json_object' } // Ensure JSON response
      });
      
      // Parse the response
      const content = response.choices[0].message.content;
      console.log('Resume parsing completed successfully');
      
      const parsedData = JSON.parse(content);
      
      // Calculate ATS score based on the extracted data
      const atsScore = this.calculateAtsScore(parsedData, text);
      
      return {
        ...parsedData,
        atsScore
      };
    } catch (error) {
      console.error('AI resume parsing error:', error);
      // Fallback to basic data structure if AI fails
      return {
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        atsScore: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate ATS compatibility score based on various factors
   * @param {Object} parsedData - The parsed resume data
   * @param {string} rawText - The original resume text
   * @returns {number} - ATS score from 0-100
   */
  calculateAtsScore(parsedData, rawText) {
    let score = 0;
    const maxScore = 100;
    
    // 1. Skills assessment (up to 25 points)
    if (parsedData.skills) {
      const skillsCount = parsedData.skills.length;
      if (skillsCount > 15) score += 25;
      else if (skillsCount > 10) score += 20;
      else if (skillsCount > 5) score += 15;
      else if (skillsCount > 0) score += 10;
    }
    
    // 2. Experience details (up to 25 points)
    if (parsedData.experience) {
      const expCount = parsedData.experience.length;
      if (expCount > 0) {
        // Base points for having experience
        score += Math.min(expCount * 5, 15);
        
        // Quality check: Do experiences have descriptions?
        const hasDescriptions = parsedData.experience.some(exp => 
          exp.description && exp.description.length > 20
        );
        if (hasDescriptions) score += 5;
        
        // Quality check: Do experiences have dates?
        const hasDates = parsedData.experience.some(exp => 
          exp.startDate || exp.endDate
        );
        if (hasDates) score += 5;
      }
    }
    
    // 3. Education assessment (up to 15 points)
    if (parsedData.education) {
      const eduCount = parsedData.education.length;
      if (eduCount > 0) {
        // Base points for having education
        score += Math.min(eduCount * 5, 10);
        
        // Quality check: Complete education info?
        const hasComplete = parsedData.education.some(edu => 
          edu.institution && edu.degree && edu.fieldOfStudy
        );
        if (hasComplete) score += 5;
      }
    }
    
    // 4. Resume structure (up to 15 points)
    // Check if resume has common sections
    if (/skills|abilities|competencies/i.test(rawText)) score += 3;
    if (/experience|work history|employment/i.test(rawText)) score += 3;
    if (/education|academic|university|college|school/i.test(rawText)) score += 3;
    if (/projects|portfolio/i.test(rawText)) score += 3;
    if (/certifications|licenses|qualifications/i.test(rawText)) score += 3;
    
    // 5. Content quality (up to 10 points)
    // Word count - neither too short nor too long
    const wordCount = rawText.split(/\s+/).length;
    if (wordCount > 300 && wordCount < 1200) score += 5;
    else if (wordCount > 200) score += 3;
    
    // Check for action verbs
    const actionVerbs = /\b(achieved|improved|trained|managed|created|increased|reduced|delivered|developed|implemented|led|organized|designed|launched|negotiated|generated)\b/i;
    if (actionVerbs.test(rawText)) score += 5;
    
    // 6. Certifications and projects (up to 10 points)
    if (parsedData.certifications && parsedData.certifications.length > 0) {
      score += Math.min(parsedData.certifications.length * 2, 5);
    }
    
    if (parsedData.projects && parsedData.projects.length > 0) {
      score += Math.min(parsedData.projects.length * 2, 5);
    }
    
    // Ensure score is capped at maxScore
    return Math.min(Math.round(score), maxScore);
  }
  
  /**
   * Match a resume against a job description
   * @param {Object} resumeData - The parsed resume data
   * @param {Object} jobData - The job requirements data
   * @returns {Promise<Object>} - Match score and analysis
   */
  async matchResumeToJob(resumeData, jobData) {
    try {
      // Extract job requirements and resume skills for comparison
      const jobSkills = jobData.skills || [];
      const resumeSkills = resumeData.skills || [];
      
      // Basic matching: Calculate overlap between resume skills and job requirements
      const matchedSkills = resumeSkills.filter(skill => 
        jobSkills.some(jobSkill => 
          jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(jobSkill.toLowerCase())
        )
      );
      
      // Calculate match percentage
      const matchPercentage = jobSkills.length > 0 
        ? Math.round((matchedSkills.length / jobSkills.length) * 100) 
        : 0;
      
      // Find missing skills
      const missingSkills = jobSkills.filter(skill => 
        !resumeSkills.some(resumeSkill => 
          resumeSkill.toLowerCase().includes(skill.toLowerCase()) ||
          skill.toLowerCase().includes(resumeSkill.toLowerCase())
        )
      );
      
      // Generate suggestions based on missing skills
      let suggestions = [];
      if (missingSkills.length > 0) {
        suggestions.push(`Consider adding these missing skills to your resume: ${missingSkills.join(', ')}`);
      }
      
      // Check experience relevance (basic)
      const experienceRelevance = this.calculateExperienceRelevance(resumeData.experience, jobData);
      
      return {
        matchPercentage,
        matchedSkills,
        missingSkills,
        experienceRelevance,
        suggestions,
        overallMatch: this.calculateOverallMatch(matchPercentage, experienceRelevance)
      };
    } catch (error) {
      console.error('Resume-job matching error:', error);
      return {
        matchPercentage: 0,
        matchedSkills: [],
        missingSkills: [],
        experienceRelevance: 0,
        suggestions: ['Unable to analyze match due to an error'],
        overallMatch: 0,
        error: error.message
      };
    }
  }
  
  /**
   * Calculate relevance of candidate experience to job requirements
   * @param {Array} experiences - The candidate's experiences
   * @param {Object} jobData - The job data
   * @returns {number} - Relevance score (0-100)
   */
  calculateExperienceRelevance(experiences, jobData) {
    if (!experiences || experiences.length === 0 || !jobData.title) {
      return 0;
    }
    
    // Get keywords from job title and description
    const jobTitleKeywords = jobData.title.toLowerCase().split(/\s+/);
    const descriptionKeywords = jobData.description 
      ? jobData.description.toLowerCase().split(/\s+/).filter(word => word.length > 3)
      : [];
    
    // Common tech role indicators to look for
    const techRoles = ['developer', 'engineer', 'programmer', 'analyst', 'architect', 
                       'designer', 'administrator', 'manager', 'lead', 'devops',
                       'scientist', 'consultant'];
    
    // Combine all job keywords with weights
    const keywordWeights = {};
    
    // Title keywords are very important
    jobTitleKeywords.forEach(keyword => {
      if (keyword.length > 3) { // Skip short words
        keywordWeights[keyword] = 3; // Higher weight for title keywords
      }
    });
    
    // Description keywords are less important but still relevant
    descriptionKeywords.forEach(keyword => {
      if (keywordWeights[keyword]) {
        keywordWeights[keyword] += 1; // Add weight if already exists
      } else if (keyword.length > 3) {
        keywordWeights[keyword] = 1; // Base weight for description keywords
      }
    });
    
    // Add common tech roles if job appears to be technical
    if (jobData.skills && jobData.skills.some(skill => 
        ['programming', 'development', 'software', 'web', 'engineering', 'code']
        .some(tech => skill.toLowerCase().includes(tech)))) {
      techRoles.forEach(role => {
        keywordWeights[role] = keywordWeights[role] || 2;
      });
    }
    
    // Calculate experience points based on multiple factors
    let totalPoints = 0;
    let maxPossiblePoints = 0;
    
    experiences.forEach(exp => {
      if (!exp.role) return;
      
      let expPoints = 0;
      const roleWords = exp.role.toLowerCase().split(/\s+/);
      const companyWords = exp.company ? exp.company.toLowerCase().split(/\s+/) : [];
      const expDescription = exp.description ? exp.description.toLowerCase() : '';
      
      // 1. Keyword matching in role title (most important)
      Object.keys(keywordWeights).forEach(keyword => {
        // Direct matches in role title
        if (roleWords.includes(keyword) || exp.role.toLowerCase().includes(keyword)) {
          expPoints += 10 * keywordWeights[keyword];
        }
        
        // Matches in company name (less important)
        if (companyWords.some(word => word.includes(keyword) || keyword.includes(word))) {
          expPoints += 2 * keywordWeights[keyword];
        }
        
        // Matches in description (somewhat important)
        if (expDescription && expDescription.includes(keyword)) {
          expPoints += 5 * keywordWeights[keyword];
        }
      });
      
      // 2. Consider experience duration if available
      if (exp.startDate && (exp.endDate || exp.current)) {
        const startDate = new Date(exp.startDate);
        const endDate = exp.current ? new Date() : new Date(exp.endDate);
        
        if (!isNaN(startDate) && !isNaN(endDate)) {
          // Calculate duration in years
          const durationYears = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365);
          
          if (durationYears > 3) {
            expPoints *= 1.5; // Significant experience boost
          } else if (durationYears > 1) {
            expPoints *= 1.2; // Moderate experience boost
          }
        }
      }
      
      // 3. Consider recency - more recent experience is more valuable
      if (exp.endDate || exp.current) {
        const endDate = exp.current ? new Date() : new Date(exp.endDate);
        
        if (!isNaN(endDate)) {
          const yearsAgo = (new Date() - endDate) / (1000 * 60 * 60 * 24 * 365);
          
          if (yearsAgo < 1) {
            expPoints *= 1.5; // Very recent experience (within a year)
          } else if (yearsAgo < 3) {
            expPoints *= 1.25; // Recent experience (1-3 years)
          } else if (yearsAgo > 7) {
            expPoints *= 0.7; // Older experience (discount factor)
          }
        }
      }
      
      totalPoints += expPoints;
      // Each experience can contribute up to 100 points
      maxPossiblePoints += 100;
    });
    
    // Normalize to 0-100 scale
    const normalizedScore = maxPossiblePoints > 0 
      ? Math.min(100, (totalPoints / maxPossiblePoints) * 100) 
      : 0;
    
    return Math.round(normalizedScore);
  }
  
  /**
   * Calculate overall match score based on skills and experience
   * @param {number} skillsMatch - Skills match percentage
   * @param {number} experienceRelevance - Experience relevance score
   * @returns {number} - Overall match score (0-100)
   */
  calculateOverallMatch(skillsMatch, experienceRelevance) {
    // Weighted average: 70% skills, 30% experience
    return Math.round((skillsMatch * 0.7) + (experienceRelevance * 0.3));
  }

  /**
   * Parse resume specifically for a job posting with enhanced analysis
   * @param {string} resumeText - The resume text content
   * @param {Object} jobData - The job details
   * @returns {Promise<Object>} - Parsed resume data with detailed job-specific analysis
   */
  async parseResumeForJob(resumeText, jobData, resumeSource = 'unknown') {
    try {
      console.log(`Starting enhanced resume parsing for job using ${resumeSource} resume...`);
      
      // First, parse the resume to get structured data
      const parsedResume = await this.parseResumeWithAI(resumeText);
      
      // Then match it against the job
      const matchResult = await this.matchResumeToJob(parsedResume, jobData);
      
      // Generate enhanced analysis
      const enhancedAnalysis = await this.generateEnhancedAnalysis(resumeText, jobData, parsedResume);
      
      console.log('Enhanced resume parsing completed successfully');
      
      // Combine the results
      return {
        ...parsedResume,
        jobMatch: matchResult,
        jobSpecificAtsScore: this.calculateJobSpecificAtsScore(parsedResume, matchResult, jobData),
        enhancedAnalysis
      };
    } catch (error) {
      console.error('Error in job-specific resume parsing:', error);
      return {
        skills: [],
        experience: [],
        education: [],
        certifications: [],
        projects: [],
        atsScore: 0,
        jobMatch: {
          matchPercentage: 0,
          matchedSkills: [],
          missingSkills: [],
          experienceRelevance: 0,
          suggestions: ['Error analyzing resume for this job'],
          overallMatch: 0
        },
        jobSpecificAtsScore: 0,
        enhancedAnalysis: {
          candidateRoleFit: { score: 0, explanation: 'Error analyzing resume' },
          skillProficiency: [],
          softSkills: [],
          projectRelevance: [],
          strengthsWeaknesses: { strengths: [], weaknesses: [] },
          redFlags: []
        },
        error: error.message
      };
    }
  }

  /**
   * Calculate job-specific ATS score
   * @param {Object} parsedResume - The parsed resume data
   * @param {Object} matchResult - The job match result
   * @param {Object} jobData - The job details
   * @returns {number} - Job-specific ATS score (0-100)
   */
  calculateJobSpecificAtsScore(parsedResume, matchResult, jobData) {
    // Start with the base ATS score (40% weight)
    let score = parsedResume.atsScore * 0.4;
    
    // Add job match score (60% weight)
    score += matchResult.overallMatch * 0.6;
    
    // Bonus points for having all required skills (up to 10 points)
    if (matchResult.missingSkills.length === 0 && matchResult.matchedSkills.length > 0) {
      score += 10;
    }
    
    // Penalty for missing critical skills
    const criticalSkillsMissing = jobData.skills?.filter(skill => 
      skill.toLowerCase().includes('required') || 
      skill.toLowerCase().includes('must') ||
      skill.toLowerCase().includes('essential')
    ).length || 0;
    
    if (criticalSkillsMissing > 0) {
      score -= criticalSkillsMissing * 5;
    }
    
    // Ensure score is between 0-100
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * Generate enhanced analysis for the resume
   * @param {string} resumeText - The resume text content
   * @param {Object} jobData - The job details
   * @param {Object} parsedResume - The parsed resume data
   * @returns {Promise<Object>} - Enhanced analysis results
   */
  async generateEnhancedAnalysis(resumeText, jobData, parsedResume) {
    try {
      console.log('Generating enhanced resume analysis...');
      
      // Prepare job description text
      const jobDescription = `
        Job Title: ${jobData.title || 'Not specified'}
        Description: ${jobData.description || 'Not specified'}
        Required Skills: ${jobData.skills?.join(', ') || 'Not specified'}
        Experience Level: ${jobData.experienceLevel || 'Not specified'}
        Experience Years: ${jobData.experienceYears || 'Not specified'}
        Education Requirements: ${jobData.educationRequirements || 'Not specified'}
      `;
      
      // Create the prompt for enhanced analysis
      const analysisPrompt = `
        I need a detailed analysis of a candidate's resume for a job position. I'll provide both the resume text and job description.
        
        Resume Text:
        ${resumeText.substring(0, 3000)}... [truncated for length]
        
        Job Description:
        ${jobDescription}
        
        Please provide the following analysis in JSON format:
        
        1. Candidate-Role Fit Score: Evaluate how well this resume matches the given job description. Provide a score out of 100 and a short explanation.
        
        2. Top Skill Proficiency Ratings: Identify the candidate's top 5 technical skills from the resume and rate each out of 10 based on apparent proficiency.
        
        3. Soft Skills Inference: Infer 3 soft skills from the resume with one-line justifications for each.
        
        4. Project Relevance to Job Role: Extract 2-3 major projects from the resume and rate their relevance to this job role on a scale of 1-10. Include title and 2 lines of reasoning for each.
        
        5. Role-Specific Strengths & Weaknesses: Based on the job description and resume, list 3 strengths and 2 weaknesses of the candidate for this role.
        
        6. Red Flags / Missing Elements: List any potential concerns or missing qualifications in this resume relevant to the role (e.g., lack of leadership, no cloud experience).
        
        Return ONLY a JSON object with the following structure:
        {
          "candidateRoleFit": { "score": number, "explanation": "string" },
          "skillProficiency": [{ "skill": "string", "rating": number }],
          "softSkills": [{ "skill": "string", "justification": "string" }],
          "projectRelevance": [{ "title": "string", "relevanceScore": number, "reasoning": "string" }],
          "strengthsWeaknesses": { "strengths": ["string"], "weaknesses": ["string"] },
          "redFlags": ["string"]
        }
      `;
      
      // Call OpenAI API for enhanced analysis
      const response = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are an expert resume analyzer and job matching specialist.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      });
      
      // Parse the response
      const content = response.choices[0].message.content;
      console.log('Enhanced analysis completed successfully');
      
      const enhancedAnalysis = JSON.parse(content);
      
      return enhancedAnalysis;
    } catch (error) {
      console.error('Error generating enhanced analysis:', error);
      
      // Return default structure if analysis fails
      return {
        candidateRoleFit: { score: 0, explanation: 'Error analyzing candidate-role fit' },
        skillProficiency: [],
        softSkills: [],
        projectRelevance: [],
        strengthsWeaknesses: { strengths: [], weaknesses: [] },
        redFlags: []
      };
    }
  }
}

module.exports = new AIService();
