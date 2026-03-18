import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Import components
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AppErrorBoundary from './components/AppErrorBoundary';

// Import pages
import HomePage from './pages/HomePage';
import CandidateRegisterPage from './pages/candidate/RegisterPage';
import RecruiterRegisterPage from './pages/recruiter/RegisterPage';
import CandidateLoginPage from './pages/candidate/LoginPage';
import RecruiterLoginPage from './pages/recruiter/LoginPage';
import CandidateDashboardPage from './pages/candidate/DashboardPage';
import RecruiterDashboardPage from './pages/recruiter/DashboardPage';
import RegisteredCandidatesPage from './pages/recruiter/RegisteredCandidatesPage';
import CandidateInterviewInboxPage from './pages/candidate/InterviewInboxPage';
import RecruiterInterviewInboxPage from './pages/recruiter/InterviewInboxPage';
import InterviewFeedbackPage from './pages/recruiter/InterviewFeedbackPage';
import RegisterSelectPage from './pages/RegisterSelectPage';
import LoginSelectPage from './pages/LoginSelectPage';
import NotFoundPage from './pages/NotFoundPage';
import GoogleAuthCallbackPage from './pages/GoogleAuthCallbackPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VideoConferencePage from './pages/VideoConferencePage';
import CandidateInterviewFeedbackPage from './pages/candidate/InterviewFeedbackPage';
import RecruiterInterviewFeedbackPage from './pages/recruiter/InterviewFeedbackPage';
import CandidateDetailPage from './pages/recruiter/CandidateDetailPage';
import RecruiterApplicationDetailPage from './pages/recruiter/ApplicationDetailPage';
import JobListingsPage from './pages/candidate/JobListingsPage';
import JobApplicationPage from './pages/candidate/JobApplicationPage';
import MyApplicationsPage from './pages/candidate/MyApplicationsPage';
import CandidateApplicationDetailPage from './pages/candidate/ApplicationDetailPage';
import JobApplicationsPage from './pages/recruiter/JobApplicationsPage';
import CreateJobPage from './pages/recruiter/CreateJobPage';
import ManageJobsPage from './pages/recruiter/ManageJobsPage';
import ScheduleInterviewPage from './pages/recruiter/ScheduleInterviewPage';
import InterviewBriefingRoom from './pages/recruiter/InterviewBriefingRoom';
import InterviewTrainingRoom from './pages/candidate/InterviewTrainingRoom';
import AIMockInterviewRoom from './pages/candidate/AIMockInterviewRoom';
import CandidateCompleteProfilePage from './pages/candidate/CompleteProfilePage';
import RecruiterCompleteProfilePage from './pages/recruiter/CompleteProfilePage';
import CandidateProfilePage from './pages/candidate/ProfilePage';
import RecruiterProfilePage from './pages/recruiter/ProfilePage';

function App() {
  return (
    <NotificationProvider>
      <Router>
        <div className="app-shell-layout">
          <Header />
          <AppErrorBoundary>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="*" element={
                <main className="app-shell-main">
                  <div className="container app-shell-page">
                    <Routes>
                    {/* Registration Routes */}
                    <Route path="/register" element={<RegisterSelectPage />} />
                    <Route path="/register/candidate" element={<CandidateRegisterPage />} />
                    <Route path="/register/recruiter" element={<RecruiterRegisterPage />} />
                    
                    {/* Login Routes */}
                    <Route path="/login" element={<LoginSelectPage />} />
                    <Route path="/login/candidate" element={<CandidateLoginPage />} />
                    <Route path="/login/recruiter" element={<RecruiterLoginPage />} />
                    <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                    <Route path="/reset-password/:role/:token" element={<ResetPasswordPage />} />
                    <Route path="/auth/google/callback" element={<GoogleAuthCallbackPage />} />
                    <Route
                      path="/complete-profile/candidate"
                      element={
                        <ProtectedRoute requiredRole="candidate" allowIncompleteProfile>
                          <CandidateCompleteProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route
                      path="/complete-profile/recruiter"
                      element={
                        <ProtectedRoute requiredRole="recruiter" allowIncompleteProfile>
                          <RecruiterCompleteProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Protected Dashboard Routes */}
                    <Route 
                      path="/dashboard/candidate" 
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <CandidateDashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/dashboard/candidate/profile"
                      element={
                        <ProtectedRoute requiredRole="candidate" allowIncompleteProfile>
                          <CandidateProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/dashboard/recruiter" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <RecruiterDashboardPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/dashboard/recruiter/profile"
                      element={
                        <ProtectedRoute requiredRole="recruiter" allowIncompleteProfile>
                          <RecruiterProfilePage />
                        </ProtectedRoute>
                      }
                    />
                    
                    {/* Recruiter Candidate Detail Route */}
                    <Route 
                      path="/dashboard/recruiter/candidates" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <RegisteredCandidatesPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard/recruiter/candidates/:candidateId" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <CandidateDetailPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Protected Candidate Interview Inbox */}
                    <Route 
                      path="/dashboard/candidate/interviews" 
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <CandidateInterviewInboxPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard/candidate/interviews/:interviewId" 
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <CandidateInterviewFeedbackPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Protected Candidate Job Routes */}
                    <Route 
                      path="/dashboard/candidate/jobs" 
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <JobListingsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard/candidate/jobs/:jobId/apply" 
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <JobApplicationPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard/candidate/applications" 
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <MyApplicationsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/dashboard/candidate/applications/:applicationId"
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <CandidateApplicationDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/application/:applicationId/mock-interview" 
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <AIMockInterviewRoom />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Protected Recruiter Interview Routes */}
                    <Route 
                      path="/dashboard/recruiter/interviews" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <RecruiterInterviewInboxPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard/recruiter/interviews/:interviewId/feedback" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <RecruiterInterviewFeedbackPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Protected Recruiter Job Application Routes */}
                    <Route 
                      path="/dashboard/recruiter/jobs/:jobId/applications" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <JobApplicationsPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route
                      path="/dashboard/recruiter/applications/:applicationId"
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <RecruiterApplicationDetailPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route 
                      path="/dashboard/recruiter/schedule-interview/:candidateId" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <ScheduleInterviewPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard/recruiter/jobs/create" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <CreateJobPage />
                        </ProtectedRoute>
                      } 
                    />
                    <Route 
                      path="/dashboard/recruiter/jobs" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <ManageJobsPage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Video Conference Routes - accessible to both candidates and recruiters */}
                    <Route 
                      path="/interviews/conference/:interviewId" 
                      element={
                        <ProtectedRoute>
                          <VideoConferencePage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* New video meeting route */}
                    <Route 
                      path="/interview/:interviewId/meeting" 
                      element={
                        <ProtectedRoute>
                          <VideoConferencePage />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* AI Interview Briefing Room - for recruiters */}
                    <Route 
                      path="/interview/:interviewId/briefing" 
                      element={
                        <ProtectedRoute requiredRole="recruiter">
                          <InterviewBriefingRoom />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* AI Interview Training Room - for candidates */}
                    <Route 
                      path="/application/:applicationId/training" 
                      element={
                        <ProtectedRoute requiredRole="candidate">
                          <InterviewTrainingRoom />
                        </ProtectedRoute>
                      } 
                    />
                    
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </div>
                </main>
              } />
            </Routes>
          </AppErrorBoundary>
          <Footer />
          <ToastContainer position="bottom-right" autoClose={5000} />
        </div>
      </Router>
    </NotificationProvider>
  );
}

export default App;
