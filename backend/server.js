import { connectDB } from './config/db.js';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';

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
//app.use(cors());
//app.use(express.json());

// API Routes
app.get("/scenarios", (req, res) => {
  res.json({ message: "Scenarios endpoint" });
});

// app.get('/api/health', (req, res) => {
//   res.json({ status: 'ok', message: 'PhishNClick API is running' });
// });

// // Serve static assets if in production
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../frontend/build')));
  
//   app.get('*', (req, res) => {
//     res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
//   });
// }

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});
