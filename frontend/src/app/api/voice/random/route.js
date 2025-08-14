import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch from backend API
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    
    try {
      const response = await fetch(`${backendUrl}/api/voice-calls/random`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        let backendResponse = await response.json();
        
        // Ensure audioBase64 is properly set from audioData if needed (backward compatibility)
        if (backendResponse.data) {
          const voiceData = backendResponse.data;
          if (voiceData.audioData && !voiceData.audioBase64) {
            voiceData.audioBase64 = voiceData.audioData;
            delete voiceData.audioData; // Remove the old field to avoid confusion
          }
        }
        
        return NextResponse.json(backendResponse);
      } else {
        throw new Error(`Backend API returned ${response.status}`);
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback:', backendError.message);
      
      // Fallback: return mock data structure
      const mockVoiceCall = {
        _id: 'mock_' + Date.now(),
        originalName: 'mock_voice_call.mp3',
        audioBase64: '', // Empty for mock
        isPhishing: Math.random() > 0.5, // Random for testing
        fileSize: 1024000,
        format: 'mp3',
        uploadedAt: new Date().toISOString(),
        caller: {
          name: Math.random() > 0.5 ? 'Bank Security' : 'Your Nephew',
          number: Math.random() > 0.5 ? '+1-800-555-0199' : '+1-555-123-4567'
        }
      };

      return NextResponse.json({
        success: true,
        data: mockVoiceCall,
        mock: true
      });
    }
  } catch (error) {
    console.error('Voice call API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch voice call',
        message: error.message 
      },
      { status: 500 }
    );
  }
}
