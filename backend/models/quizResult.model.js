import mongoose from 'mongoose';

const quizResultSchema = new mongoose.Schema({
  // Unique ID for the user who took the quiz
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Assuming you have a User model
    required: true,
  },

  // The date and time the quiz was completed
  dateTaken: {
    type: Date,
    default: Date.now,
  },

  // --- New top-level fields for overall quiz performance ---
  // The total number of questions answered correctly
  correctAnswersCount: {
    type: Number,
    required: true,
    min: 0,
    max: 10, // Assuming 10 questions per quiz
  },

  // The total number of questions answered incorrectly
  incorrectAnswersCount: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },

  // The total reaction time for the entire quiz, in milliseconds
  totalReactionTimeMs: {
    type: Number,
    required: true,
    min: 0,
  },

  // The calculated score for this quiz (e.g., 10 points per correct answer)
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
  },
  
  // An array of questions and the player's performance on each
  questions: [{
    // The ID of the popup this question is about
    popupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Popup', // Reference to the Popup model
      required: true,
    },

    // A new field to specify the type of question
    questionType: {
      type: String,
      enum: ['ioc_identification', 'categorization', 'correct_action', 'justification', 'prevention_tips', 'impact_explanation'],
      required: true,
    },

    // The player's selected answers (will vary based on question type)
    playerAnswers: mongoose.Schema.Types.Mixed,
    
    // The correct answers for this question
    correctAnswers: mongoose.Schema.Types.Mixed,

    // A boolean to quickly check if the player got the question right
    isCorrect: {
      type: Boolean,
      required: true,
    },

    // --- New field for tracking reaction time per question ---
    reactionTimeMs: {
      type: Number,
      required: true,
      min: 0,
      description: "The time (in ms) it took the player to answer this specific question."
    },
  }],
});

// A compound index for efficient querying by user and date
quizResultSchema.index({ userId: 1, dateTaken: -1 });

const QuizResult = mongoose.models.QuizResult || mongoose.model('QuizResult', quizResultSchema);
export default QuizResult;
