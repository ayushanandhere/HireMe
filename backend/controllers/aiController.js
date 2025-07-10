const asyncHandler = require('express-async-handler');
const Interview = require('../models/interviewModel');
const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const Candidate = require('../models/candidateModel');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Helper function to extract text from PDF
const extractTextFromPDF = async (resumePath) => {
  try {
    // Read the PDF file
    const dataBuffer = fs.readFileSync(resumePath);
    
    // Parse the PDF content
    const data = await pdfParse(dataBuffer);
    
    // Return the text content
    return data.text;
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return "Unable to extract resume text. Using available profile data instead.";
  }
};

// Get initial context for the AI assistant
exports.getInitialContext = async (req, res) => {
  try {
    const { interviewId } = req.params;
    
    // Validate interviewId
    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }
    
    // Fetch interview details with populated candidate and job info
    const interview = await Interview.findById(interviewId)
      .populate({
        path: 'candidate',
        select: '-password'
      })
      .populate('recruiter')
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'job' },
          { path: 'candidate', select: '-password' }
        ]
      });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Extract candidate information
    const candidate = interview.candidate;
    
    // Extract job information
    const job = interview.applicationId?.job || { 
      title: interview.position.title,
      description: interview.position.description || ''
    };
    
    // Extract application information if available
    const application = interview.applicationId;
    
    // Prepare candidate information summary
    let candidateInfo = {
      name: candidate.name,
      email: candidate.email,
      skills: candidate.skills || '',
      parsedSkills: candidate.parsedSkills || [],
      experience: candidate.experience || '',
      education: []
    };
    
    // Add parsed experience if available
    if (candidate.parsedExperience && candidate.parsedExperience.length > 0) {
      candidateInfo.parsedExperience = candidate.parsedExperience.map(exp => ({
        company: exp.company,
        role: exp.role,
        startDate: exp.startDate,
        endDate: exp.endDate || 'Present',
        description: exp.description,
        current: exp.current
      }));
    }
    
    // Add parsed education if available
    if (candidate.parsedEducation && candidate.parsedEducation.length > 0) {
      candidateInfo.education = candidate.parsedEducation.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate || 'Present',
        current: edu.current
      }));
    }
    
    // Add ATS score if available
    if (candidate.atsScore) {
      candidateInfo.atsScore = candidate.atsScore;
    }
    
    // Add application-specific information if available
    let applicationInfo = {};
    if (application) {
      applicationInfo = {
        stage: application.stage,
        matchScore: application.matchScore || 0,
        skillsMatch: application.skillsMatch || 0,
        experienceRelevance: application.experienceRelevance || 0,
        matchedSkills: application.matchedSkills || [],
        missingSkills: application.missingSkills || [],
        atsScore: application.atsScore || 0,
        candidateRoleFit: application.candidateRoleFit || 0,
        candidateRoleFitExplanation: application.candidateRoleFitExplanation || ''
      };
    }
    
    // Prepare initial message with more personalized information
    let initialMessage = `Hello! I'm your AI interview assistant for the upcoming interview with ${candidate.name} for the ${job.title} position. `;
    
    // Add more personalized information if available
    if (application && application.candidateRoleFit) {
      initialMessage += `Based on our analysis, this candidate has a ${application.candidateRoleFit}% role fit for this position. `;
    }
    
    if (application && application.skillsMatch) {
      initialMessage += `They match ${application.skillsMatch}% of the required skills. `;
    }
    
    initialMessage += "I can help you prepare by providing detailed information about the candidate's background, suggesting relevant questions, and offering interview strategies. ";
    initialMessage += "What would you like to know?";
    
    return res.status(200).json({
      success: true,
      data: {
        initialMessage,
        candidate: candidateInfo,
        job: {
          title: job.title,
          description: job.description || interview.position.description || '',
          company: job.company,
          location: job.location,
          type: job.type,
          skills: job.skills || [],
          experienceLevel: job.experienceLevel,
          experienceYears: job.experienceYears
        },
        application: applicationInfo
      }
    });
    
  } catch (error) {
    console.error('Error getting AI assistant context:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get AI assistant context'
    });
  }
};

