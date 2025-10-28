import mongoose from 'mongoose';
import dotenv from 'dotenv';
// import seedPopup from '../seeds/seedPopup.js'; // Commented out - seeds excluded from production build

// Ensure environment variables are loaded
dotenv.config();

// Hardcoded fallback connection string (only for development)
let connectionString = process.env.MONGO_URI;

// Ensure we're using the scenarios database where voice data is stored
if (connectionString && connectionString.includes('mongodb+srv://') && !connectionString.includes('/scenarios')) {
  connectionString = connectionString.replace('/?', '/scenarios?');
  // console.log('Updated connection string to use scenarios database');
}

export const connectDB = async () => {
  try {
    // console.log('Attempting to connect to MongoDB scenarios database...');
    
    // Connection options for better stability
    const options = {
      maxPoolSize: 10,
      minPoolSize: 2,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 10000,
      heartbeatFrequencyMS: 10000,
      retryWrites: true,
      retryReads: true,
    };
    
    const conn = await mongoose.connect(connectionString, options);
    // console.log(`MongoDB connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });
    
    mongoose.connection.on('reconnected', () => {
      // console.log('MongoDB reconnected successfully');
    });
    
    // Temporarily disable seeding for debugging
    // const shouldSeed = process.env.SEED_DB === 'true' || process.argv.includes('--seed');
    // if (shouldSeed) {
    //   console.log('Seeding database...');
    //   await seedPopup();
    // }
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // console.error('Retrying connection in 5 seconds...');
    setTimeout(() => connectDB(), 5000);
  }
};