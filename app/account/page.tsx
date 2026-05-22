'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
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
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

interface RecentOrder {
  id: string;
  orderId: string;
  status: OrderStatus;
  grandTotal: number;
  createdAt: { seconds: number } | string;
}

export default function AccountDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc'),
          limit(3)
        );
        const snap = await getDocs(q);
        setOrders(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RecentOrder)));

        const subSnap = await getDocs(
          query(collection(db, 'subscriptions'), where('userId', '==', user.uid), where('status', '==', 'active'), limit(1))
        );
        setHasSubscription(!subSnap.empty);
      } catch (err) {
        console.error('Failed to load account data:', err);
      } finally {
        setLoadingOrders(false);
      }
    };
    fetchData();
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">Мой аккаунт</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Заказов', value: orders.length || '—', href: '/account/orders' },
          { label: 'Подписка', value: hasSubscription ? 'Активна' : 'Нет', href: '/account/subscription' },
          { label: 'Профиль', value: 'Данные', href: '/account/profile' },
        ].map(({ label, value, href }) => (
          <Link key={label} href={href} className="bg-white p-5 border border-cream/40 hover:border-espresso/30 transition-colors group">
            <p className="font-heading text-[10px] tracking-widest text-espresso/40 uppercase mb-1">{label}</p>
            <p className="font-heading text-xl font-black text-espresso uppercase tracking-wide group-hover:text-crimson transition-colors">{value}</p>
          </Link>
        ))}
      </div>

      {/* Recent orders */}
      <div className="bg-white border border-cream/40">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream/30">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso">Последние заказы</h2>
          <Link href="/account/orders" className="font-heading text-[10px] tracking-widest uppercase text-crimson hover:text-espresso transition-colors">
            Все заказы →
          </Link>
        </div>

        {loadingOrders ? (
          <div className="p-8 flex justify-center">
            <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center">
            <p className="font-body text-sm text-espresso/40 mb-4">У вас пока нет заказов</p>
            <Link href="/catalog" className="inline-block bg-crimson text-white font-heading font-bold uppercase tracking-widest text-xs px-6 py-3 hover:bg-crimson-dark transition-colors">
              В каталог
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-cream/20">
            {orders.map((order) => (
              <Link key={order.id} href={`/account/orders/${order.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-cream/5 transition-colors group">
                <div>
                  <p className="font-heading text-xs font-bold text-espresso uppercase tracking-wide group-hover:text-crimson transition-colors">{order.orderId}</p>
                  <p className="font-body text-xs text-espresso/40 mt-0.5">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-heading font-bold uppercase px-2 py-1 rounded-full ${STATUS_COLOR[order.status] ?? 'bg-gray-100'}`}>
                    {STATUS_LABEL[order.status] ?? order.status}
                  </span>
                  <span className="font-heading font-bold text-sm text-espresso">{order.grandTotal?.toLocaleString('ru-RU')} ₽</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Subscription CTA */}
      {!hasSubscription && (
        <div className="bg-espresso p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="font-heading text-xs font-bold text-cream uppercase tracking-widest mb-1">Подписка на кофе</p>
            <p className="font-body text-sm text-cream/60">Регулярная доставка и скидка до 20% на каждый заказ</p>
          </div>
          <Link href="/account/subscription" className="shrink-0 bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-6 py-3 transition-colors">
            Оформить
          </Link>
        </div>
      )}
    </div>
  );
}
