'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, setCartOpen } = useCart();
  const router = useRouter();

  // Coffee always needs weight selection; non-coffee with multiple variants also needs it
  const isCoffee = !product.category || product.category === 'coffee';
  const hasVariants = !isCoffee && product.variants && product.variants.length > 1;
  const needsSelection = isCoffee || hasVariants;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (needsSelection) {
      // Send to product page so the user can pick weight/variant
      router.push(`/catalog/${product.id}`);
      return;
    }
    // Single-SKU non-coffee product — add directly
    const variant = product.variants?.[0];
    const price = variant?.price ?? product.price;
    const weight = variant?.grams ?? product.weight;
    addItem(product, 1, 'зерно', weight, price);
    setCartOpen(true);
  };

  return (
    <div className="group block bg-white border border-cream/20 flex flex-col h-full hover:shadow-lg transition-shadow duration-300" id={`product-card-${product.id}`}>
      {/* Link Wraps the upper part */}
      <Link href={`/catalog/${product.id}`} className="block flex-1 p-6">
        {/* Image Box */}
        <div className="relative aspect-[4/5] bg-[#F5F5F5] mb-6 flex items-center justify-center p-4">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading={index < 3 ? 'eager' : 'lazy'}
            />
          ) : (
            <svg className="w-16 h-16 text-espresso/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h18M3 4.5h18M4.5 19.5h15" />
            </svg>
          )}
          {product.badge && (
            <div className="absolute top-3 right-3 bg-crimson text-white text-[9px] font-heading font-bold uppercase tracking-[0.1em] px-2 py-1">
              {product.badge}
            </div>
          )}
        </div>

        {/* Info */}
        <h3 className="font-heading text-lg font-black tracking-[0.1em] text-espresso uppercase leading-tight mb-2">
          {product.name}
        </h3>
        
        {/* Tags — coffee-specific fields only shown when present */}
        {(product.process || product.roast) && (
          <div className="flex flex-wrap gap-2 mb-4">
            {product.process && (
              <span className="bg-espresso text-white text-[8px] font-heading uppercase tracking-widest px-2 py-0.5">
                {product.process}
              </span>
            )}
            {product.roast && (
              <span className="bg-espresso text-white text-[8px] font-heading uppercase tracking-widest px-2 py-0.5">
                {product.roast}
              </span>
            )}
          </div>
        )}

        <p className="text-xs text-espresso/60 font-body line-clamp-2 leading-relaxed">
          {product.description}
        </p>
      </Link>

      {/* Button fixed at the bottom */}
      <div className="p-6 pt-0 mt-auto">
        <button
          onClick={handleAddToCart}
          className="w-full bg-crimson hover:bg-crimson-dark text-white font-heading font-bold text-sm tracking-[0.15em] uppercase py-3 transition-colors"
        >
          {needsSelection ? 'ВЫБРАТЬ' : 'В КОРЗИНУ'}
        </button>
      </div>
    </div>
  );
}
