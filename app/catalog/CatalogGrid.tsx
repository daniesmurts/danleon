'use client';

import type { Product } from '@/lib/types';
import ProductCard from '@/components/ui/ProductCard';
import AnimatedReveal from '@/components/ui/AnimatedReveal';

const BLEND_SPECS = [
  { label: 'Класс',         value: 'Specialty · SCA 80+'        },
  { label: 'Состав',        value: '50% арабика / 50% робуста'  },
  { label: 'Происхождение', value: 'Уганда · Рувензори'         },
  { label: 'Высота',        value: '1 800+ м'                   },
  { label: 'Обработка',     value: 'Мытая'                      },
  { label: 'Обжарка',       value: 'Средняя'                    },
];

export default function CatalogGrid({ products }: { products: Product[] }) {
  return (
    <>
      {/* ═══ Blend Specs Strip ═══ */}
      <section className="bg-espresso text-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-wrap gap-x-10 gap-y-5">
            {BLEND_SPECS.map(({ label, value }, i) => (
              <div key={i} className={i < BLEND_SPECS.length - 1 ? 'border-r border-cream/20 pr-10' : ''}>
                <p className="font-heading text-[9px] uppercase tracking-widest text-cream/40 mb-1">{label}</p>
                <p className="font-heading font-bold text-sm tracking-widest text-cream">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Product Grid ═══ */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <AnimatedReveal>
            <div className="mb-10">
              <span className="font-heading text-[10px] uppercase tracking-widest text-crimson block mb-1">Выберите объём</span>
              <h2 className="font-heading text-2xl font-black text-espresso uppercase tracking-widest">ОДИН КУПАЖ — ТРИ ФОРМАТА</h2>
              <p className="font-body text-xs text-espresso/50 mt-2 leading-relaxed max-w-lg">
                Лично отобранные зёрна specialty-класса, обжаренные малыми партиями. Выберите формат, который удобен вам.
              </p>
            </div>
          </AnimatedReveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {products.map((product, index) => (
              <AnimatedReveal key={product.id} delay={index * 120}>
                <ProductCard product={product} index={index} />
              </AnimatedReveal>
            ))}
          </div>

          {/* ═══ Coming Soon: Lavender Sugar ═══ */}
          <AnimatedReveal delay={products.length * 120 + 100}>
            <div className="mt-16 border border-dashed border-espresso/20 p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-8">
              {/* Icon */}
              <div className="flex-shrink-0 w-16 h-16 bg-[#F5F0F8] flex items-center justify-center">
                <svg className="w-8 h-8 text-espresso/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
                </svg>
              </div>

              {/* Text */}
              <div className="flex-1">
                <span className="inline-block font-heading text-[9px] uppercase tracking-widest bg-espresso text-cream px-2 py-0.5 mb-2">
                  СКОРО
                </span>
                <h3 className="font-heading font-black text-lg text-espresso uppercase tracking-widest mb-1">
                  Лавандовый сахар
                </h3>
                <p className="font-body text-xs text-espresso/55 leading-relaxed max-w-md">
                  Натуральный тростниковый сахар с цветами лаванды — следующее дополнение к линейке ДАНЛЕОН.
                  Подпишитесь на рассылку, чтобы узнать первыми о запуске.
                </p>
              </div>

              {/* CTA pill */}
              <div className="flex-shrink-0">
                <span className="block font-heading text-[10px] uppercase tracking-widest text-espresso/30 border border-espresso/20 px-6 py-3 cursor-default select-none">
                  В разработке
                </span>
              </div>
            </div>
          </AnimatedReveal>
        </div>
      </section>
    </>
  );
}
