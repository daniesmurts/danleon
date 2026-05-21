import { ReactNode } from 'react';

interface SectionHeadingProps {
  children: ReactNode;
  subtitle?: string;
  centered?: boolean;
  light?: boolean;
  className?: string;
}

export default function SectionHeading({
  children,
  subtitle,
  centered = true,
  light = false,
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`mb-12 ${centered ? 'text-center' : ''} ${className}`}>
      <h2
        className={`text-3xl md:text-4xl lg:text-5xl font-heading font-extrabold tracking-[0.15em] uppercase ${
          light ? 'text-white' : 'text-espresso'
        }`}
      >
        {children}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-lg font-body max-w-2xl ${centered ? 'mx-auto' : ''} ${
            light ? 'text-cream/80' : 'text-espresso/60'
          }`}
        >
          {subtitle}
        </p>
      )}
      <div
        className={`mt-6 h-0.5 w-16 ${light ? 'bg-cream' : 'bg-crimson'} ${
          centered ? 'mx-auto' : ''
        }`}
      />
    </div>
  );
}
