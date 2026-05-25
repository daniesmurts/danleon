'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { createSubscriptionPayment } from '@/app/actions/subscription';
import type { Subscription, SubscriptionStatus } from '@/lib/types';

const FREQ_LABEL = { biweekly: 'Раз в 2 недели', monthly: 'Раз в месяц' };

const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending_payment: 'Ожидает оплаты',
  active: 'Активна',
  paused: 'Приостановлена',
  cancelled: 'Отменена',
};

const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

const BENEFITS = [
  'Скидка на всё кофе по подписочным ценам',
  'Заказывайте любой объём в любое время',
  'Приоритетная обработка заказов',
];

export default function SubscriptionPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const paymentFailed = searchParams.get('payment') === 'failed';

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [frequency, setFrequency] = useState<'biweekly' | 'monthly'>('monthly');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!user) return;
    getDocs(query(collection(db, 'subscriptions'), where('userId', '==', user.uid)))
      .then((snap) => {
        setSubscriptions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription)));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load subscriptions:', err);
        setLoading(false);
      });
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    setSaving(true);
    setFormError('');
    const result = await createSubscriptionPayment(frequency, user.email ?? '');
    if (result.error) {
      setFormError(result.error);
      setSaving(false);
      return;
    }
    window.location.href = result.paymentUrl!;
  };

  const handleStatusChange = async (subId: string, status: SubscriptionStatus) => {
    await updateDoc(doc(db, 'subscriptions', subId), { status, updatedAt: serverTimestamp() });
    setSubscriptions((prev) => prev.map((s) => s.id === subId ? { ...s, status } : s));
  };

  const activeSub = subscriptions.find((s) => s.status === 'active' || s.status === 'paused' || s.status === 'pending_payment');

  return (
    <div className="space-y-6">
      {paymentFailed && (
        <div className="bg-red-50 border border-red-200 px-5 py-4 font-body text-sm text-red-700">
          Оплата не прошла. Попробуйте ещё раз.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">Подписка</h1>
        {!activeSub && !showNew && !loading && (
          <button
            onClick={() => setShowNew(true)}
            className="bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-5 py-2.5 transition-colors"
          >
            + Оформить
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
        </div>
      ) : activeSub ? (
        /* ── Active subscription card ── */
        <div className="bg-white border border-cream/40 p-6 space-y-4">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h2 className="font-heading text-sm font-bold text-espresso uppercase tracking-widest">Подписка ДАНЛЕОН</h2>
              <p className="font-body text-xs text-espresso/50 mt-1">{FREQ_LABEL[activeSub.frequency]} · {activeSub.unitPrice} ₽</p>
            </div>
            <span className={`text-[10px] font-heading font-bold uppercase px-2.5 py-1 rounded-full ${STATUS_COLOR[activeSub.status]}`}>
              {STATUS_LABEL[activeSub.status]}
            </span>
          </div>

          {activeSub.nextBillingDate && (
            <p className="font-body text-xs text-espresso/50">
              Следующее списание:{' '}
              <span className="font-bold text-espresso">
                {new Date(activeSub.nextBillingDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
            </p>
          )}

          <ul className="space-y-1">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 font-body text-xs text-espresso/60">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          <div className="flex gap-2 flex-wrap pt-1">
            {activeSub.status === 'active' && (
              <button
                onClick={() => handleStatusChange(activeSub.id, 'paused')}
                className="font-heading text-[10px] uppercase tracking-widest border border-espresso/20 px-4 py-2 hover:border-espresso transition-colors"
              >
                Приостановить
              </button>
            )}
            {activeSub.status === 'paused' && (
              <button
                onClick={() => handleStatusChange(activeSub.id, 'active')}
                className="font-heading text-[10px] uppercase tracking-widest bg-espresso text-cream px-4 py-2 hover:bg-espresso/90 transition-colors"
              >
                Возобновить
              </button>
            )}
            {activeSub.status !== 'cancelled' && (
              <button
                onClick={() => handleStatusChange(activeSub.id, 'cancelled')}
                className="font-heading text-[10px] uppercase tracking-widest text-espresso/30 hover:text-crimson transition-colors px-2 py-2"
              >
                Отменить подписку
              </button>
            )}
          </div>
        </div>
      ) : showNew ? (
        /* ── New subscription form ── */
        <div className="bg-white border border-cream/40 p-6 space-y-5">
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-espresso">Оформить подписку</h2>

          <ul className="space-y-1.5">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 font-body text-xs text-espresso/60">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0" />
                {b}
              </li>
            ))}
          </ul>

          <div>
            <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-2">Периодичность</label>
            <div className="flex gap-3">
              {(['monthly', 'biweekly'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFrequency(f)}
                  className={`flex-1 py-2.5 text-[10px] font-heading font-bold uppercase tracking-widest border transition-colors ${
                    frequency === f ? 'border-espresso bg-espresso text-white' : 'border-espresso/20 text-espresso hover:border-espresso'
                  }`}
                >
                  {FREQ_LABEL[f]}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-cream/30 px-4 py-3 flex items-center justify-between">
            <span className="font-heading text-xs uppercase tracking-widest text-espresso/60">Членский взнос</span>
            <span className="font-heading font-black text-lg text-espresso">99 ₽</span>
          </div>

          {formError && <p className="font-body text-xs text-red-600">{formError}</p>}

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleCreate}
              disabled={saving}
              className="flex-1 bg-crimson hover:bg-crimson-dark disabled:opacity-50 text-white font-heading font-bold uppercase tracking-widest text-xs py-3 transition-colors"
            >
              {saving ? 'Переход к оплате...' : 'Оплатить 99 ₽'}
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="px-5 border border-espresso/20 font-heading text-xs uppercase tracking-widest text-espresso/50 hover:text-espresso transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      ) : (
        /* ── Empty state ── */
        <div className="bg-white border border-cream/40 p-10 text-center space-y-4">
          <p className="font-heading text-sm font-bold text-espresso/30 uppercase tracking-widest">Подписок нет</p>
          <ul className="space-y-1.5 inline-block text-left">
            {BENEFITS.map((b) => (
              <li key={b} className="flex items-center gap-2 font-body text-xs text-espresso/50">
                <span className="w-1.5 h-1.5 rounded-full bg-crimson shrink-0" />
                {b}
              </li>
            ))}
          </ul>
          <p className="font-body text-sm text-espresso/40">Всего 99 ₽ / месяц</p>
          <button
            onClick={() => setShowNew(true)}
            className="bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-8 py-3 transition-colors"
          >
            Оформить подписку
          </button>
        </div>
      )}

      <div className="bg-[#F5F5F5] p-5 border border-cream/30">
        <p className="font-heading text-[10px] tracking-widest text-espresso/50 uppercase mb-1">Как работает подписка</p>
        <p className="font-body text-xs text-espresso/60 leading-relaxed">
          Оплатите членский взнос 99 ₽ и получите доступ к ценам по подписке на весь ассортимент.
          Заказывайте любой кофе в любом объёме по сниженным ценам. Отменить можно в любое время.
        </p>
      </div>

      <div className="text-center">
        <Link href="/catalog" className="font-heading text-[10px] uppercase tracking-widest text-espresso/40 hover:text-espresso transition-colors">
          ← В каталог
        </Link>
      </div>
    </div>
  );
}
