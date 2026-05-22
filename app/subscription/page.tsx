import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Подписка на кофе',
  description: 'Свежий угандийский специальти кофе каждый месяц. Бесплатная доставка, сниженные цены, приоритетный доступ к новинкам — всего 99 ₽ в месяц.',
};

const BENEFITS = [
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
      </svg>
    ),
    title: 'Бесплатная доставка',
    body: 'Каждая посылка по подписке доставляется бесплатно. Никаких скрытых комиссий — кофе едет к вам за наш счёт.',
    note: '* при заказе от 1 пачки, доставка по РФ',
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
      </svg>
    ),
    title: 'Сниженные цены',
    body: 'Подписчики платят меньше за каждый сорт. Чем дольше подписка — тем выгоднее. Скидка применяется автоматически.',
    note: null,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    title: 'Первым узнаёте',
    body: 'Новые сорта, лимитированные партии и сезонные урожаи — подписчики получают доступ и уведомление раньше всех.',
    note: null,
  },
  {
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
      </svg>
    ),
    title: 'Полный контроль',
    body: 'Выберите сорт, помол и частоту доставки. Приостановите или отмените в любой момент — без штрафов и звонков.',
    note: null,
  },
];

const STEPS = [
  { n: '01', title: 'Выберите кофе', body: 'Тёмная или средняя обжарка — решаете вы. Выберите объём под своё потребление.' },
  { n: '02', title: 'Задайте ритм', body: 'Раз в две недели или раз в месяц. Мы подстраиваемся под ваше потребление.' },
  { n: '03', title: 'Получайте и наслаждайтесь', body: 'Свежеобжаренный кофе приедет в нужный день. Остальное — за нами.' },
];

const FAQS = [
  {
    q: 'Можно ли отменить подписку?',
    a: 'Да, в любой момент из личного кабинета. Отмена за 48 часов до следующей отправки останавливает списание.',
  },
  {
    q: 'Что значит "бесплатная доставка"?',
    a: 'При активной подписке доставка каждого подписочного заказа по России бесплатна при заказе от одной пачки. Экспресс-доставка и международные отправления тарифицируются отдельно.',
  },
  {
    q: 'Когда применяется скидка на товары?',
    a: 'Сниженная цена автоматически отображается для каждого продукта в каталоге, когда вы авторизованы как подписчик.',
  },
  {
    q: 'Можно ли менять сорт каждый месяц?',
    a: 'Конечно. В личном кабинете вы можете в любой момент изменить выбранный продукт, помол и объём.',
  },
];

