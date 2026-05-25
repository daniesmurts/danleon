'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';
import { getAllProducts } from '@/lib/sanity';
import { createSubscriptionPayment } from '@/app/actions/subscription';
import type { Subscription, SubscriptionStatus, Product } from '@/lib/types';

const FREQ_LABEL = { biweekly: 'Раз в 2 недели', monthly: 'Раз в месяц' };
const STATUS_LABEL: Record<SubscriptionStatus, string> = {
  pending_payment: 'Ожидает оплаты', active: 'Активна', paused: 'Приостановлена', cancelled: 'Отменена',
};
const STATUS_COLOR: Record<SubscriptionStatus, string> = {
  pending_payment: 'bg-yellow-100 text-yellow-800', active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800', cancelled: 'bg-gray-100 text-gray-600',
};


export default function SubscriptionPage() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const paymentFailed = searchParams.get('payment') === 'failed';

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [formError, setFormError] = useState('');

  // New subscription form state
  const [selectedProduct, setSelectedProduct] = useState('');
  const [frequency, setFrequency] = useState<'biweekly' | 'monthly'>('monthly');
  const [saving, setSaving] = useState(false);

  const fetchSubscriptions = async () => {
    if (!user) return;
    const snap = await getDocs(query(collection(db, 'subscriptions'), where('userId', '==', user.uid)));
    setSubscriptions(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Subscription)));
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchSubscriptions(), getAllProducts()]).then(([, prods]) => {
      setProducts(prods);
      setLoading(false);
    }).catch((err) => {
      console.error('Subscription page load error:', err);
      setLoading(false);
    });
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreate = async () => {
    if (!user || !selectedProduct) return;
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;
    setSaving(true);
    setFormError('');
    const result = await createSubscriptionPayment(
      product.id,
      product.name,
      product.image ?? '',
      bestSubPrice(product),
      frequency,
      user.email ?? '',
    );
    if (result.error) {
      setFormError(result.error);
      setSaving(false);
      return;
    }
    // Redirect to TBank payment page
    window.location.href = result.paymentUrl!;
  };

  const handleStatusChange = async (subId: string, status: SubscriptionStatus) => {
    await updateDoc(doc(db, 'subscriptions', subId), { status, updatedAt: serverTimestamp() });
    setSubscriptions((prev) => prev.map((s) => s.id === subId ? { ...s, status } : s));
  };

  const activeSubscriptions = subscriptions.filter((s) => s.status !== 'cancelled');

  // Best available subscription price for a product: try sub prices first, then retail,
  // smallest pack first. Returns 0 if truly no price is configured.
  function bestSubPrice(p: Product): number {
    return p.subscriptionPrice ?? p.price ?? p.subscriptionPrice500 ?? p.price500 ?? 0;
  }

  return (
    <div className="space-y-6">
      {paymentFailed && (
        <div className="bg-red-50 border border-red-200 px-5 py-4 font-body text-sm text-red-700">
          Оплата не прошла. Попробуйте ещё раз или выберите другой способ оплаты.
        </div>
      )}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">Подписка</h1>
        {activeSubscriptions.length === 0 && !showNew && (
          <button onClick={() => setShowNew(true)} className="bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-5 py-2.5 transition-colors">
            + Оформить
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Existing subscriptions */}
          {activeSubscriptions.map((sub) => (
            <div key={sub.id} className="bg-white border border-cream/40 p-6">
              <div className="flex items-start gap-4">
                {sub.productImage && (
                  <div className="relative w-16 h-16 shrink-0 bg-[#F5F5F5]">
                    <Image src={sub.productImage} alt={sub.productName} fill className="object-contain p-1" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-heading text-sm font-bold text-espresso uppercase tracking-widest">{sub.productName}</h3>
                      <p className="font-body text-xs text-espresso/50 mt-0.5">Зерно · 250г · {FREQ_LABEL[sub.frequency]}</p>
                    </div>
                    <span className={`text-[10px] font-heading font-bold uppercase px-2.5 py-1 rounded-full ${STATUS_COLOR[sub.status]}`}>
                      {STATUS_LABEL[sub.status]}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 flex-wrap">
                    <p className="font-body text-xs text-espresso/50">
                      Следующая доставка: <span className="font-bold text-espresso">{sub.nextDeliveryDate ? new Date(sub.nextDeliveryDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '—'}</span>
                    </p>
                    <span className="text-espresso/20">·</span>
                    <p className="font-heading font-bold text-sm text-crimson">{sub.unitPrice?.toLocaleString('ru-RU')} ₽/мес</p>
                  </div>
                  <div className="mt-4 flex gap-2 flex-wrap">
                    {sub.status === 'active' && (
                      <button onClick={() => handleStatusChange(sub.id, 'paused')} className="font-heading text-[10px] uppercase tracking-widest border border-espresso/20 px-4 py-2 hover:border-espresso transition-colors">
                        Приостановить
                      </button>
                    )}
                    {sub.status === 'paused' && (
                      <button onClick={() => handleStatusChange(sub.id, 'active')} className="font-heading text-[10px] uppercase tracking-widest bg-espresso text-cream px-4 py-2 hover:bg-espresso/90 transition-colors">
                        Возобновить
                      </button>
                    )}
                    <button onClick={() => handleStatusChange(sub.id, 'cancelled')} className="font-heading text-[10px] uppercase tracking-widest text-espresso/30 hover:text-crimson transition-colors px-2 py-2">
                      Отменить
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* New subscription form */}
          {showNew && (
            <div className="bg-white border border-cream/40 p-6 space-y-5">
              <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-espresso">Новая подписка</h2>

              <div>
                <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-2">Выберите кофе</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {products.map((p) => (
                    <button key={p.id} onClick={() => setSelectedProduct(p.id)}
                      className={`text-left p-3 border transition-colors ${selectedProduct === p.id ? 'border-espresso bg-cream/10' : 'border-espresso/20 hover:border-espresso/40'}`}
                    >
                      <p className="font-heading text-xs font-bold text-espresso uppercase tracking-wide">{p.name}</p>
                      <p className="font-body text-xs text-espresso/50 mt-0.5">
                        {bestSubPrice(p).toLocaleString('ru-RU')} ₽
                        {(p.subscriptionPrice || p.subscriptionPrice500) && <span className="text-crimson ml-1">(при подписке)</span>}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-2">Периодичность</label>
                <div className="flex gap-3">
                  {(['biweekly', 'monthly'] as const).map((f) => (
                    <button key={f} onClick={() => setFrequency(f)}
                      className={`flex-1 py-2.5 text-[10px] font-heading font-bold uppercase tracking-widest border transition-colors ${frequency === f ? 'border-espresso bg-espresso text-white' : 'border-espresso/20 text-espresso hover:border-espresso'}`}
                    >
                      {FREQ_LABEL[f]}
                    </button>
                  ))}
                </div>
              </div>

              {formError && <p className="font-body text-xs text-red-600">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button onClick={handleCreate} disabled={!selectedProduct || saving}
                  className="flex-1 bg-crimson hover:bg-crimson-dark disabled:opacity-50 text-white font-heading font-bold uppercase tracking-widest text-xs py-3 transition-colors"
                >
                  {saving ? 'Переход к оплате...' : 'Оплатить 99 ₽ и подписаться'}
                </button>
                <button onClick={() => setShowNew(false)} className="px-5 border border-espresso/20 font-heading text-xs uppercase tracking-widest text-espresso/50 hover:text-espresso transition-colors">
                  Отмена
                </button>
              </div>
            </div>
          )}

          {activeSubscriptions.length === 0 && !showNew && (
            <div className="bg-white border border-cream/40 p-10 text-center">
              <p className="font-heading text-sm font-bold text-espresso/30 uppercase tracking-widest mb-2">Подписок нет</p>
              <p className="font-body text-sm text-espresso/40 mb-6">Оформите подписку и экономьте до 20% на каждом заказе</p>
              <button onClick={() => setShowNew(true)} className="bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-8 py-3 transition-colors">
                Оформить подписку
              </button>
            </div>
          )}
        </>
      )}

      <div className="bg-[#F5F5F5] p-5 border border-cream/30">
        <p className="font-heading text-[10px] tracking-widest text-espresso/50 uppercase mb-1">Как работает подписка</p>
        <p className="font-body text-xs text-espresso/60 leading-relaxed">
          Мы автоматически готовим и отправляем ваш кофе в выбранную дату. Вы всегда можете приостановить или отменить подписку за 48 часов до отправки.
        </p>
      </div>

      <div className="text-center">
        <Link href="/catalog" className="font-heading text-[10px] uppercase tracking-widest text-espresso/40 hover:text-espresso transition-colors">
          ← Добавить ещё кофе
        </Link>
      </div>
    </div>
  );
}
