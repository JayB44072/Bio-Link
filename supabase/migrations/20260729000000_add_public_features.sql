-- Live notifications, view counter, trust badges, announcement banner, product categories

-- Product view counter
ALTER TABLE products ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS category text DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_products_category ON products(user_id, category);

-- Seller-configured trust badges (JSONB array of {icon, label})
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS trust_badges jsonb DEFAULT '[]'::jsonb;

-- Announcement banner
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS announcement_text text DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS announcement_active boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS announcement_expires_at timestamptz;

-- Product categories (seller-defined list, kept on profile for flexibility)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS product_categories jsonb DEFAULT '[]'::jsonb;

-- RPC to atomically increment view_count (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_product_view(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_id;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_product_view(uuid) TO anon, authenticated;
