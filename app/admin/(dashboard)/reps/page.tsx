'use client';

import { useEffect, useState } from 'react';
import { adminGetAll, adminCreate, adminUpdate, adminDeleteDoc } from '@/lib/admin-api';
import { getAllProducts } from '@/lib/sanity';
import type { SalesRep, RepAllocation } from '@/lib/types';
import type { Product } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem { weight: number; quantity: number; productId?: string }
interface OrderDoc {
  docId: string; repId?: string; status: string;
  grandTotal?: number; items?: OrderItem[];
}

// Key for grouping: "productId|packSize"
type AllocKey = string;

interface RepStats {
  rep: SalesRep;
  // allocKey → kg
  allocated: Record<AllocKey, number>;
  sold:      Record<AllocKey, number>;
  remaining: Record<AllocKey, number>;
  // allocKey → { productName, packSize }
  keys: Record<AllocKey, { productName: string; packSize: number }>;
  orderCount: number;
  revenue: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmtKg    = (n: number) => n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPacks = (kg: number, ps: number) => Math.round((kg * 1000) / ps);
const fmtMoney = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';
const allocKey = (productId: string, packSize: number): AllocKey => `${productId}|${packSize}`;

function buildStats(reps: SalesRep[], allocations: RepAllocation[], orders: OrderDoc[]): RepStats[] {
  return reps.map((rep) => {
    const allocated: Record<AllocKey, number> = {};
    const keys: Record<AllocKey, { productName: string; packSize: number }> = {};

    allocations.filter((a) => a.repId === rep.docId).forEach((a) => {
      const k = allocKey(a.productId ?? '', a.packSize);
      allocated[k] = (allocated[k] ?? 0) + a.kg;
      keys[k] = { productName: a.productName ?? `${a.packSize}г`, packSize: a.packSize };
    });

    const sold: Record<AllocKey, number> = {};
    let orderCount = 0, revenue = 0;

    orders.filter((o) => o.repId === rep.docId && o.status === 'paid').forEach((o) => {
      orderCount++;
      revenue += o.grandTotal ?? 0;
      (o.items ?? []).forEach((item) => {
        const k = allocKey(item.productId ?? '', item.weight);
        const kg = (item.weight * item.quantity) / 1000;
        sold[k] = (sold[k] ?? 0) + kg;
        if (!keys[k]) keys[k] = { productName: `${item.weight}г`, packSize: item.weight };
      });
    });

    const allKeys = Array.from(new Set([...Object.keys(allocated), ...Object.keys(sold)]));
    const remaining: Record<AllocKey, number> = {};
    allKeys.forEach((k) => {
      remaining[k] = Math.max(0, Math.round(((allocated[k] ?? 0) - (sold[k] ?? 0)) * 1000) / 1000);
    });

    return { rep, allocated, sold, remaining, keys, orderCount, revenue };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminRepsPage() {
  const [reps, setReps]               = useState<SalesRep[]>([]);
  const [allocations, setAllocations] = useState<RepAllocation[]>([]);
  const [orders, setOrders]           = useState<OrderDoc[]>([]);
  const [products, setProducts]       = useState<Product[]>([]);
  const [loading, setLoading]         = useState(true);

  // Add rep
  const [addingRep, setAddingRep] = useState(false);
  const [newName, setNewName]     = useState('');
  const [newPhone, setNewPhone]   = useState('');
  const [newEmail, setNewEmail]   = useState('');
  const [newNotes, setNewNotes]   = useState('');

  // Allocate
  const [allocatingRepId, setAllocatingRepId] = useState<string | null>(null);
  const [allocProductId, setAllocProductId]   = useState('');
  const [allocPackSize, setAllocPackSize]     = useState(250);
  const [allocKg, setAllocKg]               = useState('');
  const [allocDate, setAllocDate]           = useState(new Date().toISOString().slice(0, 10));
  const [allocNote, setAllocNote]           = useState('');

  // Edit allocation
  const [editingAllocId, setEditingAllocId]     = useState<string | null>(null);
  const [editProductId, setEditProductId]       = useState('');
  const [editPackSize, setEditPackSize]         = useState(250);
  const [editKg, setEditKg]                   = useState('');
  const [editDate, setEditDate]               = useState('');
  const [editNote, setEditNote]               = useState('');

  const [saving, setSaving]   = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminGetAll('sales_reps', { orderBy: 'createdAt', dir: 'asc' }),
      adminGetAll('rep_allocations', { orderBy: 'createdAt', dir: 'asc' }),
      adminGetAll('orders', { orderBy: 'createdAt', dir: 'desc' }),
      getAllProducts(),
    ]).then(([r, a, o, p]) => {
      setReps(r as unknown as SalesRep[]);
      setAllocations(a as unknown as RepAllocation[]);
      setOrders(o as unknown as OrderDoc[]);
      setProducts(p);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = buildStats(reps, allocations, orders);

  // Available pack sizes from selected product
  const productPackSizes = (productId: string): number[] => {
    const p = products.find((pr) => pr.id === productId);
    if (!p) return [250, 500, 1000];
    if (p.variants && p.variants.length > 0) {
      return p.variants.map((v) => v.grams).filter(Boolean).sort((a, b) => a - b);
    }
    return [250, 500, 1000];
  };

  // ── Add rep ──────────────────────────────────────────────────────────────
  const handleAddRep = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const docId = await adminCreate('sales_reps', { name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim(), notes: newNotes.trim() });
    setReps((prev) => [...prev, { docId, name: newName.trim(), phone: newPhone.trim(), email: newEmail.trim(), notes: newNotes.trim() }]);
    setNewName(''); setNewPhone(''); setNewEmail(''); setNewNotes('');
    setAddingRep(false);
    setSaving(false);
  };

  // ── Allocate ─────────────────────────────────────────────────────────────
  const handleAllocate = async () => {
    const kg = parseFloat(allocKg);
    if (!allocatingRepId || !allocProductId || isNaN(kg) || kg <= 0) return;
    const rep = reps.find((r) => r.docId === allocatingRepId);
    const product = products.find((p) => p.id === allocProductId);
    if (!rep) return;
    setSaving(true);
    const docId = await adminCreate('rep_allocations', {
      repId: allocatingRepId, repName: rep.name,
      productId: allocProductId, productName: product?.name ?? '',
      packSize: allocPackSize, kg, date: allocDate, note: allocNote.trim(),
    });
    setAllocations((prev) => [...prev, {
      docId, repId: allocatingRepId, repName: rep.name,
      productId: allocProductId, productName: product?.name ?? '',
      packSize: allocPackSize, kg, date: allocDate, note: allocNote.trim(),
    }]);
    setAllocKg(''); setAllocNote(''); setAllocProductId('');
    setAllocatingRepId(null);
    setSaving(false);
  };

  // ── Edit allocation ───────────────────────────────────────────────────────
  const startEditAlloc = (a: RepAllocation) => {
    setEditingAllocId(a.docId);
    setEditProductId(a.productId ?? '');
    setEditPackSize(a.packSize);
    setEditKg(String(a.kg));
    setEditDate(a.date);
    setEditNote(a.note ?? '');
  };

  const handleSaveAlloc = async (a: RepAllocation) => {
    const kg = parseFloat(editKg);
    if (isNaN(kg) || kg <= 0) return;
    const product = products.find((p) => p.id === editProductId);
    setSaving(true);
    const updates = {
      productId: editProductId || a.productId,
      productName: product?.name ?? a.productName ?? '',
      packSize: editPackSize,
      kg,
      date: editDate,
      note: editNote.trim(),
    };
    await adminUpdate('rep_allocations', a.docId, updates);
    setAllocations((prev) => prev.map((al) => al.docId === a.docId ? { ...al, ...updates } : al));
    setEditingAllocId(null);
    setSaving(false);
  };

  const handleDeleteAlloc = async (docId: string) => {
    if (!confirm('Удалить эту запись о выдаче?')) return;
    await adminDeleteDoc('rep_allocations', docId);
    setAllocations((prev) => prev.filter((a) => a.docId !== docId));
  };

  // ── Delete rep ────────────────────────────────────────────────────────────
  const handleDeleteRep = async (docId: string) => {
    if (!confirm('Удалить продавца? Заказы и выдачи сохранятся.')) return;
    await adminDeleteDoc('sales_reps', docId);
    setReps((prev) => prev.filter((r) => r.docId !== docId));
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  // ── Summary ───────────────────────────────────────────────────────────────
  const totalOrders  = stats.reduce((s, r) => s + r.orderCount, 0);
  const totalRevenue = stats.reduce((s, r) => s + r.revenue, 0);

  // Total remaining across all reps, grouped by packSize
  const totalRemainingByPackSize: Record<number, number> = {};
  stats.forEach(({ remaining, keys }) => {
    Object.entries(remaining).forEach(([k, kg]) => {
      const ps = keys[k]?.packSize ?? 0;
      if (ps) totalRemainingByPackSize[ps] = (totalRemainingByPackSize[ps] ?? 0) + kg;
    });
  });

  const inputCls = 'border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none bg-white';

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-black tracking-wide text-espresso uppercase">Продавцы</h1>
        <button onClick={() => setAddingRep((v) => !v)}
          className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2.5 hover:bg-espresso/90 transition-colors">
          + Добавить продавца
        </button>
      </div>

      {/* Summary */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Продавцов</p>
            <p className="font-heading font-black text-xl text-espresso">{reps.length}</p>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Продаж всего</p>
            <p className="font-heading font-black text-xl text-espresso">{totalOrders}</p>
            {totalRevenue > 0 && <p className="font-heading text-xs text-espresso/40 mt-0.5">{fmtMoney(totalRevenue)}</p>}
          </div>
          <div className="bg-white border border-cream/40 p-4 col-span-2">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-2">На руках у продавцов</p>
            <div className="flex gap-5 flex-wrap">
              {Object.entries(totalRemainingByPackSize)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([ps, kg]) => kg > 0 && (
                  <div key={ps}>
                    <p className="font-heading font-black text-sm text-espresso">{fmtPacks(kg, Number(ps))} уп.</p>
                    <p className="font-heading text-xs text-espresso/40">{ps}г · {fmtKg(kg)} кг</p>
                  </div>
                ))}
              {Object.values(totalRemainingByPackSize).every((v) => v <= 0) && (
                <p className="font-heading text-xs text-espresso/30 uppercase tracking-wide">нет выдач</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add rep form */}
      {addingRep && (
        <div className="bg-white border border-cream/40 p-5 mb-4">
          <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-espresso mb-4">Новый продавец</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { label: 'Имя *', val: newName, set: setNewName, ph: 'Айша', auto: true },
              { label: 'Телефон', val: newPhone, set: setNewPhone, ph: '+7 900 000 00 00' },
              { label: 'Email', val: newEmail, set: setNewEmail, ph: 'rep@example.com' },
              { label: 'Заметка', val: newNotes, set: setNewNotes, ph: 'Рынок Центральный' },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">{label}</label>
                <input value={val} onChange={(e) => set(e.target.value)}
                  className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                  placeholder={ph} />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAddRep} disabled={saving || !newName.trim()}
              className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2 hover:bg-espresso/90 disabled:opacity-50 transition-colors">
              Добавить
            </button>
            <button onClick={() => setAddingRep(false)} className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso px-3 transition-colors">
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Allocate panel */}
      {allocatingRepId && (
        <div className="bg-amber-50 border border-amber-200 p-5 mb-4">
          <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-espresso mb-4">
            Выдать кофе — {reps.find((r) => r.docId === allocatingRepId)?.name}
          </h2>
          <div className="flex flex-wrap gap-3 items-end">
            {/* Product */}
            <div className="min-w-[200px]">
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Продукт *</label>
              <select value={allocProductId}
                onChange={(e) => { setAllocProductId(e.target.value); const ps = productPackSizes(e.target.value); setAllocPackSize(ps[0] ?? 250); }}
                className={`w-full ${inputCls}`}>
                <option value="">Выбрать продукт…</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            {/* Pack size */}
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Фасовка</label>
              <select value={allocPackSize} onChange={(e) => setAllocPackSize(Number(e.target.value))} className={inputCls}>
                {(allocProductId ? productPackSizes(allocProductId) : [250, 500, 1000]).map((ps) => (
                  <option key={ps} value={ps}>{ps >= 1000 ? `${ps / 1000} кг` : `${ps} г`}</option>
                ))}
              </select>
            </div>
            {/* Kg */}
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Кол-во (кг)</label>
              <input type="number" step="0.25" min="0.25" value={allocKg} onChange={(e) => setAllocKg(e.target.value)}
                autoFocus placeholder="2.50" className={`w-28 text-center ${inputCls}`} />
              {allocKg && !isNaN(parseFloat(allocKg)) && (
                <p className="font-heading text-xs text-espresso/40 mt-1 text-center">
                  = {fmtPacks(parseFloat(allocKg), allocPackSize)} уп.
                </p>
              )}
            </div>
            {/* Date */}
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Дата</label>
              <input type="date" value={allocDate} onChange={(e) => setAllocDate(e.target.value)} className={inputCls} />
            </div>
            {/* Note */}
            <div className="flex-1 min-w-[140px]">
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Заметка</label>
              <input value={allocNote} onChange={(e) => setAllocNote(e.target.value)}
                placeholder="Рынок, пятница…" className={`w-full ${inputCls}`} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAllocate} disabled={saving || !allocKg || !allocProductId}
                className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2 hover:bg-espresso/90 disabled:opacity-50 transition-colors">
                {saving ? 'Сохраняю…' : 'Выдать'}
              </button>
              <button onClick={() => setAllocatingRepId(null)}
                className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso px-3 transition-colors">
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reps list */}
      {stats.length === 0 ? (
        <div className="bg-white border border-cream/40 p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">Продавцов пока нет</p>
          <button onClick={() => setAddingRep(true)} className="inline-block mt-4 font-heading text-xs uppercase tracking-wide text-crimson hover:text-espresso transition-colors">
            Добавить первого →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {stats.map(({ rep, allocated, sold, remaining, keys, orderCount, revenue }) => {
            const isOpen = expanded === rep.docId;
            const allKeys = Object.keys(keys).sort();
            const repAllocs = allocations.filter((a) => a.repId === rep.docId)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            return (
              <div key={rep.docId} className="bg-white border border-cream/40 overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  <div className="w-9 h-9 rounded-full bg-espresso/10 flex items-center justify-center shrink-0">
                    <span className="font-heading font-black text-sm text-espresso">{rep.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-espresso">{rep.name}</p>
                    <div className="flex gap-3 mt-0.5 flex-wrap">
                      {rep.phone && <span className="font-body text-xs text-espresso/50">{rep.phone}</span>}
                      {rep.email && <span className="font-body text-xs text-espresso/40">{rep.email}</span>}
                      {rep.notes && <span className="font-body text-xs text-espresso/30 italic">{rep.notes}</span>}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-right">
                      <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-0.5">Продаж</p>
                      <p className="font-heading font-black text-sm text-espresso">{orderCount}</p>
                      {revenue > 0 && <p className="font-heading text-xs text-espresso/40">{fmtMoney(revenue)}</p>}
                    </div>
                    {allKeys.length > 0 && (
                      <div className="text-right">
                        <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">На руках</p>
                        <div className="flex gap-4">
                          {allKeys.map((k) => {
                            const rem = remaining[k] ?? 0;
                            const { productName, packSize } = keys[k];
                            const packs = fmtPacks(rem, packSize);
                            return (
                              <div key={k} className="text-right">
                                <p className={`font-heading font-black text-sm ${rem <= 0 ? 'text-espresso/20' : packs <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {packs} уп.
                                </p>
                                <p className="font-heading text-xs text-espresso/30 max-w-[96px] truncate">{productName}</p>
                                <p className="font-heading text-xs text-espresso/25">{packSize}г · {fmtKg(rem)} кг</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => { setAllocatingRepId(rep.docId); setExpanded(null); }}
                      className="font-heading text-xs uppercase tracking-wide text-espresso border border-espresso/20 px-3 py-1.5 hover:bg-espresso hover:text-cream transition-colors">
                      + Выдать
                    </button>
                    <button onClick={() => setExpanded(isOpen ? null : rep.docId)}
                      className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso transition-colors px-2 py-1.5">
                      {isOpen ? '▲' : '▼'}
                    </button>
                    <button onClick={() => handleDeleteRep(rep.docId)}
                      className="font-heading text-xs uppercase tracking-wide text-espresso/20 hover:text-crimson transition-colors px-2 py-1.5">
                      ×
                    </button>
                  </div>
                </div>

                {/* Expanded */}
                {isOpen && (
                  <div className="border-t border-cream/40 px-5 py-5 bg-[#FAFAFA]">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                      {/* Stock breakdown */}
                      <div>
                        <p className="font-heading text-xs font-bold uppercase tracking-widest text-espresso/50 mb-3">Детализация по товарам</p>
                        {allKeys.length === 0 ? (
                          <p className="font-body text-sm text-espresso/30">Выдач не было</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr>
                                {['Товар', 'Фасовка', 'Выдано', 'Продано', 'Остаток'].map((h) => (
                                  <th key={h} className="text-left font-heading text-xs uppercase tracking-wide text-espresso/40 pb-2 pr-4">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-cream/30">
                              {allKeys.map((k) => {
                                const alloc = allocated[k] ?? 0;
                                const s     = sold[k] ?? 0;
                                const rem   = remaining[k] ?? 0;
                                const { productName, packSize } = keys[k];
                                return (
                                  <tr key={k}>
                                    <td className="py-2 pr-4 font-body text-espresso text-xs max-w-[120px] truncate">{productName}</td>
                                    <td className="py-2 pr-4 font-heading font-bold text-espresso text-xs">{packSize}г</td>
                                    <td className="py-2 pr-4 font-body text-espresso/70 text-xs">
                                      {fmtPacks(alloc, packSize)} уп. <span className="text-espresso/40">({fmtKg(alloc)} кг)</span>
                                    </td>
                                    <td className="py-2 pr-4 font-body text-espresso/70 text-xs">
                                      {fmtPacks(s, packSize)} уп. <span className="text-espresso/40">({fmtKg(s)} кг)</span>
                                    </td>
                                    <td className={`py-2 font-heading font-bold text-xs ${rem <= 0 ? 'text-espresso/25' : fmtPacks(rem, packSize) <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      {fmtPacks(rem, packSize)} уп. <span className="font-normal text-espresso/40">({fmtKg(rem)} кг)</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Allocation history with edit/delete */}
                      <div>
                        <p className="font-heading text-xs font-bold uppercase tracking-widest text-espresso/50 mb-3">История выдач</p>
                        {repAllocs.length === 0 ? (
                          <p className="font-body text-xs text-espresso/25">Выдач не было</p>
                        ) : (
                          <div className="space-y-1.5 max-h-64 overflow-y-auto">
                            {repAllocs.map((a) => (
                              <div key={a.docId} className="group">
                                {editingAllocId === a.docId ? (
                                  /* ── Edit form ── */
                                  <div className="border border-espresso/20 bg-white p-3 space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                      <div>
                                        <label className="block font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Продукт</label>
                                        <select value={editProductId}
                                          onChange={(e) => { setEditProductId(e.target.value); setEditPackSize(productPackSizes(e.target.value)[0] ?? 250); }}
                                          className={`w-full ${inputCls} text-xs`}>
                                          <option value="">— без привязки</option>
                                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Фасовка</label>
                                        <select value={editPackSize} onChange={(e) => setEditPackSize(Number(e.target.value))}
                                          className={`w-full ${inputCls} text-xs`}>
                                          {(editProductId ? productPackSizes(editProductId) : [250, 500, 1000]).map((ps) => (
                                            <option key={ps} value={ps}>{ps >= 1000 ? `${ps / 1000} кг` : `${ps} г`}</option>
                                          ))}
                                        </select>
                                      </div>
                                      <div>
                                        <label className="block font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Кол-во кг</label>
                                        <input type="number" step="0.25" value={editKg} onChange={(e) => setEditKg(e.target.value)}
                                          className={`w-full text-center ${inputCls} text-xs`} />
                                      </div>
                                      <div>
                                        <label className="block font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Дата</label>
                                        <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)}
                                          className={`w-full ${inputCls} text-xs`} />
                                      </div>
                                      <div className="col-span-2">
                                        <label className="block font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Заметка</label>
                                        <input value={editNote} onChange={(e) => setEditNote(e.target.value)}
                                          className={`w-full ${inputCls} text-xs`} />
                                      </div>
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                      <button onClick={() => handleSaveAlloc(a)} disabled={saving}
                                        className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-3 py-1.5 hover:bg-espresso/90 disabled:opacity-50 transition-colors">
                                        Сохранить
                                      </button>
                                      <button onClick={() => setEditingAllocId(null)}
                                        className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso px-2 transition-colors">
                                        Отмена
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* ── View row ── */
                                  <div className="flex items-center gap-3 py-1.5 px-2 rounded hover:bg-white transition-colors">
                                    <span className="font-body text-xs text-espresso/40 w-16 shrink-0">
                                      {new Date(a.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                    </span>
                                    <span className="font-body text-xs text-espresso flex-1 truncate">
                                      {a.productName || '—'} · <span className="font-heading font-bold">{a.packSize}г</span>
                                    </span>
                                    <span className="font-heading font-bold text-xs text-espresso shrink-0">
                                      {fmtPacks(a.kg, a.packSize)} уп.
                                    </span>
                                    <span className="font-body text-xs text-espresso/30 shrink-0">{fmtKg(a.kg)} кг</span>
                                    {a.note && <span className="font-body text-xs text-espresso/25 italic truncate max-w-[60px]">{a.note}</span>}
                                    {/* Edit / delete — visible on hover */}
                                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity shrink-0">
                                      <button onClick={() => startEditAlloc(a)}
                                        className="font-heading text-xs text-espresso/40 hover:text-espresso border border-espresso/20 px-1.5 py-0.5 transition-colors">
                                        ✎
                                      </button>
                                      <button onClick={() => handleDeleteAlloc(a.docId)}
                                        className="font-heading text-xs text-espresso/30 hover:text-crimson border border-espresso/10 px-1.5 py-0.5 transition-colors">
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
