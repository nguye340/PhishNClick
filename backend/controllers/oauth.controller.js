import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const buildCookieOptions = (maxAge) => {
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    maxAge,
    path: '/',
  }

  if (process.env.COOKIE_DOMAIN) {
    options.domain = process.env.COOKIE_DOMAIN
  }

  return options
}

// Generate JWT tokens
const generateTokens = (userId, payloadExtras = {}) => {
  const payload = { id: userId, ...payloadExtras }

  const accessToken = jwt.sign(
    payload,
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '15m' }
  )

  const refreshToken = jwt.sign(
    payload,
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  )

  return { accessToken, refreshToken };
};

// Google OAuth callback
export const googleCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=no_code`);
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=token_failed`);
    }

    // Get user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    const googleUser = await userInfoResponse.json();

    // Find or create user
    let user = await User.findOne({ oauth_id: googleUser.id, oauth_provider: 'google' });

    if (!user) {
      // Check if email already exists with local account
      user = await User.findOne({ email: googleUser.email });
      
      if (user && user.oauth_provider === 'local') {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=email_exists`);
      }

      // Create new user
      user = new User({
        username: googleUser.name || googleUser.email.split('@')[0],
        email: googleUser.email,
        oauth_provider: 'google',
        oauth_id: googleUser.id,
        profilePicture: googleUser.picture,
        role: 'user',
      });

      await user.save();
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id, {
      email: user.email,
      role: user.role
    });

    // Set cookies
    res.cookie('accessToken', accessToken, buildCookieOptions(15 * 60 * 1000));

    res.cookie('refreshToken', refreshToken, buildCookieOptions(7 * 24 * 60 * 60 * 1000));

    // Redirect to dashboard
    const redirectUrl = user.role === 'admin' ? '/admin' : '/dashboard';
    res.redirect(`${process.env.FRONTEND_URL}${redirectUrl}`);
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
  }
};

// GitHub OAuth callback
export const githubCallback = async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        redirect_uri: `${process.env.BACKEND_URL}/api/auth/github/callback`,
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=token_failed`);
    }

    // Get user info from GitHub
    const userInfoResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        'User-Agent': 'PhishNClick',
      },
    });

    const githubUser = await userInfoResponse.json();

    // Get user email if not public
    let email = githubUser.email;
    if (!email) {
      const emailResponse = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'User-Agent': 'PhishNClick',
        },
      });
      const emails = await emailResponse.json();
      const primaryEmail = emails.find(e => e.primary);
      email = primaryEmail ? primaryEmail.email : emails[0]?.email;
    }

    if (!email) {
      return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=no_email`);
    }

    // Find or create user
    let user = await User.findOne({ oauth_id: githubUser.id.toString(), oauth_provider: 'github' });

    if (!user) {
      // Check if email already exists with local account
      user = await User.findOne({ email });
      
      if (user && user.oauth_provider === 'local') {
        return res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=email_exists`);
      }

      // Create new user
      user = new User({
        username: githubUser.login || email.split('@')[0],
        email,
        oauth_provider: 'github',
        oauth_id: githubUser.id.toString(),
        profilePicture: githubUser.avatar_url,
        role: 'user',
      });

      await user.save();
    }

    // Generate JWT tokens
    const { accessToken, refreshToken } = generateTokens(user._id, {
      email: user.email,
      role: user.role
    });

    // Set cookies
    res.cookie('accessToken', accessToken, buildCookieOptions(15 * 60 * 1000));

    res.cookie('refreshToken', refreshToken, buildCookieOptions(7 * 24 * 60 * 60 * 1000));

    // Redirect to dashboard
    const redirectUrl = user.role === 'admin' ? '/admin' : '/dashboard';
    res.redirect(`${process.env.FRONTEND_URL}${redirectUrl}`);
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth/login?error=oauth_failed`);
  }
};
