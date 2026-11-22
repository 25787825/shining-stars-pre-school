-- ==========================================================================
-- Shining Stars Pre School & Academy — Supabase Postgres Schema & RLS
-- Project Ref: ctrdlxdipgynkptvwhdu
-- Run this in your Supabase Dashboard -> SQL Editor.
-- ==========================================================================

-- 1. Campus Tour Bookings
create table if not exists public.tour_bookings (
  id bigint generated always as identity primary key,
  reference_code text not null unique,
  parent_name text not null check (char_length(trim(parent_name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 6 and 40),
  email text not null check (position('@' in email) > 1 and char_length(email) <= 160),
  child_name text not null check (char_length(trim(child_name)) between 1 and 120),
  program text not null check (char_length(trim(program)) between 2 and 80),
  preferred_date date not null,
  notes text default '',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists idx_tour_bookings_created_at on public.tour_bookings (created_at desc);

-- 2. Admissions Applications / Inquiries
create table if not exists public.admissions_applications (
  id bigint generated always as identity primary key,
  reference_code text not null unique,
  parent_name text not null check (char_length(trim(parent_name)) between 2 and 120),
  phone text not null check (char_length(trim(phone)) between 6 and 40),
  email text not null check (position('@' in email) > 1 and char_length(email) <= 160),
  child_name text not null check (char_length(trim(child_name)) between 1 and 120),
  date_of_birth date not null,
  program text not null check (char_length(trim(program)) between 2 and 80),
  previous_school text default '',
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'accepted', 'waitlisted')),
  created_at timestamptz not null default now()
);

create index if not exists idx_admissions_applications_created_at on public.admissions_applications (created_at desc);

-- 3. Contact Messages
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  reference_code text not null unique,
  sender_name text not null check (char_length(trim(sender_name)) between 2 and 120),
  email text not null check (position('@' in email) > 1 and char_length(email) <= 160),
  phone text default '',
  subject text not null check (char_length(trim(subject)) between 2 and 160),
  message text not null check (char_length(trim(message)) between 5 and 2000),
  status text not null default 'new' check (status in ('new', 'replied', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_messages_created_at on public.contact_messages (created_at desc);

-- 4. Monthly Newsletter Subscribers
create table if not exists public.newsletter_subscribers (
  id bigint generated always as identity primary key,
  email text not null unique check (position('@' in email) > 1 and char_length(email) <= 160),
  subscribed_at timestamptz not null default now()
);

create index if not exists idx_newsletter_subscribers_subscribed_at on public.newsletter_subscribers (subscribed_at desc);

-- 5. Staff Admin Allowlist (controls access to admin.html)
create table if not exists public.staff_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  created_at timestamptz not null default now()
);

-- ==========================================================================
-- Security: Row-Level Security (RLS) & Explicit Data API Grants
-- 1) Public visitors (anon) can ONLY INSERT submissions & signups.
-- 2) Only authenticated users listed in public.staff_admins can SELECT/UPDATE.
-- ==========================================================================

alter table public.tour_bookings enable row level security;
alter table public.admissions_applications enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.staff_admins enable row level security;

revoke all on public.tour_bookings from anon, authenticated;
revoke all on public.admissions_applications from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
revoke all on public.newsletter_subscribers from anon, authenticated;
revoke all on public.staff_admins from anon, authenticated;

-- Public form insert grants
grant insert on table public.tour_bookings to anon, authenticated;
grant insert on table public.admissions_applications to anon, authenticated;
grant insert on table public.contact_messages to anon, authenticated;
grant insert on table public.newsletter_subscribers to anon, authenticated;

-- Authenticated staff read/update grants (still gated by RLS below)
grant select, update on table public.tour_bookings to authenticated;
grant select, update on table public.admissions_applications to authenticated;
grant select, update on table public.contact_messages to authenticated;
grant select on table public.newsletter_subscribers to authenticated;
grant select on table public.staff_admins to authenticated;

-- Public INSERT policies
drop policy if exists "Allow public tour booking submissions" on public.tour_bookings;
create policy "Allow public tour booking submissions"
  on public.tour_bookings
  for insert
  to anon, authenticated
  with check (status = 'pending');

drop policy if exists "Allow public admissions inquiry submissions" on public.admissions_applications;
create policy "Allow public admissions inquiry submissions"
  on public.admissions_applications
  for insert
  to anon, authenticated
  with check (status = 'submitted');

drop policy if exists "Allow public contact message submissions" on public.contact_messages;
create policy "Allow public contact message submissions"
  on public.contact_messages
  for insert
  to anon, authenticated
  with check (status = 'new');

drop policy if exists "Allow public newsletter signups" on public.newsletter_subscribers;
create policy "Allow public newsletter signups"
  on public.newsletter_subscribers
  for insert
  to anon, authenticated
  with check (char_length(trim(email)) > 3);

-- Staff admin self-check policy
drop policy if exists "Allow staff to read own admin record" on public.staff_admins;
create policy "Allow staff to read own admin record"
  on public.staff_admins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- Staff admin read/update policies
drop policy if exists "Staff admins can read tour bookings" on public.tour_bookings;
create policy "Staff admins can read tour bookings"
  on public.tour_bookings
  for select
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can update tour bookings" on public.tour_bookings;
create policy "Staff admins can update tour bookings"
  on public.tour_bookings
  for update
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())))
  with check (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can read admissions" on public.admissions_applications;
create policy "Staff admins can read admissions"
  on public.admissions_applications
  for select
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can update admissions" on public.admissions_applications;
create policy "Staff admins can update admissions"
  on public.admissions_applications
  for update
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())))
  with check (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can read contact messages" on public.contact_messages;
create policy "Staff admins can read contact messages"
  on public.contact_messages
  for select
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can update contact messages" on public.contact_messages;
create policy "Staff admins can update contact messages"
  on public.contact_messages
  for update
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())))
  with check (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can read newsletter subscribers" on public.newsletter_subscribers;
create policy "Staff admins can read newsletter subscribers"
  on public.newsletter_subscribers
  for select
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));
