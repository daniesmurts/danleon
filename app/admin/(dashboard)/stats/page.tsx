'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BatchItem, InventoryItem } from '@/lib/types';
import Link from 'next/link';

function fmt(n: number) {
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
}

function effectiveCostActual(item: BatchItem): number {
  return item.qtyActual > 0 && item.priceActual > 0
    ? Math.round(item.qtyActual * item.priceActual * 100) / 100
    : item.costActual || 0;
}

interface MonthStat { key: string; label: string; revenue: number; orders: number; }
interface ProductStat { name: string; revenue: number; qty: number; }

const STATUS_RU: Record<string, string> = {
  pending: 'Ожидает', paid: 'Оплачен', failed: 'Ошибка',
  cancelled: 'Отменён', refunded: 'Возврат',
};

export default function AdminStatsPage() {
  const [orders, setOrders]       = useState<Record<string, unknown>[]>([]);
  const [batches, setBatches]     = useState<Record<string, unknown>[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'orders'),    orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'batches'),   orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'inventory')),
    ]).then(([o, b, inv]) => {
      setOrders(o.docs.map((d) => ({ docId: d.id, ...d.data() })));
      setBatches(b.docs.map((d) => ({ docId: d.id, ...d.data() })));
      setInventory(inv.docs.map((d) => ({ docId: d.id, price: 0, ...d.data() } as InventoryItem)));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  /* ── orders ── */
  const paidOrders   = orders.filter((o) => o.status === 'paid');
  const totalRevenue = paidOrders.reduce((s, o) => s + ((o.grandTotal as number) || 0), 0);
  const avgOrder     = paidOrders.length ? totalRevenue / paidOrders.length : 0;

  /* ── revenue by month ── */
  const monthMap = new Map<string, MonthStat>();
  paidOrders.forEach((o) => {
    const ts = o.createdAt as { seconds: number } | undefined;
    if (!ts?.seconds) return;
    const date  = new Date(ts.seconds * 1000);
    const key   = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleString('ru-RU', { month: 'long', year: 'numeric' });
    const prev  = monthMap.get(key) ?? { key, label, revenue: 0, orders: 0 };
    monthMap.set(key, { ...prev, revenue: prev.revenue + ((o.grandTotal as number) || 0), orders: prev.orders + 1 });
  });
  const months = Array.from(monthMap.values()).sort((a, b) => b.key.localeCompare(a.key));

  /* ── revenue by product ── */
  const productMap = new Map<string, ProductStat>();
  paidOrders.forEach((o) => {
    ((o.items as Record<string, unknown>[]) ?? []).forEach((item) => {
      const name      = (item.productName as string) || 'Неизвестно';
      const qty       = (item.quantity as number) || 0;
      const unitPrice = (item.unitPrice as number) || (item.price as number) || 0;
      const prev      = productMap.get(name) ?? { name, revenue: 0, qty: 0 };
      productMap.set(name, { name, revenue: prev.revenue + unitPrice * qty, qty: prev.qty + qty });
    });
  });
  const products = Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue);

  /* ── status counts ── */
  const statusCounts: Record<string, number> = {};
  orders.forEach((o) => {
    const s = (o.status as string) || 'unknown';
    statusCounts[s] = (statusCounts[s] || 0) + 1;
  });

  /* ── P&L ── */
  const latestBatch   = batches[0];
  const batchItems    = (latestBatch?.items as BatchItem[]) ?? [];
  const batchCost     = batchItems.reduce((s, i) => s + effectiveCostActual(i), 0);
  const inventoryValue = inventory.reduce((s, i) => s + i.stock * (i.price || 0), 0);
  const totalPotential = totalRevenue + inventoryValue;   // sold + still on shelf
  const profitActual   = totalRevenue  - batchCost;
  const profitFull     = totalPotential - batchCost;      // if all inventory sells
  const marginActual   = batchCost > 0 ? (profitActual  / batchCost) * 100 : 0;
  const marginFull     = batchCost > 0 ? (profitFull    / batchCost) * 100 : 0;

  // Progress: how much of the batch cost has been recovered via sales
  const recoveredPct = batchCost > 0 ? Math.min(100, (totalRevenue / batchCost) * 100) : 0;
  const inventoryPct = batchCost > 0 ? Math.min(100 - recoveredPct, (inventoryValue / batchCost) * 100) : 0;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="font-heading text-xl font-black tracking-widest text-espresso uppercase mb-6">Статистика</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Выручка (факт)',      value: fmt(totalRevenue)              },
          { label: 'Оплаченных заказов',  value: String(paidOrders.length)      },
          { label: 'Средний чек',         value: fmt(avgOrder)                  },
          { label: 'Всего заказов',       value: String(orders.length)          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-cream/40 p-5">
            <p className="font-heading text-xs uppercase tracking-widest text-espresso/50 mb-2">{label}</p>
            <p className="font-heading font-black text-2xl text-espresso">{value}</p>
          </div>
        ))}
      </div>

      {/* P&L card */}
      {!!latestBatch && (
        <div className="bg-white border border-cream/40 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-espresso">
              P&amp;L — {latestBatch.name as string}
            </h2>
            <Link href={`/admin/batches/${latestBatch.docId as string}`}
              className="font-heading text-xs tracking-widest uppercase text-espresso/50 hover:text-espresso transition-colors">
              Открыть партию →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-5">
            <div>
              <p className="font-heading text-xs uppercase tracking-widest text-espresso/50 mb-1.5">Себестоимость</p>
              <p className="font-heading font-black text-xl text-espresso">{fmt(batchCost)}</p>
            </div>
            <div>
              <p className="font-heading text-xs uppercase tracking-widest text-espresso/50 mb-1.5">Продано</p>
              <p className="font-heading font-black text-xl text-espresso">{fmt(totalRevenue)}</p>
            </div>
            <div>
              <p className="font-heading text-xs uppercase tracking-widest text-espresso/50 mb-1.5">На складе</p>
              <p className="font-heading font-black text-xl text-espresso">{fmt(inventoryValue)}</p>
              {inventory.length === 0 && (
                <Link href="/admin/inventory" className="font-heading text-[10px] uppercase tracking-widest text-espresso/30 hover:text-espresso transition-colors">
                  + Заполнить остатки
                </Link>
              )}
            </div>
            <div>
              <p className="font-heading text-xs uppercase tracking-widest text-espresso/50 mb-1.5">Итого выручка</p>
              <p className="font-heading font-black text-xl text-espresso">{fmt(totalPotential)}</p>
              <p className="font-body text-xs text-espresso/40 mt-0.5">продано + склад</p>
            </div>
            <div>
              <p className="font-heading text-xs uppercase tracking-widest text-espresso/50 mb-1.5">Прибыль факт</p>
              <p className={`font-heading font-black text-xl ${profitActual >= 0 ? 'text-green-600' : 'text-crimson'}`}>
                {fmt(profitActual)}
              </p>
              <p className={`font-heading text-xs mt-0.5 ${marginActual >= 0 ? 'text-green-600/70' : 'text-crimson/70'}`}>
                {marginActual.toFixed(1)}% от себест.
              </p>
            </div>
            <div>
              <p className="font-heading text-xs uppercase tracking-widest text-espresso/50 mb-1.5">Прибыль полная</p>
              <p className={`font-heading font-black text-xl ${profitFull >= 0 ? 'text-green-600' : 'text-crimson'}`}>
                {fmt(profitFull)}
              </p>
              <p className={`font-heading text-xs mt-0.5 ${marginFull >= 0 ? 'text-green-600/70' : 'text-crimson/70'}`}>
                {marginFull.toFixed(1)}% от себест.
              </p>
            </div>
          </div>

          {/* Recovery progress bar */}
          {batchCost > 0 && (
            <div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 mb-1">
                <p className="font-heading text-xs uppercase tracking-widest text-espresso/50">
                  Возврат себестоимости — {(recoveredPct + inventoryPct).toFixed(1)}%
                </p>
                <p className="font-body text-xs text-espresso/40">
                  {fmt(totalRevenue)} продано · {fmt(inventoryValue)} склад · {fmt(batchCost)} вложено
                </p>
              </div>
              <div className="h-2.5 bg-cream/60 rounded-full overflow-hidden flex">
                <div className="h-full bg-green-500 transition-all" style={{ width: `${recoveredPct}%` }} />
                <div className="h-full bg-green-200 transition-all" style={{ width: `${inventoryPct}%` }} />
              </div>
              <div className="flex gap-4 mt-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-body text-xs text-espresso/50">Продано</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-200 border border-green-300" />
                  <span className="font-body text-xs text-espresso/50">На складе</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cream/60 border border-espresso/20" />
                  <span className="font-body text-xs text-espresso/50">Не возвращено</span>
                </div>
              </div>
            </div>
          )}

          {batchCost === 0 && (
            <p className="font-body text-sm text-espresso/40 italic">
              Внесите фактические затраты в партии, чтобы увидеть P&amp;L.
            </p>
          )}
        </div>
      )}

      {!latestBatch && (
        <div className="bg-white border border-cream/40 p-6 mb-6 text-center">
          <p className="font-body text-sm text-espresso/50">Нет данных о партиях для расчёта P&amp;L.</p>
          <Link href="/admin/batches" className="inline-block mt-2 font-heading text-xs uppercase tracking-widest text-crimson hover:text-espresso transition-colors">
            Создать первую партию →
          </Link>
        </div>
      )}

      {/* Sales by item — bar chart */}
      <div className="bg-white border border-cream/40 p-6 mb-6">
        <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-6">Продажи по товарам</h2>
        {products.length === 0 ? (
          <p className="font-body text-sm text-espresso/50">Оплаченных заказов пока нет</p>
        ) : (() => {
          const maxRevenue = products[0].revenue;
          const totalProductRevenue = products.reduce((s, p) => s + p.revenue, 0);
          return (
            <div className="space-y-3">
              {products.map((p, idx) => {
                const pct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
                const share = totalProductRevenue > 0 ? (p.revenue / totalProductRevenue) * 100 : 0;
                const hue = idx === 0 ? 'bg-espresso' : idx === 1 ? 'bg-espresso/70' : idx === 2 ? 'bg-espresso/50' : 'bg-espresso/30';
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-body text-sm text-espresso">{p.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="font-body text-xs text-espresso/50">{p.qty} шт.</span>
                        <span className="font-heading font-bold text-sm text-espresso w-28 text-right">{fmt(p.revenue)}</span>
                        <span className="font-heading text-xs text-espresso/40 w-10 text-right">{share.toFixed(0)}%</span>
                      </div>
                    </div>
                    <div className="h-2 bg-cream/60 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${hue}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="pt-3 border-t border-cream/30 flex justify-between">
                <span className="font-heading text-xs uppercase tracking-widest text-espresso/50">Итого</span>
                <span className="font-heading font-bold text-sm text-espresso">{fmt(totalProductRevenue)}</span>
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Revenue by month */}
        <div className="bg-white border border-cream/40 p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Выручка по месяцам</h2>
          {months.length === 0 ? (
            <p className="font-body text-sm text-espresso/50">Оплаченных заказов пока нет</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-cream/30">
                  <th className="text-left pb-2.5 font-heading text-xs tracking-widest text-espresso/50 uppercase">Месяц</th>
                  <th className="text-right pb-2.5 font-heading text-xs tracking-widest text-espresso/50 uppercase">Заказов</th>
                  <th className="text-right pb-2.5 font-heading text-xs tracking-widest text-espresso/50 uppercase">Выручка</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream/20">
                {months.map((m) => (
                  <tr key={m.key}>
                    <td className="py-2.5 font-body text-sm text-espresso capitalize">{m.label}</td>
                    <td className="py-2.5 text-right font-body text-sm text-espresso/60">{m.orders}</td>
                    <td className="py-2.5 text-right font-heading font-bold text-sm text-espresso">{fmt(m.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Orders by status */}
        <div className="bg-white border border-cream/40 p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Заказы по статусам</h2>
          {(() => {
            const total = orders.length;
            return (
              <div className="space-y-3">
                {Object.entries(statusCounts).map(([status, count]) => {
                  const pct = total > 0 ? (count / total) * 100 : 0;
                  const color = status === 'paid' ? 'bg-green-500' : status === 'pending' ? 'bg-yellow-400' : status === 'cancelled' ? 'bg-gray-300' : status === 'failed' ? 'bg-red-400' : 'bg-blue-300';
                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-body text-sm text-espresso">{STATUS_RU[status] ?? status}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-heading font-bold text-sm text-espresso">{count}</span>
                          <span className="font-heading text-xs text-espresso/40 w-10 text-right">{pct.toFixed(0)}%</span>
                        </div>
                      </div>
                      <div className="h-2 bg-cream/60 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      </div>

    </div>
  );
}
