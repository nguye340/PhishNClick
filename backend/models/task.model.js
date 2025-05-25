import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  is_critical: Boolean,
  expected_action: String,
  category: String,
  hint: String
});

module.exports = mongoose.model('Task', taskSchema);