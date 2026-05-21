interface BadgeProps {
  label: string;
  className?: string;
}

export default function Badge({ label, className = '' }: BadgeProps) {
  const colorMap: Record<string, string> = {
    'НОВИНКА': 'bg-crimson text-white',
    'БЕСТСЕЛЛЕР': 'bg-espresso text-cream',
    'ЛИМИТИРОВАННЫЙ': 'bg-gradient-to-r from-amber-600 to-amber-800 text-white',
  };

  const colors = colorMap[label] || 'bg-espresso text-cream';

  return (
    <span
      className={`inline-block px-3 py-1 text-[10px] font-heading font-bold uppercase tracking-[0.2em] rounded-sm ${colors} ${className}`}
    >
      {label}
    </span>
  );
}
