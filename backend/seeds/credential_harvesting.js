// seedData/credentialHarvestingPopups.js

const credentialHarvestingPopups = [
    // --- Subtype: 'cloud_service_login_phish' ---
    {
      title: "Account Login Required: Cloud Service Alert",
      message: "Your cloud storage access requires re-authentication due to unusual activity. Please log in to secure your files.",
      is_malicious: true,
      ui_type: "login_form", // Mimics a cloud service login page
      category: "credential_harvesting",
      subtype: "cloud_service_login_phish",
      brand_elements: {
        impersonated_brand_name: "Generic Cloud Service",
        logo_url: "https://www.flaticon.com/free-icon/cloud-storage_603522", // Generic cloud storage icon
      },
      buttons: [
        { text: "Sign In", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "URL", indicator_type: "mismatched_domain", description: "The login page URL is slightly different from the official cloud service domain (e.g., 'onedrive-secure-login.info').", severity: "high" },
        { element: "Pop-up Origin", indicator_type: "unexpected_request", description: "The login prompt appeared unexpectedly while Browse or after clicking a suspicious link.", severity: "medium" },
        { element: "Design", indicator_type: "poor_design_quality", description: "Subtle visual inconsistencies or pixelation on the login page compared to the legitimate one.", severity: "low" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Uses phrases like 'unusual activity' or 'secure your files' to create urgency.", severity: "medium" }
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a cloud service login phishing attempt. Attackers create fake login pages that mimic legitimate cloud services to steal your login credentials when you try to re-authenticate.",
        what_to_look_for: ["Unsolicited requests to re-authenticate or verify your cloud storage account.", "Login pages that appear suspicious, even if they look very similar to the real one.", "Any discrepancy in the URL, no matter how small."],
        real_world_impact: "Entering your credentials on a fake cloud service login page will give attackers access to your stored files, potentially leading to data theft, blackmail, or further attacks.",
        prevention_tips: ["Always verify the URL of any login page before entering credentials. Look for the padlock icon and ensure the domain is correct.", "Never click on login links in suspicious emails or pop-ups. Go directly to the official service website.", "Enable Multi-Factor Authentication (MFA) on your cloud accounts."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'sso_mimic_phish' ---
    {
      title: "Single Sign-On (SSO) Re-authentication Required",
      message: "Your organization's Single Sign-On session has expired. Please re-enter your corporate credentials to continue accessing internal resources.",
      is_malicious: true,
      ui_type: "login_form", // Mimics an enterprise SSO login portal
      category: "credential_harvesting",
      subtype: "sso_mimic_phish",
      brand_elements: {
        impersonated_brand_name: "Corporate SSO Portal",
        logo_url: "https://www.flaticon.com/free-icon/sso_4177264", // Generic SSO/key icon
      },
      buttons: [
        { text: "Sign In", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "URL", indicator_type: "mismatched_domain", description: "The SSO login page URL is incorrect (e.g., 'corp-sso.us' instead of 'sso.company.com').", severity: "high" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Implies immediate loss of access ('session has expired') to prompt quick action.", severity: "medium" },
        { element: "Generic Branding", indicator_type: "poor_design_quality", description: "The page might lack specific company branding or have slight graphical imperfections.", severity: "low" },
        { element: "Request", indicator_type: "unexpected_request", description: "The re-authentication prompt appeared at an unusual time or after navigating to an unexpected page.", severity: "medium" }
      ],
      difficulty_level: "hard",
      explanation: {
        why_this_popup_is_X_type: "This is an SSO mimic phishing scam. Attackers create fake Single Sign-On pages (like those used for corporate logins) to steal employee credentials, granting them access to numerous internal systems.",
        what_to_look_for: ["Unusual re-authentication prompts for your company's SSO portal.", "Any deviation in the SSO login page's URL from the official one.", "Login pages that appear less polished or subtly different from the real corporate portal."],
        real_world_impact: "Compromised corporate SSO credentials can lead to widespread access to company data, systems, and applications, posing a severe risk to the organization.",
        prevention_tips: ["Always verify the URL of your company's SSO page. Bookmark the correct one and use it exclusively.", "Report any suspicious SSO login prompts to your IT security department immediately.", "Ensure your company uses and enforces Multi-Factor Authentication (MFA) for SSO."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'mfa_bypass_attempt' ---
    {
      title: "Security Alert: MFA Verification Required",
      message: "We've detected an attempt to log in from an unrecognized device. Please enter the current MFA code to verify your identity.",
      is_malicious: true,
      ui_type: "login_form", // A modified login form that asks for MFA
      category: "credential_harvesting",
      subtype: "mfa_bypass_attempt",
      brand_elements: {
        impersonated_brand_name: "Generic Security Service",
        logo_url: "https://www.flaticon.com/free-icon/multi-factor-authentication_6891047", // Generic MFA icon
      },
      buttons: [
        { text: "Verify Code", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "Timing", indicator_type: "unexpected_request", description: "You did not initiate a login attempt from an unrecognized device.", severity: "high" },
        { element: "URL", indicator_type: "mismatched_domain", description: "The page asking for the MFA code has a suspicious or non-official URL.", severity: "high" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Phrasing like 'unrecognized device' or 'security alert' to induce panic.", severity: "medium" },
        { element: "Unusual Prompt", indicator_type: "unusual_content", description: "The prompt for the MFA code appears out of context or looks different from your usual MFA process.", severity: "medium" }
      ],
      difficulty_level: "hard",
      explanation: {
        why_this_popup_is_X_type: "This is an MFA bypass phishing attempt. Attackers have likely stolen your password and are now trying to trick you into providing your Multi-Factor Authentication (MFA) code on a fake site to complete their fraudulent login.",
        what_to_look_for: ["Prompts for MFA codes when you haven't initiated a login yourself.", "Any website asking for an MFA code that doesn't have the exact, correct URL of the service you're trying to access.", "Sudden MFA requests that don't correspond to your actions."],
        real_world_impact: "Giving your MFA code to a phishing site grants attackers immediate access to your account, bypassing a critical security layer.",
        prevention_tips: ["Never provide MFA codes to prompts that you did not initiate yourself.", "Always verify the URL of the site requesting the MFA code.", "Be vigilant about the context of MFA requests – if it's unexpected, it's likely a scam."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'password_reset_phish' ---
    {
      title: "Password Reset Request for Your Account",
      message: "A request to reset your password has been initiated for your account. If this was not you, please click 'Cancel Request' immediately.",
      is_malicious: true,
      ui_type: "email_preview", // Most common for password reset phishing
      category: "credential_harvesting",
      subtype: "password_reset_phish",
      brand_elements: {
        impersonated_brand_name: "Generic Online Platform",
        logo_url: "https://www.flaticon.com/free-icon/password-reset_10258600", // Generic password reset icon
      },
      buttons: [
        { text: "Reset Password", is_safe: false },
        { text: "Cancel Request", is_safe: false }, // Both lead to phishing site or confirm active email
      ],
      correct_action: "REPORT_AND_IGNORE",
      indicators_of_compromise: [
        { element: "Sender Email", indicator_type: "unusual_sender", description: "The sender's email address is not from the official service (e.g., 'noreply@account-help.co').", severity: "high" },
        { element: "Timing", indicator_type: "unexpected_request", description: "You did not initiate a password reset.", severity: "high" },
        { element: "URL", indicator_type: "mismatched_domain", description: "The 'Reset Password' or 'Cancel Request' link points to a malicious domain.", severity: "high" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Pressures immediate action with 'immediately' to prevent a non-existent reset.", severity: "medium" }
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a password reset phishing scam. Attackers send fake password reset notifications to trick you into clicking a link that leads to a malicious site, where they harvest your credentials or initiate a real password reset on your behalf.",
        what_to_look_for: ["Unsolicited password reset emails or notifications for accounts you use.", "Links that prompt you to 'reset' or 'cancel' a reset outside of the official service website.", "Emails with generic branding or a lack of specific account details."],
        real_world_impact: "Clicking the link can lead to a credential harvesting page, or in some cases, can confirm your email is active, leading to more targeted attacks. If you provide your password, your account is compromised.",
        prevention_tips: ["Never click on password reset links in emails or pop-ups that you didn't initiate.", "If you receive a suspicious password reset notification, go directly to the service's official website (type the URL manually) and log in to check your account status.", "Report suspicious emails to your email provider or IT department."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  ];
  
  export default credentialHarvestingPopups;