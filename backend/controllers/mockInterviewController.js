const asyncHandler = require('express-async-handler');
const Application = require('../models/applicationModel');
const Job = require('../models/jobModel');
const Candidate = require('../models/candidateModel');
const { OpenAI } = require('openai');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const os = require('os');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Configure multer for audio file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/audio');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, `audio-${Date.now()}-${Math.round(Math.random() * 1e9)}.webm`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Helper function to get application data with job and candidate info
const getApplicationData = async (applicationId) => {
  const application = await Application.findById(applicationId)
    .populate('job')
    .populate('candidate');
  
  if (!application) {
    throw new Error('Application not found');
  }
  
  return application;
};

// Initialize a mock interview
exports.initializeMockInterview = asyncHandler(async (req, res) => {
  const { applicationId, interviewMode, questionCount } = req.body;
  
  if (!applicationId || !interviewMode) {
    return res.status(400).json({
      success: false,
      message: 'Application ID and interview mode are required'
    });
  }
  
  // Default to 5 questions if not specified, or ensure it's within 1-20 range
  const numQuestions = questionCount ? Math.min(Math.max(parseInt(questionCount), 1), 20) : 5;
  
  try {
    // Get application data
    const application = await getApplicationData(applicationId);
    
    // Generate initial questions based on job and candidate profile
    const jobTitle = application.job.title;
    const jobDescription = application.job.description;
    const candidateSkills = application.candidate.skills || '';
    const matchedSkills = application.matchedSkills || [];
    const missingSkills = application.missingSkills || [];
    
    // Create prompt for OpenAI to generate initial questions based on interview type
    let interviewTypeGuidance = '';
    
    if (interviewMode === 'technical') {
      interviewTypeGuidance = `For this technical interview, focus on:
- Specific technical skills mentioned in the candidate's profile (${matchedSkills.join(', ')})
- Technical knowledge gaps that need assessment (${missingSkills.join(', ')})
- Problem-solving abilities related to the job requirements
- Coding and system design concepts relevant to a ${jobTitle} position
- Keep questions concise and focused on one technical concept at a time`;
    } else if (interviewMode === 'behavioral') {
      interviewTypeGuidance = `For this behavioral interview, focus on:
- Past experiences that demonstrate soft skills
- Teamwork and collaboration scenarios
- Conflict resolution abilities
- Leadership and initiative examples
- Adaptability to changing environments
- Keep questions concise and focused on specific situations from the candidate's past`;
    } else if (interviewMode === 'hr') {
      interviewTypeGuidance = `For this HR interview, focus on:
- Career goals and alignment with the company
- Work preferences and expectations
- Cultural fit assessment
- Motivation and interest in the role
- Salary expectations and availability
- Keep questions concise and conversational`;
    }
    
    // Create prompt for OpenAI to generate initial questions
    const prompt = `You are an AI interviewer conducting a ${interviewMode} interview for a ${jobTitle} position.
    
Job Description: ${jobDescription}

Candidate Skills: ${candidateSkills}

Matched Skills: ${matchedSkills.join(', ')}

Missing Skills: ${missingSkills.join(', ')}

${interviewTypeGuidance}

Generate ${numQuestions} high-quality interview questions for this ${interviewMode} interview. The questions should be:
1. Tailored to the job description and the candidate's profile
2. Challenging but fair
3. Concise and clear (avoid questions longer than 2-3 sentences)
4. Specific to the ${interviewMode} interview type
5. Designed to reveal the candidate's true abilities and fit

Return the response in the following JSON format:
{
  "questions": [
    {
      "id": "q1",
      "text": "Question text here",
      "type": "technical/behavioral/situational",
      "difficulty": "easy/medium/hard",
      "purpose": "Brief explanation of what this question aims to assess"
    },
    ...more questions
  ]
}`;

    // Call OpenAI API to generate questions
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interviewer AI that creates tailored interview questions based on job descriptions and candidate profiles." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const responseContent = completion.choices[0].message.content;
    const questionsData = JSON.parse(responseContent);
    
    // Generate audio for the first question
    const firstQuestion = questionsData.questions[0];
    const audioUrl = await generateQuestionAudio(firstQuestion.text);
    firstQuestion.audioUrl = audioUrl;
    
    return res.status(200).json({
      success: true,
      data: {
        questions: questionsData.questions
      }
    });
    
  } catch (error) {
    console.error('Error initializing mock interview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to initialize mock interview'
    });
  }
});

