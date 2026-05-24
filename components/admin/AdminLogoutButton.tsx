'use client';

import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function AdminLogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    // Sign out of Firebase so Firestore rules are revoked
    await signOut(auth).catch(() => {});
    // Clear the admin_auth cookie
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="font-heading text-xs tracking-wide uppercase text-cream/50 hover:text-cream transition-colors"
    >
      Выйти
    </button>
  );
}
