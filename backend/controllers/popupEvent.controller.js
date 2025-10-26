
import PopupEvent from '../models/popupEvent.model.js';
import Session from '../models/session.model.js';
import Popup from '../models/popup.model.js';

export const recordPopupEvent = async (req, res) => {
  try {
    // Validate session exists
    if (!(await Session.findById(req.body.session_id))) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Note: We don't validate popup_id against the Popup collection
    // because games generate dynamic popup IDs (e.g., "popup-1761437221q")
    // that don't exist in the database

    const event = new PopupEvent({
      ...req.body,
    });
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getEventsBySession = async (req, res) => {
  try {
    const events = await PopupEvent.find({ session_id: req.params.sessionId });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
