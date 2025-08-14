import express from 'express';
import multer from 'multer';
import path from 'path';
import VoiceCallController from '../controllers/voiceCallController.js';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/temp/'); // Temporary upload directory
  },
  filename: function (req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to accept only audio files
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/aac',
    'audio/ogg',
    'audio/flac'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only audio files are allowed.'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// ==================== UPLOAD ROUTES ====================

/**
 * @route POST /api/voice-calls/phishing/upload
 * @desc Upload a phishing voice call
 * @access Public (should be protected in production)
 */
router.post('/phishing/upload', upload.single('audioFile'), VoiceCallController.uploadPhishingVoice);

/**
 * @route POST /api/voice-calls/non-phishing/upload
 * @desc Upload a non-phishing voice call
 * @access Public (should be protected in production)
 */
router.post('/non-phishing/upload', upload.single('audioFile'), VoiceCallController.uploadNonPhishingVoice);

// ==================== RETRIEVAL ROUTES ====================

/**
 * @route GET /api/voice-calls/phishing
 * @desc Get all phishing voice calls with pagination and filtering
 * @access Public
 * @query page, limit, phishingType, threatLevel, isActive, sortBy, sortOrder
 */
router.get('/phishing', VoiceCallController.getPhishingVoices);

/**
 * @route GET /api/voice-calls/non-phishing
 * @desc Get all non-phishing voice calls with pagination and filtering
 * @access Public
 * @query page, limit, callType, trustLevel, isActive, isProfessional, sortBy, sortOrder
 */
router.get('/non-phishing', VoiceCallController.getNonPhishingVoices);

/**
 * @route GET /api/voice-calls/phishing/:id
 * @desc Get a specific phishing voice call by ID (including audio data)
 * @access Public
 */
router.get('/phishing/:id', VoiceCallController.getPhishingVoiceById);

/**
 * @route GET /api/voice-calls/non-phishing/:id
 * @desc Get a specific non-phishing voice call by ID (including audio data)
 * @access Public
 */
router.get('/non-phishing/:id', VoiceCallController.getNonPhishingVoiceById);

// ==================== RANDOM SELECTION ROUTES ====================

/**
 * @route GET /api/voice-calls/phishing/random
 * @desc Get a random phishing voice call for training
 * @access Public
 * @query phishingType, threatLevel
 */
router.get('/phishing/random', VoiceCallController.getRandomPhishingVoice);

/**
 * @route GET /api/voice-calls/non-phishing/random
 * @desc Get a random non-phishing voice call for training
 * @access Public
 * @query callType, trustLevel
 */
router.get('/non-phishing/random', VoiceCallController.getRandomNonPhishingVoice);

// ==================== AUDIO STREAMING ROUTES ====================

/**
 * @route GET /api/voice-calls/stream/:type/:id
 * @desc Stream audio data for playback
 * @access Public
 * @param type - 'phishing' or 'non-phishing'
 * @param id - Voice call ID
 */
router.get('/stream/:type/:id', VoiceCallController.streamAudio);

// ==================== STATISTICS ROUTES ====================

/**
 * @route GET /api/voice-calls/statistics
 * @desc Get voice call dataset statistics
 * @access Public
 */
router.get('/statistics', VoiceCallController.getStatistics);

// ==================== TRAINING EFFECTIVENESS ROUTES ====================

/**
 * @route PUT /api/voice-calls/:type/:id/effectiveness
 * @desc Update training effectiveness for a voice call
 * @access Public
 * @param type - 'phishing' or 'non-phishing'
 * @param id - Voice call ID
 * @body wasCorrect - Boolean indicating if user identified correctly
 */
router.put('/:type/:id/effectiveness', VoiceCallController.updateTrainingEffectiveness);

// ==================== BATCH OPERATIONS ROUTES ====================

/**
 * @route POST /api/voice-calls/batch/upload
 * @desc Batch upload voice calls from directory
 * @access Public (should be protected in production)
 */
router.post('/batch/upload', async (req, res) => {
  try {
    const { phishingDir, nonPhishingDir } = req.body;
    
    if (!phishingDir || !nonPhishingDir) {
      return res.status(400).json({
        success: false,
        message: 'Both phishingDir and nonPhishingDir are required'
      });
    }
    
    // This will be implemented in a separate batch upload controller
    res.json({
      success: false,
      message: 'Batch upload functionality will be implemented separately',
      note: 'Use the individual upload endpoints or the batch upload script'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Batch upload failed',
      error: error.message
    });
  }
});

// ==================== SEARCH ROUTES ====================

/**
 * @route GET /api/voice-calls/search
 * @desc Search voice calls by various criteria
 * @access Public
 * @query q, type, category, tags
 */
router.get('/search', async (req, res) => {
  try {
    const { q, type, category, tags } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query (q) is required'
      });
    }
    
    const searchRegex = new RegExp(q, 'i');
    const searchQuery = {
      $or: [
        { originalName: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ],
      isActive: true
    };
    
    let results = [];
    
    if (!type || type === 'phishing') {
      const PhishingVoice = require('../models/phishingVoice.model');
      const phishingResults = await PhishingVoice.find(searchQuery)
        .select('-audioData')
        .limit(20);
      results.push(...phishingResults.map(r => ({ ...r.toObject(), voiceType: 'phishing' })));
    }
    
    if (!type || type === 'non-phishing') {
      const NonPhishingVoice = require('../models/nonPhishingVoice.model');
      const nonPhishingResults = await NonPhishingVoice.find(searchQuery)
        .select('-audioData')
        .limit(20);
      results.push(...nonPhishingResults.map(r => ({ ...r.toObject(), voiceType: 'non-phishing' })));
    }
    
    res.json({
      success: true,
      data: results,
      total: results.length
    });
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message
    });
  }
});

