
import SessionStats from '../models/sessionStats.model.js';
import PopupEvent from '../models/popupEvent.model.js';

export const getSessionStats = async (req, res) => {
  const sessionId = req.params.sessionId;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID is required' });
  }
  try {
    const stats = await SessionStats.findOne({ session_id: sessionId });
    if (!stats) {
      return res.status(404).json({ error: 'Stats not found' });
    }
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const generateStatsForSession = async (req, res) => {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
      return res.status(400).json({ error: 'Session ID is required' });
    }
    const events = await PopupEvent.find({ session_id: sessionId });
    if (!events) {
      return res.status(404).json({ error: 'Events not found' });
    }
    const total = events.length;
    const correct = events.filter(e => e.was_correct).length;
    const mistakes = total - correct;
    const falsePos = events.filter(e => e.action_taken === 'close' && !e.was_correct).length;
    const falseNeg = events.filter(e => e.action_taken === 'ignore' && !e.was_correct).length;
    const avgTime = events.reduce((sum, e) => sum + (e.reaction_time_ms || 0), 0) / (total || 1);

    const reactionScore = Math.max(0, 100 - avgTime / 100); // Basic formula
    const confidence = correct / (total || 1);

    const confidence_rating =
      confidence < 0.3 ? 'reckless' :
      confidence > 0.8 ? 'paranoid' : 'balanced';

    const stats = new SessionStats({
      session_id: sessionId,
      total_popups: total,
      total_correct: correct,
      total_mistakes: mistakes,
      false_positives: falsePos,
      false_negatives: falseNeg,
      avg_reaction_time_ms: avgTime,
      reaction_score: reactionScore,
      confidence_score: confidence,
      confidence_rating
    });

    await stats.save();
    res.status(201).json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
