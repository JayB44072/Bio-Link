-- Chiffres publics affichés sur la landing page.
-- Les ventes ne sont pas lisibles publiquement (RLS sur transactions) : on expose
-- uniquement des totaux agrégés, jamais de lignes, via une fonction SECURITY DEFINER.

create or replace function public.public_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'shops',   (select count(*) from profiles),
    'sales',   (select count(*) from transactions where status = 'completed'),
    'reviews', (select count(*) from reviews),
    'rating',  (select round(avg(rating)::numeric, 1) from reviews)
  );
$$;

revoke all on function public.public_stats() from public;
grant execute on function public.public_stats() to anon, authenticated;
