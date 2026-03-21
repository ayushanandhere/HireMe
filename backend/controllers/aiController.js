const asyncHandler = require('express-async-handler');
const Interview = require('../models/interviewModel');
const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const Candidate = require('../models/candidateModel');
const TrainingConversation = require('../models/trainingConversationModel');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const isAIConfigured = Boolean(process.env.OPENAI_API_KEY);
const TRAINING_CHAT_MODEL = process.env.OPENAI_MODEL || 'gpt-4o';

const respondIfAIDisabled = (res) => {
  if (isAIConfigured) {
    return false;
  }

  res.status(503).json({
    success: false,
    message: 'AI features are unavailable until OPENAI_API_KEY is configured.'
  });
  return true;
};

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
    if (respondIfAIDisabled(res)) {
      return;
    }

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
    if (respondIfAIDisabled(res)) {
      return;
    }

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

const sanitizeConversationTitle = (title = '') => {
  const trimmed = String(title).trim().replace(/\s+/g, ' ');
  if (!trimmed) return 'New chat';
  return trimmed.slice(0, 80);
};

const deriveConversationTitle = (message = '') => {
  const cleaned = String(message).replace(/\s+/g, ' ').trim();
  if (!cleaned) return 'New chat';
  return sanitizeConversationTitle(cleaned.replace(/[.!?]+$/, ''));
};

const formatConversationPreview = (conversation) => {
  const lastMessage = conversation.messages?.[conversation.messages.length - 1];
  return {
    id: conversation._id,
    title: conversation.title,
    isStarred: conversation.isStarred,
    updatedAt: conversation.updatedAt,
    lastUsedAt: conversation.lastUsedAt,
    messageCount: conversation.messages?.length || 0,
    preview: lastMessage ? lastMessage.content.slice(0, 140) : ''
  };
};

