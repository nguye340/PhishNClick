import fs from 'fs';
import path from 'path';
const { promises: fsPromises } = fs;

/**
 * Audio Utility Functions for Voice Call Dataset
 * Handles conversion between audio files and base64 encoding for MongoDB storage
 */

class AudioUtils {
  /**
   * Convert audio file to base64 string
   * @param {string} filePath - Path to the audio file
   * @returns {Promise<Object>} Object containing base64 data and metadata
   */
  static async fileToBase64(filePath) {
    try {
      // Read the file
      const fileBuffer = await fsPromises.readFile(filePath);
      
      // Get file stats
      const stats = await fsPromises.stat(filePath);
      const fileSize = stats.size;
      
      // Convert to base64
      const base64Data = fileBuffer.toString('base64');
      
      // Get file extension and determine MIME type
      const fileExtension = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(fileExtension);
      
      // Get original filename
      const originalName = path.basename(filePath);
      const filename = this.generateUniqueFilename(originalName);
      
      return {
        audioData: base64Data,
        mimeType,
        fileSize,
        originalName,
        filename,
        extension: fileExtension
      };
    } catch (error) {
      throw new Error(`Failed to convert file to base64: ${error.message}`);
    }
  }
  
  /**
   * Convert base64 string back to audio file
   * @param {string} base64Data - Base64 encoded audio data
   * @param {string} outputPath - Path where to save the audio file
   * @param {string} mimeType - MIME type of the audio
   * @returns {Promise<string>} Path to the created file
   */
  static async base64ToFile(base64Data, outputPath, mimeType) {
    try {
      // Convert base64 to buffer
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      // Ensure output directory exists
      const outputDir = path.dirname(outputPath);
      await fsPromises.mkdir(outputDir, { recursive: true });
      
      // Write file
      await fsPromises.writeFile(outputPath, audioBuffer);
      
      return outputPath;
    } catch (error) {
      throw new Error(`Failed to convert base64 to file: ${error.message}`);
    }
  }
  
  /**
   * Get MIME type based on file extension
   * @param {string} extension - File extension (with or without dot)
   * @returns {string} MIME type
   */
  static getMimeType(extension) {
    const ext = extension.toLowerCase().replace('.', '');
    const mimeTypes = {
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'wave': 'audio/wav',
      'mpeg': 'audio/mpeg',
      'm4a': 'audio/mp4',
      'aac': 'audio/aac',
      'ogg': 'audio/ogg',
      'flac': 'audio/flac'
    };
    
    return mimeTypes[ext] || 'audio/mpeg'; // Default to MP3
  }
  
  /**
   * Generate unique filename to avoid collisions
   * @param {string} originalName - Original filename
   * @returns {string} Unique filename
   */
  static generateUniqueFilename(originalName) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const baseName = path.basename(originalName, extension);
    
    return `${baseName}_${timestamp}_${random}${extension}`;
  }
  
  /**
   * Validate audio file format
   * @param {string} filePath - Path to the audio file
   * @returns {boolean} True if valid audio format
   */
  static isValidAudioFile(filePath) {
    const validExtensions = ['.mp3', '.wav', '.wave', '.m4a', '.aac', '.ogg', '.flac'];
    const extension = path.extname(filePath).toLowerCase();
    return validExtensions.includes(extension);
  }
  
  /**
   * Get audio file info without reading the entire file
   * @param {string} filePath - Path to the audio file
   * @returns {Promise<Object>} File information
   */
  static async getAudioFileInfo(filePath) {
    try {
      const stats = await fsPromises.stat(filePath);
      const extension = path.extname(filePath).toLowerCase();
      const mimeType = this.getMimeType(extension);
      const originalName = path.basename(filePath);
      
      return {
        originalName,
        fileSize: stats.size,
        mimeType,
        extension,
        isValid: this.isValidAudioFile(filePath),
        fileSizeMB: (stats.size / (1024 * 1024)).toFixed(2)
      };
    } catch (error) {
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
  
  /**
   * Batch convert multiple audio files to base64
   * @param {string[]} filePaths - Array of file paths
   * @param {Function} progressCallback - Optional progress callback
   * @returns {Promise<Object[]>} Array of conversion results
   */
  static async batchFileToBase64(filePaths, progressCallback = null) {
    const results = [];
    const total = filePaths.length;
    
    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      
      try {
        // Check if file is valid audio
        if (!this.isValidAudioFile(filePath)) {
          console.warn(`Skipping invalid audio file: ${filePath}`);
          continue;
        }
        
        const result = await this.fileToBase64(filePath);
        result.success = true;
        result.originalPath = filePath;
        results.push(result);
        
        // Call progress callback if provided
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total,
            filename: path.basename(filePath),
            success: true
          });
        }
        
      } catch (error) {
        console.error(`Failed to convert ${filePath}:`, error.message);
        results.push({
          success: false,
          originalPath: filePath,
          error: error.message,
          filename: path.basename(filePath)
        });
        
        if (progressCallback) {
          progressCallback({
            current: i + 1,
            total,
            filename: path.basename(filePath),
            success: false,
            error: error.message
          });
        }
      }
    }
    
    return results;
  }
  
  /**
   * Calculate estimated base64 size from file size
   * @param {number} fileSizeBytes - Original file size in bytes
   * @returns {number} Estimated base64 size in bytes
   */
  static estimateBase64Size(fileSizeBytes) {
    // Base64 encoding increases size by approximately 4/3
    return Math.ceil(fileSizeBytes * 4 / 3);
  }
  
  /**
   * Validate base64 audio data
   * @param {string} base64Data - Base64 encoded data
   * @returns {boolean} True if valid base64
   */
  static isValidBase64(base64Data) {
    try {
      // Check if it's valid base64
      const buffer = Buffer.from(base64Data, 'base64');
      return buffer.toString('base64') === base64Data;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Create temporary audio file from base64 for playback
   * @param {string} base64Data - Base64 encoded audio
   * @param {string} mimeType - MIME type
   * @param {string} tempDir - Temporary directory path
   * @returns {Promise<string>} Path to temporary file
   */
  static async createTempAudioFile(base64Data, mimeType, tempDir = './temp') {
    const extension = this.getExtensionFromMimeType(mimeType);
    const tempFilename = `temp_audio_${Date.now()}_${Math.random().toString(36).substring(2)}${extension}`;
    const tempPath = path.join(tempDir, tempFilename);
    
    await this.base64ToFile(base64Data, tempPath, mimeType);
    return tempPath;
  }
  
  /**
   * Get file extension from MIME type
   * @param {string} mimeType - MIME type
   * @returns {string} File extension with dot
   */
  static getExtensionFromMimeType(mimeType) {
    const extensions = {
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'audio/mp4': '.m4a',
      'audio/aac': '.aac',
      'audio/ogg': '.ogg',
      'audio/flac': '.flac'
    };
    
    return extensions[mimeType] || '.mp3';
  }
  
  /**
   * Clean up temporary files
   * @param {string} filePath - Path to temporary file
   * @returns {Promise<boolean>} True if successfully deleted
   */
  static async cleanupTempFile(filePath) {
    try {
      await fsPromises.unlink(filePath);
      return true;
    } catch (error) {
      console.warn(`Failed to cleanup temp file ${filePath}:`, error.message);
      return false;
    }
  }
}

export default AudioUtils;
