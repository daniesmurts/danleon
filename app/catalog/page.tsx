'use client';

import { useState, useMemo } from 'react';
import { products } from '@/lib/products';
import type { Product } from '@/lib/types';
import ProductCard from '@/components/ui/ProductCard';
import AnimatedReveal from '@/components/ui/AnimatedReveal';
import Breadcrumb from '@/components/ui/Breadcrumb';

/* ─── Filter & Sort Types ─── */
type RoastFilter = 'все' | Product['roast'];
type SortOption = 'default' | 'price-asc' | 'price-desc';

const ROAST_OPTIONS: { label: string; value: RoastFilter }[] = [
  { label: 'Все', value: 'все' },
  { label: 'Светлая', value: 'светлая' },
  { label: 'Средняя', value: 'средняя' },
  { label: 'Тёмная', value: 'тёмная' },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: 'По умолчанию', value: 'default' },
  { label: 'Сначала дешевле', value: 'price-asc' },
  { label: 'Сначала дороже', value: 'price-desc' },
];

export default function CatalogPage() {
  const [roastFilter, setRoastFilter] = useState<RoastFilter>('все');
  const [sortOption, setSortOption] = useState<SortOption>('default');

  const filteredAndSorted = useMemo(() => {
    let result = [...products];

    // Filter by roast
    if (roastFilter !== 'все') {
      result = result.filter((p) => p.roast === roastFilter);
    }

    // Sort by price
    if (sortOption === 'price-asc') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortOption === 'price-desc') {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [roastFilter, sortOption]);

  const productCount = filteredAndSorted.length;

  return (
    <>
      {/* ═══ Hero Banner ═══ */}
      <section
        className="relative gradient-cream overflow-hidden"
        id="catalog-hero"
      >
        {/* Decorative elements */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cream-dark/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-crimson/5 rounded-full blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16">
          <Breadcrumb
            items={[
              { label: 'Главная', href: '/' },
              { label: 'Каталог' },
            ]}
          />

          <AnimatedReveal>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.15em] text-espresso uppercase">
              Каталог
            </h1>
            <p className="mt-4 text-base md:text-lg text-espresso/60 font-body max-w-xl leading-relaxed">
              Откройте для себя коллекцию премиального угандийского кофе —
              от&nbsp;светлой до&nbsp;тёмной обжарки
            </p>
          </AnimatedReveal>
        </div>
      </section>

      {/* ═══ Filters & Sort ═══ */}
      <section
        className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-cream/30 shadow-sm"
        id="catalog-filters"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Roast Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-heading text-[11px] tracking-[0.15em] text-espresso/50 uppercase mr-1">
                Обжарка:
              </span>
              {ROAST_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setRoastFilter(option.value)}
                  className={`
                    px-4 py-1.5 rounded-full font-heading text-xs tracking-[0.12em] uppercase
                    transition-all duration-300 cursor-pointer
                    ${
                      roastFilter === option.value
                        ? 'bg-espresso text-cream shadow-md scale-105'
                        : 'bg-cream/30 text-espresso/70 hover:bg-cream/50 hover:text-espresso'
                    }
                  `}
                  aria-pressed={roastFilter === option.value}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <label
                htmlFor="sort-select"
                className="font-heading text-[11px] tracking-[0.15em] text-espresso/50 uppercase"
              >
                Сортировка:
              </label>
              <select
                id="sort-select"
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="
                  appearance-none bg-cream/20 border border-cream/40 rounded-sm
                  px-4 py-1.5 pr-8 font-body text-sm text-espresso
                  focus:outline-none focus:border-crimson focus:ring-1 focus:ring-crimson/30
                  transition-colors cursor-pointer
                  bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22%233D3628%22%3E%3Cpath%20fill-rule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clip-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')]
                  bg-[length:1.25rem] bg-[position:right_0.5rem_center] bg-no-repeat
                "
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Product Grid ═══ */}
      <section className="py-16 bg-white" id="catalog-products">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Product Count */}
          <AnimatedReveal>
            <p className="font-body text-sm text-espresso/50 mb-8">
              Показано{' '}
              <span className="font-heading font-bold text-espresso tracking-wide">
                {productCount}
              </span>{' '}
              {productCount === 1
                ? 'товар'
                : productCount >= 2 && productCount <= 4
                  ? 'товара'
                  : 'товаров'}
            </p>
          </AnimatedReveal>

          {productCount > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {filteredAndSorted.map((product, index) => (
                <AnimatedReveal key={product.id} delay={index * 100}>
                  <ProductCard product={product} index={index} />
                </AnimatedReveal>
              ))}
            </div>
          ) : (
            /* ─── Empty State ─── */
            <AnimatedReveal>
              <div className="flex flex-col items-center justify-center py-24 text-center">
                {/* Coffee bean icon */}
                <div className="w-20 h-20 rounded-full bg-cream/30 flex items-center justify-center mb-6">
                  <svg
                    className="w-10 h-10 text-espresso/30"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803a7.5 7.5 0 0010.607 0z"
                    />
                  </svg>
                </div>
                <h3 className="font-heading text-xl font-bold tracking-[0.12em] text-espresso/60 uppercase mb-3">
                  Ничего не найдено
                </h3>
                <p className="font-body text-sm text-espresso/40 max-w-sm mb-8">
                  По выбранным фильтрам нет подходящих товаров. Попробуйте
                  изменить параметры поиска.
                </p>
                <button
                  onClick={() => {
                    setRoastFilter('все');
                    setSortOption('default');
                  }}
                  className="btn-base px-6 py-2.5 bg-espresso text-cream rounded-sm text-xs hover:bg-espresso-light"
                >
                  Сбросить фильтры
                </button>
              </div>
            </AnimatedReveal>
          )}
        </div>
      </section>
    </>
  );
}
