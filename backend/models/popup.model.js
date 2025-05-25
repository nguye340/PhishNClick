import mongoose from 'mongoose';

const UI_TYPES = [
  'system_alert',           // Windows/Mac system style, for critical warnings or general OS pop-ups
  'browser_notification',   // Browser native style, for site notifications or small banners
  'login_form',             // Mimics a brand's login page/modal
  'software_installer',     // Mimics a software update or installation dialog
  'reward_survey',          // Looks like a prize claim, survey, or giveaway page
  'chat_message',           // Mimics messaging apps like Slack or Teams
  'email_preview',          // Appears as an email snippet or full email within the UI
  'qr_code_display',        // Displays a QR code for scanning
  'generic_ad',             // A standard, often intrusive, advertisement
  'phone_call_ui',          // Mimics a phone call interface
  'video_player_overlay'    // A pop-up appearing over a video player
];

const CATEGORIES = [
  'brand_impersonation',    // Phishing attempts mimicking known brands
  'security_warning',       // Alerts falsely claiming security issues (viruses, breaches)
  'prize_reward',           // Offers of prizes, gifts, or survey rewards (can be benign or scam)
  'software_update_scam',   // Fake software updates leading to malware
  'subscription_scam',      // False claims about subscriptions, payments, or trials
  'ai_enhanced_threat',     // Threats leveraging AI (deepfakes, personalized social engineering)
  'multi_channel_phishing', // Threats spread across multiple communication platforms
  'bec_fraud',              // Business Email Compromise/CEO fraud style
  'credential_harvesting',  // Specifically designed to steal login credentials
  'tech_support_scam',      // Fake tech support trying to gain access/money
  'adware_malware',         // General intrusive ads or direct malware attempts
  'benign_notification',    // Legitimate, non-malicious system or site notifications
  'neutral_ad'              // Harmless, typically unwanted, advertisements
];

const SUBTYPES = [
  // Brand Impersonation
  'microsoft_office365', 'google_gmail', 'amazon', 'facebook_meta',
  'banking_generic', 'apple_support', 'government_irs', 'shipping_company',

  // Security Warning
  'virus_infection', 'fake_antivirus', 'account_suspension',
  'credit_fraud', 'data_breach_alert', 'password_expiration',

  // Prize/Reward
  'contest_winner', 'gift_card', 'survey_reward', 'loyalty_program', 'lottery_scam',

  // Software Update Scam
  'browser_update_fake', 'security_patch_fake', 'driver_update_fake', 'plugin_install_fake',
  'ransomware_alert', 'trojan_download',

  // Subscription Scam
  'renewal_notice_fake', 'payment_failure_fake', 'trial_expiration_scam', 'upgrade_offer_scam',

  // AI Enhanced Threat
  'deepfake_executive', 'ai_voice_spoofing', 'personalized_social_engineering',

  // Multi-Channel Phishing
  'slack_teams_mimic', 'social_media_alert_fake', 'qr_code_phishing', 'sms_phishing',

  // BEC Fraud
  'executive_impersonation', 'financial_access_request', 'wire_transfer_request', 'vendor_payment_diversion',

  // Credential Harvesting
  'cloud_service_login_phish', 'sso_mimic_phish', 'mfa_bypass_attempt', 'password_reset_phish',

  // Tech Support Scam
  'fake_tech_support_call', 'remote_access_request',

  // Adware/Malware
  'unwanted_software_install', 'browser_redirect', 'excessive_ads',

  // Benign/Neutral (These are typically `is_malicious: false`)
  'legitimate_cookie_consent', 'legitimate_newsletter_signup', 'legitimate_software_update',
  'legitimate_prize_notification', 'generic_website_ad'
];

const CORRECT_ACTIONS = [
  // For Malicious Popups (where ANY direct interaction is a FAIL)
  'FORCE_CLOSE_OS_LEVEL',       // Close browser/app via Task Manager/Alt+F4/Force Quit
  'VERIFY_LEGITIMACY_EXTERNALLY', // Open new tab and check official site, don't use popup links
  'REPORT_AND_IGNORE',          // Identify as phishing, report, and don't interact (e.g., for emails)
  'IGNORE_UNTIL_AUTOCLOSE',     // Let it time out without interaction

  // For Benign Popups (where specific interaction is required for success)
  'ACCEPT_OFFER',               // Click "Accept" or "OK" on a safe, desired prompt
  'DECLINE_OFFER',              // Click "Decline" or "No Thanks" on a safe, unwanted prompt
  'PROCEED_LEGITIMATE_LOGIN',   // Enter credentials on a legitimate login form (rare in popups)
  'CLOSE_LEGITIMATE_NATIVE',    // Click 'X' or 'Close' button on a safe, native pop-up
  'COMPLETE_LEGITIMATE_ACTION', // Fulfill a safe, requested action (e.g., answer benign survey)
  'HANG_UP_CALL',               // For tech support scams delivered via phone call
  'NO_SPECIFIC_ACTION_NEEDED'   // For purely informational or harmless pop-ups that don't need closing
];

