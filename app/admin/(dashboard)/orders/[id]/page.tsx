'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { OrderStatus } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────────────────

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

const DELIVERY_OPTIONS = [
  { value: 'sdek',    label: 'СДЭК'       },
  { value: 'courier', label: 'Курьер'     },
  { value: 'pickup',  label: 'Самовывоз'  },
];

const PAYMENT_OPTIONS = [
  { value: 'card',          label: 'Карта онлайн'      },
  { value: 'sbp',           label: 'СБП'               },
  { value: 'cash',          label: 'Наличные'          },
  { value: 'card_terminal', label: 'Карта (терминал)'  },
  { value: 'transfer',      label: 'Перевод'           },
];

const DELIVERY_LABEL: Record<string, string> = Object.fromEntries(DELIVERY_OPTIONS.map((o) => [o.value, o.label]));
const PAYMENT_LABEL:  Record<string, string> = Object.fromEntries(PAYMENT_OPTIONS.map((o) => [o.value, o.label]));

// ─── Types ────────────────────────────────────────────────────────────────────

interface EditableItem {
  productName: string;
  weight: number;
  quantity: number;
  unitPrice: number;
  grind?: string;
}

interface OrderDraft {
  status: OrderStatus;
  customer: {
    firstName: string; lastName: string; phone: string; email: string;
    city: string; street: string; house: string; apartment: string; postalCode: string;
  };
  deliveryMethod: string;
  paymentMethod: string;
  deliveryCost: number;
  items: EditableItem[];
  comment: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatPrice(n: number) { return (n ?? 0).toLocaleString('ru-RU') + ' ₽'; }

function formatDate(ts: { seconds: number } | string | undefined) {
  if (!ts) return '—';
  const d = typeof ts === 'string' ? new Date(ts) : new Date(ts.seconds * 1000);
  return d.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
}

function orderToDraft(order: Record<string, unknown>): OrderDraft {
  const c = (order.customer as Record<string, string>) ?? {};
  return {
    status:         (order.status         as OrderStatus) ?? 'pending',
    deliveryMethod: (order.deliveryMethod as string)      ?? 'sdek',
    paymentMethod:  (order.paymentMethod  as string)      ?? 'card',
    deliveryCost:   (order.deliveryCost   as number)      ?? 0,
    comment:        (order.comment        as string)      ?? '',
    customer: {
      firstName: c.firstName ?? '', lastName:   c.lastName  ?? '',
      phone:     c.phone     ?? '', email:      c.email     ?? '',
      city:      c.city      ?? '', street:     c.street    ?? '',
      house:     c.house     ?? '', apartment:  c.apartment ?? '',
      postalCode: c.postalCode ?? '',
    },
    items: ((order.items as Record<string, unknown>[]) ?? []).map((item) => ({
      productName: (item.productName as string) ?? '',
      weight:      (item.weight      as number) ?? 0,
      quantity:    (item.quantity    as number) ?? 1,
      unitPrice:   ((item.unitPrice ?? item.price) as number) ?? 0,
      grind:       (item.grind       as string) ?? 'зерно',
    })),
  };
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order,   setOrder]   = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft,   setDraft]   = useState<OrderDraft | null>(null);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'orders', id))
      .then((snap) => {
        if (snap.exists()) setOrder({ docId: snap.id, ...snap.data() });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const startEdit = () => {
    if (!order) return;
    setDraft(orderToDraft(order));
    setEditing(true);
  };

  const cancelEdit = () => { setEditing(false); setDraft(null); };

  const handleSave = async () => {
    if (!draft || !order) return;
    setSaving(true);
    const totalPrice = draft.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
    const grandTotal = totalPrice + draft.deliveryCost;
    const payload = {
      status:         draft.status,
      deliveryMethod: draft.deliveryMethod,
      paymentMethod:  draft.paymentMethod,
      deliveryCost:   draft.deliveryCost,
      totalPrice,
      grandTotal,
      comment:        draft.comment,
      customer:       draft.customer,
      items: draft.items.map((i) => ({
        productName: i.productName,
        weight:      i.weight,
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        grind:       i.grind ?? 'зерно',
      })),
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, 'orders', id), payload);
    setOrder((prev) => prev ? { ...prev, ...payload } : prev);
    setEditing(false);
    setDraft(null);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Draft helpers
  const setCustomer = (key: keyof OrderDraft['customer'], val: string) =>
    setDraft((d) => d ? { ...d, customer: { ...d.customer, [key]: val } } : d);

  const setItem = (idx: number, key: keyof EditableItem, val: string | number) =>
    setDraft((d) => {
      if (!d) return d;
      const items = d.items.map((it, i) => i === idx ? { ...it, [key]: val } : it);
      return { ...d, items };
    });

  const removeItem = (idx: number) =>
    setDraft((d) => d ? { ...d, items: d.items.filter((_, i) => i !== idx) } : d);

  const addItem = () =>
    setDraft((d) => d ? { ...d, items: [...d.items, { productName: '', weight: 250, quantity: 1, unitPrice: 0, grind: 'зерно' }] } : d);

  // ── Computed totals for draft preview
  const draftTotal    = draft ? draft.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0) : 0;
  const draftGrand    = draft ? draftTotal + draft.deliveryCost : 0;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  if (!order) return (
    <div className="text-center py-20 font-heading text-sm tracking-widest text-espresso/40 uppercase">Заказ не найден</div>
  );

  const status   = (editing ? draft!.status : order.status) as OrderStatus;
  const isOffline = order.source === 'offline';

  // ── Input style shorthand
  const inp = 'border border-espresso/20 px-2 py-1.5 font-body text-sm focus:border-espresso outline-none bg-white w-full';

  return (
    <div className="max-w-4xl">
      {/* Breadcrumb + actions */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <Link href="/admin" className="font-heading text-xs tracking-wide uppercase text-espresso/40 hover:text-espresso transition-colors">
            ← Все заказы
          </Link>
          <span className="text-espresso/20">/</span>
          <span className="font-heading text-xs tracking-wide uppercase text-espresso">{order.orderId as string}</span>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="font-heading text-xs uppercase tracking-wide text-green-600">Сохранено ✓</span>
          )}
          {editing ? (
            <>
              <button onClick={cancelEdit} className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso transition-colors px-3 py-2">
                Отмена
              </button>
              <button onClick={handleSave} disabled={saving}
                className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2 hover:bg-espresso/90 disabled:opacity-50 transition-colors">
                {saving ? 'Сохранение…' : 'Сохранить'}
              </button>
            </>
          ) : (
            <button onClick={startEdit}
              className="border border-espresso/20 text-espresso font-heading font-bold text-xs uppercase tracking-wide px-4 py-2 hover:bg-espresso hover:text-cream transition-colors">
              Редактировать
            </button>
          )}
        </div>
      </div>

      {/* Header: order ID + date + status */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">{order.orderId as string}</h1>
            {isOffline && <span className="font-heading text-xs uppercase tracking-wide bg-espresso/10 text-espresso/60 px-2 py-1">офлайн</span>}
          </div>
          <p className="font-body text-sm text-espresso/50 mt-1">{formatDate(order.createdAt as { seconds: number })}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wide ${STATUS_COLOR[status] ?? 'bg-gray-100'}`}>
            {STATUS_LABEL[status] ?? status}
          </span>
          {editing && (
            <select value={draft!.status} onChange={(e) => setDraft((d) => d ? { ...d, status: e.target.value as OrderStatus } : d)}
              className="border border-espresso/20 px-3 py-1.5 font-heading text-xs uppercase tracking-wide text-espresso bg-white focus:border-espresso outline-none">
              {(Object.keys(STATUS_LABEL) as OrderStatus[]).map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Customer */}
        <div className="bg-white border border-cream/40 p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Клиент</h2>
          {editing ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Имя</label>
                  <input value={draft!.customer.firstName} onChange={(e) => setCustomer('firstName', e.target.value)} className={inp} />
                </div>
                <div>
                  <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Фамилия</label>
                  <input value={draft!.customer.lastName} onChange={(e) => setCustomer('lastName', e.target.value)} className={inp} />
                </div>
              </div>
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Телефон</label>
                <input value={draft!.customer.phone} onChange={(e) => setCustomer('phone', e.target.value)} className={inp} />
              </div>
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Email</label>
                <input value={draft!.customer.email} onChange={(e) => setCustomer('email', e.target.value)} className={inp} />
              </div>
            </div>
          ) : (
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
          )}
        </div>

        {/* Delivery / Payment */}
        <div className="bg-white border border-cream/40 p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">
            {isOffline ? 'Оплата' : 'Доставка и оплата'}
          </h2>
          {editing ? (
            <div className="space-y-3">
              {!isOffline && (
                <>
                  <div>
                    <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Способ доставки</label>
                    <select value={draft!.deliveryMethod} onChange={(e) => setDraft((d) => d ? { ...d, deliveryMethod: e.target.value } : d)} className={inp}>
                      {DELIVERY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Город</label>
                      <input value={draft!.customer.city} onChange={(e) => setCustomer('city', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Индекс</label>
                      <input value={draft!.customer.postalCode} onChange={(e) => setCustomer('postalCode', e.target.value)} className={inp} />
                    </div>
                  </div>
                  <div>
                    <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Улица</label>
                    <input value={draft!.customer.street} onChange={(e) => setCustomer('street', e.target.value)} className={inp} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Дом</label>
                      <input value={draft!.customer.house} onChange={(e) => setCustomer('house', e.target.value)} className={inp} />
                    </div>
                    <div>
                      <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Квартира</label>
                      <input value={draft!.customer.apartment} onChange={(e) => setCustomer('apartment', e.target.value)} className={inp} />
                    </div>
                  </div>
                </>
              )}
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Способ оплаты</label>
                <select value={draft!.paymentMethod} onChange={(e) => setDraft((d) => d ? { ...d, paymentMethod: e.target.value } : d)} className={inp}>
                  {PAYMENT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">Стоимость доставки ₽</label>
                <input type="number" min="0" value={draft!.deliveryCost}
                  onChange={(e) => setDraft((d) => d ? { ...d, deliveryCost: parseFloat(e.target.value) || 0 } : d)}
                  className={inp} />
              </div>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-cream/40 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso">Позиции заказа</h2>
          {editing && (
            <button onClick={addItem}
              className="font-heading text-xs uppercase tracking-wide text-crimson hover:text-espresso transition-colors">
              + Добавить позицию
            </button>
          )}
        </div>

        {editing ? (
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 pb-1 border-b border-cream/30">
              {['Товар', 'Вес (г)', 'Кол-во', 'Цена/ед. ₽', ''].map((h) => (
                <span key={h} className={`font-heading text-[10px] uppercase tracking-wide text-espresso/40 ${h === 'Товар' ? 'col-span-5' : h === '' ? 'col-span-1' : 'col-span-2 text-right'}`}>{h}</span>
              ))}
            </div>
            {draft!.items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                <input value={item.productName}
                  onChange={(e) => setItem(idx, 'productName', e.target.value)}
                  placeholder="Название"
                  className={`col-span-5 ${inp}`} />
                <input type="number" value={item.weight}
                  onChange={(e) => setItem(idx, 'weight', parseInt(e.target.value) || 0)}
                  className={`col-span-2 text-right ${inp}`} />
                <input type="number" min="1" value={item.quantity}
                  onChange={(e) => setItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                  className={`col-span-2 text-right ${inp}`} />
                <input type="number" min="0" value={item.unitPrice}
                  onChange={(e) => setItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className={`col-span-2 text-right ${inp}`} />
                <button onClick={() => removeItem(idx)}
                  className="col-span-1 text-center text-espresso/20 hover:text-crimson transition-colors font-bold text-base leading-none">
                  ×
                </button>
              </div>
            ))}
            {draft!.items.length === 0 && (
              <p className="font-body text-sm text-espresso/30 italic py-2">Нет позиций</p>
            )}
          </div>
        ) : (
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
                    <span className="text-espresso/40 text-xs ml-2">{item.grind as string} · {item.weight as number}г</span>
                  </td>
                  <td className="py-3 text-center font-body text-espresso">{item.quantity as number}</td>
                  <td className="py-3 text-right font-heading font-bold text-espresso">
                    {formatPrice(((item.unitPrice as number) ?? (item.price as number)) * (item.quantity as number))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-cream/40 p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Итого</h2>
          <dl className="space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-espresso/50">Товары</dt>
              <dd className="text-espresso">{formatPrice(editing ? draftTotal : order.totalPrice as number)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-espresso/50">Доставка</dt>
              <dd className="text-espresso">
                {(editing ? draft!.deliveryCost : order.deliveryCost as number) === 0
                  ? 'Бесплатно'
                  : formatPrice(editing ? draft!.deliveryCost : order.deliveryCost as number)}
              </dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-cream/30">
              <dt className="font-heading font-bold text-espresso uppercase tracking-wide text-xs">Итого</dt>
              <dd className="font-heading font-black text-crimson text-lg">
                {formatPrice(editing ? draftGrand : order.grandTotal as number)}
              </dd>
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

      {/* Comment */}
      <div className="bg-white border border-cream/40 p-6">
        <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-3">Комментарий</h2>
        {editing ? (
          <textarea
            value={draft!.comment}
            onChange={(e) => setDraft((d) => d ? { ...d, comment: e.target.value } : d)}
            rows={3}
            placeholder="Комментарий к заказу…"
            className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none resize-none"
          />
        ) : (
          order.comment
            ? <p className="font-body text-sm text-espresso/70">{order.comment as string}</p>
            : <p className="font-body text-sm text-espresso/30 italic">Нет комментария</p>
        )}
      </div>
    </div>
  );
}
