# HireMe

A full-stack hiring platform where candidates apply, prepare with AI-powered tools, and interview — all inside one system. Recruiters screen applications with interpretable AI scoring, schedule interviews, and close feedback loops without leaving the platform.

Built with React 19, Node.js, MongoDB, Socket.IO, and OpenAI.

## What makes it different

Most hiring tools are either recruiter-only ATS systems or candidate-only job boards. HireMe connects both sides into one pipeline:

- **Shared pipeline state.** When a recruiter advances an application to "Interview Scheduled", the candidate sees it instantly. There is one source of truth, not two disconnected views.
- **AI as decision support, not a black box.** Resume screening produces a breakdown — skills match, experience relevance, ATS compatibility, role fit — with explanations. Recruiters see *why* the system scored a candidate the way it did.
- **Preparation is built in.** Candidates don't just apply and wait. From any active application, they can open an AI training room for Q&A prep or run a full mock interview with audio recording and scored feedback.
- **The interview loop closes in-product.** Scheduling, video conferencing, real-time AI briefing for the recruiter, structured feedback, and candidate-visible scoring all happen inside HireMe.

## Demo walkthrough

The platform is designed around one end-to-end path:

1. A recruiter registers, creates a job posting with required skills and experience levels, and publishes it.
2. A candidate registers, completes their profile, uploads a resume, and applies to the job.
3. The recruiter opens the application. AI screening signals are generated — overall match score, skills alignment, experience relevance, ATS score, and role fit with a written explanation. Matched and missing skills are listed.
4. The recruiter advances the candidate through pipeline stages (screened, matched, interview requested) and schedules an interview.
5. The candidate receives a real-time notification, accepts the interview, and uses the training room to prepare. The AI training assistant knows the job description, the candidate's resume, and the specific skills gaps to work on.
6. Optionally, the candidate runs a mock interview — choosing technical, behavioral, or HR mode, selecting 1–20 questions, and answering via microphone. The system transcribes answers, evaluates them, and delivers scored feedback.
7. Both parties join the video conference at the scheduled time. The recruiter has access to an AI briefing room with candidate context, suggested questions, and a live assistant during the interview.
8. After the interview, the recruiter submits structured feedback across four dimensions (technical, communication, problem-solving, overall) with 0–10 scores and written comments.
9. The recruiter can choose to share feedback with the candidate. If shared, the candidate sees the full breakdown on their interview page.
10. The application pipeline updates to reflect completion, and both dashboards show current state.

## Features

### Candidate side

**Profile and resume management.** Full profile editor with work experience, education, skills, headline, bio, and resume upload (PDF or Word). The system parses uploaded resumes and extracts structured data for AI matching.

**Job search and application.** Browse published jobs, view requirements, and apply with an optional cover note. The application captures a snapshot of the candidate's profile at submission time, so recruiters always see what the candidate looked like when they applied.

**Application tracking.** Every application shows its current pipeline stage, from submission through screening, interview scheduling, and final outcome. Stage transitions are timestamped.

**Interview inbox.** View all scheduled interviews, accept or decline invitations, see interview details (position, time, recruiter, meeting link), and access feedback after completion.

**AI training room.** A conversational interface for interview preparation, accessible from any active application. The AI assistant is contextualised with the specific job description, required skills, and the candidate's resume. Candidates can create multiple training sessions, star important ones, rename them, and review conversation history. The interface supports both "Normal" and "Deep" conversation modes.

**Mock interviews.** A structured practice session with AI-generated questions tailored to the job and candidate profile. Three modes: technical (coding, system design, domain knowledge), behavioral (STAR-format situational questions), and HR (career goals, culture fit, salary expectations). Candidates answer via microphone, the system transcribes responses, and each answer receives scored feedback. At the end, the system produces an overall performance assessment.

**Dashboard.** Application counts by stage, upcoming interviews, recent activity, and a suggested next step based on current pipeline state.

### Recruiter side

**Job management.** Create, edit, and delete job postings. Each job includes title, description, company, location, type (full-time, part-time, contract, internship, remote), required skills, experience level and range, and salary range.

**Application review with AI screening.** For each application, the system generates: an overall match score (0–100), skills match score, experience relevance score, ATS compatibility score, role fit score with written explanation, and lists of matched and missing skills. The recruiter sees the candidate's submitted resume alongside their current profile, with clear indication of what was submitted vs. what exists now.