const INDICATOR_TYPES = [
  'suspicious_url', 'spelling_grammar_error', 'urgency_threat_language',
  'generic_greeting', 'mismatched_domain', 'unexpected_request',
  'poor_design_quality', 'too_good_to_be_true', 'unusual_sender',
  'fake_progress_bar', 'non_dismissible_alert', 'unusual_content', 'browser_redirect', 'excessive_ads' // Added `unusual_content`
];



const popupSchema = new mongoose.Schema({
  // Basic popup content
  title: { type: String, required: true },
  message: { type: String, required: true },
  
  // Core classification (drives UI design)
  // type: { 
  //   type: String, 
  //   enum: ['malicious', 'benign', 'neutral'], 
  //   required: true 
  // },
  // Core popup intention/classification (for game logic, separate from UI)
  is_malicious: { type: Boolean, required: true, description: "True if malicious (phishing, malware), False if benign/neutral." },

  
  // UI Rendering Classification (Primary driver for frontend template)
  ui_type: {
    type: String,
    enum: UI_TYPES,
    required: true,
    description: "Determines the primary UI template for the popup. This is for visual rendering."
  },
  
  // Threat Classification (For educational feedback to the user)
  category: {
    type: String,
    enum: CATEGORIES,
    required: true,
    description: "The general classification of the threat or popup type, for player education."
  },

// Specific subtype within the category (For fine-tuned educational feedback)
  subtype: {
    type: String,
    enum: SUBTYPES,
    required: false, // Subtype can be optional if not all categories require it
    description: "A more specific classification within the category, for player education."
  },
  
  // Brand/visual elements (simplified)
  brand_elements: {
    impersonated_brand_name: String, // e.g., "Microsoft", "Amazon", "TD Bank"
    logo_url: String, // URL to the specific logo for this popup
  },
  
  // Interactive elements for the UI, allowing variability without complex enums
  buttons: [{
    text: String,
    is_safe: Boolean, // True if clicking this button is safe/correct, False if malicious/incorrect
    //action_payload: mongoose.Schema.Types.Mixed // URL, download link, or other game-specific action data
  }],
  
  // Correct player action - THE single correct response for the player
  correct_action: {
    type: String,
    enum: CORRECT_ACTIONS,
    required: true,
    description: "The single correct action for the player to take to resolve the popup safely and effectively."
},

  // Threat indicators (IoCs) - This IS a list/array
  indicators_of_compromise: [{
    element: String, // What UI element contains the IoC (e.g., "URL", "Sender Name", "Button Text")
    indicator_type: {
        type: String,
        enum: INDICATOR_TYPES
    },
    description: String, // A short description of the specific issue
    severity: { type: String, enum: ['low', 'medium', 'high'] }
  }],

  // Game mechanics (optional, depending on complexity)
  difficulty_level: {
    type: String,
    enum: ['easy', 'medium', 'hard', 'expert'],
    default: 'easy'
  },
  time_limit_ms: { type: Number, default: 0 }, // 0 means no time limit
  
  // Educational content
  explanation: {
    why_this_popup_is_X_type: String,
    what_to_look_for: [String],
    real_world_impact: String,
    prevention_tips: [String]
  },
  
  // MITRE ATT&CK mapping
  mitre_technique: {
    technique_id: String, // T1566.002
    technique_name: String, // Spearphishing Link
    tactic: String // Initial Access
  },
  
  // Metadata
  created_date: { type: Date, default: Date.now },
  //difficulty_rating: { type: Number, min: 1, max: 10 },
  //success_rate: Number, // Percentage of players who handle correctly
  //tags: [String] // Optional For searching/filtering
});

