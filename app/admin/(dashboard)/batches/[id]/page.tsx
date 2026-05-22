'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { BatchItem, BatchCategory, BatchStatus } from '@/lib/types';

const CATEGORY_DOT: Record<BatchCategory, string> = {
  raw:        'bg-amber-400',
  logistics:  'bg-blue-400',
  processing: 'bg-purple-400',
  packaging:  'bg-green-400',
  customs:    'bg-red-400',
  other:      'bg-gray-300',
};

const CATEGORY_LABEL: Record<BatchCategory, string> = {
  raw:        'Сырьё',
  logistics:  'Логистика',
  processing: 'Обработка',
  packaging:  'Упаковка',
  customs:    'Таможня',
  other:      'Прочее',
};

const CATEGORIES: BatchCategory[] = ['raw', 'logistics', 'processing', 'packaging', 'customs', 'other'];

function fmt(n: number) {
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function effectiveCostPlan(item: BatchItem): number {
  return item.qtyPlan > 0 && item.pricePlan > 0
    ? Math.round(item.qtyPlan * item.pricePlan * 100) / 100
    : item.costPlan || 0;
}

function effectiveCostActual(item: BatchItem): number {
  return item.qtyActual > 0 && item.priceActual > 0
    ? Math.round(item.qtyActual * item.priceActual * 100) / 100
    : item.costActual || 0;
}

const cell = 'w-full bg-transparent border-b border-espresso/20 text-right font-body text-sm focus:border-espresso outline-none py-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none';

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<BatchStatus>('open');
  const [items, setItems] = useState<BatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'batches', id)).then((snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setName(data.name ?? '');
        setStatus(data.status ?? 'open');
        setItems((data.items as BatchItem[]) ?? []);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const updateItem = (index: number, field: keyof BatchItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };
      if (field === 'qtyPlan' || field === 'pricePlan') {
        if (Number(item.qtyPlan) > 0 && Number(item.pricePlan) > 0)
          item.costPlan = Number(item.qtyPlan) * Number(item.pricePlan);
      }
      if (field === 'qtyActual' || field === 'priceActual') {
        if (Number(item.qtyActual) > 0 && Number(item.priceActual) > 0)
          item.costActual = Number(item.qtyActual) * Number(item.priceActual);
      }
      next[index] = item;
      return next;
    });
  };

  const addRow = () => {
    setItems((prev) => [...prev, {
      id: Date.now().toString(),
      name: '', unit: 'услуг', category: 'other',
      qtyPlan: 0, qtyActual: 0, pricePlan: 0, priceActual: 0,
      costPlan: 0, costActual: 0, sellPrice: 0, salesRevenuePlan: 0,
      salesKg: 0, note: '',
    }]);
  };

  const removeRow = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const save = async () => {
    setSaving(true);
    await updateDoc(doc(db, 'batches', id), { name, status, items, updatedAt: serverTimestamp() });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const totals = {
    costPlan:   items.reduce((s, i) => s + effectiveCostPlan(i), 0),
    costActual: items.reduce((s, i) => s + effectiveCostActual(i), 0),
    salesPlan:  items.reduce((s, i) => s + (i.salesRevenuePlan || 0), 0),
  };
  const profitPlan = totals.salesPlan - totals.costPlan;
  const marginPlan = totals.salesPlan > 0 ? (profitPlan / totals.salesPlan) * 100 : 0;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin/batches" className="font-heading text-[10px] tracking-widest uppercase text-espresso/40 hover:text-espresso transition-colors">
          ← Партии
        </Link>
        <span className="text-espresso/20">/</span>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="font-heading text-[10px] tracking-widest uppercase text-espresso bg-transparent border-b border-transparent hover:border-espresso/30 focus:border-espresso outline-none"
        />
      </div>

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h1 className="font-heading text-xl font-black tracking-widest text-espresso uppercase">{name}</h1>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BatchStatus)}
            className="border border-espresso/20 px-2 py-1 font-heading text-[9px] uppercase tracking-widest text-espresso bg-white focus:border-espresso outline-none"
          >
            <option value="open">Открыта</option>
            <option value="closed">Закрыта</option>
          </select>
        </div>
        <button
          onClick={save}
          disabled={saving}
          className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-widest px-4 py-2 hover:bg-espresso/90 disabled:opacity-50 transition-colors"
        >
          {saved ? '✓ Сохранено' : saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mb-3 flex-wrap">
        {CATEGORIES.map((c) => (
          <div key={c} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${CATEGORY_DOT[c]}`} />
            <span className="font-heading text-[9px] uppercase tracking-widest text-espresso/50">{CATEGORY_LABEL[c]}</span>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white border border-cream/40 overflow-x-auto mb-6">
        <table className="text-sm min-w-[1200px] w-full">
          <thead>
            <tr className="border-b border-cream/20 bg-[#F9F9F9]">
              <th className="px-3 py-2.5 text-left font-heading text-[10px] tracking-widest text-espresso/60 uppercase w-8" />
              <th className="px-3 py-2.5 text-left font-heading text-[10px] tracking-widest text-espresso/60 uppercase">Наименование</th>
              <th className="px-2 py-2.5 text-center font-heading text-[10px] tracking-widest text-espresso/60 uppercase w-14">Ед.</th>
              <th className="px-2 py-2.5 text-center font-heading text-[10px] tracking-widest text-espresso/50 uppercase w-18">Кол план</th>
              <th className="px-2 py-2.5 text-center font-heading text-[10px] tracking-widest text-espresso/70 uppercase w-18">Кол факт</th>
              <th className="px-2 py-2.5 text-center font-heading text-[10px] tracking-widest text-espresso/50 uppercase w-22">Цена план</th>
              <th className="px-2 py-2.5 text-center font-heading text-[10px] tracking-widest text-espresso/70 uppercase w-22">Цена факт</th>
              <th className="px-2 py-2.5 text-center font-heading text-[10px] tracking-widest text-espresso/50 uppercase w-26">Стоим. план</th>
              <th className="px-2 py-2.5 text-center font-heading text-[10px] tracking-widest text-espresso/70 uppercase w-26">Стоим. факт</th>
              <th className="px-2 py-2.5 text-left font-heading text-[10px] tracking-widest text-espresso/60 uppercase w-36">Примечание</th>
              <th className="w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/20">
            {items.map((item, i) => (
              <tr key={item.id} className="hover:bg-[#FAFAF8] transition-colors group">
                <td className="px-3 py-2">
                  <select
                    value={item.category}
                    onChange={(e) => updateItem(i, 'category', e.target.value)}
                    className="w-2 h-2 opacity-0 absolute"
                    aria-label="категория"
                  />
                  <div className={`w-2.5 h-2.5 rounded-full ${CATEGORY_DOT[item.category]} cursor-pointer`} title={CATEGORY_LABEL[item.category]} />
                </td>
                <td className="px-3 py-2">
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(i, 'name', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-espresso/20 focus:border-espresso outline-none font-body text-espresso text-sm py-0.5"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={item.unit}
                    onChange={(e) => updateItem(i, 'unit', e.target.value)}
                    className="w-14 bg-transparent border-b border-transparent hover:border-espresso/20 focus:border-espresso outline-none font-body text-espresso/70 text-sm py-0.5 text-center"
                  />
                </td>
                <td className="px-2 py-2"><input type="number" value={item.qtyPlan || ''} onChange={(e) => updateItem(i, 'qtyPlan', Number(e.target.value))} className={`${cell} text-espresso/60`} placeholder="0" /></td>
                <td className="px-2 py-2"><input type="number" value={item.qtyActual || ''} onChange={(e) => updateItem(i, 'qtyActual', Number(e.target.value))} className={cell} placeholder="0" /></td>
                <td className="px-2 py-2"><input type="number" value={item.pricePlan || ''} onChange={(e) => updateItem(i, 'pricePlan', Number(e.target.value))} className={`${cell} text-espresso/60`} placeholder="0" /></td>
                <td className="px-2 py-2"><input type="number" value={item.priceActual || ''} onChange={(e) => updateItem(i, 'priceActual', Number(e.target.value))} className={cell} placeholder="0" /></td>
                <td className="px-2 py-2 text-right">
                  {item.qtyPlan > 0 && item.pricePlan > 0
                    ? <span className="font-body text-sm text-espresso/60 tabular-nums">{fmt(effectiveCostPlan(item))}</span>
                    : <input type="number" value={item.costPlan || ''} onChange={(e) => updateItem(i, 'costPlan', Number(e.target.value))} className={`${cell} text-espresso/60`} placeholder="0" />
                  }
                </td>
                <td className="px-2 py-2 text-right">
                  {item.qtyActual > 0 && item.priceActual > 0
                    ? <span className="font-body text-sm text-espresso tabular-nums">{fmt(effectiveCostActual(item))}</span>
                    : <input type="number" value={item.costActual || ''} onChange={(e) => updateItem(i, 'costActual', Number(e.target.value))} className={cell} placeholder="0" />
                  }
                </td>
                <td className="px-2 py-2">
                  <input
                    value={item.note}
                    onChange={(e) => updateItem(i, 'note', e.target.value)}
                    className="w-full bg-transparent border-b border-transparent hover:border-espresso/20 focus:border-espresso outline-none font-body text-espresso/70 text-sm py-0.5 italic"
                  />
                </td>
                <td className="pr-2 py-2">
                  <button
                    onClick={() => removeRow(i)}
                    className="opacity-0 group-hover:opacity-100 text-espresso/40 hover:text-crimson transition-all w-6 text-center text-base"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}

            {/* Add row */}
            <tr className="border-t border-cream/30">
              <td colSpan={13} className="px-3 py-2.5">
                <button
                  onClick={addRow}
                  className="font-heading text-xs uppercase tracking-widest text-espresso/50 hover:text-espresso transition-colors"
                >
                  + Добавить позицию
                </button>
              </td>
            </tr>

            {/* Totals row */}
            <tr className="border-t-2 border-espresso/20 bg-[#F9F9F9] font-heading font-bold">
              <td colSpan={7} className="px-3 py-2.5 text-xs uppercase tracking-widest text-espresso">ИТОГО</td>
              <td className="px-2 py-2.5 text-right text-xs text-espresso/60">{fmt(totals.costPlan)} ₽</td>
              <td className="px-2 py-2.5 text-right text-xs text-espresso">{fmt(totals.costActual)} ₽</td>
              <td colSpan={2} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* P&L Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Затраты (план)',  value: `${fmt(totals.costPlan)} ₽`,   muted: true },
          { label: 'Затраты (факт)',  value: `${fmt(totals.costActual)} ₽`, muted: false },
          { label: 'Продажи (план)',  value: `${fmt(totals.salesPlan)} ₽`,  muted: true },
          { label: 'Прибыль (план)',  value: `${fmt(profitPlan)} ₽ · ${marginPlan.toFixed(1)}%`, profit: profitPlan },
        ].map(({ label, value, muted, profit }) => (
          <div key={label} className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-[9px] uppercase tracking-widest text-espresso/40 mb-1">{label}</p>
            <p className={`font-heading font-black text-lg ${profit !== undefined ? (profit >= 0 ? 'text-green-600' : 'text-crimson') : muted ? 'text-espresso/50' : 'text-espresso'}`}>
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
