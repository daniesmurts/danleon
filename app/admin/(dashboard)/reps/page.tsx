'use client';

import { useEffect, useState } from 'react';
import { adminGetAll, adminCreate, adminUpdate, adminDeleteDoc } from '@/lib/admin-api';
import type { SalesRep, RepAllocation } from '@/lib/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem { weight: number; quantity: number }
interface OrderDoc {
  docId: string;
  repId?: string;
  status: string;
  grandTotal?: number;
  items?: OrderItem[];
  createdAt?: { seconds: number } | string;
}

interface RepStats {
  rep: SalesRep;
  // by packSize (grams) → kg
  allocated: Record<number, number>;
  sold:      Record<number, number>;
  remaining: Record<number, number>;
  orderCount: number;
  revenue: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const PACK_SIZES = [250, 500, 1000];
const fmtKg = (n: number) =>
  n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPacks = (kg: number, packSize: number) =>
  Math.round((kg * 1000) / packSize);
const fmtMoney = (n: number) =>
  n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽';

function buildStats(
  reps: SalesRep[],
  allocations: RepAllocation[],
  orders: OrderDoc[],
): RepStats[] {
  return reps.map((rep) => {
    // Allocated kg per packSize
    const allocated: Record<number, number> = {};
    allocations
      .filter((a) => a.repId === rep.docId)
      .forEach((a) => {
        allocated[a.packSize] = (allocated[a.packSize] ?? 0) + a.kg;
      });

    // Sold kg per packSize (paid orders attributed to rep)
    const sold: Record<number, number> = {};
    let orderCount = 0;
    let revenue = 0;
    orders
      .filter((o) => o.repId === rep.docId && o.status === 'paid')
      .forEach((o) => {
        orderCount++;
        revenue += o.grandTotal ?? 0;
        (o.items ?? []).forEach((item) => {
          const kg = (item.weight * item.quantity) / 1000;
          sold[item.weight] = (sold[item.weight] ?? 0) + kg;
        });
      });

    // Remaining
    const allPackSizes = Array.from(
      new Set([...Object.keys(allocated), ...Object.keys(sold)].map(Number))
    );
    const remaining: Record<number, number> = {};
    allPackSizes.forEach((ps) => {
      remaining[ps] = Math.max(0, (allocated[ps] ?? 0) - (sold[ps] ?? 0));
    });

    return { rep, allocated, sold, remaining, orderCount, revenue };
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminRepsPage() {
  const [reps, setReps]               = useState<SalesRep[]>([]);
  const [allocations, setAllocations] = useState<RepAllocation[]>([]);
  const [orders, setOrders]           = useState<OrderDoc[]>([]);
  const [loading, setLoading]         = useState(true);

  // Add rep form
  const [addingRep, setAddingRep]   = useState(false);
  const [newName, setNewName]       = useState('');
  const [newPhone, setNewPhone]     = useState('');
  const [newEmail, setNewEmail]     = useState('');
  const [newNotes, setNewNotes]     = useState('');
  const [saving, setSaving]         = useState(false);

  // Allocate stock
  const [allocatingRepId, setAllocatingRepId] = useState<string | null>(null);
  const [allocPackSize, setAllocPackSize]     = useState(250);
  const [allocKg, setAllocKg]               = useState('');
  const [allocDate, setAllocDate]           = useState(new Date().toISOString().slice(0, 10));
  const [allocNote, setAllocNote]           = useState('');

  // Expanded rep
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminGetAll('sales_reps', { orderBy: 'createdAt', dir: 'asc' }),
      adminGetAll('rep_allocations', { orderBy: 'createdAt', dir: 'asc' }),
      adminGetAll('orders', { orderBy: 'createdAt', dir: 'desc' }),
    ]).then(([r, a, o]) => {
      setReps(r as unknown as SalesRep[]);
      setAllocations(a as unknown as RepAllocation[]);
      setOrders(o as unknown as OrderDoc[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = buildStats(reps, allocations, orders);

  // ── Add rep ──────────────────────────────────────────────────────────────
  const handleAddRep = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    const docId = await adminCreate('sales_reps', {
      name: newName.trim(),
      phone: newPhone.trim(),
      email: newEmail.trim(),
      notes: newNotes.trim(),
    });
    setReps((prev) => [...prev, {
      docId, name: newName.trim(),
      phone: newPhone.trim(), email: newEmail.trim(), notes: newNotes.trim(),
    }]);
    setNewName(''); setNewPhone(''); setNewEmail(''); setNewNotes('');
    setAddingRep(false);
    setSaving(false);
  };

  // ── Allocate stock ───────────────────────────────────────────────────────
  const handleAllocate = async () => {
    const kg = parseFloat(allocKg);
    if (!allocatingRepId || isNaN(kg) || kg <= 0) return;
    const rep = reps.find((r) => r.docId === allocatingRepId);
    if (!rep) return;
    setSaving(true);
    const docId = await adminCreate('rep_allocations', {
      repId: allocatingRepId,
      repName: rep.name,
      packSize: allocPackSize,
      kg,
      date: allocDate,
      note: allocNote.trim(),
    });
    setAllocations((prev) => [...prev, {
      docId, repId: allocatingRepId, repName: rep.name,
      packSize: allocPackSize, kg, date: allocDate, note: allocNote.trim(),
    }]);
    setAllocKg(''); setAllocNote('');
    setAllocatingRepId(null);
    setSaving(false);
  };

  // ── Delete rep ───────────────────────────────────────────────────────────
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

  // ── Summary ──────────────────────────────────────────────────────────────
  const totalOrderCount = stats.reduce((s, r) => s + r.orderCount, 0);
  const totalRevenue    = stats.reduce((s, r) => s + r.revenue, 0);
  const totalRemaining  = (ps: number) =>
    stats.reduce((s, r) => s + (r.remaining[ps] ?? 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-black tracking-wide text-espresso uppercase">Продавцы</h1>
        <button
          onClick={() => setAddingRep((v) => !v)}
          className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2.5 hover:bg-espresso/90 transition-colors"
        >
          + Добавить продавца
        </button>
      </div>

      {/* Summary cards */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Продавцов</p>
            <p className="font-heading font-black text-xl text-espresso">{reps.length}</p>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Продаж всего</p>
            <p className="font-heading font-black text-xl text-espresso">{totalOrderCount}</p>
            <p className="font-heading text-xs text-espresso/40 mt-0.5">{fmtMoney(totalRevenue)}</p>
          </div>
          <div className="bg-white border border-cream/40 p-4 col-span-2">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-2">На руках у продавцов</p>
            <div className="flex gap-6">
              {PACK_SIZES.map((ps) => {
                const kg = totalRemaining(ps);
                if (kg <= 0) return null;
                return (
                  <div key={ps}>
                    <p className="font-heading font-black text-sm text-espresso">{fmtPacks(kg, ps)} уп.</p>
                    <p className="font-heading text-xs text-espresso/40">{ps}г · {fmtKg(kg)} кг</p>
                  </div>
                );
              })}
              {PACK_SIZES.every((ps) => totalRemaining(ps) <= 0) && (
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
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Имя *</label>
              <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="Айша" />
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Телефон</label>
              <input value={newPhone} onChange={(e) => setNewPhone(e.target.value)}
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="+7 900 000 00 00" />
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Email</label>
              <input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} type="email"
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="rep@example.com" />
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Заметка</label>
              <input value={newNotes} onChange={(e) => setNewNotes(e.target.value)}
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="Рынок Центральный" />
            </div>
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

      {/* Allocate stock panel */}
      {allocatingRepId && (
        <div className="bg-amber-50 border border-amber-200 p-5 mb-4">
          <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-espresso mb-4">
            Выдать кофе — {reps.find((r) => r.docId === allocatingRepId)?.name}
          </h2>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Фасовка</label>
              <select value={allocPackSize} onChange={(e) => setAllocPackSize(Number(e.target.value))}
                className="border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none bg-white">
                <option value={250}>250 г</option>
                <option value={500}>500 г</option>
                <option value={1000}>1000 г (1 кг)</option>
              </select>
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Количество (кг)</label>
              <input type="number" step="0.25" min="0.25" value={allocKg} onChange={(e) => setAllocKg(e.target.value)}
                autoFocus placeholder="2.50"
                className="w-28 border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none text-center" />
              {allocKg && !isNaN(parseFloat(allocKg)) && (
                <p className="font-heading text-xs text-espresso/40 mt-1 text-center">
                  = {fmtPacks(parseFloat(allocKg), allocPackSize)} уп.
                </p>
              )}
            </div>
            <div>
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Дата выдачи</label>
              <input type="date" value={allocDate} onChange={(e) => setAllocDate(e.target.value)}
                className="border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none" />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Заметка</label>
              <input value={allocNote} onChange={(e) => setAllocNote(e.target.value)}
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="Рынок, пятница…" />
            </div>
            <div className="flex gap-2">
              <button onClick={handleAllocate} disabled={saving || !allocKg}
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
          {stats.map(({ rep, allocated, sold, remaining, orderCount, revenue }) => {
            const isOpen = expanded === rep.docId;
            const allPackSizes = Array.from(
              new Set([...Object.keys(allocated), ...Object.keys(sold)].map(Number))
            ).sort((a, b) => a - b);
            const hasStock = allPackSizes.some((ps) => (remaining[ps] ?? 0) > 0);

            return (
              <div key={rep.docId} className="bg-white border border-cream/40 overflow-hidden">
                {/* Rep header row */}
                <div className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-espresso/10 flex items-center justify-center shrink-0">
                    <span className="font-heading font-black text-sm text-espresso">
                      {rep.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Name + contact */}
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-bold text-espresso">{rep.name}</p>
                    <div className="flex gap-3 mt-0.5">
                      {rep.phone && <span className="font-body text-xs text-espresso/50">{rep.phone}</span>}
                      {rep.email && <span className="font-body text-xs text-espresso/40">{rep.email}</span>}
                      {rep.notes && <span className="font-body text-xs text-espresso/30 italic">{rep.notes}</span>}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="hidden md:flex items-center gap-8">
                    <div className="text-right">
                      <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-0.5">Продаж</p>
                      <p className="font-heading font-black text-sm text-espresso">{orderCount}</p>
                      {revenue > 0 && <p className="font-heading text-xs text-espresso/40">{fmtMoney(revenue)}</p>}
                    </div>

                    {/* Remaining per pack size */}
                    {allPackSizes.length > 0 && (
                      <div className="text-right">
                        <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">На руках</p>
                        <div className="flex gap-4">
                          {allPackSizes.map((ps) => {
                            const rem = remaining[ps] ?? 0;
                            const packs = fmtPacks(rem, ps);
                            return (
                              <div key={ps} className="text-right">
                                <p className={`font-heading font-black text-sm ${rem <= 0 ? 'text-espresso/20' : packs <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                  {packs} уп.
                                </p>
                                <p className="font-heading text-xs text-espresso/30">{ps}г · {fmtKg(rem)} кг</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => { setAllocatingRepId(rep.docId); setExpanded(null); }}
                      className="font-heading text-xs uppercase tracking-wide text-espresso border border-espresso/20 px-3 py-1.5 hover:bg-espresso hover:text-cream transition-colors"
                    >
                      + Выдать
                    </button>
                    <button
                      onClick={() => setExpanded(isOpen ? null : rep.docId)}
                      className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso transition-colors px-2 py-1.5"
                    >
                      {isOpen ? '▲' : '▼'}
                    </button>
                    <button
                      onClick={() => handleDeleteRep(rep.docId)}
                      className="font-heading text-xs uppercase tracking-wide text-espresso/20 hover:text-crimson transition-colors px-2 py-1.5"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Expanded: detailed breakdown */}
                {isOpen && (
                  <div className="border-t border-cream/40 px-5 py-4 bg-[#FAFAFA]">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Per pack size breakdown */}
                      <div className="md:col-span-2">
                        <p className="font-heading text-xs font-bold uppercase tracking-widest text-espresso/50 mb-3">Детализация по фасовкам</p>
                        {allPackSizes.length === 0 ? (
                          <p className="font-body text-sm text-espresso/30">Выдач не было</p>
                        ) : (
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="text-left">
                                {['Фасовка', 'Выдано', 'Продано', 'Остаток'].map((h) => (
                                  <th key={h} className="font-heading text-xs uppercase tracking-wide text-espresso/40 pb-2 pr-6">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-cream/30">
                              {allPackSizes.map((ps) => {
                                const alloc  = allocated[ps] ?? 0;
                                const s      = sold[ps] ?? 0;
                                const rem    = remaining[ps] ?? 0;
                                return (
                                  <tr key={ps}>
                                    <td className="py-2 pr-6 font-heading font-bold text-espresso">{ps} г</td>
                                    <td className="py-2 pr-6 font-body text-espresso/70">
                                      {fmtPacks(alloc, ps)} уп. <span className="text-espresso/40 text-xs">({fmtKg(alloc)} кг)</span>
                                    </td>
                                    <td className="py-2 pr-6 font-body text-espresso/70">
                                      {fmtPacks(s, ps)} уп. <span className="text-espresso/40 text-xs">({fmtKg(s)} кг)</span>
                                    </td>
                                    <td className={`py-2 font-heading font-bold ${rem <= 0 ? 'text-espresso/25' : fmtPacks(rem, ps) <= 3 ? 'text-yellow-600' : 'text-green-600'}`}>
                                      {fmtPacks(rem, ps)} уп. <span className="font-normal text-xs text-espresso/40">({fmtKg(rem)} кг)</span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        )}
                      </div>

                      {/* Allocation history */}
                      <div>
                        <p className="font-heading text-xs font-bold uppercase tracking-widest text-espresso/50 mb-3">История выдач</p>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {allocations
                            .filter((a) => a.repId === rep.docId)
                            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                            .map((a) => (
                              <div key={a.docId} className="flex items-center justify-between gap-2 text-xs">
                                <span className="font-body text-espresso/50">
                                  {new Date(a.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                                </span>
                                <span className="font-heading font-bold text-espresso">
                                  {fmtPacks(a.kg, a.packSize)} уп. {a.packSize}г
                                </span>
                                <span className="font-body text-espresso/30">{fmtKg(a.kg)} кг</span>
                                {a.note && <span className="font-body text-espresso/30 italic truncate max-w-[80px]">{a.note}</span>}
                              </div>
                            ))}
                          {allocations.filter((a) => a.repId === rep.docId).length === 0 && (
                            <p className="font-body text-xs text-espresso/25">Выдач не было</p>
                          )}
                        </div>
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
