import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './db.ts';
import { User } from '../types.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'algotrders_qbot2_production_secret_key_2026';

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
      { expiresIn: '7d' }
    );
  },

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }
};

// Rate limiter map to protect login, pairing, and license verification
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

export function createRateLimiter(maxRequests: number = 20, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip = req.ip || req.socket.remoteAddress || 'anonymous';
    const key = `${req.path}:${ip}`;
    const now = Date.now();

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

  const user = await db.findUserById(payload.id);
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
