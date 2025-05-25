
import PopupEvent from '../models/popupEvent.model.js';
import Session from '../models/session.model.js';
import Popup from '../models/popup.model.js';

export const recordPopupEvent = async (req, res) => {
  try {
    if (!(await Session.findById(req.body.session_id))) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!(await Popup.findById(req.body.popup_id))) {
      return res.status(404).json({ message: "Popup not found" });
    }

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
