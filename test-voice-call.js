const axios = require('axios');

async function testVoiceCallAPI() {
  try {
    console.log('Testing voice call API...');
    
    // Test phishing voice call
    console.log('\nTesting phishing voice call...');
    const phishingResponse = await axios.get('http://localhost:3000/api/voice-calls/phishing/random');
    console.log('Phishing Response Status:', phishingResponse.status);
    console.log('Response Keys:', Object.keys(phishingResponse.data));
    console.log('Data Keys:', Object.keys(phishingResponse.data.data));
    console.log('Has audioBase64:', 'audioBase64' in phishingResponse.data.data);
    console.log('Has audioData:', 'audioData' in phishingResponse.data.data);
    console.log('audioBase64 length:', phishingResponse.data.data.audioBase64?.length || 0);
    
    // Test non-phishing voice call
    console.log('\nTesting non-phishing voice call...');
    const nonPhishingResponse = await axios.get('http://localhost:3000/api/voice-calls/non-phishing/random');
    console.log('Non-Phishing Response Status:', nonPhishingResponse.status);
    console.log('Response Keys:', Object.keys(nonPhishingResponse.data));
    console.log('Data Keys:', Object.keys(nonPhishingResponse.data.data));
    console.log('Has audioBase64:', 'audioBase64' in nonPhishingResponse.data.data);
    console.log('Has audioData:', 'audioData' in nonPhishingResponse.data.data);
    console.log('audioBase64 length:', nonPhishingResponse.data.data.audioBase64?.length || 0);
    
  } catch (error) {
    console.error('Error testing voice call API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    }
  }
}

testVoiceCallAPI();
