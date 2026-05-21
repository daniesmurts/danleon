'use client';

import Link from 'next/link';
import { useEffect } from 'react';

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  links: { href: string; label: string }[];
}

export default function MobileMenu({ open, onClose, links }: MobileMenuProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60]" id="mobile-menu">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-espresso/90 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Menu Content */}
      <div className="relative flex flex-col items-center justify-center h-full animate-fade-in-up">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-cream hover:text-white transition-colors"
          aria-label="Закрыть меню"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-8 h-8"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Nav Links */}
        <nav className="flex flex-col items-center gap-8">
          {links.map((link, index) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="font-heading text-3xl font-bold tracking-[0.25em] text-cream hover:text-white transition-colors"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Brand Mark */}
        <div className="absolute bottom-12 text-center">
          <span className="font-heading text-sm tracking-[0.3em] text-cream/30 uppercase">
            Данлеон · Uganda Coffee
          </span>
        </div>
      </div>
    </div>
  );
}
