import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

/**
 * Reads the access token (HttpOnly cookie first, then Bearer header as fallback),
 * verifies signature, loads the user, enforces tokenVersion (revocation),
 * and attaches a minimal req.user.
 *
 * 401 No token / expired / revoked
 * 403 Valid token but not authorized for a given role (handled in verifyRole)
 */
export const verifyToken = async (req, res, next) => {
  try {
    // Prefer HttpOnly cookie; fallback to Authorization Bearer for tooling
    const cookieToken = req.cookies?.accessToken;
    const header = req.get('authorization') || '';
    const bearerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = cookieToken || bearerToken;

    if (!token) {
      return res.status(401).json({ error: 'NO_TOKEN', message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      // expected payload fields: { sub: <userId>, role: 'admin'|'user', tv: <tokenVersion> }
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'TOKEN_EXPIRED' });
      }
      return res.status(401).json({ error: 'INVALID_TOKEN' });
    }

    // Load user to check revocation and role from DB
    const userId = decoded.sub || decoded.id; // support either claim name
    if (!userId) {
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'Missing subject' });
    }

    const dbUser = await User.findById(userId).select('_id role tokenVersion isPermanentlyLocked lockoutExpiresAt');
    if (!dbUser) {
      return res.status(401).json({ error: 'INVALID_TOKEN', message: 'User not found' });
    }

    // Token revocation: compare tokenVersion in JWT vs DB
    const tokenVersion = typeof decoded.tv === 'number' ? decoded.tv : 0;
    const dbVersion = typeof dbUser.tokenVersion === 'number' ? dbUser.tokenVersion : 0;
    if (tokenVersion !== dbVersion) {
      return res.status(401).json({ error: 'TOKEN_REVOKED' });
    }

    // Attach minimal safe context
    req.user = {
      id: dbUser._id.toString(),
      role: dbUser.role,
      tv: dbVersion,
    };

    return next();
  } catch (err) {
    console.error('verifyToken error:', err);
    return res.status(500).json({ error: 'INTERNAL', message: 'Internal server error' });
  }
};

/**
 * Role gate. Accepts a string or an array of allowed roles.
 * Returns 403 when authenticated but unauthorized.
 */
export const verifyRole = (required) => {
  const allowed = Array.isArray(required) ? required : [required];
  return (req, res, next) => {
    const role = req.user?.role;
    if (!role) return res.status(401).json({ error: 'NO_TOKEN' });
    if (!allowed.includes(role)) {
      return res.status(403).json({ error: 'FORBIDDEN' });
    }
    next();
  };
};

export default verifyToken;