'use client';

import { useEffect, useState, useCallback } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Purchase, PurchaseItem } from '@/lib/types';

function fmt(n: number) {
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
}

const UNIT_OPTIONS = ['шт.', 'уп.', 'кг', 'л', 'услуг', 'пара'];

function newItem(): PurchaseItem {
  return { id: Date.now().toString(), name: '', unit: 'шт.', qty: 0, unitCost: 0, totalCost: 0 };
}

export default function PurchaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    getDoc(doc(db, 'purchases', id))
      .then((snap) => {
        if (!snap.exists()) { router.push('/admin/purchases'); return; }
        setPurchase({ docId: snap.id, grandTotal: 0, items: [], ...snap.data() } as unknown as Purchase);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, router]);

  const save = useCallback(async (updated: Purchase) => {
    setSaving(true);
    const grandTotal = updated.items.reduce((s, i) => s + (i.totalCost || 0), 0);
    const toSave = { ...updated, grandTotal, updatedAt: serverTimestamp() };
    await setDoc(doc(db, 'purchases', updated.docId), {
      date:       toSave.date,
      supplier:   toSave.supplier,
      note:       toSave.note ?? '',
      items:      toSave.items,
      grandTotal: toSave.grandTotal,
      updatedAt:  toSave.updatedAt,
    }, { merge: true });
    setPurchase({ ...updated, grandTotal });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }, []);

  const updateHeader = (field: 'date' | 'supplier' | 'note', value: string) => {
    if (!purchase) return;
    setPurchase({ ...purchase, [field]: value });
  };

  const updateItem = (idx: number, field: keyof PurchaseItem, raw: string) => {
    if (!purchase) return;
    const items = [...purchase.items];
    const item  = { ...items[idx] };

    if (field === 'name' || field === 'unit') {
      (item as Record<string, unknown>)[field] = raw;
    } else {
      const num = parseFloat(raw) || 0;
      (item as Record<string, unknown>)[field] = num;
      if (field === 'qty' || field === 'unitCost') {
        const qty      = field === 'qty'      ? num : item.qty;
        const unitCost = field === 'unitCost' ? num : item.unitCost;
        item.totalCost = qty > 0 && unitCost > 0
          ? Math.round(qty * unitCost * 100) / 100
          : item.totalCost;
      }
    }
    items[idx] = item;
    setPurchase({ ...purchase, items });
  };

  const addItem = () => {
    if (!purchase) return;
    setPurchase({ ...purchase, items: [...purchase.items, newItem()] });
  };

  const removeItem = (idx: number) => {
    if (!purchase) return;
    setPurchase({ ...purchase, items: purchase.items.filter((_, i) => i !== idx) });
  };

  const grandTotal = purchase?.items.reduce((s, i) => s + (i.totalCost || 0), 0) ?? 0;

  const inputCls = 'border border-espresso/20 px-2 py-1.5 font-body text-sm focus:border-espresso outline-none bg-white w-full';

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );
  if (!purchase) return null;

  return (
    <div>
      {/* Back + save */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/purchases" className="font-heading text-xs uppercase tracking-wide text-espresso/50 hover:text-espresso transition-colors">
          ← Закупки
        </Link>
        <button
          onClick={() => save(purchase)}
          disabled={saving}
          className={`font-heading text-xs uppercase tracking-wide px-5 py-2.5 transition-colors disabled:opacity-50 ${
            saved ? 'bg-green-700 text-white' : 'bg-espresso text-cream hover:bg-espresso/90'
          }`}
        >
          {saved ? '✓ Сохранено' : saving ? 'Сохраняю...' : 'Сохранить'}
        </button>
      </div>

      {/* Header fields */}
      <div className="bg-white border border-cream/40 p-5 mb-5 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Дата</label>
          <input
            type="date" value={purchase.date}
            onChange={(e) => updateHeader('date', e.target.value)}
            className="border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
          />
        </div>
        <div className="flex-1 min-w-[180px]">
          <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Поставщик / источник</label>
          <input
            value={purchase.supplier}
            onChange={(e) => updateHeader('supplier', e.target.value)}
            className="border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none w-full"
          />
        </div>
        <div className="flex-1 min-w-[160px]">
          <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Заметка (необяз.)</label>
          <input
            value={purchase.note ?? ''}
            onChange={(e) => updateHeader('note', e.target.value)}
            placeholder="Партия №3..."
            className="border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none w-full"
          />
        </div>
      </div>

      {/* Line items table */}
      <div className="bg-white border border-cream/40 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-cream/40 bg-[#F9F9F9]">
              <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase w-[35%]">Наименование</th>
              <th className="text-left px-3 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase w-20">Ед.</th>
              <th className="text-center px-3 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase w-24">Кол-во</th>
              <th className="text-center px-3 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase w-32">Цена за ед. ₽</th>
              <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase w-32">Сумма ₽</th>
              <th className="px-3 py-3 w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/30">
            {purchase.items.map((item, idx) => (
              <tr key={item.id} className="group">
                <td className="px-4 py-2">
                  <input
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    placeholder="Кружка, упаковка, сахар..."
                    className={inputCls}
                  />
                </td>
                <td className="px-3 py-2">
                  <select
                    value={item.unit}
                    onChange={(e) => updateItem(idx, 'unit', e.target.value)}
                    className="border border-espresso/20 px-2 py-1.5 font-body text-sm focus:border-espresso outline-none bg-white w-full"
                  >
                    {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" value={item.qty || ''}
                    onChange={(e) => updateItem(idx, 'qty', e.target.value)}
                    placeholder="0"
                    className={`${inputCls} text-center`}
                  />
                </td>
                <td className="px-3 py-2">
                  <input
                    type="number" value={item.unitCost || ''}
                    onChange={(e) => updateItem(idx, 'unitCost', e.target.value)}
                    placeholder="0"
                    className={`${inputCls} text-center`}
                  />
                </td>
                <td className="px-4 py-2 text-right">
                  {item.qty > 0 && item.unitCost > 0 ? (
                    <span className="font-heading font-bold text-sm text-espresso">
                      {fmt(item.qty * item.unitCost)}
                    </span>
                  ) : item.totalCost > 0 ? (
                    <input
                      type="number" value={item.totalCost || ''}
                      onChange={(e) => updateItem(idx, 'totalCost', e.target.value)}
                      className="border border-espresso/20 px-2 py-1.5 font-body text-sm focus:border-espresso outline-none text-right w-28"
                    />
                  ) : (
                    <span className="text-espresso/25 text-xs font-body">—</span>
                  )}
                </td>
                <td className="px-3 py-2 text-center">
                  <button
                    onClick={() => removeItem(idx)}
                    className="text-espresso/20 hover:text-crimson text-base leading-none transition-colors opacity-0 group-hover:opacity-100"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}

            {/* Add row button */}
            <tr>
              <td colSpan={6} className="px-4 py-2">
                <button
                  onClick={addItem}
                  className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso transition-colors"
                >
                  + Добавить позицию
                </button>
              </td>
            </tr>

            {/* Totals */}
            {purchase.items.length > 0 && (
              <tr className="border-t-2 border-espresso/20 bg-[#F9F9F9] font-heading font-bold">
                <td colSpan={4} className="px-4 py-3 text-xs uppercase tracking-wide text-espresso">ИТОГО</td>
                <td className="px-4 py-3 text-right text-base text-espresso">{fmt(grandTotal)}</td>
                <td />
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {purchase.items.length === 0 && (
        <p className="text-center font-body text-xs text-espresso/40 mt-6">
          Нажмите «+ Добавить позицию» в таблице, чтобы внести товары этой закупки.
        </p>
      )}
    </div>
  );
}