// Process audio answer
exports.processAnswer = asyncHandler(async (req, res) => {
  // Use multer to handle file upload
  upload.single('audio')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No audio file provided'
      });
    }
    
    // Log the request body to debug
    console.log('Request body:', req.body);
    
    // Extract parameters from form data
    const applicationId = req.body.applicationId;
    const questionIndex = parseInt(req.body.questionIndex, 10); // Parse as integer
    const interviewMode = req.body.interviewMode || 'technical'; // Default to technical if not provided
    const conversationHistory = req.body.conversationHistory ? JSON.parse(req.body.conversationHistory) : [];
    const currentQuestion = req.body.currentQuestion || '';
    const completedQuestionsCount = parseInt(req.body.completedQuestionsCount, 10) || 0;
    const requiredQuestionsCount = parseInt(req.body.requiredQuestionsCount, 10) || 5;
    
    // Log the parsed parameters for debugging
    console.log('Parsed parameters:', {
      applicationId,
      questionIndex,
      interviewMode,
      conversationHistoryLength: conversationHistory.length,
      completedQuestionsCount,
      requiredQuestionsCount
    });
    
    // Validate parameters with detailed error messages
    if (!applicationId) {
      return res.status(400).json({
        success: false,
        message: 'Application ID is required'
      });
    }
    
    try {
      // Get application data
      const application = await getApplicationData(applicationId);
      
      // Transcribe audio using OpenAI Whisper
      const audioPath = req.file.path;
      const transcript = await transcribeAudio(audioPath);
      
      // Check if we've already reached the required number of questions
      if (completedQuestionsCount >= requiredQuestionsCount) {
        console.log('Required questions already completed, finalizing interview');
        return res.status(200).json({
          success: true,
          data: {
            transcript,
            responseType: 'answer',
            aiResponse: {
              text: 'Thank you for completing the interview. I will now generate your feedback.',
              nextQuestion: '',
              isFollowUp: false,
              audioUrl: null
            },
            isComplete: true,
            shouldMoveToNext: false,
            feedback: '',
            interviewCompleted: true
          }
        });
      }
      
      // Analyze the transcript to determine if it's a question, answer, or request for clarification
      const responseAnalysis = await analyzeResponse(transcript, currentQuestion, conversationHistory, application, interviewMode);
      
      // Generate appropriate AI response based on the analysis
      const aiResponse = await generateInteractiveResponse(
        transcript, 
        responseAnalysis, 
        application, 
        interviewMode, 
        conversationHistory,
        currentQuestion,
        questionIndex
      );
      
      // Generate audio for the AI response if needed
      let audioUrl = null;
      if (aiResponse.text) {
        try {
          audioUrl = await generateQuestionAudio(aiResponse.text);
        } catch (audioError) {
          console.error('Error generating audio:', audioError);
          // Continue without audio if generation fails
        }
      }
      
      // Check if this is the last required question
      const isLastQuestion = completedQuestionsCount + 1 >= requiredQuestionsCount;
      
      return res.status(200).json({
        success: true,
        data: {
          transcript,
          responseType: responseAnalysis.type,
          aiResponse: {
            ...aiResponse,
            audioUrl
          },
          isComplete: responseAnalysis.isCompleteAnswer,
          shouldMoveToNext: responseAnalysis.shouldMoveToNext,
          feedback: responseAnalysis.feedback,
          interviewCompleted: isLastQuestion
        }
      });
      
    } catch (error) {
      console.error('Error processing answer:', error);
      return res.status(500).json({
        success: false,
        message: `Error processing answer: ${error.message}`
      });
    }
  });
});

