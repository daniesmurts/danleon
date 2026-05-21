import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Заказ оформлен' };

export default async function OrderSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId = '' } = await searchParams;

  return (
    <main className="min-h-screen pt-28 pb-24 bg-white flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-8">
          <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <span className="inline-block font-heading text-xs tracking-[0.3em] text-crimson uppercase mb-3">
          Оплата прошла успешно
        </span>
        <h1 className="font-heading text-3xl font-black text-espresso uppercase tracking-widest mb-3">
          Заказ принят!
        </h1>
        {orderId && (
          <p className="font-heading text-sm text-espresso/50 tracking-widest uppercase mb-4">
            № {orderId}
          </p>
        )}
        <p className="font-body text-espresso/70 text-sm leading-relaxed mb-10">
          Мы получили ваш заказ и уже начали его обработку. Подтверждение и детали доставки придут на ваш email.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/catalog"
            className="bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-8 py-4 transition-colors"
          >
            Продолжить покупки
          </Link>
          <Link
            href="/"
            className="border border-espresso text-espresso hover:bg-espresso hover:text-cream font-heading font-bold uppercase tracking-widest text-xs px-8 py-4 transition-colors"
          >
            На главную
          </Link>
        </div>
      </div>
    </main>
  );
}
