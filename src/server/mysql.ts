import mysql from 'mysql2/promise';
import { db } from './db.ts';

interface MySQLConfig {
  host: string;
  port: number;
  user: string;
  password?: string;
  database: string;
}

export const getMySQLConfig = (): MySQLConfig => {
  return {
    host: process.env.MYSQL_HOST || 'sql313.infinityfree.com',
    port: parseInt(process.env.MYSQL_PORT || '3306', 10),
    user: process.env.MYSQL_USER || 'if0_42963020',
    password: process.env.MYSQL_PASSWORD || 'RWq7haWqgPnbpp',
    database: process.env.MYSQL_DATABASE || 'if0_42963020_algotraders'
  };
};

let pool: mysql.Pool | null = null;
let lastConnectionAttempt: { success: boolean; message: string; timestamp: Date } | null = null;

export const getMySQLPool = (): mysql.Pool | null => {
  const config = getMySQLConfig();
  if (!pool && config.host && config.user) {
    try {
      pool = mysql.createPool({
        host: config.host,
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        waitForConnections: true,
        connectionLimit: 5,
        queueLimit: 0,
        connectTimeout: 5000
      });
    } catch (err: any) {
      console.warn('[MySQL] Failed to initialize connection pool:', err.message);
      pool = null;
    }
  }
  return pool;
};

export const testMySQLConnection = async (): Promise<{ connected: boolean; message: string }> => {
  const config = getMySQLConfig();
  try {
    const currentPool = getMySQLPool();
    if (!currentPool) {
      return {
        connected: false,
        message: 'MySQL pool could not be initialized.'
      };
    }
    const connection = await currentPool.getConnection();
    await connection.ping();
    connection.release();
    lastConnectionAttempt = {
      success: true,
      message: `Connected successfully to MySQL host ${config.host} / DB: ${config.database}`,
      timestamp: new Date()
    };
    return { connected: true, message: lastConnectionAttempt.message };
  } catch (err: any) {
    const msg = err.code === 'EAI_AGAIN' || err.code === 'ENODATA' || err.code === 'ETIMEDOUT'
      ? `Remote direct port 3306 blocked by InfinityFree firewall (${err.code}). Free hosting requires phpMyAdmin import or PHP bridge.`
      : `MySQL connection error: ${err.message}`;

    lastConnectionAttempt = {
      success: false,
      message: msg,
      timestamp: new Date()
    };
    return { connected: false, message: msg };
  }
};

/**
 * Generates a complete, ready-to-run MySQL SQL dump
 * that can be pasted directly into phpMyAdmin:
 * https://php-myadmin.net/db_structure.php?db=if0_42963020_algotraders
 */
