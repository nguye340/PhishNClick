import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email:    { type: String, required: true, unique: true },
  password_hash: { type: String }, // Not required if using OAuth
  oauth_provider: { type: String, enum: ['google', 'github', 'none'], default: 'none' },
  oauth_id: { type: String }, // Used for third-party login
  account_type: { type: String, enum: ['guest', 'personal', 'organization'], default: 'personal' },
  
  // Optional metadata
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  created_at: { type: Date, default: Date.now },
  
  // For personalized learning path
  current_level: { type: Number, default: 1 },
  last_assessment_score: { type: Number, default: 0 },
  confidence_rating: { type: String, enum: ["reckless", "balanced", "paranoid"] },
  
  // Optional analytics
  total_sessions_played: { type: Number, default: 0 },
  average_reaction_time_ms: { type: Number, default: 0 }
});

module.exports = mongoose.model('User', userSchema);

// const User = mongoose.model('User', userSchema);
// export default User;
