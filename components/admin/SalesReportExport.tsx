'use client';

import { useMemo, useState } from 'react';

const STATUS_RU: Record<string, string> = {
  pending: 'Ожидает', paid: 'Оплачен', failed: 'Ошибка',
  cancelled: 'Отменён', refunded: 'Возврат',
};
const DELIVERY_RU: Record<string, string> = {
  sdek: 'СДЭК', courier: 'Курьер', pickup: 'Самовывоз', yandex_market: 'Я.Маркет',
};
const PAYMENT_RU: Record<string, string> = {
  card: 'Карта онлайн', sbp: 'СБП', cash: 'Наличные',
  card_terminal: 'Карта (терминал)', transfer: 'Перевод',
};

type Row = Record<string, unknown>;

function orderMs(o: Row): number | null {
  const ts = o.createdAt as { seconds?: number } | string | undefined;
  if (ts && typeof ts === 'object' && typeof ts.seconds === 'number') return ts.seconds * 1000;
  if (typeof ts === 'string') {
    const t = Date.parse(ts);
    return Number.isNaN(t) ? null : t;
  }
  return null;
}

function pad(n: number) { return String(n).padStart(2, '0'); }
function isoDay(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

function itemsSummary(o: Row): string {
  const items = (o.items as Row[]) ?? [];
  return items
    .map((it) => {
      const name = (it.productName as string) || ((it.product as Row)?.name as string) || 'Товар';
      const weight = (it.weight as number) || 0;
      const qty = (it.quantity as number) || 0;
      const w = weight ? ` ${weight}г` : '';
      return `${name}${w} ×${qty}`;
    })
    .join('; ');
}

/** Escape one CSV cell for ;-delimited, BOM-prefixed output (Russian Excel). */
function cell(v: unknown): string {
  const s = v == null ? '' : String(v);
  if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function SalesReportExport({ orders }: { orders: Row[] }) {
  const now = new Date();
  const [from, setFrom] = useState(() => isoDay(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [to, setTo]     = useState(() => isoDay(now));
  const [paidOnly, setPaidOnly] = useState(true);

  const fromMs = useMemo(() => (from ? new Date(`${from}T00:00:00`).getTime() : -Infinity), [from]);
  const toMs   = useMemo(() => (to   ? new Date(`${to}T23:59:59.999`).getTime() : Infinity),  [to]);

  const filtered = useMemo(() => {
    return orders
      .filter((o) => !paidOnly || o.status === 'paid')
      .filter((o) => {
        const ms = orderMs(o);
        return ms !== null && ms >= fromMs && ms <= toMs;
      })
      .sort((a, b) => (orderMs(a) ?? 0) - (orderMs(b) ?? 0));
  }, [orders, paidOnly, fromMs, toMs]);

  const total = filtered.reduce((s, o) => s + ((o.grandTotal as number) || 0), 0);

  const fmt = (n: number) =>
    (n || 0).toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 2 }) + ' ₽';

  const handleExport = () => {
    const headers = [
      'Дата', 'Время', '№ заказа', 'Клиент', 'Телефон', 'Email', 'Город',
      'Статус', 'Оплата', 'Доставка', 'Позиций', 'Товары', 'Доставка (₽)', 'Сумма (₽)',
    ];

    const lines = filtered.map((o) => {
      const ms = orderMs(o);
      const d = ms !== null ? new Date(ms) : null;
      const c = (o.customer as Row) ?? {};
      const items = (o.items as Row[]) ?? [];
      const positions = items.reduce((s, it) => s + ((it.quantity as number) || 0), 0);
      return [
        d ? isoDay(d) : '',
        d ? `${pad(d.getHours())}:${pad(d.getMinutes())}` : '',
        (o.orderId as string) || (o.docId as string) || '',
        [c.lastName, c.firstName].filter(Boolean).join(' '),
        (c.phone as string) || '',
        (c.email as string) || '',
        (c.city as string) || '',
        STATUS_RU[o.status as string] ?? (o.status as string) ?? '',
        PAYMENT_RU[o.paymentMethod as string] ?? (o.paymentMethod as string) ?? '',
        DELIVERY_RU[o.deliveryMethod as string] ?? (o.deliveryMethod as string) ?? '',
        positions,
        itemsSummary(o),
        (o.deliveryCost as number) || 0,
        (o.grandTotal as number) || 0,
      ].map(cell).join(';');
    });

    // Totals row
    const totalPositions = filtered.reduce(
      (s, o) => s + ((o.items as Row[]) ?? []).reduce((a, it) => a + ((it.quantity as number) || 0), 0), 0);
    const totalsRow = ['ИТОГО', '', `${filtered.length} заказ(ов)`, '', '', '', '', '', '', '',
      totalPositions, '', '', total].map(cell).join(';');

    const csv = '﻿' + [headers.join(';'), ...lines, totalsRow].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danleon-sales_${from}_${to}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const setRangeDaysBack = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days + 1);
    setFrom(isoDay(start));
    setTo(isoDay(end));
  };
  const setThisMonth = () => {
    const n = new Date();
    setFrom(isoDay(new Date(n.getFullYear(), n.getMonth(), 1)));
    setTo(isoDay(n));
  };

  return (
    <div className="bg-white border border-cream/40 p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-espresso">
          Экспорт отчёта о продажах
        </h2>
      </div>

      <div className="flex items-end gap-3 flex-wrap mb-4">
        <div>
          <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">С даты</label>
          <input
            type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)}
            className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none"
          />
        </div>
        <div>
          <label className="block font-heading text-xs uppercase tracking-wide text-espresso/50 mb-1">По дату</label>
          <input
            type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)}
            className="border border-espresso/20 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none"
          />
        </div>

        <div className="flex gap-2">
          {[
            { label: '7 дней',  fn: () => setRangeDaysBack(7)  },
            { label: '30 дней', fn: () => setRangeDaysBack(30) },
            { label: 'Месяц',   fn: setThisMonth               },
          ].map(({ label, fn }) => (
            <button
              key={label} onClick={fn} type="button"
              className="font-heading text-xs uppercase tracking-wide text-espresso/50 hover:text-espresso border border-espresso/15 hover:border-espresso/40 px-2.5 py-1.5 transition-colors"
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox" checked={paidOnly} onChange={(e) => setPaidOnly(e.target.checked)}
              className="accent-espresso"
            />
            <span className="font-body text-sm text-espresso/70">Только оплаченные</span>
          </label>
          <p className="font-body text-sm text-espresso/50">
            {filtered.length} заказ(ов) · <span className="font-heading font-bold text-espresso">{fmt(total)}</span>
          </p>
        </div>

        <button
          onClick={handleExport} disabled={filtered.length === 0} type="button"
          className="bg-espresso text-cream font-heading font-bold text-xs uppercase tracking-wide px-4 py-2.5 hover:bg-espresso/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ↓ Скачать CSV
        </button>
      </div>
    </div>
  );
}
