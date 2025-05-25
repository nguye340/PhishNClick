import mongoose from 'mongoose';

const popupSchema = new mongoose.Schema({
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['malicious', 'benign', 'neutral'], required: true },
  subtype: String,
  category: String,
  correct_action: { type: String, enum: ['click', 'close', 'ignore'], required: true },
  close_method: 
  {
    type: String,
    enum: [
        'click_x',        // standard small X in top-right
        'click_button',   // a big "CLOSE" or "CANCEL" button (mostly likely fake, but close the popup anyway)
        'slide_away',     // swipe (like mobile ad)
        'drag_to_trash',  // click and drag the popup to a trash icon
        'shake_to_close', // shake the device to close the popup
        'solve_puzzle',   // complete a mini-challenge or pattern
        'click_all_iocs', // must click all IoC elements first
        'no_action'       // close by itself, the correct response is to ignore
    ]
  },
  time_sensitive: Boolean,
  action_time_limit_ms: { type: Number, default: 10000 }, //before things goes wrong/expire
  hint: String
});

module.exports = mongoose.model('Popup', popupSchema);