// Get next question
exports.getNextQuestion = asyncHandler(async (req, res) => {
  const { applicationId, interviewMode, currentQuestionId, answer, questionCount, requiredQuestionsCount } = req.body;
  
  if (!applicationId || !interviewMode || !currentQuestionId || !answer) {
    return res.status(400).json({
      success: false,
      message: 'Application ID, interview mode, current question ID, and answer are required'
    });
  }
  
  try {
    // Get application data
    const application = await getApplicationData(applicationId);
    
    // Use the requiredQuestionsCount from the request or default to 5 if not provided
    const maxQuestions = requiredQuestionsCount || 5;
    
    // Check if we've reached the required number of questions
    if (questionCount >= maxQuestions) {
      return res.status(200).json({
        success: true,
        data: {
          isFinished: true
        }
      });
    }
    
    // Generate next question based on previous answer
    const jobTitle = application.job.title;
    const jobDescription = application.job.description;
    const candidateSkills = application.candidate.skills || '';
    
    // Create prompt for OpenAI to generate the next question
    const prompt = `You are an AI interviewer conducting a ${interviewMode} interview for a ${jobTitle} position.
    
Job Description: ${jobDescription}

Candidate Skills: ${candidateSkills}

Previous Question: ${currentQuestionId}

Candidate's Answer: ${answer}

Generate the next interview question based on the candidate's previous answer. The question should follow up on any interesting points or probe deeper into areas where the candidate could elaborate more. Make the question challenging but fair.

Return the response in the following JSON format:
{
  "question": {
    "id": "q${questionCount + 1}",
    "text": "Question text here",
    "type": "technical/behavioral/situational",
    "difficulty": "easy/medium/hard",
    "purpose": "Brief explanation of what this question aims to assess"
  }
}`;

    // Call OpenAI API to generate the next question
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interviewer AI that creates tailored follow-up questions based on previous answers." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const responseContent = completion.choices[0].message.content;
    const questionData = JSON.parse(responseContent);
    
    // Generate audio for the question
    const audioUrl = await generateQuestionAudio(questionData.question.text);
    questionData.question.audioUrl = audioUrl;
    
    return res.status(200).json({
      success: true,
      data: {
        isFinished: false,
        question: questionData.question
      }
    });
    
  } catch (error) {
    console.error('Error finalizing interview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to finalize interview'
    });
  }
});

// Text to speech conversion
exports.textToSpeech = asyncHandler(async (req, res) => {
  const { text } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text is required'
    });
  }
  
  try {
    // Generate audio using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
    
    // Convert to buffer
    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Set response headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length);
    
    // Send the audio file
    res.send(buffer);
    
  } catch (error) {
    console.error('Error generating speech:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate speech'
    });
  }
});

// Determine interview mode
exports.determineInterviewMode = asyncHandler(async (req, res) => {
  const { 
    applicationId, 
    jobTitle, 
    jobDescription, 
    candidateSkills, 
    candidateExperience,
    matchedSkills,
    missingSkills
  } = req.body;
  
  if (!applicationId || !jobTitle || !jobDescription) {
    return res.status(400).json({
      success: false,
      message: 'Application ID, job title, and job description are required'
    });
  }
  
  try {
    // Create prompt for OpenAI to determine the best interview mode
    const prompt = `Based on the following job and candidate information, determine the most appropriate interview mode (technical, behavioral, or hr) for this candidate.
    
Job Title: ${jobTitle}
Job Description: ${jobDescription}
Candidate Skills: ${candidateSkills || 'Not provided'}
Candidate Experience: ${candidateExperience || 'Not provided'}
Matched Skills: ${matchedSkills ? matchedSkills.join(', ') : 'None'}
Missing Skills: ${missingSkills ? missingSkills.join(', ') : 'None'}

Consider the following:
- Technical interviews focus on technical skills, coding, problem-solving
- Behavioral interviews focus on soft skills, teamwork, past experiences
- HR interviews focus on cultural fit, career goals, expectations

Return the response in the following JSON format:
{
  "interviewMode": "technical/behavioral/hr",
  "reason": "Brief explanation of why this mode is most appropriate"
}`;

    // Call OpenAI API to determine interview mode
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert HR professional who determines the most appropriate interview type based on job and candidate profiles." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const responseContent = completion.choices[0].message.content;
    const modeData = JSON.parse(responseContent);
    
    return res.status(200).json({
      success: true,
      data: {
        interviewMode: modeData.interviewMode,
        reason: modeData.reason
      }
    });
    
  } catch (error) {
    console.error('Error determining interview mode:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to determine interview mode'
    });
  }
});

