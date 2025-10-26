import User from '../models/user.model.js';
import Session from '../models/session.model.js';
import SessionStats from '../models/sessionStats.model.js';
import PopupEvent from '../models/popupEvent.model.js';
import QuizResult from '../models/quizResult.model.js';
import { calculateUserRiskScore, calculateOrganizationRisk } from '../utils/riskScoring.js';

/**
 * Get overview KPIs for admin dashboard
 * Returns high-level metrics about the organization
 */
export const getAdminOverview = async (req, res) => {
  try {
    // Total users
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });
    
    // Total sessions and interactions
    const totalSessions = await Session.countDocuments();
    const totalInteractions = await PopupEvent.countDocuments();
    
    // Calculate organization-wide accuracy
    const correctInteractions = await PopupEvent.countDocuments({ was_correct: true });
    const incorrectInteractions = await PopupEvent.countDocuments({ was_correct: false });
    const totalOutcomes = correctInteractions + incorrectInteractions;
    const overallAccuracy = totalOutcomes > 0 
      ? Math.round((correctInteractions / totalOutcomes) * 100) 
      : 0;
    
    // Training completion rate (users with at least 5 sessions)
    const trainedUsers = await Session.aggregate([
      { $group: { _id: '$user_id', sessionCount: { $sum: 1 } } },
      { $match: { sessionCount: { $gte: 5 } } },
      { $count: 'count' }
    ]);
    const trainingCompletionRate = totalUsers > 0
      ? Math.round((trainedUsers[0]?.count || 0) / totalUsers * 100)
      : 0;
    
    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentSessions = await Session.countDocuments({ 
      start_time: { $gte: sevenDaysAgo } 
    });
    const recentInteractions = await PopupEvent.countDocuments({ 
      timestamp_spawned: { $gte: sevenDaysAgo } 
    });
    
    // High-risk users count (will be calculated from risk scores)
    const allUsers = await User.find({}, '_id name email');
    const userRiskScores = await Promise.all(
      allUsers.map(user => calculateUserRiskFromDB(user._id))
    );
    const highRiskCount = userRiskScores.filter(
      score => score.riskLevel === 'HIGH' || score.riskLevel === 'CRITICAL'
    ).length;
    
    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          highRisk: highRiskCount,
          trainingCompletionRate
        },
        activity: {
          totalSessions,
          totalInteractions,
          recentSessions,
          recentInteractions
        },
        performance: {
          overallAccuracy,
          correctInteractions,
          incorrectInteractions
        }
      }
    });
  } catch (error) {
    console.error('Error fetching admin overview:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch overview data',
      error: error.message 
    });
  }
};

/**
 * Delete a user and all associated telemetry
 * Only accessible to admins
 */
