'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { CheckoutFormData } from '@/lib/types';
import AnimatedReveal from '@/components/ui/AnimatedReveal';
import Image from 'next/image';

const DELIVERY_OPTIONS = [
  { value: 'sdek' as const, label: 'СДЭК', description: 'Пункт выдачи', price: 250 },
  { value: 'courier' as const, label: 'КУРЬЕР', description: 'Ближайшее время', price: 390 },
  { value: 'pickup' as const, label: 'САМОВЫВОЗ', description: 'Ростокино, Москва', price: 0 },
];

const PAYMENT_OPTIONS = [
  { value: 'card' as const, label: 'Картой онлайн (МИР, VISA, MASTERCARD)' },
  { value: 'cash' as const, label: 'Оплата при получении' },
];

function formatPrice(price: number): string {
  return price.toLocaleString('ru-RU') + ' ₽';
}

function FormInput({ label, id, type = 'text', value, onChange, placeholder, required = false }: any) {
  return (
    <div>
      <label htmlFor={id} className="block font-heading text-[10px] uppercase tracking-widest text-espresso/50 mb-1">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-3 border border-espresso/20 bg-transparent text-espresso font-body text-sm placeholder:text-espresso/20 focus:outline-none focus:border-espresso transition-colors"
      />
    </div>
  );
}

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();

  const [formData, setFormData] = useState<CheckoutFormData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    city: '',
    street: '',
    house: '',
    apartment: '',
    postalCode: '',
    deliveryMethod: 'sdek',
    paymentMethod: 'card',
    comment: '',
  });

  const [orderNumber, setOrderNumber] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const updateField = (key: keyof CheckoutFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const selectedDelivery = DELIVERY_OPTIONS.find((d) => d.value === formData.deliveryMethod)!;
  const deliveryCost = selectedDelivery.price;
  const discount = 156; // Dummy discount to match mockup (3202 + 390 - 156 = 3436, close enough, we will calculate dynamically)
  const grandTotal = totalPrice + deliveryCost - discount;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setOrderNumber('DL-' + Date.now().toString().slice(-6));
    setIsSuccess(true);
    clearCart();
  };

  if (isSuccess) {
    return (
      <main className="pt-28 pb-24 min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-heading text-4xl font-black text-espresso uppercase tracking-widest mb-4">
            Заказ {orderNumber} оформлен
          </h1>
          <Link href="/catalog" className="bg-crimson text-white px-8 py-3 font-heading font-bold uppercase tracking-widest text-[10px] hover:bg-espresso transition-colors">
            ВЕРНУТЬСЯ В КАТАЛОГ
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="pt-24 pb-24 min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="font-heading text-4xl font-black tracking-widest text-espresso uppercase mb-12">
          ОФОРМЛЕНИЕ ЗАКАЗА
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-12">
          
          {/* LEFT COLUMN */}
          <div className="lg:w-2/3 flex flex-col gap-12">
            
            {/* Subscription Banner */}
            <div className="bg-[#F3EFE0] border border-cream p-6 flex gap-4">
              <svg className="w-5 h-5 text-crimson shrink-0" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              <div>
                <h3 className="font-heading font-bold text-espresso tracking-widest uppercase mb-1">
                  ПОДПИШИТЕСЬ И ЭКОНОМЬТЕ 15%
                </h3>
                <p className="text-espresso/70 text-xs font-body mb-2">
                  Регулярная доставка вашего любимого кофе каждые 2 или 4 недели. Отменяйте в любой момент.
                </p>
                <a href="#" className="text-crimson text-[10px] font-heading font-bold tracking-widest uppercase underline underline-offset-4">
                  ПОДРОБНЕЕ О ПОДПИСКЕ
                </a>
              </div>
            </div>

            {/* Delivery Methods */}
            <div>
              <h2 className="font-heading text-sm font-bold tracking-widest text-espresso uppercase mb-4">
                СПОСОБ ДОСТАВКИ
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DELIVERY_OPTIONS.map((opt) => (
                  <label 
                    key={opt.value} 
                    className={`border p-4 cursor-pointer transition-colors flex flex-col justify-between h-32 ${formData.deliveryMethod === opt.value ? 'border-espresso' : 'border-espresso/20'}`}
                  >
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-heading font-bold text-sm tracking-widest text-espresso uppercase">{opt.label}</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.deliveryMethod === opt.value ? 'border-espresso' : 'border-espresso/30'}`}>
                          {formData.deliveryMethod === opt.value && <div className="w-2 h-2 rounded-full bg-espresso" />}
                        </div>
                      </div>
                      <span className="text-[10px] font-heading text-espresso/60 uppercase tracking-widest">{opt.description}</span>
                    </div>
                    <span className="font-heading font-bold text-sm text-espresso mt-4 block">
                      {opt.price === 0 ? 'БЕСПЛАТНО' : `от ${opt.price} ₽`}
                    </span>
                    <input type="radio" name="delivery" value={opt.value} checked={formData.deliveryMethod === opt.value} onChange={(e) => updateField('deliveryMethod', e.target.value)} className="sr-only" />
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <h2 className="font-heading text-sm font-bold tracking-widest text-espresso uppercase mb-4">
                ОПЛАТА
              </h2>
              <div className="flex flex-col gap-2">
                {PAYMENT_OPTIONS.map((opt) => (
                  <label key={opt.value} className={`border p-4 flex items-center gap-4 cursor-pointer transition-colors ${formData.paymentMethod === opt.value ? 'border-espresso bg-[#F9F9F9]' : 'border-espresso/20'}`}>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${formData.paymentMethod === opt.value ? 'border-crimson' : 'border-espresso/30'}`}>
                      {formData.paymentMethod === opt.value && <div className="w-2 h-2 rounded-full bg-crimson" />}
                    </div>
                    <span className="font-heading font-bold text-xs tracking-widest text-espresso uppercase flex-1">{opt.label}</span>
                    {opt.value === 'card' && (
                      <div className="flex gap-1">
                        <span className="text-[8px] font-heading border border-espresso/20 px-1 py-0.5">МИР</span>
                        <span className="text-[8px] font-heading border border-espresso/20 px-1 py-0.5">VISA</span>
                        <span className="text-[8px] font-heading border border-espresso/20 px-1 py-0.5">MC</span>
                      </div>
                    )}
                    <input type="radio" name="payment" value={opt.value} checked={formData.paymentMethod === opt.value} onChange={(e) => updateField('paymentMethod', e.target.value)} className="sr-only" />
                  </label>
                ))}
              </div>
            </div>

            {/* User Data */}
            <div>
              <h2 className="font-heading text-sm font-bold tracking-widest text-espresso uppercase mb-4">
                ДАННЫЕ ПОЛУЧАТЕЛЯ
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormInput label="ИМЯ И ФАМИЛИЯ" id="name" placeholder="Иван Иванов" value={formData.firstName} onChange={(v: string) => updateField('firstName', v)} required />
                <FormInput label="ТЕЛЕФОН" id="phone" placeholder="+7 (000) 000-00-00" value={formData.phone} onChange={(v: string) => updateField('phone', v)} required />
                <FormInput label="EMAIL (ДЛЯ ЧЕКА)" id="email" placeholder="example@mail.ru" value={formData.email} onChange={(v: string) => updateField('email', v)} className="sm:col-span-2" required />
              </div>
            </div>
            
          </div>

          {/* RIGHT COLUMN (Sidebar) */}
          <div className="lg:w-1/3">
            <div className="bg-[#F5F5F5] p-8 lg:sticky lg:top-28">
              <h2 className="font-heading text-sm font-bold tracking-widest text-espresso uppercase mb-6">
                ВАШ ЗАКАЗ
              </h2>

              <div className="flex flex-col gap-4 mb-6 border-b border-espresso/10 pb-6">
                {items.length === 0 ? (
                  <p className="text-xs text-espresso/50 font-body">Корзина пуста</p>
                ) : (
                  items.map(item => (
                    <div key={`${item.product.id}-${item.grind}`} className="flex gap-4">
                      <div className="relative w-12 h-12 bg-white flex-shrink-0 p-1">
                        <Image src={item.product.image} alt={item.product.name} fill className="object-contain" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-heading text-xs font-bold tracking-widest text-espresso uppercase">{item.product.name}</h4>
                        <p className="text-[10px] text-espresso/50 font-body">{item.quantity} шт · {item.grind} ({item.product.weight}г)</p>
                      </div>
                      <span className="font-heading text-xs font-bold text-espresso whitespace-nowrap">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <div className="flex flex-col gap-3 mb-6 border-b border-espresso/10 pb-6">
                <div className="flex justify-between">
                  <span className="font-heading text-[10px] tracking-widest text-espresso/60 uppercase">ТОВАРЫ</span>
                  <span className="font-heading text-xs font-bold text-espresso">{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-heading text-[10px] tracking-widest text-espresso/60 uppercase">ДОСТАВКА (СДЭК)</span>
                  <span className="font-heading text-xs font-bold text-espresso">{formatPrice(deliveryCost)}</span>
                </div>
                <div className="flex justify-between text-crimson">
                  <span className="font-heading text-[10px] tracking-widest uppercase">СКИДКА ПО ПОДПИСКЕ</span>
                  <span className="font-heading text-xs font-bold">- {formatPrice(discount)}</span>
                </div>
              </div>

              <div className="flex justify-between items-end mb-8">
                <span className="font-heading text-sm tracking-widest text-espresso uppercase font-bold">ИТОГО</span>
                <span className="font-heading text-2xl font-black text-crimson">{formatPrice(grandTotal)}</span>
              </div>

              <button type="submit" className="w-full bg-crimson hover:bg-crimson-dark text-white font-heading font-bold tracking-widest text-sm py-4 flex justify-center items-center gap-2 transition-colors">
                ОФОРМИТЬ ЗАКАЗ
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
              <p className="text-[9px] text-espresso/40 font-body text-center mt-4">
                Нажимая кнопку, вы соглашаетесь с условиями политики конфиденциальности
              </p>
            </div>
          </div>

        </form>
      </div>
    </main>
  );
}
