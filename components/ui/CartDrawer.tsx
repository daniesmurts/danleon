'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import QuantitySelector from './QuantitySelector';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function CartDrawer({ open, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" id="cart-drawer">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-espresso/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl animate-slide-in-right flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream/30">
          <h2 className="font-heading text-lg font-bold tracking-[0.15em] text-espresso uppercase">
            Корзина
            {totalItems > 0 && (
              <span className="ml-2 text-sm text-crimson">({totalItems})</span>
            )}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-espresso/50 hover:text-espresso transition-colors"
            aria-label="Закрыть корзину"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor" className="w-20 h-20 text-cream mb-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
              <p className="font-heading text-sm tracking-[0.15em] text-espresso/50 uppercase mb-2">
                Корзина пуста
              </p>
              <p className="text-sm text-espresso/40 font-body">
                Добавьте что-нибудь из нашего каталога
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={`${item.product.id}-${item.grind}`}
                  className="flex gap-4 p-3 rounded-md bg-cream/10 border border-cream/20"
                >
                  <div className="relative w-16 h-16 rounded-sm overflow-hidden flex-shrink-0 bg-cream/20">
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading text-xs font-bold tracking-[0.1em] text-espresso uppercase truncate">
                      {item.product.name}
                    </h3>
                    <p className="text-[11px] text-espresso/50 font-body mt-0.5">
                      Зерно · {item.weight}г
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <QuantitySelector
                        quantity={item.quantity}
                        onChange={(q) => updateQuantity(item.product.id, item.grind, item.weight, q)}
                      />
                      <span className="font-heading font-bold text-sm text-crimson">
                        {(item.unitPrice * item.quantity).toLocaleString('ru-RU')} ₽
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => removeItem(item.product.id, item.grind, item.weight)}
                    className="self-start p-1 text-espresso/30 hover:text-crimson transition-colors"
                    aria-label={`Удалить ${item.product.name}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-cream/30 px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-heading text-sm tracking-[0.1em] text-espresso/60 uppercase">
                Итого
              </span>
              <span className="font-heading text-xl font-bold text-espresso">
                {totalPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <Link
              href="/checkout"
              onClick={onClose}
              className="btn-base w-full bg-crimson text-white hover:bg-crimson-dark shadow-lg py-3 text-sm rounded-sm"
            >
              ОФОРМИТЬ ЗАКАЗ
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
