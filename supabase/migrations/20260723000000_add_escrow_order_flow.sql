alter table profiles add column if not exists mtn_number text not null default '';
alter table profiles add column if not exists orange_number text not null default '';
alter table profiles add column if not exists is_admin boolean not null default false;

alter table transactions add column if not exists shipped_at timestamptz;
alter table transactions add column if not exists delivery_confirmed_at timestamptz;

-- Statut par défaut désormais 'pending' (argent bloqué jusqu'à confirmation de réception)
alter table transactions alter column status set default 'pending';

-- Permet à l'acheteur (anonyme, sans compte) de consulter et confirmer sa propre commande
-- via le lien de suivi reçu après paiement (id de la transaction).
drop policy if exists "Public can view a transaction by id" on transactions;
create policy "Public can view a transaction by id"
  on transactions for select
  using (true);

drop policy if exists "Public can confirm delivery on a transaction" on transactions;
create policy "Public can confirm delivery on a transaction"
  on transactions for update
  using (true)
  with check (true);
