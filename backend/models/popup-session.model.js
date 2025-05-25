const mongoose = require("mongoose");

const ClickSchema = new mongoose.Schema({
  popup_id: mongoose.Schema.Types.ObjectId,
  type: { type: String, enum: ["fake", "legit"] },
  action: { type: String, enum: ["click", "close", "ignore"] },
  response_time_ms: Number,
  was_correct: Boolean,
});

const PopupSessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  start_time: Date,
  end_time: Date,
  duration_ms: Number,

  total_popups: Number,
  legit_popups_shown: Number,
  fake_popups_shown: Number,

  clicks: [ClickSchema],

  stats: {
    correct_closes: Number,
    false_positives: Number,
    false_negatives: Number,
    missed_legit: Number,
    update_alerts_missed: Number,
    avg_response_time_ms: Number,
    reaction_score: Number,
    confidence_level: { type: String, enum: ["reckless", "balanced", "paranoid"] },
  },

  game_difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "easy" },
  remediation_flag: Boolean,
});

module.exports = mongoose.model("PopupSession", PopupSessionSchema);
