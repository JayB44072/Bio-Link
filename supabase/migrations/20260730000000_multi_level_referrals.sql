-- Multi-level referral: track which level (1, 2, 3) a commission comes from
ALTER TABLE affiliate_commissions ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_level ON affiliate_commissions(referrer_id, level);
