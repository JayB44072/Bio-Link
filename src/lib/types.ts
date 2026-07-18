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
  whatsapp_number: string;
  whatsapp_enabled: boolean;
  whatsapp_greeting: string;
  trust_badges?: { icon: string; label: string }[];
  announcement_text?: string;
  announcement_active?: boolean;
  announcement_expires_at?: string | null;
  product_categories?: string[];
  is_admin: boolean;
  avatar_url: string;
  theme: string;
  plan_type: PlanType;
  social_links: SocialLink[];
  wallet_balance: number;
  referral_code?: string;
  referred_by?: string | null;
  affiliate_balance?: number;
  lifetime_affiliate_earned?: number;
  created_at: string;
  updated_at: string;
}

export interface AffiliateCommission {
  id: string;
  referrer_id: string;
  referred_id: string;
  subscription_amount: number;
  commission_amount: number;
  commission_rate: number;
  currency: string;
  plan_type: string;
  earned_at: string;
  paid_out: boolean;
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
  view_count?: number;
  category?: string;
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
  quantity: number;
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

export interface Notification {
  id: string;
  user_id: string;
  type: 'order' | 'delivery' | 'system';
  title: string;
  message: string;
  is_read: boolean;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PageView {
  id: string;
  profile_id: string;
  viewed_at: string;
  country: string;
}
