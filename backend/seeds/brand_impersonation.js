import mongoose from 'mongoose';
import Popup from '../models/popup.model.js'; 

const brandImpersonationPopups = [
  // --- Subtype: 'microsoft_office365' ---
  {
    title: "Action Required: Verify Your Office 365 Account",
    message: "Your Office 365 subscription is about to expire. Verify your account to avoid service interruption and data loss.",
    is_malicious: true,
    ui_type: "login_form", // Aligns with 'brand_impersonation' category
    category: "brand_impersonation",
    subtype: "microsoft_office365",
    brand_elements: {
      impersonated_brand_name: "Microsoft Office 365",
      logo_url: "https://www.pinclipart.com/picdir/middle/7-77422_microsoft-office-365-icon-clipart.png",
    },
    buttons: [
      { text: "Verify Account", is_safe: false/*, action_payload: "https://malicious-office.com/login" */},
      { text: "Learn More", is_safe: false/*, action_payload: "https://malicious-office.com/info" */},
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "URL", indicator_type: "mismatched_domain", description: "The URL is 'office-verify-secure.net' instead of 'login.microsoftonline.com'.", severity: "high" },
      { element: "Message Body", indicator_type: "urgency_threat_language", description: "Threatens 'service interruption and data loss' to create panic.", severity: "medium" },
    ],
    difficulty_level: "medium",
    explanation: {
      why_this_popup_is_X_type: "This is a brand impersonation phishing attempt, specifically targeting Microsoft Office 365 users by mimicking a login page.",
      what_to_look_for: ["Suspicious URLs that don't match the official brand's domain.", "Threatening language or warnings of account closure/data loss.", "Poor design quality or slight variations in logos."],
      real_world_impact: "Entering your credentials on this fake page would allow attackers to steal your Office 365 account, gaining access to your emails, documents, and other sensitive data.",
      prevention_tips: ["Always verify the URL before entering login details.", "Never click links in suspicious emails or pop-ups. Go directly to the official website.", "Enable Multi-Factor Authentication (MFA) on your accounts."],
    },
    mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
  },

  // --- Subtype: 'google_gmail' ---
  {
    title: "Suspicious Login Attempt on Your Gmail Account",
    message: "Someone recently tried to sign in to your Google Account from an unrecognized device. Review this activity now.",
    is_malicious: true,
    ui_type: "email_preview", // Aligns with 'brand_impersonation'
    category: "brand_impersonation",
    subtype: "google_gmail",
    brand_elements: {
      impersonated_brand_name: "Google/Gmail",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Gmail_icon_%282020%29.svg/768px-Gmail_icon_%282020%29.svg.png", // Replace with actual URL
    },
    buttons: [
      { text: "Review Activity", is_safe: false/*, action_payload: "https://accounts-google-security.info/check" */},
      { text: "Secure Your Account", is_safe: false/*, action_payload: "https://accounts-google-security.info/secure" */},
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "Sender Email", indicator_type: "mismatched_domain", description: "Sender email is 'security-alerts@googl3.com' (with a '3') instead of 'no-reply@accounts.google.com'.", severity: "high" },
      { element: "Message Body", indicator_type: "urgency_threat_language", description: "Uses phrases like 'Suspicious Login Attempt' and 'review this activity now' to create urgency.", severity: "medium" },
    ],
    difficulty_level: "medium",
    explanation: {
      why_this_popup_is_X_type: "This is a brand impersonation phishing email, mimicking a Google security alert to trick you into clicking a malicious link.",
      what_to_look_for: ["Slight misspellings or unusual characters in the sender's email address or URL.", "Emails that create fear or urgency about your account security."],
      real_world_impact: "Clicking the link could lead to a fake Google login page designed to steal your credentials or install malware.",
      prevention_tips: ["Always check the sender's email address carefully.", "If you receive a security alert, go directly to the service's official website or app to check for notifications, don't use links in the email."],
    },
    mitre_technique: { technique_id: "T1566.001", technique_name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" }, // Could lead to attachment, or link
  },

  // --- Subtype: 'amazon' ---
  {
    title: "Your Amazon Account is On Hold",
    message: "We've placed your Amazon account on hold due to unusual activity. Update your billing information to reactivate.",
    is_malicious: true,
    ui_type: "login_form", // Can be a login form for billing update
    category: "brand_impersonation",
    subtype: "amazon",
    brand_elements: {
      impersonated_brand_name: "Amazon",
      logo_url: "https://pngimg.com/uploads/amazon/amazon_PNG17.png", // Replace with actual URL
    },
    buttons: [
      { text: "Update Now", is_safe: false/*, action_payload: "https://amazon-payment-verify.biz/update" */},
      { text: "Contact Support", is_safe: false/*, action_payload: "https://amazon-payment-verify.biz/support" */},
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "Message Body", indicator_type: "generic_greeting", description: "Uses 'Dear Customer' instead of your name.", severity: "low" },
      { element: "URL", indicator_type: "suspicious_url", description: "The URL 'amazon-payment-verify.biz' is not Amazon's official domain.", severity: "high" },
      { element: "Overall Design", indicator_type: "poor_design_quality", description: "Slight misalignment of elements and incorrect font usage compared to official Amazon site.", severity: "medium" }
    ],
    difficulty_level: "medium",
    explanation: {
      why_this_popup_is_X_type: "This is an Amazon brand impersonation scam, attempting to steal your payment or login information by claiming an account hold.",
      what_to_look_for: ["Generic greetings instead of your personalized name.", "Unusual URLs, even if they contain the brand name.", "Promises of immediate action required for account reactivation."],
      real_world_impact: "Providing your billing information on a fake site could lead to credit card fraud or identity theft.",
      prevention_tips: ["Always check your Amazon account directly via the app or website for any alerts, don't rely on pop-ups or emails.", "Never enter sensitive financial information on a site unless you are certain it's legitimate."],
    },
    mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
  },

  // --- Subtype: 'facebook_meta' ---
  {
    title: "Your Facebook Page is Scheduled for Deletion",
    message: "We detected unusual activity on your Facebook page that violates our Community Standards. Your page will be unpublished in 24 hours.",
    is_malicious: true,
    ui_type: "chat_message", // Mimicking a support chat/notification
    category: "brand_impersonation",
    subtype: "facebook_meta",
    brand_elements: {
      impersonated_brand_name: "Facebook/Meta",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png", // Replace with actual URL
    },
    buttons: [
      { text: "Appeal Now", is_safe: false/*, action_payload: "https://facebook-appeal.site/violation" */},
      { text: "Dismiss", is_safe: false/*, action_payload: "phish_consequence" */},
    ],
    correct_action: "REPORT_AND_IGNORE",
    indicators_of_compromise: [
      { element: "Message Body", indicator_type: "urgency_threat_language", description: "Immediate deletion threat ('will be unpublished in 24 hours').", severity: "high" },
      { element: "URL", indicator_type: "mismatched_domain", description: "The appeal link goes to 'facebook-appeal.site', not a meta.com or facebook.com domain.", severity: "high" },
    ],
    difficulty_level: "hard",
    explanation: {
      why_this_popup_is_X_type: "This is a Facebook/Meta brand impersonation, attempting to leverage fear of account deletion to trick you into clicking a malicious link, potentially to steal your credentials or Page access.",
      what_to_look_for: ["Extreme urgency or threats of account termination.", "Any links that ask you to 'verify' or 'appeal' outside of the official platform's secure methods.", "Unusual communication channels for such important alerts."],
      real_world_impact: "Clicking the link could lead to your Facebook account being compromised, or your page being taken over by attackers.",
      prevention_tips: ["If you receive such an alert, go directly to Facebook.com and check your support inbox or notifications within the platform.", "Never click links from unexpected sources that claim violations or account problems."],
    },
    mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
  },

  // --- Subtype: 'banking_generic' ---
  {
    title: "Important Security Alert: Your Bank Account",
    message: "For your security, we have temporarily locked your online banking access due to unusual activity. Please verify your identity immediately.",
    is_malicious: true,
    ui_type: "login_form", // Commonly a fake login page
    category: "brand_impersonation",
    subtype: "banking_generic",
    brand_elements: {
      impersonated_brand_name: "TD Bank",
      logo_url: "https://upload.wikimedia.org/wikipedia/commons/a/a4/Toronto-Dominion_Bank_logo.svg", // Replace with actual URL, or use a generic one
    },
    buttons: [
      { text: "Verify Now", is_safe: false/*, action_payload: "https://secure-bank-login.biz/verify" */},
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "URL", indicator_type: "mismatched_domain", description: "The URL is 'secure-bank-login.biz' instead of your bank's official domain.", severity: "high" },
      { element: "Message Body", indicator_type: "urgency_threat_language", description: "Uses 'temporarily locked' and 'verify your identity immediately' to create panic.", severity: "medium" },
      { element: "Greeting", indicator_type: "generic_greeting", description: "Starts with 'Dear Valued Customer' instead of your name.", severity: "low" }
    ],
    difficulty_level: "medium",
    explanation: {
      why_this_popup_is_X_type: "This is a generic banking phishing scam, attempting to steal your online banking credentials by claiming your account is locked.",
      what_to_look_for: ["Unusual URLs that do not belong to your actual bank.", "Threats of account suspension or locking if immediate action isn't taken.", "Generic greetings rather than your name."],
      real_world_impact: "Providing your banking credentials could lead to unauthorized access to your accounts, financial theft, or identity fraud.",
      prevention_tips: ["Never click links in emails or pop-ups regarding your bank account. Always type your bank's official URL directly into your browser.", "Be suspicious of any urgent demands for personal information."],
    },
    mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
  },

  // --- Subtype: 'apple_support' ---
  {
    title: "Your Apple ID has been Locked for Security Reasons",
    message: "Access to your Apple ID has been restricted due to multiple failed login attempts. Visit Apple Support to unlock your account.",
    is_malicious: true,
    ui_type: "system_alert", // Can appear as a macOS system alert
    category: "brand_impersonation",
    subtype: "apple_support",
    brand_elements: {
      impersonated_brand_name: "Apple Support",
      logo_url: "https://cdn.jim-nielsen.com/ios/1024/apple-support-2017-06-07.png?rf=1024", // Replace with actual URL
    },
    buttons: [
      { text: "Unlock Account", is_safe: false/*, action_payload: "https://appleid-support-recover.com/unlock" */},
      { text: "Dismiss", is_safe: false/*, action_payload: "phish_consequence" */},
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "URL", indicator_type: "suspicious_url", description: "The URL 'appleid-support-recover.com' is not a legitimate Apple domain.", severity: "high" },
      { element: "Message Body", indicator_type: "urgency_threat_language", description: "Threatens account restriction to force immediate action.", severity: "medium" },
      { element: "Pop-up Behavior", indicator_type: "non_dismissible_alert", description: "The pop-up is difficult to close and persists on screen.", severity: "medium" }
    ],
    difficulty_level: "hard",
    explanation: {
      why_this_popup_is_X_type: "This is an Apple Support brand impersonation, attempting to trick you into clicking a malicious link by claiming your Apple ID is locked.",
      what_to_look_for: ["Pop-ups that appear unexpectedly and are difficult to close, especially on macOS.", "Alerts that demand immediate action to unlock accounts.", "Links that lead to non-Apple domains, even if they look convincing."],
      real_world_impact: "Clicking the link and providing your Apple ID credentials could lead to your account being compromised, affecting all your Apple devices and services.",
      prevention_tips: ["Never click links in unexpected alerts about your Apple ID. Go directly to Apple's official website or use your device's settings to check account status.", "Be wary of pop-ups that try to prevent you from closing them normally."],
    },
    mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
  },

  // --- Subtype: 'government_irs' ---
  {
    title: "Important Tax Notification: Pending Refund",
    message: "You have a pending tax refund from the IRS. Click here to claim your refund and update your payment information.",
    is_malicious: true,
    ui_type: "email_preview", // Commonly delivered via email
    category: "brand_impersonation",
    subtype: "government_irs",
    brand_elements: {
      impersonated_brand_name: "IRS (Internal Revenue Service)",
      logo_url: "https://cdn.logoworks.com/wp-content/uploads/2014/04/lores_IRS_logo_blue_PD-1.jpg.webp", // Replace with actual URL
    },
    buttons: [
      { text: "Claim Refund", is_safe: false/*, action_payload: "https://irs-refund-claim.org/claim" */},
    ],
    correct_action: "REPORT_AND_IGNORE",
    indicators_of_compromise: [
      { element: "Message Body", indicator_type: "too_good_to_be_true", description: "The IRS does not initiate contact via email or pop-ups regarding refunds.", severity: "high" },
      { element: "Sender Email", indicator_type: "mismatched_domain", description: "Sender is 'irs-support@taxrefund.info' which is not an official IRS domain.", severity: "high" },
    ],
    difficulty_level: "medium",
    explanation: {
      why_this_popup_is_X_type: "This is an IRS brand impersonation scam, a common tactic to trick people into providing personal or financial information by promising a refund.",
      what_to_look_for: ["Any unsolicited contact (email, call, pop-up) from the IRS or tax agencies about refunds or audits, especially if it asks for personal information.", "Promises of unexpected refunds that are 'too good to be true.'"],
      real_world_impact: "Clicking the link could lead to identity theft, financial fraud, or the installation of malware.",
      prevention_tips: ["The IRS will never contact you by email, text message, or social media to request personal or financial information.", "If you suspect an IRS scam, contact the IRS directly via their official website or phone number."],
    },
    mitre_technique: { technique_id: "T1566.001", technique_name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" },
  },

  // --- Subtype: 'shipping_company' ---
  {
    title: "Delivery Failed: Your Package is On Hold",
    message: "We attempted to deliver your package, but the address was incorrect. Please update your details and pay a small redelivery fee.",
    is_malicious: true,
    ui_type: "browser_notification", // Can appear as a browser notification or a small pop-up
    category: "brand_impersonation",
    subtype: "shipping_company",
    brand_elements: {
      impersonated_brand_name: "FedEx/UPS/DHL (Generic)",
      logo_url: "https://www.citypng.com/public/uploads/preview/hd-fedex-shipping-company-logo-png-7017516947092607rk126a27k.png", // Replace with actual URL, or a generic shipping icon
    },
    buttons: [
      { text: "Update Delivery Info", is_safe: false/*, action_payload: "https://package-delivery-track.co/update" */},
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "Message Body", indicator_type: "unexpected_request", description: "An unexpected request for a 'redelivery fee' or 'address update' via a pop-up.", severity: "high" },
      { element: "URL", indicator_type: "mismatched_domain", description: "The link 'package-delivery-track.co' is not the official shipping company's domain.", severity: "high" },
      { element: "Greeting", indicator_type: "generic_greeting", description: "Doesn't specify a tracking number or your name.", severity: "low" }
    ],
    difficulty_level: "easy",
    explanation: {
      why_this_popup_is_X_type: "This is a common shipping company brand impersonation scam, attempting to steal your personal information or a small payment.",
      what_to_look_for: ["Unexpected notifications about failed deliveries, especially if you're not expecting a package.", "Requests for small fees or personal information to 'redeliver' a package.", "Generic messages without specific tracking numbers."],
      real_world_impact: "Clicking the link could lead to credit card fraud, identity theft, or malware infection.",
      prevention_tips: ["If you receive a suspicious delivery notification, always track your packages directly on the official shipping company's website using a known tracking number.", "Never pay unexpected 'redelivery fees' via unfamiliar links."],
    },
    mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
  },
];

// Function to insert seed data (for your backend script)
async function seedBrandImpersonationPopups() {
  try {
    // You'd typically connect to MongoDB here if not already connected
    // await mongoose.connect('mongodb://localhost:27017/your_game_db', { useNewUrlParser: true, useUnifiedTopology: true });

    // Clear existing brand impersonation popups before inserting to prevent duplicates
    // Or, implement logic to only insert if they don't already exist
    await Popup.deleteMany({ category: 'brand_impersonation' }); 
    
    const insertedPopups = await Popup.insertMany(brandImpersonationPopups);
    console.log(`Successfully inserted ${insertedPopups.length} brand impersonation popups.`);
  } catch (error) {
    console.error("Error seeding brand impersonation popups:", error);
  } finally {
    // await mongoose.disconnect(); // Disconnect if this is a standalone script
  }
}

// Example of how you'd call this (if it's a standalone script)
// seedBrandImpersonationPopups();

// If you're importing this into another file (e.g., your main server.js),
// you'd call it from there after your database connection is established.
export default brandImpersonationPopups;