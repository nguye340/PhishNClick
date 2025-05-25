import mongoose from 'mongoose';

const taskListSchema = new mongoose.Schema({
  session_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  tasks: [{
    task_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Task' },
    status: { type: String, enum: ['incomplete', 'complete'], default: 'incomplete' },
    timestamp_completed: Date
  }]
});

const TaskList = mongoose.models.TaskList || mongoose.model('TaskList', taskListSchema);
export default TaskList;