'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { BatchItem } from '@/lib/types';

function fmt(n: number) {
  return (n || 0).toLocaleString('ru-RU') + ' ₽';
}

function formatDate(ts: { seconds: number } | undefined) {
  if (!ts) return '—';
  return new Date(ts.seconds * 1000).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TEMPLATE_ITEMS: BatchItem[] = [
  { id: '1',  name: 'Кофе зеленый (Арабика)',   unit: 'кг',    category: 'raw',        qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '2',  name: 'Кофе зеленый (Робуста)',    unit: 'кг',    category: 'raw',        qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '3',  name: 'Логистика до Москвы',       unit: 'услуг', category: 'logistics',  qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '4',  name: 'Брокер',                    unit: 'шт.',   category: 'customs',    qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '5',  name: 'Обжарка',                   unit: 'кг',    category: 'processing', qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '6',  name: 'Расфасовка',                unit: 'уп.',   category: 'processing', qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '7',  name: 'Пакеты 250г',               unit: 'уп.',   category: 'packaging',  qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 900,  salesRevenuePlan: 0,      salesKg: 40,  note: '' },
  { id: '8',  name: 'Пакеты 500г',               unit: 'уп.',   category: 'packaging',  qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 1600, salesRevenuePlan: 0,      salesKg: 100, note: '' },
  { id: '9',  name: 'Пакеты 1000г',              unit: 'уп.',   category: 'packaging',  qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 2800, salesRevenuePlan: 0,      salesKg: 210, note: '' },
  { id: '10', name: 'Этикетки',                  unit: 'шт.',   category: 'packaging',  qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '11', name: 'Транспорт',                 unit: 'услуг', category: 'logistics',  qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '12', name: 'Домен / хостинг',           unit: 'услуг', category: 'other',      qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '13', name: 'Доставка (расходы)',         unit: 'услуг', category: 'other',      qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '14', name: 'Таможенная декларация',      unit: 'услуг', category: 'customs',    qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '15', name: 'Декларация соответствия',    unit: 'услуг', category: 'customs',    qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '16', name: 'Логистика до Казани',        unit: 'услуг', category: 'logistics',  qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '17', name: 'НДС',                        unit: 'услуг', category: 'customs',    qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '18', name: 'Таможенный сбор',            unit: 'услуг', category: 'customs',    qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '19', name: 'Пошлина',                    unit: 'услуг', category: 'customs',    qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '20', name: 'Фитосанитария',              unit: 'услуг', category: 'customs',    qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
  { id: '21', name: 'Услуги склада',              unit: 'услуг', category: 'other',      qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0, costPlan: 0, costActual: 0, sellPrice: 0,    salesRevenuePlan: 0,      salesKg: 0,   note: '' },
];

function computeTotals(items: BatchItem[]) {
  const costPlan = items.reduce((s, i) => s + (i.costPlan || 0), 0);
  const costActual = items.reduce((s, i) => s + (i.costActual || 0), 0);
  const salesPlan = items.reduce((s, i) => s + (i.salesRevenuePlan || 0), 0);
  return { costPlan, costActual, salesPlan, profitPlan: salesPlan - costPlan };
}

export default function AdminBatchesPage() {
  const router = useRouter();
  const [batches, setBatches] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    getDocs(query(collection(db, 'batches'), orderBy('createdAt', 'desc')))
      .then((snap) => {
        setBatches(snap.docs.map((d) => ({ docId: d.id, ...d.data() })));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const createBatch = async () => {
    setCreating(true);
    const ref = await addDoc(collection(db, 'batches'), {
      name: `Партия ${batches.length + 1}`,
      status: 'open',
      items: TEMPLATE_ITEMS,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    router.push(`/admin/batches/${ref.id}`);
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-black tracking-wide text-espresso uppercase">Партии</h1>
        <button
          onClick={createBatch}
          disabled={creating}
          className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2.5 hover:bg-espresso/90 transition-colors disabled:opacity-50"
        >
          {creating ? 'Создание...' : '+ Новая партия'}
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="bg-white border border-cream/40 p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">Партий пока нет</p>
          <button
            onClick={createBatch}
            disabled={creating}
            className="inline-block mt-4 font-heading text-xs uppercase tracking-wide text-crimson hover:text-espresso transition-colors"
          >
            Создать первую →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-cream/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Партия</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Дата</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Затраты план</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Затраты факт</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Продажи план</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Прибыль план</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {batches.map((batch) => {
                const items = (batch.items as BatchItem[]) ?? [];
                const t = computeTotals(items);
                return (
                  <tr key={batch.docId as string} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-espresso text-xs tracking-wide">{batch.name as string}</span>
                        {batch.status === 'open' && (
                          <span className="font-heading text-xs uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded">открыта</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-body text-espresso/60 text-xs">{formatDate(batch.createdAt as { seconds: number })}</td>
                    <td className="px-4 py-3 text-right font-body text-espresso/50 text-xs">{fmt(t.costPlan)}</td>
                    <td className="px-4 py-3 text-right font-heading font-bold text-espresso text-xs">{fmt(t.costActual)}</td>
                    <td className="px-4 py-3 text-right font-body text-espresso/50 text-xs">{fmt(t.salesPlan)}</td>
                    <td className="px-4 py-3 text-right font-heading font-bold text-xs">
                      <span className={t.profitPlan >= 0 ? 'text-green-600' : 'text-crimson'}>{fmt(t.profitPlan)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/batches/${batch.docId as string}`}
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
