alter table profiles add column if not exists whatsapp_number text not null default '';
alter table profiles add column if not exists whatsapp_enabled boolean not null default false;
alter table profiles add column if not exists whatsapp_greeting text not null default '';
