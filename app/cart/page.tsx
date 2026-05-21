'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import SectionHeading from '@/components/ui/SectionHeading';
import QuantitySelector from '@/components/ui/QuantitySelector';
import Breadcrumb from '@/components/ui/Breadcrumb';
import AnimatedReveal from '@/components/ui/AnimatedReveal';

const FREE_SHIPPING_THRESHOLD = 3000;

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU');
}

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  const shippingCost = totalPrice >= FREE_SHIPPING_THRESHOLD ? 0 : 290;
  const orderTotal = totalPrice + shippingCost;
  const amountUntilFreeShipping = FREE_SHIPPING_THRESHOLD - totalPrice;

  if (items.length === 0) {
    return (
      <main className="pt-28 pb-20 min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Breadcrumb
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Корзина' },
            ]}
          />

          <div className="flex flex-col items-center justify-center py-24 text-center">
            <AnimatedReveal>
              {/* Shopping bag icon */}
              <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-cream/30 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 text-espresso/25"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>

              <h1 className="text-3xl md:text-4xl font-heading font-extrabold tracking-[0.15em] uppercase text-espresso mb-4">
                Корзина пуста
              </h1>
              <p className="text-espresso/60 font-body text-lg mb-10 max-w-md mx-auto leading-[1.7]">
                Добавьте товары из каталога, чтобы оформить заказ
              </p>

              <Link
                href="/catalog"
                className="btn-base rounded-sm font-heading bg-crimson text-white hover:bg-crimson-dark shadow-lg hover:shadow-xl px-8 py-4 text-base tracking-[0.15em] uppercase inline-block transition-all duration-300"
              >
                ПЕРЕЙТИ В КАТАЛОГ
              </Link>
            </AnimatedReveal>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-28 pb-20 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Breadcrumb
          items={[
            { label: 'Главная', href: '/' },
            { label: 'Корзина' },
          ]}
        />

        <SectionHeading subtitle={`${totalItems} ${getItemWord(totalItems)} в корзине`}>
          КОРЗИНА
        </SectionHeading>

        {/* Free shipping progress bar */}
        {amountUntilFreeShipping > 0 && (
          <AnimatedReveal>
            <div className="max-w-2xl mx-auto mb-12 p-4 rounded-sm bg-cream/20 border border-cream">
              <p className="text-sm font-body text-espresso/70 text-center mb-2">
                До бесплатной доставки осталось{' '}
                <span className="font-bold text-crimson">{formatPrice(amountUntilFreeShipping)} ₽</span>
              </p>
              <div className="w-full h-1.5 bg-cream/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-crimson rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                />
              </div>
            </div>
          </AnimatedReveal>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
          {/* Left column: Cart items */}
          <div className="lg:col-span-2">
            <div className="divide-y divide-cream">
              {items.map((item, index) => (
                <AnimatedReveal key={`${item.product.id}-${item.grind}`} delay={index * 80}>
                  <div className="py-6 first:pt-0 last:pb-0">
                    <div className="flex gap-4 sm:gap-6">
                      {/* Product image */}
                      <Link
                        href={`/product/${item.product.id}`}
                        className="shrink-0 group"
                      >
                        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-sm overflow-hidden bg-cream/20 border border-cream/50">
                          <Image
                            src={item.product.image}
                            alt={item.product.name}
                            fill
                            sizes="(max-width: 640px) 80px, 96px"
                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      </Link>

                      {/* Product details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/product/${item.product.id}`}
                              className="hover:text-crimson transition-colors"
                            >
                              <h3 className="font-heading font-bold text-sm sm:text-base uppercase tracking-[0.1em] text-espresso leading-tight">
                                {item.product.name}
                              </h3>
                            </Link>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs sm:text-sm font-body text-espresso/50">
                              <span>{item.grind}</span>
                              <span className="text-espresso/20">•</span>
                              <span>{item.product.weight} г</span>
                            </div>
                          </div>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeItem(item.product.id, item.grind)}
                            className="shrink-0 p-1.5 rounded-sm text-espresso/30 hover:text-crimson hover:bg-crimson/5 transition-all duration-200"
                            aria-label={`Удалить ${item.product.name}`}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-5 h-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>

                        {/* Quantity & price row */}
                        <div className="mt-4 flex items-center justify-between gap-4">
                          <QuantitySelector
                            quantity={item.quantity}
                            onChange={(qty) =>
                              updateQuantity(item.product.id, item.grind, qty)
                            }
                          />

                          <p className="text-base sm:text-lg font-heading font-bold text-crimson whitespace-nowrap">
                            {formatPrice(item.product.price * item.quantity)} ₽
                          </p>
                        </div>

                        {/* Unit price if qty > 1 */}
                        {item.quantity > 1 && (
                          <p className="mt-1 text-xs font-body text-espresso/40 text-right">
                            {formatPrice(item.product.price)} ₽ за шт.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </AnimatedReveal>
              ))}
            </div>
          </div>

          {/* Right column: Order summary */}
          <div className="lg:col-span-1">
            <AnimatedReveal delay={200}>
              <div className="sticky top-32 bg-cream/10 border border-cream rounded-sm p-6 sm:p-8">
                <h2 className="font-heading font-extrabold text-lg uppercase tracking-[0.15em] text-espresso mb-6">
                  Ваш заказ
                </h2>

                <div className="space-y-4 font-body text-sm">
                  {/* Subtotal */}
                  <div className="flex items-center justify-between text-espresso/70">
                    <span>Подытог ({totalItems} {getItemWord(totalItems)})</span>
                    <span className="font-medium text-espresso">{formatPrice(totalPrice)} ₽</span>
                  </div>

                  {/* Shipping */}
                  <div className="flex items-center justify-between text-espresso/70">
                    <span>Доставка</span>
                    <span className={`font-medium ${shippingCost === 0 ? 'text-green-700' : 'text-espresso'}`}>
                      {shippingCost === 0 ? 'Бесплатно' : `от ${formatPrice(shippingCost)} ₽`}
                    </span>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-cream" />

                  {/* Total */}
                  <div className="flex items-center justify-between pt-2">
                    <span className="font-heading font-bold text-base uppercase tracking-[0.1em] text-espresso">
                      Итого
                    </span>
                    <span className="font-heading font-extrabold text-xl sm:text-2xl text-crimson">
                      {formatPrice(orderTotal)} ₽
                    </span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="mt-8 space-y-3">
                  <Link
                    href="/checkout"
                    className="btn-base rounded-sm font-heading bg-crimson text-white hover:bg-crimson-dark shadow-lg hover:shadow-xl px-6 py-4 text-sm tracking-[0.15em] uppercase w-full block text-center transition-all duration-300"
                  >
                    ОФОРМИТЬ ЗАКАЗ
                  </Link>

                  <Link
                    href="/catalog"
                    className="btn-base rounded-sm font-heading bg-espresso text-cream hover:bg-espresso-light shadow-lg hover:shadow-xl px-6 py-3 text-xs tracking-[0.15em] uppercase w-full block text-center transition-all duration-300"
                  >
                    ПРОДОЛЖИТЬ ПОКУПКИ
                  </Link>
                </div>

                {/* Trust badge */}
                <div className="mt-6 pt-5 border-t border-cream">
                  <div className="flex items-center gap-2 text-xs text-espresso/40 font-body">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                    <span>Безопасная оплата · SSL-шифрование</span>
                  </div>
                </div>
              </div>
            </AnimatedReveal>
          </div>
        </div>
      </div>
    </main>
  );
}

/**
 * Returns the correct Russian plural form for "товар"
 * 1 товар, 2-4 товара, 5-20 товаров, 21 товар, etc.
 */
function getItemWord(count: number): string {
  const abs = Math.abs(count);
  const lastTwo = abs % 100;
  const lastOne = abs % 10;

  if (lastTwo >= 11 && lastTwo <= 19) return 'товаров';
  if (lastOne === 1) return 'товар';
  if (lastOne >= 2 && lastOne <= 4) return 'товара';
  return 'товаров';
}