// Helper function to transcribe audio using OpenAI Whisper
const transcribeAudio = async (audioPath) => {
  try {
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
    });
    
    return transcription.text;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    throw new Error('Failed to transcribe audio');
  }
};

// Helper function to analyze the candidate's response
const analyzeResponse = async (transcript, currentQuestion, conversationHistory, application, interviewMode) => {
  try {
    const jobTitle = application.job.title;
    const jobDescription = application.job.description;
    const candidateSkills = application.candidate.skills || '';
    const matchedSkills = application.matchedSkills || [];
    const missingSkills = application.missingSkills || [];
    
    // Create a conversation context from history
    const conversationContext = conversationHistory.map(item => 
      `${item.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${item.text}`
    ).join('\n\n');
    
    // Create prompt for OpenAI to analyze the response
    const prompt = `You are an AI interviewer conducting a ${interviewMode} interview for a ${jobTitle} position.

Job Description: ${jobDescription}

Candidate Skills: ${candidateSkills}

Matched Skills: ${matchedSkills.join(', ')}

Missing Skills: ${missingSkills.join(', ')}

Current Question: ${currentQuestion}

Previous Conversation:
${conversationContext}

Candidate's Response: ${transcript}

Analyze this response and determine:
1. Is this a direct answer to the current question?
2. Is this a question from the candidate (asking for clarification or a new question)?
3. Is this a request for more information or clarification?
4. Is this a complete answer that satisfactorily addresses the question?

IMPORTANT: Always treat the candidate's response as a valid answer to the current question, regardless of its quality or completeness. We must always move to the next question after the candidate provides any response.

Return your analysis in the following JSON format:
{
  "type": "answer|question|clarification|other",
  "isCompleteAnswer": true,
  "shouldMoveToNext": true,
  "feedback": "Brief feedback on the response",
  "reasoning": "Your reasoning for this classification"
}`;

    // Call OpenAI API to analyze the response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interviewer AI that analyzes candidate responses in interviews. ALWAYS mark responses as complete and always move to the next question after any candidate response." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    const responseContent = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(responseContent);
    
    // Override the response to always move to the next question unless it's a clarification request
    if (parsedResponse.type === 'clarification' || parsedResponse.type === 'question') {
      // If it's a clarification request, don't move to next question yet
      return parsedResponse;
    } else {
      // For any other type of response, always treat it as complete and move to next question
      return {
        ...parsedResponse,
        isCompleteAnswer: true,
        shouldMoveToNext: true
      };
    }
  } catch (error) {
    console.error('Error analyzing response:', error);
    // Return a default analysis if there's an error
    return {
      type: "answer",
      isCompleteAnswer: true,
      shouldMoveToNext: true,
      feedback: "I couldn't properly analyze your response, but let's continue with the interview.",
      reasoning: "Error in analysis"
    };
  }
};

