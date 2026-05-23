'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
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

const DELIVERY_LABEL: Record<string, string> = {
  sdek: 'СДЭК',
  courier: 'Курьер',
  pickup: 'Самовывоз',
};

const PAYMENT_LABEL: Record<string, string> = {
  card: 'Карта онлайн',
  sbp: 'СБП',
  cash: 'Наличные',
  card_terminal: 'Карта (терминал)',
  transfer: 'Перевод',
};

function formatPrice(n: number) {
  return (n ?? 0).toLocaleString('ru-RU') + ' ₽';
}

function formatDate(ts: { seconds: number } | string | undefined) {
  if (!ts) return '—';
  const date = typeof ts === 'string' ? new Date(ts) : new Date(ts.seconds * 1000);
  return date.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'orders', id))
      .then((snap) => {
        if (snap.exists()) setOrder({ docId: snap.id, ...snap.data() });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!order) return;
    setUpdatingStatus(true);
    await updateDoc(doc(db, 'orders', id), { status: newStatus, updatedAt: serverTimestamp() });
    setOrder((prev) => prev ? { ...prev, status: newStatus } : prev);
    setUpdatingStatus(false);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 font-heading text-sm tracking-widest text-espresso/40 uppercase">Заказ не найден</div>
  );

  const status = order.status as OrderStatus;
  const isOffline = order.source === 'offline';

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="font-heading text-xs tracking-wide uppercase text-espresso/40 hover:text-espresso transition-colors">
          ← Все заказы
        </Link>
        <span className="text-espresso/20">/</span>
        <span className="font-heading text-xs tracking-wide uppercase text-espresso">{order.orderId as string}</span>
      </div>

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">{order.orderId as string}</h1>
            {isOffline && (
              <span className="font-heading text-xs uppercase tracking-wide bg-espresso/10 text-espresso/60 px-2 py-1">офлайн</span>
            )}
          </div>
          <p className="font-body text-sm text-espresso/50 mt-1">{formatDate(order.createdAt as { seconds: number })}</p>
        </div>

        {/* Status updater */}
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wide ${STATUS_COLOR[status] ?? 'bg-gray-100'}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value as OrderStatus)}
            disabled={updatingStatus}
            className="border border-espresso/20 px-3 py-1.5 font-heading text-xs uppercase tracking-wide text-espresso bg-white focus:border-espresso outline-none disabled:opacity-50"
          >
            {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Customer */}
        <div className="bg-white border border-cream/40 p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Клиент</h2>
          <dl className="space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-espresso/50">Имя</dt>
              <dd className="text-espresso">{(order.customer as Record<string, string>)?.firstName} {(order.customer as Record<string, string>)?.lastName}</dd>
            </div>
            {(order.customer as Record<string, string>)?.phone && (
              <div className="flex justify-between">
                <dt className="text-espresso/50">Телефон</dt>
                <dd className="text-espresso">{(order.customer as Record<string, string>).phone}</dd>
              </div>
            )}
            {(order.customer as Record<string, string>)?.email && (
              <div className="flex justify-between">
                <dt className="text-espresso/50">Email</dt>
                <dd className="text-espresso">{(order.customer as Record<string, string>).email}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Delivery / Payment */}
        <div className="bg-white border border-cream/40 p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">
            {isOffline ? 'Оплата' : 'Доставка'}
          </h2>
          <dl className="space-y-2 font-body text-sm">
            {!isOffline && (
              <>
                <div className="flex justify-between">
                  <dt className="text-espresso/50">Способ</dt>
                  <dd className="text-espresso">{DELIVERY_LABEL[order.deliveryMethod as string] ?? order.deliveryMethod as string}</dd>
                </div>
                {(order.customer as Record<string, string>)?.city && (
                  <div className="flex justify-between">
                    <dt className="text-espresso/50">Город</dt>
                    <dd className="text-espresso">{(order.customer as Record<string, string>).city}</dd>
                  </div>
                )}
                {(order.customer as Record<string, string>)?.street && (
                  <div className="flex justify-between">
                    <dt className="text-espresso/50">Адрес</dt>
                    <dd className="text-espresso text-right">
                      {(order.customer as Record<string, string>).street}, {(order.customer as Record<string, string>).house}
                      {(order.customer as Record<string, string>).apartment ? `, кв. ${(order.customer as Record<string, string>).apartment}` : ''}
                    </dd>
                  </div>
                )}
              </>
            )}
            <div className="flex justify-between">
              <dt className="text-espresso/50">Оплата</dt>
              <dd className="text-espresso">{PAYMENT_LABEL[order.paymentMethod as string] ?? order.paymentMethod as string}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-cream/40 p-6 mb-6">
        <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Позиции заказа</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream/30">
              <th className="text-left pb-2 font-heading text-xs tracking-wide text-espresso/40 uppercase">Товар</th>
              <th className="text-center pb-2 font-heading text-xs tracking-wide text-espresso/40 uppercase">Кол-во</th>
              <th className="text-right pb-2 font-heading text-xs tracking-wide text-espresso/40 uppercase">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/20">
            {(order.items as Record<string, unknown>[])?.map((item, i) => (
              <tr key={i}>
                <td className="py-3 font-body text-espresso">
                  {item.productName as string}
                  <span className="text-espresso/40 text-xs ml-2">Зерно · {item.weight as number}г</span>
                </td>
                <td className="py-3 text-center font-body text-espresso">{item.quantity as number}</td>
                <td className="py-3 text-right font-heading font-bold text-espresso">
                  {formatPrice(((item.unitPrice as number) ?? (item.price as number)) * (item.quantity as number))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + TBank */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-cream/40 p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Итого</h2>
          <dl className="space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-espresso/50">Товары</dt>
              <dd className="text-espresso">{formatPrice(order.totalPrice as number)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-espresso/50">Доставка</dt>
              <dd className="text-espresso">{(order.deliveryCost as number) === 0 ? 'Бесплатно' : formatPrice(order.deliveryCost as number)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-cream/30">
              <dt className="font-heading font-bold text-espresso uppercase tracking-wide text-xs">Итого</dt>
              <dd className="font-heading font-black text-crimson text-lg">{formatPrice(order.grandTotal as number)}</dd>
            </div>
          </dl>
        </div>

        {!!order.tbank && (
          <div className="bg-white border border-cream/40 p-6">
            <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">TBank</h2>
            <dl className="space-y-2 font-body text-sm">
              <div className="flex justify-between">
                <dt className="text-espresso/50">Payment ID</dt>
                <dd className="text-espresso font-mono text-xs">{(order.tbank as Record<string, string>).paymentId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-espresso/50">Статус</dt>
                <dd className="text-espresso">{(order.tbank as Record<string, string>).status}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {!!order.comment && (
        <div className="bg-white border border-cream/40 p-6 mt-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-2">Комментарий</h2>
          <p className="font-body text-sm text-espresso/70">{order.comment as string}</p>
        </div>
      )}
    </div>
  );
}
