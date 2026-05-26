'use client';

import { useState, useEffect } from 'react';
import type { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { fetchInventoryStatus, isPackSizeInStock, type InventoryStatusMap } from '@/lib/inventory-status-client';

const WEIGHT_OPTIONS = [
  { value: '250',  label: '250Г', multiplier: 1,   priceField: null,         subPriceField: null                    },
  { value: '500',  label: '500Г', multiplier: 1.9, priceField: 'price500'  as const, subPriceField: 'subscriptionPrice500'  as const },
  { value: '1000', label: '1КГ',  multiplier: 3.5, priceField: 'price1000' as const, subPriceField: 'subscriptionPrice1000' as const },
];

export default function ProductInteractive({ product }: { product: Product }) {
  const { addItem, setCartOpen } = useCart();
  const { isSubscribed } = useAuth();
  const isCoffee = !product.category || product.category === 'coffee';
  const hasVariants = !isCoffee && product.variants && product.variants.length > 0;

  const [weight, setWeight] = useState('250');
  const [variantIdx, setVariantIdx] = useState(0);
  const [isAdded, setIsAdded] = useState(false);
  const [inventoryStatus, setInventoryStatus] = useState<InventoryStatusMap>({});

  useEffect(() => {
    fetchInventoryStatus().then(setInventoryStatus).catch(() => {});
  }, []);

  const selectedWeight = WEIGHT_OPTIONS.find((w) => w.value === weight)!;
  const selectedVariant = hasVariants ? product.variants![variantIdx] : null;

  // Stock helpers
  const weightInStock = (grams: number) => isPackSizeInStock(inventoryStatus, grams);
  const selectedWeightInStock = isCoffee
    ? weightInStock(parseInt(weight))
    : selectedVariant
      ? weightInStock(selectedVariant.grams)
      : true;

  // Price resolution:
  // 1. Non-coffee with variants → use variant price
  // 2. Coffee → use per-weight price field or multiplier fallback
  // 3. Non-coffee flat → use base price
  const currentPrice = selectedVariant
    ? selectedVariant.price
    : isCoffee
      ? selectedWeight.priceField && product[selectedWeight.priceField]
        ? (product[selectedWeight.priceField] as number)
        : Math.round(product.price * selectedWeight.multiplier)
      : product.price;

  const subPrice = selectedVariant
    ? (selectedVariant.subscriptionPrice ?? null)
    : product.subscriptionPrice
      ? isCoffee
        ? selectedWeight.subPriceField && product[selectedWeight.subPriceField]
          ? (product[selectedWeight.subPriceField] as number)
          : Math.round(product.subscriptionPrice * selectedWeight.multiplier)
        : product.subscriptionPrice
      : null;

  // If the user is a subscriber and a subscription price exists, use it
  const activePrice = (isSubscribed && subPrice) ? subPrice : currentPrice;

  const handleAddToCart = () => {
    const cartWeight = selectedVariant ? selectedVariant.grams : parseInt(weight);
    addItem(product, 1, 'зерно', cartWeight, activePrice);
    setIsAdded(true);
    setCartOpen(true);
    setTimeout(() => setIsAdded(false), 2000);
  };

  return (
    <div className="lg:col-span-5 flex flex-col">
      {/* Price */}
      <div className="mb-6 border-b border-espresso/10 pb-6">
        {isSubscribed && subPrice ? (
          /* Subscriber view: subscription price is the main price */
          <div>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-heading font-black text-crimson">
                {subPrice.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-sm font-heading text-espresso/40 line-through mb-1.5">
                {currentPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>
            <div className="inline-flex items-center gap-2 bg-crimson/8 border border-crimson/20 px-3 py-2">
              <svg className="w-3.5 h-3.5 text-crimson shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="font-heading text-xs font-bold text-crimson uppercase tracking-widest">
                Цена по подписке · −{Math.round((1 - subPrice / currentPrice) * 100)}%
              </span>
            </div>
          </div>
        ) : (
          /* Non-subscriber view: regular price + savings badge */
          <div>
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
        )}
      </div>

      {/* Flavor tags — coffee only */}
      {product.flavor && product.flavor.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8 border-b border-espresso/10 pb-6">
          {product.flavor.map((f, i) => (
            <span key={i} className="border border-espresso/20 px-4 py-2 text-[10px] font-heading font-bold text-espresso uppercase tracking-widest">
              {f}
            </span>
          ))}
        </div>
      )}

      {/* Description */}
      <p className="text-sm font-body text-espresso/70 leading-relaxed mb-8">
        {product.description}
      </p>

      {/* Weight selector — coffee only */}
      {isCoffee && (
        <div className="mb-10">
          <span className="block text-xs font-heading tracking-wide text-espresso/50 uppercase mb-3">ВЕС (НЕТТО)</span>
          <div className="flex flex-wrap gap-2">
            {WEIGHT_OPTIONS.map((opt) => {
              const inStock = weightInStock(parseInt(opt.value));
              const isSelected = weight === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setWeight(opt.value)}
                  className={`relative px-4 py-3 text-xs font-heading font-bold uppercase tracking-wide border transition-colors ${
                    isSelected
                      ? inStock
                        ? 'border-espresso bg-espresso text-white'
                        : 'border-espresso/40 bg-espresso/10 text-espresso'
                      : inStock
                        ? 'border-espresso/20 text-espresso hover:border-espresso'
                        : 'border-espresso/10 text-espresso/30 hover:border-espresso/30'
                  }`}
                >
                  {opt.label}
                  {!inStock && (
                    <span className="absolute -top-1.5 -right-1.5 bg-espresso/30 text-white text-[7px] font-heading font-bold uppercase tracking-wide px-1 py-px leading-tight">
                      нет
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Variant selector — non-coffee products with multiple sizes */}
      {hasVariants && product.variants!.length > 1 && (
        <div className="mb-10">
          <span className="block text-xs font-heading tracking-wide text-espresso/50 uppercase mb-3">ОБЪЁМ</span>
          <div className="flex flex-wrap gap-2">
            {product.variants!.map((v, i) => {
              const inStock = weightInStock(v.grams);
              const isSelected = variantIdx === i;
              return (
                <button
                  key={i}
                  onClick={() => setVariantIdx(i)}
                  className={`relative px-4 py-3 text-xs font-heading font-bold uppercase tracking-wide border transition-colors ${
                    isSelected
                      ? inStock
                        ? 'border-espresso bg-espresso text-white'
                        : 'border-espresso/40 bg-espresso/10 text-espresso'
                      : inStock
                        ? 'border-espresso/20 text-espresso hover:border-espresso'
                        : 'border-espresso/10 text-espresso/30 hover:border-espresso/30'
                  }`}
                >
                  {v.label}
                  {!inStock && (
                    <span className="absolute -top-1.5 -right-1.5 bg-espresso/30 text-white text-[7px] font-heading font-bold uppercase tracking-wide px-1 py-px leading-tight">
                      нет
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Actions */}

      {/* Pre-order notice */}
      {!selectedWeightInStock && (
        <div className="mb-4 border border-espresso/20 bg-[#F9F9F9] px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-espresso/50 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="font-body text-xs text-espresso/60 leading-relaxed">
            Этот формат временно отсутствует. Оформите предзаказ — мы свяжемся с вами, как только появится в наличии.
          </p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={handleAddToCart}
          className={`flex-1 px-8 py-4 font-heading font-bold tracking-widest uppercase text-xs transition-all ${
            isAdded
              ? 'bg-green-700 text-white border border-green-700'
              : selectedWeightInStock
                ? 'bg-espresso text-white hover:bg-espresso/90'
                : 'border-2 border-espresso text-espresso hover:bg-espresso hover:text-white'
          }`}
        >
          {isAdded ? 'ДОБАВЛЕНО' : selectedWeightInStock ? 'В КОРЗИНУ' : 'ПРЕДЗАКАЗ'}
        </button>
        <button className="flex-1 px-8 py-4 font-heading font-bold tracking-widest uppercase text-xs border border-espresso text-espresso hover:bg-[#F9F9F9] transition-colors">
          ПОДПИСАТЬСЯ
        </button>
      </div>
    </div>
  );
}