export const deleteUserByAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    if (req.user?._id?.toString() === userId) {
      return res.status(400).json({
        success: false,
        message: 'Admins cannot delete their own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const [sessionsResult, sessionStatsResult, popupEventsResult, quizResultsResult] = await Promise.all([
      Session.deleteMany({ userId }),
      SessionStats.deleteMany({ userId }),
      PopupEvent.deleteMany({ userId }),
      QuizResult.deleteMany({ userId })
    ]);

    await User.findByIdAndDelete(userId);

    res.json({
      success: true,
      message: `User ${user.email} deleted successfully`,
      data: {
        deletedSessions: sessionsResult.deletedCount,
        deletedSessionStats: sessionStatsResult.deletedCount,
        deletedPopupEvents: popupEventsResult.deletedCount,
        deletedQuizResults: quizResultsResult.deletedCount
      }
    });
  } catch (error) {
    console.error('Error deleting user by admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

/**
 * Get all users with their risk scores
 * Returns paginated list of users with comprehensive risk assessments
 */
export const getAllUsersWithRisk = async (req, res) => {
  try {
    const { page = 1, limit = 50, sortBy = 'riskScore', order = 'desc', riskLevel = null } = req.query;
    
    // Get all users
    const users = await User.find({}, '_id name email role createdAt lastLogin')
      .lean();
    
    // Calculate risk scores for all users
    const usersWithRisk = await Promise.all(
      users.map(async (user) => {
        const riskData = await calculateUserRiskFromDB(user._id);
        return {
          ...user,
          ...riskData
        };
      })
    );
    
    // Filter by risk level if specified
    let filteredUsers = usersWithRisk;
    if (riskLevel) {
      filteredUsers = usersWithRisk.filter(u => u.riskLevel === riskLevel.toUpperCase());
    }
    
    // Sort users
    filteredUsers.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return order === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        users: paginatedUsers,
        pagination: {
          total: filteredUsers.length,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(filteredUsers.length / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching users with risk:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user data',
      error: error.message 
    });
  }
};

/**
 * Get detailed analytics for a specific user
 * Returns comprehensive breakdown of user's performance
 */
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Get user info
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Calculate risk score
    const riskData = await calculateUserRiskFromDB(userId);
    
    // Get session history
    const sessions = await Session.find({ user_id: userId })
      .sort({ start_time: -1 })
      .limit(20)
      .lean();
    
    // Get recent interactions - need to get via sessions
    const userSessionIds = await Session.find({ user_id: userId }).distinct('_id');
    const recentInteractions = await PopupEvent.find({ session_id: { $in: userSessionIds } })
      .sort({ timestamp_spawned: -1 })
      .limit(50)
      .populate('popup_id', 'title category ui_type')
      .lean();
    
    // Get quiz results
    const quizResults = await QuizResult.find({ userId })
      .sort({ completedAt: -1 })
      .limit(10)
      .lean();
    
    // Category breakdown
    const categoryStats = await PopupEvent.aggregate([
      { $match: { session_id: { $in: userSessionIds } } },
      {
        $lookup: {
          from: 'popups',
          localField: 'popup_id',
          foreignField: '_id',
          as: 'popup'
        }
      },
      { $unwind: { path: '$popup', preserveNullAndEmptyArrays: true } },
      { $group: {
        _id: '$popup.category',
        total: { $sum: 1 },
        correct: { $sum: { $cond: [{ $eq: ['$was_correct', true] }, 1, 0] } },
        incorrect: { $sum: { $cond: [{ $eq: ['$was_correct', false] }, 1, 0] } },
        avgReactionTime: { $avg: '$reaction_time_ms' }
      }},
      { $project: {
        category: '$_id',
        total: 1,
        correct: 1,
        incorrect: 1,
        accuracy: { 
          $multiply: [
            { $divide: ['$correct', '$total'] },
            100
          ]
        },
        avgReactionTime: { $round: ['$avgReactionTime', 0] }
      }}
    ]);
    
    // Game-specific stats from SessionStats
    const gameStats = await SessionStats.aggregate([
      { $match: { session_id: { $in: userSessionIds } } },
      { $group: {
        _id: null,
        sessions: { $sum: 1 },
        totalPopups: { $sum: '$total_popups' },
        totalCorrect: { $sum: '$total_correct' },
        totalMistakes: { $sum: '$total_mistakes' },
        avgReactionTime: { $avg: '$avg_reaction_time_ms' }
      }},
      { $project: {
        game: 'popup_manic',
        sessions: 1,
        totalPopups: 1,
        totalCorrect: 1,
        totalMistakes: 1,
        avgReactionTime: { $round: ['$avgReactionTime', 0] }
      }}
    ]);
    
    // Performance over time (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const performanceTimeline = await PopupEvent.aggregate([
      { 
        $match: { 
          session_id: { $in: userSessionIds },
          timestamp_spawned: { $gte: thirtyDaysAgo }
        } 
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$timestamp_spawned' }
          },
          total: { $sum: 1 },
          correct: { $sum: { $cond: [{ $eq: ['$was_correct', true] }, 1, 0] } }
        }
      },
      {
        $project: {
          date: '$_id',
          total: 1,
          correct: 1,
          accuracy: { 
            $multiply: [
              { $divide: ['$correct', '$total'] },
              100
            ]
          }
        }
      },
      { $sort: { date: 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt,
          lastLogin: user.lastLogin
        },
        riskAssessment: riskData,
        sessions,
        recentInteractions,
        quizResults,
        categoryStats,
        gameStats,
        performanceTimeline
      }
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user details',
      error: error.message 
    });
  }
};

