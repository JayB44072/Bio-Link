-- Suivi de livraison sur carte + abonnés aux pages publiques.
--
-- Principes de sécurité (volontairement plus stricts que la table `transactions`) :
--  * aucune écriture directe sur ces tables : tout passe par des fonctions SECURITY DEFINER qui contrôlent
--    qui appelle, le forfait du vendeur et la validité des données ;
--  * le vendeur ne lit que ses propres lignes (RLS) ;
--  * l'acheteur (sans compte) lit le suivi de SA commande via get_order_tracking(), qui exige l'identifiant
--    (UUID) de la commande, comme la page de suivi existante.

-- ══════════════════════════════════════════════════════════════════
-- 1. Suivi de livraison
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.order_tracking_events (
  id             uuid primary key default gen_random_uuid(),
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  seller_id      uuid not null references auth.users(id) on delete cascade,
  stage          text not null check (stage in ('preparing', 'shipped', 'in_transit', 'out_for_delivery', 'arrived')),
  lat            double precision,
  lng            double precision,
  place_label    text not null default '' check (char_length(place_label) <= 120),
  note           text not null default '' check (char_length(note) <= 300),
  created_at     timestamptz not null default now(),
  constraint tracking_coords_pair  check ((lat is null) = (lng is null)),
  constraint tracking_coords_range check (lat is null or (lat between -90 and 90 and lng between -180 and 180))
);

create index if not exists order_tracking_events_tx_idx on public.order_tracking_events (transaction_id, created_at);

alter table public.order_tracking_events enable row level security;

drop policy if exists "Sellers read their tracking events" on public.order_tracking_events;
create policy "Sellers read their tracking events"
  on public.order_tracking_events for select
  to authenticated
  using (seller_id = auth.uid());

