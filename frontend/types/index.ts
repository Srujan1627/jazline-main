export interface Address {
  id: string;
  name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
}

export interface User {
  _id: string;
  phone?: string;
  name?: string;
  email?: string;
  auth_provider?: string; // "email", "google", "phone"
  google_id?: string;
  profile_picture?: string;
  addresses: Address[];
  created_at: string;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  whats_included: string[];
  category: string;
  product_type?: string;
  image: string;
  images?: string[];
  mrp: number;
  selling_price?: number;
  rental_price_per_day?: number;
  rental_price_per_week?: number;
  rental_price_per_month?: number;
  security_deposit?: number;
  stock: number;
  reviews: any[];
  average_rating: number;
  damage_policy?: string;
  late_fee_per_day?: number;
  maintenance_included?: boolean;
  sanitization_certified?: boolean;
  emi_available?: boolean;
  emi_plans?: { tenure: number; monthly_emi: number; interest_rate: number }[];
  is_active: boolean;
  tags?: string[];
  best_for?: string;
}

export interface OrderItem {
  product_id: string;
  product_name: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Order {
  _id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  delivery_charges: number;
  total: number;
  address: Address;
  payment_method: string;
  payment_status: string;
  order_status: string;
  created_at: string;
}

export interface Rental {
  _id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  rental_duration: number;
  rental_type: string;
  rental_price: number;
  security_deposit: number;
  delivery_charges: number;
  total: number;
  address: Address;
  payment_method: string;
  payment_status: string;
  rental_status: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}