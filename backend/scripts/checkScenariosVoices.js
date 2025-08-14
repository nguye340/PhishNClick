import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function checkScenariosVoices() {
  console.log('🔍 Checking Voice Data in Scenarios Database...');
  
  try {
    // Connect to MongoDB Atlas - scenarios database
    let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ No MongoDB URI found in environment variables');
      return;
    }
    
    // Ensure we're connecting to scenarios database
    const scenariosUri = mongoUri.replace('/?', '/scenarios?');
    await mongoose.connect(scenariosUri);
    console.log('✅ Connected to scenarios database');
    
    const db = mongoose.connection.db;
    
    // Check collections
    const collections = await db.listCollections().toArray();
    console.log('\n📁 Available collections in scenarios database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Check phishing voices
    const phishingCount = await db.collection('phishingvoices').countDocuments();
    console.log(`\n🔴 Phishing voices: ${phishingCount}`);
    
    if (phishingCount > 0) {
      const phishingSample = await db.collection('phishingvoices').findOne({}, { 
        projection: { originalName: 1, fileSize: 1, uploadedAt: 1, audioBase64: 0 } 
      });
      console.log('   Sample:', phishingSample);
    }
    
    // Check non-phishing voices
    const nonPhishingCount = await db.collection('nonphishingvoices').countDocuments();
    console.log(`\n🟢 Non-phishing voices: ${nonPhishingCount}`);
    
    if (nonPhishingCount > 0) {
      const nonPhishingSample = await db.collection('nonphishingvoices').findOne({}, { 
        projection: { originalName: 1, fileSize: 1, uploadedAt: 1, audioBase64: 0 } 
      });
      console.log('   Sample:', nonPhishingSample);
    }
    
    const totalVoices = phishingCount + nonPhishingCount;
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 SCENARIOS DATABASE VOICE STATUS');
    console.log('='.repeat(50));
    console.log(`🔴 Phishing voices: ${phishingCount}`);
    console.log(`🟢 Non-phishing voices: ${nonPhishingCount}`);
    console.log(`📊 Total voices: ${totalVoices}`);
    
    if (totalVoices === 0) {
      console.log('\n⚠️  NO VOICE DATA FOUND in scenarios database');
      console.log('💡 Need to upload voice data to scenarios database');
    } else {
      console.log('\n🎉 Voice data IS AVAILABLE in scenarios database!');
      console.log('✅ Your application can now access the voice dataset');
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the check
checkScenariosVoices().catch(console.error);
