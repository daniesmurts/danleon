'use client';

import { Fragment, useEffect, useState } from 'react';
import { adminGetAll } from '@/lib/admin-api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderSnapshot {
  docId: string;
  status: string;
  grandTotal: number;
  createdAt: { seconds: number } | string | undefined;
  customer: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
    city?: string;
  };
  items: { quantity: number; weight: number }[];
}

interface ClientProfile {
  phone: string;
  name: string;
  email: string;
  city: string;
  orders: number;
  totalSpent: number;
  orderDates: Date[];   // sorted asc
  avgIntervalDays: number | null;
  predictedNext: Date | null;
  confidence: 'none' | 'low' | 'medium' | 'high';
  isSubscribed: boolean;
}

type SortKey = 'urgency' | 'name' | 'orders' | 'spent' | 'lastOrder';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tsToDate(ts: { seconds: number } | string | undefined): Date | null {
  if (!ts) return null;
  return typeof ts === 'string' ? new Date(ts) : new Date(ts.seconds * 1000);
}

function fmtDate(d: Date | null) {
  if (!d) return '—';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
}

function fmtPrice(n: number) {
  return (n || 0).toLocaleString('ru-RU') + ' ₽';
}

function daysDiff(a: Date, b: Date) {
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function buildProfile(phone: string, orders: OrderSnapshot[], subscribedEmails: Set<string>): ClientProfile {
  const paid  = orders.filter((o) => o.status === 'paid');
  // Use any order (regardless of status) for contact info — the customer may have
  // only pending/cancelled orders but their name is still known.
  const first = orders[0];

  const dates = paid
    .map((o) => tsToDate(o.createdAt))
    .filter((d): d is Date => d !== null)
    .sort((a, b) => a.getTime() - b.getTime());

  const totalSpent = paid.reduce((s, o) => s + (o.grandTotal || 0), 0);

  // Average interval
  let avgIntervalDays: number | null = null;
  let predictedNext: Date | null = null;
  let confidence: ClientProfile['confidence'] = 'none';

  if (dates.length >= 2) {
    const intervals = dates.slice(1).map((d, i) => daysDiff(dates[i], d));
    avgIntervalDays = Math.round(intervals.reduce((s, n) => s + n, 0) / intervals.length);
    predictedNext = new Date(dates[dates.length - 1].getTime() + avgIntervalDays * 86_400_000);
    confidence = dates.length >= 5 ? 'high' : dates.length >= 3 ? 'medium' : 'low';
  }

  const email = first?.customer?.email || '';

  return {
    phone,
    name: [first?.customer?.firstName, first?.customer?.lastName].filter(Boolean).join(' ') || '—',
    email,
    city:  first?.customer?.city  || '',
    orders: paid.length,
    totalSpent,
    orderDates: dates,
    avgIntervalDays,
    predictedNext,
    confidence,
    isSubscribed: email ? subscribedEmails.has(email.toLowerCase()) : false,
  };
}

// ─── Status ───────────────────────────────────────────────────────────────────

type Status = 'write-now' | 'soon' | 'upcoming' | 'first-order';

function clientStatus(c: ClientProfile): Status {
  if (!c.predictedNext) return 'first-order';
  const days = daysDiff(new Date(), c.predictedNext);
  if (days <= 0)  return 'write-now';
  if (days <= 7)  return 'soon';
  return 'upcoming';
}

const STATUS_LABEL: Record<Status, string> = {
  'write-now':   'Написать сейчас',
  'soon':        'Скоро',
  'upcoming':    'Ожидается',
  'first-order': 'Первый заказ',
};

const STATUS_STYLE: Record<Status, string> = {
  'write-now':   'bg-red-100 text-red-700 border border-red-200',
  'soon':        'bg-yellow-100 text-yellow-700 border border-yellow-200',
  'upcoming':    'bg-green-100 text-green-700 border border-green-200',
  'first-order': 'bg-gray-100 text-gray-500 border border-gray-200',
};

// Numeric urgency for sorting (lower = more urgent)
function urgencyScore(c: ClientProfile): number {
  if (!c.predictedNext) return 9999;
  return daysDiff(new Date(), c.predictedNext); // negative = overdue
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function AdminClientsPage() {
  const [clients, setClients]   = useState<ClientProfile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [sort, setSort]         = useState<SortKey>('urgency');
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      adminGetAll('orders', { orderBy: 'createdAt', dir: 'desc' }),
      fetch('/api/admin/subscriber-emails').then((r) => r.ok ? r.json() : []),
    ])
      .then(([docs, emails]) => {
        const orders = docs as unknown as OrderSnapshot[];
        const subscribedEmails = new Set<string>(
          (emails as string[]).map((e) => e.toLowerCase())
        );

        // Group by phone
        const byPhone = new Map<string, OrderSnapshot[]>();
        orders.forEach((o) => {
          const phone = o.customer?.phone?.replace(/\s+/g, '') || '__unknown__';
          byPhone.set(phone, [...(byPhone.get(phone) || []), o]);
        });

        const profiles = Array.from(byPhone.entries())
          .filter(([phone]) => phone !== '__unknown__')
          .map(([phone, orders]) => buildProfile(phone, orders, subscribedEmails));

        setClients(profiles);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) ||
           c.phone.includes(q) ||
           c.email.toLowerCase().includes(q) ||
           c.city.toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sort === 'urgency') return urgencyScore(a) - urgencyScore(b);
    if (sort === 'name')    return a.name.localeCompare(b.name, 'ru');
    if (sort === 'orders')  return b.orders - a.orders;
    if (sort === 'spent')   return b.totalSpent - a.totalSpent;
    if (sort === 'lastOrder') {
      const la = a.orderDates[a.orderDates.length - 1]?.getTime() ?? 0;
      const lb = b.orderDates[b.orderDates.length - 1]?.getTime() ?? 0;
      return lb - la;
    }
    return 0;
  });

  // Summary counts
  const writeNow   = clients.filter((c) => clientStatus(c) === 'write-now').length;
  const soon       = clients.filter((c) => clientStatus(c) === 'soon').length;
  const repeat     = clients.filter((c) => c.orders >= 2).length;
  const subscribed = clients.filter((c) => c.isSubscribed).length;

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSort(k)}
      className={`font-heading text-xs tracking-wide uppercase transition-colors ${
        sort === k ? 'text-espresso' : 'text-espresso/40 hover:text-espresso/70'
      }`}
    >
      {label}{sort === k ? ' ↓' : ''}
    </button>
  );

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="w-5 h-5 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
    </div>
  );

  return (
    <div>
      <h1 className="font-heading text-2xl font-black tracking-wide text-espresso uppercase mb-6">Клиенты</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { label: 'Всего клиентов',    value: clients.length,  sub: ''                          },
          { label: 'Подписчики',        value: subscribed,      sub: 'активная подписка', green: true },
          { label: 'Повторных',         value: repeat,          sub: '2+ заказа'                 },
          { label: 'Написать сейчас',   value: writeNow,        sub: 'просрочено',      red: true },
          { label: 'Скоро (7 дней)',    value: soon,            sub: 'предстоит',     amber: true },
        ].map(({ label, value, sub, red, amber, green }) => (
          <div key={label} className="bg-white border border-cream/40 p-5">
            <p className="font-heading text-xs uppercase tracking-wide text-espresso/50 mb-2">{label}</p>
            <p className={`font-heading font-black text-2xl ${red && value > 0 ? 'text-crimson' : amber && value > 0 ? 'text-yellow-600' : green && value > 0 ? 'text-green-600' : 'text-espresso'}`}>
              {value}
            </p>
            {sub && <p className="font-body text-xs text-espresso/40 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Search + sort bar */}
      <div className="bg-white border border-cream/40 px-4 py-3 mb-1 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <input
          value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск по имени, телефону, email, городу…"
          className="border border-espresso/15 px-3 py-1.5 font-body text-sm focus:border-espresso outline-none w-full sm:w-72"
        />
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-heading text-xs uppercase tracking-wide text-espresso/30">Сортировка:</span>
          <SortBtn k="urgency"   label="Срочность" />
          <SortBtn k="lastOrder" label="Посл. заказ" />
          <SortBtn k="orders"    label="Заказов" />
          <SortBtn k="spent"     label="Сумма" />
          <SortBtn k="name"      label="Имя" />
        </div>
      </div>

      {/* Table */}
      {sorted.length === 0 ? (
        <div className="bg-white border border-cream/40 p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">
            {search ? 'Ничего не найдено' : 'Нет данных о клиентах'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-cream/40 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Клиент</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden sm:table-cell">Подписка</th>
                <th className="text-left px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden md:table-cell">Город</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Заказов</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden sm:table-cell">Потрачено</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden lg:table-cell">Посл. заказ</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden lg:table-cell">Цикл (дней)</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase hidden md:table-cell">Следующий</th>
                <th className="text-right px-4 py-3 font-heading text-xs tracking-wide text-espresso/50 uppercase">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {sorted.map((client) => {
                const status   = clientStatus(client);
                const lastDate = client.orderDates[client.orderDates.length - 1] ?? null;
                const isOpen   = expanded === client.phone;
                const daysUntil = client.predictedNext ? daysDiff(new Date(), client.predictedNext) : null;

                return (
                  <Fragment key={client.phone}>
                    <tr
                      onClick={() => setExpanded(isOpen ? null : client.phone)}
                      className="hover:bg-[#FAFAFA] transition-colors cursor-pointer group"
                    >
                      {/* Name + contact */}
                      <td className="px-4 py-3.5">
                        <p className="font-heading font-bold text-espresso text-sm">{client.name}</p>
                        <p className="font-body text-xs text-espresso/50 mt-0.5">{client.phone}</p>
                        {client.email && (
                          <p className="font-body text-xs text-espresso/40">{client.email}</p>
                        )}
                      </td>

                      {/* Subscription badge */}
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {client.isSubscribed ? (
                          <span className="inline-flex items-center gap-1 font-heading text-[10px] font-bold uppercase tracking-wide px-2 py-1 bg-green-50 text-green-700 border border-green-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                            Подписчик
                          </span>
                        ) : (
                          <span className="font-body text-xs text-espresso/25">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3.5 font-body text-sm text-espresso/60 hidden md:table-cell">
                        {client.city || '—'}
                      </td>

                      <td className="px-4 py-3.5 text-right font-heading font-bold text-sm text-espresso">
                        {client.orders}
                      </td>

                      <td className="px-4 py-3.5 text-right font-heading font-bold text-sm text-espresso hidden sm:table-cell">
                        {fmtPrice(client.totalSpent)}
                      </td>

                      <td className="px-4 py-3.5 text-right font-body text-sm text-espresso/60 hidden lg:table-cell">
                        {fmtDate(lastDate)}
                      </td>

                      {/* Avg cycle */}
                      <td className="px-4 py-3.5 text-right hidden lg:table-cell">
                        {client.avgIntervalDays !== null ? (
                          <span className="font-heading font-bold text-sm text-espresso">
                            {client.avgIntervalDays}{' '}
                            <span className={`text-xs font-normal ${
                              client.confidence === 'high'   ? 'text-green-600' :
                              client.confidence === 'medium' ? 'text-yellow-600' :
                              'text-espresso/30'
                            }`}>
                              {client.confidence === 'high' ? '●●●' : client.confidence === 'medium' ? '●●○' : '●○○'}
                            </span>
                          </span>
                        ) : (
                          <span className="text-espresso/25 text-xs">—</span>
                        )}
                      </td>

                      {/* Predicted next order */}
                      <td className="px-4 py-3.5 text-right hidden md:table-cell">
                        {client.predictedNext ? (
                          <div>
                            <p className={`font-heading font-bold text-sm ${daysUntil !== null && daysUntil <= 0 ? 'text-crimson' : 'text-espresso'}`}>
                              {fmtDate(client.predictedNext)}
                            </p>
                            {daysUntil !== null && (
                              <p className="font-body text-xs text-espresso/40 mt-0.5">
                                {daysUntil <= 0 ? `${Math.abs(daysUntil)} дн. назад` : `через ${daysUntil} дн.`}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-espresso/25 text-xs">—</span>
                        )}
                      </td>

                      {/* Status badge */}
                      <td className="px-4 py-3.5 text-right">
                        <span className={`inline-block font-heading text-[10px] font-bold uppercase tracking-wide px-2 py-1 ${STATUS_STYLE[status]}`}>
                          {STATUS_LABEL[status]}
                        </span>
                      </td>
                    </tr>

                    {/* Expanded: order history timeline */}
                    {isOpen && (
                      <tr className="bg-[#F9F9F9]">
                        <td colSpan={9} className="px-6 py-4">
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-heading text-xs font-bold uppercase tracking-widest text-espresso/60">
                              История заказов — {client.name}
                            </p>
                            {client.email && (
                              <a href={`mailto:${client.email}`}
                                className="font-heading text-xs uppercase tracking-wide text-crimson hover:text-espresso transition-colors">
                                Написать → {client.email}
                              </a>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-3">
                            {client.orderDates.map((d, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-espresso/40 shrink-0" />
                                <span className="font-body text-xs text-espresso/70">{fmtDate(d)}</span>
                                {i < client.orderDates.length - 1 && (
                                  <span className="font-heading text-[10px] text-espresso/30 ml-1">
                                    +{daysDiff(d, client.orderDates[i + 1])}д →
                                  </span>
                                )}
                              </div>
                            ))}
                            {client.predictedNext && (
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full border-2 shrink-0 ${
                                  clientStatus(client) === 'write-now' ? 'border-crimson' :
                                  clientStatus(client) === 'soon'      ? 'border-yellow-500' :
                                  'border-green-500'
                                }`} />
                                <span className={`font-body text-xs font-bold ${
                                  clientStatus(client) === 'write-now' ? 'text-crimson' :
                                  clientStatus(client) === 'soon'      ? 'text-yellow-600' :
                                  'text-green-600'
                                }`}>
                                  {fmtDate(client.predictedNext)} (прогноз)
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="font-body text-xs text-espresso/30 mt-4">
        Прогноз основан на среднем интервале между заказами. Достоверность: ●○○ — 2 заказа, ●●○ — 3–4, ●●● — 5+
      </p>
    </div>
  );
}
