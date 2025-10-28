import { connectDB } from './config/db.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import popupRoutes from './routes/popup.route.js';
import popupEventRoutes from './routes/popupEvent.route.js'; // popupEventRoutes and popupRoutes are just aliases for the routes files, can view it as variable names as well
import sessionRoutes from './routes/session.routes.js';
import sessionStatsRoutes from './routes/sessionStats.routes.js';
import quizResultRoutes from './routes/quizResult.route.js';
import voiceCallRoutes from './routes/voiceCall.routes.js';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.route.js';
import userRoutes from './routes/user.route.js';
import adminRoutes from './routes/admin.route.js';
import telemetryRoutes from './routes/telemetry.route.js';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Verify environment variables are loaded
// console.log('Environment variables loaded:', process.env.MONGO_URI ? 'MONGO_URI found' : 'MONGO_URI missing');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting and IP detection behind ALB/reverse proxy
app.set('trust proxy', 1);

// Middleware
app.use(express.json());
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};
app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Test route
app.get('/', (req, res) => {
  return res.status(200).json({ 
    status: 'success!!',
    message: 'Server is working!' });
} )
// app.get('/api/test', (req, res) => {
//   res.json({ success: true, message: 'Api route is working!' });
// });
app.get('/api/health', async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoose = await import('mongoose');
    const dbState = mongoose.default.connection.readyState;
    
    // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    if (dbState !== 1) {
      return res.status(503).json({ 
        status: 'unhealthy', 
        reason: 'Database not connected',
        dbState: dbState,
        timestamp: new Date().toISOString() 
      });
    }
    
    // Ping database to ensure it's responsive
    await mongoose.default.connection.db.admin().ping();
    
    res.status(200).json({ 
      status: 'healthy', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(503).json({ 
      status: 'unhealthy', 
      reason: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});
// API Routes
app.use('/api/popup', popupRoutes);
app.use('/api/popupEvent', popupEventRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/sessionStats', sessionStatsRoutes);
app.use('/api/quiz-results', quizResultRoutes);
app.use('/api/voice-calls', voiceCallRoutes);

// Connect to database first, then start server
let server;
connectDB().then(() => {
  server = app.listen(PORT, () => {
    // console.log(`Server running on port ${PORT}`);
  });
  
  // Set keep-alive timeout for connections
  server.keepAliveTimeout = 65000; // 65 seconds
  server.headersTimeout = 66000; // 66 seconds (must be higher than keepAliveTimeout)
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  // Don't exit immediately, let reconnection logic handle it
});

// Graceful shutdown handlers
const gracefulShutdown = (signal) => {
  // console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  if (server) {
    server.close(() => {
      // console.log('HTTP server closed');
      
      // Close database connection
      import('mongoose').then(mongoose => {
        mongoose.default.connection.close(false, () => {
          // console.log('MongoDB connection closed');
          process.exit(0);
        });
      });
    });
    
    // Force close after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

// Handle various termination signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit, log and continue
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit, log and continue
});
