// seedData/prizeRewardPopups.js

const prizeRewardPopups = [
    // --- Subtype: 'contest_winner' ---
    {
      title: "Congratulations! You're a Grand Prize Winner!",
      message: "Your entry into our annual online drawing has been selected! Click 'Claim Prize' to confirm your eligibility and receive your reward.",
      is_malicious: true,
      ui_type: "reward_survey", // Often looks like a prize claim page with forms
      category: "prize_reward",
      subtype: "contest_winner",
      brand_elements: {
        impersonated_brand_name: "Online Contest",
        logo_url: "https://cdn-icons-png.flaticon.com/512/3426/3426852.png", // Generic winner icon
      },
      buttons: [
        { text: "Claim Prize", is_safe: false },
      ],
      correct_action: "IGNORE_UNTIL_AUTOCLOSE", // Or FORCE_CLOSE_OS_LEVEL if persistent
      indicators_of_compromise: [
        { element: "Message Body", indicator_type: "too_good_to_be_true", description: "You don't recall entering any such contest.", severity: "high" },
        { element: "Pop-up Origin", indicator_type: "unexpected_request", description: "The notification appeared out of nowhere while Browse.", severity: "medium" },
        { element: "URL", indicator_type: "suspicious_url", description: "The URL is generic (e.g., 'prizefortoday.xyz') and not associated with any known company.", severity: "high" },
      ],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a malicious prize scam, designed to trick you into providing personal information or paying a 'fee' to claim a non-existent prize.",
        what_to_look_for: ["Notifications about winning a contest you didn't enter.", "Demands for personal information (like banking details or social security numbers) to 'verify' your prize.", "Any request for an upfront 'tax' or 'processing' fee."],
        real_world_impact: "Falling for this can lead to identity theft, financial loss, or malware installation.",
        prevention_tips: ["Be skeptical of unsolicited prize notifications.", "Never pay money to receive a prize.", "Do not provide personal or financial information to unverified sources."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'gift_card' ---
    {
      title: "You've Received a $500 Gift Card!",
      message: "As a token of appreciation for your loyalty, we're giving you a $500 gift card! Select your preferred retailer to proceed.",
      is_malicious: true,
      ui_type: "reward_survey", // Often leads to a selection page or survey
      category: "prize_reward",
      subtype: "gift_card",
      brand_elements: {
        impersonated_brand_name: "Online Retailer (Generic)",
        logo_url: "https://cdn-icons-png.flaticon.com/512/14079/14079391.png", // Generic gift card icon
      },
      buttons: [
        { text: "Choose Retailer", is_safe: false },
      ],
      correct_action: "IGNORE_UNTIL_AUTOCLOSE",
      indicators_of_compromise: [
        { element: "Message Body", indicator_type: "too_good_to_be_true", description: "A high-value gift card offered without any clear reason or purchase.", severity: "high" },
        { element: "URL", indicator_type: "suspicious_url", description: "The URL is unrelated to any major retailer (e.g., 'rewardsforyou.info').", severity: "high" },
        { element: "Pop-up Behavior", indicator_type: "excessive_ads", description: "This type of ad often appears repeatedly and intrusively.", severity: "medium" },
      ],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a malicious gift card scam, designed to lure you into clicking a link that leads to surveys (generating revenue for the attacker) or phishing sites.",
        what_to_look_for: ["Offers of large gift cards without any context or specific reason for receiving it.", "Pop-ups that appear randomly and are not tied to any specific purchase or activity.", "Buttons that promise an immediate reward."],
        real_world_impact: "Clicking the link usually leads to endless surveys, requests for personal information, or attempts to install adware.",
        prevention_tips: ["Assume all unsolicited gift card offers are scams.", "Never click on pop-ups that promise free high-value rewards.", "Use an ad blocker to prevent these types of intrusive ads."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'survey_reward' ---
    {
      title: "Quick Survey! Get a $10 Reward!",
      message: "Answer a few quick questions about your Browse experience and receive a $10 Amazon gift card as a thank you!",
      is_malicious: true, // While some surveys are legit, this is a scam pop-up context
      ui_type: "reward_survey",
      category: "prize_reward",
      subtype: "survey_reward",
      brand_elements: {
        impersonated_brand_name: "Generic Survey",
        logo_url: "https://cdn-icons-png.flaticon.com/512/3273/3273583.png", // Generic survey icon
      },
      buttons: [
        { text: "Start Survey", is_safe: false },
      ],
      correct_action: "IGNORE_UNTIL_AUTOCLOSE",
      indicators_of_compromise: [
        { element: "Message Body", indicator_type: "too_good_to_be_true", description: "An excessive reward for a 'quick' and generic survey.", severity: "medium" },
        { element: "Pop-up Origin", indicator_type: "unexpected_request", description: "The survey pop-up appeared without visiting a survey site.", severity: "medium" },
        { element: "Poor Design", indicator_type: "poor_design_quality", description: "Often has flashing elements or unprofessional graphics.", severity: "low" },
      ],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a malicious survey reward scam, primarily designed to generate advertising revenue for the attacker through clicks and completion of surveys, potentially leading to further scams.",
        what_to_look_for: ["Surveys that offer disproportionately high rewards for minimal effort.", "Pop-ups that suddenly appear asking for survey participation.", "Any request for personal information (even seemingly innocuous ones) within the survey itself."],
        real_world_impact: "You won't receive the promised reward, and you might expose personal data or be led to more intrusive ads/malware.",
        prevention_tips: ["Do not engage with unsolicited survey pop-ups promising rewards.", "Close such pop-ups immediately without clicking any buttons."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'loyalty_program' ---
    {
      title: "Exclusive Reward for Loyal Customers!",
      message: "As a valued customer, you've qualified for an exclusive loyalty reward! Click here to redeem your special offer.",
      is_malicious: true,
      ui_type: "generic_ad", // Could be a simple generic ad trying to look exclusive
      category: "prize_reward",
      subtype: "loyalty_program",
      brand_elements: {
        impersonated_brand_name: "Generic Loyalty Program",
        logo_url: "https://cdn-icons-png.flaticon.com/512/6021/6021962.png", // Generic star/loyalty icon
      },
      buttons: [
        { text: "Redeem Offer", is_safe: false },
      ],
      correct_action: "IGNORE_UNTIL_AUTOCLOSE",
      indicators_of_compromise: [
        { element: "Message Body", indicator_type: "generic_greeting", description: "Refers to 'valued customer' without specifying a name or account.", severity: "low" },
        { element: "Pop-up Origin", indicator_type: "unexpected_request", description: "Received this notification unexpectedly from an unknown source.", severity: "medium" },
        { element: "URL", indicator_type: "suspicious_url", description: "The link goes to an obscure domain (e.g., 'loyal-customer-perks.net').", severity: "high" },
      ],
      difficulty_level: "medium",
      explanation: {
        why_this_popup_is_X_type: "This is a malicious loyalty program scam, leveraging the idea of exclusive rewards to trick users into clicking malicious links or divulging personal information.",
        what_to_look_for: ["Unspecific 'loyalty' offers from unknown or generic 'brands'.", "Offers that promise vague but 'exclusive' rewards.", "Lack of personalization in the message (no account details, name)."],
        real_world_impact: "Clicking the link can lead to phishing sites, subscription scams, or unwanted software downloads.",
        prevention_tips: ["Legitimate loyalty programs communicate through official channels (your account dashboard, direct email) and rarely through unexpected pop-ups.", "Always go directly to the service's official website to check for any legitimate offers."],
      },
      mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
    },
  
    // --- Subtype: 'lottery_scam' ---
    {
      title: "Official Lottery Winner Notification!",
      message: "You have won $1,000,000 in the International Online Lottery! To claim your winnings, provide your bank details and pay a small processing fee.",
      is_malicious: true,
      ui_type: "email_preview", // Often delivered via email, appearing as a formal notification
      category: "prize_reward",
      subtype: "lottery_scam",
      brand_elements: {
        impersonated_brand_name: "International Lottery (Fake)",
        logo_url: "https://cdn-icons-png.flaticon.com/512/8610/8610944.png", // Generic lottery icon
      },
      buttons: [
        { text: "Claim Winnings", is_safe: false },
      ],
      correct_action: "REPORT_AND_IGNORE",
      indicators_of_compromise: [
        { element: "Message Body", indicator_type: "too_good_to_be_true", description: "You did not enter any international lottery.", severity: "high" },
        { element: "Request", indicator_type: "unexpected_request", description: "Asks for bank details and an upfront 'processing fee' to claim winnings.", severity: "high" },
        { element: "Grammar/Spelling", indicator_type: "spelling_grammar_error", description: "Minor grammatical errors or awkward phrasing common in scams.", severity: "low" },
      ],
      difficulty_level: "hard",
      explanation: {
        why_this_popup_is_X_type: "This is a classic lottery scam, attempting to steal your money and/or financial information by promising a large, non-existent prize.",
        what_to_look_for: ["Notifications of winning a lottery you never entered.", "Requests for upfront payments ('fees', 'taxes', 'processing costs') to release winnings.", "Demands for sensitive financial information like bank account numbers."],
        real_world_impact: "Paying the 'fee' will result in financial loss, and providing bank details can lead to your accounts being emptied or identity theft.",
        prevention_tips: ["You cannot win a lottery you didn't enter. Period.", "Legitimate lotteries do not ask for upfront fees to release winnings.", "Never share banking or personal identifying information in response to unsolicited 'winnings' notifications."],
      },
      mitre_technique: { technique_id: "T1566.001", technique_name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" }, // Often an email leading to interaction
    },
  ];
  
  export default prizeRewardPopups;
