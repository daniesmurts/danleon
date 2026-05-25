'use server';

import { cookies } from 'next/headers';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
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
  const deliveryCost = DELIVERY_PRICES[formData.deliveryMethod] ?? 0;
  const grandTotal = totalPrice + deliveryCost;

  const orderId = `DL-${Date.now()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

  try {
    // 1. Create order in Firestore with pending status
    const orderRef = await addDoc(collection(db, 'orders'), {
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
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
    const { updateDoc, doc } = await import('firebase/firestore');
    await updateDoc(doc(db, 'orders', orderRef.id), {
      tbank: {
        paymentId: tbank.paymentId,
        paymentUrl: tbank.paymentUrl,
        status: tbank.status,
      },
      updatedAt: serverTimestamp(),
    });

    return { paymentUrl: tbank.paymentUrl, orderId };
  } catch (err) {
    console.error('createOrder error:', err);
    return { error: 'Не удалось создать заказ. Попробуйте ещё раз.' };
  }
}
