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

**Important**: For AI features to work, you need to configure API keys:

1. **Copy the environment template**:
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` file** and add your API keys:
   ```bash
   # Required for AI features
   OPENAI_API_KEY=your_openai_api_key_here
   HF_API_KEY=your_huggingface_api_key_here
   ```

3. **Get your API keys**:
   - **OpenAI API Key**: https://platform.openai.com/api-keys
   - **Hugging Face Token**: https://huggingface.co/settings/tokens

**Backend Environment Variables** (configured in `docker-compose.yml`):
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `HF_API_KEY` - Hugging Face API key

**Frontend Environment Variables** (configured in `frontend/.env`):
- `VITE_BACKEND_URL` - Backend API URL
- `VITE_SOCKET_URL` - Socket.io server URL

### 3. Start the Application
```bash
# Start all services (MongoDB, Backend, Frontend)
docker compose up -d

<<<<<<< HEAD
# View logs (optional)
docker compose logs -f

# Check service status
docker compose ps
```
=======
This command will:
- Build the Docker images for the frontend and backend
- Start the MongoDB database
- Connect all services via a Docker network
- Map the necessary ports to your host machine
>>>>>>> 23d15b059b04ee85271eda025dc3dc49acf06c77

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
