'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAllProducts } from '@/lib/sanity';
import Link from 'next/link';
import type { Product } from '@/lib/types';

const PAYMENT_LABEL: Record<string, string> = {
  cash: 'Наличные',
  card: 'Карта (терминал)',
  transfer: 'Перевод',
};

interface LineItem {
  productId: string;
  productName: string;
  weight: number;
  quantity: number;
  unitPrice: number;
}

function generateOfflineId() {
  return 'OFF-' + Date.now().toString().slice(-6);
}

export default function NewOfflineOrderPage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Customer
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Items
  const [items, setItems] = useState<LineItem[]>([
    { productId: '', productName: '', weight: 250, quantity: 1, unitPrice: 0 },
  ]);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [status, setStatus] = useState<'paid' | 'pending'>('paid');
  const [comment, setComment] = useState('');

  useEffect(() => {
    getAllProducts().then(setProducts);
  }, []);

  const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
    setItems((prev) => {
      const next = [...prev];
      if (field === 'productId') {
        const product = products.find((p) => p.id === value);
        next[index] = {
          ...next[index],
          productId: value as string,
          productName: product?.name ?? '',
          unitPrice: product?.price ?? 0,
        };
      } else {
        next[index] = { ...next[index], [field]: value };
      }
      return next;
    });
  };

  const addItem = () => {
    setItems((prev) => [...prev, { productId: '', productName: '', weight: 250, quantity: 1, unitPrice: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const totalPrice = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || items.some((i) => !i.productId)) {
      setError('Заполните имя клиента и выберите товары.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await addDoc(collection(db, 'orders'), {
        orderId: generateOfflineId(),
        source: 'offline',
        status,
        paymentMethod,
        customer: { firstName, lastName, phone, email, city: '', street: '', house: '', apartment: '', postalCode: '' },
        items: items.map((item) => ({
          productName: item.productName,
          weight: item.weight,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          price: item.unitPrice,
          grind: 'зерно',
        })),
        totalPrice,
        deliveryCost: 0,
        grandTotal: totalPrice,
        comment,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      router.push('/admin');
    } catch (err) {
      console.error(err);
      setError('Не удалось сохранить заказ. Попробуйте ещё раз.');
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/admin" className="font-heading text-[10px] tracking-widest uppercase text-espresso/40 hover:text-espresso transition-colors">
          ← Все заказы
        </Link>
        <span className="text-espresso/20">/</span>
        <span className="font-heading text-[10px] tracking-widest uppercase text-espresso">Новый офлайн заказ</span>
      </div>

      <h1 className="font-heading text-xl font-black tracking-widest text-espresso uppercase mb-6">Офлайн заказ</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer */}
        <div className="bg-white border border-cream/40 p-6 space-y-4">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso">Клиент</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Имя *</label>
              <input
                value={firstName} onChange={(e) => setFirstName(e.target.value)}
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="Иван"
              />
            </div>
            <div>
              <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Фамилия</label>
              <input
                value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="Иванов"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Телефон</label>
              <input
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="+7 900 000 00 00"
              />
            </div>
            <div>
              <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Email</label>
              <input
                value={email} onChange={(e) => setEmail(e.target.value)}
                type="email"
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none"
                placeholder="ivan@example.com"
              />
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-cream/40 p-6 space-y-4">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso">Товары</h2>
          {items.map((item, index) => (
            <div key={index} className="grid grid-cols-[1fr_80px_80px_80px_32px] gap-2 items-end">
              <div>
                {index === 0 && <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Товар *</label>}
                <select
                  value={item.productId}
                  onChange={(e) => updateItem(index, 'productId', e.target.value)}
                  className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none bg-white"
                >
                  <option value="">Выбрать...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                {index === 0 && <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Вес</label>}
                <select
                  value={item.weight}
                  onChange={(e) => updateItem(index, 'weight', Number(e.target.value))}
                  className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none bg-white"
                >
                  <option value={250}>250г</option>
                  <option value={500}>500г</option>
                  <option value={1000}>1кг</option>
                </select>
              </div>
              <div>
                {index === 0 && <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Кол-во</label>}
                <input
                  type="number" min={1} value={item.quantity}
                  onChange={(e) => updateItem(index, 'quantity', Number(e.target.value))}
                  className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none text-center"
                />
              </div>
              <div>
                {index === 0 && <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Цена ₽</label>}
                <input
                  type="number" min={0} value={item.unitPrice}
                  onChange={(e) => updateItem(index, 'unitPrice', Number(e.target.value))}
                  className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none text-center"
                />
              </div>
              <div>
                {index === 0 && <div className="mb-1 h-4" />}
                {items.length > 1 && (
                  <button type="button" onClick={() => removeItem(index)} className="w-8 h-9 flex items-center justify-center text-espresso/30 hover:text-crimson transition-colors">
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={addItem} className="font-heading text-[10px] uppercase tracking-widest text-espresso/40 hover:text-espresso transition-colors">
            + Добавить позицию
          </button>

          <div className="pt-3 border-t border-cream/30 flex justify-between items-center">
            <span className="font-heading text-xs uppercase tracking-widest text-espresso/50">Итого</span>
            <span className="font-heading font-black text-lg text-espresso">{totalPrice.toLocaleString('ru-RU')} ₽</span>
          </div>
        </div>

        {/* Payment & Status */}
        <div className="bg-white border border-cream/40 p-6 space-y-4">
          <h2 className="font-heading text-xs font-bold tracking-widest uppercase text-espresso">Оплата</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Способ оплаты</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'card' | 'transfer')}
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none bg-white"
              >
                {Object.entries(PAYMENT_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Статус</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'paid' | 'pending')}
                className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none bg-white"
              >
                <option value="paid">Оплачен</option>
                <option value="pending">Ожидает оплаты</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block font-heading text-[9px] uppercase tracking-widest text-espresso/50 mb-1">Комментарий</label>
            <textarea
              value={comment} onChange={(e) => setComment(e.target.value)}
              rows={2}
              className="w-full border border-espresso/20 px-3 py-2 font-body text-sm focus:border-espresso outline-none resize-none"
              placeholder="Ярмарка на Красной площади, стенд 12..."
            />
          </div>
        </div>

        {error && <p className="font-body text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-espresso hover:bg-espresso/90 disabled:opacity-50 text-cream font-heading font-bold uppercase tracking-widest text-xs py-3 transition-colors"
          >
            {saving ? 'Сохранение...' : 'Сохранить заказ'}
          </button>
          <Link href="/admin" className="px-6 border border-espresso/20 font-heading text-xs uppercase tracking-widest text-espresso/50 hover:text-espresso transition-colors flex items-center">
            Отмена
          </Link>
        </div>
      </form>
    </div>
  );
}
