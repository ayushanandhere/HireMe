import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
/* react-bootstrap removed — using native elements */
import { FaArrowLeft, FaMicrophone, FaMicrophoneSlash, FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaRobot, FaUser, FaFileAlt, FaChartLine, FaCheckCircle, FaTimesCircle, FaBriefcase, FaWifi, FaExclamationTriangle, FaStar, FaCheck, FaExclamation, FaLightbulb } from 'react-icons/fa';
import { applicationService, buildAssetUrl, mockInterviewService } from '../../services/api';
import './AIMockInterviewRoom.css';

const AIMockInterviewRoom = () => {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorType, setErrorType] = useState(null); // 'network', 'microphone', 'server', 'unknown'
  const [application, setApplication] = useState(null);
  const [interviewMode, setInterviewMode] = useState('technical'); // technical, behavioral, hr
  const [interviewModeDescription] = useState({
    technical: 'Focuses on coding, problem-solving, and technical knowledge relevant to the job.',
    behavioral: 'Assesses soft skills, teamwork, and how you handled past situations.',
    hr: 'Explores career goals, company fit, salary expectations, and work preferences.'
  });
  const [interviewStage, setInterviewStage] = useState('intro'); // intro, questions, feedback
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [, setAudioChunks] = useState([]);
  const [, setTranscription] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [currentQuestionText, setCurrentQuestionText] = useState('');
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [selectedQuestionCount, setSelectedQuestionCount] = useState(5); // Number of questions selected by the user
  const [requiredQuestionsCount, setRequiredQuestionsCount] = useState(5); // Number of questions required for the interview
  const [completedQuestionsCount, setCompletedQuestionsCount] = useState(0); // Number of questions completed
  const [interviewCompleted, setInterviewCompleted] = useState(false); // Flag to indicate if the interview is complete
  const [showInterviewTypeModal, setShowInterviewTypeModal] = useState(false); // Flag to show interview type selection modal
  
  // References
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  
  // Fetch application data
  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        setLoading(true);
        
        // Fetch application details
        const applicationData = await applicationService.getApplicationById(applicationId);
        
        if (!applicationData.success) {
          throw new Error(applicationData.message || 'Failed to load application details');
        }
        
        setApplication(applicationData.data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message || 'An error occurred while loading the interview room');
        setLoading(false);
      }
    };
    
    fetchApplicationData();
  }, [applicationId]);
  
  // Handle interview mode change
  // Start recording audio with visualization
  const startRecording = async () => {
    // Prevent recording if the interview is already completed
    if (interviewCompleted) {
      console.log('Interview is already completed, recording prevented');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      
      // Set up audio visualization
      setupAudioVisualization(stream);
      
      const chunks = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };
      
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        processRecording(audioBlob);
        setAudioChunks(chunks);
        stopAudioVisualization();
      };
      
      recorder.start();
      setIsRecording(true);
      // Clear any previous microphone errors
      if (errorType === 'microphone') {
        setError(null);
        setErrorType(null);
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      setError('Could not access microphone. Please check your browser permissions.');
      setErrorType('microphone');
      setShowErrorModal(true);
    }
  };
  
  // Setup audio visualization
  const setupAudioVisualization = (stream) => {
    // Create audio context
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const audioContext = new AudioContext();
    audioContextRef.current = audioContext;
    
    // Create analyser node
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    analyserRef.current = analyser;
    
    // Create buffer to store frequency data
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    dataArrayRef.current = dataArray;
    
    // Connect the microphone stream to the analyser
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    sourceRef.current = source;
    
    // Start drawing the visualization
    drawVisualization();
  };
  
  // Draw the audio visualization
  const drawVisualization = () => {
    if (!canvasRef.current || !analyserRef.current || !dataArrayRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    
    // Get canvas dimensions
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
    
    // Get the frequency data
    analyser.getByteFrequencyData(dataArray);
    
    // Calculate bar width based on canvas width and number of bars
    const barWidth = (width / dataArray.length) * 2.5;
    let barHeight;
    let x = 0;
    
    // Draw the bars
    for (let i = 0; i < dataArray.length; i++) {
      barHeight = dataArray[i] / 2;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#6a11cb');
      gradient.addColorStop(1, '#ff9e00');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, height - barHeight, barWidth, barHeight);
      
      x += barWidth + 1;
    }
    
    // Continue animation loop
    animationRef.current = requestAnimationFrame(drawVisualization);
  };
  
  // Stop audio visualization
  const stopAudioVisualization = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(console.error);
      audioContextRef.current = null;
    }
    
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };
  
  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsProcessing(true);
    }
  };
  
  // Process the recorded audio
  const processRecording = async (audioBlob) => {
    try {
      console.log('Processing recording with parameters:', {
        applicationId,
        currentQuestion,
        interviewMode,
        conversationHistoryLength: conversationHistory.length,
        completedQuestionsCount,
        requiredQuestionsCount
      });
      
      // Check if we've already completed the required number of questions
      if (completedQuestionsCount >= requiredQuestionsCount) {
        console.log('Required questions already completed, skipping processing');
        setIsProcessing(false);
        return;
      }
      
      // Create a form data object to send the audio file
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      formData.append('applicationId', applicationId);
      formData.append('questionIndex', String(currentQuestion)); // Convert to string explicitly
      formData.append('interviewMode', interviewMode || 'technical'); // Provide default value
      formData.append('currentQuestion', currentQuestionText);
      formData.append('conversationHistory', JSON.stringify(conversationHistory));
      formData.append('completedQuestionsCount', String(completedQuestionsCount)); // Current count of completed questions
      formData.append('requiredQuestionsCount', String(requiredQuestionsCount)); // Total required questions
      
      // Log the form data (for debugging)
      console.log('Form data entries:');
      for (let pair of formData.entries()) {
        if (pair[0] !== 'conversationHistory') { // Don't log the entire conversation history
          console.log(pair[0] + ': ' + pair[1]);
        }
      }
      
      // Send the audio to the server for processing
      const data = await mockInterviewService.processAnswer(formData);
      console.log('Response data:', data);
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to process answer');
      }
      
      // Reset retry count on success
      setRetryCount(0);
      
      // Get the response data
      const {
        transcript,
        aiResponse,
        feedback,
        interviewCompleted
      } = data.data;
      
      // Update transcription
      setTranscription(transcript);
      
      // Add candidate's response to conversation history
      const updatedHistory = [...conversationHistory, {
        role: 'candidate',
        text: transcript,
        timestamp: new Date().toISOString()
      }];
      
      // Add AI's response to conversation history
      if (aiResponse && aiResponse.text) {
        updatedHistory.push({
          role: 'interviewer',
          text: aiResponse.text,
          timestamp: new Date().toISOString()
        });
      }
      
      setConversationHistory(updatedHistory);
      
      // Always update answers for any response type
      // This ensures we count every response as an answer
      const newAnswers = [...answers];
      newAnswers[currentQuestion] = {
        question: currentQuestionText,
        transcript: transcript,
        feedback: feedback || ''
      };
      setAnswers(newAnswers);
      
      // Always increment the completed questions count for any answer
      // This ensures we strictly follow the required question count
      const newCompletedCount = completedQuestionsCount + 1;
      setCompletedQuestionsCount(newCompletedCount);
      
      // Check if the interview is completed based on backend flag or question count
      if (interviewCompleted || newCompletedCount >= requiredQuestionsCount) {
        console.log('Interview completed based on question count or backend signal');
        setInterviewCompleted(true);
        
        // Display a completion message
        const completionMessage = "Thank you for completing the interview. I'll now generate your feedback based on your responses.";
        
        // Add the completion message to the conversation history
        updatedHistory.push({
          role: 'interviewer',
          text: completionMessage,
          timestamp: new Date().toISOString(),
          isCompletionMessage: true
        });
        
        setConversationHistory(updatedHistory);
        
        // Log the answers that will be sent to the backend
        console.log('Final answers before feedback generation:', newAnswers);
        
        // Store the answers in localStorage as a backup
        try {
          localStorage.setItem('interviewAnswers', JSON.stringify(newAnswers));
        } catch (err) {
          console.error('Error saving answers to localStorage:', err);
        }
        
        // Speak the completion message
        setIsAiSpeaking(true);
        await speakText(completionMessage);
        setIsAiSpeaking(false);
        
        // Get the final feedback
        getFinalFeedback();
      } else {
        // Handle AI response for continuing the interview
        if (aiResponse) {
          // Play the AI response audio
          if (aiResponse.audioUrl) {
            setIsAiSpeaking(true);
            await playQuestionAudio(aiResponse.audioUrl);
            setIsAiSpeaking(false);
          } else if (aiResponse.text) {
            setIsAiSpeaking(true);
            await speakText(aiResponse.text);
            setIsAiSpeaking(false);
          }
          
          // Always move to the next question
          if (aiResponse.nextQuestion) {
            // Set the new question text
            setCurrentQuestionText(aiResponse.nextQuestion);
            
            // Move to the next question index
            if (currentQuestion < questions.length - 1) {
              setCurrentQuestion(currentQuestion + 1);
            }
          } else {
            // If no next question is provided, use a default one
            // This should not happen with our updated backend logic
            setCurrentQuestionText("Let's move to the next question. Tell me about...");
            
            // Move to the next question index
            if (currentQuestion < questions.length - 1) {
              setCurrentQuestion(currentQuestion + 1);
            }
          }
        }
        
        // Continue the interview
        setIsProcessing(false);
      }
      
    } catch (error) {
      console.error('Error processing recording:', error);
      setError(error.message || 'Failed to process your answer. Please try again.');
      setIsProcessing(false);
      setShowErrorModal(true);
    }
  };
  
  // Get final feedback after all questions are answered
  const getFinalFeedback = async () => {
    try {
      setIsProcessing(true);
      
      // Check if answers array is empty and try to retrieve from localStorage
      let answersToSend = answers;
      if (!answers || answers.length === 0) {
        try {
          const savedAnswers = localStorage.getItem('interviewAnswers');
          if (savedAnswers) {
            answersToSend = JSON.parse(savedAnswers);
            console.log('Retrieved answers from localStorage:', answersToSend);
          }
        } catch (err) {
          console.error('Error retrieving answers from localStorage:', err);
        }
      }
      
      // Filter out any empty answers
      const validAnswers = answersToSend.filter(answer => answer && answer.transcript);
      
      console.log('Sending answers to backend for feedback generation:', validAnswers);
      
      // Check if we have any valid answers to send
      if (!validAnswers || validAnswers.length === 0) {
        throw new Error('No valid interview answers found. Please try again.');
      }
      
      const data = await mockInterviewService.finalize({
        applicationId,
        answers: validAnswers
      });
      
      if (!data.success) {
        setErrorType('server');
        throw new Error(data.message || 'Failed to get final feedback');
      }
      
      // Reset error states on success
      setError(null);
      setErrorType(null);
      
      setFeedback(data.data.feedback);
      setInterviewStage('feedback');
      
    } catch (error) {
      console.error('Error getting final feedback:', error);
      setError(error.message || 'Failed to get final feedback. Please try again.');
      setShowErrorModal(true);
      
      // If feedback generation fails, we can still show a basic feedback view
      // with the answers collected so far
      if (retryCount >= 2) {
        // After multiple retries, create a basic feedback object
        const basicFeedback = {
          score: 70, // Default score
          overallAssessment: "We couldn't generate detailed feedback, but your interview has been recorded.",
          strengths: ["You completed the interview process"],
          areasForImprovement: ["Try again later for detailed feedback"],
          recommendations: ["Review your answers and try another mock interview later"]
        };
        
        setFeedback(basicFeedback);
        setInterviewStage('feedback');
      } else {
        // Increment retry count
        setRetryCount(prevCount => prevCount + 1);
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Start the interview
  const startInterview = async () => {
    try {
      setIsProcessing(true);
      
      // Reset conversation state
      setConversationHistory([]);
      setCompletedQuestionsCount(0);
      setAnswers([]);
      
      // Fetch initial questions based on job and candidate profile
      const data = await mockInterviewService.initialize({
        applicationId,
        interviewMode,
        questionCount: selectedQuestionCount
      });
      
      if (!data.success) {
        setErrorType('server');
        throw new Error(data.message || 'Failed to initialize interview');
      }
      
      // Reset error states on success
      setError(null);
      setErrorType(null);
      setRetryCount(0);
      
      // Store the questions
      setQuestions(data.data.questions);
      
      // Set the number of required questions based on user selection
      // Make sure we don't exceed the available questions
      const availableQuestionsCount = data.data.questions.length;
      const finalQuestionCount = Math.min(selectedQuestionCount, availableQuestionsCount);
      setRequiredQuestionsCount(finalQuestionCount);
      
      // Set the current question text
      const firstQuestion = data.data.questions[0].text;
      setCurrentQuestionText(firstQuestion);
      
      // Add the first question to conversation history
      setConversationHistory([{
        role: 'interviewer',
        text: firstQuestion,
        timestamp: new Date().toISOString()
      }]);
      
      // Move to questions stage
      setInterviewStage('questions');
      
      // Play the first question audio if available
      if (data.data.questions[0].audioUrl) {
        setIsAiSpeaking(true);
        await playQuestionAudio(data.data.questions[0].audioUrl);
        setIsAiSpeaking(false);
      } else {
        // If no audio URL is available, use text-to-speech
        setIsAiSpeaking(true);
        await speakText(firstQuestion);
        setIsAiSpeaking(false);
      }
      
    } catch (error) {
      console.error('Error starting interview:', error);
      setError(error.message || 'Failed to start the interview. Please try again.');
      setShowErrorModal(true);
      
      // Increment retry count
      setRetryCount(prevCount => prevCount + 1);
      
      // If we've tried multiple times, suggest returning to applications
      if (retryCount >= 2) {
        setError('Multiple attempts to start the interview have failed. You may want to try again later.');
      }
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Play audio from URL
  const playQuestionAudio = (audioUrl) => {
    const audio = new Audio(buildAssetUrl(audioUrl));
    audio.onended = () => {
      // Enable recording when audio finishes
      setIsRecording(false);
    };
    audio.play();
  };
  
  // Use browser's text-to-speech as fallback
  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance();
      utterance.text = text;
      utterance.lang = 'en-US';
      utterance.rate = 1.0;
      utterance.onend = () => {
        // Enable recording when speech finishes
        setIsRecording(false);
      };
      window.speechSynthesis.speak(utterance);
    }
  };
  
  // Render loading state
  if (loading) {
    return (
      <div className="mock-interview-page page-shell">
        <div className="container mock-loading-state">
          <div className="mock-loading-orb" />
          <h2>Preparing your mock interview</h2>
          <p>Loading the role, interview configuration, and practice environment.</p>
        </div>
      </div>
    );
  }
  
  // Handle error retry
  const handleErrorRetry = () => {
    setShowErrorModal(false);
    setError(null);
    setErrorType(null);
    
    // Different retry logic based on error type
    if (errorType === 'microphone') {
      startRecording();
    } else if (errorType === 'network' || errorType === 'server') {
      if (interviewStage === 'questions') {
        // Retry the current question
        if (questions[currentQuestion]?.audioUrl) {
          playQuestionAudio(questions[currentQuestion].audioUrl);
        } else {
          speakText(questions[currentQuestion].text);
        }
      } else if (interviewStage === 'intro') {
        // Retry starting the interview
        startInterview();
      }
    } else {
      // For unknown errors, go back to intro
      setInterviewStage('intro');
    }
  };
  
  // Error Modal Component
  const ErrorModal = () => {
    if (!showErrorModal) return null;
    return (
      <div className="mock-overlay" onClick={() => setShowErrorModal(false)}>
        <div className="mock-modal" onClick={(e) => e.stopPropagation()}>
          <div className="mock-modal-icon error">
            {errorType === 'microphone' && <FaMicrophone />}
            {errorType === 'network' && <FaWifi />}
            {errorType === 'server' && <FaExclamationTriangle />}
            {!errorType && <FaExclamationTriangle />}
          </div>
          <h3 className="mock-modal-title">Something went wrong</h3>
          <p className="mock-modal-body">{error}</p>
          <p className="mock-modal-hint">
            {errorType === 'microphone' && 'Ensure your browser has microphone permission and no other app is using it.'}
            {errorType === 'network' && 'Check your internet connection and try again.'}
            {errorType === 'server' && 'There was a server issue. Please try again in a moment.'}
          </p>
          <div className="mock-modal-actions">
            <button type="button" className="mock-modal-btn secondary" onClick={() => setShowErrorModal(false)}>
              Close
            </button>
            <button type="button" className="mock-modal-btn primary" onClick={handleErrorRetry}>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Interview Type Selection Modal
  const InterviewTypeModal = () => {
    if (!showInterviewTypeModal) return null;
    return (
      <div className="mock-overlay" onClick={() => setShowInterviewTypeModal(false)}>
        <div className="mock-modal mock-modal--wide" onClick={(e) => e.stopPropagation()}>
          <h3 className="mock-modal-title">Select Interview Type</h3>
          <div className="interview-type-options">
            <button
              type="button"
              className={`interview-type-card ${interviewMode === 'technical' ? 'selected' : ''}`}
              onClick={() => setInterviewMode('technical')}
            >
              <span className="itc-icon">💻</span>
              <strong>Technical</strong>
              <span className="itc-desc">{interviewModeDescription.technical}</span>
            </button>
            <button
              type="button"
              className={`interview-type-card ${interviewMode === 'behavioral' ? 'selected' : ''}`}
              onClick={() => setInterviewMode('behavioral')}
            >
              <span className="itc-icon">🤝</span>
              <strong>Behavioral</strong>
              <span className="itc-desc">{interviewModeDescription.behavioral}</span>
            </button>
            <button
              type="button"
              className={`interview-type-card ${interviewMode === 'hr' ? 'selected' : ''}`}
              onClick={() => setInterviewMode('hr')}
            >
              <span className="itc-icon">👔</span>
              <strong>HR</strong>
              <span className="itc-desc">{interviewModeDescription.hr}</span>
            </button>
          </div>
          <div className="mock-modal-actions">
            <button type="button" className="mock-modal-btn secondary" onClick={() => setShowInterviewTypeModal(false)}>
              Cancel
            </button>
            <button
              type="button"
              className="mock-modal-btn primary"
              onClick={() => {
                setShowInterviewTypeModal(false);
                if (interviewStage === 'intro') {
                  setQuestions([]);
                }
              }}
            >
              Confirm
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Display error modal instead of replacing the entire UI
  // This allows for more graceful error recovery
  
  return (
    <div className="mock-interview-page page-shell">
      {/* Error Modal */}
      <ErrorModal />
      
      {/* Interview Type Selection Modal */}
      <InterviewTypeModal />
      <div className="container mock-shell">
        <header className="mock-page-header">
          <div className="mock-page-header-left">
            <h1>Mock Interview</h1>
            <div className="mock-page-header-meta">
              <span className="signal-chip positive">{interviewMode.charAt(0).toUpperCase() + interviewMode.slice(1)}</span>
              {application?.job?.type && <span className="signal-chip ai">{application.job.type}</span>}
              <span className="signal-chip active">{selectedQuestionCount} questions</span>
            </div>
            <p className="mock-page-header-note">
              {application?.job?.title || 'Role'}{application?.job?.company ? ` at ${application.job.company}` : ''}.
            </p>
          </div>

          <div className="mock-page-header-actions">
            <Link to={`/application/${applicationId}/training`} className="action-link ghost">
              Training
            </Link>
            <Link to="/dashboard/candidate/applications" className="action-link secondary">
              <FaArrowLeft /> Applications
            </Link>
          </div>
        </header>
      
      {/* Main Content */}
      <div className="mock-content">
        {interviewStage === 'intro' && (
          <div className="interview-intro">
            <div className="mock-setup-grid">
              <aside className="mock-setup-rail surface-card">
                <div className="mock-role-summary">
                  <div className="mock-role-icon">
                    <FaRobot />
                  </div>
                  <div>
                    <h2>{application?.job?.title}</h2>
                    <p>{application?.job?.company}</p>
                  </div>
                </div>

                <div className="mock-detail-list">
                  {application?.job?.company && (
                    <div>
                      <span><FaBriefcase /> Company</span>
                      <strong>{application.job.company}</strong>
                    </div>
                  )}
                  {application?.job?.location && (
                    <div>
                      <span><FaChartLine /> Location</span>
                      <strong>{application.job.location}</strong>
                    </div>
                  )}
                  <div>
                    <span><FaCheckCircle /> Mode</span>
                    <strong>{interviewMode.charAt(0).toUpperCase() + interviewMode.slice(1)} interview</strong>
                  </div>
                </div>

                <section className="mock-setup-section">
                  <h3>How it works</h3>
                  <ol>
                    <li>The interviewer asks one question at a time.</li>
                    <li>You answer using your microphone.</li>
                    <li>Your responses are scored and reviewed at the end.</li>
                  </ol>
                </section>
              </aside>

              <section className="intro-card surface-card">
                <div className="mock-section-intro">
                  <span className="mock-section-label">Interview setup</span>
                  <h2>Choose the kind of practice you want.</h2>
                  <p>
                    Run a focused rehearsal for <strong>{application?.job?.title}</strong> and get structured feedback once the session ends.
                  </p>
                </div>
              
                <div className="interview-mode-selection">
                  <h3>Interview type</h3>
                  <div className="interview-type-options">
                    <button
                      type="button"
                      className={`interview-type-card ${interviewMode === 'technical' ? 'selected' : ''}`}
                      onClick={() => setInterviewMode('technical')}
                    >
                      <span className="itc-icon">💻</span>
                      <strong>Technical</strong>
                      <span className="itc-desc">{interviewModeDescription.technical}</span>
                    </button>

                    <button
                      type="button"
                      className={`interview-type-card ${interviewMode === 'behavioral' ? 'selected' : ''}`}
                      onClick={() => setInterviewMode('behavioral')}
                    >
                      <span className="itc-icon">🤝</span>
                      <strong>Behavioral</strong>
                      <span className="itc-desc">{interviewModeDescription.behavioral}</span>
                    </button>

                    <button
                      type="button"
                      className={`interview-type-card ${interviewMode === 'hr' ? 'selected' : ''}`}
                      onClick={() => setInterviewMode('hr')}
                    >
                      <span className="itc-icon">👔</span>
                      <strong>HR</strong>
                      <span className="itc-desc">{interviewModeDescription.hr}</span>
                    </button>
                  </div>
              </div>
              
              <div className="question-count-selection">
                <div className="mock-section-head">
                  <h3>Question count</h3>
                  <span className="mock-count-label">{selectedQuestionCount} question{selectedQuestionCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="mock-count-dots">
                  {[...Array(20)].map((_, i) => {
                    const n = i + 1;
                    return (
                      <button
                        key={n}
                        type="button"
                        className={`mock-count-dot${selectedQuestionCount === n ? ' selected' : ''}${n >= 5 && n <= 10 ? ' recommended' : ''}`}
                        onClick={() => setSelectedQuestionCount(n)}
                      >
                        {n}
                      </button>
                    );
                  })}
                </div>
                <p className="question-count-note">
                  A typical interview has 5–10 questions.
                </p>
              </div>
              
              <div className="interview-permissions">
                <div className="mock-permission-card">
                  <FaVolumeUp className="me-2" />
                  This session needs microphone access before you begin.
                </div>
              </div>
              
              <button
                type="button"
                className="mock-start-btn"
                onClick={startInterview}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="mock-btn-spinner" />
                    Preparing Interview…
                  </>
                ) : (
                  'Start Interview'
                )}
              </button>
            </section>
            </div>
          </div>
        )}
        
        {interviewStage === 'questions' && (
          <div className="interview-questions">
            <div className="interview-windows-container">
              {/* Progress indicator */}
              <div className="interview-progress">
                <div className="progress-indicator">
                  {/* Dynamically generate progress dots based on required questions count */}
                  {Array.from({ length: Math.min(requiredQuestionsCount, 10) }).map((_, index) => (
                    <React.Fragment key={index}>
                      {index > 0 && <div className="progress-line"></div>}
                      <div 
                        className={`progress-dot ${index <= completedQuestionsCount ? 'active' : ''}`}
                        title={`Question ${index + 1}`}
                      ></div>
                    </React.Fragment>
                  ))}
                </div>
                <div className="progress-text">
                  <span className="current-question">Question {Math.min(completedQuestionsCount + 1, requiredQuestionsCount)} of {requiredQuestionsCount}</span>
                  {requiredQuestionsCount > 10 && <span className="progress-percentage">({Math.round((completedQuestionsCount / requiredQuestionsCount) * 100)}% complete)</span>}
                </div>
              </div>
              
              {/* Split view windows */}
              <div className="interview-windows">
                {/* Left window - User view */}
                <div className="interview-window user-window">
                  <div className="window-header">
                    <div className="window-title">You</div>
                  </div>
                  <div className="window-content">
                    <div className="user-video-placeholder">
                      <div className="user-avatar">
                        <FaUser />
                      </div>
                      {isRecording && (
                        <div className="audio-visualization-container">
                          <canvas ref={canvasRef} className="audio-canvas" width="300" height="80"></canvas>
                          <div className="audio-equalizer">
                            {[...Array(10)].map((_, i) => (
                              <div key={i} className="equalizer-bar"></div>
                            ))}
                          </div>
                        </div>
                      )}
                      {isRecording && (
                        <div className="recording-waves">
                          <div className="wave"></div>
                          <div className="wave"></div>
                          <div className="wave"></div>
                        </div>
                      )}
                      <div className="user-status">
                        {isProcessing ? (
                          <>
                            <span className="mock-btn-spinner" />
                            <span>Processing…</span>
                          </>
                        ) : isRecording ? (
                          <>
                            <span className="recording-dot"></span>
                            <span>Recording...</span>
                          </>
                        ) : (
                          <span>Ready</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Right window - AI interviewer */}
                <div className="interview-window ai-window">
                  <div className="window-header">
                    <div className="window-title">
                      <FaRobot className="window-title-icon" />
                      AI Interviewer
                    </div>
                  </div>
                  <div className="window-content">
                    <div className="ai-interviewer">
                      <div className="ai-avatar">
                        <FaRobot />
                        {isAiSpeaking && (
                          <div className="ai-speaking-waves">
                            <div className="wave"></div>
                            <div className="wave"></div>
                            <div className="wave"></div>
                          </div>
                        )}
                      </div>
                      
                      {/* Current Question Display */}
                      {currentQuestionText && (
                        <div className="current-question-container">
                          <div className="current-question-text">
                            {currentQuestionText}
                          </div>
                          <div className="question-actions">
                            <button 
                              className="replay-button" 
                              onClick={() => {
                                if (currentQuestionText) {
                                  speakText(currentQuestionText);
                                }
                              }}
                              disabled={isAiSpeaking || isProcessing}
                            >
                              <FaVolumeUp /> Replay Question
                            </button>
                          </div>
                        </div>
                      )}
                      
                      {/* Recent Conversation History */}
                      <div className="conversation-history-container">
                        <h4 className="conversation-history-title">Recent Conversation</h4>
                        <div className="conversation-history">
                          {conversationHistory.slice(-3).map((message, index) => (
                            <div 
                              key={index} 
                              className={`conversation-bubble ${message.role === 'interviewer' ? 'interviewer' : 'candidate'} ${message.isCompletionMessage ? 'isCompletionMessage' : ''}`}
                            >
                              <div className="message-header">
                                <div className="message-icon">
                                  {message.role === 'interviewer' ? <FaRobot /> : <FaUser />}
                                </div>
                                <div className="message-sender">
                                  {message.role === 'interviewer' ? 'AI Interviewer' : 'You'}
                                  {message.isCompletionMessage && <span className="completion-badge">Interview Complete</span>}
                                </div>
                              </div>
                              <div className="message-text">{message.text}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Recording button */}
              <div className="recording-controls">
                {interviewCompleted ? (
                  <div className="interview-completed-message">
                    <span className="signal-chip positive"><FaCheckCircle /> Interview Completed</span>
                    <p>All required questions have been answered. Generating final feedback…</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    className={`record-btn ${isRecording ? 'recording' : ''}`}
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isProcessing || isAiSpeaking || interviewCompleted}
                  >
                    {isRecording ? (
                      <><FaMicrophoneSlash /> Stop Recording</>
                    ) : (
                      <><FaMicrophone /> Start Recording</>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
        
        {interviewStage === 'feedback' && (
          <div className="interview-feedback">
            {isProcessing ? (
              <div className="feedback-loading">
                <div className="loading-spinner"></div>
                <h3>Generating Your Interview Feedback</h3>
                <p>Please wait while we analyze your responses and prepare comprehensive feedback...</p>
              </div>
            ) : feedback ? (
              <div className="feedback-card">
                <div className="feedback-header">
                  <h2>Your Interview Feedback</h2>
                  <p>Here's how you performed in your mock interview for {application?.job?.title}</p>
                </div>
                
                <div className="score-section">
                  <div className="score-display">
                    <div className="score-circle">
                      <span className="score-value">{feedback.score || 0}</span>
                    </div>
                  </div>
                  <div className="score-description">
                    <h3>Overall Assessment</h3>
                    <p>{feedback.overallAssessment || 'No assessment provided'}</p>
                  </div>
                </div>
                
                <div className="mock-fb-sections">
                  <details className="mock-fb-detail" open>
                    <summary><FaStar /> Strengths</summary>
                    <div className="mock-fb-body">
                      {feedback.strengths && feedback.strengths.length > 0 ? (
                        <ul className="strength-list">
                          {feedback.strengths.map((strength, index) => (
                            <li key={index} className="strength-item">
                              <div className="strength-icon"><FaCheck /></div>
                              <div className="strength-text">{strength}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No specific strengths highlighted</p>
                      )}
                    </div>
                  </details>

                  <details className="mock-fb-detail">
                    <summary><FaExclamationTriangle /> Areas for Improvement</summary>
                    <div className="mock-fb-body">
                      {feedback.areasForImprovement && feedback.areasForImprovement.length > 0 ? (
                        <ul className="improvement-list">
                          {feedback.areasForImprovement.map((area, index) => (
                            <li key={index} className="improvement-item">
                              <div className="improvement-icon"><FaExclamation /></div>
                              <div className="improvement-text">{area}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No specific areas for improvement highlighted</p>
                      )}
                    </div>
                  </details>

                  <details className="mock-fb-detail">
                    <summary><FaLightbulb /> Recommendations</summary>
                    <div className="mock-fb-body">
                      {feedback.recommendations && feedback.recommendations.length > 0 ? (
                        <ul className="recommendation-list">
                          {feedback.recommendations.map((recommendation, index) => (
                            <li key={index} className="recommendation-item">
                              <div className="recommendation-icon"><FaBriefcase /></div>
                              <div className="recommendation-text">{recommendation}</div>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p>No specific recommendations provided</p>
                      )}
                    </div>
                  </details>
                </div>
                
                <div className="interview-summary">
                  <h3><FaFileAlt className="me-2" /> Interview Summary</h3>
                  <div className="question-answer-list">
                    {answers.length > 0 ? (
                      answers.map((answer, index) => (
                        <div key={index} className="qa-item">
                          <div className="question">
                            <div className="qa-icon interviewer"><FaRobot /></div>
                            <div className="qa-text">{answer.question}</div>
                          </div>
                          <div className="answer">
                            <div className="qa-icon candidate"><FaUser /></div>
                            <div className="qa-text">
                              {answer.transcript ? (
                                answer.transcript
                              ) : (
                                <span className="text-muted">No response recorded</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="no-answers-message">
                        <FaExclamationTriangle className="me-2" />
                        <span>No interview responses recorded</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="feedback-actions">
                  <button
                    type="button"
                    className="retry-btn"
                    onClick={() => {
                      setInterviewStage('intro');
                      setCurrentQuestion(0);
                      setQuestions([]);
                      setAnswers([]);
                      setFeedback(null);
                      setTranscription('');
                    }}
                  >
                    <FaMicrophone /> Try Again
                  </button>

                  <Link
                    to="/dashboard/candidate/applications"
                    className="return-btn"
                  >
                    <FaArrowLeft /> Return to Applications
                  </Link>
                </div>
              </div>
            ) : (
              <div className="no-feedback-message">
                <FaExclamationTriangle className="me-2" />
                <span>No feedback available. Please try the interview again.</span>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AIMockInterviewRoom;
