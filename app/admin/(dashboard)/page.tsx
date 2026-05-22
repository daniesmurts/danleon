'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import type { OrderStatus } from '@/lib/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  failed: 'Ошибка оплаты',
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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        setOrders(snap.docs.map((d) => ({ docId: d.id, ...d.data() })));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Ошибка доступа. Убедитесь, что вы вошли в аккаунт с правами администратора.');
        setLoading(false);
      });
  }, []);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 p-6 text-red-700 font-body text-sm">{error}</div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl font-black tracking-widest text-espresso uppercase">Заказы</h1>
        <span className="font-body text-sm text-espresso/50">{orders.length} заказов</span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-cream/40 rounded-sm p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">Заказов пока нет</p>
        </div>
      ) : (
        <div className="bg-white border border-cream/40 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Заказ</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Клиент</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Дата</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Сумма</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {orders.map((order) => (
                <tr key={order.docId as string} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3 font-heading font-bold text-espresso text-xs tracking-wide">
                    {order.orderId as string}
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
                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wide ${STATUS_COLOR[order.status as OrderStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[order.status as OrderStatus] ?? order.status as string}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.docId as string}`}
                      className="font-heading text-[10px] tracking-widest uppercase text-crimson hover:text-espresso transition-colors"
                    >
                      Открыть →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