/**
 * Get behavioral analytics across all users
 * Returns patterns, trends, and insights
 */
export const getBehaviorAnalytics = async (req, res) => {
  try {
    // Category performance across organization
    const categoryPerformance = await PopupEvent.aggregate([
      {
        $group: {
          _id: '$category',
          total: { $sum: 1 },
          correct: { $sum: { $cond: [{ $eq: ['$outcome', 'correct'] }, 1, 0] } },
          incorrect: { $sum: { $cond: [{ $eq: ['$outcome', 'incorrect'] }, 1, 0] } },
          avgReactionTime: { $avg: '$reactionTime' },
          uniqueUsers: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          category: '$_id',
          total: 1,
          correct: 1,
          incorrect: 1,
          accuracy: { 
            $multiply: [
              { $divide: ['$correct', '$total'] },
              100
            ]
          },
          avgReactionTime: { $round: ['$avgReactionTime', 0] },
          userCount: { $size: '$uniqueUsers' }
        }
      },
      { $sort: { accuracy: 1 } }
    ]);
    
    // Game popularity and effectiveness
    const gameAnalytics = await Session.aggregate([
      {
        $group: {
          _id: '$game',
          totalSessions: { $sum: 1 },
          uniqueUsers: { $addToSet: '$userId' },
          avgScore: { $avg: '$score' },
          avgMistakes: { $avg: '$mistakes' },
          totalScore: { $sum: '$score' }
        }
      },
      {
        $project: {
          game: '$_id',
          totalSessions: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          avgScore: { $round: ['$avgScore', 0] },
          avgMistakes: { $round: ['$avgMistakes', 1] },
          totalScore: 1
        }
      },
      { $sort: { totalSessions: -1 } }
    ]);
    
    // Time-based patterns (activity by hour of day)
    const activityByHour = await PopupEvent.aggregate([
      {
        $group: {
          _id: { $hour: '$timestamp' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          hour: '$_id',
          count: 1
        }
      },
      { $sort: { hour: 1 } }
    ]);
    
    // Common mistake patterns
    const commonMistakes = await PopupEvent.aggregate([
      { $match: { outcome: 'incorrect' } },
      {
        $group: {
          _id: {
            category: '$category',
            action: '$action'
          },
          count: { $sum: 1 },
          users: { $addToSet: '$userId' }
        }
      },
      {
        $project: {
          category: '$_id.category',
          action: '$_id.action',
          count: 1,
          affectedUsers: { $size: '$users' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
    
    res.json({
      success: true,
      data: {
        categoryPerformance,
        gameAnalytics,
        activityByHour,
        commonMistakes
      }
    });
  } catch (error) {
    console.error('Error fetching behavior analytics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch analytics',
      error: error.message 
    });
  }
};

/**
 * Get organization-wide risk assessment
 * Returns comprehensive risk metrics and high-risk users
 */
export const getOrganizationRisk = async (req, res) => {
  try {
    // Get all users
    const users = await User.find({}, '_id name email').lean();
    
    // Calculate risk scores for all users
    const userRiskScores = await Promise.all(
      users.map(async (user) => {
        const riskData = await calculateUserRiskFromDB(user._id);
        return {
          userId: user._id,
          name: user.name,
          email: user.email,
          ...riskData
        };
      })
    );
    
    // Calculate organization-level metrics
    const orgRisk = calculateOrganizationRisk(userRiskScores);
    
    res.json({
      success: true,
      data: orgRisk
    });
  } catch (error) {
    console.error('Error calculating organization risk:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to calculate risk',
      error: error.message 
    });
  }
};

/**
 * Get training effectiveness metrics
 * Analyzes how well training is working
 */
export const getTrainingEffectiveness = async (req, res) => {
  try {
    // Quiz performance trends
    const quizTrends = await QuizResult.aggregate([
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$completedAt' }
          },
          avgScore: { $avg: '$score' },
          avgPercentage: { $avg: '$percentage' },
          totalQuizzes: { $sum: 1 },
          passedQuizzes: { 
            $sum: { $cond: [{ $eq: ['$passed', true] }, 1, 0] } 
          }
        }
      },
      {
        $project: {
          date: '$_id',
          avgScore: { $round: ['$avgScore', 1] },
          avgPercentage: { $round: ['$avgPercentage', 1] },
          totalQuizzes: 1,
          passedQuizzes: 1,
          passRate: {
            $multiply: [
              { $divide: ['$passedQuizzes', '$totalQuizzes'] },
              100
            ]
          }
        }
      },
      { $sort: { date: 1 } },
      { $limit: 30 }
    ]);
    
    // User improvement over time (first 5 sessions vs last 5 sessions)
    const users = await User.find({}, '_id').lean();
    const improvementData = await Promise.all(
      users.map(async (user) => {
        const sessions = await Session.find({ userId: user._id })
          .sort({ createdAt: 1 })
          .lean();
        
        if (sessions.length < 10) return null;
        
        const firstFive = sessions.slice(0, 5);
        const lastFive = sessions.slice(-5);
        
        const avgScoreFirst = firstFive.reduce((sum, s) => sum + (s.score || 0), 0) / 5;
        const avgScoreLast = lastFive.reduce((sum, s) => sum + (s.score || 0), 0) / 5;
        const improvement = avgScoreLast - avgScoreFirst;
        
        return {
          userId: user._id,
          improvement,
          improvementPercentage: avgScoreFirst > 0 
            ? Math.round((improvement / avgScoreFirst) * 100)
            : 0
        };
      })
    );
    
    const validImprovements = improvementData.filter(d => d !== null);
    const avgImprovement = validImprovements.length > 0
      ? validImprovements.reduce((sum, d) => sum + d.improvement, 0) / validImprovements.length
      : 0;
    
    // Game completion rates
    const gameCompletion = await Session.aggregate([
      {
        $group: {
          _id: '$game',
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $gte: ['$score', 100] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          game: '$_id',
          totalSessions: 1,
          completedSessions: 1,
          completionRate: {
            $multiply: [
              { $divide: ['$completedSessions', '$totalSessions'] },
              100
            ]
          }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        quizTrends,
        userImprovement: {
          avgImprovement: Math.round(avgImprovement),
          usersAnalyzed: validImprovements.length,
          improvingUsers: validImprovements.filter(d => d.improvement > 0).length,
          decliningUsers: validImprovements.filter(d => d.improvement < 0).length
        },
        gameCompletion
      }
    });
  } catch (error) {
    console.error('Error fetching training effectiveness:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch training data',
      error: error.message 
    });
  }
};

/**
 * Get real-time activity feed
 * Returns recent user activities across the platform
 */
export const getActivityFeed = async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    // Recent interactions
    const recentInteractions = await PopupEvent.find()
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .populate('popupId', 'title category')
      .lean();
    
    // Recent sessions
    const recentSessions = await Session.find()
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('userId', 'name email')
      .lean();
    
    // Combine and sort by timestamp
    const activities = [
      ...recentInteractions.map(i => ({
        type: 'interaction',
        timestamp: i.timestamp,
        user: i.userId,
        data: {
          outcome: i.outcome,
          category: i.category,
          popup: i.popupId?.title
        }
      })),
      ...recentSessions.map(s => ({
        type: 'session',
        timestamp: s.createdAt,
        user: s.userId,
        data: {
          game: s.game,
          score: s.score,
          mistakes: s.mistakes
        }
      }))
    ].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
     .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error fetching activity feed:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch activity feed',
      error: error.message 
    });
  }
};