// Handle AI assistant messages
exports.handleMessage = async (req, res) => {
  try {
    const { message, interviewId, candidateId, jobId, responseMode = 'normal' } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    if (!interviewId) {
      return res.status(400).json({
        success: false,
        message: 'Interview ID is required'
      });
    }
    
    // Fetch interview details with comprehensive population
    const interview = await Interview.findById(interviewId)
      .populate({
        path: 'candidate',
        select: '-password'
      })
      .populate('recruiter')
      .populate({
        path: 'applicationId',
        populate: [
          { path: 'job' },
          { path: 'candidate', select: '-password' }
        ]
      });
    
    if (!interview) {
      return res.status(404).json({
        success: false,
        message: 'Interview not found'
      });
    }
    
    // Get candidate information
    const candidate = interview.candidate;
    
    // Get job information
    const job = interview.applicationId?.job || { 
      title: interview.position.title,
      description: interview.position.description || ''
    };
    
    // Get application information if available
    const application = interview.applicationId;
    
    // Check if candidate has a resume and extract text
    let resumeText = "No resume available for this candidate.";
    if (candidate.resumePath) {
      const resumeFullPath = path.join(__dirname, '..', candidate.resumePath);
      if (fs.existsSync(resumeFullPath)) {
        resumeText = await extractTextFromPDF(resumeFullPath);
      }
    }
    
    // Prepare detailed candidate information
    let candidateDetails = `
    Candidate Information:
    - Name: ${candidate.name}
    - Email: ${candidate.email}
    - Current Position: ${candidate.currentPosition || 'Not specified'}
    - Skills: ${candidate.skills || 'Not specified'}
    - Years of Experience: ${candidate.yearsOfExperience || 'Not specified'}
    - Location: ${candidate.location || 'Not specified'}
    - LinkedIn: ${candidate.linkedin || 'Not provided'}
    - Portfolio/GitHub: ${candidate.portfolio || candidate.github || 'Not provided'}
    `;
    
    // Add parsed skills if available
    if (candidate.parsedSkills && candidate.parsedSkills.length > 0) {
      candidateDetails += `- Parsed Skills: ${candidate.parsedSkills.join(', ')}
`;
    }
    
    // Add experience information
    candidateDetails += `- Experience Level: ${candidate.experience || 'Not specified'}
`;
    
    // Add parsed experience details if available
    if (candidate.parsedExperience && candidate.parsedExperience.length > 0) {
      candidateDetails += `
Detailed Work Experience:
`;
      candidate.parsedExperience.forEach(exp => {
        candidateDetails += `- ${exp.role || 'Role not specified'} at ${exp.company || 'Company not specified'}`;
        if (exp.startDate) {
          const startDate = new Date(exp.startDate).toLocaleDateString();
          const endDate = exp.current ? 'Present' : (exp.endDate ? new Date(exp.endDate).toLocaleDateString() : 'End date not specified');
          candidateDetails += ` (${startDate} - ${endDate})`;
        }
        if (exp.description) {
          candidateDetails += `\n  Description: ${exp.description}`;
        }
        candidateDetails += '\n';
      });
    }
    
    // Add education information if available
    if (candidate.parsedEducation && candidate.parsedEducation.length > 0) {
      candidateDetails += `\nEducation:\n`;
      candidate.parsedEducation.forEach(edu => {
        candidateDetails += `- ${edu.degree || 'Degree not specified'} in ${edu.fieldOfStudy || 'Field not specified'} from ${edu.institution || 'Institution not specified'}`;
        if (edu.startDate) {
          const startDate = new Date(edu.startDate).toLocaleDateString();
          const endDate = edu.current ? 'Present' : (edu.endDate ? new Date(edu.endDate).toLocaleDateString() : 'End date not specified');
          candidateDetails += ` (${startDate} - ${endDate})`;
        }
        candidateDetails += '\n';
      });
    }
    
    // Add ATS score if available
    if (candidate.atsScore) {
      candidateDetails += `\nATS Score: ${candidate.atsScore}/100\n`;
    }
    
    // Prepare detailed job information
    let jobDetails = `
    Job Information:
    - Title: ${job.title}
    - Company: ${job.company || 'Not specified'}
    - Location: ${job.location || 'Not specified'}
    - Type: ${job.type || 'Not specified'}
    - Experience Level: ${job.experienceLevel || 'Not specified'}
    `;
    
    // Add job skills if available
    if (job.skills && job.skills.length > 0) {
      jobDetails += `- Required Skills: ${Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}\n`;
    }
    
    // Add job description
    if (job.description) {
      jobDetails += `\nJob Description:\n${job.description}\n`;
    }
    
    // Prepare application analysis information if available
    let applicationAnalysis = '';
    if (application) {
      applicationAnalysis = `
      Application Analysis:
      - Current Stage: ${application.stage || 'Not specified'}
      - Overall Match Score: ${application.matchScore || 0}/100
      - Skills Match: ${application.skillsMatch || 0}/100
      - Experience Relevance: ${application.experienceRelevance || 0}/100
      - ATS Score: ${application.atsScore || 0}/100
      - Candidate Role Fit: ${application.candidateRoleFit || 0}/100
      `;
      
      // Add matched and missing skills
      if (application.matchedSkills && application.matchedSkills.length > 0) {
        applicationAnalysis += `- Matched Skills: ${application.matchedSkills.join(', ')}\n`;
      }
      
      if (application.missingSkills && application.missingSkills.length > 0) {
        applicationAnalysis += `- Missing Skills: ${application.missingSkills.join(', ')}\n`;
      }
      
      // Add role fit explanation if available
      if (application.candidateRoleFitExplanation) {
        applicationAnalysis += `\nRole Fit Analysis:\n${application.candidateRoleFitExplanation}\n`;
      }
    }
    
    // Prepare system message with comprehensive context
    const systemMessage = `You are an AI interview assistant helping a recruiter prepare for an interview with a candidate. You have access to detailed information about the candidate, the job, and the application analysis.

${candidateDetails}

${jobDetails}

${applicationAnalysis}

Resume Content:
${resumeText}

Your role is to help the recruiter prepare for the interview by:
1. Providing detailed insights about the candidate based on their profile, resume, and application analysis
2. Suggesting specific and relevant questions tailored to the candidate's background and the job requirements
3. Highlighting potential areas of strength and weakness to explore during the interview
4. Offering interview strategies and best practices specific to this candidate and role
5. Helping assess the candidate's fit for the role based on all available data
6. Suggesting technical questions that can validate the candidate's claimed skills
7. Recommending behavioral questions that can reveal the candidate's soft skills and work style
8. Providing guidance on how to address any gaps or mismatches between the candidate's profile and job requirements

When analyzing the candidate's skills:
- Evaluate both technical and soft skills relevant to the position
- Identify which skills are verifiable from their experience vs. which need validation
- Suggest specific questions to test their proficiency in critical skills
- Highlight any unique or standout skills that differentiate this candidate

When discussing resume parsing results:
- Provide insights on how the candidate's experience aligns with job requirements
- Analyze career progression and growth trajectory
- Identify potential red flags or inconsistencies in the resume
- Suggest questions to clarify any ambiguous points in their work history

When addressing role fit:
- Provide a nuanced analysis of why the candidate may or may not be suitable
- Consider both technical qualifications and potential cultural fit
- Suggest questions to reveal the candidate's work style and values
- Offer strategies to assess adaptability and growth potential

Be thorough, professional, and insightful. Focus on providing actionable advice that will help the recruiter conduct an effective interview. When suggesting questions, make them specific to this candidate's background and the job requirements. If asked about specific aspects of the candidate's profile or the job, provide detailed and accurate information based on the data provided.

If you don't have specific information about something you're asked, acknowledge this limitation rather than making assumptions. Always maintain a professional tone and focus on helping the recruiter make an informed decision about the candidate.

Your answers should be:
- Comprehensive: Cover all relevant aspects of the question
- Evidence-based: Reference specific details from the candidate's profile or resume
- Practical: Provide actionable insights and specific questions
- Balanced: Present both strengths and potential concerns
- Concise: Deliver information in a clear, organized manner`;
    
    // Prepare a more detailed context for the AI based on the specific question
    let contextualizedSystemMessage = systemMessage;
    
    // Add formatting instructions based on response mode
    if (responseMode.toLowerCase() === 'normal') {
      contextualizedSystemMessage += `

FORMATTING INSTRUCTIONS (VERY IMPORTANT):
- Present your response in a clean, well-formatted manner using proper Markdown formatting
- Use concise paragraphs with clear headings (use ## for main headings and ### for subheadings)
- Be direct and to the point - prioritize brevity and clarity
- Use **bold text** for emphasis on important points and concepts
- Use *italics* for definitions or to highlight secondary information
- For numbered lists, use proper Markdown numbered lists (1., 2., etc.)
- For bullet points, use proper Markdown format with dashes (- item)
- When suggesting questions, format them as a numbered list with each question in **bold**
- Keep your answers focused and direct
- Use proper spacing between paragraphs for readability
- Overall response should be concise and scannable with proper formatting`;
    } else if (responseMode.toLowerCase() === 'deep') {
      contextualizedSystemMessage += `

FORMATTING INSTRUCTIONS (VERY IMPORTANT):
- Present your response in well-structured, detailed paragraphs using proper Markdown formatting
- Use ## for main section headings and ### for subsection headings
- Provide comprehensive analysis with supporting evidence
- Use **bold text** for key concepts, important points, and conclusions
- Use *italics* for definitions, quotes, or to highlight nuanced points
- Develop your thoughts fully with nuanced explanations
- For numbered lists, use proper Markdown numbered lists (1., 2., etc.)
- For bullet points, use proper Markdown format with dashes (- item)
- Use proper formatting with clear paragraph structure
- Connect ideas with smooth transitions between paragraphs
- When suggesting questions, format them as a numbered list with each question in **bold**
- Explore multiple perspectives and considerations
- Use proper spacing between sections for readability
- Overall response should be thorough and insightful with proper formatting`;
    }
    
    // Add more specific guidance based on message content
    if (message.toLowerCase().includes('technical question') || message.toLowerCase().includes('coding question')) {
      contextualizedSystemMessage += `

For technical questions, focus on:
- Questions that verify proficiency in the specific technologies mentioned in their resume
- Practical scenarios they might encounter in this role
- Questions that reveal problem-solving approach rather than just knowledge
- Different difficulty levels to assess depth of knowledge
- Both theoretical understanding and practical application`;
    }
    
    if (message.toLowerCase().includes('behavioral') || message.toLowerCase().includes('soft skills')) {
      contextualizedSystemMessage += `

For behavioral questions, focus on:
- Scenarios relevant to the company culture and team dynamics
- Questions that reveal communication style and conflict resolution
- Leadership potential and team collaboration
- Adaptability and growth mindset
- Previous challenges and how they were overcome`;
    }
    
    if (message.toLowerCase().includes('strength') || message.toLowerCase().includes('weakness')) {
      contextualizedSystemMessage += `

When discussing strengths and weaknesses:
- Connect strengths directly to job requirements with specific examples
- Suggest questions that verify claimed strengths
- For weaknesses, focus on areas for growth relevant to the role
- Suggest questions that reveal self-awareness and improvement efforts`;
    }
    
    if (message.toLowerCase().includes('role fit') || message.toLowerCase().includes('job fit')) {
      contextualizedSystemMessage += `

When assessing role fit:
- Analyze alignment between candidate experience and specific job responsibilities
- Consider both technical qualifications and soft skills required
- Evaluate potential for growth within the role
- Identify any gaps and how they might be addressed
- Consider cultural fit based on available information`;
    }
    
    // Call OpenAI API with the enhanced system message
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      messages: [
        { role: "system", content: contextualizedSystemMessage },
        { role: "user", content: message }
      ],
      max_tokens: responseMode.toLowerCase() === 'deep' ? 2500 : 1800,
      temperature: responseMode.toLowerCase() === 'deep' ? 0.7 : 0.6
    });
    
    // Extract response
    const aiResponse = completion.choices[0].message.content;
    
    // Process the response to ensure proper formatting
    let formattedResponse = aiResponse;
    
    // Ensure proper paragraph spacing
    formattedResponse = formattedResponse.replace(/\n{3,}/g, '\n\n');
    
    // Make sure Markdown formatting is preserved
    // We don't need to replace asterisks as they're now used for bold/italic formatting
    
    return res.status(200).json({
      success: true,
      data: {
        message: formattedResponse,
        mode: responseMode
      }
    });
    
  } catch (error) {
    console.error('Error handling AI assistant message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process message with AI assistant'
    });
  }
};

