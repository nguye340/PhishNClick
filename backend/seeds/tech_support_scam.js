// seedData/techSupportScamPopups.js

const techSupportScamPopups = [
    // --- Subtype: 'fake_tech_support_call' ---
    {
      title: "Windows Defender Alert: System Malfunction Detected!",
      message: "Your computer has encountered a critical error. Do not restart your computer. Call Microsoft Support immediately at +1-888-XXX-XXXX for assistance.",
      is_malicious: true,
      ui_type: "system_alert", // Mimics a full-screen system lock or alert
      category: "tech_support_scam",
      subtype: "fake_tech_support_call",
      brand_elements: {
        impersonated_brand_name: "Microsoft Support",
        logo_url: "https://cdn-icons-png.flaticon.com/512/4116/4116423.png", // Generic tech support icon
      },
      buttons: [
        { text: "Call Now", is_safe: false }, // Button is usually a phone number displayed
        { text: "Restart (Not Recommended)", is_safe: false }, // Designed to deter legitimate action
      ],
      correct_action: "FORCE_CLOSE_OS_LEVEL", // Typically, you need to force close the browser/app
      indicators_of_compromise: [
        { element: "Phone Number", indicator_type: "unexpected_request", description: "Prompts you to call a specific phone number for 'support' directly from a pop-up.", severity: "high" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Uses alarming phrases like 'critical error', 'system malfunction', 'do not restart' to create panic.", severity: "high" },
        { element: "Pop-up Behavior", indicator_type: "non_dismissible_alert", description: "The pop-up is persistent, often locking your browser or screen, making it difficult to close.", severity: "high" },
        { element: "Branding", indicator_type: "poor_design_quality", description: "The visual design might be slightly off from legitimate system alerts.", severity: "low" }
      ],
      difficulty_level: "hard", // Can be hard because it locks the screen
      explanation: {
        why_this_popup_is_X_type: "This is a fake tech support scam. It's designed to scare you into calling a fraudulent 'support' number where scammers will try to gain remote access to your computer or demand payment for non-existent issues.",
        what_to_look_for: ["Full-screen pop-ups or browser locks claiming severe computer problems (viruses, critical errors).", "Demands to call a specific phone number, often with a toll-free prefix, for immediate 'technical assistance.'", "Warnings that prevent you from closing the window or navigating away."],
        real_world_impact: "Calling the number connects you with scammers who will attempt to trick you into granting them remote access to your computer, installing malware, or paying exorbitant fees for 'repairs.'",
        prevention_tips: ["Legitimate companies like Microsoft or Apple will never send unsolicited pop-ups with phone numbers asking you to call them for support.", "If your browser is locked, use Task Manager (Windows: Ctrl+Shift+Esc) or Force Quit (Mac: Cmd+Option+Esc) to close the browser/application.", "Never call numbers provided in suspicious pop-ups. If you genuinely need support, go to the official company's website directly."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'remote_access_request' ---
    {
      title: "Security Warning: Remote Login Attempt Detected!",
      message: "An unauthorized remote login attempt has been detected on your network. To secure your connection, please allow our support agent to verify your system.",
      is_malicious: true,
      ui_type: "system_alert", // Can appear as a system alert or within a browser
      category: "tech_support_scam",
      subtype: "remote_access_request",
      brand_elements: {
        impersonated_brand_name: "IT Security",
        logo_url: "https://cdn-icons-png.flaticon.com/512/2592/2592317.png", // Generic remote access icon
      },
      buttons: [
        { text: "Allow Access", is_safe: false },
        { text: "Cancel (Not Recommended)", is_safe: false },
      ],
      correct_action: "FORCE_CLOSE_OS_LEVEL",
      indicators_of_compromise: [
        { element: "Request", indicator_type: "unexpected_request", description: "An unsolicited demand to allow remote access to your computer.", severity: "high" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Uses threatening language like 'unauthorized remote login' and 'secure your connection' to pressure action.", severity: "medium" },
        { element: "Source", indicator_type: "unusual_sender", description: "The alert origin is unclear or not from your known security software.", severity: "high" },
        { element: "No Context", indicator_type: "unusual_content", description: "The request for remote access has no preceding context or action from you.", severity: "medium" }
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a tech support scam attempting to gain remote access to your computer. Once granted, attackers can install malware, steal data, or demand ransom.",
        what_to_look_for: ["Pop-ups or alerts demanding you grant remote access to an unknown 'support agent' to 'fix' an issue.", "Claims of network or system vulnerabilities that need immediate remote intervention.", "Any prompt to download and run remote access software (like TeamViewer or AnyDesk) unexpectedly."],
        real_world_impact: "Granting remote access to a scammer allows them to control your computer, install malicious software, steal personal and financial data, or hold your system hostage for payment.",
        prevention_tips: ["Never allow remote access to your computer from unsolicited callers or pop-ups.", "If you suspect an issue, contact your legitimate IT support (for work) or a trusted computer technician directly (for personal devices).", "Be suspicious of any 'security alert' that directly prompts for remote access without your initiation."],
      },
      mitre_technique: { technique_id: "T1078.003", technique_name: "Valid Accounts: Cloud Accounts", tactic: "Defense Evasion, Persistence, Privilege Escalation" }, // While this is for cloud accounts, the general principle of valid accounts being used for access holds. Could also be T1021.001 (Remote Services: SSH)
    },
  ];
  
  export default techSupportScamPopups;