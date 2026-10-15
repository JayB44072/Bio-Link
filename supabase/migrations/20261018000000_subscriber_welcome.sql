-- E-mail de bienvenue : garde-fou « un seul envoi par abonné ».
-- À exécuter après 20261015000000_tracking_and_subscribers.sql.

alter table public.page_subscribers add column if not exists welcomed_at timestamptz;

-- Les abonnés déjà inscrits ne reçoivent pas de message de bienvenue rétroactif.
update public.page_subscribers set welcomed_at = created_at where welcomed_at is null;
