alter table products add column if not exists quantity integer not null default 0;

create table if not exists services (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default '',
  description text not null default '',
  price numeric not null default 0,
  currency text not null default 'FCFA',
  image_url text not null default '',
  images text[] not null default '{}',
  duration text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table services enable row level security;

create policy "Users can view their own services"
  on services for select
  using (auth.uid() = user_id);

create policy "Public can view active services"
  on services for select
  using (is_active = true);

create policy "Users can insert their own services"
  on services for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own services"
  on services for update
  using (auth.uid() = user_id);

create policy "Users can delete their own services"
  on services for delete
  using (auth.uid() = user_id);
