import type { Metadata } from 'next';
import AnimatedReveal from '@/components/ui/AnimatedReveal';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { getAllProducts } from '@/lib/sanity';
import CatalogGrid from './CatalogGrid';

export const metadata: Metadata = { title: 'Каталог — ДАНЛЕОН' };

export default async function CatalogPage() {
  const products = await getAllProducts();

  return (
    <>
      {/* ═══ Hero Banner ═══ */}
      <section className="relative gradient-cream overflow-hidden" id="catalog-hero">
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-cream-dark/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-crimson/5 rounded-full blur-2xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-36 pb-16">
          <Breadcrumb items={[{ label: 'Главная', href: '/' }, { label: 'Каталог' }]} />
          <AnimatedReveal>
            <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl font-black tracking-[0.15em] text-espresso uppercase">
              Каталог
            </h1>
            <p className="mt-4 text-base md:text-lg text-espresso/60 font-body max-w-xl leading-relaxed">
              Откройте для себя коллекцию премиального угандийского кофе —
              от&nbsp;светлой до&nbsp;тёмной обжарки
            </p>
          </AnimatedReveal>
        </div>
      </section>

      <CatalogGrid products={products} />
    </>
  );
}