// Get initial context for the candidate AI training assistant
exports.getTrainingContext = async (req, res) => {
  try {
    const { applicationId } = req.params;
    
    // Validate applicationId
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }
    
    // Fetch application details with populated candidate and job info
    const application = await Application.findById(applicationId)
      .populate({
        path: 'candidate',
        select: '-password'
      })
      .populate('job');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Extract candidate information
    const candidate = application.candidate;
    
    // Extract job information
    const job = application.job;
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found for this application'
      });
    }
    
    // Prepare candidate information summary
    let candidateInfo = {
      name: candidate.name,
      email: candidate.email,
      skills: candidate.skills || '',
      parsedSkills: candidate.parsedSkills || [],
      experience: candidate.experience || '',
      education: []
    };
    
    // Add parsed experience if available
    if (candidate.parsedExperience && candidate.parsedExperience.length > 0) {
      candidateInfo.parsedExperience = candidate.parsedExperience.map(exp => ({
        company: exp.company,
        role: exp.role,
        startDate: exp.startDate,
        endDate: exp.endDate || 'Present',
        description: exp.description,
        current: exp.current
      }));
    }
    
    // Add parsed education if available
    if (candidate.parsedEducation && candidate.parsedEducation.length > 0) {
      candidateInfo.education = candidate.parsedEducation.map(edu => ({
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: edu.startDate,
        endDate: edu.endDate || 'Present',
        current: edu.current
      }));
    }
    
    // Add ATS score if available
    if (candidate.atsScore) {
      candidateInfo.atsScore = candidate.atsScore;
    }
    
    // Add application-specific information
    let applicationInfo = {
      stage: application.stage,
      matchScore: application.matchScore || 0,
      skillsMatch: application.skillsMatch || 0,
      experienceRelevance: application.experienceRelevance || 0,
      matchedSkills: application.matchedSkills || [],
      missingSkills: application.missingSkills || [],
      atsScore: application.atsScore || 0,
      candidateRoleFit: application.candidateRoleFit || 0,
      candidateRoleFitExplanation: application.candidateRoleFitExplanation || ''
    };
    
    // Prepare initial message with personalized information for the candidate
    let initialMessage = `Hello ${candidate.name}! I'm your AI interview training assistant for the ${job.title} position at ${job.company}. `;
    
    // Add more personalized information if available
    if (application.candidateRoleFit) {
      initialMessage += `Based on our analysis, you have a ${application.candidateRoleFit}% role fit for this position. `;
    }
    
    if (application.skillsMatch) {
      initialMessage += `You match ${application.skillsMatch}% of the required skills. `;
    }
    
    if (application.missingSkills && application.missingSkills.length > 0) {
      initialMessage += `I can help you prepare for questions about ${application.missingSkills.join(', ')}, which are skills mentioned in the job description that weren't found in your resume. `;
    }
    
    initialMessage += "I'm here to help you prepare for your interview by providing guidance on technical concepts, suggesting practice questions, and offering interview strategies tailored to this role. ";
    initialMessage += "What specific aspect of the interview would you like help with today?";
    
    return res.status(200).json({
      success: true,
      data: {
        initialMessage,
        candidate: candidateInfo,
        job: {
          title: job.title,
          description: job.description || '',
          company: job.company,
          location: job.location,
          type: job.type,
          skills: job.skills || [],
          experienceLevel: job.experienceLevel,
          experienceYears: job.experienceYears
        },
        application: applicationInfo
      }
    });
    
  } catch (error) {
    console.error('Error getting AI training assistant context:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to get AI training assistant context'
    });
  }
};

