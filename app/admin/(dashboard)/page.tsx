'use client';

import { useEffect, useState } from 'react';
import { adminGetAll } from '@/lib/admin-api';
import Link from 'next/link';
import type { OrderStatus, OrderSource } from '@/lib/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Ожидает',
  paid: 'Оплачен',
  failed: 'Ошибка',
  cancelled: 'Отменён',
  refunded: 'Возврат',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-blue-100 text-blue-800',
};

function formatPrice(n: number) {
  return n?.toLocaleString('ru-RU') + ' ₽';
}

function formatDate(ts: { seconds: number } | string | undefined) {
  if (!ts) return '—';
  const date = typeof ts === 'string' ? new Date(ts) : new Date(ts.seconds * 1000);
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

type Tab = 'all' | 'online' | 'offline';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('all');

  useEffect(() => {
    adminGetAll('orders', { orderBy: 'createdAt', dir: 'desc' })
      .then((docs) => { setOrders(docs); setLoading(false); })
      .catch((err) => {
        console.error(err);
        setError('Ошибка загрузки заказов.');
        setLoading(false);
      });
  }, []);

  const filtered = orders.filter((o) => {
    if (tab === 'online') return (o.source as OrderSource) !== 'offline';
    if (tab === 'offline') return (o.source as OrderSource) === 'offline';
    return true;
  });

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 p-6 text-red-700 font-body text-sm">{error}</div>
  );

  const counts = {
    all: orders.length,
    online: orders.filter((o) => (o.source as OrderSource) !== 'offline').length,
    offline: orders.filter((o) => (o.source as OrderSource) === 'offline').length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-black tracking-wide text-espresso uppercase">Заказы</h1>
        <Link
          href="/admin/orders/new"
          className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2.5 hover:bg-espresso/90 transition-colors"
        >
          + Офлайн заказ
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white border border-cream/40 rounded-sm p-1 w-fit">
        {(['all', 'online', 'offline'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 font-heading text-xs uppercase tracking-wide transition-colors rounded-sm ${
              tab === t ? 'bg-espresso text-cream' : 'text-espresso/50 hover:text-espresso'
            }`}
          >
            {t === 'all' ? 'Все' : t === 'online' ? 'Онлайн' : 'Офлайн'}
            <span className={`ml-1.5 ${tab === t ? 'text-cream/60' : 'text-espresso/30'}`}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-cream/40 p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">
            {tab === 'offline' ? 'Офлайн заказов пока нет' : 'Заказов пока нет'}
          </p>
          {tab === 'offline' && (
            <Link href="/admin/orders/new" className="inline-block mt-4 font-heading text-xs uppercase tracking-wide text-crimson hover:text-espresso transition-colors">
              Создать первый →
            </Link>
          )}
        </div>
      ) : (
        <div className="bg-white border border-cream/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Заказ</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Клиент</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Дата</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Сумма</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {filtered.map((order) => {
                const isOffline = (order.source as OrderSource) === 'offline';
                return (
                  <tr key={order.docId as string} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-espresso text-xs tracking-wide">
                          {order.orderId as string}
                        </span>
                        {isOffline && (
                          <span className="font-heading text-xs uppercase tracking-wide bg-espresso/10 text-espresso/60 px-1.5 py-0.5 rounded">
                            офлайн
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-espresso/70 text-xs">
                      {(order.customer as Record<string, string>)?.firstName} {(order.customer as Record<string, string>)?.lastName}
                      <br />
                      <span className="text-espresso/40">{(order.customer as Record<string, string>)?.phone}</span>
                    </td>
                    <td className="px-4 py-3 font-body text-espresso/60 text-xs">
                      {formatDate(order.createdAt as { seconds: number })}
                    </td>
                    <td className="px-4 py-3 font-heading font-bold text-espresso text-xs">
                      {formatPrice(order.grandTotal as number)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-heading font-bold uppercase tracking-wide ${STATUS_COLOR[order.status as OrderStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[order.status as OrderStatus] ?? order.status as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${order.docId as string}`}
                        className="font-heading text-xs tracking-wide uppercase text-crimson hover:text-espresso transition-colors"
                      >
                        Открыть →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
