'use client';

import Image from 'next/image';
import Link from 'next/link';
import { products, getFeaturedProducts } from '@/lib/products';
import ProductCard from '@/components/ui/ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimatedReveal from '@/components/ui/AnimatedReveal';

export default function HomePage() {
  const featured = getFeaturedProducts();

  return (
    <div className="bg-white">
      {/* ═══ Hero Section ═══ */}
      <section className="relative min-h-[90vh] flex items-center bg-espresso" id="hero">
        {/* Background Image - Coffee Beans */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/hero.png"
            alt="Кофейные зерна"
            fill
            className="object-cover opacity-60"
            priority
            fetchPriority="high"
            sizes="100vw"
          />
          {/* Gradient Overlay for text readability on left */}
          <div className="absolute inset-0 bg-gradient-to-r from-espresso via-espresso/80 to-transparent" />
        </div>

        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col md:flex-row items-center">
          <div className="w-full md:w-2/3">
            <AnimatedReveal>
              <span className="inline-block bg-crimson text-white text-[10px] font-heading font-bold uppercase tracking-[0.15em] px-3 py-1 mb-6">
                ПРЯМЫЕ ПОСТАВКИ ИЗ УГАНДЫ
              </span>
            </AnimatedReveal>
            <AnimatedReveal delay={200}>
              <h1 className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-[90px] font-black tracking-[0.05em] text-cream uppercase leading-[0.9] mb-8">
                ЧИСТЫЙ<br />
                ВКУС В<br />
                КАЖДОМ<br />
                ЗЕРНЕ
              </h1>
            </AnimatedReveal>
            <AnimatedReveal delay={400}>
              <p className="text-cream/80 font-body text-sm md:text-base max-w-md mb-10 leading-relaxed">
                Откройте для себя аутентичный кофе спешелти класса, выращенный на высокогорьях Уганды. Свежая обжарка и бескомпромиссное качество.
              </p>
            </AnimatedReveal>
            <AnimatedReveal delay={600}>
              <Link href="/catalog" className="inline-block bg-crimson hover:bg-crimson-dark text-white font-heading font-bold text-sm tracking-[0.15em] uppercase px-10 py-4 transition-colors">
                ПОПРОБОВАТЬ
              </Link>
            </AnimatedReveal>
          </div>
          
          {/* Small floating product image as seen in mockup */}
          <div className="hidden md:block w-1/3 relative">
            <AnimatedReveal delay={800} className="relative z-20 translate-y-12 border-4 border-espresso">
              <div className="relative aspect-square w-64 mx-auto bg-cream">
                 <Image
                  src="/images/product-sipi-falls.png"
                  alt="Кофе ДАНЛЕОН"
                  fill
                  className="object-cover"
                />
              </div>
            </AnimatedReveal>
          </div>
        </div>
      </section>

      {/* ═══ Featured Products ═══ */}
      <section className="py-24" id="featured-products">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12 border-b border-espresso pb-4">
            <div>
              <span className="text-[10px] font-heading text-crimson uppercase tracking-widest mb-1 block">НАШ ВЫБОР</span>
              <h2 className="font-heading text-3xl font-black text-espresso uppercase tracking-widest">ХИТЫ ИЗ УГАНДЫ</h2>
            </div>
            <Link href="/catalog" className="hidden sm:inline-block border border-espresso text-espresso hover:bg-espresso hover:text-white px-6 py-2 text-[10px] font-heading font-bold uppercase tracking-widest transition-colors">
              ВСЕ ТОВАРЫ
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featured.slice(0, 3).map((product, index) => (
              <AnimatedReveal key={product.id} delay={index * 150}>
                <ProductCard product={product} index={index} />
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ From Farm To Cup Timeline ═══ */}
      <section className="py-24 bg-[#F9F9F9]" id="timeline">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-heading text-3xl font-black text-espresso uppercase tracking-widest mb-20 border-b border-espresso pb-4 inline-block w-full">
            ОТ ФЕРМЫ ДО ЧАШКИ
          </h2>

          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-espresso/20 -translate-x-1/2 hidden md:block" />

            {/* Step 1 */}
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 relative">
              <div className="md:w-[45%] text-center md:text-right mb-6 md:mb-0">
                <h3 className="font-heading text-lg font-bold text-crimson uppercase tracking-widest mb-2">ВЫРАЩИВАНИЕ</h3>
                <p className="text-xs text-espresso/70 font-body leading-relaxed">
                  Тщательный отбор плантаций на высоте более 1800 метров над уровнем моря в регионе Рувензори.
                </p>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-crimson rounded-full flex items-center justify-center text-white text-[10px] font-bold z-10 hidden md:flex">
                1
              </div>
              <div className="md:w-[45%] flex justify-center md:justify-start">
                <div className="relative w-32 h-32 bg-espresso">
                  <Image src="/images/plantation.png" alt="Выращивание" fill className="object-cover" />
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse items-center justify-between mb-16 relative">
              <div className="md:w-[45%] text-center md:text-left mb-6 md:mb-0">
                <h3 className="font-heading text-lg font-bold text-crimson uppercase tracking-widest mb-2">СБОР И ОБРАБОТКА</h3>
                <p className="text-xs text-espresso/70 font-body leading-relaxed">
                  Только спелые ягоды собираются вручную и проходят строгий контроль качества на станциях обработки.
                </p>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-crimson rounded-full flex items-center justify-center text-white text-[10px] font-bold z-10 hidden md:flex">
                2
              </div>
              <div className="md:w-[45%] flex justify-center md:justify-end">
                <div className="relative w-32 h-32 bg-espresso">
                  <Image src="/images/farmer_product.png" alt="Сбор и обработка" fill className="object-cover" />
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row items-center justify-between relative">
              <div className="md:w-[45%] text-center md:text-right mb-6 md:mb-0">
                <h3 className="font-heading text-lg font-bold text-crimson uppercase tracking-widest mb-2">ОБЖАРКА</h3>
                <p className="text-xs text-espresso/70 font-body leading-relaxed">
                  Каждая партия обжаривается индивидуально, чтобы максимально раскрыть заложенный природой потенциал.
                </p>
              </div>
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-crimson rounded-full flex items-center justify-center text-white text-[10px] font-bold z-10 hidden md:flex">
                3
              </div>
              <div className="md:w-[45%] flex justify-center md:justify-start">
                <div className="relative w-32 h-32 bg-espresso flex items-center justify-center">
                  <svg className="w-12 h-12 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" />
                  </svg>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ═══ Farmer Stories ═══ */}
      <section className="py-24 bg-white border-t border-espresso/10" id="farmers">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-heading text-3xl font-black text-espresso uppercase tracking-widest mb-16 border-b border-espresso pb-4">
            ИСТОРИИ ФЕРМЕРОВ
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
            {/* Story 1 */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative w-32 h-32 flex-shrink-0 bg-espresso">
                <Image src="/images/farmer_1.png" alt="Криспус Мвезигва" fill className="object-cover grayscale" />
              </div>
              <div>
                <span className="text-crimson font-heading text-4xl leading-none block mb-2">&ldquo;</span>
                <p className="text-sm text-espresso/80 font-body italic leading-relaxed mb-4">
                  Для меня кофе — это не просто товар, это наследие моей семьи. Мы вкладываем душу в каждое дерево.
                </p>
                <h4 className="font-heading text-sm font-bold text-espresso uppercase tracking-widest">КРИСПУС МВЕЗИГВА</h4>
                <p className="text-[10px] font-heading text-espresso/50 uppercase tracking-widest">Ферма Лувензори, 20 лет опыта</p>
              </div>
            </div>

            {/* Story 2 */}
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="relative w-32 h-32 flex-shrink-0 bg-espresso">
                <Image src="/images/farmer_2.png" alt="Амина Намата" fill className="object-cover grayscale" />
              </div>
              <div>
                <span className="text-crimson font-heading text-4xl leading-none block mb-2">&ldquo;</span>
                <p className="text-sm text-espresso/80 font-body italic leading-relaxed mb-4">
                  Мы внедряем новые методы обработки, чтобы наши лоты могли конкурировать с лучшим кофе мира.
                </p>
                <h4 className="font-heading text-sm font-bold text-espresso uppercase tracking-widest">АМИНА НАМАТА</h4>
                <p className="text-[10px] font-heading text-espresso/50 uppercase tracking-widest">Менеджер станции, Инноватор</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Subscription CTA ═══ */}
      <section className="bg-crimson py-16" id="subscription">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="font-heading text-3xl md:text-4xl font-black text-white uppercase tracking-widest mb-2">
              КОФЕ КАЖДЫЙ<br />МЕСЯЦ
            </h2>
            <p className="text-white/80 font-body text-sm">
              Экономьте до 20% при подписке на регулярную доставку.
            </p>
          </div>
          <form className="flex w-full md:w-auto gap-2" onSubmit={(e) => { e.preventDefault(); alert('Спасибо за подписку!'); }}>
            <input 
              type="email" 
              placeholder="EMAIL" 
              required
              className="bg-white/10 border border-white/30 text-white placeholder:text-white/50 px-4 py-3 text-sm font-body focus:outline-none focus:border-white w-full md:w-64"
            />
            <button type="submit" className="bg-white text-crimson font-heading font-bold uppercase tracking-widest text-[10px] px-8 py-3 hover:bg-cream transition-colors whitespace-nowrap">
              ОФОРМИТЬ
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