// ==================== HEALTH CHECK ROUTE ====================

/**
 * @route GET /api/voice-calls/health
 * @desc Health check for voice call API
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Voice Call API is healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      upload: {
        phishing: 'POST /api/voice-calls/phishing/upload',
        nonPhishing: 'POST /api/voice-calls/non-phishing/upload'
      },
      retrieve: {
        phishing: 'GET /api/voice-calls/phishing',
        nonPhishing: 'GET /api/voice-calls/non-phishing',
        byId: 'GET /api/voice-calls/{type}/{id}'
      },
      random: {
        phishing: 'GET /api/voice-calls/phishing/random',
        nonPhishing: 'GET /api/voice-calls/non-phishing/random'
      },
      streaming: 'GET /api/voice-calls/stream/{type}/{id}',
      statistics: 'GET /api/voice-calls/statistics',
      search: 'GET /api/voice-calls/search'
    }
  });
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 50MB.'
      });
    }
  }
  
  if (error.message === 'Invalid file type. Only audio files are allowed.') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

// ==================== RANDOM VOICE CALL ENDPOINT ====================

// Get random voice call (phishing or non-phishing)
router.get('/random', async (req, res) => {
  try {
    console.log('Random voice call requested');
    
    // Randomly choose between phishing and non-phishing
    const usePhishing = Math.random() > 0.5;
    
    console.log(`Selected voice type: ${usePhishing ? 'PHISHING' : 'NON-PHISHING'}`);
    
    // Create a custom response interceptor to modify the response
    const originalJson = res.json;
    res.json = function(data) {
      // Add isPhishing flag and caller info to the response
      if (data && data.success && data.data) {
        // Ensure audioBase64 is set (use audioData as fallback)
        if (!data.data.audioBase64 && data.data.audioData) {
          console.log('🔧 Using audioData as fallback for audioBase64 in route');
          data.data.audioBase64 = data.data.audioData;
        }
        
        data.data.isPhishing = usePhishing;
        
        // Add caller information for display
        if (!data.data.caller) {
          data.data.caller = {
            name: usePhishing ? 'Suspicious Caller' : 'Legitimate Caller',
            number: usePhishing ? '+1-800-555-SCAM' : '+1-555-123-4567'
          };
        }
        
        console.log('Random voice call response:', {
          success: data.success,
          isPhishing: usePhishing,
          hasAudio: !!(data.data.audioBase64 || data.data.audioData),
          audioField: data.data.audioBase64 ? 'audioBase64' : 
                     data.data.audioData ? 'audioData' : 'none',
          audioLength: (data.data.audioBase64 || data.data.audioData || '').length,
          originalName: data.data.originalName
        });
      }
      
      // Call the original json method
      return originalJson.call(this, data);
    };
    
    // Call the appropriate controller method
    if (usePhishing) {
      await VoiceCallController.getRandomPhishingVoice(req, res);
    } else {
      await VoiceCallController.getRandomNonPhishingVoice(req, res);
    }
    
  } catch (error) {
    console.error('Error getting random voice call:', error);
    
    // Only send error response if no response has been sent yet
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: 'Failed to get random voice call',
        message: error.message
      });
    }
  }
});

export default router;
