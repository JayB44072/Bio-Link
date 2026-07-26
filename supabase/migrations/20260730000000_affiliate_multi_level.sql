-- Multi-level affiliate: track which tier (1=direct, 2=L2, 3=L3) each commission comes from.
-- Commissions are also credited to the withdrawable balance immediately (paid_out=true at insert).

ALTER TABLE affiliate_commissions
  ADD COLUMN IF NOT EXISTS level integer NOT NULL DEFAULT 1 CHECK (level IN (1, 2, 3));

-- Mark all existing L1 commissions as paid_out (they should have been credited already
-- when the referrer's affiliate_balance was updated).
UPDATE affiliate_commissions SET paid_out = true, paid_out_at = COALESCE(paid_out_at, earned_at)
WHERE paid_out = false;

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_level ON affiliate_commissions(referrer_id, level);
