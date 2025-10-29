import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Try to fetch from backend API
    const backendUrl = process.env.FRONTEND_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || 'http://localhost:5000';
    
    try {
      // Randomly choose between phishing and non-phishing calls
      const isPhishing = Math.random() > 0.5;
      const endpoint = isPhishing ? 'phishing/random' : 'non-phishing/random';
      
      const response = await fetch(`${backendUrl}/api/voice-calls/${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        let backendResponse = await response.json();
        
        // Ensure consistent data structure
        if (backendResponse.data) {
          const voiceData = backendResponse.data;
          
          // Add isVishing field for quiz logic
          voiceData.isVishing = isPhishing;
          
          // Ensure audioBase64 is properly set from audioData if needed (backward compatibility)
          if (voiceData.audioData && !voiceData.audioBase64) {
            voiceData.audioBase64 = voiceData.audioData;
            delete voiceData.audioData; // Remove the old field to avoid confusion
          }
          
          // Add audioFile path if available
          if (voiceData.audioBase64) {
            // Create a data URL for audio playback
            voiceData.audioFile = `data:audio/mpeg;base64,${voiceData.audioBase64}`;
          }
          
          // Add transcript/content field for fallback
          if (!voiceData.transcript && !voiceData.content) {
            voiceData.transcript = isPhishing 
              ? 'This is a vishing call attempting to gather sensitive information through social engineering.'
              : 'This is a legitimate call from a trusted source.';
          }
        }
        
        return NextResponse.json(backendResponse);
      } else {
        throw new Error(`Backend API returned ${response.status}`);
      }
    } catch (backendError) {
      console.log('Backend not available, using fallback:', backendError.message);
      
      // Fallback: return mock data structure
      const isVishing = Math.random() > 0.5;
      const mockVoiceCall = {
        _id: 'mock_' + Date.now(),
        originalName: 'mock_voice_call.mp3',
        audioBase64: '', // Empty for mock
        isVishing: isVishing,
        isPhishing: isVishing, // Backward compatibility
        fileSize: 1024000,
        format: 'mp3',
        uploadedAt: new Date().toISOString(),
        transcript: isVishing 
          ? 'Hello, this is your bank security department. We noticed suspicious activity on your account. Please provide your account number and PIN to verify your identity immediately.'
          : 'Hello, this is a courtesy call from your bank to inform you about our new security features. No action is required on your part.',
        content: isVishing 
          ? 'Vishing attempt using urgency and authority to request sensitive information'
          : 'Legitimate informational call with no requests for sensitive data',
        caller: {
          name: isVishing ? 'Bank Security Department' : 'Customer Service',
          number: isVishing ? '+1-800-SCAM-NOW' : '+1-800-555-0199'
        }
      };

      return NextResponse.json({
        success: true,
        data: mockVoiceCall,
        mock: true,
        message: 'Using fallback mock data - backend not available'
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
