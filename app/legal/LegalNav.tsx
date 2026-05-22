'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/legal/terms', label: 'Пользовательское соглашение' },
  { href: '/legal/privacy', label: 'Политика конфиденциальности' },
  { href: '/legal/personal-data', label: 'Согласие на обработку ПД' },
  { href: '/legal/newsletter', label: 'Согласие на рассылку' },
  { href: '/legal/cookie', label: 'Использование Cookie' },
  { href: '/legal/offer', label: 'Публичная оферта' },
];

export default function LegalNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 px-4 py-3 text-sm font-body transition-colors border-l-2 ${
              active
                ? 'border-crimson text-espresso bg-espresso/5 font-medium'
                : 'border-transparent text-espresso/50 hover:text-espresso hover:border-espresso/20'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
