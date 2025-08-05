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


// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Verify environment variables are loaded
console.log('Environment variables loaded:', process.env.MONGO_URI ? 'MONGO_URI found' : 'MONGO_URI missing');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Server is working!' });
});

// API Routes
app.use('/api/popup', popupRoutes);
app.use('/api/popupEvent', popupEventRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/sessionStats', sessionStatsRoutes);
app.use('/api/quiz-results', quizResultRoutes);

// Connect to database first, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch((error) => {
  console.error('Failed to connect to database:', error);
  process.exit(1);
});
