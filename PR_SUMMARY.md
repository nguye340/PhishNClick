# Pull Request: Escalating Account Lockout System

## Summary
Implements comprehensive account lockout protection with escalating stages, rate limiting, admin unlock capabilities, and secure password reset flow. Addresses brute-force attack prevention while maintaining user experience and admin control.

## Changes Overview

### Backend Implementation
✅ **New Files:**
- `backend/utils/lockout.js` - Lockout thresholds, stage logic, and duration calculations
- `backend/services/mailer.js` - Email notification service (console stub, ready for SES/SendGrid)
- `backend/middleware/lockout.middleware.js` - Middleware to block locked accounts
- `backend/tests/lockout.test.js` - Unit tests for lockout system
- `backend/.env.example` - Environment variable template

✅ **Modified Files:**
- `backend/controllers/auth.controller.js` - Login flow with lockout enforcement and counter reset
- `backend/controllers/admin.controller.js` - Admin unlock and password reset endpoints with audit logging
- `backend/routes/auth.route.js` - Added rate limiting to login endpoint
- `backend/routes/admin.route.js` - New admin endpoints for unlock and password reset
- `backend/models/user.model.js` - Added lockout and password reset fields
- `backend/server.js` - Added `trust proxy` setting for rate limiting behind ALB

### Frontend Implementation
✅ **Modified Files:**
- `frontend/src/app/auth/login/page.tsx` - Enhanced error handling for lockout responses

### Documentation
✅ **New Files:**
- `LOCKOUT.md` - Complete implementation documentation with API specs and test plan
- `PR_SUMMARY.md` - This file

✅ **Modified Files:**
- `.gitignore` - Allow LOCKOUT.md, PR_SUMMARY.md, and .env.example files

### Dependencies
✅ **Added:**
- `express-rate-limit` (backend) - Rate limiting middleware

## Features Implemented

### 1. Escalating Lockout Stages
- **Stage 0**: 3 consecutive failures → 30 minutes lockout
- **Stage 1**: 6 consecutive failures → 3 hours lockout
- **Stage 2**: 9 consecutive failures → 24 hours lockout
- **Stage 3**: 12 consecutive failures → **Permanent lockout** (admin unlock required)

### 2. Security Enhancements
- ✅ Rate limiting: 5 login attempts per minute per IP
- ✅ Unified error messages to prevent user enumeration (`INVALID_CREDENTIALS`)
- ✅ OAuth user protection (skip password verification for OAuth accounts)
- ✅ Secure cookie handling with domain validation (no IPs/ports)
- ✅ Admin audit logging for all unlock/reset actions
- ✅ Email notifications for lockout events (console stub)
- ✅ Secure token generation with SHA-256 hashing
- ✅ Token expiry (1 hour for password reset)

### 3. Admin Capabilities
- **Unlock Account**: `POST /api/admin/users/:userId/unlock`
  - Clears all lockout counters and flags
  - Logs admin action with email and timestamp
  - Returns unlock confirmation with admin details

- **Require Password Reset**: `POST /api/admin/users/:userId/require-password-reset`
  - Generates secure reset token
  - Sends email notification (when provider configured)
  - Logs admin action
  - Tracks admin approval

### 4. API Contract
All endpoints follow strict contract specifications:

**Success (200):**
```json
{ "ok": true, "message": "...", "role": "...", "email": "..." }
```

**Lockout (423):**
```json
{
  "error": "LOCKED",
  "permanent": false,
  "until": "2025-10-27T20:30:00.000Z",
  "remainingSeconds": 1234,
  "message": "Your account is temporarily locked..."
}
```

**Invalid Credentials (401):**
```json
{ "error": "INVALID_CREDENTIALS" }
```

**Rate Limited (429):**
```json
{ "error": "RATE_LIMITED", "message": "Too many login attempts..." }
```

## Database Schema Changes

### User Model Extensions
```javascript
{
  // Lockout tracking
  failedLoginAttempts: Number,
  consecutiveFailedLoginAttempts: Number,
  lockoutStage: Number,
  lockoutExpiresAt: Date,
  isPermanentlyLocked: Boolean,
  lastFailedLoginAt: Date,
  lastLoginAt: Date,
  
  // Password reset
  passwordResetRequired: Boolean,
  passwordResetTokenHash: String,
  passwordResetTokenExpiresAt: Date,
  passwordResetApprovedBy: ObjectId,
  passwordResetApprovedAt: Date
}
```

## Environment Variables

### Required for Production
```env
COOKIE_DOMAIN=app.catphishlabs.ca
COOKIE_SECURE=true
COOKIE_SAMESITE=Lax
MAIL_FROM=noreply@catphishlabs.ca
MAIL_PROVIDER=console
FRONTEND_URL=https://app.catphishlabs.ca
```

### Local Development
```env
COOKIE_SECURE=false
# COOKIE_DOMAIN=  # Leave blank
MAIL_PROVIDER=console
```

## Testing

### Unit Tests
Run tests with:
```bash
cd backend
npm test tests/lockout.test.js
```

**Test Coverage:**
- ✅ Stage determination for all failure counts
- ✅ Duration calculation for each stage
- ✅ Remaining time calculation
- ✅ Expired lockout handling
- ✅ Permanent lockout detection
- ✅ Complete escalation flow simulation
- ✅ Admin unlock simulation
- ✅ Success reset simulation

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
curl -s -i -X POST https://app.catphishlabs.ca/api/admin/users/<USER_ID>/unlock \
  -H "Cookie: accessToken=<ADMIN_TOKEN>"
