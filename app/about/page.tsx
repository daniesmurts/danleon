'use client';

import Image from 'next/image';
import Link from 'next/link';
import AnimatedReveal from '@/components/ui/AnimatedReveal';
import SectionHeading from '@/components/ui/SectionHeading';
import Button from '@/components/ui/Button';

/* ─── Timeline Data ─── */
const milestones = [
  {
    year: '2021',
    title: 'Первая поездка в Уганду',
    description:
      'Основатели ДАНЛЕОН впервые посетили плантации на склонах горы Элгон и открыли для себя невероятный потенциал угандийского специальти кофе.',
  },
  {
    year: '2022',
    title: 'Первые поставки в Россию',
    description:
      'Мы наладили прямую цепочку поставок от фермеров до обжарщиков, доставив первые микролоты угандийской арабики на российский рынок.',
  },
  {
    year: '2023',
    title: 'Открытие собственного обжарочного цеха',
    description:
      'Запуск собственного производства позволил нам контролировать качество на каждом этапе — от зелёного зерна до готового продукта.',
  },
  {
    year: '2024',
    title: 'Запуск анаэробной линейки',
    description:
      'Совместно с угандийскими партнёрами мы разработали уникальные профили анаэробной ферментации, раскрывающие новые грани вкуса.',
  },
  {
    year: '2025',
    title: '10 000+ довольных клиентов',
    description:
      'Наш кофе полюбили тысячи ценителей по всей России. Мы продолжаем расти, сохраняя приверженность качеству и прозрачности.',
  },
];

