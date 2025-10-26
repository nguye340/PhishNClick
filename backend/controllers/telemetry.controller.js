import TelemetryEvent from '../models/telemetry.model.js';
import mongoose from 'mongoose';

// Log a single telemetry event
export const logEvent = async (req, res) => {
  try {
    const userId = req.user.id;
    const eventData = req.body;

    // Validate required fields
    if (!eventData.type || !eventData.game) {
      return res.status(400).json({ error: 'Event type and game are required' });
    }

    const event = new TelemetryEvent({
      userId,
      ...eventData,
      timestamp: eventData.ts ? new Date(eventData.ts) : new Date()
    });

    await event.save();
    return res.status(201).json({ success: true, eventId: event._id });
  } catch (error) {
    console.error('Error logging telemetry event:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Log multiple telemetry events in batch
export const logEventsBatch = async (req, res) => {
  try {
    const userId = req.user.id;
    const { events } = req.body;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array is required' });
    }

    const telemetryEvents = events.map(eventData => ({
      userId,
      ...eventData,
      timestamp: eventData.ts ? new Date(eventData.ts) : new Date()
    }));

    const result = await TelemetryEvent.insertMany(telemetryEvents);
    return res.status(201).json({ success: true, count: result.length });
  } catch (error) {
    console.error('Error logging telemetry events batch:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get all events for the authenticated user
export const getUserEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const { game, startDate, endDate, limit = 1000 } = req.query;

    const query = { userId };
    
    if (game) {
      query.game = game;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const events = await TelemetryEvent
      .find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit))
      .lean();

    // Transform to match frontend format
    const formattedEvents = events.map(e => ({
      type: e.type,
      game: e.game,
      category: e.category,
      ui_type: e.ui_type,
      action: e.action,
      reaction_ms: e.reaction_ms,
      difficulty: e.difficulty,
      voice_call_type: e.voice_call_type,
      score: e.score,
      level: e.level,
      mistakes: e.mistakes,
      correct: e.correct,
      percentage: e.percentage,
      total: e.total,
      passed: e.passed,
      ts: e.timestamp.getTime()
    }));

    return res.status(200).json({ events: formattedEvents });
  } catch (error) {
    console.error('Error fetching user events:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Get aggregated metrics for the authenticated user
export const getUserMetrics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { game } = req.query;

    const matchStage = { userId: new mongoose.Types.ObjectId(userId) };
    if (game) {
      matchStage.game = game;
    }

    const pipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: {
            game: '$game',
            type: '$type',
            category: '$category'
          },
          count: { $sum: 1 },
          avgReaction: { $avg: '$reaction_ms' },
          totalCorrect: {
            $sum: { $cond: [{ $eq: ['$type', 'popup_correct'] }, 1, 0] }
          },
          totalIncorrect: {
            $sum: { $cond: [{ $eq: ['$type', 'popup_incorrect'] }, 1, 0] }
          },
          sessions: {
            $sum: { $cond: [{ $eq: ['$type', 'game_started'] }, 1, 0] }
          },
          quizzes: {
            $push: {
              $cond: [
                { $eq: ['$type', 'quiz_result'] },
                { percentage: '$percentage', correct: '$correct', total: '$total', ts: '$timestamp' },
                '$$REMOVE'
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.game',
          categories: {
            $push: {
              category: '$_id.category',
              type: '$_id.type',
              count: '$count',
              avgReaction: '$avgReaction',
              correct: '$totalCorrect',
              incorrect: '$totalIncorrect'
            }
          },
          totalSessions: { $sum: '$sessions' },
          allQuizzes: { $push: '$quizzes' }
        }
      }
    ];

    const results = await TelemetryEvent.aggregate(pipeline);

    // Format results to match frontend expectations
    const byGame = {};
    results.forEach(gameData => {
      const gameName = gameData._id;
      let correct = 0;
      let incorrect = 0;
      const byCategory = {};
      const reactionTimes = [];

      gameData.categories.forEach(cat => {
        if (cat.type === 'popup_correct') correct += cat.count;
        if (cat.type === 'popup_incorrect') incorrect += cat.count;
        if (cat.avgReaction) reactionTimes.push(cat.avgReaction);

        if (cat.category) {
          if (!byCategory[cat.category]) {
            byCategory[cat.category] = { correct: 0, incorrect: 0, accuracy: 0 };
          }
          byCategory[cat.category].correct += cat.correct;
          byCategory[cat.category].incorrect += cat.incorrect;
        }
      });

      // Calculate category accuracies
      Object.keys(byCategory).forEach(cat => {
        const c = byCategory[cat];
        const total = c.correct + c.incorrect;
        c.accuracy = total > 0 ? c.correct / total : 0;
      });

      const quizzes = gameData.allQuizzes.flat().filter(q => q && q.percentage != null);

      byGame[gameName] = {
        interactions: correct + incorrect,
        correct,
        incorrect,
        accuracy: (correct + incorrect) > 0 ? correct / (correct + incorrect) : 0,
        avgReactionMs: reactionTimes.length > 0 
          ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) 
          : null,
        byCategory,
        quizzes,
        sessions: gameData.totalSessions
      };
    });

    // Calculate overall metrics
    let overallCorrect = 0;
    let overallIncorrect = 0;
    let overallSessions = 0;
    const allReactions = [];

    Object.values(byGame).forEach(g => {
      overallCorrect += g.correct;
      overallIncorrect += g.incorrect;
      overallSessions += g.sessions;
      if (g.avgReactionMs) allReactions.push(g.avgReactionMs);
    });

    const overall = {
      sessions: overallSessions,
      interactions: overallCorrect + overallIncorrect,
      correct: overallCorrect,
      incorrect: overallIncorrect,
      accuracy: (overallCorrect + overallIncorrect) > 0 
        ? overallCorrect / (overallCorrect + overallIncorrect) 
        : 0,
      avgReactionMs: allReactions.length > 0
        ? Math.round(allReactions.reduce((a, b) => a + b, 0) / allReactions.length)
        : null
    };

    // Generate recommendations
    const recommendations = [];
    const weaknesses = [];
    Object.keys(byGame).forEach(gameName => {
      const g = byGame[gameName];
      Object.keys(g.byCategory).forEach(cat => {
        const c = g.byCategory[cat];
        const attempts = c.correct + c.incorrect;
        if (attempts >= 3 && c.accuracy < 0.6) {
          weaknesses.push({ game: gameName, category: cat, attempts, accuracy: c.accuracy });
        }
      });
    });

    weaknesses.sort((a, b) => (a.accuracy - b.accuracy) || (b.attempts - a.attempts));
    weaknesses.slice(0, 5).forEach(w => {
      recommendations.push(
        `Practice ${w.category} in ${w.game} (accuracy ${(w.accuracy * 100).toFixed(0)}%, ${w.attempts} attempts). Focus on indicators and close malicious popups quickly.`
      );
    });

    return res.status(200).json({ overall, byGame, recommendations });
  } catch (error) {
    console.error('Error fetching user metrics:', error);
    return res.status(500).json({ error: error.message });
  }
};

// Clear all events for the authenticated user
export const clearUserEvents = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await TelemetryEvent.deleteMany({ userId });
    return res.status(200).json({ success: true, deletedCount: result.deletedCount });
  } catch (error) {
    console.error('Error clearing user events:', error);
    return res.status(500).json({ error: error.message });
  }
};
