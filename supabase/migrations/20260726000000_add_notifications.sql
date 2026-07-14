-- Table de notifications in-app
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'order' check (type in ('order', 'delivery', 'system')),
  title text not null,
  message text not null,
  is_read boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Index pour charger rapidement les notifications d'un utilisateur
create index if not exists idx_notifications_user_id on notifications(user_id, created_at desc);

-- RLS : chaque utilisateur ne voit que ses propres notifications
alter table notifications enable row level security;

create policy "Users read own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update
  using (auth.uid() = user_id);

-- Permettre l'insertion publique (le client acheteur n'est pas authentifié)
create policy "Anyone can insert notifications"
  on notifications for insert
  with check (true);
