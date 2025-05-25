// seedData/subscriptionScamPopups.js

const subscriptionScamPopups = [
    // --- Subtype: 'renewal_notice_fake' ---
    {
      title: "Urgent: Your Subscription is Expiring Soon!",
      message: "Your premium subscription for [Generic Service Name] is set to expire today. Renew now to avoid service interruption and higher renewal rates.",
      is_malicious: true,
      ui_type: "email_preview", // Commonly delivered via email
      category: "subscription_scam",
      subtype: "renewal_notice_fake",
      brand_elements: {
        impersonated_brand_name: "Generic Online Service",
        logo_url: "https://cdn-icons-png.flaticon.com/512/4660/4660435.png", // Generic renewal icon
      },
      buttons: [
        { text: "Renew Now", is_safe: false },
        { text: "Manage Subscription", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "Sender Email", indicator_type: "unusual_sender", description: "The sender's email address is generic or suspicious (e.g., 'no-reply@service-billing.net').", severity: "high" },
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Uses 'Urgent', 'expire today', and 'higher renewal rates' to create panic.", severity: "medium" },
        { element: "URL", indicator_type: "mismatched_domain", description: "The renewal link leads to a non-official domain of the alleged service.", severity: "high" },
        { element: "Greeting", indicator_type: "generic_greeting", description: "Does not address you by name or reference your specific account details.", severity: "low" }
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a fake subscription renewal notice, designed to trick you into providing your payment details on a fraudulent website.",
        what_to_look_for: ["Unexpected renewal notices for services you may or may not use.", "Threats of immediate service interruption or increased costs if not renewed right away.", "Suspicious sender email addresses or links that don't go to the official service website."],
        real_world_impact: "Entering your payment information on a fake renewal page will lead to your credit card details being stolen, potentially resulting in unauthorized charges.",
        prevention_tips: ["Always log in directly to the official service's website (type the URL manually) to check your subscription status and manage renewals.", "Never click on renewal links in suspicious emails or pop-ups.", "Be wary of emails that are generic and lack personalization."],
      },
      mitre_technique: { technique_id: "T1566.001", technique_name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'payment_failure_fake' ---
    {
      title: "Action Required: Your Payment Failed!",
      message: "We were unable to process your recent payment for your streaming service subscription. Please update your billing information immediately to continue access.",
      is_malicious: true,
      ui_type: "email_preview", // Can be email, or a browser notification leading to a payment form
      category: "subscription_scam",
      subtype: "payment_failure_fake",
      brand_elements: {
        impersonated_brand_name: "Generic Streaming Service",
        logo_url: "https://cdn-icons-png.flaticon.com/512/11790/11790032.png", // Generic payment failed icon
      },
      buttons: [
        { text: "Update Billing Info", is_safe: false },
      ],
      correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
      indicators_of_compromise: [
        { element: "Message Body", indicator_type: "urgency_threat_language", description: "Threatens immediate service interruption ('continue access') to force action.", severity: "medium" },
        { element: "URL", indicator_type: "mismatched_domain", description: "The update link goes to a fraudulent website (e.g., 'streaming-payment.info').", severity: "high" },
        { element: "Transaction Details", indicator_type: "unusual_content", description: "Mentions a 'recent payment' that you don't recall or is for an unfamiliar amount.", severity: "low" },
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a fake payment failure scam, designed to steal your credit card details by exploiting your concern over interrupted service.",
        what_to_look_for: ["Notifications about failed payments for services you subscribe to.", "Any link that asks you to 'update billing information' outside of the service's official website.", "Vague details about the failed transaction."],
        real_world_impact: "Entering your payment details on a fake site will compromise your credit card, leading to unauthorized charges and potential identity theft.",
        prevention_tips: ["If you receive a payment failure notice, do not click the link. Instead, log in directly to the service's official website or app to check your payment status.", "Legitimate services will allow you to update billing securely within your account dashboard."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'trial_expiration_scam' ---
    {
      title: "Your Free Trial Has Ended! Subscribe Now!",
      message: "Your 7-day free trial for Norton Antivirus has expired. To continue enjoying premium features, select a subscription plan.",
      is_malicious: true,
      ui_type: "reward_survey", // Often looks like a 'subscribe now' page after a fake trial
      category: "subscription_scam",
      subtype: "trial_expiration_scam",
      brand_elements: {
        impersonated_brand_name: "Norton Antivirus",
        logo_url: "https://2.bp.blogspot.com/-hCo9Tn9_uZQ/T4d5KaJskjI/AAAAAAAAD-w/pnH99UKsR2w/s1600/Norton+AntiVirus+Android+Logo.png", // Generic trial icon
      },
      buttons: [
        { text: "View Plans", is_safe: false },
        { text: "Continue Trial", is_safe: false }, // Often a trick button
      ],
      correct_action: "FORCE_CLOSE_OS_LEVEL",
      indicators_of_compromise: [
        { element: "Service Name", indicator_type: "unusual_content", description: "You don't recall signing up for a free trial for the mentioned software/app.", severity: "high" },
        { element: "Pop-up Origin", indicator_type: "unexpected_request", description: "The pop-up appeared randomly while Browse, not from a direct interaction with the software.", severity: "medium" },
        { element: "URL", indicator_type: "suspicious_url", description: "The link for 'View Plans' leads to a domain unrelated to the software.", severity: "high" },
      ],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a fake trial expiration scam, designed to trick you into signing up for an unwanted or fraudulent subscription service by claiming a trial has ended.",
        what_to_look_for: ["Notifications about free trials ending for software or services you never used or installed.", "Pop-ups demanding immediate subscription after an unrecognized 'trial.'", "Links that lead to generic payment pages rather than the legitimate software's site."],
        real_world_impact: "Clicking 'View Plans' and providing payment information can lead to unauthorized recurring charges or exposure to malicious sites.",
        prevention_tips: ["Be wary of any pop-ups claiming a free trial has ended for software you don't recognize.", "Only subscribe to services directly through their official websites.", "Always read the terms and conditions carefully before providing payment details for any 'trial.'"],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'upgrade_offer_scam' ---
    {
      title: "Exclusive Upgrade: Unlock Premium Features!",
      message: "As a loyal user, you're eligible for a 50% discount on our Premium plan! Upgrade now to remove ads and gain unlimited access.",
      is_malicious: true,
      ui_type: "generic_ad", // Could be a persistent ad
      category: "subscription_scam",
      subtype: "upgrade_offer_scam",
      brand_elements: {
        impersonated_brand_name: "Generic App/Service",
        logo_url: "https://cdn-icons-png.flaticon.com/512/3669/3669986.png", // Generic premium/upgrade icon
      },
      buttons: [
        { text: "Upgrade Now", is_safe: false },
        { text: "No Thanks", is_safe: false }, // Often non-functional or leads to more ads
      ],
      correct_action: "IGNORE_UNTIL_AUTOCLOSE",
      indicators_of_compromise: [
        { element: "Offer", indicator_type: "too_good_to_be_true", description: "An unusually high discount (e.g., 50%) for a premium service appearing unsolicited.", severity: "medium" },
        { element: "Pop-up Origin", indicator_type: "unexpected_request", description: "The upgrade offer appeared out of context or from an unknown website.", severity: "medium" },
        { element: "URL", indicator_type: "suspicious_url", description: "The upgrade link leads to a scam site (e.g., 'premium-deals-today.xyz').", severity: "high" },
      ],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is an upgrade offer scam, a form of adware or phishing that tries to trick you into purchasing a fake or unwanted subscription service.",
        what_to_look_for: ["Unsolicited pop-ups offering significant discounts on 'premium' versions of software or services.", "Offers that appear without you navigating to the official upgrade section of a service.", "Buttons that are designed to look legitimate but lead to suspicious websites."],
        real_world_impact: "Clicking the upgrade link can lead to credit card fraud, unwanted recurring charges, or the installation of adware.",
        prevention_tips: ["Always visit the official website of a service to check for legitimate upgrade offers.", "Be suspicious of pop-ups that offer unusually large discounts or use aggressive sales tactics.", "Use ad blockers to reduce exposure to these types of intrusive ads."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  ];
  
  export default subscriptionScamPopups;