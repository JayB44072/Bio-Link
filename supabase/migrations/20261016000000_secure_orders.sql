-- Sécurisation du circuit des commandes.
--
-- Avant : la table `transactions` était lisible ET modifiable par n'importe qui (règles « using (true) »),
-- et la confirmation de réception reposait sur le navigateur de l'acheteur pour créditer le vendeur.
--
-- Après :
--  * plus aucun accès public direct aux commandes ;
--  * l'acheteur passe par des fonctions qui n'exposent que le nécessaire, à partir de l'identifiant (UUID)
--    de sa commande ou de son numéro de téléphone ;
--  * la confirmation de réception est faite côté serveur : statut, commission et crédit du vendeur en une
--    seule opération, impossible à rejouer ;
--  * le vendeur ne peut modifier que le statut et la date d'expédition de ses commandes.
--
-- À exécuter APRÈS 20261015000000_tracking_and_subscribers.sql (get_order_tracking y est définie).

-- ══════════════════════════════════════════════════════════════════
-- 1. Colonne : 4 derniers chiffres de la carte (jamais le numéro complet)
-- ══════════════════════════════════════════════════════════════════
alter table public.transactions add column if not exists card_last4 text;
alter table public.transactions drop constraint if exists transactions_card_last4_check;
alter table public.transactions add constraint transactions_card_last4_check
  check (card_last4 is null or card_last4 ~ '^[0-9]{4}$');

-- ══════════════════════════════════════════════════════════════════
-- 2. Règles d'accès à la table
-- ══════════════════════════════════════════════════════════════════

-- Fin de l'accès public en lecture et en modification
drop policy if exists "Public can view a transaction by id" on public.transactions;
drop policy if exists "Public can confirm delivery on a transaction" on public.transactions;

-- Création d'une commande : toujours « en attente », jamais déjà expédiée ni confirmée
drop policy if exists "Anyone can insert transactions" on public.transactions;
drop policy if exists "Authenticated users can insert transactions" on public.transactions;
drop policy if exists "Buyers can create pending orders" on public.transactions;
create policy "Buyers can create pending orders"
  on public.transactions for insert
  to anon, authenticated
  with check (status = 'pending' and shipped_at is null and delivery_confirmed_at is null and amount >= 0);

-- Le vendeur peut expédier ou annuler ses commandes en cours, rien d'autre
drop policy if exists "Sellers update their own transactions" on public.transactions;
create policy "Sellers update their own transactions"
  on public.transactions for update
  to authenticated
  using (seller_id = auth.uid() and status in ('pending', 'shipped'))
  with check (seller_id = auth.uid() and status in ('pending', 'shipped', 'cancelled'));

-- … et seules ces colonnes sont modifiables (pas les montants, ni le statut « completed »)
revoke update on public.transactions from anon, authenticated;
grant update (status, shipped_at) on public.transactions to authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 3. Fonctions pour l'acheteur (sans compte)
-- ══════════════════════════════════════════════════════════════════

