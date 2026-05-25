// Daily cron endpoint — charge all active subscriptions whose nextBillingDate is today or past.
// Also sends renewal reminders for subscriptions billing in ~3 days.
// Called by GitHub Actions on a schedule; protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { chargeRecurring } from '@/lib/tbank';
import {
  notifyAdminRenewalCharged,
  notifyAdminRenewalFailed,
  notifyAdminCronSummary,
  notifyUserRenewalCharged,
  notifyUserRenewalFailed,
  notifyUserRenewalReminder,
} from '@/lib/notify';

const SUBSCRIPTION_FEE = 99; // ₽
const MS_PER_DAY = 1000 * 60 * 60 * 24;

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Look up a Firebase Auth user's email and first name. Never throws. */
async function getUserInfo(userId: string): Promise<{ email: string; firstName: string }> {
  if (!userId) return { email: '', firstName: '' };
  try {
    const u = await adminAuth().getUser(userId);
    return {
      email: u.email ?? '',
      firstName: u.displayName?.split(' ')[0] ?? '',
    };
  } catch {
    return { email: '', firstName: '' };
  }
}

export async function POST(req: NextRequest) {
  // Verify cron secret
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const db = adminDb();

  // Fetch all active subscriptions
  const snap = await db.collection('subscriptions')
    .where('status', '==', 'active')
    .get();

  const results: { id: string; outcome: string; error?: string }[] = [];

  for (const docSnap of snap.docs) {
    const sub = docSnap.data();
    const nextBilling = sub.nextBillingDate ? new Date(sub.nextBillingDate) : null;
    const userId = sub.userId ?? '';

    // ── Renewal reminder: billing in ~3 days ─────────────────────────────────
    if (nextBilling) {
      const daysUntil = (nextBilling.getTime() - now.getTime()) / MS_PER_DAY;
      if (daysUntil >= 2 && daysUntil < 4) {
        const user = await getUserInfo(userId);
        if (user.email) {
          notifyUserRenewalReminder({
            email: user.email,
            firstName: user.firstName,
            amount: SUBSCRIPTION_FEE,
            billingDate: nextBilling.toISOString(),
          }).catch(() => {});
        }
        results.push({ id: docSnap.id, outcome: 'reminder_sent' });
        continue;
      }
    }

    // ── Skip if billing date is in the future ─────────────────────────────────
    if (!nextBilling || nextBilling > now) {
      results.push({ id: docSnap.id, outcome: 'skipped' });
      continue;
    }

    // ── Skip if no RebillId — user hasn't completed first payment yet ─────────
    if (!sub.rebillId) {
      results.push({ id: docSnap.id, outcome: 'no_rebill_id' });
      continue;
    }

    const orderId = `SUB-REC-${docSnap.id}-${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const intervalDays = sub.frequency === 'biweekly' ? 14 : 30;

    // Look up user contact info for notifications
    const user = await getUserInfo(userId);

    try {
      const result = await chargeRecurring(
        orderId,
        SUBSCRIPTION_FEE * 100,
        `Подписка ДАНЛЕОН — автоплатёж`,
        sub.rebillId,
        `${appUrl}/api/tbank/webhook`,
      );

      if (result.success) {
        const nextDate = addDays(nextBilling, intervalDays);
        await docSnap.ref.update({
          nextBillingDate: nextDate.toISOString(),
          updatedAt: FieldValue.serverTimestamp(),
          'lastCharge.paymentId': result.paymentId,
          'lastCharge.date': now.toISOString(),
          'lastCharge.amount': SUBSCRIPTION_FEE,
        });
        results.push({ id: docSnap.id, outcome: 'charged' });

        notifyAdminRenewalCharged({
          subDocId: docSnap.id,
          userId,
          amount: SUBSCRIPTION_FEE,
          nextBillingDate: nextDate.toISOString(),
        }).catch(() => {});

        if (user.email) {
          notifyUserRenewalCharged({
            email: user.email,
            firstName: user.firstName,
            amount: SUBSCRIPTION_FEE,
            nextBillingDate: nextDate.toISOString(),
          }).catch(() => {});
        }
      } else {
        // Charge failed — mark past_due so admin can see it
        await docSnap.ref.update({
          status: 'past_due',
          updatedAt: FieldValue.serverTimestamp(),
          'lastCharge.error': result.message ?? result.errorCode,
          'lastCharge.date': now.toISOString(),
        });
        results.push({ id: docSnap.id, outcome: 'failed', error: result.message });

        notifyAdminRenewalFailed({
          subDocId: docSnap.id,
          userId,
          error: result.message ?? result.errorCode,
        }).catch(() => {});

        if (user.email) {
          notifyUserRenewalFailed({
            email: user.email,
            firstName: user.firstName,
          }).catch(() => {});
        }
      }
    } catch (err) {
      console.error(`Cron: failed to charge subscription ${docSnap.id}:`, err);
      results.push({ id: docSnap.id, outcome: 'error', error: String(err) });
    }
  }

  const charged  = results.filter((r) => r.outcome === 'charged').length;
  const failed   = results.filter((r) => r.outcome === 'failed' || r.outcome === 'error').length;
  const skipped  = results.filter((r) => r.outcome === 'skipped').length;
  const reminded = results.filter((r) => r.outcome === 'reminder_sent').length;

  console.log(`Subscription cron: charged=${charged} failed=${failed} skipped=${skipped} reminded=${reminded}`);

  // Send daily summary (only if something happened)
  await notifyAdminCronSummary({
    charged,
    failed,
    skipped,
    totalRevenue: charged * SUBSCRIPTION_FEE,
  });

  return NextResponse.json({ charged, failed, skipped, reminded, results });
}
