import mongoose from 'mongoose';

const telemetryEventSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['game_started', 'popup_correct', 'popup_incorrect', 'quiz_result', 'game_over'],
    required: true
  },
  game: {
    type: String,
    required: true,
    index: true
  },
  category: String,
  ui_type: String,
  action: String,
  reaction_ms: Number,
  difficulty: Number,
  voice_call_type: String,
  score: Number,
  level: Number,
  mistakes: Number,
  correct: Number,
  percentage: Number,
  total: Number,
  passed: Boolean,
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient user + game queries
telemetryEventSchema.index({ userId: 1, game: 1, timestamp: -1 });

// TTL index to auto-delete events older than 1 year (optional)
telemetryEventSchema.index({ timestamp: 1 }, { expireAfterSeconds: 31536000 });

const TelemetryEvent = mongoose.model('TelemetryEvent', telemetryEventSchema);

export default TelemetryEvent;
