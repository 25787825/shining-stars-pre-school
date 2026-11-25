-- ==========================================================================
-- Shining Stars Pre School & Academy — Faculty Members Schema & RLS
-- Run this in Supabase Dashboard -> SQL Editor. Safe to re-run (idempotent).
-- Only Staff Admins can add, edit, or remove faculty members.
-- ==========================================================================

create table if not exists public.faculty_members (
  id bigint generated always as identity primary key,
  full_name text not null check (char_length(trim(full_name)) between 2 and 120),
  role_title text not null check (char_length(trim(role_title)) between 2 and 180),
  department text not null default 'preschool' check (department in ('leadership', 'preschool', 'primary', 'ssp')),
  bio text not null default '',
  initials text not null default 'SS' check (char_length(trim(initials)) between 1 and 4),
  badge_color text not null default 'sky' check (badge_color in ('gold', 'sky', 'coral', 'mint')),
  sort_order integer not null default 10,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_faculty_members_sort on public.faculty_members (sort_order asc, id asc);

alter table public.faculty_members enable row level security;

revoke all on public.faculty_members from anon, authenticated;
grant select on table public.faculty_members to anon, authenticated;
grant insert, update, delete on table public.faculty_members to authenticated;

drop policy if exists "Public can view active faculty members" on public.faculty_members;
create policy "Public can view active faculty members"
  on public.faculty_members
  for select
  to anon, authenticated
  using (is_active = true);

drop policy if exists "Staff admins can view all faculty members" on public.faculty_members;
create policy "Staff admins can view all faculty members"
  on public.faculty_members
  for select
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can insert faculty members" on public.faculty_members;
create policy "Staff admins can insert faculty members"
  on public.faculty_members
  for insert
  to authenticated
  with check (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can update faculty members" on public.faculty_members;
create policy "Staff admins can update faculty members"
  on public.faculty_members
  for update
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())))
  with check (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));

drop policy if exists "Staff admins can delete faculty members" on public.faculty_members;
create policy "Staff admins can delete faculty members"
  on public.faculty_members
  for delete
  to authenticated
  using (exists (select 1 from public.staff_admins sa where sa.user_id = (select auth.uid())));
