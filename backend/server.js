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
const videoService = require('./services/videoService');

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
const videoRooms = new Map();

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

const getInterviewRoomName = (interviewId) => `interview-${interviewId}`;

const serializeRoomParticipant = (participant) => ({
  userId: participant.userId,
  userName: participant.userName,
  userRole: participant.userRole,
  socketId: participant.socketId,
  joinedAt: participant.joinedAt,
  mediaState: participant.mediaState
});

const getOrCreateVideoRoom = (interviewId) => {
  if (!videoRooms.has(interviewId)) {
    videoRooms.set(interviewId, {
      interviewId,
      participants: new Map()
    });
  }

  return videoRooms.get(interviewId);
};

const emitVideoRoomState = (interviewId) => {
  const room = videoRooms.get(interviewId);
  const participants = room
    ? Array.from(room.participants.values()).map(serializeRoomParticipant)
    : [];

  io.to(getInterviewRoomName(interviewId)).emit('video:room-state', {
    interviewId,
    participants,
    participantCount: participants.length
  });
};

const removeSocketFromVideoRoom = (socket, interviewId = socket.data?.videoInterviewId) => {
  if (!interviewId) {
    return;
  }

  const room = videoRooms.get(interviewId);
  if (!room) {
    return;
  }

  const existingParticipant = room.participants.get(socket.userId);
  if (!existingParticipant || existingParticipant.socketId !== socket.id) {
    return;
  }

  room.participants.delete(socket.userId);
  socket.leave(getInterviewRoomName(interviewId));
  socket.data.videoInterviewId = undefined;

  io.to(getInterviewRoomName(interviewId)).emit('video:participant-left', {
    interviewId,
    userId: existingParticipant.userId,
    userName: existingParticipant.userName,
    userRole: existingParticipant.userRole
  });

  if (room.participants.size === 0) {
    videoRooms.delete(interviewId);
  } else {
    emitVideoRoomState(interviewId);
  }
};


io.on('connection', (socket) => {
 
  if (socket.userId) {
    const userRoom = `user-${socket.userId}`;
    socket.join(userRoom);
    console.log(`User ${socket.userId} connected with socket ${socket.id} and joined room ${userRoom}`);
  } else {
      console.warn(`Socket ${socket.id} connected but has no userId attached after middleware. This should not happen.`);
     
  }
  

  console.log(`Socket connected ${socket.id} for user ${socket.userId}`);

  socket.on('video:join-room', async ({ interviewId, userName }, callback = () => {}) => {
    try {
      if (!interviewId) {
        throw new Error('Interview ID is required');
      }

      await videoService.getMeetingDetails(
        interviewId,
        { _id: socket.userId, role: socket.userRole },
        process.env.FRONTEND_URL || ''
      );

      const room = getOrCreateVideoRoom(interviewId);
      const currentParticipant = room.participants.get(socket.userId);

      if (room.participants.size >= 2 && !currentParticipant) {
        throw new Error('This interview room already has two active participants');
      }

      if (currentParticipant && currentParticipant.socketId !== socket.id) {
        io.to(currentParticipant.socketId).emit('video:session-replaced', {
          interviewId,
          message: 'This interview room was opened in another tab or browser window.'
        });

        const existingSocket = io.sockets.sockets.get(currentParticipant.socketId);
        if (existingSocket) {
          existingSocket.leave(getInterviewRoomName(interviewId));
          existingSocket.data.videoInterviewId = undefined;
        }
      }

      const participant = {
        userId: socket.userId,
        userName: userName || socket.userRole,
        userRole: socket.userRole,
        socketId: socket.id,
        joinedAt: new Date().toISOString(),
        mediaState: currentParticipant?.mediaState || {
          hasMedia: false,
          audioEnabled: false,
          videoEnabled: false,
          screenSharing: false
        }
      };

      room.participants.set(socket.userId, participant);
      socket.join(getInterviewRoomName(interviewId));
      socket.data.videoInterviewId = interviewId;
      socket.data.videoUserName = participant.userName;

      emitVideoRoomState(interviewId);

      callback({
        success: true,
        participant: serializeRoomParticipant(participant),
        participants: Array.from(room.participants.values()).map(serializeRoomParticipant)
      });
    } catch (error) {
      callback({
        success: false,
        message: error.message || 'Failed to join interview room'
      });
    }
  });

  socket.on('video:media-state', ({ interviewId, mediaState = {} }, callback = () => {}) => {
    const room = videoRooms.get(interviewId);
    const participant = room?.participants.get(socket.userId);

    if (!room || !participant || participant.socketId !== socket.id) {
      callback({
        success: false,
        message: 'Join the interview room before updating media state'
      });
      return;
    }

    participant.mediaState = {
      hasMedia: Boolean(mediaState.hasMedia),
      audioEnabled: Boolean(mediaState.audioEnabled),
      videoEnabled: Boolean(mediaState.videoEnabled),
      screenSharing: Boolean(mediaState.screenSharing)
    };

    emitVideoRoomState(interviewId);
    callback({ success: true });
  });

  socket.on('video:signal', ({ interviewId, targetUserId, signal }, callback = () => {}) => {
    const room = videoRooms.get(interviewId);
    const sender = room?.participants.get(socket.userId);
    const target = room?.participants.get(targetUserId);

    if (!room || !sender || sender.socketId !== socket.id) {
      callback({
        success: false,
        message: 'Join the interview room before starting signaling'
      });
      return;
    }

    if (!target) {
      callback({
        success: false,
        message: 'The other participant is not currently connected'
      });
      return;
    }

    io.to(target.socketId).emit('video:signal', {
      interviewId,
      fromUserId: sender.userId,
      fromUserName: sender.userName,
      fromUserRole: sender.userRole,
      signal
    });

    callback({ success: true });
  });

  socket.on('video:leave-room', ({ interviewId } = {}, callback = () => {}) => {
    removeSocketFromVideoRoom(socket, interviewId);
    callback({ success: true });
  });

  socket.on('disconnect', () => {
    removeSocketFromVideoRoom(socket);
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
