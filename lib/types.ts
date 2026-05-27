export type ProductCategory = 'coffee' | 'food' | 'accessories' | 'other';

export interface Product {
  id: string;
  category?: ProductCategory;
  name: string;
  nameEn: string;
  origin?: string;
  region?: string;
  altitude?: string;
  process?: string;
  roast?: 'светлая' | 'средняя' | 'тёмная';
  flavor?: string[];
  description: string;
  longDescription?: string;
  price: number;
  price500?: number;
  price1000?: number;
  subscriptionPrice?: number;
  subscriptionPrice500?: number;
  subscriptionPrice1000?: number;
  weight: number;
  variants?: { label: string; grams: number; price: number; subscriptionPrice?: number }[];
  image: string;
  badge?: 'НОВИНКА' | 'БЕСТСЕЛЛЕР' | 'ЛИМИТИРОВАННЫЙ';
  inStock: boolean;
  /** Radar chart values: Горчинка, Обжарка, Кислинка, Насыщенность, Сладость, Баланс (1–5) — coffee only */
  profile?: [number, number, number, number, number, number];
}

export type GrindType = 'зерно' | 'средний помол' | 'мелкий помол' | 'для турки' | 'френч-пресс' | 'эспрессо' | 'фильтр';

export interface CartItem {
  product: Product;
  quantity: number;
  grind: GrindType;
  weight: number;
  unitPrice: number;
}

export interface CheckoutFormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  street: string;
  house: string;
  apartment: string;
  postalCode: string;
  deliveryMethod: 'courier' | 'pickup' | 'sdek' | 'yandex_market';
  paymentMethod: 'card' | 'sbp' | 'cash';
  comment: string;
}

export type SubscriptionFrequency = 'biweekly' | 'monthly';
export type SubscriptionStatus = 'pending_payment' | 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  frequency: SubscriptionFrequency;
  unitPrice: number;          // monthly fee in rub (99)
  nextBillingDate: string;    // ISO date of next charge
  rebillId?: string;          // TBank RebillId — set after first successful payment
  createdAt: string;
  updatedAt: string;
}

export type ArticleCategory = 'roasting' | 'brewing' | 'origin' | 'news';

export interface Article {
  slug: string;
  title: string;
  publishedAt: string;
  category?: ArticleCategory;
  author: string;
  excerpt: string;
  coverImage?: string;
  body?: unknown[];
}

export type BatchCategory = 'raw' | 'logistics' | 'processing' | 'packaging' | 'customs' | 'other';
export type BatchStatus = 'open' | 'closed';

export interface BatchItem {
  id: string;
  name: string;
  unit: string;
  category: BatchCategory;
  qtyPlan: number;
  qtyActual: number;
  pricePlan: number;
  priceActual: number;
  costPlan: number;
  costActual: number;
  sellPrice: number;
  salesRevenuePlan: number;
  salesKg: number;
  note: string;
}

export interface InventoryItem {
  docId: string;
  name: string;
  unit: string;
  stock: number;
  threshold: number;
  price: number;
  costPrice?: number;
  packSize?: number;   // grams per pack — used to compute pack count from kg stock
  productId?: string;  // Sanity product slug — links this row to a catalog product
  updatedAt?: { seconds: number };
}

export interface PurchaseItem {
  id: string;
  name: string;
  unit: string;
  qty: number;
  unitCost: number;
  totalCost: number;
}

export interface Purchase {
  docId: string;
  date: string;
  supplier: string;
  note?: string;
  items: PurchaseItem[];
  grandTotal: number;
  createdAt?: { seconds: number } | unknown;
}

export interface SalesRep {
  docId: string;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface RepAllocation {
  docId: string;
  repId: string;
  repName: string;
  productId?: string;    // Sanity product ID
  productName?: string;  // display name
  packSize: number;      // grams (250 / 500 / 1000)
  kg: number;
  date: string;
  note?: string;
  createdAt?: { seconds: number } | unknown;
}

export type OrderSource = 'online' | 'offline';
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  orderId: string;
  userId?: string;
  status: OrderStatus;
  items: CartItem[];
  totalPrice: number;
  deliveryCost: number;
  grandTotal: number;
  customer: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    city: string;
    street: string;
    house: string;
    apartment: string;
    postalCode: string;
  };
  deliveryMethod: CheckoutFormData['deliveryMethod'];
  paymentMethod: CheckoutFormData['paymentMethod'];
  source?: OrderSource;
  comment: string;
  tbank?: {
    paymentId: string;
    paymentUrl: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}
