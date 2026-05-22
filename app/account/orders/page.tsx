'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
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

function formatDate(ts: { seconds: number } | string | undefined) {
  if (!ts) return '—';
  const date = typeof ts === 'string' ? new Date(ts) : new Date((ts as { seconds: number }).seconds * 1000);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

interface OrderRow {
  id: string;
  orderId: string;
  status: OrderStatus;
  grandTotal: number;
  items: { productName: string }[];
  createdAt: { seconds: number } | string;
}

export default function AccountOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getDocs(query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )).then((snap) => {
      setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as OrderRow)));
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">Мои заказы</h1>

      <div className="bg-white border border-cream/40">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-body text-sm text-espresso/40 mb-6">Вы ещё не оформили ни одного заказа</p>
            <Link href="/catalog" className="inline-block bg-crimson text-white font-heading font-bold uppercase tracking-widest text-xs px-8 py-3 hover:bg-crimson-dark transition-colors">
              В каталог
            </Link>
          </div>
        ) : (
          <>
            {/* Header row */}
            <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] gap-4 px-6 py-3 border-b border-cream/30">
              {['Заказ', 'Дата', 'Сумма', 'Статус'].map((h) => (
                <span key={h} className="font-heading text-[10px] tracking-widest text-espresso/40 uppercase">{h}</span>
              ))}
            </div>

            <div className="divide-y divide-cream/20">
              {orders.map((order) => (
                <Link key={order.id} href={`/account/orders/${order.id}`} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] gap-2 sm:gap-4 items-center px-6 py-4 hover:bg-cream/5 transition-colors group">
                  <div>
                    <p className="font-heading text-xs font-bold text-espresso uppercase tracking-wide group-hover:text-crimson transition-colors">{order.orderId}</p>
                    <p className="font-body text-xs text-espresso/40 mt-0.5 line-clamp-1">
                      {order.items?.map((i) => i.productName).join(', ')}
                    </p>
                  </div>
                  <span className="font-body text-xs text-espresso/60">{formatDate(order.createdAt)}</span>
                  <span className="font-heading font-bold text-sm text-espresso">{order.grandTotal?.toLocaleString('ru-RU')} ₽</span>
                  <span className={`text-[10px] font-heading font-bold uppercase px-2.5 py-1 rounded-full w-fit ${STATUS_COLOR[order.status] ?? 'bg-gray-100'}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
