const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Load environment variables
dotenv.config();
console.log('Loaded environment variables from backend directory');

if (!process.env.MONGODB_URI) {
  throw new Error('Missing MONGODB_URI environment variable');
}

if (!process.env.JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable');
}

// Import routes
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const candidatesRoutes = require('./routes/candidatesRoutes');
const interviewRoutes = require('./routes/interviewRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const resumeRoutes = require('./routes/resumeRoutes');
const jobRoutes = require('./routes/jobRoutes');
const matchRoutes = require('./routes/matchRoutes');
const resumeSuggestionRoutes = require('./routes/resumeSuggestionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const videoRoutes = require('./routes/videoRoutes');
const aiRoutes = require('./routes/aiRoutes');
const mockInterviewRoutes = require('./routes/mockInterviewRoutes');

// Initialize Express app
const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowInsecureSocketAuth =
  process.env.NODE_ENV !== 'production' &&
  process.env.ALLOW_INSECURE_SOCKET_AUTH === 'true';
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 5000;

// Export the Socket.io instance for use in other modules
global.io = io;
module.exports = { io };

// Middleware
app.disable('x-powered-by');
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Make uploads folder accessible
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/match', matchRoutes);
app.use('/api/resume-suggestions', resumeSuggestionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/ai/mock-interview', mockInterviewRoutes);

// Default route
app.get('/', (req, res) => {
  res.send('HireMe API is running');
});

io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    if (allowInsecureSocketAuth) {
      socket.userId = `anonymous-${Math.random().toString(36).slice(2, 10)}`;
      socket.userRole = 'anonymous';
      return next();
    }

    return next(new Error('Authentication required'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userRole = decoded.role;
    next();
  } catch (err) {
    if (allowInsecureSocketAuth) {
      socket.userId = `invalid-${Math.random().toString(36).slice(2, 10)}`;
      socket.userRole = 'anonymous';
      return next();
    }

    return next(new Error('Invalid authentication token'));
  }
});


io.on('connection', (socket) => {
 
  if (socket.userId) {
    const userRoom = `user-${socket.userId}`;
    socket.join(userRoom);
    console.log(`User ${socket.userId} connected with socket ${socket.id} and joined room ${userRoom}`);
  } else {
      console.warn(`Socket ${socket.id} connected but has no userId attached after middleware. This should not happen.`);
     
  }
  

  console.log(`Socket connected ${socket.id} for user ${socket.userId}`);

  socket.on('join-room', ({ interviewId, userType, userName }) => {
    socket.join(interviewId);
    console.log(`${userName} (${userType}) joined room: ${interviewId}`);
    
    socket.to(interviewId).emit('user-joined', { userType, userName });
  });
  
  socket.on('call-user', ({ interviewId, signalData, from }) => {
    console.log(`Call initiated in room ${interviewId} by ${from}`);
    socket.to(interviewId).emit('call-user', { signal: signalData, from });
  });
  
  socket.on('answer-call', ({ interviewId, signal }) => {
    console.log(`Call answered in room ${interviewId}`);
    socket.to(interviewId).emit('call-accepted', signal);
  });
  
  socket.on('end-call', ({ interviewId }) => {
    console.log(`Call ended in room ${interviewId}`);
    socket.to(interviewId).emit('call-ended');
  });
  
  socket.on('disconnect', () => {

    console.log(`User ${socket.userId || '(unknown; token likely expired or invalid)'} disconnected: ${socket.id}`);

  });
});

app.use(notFound);
app.use(errorHandler);

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  }); 
