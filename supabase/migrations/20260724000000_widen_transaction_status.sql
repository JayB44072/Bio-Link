-- Le paiement en modèle "séquestre" (Amazon) introduit deux nouveaux statuts
-- (shipped, cancelled) qui n'étaient pas autorisés par la contrainte d'origine.
alter table transactions drop constraint if exists transactions_status_check;
alter table transactions add constraint transactions_status_check
  check (status in ('pending','shipped','completed','cancelled','failed','refunded'));