const buildTrainingContextData = async (applicationId, candidateId) => {
  if (!applicationId) {
    const error = new Error('Application ID is required');
    error.statusCode = 400;
    throw error;
  }

  const application = await Application.findById(applicationId)
    .populate({
      path: 'candidate',
      select: '-password'
    })
    .populate('job');

  if (!application) {
    const error = new Error('Application not found');
    error.statusCode = 404;
    throw error;
  }

  const ownerId = application.candidate?._id?.toString() || application.candidate?.toString();
  if (candidateId && ownerId !== candidateId.toString()) {
    const error = new Error('You are not authorized to access this application');
    error.statusCode = 403;
    throw error;
  }

  const candidate = application.candidate;
  const job = application.job;

  if (!job) {
    const error = new Error('Job not found for this application');
    error.statusCode = 404;
    throw error;
  }

  const candidateInfo = {
    name: candidate.name,
    email: candidate.email,
    skills: candidate.skills || '',
    parsedSkills: candidate.parsedSkills || [],
    experience: candidate.experience || '',
    education: []
  };

  if (candidate.parsedExperience && candidate.parsedExperience.length > 0) {
    candidateInfo.parsedExperience = candidate.parsedExperience.map((exp) => ({
      company: exp.company,
      role: exp.role,
      startDate: exp.startDate,
      endDate: exp.endDate || 'Present',
      description: exp.description,
      current: exp.current
    }));
  }

  if (candidate.parsedEducation && candidate.parsedEducation.length > 0) {
    candidateInfo.education = candidate.parsedEducation.map((edu) => ({
      institution: edu.institution,
      degree: edu.degree,
      fieldOfStudy: edu.fieldOfStudy,
      startDate: edu.startDate,
      endDate: edu.endDate || 'Present',
      current: edu.current
    }));
  }

  if (candidate.atsScore) {
    candidateInfo.atsScore = candidate.atsScore;
  }

  const applicationInfo = {
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

  let initialMessage = `Hello ${candidate.name}! I'm your AI interview training assistant for the ${job.title} position`;
  if (job.company) {
    initialMessage += ` at ${job.company}`;
  }
  initialMessage += '. ';

  if (application.candidateRoleFit) {
    initialMessage += `Your current role fit is ${application.candidateRoleFit}%. `;
  }

  if (application.skillsMatch) {
    initialMessage += `You already match ${application.skillsMatch}% of the required skills. `;
  }

  if (application.missingSkills && application.missingSkills.length > 0) {
    initialMessage += `The biggest areas to prepare are ${application.missingSkills.join(', ')}. `;
  }

  initialMessage += 'Ask for likely questions, stronger answer framing, technical refreshers, or practice plans tailored to this role.';

  return {
    application,
    candidate,
    job,
    candidateInfo,
    applicationInfo,
    initialMessage
  };
};

const buildTrainingSystemPrompt = ({ application, candidate, job, responseMode, message }) => {
  let systemPrompt = `You are an advanced AI interview training assistant helping a candidate prepare for a specific job interview.

Your tone should feel like an expert coach: calm, sharp, supportive, and highly practical.

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
${candidate.parsedExperience.map((exp) =>
  `- ${exp.role} at ${exp.company} (${exp.startDate} - ${exp.endDate || 'Present'})\n  ${exp.description || ''}`
).join('\n')}` : ''}

${candidate.parsedEducation && candidate.parsedEducation.length > 0 ?
`## EDUCATION
${candidate.parsedEducation.map((edu) =>
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
${job.description || 'Not specified'}

## REQUIRED SKILLS
${job.skills?.join(', ') || 'Not specified'}

## APPLICATION ANALYSIS
Overall Role Fit: ${application.candidateRoleFit || 0}%
Skills Match: ${application.skillsMatch || 0}%
Experience Relevance: ${application.experienceRelevance || 0}%
ATS Score: ${application.atsScore || 0}/100
Matched Skills: ${application.matchedSkills?.join(', ') || 'None'}
Skills to Develop: ${application.missingSkills?.join(', ') || 'None'}
${application.candidateRoleFitExplanation ? `Role Fit Analysis: ${application.candidateRoleFitExplanation}` : ''}

## RESPONSE RULES
- Ground every answer in the specific role and the candidate's background.
- Prioritize actionable preparation advice over generic motivational language.
- When useful, structure answers with short sections or bullets.
- For behavioral prep, turn the candidate's background into concrete answer angles.
- For technical prep, be accurate and explain concepts clearly with examples when needed.
- If the candidate is weak in an area, suggest how to address it honestly and strategically.
- Do not invent facts about the candidate. If something is missing, say so.
- Keep the flow conversational, as if continuing a real chat thread.`;

  const normalizedMode = String(responseMode || 'normal').toLowerCase();
  if (normalizedMode === 'deep') {
    systemPrompt += '\n- Default to more detailed answers with frameworks, examples, and follow-up drills.';
  } else {
    systemPrompt += '\n- Default to concise, focused answers unless the user clearly wants depth.';
  }

  const isTechnicalQuestion =
    message.toLowerCase().includes('coding') ||
    message.toLowerCase().includes('algorithm') ||
    message.toLowerCase().includes('data structure') ||
    message.toLowerCase().includes('programming') ||
    message.toLowerCase().includes('technical') ||
    /\b(java|javascript|python|c\+\+|react|node|sql|database|api)\b/i.test(message);

  const isInterviewStrategy =
    message.toLowerCase().includes('interview strategy') ||
    message.toLowerCase().includes('prepare for interview') ||
    message.toLowerCase().includes('interview question') ||
    message.toLowerCase().includes('behavioral question');

  if (isTechnicalQuestion) {
    systemPrompt += '\n- This question is technical. Include accurate explanations, examples, and best practices. Mention tradeoffs or complexity when relevant.';
  }

  if (isInterviewStrategy) {
    systemPrompt += '\n- This question is about interview strategy. Give direct, specific advice tailored to the role and candidate profile.';
  }

  return {
    systemPrompt,
    questionType: isTechnicalQuestion ? 'technical' : isInterviewStrategy ? 'strategy' : 'general'
  };
};

const createSeededTrainingConversation = async ({ applicationId, candidateId, title }) => {
  const context = await buildTrainingContextData(applicationId, candidateId);
  const conversation = await TrainingConversation.create({
    candidate: candidateId,
    application: applicationId,
    title: sanitizeConversationTitle(title),
    messages: [
      {
        role: 'assistant',
        content: context.initialMessage,
        timestamp: new Date()
      }
    ],
    lastUsedAt: new Date()
  });

  return { conversation, context };
};

// Get initial context for the candidate AI training assistant
exports.getTrainingContext = async (req, res) => {
  try {
    if (respondIfAIDisabled(res)) {
      return;
    }

    const context = await buildTrainingContextData(req.params.applicationId, req.user._id);

    return res.status(200).json({
      success: true,
      data: {
        initialMessage: context.initialMessage,
        candidate: context.candidateInfo,
        job: {
          title: context.job.title,
          description: context.job.description || '',
          company: context.job.company,
          location: context.job.location,
          type: context.job.type,
          skills: context.job.skills || [],
          experienceLevel: context.job.experienceLevel,
          experienceYears: context.job.experienceYears
        },
        application: context.applicationInfo
      }
    });
  } catch (error) {
    console.error('Error getting AI training assistant context:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to get AI training assistant context'
    });
  }
};

