-- Enable pgcrypto for gen_random_uuid()
create extension if not exists pgcrypto;

-- ─── available_slots ────────────────────────────────────────────────────────

create table available_slots (
  id               uuid        primary key default gen_random_uuid(),
  created_at       timestamptz not null    default now(),
  date             date        not null,
  start_time       time        not null,
  end_time         time        not null,
  status           text        not null    default 'available'
                               check (status in ('available', 'pending', 'booked')),
  source           text        not null    default 'manual'
                               check (source in ('manual', 'google_calendar')),
  google_event_id  text
);

-- ─── bookings ────────────────────────────────────────────────────────────────

create table bookings (
  id                  uuid        primary key default gen_random_uuid(),
  created_at          timestamptz not null    default now(),
  slot_id             uuid        not null    references available_slots (id),
  client_name         text        not null,
  client_email        text        not null,
  client_phone        text        not null,
  client_instagram    text        not null,
  tattoo_description  text        not null,
  body_placement      text        not null,
  size                text        not null
                                  check (size in ('small', 'medium', 'large', 'full_piece')),
  agreed_price        numeric     not null,
  payment_proof_url   text        not null,
  notes               text,
  status              text        not null    default 'pending'
                                  check (status in ('pending', 'approved', 'rejected', 'cancelled')),
  rejection_reason    text,
  status_token        uuid        not null    default gen_random_uuid(),
  google_event_id     text
);

-- ─── portfolio_images ────────────────────────────────────────────────────────

create table portfolio_images (
  id          uuid        primary key default gen_random_uuid(),
  created_at  timestamptz not null    default now(),
  url         text        not null,
  caption     text,
  category    text        not null,
  sort_order  integer     not null    default 0
);

-- ─── settings ────────────────────────────────────────────────────────────────

create table settings (
  id                    uuid     primary key default gen_random_uuid(),
  studio_name           text     not null default '',
  studio_address        text     not null default '',
  notification_email    text     not null default '',
  default_duration_min  integer  not null default 120,
  google_refresh_token  text,
  instagram_url         text     not null default ''
);

-- Seed the single settings row
insert into settings (id) values (gen_random_uuid());

-- ─── Row Level Security ──────────────────────────────────────────────────────

alter table available_slots   enable row level security;
alter table bookings          enable row level security;
alter table portfolio_images  enable row level security;
alter table settings          enable row level security;

-- available_slots
create policy "anon_select_available_slots"
  on available_slots for select
  to anon
  using (status = 'available');

create policy "auth_all_available_slots"
  on available_slots for all
  to authenticated
  using (true)
  with check (true);

-- bookings
create policy "anon_insert_bookings"
  on bookings for insert
  to anon
  with check (true);

create policy "auth_select_bookings"
  on bookings for select
  to authenticated
  using (true);

create policy "auth_update_bookings"
  on bookings for update
  to authenticated
  using (true)
  with check (true);

create policy "auth_delete_bookings"
  on bookings for delete
  to authenticated
  using (true);

-- portfolio_images
create policy "anon_select_portfolio"
  on portfolio_images for select
  to anon
  using (true);

create policy "auth_all_portfolio"
  on portfolio_images for all
  to authenticated
  using (true)
  with check (true);

-- settings
create policy "auth_select_settings"
  on settings for select
  to authenticated
  using (true);

create policy "auth_update_settings"
  on settings for update
  to authenticated
  using (true)
  with check (true);

-- ─── Storage buckets ─────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values ('payment-proofs', 'payment-proofs', false);

insert into storage.buckets (id, name, public)
values ('portfolio', 'portfolio', true);

-- payment-proofs: anon INSERT, authenticated SELECT
create policy "anon_insert_payment_proofs"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'payment-proofs');

create policy "auth_select_payment_proofs"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'payment-proofs');

-- portfolio: public SELECT, authenticated INSERT/DELETE
create policy "public_select_portfolio"
  on storage.objects for select
  to anon
  using (bucket_id = 'portfolio');

create policy "auth_insert_portfolio"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'portfolio');

create policy "auth_delete_portfolio"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'portfolio');
