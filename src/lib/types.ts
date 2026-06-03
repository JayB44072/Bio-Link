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
  image_url: string;
  currency: string;
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
