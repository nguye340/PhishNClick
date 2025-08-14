import mongoose from 'mongoose';

const phishingVoiceSchema = new mongoose.Schema({
  // Basic identification
  filename: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  originalName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Audio data stored as base64
  audioData: {
    type: String,
    required: true
  },
  
  // Audio metadata
  mimeType: {
    type: String,
    required: true,
    enum: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/x-wav']
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0
  },
  duration: {
    type: Number, // in seconds
    min: 0
  },
  
  // Phishing classification and details
  phishingType: {
    type: String,
    required: true,
    enum: [
      'tech_support_scam',
      'bank_fraud',
      'irs_scam',
      'warranty_scam',
      'robocall',
      'telecom_scam',
      'financial_impersonation',
      'government_impersonation',
      'other'
    ],
    default: 'other'
  },
  
  // Threat analysis
  threatLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Educational content
  description: {
    type: String,
    trim: true
  },
  tactics: [{
    type: String,
    trim: true
  }],
  redFlags: [{
    type: String,
    trim: true
  }],
  
  // Audio quality and technical details
  quality: {
    type: String,
    enum: ['poor', 'fair', 'good', 'excellent'],
    default: 'good'
  },
  hasBackgroundNoise: {
    type: Boolean,
    default: false
  },
  clarity: {
    type: String,
    enum: ['unclear', 'somewhat_clear', 'clear', 'very_clear'],
    default: 'clear'
  },
  
  // Usage tracking
  timesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date
  },
  
  // Training effectiveness
  correctIdentificationRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  totalExposures: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Administrative
  isActive: {
    type: Boolean,
    default: true
  },
  uploadedBy: {
    type: String,
    default: 'system'
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for better query performance
// filename index is already created by unique: true
phishingVoiceSchema.index({ phishingType: 1 });
phishingVoiceSchema.index({ threatLevel: 1 });
phishingVoiceSchema.index({ isActive: 1 });
phishingVoiceSchema.index({ timesUsed: 1 });
phishingVoiceSchema.index({ createdAt: -1 });

// Virtual for audio data size in MB
phishingVoiceSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for base64 data size (approximately 4/3 of original)
phishingVoiceSchema.virtual('base64SizeMB').get(function() {
  return (this.audioData.length / (1024 * 1024)).toFixed(2);
});

// Pre-save middleware to update timestamps
phishingVoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to increment usage
phishingVoiceSchema.methods.incrementUsage = function() {
  this.timesUsed += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Instance method to update identification rate
phishingVoiceSchema.methods.updateIdentificationRate = function(wasCorrect) {
  this.totalExposures += 1;
  if (wasCorrect) {
    const currentCorrect = Math.round((this.correctIdentificationRate / 100) * (this.totalExposures - 1));
    this.correctIdentificationRate = Math.round(((currentCorrect + 1) / this.totalExposures) * 100);
  } else {
    const currentCorrect = Math.round((this.correctIdentificationRate / 100) * (this.totalExposures - 1));
    this.correctIdentificationRate = Math.round((currentCorrect / this.totalExposures) * 100);
  }
  return this.save();
};

// Static method to get random phishing voice
phishingVoiceSchema.statics.getRandomPhishingVoice = function(phishingType = null) {
  const query = { isActive: true };
  if (phishingType) {
    query.phishingType = phishingType;
  }
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: 1 } }
  ]).then(results => results[0]);
};

// Static method to get voices by threat level
phishingVoiceSchema.statics.getVoicesByThreatLevel = function(threatLevel) {
  return this.find({ 
    isActive: true, 
    threatLevel: threatLevel 
  }).sort({ timesUsed: 1 }); // Prefer less used voices
};

export default mongoose.model('PhishingVoice', phishingVoiceSchema);
