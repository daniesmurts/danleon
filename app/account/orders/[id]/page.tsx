'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import type { OrderStatus } from '@/lib/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Ожидает оплаты', paid: 'Оплачен', failed: 'Ошибка',
  cancelled: 'Отменён', refunded: 'Возврат',
};
const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800', paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800', cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-blue-100 text-blue-800',
};
const DELIVERY_LABEL: Record<string, string> = { sdek: 'СДЭК', courier: 'Курьер', pickup: 'Самовывоз' };

function formatDate(ts: { seconds: number } | string | undefined) {
  if (!ts) return '—';
  const date = typeof ts === 'string' ? new Date(ts) : new Date((ts as { seconds: number }).seconds * 1000);
  return date.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
}

export default function AccountOrderDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const id = params.id as string;
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'orders', id)).then((snap) => {
      if (!snap.exists()) { setLoading(false); return; }
      const data = snap.data();
      // Only allow the order's owner to view it
      if (data.userId && data.userId !== user.uid) { setForbidden(true); setLoading(false); return; }
      setOrder(data);
      setLoading(false);
    });
  }, [user, id]);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  if (forbidden || !order) return (
    <div className="text-center py-20">
      <p className="font-body text-espresso/40 mb-4">Заказ не найден</p>
      <Link href="/account/orders" className="text-crimson font-heading text-xs uppercase tracking-widest">← К заказам</Link>
    </div>
  );

  const status = order.status as OrderStatus;
  const customer = order.customer as Record<string, string>;
  const items = order.items as { productName: string; grind: string; weight: number; quantity: number; price: number }[];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/account/orders" className="font-heading text-[10px] tracking-widest uppercase text-espresso/40 hover:text-espresso transition-colors">
          ← Заказы
        </Link>
        <span className="text-espresso/20">/</span>
        <span className="font-heading text-[10px] tracking-widest uppercase text-espresso">{order.orderId as string}</span>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">{order.orderId as string}</h1>
          <p className="font-body text-sm text-espresso/40 mt-1">{formatDate(order.createdAt as { seconds: number })}</p>
        </div>
        <span className={`px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wide ${STATUS_COLOR[status] ?? 'bg-gray-100'}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-cream/40 p-5">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Получатель</h2>
          <dl className="space-y-2 font-body text-sm">
            <div className="flex justify-between"><dt className="text-espresso/50">Имя</dt><dd>{customer?.firstName} {customer?.lastName}</dd></div>
            <div className="flex justify-between"><dt className="text-espresso/50">Телефон</dt><dd>{customer?.phone}</dd></div>
            <div className="flex justify-between"><dt className="text-espresso/50">Email</dt><dd>{customer?.email}</dd></div>
          </dl>
        </div>
        <div className="bg-white border border-cream/40 p-5">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Доставка</h2>
          <dl className="space-y-2 font-body text-sm">
            <div className="flex justify-between"><dt className="text-espresso/50">Способ</dt><dd>{DELIVERY_LABEL[order.deliveryMethod as string] ?? order.deliveryMethod as string}</dd></div>
            {customer?.city && <div className="flex justify-between"><dt className="text-espresso/50">Город</dt><dd>{customer.city}</dd></div>}
            {customer?.street && <div className="flex justify-between"><dt className="text-espresso/50">Адрес</dt><dd className="text-right">{customer.street}, {customer.house}{customer.apartment ? `, кв. ${customer.apartment}` : ''}</dd></div>}
          </dl>
        </div>
      </div>

      <div className="bg-white border border-cream/40 p-5">
        <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Состав заказа</h2>
        <div className="divide-y divide-cream/20">
          {items?.map((item, i) => (
            <div key={i} className="flex justify-between items-center py-3">
              <div>
                <p className="font-body text-sm text-espresso">{item.productName}</p>
                <p className="font-body text-xs text-espresso/40">{item.grind} · {item.weight}г · {item.quantity} шт.</p>
              </div>
              <span className="font-heading font-bold text-sm text-espresso">{(item.price * item.quantity).toLocaleString('ru-RU')} ₽</span>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-cream/30 space-y-2">
          <div className="flex justify-between font-body text-sm"><span className="text-espresso/50">Товары</span><span>{(order.totalPrice as number)?.toLocaleString('ru-RU')} ₽</span></div>
          <div className="flex justify-between font-body text-sm"><span className="text-espresso/50">Доставка</span><span>{(order.deliveryCost as number) === 0 ? 'Бесплатно' : `${(order.deliveryCost as number)?.toLocaleString('ru-RU')} ₽`}</span></div>
          <div className="flex justify-between font-heading font-black text-base pt-1 border-t border-cream/20">
            <span className="text-espresso uppercase tracking-wide">Итого</span>
            <span className="text-crimson">{(order.grandTotal as number)?.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>
      </div>
    </div>
  );
}