**Pipeline management.** Applications move through defined stages: new application, resume screened, job matched, interview requested, interview scheduled, interview completed, offer extended, offer accepted, rejected, or withdrawn. Each transition is logged.

**Interview scheduling.** Select a candidate, pick a date and time, set duration, add notes, and send. The candidate receives a real-time notification with an accept/decline prompt.

**AI briefing room.** Before or during an interview, the recruiter can open a briefing page that presents: AI-extracted candidate highlights, key skills, experience timeline, matched vs. missing skills, role fit assessment, and a live AI chat assistant that can suggest follow-up questions, flag areas to probe, and provide technical assessment guidance based on the conversation context.

**Structured feedback.** After an interview, the recruiter rates the candidate on technical knowledge, communication, problem-solving, and overall impression (each 0–10 with comments). Feedback can be kept private or shared with the candidate via a visibility toggle.

**Candidate database.** Browse all registered candidates, search by name or skills, view detailed profiles, and access parsed resumes.

**Analytics dashboard.** Pipeline funnel breakdown, application stage distribution, time-in-stage metrics, job performance, interview completion rates, and feedback score distributions.

### Real-time features

**Socket.IO integration.** User-specific rooms for notifications and interview-specific rooms for conferencing. JWT-authenticated connections with optional local fallback for development.

**Video conferencing.** WebRTC-based peer-to-peer video and audio using Simple Peer. Media state management, participant tracking, and session conflict detection. Both parties join from the same meeting link.

**Notifications.** Real-time push for interview requests, acceptances, rejections, cancellations, reminders, feedback submissions, and feedback sharing. Persistent storage with 30-day TTL, mark-as-read, and delete support.

### AI capabilities

All AI features use OpenAI's GPT-4o and degrade gracefully if no API key is configured. Non-AI workflows remain fully functional.

- **Resume parsing.** Multi-format extraction (PDF, Word, raw text) into structured fields: skills, experience, education, projects, certifications, contact information.
- **Job-resume matching.** Five-dimension scoring (overall, skills, experience, ATS, role fit) with matched/missing skills lists and written explanations.
- **Interview question generation.** Context-aware questions generated from job requirements and candidate profile, with configurable count and mode.
- **Answer evaluation.** Audio transcription and per-answer scoring on accuracy, communication clarity, and role relevance.
- **Training assistant.** Persistent conversational AI that knows the job, the candidate's background, and the specific preparation areas to focus on.
- **Recruiter briefing assistant.** Live AI chat during interviews with contextual suggestions for follow-up questions and assessment guidance.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 6, React Router 7, Bootstrap 5 |
| Backend | Node.js, Express 4, Mongoose 7 |
| Database | MongoDB 7+ |
| Real-time | Socket.IO 4 |
| Video | Simple Peer (WebRTC) |
| AI | OpenAI GPT-4o |
| Auth | JWT, Google OAuth 2.0, bcryptjs |
| Email | Nodemailer (SMTP) |
| Deployment | Docker, Docker Compose |

## Project structure

```
HireMe/
  backend/
    controllers/       Route handlers for all API endpoints
    models/            Mongoose schemas (User, Candidate, Recruiter,
                       Job, Application, Interview, Notification,
                       TrainingConversation)
    routes/            Express route definitions
    services/          AI integration, resume parsing, analytics,
                       video meeting, pipeline logic
    middleware/         Auth, file upload, rate limiting, error handling
    uploads/           Runtime directory for resumes and audio files
    server.js          Express + Socket.IO entry point

  frontend/
    src/
      pages/           40+ page components (candidate/, recruiter/, auth)
      components/      Shared components (VideoChat, InterviewFeedback,
                       ResumeAnalysis, NotificationDropdown, Header)
      services/        Axios API client, video service
      contexts/        NotificationContext (Socket.IO integration)
      styles/          Component and page CSS
      App.jsx          Route definitions and layout shell
```

## Setup

### Docker (recommended)

```bash
cp .env.example .env
# Edit .env — at minimum set OPENAI_API_KEY for AI features
docker compose up --build
```

Frontend: http://localhost:3000
Backend: http://localhost:5001
MongoDB: localhost:27017