// Helper function to generate interactive response
const generateInteractiveResponse = async (
  transcript, 
  analysis, 
  application, 
  interviewMode, 
  conversationHistory,
  currentQuestion,
  questionIndex
) => {
  try {
    const jobTitle = application.job.title;
    const jobDescription = application.job.description;
    const candidateSkills = application.candidate.skills || '';
    const matchedSkills = application.matchedSkills || [];
    const missingSkills = application.missingSkills || [];
    
    // Create a conversation context from history
    const conversationContext = conversationHistory.map(item => 
      `${item.role === 'interviewer' ? 'Interviewer' : 'Candidate'}: ${item.text}`
    ).join('\n\n');
    
    // Create prompt based on the type of response
    let prompt;
    
    if (analysis.type === 'question') {
      // Candidate is asking a question
      prompt = `You are an AI interviewer conducting a ${interviewMode} interview for a ${jobTitle} position.

Job Description: ${jobDescription}

Candidate Skills: ${candidateSkills}

Matched Skills: ${matchedSkills.join(', ')}

Missing Skills: ${missingSkills.join(', ')}

Current Interview Question: ${currentQuestion}

Previous Conversation:
${conversationContext}

Candidate's Question: ${transcript}

Respond to the candidate's question in a helpful, professional manner. After answering their question, gently guide them back to the interview question. Keep your response concise and conversational.

Return your response in the following JSON format:
{
  "text": "Your response to the candidate",
  "nextQuestion": "",
  "isFollowUp": false
}`;
    } else if (analysis.type === 'clarification') {
      // Candidate is asking for clarification
      prompt = `You are an AI interviewer conducting a ${interviewMode} interview for a ${jobTitle} position.

Job Description: ${jobDescription}

Current Interview Question: ${currentQuestion}

Previous Conversation:
${conversationContext}

Candidate's Request for Clarification: ${transcript}

Provide a clear clarification to help the candidate understand the question better. Be supportive and encouraging. Keep your response concise and conversational.

Return your response in the following JSON format:
{
  "text": "Your clarification response",
  "nextQuestion": "",
  "isFollowUp": false
}`;
    } else {
      // For any answer (complete or incomplete), acknowledge and move to next question
      prompt = `You are an AI interviewer conducting a ${interviewMode} interview for a ${jobTitle} position.

Job Description: ${jobDescription}

Candidate Skills: ${candidateSkills}

Matched Skills: ${matchedSkills.join(', ')}

Missing Skills: ${missingSkills.join(', ')}

Current Interview Question: ${currentQuestion}

Previous Conversation:
${conversationContext}

Candidate's Answer: ${transcript}

The candidate has provided an answer. Acknowledge their response briefly and then ask the next interview question. Make the transition smooth and natural. Keep your response concise and conversational. Do NOT ask follow-up questions about the same topic - always move to a completely new question.

Return your response in the following JSON format:
{
  "text": "Your acknowledgment and next question",
  "nextQuestion": "The next question to ask",
  "isFollowUp": false
}`;
    }

    // Call OpenAI API to generate the response
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interviewer AI that provides natural, conversational responses in interviews. ALWAYS move to a new question after any candidate answer. NEVER ask follow-up questions on the same topic." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the JSON response
    const responseContent = completion.choices[0].message.content;
    const parsedResponse = JSON.parse(responseContent);
    
    // For regular answers, ensure we always move to the next question
    if (analysis.type !== 'question' && analysis.type !== 'clarification') {
      return {
        text: parsedResponse.text,
        nextQuestion: parsedResponse.nextQuestion || "What's the next question?", // Ensure there's always a next question
        isFollowUp: false // Never follow up on the same topic
      };
    }
    
    return parsedResponse;
  } catch (error) {
    console.error('Error generating interactive response:', error);
    // Return a default response if there's an error
    return {
      text: "Thank you for your response. Let's continue with the interview.",
      nextQuestion: "What's the next question?",
      isFollowUp: false
    };
  }
};

// Helper function to generate answer feedback
const generateAnswerFeedback = async (answer, application, interviewMode) => {
  try {
    const jobTitle = application.job.title;
    
    // Create prompt for OpenAI to generate feedback
    const prompt = `You are an AI interviewer conducting a ${interviewMode} interview for a ${jobTitle} position.
    
Candidate's Answer: ${answer}

Provide brief feedback on this answer. Consider:
- Clarity and structure
- Relevance to the question
- Technical accuracy (if applicable)
- Communication skills
- Areas for improvement

Keep the feedback concise and constructive.`;

    // Call OpenAI API to generate feedback
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interviewer AI that provides concise, constructive feedback on interview answers." },
        { role: "user", content: prompt }
      ]
    });
    
    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating answer feedback:', error);
    throw new Error('Failed to generate answer feedback');
  }
};

