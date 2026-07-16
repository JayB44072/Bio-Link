-- Fix: authenticated users could only see their own profile,
-- which broke public shop links for logged-in visitors.

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;

CREATE POLICY "Anyone can view profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- Same fix for products: authenticated users could only see their own products
DROP POLICY IF EXISTS "Users can view their own products" ON products;

CREATE POLICY "Anyone can view active products"
  ON products FOR SELECT
  TO authenticated
  USING (true);
