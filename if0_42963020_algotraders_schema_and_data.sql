-- ==============================================================================
-- AlgoTraders QBot2 Database Dump for phpMyAdmin
-- Target Host: sql313.infinityfree.com
-- Target Database: `if0_42963020_algotraders`
-- Generated: 2026-09-20T10:54:21.872Z
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. Table structure for table `users`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` varchar(64) NOT NULL,
  `email` varchar(255) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `role` enum('admin','customer') NOT NULL DEFAULT 'customer',
  `is_verified` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_enabled` tinyint(1) NOT NULL DEFAULT 0,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uniq_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table `users` (Seeded Customer & Admin Records)
-- ------------------------------------------------------------------------------
INSERT INTO `users` (`id`, `email`, `name`, `role`, `is_verified`, `two_factor_enabled`, `created_at`) VALUES
  ('usr_admin_demo', 'admin@algotrders.site', 'Chief Admin', 'admin', 1, 1, '2026-06-22 10:54:19'),
  ('usr_customer_demo', 'trader@algotrders.site', 'Alex Vance (Pro Trader)', 'customer', 1, 0, '2026-08-06 10:54:19'),
  ('usr_customer_sarah', 'sarah.trader@gmail.com', 'Sarah Connor (Quant)', 'customer', 1, 1, '2026-08-21 10:54:19'),
  ('usr_customer_rahul', 'rahul.quant@outlook.com', 'Rahul Sharma', 'customer', 1, 0, '2026-09-15 10:54:19'),
  ('usr_customer_marcus', 'marcus.fx@tradingcorp.com', 'Marcus Brody', 'customer', 1, 0, '2026-07-22 10:54:19'),
  ('usr_customer_elena', 'elena.invest@finance.de', 'Elena Rostova', 'customer', 1, 0, '2026-07-02 10:54:19'),
  ('usr_customer_david', 'david.kim@quantfund.io', 'David Kim (Algo Alpha)', 'customer', 1, 0, '2026-09-16 10:54:19'),
  ('usr_customer_priya', 'priya.patel@mumbaifx.com', 'Priya Patel (HFT Strategy)', 'customer', 1, 0, '2026-08-11 10:54:19'),
  ('usr_customer_carlos', 'carlos.mendez@forexmadrid.es', 'Carlos Mendez (Scalper)', 'customer', 1, 0, '2026-08-16 10:54:19'),
  ('usr_customer_james', 'james.wilson@chicagoquants.com', 'James Wilson', 'customer', 1, 0, '2026-08-01 10:54:19');

-- ------------------------------------------------------------------------------
-- 2. Table structure for table `subscriptions`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `subscriptions`;
CREATE TABLE `subscriptions` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `plan_id` varchar(64) NOT NULL,
  `status` enum('active','trialing','past_due','canceled','halted','pending','suspended') NOT NULL,
  `provider` varchar(32) NOT NULL DEFAULT 'razorpay',
  `razorpay_subscription_id` varchar(128) DEFAULT NULL,
  `razorpay_customer_id` varchar(128) DEFAULT NULL,
  `razorpay_plan_id` varchar(128) DEFAULT NULL,
  `current_period_start` datetime NOT NULL,
  `current_period_end` datetime NOT NULL,
  `cancel_at_period_end` tinyint(1) NOT NULL DEFAULT 0,
  `max_devices` int(11) NOT NULL DEFAULT 2,
  `payment_method_last4` varchar(8) DEFAULT NULL,
  `payment_method_brand` varchar(64) DEFAULT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_subscriptions_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table `subscriptions`
