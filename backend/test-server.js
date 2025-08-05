import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Popup from './models/popup.model.js';

dotenv.config();

const app = express();
const PORT = 5001; // Use different port

// Middleware
app.use(cors());
app.use(express.json());

// Test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Test server is working!' });
});

// Simple popup route
app.get('/api/popup/random', async (req, res) => {
  try {
    console.log('Getting random popup...');
    
    // Use MongoDB's aggregate with $sample for better random selection
    const randomPopups = await Popup.aggregate([
      { $sample: { size: 1 } }
    ]);
    
    console.log('Random popups found:', randomPopups.length);
    
    if (randomPopups.length === 0) {
      return res.status(404).json({ success: false, error: "No popups found in database" });
    }
    
    const popup = randomPopups[0];
    console.log('Found popup:', popup ? 'Yes' : 'No');
    res.status(200).json({success: true, data: popup});
  } catch (err) {
    console.error('Error in getRandomPopup:', err);
    res.status(500).json({ success: false, error: "Server Error" });
  }
});

// Connect to database first, then start server
async function startServer() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully!');
    
    app.listen(PORT, () => {
      console.log(`Test server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
