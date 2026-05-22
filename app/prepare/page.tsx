import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Способы приготовления',
  description: 'Как приготовить идеальный кофе из Уганды. Пуровер, аэропресс, френч-пресс, турка и мока — пошаговые инструкции и советы.',
};

const EXTRACTION_STAGES = [
  { time: 'до 1 мин', note: 'Арабика с изысканной лёгкой кислинкой' },
  { time: '1–2 мин', note: 'Приятные ягодные нотки' },
  { time: '2–3 мин', note: 'Доминирует аромат орехов' },
  { time: '3–4 мин', note: 'Насыщенный и глубокий вкус' },
];

const METHODS = [
  {
    id: 'french-press',
    name: 'Френч-пресс',
    nameEn: 'French Press',
    time: '4 мин',
    difficulty: 'Просто',
    illustration: (
      <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Lid knob */}
        <rect x="52" y="8" width="16" height="6" rx="3" fill="#3D2B1F"/>
        {/* Lid */}
        <rect x="36" y="14" width="48" height="7" rx="2" fill="#3D2B1F"/>
        {/* Plunger rod */}
        <rect x="58" y="21" width="4" height="80" fill="#6B4C3B"/>
        {/* Plunger disk */}
        <rect x="38" y="97" width="44" height="5" rx="2" fill="#3D2B1F"/>
        {/* Glass body */}
        <rect x="34" y="21" width="52" height="118" rx="3" fill="#F5F0EA" stroke="#C4A882" strokeWidth="2"/>
        {/* Coffee liquid */}
        <rect x="36" y="102" width="48" height="35" fill="#6B3A2A" opacity="0.35"/>
        {/* Metal frame - left */}
        <rect x="30" y="21" width="5" height="118" rx="2" fill="#9E7B5A"/>
        {/* Metal frame - right */}
        <rect x="85" y="21" width="5" height="118" rx="2" fill="#9E7B5A"/>
        {/* Base */}
        <rect x="28" y="136" width="64" height="8" rx="3" fill="#3D2B1F"/>
        {/* Handle */}
        <path d="M90 50 Q108 50 108 70 Q108 90 90 90" stroke="#9E7B5A" strokeWidth="5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    equipment: ['Френч-пресс', 'Данлеон в зёрнах', 'Вода 92–96 °С', 'Весы'],
    steps: [
      'Прогрейте колбу, залив кипятком на 30 секунд, затем вылейте.',
      'Засыпьте 6–7 г кофе на каждые 100 мл воды.',
      'Залейте горячую воду, перемешайте «корочку» сверху.',
      'Настаивайте 4 минуты.',
      'Медленно опустите поршень и сразу разлейте по чашкам.',
    ],
    tip: 'Дайте напитку отдохнуть 20–30 секунд после нажатия поршня — аромат раскроется ярче.',
  },
  {
    id: 'pourover',
    name: 'Пуровер',
    nameEn: 'V60 Dripper',
    time: '2.5–3 мин',
    difficulty: 'Средне',
    illustration: (
      <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Carafe body */}
        <path d="M30 100 Q30 155 60 160 Q90 155 90 100 L90 88 L30 88 Z" fill="#F5F0EA" stroke="#C4A882" strokeWidth="2"/>
        {/* Coffee in carafe */}
        <path d="M32 120 Q32 155 60 160 Q88 155 88 120 Z" fill="#6B3A2A" opacity="0.3"/>
        {/* Carafe neck */}
        <rect x="48" y="72" width="24" height="18" rx="2" fill="#F5F0EA" stroke="#C4A882" strokeWidth="2"/>
        {/* V60 dripper cone */}
        <path d="M22 44 L60 88 L98 44 Z" fill="#9E4A3A" opacity="0.15" stroke="#9E4A3A" strokeWidth="2"/>
        {/* V60 rim */}
        <rect x="20" y="38" width="80" height="8" rx="4" fill="#9E4A3A"/>
        {/* Ribs on V60 */}
        <line x1="42" y1="46" x2="55" y2="82" stroke="#9E4A3A" strokeWidth="1.5" opacity="0.5"/>
        <line x1="60" y1="46" x2="60" y2="84" stroke="#9E4A3A" strokeWidth="1.5" opacity="0.5"/>
        <line x1="78" y1="46" x2="65" y2="82" stroke="#9E4A3A" strokeWidth="1.5" opacity="0.5"/>
        {/* Handle on carafe */}
        <path d="M90 100 Q108 100 108 115 Q108 130 90 130" stroke="#C4A882" strokeWidth="4" strokeLinecap="round" fill="none"/>
        {/* Water drop */}
        <ellipse cx="60" cy="26" rx="4" ry="5" fill="#9E4A3A" opacity="0.4"/>
        <path d="M56 28 Q60 14 64 28" fill="#9E4A3A" opacity="0.3"/>
        {/* Stand ring */}
        <ellipse cx="60" cy="88" rx="32" ry="5" stroke="#C4A882" strokeWidth="2" fill="none"/>
      </svg>
    ),
    equipment: ['Дриппер V60', 'Бумажный фильтр', 'Данлеон в зёрнах', 'Чайник-гусятник', 'Весы'],
    steps: [
      'Промойте бумажный фильтр горячей водой прямо в дриппере.',
      'Засыпьте 6 г кофе на каждые 100 мл воды.',
      'Прелив (блум): залейте воду в 2–3 раза больше веса кофе, дайте набухнуть 30–40 секунд.',
      'Медленно вливайте оставшуюся воду круговыми движениями от центра к краям.',
      'Полное время экстракции — 2,5–3 минуты.',
    ],
    tip: 'Экспериментируйте с помолом и скоростью налива — небольшие изменения дают совсем разный вкус.',
  },
  {
    id: 'aeropress',
    name: 'Аэропресс',
    nameEn: 'AeroPress',
    time: '1–2 мин',
    difficulty: 'Средне',
    illustration: (
      <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Plunger cap */}
        <rect x="44" y="10" width="32" height="10" rx="5" fill="#3D5A6B"/>
        {/* Plunger shaft */}
        <rect x="52" y="20" width="16" height="60" rx="2" fill="#4A6E82"/>
        {/* Plunger rubber seal */}
        <rect x="46" y="78" width="28" height="8" rx="4" fill="#2C3E4A"/>
        {/* Outer chamber */}
        <rect x="36" y="70" width="48" height="80" rx="6" fill="#E8F0F5" stroke="#7BA7BC" strokeWidth="2"/>
        {/* Coffee inside */}
        <rect x="38" y="118" width="44" height="28" rx="4" fill="#6B3A2A" opacity="0.3"/>
        {/* Filter cap */}
        <rect x="34" y="148" width="52" height="10" rx="5" fill="#3D5A6B"/>
        {/* Drip */}
        <ellipse cx="60" cy="165" rx="4" ry="6" fill="#3D2B1F" opacity="0.25"/>
        {/* Measurement lines */}
        <line x1="38" y1="90" x2="46" y2="90" stroke="#7BA7BC" strokeWidth="1.5"/>
        <line x1="38" y1="103" x2="46" y2="103" stroke="#7BA7BC" strokeWidth="1.5"/>
        <line x1="38" y1="116" x2="46" y2="116" stroke="#7BA7BC" strokeWidth="1.5"/>
      </svg>
    ),
    equipment: ['Аэропресс + фильтр', 'Данлеон в зёрнах', 'Вода 92–96 °С'],
    steps: [
      'Вставьте и промойте фильтр, установите аэропресс на чашку.',
      'Засыпьте 16–18 г кофе.',
      'Залейте 220–240 мл воды, тщательно перемешайте.',
      'Стандартный метод: нажмите поршень через 30–45 секунд.',
      'Инверсионный метод: настаивайте 1–1,5 мин, переверните и нажмите.',
    ],
    tip: 'Время экстракции 1–2 минуты — чем дольше, тем насыщеннее. Ищите свой баланс.',
  },
  {
    id: 'turka',
    name: 'Турка',
    nameEn: 'Джезва',
    time: '5–7 мин',
    difficulty: 'Просто',
    illustration: (
      <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Handle - long, angled to the right */}
        <path d="M85 95 L115 60" stroke="#8B4513" strokeWidth="6" strokeLinecap="round"/>
        {/* Handle decoration */}
        <path d="M87 93 L114 62" stroke="#A0522D" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        {/* Main body - wider at top, narrow at bottom (traditional cezve shape) */}
        <path d="M38 130 Q35 155 60 162 Q85 155 82 130 L80 90 Q80 78 60 78 Q40 78 40 90 Z" fill="#C4872A" stroke="#8B4513" strokeWidth="2"/>
        {/* Copper sheen */}
        <path d="M42 105 Q40 130 42 148" stroke="#E8A840" strokeWidth="3" strokeLinecap="round" opacity="0.4"/>
        {/* Neck narrowing */}
        <ellipse cx="60" cy="78" rx="20" ry="6" fill="#B8761F" stroke="#8B4513" strokeWidth="2"/>
        {/* Spout / wide rim */}
        <path d="M30 72 Q60 60 90 72" stroke="#8B4513" strokeWidth="3" strokeLinecap="round" fill="none"/>
        <ellipse cx="60" cy="72" rx="30" ry="8" fill="#C4872A" stroke="#8B4513" strokeWidth="2"/>
        {/* Coffee foam/liquid */}
        <path d="M42 90 Q60 84 78 90" stroke="#3D2B1F" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        {/* Bottom */}
        <ellipse cx="60" cy="160" rx="22" ry="5" fill="#8B4513" opacity="0.5"/>
      </svg>
    ),
    equipment: ['Турка (джезва)', 'Данлеон в зёрнах', 'Холодная фильтрованная вода'],
    steps: [
      'Насыпьте 1–2 чайных ложки кофе на 100 мл воды.',
      'По желанию добавьте щепотку кардамона или корицы.',
      'Нагревайте на слабом огне, не отходя от плиты.',
      'Как только поднялась пенка — снимите с огня.',
      'Повторите подъём пенки 2–3 раза, не доводя до кипения.',
    ],
    tip: 'Активное кипение разрушает аромат — главное правило турки: пенка поднялась, убирай.',
  },
  {
    id: 'moka',
    name: 'Мока',
    nameEn: 'Гейзерная кофеварка',
    time: '5 мин',
    difficulty: 'Просто',
    illustration: (
      <svg viewBox="0 0 120 180" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Steam */}
        <path d="M54 18 Q50 10 54 4" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        <path d="M60 20 Q56 10 60 2" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
        <path d="M66 18 Q62 10 66 4" stroke="#9E9E9E" strokeWidth="2" strokeLinecap="round" opacity="0.4"/>
        {/* Upper chamber - tapers wider at bottom */}
        <path d="M46 28 Q40 60 38 88 L82 88 Q80 60 74 28 Z" fill="#D4C4A0" stroke="#8B7355" strokeWidth="2"/>
        {/* Upper chamber lid/spout */}
        <path d="M50 26 L70 26" stroke="#8B7355" strokeWidth="3" strokeLinecap="round"/>
        <rect x="52" y="22" width="16" height="6" rx="3" fill="#8B7355"/>
        {/* Handle on upper */}
        <path d="M82 50 Q95 50 95 62 Q95 74 82 74" stroke="#5C4033" strokeWidth="5" strokeLinecap="round" fill="none"/>
        {/* Middle gasket / waist */}
        <rect x="36" y="86" width="48" height="8" rx="2" fill="#5C4033"/>
        {/* Lower chamber - octagonal-ish, wider */}
        <path d="M32 94 Q28 130 32 152 L88 152 Q92 130 88 94 Z" fill="#C0A875" stroke="#8B7355" strokeWidth="2"/>
        {/* Bottom of lower chamber */}
        <path d="M34 152 Q34 162 60 164 Q86 162 86 152" fill="#A08050" stroke="#8B7355" strokeWidth="2"/>
        {/* Water level line */}
        <line x1="34" y1="126" x2="50" y2="126" stroke="#8B7355" strokeWidth="1.5" opacity="0.5"/>
        <text x="52" y="129" fontSize="8" fill="#8B7355" opacity="0.5" fontFamily="sans-serif">MAX</text>
        {/* Handle on lower */}
        <path d="M32 110 Q18 110 18 122 Q18 134 32 134" stroke="#5C4033" strokeWidth="5" strokeLinecap="round" fill="none"/>
      </svg>
    ),
    equipment: ['Гейзерная кофеварка', 'Данлеон в зёрнах', 'Горячая вода'],
    steps: [
      'Налейте горячую воду в нижнюю камеру до уровня клапана.',
      'Засыпьте кофе в фильтр-корзину, не утрамбовывая.',
      'Плотно соберите кофеварку.',
      'Поставьте на средний огонь.',
      'Как только верхняя камера заполнится — снимите с огня.',
    ],
    tip: 'Не ждите бурления — снимайте сразу, как только кофе перестал течь. Это сохранит вкус.',
  },
];

