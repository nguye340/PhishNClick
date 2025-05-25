import mongoose from "mongoose";

const assessmentSchema = new mongoose.Schema({
    user_id: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},
    timestamp: {type: Date, default: Date.now},
    score: {type: Number, required: true},
    profile: { type: String, enum: ['Balanced', 'Paranoid', 'Reckless', 'Needs Improvement'] },
    
    details: {
        correct: Number,
        false_positives: Number,
        false_negatives: Number,
        avg_reaction_time_ms: Number
    }
});

module.exports = mongoose.model('Assessment', assessmentSchema);
