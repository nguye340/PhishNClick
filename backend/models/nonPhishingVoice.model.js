import mongoose from 'mongoose';

const nonPhishingVoiceSchema = new mongoose.Schema({
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
  
  // Legitimate call classification
  callType: {
    type: String,
    required: true,
    enum: [
      'medical_appointment',
      'pharmacy_notification',
      'school_announcement',
      'business_legitimate',
      'customer_service',
      'appointment_reminder',
      'delivery_notification',
      'survey_legitimate',
      'government_official',
      'other'
    ],
    default: 'other'
  },
  
  // Trust level
  trustLevel: {
    type: String,
    enum: ['low', 'medium', 'high', 'verified'],
    default: 'medium'
  },
  
  // Educational content
  description: {
    type: String,
    trim: true
  },
  legitimacyIndicators: [{
    type: String,
    trim: true
  }],
  appropriateResponse: {
    type: String,
    trim: true
  },
  
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
  
  // Professional characteristics
  isProfessional: {
    type: Boolean,
    default: true
  },
  hasAutomatedElements: {
    type: Boolean,
    default: false
  },
  speakerGender: {
    type: String,
    enum: ['male', 'female', 'automated', 'unknown'],
    default: 'unknown'
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
nonPhishingVoiceSchema.index({ callType: 1 });
nonPhishingVoiceSchema.index({ trustLevel: 1 });
nonPhishingVoiceSchema.index({ isActive: 1 });
nonPhishingVoiceSchema.index({ timesUsed: 1 });
nonPhishingVoiceSchema.index({ createdAt: -1 });

// Virtual for audio data size in MB
nonPhishingVoiceSchema.virtual('fileSizeMB').get(function() {
  return (this.fileSize / (1024 * 1024)).toFixed(2);
});

// Virtual for base64 data size (approximately 4/3 of original)
nonPhishingVoiceSchema.virtual('base64SizeMB').get(function() {
  return (this.audioData.length / (1024 * 1024)).toFixed(2);
});

// Pre-save middleware to update timestamps
nonPhishingVoiceSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to increment usage
nonPhishingVoiceSchema.methods.incrementUsage = function() {
  this.timesUsed += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Instance method to update identification rate
nonPhishingVoiceSchema.methods.updateIdentificationRate = function(wasCorrect) {
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

// Static method to get random legitimate voice
nonPhishingVoiceSchema.statics.getRandomLegitimateVoice = function(callType = null) {
  const query = { isActive: true };
  if (callType) {
    query.callType = callType;
  }
  
  return this.aggregate([
    { $match: query },
    { $sample: { size: 1 } }
  ]).then(results => results[0]);
};

// Static method to get voices by trust level
nonPhishingVoiceSchema.statics.getVoicesByTrustLevel = function(trustLevel) {
  return this.find({ 
    isActive: true, 
    trustLevel: trustLevel 
  }).sort({ timesUsed: 1 }); // Prefer less used voices
};

// Static method to get professional vs automated voices
nonPhishingVoiceSchema.statics.getVoicesByType = function(isProfessional) {
  return this.find({ 
    isActive: true, 
    isProfessional: isProfessional 
  }).sort({ timesUsed: 1 });
};

export default mongoose.model('NonPhishingVoice', nonPhishingVoiceSchema);
