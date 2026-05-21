import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Ошибка оплаты' };

export default async function OrderFailedPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId = '' } = await searchParams;

  return (
    <main className="min-h-screen pt-28 pb-24 bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-crimson" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        <span className="inline-block font-heading text-xs tracking-[0.3em] text-crimson uppercase mb-3">
          Платёж не прошёл
        </span>
        <h1 className="font-heading text-3xl font-black text-espresso uppercase tracking-widest mb-3">
          Ошибка оплаты
        </h1>
        {orderId && (
          <p className="font-heading text-sm text-espresso/50 tracking-widest uppercase mb-4">
            № {orderId}
          </p>
        )}
        <p className="font-body text-espresso/70 text-sm leading-relaxed mb-10">
          Платёж был отклонён или отменён. Ваш заказ сохранён — вы можете попробовать оплатить снова или выбрать другой способ оплаты.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/checkout"
            className="bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-8 py-4 transition-colors"
          >
            Попробовать снова
          </Link>
          <Link
            href="/catalog"
            className="border border-espresso text-espresso hover:bg-espresso hover:text-cream font-heading font-bold uppercase tracking-widest text-xs px-8 py-4 transition-colors"
          >
            В каталог
          </Link>
        </div>
      </div>
    </main>
  );
}
