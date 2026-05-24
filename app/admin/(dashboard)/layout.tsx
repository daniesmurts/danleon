import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const auth = cookieStore.get('admin_auth')?.value;

  if (auth !== process.env.ADMIN_PASSWORD) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-[#F9F9F9]">
      <header className="bg-espresso text-cream">
        {/* Top bar: logo + logout */}
        <div className="px-4 md:px-6 py-3 flex items-center justify-between border-b border-cream/10">
          <Link href="/admin" className="font-heading font-black tracking-widest uppercase text-base md:text-lg shrink-0">
            ДАНЛЕОН <span className="text-cream/40 text-xs font-normal">ADMIN</span>
          </Link>
          <div className="flex items-center gap-5">
            <Link href="/" target="_blank" className="font-heading text-xs tracking-wide uppercase text-cream/50 hover:text-cream transition-colors flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              Сайт
            </Link>
            <form action="/api/admin/logout" method="POST">
              <button type="submit" className="font-heading text-xs tracking-wide uppercase text-cream/50 hover:text-cream transition-colors">
                Выйти
              </button>
            </form>
          </div>
        </div>
        {/* Nav: scrollable on mobile */}
        <nav className="flex gap-1 px-4 md:px-6 overflow-x-auto scrollbar-none">
          {[
            { href: '/admin',               label: 'Заказы'      },
            { href: '/admin/subscriptions', label: 'Подписки'    },
            { href: '/admin/batches',       label: 'Партии'      },
            { href: '/admin/purchases',     label: 'Закупки'     },
            { href: '/admin/inventory',     label: 'Остатки'     },
            { href: '/admin/clients',       label: 'Клиенты'     },
            { href: '/admin/stats',         label: 'Статистика'  },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-heading text-xs tracking-wider uppercase text-cream/85 hover:text-cream transition-colors py-2.5 px-3 shrink-0 border-b-2 border-transparent hover:border-cream/40"
            >
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
