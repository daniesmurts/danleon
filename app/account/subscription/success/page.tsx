'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams();
  const docId = searchParams.get('docId');
  const [status, setStatus] = useState<'activating' | 'done' | 'error'>('activating');

  useEffect(() => {
    if (!docId) { setStatus('error'); return; }
    updateDoc(doc(db, 'subscriptions', docId), {
      status: 'active',
      updatedAt: serverTimestamp(),
    })
      .then(() => setStatus('done'))
      .catch(() => setStatus('error'));
  }, [docId]);

  if (status === 'activating') return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  if (status === 'error') return (
    <div className="text-center py-20 space-y-4">
      <p className="font-body text-espresso/50">Не удалось активировать подписку. Свяжитесь с нами.</p>
      <Link href="/account/subscription" className="text-crimson font-heading text-xs uppercase tracking-widest">← К подписке</Link>
    </div>
  );

  return (
    <div className="bg-white border border-cream/40 p-10 text-center space-y-4">
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 text-green-700">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
      <h1 className="font-heading text-xl font-black text-espresso uppercase tracking-widest">Подписка активна</h1>
      <p className="font-body text-sm text-espresso/55">
        Оплата прошла успешно. Добро пожаловать в клуб подписчиков ДАНЛЕОН.
      </p>
      <Link
        href="/account/subscription"
        className="inline-block mt-4 bg-espresso text-cream font-heading font-bold uppercase tracking-widest text-xs px-8 py-3 hover:bg-espresso/90 transition-colors"
      >
        Управлять подпиской
      </Link>
    </div>
  );
}
