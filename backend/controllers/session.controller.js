
import Session from '../models/session.model.js';

exports.startSession = async (req, res) => {
  try {
    const session = new Session({ user_id: req.body.user_id, mode: req.body.mode });
    await session.save();
    res.status(201).json(session);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.endSession = async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.sessionId, { end_time: new Date() }, { new: true });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
