'use client';

import { useState, FormEvent } from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import AnimatedReveal from '@/components/ui/AnimatedReveal';
import Button from '@/components/ui/Button';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'Ошибка отправки. Попробуйте позже.');
      } else {
        setSubmitted(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      }
    } catch {
      setError('Ошибка соединения. Проверьте интернет и попробуйте ещё раз.');
    } finally {
      setSending(false);
    }
  }

  const inputClasses =
    'w-full border border-cream bg-white rounded-sm px-4 py-3 text-espresso font-body text-base leading-[1.7] placeholder:text-espresso/30 focus:border-crimson focus:ring-1 focus:ring-crimson/20 outline-none transition-all duration-300';

  return (
    <main className="pt-28 pb-20 bg-white relative overflow-hidden">
      {/* Subtle cream gradient accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-cream/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cream/15 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Heading */}
        <AnimatedReveal>
          <SectionHeading subtitle="Мы всегда рады ответить на ваши вопросы">
            КОНТАКТЫ
          </SectionHeading>
        </AnimatedReveal>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 lg:gap-16 mt-4">
          {/* Left – Contact Form */}
          <AnimatedReveal className="lg:col-span-3" delay={100}>
            <div className="bg-white rounded-sm border border-cream/40 shadow-lg shadow-espresso/5 p-8 md:p-10">
              {submitted ? (
                <div className="text-center py-12">
                  {/* Checkmark icon */}
                  <div className="w-16 h-16 rounded-full bg-crimson/10 flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                    <svg
                      className="w-8 h-8 text-crimson"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl md:text-2xl font-heading font-extrabold tracking-[0.15em] uppercase text-espresso mb-4">
                    Спасибо!
                  </h3>
                  <p className="font-body text-espresso/70 text-base leading-[1.7] max-w-md mx-auto mb-8">
                    Сообщение отправлено! Мы свяжемся с вами в ближайшее время.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setSubmitted(false)}
                  >
                    Отправить ещё
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} noValidate>
                  {/* Имя */}
                  <div className="mb-5">
                    <label
                      htmlFor="contact-name"
                      className="block font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-2"
                    >
                      Имя
                    </label>
                    <input
                      id="contact-name"
                      name="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Ваше имя"
                      className={inputClasses}
                    />
                  </div>

                  {/* Email */}
                  <div className="mb-5">
                    <label
                      htmlFor="contact-email"
                      className="block font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-2"
                    >
                      Email
                    </label>
                    <input
                      id="contact-email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="your@email.com"
                      className={inputClasses}
                    />
                  </div>

                  {/* Тема */}
                  <div className="mb-5">
                    <label
                      htmlFor="contact-subject"
                      className="block font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-2"
                    >
                      Тема
                    </label>
                    <input
                      id="contact-subject"
                      name="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="Тема сообщения"
                      className={inputClasses}
                    />
                  </div>

                  {/* Сообщение */}
                  <div className="mb-8">
                    <label
                      htmlFor="contact-message"
                      className="block font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-2"
                    >
                      Сообщение
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={5}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Напишите ваше сообщение..."
                      className={`${inputClasses} resize-none`}
                    />
                  </div>

                  {error && (
                    <p className="mb-4 font-body text-sm text-crimson bg-crimson/5 border border-crimson/20 px-4 py-3">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={sending}
                  >
                    {sending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                          />
                        </svg>
                        Отправка...
                      </span>
                    ) : (
                      'ОТПРАВИТЬ'
                    )}
                  </Button>
                </form>
              )}
            </div>
          </AnimatedReveal>

          {/* Right – Contact Info */}
          <AnimatedReveal className="lg:col-span-2" delay={250}>
            <div className="space-y-8">
              {/* Phone */}
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cream/30 flex items-center justify-center group-hover:bg-crimson/10 transition-colors duration-300">
                  <svg
                    className="w-5 h-5 text-espresso group-hover:text-crimson transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-1">
                    Телефон
                  </h4>
                  <a
                    href="tel:+79179040998"
                    className="font-body text-espresso/70 hover:text-crimson transition-colors duration-300"
                  >
                    +7 (917) 904-09-98
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cream/30 flex items-center justify-center group-hover:bg-crimson/10 transition-colors duration-300">
                  <svg
                    className="w-5 h-5 text-espresso group-hover:text-crimson transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-1">
                    Email
                  </h4>
                  <a
                    href="mailto:daniel@boadtech.com"
                    className="font-body text-espresso/70 hover:text-crimson transition-colors duration-300"
                  >
                    daniel@boadtech.com
                  </a>
                </div>
              </div>

              {/* Address */}
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cream/30 flex items-center justify-center group-hover:bg-crimson/10 transition-colors duration-300">
                  <svg
                    className="w-5 h-5 text-espresso group-hover:text-crimson transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-1">
                    Адрес
                  </h4>
                  <p className="font-body text-espresso/70">
                  
                  </p>
                </div>
              </div>

              {/* Working hours */}
              <div className="flex items-start gap-4 group">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-cream/30 flex items-center justify-center group-hover:bg-crimson/10 transition-colors duration-300">
                  <svg
                    className="w-5 h-5 text-espresso group-hover:text-crimson transition-colors duration-300"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h4 className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-1">
                    Часы работы
                  </h4>
                  <p className="font-body text-espresso/70">
                    Пн–Сб: 9:00 — 21:00
                  </p>
                  <p className="font-body text-espresso/40 text-sm mt-0.5">
                    Вс: выходной
                  </p>
                </div>
              </div>

              {/* Divider */}
              <div className="h-px bg-cream/40" />

              {/* Social links */}
              <div>
                <h4 className="font-heading text-xs font-bold uppercase tracking-[0.15em] text-espresso mb-4">
                  Мы в соцсетях
                </h4>
                <div className="flex gap-3">
                  {/* Telegram */}
                  <a
                    href="#"
                    aria-label="Telegram"
                    className="w-11 h-11 rounded-full border border-cream flex items-center justify-center text-espresso hover:bg-crimson hover:border-crimson hover:text-white transition-all duration-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
                    </svg>
                  </a>

                  {/* Instagram */}
                  <a
                    href="#"
                    aria-label="Instagram"
                    className="w-11 h-11 rounded-full border border-cream flex items-center justify-center text-espresso hover:bg-crimson hover:border-crimson hover:text-white transition-all duration-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                    </svg>
                  </a>

                  {/* VK */}
                  <a
                    href="#"
                    aria-label="VKontakte"
                    className="w-11 h-11 rounded-full border border-cream flex items-center justify-center text-espresso hover:bg-crimson hover:border-crimson hover:text-white transition-all duration-300"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.678.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.203.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.253-1.406 2.151-3.574 2.151-3.574.119-.254.322-.491.762-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* CTA card */}
              <div className="mt-4 p-6 rounded-sm bg-gradient-to-br from-cream/20 to-cream/5 border border-cream/30">
                <p className="font-heading text-sm font-bold uppercase tracking-[0.15em] text-espresso mb-2">
                  Оптовые заказы
                </p>
                <p className="font-body text-sm text-espresso/60 leading-relaxed">
                  Для оптовых заказов и сотрудничества свяжитесь с нами по email
                  или телефону. Мы предложим индивидуальные условия.
                </p>
              </div>
            </div>
          </AnimatedReveal>
        </div>
      </div>
    </main>
  );
}
