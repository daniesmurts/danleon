import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatus } from '@/lib/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  failed: 'Ошибка оплаты',
  cancelled: 'Отменён',
  refunded: 'Возврат',
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  paid: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
  refunded: 'bg-blue-100 text-blue-800',
};

function formatPrice(n: number) {
  return n.toLocaleString('ru-RU') + ' ₽';
}

function formatDate(ts: { seconds: number } | string | undefined) {
  if (!ts) return '—';
  const date = typeof ts === 'string' ? new Date(ts) : new Date(ts.seconds * 1000);
  return date.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
}

const DELIVERY_LABEL: Record<string, string> = {
  sdek: 'СДЭК',
  courier: 'Курьер',
  pickup: 'Самовывоз',
};

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const snap = await getDoc(doc(db, 'orders', id));
  if (!snap.exists()) notFound();

  const order = snap.data() as any;
  const status = order.status as OrderStatus;

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="font-heading text-[10px] tracking-widest uppercase text-espresso/40 hover:text-espresso transition-colors">
          ← Все заказы
        </Link>
        <span className="text-espresso/20">/</span>
        <span className="font-heading text-[10px] tracking-widest uppercase text-espresso">{order.orderId}</span>
      </div>

      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="font-heading text-2xl font-black tracking-widest text-espresso uppercase">{order.orderId}</h1>
          <p className="font-body text-sm text-espresso/50 mt-1">{formatDate(order.createdAt)}</p>
        </div>
        <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-heading font-bold uppercase tracking-wide ${STATUS_COLOR[status] ?? 'bg-gray-100'}`}>
          {STATUS_LABEL[status] ?? status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Customer */}
        <div className="bg-white border border-cream/40 rounded-sm p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Клиент</h2>
          <dl className="space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-espresso/50">Имя</dt>
              <dd className="text-espresso">{order.customer?.firstName} {order.customer?.lastName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-espresso/50">Телефон</dt>
              <dd className="text-espresso">{order.customer?.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-espresso/50">Email</dt>
              <dd className="text-espresso">{order.customer?.email}</dd>
            </div>
          </dl>
        </div>

        {/* Delivery */}
        <div className="bg-white border border-cream/40 rounded-sm p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Доставка</h2>
          <dl className="space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-espresso/50">Способ</dt>
              <dd className="text-espresso">{DELIVERY_LABEL[order.deliveryMethod] ?? order.deliveryMethod}</dd>
            </div>
            {order.customer?.city && (
              <div className="flex justify-between">
                <dt className="text-espresso/50">Город</dt>
                <dd className="text-espresso">{order.customer.city}</dd>
              </div>
            )}
            {order.customer?.street && (
              <div className="flex justify-between">
                <dt className="text-espresso/50">Адрес</dt>
                <dd className="text-espresso text-right">
                  {order.customer.street}, {order.customer.house}
                  {order.customer.apartment ? `, кв. ${order.customer.apartment}` : ''}
                </dd>
              </div>
            )}
            {order.customer?.postalCode && (
              <div className="flex justify-between">
                <dt className="text-espresso/50">Индекс</dt>
                <dd className="text-espresso">{order.customer.postalCode}</dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white border border-cream/40 rounded-sm p-6 mb-6">
        <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Позиции заказа</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream/30">
              <th className="text-left pb-2 font-heading text-[10px] tracking-widest text-espresso/40 uppercase">Товар</th>
              <th className="text-center pb-2 font-heading text-[10px] tracking-widest text-espresso/40 uppercase">Помол</th>
              <th className="text-center pb-2 font-heading text-[10px] tracking-widest text-espresso/40 uppercase">Кол-во</th>
              <th className="text-right pb-2 font-heading text-[10px] tracking-widest text-espresso/40 uppercase">Сумма</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream/20">
            {order.items?.map((item: any, i: number) => (
              <tr key={i}>
                <td className="py-3 font-body text-espresso">{item.productName}</td>
                <td className="py-3 text-center font-body text-espresso/60 text-xs">{item.grind}</td>
                <td className="py-3 text-center font-body text-espresso">{item.quantity} × {item.weight}г</td>
                <td className="py-3 text-right font-heading font-bold text-espresso">{formatPrice(item.price * item.quantity)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals + TBank */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-cream/40 rounded-sm p-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">Итого</h2>
          <dl className="space-y-2 font-body text-sm">
            <div className="flex justify-between">
              <dt className="text-espresso/50">Товары</dt>
              <dd className="text-espresso">{formatPrice(order.totalPrice)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-espresso/50">Доставка</dt>
              <dd className="text-espresso">{order.deliveryCost === 0 ? 'Бесплатно' : formatPrice(order.deliveryCost)}</dd>
            </div>
            <div className="flex justify-between pt-2 border-t border-cream/30">
              <dt className="font-heading font-bold text-espresso uppercase tracking-wide text-xs">Итого</dt>
              <dd className="font-heading font-black text-crimson text-lg">{formatPrice(order.grandTotal)}</dd>
            </div>
          </dl>
        </div>

        {order.tbank && (
          <div className="bg-white border border-cream/40 rounded-sm p-6">
            <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-4">TBank</h2>
            <dl className="space-y-2 font-body text-sm">
              <div className="flex justify-between">
                <dt className="text-espresso/50">Payment ID</dt>
                <dd className="text-espresso font-mono text-xs">{order.tbank.paymentId}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-espresso/50">Статус</dt>
                <dd className="text-espresso">{order.tbank.status}</dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {order.comment && (
        <div className="bg-white border border-cream/40 rounded-sm p-6 mt-6">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso mb-2">Комментарий</h2>
          <p className="font-body text-sm text-espresso/70">{order.comment}</p>
        </div>
      )}
    </div>
  );
}
