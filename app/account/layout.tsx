'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const NAV = [
  { href: '/account', label: 'Обзор', exact: true },
  { href: '/account/orders', label: 'Заказы' },
  { href: '/account/subscription', label: 'Подписка' },
  { href: '/account/profile', label: 'Профиль' },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user && pathname !== '/account/login') {
      router.replace('/account/login');
    }
  }, [user, loading, router, pathname]);

  // Render login page without the account shell
  if (pathname === '/account/login') {
    return <>{children}</>;
  }

  if (loading || !user) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-espresso/20 border-t-espresso rounded-full animate-spin" />
      </main>
    );
  }

  const firstName = user.displayName?.split(' ')[0] ?? 'Клиент';

  const handleLogout = async () => {
    await logOut();
    router.push('/');
    router.refresh();
  };

  return (
    <main className="min-h-screen bg-[#F9F9F9] pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-espresso p-6 mb-4">
              <p className="font-heading text-[10px] tracking-widest text-cream/40 uppercase mb-1">Добро пожаловать</p>
              <p className="font-heading text-lg font-black text-cream uppercase tracking-widest">{firstName}</p>
              <p className="font-body text-xs text-cream/50 mt-1 truncate">{user.email}</p>
            </div>

            <nav className="bg-white">
              {NAV.map(({ href, label, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-5 py-3.5 font-heading text-xs font-bold uppercase tracking-widest border-l-2 transition-colors ${
                      active
                        ? 'border-crimson text-espresso bg-cream/10'
                        : 'border-transparent text-espresso/50 hover:text-espresso hover:bg-cream/5'
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-5 py-3.5 font-heading text-xs font-bold uppercase tracking-widest border-l-2 border-transparent text-espresso/40 hover:text-crimson transition-colors"
              >
                Выйти
              </button>
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {children}
          </div>

        </div>
      </div>
    </main>
  );
}
