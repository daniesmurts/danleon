'use client';

interface QuantitySelectorProps {
  quantity: number;
  onChange: (quantity: number) => void;
  min?: number;
  max?: number;
}

export default function QuantitySelector({
  quantity,
  onChange,
  min = 1,
  max = 99,
}: QuantitySelectorProps) {
  return (
    <div className="flex items-center border border-cream rounded-sm overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, quantity - 1))}
        disabled={quantity <= min}
        className="w-10 h-10 flex items-center justify-center text-espresso hover:bg-cream/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-heading text-lg"
        aria-label="Уменьшить количество"
      >
        −
      </button>
      <span className="w-12 h-10 flex items-center justify-center text-espresso font-heading font-bold text-sm border-x border-cream bg-white">
        {quantity}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, quantity + 1))}
        disabled={quantity >= max}
        className="w-10 h-10 flex items-center justify-center text-espresso hover:bg-cream/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed font-heading text-lg"
        aria-label="Увеличить количество"
      >
        +
      </button>
    </div>
  );
}