/**
 * Helper function to calculate user risk from database
 * Aggregates all user data and computes risk score
 */
async function calculateUserRiskFromDB(userId) {
  try {
    // Get all sessions for this user
    const userSessions = await Session.find({ user_id: userId }).lean();
    const sessionIds = userSessions.map(s => s._id);
    
    // Get total interactions from PopupEvents
    const totalInteractions = await PopupEvent.countDocuments({ session_id: { $in: sessionIds } });
    const correctInteractions = await PopupEvent.countDocuments({ 
      session_id: { $in: sessionIds },
      was_correct: true
    });
    const incorrectInteractions = await PopupEvent.countDocuments({ 
      session_id: { $in: sessionIds },
      was_correct: false
    });
    
    // Get average reaction time
    const reactionTimeData = await PopupEvent.aggregate([
      { $match: { session_id: { $in: sessionIds }, reaction_time_ms: { $exists: true, $ne: null } } },
      { $group: { _id: null, avgReactionMs: { $avg: '$reaction_time_ms' } } }
    ]);
    const avgReactionMs = reactionTimeData[0]?.avgReactionMs || null;
    
    // Get session count
    const sessionCount = userSessions.length;
    
    // Get last activity date
    const lastSession = userSessions.length > 0 
      ? userSessions.sort((a, b) => new Date(b.start_time) - new Date(a.start_time))[0]
      : null;
    const lastActivityDate = lastSession?.start_time || null;
    
    // Get category stats by joining with Popup collection
    const categoryStatsRaw = await PopupEvent.aggregate([
      { $match: { session_id: { $in: sessionIds } } },
      {
        $lookup: {
          from: 'popups',
          localField: 'popup_id',
          foreignField: '_id',
          as: 'popup'
        }
      },
      { $unwind: { path: '$popup', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$popup.category',
          correct: { $sum: { $cond: [{ $eq: ['$was_correct', true] }, 1, 0] } },
          incorrect: { $sum: { $cond: [{ $eq: ['$was_correct', false] }, 1, 0] } }
        }
      }
    ]);
    
    const categoryStats = {};
    categoryStatsRaw.forEach(cat => {
      if (cat._id) {
        categoryStats[cat._id] = {
          correct: cat.correct,
          incorrect: cat.incorrect
        };
      }
    });
    
    // Get game stats from SessionStats
    const sessionStatsData = await SessionStats.aggregate([
      { $match: { session_id: { $in: sessionIds } } },
      {
        $group: {
          _id: null,
          totalPopups: { $sum: '$total_popups' },
          totalCorrect: { $sum: '$total_correct' },
          totalMistakes: { $sum: '$total_mistakes' },
          avgReactionTime: { $avg: '$avg_reaction_time_ms' }
        }
      }
    ]);
    
    const gameStats = {};
    if (sessionStatsData.length > 0) {
      const stats = sessionStatsData[0];
      gameStats['popup_manic'] = {
        interactions: stats.totalPopups || 0,
        correct: stats.totalCorrect || 0,
        incorrect: stats.totalMistakes || 0,
        accuracy: stats.totalPopups > 0 ? (stats.totalCorrect / stats.totalPopups) * 100 : 0
      };
    }
    
    // Get recent sessions for trend analysis
    const recentSessions = userSessions
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time))
      .slice(0, 10);
    
    const recentSessionsData = await Promise.all(
      recentSessions.map(async (s) => {
        const stats = await SessionStats.findOne({ session_id: s._id });
        const accuracy = stats && stats.total_popups > 0 
          ? (stats.total_correct / stats.total_popups) * 100 
          : 0;
        return {
          timestamp: s.start_time,
          accuracy
        };
      })
    );
    
    // Calculate risk score
    const riskScore = calculateUserRiskScore({
      userId,
      totalInteractions,
      correctInteractions,
      incorrectInteractions,
      avgReactionMs,
      sessionCount,
      lastActivityDate,
      categoryStats,
      gameStats,
      recentSessions: recentSessionsData
    });
    
    return riskScore;
  } catch (error) {
    console.error(`Error calculating risk for user ${userId}:`, error);
    return {
      userId,
      overallScore: 50,
      riskLevel: 'UNKNOWN',
      factors: {},
      weakCategories: [],
      concerningGames: [],
      recommendations: ['Unable to calculate risk score'],
      metadata: {}
    };
  }
}
