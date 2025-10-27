# Account Lockout System Implementation

## Overview
Implements escalating account lockout protection against brute-force attacks with admin-controlled unlock and password reset capabilities.

## Features

### Escalating Lockout Stages
- **Stage 0**: 3 consecutive failures → 30 minutes lockout
- **Stage 1**: 6 consecutive failures → 3 hours lockout
- **Stage 2**: 9 consecutive failures → 24 hours lockout
- **Stage 3**: 12 consecutive failures → **Permanent lockout** (admin unlock required)

### Security Features
- ✅ Rate limiting: 5 login attempts per minute per IP
- ✅ Unified error messages to prevent user enumeration
- ✅ OAuth user protection (skip password verification)
- ✅ Secure cookie handling with domain validation
- ✅ Admin audit logging for all unlock/reset actions
- ✅ Email notifications for lockout events (console stub ready for SES/SendGrid)

## API Endpoints

### Authentication
#### `POST /api/auth/login`
**Rate Limited**: 5 requests/minute per IP

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "ok": true,
  "message": "User logged in successfully",
  "role": "user",
  "email": "user@example.com",
  "name": "username"
}
```

**Lockout Response (423):**
```json
{
  "error": "LOCKED",
  "permanent": false,
  "until": "2025-10-27T20:30:00.000Z",
  "remainingSeconds": 1234,
  "message": "Your account is temporarily locked. Please try again later."
}
```

**Permanent Lockout Response (423):**
```json
{
  "error": "LOCKED",
  "permanent": true,
  "message": "Your account has been permanently locked. Please contact an administrator."
}
```

**Invalid Credentials (401):**
```json
{
  "error": "INVALID_CREDENTIALS"
}
```

**Rate Limited (429):**
```json
{
  "error": "RATE_LIMITED",
  "message": "Too many login attempts. Please try again later."
}
```

### Admin Endpoints
All admin endpoints require authentication and admin role.

#### `POST /api/admin/users/:userId/unlock`
Unlock a locked user account and reset all failure counters.

**Headers:**
```
Cookie: accessToken=<admin_token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Account unlocked successfully for user@example.com",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "username",
    "unlockedBy": "admin@example.com",
    "unlockedAt": "2025-10-27T20:00:00.000Z"
  }
}
```

#### `POST /api/admin/users/:userId/require-password-reset`
Force a user to reset their password on next login.

**Request Body:**
```json
{
  "sendEmail": true
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset required for user@example.com",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "username": "username",
    "resetTokenExpiry": "2025-10-27T21:00:00.000Z",
    "emailSent": true
  }
}
```

## Database Schema

### User Model Extensions
```javascript
{
  // Lockout tracking
  failedLoginAttempts: Number,              // Total failed attempts
  consecutiveFailedLoginAttempts: Number,   // Consecutive failures (resets on success)
  lockoutStage: Number,                     // Current lockout stage (0-3)
  lockoutExpiresAt: Date,                   // When temporary lockout expires
  isPermanentlyLocked: Boolean,             // Permanent lockout flag
  lastFailedLoginAt: Date,                  // Timestamp of last failure
  lastLoginAt: Date,                        // Timestamp of last successful login
  
  // Password reset
  passwordResetRequired: Boolean,
  passwordResetTokenHash: String,           // SHA-256 hashed reset token
  passwordResetTokenExpiresAt: Date,
  passwordResetApprovedBy: ObjectId,        // Admin who approved reset
  passwordResetApprovedAt: Date
}
```

## Environment Variables

### Required for Production
```env
# Cookie Configuration
COOKIE_DOMAIN=app.catphishlabs.ca
COOKIE_SECURE=true
COOKIE_SAMESITE=Lax

# Email Service
MAIL_FROM=noreply@catphishlabs.ca
MAIL_PROVIDER=console  # or 'ses', 'sendgrid'

# Frontend URL (for password reset links)
FRONTEND_URL=https://app.catphishlabs.ca
```

### Local Development
```env
# Cookie Configuration (local)
COOKIE_SECURE=false
# COOKIE_DOMAIN=  # Leave blank for localhost

# Email Service (local)
MAIL_FROM=noreply@localhost
MAIL_PROVIDER=console
```

## Implementation Files

### Backend
- `backend/utils/lockout.js` - Lockout logic and thresholds
- `backend/services/mailer.js` - Email notification service
- `backend/controllers/auth.controller.js` - Login flow with lockout enforcement
- `backend/controllers/admin.controller.js` - Admin unlock/reset endpoints
- `backend/middleware/lockout.middleware.js` - Lockout check middleware
- `backend/routes/auth.route.js` - Auth routes with rate limiting
- `backend/routes/admin.route.js` - Admin routes
- `backend/models/user.model.js` - User schema with lockout fields

### Frontend
- `frontend/src/app/auth/login/page.tsx` - Login page with lockout error handling

## Testing

### Manual Test Plan

#### 1. Happy Path Login
```bash
curl -vk -X POST https://app.catphishlabs.ca/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"user@example.com","password":"CORRECT"}' -i
```
**Expected**: 200 with `Set-Cookie: accessToken=...`

#### 2. Stage 1 Lockout (30 minutes)
```bash
# Run 3 wrong passwords
for i in {1..3}; do \
  curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://app.catphishlabs.ca/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"user@example.com","password":"WRONG"}'; \
