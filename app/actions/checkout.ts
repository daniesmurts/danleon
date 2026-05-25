'use server';

import { cookies } from 'next/headers';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase-admin';
import { initPayment } from '@/lib/tbank';
import { CartItem, CheckoutFormData } from '@/lib/types';

const DELIVERY_PRICES: Record<string, number> = {
  sdek: 250,
  courier: 390,
  pickup: 0,
  yandex_market: 0,
};

export interface CheckoutActionResult {
  error?: string;
  paymentUrl?: string;
  orderId?: string;
}

export async function createOrder(
  formData: CheckoutFormData,
  items: CartItem[]
): Promise<CheckoutActionResult> {
  if (!items.length) {
    return { error: 'Корзина пуста' };
  }

  const cookieStore = await cookies();
  const userId = cookieStore.get('user_session')?.value ?? null;

  const totalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  // Check subscription server-side so we can't be fooled by client state.
  // Subscribers always get free delivery (courier in Kazan, yandex_market elsewhere, pickup always).
  let deliveryCost = DELIVERY_PRICES[formData.deliveryMethod] ?? 0;
  if (userId && deliveryCost > 0) {
    try {
      const db = adminDb();
      const subSnap = await db.collection('subscriptions')
        .where('userId', '==', userId)
        .where('status', '==', 'active')
        .limit(1)
        .get();
      if (!subSnap.empty) deliveryCost = 0;
    } catch { /* non-fatal — keep computed cost */ }
  }

  const grandTotal = totalPrice + deliveryCost;

  const orderId = `DL-${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    const db = adminDb(); // already initialised above for sub check; calling again is a no-op

    // 1. Create order in Firestore with pending status
    const orderRef = await db.collection('orders').add({
      orderId,
      status: 'pending',
      ...(userId ? { userId } : {}),
      items: items.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.unitPrice,
        quantity: item.quantity,
        grind: item.grind,
        weight: item.weight,
      })),
      totalPrice,
      deliveryCost,
      grandTotal,
      customer: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        city: formData.city,
        street: formData.street,
        house: formData.house,
        apartment: formData.apartment,
        postalCode: formData.postalCode,
      },
      deliveryMethod: formData.deliveryMethod,
      paymentMethod: formData.paymentMethod,
      comment: formData.comment,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    // 2. Init TBank payment (amount in kopecks)
    const tbank = await initPayment({
      orderId,
      amount: grandTotal * 100,
      description: `Заказ ДАНЛЕОН ${orderId} (${items.length} поз.)`,
      customerEmail: formData.email,
      customerPhone: formData.phone,
      successUrl: `${appUrl}/order-success?orderId=${orderId}&docId=${orderRef.id}`,
      failUrl: `${appUrl}/order-failed?orderId=${orderId}&docId=${orderRef.id}`,
      notificationUrl: `${appUrl}/api/tbank/webhook`,
    });

    // 3. Save TBank payment details back to the order
    await db.collection('orders').doc(orderRef.id).update({
      tbank: {
        paymentId: tbank.paymentId,
        paymentUrl: tbank.paymentUrl,
        status: tbank.status,
      },
      updatedAt: FieldValue.serverTimestamp(),
    });

    return { paymentUrl: tbank.paymentUrl, orderId };
  } catch (err) {
    console.error('createOrder error:', err);
    return { error: 'Не удалось создать заказ. Попробуйте ещё раз.' };
  }
}
