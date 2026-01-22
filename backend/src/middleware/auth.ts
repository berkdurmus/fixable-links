import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret-change-me';

export interface UserPayload {
  id: string;
  githubId: string;
  username: string;
  email: string | null;
  name: string | null;
  avatarUrl: string | null;
  accessToken: string;
}

/**
 * Helper to get typed user from request
 */
export function getUser(req: Request): UserPayload | undefined {
  return req.user as unknown as UserPayload | undefined;
}

/**
 * Middleware to check if user is authenticated
 */
export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check for session authentication first
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
      return next();
    }

    // Check for Bearer token in Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);

    // Try to verify as JWT
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        return res.status(401).json({ error: 'Invalid token' });
      }

      (req as any).user = user;
      return next();
    } catch (jwtError) {
      // Try to verify as session token
      const session = await prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }

      (req as any).user = session.user;
      return next();
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(userId: string): string {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Generate a session token
 */
export async function createSession(userId: string): Promise<string> {
  const { v4: uuidv4 } = await import('uuid');
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await prisma.session.create({
    data: {
      userId,
      token,
      expiresAt,
    },
  });

  return token;
}
