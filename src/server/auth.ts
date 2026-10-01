import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';
import { User } from '../types.ts';

const configuredSecret = process.env.JWT_SECRET;
if (!configuredSecret || configuredSecret.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('[Auth] JWT_SECRET is not configured or shorter than 32 characters. Using an ephemeral secret for this session. Configure JWT_SECRET in environment variables to persist sessions across restarts.');
  }
}
const JWT_SECRET = (configuredSecret && configuredSecret.length >= 32) ? configuredSecret : crypto.randomBytes(48).toString('hex');

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export const authService = {
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  },

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  generateToken(user: User): string {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '1d', algorithm: 'HS256', issuer: 'algotraders-web', audience: 'algotraders-dashboard' }
    );
  },

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'], issuer: 'algotraders-web', audience: 'algotraders-dashboard' });
    } catch {
      return null;
    }
  }
};

export function createRateLimiter(maxRequests: number = 20, windowMs: number = 60000) {
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  let nextCleanup = 0;
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'anonymous';
    const key = `${req.path}:${ip}`;
    const now = Date.now();
    if (now >= nextCleanup) {
      for (const [entry,record] of rateLimitMap) if (record.resetAt <= now) rateLimitMap.delete(entry);
      nextCleanup = now + windowMs;
    }

    const record = rateLimitMap.get(key);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please slow down and try again shortly.'
      });
    }

    record.count++;
    next();
  };
}

// Authentication middleware
export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  const payload = authService.verifyToken(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ error: 'Invalid or expired access token.' });
  }

  let user;
  try { user = await db.findUserById(payload.id); }
  catch { return res.status(503).json({ error: 'Account database temporarily unavailable.' }); }
  if (!user) {
    return res.status(401).json({ error: 'User account no longer exists.' });
  }

  const { passwordHash, ...safeUser } = user;
  req.user = safeUser as User;
  next();
}

// Admin authorization middleware
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Administrator permissions required.' });
  }
  next();
}
