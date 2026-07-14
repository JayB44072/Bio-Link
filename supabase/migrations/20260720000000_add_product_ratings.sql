alter table products add column if not exists avg_rating numeric(2,1) not null default 0;
alter table products add column if not exists ratings_count integer not null default 0;
