import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkScenariosData() {
  try {
    let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    
    // Force scenarios database
    if (mongoUri.includes('/?')) {
      mongoUri = mongoUri.replace('/?', '/scenarios?');
    } else if (!mongoUri.includes('/scenarios')) {
      mongoUri = mongoUri.replace(/\?/, '/scenarios?');
    }
    
    console.log('🔗 Connecting to scenarios database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`\n📊 Database: ${dbName}`);
    
    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections:`);
    console.log('='.repeat(60));
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name.padEnd(30)} ${count} documents`);
      
      // Show sample for key collections
      if (['users', 'sessions', 'popupevents', 'sessionstats'].includes(collection.name.toLowerCase())) {
        const sample = await mongoose.connection.db.collection(collection.name).findOne();
        if (sample) {
          console.log(`      Sample keys: ${Object.keys(sample).join(', ')}`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

checkScenariosData();
