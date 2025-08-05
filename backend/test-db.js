import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Popup from './models/popup.model.js';

dotenv.config();

async function testDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected successfully!');
    
    console.log('Testing Popup model...');
    const count = await Popup.countDocuments();
    console.log('Total popups:', count);
    
    if (count > 0) {
      const firstPopup = await Popup.findOne();
      console.log('First popup:', firstPopup ? 'Found' : 'Not found');
      console.log('Popup title:', firstPopup?.title || 'No title');
    }
    
    await mongoose.connection.close();
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDB();
