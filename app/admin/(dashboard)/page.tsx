import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
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
  return date.toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default async function AdminOrdersPage() {
  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  const orders = snapshot.docs.map((d) => ({ docId: d.id, ...d.data() } as any));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-heading text-xl font-black tracking-widest text-espresso uppercase">Заказы</h1>
        <span className="font-body text-sm text-espresso/50">{orders.length} заказов</span>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white border border-cream/40 rounded-sm p-12 text-center">
          <p className="font-heading text-sm tracking-widest text-espresso/40 uppercase">Заказов пока нет</p>
        </div>
      ) : (
        <div className="bg-white border border-cream/40 rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cream/40 bg-[#F9F9F9]">
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Заказ</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Клиент</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Дата</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Сумма</th>
                <th className="text-left px-4 py-3 font-heading text-[10px] tracking-widest text-espresso/50 uppercase">Статус</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream/30">
              {orders.map((order: any) => (
                <tr key={order.docId} className="hover:bg-[#FAFAFA] transition-colors">
                  <td className="px-4 py-3 font-heading font-bold text-espresso text-xs tracking-wide">
                    {order.orderId}
                  </td>
                  <td className="px-4 py-3 font-body text-espresso/70 text-xs">
                    {order.customer?.firstName} {order.customer?.lastName}
                    <br />
                    <span className="text-espresso/40">{order.customer?.phone}</span>
                  </td>
                  <td className="px-4 py-3 font-body text-espresso/60 text-xs">
                    {formatDate(order.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-heading font-bold text-espresso text-xs">
                    {formatPrice(order.grandTotal)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-[10px] font-heading font-bold uppercase tracking-wide ${STATUS_COLOR[order.status as OrderStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {STATUS_LABEL[order.status as OrderStatus] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/orders/${order.docId}`}
                      className="font-heading text-[10px] tracking-widest uppercase text-crimson hover:text-espresso transition-colors"
                    >
                      Открыть →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
