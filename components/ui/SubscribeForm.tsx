'use client';

import { useState } from 'react';

export default function SubscribeForm() {
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <p className="font-heading font-bold text-white uppercase tracking-widest text-sm">
        Спасибо! Вы подписаны.
      </p>
    );
  }

  return (
    <form
      className="flex w-full md:w-auto gap-2"
      onSubmit={(e) => { e.preventDefault(); setSuccess(true); setEmail(''); }}
    >
      <input
        type="email"
        placeholder="EMAIL"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-white/10 border border-white/30 text-white placeholder:text-white/50 px-4 py-3 text-sm font-body focus:outline-none focus:border-white w-full md:w-64"
      />
      <button
        type="submit"
        className="bg-white text-crimson font-heading font-bold uppercase tracking-widest text-[10px] px-8 py-3 hover:bg-cream transition-colors whitespace-nowrap"
      >
        ОФОРМИТЬ
      </button>
    </form>
  );
}
