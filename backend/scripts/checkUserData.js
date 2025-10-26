import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Session from '../models/session.model.js';
import PopupEvent from '../models/popupEvent.model.js';
import SessionStats from '../models/sessionStats.model.js';
import User from '../models/user.model.js';

dotenv.config();

async function checkUserData() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    // Get all users
    const users = await User.find({}).lean();
    console.log(`\n👥 Total Users: ${users.length}`);
    
    for (const user of users) {
      console.log(`\n📧 User: ${user.email} (${user.name})`);
      console.log(`   ID: ${user._id}`);
      
      // Check sessions
      const sessions = await Session.find({ user_id: user._id }).lean();
      console.log(`   Sessions: ${sessions.length}`);
      
      if (sessions.length > 0) {
        console.log(`   Sample session:`, JSON.stringify(sessions[0], null, 2));
        
        // Check popup events for this user's sessions
        const sessionIds = sessions.map(s => s._id);
        const popupEvents = await PopupEvent.find({ session_id: { $in: sessionIds } }).lean();
        console.log(`   Popup Events: ${popupEvents.length}`);
        
        if (popupEvents.length > 0) {
          console.log(`   Sample popup event:`, JSON.stringify(popupEvents[0], null, 2));
        }
        
        // Check session stats
        const sessionStats = await SessionStats.find({ session_id: { $in: sessionIds } }).lean();
        console.log(`   Session Stats: ${sessionStats.length}`);
        
        if (sessionStats.length > 0) {
          console.log(`   Sample session stats:`, JSON.stringify(sessionStats[0], null, 2));
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Connection closed');
  }
}

checkUserData();