exports.listTrainingConversations = async (req, res) => {
  try {
    await buildTrainingContextData(req.params.applicationId, req.user._id);

    const conversations = await TrainingConversation.find({
      candidate: req.user._id,
      application: req.params.applicationId
    }).sort({ isStarred: -1, lastUsedAt: -1, updatedAt: -1 });

    return res.status(200).json({
      success: true,
      data: conversations.map(formatConversationPreview)
    });
  } catch (error) {
    console.error('Error listing training conversations:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to list training conversations'
    });
  }
};

exports.createTrainingConversation = async (req, res) => {
  try {
    const { title } = req.body || {};
    const { conversation } = await createSeededTrainingConversation({
      applicationId: req.params.applicationId,
      candidateId: req.user._id,
      title
    });

    return res.status(201).json({
      success: true,
      data: {
        conversation: formatConversationPreview(conversation),
        messages: conversation.messages
      }
    });
  } catch (error) {
    console.error('Error creating training conversation:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to create training conversation'
    });
  }
};

exports.getTrainingConversation = async (req, res) => {
  try {
    const conversation = await TrainingConversation.findOne({
      _id: req.params.conversationId,
      candidate: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        conversation: formatConversationPreview(conversation),
        messages: conversation.messages
      }
    });
  } catch (error) {
    console.error('Error loading training conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to load training conversation'
    });
  }
};

exports.updateTrainingConversation = async (req, res) => {
  try {
    const { title, isStarred } = req.body || {};
    const conversation = await TrainingConversation.findOne({
      _id: req.params.conversationId,
      candidate: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    if (typeof title === 'string') {
      conversation.title = sanitizeConversationTitle(title);
    }

    if (typeof isStarred === 'boolean') {
      conversation.isStarred = isStarred;
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      data: formatConversationPreview(conversation)
    });
  } catch (error) {
    console.error('Error updating training conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update training conversation'
    });
  }
};

exports.deleteTrainingConversation = async (req, res) => {
  try {
    const conversation = await TrainingConversation.findOneAndDelete({
      _id: req.params.conversationId,
      candidate: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting training conversation:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete training conversation'
    });
  }
};

// Handle AI training assistant messages
exports.handleTrainingMessage = async (req, res) => {
  try {
    if (respondIfAIDisabled(res)) {
      return;
    }

    const {
      message,
      applicationId,
      conversationId,
      responseMode = 'normal'
    } = req.body;

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

    const context = await buildTrainingContextData(applicationId, req.user._id);

    let conversation = null;
    if (conversationId) {
      conversation = await TrainingConversation.findOne({
        _id: conversationId,
        candidate: req.user._id,
        application: applicationId
      });
    }

    if (!conversation) {
      const seeded = await createSeededTrainingConversation({
        applicationId,
        candidateId: req.user._id,
        title: deriveConversationTitle(message)
      });
      conversation = seeded.conversation;
    }

    const { systemPrompt, questionType } = buildTrainingSystemPrompt({
      application: context.application,
      candidate: context.candidate,
      job: context.job,
      responseMode,
      message
    });

    const conversationHistory = (conversation.messages || [])
      .slice(-18)
      .map((entry) => ({
        role: entry.role,
        content: entry.content
      }));

    const openaiMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ];

    const completion = await openai.chat.completions.create({
      model: TRAINING_CHAT_MODEL,
      messages: openaiMessages,
      max_tokens: String(responseMode).toLowerCase() === 'deep' ? 2200 : 1400,
      temperature: String(responseMode).toLowerCase() === 'deep' ? 0.65 : 0.45
    });

    const response = completion.choices[0].message.content;

    conversation.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    conversation.messages.push({
      role: 'assistant',
      content: response,
      timestamp: new Date()
    });

    if (!conversation.title || conversation.title === 'New chat') {
      conversation.title = deriveConversationTitle(message);
    }

    conversation.lastUsedAt = new Date();
    await conversation.save();

    console.log(
      `AI Training interaction for application ${applicationId} - Question type: ${questionType}`
    );

    return res.status(200).json({
      success: true,
      data: {
        response,
        questionType,
        conversation: formatConversationPreview(conversation),
        messages: conversation.messages
      }
    });
  } catch (error) {
    console.error('Error handling AI training assistant message:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Failed to process message with AI training assistant'
    });
  }
};
