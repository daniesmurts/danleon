'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Image from 'next/image';
import type { SubscriptionStatus, SubscriptionFrequency } from '@/lib/types';

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending_payment: 'Ожидает оплаты',
  active: 'Активна',
  paused: 'На паузе',
  cancelled: 'Отменена',
};

const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const FREQ_LABEL: Record<SubscriptionFrequency, string> = {
  biweekly: 'Раз в 2 недели',
  monthly: 'Раз в месяц',
};

function formatDate(ts: { seconds: number } | string | undefined) {
  if (!ts) return '—';
  const date = typeof ts === 'string' ? new Date(ts) : new Date(ts.seconds * 1000);
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

type Tab = 'active' | 'paused' | 'all';

export default function AdminSubscriptionsPage() {
  const [subs, setSubs] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState<Tab>('active');

  useEffect(() => {
    getDocs(query(collection(db, 'subscriptions'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        setSubs(snap.docs.map((d) => ({ docId: d.id, ...d.data() })));
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError('Ошибка загрузки. Проверьте права доступа.');
        setLoading(false);
      });
  }, []);

  const handleStatus = async (docId: string, status: SubscriptionStatus) => {
    await updateDoc(doc(db, 'subscriptions', docId), { status, updatedAt: serverTimestamp() });
    setSubs((prev) => prev.map((s) => s.docId === docId ? { ...s, status } : s));
  };

  const filtered = subs.filter((s) => {
    if (tab === 'active') return s.status === 'active';
    if (tab === 'paused') return s.status === 'paused' || s.status === 'pending_payment';
    return true;
  });

  const counts = {
    active: subs.filter((s) => s.status === 'active').length,
    paused: subs.filter((s) => s.status === 'paused' || s.status === 'pending_payment').length,
    all: subs.length,
  };

  const monthlyRevenue = subs
    .filter((s) => s.status === 'active')
    .reduce((sum, s) => sum + 99, 0);

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
        <h1 className="font-heading text-xl font-black tracking-widest text-espresso uppercase">Подписки</h1>
        <div className="bg-white border border-cream/40 px-4 py-2 text-right">
          <p className="font-heading text-[9px] uppercase tracking-widest text-espresso/40">Выручка / мес</p>
          <p className="font-heading font-black text-lg text-espresso">{monthlyRevenue.toLocaleString('ru-RU')} ₽</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white border border-cream/40 p-1 w-fit">
        {(['active', 'paused', 'all'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 font-heading text-[10px] uppercase tracking-widest transition-colors rounded-sm ${
              tab === t ? 'bg-espresso text-cream' : 'text-espresso/50 hover:text-espresso'
            }`}
          >
            {t === 'active' ? 'Активные' : t === 'paused' ? 'На паузе' : 'Все'}
            <span className={`ml-1.5 ${tab === t ? 'text-cream/60' : 'text-espresso/30'}`}>{counts[t]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-cream/40 p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">Подписок нет</p>
        </div>
      ) : (
        <div className="bg-white border border-cream/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Товар</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Клиент</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Периодичность</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Следующая отправка</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {filtered.map((sub) => (
                <tr key={sub.docId as string} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {!!sub.productImage && (
                        <div className="relative w-8 h-8 bg-[#F5F5F5] shrink-0">
                          <Image src={sub.productImage as string} alt={sub.productName as string} fill className="object-contain p-0.5" />
                        </div>
                      )}
                      <span className="font-heading font-bold text-espresso text-xs tracking-wide">{sub.productName as string}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-body text-espresso/60 text-xs font-mono">{(sub.userId as string)?.slice(0, 12)}…</td>
                  <td className="px-4 py-3 font-body text-espresso/60 text-xs">
                    {FREQ_LABEL[sub.frequency as SubscriptionFrequency] ?? sub.frequency as string}
                  </td>
                  <td className="px-4 py-3 font-body text-espresso/60 text-xs">
                    {sub.nextDeliveryDate ? formatDate(sub.nextDeliveryDate as string) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wide ${STATUS_COLOR[sub.status as SubscriptionStatus]}`}>
                      {STATUS_LABEL[sub.status as SubscriptionStatus]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <select
                      value={sub.status as string}
                      onChange={(e) => handleStatus(sub.docId as string, e.target.value as SubscriptionStatus)}
                      className="border border-espresso/20 px-2 py-1 font-heading text-[9px] uppercase tracking-widest text-espresso bg-white focus:border-espresso outline-none"
                    >
                      <option value="active">Активна</option>
                      <option value="paused">На паузе</option>
                      <option value="cancelled">Отменить</option>
                    </select>
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