/* ─── Values Data ─── */
const values = [
  {
    title: 'Качество',
    description:
      'Мы отбираем только лучшие лоты с оценкой SCA 84+ и обжариваем зерно в течение 48 часов после получения. Каждый этап — от сбора до упаковки — проходит строгий контроль.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
      </svg>
    ),
  },
  {
    title: 'Прозрачность',
    description:
      'Мы знаем каждого фермера по имени и рассказываем историю каждого лота. Прямые закупки без посредников гарантируют справедливую цену для производителей.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
      </svg>
    ),
  },
  {
    title: 'Устойчивость',
    description:
      'Мы инвестируем в экологически ответственное земледелие и поддерживаем местные сообщества. Часть прибыли направляется на развитие инфраструктуры в кофейных регионах Уганды.',
    icon: (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 3.03v.568c0 .334.148.65.405.864l1.068.89c.442.369.535 1.01.216 1.49l-.51.766a2.25 2.25 0 0 1-1.161.886l-.143.048a1.107 1.107 0 0 0-.57 1.664c.369.555.169 1.307-.427 1.592L9 13.125l.423 1.059a.956.956 0 0 1-1.652.928l-.679-.906a1.125 1.125 0 0 0-1.906.172L4.5 15.75l-.612.153M12.75 3.031a9 9 0 0 1 6.69 14.036m0 0-.177-.529A2.25 2.25 0 0 0 17.128 15H16.5l-.324-.324a1.453 1.453 0 0 0-2.328.377l-.036.073a1.586 1.586 0 0 1-.982.816l-.99.282c-.55.157-.894.702-.8 1.267l.073.438c.08.474.49.821.97.821.846 0 1.598.542 1.865 1.345l.215.643m-5.413.036-.177-.529A2.25 2.25 0 0 0 6.872 15H6.5l-.324-.324a1.453 1.453 0 0 0-2.328.377" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ═══ Hero Section ═══ */}
      <section
        className="relative h-[60vh] min-h-[400px] flex items-center justify-center overflow-hidden pt-28"
        id="about-hero"
      >
        <Image
          src="/images/plantation.png"
          alt="Кофейные плантации Уганды"
          fill
          className="object-cover"
          priority
          fetchPriority="high"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-espresso/80 via-espresso/50 to-espresso/80" />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <AnimatedReveal>
            <span className="inline-block font-heading text-xs tracking-[0.4em] text-cream/60 uppercase mb-4">
              Данлеон
            </span>
          </AnimatedReveal>
          <AnimatedReveal delay={200}>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-black tracking-[0.15em] text-white uppercase leading-[0.95]">
              О нас
            </h1>
          </AnimatedReveal>
          <AnimatedReveal delay={400}>
            <p className="mt-6 text-base md:text-lg text-cream/70 font-body max-w-xl mx-auto leading-relaxed">
              История премиального угандийского кофе
            </p>
          </AnimatedReveal>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-6 h-10 border-2 border-cream/30 rounded-full flex items-start justify-center p-1.5">
            <div className="w-1.5 h-3 bg-cream/50 rounded-full animate-pulse" />
          </div>
        </div>
      </section>

      {/* ═══ Brand Story Section ═══ */}
      <section className="py-24 bg-white" id="brand-story">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <AnimatedReveal>
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden shadow-2xl">
                <Image
                  src="/images/plantation.png"
                  alt="Плантация на склонах горы Элгон"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/30 to-transparent" />
                {/* Floating badge */}
                <div className="absolute bottom-6 left-6 glass-dark rounded-lg px-4 py-3">
                  <span className="font-heading text-xs tracking-[0.2em] text-cream uppercase">
                    С 2021 года
                  </span>
                </div>
              </div>
            </AnimatedReveal>

            <AnimatedReveal delay={200}>
              <div>
                <span className="font-heading text-xs tracking-[0.3em] text-crimson uppercase">
                  Наша история
                </span>
                <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-[0.12em] text-espresso uppercase mt-3 mb-6 leading-tight">
                  Данлеон — мост между
                  <br />
                  Угандой и Россией
                </h2>
                <div className="space-y-4 text-espresso/70 font-body leading-relaxed">
                  <p>
                    ДАНЛЕОН родился из страсти к&nbsp;кофе и&nbsp;убеждения, что Уганда — один
                    из&nbsp;самых недооценённых кофейных регионов мира. Наша команда отправилась
                    в&nbsp;путешествие к&nbsp;подножию горы Элгон, чтобы найти зёрна, способные
                    изменить представление о&nbsp;качественном кофе в&nbsp;России.
                  </p>
                  <p>
                    Наша миссия — строить прямые и&nbsp;прозрачные отношения с&nbsp;угандийскими
                    фермерами, обеспечивая справедливые цены и&nbsp;устойчивое развитие местных
                    сообществ. Каждый пакет кофе ДАНЛЕОН — это история конкретной плантации,
                    конкретного человека и&nbsp;конкретного терруара.
                  </p>
                  <p>
                    Мы&nbsp;верим в&nbsp;философию прямой торговли: без посредников, без компромиссов
                    по&nbsp;качеству. Только лучшие микролоты с&nbsp;высотой произрастания
                    от&nbsp;1&nbsp;800 метров, обработанные с&nbsp;вниманием к&nbsp;каждой детали.
                  </p>
                </div>

                {/* Stats row */}
                <div className="mt-8 grid grid-cols-3 gap-6">
                  <div>
                    <span className="font-heading text-2xl sm:text-3xl font-black text-crimson">
                      1 800+
                    </span>
                    <p className="text-xs text-espresso/50 font-heading tracking-[0.1em] uppercase mt-1">
                      Метров высоты
                    </p>
                  </div>
                  <div>
                    <span className="font-heading text-2xl sm:text-3xl font-black text-crimson">
                      48ч
                    </span>
                    <p className="text-xs text-espresso/50 font-heading tracking-[0.1em] uppercase mt-1">
                      От обжарки до вас
                    </p>
                  </div>
                  <div>
                    <span className="font-heading text-2xl sm:text-3xl font-black text-crimson">
                      100%
                    </span>
                    <p className="text-xs text-espresso/50 font-heading tracking-[0.1em] uppercase mt-1">
                      Арабика
                    </p>
                  </div>
                </div>
              </div>
            </AnimatedReveal>
          </div>
        </div>
      </section>

      {/* ═══ Timeline Section ═══ */}
      <section className="py-24 gradient-cream" id="timeline">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedReveal>
            <SectionHeading subtitle="Ключевые вехи нашего развития">
              Наш путь
            </SectionHeading>
          </AnimatedReveal>

          <div className="relative mt-16">
            {/* Vertical line */}
            <div className="absolute left-4 md:left-1/2 md:-translate-x-px top-0 bottom-0 w-0.5 bg-espresso/15" />

            {milestones.map((milestone, index) => (
              <AnimatedReveal key={milestone.year} delay={index * 150}>
                <div
                  className={`relative flex flex-col md:flex-row items-start mb-12 last:mb-0 ${
                    index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                  }`}
                >
                  {/* Dot on the line */}
                  <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-crimson border-4 border-cream shadow-md z-10 mt-1" />

                  {/* Content card */}
                  <div
                    className={`ml-12 md:ml-0 md:w-[calc(50%-2.5rem)] ${
                      index % 2 === 0 ? 'md:pr-0 md:mr-auto' : 'md:pl-0 md:ml-auto'
                    }`}
                  >
                    <div className="bg-white rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow border border-espresso/5">
                      <span className="inline-block font-heading text-xs tracking-[0.3em] text-crimson uppercase mb-1">
                        {milestone.year}
                      </span>
                      <h3 className="font-heading text-lg font-extrabold tracking-[0.1em] text-espresso uppercase mb-2">
                        {milestone.title}
                      </h3>
                      <p className="text-sm text-espresso/60 font-body leading-relaxed">
                        {milestone.description}
                      </p>
                    </div>
                  </div>
                </div>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Values Section ═══ */}
      <section className="py-24 bg-white" id="values">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedReveal>
            <SectionHeading subtitle="Принципы, которые определяют каждое наше решение">
              Наши ценности
            </SectionHeading>
          </AnimatedReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            {values.map((value, index) => (
              <AnimatedReveal key={value.title} delay={index * 150}>
                <div className="text-center group">
                  {/* Icon container */}
                  <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-cream/50 flex items-center justify-center text-crimson group-hover:bg-crimson group-hover:text-white transition-all duration-300 shadow-sm">
                    {value.icon}
                  </div>
                  <h3 className="font-heading text-xl font-extrabold tracking-[0.15em] text-espresso uppercase mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm text-espresso/60 font-body leading-relaxed max-w-sm mx-auto">
                    {value.description}
                  </p>
                </div>
              </AnimatedReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Uganda Photo Gallery Section ═══ */}
      <section className="py-24 bg-espresso" id="uganda-gallery">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedReveal>
            <SectionHeading light subtitle="Красота и богатство угандийских кофейных регионов">
              Уганда
            </SectionHeading>
          </AnimatedReveal>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* Large featured image */}
            <AnimatedReveal>
              <div className="md:col-span-2 md:row-span-2 relative aspect-[16/10] md:aspect-auto md:h-full min-h-[300px] rounded-lg overflow-hidden group">
                <Image
                  src="/images/plantation.png"
                  alt="Кофейная плантация на горе Элгон, Уганда"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 66vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <span className="font-heading text-xs tracking-[0.3em] text-cream/60 uppercase">
                    Маунт Элгон
                  </span>
                  <h3 className="font-heading text-xl md:text-2xl font-extrabold tracking-[0.1em] text-white uppercase mt-1">
                    Кофейные плантации
                  </h3>
                </div>
              </div>
            </AnimatedReveal>

            {/* Smaller images */}
            <AnimatedReveal delay={150}>
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                <Image
                  src="/images/hero.png"
                  alt="Процесс обработки кофе"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="font-heading text-xs tracking-[0.2em] text-cream/60 uppercase">
                    Обработка
                  </span>
                  <h4 className="font-heading text-sm font-bold tracking-[0.1em] text-white uppercase mt-0.5">
                    От ягоды к зерну
                  </h4>
                </div>
              </div>
            </AnimatedReveal>

            <AnimatedReveal delay={300}>
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden group">
                <Image
                  src="/images/product-reserve.png"
                  alt="Готовый продукт ДАНЛЕОН"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-espresso/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <span className="font-heading text-xs tracking-[0.2em] text-cream/60 uppercase">
                    Результат
                  </span>
                  <h4 className="font-heading text-sm font-bold tracking-[0.1em] text-white uppercase mt-0.5">
                    Премиальный продукт
                  </h4>
                </div>
              </div>
            </AnimatedReveal>
          </div>
        </div>
      </section>

      {/* ═══ CTA Section ═══ */}
      <section
        className="py-20 bg-gradient-to-br from-crimson to-crimson-dark relative overflow-hidden"
        id="about-cta"
      >
        {/* Decorative circles */}
        <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full" />

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <AnimatedReveal>
            <span className="inline-block font-heading text-xs tracking-[0.4em] text-white/50 uppercase mb-4">
              Откройте для себя
            </span>
            <h2 className="font-heading text-3xl md:text-5xl font-extrabold tracking-[0.12em] text-white uppercase mb-4 leading-tight">
              Попробуйте вкус
              <br />
              Уганды
            </h2>
            <p className="text-white/70 font-body mb-10 max-w-lg mx-auto">
              Каждая чашка кофе ДАНЛЕОН — это путешествие к&nbsp;склонам горы Элгон,
              к&nbsp;утренним туманам и&nbsp;вулканическим почвам, рождающим уникальный вкус.
            </p>
          </AnimatedReveal>
          <AnimatedReveal delay={200}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/catalog">
                <Button
                  variant="primary"
                  size="lg"
                  className="bg-white text-crimson hover:bg-cream shadow-xl"
                >
                  Перейти в каталог
                </Button>
              </Link>
              <Link href="/">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10"
                >
                  На главную
                </Button>
              </Link>
            </div>
          </AnimatedReveal>
        </div>
      </section>
    </>
  );
}
