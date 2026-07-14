alter table products add column if not exists location_lat double precision;
alter table products add column if not exists location_lng double precision;
alter table products add column if not exists location_address text not null default '';

alter table transactions add column if not exists delivery_lat double precision;
alter table transactions add column if not exists delivery_lng double precision;
alter table transactions add column if not exists delivery_address text not null default '';
