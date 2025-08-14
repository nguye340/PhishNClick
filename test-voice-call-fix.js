// Test script to verify voice call API fix
const axios = require('axios');

async function testVoiceCallAPI() {
  try {
    console.log('Testing voice call API fix...');
    
    // Test the frontend API route
    console.log('\nTesting frontend API route...');
    const frontendResponse = await axios.get('http://localhost:3001/api/voice/random');
    
    console.log('Frontend API Response Status:', frontendResponse.status);
    console.log('Has data:', !!frontendResponse.data.data);
    
    const voiceData = frontendResponse.data.data || {};
    console.log('Voice data keys:', Object.keys(voiceData));
    console.log('Has audioBase64:', 'audioBase64' in voiceData);
    console.log('Has audioData:', 'audioData' in voiceData);
    console.log('audioBase64 length:', voiceData.audioBase64?.length || 0);
    
    if (voiceData.audioBase64 && voiceData.audioBase64.length > 0) {
      console.log('✅ Success: audioBase64 is present and has data');
    } else {
      console.warn('⚠️ Warning: audioBase64 is missing or empty');
    }
    
    if ('audioData' in voiceData) {
      console.warn('⚠️ Warning: audioData field still exists in response');
    } else {
      console.log('✅ Success: audioData field has been removed');
    }
    
  } catch (error) {
    console.error('Error testing voice call API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
  }
}

testVoiceCallAPI();
