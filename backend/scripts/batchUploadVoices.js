import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PhishingVoice from '../models/phishingVoice.model.js';
import NonPhishingVoice from '../models/nonPhishingVoice.model.js';
import AudioUtils from '../utils/audioUtils.js';

const { promises: fsPromises } = fs;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Batch Upload Script for Voice Call Dataset
 * Processes all audio files in the PhishingVoiceDataset directory
 * and uploads them to MongoDB as base64 encoded data
 */

class BatchVoiceUploader {
  constructor() {
    this.phishingDir = path.join(__dirname, '../seeds/PhishingVoiceDataset/Phishing');
    this.nonPhishingDir = path.join(__dirname, '../seeds/PhishingVoiceDataset/NonPhishing');
    this.results = {
      phishing: { success: 0, failed: 0, errors: [] },
      nonPhishing: { success: 0, failed: 0, errors: [] },
      totalProcessed: 0,
      startTime: null,
      endTime: null
    };
  }

  /**
   * Connect to MongoDB
   */
  async connectDB() {
    try {
      const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/phishnclick';
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Get all audio files from a directory
   */
  async getAudioFiles(directory) {
    try {
      const files = await fsPromises.readdir(directory);
      return files.filter(file => AudioUtils.isValidAudioFile(file))
                  .map(file => path.join(directory, file));
    } catch (error) {
      console.error(`Failed to read directory ${directory}:`, error.message);
      return [];
    }
  }

  /**
   * Classify phishing type based on filename
   */
  classifyPhishingType(filename) {
    const name = filename.toLowerCase();
    
    if (name.includes('telecom') || name.includes('robocall')) {
      return 'telecom_scam';
    } else if (name.includes('financial') || name.includes('bank')) {
      return 'financial_impersonation';
    } else if (name.includes('tech') || name.includes('support')) {
      return 'tech_support_scam';
    } else if (name.includes('irs') || name.includes('tax')) {
      return 'irs_scam';
    } else if (name.includes('warranty')) {
      return 'warranty_scam';
    } else {
      return 'other';
    }
  }

  /**
   * Classify non-phishing call type based on filename
   */
  classifyCallType(filename) {
    const name = filename.toLowerCase();
    
    if (name.includes('medical') || name.includes('doctor') || name.includes('appointment')) {
      return 'medical_appointment';
    } else if (name.includes('pharmacy') || name.includes('prescription')) {
      return 'pharmacy_notification';
    } else if (name.includes('school') || name.includes('education')) {
      return 'school_announcement';
    } else if (name.includes('business') || name.includes('service')) {
      return 'business_legitimate';
    } else if (name.includes('delivery') || name.includes('package')) {
      return 'delivery_notification';
    } else {
      return 'other';
    }
  }

  /**
   * Generate threat level based on filename and type
   */
  generateThreatLevel(filename, phishingType) {
    const name = filename.toLowerCase();
    
    if (name.includes('urgent') || name.includes('immediate') || phishingType === 'irs_scam') {
      return 'critical';
    } else if (phishingType === 'financial_impersonation' || phishingType === 'tech_support_scam') {
      return 'high';
    } else if (phishingType === 'telecom_scam' || phishingType === 'warranty_scam') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate trust level for non-phishing calls
   */
  generateTrustLevel(callType) {
    if (callType === 'medical_appointment' || callType === 'pharmacy_notification') {
      return 'high';
    } else if (callType === 'school_announcement' || callType === 'government_official') {
      return 'verified';
    } else if (callType === 'business_legitimate') {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Upload phishing voices
   */
  async uploadPhishingVoices() {
    console.log('\n🔴 Processing Phishing Voice Calls...');
    const files = await this.getAudioFiles(this.phishingDir);
    console.log(`Found ${files.length} phishing audio files`);

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const filename = path.basename(filePath);
      
      try {
        console.log(`[${i + 1}/${files.length}] Processing: ${filename}`);
        
        // Check if already exists
        const existing = await PhishingVoice.findOne({ originalName: filename });
        if (existing) {
          console.log(`⚠️  Skipping ${filename} - already exists`);
          continue;
        }

        // Convert to base64
        const audioData = await AudioUtils.fileToBase64(filePath);
        
        // Classify the phishing type
        const phishingType = this.classifyPhishingType(filename);
        const threatLevel = this.generateThreatLevel(filename, phishingType);
        
        // Create voice record
        const phishingVoice = new PhishingVoice({
          filename: audioData.filename,
          originalName: audioData.originalName,
          audioData: audioData.audioData,
          mimeType: audioData.mimeType,
          fileSize: audioData.fileSize,
          phishingType,
          threatLevel,
          description: `Phishing voice call sample - ${phishingType.replace('_', ' ')}`,
          quality: 'good',
          clarity: 'clear',
          tags: [phishingType, threatLevel, 'dataset'],
          uploadedBy: 'batch_script'
        });

        await phishingVoice.save();
        this.results.phishing.success++;
        console.log(`✅ Uploaded: ${filename} (${phishingType}, ${threatLevel})`);
        
      } catch (error) {
        this.results.phishing.failed++;
        this.results.phishing.errors.push({
          filename,
          error: error.message
        });
        console.error(`❌ Failed to upload ${filename}:`, error.message);
      }
      
      this.results.totalProcessed++;
    }
  }

  /**
   * Upload non-phishing voices
   */
  async uploadNonPhishingVoices() {
    console.log('\n🟢 Processing Non-Phishing Voice Calls...');
    const files = await this.getAudioFiles(this.nonPhishingDir);
    console.log(`Found ${files.length} non-phishing audio files`);

    for (let i = 0; i < files.length; i++) {
      const filePath = files[i];
      const filename = path.basename(filePath);
      
      try {
        console.log(`[${i + 1}/${files.length}] Processing: ${filename}`);
        
        // Check if already exists
        const existing = await NonPhishingVoice.findOne({ originalName: filename });
        if (existing) {
          console.log(`⚠️  Skipping ${filename} - already exists`);
          continue;
        }

        // Convert to base64
        const audioData = await AudioUtils.fileToBase64(filePath);
        
        // Classify the call type
        const callType = this.classifyCallType(filename);
        const trustLevel = this.generateTrustLevel(callType);
        
        // Create voice record
        const nonPhishingVoice = new NonPhishingVoice({
          filename: audioData.filename,
          originalName: audioData.originalName,
          audioData: audioData.audioData,
          mimeType: audioData.mimeType,
          fileSize: audioData.fileSize,
          callType,
          trustLevel,
          description: `Legitimate voice call sample - ${callType.replace('_', ' ')}`,
          quality: 'good',
          clarity: 'clear',
          isProfessional: true,
          tags: [callType, trustLevel, 'dataset'],
          uploadedBy: 'batch_script'
        });

        await nonPhishingVoice.save();
        this.results.nonPhishing.success++;
        console.log(`✅ Uploaded: ${filename} (${callType}, ${trustLevel})`);
        
      } catch (error) {
        this.results.nonPhishing.failed++;
        this.results.nonPhishing.errors.push({
          filename,
          error: error.message
        });
        console.error(`❌ Failed to upload ${filename}:`, error.message);
      }
      
      this.results.totalProcessed++;
    }
  }

  /**
   * Print final results
   */
  printResults() {
    const duration = (this.results.endTime - this.results.startTime) / 1000;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 BATCH UPLOAD RESULTS');
    console.log('='.repeat(60));
    console.log(`⏱️  Total Duration: ${duration.toFixed(2)} seconds`);
    console.log(`📁 Total Files Processed: ${this.results.totalProcessed}`);
    console.log('');
    console.log('🔴 PHISHING VOICES:');
    console.log(`   ✅ Successfully uploaded: ${this.results.phishing.success}`);
    console.log(`   ❌ Failed uploads: ${this.results.phishing.failed}`);
    console.log('');
    console.log('🟢 NON-PHISHING VOICES:');
    console.log(`   ✅ Successfully uploaded: ${this.results.nonPhishing.success}`);
    console.log(`   ❌ Failed uploads: ${this.results.nonPhishing.failed}`);
    console.log('');
    console.log(`🎯 OVERALL SUCCESS RATE: ${((this.results.phishing.success + this.results.nonPhishing.success) / this.results.totalProcessed * 100).toFixed(1)}%`);
    
    if (this.results.phishing.errors.length > 0 || this.results.nonPhishing.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      [...this.results.phishing.errors, ...this.results.nonPhishing.errors].forEach(error => {
        console.log(`   ${error.filename}: ${error.error}`);
      });
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Run the batch upload process
   */
  async run() {
    try {
      console.log('🚀 Starting Batch Voice Upload Process...');
      this.results.startTime = Date.now();
      
      // Connect to database
      await this.connectDB();
      
      // Upload phishing voices
      await this.uploadPhishingVoices();
      
      // Upload non-phishing voices
      await this.uploadNonPhishingVoices();
      
      this.results.endTime = Date.now();
      this.printResults();
      
    } catch (error) {
      console.error('💥 Batch upload failed:', error);
    } finally {
      // Close database connection
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script if called directly
const isMainModule = import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`;
if (isMainModule) {
  const uploader = new BatchVoiceUploader();
  uploader.run().catch(console.error);
}

export default BatchVoiceUploader;
