// Voice Call Manager for Phish404 Game
// Handles dynamic voice call audio from database

class VoiceCallManager {
  constructor() {
    this.phoneCallCount = 0;
    this.currentVoiceCall = null;
    this.currentAudio = null;
    this.isFirstCall = true;
  }

  // Convert base64 to blob URL for audio playback
  base64ToAudioUrl(base64String, mimeType = 'audio/mpeg') {
    try {
      const byteCharacters = atob(base64String);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      
      // Add cache busting to ensure unique URL each time
      const url = URL.createObjectURL(blob);
      
      // Store the URL so we can revoke it later
      if (!this.audioUrls) this.audioUrls = [];
      this.audioUrls.push(url);
      
      // Clean up old URLs to prevent memory leaks
      while (this.audioUrls.length > 10) {
        const oldUrl = this.audioUrls.shift();
        URL.revokeObjectURL(oldUrl);
      }
      
      return url;
    } catch (error) {
      console.error('Error converting base64 to audio URL:', error);
      return null;
    }
  }

  // Fetch random voice call from API
  async fetchRandomVoiceCall() {
    try {
      console.log('🔍 Fetching voice call from API...');
      const response = await fetch('http://localhost:5000/api/voice-calls/random');
      console.log('📡 API Response status:', response.status);
      
      const result = await response.json();
      console.log('📦 API Result:', {
        success: result.success,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : [],
        // Check both data.audioBase64 and data.audioData for backward compatibility
        hasAudioBase64: !!(result.data && (result.data.audioBase64 || result.data.audioData)),
        audioBase64Length: result.data ? 
          (result.data.audioBase64 || result.data.audioData || '').length : 0
      });
      
      // Use audioData if audioBase64 is not available (backward compatibility)
      if (result.data && !result.data.audioBase64 && result.data.audioData) {
        console.log('🔧 Using audioData as fallback for audioBase64');
        result.data.audioBase64 = result.data.audioData;
      }
      
      if (result.success) {
        return result.data;
      } else {
        console.error('❌ API returned error:', result.error);
        throw new Error(result.error || 'Failed to fetch voice call');
      }
    } catch (error) {
      console.error('💥 Error fetching voice call:', error);
      return null;
    }
  }

  // Get the appropriate voice call for current game state
  async getVoiceCall() {
    this.phoneCallCount++;
    console.log(`🎯 Getting voice call #${this.phoneCallCount}`);
    
    // First call always uses the static vishing.mp3 file
    if (this.isFirstCall) {
      console.log('📞 First call - using static vishing.mp3');
      this.isFirstCall = false;
      return {
        audioUrl: '/games/phish404/audio/vishing.mp3',
        isPhishing: true, // vishing.mp3 is phishing (easy)
        isStatic: true,
        caller: {
          name: 'Bank Security',
          number: '+1-800-555-0199'
        }
      };
    }
    
    console.log('🎲 Subsequent call - fetching from database...');
    // Subsequent calls use database audio
    const voiceCallData = await this.fetchRandomVoiceCall();
    
    if (!voiceCallData) {
      // Fallback to static audio if API fails
      console.log('❌ API failed, using fallback static audio');
      return {
        audioUrl: '/games/phish404/audio/vishing.mp3',
        isPhishing: true,
        isStatic: true,
        caller: {
          name: 'Unknown Caller',
          number: '+1-555-000-0000'
        }
      };
    }
    
    // Handle mock data (when backend is not available)
    if (voiceCallData.mock || !voiceCallData.audioBase64) {
      console.log('⚠️ Using mock/fallback data - no audioBase64 found');
      console.log('📊 Voice call data:', {
        mock: voiceCallData.mock,
        hasAudioBase64: !!voiceCallData.audioBase64,
        keys: Object.keys(voiceCallData)
      });
      return {
        audioUrl: '/games/phish404/audio/vishing.mp3',
        isPhishing: voiceCallData.isPhishing,
        isStatic: true,
        caller: voiceCallData.caller || {
          name: 'Unknown Caller',
          number: '+1-555-000-0000'
        }
      };
    }
    
    // Convert base64 audio to playable URL
    const audioUrl = this.base64ToAudioUrl(voiceCallData.audioBase64);
    
    // Debug: Log voice call details to identify repetition
    console.log('🎵 Voice call details:', {
      filename: voiceCallData.filename || 'unknown',
      originalName: voiceCallData.originalName || 'unknown',
      description: voiceCallData.description || 'no description',
      isPhishing: voiceCallData.isPhishing,
      caller: voiceCallData.caller,
      audioBase64Length: voiceCallData.audioBase64 ? voiceCallData.audioBase64.length : 0,
      audioUrlGenerated: !!audioUrl
    });
    
    if (!audioUrl) {
      // Fallback if conversion fails
      console.log('❌ Audio URL conversion failed, using fallback');
      return {
        audioUrl: '/games/phish404/audio/vishing.mp3',
        isPhishing: true,
        isStatic: true,
        caller: {
          name: 'Unknown Caller',
          number: '+1-555-000-0000'
        }
      };
    }
    
    this.currentVoiceCall = voiceCallData;
    
    return {
      audioUrl: audioUrl,
      isPhishing: voiceCallData.isPhishing,
      isStatic: false,
      caller: voiceCallData.caller || {
        name: voiceCallData.isPhishing ? 'Suspicious Caller' : 'Legitimate Caller',
        number: voiceCallData.isPhishing ? '+1-800-555-SCAM' : '+1-555-123-4567'
      },
      originalName: voiceCallData.originalName
    };
  }

  // Get the correct choice for current voice call
  getCorrectChoice(isPhishing) {
    // If phishing: "Skip" is correct
    // If non-phishing: "Safe to Accept" is correct
    return isPhishing ? 'skip' : 'doIt';
  }

  // Update phone popup with generic greeting text
  updatePhonePopupDisplay(caller) {
    const phonePopup = document.getElementById('phonePopup');
    if (phonePopup) {
      // Update the popup text with the generic greeting
      const callerInfo = phonePopup.querySelector('p:nth-of-type(2)');
      if (callerInfo) {
        callerInfo.textContent = 'Hello from the other side... Who could it be?';
      }
    }
  }

  // Clean up audio resources
  cleanup() {
    if (this.currentAudio) {
      this.currentAudio.pause();
      
      // Disconnect and clean up audio context if it exists
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
      
      this.currentAudio = null;
    }
    
    // Clean up any blob URLs
    if (this.audioUrls && this.audioUrls.length > 0) {
      this.audioUrls.forEach(url => URL.revokeObjectURL(url));
      this.audioUrls = [];
    }
  }

  // Reset for new game
  reset() {
    this.phoneCallCount = 0;
    this.isFirstCall = true;
    this.audioUrls = []; // Reset URL cache
    this.cleanup();
  }
}

// Create global instance for the game to use
window.voiceCallManager = new VoiceCallManager();
