-- ============================================================
-- Nebro — Database schema for Supabase (Postgres)
-- Run this in the Supabase SQL Editor once, on a fresh project.
-- ============================================================

-- ---------- Roles ----------
-- We piggyback on Supabase's built-in auth.users table and store
-- the app-specific role + profile info in a separate `profiles`
-- table, linked 1:1 by id. This is the standard Supabase pattern.

create type public.app_role as enum ('developer', 'super_admin', 'staff');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role public.app_role not null default 'staff',
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user signs up.
-- New users default to 'staff' — promote them to super_admin/developer
-- manually in the table editor, or via the admin UI once at least one
-- developer/super_admin account exists.
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email), new.email, 'staff');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- Products ----------
create table public.products (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null check (category in ('diagnostic', 'laboratory', 'surgical')),
  description text,
  photo_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- Case studies ----------
create table public.case_studies (
  id bigint generated always as identity primary key,
  title text not null,
  facility text not null,
  summary text,
  published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- ---------- Inquiries (from the public Contact form) ----------
create table public.inquiries (
  id bigint generated always as identity primary key,
  name text not null,
  email text not null,
  facility text,
  category text,
  message text,
  status text not null default 'new' check (status in ('new', 'responded')),
  responded_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------- Notification preferences (per admin user) ----------
create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  email_enabled boolean not null default true,
  sms_enabled boolean not null default false,
  whatsapp_enabled boolean not null default false,
  new_inquiry_frequency text not null default 'immediately'
    check (new_inquiry_frequency in ('immediately', 'hourly', 'daily')),
  stale_reminder_days int not null default 1,
  updated_at timestamptz not null default now()
);

-- ---------- Site content (admin/developer-editable blocks: hero, footer, etc.) ----------
create table public.site_content (
  key text primary key,
  value jsonb not null,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

insert into public.site_content (key, value) values
  ('hero', '{"eyebrow":"Serving Tanzania & East Africa","heading":"Equipping Healthcare with Precision & Trust","subtext":"The premier supplier of certified medical equipment for hospitals, clinics, and laboratories across the region.","accent_words":3}'),
  ('footer', '{"blurb":"Trusted supplier of high-quality medical equipment, serving hospitals, clinics, and healthcare facilities across Tanzania and East Africa.","address":"Katalabo, Lumumba Complex","phone":"+255 621 132 663"}');


create table public.company_settings (
  id int primary key default 1,
  company_name text not null default 'Nebro',
  support_phone text,
  support_email text,
  facebook_url text,
  twitter_url text,
  linkedin_url text,
  whatsapp_number text,
  updated_at timestamptz not null default now(),
  constraint single_row check (id = 1)
);
insert into public.company_settings (id) values (1);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.case_studies enable row level security;
alter table public.inquiries enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.site_content enable row level security;
alter table public.company_settings enable row level security;

-- Helper: current user's role
create function public.current_role() returns public.app_role as $$
  select role from public.profiles where id = auth.uid();
$$ language sql stable security definer;

-- ---- Profiles ----
-- Everyone signed in can see the team list; only developer/super_admin can change roles.
create policy "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
create policy "profiles_update_admins" on public.profiles
  for update using (public.current_role() in ('developer', 'super_admin'));

-- ---- Products ----
-- Public (anon) visitors can only read PUBLISHED products — powers the live website.
create policy "products_public_read_published" on public.products
  for select using (status = 'published');
-- Signed-in staff can read everything (including drafts) in the admin panel.
create policy "products_staff_read_all" on public.products
  for select using (auth.role() = 'authenticated');
-- Only signed-in users can write; all three roles can manage products.
create policy "products_staff_write" on public.products
  for insert with check (auth.role() = 'authenticated');
create policy "products_staff_update" on public.products
  for update using (auth.role() = 'authenticated');
create policy "products_admin_delete" on public.products
  for delete using (public.current_role() in ('developer', 'super_admin'));

-- ---- Case studies ---- (same pattern as products)
create policy "case_studies_public_read_published" on public.case_studies
  for select using (published = true);
create policy "case_studies_staff_read_all" on public.case_studies
  for select using (auth.role() = 'authenticated');
create policy "case_studies_staff_write" on public.case_studies
  for insert with check (auth.role() = 'authenticated');
create policy "case_studies_staff_update" on public.case_studies
  for update using (auth.role() = 'authenticated');
create policy "case_studies_admin_delete" on public.case_studies
  for delete using (public.current_role() in ('developer', 'super_admin'));

-- ---- Inquiries ----
-- Anyone (anonymous website visitor) can INSERT a new inquiry (submit the contact form).
create policy "inquiries_public_insert" on public.inquiries
  for insert with check (true);
-- Only signed-in staff can read/update inquiries (this is where customer PII lives).
create policy "inquiries_staff_read" on public.inquiries
  for select using (auth.role() = 'authenticated');
create policy "inquiries_staff_update" on public.inquiries
  for update using (auth.role() = 'authenticated');

-- ---- Notification preferences ---- (each user manages their own)
create policy "notif_prefs_own" on public.notification_preferences
  for all using (user_id = auth.uid());

-- ---- Site content ----
-- Public visitors read this to render the live Hero/Footer text.
create policy "site_content_public_read" on public.site_content
  for select using (true);
-- Any signed-in staff member can update page content (not just admins —
-- this is copy editing, lower risk than deleting products or changing roles).
create policy "site_content_staff_write" on public.site_content
  for all using (auth.role() = 'authenticated');

-- ---- Company settings ----
create policy "company_settings_public_read" on public.company_settings
  for select using (true);
create policy "company_settings_admin_write" on public.company_settings
  for update using (public.current_role() in ('developer', 'super_admin'));

-- ============================================================
-- Storage bucket for product photos (run in SQL editor too —
-- Supabase exposes storage.buckets as a normal table)
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-photos', 'product-photos', true)
on conflict (id) do nothing;

create policy "product_photos_public_read" on storage.objects
  for select using (bucket_id = 'product-photos');
create policy "product_photos_staff_upload" on storage.objects
  for insert with check (bucket_id = 'product-photos' and auth.role() = 'authenticated');
