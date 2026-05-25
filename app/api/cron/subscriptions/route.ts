// Daily cron endpoint — charge all active subscriptions whose nextBillingDate is today or past.
// Called by GitHub Actions on a schedule; protected by CRON_SECRET header.

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { chargeRecurring } from '@/lib/tbank';

const SUBSCRIPTION_FEE = 99; // ₽

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
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

    // Skip if billing date is in the future
    if (!nextBilling || nextBilling > now) {
      results.push({ id: docSnap.id, outcome: 'skipped' });
      continue;
    }

    // Skip if no RebillId — user hasn't completed first payment yet
    if (!sub.rebillId) {
      results.push({ id: docSnap.id, outcome: 'no_rebill_id' });
      continue;
    }

    const orderId = `SUB-REC-${docSnap.id}-${Date.now()}`;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
    const intervalDays = sub.frequency === 'biweekly' ? 14 : 30;

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
      } else {
        // Charge failed — mark past_due so admin can see it
        await docSnap.ref.update({
          status: 'past_due',
          updatedAt: FieldValue.serverTimestamp(),
          'lastCharge.error': result.message ?? result.errorCode,
          'lastCharge.date': now.toISOString(),
        });
        results.push({ id: docSnap.id, outcome: 'failed', error: result.message });
      }
    } catch (err) {
      console.error(`Cron: failed to charge subscription ${docSnap.id}:`, err);
      results.push({ id: docSnap.id, outcome: 'error', error: String(err) });
    }
  }

  const charged = results.filter((r) => r.outcome === 'charged').length;
  const failed  = results.filter((r) => r.outcome === 'failed' || r.outcome === 'error').length;
  const skipped = results.filter((r) => r.outcome === 'skipped').length;

  console.log(`Subscription cron: charged=${charged} failed=${failed} skipped=${skipped}`);
  return NextResponse.json({ charged, failed, skipped, results });
}
