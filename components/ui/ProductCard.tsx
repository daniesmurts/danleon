'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Product } from '@/lib/types';
import { useCart } from '@/lib/cart-context';

interface ProductCardProps {
  product: Product;
  index?: number;
}

export default function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { addItem, setCartOpen } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1, 'зерно');
    setCartOpen(true);
  };

  return (
    <div className="group block bg-white border border-cream/20 flex flex-col h-full hover:shadow-lg transition-shadow duration-300" id={`product-card-${product.id}`}>
      {/* Link Wraps the upper part */}
      <Link href={`/catalog/${product.id}`} className="block flex-1 p-6">
        {/* Image Box */}
        <div className="relative aspect-[4/5] bg-[#F5F5F5] mb-6 flex items-center justify-center p-4">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            loading={index < 3 ? 'eager' : 'lazy'}
          />
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
        
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-espresso text-white text-[8px] font-heading uppercase tracking-widest px-2 py-0.5">
            МЫТАЯ
          </span>
          <span className="bg-espresso text-white text-[8px] font-heading uppercase tracking-widest px-2 py-0.5">
            СРЕДНЯЯ
          </span>
        </div>

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
          В КОРЗИНУ
        </button>
      </div>
    </div>
  );
}