export const generateMySQLDump = async (): Promise<string> => {
  const data = await db.getAllDatabaseTables();
  const { users, subscriptions, devices, transactions, webhooks, auditLogs } = data.tables;

  const sanitize = (val: any): string => {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'number') return val.toString();
    if (typeof val === 'boolean') return val ? '1' : '0';
    if (typeof val === 'object') {
      if (val instanceof Date) {
        return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
      }
      return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    }
    const str = String(val);
    // Format ISO timestamps (e.g. 2026-08-21T10:45:40.062Z) to standard MySQL DATETIME: YYYY-MM-DD HH:MM:SS
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str)) {
      return `'${str.slice(0, 19).replace('T', ' ')}'`;
    }
    return `'${str.replace(/'/g, "''")}'`;
  };

  const dbName = getMySQLConfig().database || 'if0_42963020_algotraders';

  let sql = `-- ==============================================================================
-- AlgoTraders QBot2 Database Dump for phpMyAdmin
-- Target Host: sql313.infinityfree.com
-- Target Database: \`${dbName}\`
-- Generated: ${new Date().toISOString()}
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Table structure for table \`users\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`users\`;
CREATE TABLE \`users\` (
  \`id\` varchar(64) NOT NULL,
  \`email\` varchar(255) NOT NULL,
  \`name\` varchar(255) DEFAULT NULL,
  \`password_hash\` varchar(255) DEFAULT NULL,
  \`role\` enum('admin','customer') NOT NULL DEFAULT 'customer',
  \`is_verified\` tinyint(1) NOT NULL DEFAULT 0,
  \`two_factor_enabled\` tinyint(1) NOT NULL DEFAULT 0,
  \`two_factor_secret\` varchar(255) DEFAULT NULL,
  \`created_at\` datetime NOT NULL,
  \`updated_at\` datetime DEFAULT NULL,
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`uniq_users_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table \`users\` (Seeded Customer & Admin Records)
-- ------------------------------------------------------------------------------
`;

  if (users.length > 0) {
    sql += 'INSERT INTO `users` (`id`, `email`, `name`, `role`, `is_verified`, `two_factor_enabled`, `created_at`) VALUES\n';
    const userRows = users.map((u: any) =>
      `  (${sanitize(u.id)}, ${sanitize(u.email)}, ${sanitize(u.name)}, ${sanitize(u.role)}, ${u.isVerified ? 1 : 0}, ${u.twoFactorEnabled ? 1 : 0}, ${sanitize(u.createdAt)})`
    );
    sql += userRows.join(',\n') + ';\n\n';
  }

  sql += `-- ------------------------------------------------------------------------------
-- 2. Table structure for table \`subscriptions\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`subscriptions\`;
CREATE TABLE \`subscriptions\` (
  \`id\` varchar(64) NOT NULL,
  \`user_id\` varchar(64) NOT NULL,
  \`plan_id\` varchar(64) NOT NULL,
  \`status\` enum('active','trialing','past_due','canceled','halted','pending','suspended') NOT NULL,
  \`provider\` varchar(32) NOT NULL DEFAULT 'razorpay',
  \`razorpay_subscription_id\` varchar(128) DEFAULT NULL,
  \`razorpay_customer_id\` varchar(128) DEFAULT NULL,
  \`razorpay_plan_id\` varchar(128) DEFAULT NULL,
  \`current_period_start\` datetime NOT NULL,
  \`current_period_end\` datetime NOT NULL,
  \`cancel_at_period_end\` tinyint(1) NOT NULL DEFAULT 0,
  \`max_devices\` int(11) NOT NULL DEFAULT 2,
  \`payment_method_last4\` varchar(8) DEFAULT NULL,
  \`payment_method_brand\` varchar(64) DEFAULT NULL,
  \`created_at\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_subscriptions_user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table \`subscriptions\`
-- ------------------------------------------------------------------------------
`;

  if (subscriptions.length > 0) {
    sql += 'INSERT INTO `subscriptions` (`id`, `user_id`, `plan_id`, `status`, `provider`, `razorpay_subscription_id`, `razorpay_customer_id`, `razorpay_plan_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `max_devices`, `payment_method_last4`, `payment_method_brand`, `created_at`) VALUES\n';
    const subRows = subscriptions.map((s: any) =>
      `  (${sanitize(s.id)}, ${sanitize(s.userId)}, ${sanitize(s.planId)}, ${sanitize(s.status)}, ${sanitize(s.provider || 'razorpay')}, ${sanitize(s.razorpaySubscriptionId)}, ${sanitize(s.razorpayCustomerId)}, ${sanitize(s.razorpayPlanId)}, ${sanitize(s.currentPeriodStart)}, ${sanitize(s.currentPeriodEnd)}, ${s.cancelAtPeriodEnd ? 1 : 0}, ${s.maxDevices || 2}, ${sanitize(s.paymentMethodLast4)}, ${sanitize(s.paymentMethodBrand)}, ${sanitize(s.createdAt)})`
    );
    sql += subRows.join(',\n') + ';\n\n';
  }

  sql += `-- ------------------------------------------------------------------------------
-- 3. Table structure for table \`devices\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`devices\`;
CREATE TABLE \`devices\` (
  \`id\` varchar(64) NOT NULL,
  \`user_id\` varchar(64) NOT NULL,
  \`device_name\` varchar(128) NOT NULL,
  \`device_type\` enum('windows_backend','android_companion') NOT NULL,
  \`hardware_fingerprint\` varchar(255) NOT NULL,
  \`ip_address\` varchar(64) NOT NULL,
  \`status\` enum('online','offline','unpaired') NOT NULL DEFAULT 'online',
  \`last_heartbeat_at\` datetime NOT NULL,
  \`paired_at\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_devices_user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table \`devices\`
-- ------------------------------------------------------------------------------
`;

  if (devices.length > 0) {
    sql += 'INSERT INTO `devices` (`id`, `user_id`, `device_name`, `device_type`, `hardware_fingerprint`, `ip_address`, `status`, `last_heartbeat_at`, `paired_at`) VALUES\n';
    const devRows = devices.map((d: any) =>
      `  (${sanitize(d.id)}, ${sanitize(d.userId)}, ${sanitize(d.deviceName)}, ${sanitize(d.deviceType)}, ${sanitize(d.hardwareFingerprint)}, ${sanitize(d.ipAddress)}, ${sanitize(d.status)}, ${sanitize(d.lastHeartbeatAt)}, ${sanitize(d.pairedAt)})`
    );
    sql += devRows.join(',\n') + ';\n\n';
  }

  sql += `-- ------------------------------------------------------------------------------
-- 4. Table structure for table \`payment_transactions\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`payment_transactions\`;
CREATE TABLE \`payment_transactions\` (
  \`id\` varchar(64) NOT NULL,
  \`user_id\` varchar(64) NOT NULL,
  \`razorpay_payment_id\` varchar(128) DEFAULT NULL,
  \`razorpay_order_id\` varchar(128) DEFAULT NULL,
  \`amount\` decimal(10,2) NOT NULL,
  \`currency\` varchar(8) NOT NULL DEFAULT 'USD',
  \`status\` varchar(32) NOT NULL,
  \`created_at\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_tx_user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table \`payment_transactions\`
-- ------------------------------------------------------------------------------
`;

  if (transactions.length > 0) {
    sql += 'INSERT INTO `payment_transactions` (`id`, `user_id`, `razorpay_payment_id`, `razorpay_order_id`, `amount`, `currency`, `status`, `created_at`) VALUES\n';
    const txRows = transactions.map((t: any) =>
      `  (${sanitize(t.id)}, ${sanitize(t.userId)}, ${sanitize(t.razorpayPaymentId)}, ${sanitize(t.razorpayOrderId)}, ${t.amount}, ${sanitize(t.currency || 'USD')}, ${sanitize(t.status)}, ${sanitize(t.createdAt)})`
    );
    sql += txRows.join(',\n') + ';\n\n';
  }

  sql += `-- ------------------------------------------------------------------------------
-- 5. Table structure for table \`webhook_events\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`webhook_events\`;
CREATE TABLE \`webhook_events\` (
  \`id\` varchar(64) NOT NULL,
  \`event_type\` varchar(64) NOT NULL,
  \`payload\` text DEFAULT NULL,
  \`idempotency_key\` varchar(128) DEFAULT NULL,
  \`processed_at\` datetime NOT NULL,
  \`delivery_status\` varchar(32) NOT NULL DEFAULT 'delivered',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table \`webhook_events\`
-- ------------------------------------------------------------------------------
`;

  if (webhooks.length > 0) {
    sql += 'INSERT INTO `webhook_events` (`id`, `event_type`, `payload`, `idempotency_key`, `processed_at`, `delivery_status`) VALUES\n';
    const whRows = webhooks.map((w: any) =>
      `  (${sanitize(w.id)}, ${sanitize(w.eventType)}, ${sanitize(JSON.stringify(w.payload || {}))}, ${sanitize(w.idempotencyKey)}, ${sanitize(w.processedAt)}, ${sanitize(w.deliveryStatus)})`
    );
    sql += whRows.join(',\n') + ';\n\n';
  }

  sql += `-- ------------------------------------------------------------------------------
-- 6. Table structure for table \`audit_logs\`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS \`audit_logs\`;
CREATE TABLE \`audit_logs\` (
  \`id\` varchar(64) NOT NULL,
  \`user_id\` varchar(64) NOT NULL,
  \`action\` varchar(128) NOT NULL,
  \`ip_address\` varchar(64) DEFAULT NULL,
  \`details\` text DEFAULT NULL,
  \`timestamp\` datetime NOT NULL,
  PRIMARY KEY (\`id\`),
  KEY \`idx_audit_user_id\` (\`user_id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table \`audit_logs\`
-- ------------------------------------------------------------------------------
`;

  if (auditLogs && auditLogs.length > 0) {
    sql += 'INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `details`, `timestamp`) VALUES\n';
    const auditRows = auditLogs.map((a: any) =>
      `  (${sanitize(a.id)}, ${sanitize(a.userId)}, ${sanitize(a.action)}, ${sanitize(a.ipAddress)}, ${sanitize(a.details)}, ${sanitize(a.timestamp)})`
    );
    sql += auditRows.join(',\n') + ';\n\n';
  }

  sql += `SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- End of SQL Dump
-- ==============================================================================
`;

  return sql;
};
