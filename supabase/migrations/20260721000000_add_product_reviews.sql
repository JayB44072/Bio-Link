create table if not exists product_reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  author_name text not null default '',
  rating smallint not null check (rating between 1 and 5),
  comment text not null default '',
  created_at timestamptz not null default now()
);

alter table product_reviews enable row level security;

create policy "Public can view reviews"
  on product_reviews for select
  using (true);

create policy "Public can insert reviews"
  on product_reviews for insert
  with check (true);