// Handle AI training assistant messages
exports.handleTrainingMessage = async (req, res) => {
  try {
    const { message, applicationId, responseMode = 'normal' } = req.body;
    
    // Validate required fields
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }
    
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }
    
    // Fetch application details with comprehensive population
    const application = await Application.findById(applicationId)
      .populate({
        path: 'candidate',
        select: '-password'
      })
      .populate('job');
    
    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }
    
    // Extract candidate and job information
    const candidate = application.candidate;
    const job = application.job;
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found for this application'
      });
    }
    
    // Resume analysis data would be fetched here if we had the model
    // For now, we'll use the application data we already have
    let resumeAnalysis = null;
    
    // Prepare system prompt for the AI
    let systemPrompt = `You are an advanced AI interview training assistant helping a candidate prepare for a job interview. You are a study companion and smart guide for the candidate, providing extremely accurate and context-aware responses.

## CANDIDATE PROFILE
Name: ${candidate.name}
Current Skills: ${candidate.skills || candidate.parsedSkills?.join(', ') || 'Not specified'}
Experience: ${candidate.experience || 'Not specified'}
${candidate.currentPosition ? `Current Position: ${candidate.currentPosition}` : ''}
${candidate.location ? `Location: ${candidate.location}` : ''}
${candidate.yearsOfExperience ? `Years of Experience: ${candidate.yearsOfExperience}` : ''}
${candidate.portfolio ? `Portfolio: ${candidate.portfolio}` : ''}
${candidate.github ? `GitHub: ${candidate.github}` : ''}
${candidate.linkedin ? `LinkedIn: ${candidate.linkedin}` : ''}

${candidate.parsedExperience && candidate.parsedExperience.length > 0 ? 
`## WORK HISTORY
${candidate.parsedExperience.map(exp => 
  `- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n  ${exp.description || ''}`
).join('\n')}` : ''}

${candidate.parsedEducation && candidate.parsedEducation.length > 0 ? 
`## EDUCATION
${candidate.parsedEducation.map(edu => 
  `- ${edu.degree} in ${edu.fieldOfStudy} from ${edu.institution} (${edu.startDate} - ${edu.endDate || 'Present'})`
).join('\n')}` : ''}

## JOB DETAILS
Title: ${job.title}
Company: ${job.company}
Location: ${job.location || 'Not specified'}
Job Type: ${job.type || 'Not specified'}
Experience Level: ${job.experienceLevel || 'Not specified'}
Required Years: ${job.experienceYears || 'Not specified'}

## JOB DESCRIPTION
${job.description}

## REQUIRED SKILLS
${job.skills?.join(', ') || 'Not specified'}

## APPLICATION ANALYSIS
Overall Role Fit: ${application.candidateRoleFit || 0}%
Skills Match: ${application.skillsMatch || 0}%
Experience Relevance: ${application.experienceRelevance || 0}%
ATS Score: ${application.atsScore || 0}/100

Matched Skills: ${application.matchedSkills?.join(', ') || 'None'}
Skills to Develop: ${application.missingSkills?.join(', ') || 'None'}
${application.candidateRoleFitExplanation ? `\nRole Fit Analysis: ${application.candidateRoleFitExplanation}` : ''}

## ADDITIONAL GUIDANCE
Based on your skills match and role fit, focus on demonstrating your matched skills and preparing to discuss how you can develop in areas where there are gaps.

## YOUR ROLE AS AN AI ASSISTANT
You are an expert interview coach with deep knowledge of both technical and non-technical aspects of interviewing. Your responses must be:

1. EXTREMELY ACCURATE - Provide factually correct information about technical concepts, industry standards, and interview practices
2. CONTEXT-AWARE - Tailor all advice to the specific job, company, and candidate profile
3. COMPREHENSIVE - Consider the candidate's full background, skills, and the job requirements in every response
4. EDUCATIONAL - Explain complex concepts clearly when the candidate needs to understand technical topics
5. STRATEGIC - Offer practical strategies to highlight strengths and address skill gaps during interviews

Your specific responsibilities include:
1. Providing in-depth preparation for technical and behavioral questions directly related to this job
2. Offering detailed guidance on addressing skill gaps identified in the application analysis
3. Creating customized interview strategies that leverage the candidate's background for this specific role
4. Explaining technical concepts with precision and clarity when needed
5. Suggesting targeted practice exercises and resources to improve interview performance
6. Answering general computer science and coding questions with expert-level accuracy
7. Helping the candidate understand industry expectations for the role

When discussing technical topics:
- Provide accurate, up-to-date information about programming languages, frameworks, and technologies
- Explain concepts thoroughly with examples when appropriate
- Correct any misconceptions while being supportive
- Tailor technical advice to the specific technologies mentioned in the job description
- When asked about coding concepts, provide detailed explanations with code examples if appropriate
- For algorithms and data structures, explain time and space complexity when relevant

When discussing behavioral aspects:
- Help craft compelling stories from the candidate's experience that demonstrate relevant skills
- Suggest specific examples from their background that address potential interview questions
- Provide frameworks for structuring responses to common behavioral questions
- Offer guidance on how to demonstrate soft skills like leadership, teamwork, and problem-solving

Be supportive, encouraging, and specific in your advice. Focus on practical, actionable guidance that will genuinely improve the candidate's interview performance.`;
    
    // Detect if the message is a technical question
    const isTechnicalQuestion = message.toLowerCase().includes('coding') || 
                              message.toLowerCase().includes('algorithm') || 
                              message.toLowerCase().includes('data structure') || 
                              message.toLowerCase().includes('programming') || 
                              message.toLowerCase().includes('technical') || 
                              /\b(java|javascript|python|c\+\+|react|node|sql|database|api)\b/i.test(message);

    // Detect if it's about interview strategy
    const isInterviewStrategy = message.toLowerCase().includes('interview strategy') || 
                              message.toLowerCase().includes('prepare for interview') || 
                              message.toLowerCase().includes('interview question') || 
                              message.toLowerCase().includes('behavioral question');
                              
    // Adjust system prompt based on response mode and question type
    if (responseMode === 'detailed' || isTechnicalQuestion) {
      systemPrompt += '\n\nProvide detailed, comprehensive responses with examples and in-depth explanations. Include code examples where appropriate.';
    } else if (responseMode === 'concise') {
      systemPrompt += '\n\nProvide concise, to-the-point responses focusing on key information.';
    }
    
    // Add specific guidance for technical questions
    if (isTechnicalQuestion) {
      systemPrompt += '\n\nThis appears to be a technical question. Please provide a thorough, accurate explanation with examples. If relevant, include code snippets, discuss time/space complexity, and mention best practices. Relate your answer specifically to the job requirements whenever possible.';
    }
    
    // Add specific guidance for interview strategy questions
    if (isInterviewStrategy) {
      systemPrompt += '\n\nThis appears to be about interview strategy. Provide specific, actionable advice tailored to this candidate\'s background and the specific job requirements. Include example answers or frameworks where appropriate.';
    }
    
    // Prepare the conversation for OpenAI
    const conversation = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];
    
    // Get response from OpenAI - use GPT-4 for better quality
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: conversation,
      max_tokens: 2500,
      temperature: 0.5
    });
    
    // Extract the response
    const response = completion.choices[0].message.content;
    
    // Log the interaction for analytics (without storing sensitive data)
    console.log(`AI Training interaction for application ${applicationId} - Question type: ${isTechnicalQuestion ? 'Technical' : isInterviewStrategy ? 'Strategy' : 'General'}`);
    
    // Save the interaction to the database for future improvement
    try {
      // You could implement a model to store interactions if needed
      // await AIInteraction.create({
      //   applicationId,
      //   questionType: isTechnicalQuestion ? 'technical' : isInterviewStrategy ? 'strategy' : 'general',
      //   timestamp: new Date()
      // });
    } catch (error) {
      console.log('Error saving AI interaction:', error);
    }
    
    return res.status(200).json({
      success: true,
      data: {
        response,
        questionType: isTechnicalQuestion ? 'technical' : isInterviewStrategy ? 'strategy' : 'general'
      }
    });
    
  } catch (error) {
    console.error('Error handling AI training assistant message:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process message with AI training assistant'
    });
  }
};