-- ------------------------------------------------------------------------------
INSERT INTO `subscriptions` (`id`, `user_id`, `plan_id`, `status`, `provider`, `razorpay_subscription_id`, `razorpay_customer_id`, `razorpay_plan_id`, `current_period_start`, `current_period_end`, `cancel_at_period_end`, `max_devices`, `payment_method_last4`, `payment_method_brand`, `created_at`) VALUES
  ('sub_alex_annual', 'usr_customer_demo', 'annual', 'active', 'razorpay', 'sub_rzp_annual_98214', 'cust_rzp_9921_alex', 'plan_QBot2Yearly470', '2026-08-21 10:54:19', '2027-08-21 10:54:19', 0, 3, '4242', 'Visa / Razorpay Autopay', '2026-08-21 10:54:19'),
  ('sub_sarah_monthly', 'usr_customer_sarah', 'monthly', 'active', 'razorpay', 'sub_rzp_monthly_41290', 'cust_rzp_4129_sarah', 'plan_QBot2Monthly49', '2026-09-08 10:54:19', '2026-10-08 10:54:19', 0, 2, '8811', 'Mastercard / Razorpay Autopay', '2026-09-08 10:54:19'),
  ('sub_rahul_pending', 'usr_customer_rahul', 'monthly', 'pending', 'razorpay', 'sub_rzp_pending_77182', 'cust_rzp_7718_rahul', 'plan_QBot2Monthly49', '2026-09-18 10:54:19', '2026-09-25 10:54:19', 0, 2, NULL, NULL, '2026-09-18 10:54:19'),
  ('sub_marcus_halted', 'usr_customer_marcus', 'monthly', 'halted', 'razorpay', 'sub_rzp_halted_55210', 'cust_rzp_5521_marcus', 'plan_QBot2Monthly49', '2026-08-06 10:54:19', '2026-09-15 10:54:19', 1, 2, '1004', 'American Express', '2026-08-06 10:54:19'),
  ('sub_elena_canceled', 'usr_customer_elena', 'monthly', 'canceled', 'razorpay', 'sub_rzp_canc_33091', 'cust_rzp_3309_elena', 'plan_QBot2Monthly49', '2026-07-22 10:54:19', '2026-08-21 10:54:19', 1, 2, NULL, NULL, '2026-07-22 10:54:19'),
  ('sub_david_trial', 'usr_customer_david', 'trial', 'trialing', 'razorpay', NULL, NULL, NULL, '2026-09-16 10:54:19', '2026-09-23 10:54:19', 0, 2, NULL, NULL, '2026-09-16 10:54:19'),
  ('sub_priya_annual', 'usr_customer_priya', 'annual', 'active', 'razorpay', 'sub_rzp_priya_ann_7701', 'cust_rzp_priya_99', 'plan_QBot2Yearly470', '2026-08-11 10:54:19', '2027-08-11 10:54:19', 0, 3, '5541', 'HDFC / UPI Autopay', '2026-08-11 10:54:19'),
  ('sub_carlos_pastdue', 'usr_customer_carlos', 'monthly', 'past_due', 'razorpay', 'sub_rzp_carlos_mo_2210', 'cust_rzp_carlos_77', 'plan_QBot2Monthly49', '2026-08-16 10:54:19', '2026-09-18 10:54:19', 0, 2, '3310', 'Santander / Visa', '2026-08-16 10:54:19'),
  ('sub_james_suspended', 'usr_customer_james', 'monthly', 'suspended', 'razorpay', 'sub_rzp_james_mo_8820', 'cust_rzp_james_12', 'plan_QBot2Monthly49', '2026-08-01 10:54:19', '2026-09-30 10:54:19', 0, 2, '9002', 'Chase / Mastercard', '2026-08-01 10:54:19');

