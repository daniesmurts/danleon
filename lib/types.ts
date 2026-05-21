export interface Product {
  id: string;
  name: string;
  nameEn: string;
  origin: string;
  region: string;
  altitude: string;
  process: string;
  roast: 'светлая' | 'средняя' | 'тёмная';
  flavor: string[];
  description: string;
  longDescription: string;
  price: number;
  subscriptionPrice?: number;
  weight: number;
  image: string;
  badge?: 'НОВИНКА' | 'БЕСТСЕЛЛЕР' | 'ЛИМИТИРОВАННЫЙ';
  inStock: boolean;
  /** Radar chart values: Горчинка, Обжарка, Кислинка, Насыщенность, Сладость, Баланс (1–5) */
  profile: [number, number, number, number, number, number];
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
  deliveryMethod: 'courier' | 'pickup' | 'sdek';
  paymentMethod: 'card' | 'sbp' | 'cash';
  comment: string;
}

export type SubscriptionFrequency = 'biweekly' | 'monthly';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled';

export interface Subscription {
  id: string;
  userId: string;
  status: SubscriptionStatus;
  productId: string;
  productName: string;
  productImage: string;
  grind: GrindType;
  weight: number;
  frequency: SubscriptionFrequency;
  unitPrice: number;
  nextDeliveryDate: string;
  createdAt: string;
  updatedAt: string;
}

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
  comment: string;
  tbank?: {
    paymentId: string;
    paymentUrl: string;
    status: string;
  };
  createdAt: string;
  updatedAt: string;
}
