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
      <header className="bg-espresso text-cream px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="font-heading font-black tracking-widest uppercase text-lg">
            ДАНЛЕОН <span className="text-cream/40 text-xs font-normal">ADMIN</span>
          </Link>
          <nav className="flex gap-4">
            <Link href="/admin" className="font-heading text-xs tracking-widest uppercase text-cream/70 hover:text-cream transition-colors">
              Заказы
            </Link>
          </nav>
        </div>
        <form action="/api/admin/logout" method="POST">
          <button type="submit" className="font-heading text-xs tracking-widest uppercase text-cream/50 hover:text-cream transition-colors">
            Выйти
          </button>
        </form>
      </header>
      <main className="p-6">{children}</main>
    </div>
  );
}