// Finalize interview and generate comprehensive feedback
exports.finalizeMockInterview = asyncHandler(async (req, res) => {
  const { applicationId, answers } = req.body;
  
  if (!applicationId) {
    return res.status(400).json({
      success: false,
      message: 'Application ID is required'
    });
  }
  
  if (!answers || !Array.isArray(answers) || answers.length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Interview answers are required'
    });
  }
  
  try {
    // Get application data
    const application = await getApplicationData(applicationId);
    
    // Create a formatted Q&A string for the prompt
    let qaString = '';
    
    // Validate answers format
    if (answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No interview answers provided'
      });
    }
    
    // Log answers for debugging
    console.log('Processing answers for feedback generation:', JSON.stringify(answers));
    
    for (let i = 0; i < answers.length; i++) {
      const answer = answers[i];
      
      // Validate answer format
      if (!answer || !answer.question) {
        console.warn(`Missing question for answer at index ${i}`);
        continue;
      }
      
      qaString += `Question ${i + 1}: ${answer.question}\n`;
      qaString += `Candidate's Answer: ${answer.transcript || 'No response provided'}\n\n`;
    }
    
    // Generate comprehensive feedback based on the interview
    const jobTitle = application.job.title;
    const jobDescription = application.job.description;
    const candidateSkills = application.candidate.skills || '';
    
    // Create prompt for OpenAI to generate comprehensive feedback
    const prompt = `You are an AI interviewer who has just completed an interview for a ${jobTitle} position.

Job Description: ${jobDescription}

Candidate Skills: ${candidateSkills}

Interview Questions and Answers:
${qaString}

Based on the candidate's responses above, generate comprehensive feedback for the candidate, including:
1. Overall performance assessment
2. Strengths demonstrated during the interview
3. Areas for improvement
4. Specific recommendations for preparation for future interviews
5. A numerical score from 0-100 representing their overall performance

Return the response in the following JSON format:
{
  "feedback": {
    "overallAssessment": "Overall assessment text",
    "strengths": ["Strength 1", "Strength 2", ...],
    "areasForImprovement": ["Area 1", "Area 2", ...],
    "recommendations": ["Recommendation 1", "Recommendation 2", ...],
    "score": 85
  }
}`;

    // Call OpenAI API to generate comprehensive feedback
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an expert interviewer AI that provides comprehensive, constructive feedback after job interviews." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    // Parse the response
    const responseContent = completion.choices[0].message.content;
    const feedbackData = JSON.parse(responseContent);
    
    // Update the application with the interview score
    application.interviewScore = feedbackData.feedback.score;
    await application.save();
    
    return res.status(200).json({
      success: true,
      data: {
        feedback: feedbackData.feedback
      }
    });
    
  } catch (error) {
    console.error('Error finalizing mock interview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to finalize mock interview'
    });
  }
});

// Text to speech conversion
exports.textToSpeech = asyncHandler(async (req, res) => {
  const { text, voice = 'alloy' } = req.body;
  
  if (!text) {
    return res.status(400).json({
      success: false,
      message: 'Text is required'
    });
  }
  
  try {
    // Generate audio using the helper function
    const audioUrl = await generateQuestionAudio(text, voice);
    
    if (!audioUrl) {
      throw new Error('Failed to generate audio');
    }
    
    return res.status(200).json({
      success: true,
      data: {
        audioUrl
      }
    });
    
  } catch (error) {
    console.error('Error converting text to speech:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to convert text to speech'
    });
  }
});

// Helper function to generate audio for a question
const generateQuestionAudio = async (questionText, voice = 'alloy') => {
  try {
    // Generate a unique filename
    const filename = `question-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp3`;
    const audioPath = path.join(__dirname, '../uploads/audio', filename);
    
    // Ensure directory exists
    const audioDir = path.join(__dirname, '../uploads/audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }
    
    // Generate audio using OpenAI TTS
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice, // Use the provided voice or default to 'alloy'
      input: questionText,
    });
    
    // Save the audio file
    const buffer = Buffer.from(await mp3.arrayBuffer());
    fs.writeFileSync(audioPath, buffer);
    
    // Return the URL to the audio file
    return `/uploads/audio/${filename}`;
  } catch (error) {
    console.error('Error generating question audio:', error);
    return null;
  }
};
