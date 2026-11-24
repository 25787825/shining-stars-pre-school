-- ==========================================================================
-- Shining Stars Pre School & Academy — Parent Reviews & Suggestions Schema
-- Run this in Supabase Dashboard -> SQL Editor. Safe to re-run (idempotent).
-- ==========================================================================

create table if not exists public.parent_reviews (
  id bigint generated always as identity primary key,
  reference_code text not null unique,
  parent_name text not null check (char_length(trim(parent_name)) between 2 and 120),
  email text not null check (position('@' in email) > 1 and char_length(email) <= 160),
  phone text not null check (char_length(trim(phone)) between 6 and 40),
  child_program text not null check (char_length(trim(child_program)) between 2 and 80),
  progress_stars integer not null check (progress_stars between 1 and 5),
  review_text text not null check (char_length(trim(review_text)) between 5 and 2000),
  suggestions text default '',
  is_approved boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_parent_reviews_created_at on public.parent_reviews (created_at desc);

alter table public.parent_reviews enable row level security;

revoke all on public.parent_reviews from anon, authenticated;

-- Public visitors can INSERT reviews, and can only SELECT non-private columns
-- (email and phone remain strictly private to authenticated staff_admins).
grant insert on table public.parent_reviews to anon, authenticated;
grant select (id, parent_name, child_program, progress_stars, review_text, is_approved, created_at)
  on table public.parent_reviews to anon;

-- Authenticated staff admins get full table SELECT/UPDATE/DELETE (gated by RLS below)
grant select, update, delete on table public.parent_reviews to authenticated;

drop policy if exists "Allow public parent review submissions" on public.parent_reviews;
create policy "Allow public parent review submissions"
  on public.parent_reviews
  for insert
  to anon, authenticated
  with check (progress_stars between 1 and 5 and is_approved = true);

drop policy if exists "Public can view approved parent reviews" on public.parent_reviews;
create policy "Public can view approved parent reviews"
  on public.parent_reviews
  for select
  to anon, authenticated
  using (is_approved = true);

drop policy if exists "Staff admins can view all parent reviews" on public.parent_reviews;
create policy "Staff admins can view all parent reviews"
  on public.parent_reviews
  for select
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can update parent reviews" on public.parent_reviews;
create policy "Staff admins can update parent reviews"
  on public.parent_reviews
  for update
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())))
  with check (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can delete parent reviews" on public.parent_reviews;
create policy "Staff admins can delete parent reviews"
  on public.parent_reviews
  for delete
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));
