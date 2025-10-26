/**
 * Create Test Telemetry Data
 * This script creates sample game data to test the admin dashboard
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

// Import models
import Session from '../models/session.model.js';
import PopupEvent from '../models/popupEvent.model.js';
import SessionStats from '../models/sessionStats.model.js';

async function createTestData() {
  try {
    // Connect to MongoDB - Force scenarios database
    let mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/scenarios';
    
    // Force scenarios database (same logic as checkScenariosData.js)
    if (mongoUri.includes('/?')) {
      mongoUri = mongoUri.replace('/?', '/scenarios?');
    } else if (!mongoUri.includes('/scenarios')) {
      mongoUri = mongoUri.replace(/\?/, '/scenarios?');
    }
    
    console.log('🔌 Connecting to scenarios database...');
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    const dbName = mongoose.connection.db.databaseName;
    console.log(`📊 Database: ${dbName}`);

    // Get first user from database
    const userSchema = new mongoose.Schema({
      username: String,
      email: String,
      password_hash: String,
      role: String
    }, { strict: false });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema, 'users');
    const users = await User.find({});
    
    console.log(`📊 Found ${users.length} users in database`);
    
    if (users.length === 0) {
      console.error('❌ No users found in database. Please create a user first.');
      await mongoose.disconnect();
      process.exit(1);
    }

    const userId = users[0]._id;
    console.log(`👤 Using user: ${users[0].username || users[0].email || userId}`);

    // Create test sessions
    console.log('\n📊 Creating test sessions...');
    
    const sessions = [];
    for (let i = 0; i < 3; i++) {
      const startTime = new Date(Date.now() - (i + 1) * 24 * 60 * 60 * 1000); // Past days
      const endTime = new Date(startTime.getTime() + 15 * 60 * 1000); // 15 min later
      
      const session = await Session.create({
        user_id: userId,
        start_time: startTime,
        end_time: endTime,
        mode: 'training'
      });
      
      sessions.push(session);
      console.log(`  ✅ Session ${i + 1}: ${session._id}`);
      
      // Create popup events for this session
      const numEvents = 10 + Math.floor(Math.random() * 10);
      for (let j = 0; j < numEvents; j++) {
        const spawnTime = new Date(startTime.getTime() + j * 60 * 1000);
        const resolveTime = new Date(spawnTime.getTime() + Math.random() * 5000);
        const wasCorrect = Math.random() > 0.3; // 70% correct
        
        await PopupEvent.create({
          session_id: session._id,
          popup_id: `test-popup-${i}-${j}`,
          timestamp_spawned: spawnTime,
          timestamp_resolved: resolveTime,
          action_taken: wasCorrect ? 'close' : 'click',
          was_correct: wasCorrect,
          reaction_time_ms: resolveTime - spawnTime
        });
      }
      console.log(`    📝 Created ${numEvents} popup events`);
      
      // Create session stats
      const correctCount = Math.floor(numEvents * 0.7);
      const mistakeCount = numEvents - correctCount;
      
      await SessionStats.create({
        session_id: session._id,
        total_popups: numEvents,
        total_correct: correctCount,
        total_mistakes: mistakeCount,
        false_positives: Math.floor(mistakeCount * 0.5),
        false_negatives: Math.floor(mistakeCount * 0.5),
        avg_reaction_time_ms: 2000 + Math.random() * 2000,
        reaction_score: correctCount * 10,
        confidence_score: Math.round((correctCount / numEvents) * 100),
        confidence_rating: 'balanced'
      });
      console.log(`    📈 Created session stats`);
    }

    console.log('\n✅ Test data created successfully!');
    console.log(`\n📊 Summary:`);
    console.log(`   Sessions: ${sessions.length}`);
    console.log(`   Popup Events: ~${sessions.length * 15}`);
    console.log(`   Session Stats: ${sessions.length}`);
    console.log(`\n🎯 Now check your admin dashboard!`);

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Disconnected from MongoDB');
  }
}

createTestData();
