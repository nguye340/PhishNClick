import PhishingVoice from '../models/phishingVoice.model.js';
import NonPhishingVoice from '../models/nonPhishingVoice.model.js';
import AudioUtils from '../utils/audioUtils.js';
import fs from 'fs/promises';
import path from 'path';

/**
 * Voice Call Controller
 * Handles CRUD operations for phishing and non-phishing voice call audio data
 */

class VoiceCallController {
  
  // ==================== UPLOAD OPERATIONS ====================
  
  /**
   * Upload and store a phishing voice call
   */
  static async uploadPhishingVoice(req, res) {
    try {
      const { 
        phishingType, 
        threatLevel, 
        description, 
        tactics, 
        redFlags, 
        quality,
        hasBackgroundNoise,
        clarity,
        tags 
      } = req.body;
      
      // Handle file upload (assuming multer or similar middleware)
      if (!req.file && !req.body.filePath) {
        return res.status(400).json({
          success: false,
          message: 'No audio file provided'
        });
      }
      
      const filePath = req.file ? req.file.path : req.body.filePath;
      
      // Convert file to base64
      const audioData = await AudioUtils.fileToBase64(filePath);
      
      // Create new phishing voice record
      const phishingVoice = new PhishingVoice({
        filename: audioData.filename,
        originalName: audioData.originalName,
        audioData: audioData.audioData,
        mimeType: audioData.mimeType,
        fileSize: audioData.fileSize,
        phishingType: phishingType || 'other',
        threatLevel: threatLevel || 'medium',
        description,
        tactics: Array.isArray(tactics) ? tactics : (tactics ? [tactics] : []),
        redFlags: Array.isArray(redFlags) ? redFlags : (redFlags ? [redFlags] : []),
        quality: quality || 'good',
        hasBackgroundNoise: hasBackgroundNoise === 'true' || hasBackgroundNoise === true,
        clarity: clarity || 'clear',
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
        uploadedBy: req.user?.id || 'system'
      });
      
      await phishingVoice.save();
      
      // Clean up temporary file if it was uploaded
      if (req.file) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn('Failed to cleanup uploaded file:', error.message);
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Phishing voice uploaded successfully',
        data: {
          id: phishingVoice._id,
          filename: phishingVoice.filename,
          originalName: phishingVoice.originalName,
          phishingType: phishingVoice.phishingType,
          threatLevel: phishingVoice.threatLevel,
          fileSize: phishingVoice.fileSize,
          fileSizeMB: phishingVoice.fileSizeMB
        }
      });
      
    } catch (error) {
      console.error('Upload phishing voice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload phishing voice',
        error: error.message
      });
    }
  }
  
  /**
   * Upload and store a non-phishing voice call
   */
  static async uploadNonPhishingVoice(req, res) {
    try {
      const { 
        callType, 
        trustLevel, 
        description, 
        legitimacyIndicators, 
        appropriateResponse,
        quality,
        hasBackgroundNoise,
        clarity,
        isProfessional,
        hasAutomatedElements,
        speakerGender,
        tags 
      } = req.body;
      
      // Handle file upload
      if (!req.file && !req.body.filePath) {
        return res.status(400).json({
          success: false,
          message: 'No audio file provided'
        });
      }
      
      const filePath = req.file ? req.file.path : req.body.filePath;
      
      // Convert file to base64
      const audioData = await AudioUtils.fileToBase64(filePath);
      
      // Create new non-phishing voice record
      const nonPhishingVoice = new NonPhishingVoice({
        filename: audioData.filename,
        originalName: audioData.originalName,
        audioData: audioData.audioData,
        mimeType: audioData.mimeType,
        fileSize: audioData.fileSize,
        callType: callType || 'other',
        trustLevel: trustLevel || 'medium',
        description,
        legitimacyIndicators: Array.isArray(legitimacyIndicators) ? legitimacyIndicators : (legitimacyIndicators ? [legitimacyIndicators] : []),
        appropriateResponse,
        quality: quality || 'good',
        hasBackgroundNoise: hasBackgroundNoise === 'true' || hasBackgroundNoise === true,
        clarity: clarity || 'clear',
        isProfessional: isProfessional === 'true' || isProfessional === true,
        hasAutomatedElements: hasAutomatedElements === 'true' || hasAutomatedElements === true,
        speakerGender: speakerGender || 'unknown',
        tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map(t => t.trim()) : []),
        uploadedBy: req.user?.id || 'system'
      });
      
      await nonPhishingVoice.save();
      
      // Clean up temporary file if it was uploaded
      if (req.file) {
        try {
          await fs.unlink(filePath);
        } catch (error) {
          console.warn('Failed to cleanup uploaded file:', error.message);
        }
      }
      
      res.status(201).json({
        success: true,
        message: 'Non-phishing voice uploaded successfully',
        data: {
          id: nonPhishingVoice._id,
          filename: nonPhishingVoice.filename,
          originalName: nonPhishingVoice.originalName,
          callType: nonPhishingVoice.callType,
          trustLevel: nonPhishingVoice.trustLevel,
          fileSize: nonPhishingVoice.fileSize,
          fileSizeMB: nonPhishingVoice.fileSizeMB
        }
      });
      
    } catch (error) {
      console.error('Upload non-phishing voice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to upload non-phishing voice',
        error: error.message
      });
    }
  }
  
  // ==================== RETRIEVAL OPERATIONS ====================
  
  /**
   * Get all phishing voices with pagination and filtering
   */
  static async getPhishingVoices(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        phishingType, 
        threatLevel, 
        isActive = true,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build query
      const query = { isActive: isActive === 'true' };
      if (phishingType) query.phishingType = phishingType;
      if (threatLevel) query.threatLevel = threatLevel;
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // Execute query with pagination
      const voices = await PhishingVoice.find(query)
        .select('-audioData') // Exclude large base64 data from list view
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      
      const total = await PhishingVoice.countDocuments(query);
      
      res.json({
        success: true,
        data: voices,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      });
      
    } catch (error) {
      console.error('Get phishing voices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve phishing voices',
        error: error.message
      });
    }
  }
  
  /**
   * Get all non-phishing voices with pagination and filtering
   */
  static async getNonPhishingVoices(req, res) {
    try {
      const { 
        page = 1, 
        limit = 10, 
        callType, 
        trustLevel, 
        isActive = true,
        isProfessional,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;
      
      // Build query
      const query = { isActive: isActive === 'true' };
      if (callType) query.callType = callType;
      if (trustLevel) query.trustLevel = trustLevel;
      if (isProfessional !== undefined) query.isProfessional = isProfessional === 'true';
      
      // Build sort object
      const sort = {};
      sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
      
      // Execute query with pagination
      const voices = await NonPhishingVoice.find(query)
        .select('-audioData') // Exclude large base64 data from list view
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();
      
      const total = await NonPhishingVoice.countDocuments(query);
      
      res.json({
        success: true,
        data: voices,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total,
          limit
        }
      });
      
    } catch (error) {
      console.error('Get non-phishing voices error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve non-phishing voices',
        error: error.message
      });
    }
  }
  
  /**
   * Get a specific phishing voice by ID (including audio data)
   */
  static async getPhishingVoiceById(req, res) {
    try {
      const { id } = req.params;
      
      const voice = await PhishingVoice.findById(id);
      if (!voice) {
        return res.status(404).json({
          success: false,
          message: 'Phishing voice not found'
        });
      }
      
      res.json({
        success: true,
        data: voice
      });
      
    } catch (error) {
      console.error('Get phishing voice by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve phishing voice',
        error: error.message
      });
    }
  }
  
  /**
   * Get a specific non-phishing voice by ID (including audio data)
   */
  static async getNonPhishingVoiceById(req, res) {
    try {
      const { id } = req.params;
      
      const voice = await NonPhishingVoice.findById(id);
      if (!voice) {
        return res.status(404).json({
          success: false,
          message: 'Non-phishing voice not found'
        });
      }
      
      res.json({
        success: true,
        data: voice
      });
      
    } catch (error) {
      console.error('Get non-phishing voice by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve non-phishing voice',
        error: error.message
      });
    }
  }
  
  // ==================== RANDOM SELECTION ====================
  
  /**
   * Get a random phishing voice for training
   */
  static async getRandomPhishingVoice(req, res) {
    try {
      console.log('Getting random phishing voice...');
      
      // First get the total count of phishing voices
      const totalCount = await PhishingVoice.countDocuments({ isActive: { $ne: false } });
      
      if (totalCount === 0) {
        console.log('No phishing voices found in database');
        return res.status(404).json({
          success: false,
          message: 'No phishing voices found matching criteria'
        });
      }
      
      // Generate a truly random index
      const randomIndex = Math.floor(Math.random() * totalCount);
      console.log(`🎲 RANDOMIZATION DEBUG: Selecting phishing voice ${randomIndex + 1} of ${totalCount} total voices`);
      console.log(`🎲 Random calculation: Math.random()=${Math.random().toFixed(4)}, totalCount=${totalCount}, randomIndex=${randomIndex}`);
      
      // Use skip() with the random index to get a truly random document
      const voice = await PhishingVoice.findOne({ isActive: { $ne: false } })
        .skip(randomIndex)
        .lean(); // Use lean() for better performance
      
      if (!voice) {
        console.log('No phishing voice found at random index');
        return res.status(404).json({
          success: false,
          message: 'No phishing voice found'
        });
      }
      
      console.log('Found random phishing voice:', voice.originalName, `(index ${randomIndex})`);
      
      // Increment usage counter
      await PhishingVoice.findByIdAndUpdate(voice._id, {
        $inc: { timesUsed: 1 },
        lastUsed: new Date()
      });
      
      // Map audioData to audioBase64 for frontend compatibility
      const responseData = {
        ...voice,
        audioBase64: voice.audioData // Map audioData to audioBase64
      };
      
      res.json({
        success: true,
        data: responseData
      });
      
    } catch (error) {
      console.error('Get random phishing voice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get random phishing voice',
        error: error.message
      });
    }
  }
  
  /**
   * Get a random non-phishing voice for training
   */
  static async getRandomNonPhishingVoice(req, res) {
    try {
      console.log('Getting random non-phishing voice...');
      
      // First get the total count of non-phishing voices
      const totalCount = await NonPhishingVoice.countDocuments({ isActive: { $ne: false } });
      
      if (totalCount === 0) {
        console.log('No non-phishing voices found in database');
        return res.status(404).json({
          success: false,
          message: 'No non-phishing voices found matching criteria'
        });
      }
      
      // Generate a truly random index
      const randomIndex = Math.floor(Math.random() * totalCount);
      console.log(`🎲 RANDOMIZATION DEBUG: Selecting non-phishing voice ${randomIndex + 1} of ${totalCount} total voices`);
      console.log(`🎲 Random calculation: Math.random()=${Math.random().toFixed(4)}, totalCount=${totalCount}, randomIndex=${randomIndex}`);
      
      // Use skip() with the random index to get a truly random document
      const voice = await NonPhishingVoice.findOne({ isActive: { $ne: false } })
        .skip(randomIndex)
        .lean(); // Use lean() for better performance
      
      if (!voice) {
        console.log('No non-phishing voice found at random index');
        return res.status(404).json({
          success: false,
          message: 'No non-phishing voice found'
        });
      }
      
      console.log('Found random non-phishing voice:', voice.originalName, `(index ${randomIndex})`);
      
      // Increment usage counter
      await NonPhishingVoice.findByIdAndUpdate(voice._id, {
        $inc: { timesUsed: 1 },
        lastUsed: new Date()
      });
      
      // Map audioData to audioBase64 for frontend compatibility
      const responseData = {
        ...voice,
        audioBase64: voice.audioData // Map audioData to audioBase64
      };
      
      res.json({
        success: true,
        data: responseData
      });
      
    } catch (error) {
      console.error('Get random non-phishing voice error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get random non-phishing voice',
        error: error.message
      });
    }
  }
  
  // ==================== AUDIO PLAYBACK ====================
  
  /**
   * Stream audio data for playback
   */
  static async streamAudio(req, res) {
    try {
      const { type, id } = req.params; // type: 'phishing' or 'non-phishing'
      
      let voice;
      if (type === 'phishing') {
        voice = await PhishingVoice.findById(id).select('audioData mimeType filename');
      } else if (type === 'non-phishing') {
        voice = await NonPhishingVoice.findById(id).select('audioData mimeType filename');
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid voice type. Must be "phishing" or "non-phishing"'
        });
      }
      
      if (!voice) {
        return res.status(404).json({
          success: false,
          message: 'Voice not found'
        });
      }
      
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(voice.audioData, 'base64');
      
      // Set appropriate headers
      res.set({
        'Content-Type': voice.mimeType,
        'Content-Length': audioBuffer.length,
        'Content-Disposition': `inline; filename="${voice.filename}"`
      });
      
      res.send(audioBuffer);
      
    } catch (error) {
      console.error('Stream audio error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to stream audio',
        error: error.message
      });
    }
  }
  
  // ==================== STATISTICS ====================
  
  /**
   * Get voice call statistics
   */
  static async getStatistics(req, res) {
    try {
      const [phishingStats, nonPhishingStats] = await Promise.all([
        PhishingVoice.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: ['$isActive', 1, 0] } },
              totalUsage: { $sum: '$timesUsed' },
              avgCorrectRate: { $avg: '$correctIdentificationRate' },
              totalFileSize: { $sum: '$fileSize' }
            }
          }
        ]),
        NonPhishingVoice.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              active: { $sum: { $cond: ['$isActive', 1, 0] } },
              totalUsage: { $sum: '$timesUsed' },
              avgCorrectRate: { $avg: '$correctIdentificationRate' },
              totalFileSize: { $sum: '$fileSize' }
            }
          }
        ])
      ]);
      
      const phishing = phishingStats[0] || { total: 0, active: 0, totalUsage: 0, avgCorrectRate: 0, totalFileSize: 0 };
      const nonPhishing = nonPhishingStats[0] || { total: 0, active: 0, totalUsage: 0, avgCorrectRate: 0, totalFileSize: 0 };
      
      res.json({
        success: true,
        data: {
          phishing: {
            ...phishing,
            totalFileSizeMB: (phishing.totalFileSize / (1024 * 1024)).toFixed(2)
          },
          nonPhishing: {
            ...nonPhishing,
            totalFileSizeMB: (nonPhishing.totalFileSize / (1024 * 1024)).toFixed(2)
          },
          combined: {
            total: phishing.total + nonPhishing.total,
            active: phishing.active + nonPhishing.active,
            totalUsage: phishing.totalUsage + nonPhishing.totalUsage,
            totalFileSizeMB: ((phishing.totalFileSize + nonPhishing.totalFileSize) / (1024 * 1024)).toFixed(2)
          }
        }
      });
      
    } catch (error) {
      console.error('Get statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get statistics',
        error: error.message
      });
    }
  }
  
  // ==================== UPDATE OPERATIONS ====================
  
  /**
   * Update training effectiveness for a voice
   */
  static async updateTrainingEffectiveness(req, res) {
    try {
      const { type, id } = req.params;
      const { wasCorrect } = req.body;
      
      let voice;
      if (type === 'phishing') {
        voice = await PhishingVoice.findById(id);
      } else if (type === 'non-phishing') {
        voice = await NonPhishingVoice.findById(id);
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid voice type'
        });
      }
      
      if (!voice) {
        return res.status(404).json({
          success: false,
          message: 'Voice not found'
        });
      }
      
      await voice.updateIdentificationRate(wasCorrect);
      
      res.json({
        success: true,
        message: 'Training effectiveness updated',
        data: {
          correctIdentificationRate: voice.correctIdentificationRate,
          totalExposures: voice.totalExposures
        }
      });
      
    } catch (error) {
      console.error('Update training effectiveness error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update training effectiveness',
        error: error.message
      });
    }
  }
}

export default VoiceCallController;
