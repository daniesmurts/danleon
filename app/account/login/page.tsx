'use client';

import { useState, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

type Tab = 'signin' | 'signup';

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ) : (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function PasswordInput({
  value,
  onChange,
  autoComplete,
  autoFocus,
  required = true,
}: {
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  autoFocus?: boolean;
  required?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        className="w-full px-4 py-3 pr-11 border border-espresso/20 text-espresso font-body text-sm focus:outline-none focus:border-espresso"
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-espresso/40 hover:text-espresso transition-colors"
        aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
      >
        <EyeIcon open={show} />
      </button>
    </div>
  );
}

function parseFirebaseError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found')
    return 'Неверный email или пароль';
  if (code === 'auth/invalid-email')
    return 'Некорректный формат email';
  if (code === 'auth/too-many-requests')
    return 'Слишком много попыток. Попробуйте позже или сбросьте пароль';
  if (code === 'auth/network-request-failed')
    return 'Ошибка соединения с Firebase. Попробуйте ещё раз или свяжитесь с поддержкой';
  if (code === 'auth/unauthorized-domain')
    return 'Домен не авторизован в Firebase. Свяжитесь с поддержкой';
  if (code === 'auth/user-disabled')
    return 'Аккаунт заблокирован. Свяжитесь с поддержкой';
  if (code === 'auth/email-already-in-use')
    return 'Этот email уже зарегистрирован';
  return 'Что-то пошло не так. Попробуйте ещё раз';
}

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
    } catch (err) {
      setError(parseFirebaseError(err));
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
    } catch (err) {
      setError(parseFirebaseError(err));
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
                <PasswordInput value={password} onChange={setPassword} autoComplete="current-password" />
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full bg-espresso hover:bg-espresso/90 disabled:opacity-50 text-cream font-heading font-bold tracking-widest uppercase text-xs py-3 transition-colors mt-2"
              >
                {loading ? 'ВХОД...' : 'ВОЙТИ'}
              </button>
              <Link
                href="/account/reset-password"
                className="text-center text-xs font-body text-espresso/40 hover:text-espresso/70 transition-colors"
              >
                Забыли пароль?
              </Link>
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
                <PasswordInput value={signupPassword} onChange={setSignupPassword} autoComplete="new-password" />
              </div>
              <div>
                <label className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">Повторите пароль</label>
                <PasswordInput value={signupPassword2} onChange={setSignupPassword2} autoComplete="new-password" />
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
