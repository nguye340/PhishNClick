import mongoose from 'mongoose';

const sessionStatsSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  total_popups: Number,
  total_correct: Number,
  total_mistakes: Number,
  false_positives: Number,
  false_negatives: Number,
  avg_reaction_time_ms: Number,
  reaction_score: Number,
  confidence_score: Number,
  confidence_rating: { type: String, enum: ["reckless", "balanced", "paranoid"] },
});

module.exports = mongoose.model('SessionStats', sessionStatsSchema);