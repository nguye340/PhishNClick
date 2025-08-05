import QuizResult from '../models/quizResult.model.js';

// Create a new quiz result
export const createQuizResult = async (req, res) => {
  try {
    const quizResult = new QuizResult(req.body);
    const savedQuizResult = await quizResult.save();
    
    res.status(201).json({
      success: true,
      data: savedQuizResult,
      message: 'Quiz result saved successfully'
    });
  } catch (error) {
    console.error('Error creating quiz result:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to save quiz result',
      error: error.message
    });
  }
};

// Get all quiz results for a specific user
export const getQuizResultsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, sortBy = 'dateTaken', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const quizResults = await QuizResult.find({ userId })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('questions.popupId', 'title category subtype is_malicious');
    
    const total = await QuizResult.countDocuments({ userId });
    
    res.status(200).json({
      success: true,
      data: quizResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results',
      error: error.message
    });
  }
};

// Get quiz statistics for a user
export const getQuizStatistics = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const quizResults = await QuizResult.find({ userId });
    
    if (quizResults.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalQuizzes: 0,
          averageScore: 0,
          totalCorrectAnswers: 0,
          totalIncorrectAnswers: 0,
          averageReactionTime: 0,
          bestScore: 0,
          worstScore: 0,
          improvementTrend: 'no_data'
        }
      });
    }
    
    // Calculate statistics
    const totalQuizzes = quizResults.length;
    const totalScore = quizResults.reduce((sum, quiz) => sum + quiz.score, 0);
    const averageScore = totalScore / totalQuizzes;
    
    const totalCorrectAnswers = quizResults.reduce((sum, quiz) => sum + quiz.correctAnswersCount, 0);
    const totalIncorrectAnswers = quizResults.reduce((sum, quiz) => sum + quiz.incorrectAnswersCount, 0);
    
    const totalReactionTime = quizResults.reduce((sum, quiz) => sum + quiz.totalReactionTimeMs, 0);
    const totalQuestions = quizResults.reduce((sum, quiz) => sum + quiz.questions.length, 0);
    const averageReactionTime = totalQuestions > 0 ? totalReactionTime / totalQuestions : 0;
    
    const scores = quizResults.map(quiz => quiz.score);
    const bestScore = Math.max(...scores);
    const worstScore = Math.min(...scores);
    
    // Calculate improvement trend (compare first half vs second half of quizzes)
    let improvementTrend = 'stable';
    if (totalQuizzes >= 4) {
      const halfPoint = Math.floor(totalQuizzes / 2);
      const firstHalfAvg = quizResults.slice(0, halfPoint).reduce((sum, quiz) => sum + quiz.score, 0) / halfPoint;
      const secondHalfAvg = quizResults.slice(halfPoint).reduce((sum, quiz) => sum + quiz.score, 0) / (totalQuizzes - halfPoint);
      
      if (secondHalfAvg > firstHalfAvg + 5) {
        improvementTrend = 'improving';
      } else if (secondHalfAvg < firstHalfAvg - 5) {
        improvementTrend = 'declining';
      }
    }
    
    // Category performance analysis
    const categoryPerformance = {};
    quizResults.forEach(quiz => {
      quiz.questions.forEach(question => {
        if (question.popupId && question.popupId.category) {
          const category = question.popupId.category;
          if (!categoryPerformance[category]) {
            categoryPerformance[category] = { correct: 0, total: 0 };
          }
          categoryPerformance[category].total++;
          if (question.isCorrect) {
            categoryPerformance[category].correct++;
          }
        }
      });
    });
    
    // Convert to percentage
    Object.keys(categoryPerformance).forEach(category => {
      const perf = categoryPerformance[category];
      perf.percentage = perf.total > 0 ? (perf.correct / perf.total) * 100 : 0;
    });
    
    res.status(200).json({
      success: true,
      data: {
        totalQuizzes,
        averageScore: Math.round(averageScore * 100) / 100,
        totalCorrectAnswers,
        totalIncorrectAnswers,
        averageReactionTime: Math.round(averageReactionTime),
        bestScore,
        worstScore,
        improvementTrend,
        categoryPerformance,
        recentQuizzes: quizResults.slice(-5).map(quiz => ({
          dateTaken: quiz.dateTaken,
          score: quiz.score,
          correctAnswersCount: quiz.correctAnswersCount
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching quiz statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz statistics',
      error: error.message
    });
  }
};

// Get all quiz results (admin function)
export const getAllQuizResults = async (req, res) => {
  try {
    const { page = 1, limit = 20, sortBy = 'dateTaken', sortOrder = 'desc' } = req.query;
    
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    
    const quizResults = await QuizResult.find()
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('questions.popupId', 'title category subtype');
    
    const total = await QuizResult.countDocuments();
    
    res.status(200).json({
      success: true,
      data: quizResults,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total
      }
    });
  } catch (error) {
    console.error('Error fetching all quiz results:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz results',
      error: error.message
    });
  }
};

// Get a specific quiz result by ID
export const getQuizResultById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const quizResult = await QuizResult.findById(id)
      .populate('userId', 'name email')
      .populate('questions.popupId');
    
    if (!quizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: quizResult
    });
  } catch (error) {
    console.error('Error fetching quiz result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch quiz result',
      error: error.message
    });
  }
};

// Update a quiz result
export const updateQuizResult = async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedQuizResult = await QuizResult.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('questions.popupId');
    
    if (!updatedQuizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: updatedQuizResult,
      message: 'Quiz result updated successfully'
    });
  } catch (error) {
    console.error('Error updating quiz result:', error);
    res.status(400).json({
      success: false,
      message: 'Failed to update quiz result',
      error: error.message
    });
  }
};

// Delete a quiz result
export const deleteQuizResult = async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedQuizResult = await QuizResult.findByIdAndDelete(id);
    
    if (!deletedQuizResult) {
      return res.status(404).json({
        success: false,
        message: 'Quiz result not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Quiz result deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting quiz result:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete quiz result',
      error: error.message
    });
  }
};
