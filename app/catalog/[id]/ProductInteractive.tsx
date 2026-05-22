'use client';

import { useState } from 'react';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

const WEIGHT_OPTIONS = [
  { value: '250', label: '250Г', multiplier: 1 },
  { value: '500', label: '500Г', multiplier: 1.9 },
  { value: '1000', label: '1КГ', multiplier: 3.5 },
];

export default function ProductInteractive({ product }: { product: Product }) {
  const { addItem, setCartOpen } = useCart();
  const [weight, setWeight] = useState('250');
  const [isAdded, setIsAdded] = useState(false);

  const selectedWeight = WEIGHT_OPTIONS.find((w) => w.value === weight)!;
  const currentPrice = Math.round(product.price * selectedWeight.multiplier);
  const subPrice = product.subscriptionPrice
    ? Math.round(product.subscriptionPrice * selectedWeight.multiplier)
    : null;

  const handleAddToCart = () => {
    addItem(product, 1, 'зерно', parseInt(weight), currentPrice);
    setIsAdded(true);
    setCartOpen(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="lg:col-span-5 flex flex-col">
      {/* Price */}
      <div className="mb-6 border-b border-espresso/10 pb-6">
        <div className="flex items-end gap-3 mb-2">
          <span className="text-4xl font-heading font-black text-crimson">
            {currentPrice.toLocaleString('ru-RU')} ₽
          </span>
          {subPrice && (
            <span className="text-sm font-heading text-espresso/40 mb-1.5">без подписки</span>
          )}
        </div>
        {subPrice && (
          <div className="inline-flex items-center gap-2 bg-crimson/8 border border-crimson/20 px-3 py-2">
            <svg className="w-3.5 h-3.5 text-crimson shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="font-heading text-xs font-bold text-crimson uppercase tracking-widest">
              При подписке: {subPrice.toLocaleString('ru-RU')} ₽
            </span>
            <span className="font-heading text-[10px] text-crimson/60 uppercase tracking-wide">
              −{Math.round((1 - subPrice / currentPrice) * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Flavor tags */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-espresso/10 pb-6">
        {(product.flavor ?? []).map((f, i) => (
          <span key={i} className="border border-espresso/20 px-4 py-2 text-[10px] font-heading font-bold text-espresso uppercase tracking-widest">
            {f}
          </span>
        ))}
      </div>

      {/* Description */}
      <p className="text-sm font-body text-espresso/70 leading-relaxed mb-8">
        {product.description}
      </p>

      {/* Weight selector */}
      <div className="flex flex-col gap-6 mb-10">
        <div>
          <span className="block text-[10px] font-heading tracking-widest text-espresso/50 uppercase mb-3">ВЕС (НЕТТО)</span>
          <div className="flex flex-wrap gap-2">
            {WEIGHT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setWeight(opt.value)}
                className={`px-4 py-3 text-[10px] font-heading font-bold uppercase tracking-widest border transition-colors ${
                  weight === opt.value ? 'border-espresso bg-espresso text-white' : 'border-espresso/20 text-espresso hover:border-espresso'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Actions */}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAddToCart}
          className={`flex-1 px-8 py-4 font-heading font-bold tracking-widest uppercase text-xs transition-all ${
            isAdded ? 'bg-green-700 text-white border border-green-700' : 'bg-espresso text-white hover:bg-espresso/90'
          }`}
        >
          {isAdded ? 'ДОБАВЛЕНО' : 'В КОРЗИНУ'}
        </button>
        <button className="flex-1 px-8 py-4 font-heading font-bold tracking-widest uppercase text-xs border border-espresso text-espresso hover:bg-[#F9F9F9] transition-colors">
          ПОДПИСАТЬСЯ
        </button>
      </div>
    </div>
  );
}
