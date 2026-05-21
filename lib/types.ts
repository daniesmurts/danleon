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
  weight: number;
  image: string;
  badge?: 'НОВИНКА' | 'БЕСТСЕЛЛЕР' | 'ЛИМИТИРОВАННЫЙ';
  inStock: boolean;
}

export type GrindType = 'зерно' | 'средний помол' | 'мелкий помол' | 'для турки' | 'френч-пресс' | 'эспрессо' | 'фильтр';

export interface CartItem {
  product: Product;
  quantity: number;
  grind: GrindType;
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
  deliveryMethod: 'courier' | 'pickup' | 'cdek' | 'sdek';
  paymentMethod: 'card' | 'sbp' | 'cash';
  comment: string;
}

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  formData: CheckoutFormData;
  createdAt: string;
}
