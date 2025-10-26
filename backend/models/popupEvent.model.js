import mongoose from 'mongoose';

const popupEventSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  popup_id: { type: String, required: true }, // Changed to String to accept game identifiers like "phish404-coin-123"
  timestamp_spawned: Date,
  timestamp_resolved: Date,
  action_taken: { type: String, enum: ['click', 'close', 'ignore'], required: true },
  was_correct: Boolean,
  reaction_time_ms: Number
});

const PopupEvent = mongoose.models.PopupEvent || mongoose.model('PopupEvent', popupEventSchema);
export default PopupEvent;