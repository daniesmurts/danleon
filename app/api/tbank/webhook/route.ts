import { NextRequest, NextResponse } from 'next/server';
import { collection, query, where, getDocs, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { verifyToken } from '@/lib/tbank';
import { OrderStatus } from '@/lib/types';

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
    const { Token, OrderId, Status, PaymentId, Amount, ...rest } = body;

    // Verify token
    const params: Record<string, string | number | boolean> = {
      ...rest,
      OrderId,
      Status,
      PaymentId,
      Amount,
    };
    if (!verifyToken({ ...params, Token })) {
      console.error('TBank webhook: invalid token');
      return new NextResponse('INVALID TOKEN', { status: 400 });
    }

    const orderStatus = TBANK_STATUS_MAP[Status];
    if (!orderStatus) {
      // Intermediate status (e.g. NEW, FORM_SHOWED) — acknowledge and ignore
      return new NextResponse('OK', { status: 200 });
    }

    // Find the order by orderId
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, where('orderId', '==', OrderId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.error(`TBank webhook: order not found for OrderId ${OrderId}`);
      return new NextResponse('OK', { status: 200 });
    }

    const orderDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'orders', orderDoc.id), {
      status: orderStatus,
      'tbank.status': Status,
      'tbank.paymentId': String(PaymentId),
      updatedAt: serverTimestamp(),
    });

    return new NextResponse('OK', { status: 200 });
  } catch (err) {
    console.error('TBank webhook error:', err);
    return new NextResponse('ERROR', { status: 500 });
  }
}
