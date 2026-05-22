import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-espresso text-cream/70" id="main-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="font-heading text-2xl font-black tracking-[0.2em] text-cream uppercase mb-4">
              Данлеон
            </h3>
            <p className="text-sm font-body leading-relaxed text-cream/50 mb-6">
              Премиальный угандийский кофе прямых поставок. От плантации до вашей чашки.
            </p>
            {/* Social Links */}
            <div className="flex gap-4">
              <a href="#" aria-label="Telegram" className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:bg-cream/10 hover:border-cream/40 transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              </a>
              <a href="#" aria-label="Instagram" className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:bg-cream/10 hover:border-cream/40 transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              </a>
              <a href="#" aria-label="VKontakte" className="w-9 h-9 rounded-full border border-cream/20 flex items-center justify-center hover:bg-cream/10 hover:border-cream/40 transition-all">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/></svg>
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-heading text-xs font-bold tracking-[0.2em] text-cream uppercase mb-4">
              Навигация
            </h4>
            <ul className="space-y-2.5">
              <li><Link href="/" className="text-sm font-body hover:text-cream transition-colors">Главная</Link></li>
              <li><Link href="/catalog" className="text-sm font-body hover:text-cream transition-colors">Каталог</Link></li>
              <li><Link href="/about" className="text-sm font-body hover:text-cream transition-colors">О нас</Link></li>
              <li><Link href="/contact" className="text-sm font-body hover:text-cream transition-colors">Контакты</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="font-heading text-xs font-bold tracking-[0.2em] text-cream uppercase mb-4">
              Покупателям
            </h4>
            <ul className="space-y-2.5">
              <li><span className="text-sm font-body">Доставка и оплата</span></li>
              <li><span className="text-sm font-body">Возврат и обмен</span></li>
              <li><span className="text-sm font-body">Бонусная программа</span></li>
              <li><span className="text-sm font-body">Оптовые закупки</span></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading text-xs font-bold tracking-[0.2em] text-cream uppercase mb-4">
              Контакты
            </h4>
            <ul className="space-y-2.5">
              <li className="text-sm font-body">+7 (495) 123-45-67</li>
              <li className="text-sm font-body">info@danleon.ru</li>
              <li className="text-sm font-body">Москва, ул. Кофейная, д. 1</li>
              <li className="text-sm font-body text-cream/40 mt-4">Пн–Сб: 9:00 — 21:00</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs font-body text-cream/30">
            © {new Date().getFullYear()} Данлеон. Все права защищены. ИП Бугембе Даниел, ИНН 165510859142
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
            <Link href="/legal/offer" className="text-xs font-body text-cream/30 hover:text-cream/60 transition-colors">Публичная оферта</Link>
            <Link href="/legal/privacy" className="text-xs font-body text-cream/30 hover:text-cream/60 transition-colors">Конфиденциальность</Link>
            <Link href="/legal/terms" className="text-xs font-body text-cream/30 hover:text-cream/60 transition-colors">Пользовательское соглашение</Link>
            <Link href="/legal/cookie" className="text-xs font-body text-cream/30 hover:text-cream/60 transition-colors">Cookie</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
