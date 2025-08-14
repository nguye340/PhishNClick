import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function inspectDatabase() {
  try {
    // Connect to MongoDB Atlas
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/phishnclick';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB Atlas');
    
    // Get database name
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database Name: ${dbName}`);
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📁 Collections in database:');
    console.log('='.repeat(40));
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }
    
    // Show connection details (without password)
    const connectionString = mongoUri.replace(/:[^:@]*@/, ':***@');
    console.log(`\n🔗 Connected to: ${connectionString}`);
    console.log(`🏷️  Database: ${dbName}`);
    
  } catch (error) {
    console.error('❌ Database inspection failed:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

inspectDatabase().catch(console.error);
