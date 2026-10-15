import { Profile, Transaction } from '../lib/types';

export const mockProfile: Profile = {
  id: 'profile-1',
  user_id: 'user-1',
  username: 'testshop',
  display_name: 'Test Seller',
  bio: 'Biographie de test',
  shop_name: 'Ma Boutique Test',
  shop_logo_url: '',
  contact_phone: '+237600000000',
  mtn_number: '+237670000000',
  orange_number: '+237690000000',
  whatsapp_number: '+237600000001',
  whatsapp_enabled: false,
  whatsapp_greeting: '',
  announcement_text: '',
  announcement_active: false,
  announcement_expires_at: null,
  is_admin: false,
  avatar_url: '',
  theme: 'default',
  plan_type: 'premium',
  social_links: [],
  wallet_balance: 1500,
  referral_code: 'REF123',
  referred_by: null,
  affiliate_balance: 0,
  lifetime_affiliate_earned: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: new Date().toISOString(),
};

export const mockFreeProfil: Profile = {
  ...mockProfile,
  plan_type: 'free',
  id: 'profile-free',
  username: 'freeshop',
};

export function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: `txn-${Math.random().toString(36).slice(2)}`,
    product_id: 'prod-1',
    seller_id: 'user-1',
    buyer_name: 'Acheteur',
    buyer_email: 'buyer@test.com',
    buyer_phone: '+237600000099',
    amount: 5000,
    quantity: 1,
    platform_fee: 250,
    seller_amount: 4750,
    payment_method: 'mtn',
    status: 'completed',
    currency: 'XAF',
    shipped_at: null,
    delivery_confirmed_at: null,
    delivery_lat: null,
    delivery_lng: null,
    delivery_address: 'Douala',
    created_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    ...overrides,
  };
}

/** Helper: build N completed transactions with optional ship time (hours after creation) */
export function makeCompletedTxns(count: number, shipHoursAfterCreate?: number): Transaction[] {
  return Array.from({ length: count }, (_, i) => {
    const created = new Date(Date.now() - (count - i) * 86_400_000).toISOString();
    const shipped = shipHoursAfterCreate != null
      ? new Date(new Date(created).getTime() + shipHoursAfterCreate * 3_600_000).toISOString()
      : null;
    return makeTransaction({ created_at: created, shipped_at: shipped });
  });
}
