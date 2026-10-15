-- E-mails de la plateforme aux vendeurs inscrits :
--   * annonces (nouvelles fonctionnalités) envoyées par un administrateur ;
--   * rappel hebdomadaire aux vendeurs qui ne se connectent plus (boutique à vérifier + parrainage).
-- Les envois sont faits par la fonction Edge `platform-emails` ; cette migration ne contient que les données.

-- ── Préférences d'e-mail de chaque vendeur ──
create table if not exists public.platform_email_prefs (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  -- jeton secret du lien « Ne plus recevoir ces e-mails » présent dans chaque message
  token            uuid not null default gen_random_uuid() unique,
  opted_out        boolean not null default false,
  last_reminder_at timestamptz,
  reminders_sent   integer not null default 0,
  created_at       timestamptz not null default now()
);

alter table public.platform_email_prefs enable row level security;
-- Aucune politique : seule la fonction Edge (clé de service) lit et écrit cette table.

-- Désinscription par le lien reçu dans l'e-mail (sans compte à ouvrir).
create or replace function public.platform_email_unsubscribe(p_token uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.platform_email_prefs set opted_out = true where token = p_token and opted_out = false;
  get diagnostics n = row_count;
  return n > 0;
end;
$$;

revoke all on function public.platform_email_unsubscribe(uuid) from public;
grant execute on function public.platform_email_unsubscribe(uuid) to anon, authenticated;

-- ── Annonces envoyées par l'administrateur ──
create table if not exists public.platform_announcements (
  id         uuid primary key default gen_random_uuid(),
  sent_by    uuid references auth.users(id) on delete set null,
  title      text not null check (char_length(title) between 1 and 140),
  body       text not null default '' check (char_length(body) <= 2000),
  cta_label  text not null default '',
  cta_path   text not null default '',
  recipients integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.platform_announcements enable row level security;
-- Aucune politique : l'historique est lu et écrit uniquement par la fonction Edge (clé de service), qui vérifie
-- que l'appelant figure dans la liste ADMIN_EMAILS (et non dans `profiles.is_admin`, modifiable par l'utilisateur).
