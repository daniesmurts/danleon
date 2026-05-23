'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

type Tab = 'signin' | 'signup';

export default function AccountLoginPage() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/account';

  const [tab, setTab] = useState<Tab>('signin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Sign in fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Sign up fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPassword2, setSignupPassword2] = useState('');
  const [tosAccepted, setTosAccepted] = useState(false);

  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signIn(email, password);
      router.push(redirect);
      router.refresh();
    } catch {
      setError('Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    if (!tosAccepted) {
      setError('Пожалуйста, примите условия использования и политику конфиденциальности');
      return;
    }
    if (signupPassword !== signupPassword2) {
      setError('Пароли не совпадают');
      return;
    }
    if (signupPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await signUp(signupEmail, signupPassword, firstName, lastName);
      router.push(redirect);
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('email-already-in-use')) {
        setError('Этот email уже зарегистрирован');
      } else {
        setError('Не удалось создать аккаунт. Попробуйте ещё раз.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-espresso flex items-center justify-center px-4 py-24">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-center mb-8">
          <span className="font-heading text-2xl font-black tracking-[0.2em] text-cream uppercase">ДАНЛЕОН</span>
          <span className="block font-heading text-[9px] tracking-[0.3em] text-cream/40 uppercase mt-0.5">Uganda Coffee</span>
        </Link>

        {/* Tabs */}
        <div className="flex bg-espresso-light/30 mb-6">
          <button
            onClick={() => { setTab('signin'); setError(''); }}
            className={`flex-1 py-3 font-heading text-xs font-bold uppercase tracking-widest transition-colors ${tab === 'signin' ? 'bg-crimson text-white' : 'text-cream/50 hover:text-cream'}`}
          >
            Войти
          </button>
          <button
            onClick={() => { setTab('signup'); setError(''); }}
            className={`flex-1 py-3 font-heading text-xs font-bold uppercase tracking-widest transition-colors ${tab === 'signup' ? 'bg-crimson text-white' : 'text-cream/50 hover:text-cream'}`}
          >
            Создать аккаунт
          </button>
        </div>

        <div className="bg-white p-8">
          {error && (
            <p className="text-crimson text-xs font-body mb-4 p-3 bg-red-50 border border-red-100">{error}</p>
          )}

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="flex flex-col gap-4">
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">Email</label>
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  required autoFocus autoComplete="email"
                  className="w-full px-4 py-3 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso"
                />
              </div>
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">Пароль</label>
                <input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password"
                  className="w-full px-4 py-3 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso"
                />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-espresso hover:bg-espresso/90 disabled:opacity-50 text-cream font-heading font-bold tracking-widest uppercase text-xs py-3 transition-colors mt-2"
              >
                {loading ? 'ВХОД...' : 'ВОЙТИ'}
              </button>
              <button
                type="button"
                onClick={() => { setTab('signup'); setError(''); }}
                className="text-center text-xs font-body text-espresso/40 hover:text-espresso/70 transition-colors"
              >
                Забыли пароль? Напишите нам на почту.
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">Имя</label>
                  <input
                    type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)}
                    required autoFocus autoComplete="given-name"
                    className="w-full px-4 py-3 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso"
                  />
                </div>
                <div>
                  <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">Фамилия</label>
                  <input
                    type="text" value={lastName} onChange={(e) => setLastName(e.target.value)}
                    required autoComplete="family-name"
                    className="w-full px-4 py-3 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso"
                  />
                </div>
              </div>
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">Email</label>
                <input
                  type="email" value={signupEmail} onChange={(e) => setSignupEmail(e.target.value)}
                  required autoComplete="email"
                  className="w-full px-4 py-3 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso"
                />
              </div>
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">Пароль</label>
                <input
                  type="password" value={signupPassword} onChange={(e) => setSignupPassword(e.target.value)}
                  required autoComplete="new-password"
                  className="w-full px-4 py-3 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso"
                />
              </div>
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">Повторите пароль</label>
                <input
                  type="password" value={signupPassword2} onChange={(e) => setSignupPassword2(e.target.value)}
                  required autoComplete="new-password"
                  className="w-full px-4 py-3 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso"
                />
              </div>
              {/* TOS checkbox */}
              <label className="flex items-start gap-3 cursor-pointer group mt-1">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={tosAccepted}
                    onChange={(e) => setTosAccepted(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 border transition-colors ${tosAccepted ? 'bg-crimson border-crimson' : 'border-espresso/30 group-hover:border-espresso/60'}`}>
                    {tosAccepted && (
                      <svg className="w-4 h-4 text-white p-0.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <polyline points="2,8 6,12 14,4" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="font-body text-xs text-espresso/60 leading-relaxed">
                  Я принимаю{' '}
                  <Link href="/legal/terms" target="_blank" className="text-espresso underline underline-offset-2 hover:text-crimson transition-colors">
                    условия использования
                  </Link>
                  {' '}и{' '}
                  <Link href="/legal/privacy" target="_blank" className="text-espresso underline underline-offset-2 hover:text-crimson transition-colors">
                    политику конфиденциальности
                  </Link>
                </span>
              </label>

              <button
                type="submit" disabled={loading || !tosAccepted}
                className="w-full bg-crimson hover:bg-crimson-dark disabled:opacity-40 disabled:cursor-not-allowed text-white font-heading font-bold tracking-widest uppercase text-xs py-3 transition-colors mt-1"
              >
                {loading ? 'СОЗДАНИЕ...' : 'СОЗДАТЬ АККАУНТ'}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
