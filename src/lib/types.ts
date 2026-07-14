export type PlanType = 'free' | 'starter' | 'business' | 'premium';
export type PaymentMethod = 'card' | 'mtn' | 'orange';
export type Language = 'fr' | 'en';

export interface SocialLink {
  platform: string;
  url: string;
  icon: string;
}

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  bio: string;
  shop_name: string;
  shop_logo_url: string;
  contact_phone: string;
  mtn_number: string;
  orange_number: string;
  is_admin: boolean;
  avatar_url: string;
  theme: string;
  plan_type: PlanType;
  social_links: SocialLink[];
  wallet_balance: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
  image_url: string;
  images: string[];
  currency: string;
  is_active: boolean;
  avg_rating: number;
  ratings_count: number;
  location_lat: number | null;
  location_lng: number | null;
  location_address: string;
  created_at: string;
  updated_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  author_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  images: string[];
  duration: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  product_id: string | null;
  seller_id: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;
  amount: number;
  platform_fee: number;
  seller_amount: number;
  payment_method: PaymentMethod;
  status: string;
  currency: string;
  shipped_at: string | null;
  delivery_confirmed_at: string | null;
  delivery_lat: number | null;
  delivery_lng: number | null;
  delivery_address: string;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  payment_method: 'mtn' | 'orange';
  phone_number: string;
  status: string;
  is_priority: boolean;
  created_at: string;
}

export interface PageView {
  id: string;
  profile_id: string;
  viewed_at: string;
  country: string;
}