-- Détail complet d'une commande : produit (photo, description, emplacement), vendeur et suivi de livraison.
-- Ne renvoie ni le téléphone ni l'e-mail de l'acheteur.
create or replace function public.get_order_details(p_order_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tx   public.transactions;
  prod public.products;
  prof public.profiles;
begin
  select * into tx from public.transactions where id = p_order_id;
  if not found then
    return null;
  end if;
  select * into prof from public.profiles where user_id = tx.seller_id;
  if tx.product_id is not null then
    select * into prod from public.products where id = tx.product_id;
  end if;

  return json_build_object(
    'order', json_build_object(
      'id', tx.id, 'status', tx.status, 'amount', tx.amount, 'currency', tx.currency,
      'quantity', coalesce((to_jsonb(tx) ->> 'quantity')::int, 1),
      'payment_method', tx.payment_method, 'created_at', tx.created_at,
      'shipped_at', tx.shipped_at, 'delivery_confirmed_at', tx.delivery_confirmed_at,
      'delivery_address', coalesce(tx.delivery_address, ''), 'buyer_name', tx.buyer_name
    ),
    'product', case when prod.id is null then null else json_build_object(
      'id', prod.id, 'name', prod.name, 'description', coalesce(prod.description, ''),
      'image_url', coalesce(prod.image_url, ''), 'images', coalesce(prod.images, '{}'),
      'price', prod.price, 'currency', prod.currency, 'location_address', coalesce(prod.location_address, '')
    ) end,
    'seller', json_build_object(
      'username', prof.username, 'shop_name', coalesce(prof.shop_name, ''), 'display_name', coalesce(prof.display_name, ''),
      'logo_url', coalesce(prof.shop_logo_url, ''), 'avatar_url', coalesce(prof.avatar_url, ''),
      'whatsapp_number', coalesce(prof.whatsapp_number, ''), 'plan_type', prof.plan_type
    ),
    'tracking', public.get_order_tracking(p_order_id)
  );
end;
$$;

revoke all on function public.get_order_details(uuid) from public;
grant execute on function public.get_order_details(uuid) to anon, authenticated;

-- Retrouver ses commandes par numéro de téléphone (ou 4 derniers chiffres de la carte), chez un vendeur ou, sans vendeur, partout.
-- Le numéro est comparé chiffres seuls, avec au moins 8 chiffres, pour éviter les recherches trop larges.
create or replace function public.lookup_orders(p_seller_id uuid default null, p_phone text default null, p_card_last4 text default null)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  digits text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  last4  text := regexp_replace(coalesce(p_card_last4, ''), '\D', '', 'g');
begin
  if length(digits) < 8 and length(last4) <> 4 then
    return '[]'::json;
  end if;

  return coalesce((
    select json_agg(row_to_json(r) order by r.created_at desc) from (
      select t.id, t.status, t.amount, t.currency, t.created_at,
             p.name as product_name, p.image_url as product_image
      from public.transactions t
      left join public.products p on p.id = t.product_id
      where (p_seller_id is null or t.seller_id = p_seller_id)
        and (
          (length(digits) >= 8 and regexp_replace(coalesce(t.buyer_phone, ''), '\D', '', 'g') = digits)
          or (length(last4) = 4 and t.card_last4 = last4)
        )
      order by t.created_at desc
      limit 50
    ) r
  ), '[]'::json);
end;
$$;

revoke all on function public.lookup_orders(uuid, text, text) from public;
grant execute on function public.lookup_orders(uuid, text, text) to anon, authenticated;

-- Confirmation de réception par l'acheteur (libération de l'argent bloqué).
-- Tout se fait ici, côté serveur : on ne fait pas confiance au navigateur pour les montants.
--  * seule une commande « expédiée » peut être confirmée ;
--  * la commission dépend du forfait du vendeur ; elle est recalculée sur le montant de la commande ;
--  * rejouer la confirmation ne crédite pas deux fois (verrou de ligne + contrôle du statut).
-- ATTENTION : ces taux doivent rester identiques à PLAN_CONFIGS (src/lib/planLimits.ts) ; un test le vérifie.
create or replace function public.confirm_delivery(p_order_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  tx   public.transactions;
  plan text;
  rate numeric;
  fee  numeric(12, 2);
  net  numeric(12, 2);
begin
  select * into tx from public.transactions where id = p_order_id for update;
  if not found then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;
  if tx.status = 'completed' then
    return json_build_object('ok', true, 'already', true);
  end if;
  if tx.status <> 'shipped' then
    return json_build_object('ok', false, 'error', 'not_shipped');
  end if;

  select plan_type into plan from public.profiles where user_id = tx.seller_id;
  rate := case plan when 'starter' then 0.04 when 'business' then 0.03 when 'premium' then 0.02 else 0.05 end;
  fee := round(tx.amount * rate, 2);
  net := round(tx.amount - fee, 2);

  update public.transactions
     set status = 'completed', delivery_confirmed_at = now(), platform_fee = fee, seller_amount = net
   where id = p_order_id;

  update public.profiles
     set wallet_balance = coalesce(wallet_balance, 0) + net
   where user_id = tx.seller_id;

  return json_build_object('ok', true, 'seller_amount', net);
end;
$$;

revoke all on function public.confirm_delivery(uuid) from public;
grant execute on function public.confirm_delivery(uuid) to anon, authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 4. Données de la page publique d'un vendeur, sans données personnelles
-- ══════════════════════════════════════════════════════════════════

-- Pour les badges de confiance (statuts et dates uniquement).
create or replace function public.seller_recent_orders(p_seller_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(r)), '[]'::json) from (
    select id, status, created_at, shipped_at
    from public.transactions
    where seller_id = p_seller_id
    order by created_at desc
    limit 100
  ) r;
$$;

revoke all on function public.seller_recent_orders(uuid) from public;
grant execute on function public.seller_recent_orders(uuid) to anon, authenticated;

-- Pour la notification « vient d'acheter » : prénom + initiale et ville seulement
-- (avant : le nom complet et l'adresse de livraison étaient publics).
create or replace function public.recent_public_sales(p_seller_id uuid)
returns json
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(json_agg(row_to_json(r)), '[]'::json) from (
    select t.id,
           nullif(trim(split_part(t.buyer_name, ' ', 1)
             || case when position(' ' in trim(t.buyer_name)) > 0
                     then ' ' || left(trim(substr(trim(t.buyer_name), position(' ' in trim(t.buyer_name)) + 1)), 1) || '.'
                     else '' end), '') as buyer_name,
           nullif(trim(regexp_replace(coalesce(t.delivery_address, ''), '^.*,', '')), '') as delivery_address,
           t.amount, t.currency, t.created_at, p.name as product_name
    from public.transactions t
    left join public.products p on p.id = t.product_id
    where t.seller_id = p_seller_id and t.status in ('pending', 'completed')
    order by t.created_at desc
    limit 10
  ) r;
$$;

revoke all on function public.recent_public_sales(uuid) from public;
grant execute on function public.recent_public_sales(uuid) to anon, authenticated;
