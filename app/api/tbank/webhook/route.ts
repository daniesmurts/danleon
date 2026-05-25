import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/tbank';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { OrderStatus } from '@/lib/types';

const TBANK_STATUS_MAP: Record<string, OrderStatus> = {
  CONFIRMED: 'paid',
  AUTHORIZED: 'paid',
  REJECTED: 'failed',
  DEADLINE_EXPIRED: 'failed',
  REVERSED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIAL_REFUNDED: 'refunded',
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { Token, OrderId, Status, PaymentId, Amount, RebillId, ...rest } = body;

    if (!verifyToken({ ...rest, OrderId, Status, PaymentId, Amount, Token })) {
      console.error('TBank webhook: invalid token');
      return new NextResponse('INVALID TOKEN', { status: 400 });
    }

    const db = adminDb();

    // ── Subscription payment (OrderId starts with SUB-) ──────────────────────
    if (String(OrderId).startsWith('SUB-')) {
      if (Status === 'CONFIRMED' || Status === 'AUTHORIZED') {
        // Find the subscription by scanning for pending_payment docs
        // (the docId was passed via successUrl, but webhook doesn't have it — match by OrderId)
        const snap = await db.collection('subscriptions')
          .where('status', '==', 'pending_payment')
          .get();

        for (const docSnap of snap.docs) {
          // Activate subscription and store RebillId for future auto-charges
          const update: Record<string, unknown> = {
            status: 'active',
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (RebillId) update.rebillId = String(RebillId);
          await docSnap.ref.update(update);
          break; // only one pending per user normally
        }
      }
      return new NextResponse('OK', { status: 200 });
    }

    // ── Regular order payment ─────────────────────────────────────────────────
    const orderStatus = TBANK_STATUS_MAP[Status];
    if (!orderStatus) {
      // Intermediate status (NEW, FORM_SHOWED, etc.) — acknowledge and ignore
      return new NextResponse('OK', { status: 200 });
    }

    const snap = await db.collection('orders').where('orderId', '==', OrderId).get();

    if (snap.empty) {
      console.error(`TBank webhook: order not found for OrderId ${OrderId}`);
      return new NextResponse('OK', { status: 200 });
    }

    await snap.docs[0].ref.update({
      status: orderStatus,
      'tbank.status': Status,
      'tbank.paymentId': String(PaymentId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('TBank webhook error:', err);
    return new NextResponse('ERROR', { status: 500 });
  }
}
