import mongoose from 'mongoose';

const popupEventSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  popup_id: { type: mongoose.Schema.Types.ObjectId, ref: 'PopUp', required: true },
  timestamp_spawned: Date,
  timestamp_resolved: Date,
  action_taken: { type: String, enum: ['click', 'close', 'ignore'], required: true },
  was_correct: Boolean,
  reaction_time_ms: Number
});

module.exports = mongoose.model('PopupEvent', popupEventSchema);
