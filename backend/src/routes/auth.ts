import { Router, Request, Response } from 'express';
import passport from 'passport';
import { generateToken, createSession } from '../middleware/auth';

export const authRouter = Router();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

/**
 * Initiate GitHub OAuth flow
 */
authRouter.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo', 'read:org'] }));

/**
 * GitHub OAuth callback
 */
authRouter.get(
  '/github/callback',
  passport.authenticate('github', { failureRedirect: `${FRONTEND_URL}/login?error=auth_failed` }),
  async (req: Request, res: Response) => {
    try {
      const user = req.user as any;
      if (!user) {
        return res.redirect(`${FRONTEND_URL}/login?error=no_user`);
      }

      // Generate token for the extension
      const token = generateToken(user.id);

      // Redirect back to frontend/extension with token
      // For extension, we use a special protocol or postMessage
      res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${FRONTEND_URL}/login?error=server_error`);
    }
  }
);

/**
 * Get current user
 */
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    // Check session auth
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      const user = req.user as any;
      return res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      });
    }

    // Check bearer token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Token verification handled by middleware in protected routes
    return res.status(401).json({ error: 'Not authenticated' });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * Logout
 */
authRouter.post('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

/**
 * Exchange extension auth code for token (for Chrome extension popup flow)
 */
authRouter.post('/token', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Authorization code required' });
    }

    // This would be used for a custom OAuth flow for the extension
    // For now, we'll use the session-based flow
    res.status(501).json({ error: 'Not implemented - use /auth/github flow' });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
