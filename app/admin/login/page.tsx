'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push('/admin');
      router.refresh();
    } else {
      setError('Неверный пароль');
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-espresso flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-heading text-2xl font-black tracking-widest text-cream uppercase text-center mb-8">
          ДАНЛЕОН ADMIN
        </h1>
        <form onSubmit={handleSubmit} className="bg-white p-8">
          <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
            className="w-full px-4 py-3 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso mb-4"
          />
          {error && <p className="text-crimson text-xs font-body mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-espresso hover:bg-espresso-light disabled:opacity-50 text-cream font-heading font-bold tracking-widest uppercase text-xs py-3 transition-colors"
          >
            {loading ? 'ВХОД...' : 'ВОЙТИ'}
          </button>
        </form>
      </div>
    </main>
  );
}
