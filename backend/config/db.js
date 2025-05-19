import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Ensure environment variables are loaded
dotenv.config();

// Hardcoded fallback connection string (only for development)
const connectionString = process.env.MONGO_URI || 'mongodb+srv://nguye340:Group6CatPhish2025_ISCapstone@phishnclickcluster.zgid1.mongodb.net/scenarios?retryWrites=true&w=majority&appName=PhishNClickCluster';

export const connectDB = async () => {
  try {
    console.log('Attempting to connect to MongoDB...');
    const conn = await mongoose.connect(connectionString);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1); // Exit process with error 1, and success 0
  }
};