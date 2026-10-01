import assert from 'node:assert/strict';
import {test} from 'node:test';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {hasActiveSubscription, getSubscriptionStatus} from '../src/subscriptions.ts';
import {getLicenseStatus} from '../src/license-status.ts';
import {CustomerLicenseStatus} from '../src/components/CustomerLicenseStatus.tsx';
import type {LicenseRecord, Subscription} from '../src/types.ts';

const now = Date.now();
const subscription: Subscription = {id:'sub',userId:'customer',planId:'monthly',status:'active',provider:'manual',
  currentPeriodStart:new Date(now-10000).toISOString(),currentPeriodEnd:new Date(now+86400000).toISOString(),cancelAtPeriodEnd:false,maxDevices:1};
const license: LicenseRecord = {id:'license',user_id:'customer',subscription_id:'sub',key_prefix:'QB2-12345678',status:'active',
  device_id:'device',expires_at:subscription.currentPeriodEnd,issued_at:subscription.currentPeriodStart,activated_at:subscription.currentPeriodStart,revoked_at:null};

test('website entitlement and status respect paid period boundaries, missing dates and suspension', () => {
  assert.equal(hasActiveSubscription(subscription,now),true);
  assert.equal(getSubscriptionStatus({...subscription,currentPeriodEnd:new Date(now).toISOString()},now),'expired');
  assert.equal(getSubscriptionStatus({...subscription,currentPeriodStart:new Date(now+1).toISOString()},now),'pending');
  for (const status of ['trialing','inactive','suspended','halted','canceled','pending','unpaid'] as const) {
    assert.equal(hasActiveSubscription({...subscription,status},now),false);
  }
  assert.equal(getSubscriptionStatus({...subscription,currentPeriodEnd:'invalid'},now),'inactive');
  assert.equal(hasActiveSubscription(null,now),false);
  assert.equal(hasActiveSubscription({...subscription,cancelAtPeriodEnd:true},now),true);
});

test('license status never hides revocation behind expiry or mistakes suspension for an active PC', () => {
  assert.equal(getLicenseStatus(license,subscription,now),'active');
  assert.equal(getLicenseStatus({...license,status:'issued'},subscription,now),'ready to activate');
  assert.equal(getLicenseStatus(license,{...subscription,status:'suspended'},now),'subscription inactive');
  assert.equal(getLicenseStatus({...license,expires_at:new Date(now).toISOString()},subscription,now),'expired');
  assert.equal(getLicenseStatus({...license,status:'revoked',expires_at:new Date(now-1).toISOString()},subscription,now),'revoked');
});

test('customer sees separate paid subscription and PC key expiries after renewal', () => {
  const extended={...subscription,currentPeriodEnd:new Date(now+10*86400000).toISOString()};
  const html=renderToStaticMarkup(React.createElement(CustomerLicenseStatus,{licenses:[license],subscription:extended,onActivate:()=>{}}));
  assert.match(html,/subscription has been extended/);
  assert.match(html,/current PC key keeps the expiry/);
  assert.match(html,/Device ID:/);
  assert.match(html,/QB2-12345678/);
  const waiting=renderToStaticMarkup(React.createElement(CustomerLicenseStatus,{licenses:[],subscription,onActivate:()=>{}}));
  assert.match(waiting,/Payment approved/);
  assert.match(waiting,/Ask the seller/);
});
