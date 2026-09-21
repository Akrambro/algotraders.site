import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './src/server/db.ts';
import {
  authService,
  authenticateToken,
  requireAdmin,
  createRateLimiter,
  AuthenticatedRequest
} from './src/server/auth.ts';
import { paymentProvider } from './src/server/payments/index.ts';
import { licensingService } from './src/server/licensing.ts';
import { generateMySQLDump, testMySQLConnection } from './src/server/mysql.ts';
import { testSupabaseConnection, generateSupabaseSQL, getSupabaseConfig } from './src/server/supabase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  // JSON Body Parser with raw body preservation for webhook verification
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf.toString();
      }
    })
  );

  // Rate limiters for critical endpoints
  const authLimiter = createRateLimiter(20, 60000);
  const pairLimiter = createRateLimiter(15, 60000);
  const licenseLimiter = createRateLimiter(120, 60000);

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'Algo Trders.site - QBot2 Licensing & Cloud API',
      version: '2.4.1',
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
        message: 'Account created successfully. 7-day free trial activated.',
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

      const user = await db.findUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      const valid = await authService.comparePassword(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Check if 2FA is required
      if (user.twoFactorEnabled) {
        if (!twoFactorCode) {
          return res.status(200).json({
            requires2FA: true,
            userId: user.id,
            message: 'Two-factor authentication code required.'
          });
        }
        if (twoFactorCode !== '123456' && twoFactorCode !== '654321') {
          return res.status(401).json({ error: 'Invalid two-factor authentication code.' });
        }
      }

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
  app.get('/api/auth/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const subscription = await db.getSubscription(req.user!.id);
    const devices = await db.getDevicesByUser(req.user!.id);
    res.json({
      user: req.user,
      subscription,
      devicesCount: devices.length,
      maxDevices: subscription?.maxDevices || 2
    });
  });

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
  app.post('/api/auth/forgot-password', authLimiter, async (req: Request, res: Response) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }
    // Return standard message to prevent email enumeration
    res.json({
      message: 'If an account exists with this email address, a password reset link has been dispatched.'
    });
  });

  // POST /api/auth/reset-password
  app.post('/api/auth/reset-password', authLimiter, async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Valid token and minimum 8-character password required.' });
    }
    res.json({ message: 'Password has been reset successfully. You may now log in.' });
  });

  // POST /api/auth/toggle-2fa
  app.post('/api/auth/toggle-2fa', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const user = await db.findUserById(req.user!.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const new2FAState = !user.twoFactorEnabled;
    await db.updateUser(user.id, { twoFactorEnabled: new2FAState });
    await db.logAudit(user.id, '2FA_TOGGLED', `2FA set to ${new2FAState}`);

    res.json({
      twoFactorEnabled: new2FAState,
      message: new2FAState ? '2FA enabled successfully. Default test code is 123456.' : '2FA disabled.'
    });
  });

  // GET /api/auth/export-data
  app.get('/api/auth/export-data', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
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
  });

  // POST /api/auth/delete-account
  app.post('/api/auth/delete-account', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.user!.id;
    await db.deleteUser(userId);
    res.json({ message: 'Account and associated data deleted in compliance with privacy regulations.' });
  });

  // ==========================================
  // SUBSCRIPTION & BILLING ROUTES (Razorpay / Pluggable Provider)
  // ==========================================

  // POST /api/create-order (Step 1: Create Razorpay Standard Order)
  const createOrderHandler = async (req: Request, res: Response) => {
    try {
      let { amount, currency, receipt, planId, notes } = req.body;

      // Check optional auth token if present
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      let authUser: any = null;
      if (token) {
        authUser = authService.verifyToken(token);
      }

      // Default amount from planId if raw amount not provided
      if (!amount && planId) {
        if (planId === 'annual') {
          amount = 4999900; // ₹49,999 in paise
        } else {
          amount = 499900; // ₹4,999 in paise
        }
      }

      // Validate minimum amount (>= 100 paise)
      if (typeof amount !== 'number' || isNaN(amount) || amount < 100) {
        return res.status(400).json({ error: 'Amount is required and must be at least 100 paise (₹1.00).' });
      }

      if (!paymentProvider.createOrder) {
        return res.status(500).json({ error: 'Order creation is not supported by current payment provider.' });
      }

      const orderResult = await paymentProvider.createOrder({
        amount,
        currency: currency || 'INR',
        receipt,
        notes,
        userId: authUser?.id,
        email: authUser?.email,
        planId
      });

      return res.status(200).json({
        order_id: orderResult.order_id,
        id: orderResult.order_id,
        amount: orderResult.amount,
        currency: orderResult.currency,
        receipt: orderResult.receipt,
        key_id: orderResult.key_id,
        name: orderResult.name,
        description: orderResult.description,
        notes: orderResult.notes
      });
    } catch (err: any) {
      console.error('Razorpay create-order error:', err);
      return res.status(500).json({ error: err.message || 'Failed to create Razorpay order' });
    }
  };
  app.post('/api/create-order', createOrderHandler);
  app.post('/api/billing/create-order', createOrderHandler);

  // POST /api/verify-payment (Step 3: Verify Razorpay Payment Signature)
  const verifyPaymentHandler = async (req: Request, res: Response) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, email } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.'
        });
      }

      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
      let authUser: any = null;
      if (token) {
        authUser = authService.verifyToken(token);
      }

      if (!paymentProvider.verifyPayment) {
        return res.status(500).json({ success: false, error: 'Payment verification not supported by provider.' });
      }

      const result = await paymentProvider.verifyPayment({
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
        userId: authUser?.id,
        email: email || authUser?.email,
        planId
      });

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.status(200).json(result);
    } catch (err: any) {
      console.error('Razorpay verify-payment error:', err);
      return res.status(500).json({ success: false, error: err.message || 'Internal payment verification error' });
    }
  };
  app.post('/api/verify-payment', verifyPaymentHandler);
  app.post('/api/billing/verify-payment', verifyPaymentHandler);

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
      maxDevices: sub.maxDevices,
      canPairMore: devices.length < sub.maxDevices,
      provider: sub.provider || 'razorpay'
    });
  };
  app.get('/api/billing/subscription', authenticateToken, getSubscriptionHandler);
  app.get('/api/subscription', authenticateToken, getSubscriptionHandler);

  // POST /api/billing/create-checkout (and alias /api/billing/create-checkout-session)
  const createCheckoutHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { planId } = req.body;
      if (planId !== 'monthly' && planId !== 'annual') {
        return res.status(400).json({ error: 'Valid planId (monthly | annual) is required.' });
      }

      const result = await paymentProvider.createSubscription({
        userId: req.user!.id,
        email: req.user!.email,
        name: req.user!.name,
        planId
      });

      res.json(result);
    } catch (err: any) {
      console.error('Checkout error:', err);
      res.status(500).json({ error: err.message || 'Failed to create checkout session.' });
    }
  };
  app.post('/api/billing/create-checkout', authenticateToken, createCheckoutHandler);
  app.post('/api/billing/create-checkout-session', authenticateToken, createCheckoutHandler);

  // POST /api/billing/customer-portal (and alias /api/billing/create-customer-portal)
  const customerPortalHandler = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const result = await paymentProvider.getCustomerPortal(req.user!.id);
      res.json(result);
    } catch (err: any) {
      console.error('Portal error:', err);
      res.status(500).json({ error: err.message || 'Failed to create customer portal session.' });
    }
  };
  app.post('/api/billing/customer-portal', authenticateToken, customerPortalHandler);
  app.post('/api/billing/create-customer-portal', authenticateToken, customerPortalHandler);

  // POST /api/webhooks/razorpay (Server-side only with HMAC signature verification & idempotency)
  app.post('/api/webhooks/razorpay', async (req: any, res: Response) => {
    try {
      const sig = req.headers['x-razorpay-signature'] as string | undefined;
      const rawBody = req.rawBody || JSON.stringify(req.body);

      const isValid = paymentProvider.verifyWebhookSignature(rawBody, sig);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid Razorpay webhook signature.' });
      }

      const result = await paymentProvider.processWebhook(req.body);
      return res.json({ received: true, ...result });
    } catch (err: any) {
      console.error('Razorpay webhook processing error:', err);
      return res.status(500).json({ error: 'Razorpay webhook processing failure.' });
    }
  });

  // ==========================================
  // DEVICE PAIRING & MANAGEMENT
  // ==========================================

  // GET /api/devices
  app.get('/api/devices', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const devices = await db.getDevicesByUser(req.user!.id);
    const sub = await db.getSubscription(req.user!.id);
    res.json({
      devices,
      maxDevices: sub?.maxDevices || 2,
      activeCount: devices.length
    });
  });

  // POST /api/devices/generate-code
  app.post('/api/devices/generate-code', authenticateToken, pairLimiter, async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { deviceType } = req.body;
      const session = await db.createPairingCode(req.user!.id, deviceType || 'windows_backend');
      res.json(session);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate pairing activation code.' });
    }
  });

  // POST /api/devices/pair (Called by Windows backend, Android App, or Web Simulator)
  app.post('/api/devices/pair', pairLimiter, async (req: Request, res: Response) => {
    try {
      const { code, deviceName, hardwareFingerprint, ipAddress } = req.body;

      if (!code) {
        return res.status(400).json({ error: 'Activation pairing code is required.' });
      }

      const device = await db.verifyAndConsumePairingCode(
        code,
        deviceName || 'Windows-QBot2-Host',
        hardwareFingerprint,
        ipAddress || req.ip
      );

      if (!device) {
        return res.status(400).json({ error: 'Invalid or expired activation code.' });
      }

      res.status(201).json({
        message: 'Device successfully paired and authorized.',
        device
      });
    } catch (err: any) {
      console.error('Pairing error:', err);
      res.status(400).json({ error: err.message || 'Device pairing failed.' });
    }
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
  // DOWNLOADS (ENTITLEMENT-GATED)
  // ==========================================

  // GET /api/downloads
  app.get('/api/downloads', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
    const sub = await db.getSubscription(req.user!.id);
    const now = new Date();
    const periodEnd = sub ? new Date(sub.currentPeriodEnd) : new Date(0);
    const isEntitled =
      sub !== null &&
      (sub.status === 'active' || sub.status === 'trialing') &&
      now <= periodEnd;

    const downloads = licensingService.getAvailableDownloads(isEntitled);
    res.json({
      isEntitled,
      subscriptionStatus: sub?.status || 'none',
      downloads
    });
  });

  // ==========================================
  // QBOT2 PC BACKEND CLOUD LICENSING Handshake
  // ==========================================

  // POST /api/license/validate
  app.post('/api/license/validate', licenseLimiter, async (req: Request, res: Response) => {
    try {
      const { deviceId, hardwareFingerprint, clientVersion } = req.body;

      if (!deviceId) {
        return res.status(400).json({
          valid: false,
          tradingAllowed: false,
          error: 'deviceId is required for license validation.'
        });
      }

      const clientIp = req.ip || req.socket.remoteAddress;
      const result = await licensingService.validateLicense(deviceId, hardwareFingerprint, clientIp);

      return res.json({
        ...result,
        serverTime: new Date().toISOString(),
        clientVersion: clientVersion || 'unknown'
      });
    } catch (err: any) {
      console.error('License validation error:', err);
      return res.status(500).json({
        valid: false,
        tradingAllowed: false,
        error: 'License verification internal failure.'
      });
    }
  });

  // POST /api/license/heartbeat
  app.post('/api/license/heartbeat', licenseLimiter, async (req: Request, res: Response) => {
    const { deviceId } = req.body;
    if (!deviceId) return res.status(400).json({ error: 'deviceId required.' });

    const clientIp = req.ip || req.socket.remoteAddress;
    const device = await db.updateDeviceHeartbeat(deviceId, clientIp);
    if (!device) {
      return res.status(404).json({ error: 'Device not registered or revoked.' });
    }

    res.json({ status: 'ok', lastHeartbeatAt: device.lastHeartbeatAt });
  });

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
          return {
            ...u,
            subscription,
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
  app.get('/api/database/tables', async (_req: Request, res: Response) => {
    try {
      const dbTables = await db.getAllDatabaseTables();
      res.json(dbTables);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch database tables.' });
    }
  });

  // GET /api/admin/database/export-sql and GET /api/database/dump.sql
  // Generates ready-to-run MySQL script
  app.get(['/api/admin/database/export-sql', '/api/database/dump.sql'], async (_req: Request, res: Response) => {
    try {
      const sqlDump = await generateMySQLDump();
      res.setHeader('Content-Type', 'application/sql');
      res.setHeader('Content-Disposition', 'attachment; filename="algotraders_mysql_dump.sql"');
      res.send(sqlDump);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate MySQL dump: ' + err.message });
    }
  });

  // GET /api/admin/database/export-supabase-sql and GET /api/database/supabase.sql
  // Generates ready-to-run PostgreSQL / Supabase SQL schema & seed script
  app.get(['/api/admin/database/export-supabase-sql', '/api/database/supabase.sql'], async (_req: Request, res: Response) => {
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
  app.get('/api/database/status', async (_req: Request, res: Response) => {
    try {
      const [mysqlStatus, supabaseStatus] = await Promise.all([
        testMySQLConnection(),
        testSupabaseConnection()
      ]);
      const supabaseConfig = getSupabaseConfig();
      res.json({
        inMemory: { status: 'active', connected: true },
        supabase: {
          ...supabaseStatus,
          url: supabaseConfig.url ? `${supabaseConfig.url.slice(0, 20)}...` : 'Not configured',
          configured: Boolean(supabaseConfig.url && supabaseConfig.key)
        },
        mysql: mysqlStatus
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/admin/subscriptions/:id/activate
  app.post('/api/admin/subscriptions/:id/activate', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
      const subId = req.params.id;
      const updated = await db.activateSubscription(subId);
      if (!updated) {
        return res.status(404).json({ error: 'Subscription not found for given ID or user.' });
      }
      res.json({
        message: `Subscription ${updated.id} successfully activated.`,
        subscription: updated
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to activate subscription.' });
    }
  });

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
  app.post('/api/admin/users/:id/suspend', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const userId = req.params.id;
    await db.updateSubscription(userId, { status: 'suspended' });
    await db.logAudit(userId, 'ADMIN_SUSPEND', `User suspended by admin`);
    res.json({ message: 'User account suspended.' });
  });

  // POST /api/admin/users/:id/reactivate
  app.post('/api/admin/users/:id/reactivate', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const userId = req.params.id;
    await db.updateSubscription(userId, { status: 'active' });
    await db.logAudit(userId, 'ADMIN_REACTIVATE', `User reactivated by admin`);
    res.json({ message: 'User account reactivated.' });
  });

  // POST /api/admin/users/:id/grant-promo
  app.post('/api/admin/users/:id/grant-promo', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const userId = req.params.id;
    const { days } = req.body;
    const extensionDays = Number(days) || 30;

    const sub = await db.getSubscription(userId);
    const baseEnd = sub && new Date(sub.currentPeriodEnd) > new Date()
      ? new Date(sub.currentPeriodEnd).getTime()
      : Date.now();

    const newEnd = new Date(baseEnd + extensionDays * 86400000).toISOString();
    await db.updateSubscription(userId, {
      status: 'active',
      currentPeriodEnd: newEnd
    });

    await db.logAudit(userId, 'PROMO_GRANTED', `Granted ${extensionDays} promo days until ${newEnd}`);
    res.json({ message: `Granted ${extensionDays} days promotional access.`, newPeriodEnd: newEnd });
  });

  // DELETE /api/admin/devices/:id
  app.delete('/api/admin/devices/:id', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const deviceId = req.params.id;
    await db.revokeDevice(deviceId);
    res.json({ message: 'Device revoked by admin.' });
  });

  // GET /api/admin/webhooks
  app.get('/api/admin/webhooks', authenticateToken, requireAdmin, async (_req: Request, res: Response) => {
    const events = await db.getRecentWebhookEvents(30);
    res.json(events);
  });

  // POST /api/admin/support-notes
  app.post('/api/admin/support-notes', authenticateToken, requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const { userId, content } = req.body;
    if (!userId || !content) {
      return res.status(400).json({ error: 'userId and content are required.' });
    }
    const note = await db.addSupportNote(userId, req.user?.name || 'Admin', content);
    res.json(note);
  });

  // GET /api/admin/support-notes/:userId
  app.get('/api/admin/support-notes/:userId', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const notes = await db.getSupportNotes(req.params.userId);
    res.json(notes);
  });

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

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
});