### Local development

```bash
# Terminal 1 — backend
cd backend
npm install
npm run dev    # port 5000

# Terminal 2 — frontend
cd frontend
npm install
npm run dev    # port 5173
```

### Environment variables

**Required:**

| Variable | Purpose |
|----------|---------|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `FRONTEND_URL` | Frontend origin for CORS and redirects |
| `BACKEND_URL` | Backend origin for Socket.IO and callbacks |

**AI (optional but recommended):**

| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Enables all AI features |
| `OPENAI_MODEL` | Model selection (default: `gpt-4o`) |

**Google OAuth (optional):**

| Variable | Purpose |
|----------|---------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_AUTH_REDIRECT_URI` | Callback URL (must match Google Cloud config) |

For local backend on port 5000: `http://localhost:5000/api/auth/google/callback`
For Docker backend on port 5001: `http://localhost:5001/api/auth/google/callback`

**Email (optional, for password resets):**

| Variable | Purpose |
|----------|---------|
| `EMAIL_HOST` | SMTP server (e.g., `smtp.gmail.com`) |
| `EMAIL_PORT` | SMTP port (e.g., `587`) |
| `EMAIL_SECURE` | TLS (`true` or `false`) |
| `EMAIL_USER` | SMTP username |
| `EMAIL_PASS` | SMTP password (use App Password for Gmail) |
| `EMAIL_FROM` | Sender address (defaults to `EMAIL_USER`) |

**Frontend:**

| Variable | Purpose |
|----------|---------|
| `VITE_BACKEND_URL` | Backend URL (e.g., `http://localhost:5001`) |

**Development:**

| Variable | Purpose |
|----------|---------|
| `ALLOW_INSECURE_SOCKET_AUTH` | Set to `true` only for local dev without proper JWT socket auth |

## API overview

The backend exposes the following route groups, all under `/api`:

| Route group | Description |
|-------------|-------------|
| `/auth` | Registration, login, Google OAuth, password reset (candidate and recruiter) |
| `/jobs` | Job CRUD, recruiter listing, public browsing |
| `/applications` | Application submission, stage management, resume parsing, AI analysis |
| `/interviews` | Scheduling, status updates, feedback submission and sharing |
| `/ai` | Training context, training assistant chat, interview briefing assistant |
| `/ai/mock-interview` | Mock interview initialisation, answer processing, question generation, finalisation |
| `/resume` | Resume upload, parsing, and analysis retrieval |
| `/match` | Job-candidate matching and ATS scoring |
| `/video` | Meeting details and URL generation |
| `/notifications` | Notification listing, read status, deletion |
| `/candidates` | Candidate browsing and resume access (recruiter) |
| `/analytics` | Dashboard, job, candidate, and interview analytics |

All protected endpoints require a valid JWT token. Role-specific endpoints enforce candidate-only or recruiter-only access.

## Architecture

```
Candidate UI          Recruiter UI
     \                    /
      \                  /
    React 19 + Vite + React Router
              |
       Axios / Socket.IO client
              |
     Express + Mongoose + Socket.IO
        /          |          \
   MongoDB      OpenAI       SMTP
   (data)     (AI features)  (email)
```

Key design decisions:

- **Single pipeline model.** Applications have one stage field that both candidate and recruiter UIs read from. No sync issues, no conflicting state.
- **Profile snapshots.** When a candidate applies, the application stores a copy of their profile at that moment. Recruiters always see what was submitted, even if the candidate updates their profile later.
- **Graceful AI degradation.** Every AI endpoint checks for the OpenAI key at runtime. If missing, it returns a 503 with a setup message. The rest of the platform works normally.
- **Strict socket auth.** Socket connections require JWT verification by default. Insecure fallback exists for local development only and requires an explicit environment variable opt-in.
- **Rate limiting.** Login, registration, and password reset endpoints are rate-limited to prevent abuse.

## Known tradeoffs

- There is no test suite. Validation depends on build checks and manual flow verification.
- AI output quality depends on resume clarity and the configured OpenAI model.
- Video conferencing supports two participants per interview (no panel interviews).
- No calendar integration for checking recruiter/candidate availability before scheduling.
- Some older pages still carry heavier visual patterns that haven't been migrated to the current design system.
