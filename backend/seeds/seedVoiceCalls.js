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

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths to audio directories
const PHISHING_DIR = path.join(__dirname, 'PhishingVoiceDataset', 'Phishing');
const NON_PHISHING_DIR = path.join(__dirname, 'PhishingVoiceDataset', 'NonPhishing');

/**
 * Seed phishing voice calls
 */
async function seedPhishingVoices() {
  console.log('\n📞 Seeding Phishing Voice Calls...');
  
  try {
    // Clear existing phishing voices
    await PhishingVoice.deleteMany({});
    console.log('✅ Cleared existing phishing voices');
    
    // Read all files from phishing directory
    const files = fs.readdirSync(PHISHING_DIR);
    const audioFiles = files.filter(file => 
      AudioUtils.isValidAudioFile(path.join(PHISHING_DIR, file))
    );
    
    console.log(`📁 Found ${audioFiles.length} phishing audio files`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < audioFiles.length; i++) {
      const filename = audioFiles[i];
      const filePath = path.join(PHISHING_DIR, filename);
      
      try {
        console.log(`\n[${i + 1}/${audioFiles.length}] Processing: ${filename}`);
        
        // Convert file to base64
        const audioData = await AudioUtils.fileToBase64(filePath);
        
        // Determine phishing type and threat level based on filename
        const phishingType = determinePhishingType(filename);
        const threatLevel = determineThreatLevel(filename);
        
        // Create phishing voice record
        const phishingVoice = new PhishingVoice({
          filename: audioData.filename,
          originalName: audioData.originalName,
          audioData: audioData.audioData,
          mimeType: audioData.mimeType,
          fileSize: audioData.fileSize,
          phishingType,
          threatLevel,
          description: `Phishing voice call: ${filename}`,
          tactics: getTactics(phishingType),
          redFlags: getRedFlags(phishingType),
          quality: 'good',
          hasBackgroundNoise: false,
          clarity: 'clear',
          tags: [phishingType, threatLevel, 'training'],
          uploadedBy: 'system'
        });
        
        await phishingVoice.save();
        console.log(`✅ Saved: ${filename} (${(audioData.fileSize / 1024).toFixed(2)} KB)`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Phishing voices seeded: ${successCount} success, ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Error seeding phishing voices:', error);
    throw error;
  }
}

/**
 * Seed non-phishing voice calls
 */
async function seedNonPhishingVoices() {
  console.log('\n📞 Seeding Non-Phishing Voice Calls...');
  
  try {
    // Clear existing non-phishing voices
    await NonPhishingVoice.deleteMany({});
    console.log('✅ Cleared existing non-phishing voices');
    
    // Read all files from non-phishing directory
    const files = fs.readdirSync(NON_PHISHING_DIR);
    const audioFiles = files.filter(file => 
      AudioUtils.isValidAudioFile(path.join(NON_PHISHING_DIR, file))
    );
    
    console.log(`📁 Found ${audioFiles.length} non-phishing audio files`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < audioFiles.length; i++) {
      const filename = audioFiles[i];
      const filePath = path.join(NON_PHISHING_DIR, filename);
      
      try {
        console.log(`\n[${i + 1}/${audioFiles.length}] Processing: ${filename}`);
        
        // Convert file to base64
        const audioData = await AudioUtils.fileToBase64(filePath);
        
        // Determine call type and trust level
        const callType = determineCallType(filename);
        const trustLevel = determineTrustLevel(filename);
        
        // Create non-phishing voice record
        const nonPhishingVoice = new NonPhishingVoice({
          filename: audioData.filename,
          originalName: audioData.originalName,
          audioData: audioData.audioData,
          mimeType: audioData.mimeType,
          fileSize: audioData.fileSize,
          callType,
          trustLevel,
          description: getPurpose(callType),
          legitimacyIndicators: getVerificationMethods(callType),
          appropriateResponse: 'Answer the call and verify legitimacy through official channels',
          quality: 'good',
          hasBackgroundNoise: false,
          clarity: 'clear',
          isProfessional: true,
          tags: [callType, trustLevel, 'training'],
          uploadedBy: 'system'
        });
        
        await nonPhishingVoice.save();
        console.log(`✅ Saved: ${filename} (${(audioData.fileSize / 1024).toFixed(2)} KB)`);
        successCount++;
        
      } catch (error) {
        console.error(`❌ Error processing ${filename}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Non-phishing voices seeded: ${successCount} success, ${errorCount} errors`);
    
  } catch (error) {
    console.error('❌ Error seeding non-phishing voices:', error);
    throw error;
  }
}

// Helper functions to determine metadata from filename

function determinePhishingType(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('bank') || lower.includes('financial')) return 'financial';
  if (lower.includes('tech') || lower.includes('support')) return 'tech_support';
  if (lower.includes('irs') || lower.includes('tax')) return 'government';
  if (lower.includes('prize') || lower.includes('lottery')) return 'prize_scam';
  if (lower.includes('robocall')) return 'robocall';
  return 'other';
}

function determineThreatLevel(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('urgent') || lower.includes('immediate')) return 'high';
  if (lower.includes('verify') || lower.includes('confirm')) return 'medium';
  return 'low';
}

function getTactics(phishingType) {
  const tacticsMap = {
    'financial': ['urgency', 'account_suspension', 'verification_required'],
    'tech_support': ['fake_virus_warning', 'remote_access_request', 'payment_demand'],
    'government': ['legal_threat', 'tax_fraud_claim', 'arrest_warrant'],
    'prize_scam': ['fake_prize', 'upfront_payment', 'personal_info_request'],
    'robocall': ['automated_message', 'callback_request', 'number_spoofing'],
    'other': ['social_engineering', 'impersonation']
  };
  return tacticsMap[phishingType] || ['social_engineering'];
}

function getRedFlags(phishingType) {
  return [
    'Unsolicited call',
    'Requests personal information',
    'Creates sense of urgency',
    'Threatens negative consequences',
    'Asks for payment or credentials'
  ];
}

function determineCallType(filename) {
  const lower = filename.toLowerCase();
  if (lower.includes('medical') || lower.includes('doctor')) return 'medical_appointment';
  if (lower.includes('pharmacy') || lower.includes('prescription')) return 'pharmacy_notification';
  if (lower.includes('school') || lower.includes('education')) return 'school_announcement';
  if (lower.includes('delivery') || lower.includes('package')) return 'delivery_notification';
  if (lower.includes('appointment') || lower.includes('reminder')) return 'appointment_reminder';
  if (lower.includes('customer') || lower.includes('service')) return 'customer_service';
  if (lower.includes('government') || lower.includes('official')) return 'government_official';
  if (lower.includes('survey')) return 'survey_legitimate';
  return 'business_legitimate';
}

function determineTrustLevel(filename) {
  return 'high'; // All non-phishing calls are high trust
}

function getPurpose(callType) {
  const purposeMap = {
    'medical_appointment': 'Medical appointment reminder or confirmation',
    'pharmacy_notification': 'Prescription ready notification',
    'school_announcement': 'School-related announcement or notification',
    'business_legitimate': 'Legitimate business communication',
    'customer_service': 'Customer support follow-up',
    'appointment_reminder': 'Scheduled appointment reminder',
    'delivery_notification': 'Package delivery notification',
    'survey_legitimate': 'Legitimate survey or feedback request',
    'government_official': 'Official government communication',
    'other': 'General legitimate communication'
  };
  return purposeMap[callType] || 'General legitimate communication';
}

function getVerificationMethods(callType) {
  return [
    'Caller ID matches known number',
    'Does not request sensitive information',
    'Provides callback number that matches official website',
    'Professional tone and clear purpose'
  ];
}

/**
 * Main seeding function
 */
async function seedVoiceCalls() {
  try {
    console.log('🚀 Starting Voice Call Database Seeding...');
    console.log(`📊 MongoDB URI: ${process.env.MONGO_URI?.substring(0, 30)}...`);
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Seed phishing voices
    await seedPhishingVoices();
    
    // Seed non-phishing voices
    await seedNonPhishingVoices();
    
    // Get final counts
    const phishingCount = await PhishingVoice.countDocuments();
    const nonPhishingCount = await NonPhishingVoice.countDocuments();
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ VOICE CALL SEEDING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`📊 Phishing Voices: ${phishingCount}`);
    console.log(`📊 Non-Phishing Voices: ${nonPhishingCount}`);
    console.log(`📊 Total Voice Calls: ${phishingCount + nonPhishingCount}`);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('\n👋 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding
seedVoiceCalls();
