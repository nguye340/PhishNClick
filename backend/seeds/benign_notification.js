// seedData/benignNeutralPopups.js

const benignNeutralPopups = [
    // --- Subtype: 'legitimate_cookie_consent' (Benign) ---
    {
      title: "Cookie Consent",
      message: "This website uses cookies to ensure you get the best experience on our website. Learn more or manage your preferences.",
      is_malicious: false,
      ui_type: "browser_notification", // Often a small banner or pop-up at the bottom/top
      category: "benign_notification",
      subtype: "legitimate_cookie_consent",
      brand_elements: {
        impersonated_brand_name: "Google Chrome",
        logo_url: "https://cdn-icons-png.flaticon.com/512/6125/6125000.png", // Generic cookie icon
      },
      buttons: [
        { text: "Accept All", is_safe: true },
        { text: "Manage Preferences", is_safe: true },
      ],
      correct_action: "ACCEPT_OFFER", // Or DECLINE_OFFER / CLOSE_LEGITIMATE_NATIVE depending on choice
      indicators_of_compromise: [], // No indicators for benign popups
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a legitimate cookie consent notification, required by privacy regulations like GDPR. It allows websites to inform you about their use of cookies and give you control over your data.",
        what_to_look_for: ["Clear, direct language about cookie usage.", "Options to accept, decline, or manage preferences.", "A professional, non-alarming design."],
        real_world_impact: "Accepting cookies allows the website to function fully and remember your preferences. Declining might limit some site functionalities.",
        prevention_tips: ["Always read cookie consent notices. Understand what data is being collected.", "Manage your preferences if you're uncomfortable with certain cookie types (e.g., tracking cookies)."],
      },
      mitre_technique: { technique_id: "N/A", technique_name: "Not Applicable", tactic: "N/A" },
    },
  
    // --- Subtype: 'legitimate_newsletter_signup' (Benign) ---
    {
      title: "Join Our Newsletter!",
      message: "Stay updated with our latest articles, offers, and news. Enter your email to subscribe.",
      is_malicious: false,
      ui_type: "generic_ad", // Can be a subtle pop-up or sidebar element
      category: "benign_notification",
      subtype: "legitimate_newsletter_signup",
      brand_elements: {
        impersonated_brand_name: "Blog / Website",
        logo_url: "https://cdn-icons-png.flaticon.com/512/3454/3454680.png", // Generic newsletter icon
      },
      buttons: [
        { text: "Subscribe", is_safe: true },
        { text: "No Thanks", is_safe: true },
      ],
      correct_action: "DECLINE_OFFER", // Or ACCEPT_OFFER if desired
      indicators_of_compromise: [],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a legitimate request to subscribe to a newsletter. Websites often use these to build an audience and communicate with their visitors.",
        what_to_look_for: ["Clear offer of a newsletter or updates.", "Request for only an email address (not sensitive data).", "A clear 'No Thanks' or close option."],
        real_world_impact: "Subscribing means you'll receive emails from the website. If it's a site you trust and enjoy, this can be useful. If not, it can be annoying.",
        prevention_tips: ["Only subscribe to newsletters from websites you genuinely trust and want updates from.", "You can always unsubscribe later if you change your mind."],
      },
      mitre_technique: { technique_id: "N/A", technique_name: "Not Applicable", tactic: "N/A" },
    },
  
    // --- Subtype: 'legitimate_software_update' (Benign) ---
    {
      title: "Software Update Available: Adobe Acrobat Reader",
      message: "A new version of Adobe Acrobat Reader is available. Install the update to ensure you have the latest features and security patches.",
      is_malicious: false,
      ui_type: "software_installer", // Mimics a legitimate software update dialog
      category: "benign_notification",
      subtype: "legitimate_software_update",
      brand_elements: {
        impersonated_brand_name: "Adobe Inc.",
        logo_url: "https://cdn-icons-png.flaticon.com/512/5968/5968377.png", // Adobe Acrobat Reader logo
      },
      buttons: [
        { text: "Install Update", is_safe: true },
        { text: "Later", is_safe: true },
      ],
      correct_action: "ACCEPT_OFFER", // If from a trusted source, or IGNORE_UNTIL_AUTOCLOSE for later
      indicators_of_compromise: [],
      difficulty_level: "medium", // Can be tricky to differentiate from scams
      explanation: {
        why_this_popup_is_X_type: "This is a legitimate software update notification from a trusted application. Keeping software updated is crucial for security and performance.",
        what_to_look_for: ["The update notification comes from the software itself or your operating system's update manager.", "The branding is consistent and accurate.", "The update is for a known software you use."],
        real_world_impact: "Installing legitimate updates ensures your software is secure against known vulnerabilities and you benefit from new features.",
        prevention_tips: ["Always verify the source of software update prompts. Prefer to update through the software's built-in updater or official vendor websites.", "Be suspicious of 'urgent' updates that appear unexpectedly from unknown sources."],
      },
      mitre_technique: { technique_id: "N/A", technique_name: "Not Applicable", tactic: "N/A" },
    },
  
    // --- Subtype: 'legitimate_prize_notification' (Benign) ---
    {
      title: "Congratulations! You've Earned Reward Points!",
      message: "You've successfully completed your purchase and earned 500 loyalty points! Visit your account dashboard to see your updated balance.",
      is_malicious: false,
      ui_type: "browser_notification", // Can be a small, unobtrusive banner
      category: "benign_notification",
      subtype: "legitimate_prize_notification",
      brand_elements: {
        impersonated_brand_name: "Online Retailer",
        logo_url: "https://cdn-icons-png.flaticon.com/512/2175/2175370.png", // Generic loyalty points icon
      },
      buttons: [
        { text: "View Dashboard", is_safe: true },
        { text: "OK", is_safe: true },
      ],
      correct_action: "CLOSE_LEGITIMATE_NATIVE", // Or COMPLETE_LEGITIMATE_ACTION if interested
      indicators_of_compromise: [],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a legitimate notification from a service or retailer about earned loyalty points or a small, expected reward. It's tied to an action you just completed (e.g., a purchase).",
        what_to_look_for: ["The notification is expected and corresponds to a recent action you took.", "It refers to a specific, identifiable program you're part of.", "The message is clear, not overly sensational, and directs you to an official part of the site."],
        real_world_impact: "This is informative and can lead to benefits within the loyalty program. No negative impact if handled correctly.",
        prevention_tips: ["Always confirm that such notifications relate to an action you've actually performed.", "Access your account dashboard directly via the official website, rather than clicking links in unexpected pop-ups, just to be safe."],
      },
      mitre_technique: { technique_id: "N/A", technique_name: "Not Applicable", tactic: "N/A" },
    },
  
    // --- Subtype: 'generic_website_ad' (Neutral) ---
    {
      title: "Discover Our New Products!",
      message: "Check out our exciting new collection of [Product Category]. Click here to browse!",
      is_malicious: false,
      ui_type: "generic_ad", // Standard web advertisement, usually banner or sidebar
      category: "neutral_ad",
      subtype: "generic_website_ad",
      brand_elements: {
        impersonated_brand_name: "Online Store",
        logo_url: "https://cdn-icons-png.flaticon.com/512/5921/5921852.png", // Generic shopping cart icon
      },
      buttons: [
        { text: "Shop Now", is_safe: true },
        { text: "X", is_safe: true }, // Standard close button
      ],
      correct_action: "CLOSE_LEGITIMATE_NATIVE", // Or ACCEPT_OFFER if interested
      indicators_of_compromise: [],
      difficulty_level: "easy",
      explanation: {
        why_this_popup_is_X_type: "This is a neutral, legitimate advertisement displayed by a website. While sometimes annoying, it's not malicious and aims to promote products or services.",
        what_to_look_for: ["The ad is generally related to the website's content or your Browse habits (though not always).", "It has a clear close button ('X').", "The offer seems reasonable and not 'too good to be true.'"],
        real_world_impact: "Clicking on it will lead you to a product page or another part of the website. No direct negative impact, but it might be unwanted.",
        prevention_tips: ["Use a reputable ad-blocker if unwanted ads are a nuisance.", "Be aware that even legitimate ads can be annoying. Discern between annoying but harmless, and truly malicious."],
      },
      mitre_technique: { technique_id: "N/A", technique_name: "Not Applicable", tactic: "N/A" },
    },
  ];
  
  export default benignNeutralPopups;