import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  start_time: { type: Date, default: Date.now },
  end_time: { type: Date },
  mode: { type: String, enum: ['training','reinforcement', 'assessment'], default: 'training' }
});

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
export default Session;