-- Ajout d'une étape de suivi (vendeur connecté, sur sa propre commande en cours).
-- Les positions sur carte sont réservées aux forfaits Business et Premium (contrôlé ici, pas seulement dans l'interface).
create or replace function public.add_tracking_event(
  p_transaction_id uuid,
  p_stage          text,
  p_lat            double precision default null,
  p_lng            double precision default null,
  p_place          text default '',
  p_note           text default ''
)
returns public.order_tracking_events
language plpgsql
security definer
set search_path = public
as $$
declare
  tx   public.transactions;
  plan text;
  ev   public.order_tracking_events;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into tx from public.transactions where id = p_transaction_id;
  if not found or tx.seller_id is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if tx.status not in ('pending', 'shipped') then
    raise exception 'order_closed' using errcode = '22023';
  end if;

  if (p_lat is null) <> (p_lng is null) then
    raise exception 'invalid_coordinates' using errcode = '22023';
  end if;
  if p_lat is not null then
    select plan_type into plan from public.profiles where user_id = auth.uid();
    if plan is null or plan not in ('business', 'premium') then
      raise exception 'plan_required' using errcode = '42501';
    end if;
  end if;

  insert into public.order_tracking_events (transaction_id, seller_id, stage, lat, lng, place_label, note)
  values (p_transaction_id, auth.uid(), p_stage, p_lat, p_lng, left(coalesce(p_place, ''), 120), left(coalesce(p_note, ''), 300))
  returning * into ev;
  return ev;
end;
$$;

revoke all on function public.add_tracking_event(uuid, text, double precision, double precision, text, text) from public;
grant execute on function public.add_tracking_event(uuid, text, double precision, double precision, text, text) to authenticated;

-- Suivi lisible par l'acheteur : étapes, point de départ (emplacement du produit) et destination.
-- Les coordonnées ne sont exposées que si le vendeur a un forfait avec carte.
create or replace function public.get_order_tracking(p_order_id uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  tx       public.transactions;
  has_map  boolean;
  origin   json := null;
  dest     json := null;
begin
  select * into tx from public.transactions where id = p_order_id;
  if not found then
    return null;
  end if;

  select coalesce(plan_type in ('business', 'premium'), false) into has_map
  from public.profiles where user_id = tx.seller_id;

  if has_map then
    select json_build_object('lat', location_lat, 'lng', location_lng, 'label', location_address)
      into origin
    from public.products
    where id = tx.product_id and location_lat is not null and location_lng is not null;

    if tx.delivery_lat is not null and tx.delivery_lng is not null then
      dest := json_build_object('lat', tx.delivery_lat, 'lng', tx.delivery_lng, 'label', coalesce(tx.delivery_address, ''));
    end if;
  end if;

  return json_build_object(
    'plan_map', coalesce(has_map, false),
    'origin', origin,
    'destination', dest,
    'events', coalesce((
      select json_agg(json_build_object(
        'id', e.id, 'stage', e.stage,
        'lat', case when has_map then e.lat else null end,
        'lng', case when has_map then e.lng else null end,
        'place_label', e.place_label, 'note', e.note, 'created_at', e.created_at
      ) order by e.created_at)
      from public.order_tracking_events e
      where e.transaction_id = p_order_id
    ), '[]'::json)
  );
end;
$$;

revoke all on function public.get_order_tracking(uuid) from public;
grant execute on function public.get_order_tracking(uuid) to anon, authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 2. Abonnés aux pages publiques
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.page_subscribers (
  id              uuid primary key default gen_random_uuid(),
  seller_id       uuid not null references auth.users(id) on delete cascade,
  email           text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  -- jeton secret du lien de désabonnement présent dans chaque e-mail
  token           uuid not null default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unique (seller_id, email)
);

create index if not exists page_subscribers_seller_idx on public.page_subscribers (seller_id, created_at desc);

alter table public.page_subscribers enable row level security;

drop policy if exists "Sellers read their subscribers" on public.page_subscribers;
create policy "Sellers read their subscribers"
  on public.page_subscribers for select
  to authenticated
  using (seller_id = auth.uid());

drop policy if exists "Sellers delete their subscribers" on public.page_subscribers;
create policy "Sellers delete their subscribers"
  on public.page_subscribers for delete
  to authenticated
  using (seller_id = auth.uid());

-- Abonnement d'un visiteur (sans compte). Réponse identique que l'e-mail soit nouveau ou déjà abonné,
-- pour ne pas révéler qui est abonné.
create or replace function public.subscribe_to_page(p_username text, p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_email  text := lower(trim(coalesce(p_email, '')));
begin
  if char_length(v_email) > 254 or v_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    return json_build_object('ok', false, 'error', 'invalid_email');
  end if;

  select user_id into v_seller from public.profiles where username = p_username;
  if v_seller is null then
    return json_build_object('ok', false, 'error', 'not_found');
  end if;

  -- garde-fou contre les inscriptions en masse
  if (select count(*) from public.page_subscribers where seller_id = v_seller) >= 20000 then
    return json_build_object('ok', false, 'error', 'limit_reached');
  end if;

  insert into public.page_subscribers (seller_id, email)
  values (v_seller, v_email)
  on conflict (seller_id, email) do update set unsubscribed_at = null;

  return json_build_object('ok', true);
end;
$$;

revoke all on function public.subscribe_to_page(text, text) from public;
grant execute on function public.subscribe_to_page(text, text) to anon, authenticated;

-- Désabonnement par le lien reçu dans un e-mail.
create or replace function public.unsubscribe_from_page(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.page_subscribers set unsubscribed_at = now()
  where token = p_token and unsubscribed_at is null;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.unsubscribe_from_page(uuid) from public;
grant execute on function public.unsubscribe_from_page(uuid) to anon, authenticated;

-- ══════════════════════════════════════════════════════════════════
-- 3. Journal des envois aux abonnés (limite quotidienne, historique)
-- ══════════════════════════════════════════════════════════════════

create table if not exists public.page_notifications (
  id         uuid primary key default gen_random_uuid(),
  seller_id  uuid not null references auth.users(id) on delete cascade,
  kind       text not null check (kind in ('product', 'service', 'announcement', 'custom')),
  title      text not null check (char_length(title) <= 140),
  body       text not null default '' check (char_length(body) <= 1000),
  recipients integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists page_notifications_seller_idx on public.page_notifications (seller_id, created_at desc);

alter table public.page_notifications enable row level security;

drop policy if exists "Sellers read their notifications log" on public.page_notifications;
create policy "Sellers read their notifications log"
  on public.page_notifications for select
  to authenticated
  using (seller_id = auth.uid());
-- Écriture : uniquement par la fonction Edge `notify-subscribers` (clé de service).
