/**
 * Email service for sending password reset and security notifications
 * Supports multiple providers via environment configuration
 */

/**
 * Send password reset email with secure token link
 * @param {string} to - Recipient email address
 * @param {string} resetLink - Secure password reset link
 * @param {string} userName - User's display name
 */
export async function sendPasswordResetEmail(to, resetLink, userName = 'User') {
    const provider = process.env.MAIL_PROVIDER || 'console';
    const from = process.env.MAIL_FROM || 'noreply@catphishlabs.ca';

    const subject = 'Password Reset Request - CatPhish Labs';
    const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #00ffff;">Password Reset Request</h2>
            <p>Hello ${userName},</p>
            <p>An administrator has approved your password reset request. Click the link below to reset your password:</p>
            <p style="margin: 20px 0;">
                <a href="${resetLink}" style="background-color: #00ffff; color: #000; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Reset Password
                </a>
            </p>
            <p style="color: #666; font-size: 14px;">
                This link will expire in 1 hour for security reasons.
            </p>
            <p style="color: #666; font-size: 14px;">
                If you did not request this password reset, please contact an administrator immediately.
            </p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
                CatPhish Labs Security Team<br>
                This is an automated message, please do not reply.
            </p>
        </div>
    `;

    const textBody = `
Password Reset Request

Hello ${userName},

An administrator has approved your password reset request. Use the link below to reset your password:

${resetLink}

This link will expire in 1 hour for security reasons.

If you did not request this password reset, please contact an administrator immediately.

---
CatPhish Labs Security Team
This is an automated message, please do not reply.
    `;

    if (provider === 'console') {
        console.log('\n========== EMAIL MOCK ==========');
        console.log(`From: ${from}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Reset Link: ${resetLink}`);
        console.log('================================\n');
        return { success: true, provider: 'console' };
    }

    // TODO: Add SES/SendGrid integration when ready
    if (provider === 'ses') {
        console.warn('[MAILER] SES provider not yet implemented, falling back to console');
        console.log(`[MAIL MOCK] To: ${to} Reset: ${resetLink}`);
        return { success: true, provider: 'console-fallback' };
    }

    if (provider === 'sendgrid') {
        console.warn('[MAILER] SendGrid provider not yet implemented, falling back to console');
        console.log(`[MAIL MOCK] To: ${to} Reset: ${resetLink}`);
        return { success: true, provider: 'console-fallback' };
    }

    console.log(`[MAIL MOCK] To: ${to} Reset: ${resetLink}`);
    return { success: true, provider: 'console' };
}

/**
 * Send account lockout notification email
 * @param {string} to - Recipient email address
 * @param {string} userName - User's display name
 * @param {boolean} permanent - Whether lockout is permanent
 * @param {string} unlockTime - ISO timestamp when account unlocks (if not permanent)
 */
export async function sendLockoutNotification(to, userName, permanent, unlockTime = null) {
    const provider = process.env.MAIL_PROVIDER || 'console';
    const from = process.env.MAIL_FROM || 'noreply@catphishlabs.ca';

    const subject = 'Account Security Alert - CatPhish Labs';
    const message = permanent
        ? 'Your account has been permanently locked due to multiple failed login attempts. Please contact an administrator to unlock your account.'
        : `Your account has been temporarily locked due to multiple failed login attempts. It will automatically unlock at ${unlockTime}.`;

    if (provider === 'console') {
        console.log('\n========== LOCKOUT NOTIFICATION ==========');
        console.log(`From: ${from}`);
        console.log(`To: ${to}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        console.log('==========================================\n');
        return { success: true, provider: 'console' };
    }

    // Fallback for other providers
    console.log(`[LOCKOUT NOTIFICATION] To: ${to} - ${message}`);
    return { success: true, provider: 'console' };
}