done
```
**Expected**: 
- Attempts 1-2: `401`
- Attempt 3: `423` with `remainingSeconds ≈ 1800`

#### 3. Locked Account
```bash
curl -s -i -X POST https://app.catphishlabs.ca/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"user@example.com","password":"CORRECT"}'
```
**Expected**: `423` with `remainingSeconds`

#### 4. Admin Unlock
```bash
# Get admin token first by logging in as admin
curl -s -i -X POST https://app.catphishlabs.ca/api/admin/users/<USER_ID>/unlock \
  -H "Cookie: accessToken=<ADMIN_TOKEN>"
```
**Expected**: `200 { "success": true }`

Then login succeeds and counters reset.

#### 5. Rate Limiting
```bash
# Hit login >5 times in <60s from same IP
for i in {1..6}; do \
  curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST https://app.catphishlabs.ca/api/auth/login \
  -H "content-type: application/json" \
  -d '{"email":"test@test.com","password":"test"}'; \
done
```
**Expected**: 6th request returns `429 {"error":"RATE_LIMITED"}`

#### 6. Cookie Verification
After successful login, check in DevTools:
- ✅ Cookie `accessToken` present for `https://app.catphishlabs.ca`
- ✅ Attributes: `Secure` (prod), `HttpOnly`, `SameSite=Lax`
- ✅ Domain: `app.catphishlabs.ca` (or absent if host-only)

#### 7. Refresh Route
```bash
# With cookie
curl -s -i -X GET https://app.catphishlabs.ca/api/auth/refresh \
  -H "Cookie: refreshToken=<TOKEN>"
```
**Expected**: `200` when cookie present, `401` when absent

## Deployment

### Prerequisites
1. Backend container has new environment variables
2. `express-rate-limit` package installed (`npm install express-rate-limit`)
3. ALB routes `/api/*` to backend
4. `trust proxy` set in server.js

### Steps
1. Update `backend.env` on server with required variables
2. Rebuild backend image: `docker build -t phishnclick-backend:latest ./backend`
3. Push to registry: `docker push nguyenthaohan214/phishnclick-backend:latest`
4. Restart backend container: `docker compose -f docker-compose.prod.yml up -d backend`
5. Clear browser cache and cookies before testing

### Verification
```bash
# Check backend logs for trust proxy
docker logs phishnclick-backend-1 | grep "trust proxy"

# Check rate limiting works
curl -I https://app.catphishlabs.ca/api/auth/login

# Verify lockout thresholds
# (Follow manual test plan above)
```

## Security Considerations

### Token Security
- Reset tokens are generated with `crypto.randomBytes(32)`
- Tokens are hashed with SHA-256 before storage
- Tokens expire after 1 hour
- Tokens are single-use (cleared after password reset)

### Cookie Security
- `HttpOnly`: Prevents JavaScript access
- `Secure`: HTTPS-only in production
- `SameSite=Lax`: CSRF protection for same-origin
- Domain validation: Rejects IPs and ports

### Rate Limiting
- Per-IP tracking via `X-Forwarded-For` (ALB)
- 5 requests per minute window
- Applies to login endpoint only
- Returns 429 with JSON error

### Admin Actions
- All unlock/reset actions logged with admin email and user email
- Audit logs include timestamps and user IDs
- Admin role verified via middleware
- Cannot unlock own account (future enhancement)

## Future Enhancements

- [ ] Add SES/SendGrid email integration
- [ ] Implement password reset flow frontend
- [ ] Add CAPTCHA after N failures
- [ ] Store audit logs in database
- [ ] Add admin dashboard for locked accounts
- [ ] Implement IP-based lockout (in addition to account)
- [ ] Add notification webhooks for security team
- [ ] Implement 2FA requirement after unlock

## Troubleshooting

### "option domain is invalid" error
**Cause**: `COOKIE_DOMAIN` contains IP address, port, or invalid format  
**Fix**: Set to bare hostname only (e.g., `app.catphishlabs.ca`)

### Rate limiting not working
**Cause**: `trust proxy` not set or ALB not forwarding `X-Forwarded-For`  
**Fix**: Ensure `app.set('trust proxy', 1)` is before middleware in `server.js`

### Lockout not triggering
**Cause**: User model missing lockout fields  
**Fix**: Check MongoDB schema includes all lockout fields from user.model.js

### Email not sending
**Cause**: `MAIL_PROVIDER=console` (stub mode)  
**Fix**: This is expected. Implement SES/SendGrid integration when ready.

## Support

For issues or questions:
- Check backend logs: `docker logs phishnclick-backend-1`
- Review audit logs for admin actions
- Verify environment variables are set correctly
- Test with curl commands from manual test plan
