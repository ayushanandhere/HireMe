# HireMe - Advanced Recruitment Platform

![HireMe Platform](https://via.placeholder.com/800x400?text=HireMe+Platform)

HireMe is a comprehensive full-stack web application built with the MERN stack (MongoDB, Express, React, Node.js) designed to streamline the recruitment process by connecting job seekers (candidates) and employers (recruiters). The platform offers a modern, intuitive interface with features like real-time video interviews, AI-powered mock interviews, application tracking, and more.

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Project Architecture](#project-architecture)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [User Roles and Workflows](#user-roles-and-workflows)
- [Core Features Explained](#core-features-explained)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

HireMe addresses the challenges in modern recruitment by providing a unified platform where:

- **Candidates** can discover job opportunities, apply with customized applications, prepare with AI mock interviews, and participate in real-time video interviews
- **Recruiters** can post job listings, review applications, schedule interviews, conduct video interviews, and provide structured feedback

The platform emphasizes user experience with responsive design, real-time notifications, and intuitive workflows for both candidates and recruiters.

## 🚀 Key Features

### For Candidates
- **Job Discovery & Application**: Browse and search job listings with advanced filters
- **Profile Management**: Create and maintain professional profiles with skills, experience, and education
- **AI Mock Interviews**: Practice with an AI interviewer that provides realistic interview scenarios
- **Video Interviews**: Participate in real-time video interviews with recruiters
- **Application Tracking**: Monitor application status and receive updates
- **Feedback System**: Receive structured feedback after interviews

### For Recruiters
- **Job Posting Management**: Create, edit, and manage job listings
- **Applicant Tracking**: Review and filter applications with a comprehensive dashboard
- **Interview Scheduling**: Set up and manage interview schedules
- **Video Interviewing**: Conduct real-time video interviews with candidates
- **Feedback System**: Provide structured feedback to candidates
- **Analytics Dashboard**: Access insights on recruitment metrics

### Platform-Wide Features
- **User Authentication & Authorization**: Secure login and role-based access control
- **Real-time Notifications**: Updates on application status, interview schedules, etc.
- **Responsive Design**: Optimized experience across devices
- **WebRTC Integration**: High-quality video conferencing capabilities

## 🏗️ Project Architecture

HireMe follows a modern client-server architecture:

### Frontend Architecture
- **React SPA**: Single-page application built with React and React Router
- **State Management**: Context API for global state management
- **UI Framework**: React Bootstrap for responsive components
- **API Communication**: Axios for RESTful API calls
- **Real-time Features**: Socket.IO client for notifications and WebRTC for video

### Backend Architecture
- **Express API**: RESTful API endpoints organized by domain
- **Authentication**: JWT-based authentication middleware
- **Database Layer**: Mongoose ODM for MongoDB interactions
- **WebSocket Server**: Socket.IO for real-time communication
- **Signaling Server**: For WebRTC video conferencing setup

### Database Design
- **MongoDB Collections**: Users, Jobs, Applications, Interviews, Feedback
- **Relationships**: References between collections for data integrity
- **Indexes**: Optimized for common query patterns

## 💻 Technology Stack

### Frontend
- **React**: UI library for building component-based interfaces
- **React Router**: Client-side routing
- **React Bootstrap**: UI component library
- **Socket.IO Client**: Real-time communication
- **Simple-Peer**: WebRTC abstraction for video conferencing
- **Axios**: HTTP client
- **Vite**: Build tool and development server

### Backend
- **Node.js**: JavaScript runtime
- **Express**: Web framework
- **MongoDB**: NoSQL database
- **Mongoose**: MongoDB object modeling
- **Socket.IO**: Real-time bidirectional event-based communication
- **JSON Web Tokens (JWT)**: Authentication
- **Bcrypt**: Password hashing

### DevOps & Tools
- **Git**: Version control
- **ESLint & Prettier**: Code quality and formatting
- **Dotenv**: Environment variable management
- **Nodemon**: Development server with hot reload

## 📁 Project Structure

```
HireMe/
├── backend/                # Node.js and Express backend
│   ├── controllers/        # API controllers by domain
│   │   ├── auth/           # Authentication controllers
│   │   ├── jobs/           # Job-related controllers
│   │   ├── applications/   # Application-related controllers
│   │   ├── interviews/     # Interview-related controllers
│   │   └── users/          # User profile controllers
│   ├── middleware/         # Custom middleware
│   │   ├── auth.js         # Authentication middleware
│   │   ├── error.js        # Error handling middleware
│   │   └── validation.js   # Input validation middleware
│   ├── models/             # MongoDB models
│   │   ├── User.js         # User model (candidate/recruiter)
│   │   ├── Job.js          # Job listing model
│   │   ├── Application.js  # Job application model
│   │   ├── Interview.js    # Interview model
│   │   └── Feedback.js     # Interview feedback model
│   ├── routes/             # API routes
│   │   ├── auth.js         # Authentication routes
│   │   ├── jobs.js         # Job-related routes
│   │   ├── applications.js # Application-related routes
│   │   ├── interviews.js   # Interview-related routes
│   │   └── users.js        # User profile routes
│   ├── services/           # Business logic and external services
│   │   ├── email.js        # Email notification service
│   │   └── socket.js       # Socket.IO setup and handlers
│   ├── utils/              # Utility functions
│   ├── .env                # Environment variables
│   ├── package.json        # Backend dependencies
│   └── server.js           # Entry point
│
└── frontend/               # React frontend (Vite)
    ├── public/             # Static assets
    │   ├── images/         # Image assets
    │   └── favicon.ico     # Site favicon
    ├── src/                # Source code
    │   ├── components/     # Reusable components
    │   │   ├── common/     # Shared components
    │   │   ├── candidate/  # Candidate-specific components
    │   │   └── recruiter/  # Recruiter-specific components
    │   ├── pages/          # Page components
    │   │   ├── auth/       # Authentication pages
    │   │   ├── candidate/  # Candidate pages
    │   │   ├── recruiter/  # Recruiter pages
    │   │   └── shared/     # Shared pages
    │   ├── contexts/       # React contexts for state management
    │   ├── hooks/          # Custom React hooks
    │   ├── services/       # API services
    │   ├── utils/          # Utility functions
    │   ├── styles/         # Global styles
    │   ├── App.jsx         # Main app component
    │   ├── main.jsx        # Entry point
    │   └── routes.jsx      # Route definitions
    ├── .env                # Environment variables
    ├── index.html          # HTML template
    └── package.json        # Frontend dependencies
```

## 📋 Prerequisites

- **Node.js** (v14+)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn**
- Modern web browser with WebRTC support (for video features)

## 🚦 Getting Started

### Backend Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/hireme.git
   cd hireme
   ```

2. **Navigate to the backend directory**:
   ```bash
   cd backend
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Create a `.env` file** in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/hireme
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   EMAIL_SERVICE=smtp.example.com
   EMAIL_USER=your_email@example.com
   EMAIL_PASS=your_email_password
   CLIENT_URL=http://localhost:3000
   ```

5. **Start the backend server**:
   ```bash
   # Development mode with hot reload
   npm run dev
   
   # OR Production mode
   npm start
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the frontend directory:
   ```
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

4. **Start the frontend development server**:
   ```bash
   npm run dev
   ```

5. **Access the application** at `http://localhost:3000` in your web browser

## 👥 User Roles and Workflows

### Candidate Workflow
1. **Registration & Profile Creation**:
   - Sign up as a candidate
   - Complete profile with education, experience, skills
   - Upload resume and profile picture

2. **Job Search & Application**:
   - Browse job listings with filters
   - View detailed job descriptions
   - Submit applications with cover letters

3. **Interview Preparation & Participation**:
   - Practice with AI mock interviews
   - Receive interview invitations
   - Join video interviews with recruiters
   - Review feedback after interviews

### Recruiter Workflow
1. **Registration & Company Profile**:
   - Sign up as a recruiter
   - Complete company profile
   - Set up team members (optional)

2. **Job Management**:
   - Create and publish job listings
   - Edit or close positions
   - View applicant statistics

3. **Application Review**:
   - Browse applications with filtering options
   - Review candidate profiles and resumes
   - Shortlist promising candidates

4. **Interview Management**:
   - Schedule interviews with candidates
   - Conduct video interviews
   - Provide structured feedback
   - Track candidate progress

## 🔍 Core Features Explained

### AI Mock Interview System
The AI mock interview feature helps candidates prepare for real interviews by:
- Simulating realistic interview scenarios based on job type
- Providing a conversational AI interviewer with speech capabilities
- Recording and analyzing candidate responses
- Offering feedback on performance
- Supporting multiple interview modes (behavioral, technical, etc.)

### Video Conferencing
The platform's WebRTC-based video conferencing system enables:
- High-quality, low-latency video interviews
- Screen sharing for technical interviews
- Text chat alongside video
- Recording capabilities (with consent)
- Fallback mechanisms for connection issues

### Application Tracking System
Both candidates and recruiters benefit from:
- Real-time status updates on applications
- Stage-based tracking (Applied, Reviewed, Interview Scheduled, etc.)
- Notification system for status changes
- Historical view of all applications

### Dashboard Analytics
Recruiters gain insights through:
- Application volume metrics
- Candidate source tracking
- Interview conversion rates
- Time-to-fill statistics
- Custom report generation

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate a user
- `GET /api/auth/me` - Get current user information
- `POST /api/auth/logout` - Log out a user

### Job Endpoints
- `GET /api/jobs` - List all jobs with filtering
- `GET /api/jobs/:id` - Get job details
- `POST /api/jobs` - Create a new job (recruiter only)
- `PUT /api/jobs/:id` - Update a job (recruiter only)
- `DELETE /api/jobs/:id` - Delete a job (recruiter only)

### Application Endpoints
- `GET /api/applications` - List applications (filtered by user role)
- `POST /api/jobs/:id/apply` - Apply for a job (candidate only)
- `GET /api/applications/:id` - Get application details
- `PUT /api/applications/:id/status` - Update application status (recruiter only)

### Interview Endpoints
- `POST /api/interviews` - Schedule an interview
- `GET /api/interviews` - List interviews
- `GET /api/interviews/:id` - Get interview details
- `POST /api/interviews/:id/feedback` - Submit interview feedback

### User Profile Endpoints
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/profile/resume` - Upload resume (candidate only)

## 🚀 Deployment

### Production Deployment Checklist
1. **Environment Configuration**:
   - Set up production environment variables
   - Configure MongoDB connection string for production
   - Set appropriate JWT secrets and expiration

2. **Build Process**:
   ```bash
   # Frontend build
   cd frontend
   npm run build
   
   # Backend preparation
   cd ../backend
   npm install --production
   ```

3. **Deployment Options**:
   - **Traditional Hosting**: Deploy backend to Node.js hosting service and frontend to static hosting
   - **Docker**: Use provided Dockerfile and docker-compose.yml
   - **Cloud Platforms**: Deploy to AWS, Heroku, Vercel, etc.

4. **Database Setup**:
   - Set up MongoDB Atlas or other managed MongoDB service
   - Configure network access and user authentication
   - Run initial database setup scripts if needed

5. **Domain and SSL**:
   - Configure custom domain
   - Set up SSL certificates for HTTPS
   - Update CORS settings accordingly

## 🤝 Contributing

We welcome contributions to HireMe! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

Built by Ayush Anand

## Docker Setup

# HireMe Project - Docker Setup Guide

This guide will help you set up and run the HireMe project using Docker on any machine (Mac, Linux, Windows).

## Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/) installed on your machine
- [Docker Compose](https://docs.docker.com/compose/install/) (usually included with Docker Desktop)
- Git (to clone the repository if needed)

## Setup Instructions

### 1. Clone the Repository (if needed)

```bash
git clone https://github.com/ayushanandhere/HireMe.git
cd HireMe
```

### 2. Environment Configuration

1. **Backend Configuration**:
   - Copy the example environment file:
     ```bash
     cp backend/.env.docker backend/.env
     ```
   - Edit `backend/.env` to add your actual API keys:
     - `OPENAI_API_KEY`: Your OpenAI API key
     - `HF_API_KEY`: Your HuggingFace API key
     - Adjust other settings if needed

2. **Frontend Configuration**:
   - Copy the example environment file:
     ```bash
     cp frontend/.env.docker frontend/.env
     ```
   - The default configuration should work with the Docker setup

### 3. Build and Run with Docker Compose

```bash
docker-compose up -d
```

This command will:
- Build the Docker images for frontend and backend
- Start the MongoDB database
- Connect all services via a Docker network
- Map the necessary ports to your host machine

### 4. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: mongodb://localhost:27017 (accessible from your host machine)

### 5. Stopping the Application

```bash
docker-compose down
```

To remove all data (including the MongoDB volume):

```bash
docker-compose down -v
```

## Development Workflow

### Viewing Logs

```bash
# View logs from all services
docker-compose logs -f

# View logs from a specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### Rebuilding After Changes

If you make changes to the code:

```bash
docker-compose build
docker-compose up -d
```

### Accessing the Container Shell

```bash
# Backend shell
docker-compose exec backend sh

# Frontend shell
docker-compose exec frontend sh

# MongoDB shell
docker-compose exec mongodb mongosh -u hireme -p hireme_password --authenticationDatabase admin hireme
```

## Troubleshooting

### Connection Issues

If the frontend can't connect to the backend:
1. Check that all containers are running: `docker-compose ps`
2. Verify the environment variables in the frontend's `.env` file
3. Check backend logs for any errors: `docker-compose logs backend`

### Database Connection Issues

If the backend can't connect to MongoDB:
1. Check MongoDB container is running: `docker-compose ps mongodb`
2. Verify the MongoDB connection string in the backend's `.env` file
3. Check MongoDB logs: `docker-compose logs mongodb`

### Port Conflicts

If you see errors about ports being in use:
1. Check if you have any services already using ports 3000, 5000, or 27017
2. Modify the port mappings in `docker-compose.yml` if needed

## Notes on Data Persistence

- MongoDB data is stored in a Docker volume (`mongodb_data`) for persistence
- This ensures your data survives container restarts
- To completely reset the database, use `docker-compose down -v`