export default function PreparePage() {
  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="bg-espresso pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <p className="font-heading text-[10px] tracking-[0.4em] text-crimson uppercase mb-5">Данлеон — Обучение</p>
          <h1 className="font-heading text-5xl sm:text-6xl font-black text-cream uppercase tracking-widest leading-none mb-6">
            Как приготовить<br /><span className="text-crimson">идеальный кофе</span>
          </h1>
          <p className="font-body text-lg text-cream/60 max-w-xl mx-auto leading-relaxed">
            Угандийский специальти кофе раскрывается по-разному в зависимости от метода. Выберите свой и следуйте простым шагам.
          </p>
        </div>
      </section>

      {/* ── Extraction time guide ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F9F9F9] border-b border-cream/40">
        <div className="max-w-4xl mx-auto">
          <p className="font-heading text-[10px] tracking-[0.4em] text-crimson uppercase mb-4 text-center">Время экстракции</p>
          <h2 className="font-heading text-2xl font-black text-espresso uppercase tracking-widest text-center mb-10">
            Вкус меняется с каждой минутой
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXTRACTION_STAGES.map((s, i) => (
              <div key={i} className="bg-white border border-cream/40 p-5 text-center">
                <div className="font-heading text-xs font-black text-crimson uppercase tracking-widest mb-2">{s.time}</div>
                <p className="font-body text-sm text-espresso/65 leading-snug">{s.note}</p>
              </div>
            ))}
          </div>
          <p className="text-center font-body text-sm text-espresso/40 mt-6">
            Попробуйте каждый вариант и найдите своё идеальное время.
          </p>
        </div>
      </section>

      {/* ── Methods ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {METHODS.map((m, idx) => (
            <div key={m.id} id={m.id} className="bg-white border border-cream/40 overflow-hidden">
              {/* Method header */}
              <div className="flex items-center gap-4 px-7 py-4 border-b border-cream/30 bg-[#F9F9F9]">
                <div className="flex items-baseline gap-3 flex-1">
                  <span className="font-heading text-[10px] text-espresso/30 tracking-widest">0{idx + 1}</span>
                  <h2 className="font-heading text-lg font-black text-espresso uppercase tracking-widest">{m.name}</h2>
                  <span className="font-body text-xs text-espresso/40">{m.nameEn}</span>
                </div>
                <div className="hidden sm:flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-heading text-[9px] tracking-widest text-espresso/30 uppercase">Время</p>
                    <p className="font-heading text-xs font-bold text-espresso">{m.time}</p>
                  </div>
                  <div className="w-px h-8 bg-cream/60" />
                  <div className="text-right">
                    <p className="font-heading text-[9px] tracking-widest text-espresso/30 uppercase">Сложность</p>
                    <p className="font-heading text-xs font-bold text-espresso">{m.difficulty}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-cream/30">
                {/* Illustration */}
                <div className="flex items-center justify-center py-8 px-6 bg-[#FAF7F4]">
                  <div className="w-24 h-36">
                    {m.illustration}
                  </div>
                </div>

                {/* Equipment */}
                <div className="px-6 py-6">
                  <h3 className="font-heading text-[10px] uppercase tracking-widest text-espresso/40 mb-4">Вам понадобится</h3>
                  <ul className="space-y-2">
                    {m.equipment.map((e, i) => (
                      <li key={i} className="flex items-start gap-2 font-body text-sm text-espresso/70">
                        <span className="w-1 h-1 rounded-full bg-crimson mt-2 shrink-0" />
                        {e}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Steps */}
                <div className="md:col-span-2 px-6 py-6">
                  <h3 className="font-heading text-[10px] uppercase tracking-widest text-espresso/40 mb-4">Приготовление</h3>
                  <ol className="space-y-3">
                    {m.steps.map((step, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="font-heading text-[10px] font-black text-crimson/60 mt-0.5 w-4 shrink-0">{i + 1}</span>
                        <p className="font-body text-sm text-espresso/70 leading-relaxed">{step}</p>
                      </li>
                    ))}
                  </ol>
                  <div className="mt-5 flex gap-3 bg-cream/20 border border-cream/60 px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-crimson shrink-0 mt-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
                    </svg>
                    <p className="font-body text-xs text-espresso/60 leading-relaxed"><span className="font-bold text-espresso/80">Совет:</span> {m.tip}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── General advice ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F9F9F9]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-2xl font-black text-espresso uppercase tracking-widest mb-5">Универсальный совет</h2>
          <p className="font-body text-sm text-espresso/65 leading-relaxed mb-4">
            Для любого метода используйте фильтрованную или бутилированную воду — она раскрывает вкус кофе значительно лучше, чем водопроводная.
          </p>
          <p className="font-body text-sm text-espresso/65 leading-relaxed">
            Пробуйте разные пропорции, время заваривания и степень помола. Идеальный кофе — тот, который нравится именно вам.
          </p>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-espresso py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-heading text-xs font-bold text-cream uppercase tracking-widest mb-1">Готовы попробовать?</p>
            <p className="font-body text-sm text-cream/55">Свежеобжаренный угандийский кофе прямо к вашей двери.</p>
          </div>
          <Link
            href="/catalog"
            className="shrink-0 bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-8 py-3.5 transition-colors"
          >
            В каталог
          </Link>
        </div>
      </section>

    </div>
  );
}
