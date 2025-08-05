import mongoose from 'mongoose';
import dotenv from 'dotenv';
import seedPopup from '../seeds/seedPopup.js';

// Ensure environment variables are loaded
dotenv.config();

// Hardcoded fallback connection string (only for development)
const connectionString = process.env.MONGO_URI;

export const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(connectionString);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    
    // Temporarily disable seeding for debugging
    // const shouldSeed = process.env.SEED_DB === 'true' || process.argv.includes('--seed');
    // if (shouldSeed) {
    //   console.log('Seeding database...');
    //   await seedPopup();
    // }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit process with error 1, and success 0
  }
};