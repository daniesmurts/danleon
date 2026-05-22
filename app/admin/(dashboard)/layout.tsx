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
          <form action="/api/admin/logout" method="POST">
            <button type="submit" className="font-heading text-xs tracking-widest uppercase text-cream/50 hover:text-cream transition-colors">
              Выйти
            </button>
          </form>
        </div>
        {/* Nav: scrollable on mobile */}
        <nav className="flex gap-1 px-4 md:px-6 overflow-x-auto scrollbar-none">
          {[
            { href: '/admin',               label: 'Заказы'      },
            { href: '/admin/subscriptions', label: 'Подписки'    },
            { href: '/admin/batches',       label: 'Партии'      },
            { href: '/admin/inventory',     label: 'Остатки'     },
            { href: '/admin/stats',         label: 'Статистика'  },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="font-heading text-[10px] tracking-widest uppercase text-cream/60 hover:text-cream transition-colors py-2.5 px-3 shrink-0 border-b-2 border-transparent hover:border-cream/30"
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
