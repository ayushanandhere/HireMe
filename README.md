# HireMe - Smart Realtime Hiring Portal

<div align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI" />
</div>

<div align="center">
  <h3>🚀 A comprehensive MERN stack recruitment platform connecting job seekers and employers with AI-powered features</h3>
</div>

---

## 🌟 Overview

HireMe is a modern, full-stack recruitment platform that revolutionizes the hiring process for both candidates and recruiters. Built with the MERN stack (MongoDB, Express.js, React, Node.js), it features real-time video interviews, AI-powered mock interviews, intelligent job matching, and comprehensive application tracking.

## ✨ Key Features

### 👨‍💼 For Candidates
- 🔍 **Smart Job Discovery** - Browse and apply to jobs with AI-powered matching
- 🤖 **AI Mock Interviews** - Practice with intelligent AI interviewer and receive detailed feedback
- 📹 **Real-time Video Interviews** - Participate in seamless WebRTC-based video interviews
- 📊 **Application Tracking** - Monitor application status with real-time updates and notifications
- 📄 **Resume Analysis** - Get ATS compatibility scores and AI-generated improvement suggestions

### 👩‍💻 For Recruiters
- 💼 **Job Management** - Create and manage job postings with advanced filtering and analytics
- 🎯 **Candidate Discovery** - Browse registered candidates with AI-powered matching algorithms
- 📅 **Interview Scheduling** - Schedule and conduct video interviews with integrated calendar
- 🔄 **Application Pipeline** - Track applications through customizable hiring stages
- 📈 **Analytics Dashboard** - Access comprehensive recruitment metrics and insights

## 🛠️ Technology Stack

| Category | Technologies |
|----------|-------------|
| **Frontend** | React 19, Vite, Bootstrap, Socket.io-client, React Router |
| **Backend** | Node.js, Express.js, Socket.io, JWT Authentication |
| **Database** | MongoDB with Mongoose ODM |
| **AI Integration** | OpenAI GPT-4 for resume parsing and mock interviews |
| **Real-time** | WebRTC for video calls, Socket.io for notifications |
| **Deployment** | Docker & Docker Compose |

## 📋 Prerequisites

- 🐳 **Docker** and **Docker Compose** installed on your system
- 📦 **Git** for cloning the repository
- 🔑 **OpenAI API Key** for AI features (optional but recommended)

## 🚀 Quick Start

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/ayushanandhere/HireMe.git
cd HireMe
```

### 2️⃣ Configure Environment Variables (Optional)

For AI features, create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
```env
OPENAI_API_KEY=your_openai_api_key_here
HF_API_KEY=your_huggingface_api_key_here
```

> **Note**: The application will run without these keys, but AI features will be disabled.

### 3️⃣ Start the Application
```bash
# Start all services (MongoDB, Backend, Frontend)
docker compose up -d

# View logs (optional)
docker compose logs -f

# Check service status
docker compose ps
```

### 4️⃣ Access the Application
- 🌐 **Frontend**: http://localhost:3000
- 🔧 **Backend API**: http://localhost:5001
- 🗄️ **MongoDB**: localhost:27017

### 5️⃣ Stop the Application
```bash
docker compose down
```

## 🔧 Development

### Local Development (Alternative to Docker)
If you prefer to run locally without Docker:

```bash
# Prerequisites: Node.js 18+, MongoDB, npm/yarn

# Backend
cd backend && npm install && npm run dev

# Frontend (in another terminal)
cd frontend && npm install && npm run dev
```

### Useful Docker Commands
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
Configure these for production:
- `MONGODB_URI` - Production MongoDB connection string
- `JWT_SECRET` - Strong JWT signing secret
- `OPENAI_API_KEY` - OpenAI API key for AI features
- `NODE_ENV=production`

### Build Commands
```bash
# Build frontend
cd frontend && npm run build

# Install production dependencies
cd backend && npm install --production
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

<div align="center">
  <p><strong>Built with ❤️ by <a href="https://github.com/ayushanandhere">Ayush Anand</a></strong></p>
  <p>⭐ Star this repository if you found it helpful!</p>
</div>
