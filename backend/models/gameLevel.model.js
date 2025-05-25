import mongoose from 'mongoose';

const gameLevelSchema = new mongoose.Schema({
  level_number: { type: Number, required: true },
  description: String,
  popups_per_minute: Number,
  task_count: Number,
  min_required_score: Number,
  next_level_score_threshold: Number
});

module.exports = mongoose.model('GameLevel', gameLevelSchema);