export default function SubscriptionPage() {
  return (
    <div className="bg-white">

      {/* ── Hero ── */}
      <section className="bg-espresso pt-32 pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-crimson/10 pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-cream/5 pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <p className="font-heading text-[10px] tracking-[0.4em] text-crimson uppercase mb-6">Подписка ДАНЛЕОН</p>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black text-cream uppercase tracking-widest leading-none mb-6">
            Свежий кофе<br />
            <span className="text-crimson">каждый месяц</span>
          </h1>
          <p className="font-body text-lg text-cream/60 max-w-xl mx-auto mb-10 leading-relaxed">
            Премиальный угандийский специальти кофе с прямых плантаций Маунт Элгон — у вас дома в нужный день, по лучшей цене.
          </p>

          {/* Price badge */}
          <div className="inline-flex items-baseline gap-2 bg-crimson px-8 py-4 mb-10">
            <span className="font-heading text-5xl font-black text-white tracking-tight">99</span>
            <span className="font-heading text-xl font-bold text-white/80">₽ / мес</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/account/subscription"
              className="bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-sm px-10 py-4 transition-colors"
            >
              Оформить подписку
            </Link>
            <a
              href="#how-it-works"
              className="border border-cream/20 text-cream/70 hover:text-cream hover:border-cream font-heading font-bold uppercase tracking-widest text-sm px-10 py-4 transition-colors"
            >
              Узнать больше
            </a>
          </div>
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9F9]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-heading text-[10px] tracking-[0.4em] text-crimson uppercase mb-3">Что вы получаете</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-espresso uppercase tracking-widest">
              Всё включено
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b) => (
              <div key={b.title} className="bg-white p-8 border border-cream/40 flex flex-col gap-4">
                <div className="text-crimson">{b.icon}</div>
                <h3 className="font-heading text-sm font-black text-espresso uppercase tracking-widest">{b.title}</h3>
                <p className="font-body text-sm text-espresso/60 leading-relaxed flex-1">{b.body}</p>
                {b.note && <p className="font-body text-[11px] text-espresso/30">{b.note}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Price highlight ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-espresso">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-heading text-[10px] tracking-[0.4em] text-crimson uppercase mb-4">Прозрачная цена</p>
              <h2 className="font-heading text-4xl sm:text-5xl font-black text-cream uppercase tracking-widest leading-tight mb-6">
                99 ₽ в месяц.<br />Больше ничего.
              </h2>
              <p className="font-body text-cream/60 leading-relaxed mb-8">
                Абонентская плата покрывает членство в клубе подписчиков. Кофе вы выбираете сами — и платите по сниженным подписочным ценам отдельно. Никаких автоматических списаний за товар без вашего ведома.
              </p>
              <Link
                href="/account/subscription"
                className="inline-block bg-crimson hover:bg-crimson-dark text-white font-heading font-bold uppercase tracking-widest text-xs px-8 py-3.5 transition-colors"
              >
                Стать подписчиком
              </Link>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Членство в клубе', value: '99 ₽/мес' },
                { label: 'Доставка каждого заказа', value: 'Бесплатно *' },
                { label: 'Цены на продукты', value: 'Со скидкой' },
                { label: 'Доступ к новинкам', value: 'Приоритетный' },
                { label: 'Минимальный срок', value: 'Нет' },
                { label: 'Отмена', value: 'В любой момент' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-3.5 border-b border-cream/10">
                  <span className="font-body text-sm text-cream/50">{label}</span>
                  <span className="font-heading text-sm font-bold text-cream tracking-wide">{value}</span>
                </div>
              ))}
              <p className="font-body text-[11px] text-cream/25 pt-2">* Бесплатная доставка по РФ при заказе от 1 пачки. Экспресс и международные отправления — по тарифу.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8" id="how-it-works">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="font-heading text-[10px] tracking-[0.4em] text-crimson uppercase mb-3">Просто и понятно</p>
            <h2 className="font-heading text-3xl sm:text-4xl font-black text-espresso uppercase tracking-widest">
              Как это работает
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((s) => (
              <div key={s.n} className="relative">
                <div className="font-heading text-7xl font-black text-espresso/5 leading-none mb-2 select-none">{s.n}</div>
                <div className="-mt-8">
                  <h3 className="font-heading text-sm font-black text-espresso uppercase tracking-widest mb-3">{s.title}</h3>
                  <p className="font-body text-sm text-espresso/60 leading-relaxed">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── First to know ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#F9F9F9]">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="bg-espresso p-10 lg:p-14">
            <p className="font-heading text-[10px] tracking-[0.4em] text-crimson uppercase mb-4">Только для подписчиков</p>
            <h2 className="font-heading text-3xl font-black text-cream uppercase tracking-widest leading-tight mb-6">
              Первым узнаёте о новых сортах
            </h2>
            <p className="font-body text-cream/60 leading-relaxed mb-6">
              Уганда — один из немногих регионов, где каждый урожай неповторим. Когда появляется новая партия или сезонный лот, подписчики получают уведомление и возможность заказать раньше, чем кофе попадает в открытую продажу.
            </p>
            <p className="font-body text-cream/60 leading-relaxed">
              Некоторые лимитированные партии доступны <span className="text-cream font-bold">исключительно по подписке</span> — и разбираются за считанные часы.
            </p>
          </div>
          <div className="space-y-6">
            {[
              { title: 'Уведомление первым', body: 'Email и уведомление в аккаунте за 24 часа до открытого старта продаж нового сорта.' },
              { title: 'Лимитированные партии', body: 'Отдельные микро-лоты доступны только подписчикам — в открытый каталог они не попадают.' },
              { title: 'История урожаев', body: 'Доступ к подробным карточкам каждой партии: ферма, высота, обработка, дегустационные заметки.' },
            ].map((item) => (
              <div key={item.title} className="flex gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-crimson mt-2 shrink-0" />
                <div>
                  <h4 className="font-heading text-xs font-black text-espresso uppercase tracking-widest mb-1">{item.title}</h4>
                  <p className="font-body text-sm text-espresso/55 leading-relaxed">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl font-black text-espresso uppercase tracking-widest">Частые вопросы</h2>
          </div>
          <div className="divide-y divide-cream/30">
            {FAQS.map((faq) => (
              <div key={faq.q} className="py-6">
                <h4 className="font-heading text-sm font-black text-espresso uppercase tracking-widest mb-3">{faq.q}</h4>
                <p className="font-body text-sm text-espresso/60 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="bg-crimson py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-4xl sm:text-5xl font-black text-white uppercase tracking-widest mb-4">
            Готовы попробовать?
          </h2>
          <p className="font-body text-white/70 mb-10 text-lg">
            Первый месяц — и вы поймёте, почему наши подписчики не отменяют.
          </p>
          <Link
            href="/account/subscription"
            className="inline-block bg-white text-crimson hover:bg-cream font-heading font-black uppercase tracking-widest text-sm px-12 py-4 transition-colors"
          >
            Оформить за 99 ₽/мес
          </Link>
        </div>
      </section>

    </div>
  );
}
