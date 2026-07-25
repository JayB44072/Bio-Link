/*
  # Affiliate / Referral System
  Each user (including free plan) gets a unique 8-char referral code.
  When a referred user subscribes to a paid plan, the referrer earns 25%
  commission on the subscription payment for the first 12 months.
*/

-- Add referral_code to profiles (unique, auto-generated 8-char code)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS affiliate_balance numeric(12,2) DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS lifetime_affiliate_earned numeric(12,2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by ON profiles(referred_by);

-- Backfill referral_code for existing users using a random 8-char upper string
UPDATE profiles SET referral_code = UPPER(SUBSTRING(MD5(id::text || RANDOM()::text) FROM 1 FOR 8))
WHERE referral_code IS NULL;

-- Commissions log
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  subscription_amount numeric(12,2) NOT NULL,
  commission_amount numeric(12,2) NOT NULL,
  commission_rate numeric(4,3) NOT NULL DEFAULT 0.05,
  currency text DEFAULT 'FCFA',
  plan_type text,
  earned_at timestamptz DEFAULT now(),
  paid_out boolean DEFAULT false,
  paid_out_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_referrer ON affiliate_commissions(referrer_id);

-- RLS
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commissions"
  ON affiliate_commissions FOR SELECT TO authenticated
  USING (referrer_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "System inserts commissions"
  ON affiliate_commissions FOR INSERT TO authenticated WITH CHECK (true);
