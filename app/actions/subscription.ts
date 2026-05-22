'use server';

import { cookies } from 'next/headers';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { initPayment } from '@/lib/tbank';
import type { GrindType, SubscriptionFrequency } from '@/lib/types';

const SUBSCRIPTION_FEE = 99; // rub/month

export interface CreateSubscriptionResult {
  error?: string;
  paymentUrl?: string;
}

export async function createSubscriptionPayment(
  productId: string,
  productName: string,
  productImage: string,
  unitPrice: number,
  frequency: SubscriptionFrequency,
  userEmail: string,
): Promise<CreateSubscriptionResult> {
  const cookieStore = await cookies();
  const userId = cookieStore.get('user_session')?.value;
  if (!userId) return { error: 'Необходимо войти в аккаунт' };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const subId = `SUB-${Date.now()}`;

  const nextDelivery = new Date();
  nextDelivery.setDate(nextDelivery.getDate() + (frequency === 'biweekly' ? 14 : 30));

  try {
    // Create pending subscription doc
    const docRef = await addDoc(collection(db, 'subscriptions'), {
      userId,
      status: 'pending_payment',
      productId,
      productName,
      productImage,
      grind: 'зерно' as GrindType,
      weight: 250,
      frequency,
      unitPrice,
      nextDeliveryDate: nextDelivery.toISOString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Initiate TBank payment for the 99₽ membership fee
    const tbank = await initPayment({
      orderId: subId,
      amount: SUBSCRIPTION_FEE * 100, // kopecks
      description: `Подписка ДАНЛЕОН — членский взнос 1 месяц`,
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