// --- Mongoose Pre-save Hook for Validation ---
// This ensures that `ui_type` always aligns logically with `category` and `subtype`.
// This logic runs every time a Popup document is saved or updated.
popupSchema.pre('save', function(next) {
  const { ui_type, category, subtype } = this;

  // --- Define Allowed UI Types per Category ---
  // This is your rulebook. Adjust these lists as needed for your game's realism and design.
  const allowedUiTypesByCategory = {
      'brand_impersonation': ['login_form', 'email_preview', 'chat_message', 'qr_code_display'],
      'security_warning': ['system_alert', 'browser_notification', 'software_installer', 'video_player_overlay'],
      'prize_reward': ['reward_survey', 'generic_ad', 'email_preview'],
      'software_update_scam': ['software_installer', 'system_alert', 'browser_notification', 'video_player_overlay'],
      'subscription_scam': ['reward_survey', 'generic_ad', 'email_preview'],
      'ai_enhanced_threat': ['login_form', 'chat_message', 'email_preview', 'phone_call_ui', 'video_player_overlay'],
      'multi_channel_phishing': ['chat_message', 'email_preview', 'qr_code_display', 'browser_notification'],
      'bec_fraud': ['email_preview', 'chat_message'],
      'credential_harvesting': ['login_form', 'email_preview', 'qr_code_display'],
      'tech_support_scam': ['phone_call_ui', 'system_alert', 'browser_notification'],
      'adware_malware': ['generic_ad', 'system_alert', 'browser_notification', 'video_player_overlay', 'software_installer'],
      'benign_notification': ['browser_notification', 'system_alert', 'generic_ad', 'reward_survey', 'software_installer', 'email_preview'],
      'neutral_ad': ['generic_ad', 'browser_notification', 'video_player_overlay']
  };

  // 1. Validate if the ui_type is generally allowed for the chosen category.
  if (allowedUiTypesByCategory[category] && !allowedUiTypesByCategory[category].includes(ui_type)) {
      return next(new Error(
          `Validation Error: For category '${category}', ui_type '${ui_type}' is not a generally allowed visual presentation.`
      ));
  }

  // 2. Add more specific subtype-level validation rules (if needed).
  // These rules will override or further restrict the category-level rules.
  // This is where we put our "Security warning subtypes should only have system_alert or browser_notification" type rules.

  if (category === 'security_warning') {
      switch (subtype) {
          case 'virus_infection':
          case 'fake_antivirus':
              // These specific security warnings are most commonly system alerts or browser notifications
              if (!['system_alert', 'browser_notification', 'software_installer'].includes(ui_type)) {
                  return next(new Error(
                      `Validation Error: For '${subtype}' subtype, ui_type '${ui_type}' is too specific.`
                  ));
              }
              break;
          case 'tech_support_scam':
              // A tech support scam often presents as a phone call or system alert
              if (!['phone_call_ui', 'system_alert', 'browser_notification'].includes(ui_type)) {
                  return next(new Error(
                      `Validation Error: For 'tech_support_scam' subtype, ui_type '${ui_type}' is not suitable.`
                  ));
              }
              break;
          // Add more subtype-specific rules here as the content grows.
      }
  }

  if (category === 'brand_impersonation' && ui_type !== 'login_form' && ui_type !== 'email_preview' && ui_type !== 'chat_message' && ui_type !== 'qr_code_display') {
      // Most brand impersonations will look like a login, email, or chat, or use QR codes
      // This is a more general rule for brand impersonation
      return next(new Error(
          `Validation Error: Brand impersonation usually presents as a login form, email, chat, or QR code. ui_type '${ui_type}' is unusual.`
      ));
  }


  // If all validation passes, proceed with saving the document
  next();
});

// Indexes for performance
popupSchema.index({ category: 1, subtype: 1 });
popupSchema.index({ ui_type: 1 }); // For fast UI template selection
popupSchema.index({ difficulty_level: 1 });
popupSchema.index({ mitre_technique: 1 });

const Popup = mongoose.models.Popup || mongoose.model('Popup', popupSchema);
export default Popup;

// const popupSchema = new mongoose.Schema({
//   title: { type: String, required: true },
//   message: { type: String, required: true },
//   type: { type: String, enum: ['malicious', 'benign', 'neutral'], required: true },//malicious: phishing, benign: non-phishing, neutral: unknown - gray zone threats
//   subtype: String,
//   category: String,
//   correct_action: { type: String, enum: ['click', 'close', 'ignore'], required: true },
//   close_method: 
//   {
//     type: String,
//     enum: [
//         'click_x',        // standard X in top-right
//         'click_x_after_time',  // small X in top-right after a delay
//         'click_button',   // a big "CLOSE" or "CANCEL" button (mostly likely fake, but close the popup anyway)
//         'slide_away',     // swipe (like mobile ad)
//         'run_antivirus',  // open antivirus and scan to close
//         'hang_up',        // hang up the phone
//         'drag_to_trash',  // click and drag the popup to a trash icon
//         'shake_to_close', // shake the device to close the popup
//         'solve_puzzle',   // complete a mini-challenge or pattern
//         'click_all_iocs', // must click all IoC elements first
//         'no_action'       // close by itself, the correct response is to ignore
//     ]
//   },
//   time_sensitive: Boolean,
//   action_time_limit_ms: { type: Number, default: 10000 }, //before things goes wrong/expire
//   hint: String
// });

// const Popup = mongoose.models.Popup || mongoose.model('Popup', popupSchema);
// export default Popup;
