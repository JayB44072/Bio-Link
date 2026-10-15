-- Livraisons d'un abonné, pour la carte de la page publique.
-- L'abonné s'identifie par le jeton secret reçu dans les e-mails de la boutique (lien « Voir mes livraisons ») :
-- ni numéro de téléphone à saisir, ni lecture publique de la table `transactions`.
-- À exécuter après 20261015000000_tracking_and_subscribers.sql (et de préférence 20261016000000_secure_orders.sql).

create or replace function public.subscriber_deliveries(p_token uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_seller uuid;
  v_email  text;
begin
  select seller_id, lower(email) into v_seller, v_email
  from public.page_subscribers
  where token = p_token and unsubscribed_at is null;

  if v_seller is null then
    return '[]'::json;
  end if;

  return coalesce((
    select json_agg(row_to_json(d) order by d.created_at desc)
    from (
      select
        t.id,
        t.status,
        t.amount,
        t.currency,
        t.created_at,
        t.delivery_address,
        t.delivery_lat,
        t.delivery_lng,
        -- prénom seulement
        split_part(coalesce(t.buyer_name, ''), ' ', 1) as buyer_name,
        t.product_id,
        pr.name              as product_name,
        pr.image_url         as product_image,
        pr.location_lat      as product_lat,
        pr.location_lng      as product_lng,
        pr.location_address  as product_address,
        coalesce((
          select json_agg(json_build_object(
                   'lat', e.lat, 'lng', e.lng, 'place_label', e.place_label, 'created_at', e.created_at
                 ) order by e.created_at)
          from public.order_tracking_events e
          where e.transaction_id = t.id and e.lat is not null and e.lng is not null
        ), '[]'::json) as events
      from public.transactions t
      left join public.products pr on pr.id = t.product_id
      where t.seller_id = v_seller
        and lower(t.buyer_email) = v_email
        and t.status <> 'cancelled'
      order by t.created_at desc
      limit 50
    ) d
  ), '[]'::json);
end;
$$;

revoke all on function public.subscriber_deliveries(uuid) from public;
grant execute on function public.subscriber_deliveries(uuid) to anon, authenticated;
