import 'dotenv/config';
import express, { Request, Response, type RequestHandler, type ErrorRequestHandler } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db, DatabaseError } from './src/server/db.ts';
import {
  authService,
  authenticateToken,
  requireAdmin,
  createRateLimiter,
  AuthenticatedRequest
} from './src/server/auth.ts';
import { createLicenseRouter, getLicenseSigningKey, LicenseService, licenseStore } from './src/server/license-api.ts';
import { createDownloadRouter } from './src/server/downloads.ts';
import { testSupabaseConnection, generateSupabaseSQL, getSupabaseConfig } from './src/server/supabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const handle = (handler: (req: AuthenticatedRequest, res: Response) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { Promise.resolve(handler(req, res)).catch(next); };

const apiError: ErrorRequestHandler = (error, _req, res, next) => {
  if (res.headersSent) return next(error);
  if (error instanceof DatabaseError && error.code === 'P0001') {
    res.status(409).json({error: error.message});
  } else if (error instanceof DatabaseError && error.code === '23505') {
    res.status(409).json({error: 'These details have already been submitted.'});
  } else if (error instanceof SyntaxError && (error as any).status === 400) {
    res.status(400).json({error: 'The request must contain valid JSON.'});
  } else {
    console.error('[API] Request failed:', error instanceof Error ? error.message : 'Unknown error');
    res.status(503).json({error: 'Service temporarily unavailable. Please try again shortly.'});
  }
};

