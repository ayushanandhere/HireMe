# HireMe

HireMe is a MERN hiring workflow product focused on one believable story: candidate applies, recruiter screens with interpretable AI signal, both sides prepare, and the interview loop closes inside the same system.

## What makes it stand out
- Candidate and recruiter surfaces are different on purpose, but share the same pipeline state.
- AI is used as decision support: role fit, resume analysis, interview preparation, and screening context.
- The product is optimized for a strong demo path instead of a loose collection of unrelated features.
- Core frontend flows now use one shared API/config layer instead of page-level hardcoded endpoints.

## Golden path
1. Candidate registers, uploads resume, browses jobs, and applies.
2. Recruiter reviews applications, inspects ranked screening signal, and advances candidates.
3. Recruiter schedules interviews, candidate prepares in the training room, and mock interview flow is available from the same application context.
4. Interview and feedback state stay aligned with the application pipeline.

## Tech stack
- Frontend: React 19, Vite, React Router, Bootstrap
- Backend: Node.js, Express, MongoDB, Mongoose, Socket.IO
- AI: OpenAI-backed resume and interview workflows with graceful fallback messaging
- Realtime: Socket.IO notifications and interview state updates

## Local setup
### Docker
```bash
cp .env.example .env
docker compose up --build
```

Frontend runs at [http://localhost:3000](http://localhost:3000) and backend runs at [http://localhost:5001](http://localhost:5001).

### Local dev without Docker
```bash
cd backend
npm install
npm run dev

cd ../frontend
npm install
npm run dev
```

## Environment
Important backend variables:
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `BACKEND_URL`
- `CORS_ORIGIN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_AUTH_REDIRECT_URI`
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_SECURE`
- `EMAIL_USER`
- `EMAIL_PASS`
- `EMAIL_FROM`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `ALLOW_INSECURE_SOCKET_AUTH=true` only if you explicitly want local unauthenticated socket fallback

Important frontend variable:
- `VITE_BACKEND_URL=http://localhost:5001`

Google OAuth callback:
- Add `http://localhost:5000/api/auth/google/callback` for local backend runs, or `http://localhost:5001/api/auth/google/callback` if you run the backend on port `5001`.
- The callback URL configured in Google Cloud must exactly match `GOOGLE_AUTH_REDIRECT_URI`.

Password reset email:
- Configure SMTP via `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, and `EMAIL_PASS`.
- For Gmail, use `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`, `EMAIL_SECURE=false`, and an App Password as `EMAIL_PASS`.
- `EMAIL_FROM` is optional; if omitted, HireMe sends from `EMAIL_USER`.

## Product notes
- Application stages are normalized on the backend and returned with readable stage labels.
- Recruiter and candidate dashboards are backed by summary endpoints instead of placeholder counts.
- Candidate and recruiter now have dedicated profile pages with shared live data instead of separate fake/profile-form state.
- Application review now distinguishes the submitted application packet from the candidate's current profile, including submitted resume, notes, and resume-source context.
- Socket auth is now strict by default; insecure local fallback requires explicit opt-in.
- AI-enhanced features should degrade cleanly if the API key is missing, but the non-AI workflow should still function.

## Recommended walkthrough
1. Register a recruiter account and publish a real job.
2. Register a candidate account and complete the profile.
3. Apply to the published job from the candidate dashboard.
4. Review the application as the recruiter and schedule an interview.
5. Return as the candidate and use the training room or mock interview from the live application.

## Architecture at a glance
```text
Candidate UI / Recruiter UI
        |
     Vite + React
        |
 Shared frontend API layer
        |
   Express + Mongoose
        |
 MongoDB + Socket.IO + OpenAI
```

## Current tradeoffs
- Some legacy pages still use older Bootstrap-heavy visual patterns and should be brought into the new design system over time.
- AI quality depends on resume quality and configured model access.
- There is no test suite yet; validation currently depends on lint/build smoke checks and real-flow verification.
