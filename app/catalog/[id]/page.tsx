import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductBySlug, getAllProductSlugs } from '@/lib/sanity';
import ProductInteractive from './ProductInteractive';

export async function generateStaticParams() {
  const slugs = await getAllProductSlugs();
  return slugs.map((slug) => ({ id: slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductBySlug(id);
  if (!product) return {};

  const title = `${product.name} — ДАНЛЕОН`;
  const description = product.description
    ?? `Специальти кофе из Уганды. ${product.process ? `Обработка: ${product.process}.` : ''} Свежая обжарка, прямые поставки.`;
  const url = `https://danleon.ru/catalog/${id}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: 'website',
      locale: 'ru_RU',
      siteName: 'ДАНЛЕОН',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

function RadarChart({ values }: { values: number[] }) {
  const radius = 60;
  const center = 100;
  const labels = ['Горчинка', 'Обжарка', 'Кислинка', 'Насыщенность', 'Сладость', 'Баланс'];

  const points = values.map((val, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    const r = (val / 5) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');

  const outerHexagon = Array.from({ length: 6 }, (_, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="relative w-full max-w-[280px] aspect-square mx-auto my-4">
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        <polygon points={outerHexagon} fill="none" stroke="#E5E5E5" strokeWidth="1" />
        {[1, 2, 3, 4].map((step) => {
          const hex = Array.from({ length: 6 }, (_, i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const r = (step / 5) * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return <polygon key={step} points={hex} fill="none" stroke="#F5F5F5" strokeWidth="1" />;
        })}
        {[0, 1, 2].map((i) => {
          const a1 = (i * 60 - 90) * (Math.PI / 180);
          const a2 = ((i + 3) * 60 - 90) * (Math.PI / 180);
          return <line key={i} x1={center + radius * Math.cos(a1)} y1={center + radius * Math.sin(a1)} x2={center + radius * Math.cos(a2)} y2={center + radius * Math.sin(a2)} stroke="#E5E5E5" strokeWidth="1" />;
        })}
        <polygon points={points} fill="rgba(147, 32, 41, 0.2)" stroke="#932029" strokeWidth="2" />
        {values.map((val, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const r = (val / 5) * radius;
          return <circle key={i} cx={center + r * Math.cos(angle)} cy={center + r * Math.sin(angle)} r="3" fill="#932029" />;
        })}
        {labels.map((label, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const r = radius + 20;
          return (
            <text key={i} x={center + r * Math.cos(angle)} y={center + r * Math.sin(angle)} fill="#3D3628" fontSize="8" fontFamily="sans-serif" fontWeight="bold" textAnchor="middle" dominantBaseline="middle">
              {label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await getProductBySlug(id);
  if (!product) notFound();

  return (
    <main className="min-h-screen pt-28 pb-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Breadcrumbs */}
        <div className="flex gap-2 text-[10px] font-heading font-bold uppercase tracking-widest mb-4">
          <Link href="/" className="text-crimson hover:text-espresso transition-colors">ГЛАВНАЯ</Link>
          <span className="text-espresso/30">/</span>
          <Link href="/catalog" className="text-crimson hover:text-espresso transition-colors">КАТАЛОГ</Link>
          <span className="text-espresso/30">/</span>
          <span className="text-espresso">{product.name}</span>
        </div>

        <h1 className="text-5xl md:text-7xl lg:text-[90px] font-heading font-black text-espresso uppercase tracking-widest mb-12 leading-none">
          {product.name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          {/* Left: image + farmer */}
          <div className="lg:col-span-7 flex flex-col gap-12">
            <div className="relative aspect-square bg-[#F9F9F9] p-8 border border-espresso/10 flex items-center justify-center">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill className="object-contain p-8 mix-blend-multiply" priority />
              ) : (
                <svg className="w-24 h-24 text-espresso/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3 9.75h18M3 4.5h18M4.5 19.5h15" />
                </svg>
              )}
            </div>

            {/* Farmer quote — coffee only */}
            {(!product.category || product.category === 'coffee') && (
              <div className="flex flex-col sm:flex-row gap-6 items-start border border-espresso/10 p-6 bg-[#F9F9F9]">
                <div className="relative w-24 h-24 flex-shrink-0 bg-espresso">
                  <Image src="/images/farmer_product.png" alt="Фермер" fill className="object-cover grayscale mix-blend-luminosity opacity-80" />
                </div>
                <div>
                  <p className="text-xs text-espresso/80 font-body leading-relaxed mb-4">
                    "Мы собираем ягоды для этого лота только на самом пике зрелости. Уникальный микроклимат нашей плантации придает кофе эту узнаваемую фруктовую ноту."
                  </p>
                  <h4 className="font-heading text-xs font-bold text-espresso uppercase tracking-widest">АБИГЕЙЛ НЬЯНДО</h4>
                  <p className="text-[10px] font-heading text-espresso/50 uppercase tracking-widest">Владелица фермы, регион Бугису</p>
                </div>
              </div>
            )}
          </div>

          {/* Right: radar + interactive controls */}
          <div className="lg:col-span-5 flex flex-col">
            {/* Radar chart — coffee only */}
            {product.profile && (
              <div className="mb-8 border-b border-espresso/10 pb-6">
                <RadarChart values={product.profile} />
              </div>
            )}

            {/* Client component handles price display, weight selection, add to cart */}
            <ProductInteractive product={product} />
          </div>
        </div>

        {/* Long description */}
        {product.longDescription && (
          <div className="mt-16 pt-16 border-t border-espresso/10 max-w-3xl">
            <h2 className="font-heading text-xl font-black tracking-widest text-espresso uppercase mb-6">О ПРОДУКТЕ</h2>
            <p className="font-body text-sm text-espresso/70 leading-relaxed">{product.longDescription}</p>
          </div>
        )}

        {/* Product meta */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-6 border-t border-espresso/10 pt-12">
          {[
            { label: 'Происхождение', value: product.region || product.origin },
            { label: 'Высота', value: product.altitude },
            { label: 'Обработка', value: product.process },
            { label: 'Обжарка', value: product.roast },
          ].map(({ label, value }) => value ? (
            <div key={label}>
              <p className="font-heading text-[9px] tracking-widest text-espresso/40 uppercase mb-1">{label}</p>
              <p className="font-heading text-xs font-bold text-espresso uppercase tracking-wide">{value}</p>
            </div>
          ) : null)}
        </div>
      </div>
    </main>
  );
}
