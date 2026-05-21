'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { getProductById } from '@/lib/products';
import { useCart } from '@/lib/cart-context';
import { GrindType } from '@/lib/types';

const GRIND_OPTIONS: { value: GrindType; label: string }[] = [
  { value: 'зерно', label: 'В ЗЕРНАХ' },
  { value: 'френч-пресс', label: 'ФРЕНЧ-ПРЕСС' },
  { value: 'эспрессо', label: 'ЭСПРЕССО' },
  { value: 'фильтр', label: 'ФИЛЬТР' },
];

const WEIGHT_OPTIONS = [
  { value: '250', label: '250Г' },
  { value: '500', label: '500Г' },
  { value: '1000', label: '1КГ' },
];

function RadarChart({ values }: { values: number[] }) {
  const radius = 60;
  const center = 100;
  const labels = ['Горчинка', 'Обжарка', 'Кислинка', 'Насыщенность', 'Сладость', 'Баланс'];
  
  // Calculate points for the data polygon
  const points = values.map((val, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    const r = (val / 5) * radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');

  // Calculate points for the outer hexagon (max value 5)
  const outerHexagon = [5,5,5,5,5,5].map((val, i) => {
    const angle = (i * 60 - 90) * (Math.PI / 180);
    const r = radius;
    return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="relative w-full max-w-[280px] aspect-square mx-auto my-4">
      <svg viewBox="0 0 200 200" className="w-full h-full overflow-visible">
        {/* Background hexagon */}
        <polygon points={outerHexagon} fill="none" stroke="#E5E5E5" strokeWidth="1" />
        
        {/* Inner grid lines */}
        {[1,2,3,4].map((step) => {
           const hex = [5,5,5,5,5,5].map((_, i) => {
            const angle = (i * 60 - 90) * (Math.PI / 180);
            const r = (step / 5) * radius;
            return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
          }).join(' ');
          return <polygon key={step} points={hex} fill="none" stroke="#F5F5F5" strokeWidth="1" />
        })}

        {/* Axes lines */}
        {[0, 1, 2].map((i) => {
          const angle1 = (i * 60 - 90) * (Math.PI / 180);
          const angle2 = ((i+3) * 60 - 90) * (Math.PI / 180);
          return (
            <line 
              key={i}
              x1={center + radius * Math.cos(angle1)} 
              y1={center + radius * Math.sin(angle1)}
              x2={center + radius * Math.cos(angle2)} 
              y2={center + radius * Math.sin(angle2)}
              stroke="#E5E5E5" strokeWidth="1"
            />
          )
        })}

        {/* Data polygon */}
        <polygon points={points} fill="rgba(147, 32, 41, 0.2)" stroke="#932029" strokeWidth="2" />
        
        {/* Data points */}
        {values.map((val, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const r = (val / 5) * radius;
          return (
            <circle 
              key={`dot-${i}`}
              cx={center + r * Math.cos(angle)} 
              cy={center + r * Math.sin(angle)} 
              r="3" 
              fill="#932029" 
            />
          )
        })}

        {/* Labels */}
        {labels.map((label, i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const r = radius + 20; // offset labels slightly outside
          const x = center + r * Math.cos(angle);
          const y = center + r * Math.sin(angle);
          return (
            <text 
              key={`label-${i}`}
              x={x} 
              y={y} 
              fill="#3D3628" 
              fontSize="8" 
              fontFamily="sans-serif"
              fontWeight="bold"
              textAnchor="middle" 
              dominantBaseline="middle"
              className="uppercase tracking-widest font-heading"
            >
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const product = getProductById(id);
  const { addItem, setCartOpen } = useCart();

  const [grind, setGrind] = useState<GrindType>('зерно');
  const [weight, setWeight] = useState('250');
  const [isAdded, setIsAdded] = useState(false);

  // Loading / not found
  if (!product) {
    return (
      <main className="min-h-screen pt-28 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-32">
          <h1 className="text-2xl font-heading font-bold uppercase mb-4">Товар не найден</h1>
          <Link href="/catalog" className="text-crimson border-b border-crimson pb-1">Вернуться в каталог</Link>
        </div>
      </main>
    );
  }

  // Price calculation based on weight (dummy logic for mockup)
  const multiplier = weight === '250' ? 1 : weight === '500' ? 1.9 : 3.5;
  const currentPrice = product.price * multiplier;
  const oldPrice = currentPrice * 1.2;

  const handleAddToCart = () => {
    const weightNum = parseInt(weight);
    addItem(product, 1, grind, weightNum, Math.round(currentPrice));
    setIsAdded(true);
    setCartOpen(true); // Open the cart drawer
    setTimeout(() => setIsAdded(false), 2000);
  };

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

        {/* Product Title */}
        <h1 className="text-5xl md:text-7xl lg:text-[90px] font-heading font-black text-espresso uppercase tracking-widest mb-12 leading-none">
          {product.name}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-24">
          {/* Left Column (Image & Farmer Info) */}
          <div className="lg:col-span-7 flex flex-col gap-12">
            
            {/* Main Product Image */}
            <div className="relative aspect-square bg-[#F9F9F9] p-8 border border-espresso/10">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-contain p-8 mix-blend-multiply"
                priority
              />
            </div>

            {/* Farmer Info */}
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
          </div>

          {/* Right Column (Details & Add to Cart) */}
          <div className="lg:col-span-5 flex flex-col">
            
            {/* Price section */}
            <div className="flex items-end gap-4 mb-6 border-b border-espresso/10 pb-6">
              <span className="text-4xl font-heading font-black text-crimson">
                {currentPrice.toLocaleString('ru-RU')} ₽
              </span>
              <span className="text-lg font-heading font-bold text-espresso/40 line-through mb-1">
                {oldPrice.toLocaleString('ru-RU')} ₽
              </span>
            </div>

            {/* Flavor Profile tags */}
            <div className="flex flex-wrap gap-2 mb-8 border-b border-espresso/10 pb-6">
              {product.flavor.map((f, i) => (
                <span key={i} className="border border-espresso/20 px-4 py-2 text-[10px] font-heading font-bold text-espresso uppercase tracking-widest">
                  {f}
                </span>
              ))}
            </div>

            {/* Description */}
            <p className="text-sm font-body text-espresso/70 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Radar Chart */}
            <div className="mb-8 border-b border-espresso/10 pb-6">
              <RadarChart values={product.profile} />
            </div>

            {/* Selectors */}
            <div className="flex flex-col gap-6 mb-10">
              {/* Grind */}
              <div>
                <span className="block text-[10px] font-heading tracking-widest text-espresso/50 uppercase mb-3">ПОМОЛ</span>
                <div className="flex flex-wrap gap-2">
                  {GRIND_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGrind(opt.value)}
                      className={`px-4 py-3 text-[10px] font-heading font-bold uppercase tracking-widest border transition-colors ${
                        grind === opt.value
                          ? 'border-espresso bg-espresso text-white'
                          : 'border-espresso/20 text-espresso hover:border-espresso'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Weight */}
              <div>
                <span className="block text-[10px] font-heading tracking-widest text-espresso/50 uppercase mb-3">ВЕС (НЕТТО)</span>
                <div className="flex flex-wrap gap-2">
                  {WEIGHT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setWeight(opt.value)}
                      className={`px-4 py-3 text-[10px] font-heading font-bold uppercase tracking-widest border transition-colors ${
                        weight === opt.value
                          ? 'border-espresso bg-espresso text-white'
                          : 'border-espresso/20 text-espresso hover:border-espresso'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleAddToCart}
                className={`flex-1 px-8 py-4 font-heading font-bold tracking-widest uppercase text-xs transition-all ${
                  isAdded ? 'bg-green-700 text-white border border-green-700' : 'bg-espresso text-white hover:bg-espresso/90'
                }`}
              >
                {isAdded ? 'ДОБАВЛЕНО' : 'В КОРЗИНУ'}
              </button>
              <button className="flex-1 px-8 py-4 font-heading font-bold tracking-widest uppercase text-xs border border-espresso text-espresso hover:bg-[#F9F9F9] transition-colors">
                ПОДПИСАТЬСЯ
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}
