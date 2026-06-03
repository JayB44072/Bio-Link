/*
  # BioLinkWD - Initial Schema

  ## Overview
  Full schema for the BioLinkWD micro-boutique and bio-link SaaS platform.

  ## Tables

  ### profiles
  - Stores user profile data linked to Supabase auth users
  - Fields: username, display_name, bio, avatar_url, theme, plan_type, social_links, wallet_balance
  - plan_type: 'free' | 'starter' | 'business' | 'premium'

  ### products
  - Products/services listed by each user for sale
  - Fields: user_id, name, description, price, image_url, is_active, currency

  ### transactions
  - Records all purchases made on public pages
  - Fields: product_id, seller_id, buyer_name, buyer_email, buyer_phone, amount, platform_fee (5%), seller_amount (95%), payment_method, status

  ### page_views
  - Tracks views of public profile pages for analytics
  - Fields: profile_id, viewed_at, country

  ## Security
  - RLS enabled on all tables
  - Users can only access/modify their own data
  - Public pages readable by anyone
*/

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username text UNIQUE NOT NULL,
  display_name text DEFAULT '',
  bio text DEFAULT '',
  avatar_url text DEFAULT '',
  theme text DEFAULT 'default',
  plan_type text DEFAULT 'free' CHECK (plan_type IN ('free','starter','business','premium')),
  social_links jsonb DEFAULT '[]'::jsonb,
  wallet_balance numeric(12,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public profiles are viewable by all"
  ON profiles FOR SELECT
  TO anon
  USING (true);

-- PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL DEFAULT '',
  description text DEFAULT '',
  price numeric(12,2) NOT NULL DEFAULT 0.00,
  image_url text DEFAULT '',
  currency text DEFAULT 'FCFA',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products"
  ON products FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own products"
  ON products FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own products"
  ON products FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Active products visible on public pages"
  ON products FOR SELECT
  TO anon
  USING (is_active = true);

-- TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  seller_id uuid REFERENCES auth.users(id) ON DELETE SET NULL NOT NULL,
  buyer_name text NOT NULL DEFAULT '',
  buyer_email text DEFAULT '',
  buyer_phone text DEFAULT '',
  amount numeric(12,2) NOT NULL DEFAULT 0.00,
  platform_fee numeric(12,2) NOT NULL DEFAULT 0.00,
  seller_amount numeric(12,2) NOT NULL DEFAULT 0.00,
  payment_method text DEFAULT 'card' CHECK (payment_method IN ('card','mtn','orange')),
  status text DEFAULT 'completed' CHECK (status IN ('pending','completed','failed','refunded')),
  currency text DEFAULT 'FCFA',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Anyone can insert transactions"
  ON transactions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- PAGE VIEWS TABLE
CREATE TABLE IF NOT EXISTS page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  viewed_at timestamptz DEFAULT now(),
  country text DEFAULT ''
);

ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profile owners can view page views"
  ON page_views FOR SELECT
  TO authenticated
  USING (
    profile_id IN (
      SELECT id FROM profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert page views"
  ON page_views FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert page views"
  ON page_views FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- WITHDRAWAL REQUESTS TABLE
CREATE TABLE IF NOT EXISTS withdrawal_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0.00,
  payment_method text DEFAULT 'mtn' CHECK (payment_method IN ('mtn','orange')),
  phone_number text NOT NULL DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','completed','rejected')),
  is_priority boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own withdrawal requests"
  ON withdrawal_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own withdrawal requests"
  ON withdrawal_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX IF NOT EXISTS idx_page_views_profile_id ON page_views(profile_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_user_id ON withdrawal_requests(user_id);
