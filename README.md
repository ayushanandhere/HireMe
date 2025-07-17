# HireMe - Smart Realtime Hiring Portal

> A comprehensive MERN stack recruitment platform connecting job seekers and employers with AI-powered features.

## 🌟 Overview

HireMe is a modern recruitment platform that streamlines the hiring process for both candidates and recruiters. Built with the MERN stack (MongoDB, Express.js, React, Node.js), it features real-time video interviews, AI-powered mock interviews, intelligent job matching, and comprehensive application tracking.

## 🚀 Key Features

### For Candidates
- **Job Discovery & Application** - Browse and apply to jobs with intelligent matching
- **AI Mock Interviews** - Practice with AI interviewer and receive feedback
- **Real-time Video Interviews** - Participate in WebRTC-based video interviews
- **Application Tracking** - Monitor application status with real-time updates
- **Resume Analysis** - Get ATS compatibility scores and improvement suggestions

### For Recruiters
- **Job Management** - Create and manage job postings with advanced filtering
- **Candidate Discovery** - Browse registered candidates with AI-powered matching
- **Interview Scheduling** - Schedule and conduct video interviews
- **Application Pipeline** - Track applications through the hiring process
- **Analytics Dashboard** - Access recruitment metrics and insights

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Bootstrap, Socket.io-client
- **Backend**: Node.js, Express.js, Socket.io, JWT Authentication
- **Database**: MongoDB with Mongoose ODM
- **AI Integration**: OpenAI GPT-4 for resume parsing and mock interviews
- **Real-time**: WebRTC for video calls, Socket.io for notifications
- **Deployment**: Docker & Docker Compose

## 📋 Prerequisites

- **Docker** and **Docker Compose** installed on your system
- **Git** for cloning the repository
- **OpenAI API Key** for AI features (optional but recommended)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/hireme.git
cd hireme
```

### 2. Configure Environment Variables

The application uses environment variables for configuration. Default values are provided in the Docker setup, but you can customize them:

**Backend Environment Variables** (configured in `docker-compose.yml`):
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `FRONTEND_URL` - Frontend URL for CORS

**Frontend Environment Variables** (configured in `frontend/.env`):
- `VITE_BACKEND_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io server URL

### 3. Start the Application
```bash
# Start all services (MongoDB, Backend, Frontend)
docker compose up -d

# View logs (optional)
docker compose logs -f

# Check service status
docker compose ps
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **MongoDB**: localhost:27017

### 5. Stop the Application
```bash
docker compose down
```

## 🔧 Development

### Local Development (Alternative to Docker)
If you prefer to run the application locally without Docker:

1. **Prerequisites**: Node.js 18+, MongoDB, npm/yarn
2. **Backend**: `cd backend && npm install && npm run dev`
3. **Frontend**: `cd frontend && npm install && npm run dev`
4. **Database**: Ensure MongoDB is running locally or use MongoDB Atlas

### Docker Commands
```bash
# View service status
docker compose ps

# View logs
docker compose logs -f [service_name]

# Rebuild after code changes
docker compose up --build

# Stop and remove containers
docker compose down

# Remove all data (including database)
docker compose down -v
```

## 🚀 Production Deployment

### Environment Variables
Ensure these are configured for production:
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - Strong JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `NODE_ENV=production`

### Build for Production
```bash
# Build frontend
cd frontend && npm run build

# Install production dependencies
cd backend && npm install --production
```

**Built with ❤️ by Ayush Anand**
