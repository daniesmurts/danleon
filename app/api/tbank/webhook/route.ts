import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/tbank';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { OrderStatus } from '@/lib/types';
import {
  notifyAdminNewOrder,
  notifyAdminPaymentFailed,
  notifyAdminRefund,
  notifyAdminNewSubscription,
  notifyUserOrderConfirmed,
  notifyUserSubscriptionActivated,
} from '@/lib/notify';

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
        const snap = await db.collection('subscriptions')
          .where('status', '==', 'pending_payment')
          .get();

        for (const docSnap of snap.docs) {
          const subData = docSnap.data();
          const userId = subData.userId ?? '';

          // Activate subscription and store RebillId for future auto-charges
          const update: Record<string, unknown> = {
            status: 'active',
            updatedAt: FieldValue.serverTimestamp(),
          };
          if (RebillId) update.rebillId = String(RebillId);
          await docSnap.ref.update(update);

          // Look up user email from Firebase Auth
          let userEmail = '';
          let userFirstName = '';
          if (userId) {
            try {
              const authUser = await adminAuth().getUser(userId);
              userEmail = authUser.email ?? '';
              userFirstName = authUser.displayName?.split(' ')[0] ?? '';
            } catch { /* ignore */ }
          }

          // Notify admin + user
          notifyAdminNewSubscription({
            subDocId: docSnap.id,
            userId,
            frequency: subData.frequency ?? 'monthly',
            unitPrice: subData.unitPrice ?? 99,
          }).catch(() => {});

          if (userEmail) {
            notifyUserSubscriptionActivated({
              email: userEmail,
              firstName: userFirstName,
              frequency: subData.frequency ?? 'monthly',
              unitPrice: subData.unitPrice ?? 99,
              nextBillingDate: subData.nextBillingDate ?? '',
            }).catch(() => {});
          }

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

    const orderDoc = snap.docs[0];
    const orderData = orderDoc.data();

    await orderDoc.ref.update({
      status: orderStatus,
      'tbank.status': Status,
      'tbank.paymentId': String(PaymentId),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // Decrement inventory when order is paid
    if (orderStatus === 'paid') {
      try {
        const invSnap = await db.collection('inventory').get();
        for (const item of (orderData.items ?? [])) {
          const packSizeG = item.weight as number;       // grams per bag (250 / 500 / 1000)
          const quantity  = (item.quantity as number) ?? 1;
          if (!packSizeG) continue;

          const invDoc = invSnap.docs.find((d) => d.data().packSize === packSizeG);
          if (!invDoc) continue;

          const currentStock = (invDoc.data().stock as number) ?? 0;
          const deductKg     = (packSizeG * quantity) / 1000;
          // Round to 3 decimal places to avoid floating-point drift
          const newStock     = Math.max(0, Math.round((currentStock - deductKg) * 1000) / 1000);

          await invDoc.ref.update({ stock: newStock, updatedAt: FieldValue.serverTimestamp() });
        }
      } catch (invErr) {
        console.error('TBank webhook: inventory decrement failed:', invErr);
        // Non-fatal — order is still marked paid
      }
    }

    // Fire-and-forget notifications
    if (orderStatus === 'paid') {
      notifyAdminNewOrder({
        orderId: orderData.orderId ?? OrderId,
        docId: orderDoc.id,
        grandTotal: orderData.grandTotal ?? (Amount / 100),
        items: orderData.items ?? [],
        customer: orderData.customer ?? {},
        deliveryMethod: orderData.deliveryMethod ?? '—',
      }).catch(() => {});

      // Notify customer
      const customer = orderData.customer ?? {};
      if (customer.email) {
        notifyUserOrderConfirmed({
          email: customer.email,
          firstName: customer.firstName ?? '',
          orderId: orderData.orderId ?? OrderId,
          grandTotal: orderData.grandTotal ?? (Amount / 100),
          items: orderData.items ?? [],
          deliveryMethod: orderData.deliveryMethod ?? '—',
        }).catch(() => {});
      }
    } else if (orderStatus === 'failed') {
      notifyAdminPaymentFailed({
        orderId: orderData.orderId ?? OrderId,
        docId: orderDoc.id,
        grandTotal: orderData.grandTotal ?? (Amount / 100),
        customerEmail: orderData.customer?.email,
      }).catch(() => {});
    } else if (orderStatus === 'refunded' || orderStatus === 'cancelled') {
      notifyAdminRefund({
        orderId: orderData.orderId ?? OrderId,
        docId: orderDoc.id,
        status: orderStatus,
      }).catch(() => {});
    }

    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('TBank webhook error:', err);
    return new NextResponse('ERROR', { status: 500 });
  }
}