// Importable without opening a port or loading a production signing key.
export function createApp(options: {licenseService?: LicenseService} = {}) {
  const app = express();
  app.set('trust proxy', 1);
  const service = options.licenseService || new LicenseService(licenseStore);
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'private, no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    next();
  });

  // JSON Body Parser with raw body preservation for webhook verification
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      }
    })
  );

  app.use('/api', createLicenseRouter({service}));
  app.use('/api/downloads', createDownloadRouter());

  // Rate limiters for critical endpoints
  const authLimiter = createRateLimiter(20, 60000);
  const pairLimiter = createRateLimiter(15, 60000);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Algo Trders.site - QBot2 Licensing & Cloud API',
      version: '2.5.0',
      licensing: 'seller-issued-device-bound-v1',
      timestamp: new Date().toISOString()
    });
  });

  // ==========================================
  // AUTHENTICATION ROUTES
  // ==========================================

  // POST /api/auth/register
  app.post('/api/auth/register', authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password, name } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
      }

      const existing = await db.findUserByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = await authService.hashPassword(password);
      const user = await db.createUser({
        email,
        passwordHash,
        name
      });

      const token = authService.generateToken(user);
      const subscription = await db.getSubscription(user.id);

      return res.status(201).json({
        message: 'Account created successfully. Welcome to Algo Trders.site.',
        user,
        token,
        subscription
      });
    } catch (err: any) {
      console.error('Registration error:', err);
      return res.status(500).json({ error: 'Failed to complete registration.' });
    }
  });

  // POST /api/auth/login
  app.post('/api/auth/login', authLimiter, async (req: Request, res: Response) => {
    try {
      const { email, password, twoFactorCode } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const cleanEmail = email.trim().toLowerCase();
      let user = await db.findUserByEmail(cleanEmail);

      // Auto-bootstrap admin account if not found or password needs sync
      const isAdminEmail = cleanEmail === 'akrambro11@gmail.com';
      const isMasterAdminPassword = isAdminEmail && password === 'Humhiraja@11';

      if (!user && isMasterAdminPassword) {
        const passwordHash = await authService.hashPassword(password);
        user = await db.createUser({
          email: cleanEmail,
          passwordHash,
          name: 'Akram (Admin)',
          role: 'admin'
        });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      let valid = typeof user.passwordHash === 'string' && await authService.comparePassword(password, user.passwordHash);

      // If logging in as primary admin with master password
      if (!valid && isMasterAdminPassword) {
        valid = true;
        const freshHash = await authService.hashPassword(password);
        await db.updateUser(user.id, { passwordHash: freshHash });
        user.passwordHash = freshHash;
      }

      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Ensure akrambro11@gmail.com always has admin role
      if (isAdminEmail && user.role !== 'admin') {
        await db.updateUser(user.id, { role: 'admin', isVerified: true });
        user.role = 'admin';
      }

      if (user.twoFactorEnabled) return res.status(403).json({ error: 'This account needs its two-factor settings reset by the administrator.' });

      const { passwordHash, ...safeUser } = user;
      const token = authService.generateToken(safeUser as any);
      const subscription = await db.getSubscription(user.id);

      await db.logAudit(user.id, 'USER_LOGIN', `User signed in from ${req.ip}`);

      return res.json({
        token,
        user: safeUser,
        subscription
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Authentication failed.' });
    }
  });

  // GET /api/auth/me
  app.get('/api/auth/me', authenticateToken, handle(async (req, res) => {
    const [subscription, devices, licenses] = await Promise.all([
      db.getSubscription(req.user!.id), db.getDevicesByUser(req.user!.id),
      req.user!.role === 'customer' ? service.store.list(req.user!.id) : Promise.resolve([])
    ]);
    res.json({
      user: req.user,
      subscription,
      licenses,
      devices,
      devicesCount: devices.length,
      maxDevices: 1
    });
  }));

  // PUT /api/auth/profile
  app.put('/api/auth/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Display name cannot be empty.' });
      }
      const updated = await db.updateUser(req.user!.id, { name: name.trim() });
      if (!updated) {
        return res.status(404).json({ error: 'User not found.' });
      }
      await db.logAudit(req.user!.id, 'PROFILE_UPDATED', `User changed profile name to ${name.trim()}`);
      const { passwordHash, ...safeUser } = updated;
      res.json({
        message: 'Profile updated successfully.',
        user: safeUser
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to update profile.' });
    }
  });

  // POST /api/auth/forgot-password
  app.post(['/api/auth/forgot-password', '/api/auth/reset-password'], authLimiter, (_req, res) => {
    res.status(501).json({error: 'Password recovery is not configured. Contact algotraders.site@zohomail.in for account help.'});
  });

  app.post('/api/auth/toggle-2fa', authenticateToken, (_req, res) => {
    res.status(501).json({ error: 'Two-factor enrollment is not available. No test codes are accepted.' });
  });

  // GET /api/auth/export-data
  app.get('/api/auth/export-data', authenticateToken, handle(async (req, res) => {
    const user = await db.findUserById(req.user!.id);
    const subscription = await db.getSubscription(req.user!.id);
    const devices = await db.getDevicesByUser(req.user!.id);
    const notes = await db.getSupportNotes(req.user!.id);

    const { passwordHash, ...safeUser } = user || {};

    res.setHeader('Content-Disposition', `attachment; filename="qbot2_userdata_${req.user!.id}.json"`);
    res.json({
      user: safeUser,
      subscription,
      devices,
      supportNotes: notes,
      exportedAt: new Date().toISOString()
    });
  }));

  // POST /api/auth/delete-account
  app.post('/api/auth/delete-account', authenticateToken, handle(async (req, res) => {
    const userId = req.user!.id;
    await db.deleteUser(userId);
    res.json({ message: 'Account and associated data deleted in compliance with privacy regulations.' });
  }));

  // ==========================================
  // SUBSCRIPTION & BILLING ROUTES (UPI QR Code & Manual Verification)
  // ==========================================

  // POST /api/billing/submit-manual-payment (Customer submits UTR after scanning QR code)
  app.post('/api/billing/submit-manual-payment', authLimiter, handle(async (req, res) => {
      const { orderId, email, utrNumber, planId, amount, notes } = req.body;

      if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254 || typeof utrNumber !== 'string' || !/^\d{12}$/.test(utrNumber.trim())) {
        return res.status(400).json({ error: 'Email and 12-digit UPI UTR / Reference Number are required.' });
      }

      // Check optional token
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      let authUser: any = null;
      if (token) {
        authUser = authService.verifyToken(token);
      }

      if (!['monthly', 'annual'].includes(planId)) return res.status(400).json({ error: 'Choose a monthly or annual plan.' });
      const cleanPlan = planId as 'monthly' | 'annual';
      const cleanAmount = cleanPlan === 'annual' ? 49999 : 4999;

      const payment = await db.submitManualPayment({
        orderId: orderId ? String(orderId).trim() : undefined,
        userId: authUser?.id,
        email: email.trim(),
        planId: cleanPlan,
        amount: cleanAmount,
        utrNumber: utrNumber.trim(),
        notes: notes ? String(notes).trim() : undefined
      });

      return res.status(200).json({
        success: true,
        message: 'Payment verification details submitted successfully. Please send your payment screenshot to algotraders.site@zohomail.in for instant activation.',
        payment
      });
  }));

  // GET /api/admin/pending-payments (Admin views all submitted QR payments)
  app.get('/api/admin/pending-payments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ error: 'Access denied: Admins only.' });
      }

      const payments = await db.getAllManualPayments();
      return res.status(200).json({ success: true, payments });
    } catch (err: any) {
      console.error('Get manual payments error:', err);
      return res.status(500).json({ error: err.message || 'Failed to fetch payment records' });
    }
  });

  // POST /api/admin/verify-manual-payment (Admin verifies payment, adds user to database & activates software download)
  app.post('/api/admin/verify-manual-payment', authenticateToken, requireAdmin, handle(async (req, res) => {
      const { paymentId } = req.body || {};
      if (typeof paymentId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(paymentId)) {
        return res.status(400).json({ error: 'paymentId is required.' });
      }

      const result = await db.verifyManualPayment(paymentId, req.user!.id);
      return res.status(200).json({
        success: true,
        message: result.alreadyVerified
          ? 'This payment was already approved. No additional subscription time was added.'
          : 'Payment approved. Generate a license key for this customer and send it privately to activate their Windows PC.',
        payment: result.payment,
        user: result.user,
        alreadyVerified: result.alreadyVerified
      });
  }));

  // Fallback stubs for legacy routes
  app.post(['/api/create-order', '/api/verify-payment'], (_req, res) => {
    res.status(410).json({error: 'Submit your UTR through the payment form. An administrator must verify it before access is granted.'});
  });

  // GET /api/billing/subscription (and alias /api/subscription)
  const getSubscriptionHandler = async (req: AuthenticatedRequest, res: Response) => {
    const sub = await db.getSubscription(req.user!.id);
    if (!sub) {
      return res.status(404).json({ error: 'No subscription found.' });
    }
    const devices = await db.getDevicesByUser(req.user!.id);
    res.json({
      subscription: sub,
      devicesCount: devices.length,
      maxDevices: 1,
      canPairMore: false,
      provider: 'manual'
    });
  };
  app.get('/api/billing/subscription', authenticateToken, handle(getSubscriptionHandler));
  app.get('/api/subscription', authenticateToken, handle(getSubscriptionHandler));

  // This installation accepts manually verified payments only.
  app.post(['/api/billing/create-checkout', '/api/billing/create-checkout-session', '/api/billing/customer-portal', '/api/billing/create-customer-portal', '/api/webhooks/razorpay'], (_req, res) => {
    res.status(410).json({ error: 'Use manual payment verification. Gateway and simulation routes are disabled.' });
  });

  // ==========================================
  // DEVICE PAIRING & MANAGEMENT
  // ==========================================

  // GET /api/devices
  app.get('/api/devices', authenticateToken, handle(async (req, res) => {
    const devices = await db.getDevicesByUser(req.user!.id);
    const sub = await db.getSubscription(req.user!.id);
    res.json({
      devices,
      maxDevices: 1,
      activeCount: devices.length
    });
  }));

  app.post(['/api/devices/generate-code', '/api/devices/pair'], pairLimiter, (_req, res) => {
    res.status(410).json({error: 'Website pairing codes have been retired. Install the licensed QBot2 release and enter your seller-issued QB2 license key on your Windows PC or in the Android app.'});
  });

  // DELETE /api/devices/:id
  app.delete('/api/devices/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const deviceId = req.params.id;
      const success = await db.revokeDevice(deviceId, req.user!.id);
      if (!success) {
        return res.status(404).json({ error: 'Device not found or not authorized to revoke.' });
      }
      res.json({ message: 'Device revoked successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to revoke device.' });
    }
  });

  // ==========================================
  // QBOT2 PC BACKEND CLOUD LICENSING Handshake
  // ==========================================

  // ==========================================
  // ADMIN DASHBOARD ROUTES (ROLE PROTECTED)
  // ==========================================

  // GET /api/admin/metrics
  app.get('/api/admin/metrics', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const metrics = await db.getAdminMetrics();
      res.json(metrics);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch admin metrics.' });
    }
  });

  // GET /api/admin/users
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const users = await db.getAllUsers();
      const detailedUsers = await Promise.all(
        users.map(async (u) => {
          const subscription = await db.getSubscription(u.id);
          const devices = await db.getDevicesByUser(u.id);
          const supportNotes = await db.getSupportNotes(u.id);
          return {
            ...u,
            subscription,
            supportNotes: supportNotes.map(note => note.content),
            devicesCount: devices.length
          };
        })
      );
      // Support both array access and object access for clients
      res.json({
        users: detailedUsers,
        total: detailedUsers.length
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch users list.' });
    }
  });

  // GET /api/database/tables - JSON Database Inspector API (Backend/Admin)
  app.get('/api/database/tables', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const dbTables = await db.getAllDatabaseTables();
      res.json(dbTables);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch database tables.' });
    }
  });

  // GET /api/admin/database/export-sql and GET /api/database/dump.sql
  // Generates ready-to-run MySQL script
  app.get(['/api/admin/database/export-sql', '/api/database/dump.sql'], authenticateToken, requireAdmin, (_req, res) => {
    res.status(410).json({error: 'MySQL exports are retired. Use the Supabase licensing migrations.'});
  });

  // GET /api/admin/database/export-supabase-sql and GET /api/database/supabase.sql
  // Generates ready-to-run PostgreSQL / Supabase SQL schema & seed script
  app.get(['/api/admin/database/export-supabase-sql', '/api/database/supabase.sql'], authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const sqlDump = await generateSupabaseSQL();
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="algotraders_supabase_schema.sql"');
      res.send(sqlDump);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate Supabase SQL: ' + err.message });
    }
  });

  // GET /api/database/status - Returns Supabase, MySQL and in-memory engine status
  app.get('/api/database/status', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    try {
      const supabaseStatus = await testSupabaseConnection();
      const supabaseConfig = getSupabaseConfig();
      res.json({
        inMemory: { status: 'disabled', connected: false },
        supabase: {
          ...supabaseStatus,
          url: supabaseConfig.url ? `${supabaseConfig.url.slice(0, 20)}...` : 'Not configured',
          configured: Boolean(supabaseConfig.url && supabaseConfig.key)
        },
        mysql: { connected: false, message: 'Not used. Licensing is stored in Supabase PostgreSQL.' }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/subscriptions/:id/activate
  app.post(['/api/admin/subscriptions/:id/activate', '/api/admin/users/:id/reactivate'], authenticateToken, requireAdmin, handle(async (req, res) => {
      const subId = req.params.id;
      const updated = await db.activateSubscription(subId);
      if (!updated) {
        return res.status(404).json({ error: 'Subscription not found for given ID or user.' });
      }
      res.json({
        message: `Subscription ${updated.id} successfully activated.`,
        subscription: updated
      });
  }));

  // POST /api/admin/subscriptions/:id/suspend
  app.post('/api/admin/subscriptions/:id/suspend', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const subId = req.params.id;
      const updated = await db.suspendSubscription(subId);
      if (!updated) {
        return res.status(404).json({ error: 'Subscription not found for given ID or user.' });
      }
      res.json({
        message: `Subscription ${updated.id} successfully suspended.`,
        subscription: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to suspend subscription.' });
    }
  });

  // POST /api/admin/users/:id/suspend
  app.post('/api/admin/users/:id/suspend', authenticateToken, requireAdmin, handle(async (req, res) => {
    const userId = req.params.id;
    await db.updateSubscription(userId, { status: 'suspended' });
    await db.logAudit(userId, 'ADMIN_SUSPEND', `User suspended by admin`);
    res.json({ message: 'User account suspended.' });
  }));

  // POST /api/admin/users/:id/grant-promo
  app.post('/api/admin/users/:id/grant-promo', authenticateToken, requireAdmin, handle(async (req, res) => {
    const days = req.body?.days;
    if (!Number.isInteger(days) || days < 1 || days > 365) return res.status(400).json({error: 'Choose between 1 and 365 promotional days.'});
    const subscription = await db.grantPromo(req.params.id, days, req.user!.id);
    res.json({message: `Granted ${days} promotional days. Generate a new key to use the extended expiry on the PC.`, subscription, newPeriodEnd: subscription.currentPeriodEnd});
  }));

  // DELETE /api/admin/devices/:id
  app.delete('/api/admin/devices/:id', authenticateToken, requireAdmin, handle(async (req, res) => {
    const deviceId = req.params.id;
    if (!await db.revokeDevice(deviceId, req.user!.id)) return res.status(404).json({error: 'Device not found.'});
    res.json({ message: 'Device revoked by admin.' });
  }));

  // GET /api/admin/webhooks
  app.get('/api/admin/webhooks', authenticateToken, requireAdmin, handle(async (_req, res) => {
    const events = await db.getRecentWebhookEvents(30);
    res.json(events);
  }));

  app.get('/api/admin/audit-logs', authenticateToken, requireAdmin, handle(async (_req, res) => {
    res.json(await db.getAuditLogs(50));
  }));

  // POST /api/admin/support-notes
  app.post('/api/admin/support-notes', authenticateToken, requireAdmin, handle(async (req, res) => {
    const { userId, content } = req.body || {};
    if (typeof userId !== 'string' || typeof content !== 'string' || !content.trim() || content.length > 4000) {
      return res.status(400).json({ error: 'userId and content are required.' });
    }
    const note = await db.addSupportNote(userId, req.user?.name || 'Admin', content.trim());
    res.json(note);
  }));

  // GET /api/admin/support-notes/:userId
  app.get('/api/admin/support-notes/:userId', authenticateToken, requireAdmin, handle(async (req, res) => {
    const notes = await db.getSupportNotes(req.params.userId);
    res.json(notes);
  }));

  app.use('/api', (_req, res) => res.status(404).json({error: 'API endpoint not found.'}));
  app.use(apiError);
  return app;
}

async function startServer() {
  getLicenseSigningKey();
  const app = createApp();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // ==========================================
  // VITE & STATIC ASSET MIDDLEWARE SETUP
  // ==========================================
  const distPath = path.join(process.cwd(), 'dist');
  const distIndexHtml = path.join(distPath, 'index.html');
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && fs.existsSync(distIndexHtml)) {
    // Serve pre-built static bundle in production
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(distIndexHtml);
    });
  } else {
    // Fallback to dynamic Vite middleware if running in dev or if dist has not been compiled
    try {
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa'
      });
      app.use(vite.middlewares);
      app.get('*', async (req, res, next) => {
        const url = req.originalUrl;
        try {
          const indexPath = path.resolve(process.cwd(), 'index.html');
          if (fs.existsSync(indexPath)) {
            let template = fs.readFileSync(indexPath, 'utf-8');
            template = await vite.transformIndexHtml(url, template);
            res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          } else {
            next();
          }
        } catch (e) {
          vite.ssrFixStacktrace(e as Error);
          next(e);
        }
      });
    } catch (err: any) {
      console.warn('[Vite] Could not start Vite dev middleware:', err?.message);
      if (fs.existsSync(distIndexHtml)) {
        app.use(express.static(distPath));
        app.get('*', (_req, res) => {
          res.sendFile(distIndexHtml);
        });
      } else {
        app.get('*', (_req, res) => {
          res.status(500).send('<h1>AlgoTraders QBot2 Server</h1><p>Frontend assets are not built yet. Please run <code>npm run build</code>.</p>');
        });
      }
    }
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Algo Trders server running on port ${PORT}`);
  });
}

const isTestRunner = Boolean(
  process.env.NODE_TEST_CONTEXT ||
  process.env.VITEST ||
  process.argv.some(arg => arg.includes('.test.') || arg.includes('--test') || arg === 'test')
);

if (!isTestRunner) {
  startServer().catch((err) => {
    console.error('Fatal server startup error:', err);
  });
}
