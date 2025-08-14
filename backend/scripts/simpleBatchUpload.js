import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import PhishingVoice from '../models/phishingVoice.model.js';
import NonPhishingVoice from '../models/nonPhishingVoice.model.js';
import AudioUtils from '../utils/audioUtils.js';

// Load environment variables
dotenv.config();

const { promises: fsPromises } = fs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function uploadVoices() {
  console.log('🚀 Starting Voice Dataset Upload...');
  
  try {
    // Connect to MongoDB Atlas - scenarios database
    let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/phishnclick';
    // Ensure we're using the scenarios database
    if (mongoUri.includes('mongodb+srv://') && !mongoUri.includes('/scenarios')) {
      mongoUri = mongoUri.replace('/?', '/scenarios?');
    }
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Define directories
    const phishingDir = path.join(__dirname, '../seeds/PhishingVoiceDataset/Phishing');
    const nonPhishingDir = path.join(__dirname, '../seeds/PhishingVoiceDataset/NonPhishing');
    
    console.log(`📁 Phishing directory: ${phishingDir}`);
    console.log(`📁 Non-phishing directory: ${nonPhishingDir}`);
    
    // Check if directories exist
    try {
      await fsPromises.access(phishingDir);
      console.log('✅ Phishing directory exists');
    } catch (error) {
      console.error('❌ Phishing directory not found:', phishingDir);
      return;
    }
    
    try {
      await fsPromises.access(nonPhishingDir);
      console.log('✅ Non-phishing directory exists');
    } catch (error) {
      console.error('❌ Non-phishing directory not found:', nonPhishingDir);
      return;
    }

    let totalUploaded = 0;
    let totalErrors = 0;

    // Process Phishing voices
    console.log('\n🔴 Processing Phishing Voices...');
    const phishingFiles = await fsPromises.readdir(phishingDir);
    const validPhishingFiles = phishingFiles.filter(file => 
      file.toLowerCase().endsWith('.mp3') || file.toLowerCase().endsWith('.wav')
    );
    
    console.log(`Found ${validPhishingFiles.length} phishing audio files`);
    
    for (let i = 0; i < validPhishingFiles.length; i++) {
      const filename = validPhishingFiles[i];
      const filePath = path.join(phishingDir, filename);
      
      try {
        console.log(`[${i + 1}/${validPhishingFiles.length}] Processing: ${filename}`);
        
        // Check if already exists
        const existing = await PhishingVoice.findOne({ originalName: filename });
        if (existing) {
          console.log(`⚠️  Skipping ${filename} - already exists`);
          continue;
        }

        // Convert to base64
        const audioData = await AudioUtils.fileToBase64(filePath);
        
        // Determine phishing type based on filename
        let phishingType = 'other';
        const name = filename.toLowerCase();
        if (name.includes('telecom') || name.includes('robocall')) {
          phishingType = 'telecom_scam';
        } else if (name.includes('financial')) {
          phishingType = 'financial_impersonation';
        } else if (name.includes('tech') || name.includes('support')) {
          phishingType = 'tech_support_scam';
        } else if (name.includes('irs')) {
          phishingType = 'irs_scam';
        }
        
        // Create and save voice record
        const phishingVoice = new PhishingVoice({
          filename: audioData.filename,
          originalName: audioData.originalName,
          audioData: audioData.audioData,
          mimeType: audioData.mimeType,
          fileSize: audioData.fileSize,
          phishingType,
          threatLevel: 'medium',
          description: `Phishing voice call sample - ${phishingType.replace('_', ' ')}`,
          quality: 'good',
          clarity: 'clear',
          tags: [phishingType, 'dataset'],
          uploadedBy: 'batch_script'
        });

        await phishingVoice.save();
        totalUploaded++;
        console.log(`✅ Uploaded: ${filename} (${phishingType})`);
        
      } catch (error) {
        totalErrors++;
        console.error(`❌ Failed to upload ${filename}:`, error.message);
      }
    }

    // Process Non-Phishing voices
    console.log('\n🟢 Processing Non-Phishing Voices...');
    const nonPhishingFiles = await fsPromises.readdir(nonPhishingDir);
    const validNonPhishingFiles = nonPhishingFiles.filter(file => 
      file.toLowerCase().endsWith('.mp3') || file.toLowerCase().endsWith('.wav')
    );
    
    console.log(`Found ${validNonPhishingFiles.length} non-phishing audio files`);
    
    for (let i = 0; i < validNonPhishingFiles.length; i++) {
      const filename = validNonPhishingFiles[i];
      const filePath = path.join(nonPhishingDir, filename);
      
      try {
        console.log(`[${i + 1}/${validNonPhishingFiles.length}] Processing: ${filename}`);
        
        // Check if already exists
        const existing = await NonPhishingVoice.findOne({ originalName: filename });
        if (existing) {
          console.log(`⚠️  Skipping ${filename} - already exists`);
          continue;
        }

        // Convert to base64
        const audioData = await AudioUtils.fileToBase64(filePath);
        
        // Create and save voice record
        const nonPhishingVoice = new NonPhishingVoice({
          filename: audioData.filename,
          originalName: audioData.originalName,
          audioData: audioData.audioData,
          mimeType: audioData.mimeType,
          fileSize: audioData.fileSize,
          callType: 'other',
          trustLevel: 'medium',
          description: 'Legitimate voice call sample',
          quality: 'good',
          clarity: 'clear',
          isProfessional: true,
          tags: ['legitimate', 'dataset'],
          uploadedBy: 'batch_script'
        });

        await nonPhishingVoice.save();
        totalUploaded++;
        console.log(`✅ Uploaded: ${filename}`);
        
      } catch (error) {
        totalErrors++;
        console.error(`❌ Failed to upload ${filename}:`, error.message);
      }
    }

    // Final results
    console.log('\n' + '='.repeat(50));
    console.log('📊 UPLOAD COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully uploaded: ${totalUploaded} voices`);
    console.log(`❌ Failed uploads: ${totalErrors}`);
    console.log(`📁 Total processed: ${totalUploaded + totalErrors}`);
    
    if (totalUploaded > 0) {
      console.log('\n🎉 Voice dataset upload was SUCCESSFUL!');
    }

  } catch (error) {
    console.error('💥 Upload failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the upload
uploadVoices().catch(console.error);