-- ------------------------------------------------------------------------------
-- 3. Table structure for table `devices`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `devices`;
CREATE TABLE `devices` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `device_name` varchar(128) NOT NULL,
  `device_type` enum('windows_backend','android_companion') NOT NULL,
  `hardware_fingerprint` varchar(255) NOT NULL,
  `ip_address` varchar(64) NOT NULL,
  `status` enum('online','offline','unpaired') NOT NULL DEFAULT 'online',
  `last_heartbeat_at` datetime NOT NULL,
  `paired_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_devices_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table `devices`
-- ------------------------------------------------------------------------------
INSERT INTO `devices` (`id`, `user_id`, `device_name`, `device_type`, `hardware_fingerprint`, `ip_address`, `status`, `last_heartbeat_at`, `paired_at`) VALUES
  ('dev_pc_win11_01', 'usr_customer_demo', 'Trading-Workstation-Win11', 'windows_backend', 'BFEBFBFF00090672-SN-99812A4', '192.168.1.145:8000', 'online', '2026-09-20 10:53:44', '2026-08-21 10:54:19'),
  ('dev_android_s24_02', 'usr_customer_demo', 'Galaxy S24 Ultra (Android 14)', 'android_mobile', 'ANDR-98A1-44B2-9901', '192.168.1.189', 'online', '2026-09-20 10:52:49', '2026-08-23 10:54:19'),
  ('dev_sarah_thinkpad', 'usr_customer_sarah', 'ThinkPad-P1-Gen6', 'windows_backend', 'INTEL-I9-38910-TP6', '10.0.0.42:8000', 'online', '2026-09-20 10:53:19', '2026-09-08 10:54:19'),
  ('dev_david_alienware', 'usr_customer_david', 'Alienware-Aurora-R16-Sim', 'windows_backend', 'ALNW-I7-8891-R16', '192.168.10.82:8000', 'online', '2026-09-20 10:53:34', '2026-09-16 10:54:19'),
  ('dev_priya_server', 'usr_customer_priya', 'Mumbai-Rack-Xeon-WinSrv22', 'windows_backend', 'XEON-DUAL-7719-SRV', '172.16.0.4:8000', 'online', '2026-09-20 10:54:04', '2026-08-11 10:54:19'),
  ('dev_priya_laptop', 'usr_customer_priya', 'ThinkPad-X1-Carbon-G11', 'windows_backend', 'LEN-X1C-9901-PRI', '192.168.1.55:8000', 'online', '2026-09-20 10:52:19', '2026-08-13 10:54:19'),
  ('dev_priya_oneplus', 'usr_customer_priya', 'OnePlus 12 (Companion)', 'android_mobile', 'ANDR-OP12-7712', '192.168.1.99', 'online', '2026-09-20 10:52:59', '2026-08-16 10:54:19'),
  ('dev_carlos_pc', 'usr_customer_carlos', 'Madrid-Desk-Win11', 'windows_backend', 'WIN-MADRID-3301', '192.168.0.12:8000', 'offline', '2026-09-18 10:54:19', '2026-08-16 10:54:19');

-- ------------------------------------------------------------------------------
-- 4. Table structure for table `payment_transactions`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `payment_transactions`;
CREATE TABLE `payment_transactions` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `razorpay_payment_id` varchar(128) DEFAULT NULL,
  `razorpay_order_id` varchar(128) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(8) NOT NULL DEFAULT 'USD',
  `status` varchar(32) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table `payment_transactions`
-- ------------------------------------------------------------------------------
INSERT INTO `payment_transactions` (`id`, `user_id`, `razorpay_payment_id`, `razorpay_order_id`, `amount`, `currency`, `status`, `created_at`) VALUES
  ('tx_001_alex_annual', 'usr_customer_demo', NULL, NULL, 470, 'USD', 'captured', '2026-08-21 10:54:19'),
  ('tx_priya_annual_01', 'usr_customer_priya', NULL, NULL, 470, 'USD', 'captured', '2026-08-11 10:54:19'),
  ('tx_carlos_pastdue_fail', 'usr_customer_carlos', NULL, NULL, 49, 'USD', 'failed', '2026-09-18 10:54:19'),
  ('tx_002_sarah_month1', 'usr_customer_sarah', NULL, NULL, 49, 'USD', 'captured', '2026-09-08 10:54:19'),
  ('tx_003_marcus_fail', 'usr_customer_marcus', NULL, NULL, 49, 'USD', 'failed', '2026-09-15 10:54:19'),
  ('tx_004_elena_refund', 'usr_customer_elena', NULL, NULL, 49, 'USD', 'refunded', '2026-08-21 10:54:19');

-- ------------------------------------------------------------------------------
-- 5. Table structure for table `webhook_events`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `webhook_events`;
CREATE TABLE `webhook_events` (
  `id` varchar(64) NOT NULL,
  `event_type` varchar(64) NOT NULL,
  `payload` text DEFAULT NULL,
  `idempotency_key` varchar(128) DEFAULT NULL,
  `processed_at` datetime NOT NULL,
  `delivery_status` varchar(32) NOT NULL DEFAULT 'delivered',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table `webhook_events`
-- ------------------------------------------------------------------------------
INSERT INTO `webhook_events` (`id`, `event_type`, `payload`, `idempotency_key`, `processed_at`, `delivery_status`) VALUES
  ('wh_evt_001', 'subscription.activated', '{}', NULL, '2026-08-21 10:54:19', NULL),
  ('wh_evt_002', 'subscription.charged', '{}', NULL, '2026-09-08 10:54:19', NULL),
  ('wh_evt_003', 'subscription.pending', '{}', NULL, '2026-09-18 10:54:19', NULL),
  ('wh_evt_004', 'subscription.halted', '{}', NULL, '2026-09-15 10:54:19', NULL),
  ('wh_evt_005', 'subscription.cancelled', '{}', NULL, '2026-08-21 10:54:19', NULL),
  ('wh_evt_006', 'payment.failed', '{}', NULL, '2026-09-15 10:54:19', NULL),
  ('wh_evt_007', 'refund.created', '{}', NULL, '2026-08-21 10:54:19', NULL);

-- ------------------------------------------------------------------------------
-- 6. Table structure for table `audit_logs`
-- ------------------------------------------------------------------------------
DROP TABLE IF EXISTS `audit_logs`;
CREATE TABLE `audit_logs` (
  `id` varchar(64) NOT NULL,
  `user_id` varchar(64) NOT NULL,
  `action` varchar(128) NOT NULL,
  `ip_address` varchar(64) DEFAULT NULL,
  `details` text DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- Dumping data for table `audit_logs`
-- ------------------------------------------------------------------------------
INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `ip_address`, `details`, `timestamp`) VALUES
  ('aud_init_01', 'usr_customer_demo', 'SUBSCRIPTION_ACTIVATED', NULL, 'Annual Pro plan active with 3 authorized device slots', '2026-08-21 10:54:19'),
  ('aud_init_02', 'usr_customer_marcus', 'SUBSCRIPTION_HALTED', NULL, 'Recurring payment retry limit reached; algorithm execution suspended', '2026-09-15 10:54:19');

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- End of SQL Dump
-- ==============================================================================
