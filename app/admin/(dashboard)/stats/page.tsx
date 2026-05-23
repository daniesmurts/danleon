'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { BatchItem, InventoryItem, Purchase } from '@/lib/types';
import Link from 'next/link';

function fmt(n: number) {
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';
}

function fmtKg(n: number) {
  return (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' кг';
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
  const [orders, setOrders]         = useState<Record<string, unknown>[]>([]);
  const [batches, setBatches]       = useState<Record<string, unknown>[]>([]);
  const [inventory, setInventory]   = useState<InventoryItem[]>([]);
  const [purchases, setPurchases]   = useState<Purchase[]>([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      getDocs(query(collection(db, 'orders'),  orderBy('createdAt', 'desc'))),
      getDocs(query(collection(db, 'batches'), orderBy('createdAt', 'desc'))),
      getDocs(collection(db, 'inventory')),
      getDocs(collection(db, 'purchases')).catch(() => null),  // graceful — collection may not exist yet
    ]).then(([o, b, inv, pur]) => {
      setOrders(o.docs.map((d) => ({ docId: d.id, ...d.data() })));
      setBatches(b.docs.map((d) => ({ docId: d.id, ...d.data() })));
      setInventory(inv.docs.map((d) => ({ docId: d.id, price: 0, ...d.data() } as InventoryItem)));
      if (pur) setPurchases(pur.docs.map((d) => ({ docId: d.id, grandTotal: 0, items: [], ...d.data() } as unknown as Purchase)));
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
  const latestBatch    = batches[0];
  const batchItems     = (latestBatch?.items as BatchItem[]) ?? [];
  const batchCost      = batchItems.reduce((s, i) => s + effectiveCostActual(i), 0);
  const purchasesTotal = purchases.reduce((s, p) => s + (p.grandTotal || 0), 0);
  const totalCosts     = batchCost + purchasesTotal;
  const inventoryValue = inventory.reduce((s, i) => s + i.stock * (i.price || 0), 0);
  const totalPotential = totalRevenue + inventoryValue;   // sold + still on shelf
  const profitActual   = totalRevenue  - totalCosts;
  const profitFull     = totalPotential - totalCosts;     // if all inventory sells
  const marginActual   = totalCosts > 0 ? (profitActual  / totalCosts) * 100 : 0;
  const marginFull     = totalCosts > 0 ? (profitFull    / totalCosts) * 100 : 0;

  // Progress: how much of total costs has been recovered via sales
  const recoveredPct = totalCosts > 0 ? Math.min(100, (totalRevenue / totalCosts) * 100) : 0;
  const inventoryPct = totalCosts > 0 ? Math.min(100 - recoveredPct, (inventoryValue / totalCosts) * 100) : 0;

  /* ── kg velocity ── */
  const MS_PER_DAY = 86_400_000;
  const nowMs = Date.now();

  function orderKg(o: Record<string, unknown>): number {
    return ((o.items as Record<string, unknown>[]) ?? []).reduce((s, item) => {
      const w = (item.weight as number) || 0;
      const q = (item.quantity as number) || 0;
      return s + (w * q) / 1000;
    }, 0);
  }

  function orderPacks(o: Record<string, unknown>): number {
    return ((o.items as Record<string, unknown>[]) ?? []).reduce((s, item) => {
      return s + ((item.quantity as number) || 0);
    }, 0);
  }

  function kgInWindow(days: number): number {
    const cutoff = nowMs - days * MS_PER_DAY;
    return paidOrders
      .filter((o) => {
        const ts = (o.createdAt as { seconds: number } | undefined);
        return ts?.seconds && ts.seconds * 1000 >= cutoff;
      })
      .reduce((s, o) => s + orderKg(o), 0);
  }

  function packsInWindow(days: number): number {
    const cutoff = nowMs - days * MS_PER_DAY;
    return paidOrders
      .filter((o) => {
        const ts = (o.createdAt as { seconds: number } | undefined);
        return ts?.seconds && ts.seconds * 1000 >= cutoff;
      })
      .reduce((s, o) => s + orderPacks(o), 0);
  }

  const kgLast7    = kgInWindow(7);
  const kgLast30   = kgInWindow(30);
  const packsLast7  = packsInWindow(7);
  const packsLast30 = packsInWindow(30);

  // Daily rate: use 30-day rolling average (stable); fall back to all-time if fewer than 30 days of data
  const oldestTs = paidOrders.reduce((min, o) => {
    const ts = (o.createdAt as { seconds: number } | undefined)?.seconds;
    return ts ? Math.min(min, ts * 1000) : min;
  }, nowMs);
  const daysSinceFirst = Math.max(1, (nowMs - oldestTs) / MS_PER_DAY);
  const windowDays = Math.min(daysSinceFirst, 30);
  const currentDailyKg    = kgLast30    / Math.max(windowDays, 30);
  const currentDailyPacks = packsLast30 / Math.max(windowDays, 30);

  // Stock in kg from inventory (unit: кг, or г/гр converted)
  const stockKg = inventory.reduce((s, item) => {
    const u = (item.unit || '').toLowerCase().trim();
    if (u === 'кг' || u === 'кг.') return s + (item.stock || 0);
    if (u === 'г' || u === 'гр' || u === 'г.') return s + (item.stock || 0) / 1000;
    return s;
  }, 0);

  // 6-month target pace
  const TARGET_DAYS = 182;
  const requiredDailyKg  = stockKg > 0 ? stockKg / TARGET_DAYS : 0;
  const requiredWeeklyKg = requiredDailyKg * 7;
  const requiredMonthlyKg = requiredDailyKg * 30;

  // Projected sell-out date at current rate
  const daysToSellOut = currentDailyKg > 0 && stockKg > 0 ? stockKg / currentDailyKg : null;
  const sellOutDate   = daysToSellOut !== null
    ? new Date(nowMs + daysToSellOut * MS_PER_DAY)
    : null;

  // Pace status vs 6-month target
  const paceRatio = requiredDailyKg > 0 ? currentDailyKg / requiredDailyKg : null;

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-black tracking-wide text-espresso uppercase mb-6">Статистика</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Выручка (факт)',      value: fmt(totalRevenue)              },
          { label: 'Оплаченных заказов',  value: String(paidOrders.length)      },
          { label: 'Средний чек',         value: fmt(avgOrder)                  },
          { label: 'Всего заказов',       value: String(orders.length)          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white border border-cream/40 p-5">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-2">{label}</p>
            <p className="font-heading font-black text-2xl text-espresso">{value}</p>
          </div>
        ))}
      </div>

      {/* P&L card */}
      <div className="bg-white border border-cream/40 p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-espresso">
            P&amp;L — сводная
          </h2>
          <div className="flex gap-4">
            {!!latestBatch && (
              <Link href={`/admin/batches/${latestBatch.docId as string}`}
                className="font-heading text-xs tracking-wide uppercase text-espresso/50 hover:text-espresso transition-colors">
                Партия →
              </Link>
            )}
            <Link href="/admin/purchases"
              className="font-heading text-xs tracking-wide uppercase text-espresso/50 hover:text-espresso transition-colors">
              Закупки →
            </Link>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 p-4 bg-[#F9F9F9] border border-cream/40">
          <div>
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Партии (кофе)</p>
            <p className="font-heading font-bold text-base text-espresso">{fmt(batchCost)}</p>
          </div>
          <div>
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Закупки (товары)</p>
            <p className="font-heading font-bold text-base text-espresso">{fmt(purchasesTotal)}</p>
            {purchases.length === 0 && (
              <Link href="/admin/purchases" className="font-heading text-xs uppercase tracking-wide text-espresso/30 hover:text-espresso transition-colors">
                + Добавить
              </Link>
            )}
          </div>
          <div>
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Итого затраты</p>
            <p className="font-heading font-black text-base text-espresso">{fmt(totalCosts)}</p>
          </div>
          <div>
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/40 mb-1">Выручка (факт)</p>
            <p className="font-heading font-black text-base text-espresso">{fmt(totalRevenue)}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 mb-5">
          <div>
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1.5">На складе</p>
            <p className="font-heading font-black text-xl text-espresso">{fmt(inventoryValue)}</p>
            {inventory.length === 0 && (
              <Link href="/admin/inventory" className="font-heading text-xs uppercase tracking-wide text-espresso/30 hover:text-espresso transition-colors">
                + Заполнить остатки
              </Link>
            )}
          </div>
          <div>
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1.5">Итого выручка</p>
            <p className="font-heading font-black text-xl text-espresso">{fmt(totalPotential)}</p>
            <p className="font-body text-xs text-espresso/40 mt-0.5">продано + склад</p>
          </div>
          <div>
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1.5">Прибыль факт</p>
            <p className={`font-heading font-black text-xl ${profitActual >= 0 ? 'text-green-600' : 'text-crimson'}`}>
              {fmt(profitActual)}
            </p>
            <p className={`font-heading text-xs mt-0.5 ${marginActual >= 0 ? 'text-green-600/70' : 'text-crimson/70'}`}>
              {marginActual.toFixed(1)}% от затрат
            </p>
          </div>
          <div>
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1.5">Прибыль полная</p>
            <p className={`font-heading font-black text-xl ${profitFull >= 0 ? 'text-green-600' : 'text-crimson'}`}>
              {fmt(profitFull)}
            </p>
            <p className={`font-heading text-xs mt-0.5 ${marginFull >= 0 ? 'text-green-600/70' : 'text-crimson/70'}`}>
              {marginFull.toFixed(1)}% от затрат
            </p>
          </div>
        </div>

        {/* Recovery progress bar */}
        {totalCosts > 0 && (
          <div>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-baseline gap-0.5 mb-1">
              <p className="font-heading text-xs uppercase tracking-wide text-espresso/50">
                Возврат затрат — {(recoveredPct + inventoryPct).toFixed(1)}%
              </p>
              <p className="font-body text-xs text-espresso/40">
                {fmt(totalRevenue)} продано · {fmt(inventoryValue)} склад · {fmt(totalCosts)} вложено
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

        {totalCosts === 0 && (
          <p className="font-body text-sm text-espresso/40 italic">
            Внесите затраты в партии или закупки, чтобы увидеть P&amp;L.
          </p>
        )}
      </div>

      {/* ── Kg velocity & stock depletion ── */}
      <div className="bg-white border border-cream/40 p-6 mb-6">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-espresso mb-5">Динамика продаж (кг)</h2>

        {/* Velocity cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'В день (avg)', kg: currentDailyKg,  packs: currentDailyPacks, sub: 'скользящие 30 дней', packsLabel: 'уп/день' },
            { label: 'За 7 дней',   kg: kgLast7,          packs: packsLast7,        sub: 'последняя неделя',  packsLabel: 'упаковок' },
            { label: 'За 30 дней',  kg: kgLast30,         packs: packsLast30,       sub: 'последний месяц',   packsLabel: 'упаковок' },
          ].map(({ label, kg, packs, sub, packsLabel }) => (
            <div key={label} className="bg-[#F9F9F9] border border-cream/40 p-4">
              <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-2">{label}</p>
              <div className="flex items-end gap-3 mb-1">
                <p className="font-heading font-black text-2xl text-espresso leading-none">{fmtKg(kg)}</p>
                <p className="font-heading font-bold text-base text-espresso/40 leading-none mb-0.5">
                  {Math.round(packs * 10) / 10} <span className="text-xs font-normal">{packsLabel}</span>
                </p>
              </div>
              <p className="font-body text-xs text-espresso/40">{sub}</p>
            </div>
          ))}
        </div>

        {/* Stock depletion */}
        <div className="border-t border-cream/30 pt-5">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso/70">
              Распродажа запасов
            </h3>
            {stockKg > 0 && (
              <span className="font-heading text-xs text-espresso/40 uppercase tracking-wide">
                Остаток: <span className="text-espresso font-bold">{fmtKg(stockKg)}</span>
              </span>
            )}
          </div>

          {stockKg === 0 ? (
            <p className="font-body text-sm text-espresso/40 italic">
              Нет данных о запасах — добавьте товары с единицей «кг» или «г» в{' '}
              <a href="/admin/inventory" className="underline hover:text-espresso">Остатки</a>.
            </p>
          ) : (
            <>
              {/* Required pace for 6-month sell-out */}
              <div className="grid grid-cols-3 gap-4 mb-5">
                {[
                  { label: 'Нужно / день',   value: fmtKg(requiredDailyKg)   },
                  { label: 'Нужно / неделю', value: fmtKg(requiredWeeklyKg)  },
                  { label: 'Нужно / месяц',  value: fmtKg(requiredMonthlyKg) },
                ].map(({ label, value }) => (
                  <div key={label} className="border border-espresso/10 p-3">
                    <p className="font-heading text-[10px] uppercase tracking-wide text-espresso/40 mb-1">{label}</p>
                    <p className="font-heading font-bold text-base text-espresso">{value}</p>
                    <p className="font-body text-[10px] text-espresso/30 mt-0.5">цель — 6 месяцев</p>
                  </div>
                ))}
              </div>

              {/* Projected sell-out date + pace status */}
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <div className="flex-1 bg-[#F9F9F9] border border-cream/40 p-4">
                  <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Прогноз распродажи</p>
                  {sellOutDate ? (
                    <>
                      <p className="font-heading font-black text-xl text-espresso">
                        {sellOutDate.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                      <p className="font-body text-xs text-espresso/40 mt-0.5">
                        через ~{Math.round(daysToSellOut!)} дней при текущем темпе
                      </p>
                    </>
                  ) : (
                    <p className="font-body text-sm text-espresso/40 italic mt-1">
                      Нет продаж — рассчитать невозможно
                    </p>
                  )}
                </div>

                {paceRatio !== null && (
                  <div className={`flex-1 p-4 border ${
                    paceRatio >= 1
                      ? 'bg-green-50 border-green-200'
                      : paceRatio >= 0.7
                        ? 'bg-yellow-50 border-yellow-200'
                        : 'bg-red-50 border-red-200'
                  }`}>
                    <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">Темп vs цель 6 мес.</p>
                    <p className={`font-heading font-black text-xl ${
                      paceRatio >= 1 ? 'text-green-700' : paceRatio >= 0.7 ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {(paceRatio * 100).toFixed(0)}%
                    </p>
                    <p className={`font-body text-xs mt-0.5 ${
                      paceRatio >= 1 ? 'text-green-600/70' : paceRatio >= 0.7 ? 'text-yellow-600/70' : 'text-red-600/70'
                    }`}>
                      {paceRatio >= 1 ? 'В графике ✓' : paceRatio >= 0.7 ? 'Немного отстаём' : 'Сильно отстаём'}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

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
                <span className="font-heading text-xs uppercase tracking-wide text-espresso/50">Итого</span>
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
                  <th className="text-left pb-2.5 font-heading text-xs tracking-wide text-espresso/50 uppercase">Месяц</th>
                  <th className="text-right pb-2.5 font-heading text-xs tracking-wide text-espresso/50 uppercase">Заказов</th>
                  <th className="text-right pb-2.5 font-heading text-xs tracking-wide text-espresso/50 uppercase">Выручка</th>
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
