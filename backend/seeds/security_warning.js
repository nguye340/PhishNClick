// seedData/securityWarningPopups.js

const securityWarningPopups = [
    // --- Subtype: 'virus_infection' ---
    {
      title: "Urgent: Virus Detected on Your System!",
      message: "A critical virus has been detected on your computer. Your files are at risk. Run a full scan immediately to remove the threat.",
      is_malicious: true,
      ui_type: "system_alert", // Mimics an OS-level warning
      category: "security_warning",
      subtype: "virus_infection",
      brand_elements: {
        impersonated_brand_name: "Windows Security",
        logo_url: "https://cdn-icons-png.flaticon.com/512/9778/9778059.png", // Generic virus alert icon
      },
      buttons: [
        { text: "Scan Now", is_safe: false },
        { text: "Dismiss", is_safe: false }, // Even dismiss might lead to something
      ],
      correct_action: "FORCE_CLOSE_OS_LEVEL", // Force close the browser/app
      indicators_of_compromise: [
        { element: "Title/Message", indicator_type: "urgency_threat_language", description: "Uses alarming terms like 'Urgent', 'critical virus', 'files at risk' to create panic.", severity: "high" },
        { element: "Pop-up Behavior", indicator_type: "non_dismissible_alert", description: "The alert is sticky or difficult to close, sometimes preventing normal computer use.", severity: "high" },
        { element: "Pop-up Origin", indicator_type: "unexpected_request", description: "The warning appeared unexpectedly from a website, not your installed antivirus.", severity: "medium" },
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a fake virus infection warning, a common tactic to scare users into downloading fake antivirus software (malware) or calling a tech support scammer.",
        what_to_look_for: ["Aggressive, persistent warnings about viruses from unknown sources.", "Pop-ups that try to lock your browser or computer screen.", "Prompts to immediately download or call a number for 'support'."],
        real_world_impact: "Clicking 'Scan Now' or similar buttons can lead to malware installation, identity theft, or ransomware.",
        prevention_tips: ["Legitimate antivirus software runs in the background and notifies you through its own interface, not unexpected pop-ups.", "Never click on pop-ups that claim to have detected a virus. Close the browser/app immediately via Task Manager/Force Quit.", "Keep your operating system and antivirus software updated."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'fake_antivirus' ---
    {
      title: "Your PC is Infected! Remove Threats Now!",
      message: "Your system has been compromised by 7 viruses and 3 malware. Your personal data is not safe. Download 'SecureDefender Pro' to clean your PC.",
      is_malicious: true,
      ui_type: "software_installer", // Mimics antivirus software or a scan result
      category: "security_warning",
      subtype: "fake_antivirus",
      brand_elements: {
        impersonated_brand_name: "SecureDefender Pro (Fake Antivirus)",
        logo_url: "https://cdn-icons-png.flaticon.com/512/2777/2777205.png", // Generic security shield icon
      },
      buttons: [
        { text: "Download Now", is_safe: false },
        { text: "Cancel", is_safe: false }, // Often non-functional or leads to another malicious action
      ],
      correct_action: "FORCE_CLOSE_OS_LEVEL",
      indicators_of_compromise: [
        { element: "Software Name", indicator_type: "unusual_content", description: "Promotes an unknown or generic-sounding antivirus software like 'SecureDefender Pro'.", severity: "medium" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Exaggerated threat numbers ('7 viruses and 3 malware') and fear-mongering.", severity: "high" },
        { element: "Design", indicator_type: "poor_design_quality", description: "Often looks slightly off, unprofessional, or uses generic stock images.", severity: "low" },
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a fake antivirus scam (also known as 'rogue antivirus'), which attempts to sell you fraudulent software that claims to remove non-existent threats, or installs actual malware.",
        what_to_look_for: ["Pop-ups that claim to have scanned your system and found numerous threats without your initiation.", "Prompts to download unknown 'security' software.", "Interfaces that look like legitimate antivirus but appear suddenly and aggressively."],
        real_world_impact: "Downloading and running fake antivirus software can lead to actual malware infections, system instability, and financial loss if you pay for the fake product.",
        prevention_tips: ["Only use reputable and well-known antivirus software.", "Never download security software from pop-ups or unfamiliar websites.", "Regularly update your legitimate antivirus software and perform scans."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'account_suspension' ---
    {
      title: "Your Account Has Been Suspended!",
      message: "Due to suspicious activity, your account has been temporarily suspended. Verify your identity immediately to restore access.",
      is_malicious: true,
      ui_type: "login_form", // Often redirects to a fake login page
      category: "security_warning",
      subtype: "account_suspension",
      brand_elements: {
        impersonated_brand_name: "Generic Online Service",
        logo_url: "https://cdn-icons-png.flaticon.com/512/2698/2698545.png", // Generic user account icon
      },
      buttons: [
        { text: "Verify Account", is_safe: false },
        { text: "Contact Support", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Uses 'suspended' and 'immediately' to create panic and bypass critical thinking.", severity: "high" },
        { element: "URL", indicator_type: "mismatched_domain", description: "The verification link leads to a URL that is not the official service's domain (e.g., 'account-secure-verify.net').", severity: "high" },
        { element: "Greeting", indicator_type: "generic_greeting", description: "Uses a generic greeting like 'Dear User' instead of your name.", severity: "low" },
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a phishing attempt disguised as an account suspension warning, aiming to steal your login credentials or personal information.",
        what_to_look_for: ["Unexpected notifications about account suspension from services you use.", "Links that ask you to 'verify' your identity or login credentials.", "Generic greetings or a lack of specific account details."],
        real_world_impact: "Entering your credentials on a fake verification page will give attackers access to your account, leading to data breaches or financial fraud.",
        prevention_tips: ["Never click on links in suspicious emails or pop-ups about account issues. Instead, go directly to the service's official website or app.", "If you're concerned, contact the company's official support channels directly."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'credit_fraud' ---
    {
      title: "Fraud Alert: Unauthorized Transaction Detected!",
      message: "An unusual transaction of $849.99 was attempted on your card. Click 'Review Activity' to confirm or dispute this charge immediately.",
      is_malicious: true,
      ui_type: "email_preview", // Often appears as a fake bank/credit card email
      category: "security_warning",
      subtype: "credit_fraud",
      brand_elements: {
        impersonated_brand_name: "Your Bank / Credit Card Company",
        logo_url: "https://cdn-icons-png.flaticon.com/512/8983/8983163.png", // Generic credit card icon
      },
      buttons: [
        { text: "Review Activity", is_safe: false },
        { text: "Dispute Charge", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "Sender Email", indicator_type: "unusual_sender", description: "The sender's email address is suspicious or not from your bank's official domain (e.g., 'alerts@bankservice.info').", severity: "high" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Demands immediate action to 'confirm or dispute' a charge.", severity: "medium" },
        { element: "Transaction Details", indicator_type: "unusual_content", description: "The transaction amount or merchant might seem unfamiliar or slightly off.", severity: "low" },
      ],
      difficulty_level: "hard",
      explanation: {
        why_this_popup_is_X_type: "This is a credit fraud phishing scam, aiming to get you to click a malicious link or provide sensitive financial information under the guise of a fraud alert.",
        what_to_look_for: ["Unsolicited fraud alerts from your bank or credit card company.", "Links that ask you to 'verify' transactions or account details.", "Any request for full credit card numbers, CVV, or PINs via email or pop-up."],
        real_world_impact: "Clicking the link can lead to fake banking sites designed to steal your financial credentials, resulting in unauthorized transactions or identity theft.",
        prevention_tips: ["If you receive a fraud alert, do not click links in the email or pop-up. Instead, log in directly to your bank's official website or app, or call the number on the back of your credit card.", "Banks will rarely ask for sensitive information via email."],
      },
      mitre_technique: { technique_id: "T1566.001", technique_name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'data_breach_alert' ---
    {
      title: "Important Data Breach Notification!",
      message: "We regret to inform you that your personal information may have been compromised in a recent data breach. Click to secure your account.",
      is_malicious: true,
      ui_type: "browser_notification", // Could be a browser notification or a full web page popup
      category: "security_warning",
      subtype: "data_breach_alert",
      brand_elements: {
        impersonated_brand_name: "Generic Service",
        logo_url: "https://cdn-icons-png.flaticon.com/512/18266/18266417.png", // Generic data breach/lock icon
      },
      buttons: [
        { text: "Secure Account Now", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "Source", indicator_type: "unusual_sender", description: "The alert comes from an unfamiliar or generic sender/website, not the breached company.", severity: "high" },
        { element: "Message Body", indicator_type: "generic_greeting", description: "Doesn't specify which company or breach, uses vague terms.", severity: "low" },
        { element: "URL", indicator_type: "suspicious_url", description: "The 'secure account' link leads to a non-official domain.", severity: "high" },
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a data breach phishing scam, exploiting real-world fears about data breaches to trick users into revealing sensitive information or clicking malicious links.",
        what_to_look_for: ["Generic data breach notifications without specifying the affected company or your specific account.", "Links that prompt you to 'secure' or 'change password' outside of the official service's website.", "Vague details about the breach itself."],
        real_world_impact: "Clicking the link can lead to credential harvesting for your various online accounts, or attempts to install malware.",
        prevention_tips: ["If you hear about a data breach, visit the official company's website directly (type the URL) or use a reputable news source to confirm. Do not trust pop-ups or emails.", "Use strong, unique passwords for all your online accounts and enable MFA."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'password_expiration' ---
    {
      title: "Your Password Will Expire in 24 Hours!",
      message: "Your current password for your online account is set to expire soon. Update your password now to avoid service interruption.",
      is_malicious: true,
      ui_type: "email_preview", // Commonly delivered via email
      category: "security_warning",
      subtype: "password_expiration",
      brand_elements: {
        impersonated_brand_name: "Generic Online Service",
        logo_url: "https://cdn-icons-png.flaticon.com/512/5619/5619921.png", // Generic password/lock icon
      },
      buttons: [
        { text: "Update Password", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "Sender Email", indicator_type: "unusual_sender", description: "The sender's email address is not the official domain of the service (e.g., 'security-update@account-notify.com').", severity: "high" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Threatens 'service interruption' to create a sense of urgency.", severity: "medium" },
        { element: "URL", indicator_type: "mismatched_domain", description: "The password update link leads to a suspicious or non-official domain.", severity: "high" },
      ],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a password expiration phishing scam, designed to trick you into entering your credentials on a fake page, allowing attackers to steal your account.",
        what_to_look_for: ["Unsolicited email or pop-ups about password expiration for accounts you don't recall setting up with expiration.", "Links that direct you to external sites to 'update' your password.", "Generic messages that don't refer to your specific account or username."],
        real_world_impact: "Entering your current and new password on a fake site allows attackers to immediately gain access to your account and potentially change your real password, locking you out.",
        prevention_tips: ["Never click on password reset/expiration links in emails or pop-ups. Always go directly to the service's official website and initiate the password change from there.", "Enable Multi-Factor Authentication (MFA) for all your accounts."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  ];
  
  export default securityWarningPopups;