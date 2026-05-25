'use server';

import { cookies } from 'next/headers';
import { initPayment } from '@/lib/tbank';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import type { SubscriptionFrequency } from '@/lib/types';

const SUBSCRIPTION_FEE = 99; // ₽/month

export interface CreateSubscriptionResult {
  error?: string;
  paymentUrl?: string;
}

export async function createSubscriptionPayment(
  frequency: SubscriptionFrequency,
  userEmail: string,
): Promise<CreateSubscriptionResult> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_session')?.value;
  if (!userId) return { error: 'Необходимо войти в аккаунт' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const subId = `SUB-${Date.now()}`;

  const nextBilling = new Date();
  nextBilling.setDate(nextBilling.getDate() + (frequency === 'biweekly' ? 14 : 30));

  try {
    const docRef = await adminDb().collection('subscriptions').add({
      userId,
      status: 'pending_payment',
      frequency,
      unitPrice: SUBSCRIPTION_FEE,
      nextBillingDate: nextBilling.toISOString(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    const tbank = await initPayment({
      orderId: subId,
      amount: SUBSCRIPTION_FEE * 100,
      description: `Подписка ДАНЛЕОН — 99 ₽ / ${frequency === 'biweekly' ? '2 недели' : 'месяц'}`,
      customerEmail: userEmail,
      successUrl: `${appUrl}/account/subscription/success?docId=${docRef.id}&subId=${subId}`,
      failUrl: `${appUrl}/account/subscription?payment=failed`,
      notificationUrl: `${appUrl}/api/tbank/webhook`,
    });

    return { paymentUrl: tbank.paymentUrl };
  } catch (err) {
    console.error('createSubscriptionPayment error:', err);
    return { error: 'Не удалось инициировать оплату. Попробуйте ещё раз.' };
  }
}
