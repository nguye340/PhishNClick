import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function listDatabases() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected');
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`\n📊 Current Database: ${dbName}`);
    
    // List all databases
    const admin = mongoose.connection.db.admin();
    const { databases } = await admin.listDatabases();
    
    console.log('\n📚 All Databases:');
    console.log('='.repeat(50));
    for (const db of databases) {
      console.log(`   ${db.name} (${(db.sizeOnDisk / 1024 / 1024).toFixed(2)} MB)`);
    }
    
    // List collections in current database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`\n📁 Collections in "${dbName}":`);
    console.log('='.repeat(50));
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

listDatabases();
