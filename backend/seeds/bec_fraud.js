// seedData/becFraudPopups.js

const becFraudPopups = [
  // --- Subtype: 'executive_impersonation' ---
  {
    title: "Urgent: Confidential Request from CEO [CEO Name]",
    message: "I need you to process an urgent and confidential payment for a new acquisition. Please action this immediately. Details attached.",
    is_malicious: true,
    ui_type: "email_preview", // BEC fraud is almost exclusively via email
    category: "bec_fraud",
    subtype: "executive_impersonation",
    brand_elements: {
      impersonated_brand_name: "Company Executive",
      logo_url: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png", // Generic business person icon
    },
    buttons: [
      { text: "View Attachment", is_safe: false },
      { text: "Reply All", is_safe: false }, // Replying all confirms sender is not CEO
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY", // Verify via a separate channel (phone call)
    indicators_of_compromise: [
      { element: "Sender Email", indicator_type: "mismatched_domain", description: "The sender's email domain is slightly off (e.g., 'company.co' instead of 'company.com') or uses a free email service.", severity: "high" },
      { element: "Message Body", indicator_type: "urgency_threat_language", description: "Uses high-pressure language like 'Urgent', 'confidential', and 'immediately'.", severity: "high" },
      { element: "Content", indicator_type: "unexpected_request", description: "The request for payment is unusual and bypasses normal company procedures.", severity: "high" },
      { element: "Email Signature", indicator_type: "poor_design_quality", description: "Signature might be generic, missing contact info, or slightly misspelled.", severity: "low" }
    ],
    difficulty_level: "hard",
    explanation: {
      why_this_popup_is_X_type: "This is a Business Email Compromise (BEC) scam, specifically executive impersonation. Attackers pretend to be a senior executive to trick employees into making unauthorized financial transfers.",
      what_to_look_for: ["Emails from senior executives (CEO, CFO) requesting urgent, confidential financial actions outside of normal procedures.", "Requests to bypass standard approval processes.", "Emails with subtle domain misspellings or using generic email services.", "Pressure to act quickly without time for verification."],
      real_world_impact: "Companies can suffer significant financial losses, often in the hundreds of thousands or millions of dollars, if these fraudulent wire transfers are executed.",
      prevention_tips: ["Always verify urgent financial requests from executives through a separate, trusted communication channel (e.g., a phone call to a known number, not replying to the email).", "Implement multi-factor authentication for email accounts and robust email filtering.", "Educate employees on BEC red flags and company payment protocols."],
    },
    mitre_technique: { technique_id: "T1566.001", technique_name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" },
  },

  // --- Subtype: 'financial_access_request' ---
  {
    title: "Request for Payroll Data Access",
    message: "I need temporary access to the payroll system for an audit. Please send me your login credentials or grant me administrative access.",
    is_malicious: true,
    ui_type: "chat_message", // Could be via internal chat systems (Slack/Teams mimic) or email
    category: "bec_fraud",
    subtype: "financial_access_request",
    brand_elements: {
      impersonated_brand_name: "HR Department",
      logo_url: "https://cdn-icons-png.flaticon.com/512/6839/6839456.png", // Generic team/HR icon
    },
    buttons: [
      { text: "Grant Access", is_safe: false },
      { text: "Send Login Details", is_safe: false },
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "Request", indicator_type: "unexpected_request", description: "Requests for login credentials or direct system access are highly suspicious and never legitimate through chat/email.", severity: "high" },
      { element: "Identity", indicator_type: "unusual_sender", description: "The sender's display name might be a colleague's, but the underlying ID or email is incorrect.", severity: "high" },
      { element: "Message Body", indicator_type: "unusual_content", description: "The reason for the access (e.g., 'audit') is vague or doesn't align with normal procedures.", severity: "medium" }
    ],
    difficulty_level: "medium",
    explanation: {
      why_this_popup_is_X_type: "This is a BEC fraud targeting financial access. Attackers try to gain direct access to sensitive systems (like payroll) by impersonating internal personnel.",
      what_to_look_for: ["Unusual requests for login credentials, especially for financial or sensitive systems.", "Requests to grant administrative access to someone you don't typically interact with for such tasks.", "Messages appearing from colleagues but with subtle email or chat ID discrepancies."],
      real_world_impact: "Granting access can lead to payroll diversion (changing employee bank accounts), unauthorized payments, or theft of sensitive employee data.",
      prevention_tips: ["Never share login credentials or grant system access based on email or chat requests.", "Always verify access requests through official channels or in-person/phone confirmation.", "Implement strict access controls and principle of least privilege."],
    },
    mitre_technique: { technique_id: "T1566.002", technique_name: "Phishing: Spearphishing Link", tactic: "Initial Access" },
  },

  // --- Subtype: 'wire_transfer_request' ---
  {
    title: "Urgent: Funds Transfer Request - Vendor Payment",
    message: "Please initiate a wire transfer of $75,000 to the attached account for an overdue vendor invoice. This is critical for project continuity.",
    is_malicious: true,
    ui_type: "email_preview",
    category: "bec_fraud",
    subtype: "wire_transfer_request",
    brand_elements: {
      impersonated_brand_name: "Finance Department",
      logo_url: "https://cdn-icons-png.flaticon.com/512/5210/5210946.png", // Generic bank transfer icon
    },
    buttons: [
      { text: "Process Payment", is_safe: false },
      { text: "Confirm Details", is_safe: false },
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "Email Address", indicator_type: "mismatched_domain", description: "The email comes from a look-alike domain or a free email service, not the legitimate finance department.", severity: "high" },
      { element: "Request", indicator_type: "unexpected_request", description: "The request for a large, urgent wire transfer deviates from standard payment procedures.", severity: "high" },
      { element: "Urgency", indicator_type: "urgency_threat_language", description: "Emphasizes 'Urgent' and 'critical for project continuity' to pressure action.", severity: "medium" },
      { element: "Account Details", indicator_type: "unusual_content", description: "Attached bank details might be slightly different from previous vendor payments.", severity: "medium" }
    ],
    difficulty_level: "hard",
    explanation: {
      why_this_popup_is_X_type: "This is a direct wire transfer fraud within BEC, where attackers trick employees into sending funds to accounts they control, often by faking urgent vendor or project payments.",
      what_to_look_for: ["Emails requesting immediate wire transfers to new or altered bank accounts.", "Pressure to act quickly due to 'critical' project needs or 'overdue' invoices.", "Any changes in payment instructions for known vendors."],
      real_world_impact: "Executing a fraudulent wire transfer results in immediate and often irreversible financial loss for the company.",
      prevention_tips: ["Establish clear, multi-person approval processes for all wire transfers, especially large ones.", "Always verify changes to vendor payment details through a phone call to a known, trusted number (not the one in the email).", "Train employees to recognize red flags in payment requests."],
    },
    mitre_technique: { technique_id: "T1566.001", technique_name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" },
  },

  // --- Subtype: 'vendor_payment_diversion' ---
  {
    title: "Action Required: Vendor Bank Details Update",
    message: "Due to recent banking changes, Spotify has updated their payment information. Please use the new details for all future invoices, effective immediately.",
    is_malicious: true,
    ui_type: "email_preview",
    category: "bec_fraud",
    subtype: "vendor_payment_diversion",
    brand_elements: {
      impersonated_brand_name: "Spotify",
      logo_url: "https://cdn-icons-png.flaticon.com/512/3669/3669986.png", // Generic invoice/payment icon
    },
    buttons: [
      { text: "Confirm Update", is_safe: false },
    ],
    correct_action: "VERIFY_LEGITIMACY_EXTERNALLY",
    indicators_of_compromise: [
      { element: "Sender Email", indicator_type: "mismatched_domain", description: "The email appears to be from a legitimate vendor but has a slightly altered or free email domain.", severity: "high" },
      { element: "Request", indicator_type: "unexpected_request", description: "An unsolicited request to change vendor bank details without prior communication.", severity: "high" },
      { element: "Spelling/Grammar", indicator_type: "spelling_grammar_error", description: "Subtle grammatical errors or awkward phrasing in the email.", severity: "low" },
      { element: "Impersonated Vendor", indicator_type: "unusual_content", description: "The email might be from a legitimate vendor, but the request doesn't align with their usual communication.", severity: "medium" }
    ],
    difficulty_level: "hard",
    explanation: {
      why_this_popup_is_X_type: "This is a vendor payment diversion scam, a highly effective BEC tactic where attackers trick companies into changing legitimate vendor bank details to their own accounts.",
      what_to_look_for: ["Emails or messages claiming a vendor has changed their bank account details for payments.", "Requests to update payment information that come unexpectedly or are not part of a pre-arranged process.", "Subtle changes in email addresses or domain names for known vendors."],
      real_world_impact: "Future payments intended for the legitimate vendor will be redirected to the attacker's account, leading to significant financial loss and disruption of business relationships.",
      prevention_tips: ["Always verify *any* request to change vendor payment information via a direct phone call to a known, official contact number for that vendor (not a number provided in the suspicious email).", "Implement strict internal controls requiring multi-person approval for changes to vendor master data.", "Regularly review vendor payment records for discrepancies."],
    },
    mitre_technique: { technique_id: "T1566.001", technique_name: "Phishing: Spearphishing Attachment", tactic: "Initial Access" },
  },
];

export default becFraudPopups;