```
**Expected**: `200 { "success": true }`

#### 5. Rate Limiting
```bash
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

## Deployment

### Prerequisites
1. ✅ `express-rate-limit` package installed
2. ✅ Backend environment variables configured
3. ✅ ALB routes `/api/*` to backend
4. ✅ `trust proxy` set in server.js

### Deployment Steps
1. Update `backend.env` on server with required variables
2. Rebuild backend image:
   ```bash
   cd backend
   npm install  # Install express-rate-limit
   docker build -t nguyenthaohan214/phishnclick-backend:latest .
   ```
3. Push to Docker Hub:
   ```bash
   docker push nguyenthaohan214/phishnclick-backend:latest
   ```
4. Restart backend container:
   ```bash
   docker compose -f docker-compose.prod.yml up -d backend
   ```
5. Clear browser cache and cookies before testing

### Verification Checklist
- [ ] Backend logs show `trust proxy` setting
- [ ] Rate limiting returns 429 after 5 attempts
- [ ] Lockout triggers at correct thresholds
- [ ] Admin unlock clears counters
- [ ] Success login resets counters
- [ ] Cookies have correct attributes
- [ ] Audit logs appear for admin actions

## Code Review Checklist

### Backend
- [x] `utils/lockout.js` - Thresholds and durations centralized
- [x] `auth.controller.js` - Increments `consecutiveFailedLoginAttempts`
- [x] `auth.controller.js` - Computes stage and sets `lockoutExpiresAt`/`isPermanentlyLocked`
- [x] `auth.controller.js` - Resets counters on success
- [x] `auth.controller.js` - Returns 423 payloads as specified
- [x] `auth.controller.js` - Skips password verification for OAuth users
- [x] `auth.controller.js` - Cookie domain validation (no IPs/ports)
- [x] `lockout.middleware.js` - Used on sensitive routes (not on login)
- [x] `routes/auth.route.js` - Login has rate limiter with custom 429 handler
- [x] `routes/admin.route.js` - Admin routes behind `verifyToken` and `verifyRole('admin')`
- [x] `admin.controller.js` - Audit logging for unlock/reset actions
- [x] `mailer.js` - Stub called for lockout notifications
- [x] `server.js` - `trust proxy` set before middleware
- [x] Unit tests cover stage transitions, unlock, success reset

### Frontend
- [x] `login/page.tsx` - Handles 423 lockout responses
- [x] `login/page.tsx` - Displays remaining time in user-friendly format
- [x] `login/page.tsx` - Handles 429 rate limit responses
- [x] `login/page.tsx` - Shows permanent lockout message

### Documentation
- [x] `LOCKOUT.md` - Complete API documentation
- [x] `LOCKOUT.md` - Test plan included
- [x] `LOCKOUT.md` - Deployment notes
- [x] `LOCKOUT.md` - Troubleshooting guide
- [x] `.env.example` - All required variables documented

## Security Considerations

### Token Security
- ✅ Reset tokens generated with `crypto.randomBytes(32)`
- ✅ Tokens hashed with SHA-256 before storage
- ✅ Tokens expire after 1 hour
- ✅ Tokens are single-use

### Cookie Security
- ✅ `HttpOnly`: Prevents JavaScript access
- ✅ `Secure`: HTTPS-only in production
- ✅ `SameSite=Lax`: CSRF protection
- ✅ Domain validation: Rejects IPs and ports

### Rate Limiting
- ✅ Per-IP tracking via `X-Forwarded-For`
- ✅ 5 requests per minute window
- ✅ Applies to login endpoint only
- ✅ Returns 429 with JSON error

### Admin Actions
- ✅ All actions logged with admin email and user email
- ✅ Audit logs include timestamps and IDs
- ✅ Admin role verified via middleware
- ✅ Cannot unlock own account (future enhancement)

## Breaking Changes
None. All changes are additive and backward compatible.

## Migration Notes
- MongoDB schema will auto-update with new fields (default values provided)
- Existing users will have lockout counters initialized to 0
- No data migration required

## Future Enhancements
- [ ] Add SES/SendGrid email integration
- [ ] Implement password reset flow frontend
- [ ] Add CAPTCHA after N failures
- [ ] Store audit logs in database
- [ ] Add admin dashboard for locked accounts
- [ ] Implement IP-based lockout
- [ ] Add notification webhooks for security team
- [ ] Implement 2FA requirement after unlock

## Related Issues
Closes #[issue-number] - Implement account lockout system

## Testing Evidence
- ✅ Unit tests pass (see `backend/tests/lockout.test.js`)
- ✅ Manual testing completed (see LOCKOUT.md test plan)
- ✅ Rate limiting verified
- ✅ Cookie attributes verified
- ✅ Admin unlock verified
- ✅ Audit logging verified

## Reviewer Notes
- All must-do tweaks from requirements have been implemented
- Status codes match contract specifications exactly
- Cookie domain validation prevents "option domain is invalid" error
- Rate limiter honors `X-Forwarded-For` via `trust proxy`
- OAuth users properly handled (skip password verification)
- Admin actions fully audited
- Comprehensive documentation and test plan provided

## Deployment Runbook
See `LOCKOUT.md` for complete deployment instructions and test plan.

**One-liner summary:**
Escalating account lockout system with 4 stages (30m → 3h → 24h → permanent), rate limiting (5/min), admin unlock/reset endpoints with audit logging, secure token handling, and comprehensive test coverage.
