'use client';

import { useEffect, useState } from 'react';
import { adminGetAll, adminCreate, adminDeleteDoc } from '@/lib/admin-api';
import Link from 'next/link';
import type { Purchase } from '@/lib/types';

function fmt(n: number) {
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
}
function fmtDate(d: string) {
  if (!d) return '—';
  const [y, m, day] = d.split('-');
  return `${day}.${m}.${y}`;
}

export default function AdminPurchasesPage() {
  const [rows, setRows]       = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving]   = useState(false);

  // New purchase form state
  const [newDate, setNewDate]         = useState(() => new Date().toISOString().slice(0, 10));
  const [newSupplier, setNewSupplier] = useState('');
  const [newNote, setNewNote]         = useState('');

  useEffect(() => {
    adminGetAll('purchases', { orderBy: 'date', dir: 'desc' })
      .then((docs) => { setRows(docs.map((d) => ({ grandTotal: 0, items: [], ...d } as unknown as Purchase))); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const handleCreate = async () => {
    if (!newSupplier.trim()) return;
    setSaving(true);
    const data = {
      date: newDate,
      supplier: newSupplier.trim(),
      note: newNote.trim(),
      items: [],
      grandTotal: 0,
    };
    const docId = await adminCreate('purchases', data);
    setRows((prev) => [{ docId, ...data } as unknown as Purchase, ...prev]);
    setNewDate(new Date().toISOString().slice(0, 10));
    setNewSupplier('');
    setNewNote('');
    setCreating(false);
    setSaving(false);
  };

  const handleDelete = async (docId: string) => {
    await adminDeleteDoc('purchases', docId);
    setRows((prev) => prev.filter((r) => r.docId !== docId));
  };

  /* ── summary ── */
  const totalSpent     = rows.reduce((s, r) => s + (r.grandTotal || 0), 0);
  const now            = new Date();
  const thisMonthKey   = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthSpent = rows
    .filter((r) => r.date?.startsWith(thisMonthKey))
    .reduce((s, r) => s + (r.grandTotal || 0), 0);

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-2xl font-black tracking-wide text-espresso uppercase">Закупки</h1>
        <button
          onClick={() => setCreating((v) => !v)}
          className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2.5 hover:bg-espresso/90 transition-colors"
        >
          + Добавить закупку
        </button>
      </div>

      {/* Summary cards */}
      {rows.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Закупок</p>
            <p className="font-heading font-black text-xl text-espresso">{rows.length}</p>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">В этом месяце</p>
            <p className="font-heading font-black text-xl text-espresso">{fmt(thisMonthSpent)}</p>
          </div>
          <div className="bg-white border border-cream/40 p-4">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Всего потрачено</p>
            <p className="font-heading font-black text-xl text-espresso">{fmt(totalSpent)}</p>
          </div>
        </div>
      )}

      {/* New purchase form */}
      {creating && (
        <div className="bg-white border border-cream/40 p-4 mb-4 flex items-end gap-3 flex-wrap">
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Дата</label>
            <input
              type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)}
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none"
            />
          </div>
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Поставщик / источник</label>
            <input
              value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)} autoFocus
              placeholder="Wildberries, ООО Поставщик..."
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-56"
            />
          </div>
          <div>
            <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Заметка (необяз.)</label>
            <input
              value={newNote} onChange={(e) => setNewNote(e.target.value)}
              placeholder="Партия №3, сезонный заказ..."
              className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-48"
            />
          </div>
          <button
            onClick={handleCreate} disabled={saving || !newSupplier.trim()}
            className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2 hover:bg-espresso/90 disabled:opacity-50 transition-colors"
          >
            Создать
          </button>
          <button
            onClick={() => setCreating(false)}
            className="font-heading text-xs uppercase tracking-wide text-espresso/40 hover:text-espresso transition-colors"
          >
            Отмена
          </button>
        </div>
      )}

      {rows.length === 0 ? (
        <div className="bg-white border border-cream/40 p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">Закупок пока нет</p>
          <button
            onClick={() => setCreating(true)}
            className="inline-block mt-4 font-heading text-xs uppercase tracking-wide text-crimson hover:text-espresso transition-colors"
          >
            Добавить первую →
          </button>
        </div>
      ) : (
        <div className="bg-white border border-cream/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Дата</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Поставщик</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden md:table-cell">Заметка</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden sm:table-cell">Позиций</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Итого</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {rows.map((row) => (
                <tr
                  key={row.docId}
                  className="hover:bg-[#F5F3F0] transition-colors group cursor-pointer"
                  onClick={() => window.location.href = `/admin/purchases/${row.docId}`}
                >
                  <td className="px-4 py-3.5 font-body text-sm text-espresso/70 whitespace-nowrap">{fmtDate(row.date)}</td>
                  <td className="px-4 py-3.5 font-heading font-bold text-sm text-espresso">{row.supplier}</td>
                  <td className="px-4 py-3.5 font-body text-sm text-espresso/50 hidden md:table-cell">{row.note || '—'}</td>
                  <td className="px-4 py-3 text-right font-body text-sm text-espresso/60 hidden sm:table-cell">
                    {row.items?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-right font-heading font-bold text-sm text-espresso">
                    {row.grandTotal > 0
                      ? fmt(row.grandTotal)
                      : <span className="text-crimson font-heading text-xs uppercase tracking-wide">+ добавить позиции</span>
                    }
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-heading text-xs uppercase tracking-wide text-espresso/50 group-hover:text-espresso transition-colors">
                        Открыть →
                      </span>
                      <button
                        onClick={() => handleDelete(row.docId)}
                        className="font-heading text-xs tracking-wide uppercase text-espresso/20 hover:text-crimson transition-all opacity-0 group-hover:opacity-100"
                      >
                        ×
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="border-t-2 border-espresso/20 bg-[#F9F9F9] font-heading font-bold">
                <td className="px-4 py-3 text-xs uppercase tracking-wide text-espresso">ИТОГО</td>
                <td />
                <td className="hidden md:table-cell" />
                <td className="hidden sm:table-cell" />
                <td className="px-4 py-3 text-right text-sm text-espresso">{fmt(totalSpent)}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
