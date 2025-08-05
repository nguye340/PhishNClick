const SoftwareUpdateScamPopups = [
    // --- Subtype: 'browser_update_fake' ---
    // This subtype tricks users into downloading malware by pretending their browser is outdated.
    {
    "title": "Your Browser Is Outdated!",
    "message": "Your version of Chrome is out of date. Update now to continue Browse securely. Clicking 'Update' will install the latest security patch.",
    "is_malicious": true,
    "ui_type": "browser_notification",
    "category": "software_update_scam",
    "subtype": "browser_update_fake",
    "brand_elements": {
      "impersonated_brand_name": "Google Chrome",
      "logo_url": "https://www.google.com/chrome/static/images/chrome-logo.svg"
    },
    "buttons": [
      {
        "text": "Update",
        "is_safe": false
      },
      {
        "text": "Cancel",
        "is_safe": false
      }
    ],
    "correct_action": "FORCE_CLOSE_OS_LEVEL",
    "indicators_of_compromise": [
      {
        "element": "URL",
        "indicator_type": "suspicious_url",
        "description": "The URL is not the official Google Chrome update page.",
        "severity": "high"
      },
      {
        "element": "Message",
        "indicator_type": "urgency_threat_language",
        "description": "Uses urgent language to pressure the user into updating immediately.",
        "severity": "medium"
      },
      {
        "element": "UI Element",
        "indicator_type": "non_dismissible_alert",
        "description": "The pop-up cannot be closed with a simple 'X' button.",
        "severity": "low"
      }
    ],
    "difficulty_level": "easy",
    "explanation": {
      "why_this_popup_is_X_type": "This pop-up is a fake browser update. It's designed to scare you into downloading a malicious file by claiming your browser is insecure.",
      "what_to_look_for": [
        "Unexpected pop-ups demanding an update.",
        "A URL that is not the official browser website.",
        "Buttons that seem to do nothing or lead to a download without confirmation."
      ],
      "real_world_impact": "Clicking 'Update' can install malware, such as ransomware or a Trojan, on your computer.",
      "prevention_tips": [
        "Always update your browser through its official settings menu, not via a pop-up.",
        "Close the browser immediately if you see this type of pop-up."
      ]
    },
    "mitre_technique": {
      "technique_id": "T1204.002",
      "technique_name": "Malicious Link",
      "tactic": "Initial Access"
    }
  },
  // --- Subtype: 'security_patch_fake' ---
  // This subtype tricks users into downloading malware by pretending a security patch is available.
  {
    "title": "Microsoft Windows Security Update",
    "message": "A critical security patch for your operating system is available. Click 'Install' to protect your system from recent vulnerabilities. Failure to do so will leave your data at risk.",
    "is_malicious": true,
    "ui_type": "software_installer",
    "category": "software_update_scam",
    "subtype": "security_patch_fake",
    "brand_elements": {
      "impersonated_brand_name": "Microsoft Windows",
      "logo_url": "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg"
    },
    "buttons": [
      {
        "text": "Install Now",
        "is_safe": false
      },
      {
        "text": "Later",
        "is_safe": false
      }
    ],
    "correct_action": "FORCE_CLOSE_OS_LEVEL",
    "indicators_of_compromise": [
      {
        "element": "Message",
        "indicator_type": "urgency_threat_language",
        "description": "The language is threatening and pressures the user with the fear of being 'at risk'.",
        "severity": "high"
      },
      {
        "element": "UI Element",
        "indicator_type": "non_dismissible_alert",
        "description": "The 'Later' button does not dismiss the pop-up and may lead to a different malicious action.",
        "severity": "medium"
      },
      {
        "element": "Origin",
        "indicator_type": "unexpected_request",
        "description": "A system update pop-up appeared without the user checking for updates in settings.",
        "severity": "medium"
      }
    ],
    "difficulty_level": "medium",
    "explanation": {
      "why_this_popup_is_X_type": "This is a fake security patch update. Legitimate operating systems and software do not typically push critical updates via pop-ups that block your screen without prior warning.",
      "what_to_look_for": [
        "A pop-up demanding an immediate, unexpected security patch.",
        "A lack of specific version numbers or official branding.",
        "Buttons that only lead to a malicious installation."
      ],
      "real_world_impact": "Clicking 'Install Now' can install ransomware, giving attackers control over your files.",
      "prevention_tips": [
        "Always run system and software updates through the official update utility in your settings.",
        "Never trust a pop-up that appears suddenly and demands a security update."
      ]
    },
    "mitre_technique": {
      "technique_id": "T1566.002",
      "technique_name": "Spearphishing Link",
      "tactic": "Initial Access"
    }
  },
  // --- Subtype: 'driver_update_fake' ---
  // This subtype tricks users into downloading malware by pretending a driver update is available.
  {
    "title": "Driver Update Needed for NVIDIA",
    "message": "Your NVIDIA graphics driver is out of date. Please download and install the new version to optimize performance and prevent crashes. The update is highly recommended.",
    "is_malicious": true,
    "ui_type": "system_alert",
    "category": "software_update_scam",
    "subtype": "driver_update_fake",
    "brand_elements": {
      "impersonated_brand_name": "NVIDIA",
      "logo_url": "https://www.nvidia.com/etc/designs/nvidia/images/logo.svg"
    },
    "buttons": [
      {
        "text": "Download & Install",
        "is_safe": false
      },
      {
        "text": "Remind Me Later",
        "is_safe": true
      }
    ],
    "correct_action": "VERIFY_LEGITIMACY_EXTERNALLY",
    "indicators_of_compromise": [
      {
        "element": "Origin",
        "indicator_type": "unexpected_request",
        "description": "The pop-up appeared without the user opening the official NVIDIA Control Panel or update utility.",
        "severity": "high"
      },
      {
        "element": "Message",
        "indicator_type": "poor_design_quality",
        "description": "The window border and icons do not match the official NVIDIA software design.",
        "severity": "medium"
      },
      {
        "element": "Button",
        "indicator_type": "unusual_content",
        "description": "The 'Remind Me Later' button closes the pop-up, but the only safe action is to force close the window and verify externally.",
        "severity": "medium"
      }
    ],
    "difficulty_level": "medium",
    "explanation": {
      "why_this_popup_is_X_type": "This is a fake driver update scam. It uses the fear of system performance issues to pressure you into installing malware. Legitimate driver updates are only initiated through official software or operating system tools.",
      "what_to_look_for": [
        "A pop-up for a driver update that appears unexpectedly.",
        "A lack of official-looking UI elements or a mismatched URL.",
        "Any request to install a driver without you initiating the process."
      ],
      "real_world_impact": "Installing a fake driver can lead to a 'Trojan' which allows an attacker to gain control over your system.",
      "prevention_tips": [
        "Always check for driver updates through the official software for your hardware (e.g., NVIDIA GeForce Experience).",
        "Close the pop-up and verify the legitimacy of the message by visiting the official website."
      ]
    },
    "mitre_technique": {
      "technique_id": "T1204.001",
      "technique_name": "Malicious Software",
      "tactic": "Initial Access"
    }
  },
  // --- Subtype: 'plugin_install_fake' ---
  // This subtype tricks users into downloading malware by pretending a plugin update is available.
  {
    "title": "Adobe Flash Player is Out of Date!",
    "message": "The video cannot be played. Your Adobe Flash Player plugin needs to be updated immediately to continue. Please click below to download the latest version.",
    "is_malicious": true,
    "ui_type": "video_player_overlay",
    "category": "software_update_scam",
    "subtype": "plugin_install_fake",
    "brand_elements": {
      "impersonated_brand_name": "Adobe Flash Player",
      "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Adobe_Flash_Player_Logo.svg"
    },
    "buttons": [
      {
        "text": "Update Now",
        "is_safe": false
      },
      {
        "text": "Cancel",
        "is_safe": false
      }
    ],
    "correct_action": "FORCE_CLOSE_OS_LEVEL",
    "indicators_of_compromise": [
      {
        "element": "Origin",
        "indicator_type": "unexpected_request",
        "description": "Flash Player is no longer supported, making any update pop-up an immediate red flag.",
        "severity": "high"
      },
      {
        "element": "Message",
        "indicator_type": "urgency_threat_language",
        "description": "The message creates a sense of urgency by blocking content and demanding an immediate update.",
        "severity": "medium"
      },
      {
        "element": "UI Element",
        "indicator_type": "poor_design_quality",
        "description": "The pop-up's design does not match the official Adobe branding.",
        "severity": "low"
      }
    ],
    "difficulty_level": "hard",
    "explanation": {
      "why_this_popup_is_X_type": "This is a fake plugin update pop-up. It's particularly malicious because Flash Player is officially end-of-life, so any message asking you to update it is a guaranteed scam.",
      "what_to_look_for": [
        "Any pop-up asking to update Flash Player.",
        "A pop-up demanding a 'plugin' update in order to view content.",
        "Any download prompt that interrupts your video playback."
      ],
      "real_world_impact": "Downloading a fake plugin can install a variety of malware, including spyware that steals your personal information.",
      "prevention_tips": [
        "Do not install plugins or browser extensions from untrusted sources.",
        "Be aware of unsupported software like Adobe Flash Player; any update prompts for them are fake."
      ]
    },
    "mitre_technique": {
      "technique_id": "T1566.002",
      "technique_name": "Spearphishing Link",
      "tactic": "Initial Access"
    }
  },
  // --- Subtype: 'ransomware_alert' ---
  // This subtype tricks users into downloading malware by pretending their system is locked and demanding a ransom.
  {
    "title": "!!! RANSOMWARE ALERT !!!",
    "message": "Your personal files, photos, and documents have been encrypted. Your system is now locked. You must send $500 in Bitcoin to this address to unlock your files.",
    "is_malicious": true,
    "ui_type": "system_alert",
    "category": "software_update_scam",
    "subtype": "ransomware_alert",
    "brand_elements": {
      "impersonated_brand_name": "Security Center",
      "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Adobe_Flash_Player_Logo.svg"
    },
    "buttons": [
      {
        "text": "Pay Ransom",
        "is_safe": false
      },
      {
        "text": "Help",
        "is_safe": false
      }
    ],
    "correct_action": "FORCE_CLOSE_OS_LEVEL",
    "indicators_of_compromise": [
      {
        "element": "Title",
        "indicator_type": "urgency_threat_language",
        "description": "The title uses all caps and exclamation points to create panic.",
        "severity": "high"
      },
      {
        "element": "Message",
        "indicator_type": "unexpected_request",
        "description": "A legitimate security alert would not demand payment in cryptocurrency.",
        "severity": "high"
      },
      {
        "element": "UI Element",
        "indicator_type": "non_dismissible_alert",
        "description": "The window is designed to be difficult to close and prevents normal computer use.",
        "severity": "high"
      }
    ],
    "difficulty_level": "hard",
    "explanation": {
      "why_this_popup_is_X_type": "This is a fake ransomware alert. While real ransomware exists, this pop-up is scareware. It tries to panic you into paying money for a threat that doesn't actually exist on your system. A real ransomware attack would quietly encrypt your files before making any demands.",
      "what_to_look_for": [
        "A pop-up that takes over your screen and cannot be easily closed.",
        "Demands for cryptocurrency or other unconventional payment methods.",
        "Urgent and threatening language about your data being lost or stolen."
      ],
      "real_world_impact": "Paying the ransom will not solve the 'problem' and only gives your money to criminals.",
      "prevention_tips": [
        "Never pay a ransom demanded by a pop-up.",
        "Immediately run a full system scan with a trusted security program."
      ]
    },
    "mitre_technique": {
      "technique_id": "T1566.002",
      "technique_name": "Spearphishing Link",
      "tactic": "Initial Access"
    }
  },
  // --- Subtype: 'trojan_download' ---
  // This subtype tricks users into downloading malware by pretending their system is infected and offering a security scanner.
  {
    "title": "File Download: `Security.exe`",
    "message": "Your browser has detected multiple threats. Click OK to download and run the security scanner to remove all infections. This is highly recommended to protect your data.",
    "is_malicious": true,
    "ui_type": "system_alert",
    "category": "software_update_scam",
    "subtype": "trojan_download",
    "brand_elements": {
      "impersonated_brand_name": "Windows Security",
      "logo_url": "https://upload.wikimedia.org/wikipedia/commons/e/e0/Adobe_Flash_Player_Logo.svg"
    },
    "buttons": [
      {
        "text": "OK",
        "is_safe": false
      },
      {
        "text": "Cancel",
        "is_safe": false
      }
    ],
    "correct_action": "FORCE_CLOSE_OS_LEVEL",
    "indicators_of_compromise": [
      {
        "element": "Filename",
        "indicator_type": "unusual_content",
        "description": "The file name 'Security.exe' is generic and suspicious.",
        "severity": "high"
      },
      {
        "element": "Message",
        "indicator_type": "urgency_threat_language",
        "description": "The pop-up claims your system has been compromised to create a sense of urgency.",
        "severity": "medium"
      },
      {
        "element": "UI Element",
        "indicator_type": "poor_design_quality",
        "description": "The dialog box looks like an older version of Windows or has a pixelated appearance.",
        "severity": "low"
      }
    ],
    "difficulty_level": "medium",
    "explanation": {
      "why_this_popup_is_X_type": "This is a pop-up for a Trojan download. It is disguised as a security scanner, but it is actually a malicious program that will give an attacker control over your computer.",
      "what_to_look_for": [
        "A pop-up that automatically prompts a file download.",
        "Suspicious file names, especially executable files like '.exe' or '.zip'.",
        "A message that claims to detect threats and offers a download to fix them."
      ],
      "real_world_impact": "Running a Trojan can give an attacker full remote access to your computer, allowing them to steal files or install other malware.",
      "prevention_tips": [
        "Never download and run executable files from an untrusted source.",
        "Always scan any downloaded file with a trusted antivirus program before running it."
      ]
    },
    "mitre_technique": {
      "technique_id": "T1059",
      "technique_name": "Command and Scripting Interpreter",
      "tactic": "Execution"
    }
  }
]

export default SoftwareUpdateScamPopups;