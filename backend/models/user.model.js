import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email:    { type: String, required: true, unique: true },
    password_hash: { type: String }, // Not required if using OAuth
    role: { type: String, enum: ['admin', 'user'], default: 'user' },
    profilePicture: { type: String }, // URL or path to profile picture
    oauth_provider: { type: String, enum: ['google', 'github', 'local'], default: 'local' },
    oauth_id: { type: String }, // Used for third-party login
    failedLoginAttempts: { type: Number, default: 0 },
    consecutiveFailedLoginAttempts: { type: Number, default: 0 },
    lockoutStage: { type: Number, default: 0 },
    lockoutExpiresAt: { type: Date },
    isPermanentlyLocked: { type: Boolean, default: false },
    passwordResetRequired: { type: Boolean, default: false },
    passwordResetTokenHash: { type: String },
    passwordResetTokenExpiresAt: { type: Date },
    passwordResetApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    passwordResetApprovedAt: { type: Date },
    lastFailedLoginAt: { type: Date },
    lastLoginAt: { type: Date },
    tokenVersion: { type: Number, default: 0 },  // For JWT revocation
    // account_type: { type: String, enum: ['guest', 'personal', 'organization'], default: 'personal' },
    
    // // Optional metadata
    // organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
    // created_at: { type: Date, default: Date.now },
    
    // // For personalized learning path
    // current_level: { type: Number, default: 1 },
    // last_assessment_score: { type: Number, default: 0 },
    // confidence_rating: { type: String, enum: ["reckless", "balanced", "paranoid"] },
    
    // // Optional analytics
    // total_sessions_played: { type: Number, default: 0 },
    // average_reaction_time_ms: { type: Number, default: 0 }
  }, 
  {
    timestamps: true
  }
);

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
