import { connectDB } from './config/db.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import popupRoutes from './routes/popup.route.js';
import popupEventRoutes from './routes/popupEvent.route.js'; // popupEventRoutes and popupRoutes are just aliases for the routes files, can view it as variable names as well

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

// API Routes
app.use('/api/popup', popupRoutes);
app.use('/api/popupEvent', popupEventRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
