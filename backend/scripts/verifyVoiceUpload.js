import mongoose from 'mongoose';
import dotenv from 'dotenv';
import PhishingVoice from '../models/phishingVoice.model.js';
import NonPhishingVoice from '../models/nonPhishingVoice.model.js';

// Load environment variables
dotenv.config();

async function verifyUpload() {
  try {
    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/phishnclick';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Count documents
    const phishingCount = await PhishingVoice.countDocuments();
    const nonPhishingCount = await NonPhishingVoice.countDocuments();
    
    console.log('\n📊 VOICE DATASET VERIFICATION');
    console.log('='.repeat(40));
    console.log(`🔴 Phishing voices: ${phishingCount}`);
    console.log(`🟢 Non-phishing voices: ${nonPhishingCount}`);
    console.log(`📁 Total voices: ${phishingCount + nonPhishingCount}`);
    
    if (phishingCount > 0 || nonPhishingCount > 0) {
      console.log('\n✅ Voice dataset upload was SUCCESSFUL!');
      
      // Show some sample data
      const samplePhishing = await PhishingVoice.findOne().select('-audioData');
      const sampleNonPhishing = await NonPhishingVoice.findOne().select('-audioData');
      
      if (samplePhishing) {
        console.log('\n🔴 Sample Phishing Voice:');
        console.log(`   File: ${samplePhishing.originalName}`);
        console.log(`   Type: ${samplePhishing.phishingType}`);
        console.log(`   Threat Level: ${samplePhishing.threatLevel}`);
        console.log(`   Size: ${samplePhishing.fileSizeMB} MB`);
      }
      
      if (sampleNonPhishing) {
        console.log('\n🟢 Sample Non-Phishing Voice:');
        console.log(`   File: ${sampleNonPhishing.originalName}`);
        console.log(`   Type: ${sampleNonPhishing.callType}`);
        console.log(`   Trust Level: ${sampleNonPhishing.trustLevel}`);
        console.log(`   Size: ${sampleNonPhishing.fileSizeMB} MB`);
      }
    } else {
      console.log('\n❌ No voices found in database. Upload may have failed.');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

verifyUpload().catch(console.error);
