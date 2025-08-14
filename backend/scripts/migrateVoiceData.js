import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function migrateVoiceData() {
  console.log('🚀 Starting Voice Data Migration...');
  
  try {
    // Connect to MongoDB Atlas
    let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('❌ No MongoDB URI found in environment variables');
      return;
    }
    
    console.log('📊 Step 1: Connecting to test database to read voice data...');
    
    // First, connect to test database to read existing data
    const testUri = mongoUri.replace('/?', '/test?');
    await mongoose.connect(testUri);
    console.log('✅ Connected to test database');
    
    // Get collections from test database
    const testDb = mongoose.connection.db;
    const phishingVoices = await testDb.collection('phishingvoices').find({}).toArray();
    const nonPhishingVoices = await testDb.collection('nonphishingvoices').find({}).toArray();
    
    console.log(`📁 Found ${phishingVoices.length} phishing voices in test database`);
    console.log(`📁 Found ${nonPhishingVoices.length} non-phishing voices in test database`);
    
    if (phishingVoices.length === 0 && nonPhishingVoices.length === 0) {
      console.log('⚠️  No voice data found in test database to migrate');
      await mongoose.connection.close();
      return;
    }
    
    // Close test connection
    await mongoose.connection.close();
    
    console.log('📊 Step 2: Connecting to scenarios database to write voice data...');
    
    // Connect to scenarios database
    const scenariosUri = mongoUri.replace('/?', '/scenarios?');
    await mongoose.connect(scenariosUri);
    console.log('✅ Connected to scenarios database');
    
    const scenariosDb = mongoose.connection.db;
    let migratedCount = 0;
    
    // Migrate phishing voices
    if (phishingVoices.length > 0) {
      console.log(`🔴 Migrating ${phishingVoices.length} phishing voices...`);
      
      for (const voice of phishingVoices) {
        try {
          // Check if already exists in scenarios database
          const existing = await scenariosDb.collection('phishingvoices').findOne({ 
            originalName: voice.originalName 
          });
          
          if (existing) {
            console.log(`⚠️  Skipping ${voice.originalName} - already exists in scenarios database`);
            continue;
          }
          
          // Remove _id to let MongoDB generate a new one
          delete voice._id;
          
          // Insert into scenarios database
          await scenariosDb.collection('phishingvoices').insertOne(voice);
          migratedCount++;
          console.log(`✅ Migrated: ${voice.originalName}`);
          
        } catch (error) {
          console.error(`❌ Failed to migrate ${voice.originalName}:`, error.message);
        }
      }
    }
    
    // Migrate non-phishing voices
    if (nonPhishingVoices.length > 0) {
      console.log(`🟢 Migrating ${nonPhishingVoices.length} non-phishing voices...`);
      
      for (const voice of nonPhishingVoices) {
        try {
          // Check if already exists in scenarios database
          const existing = await scenariosDb.collection('nonphishingvoices').findOne({ 
            originalName: voice.originalName 
          });
          
          if (existing) {
            console.log(`⚠️  Skipping ${voice.originalName} - already exists in scenarios database`);
            continue;
          }
          
          // Remove _id to let MongoDB generate a new one
          delete voice._id;
          
          // Insert into scenarios database
          await scenariosDb.collection('nonphishingvoices').insertOne(voice);
          migratedCount++;
          console.log(`✅ Migrated: ${voice.originalName}`);
          
        } catch (error) {
          console.error(`❌ Failed to migrate ${voice.originalName}:`, error.message);
        }
      }
    }
    
    // Final results
    console.log('\n' + '='.repeat(50));
    console.log('📊 MIGRATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully migrated: ${migratedCount} voices`);
    console.log(`📁 Total found: ${phishingVoices.length + nonPhishingVoices.length}`);
    console.log(`🎯 Destination: scenarios database`);
    
    if (migratedCount > 0) {
      console.log('\n🎉 Voice data migration was SUCCESSFUL!');
      console.log('💡 Your voice data is now in the scenarios database where your main application can access it.');
    }
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

// Run the migration
migrateVoiceData().catch(console.error);
