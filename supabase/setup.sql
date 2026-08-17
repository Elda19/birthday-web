-- ============================================================================
--  BIRTHDAY WEBSITE - COMPLETE DATABASE SETUP
-- ----------------------------------------------------------------------------
--  Paste this whole file into the Supabase SQL Editor and press RUN.
--  It is safe to run more than once.
--
--  It creates:
--    * settings / song / memories tables (the content)
--    * an admins table (who is allowed to edit)
--    * row level security so visitors can READ but only admins can WRITE
--    * a public "media" storage bucket for photos, videos and audio
--
--  AFTER running this, do STEP 2 at the bottom to make yourself the admin.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- admins ----
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  email      text,
  created_at timestamptz not null default now()
);

-- Helper used by every write policy. SECURITY DEFINER so the policy can read
-- the admins table without the caller needing read access to it.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- -------------------------------------------------------------- settings ----
create table if not exists public.settings (
  id                       int primary key default 1 check (id = 1),

  friend_name              text not null default '',
  birthday_date            text not null default '',

  intro_title              text not null default '',
  intro_message            text not null default '',
  intro_emoticon           text not null default '',
  intro_button_label       text not null default 'Next!! ^w^',
  intro_media_url          text,
  intro_media_alt          text not null default '',

  accent_color             text not null default '#2563eb',

  memories_heading         text not null default 'Memories 📸',
  memories_subheading      text not null default '',

  song_heading             text not null default 'A Song Just For You',

  letter_heading           text not null default 'A Letter for You 💌',
  letter_card_url          text,
  letter_card_alt          text not null default '',
  letter_card_caption      text not null default 'Happy Birthday!',
  letter_greeting          text not null default '',
  letter_text              text not null default '',
  letter_signature         text not null default '',

  finale_text              text not null default '',
  finale_emojis            text not null default '💙 🎂 💙',
  finale_celebrate_label   text not null default 'Celebrate 🎉',
  finale_start_over_label  text not null default 'Start Over 💙',
  footer_text              text not null default '',

  background_audio_url     text,

  updated_at               timestamptz not null default now()
);

-- ------------------------------------------------------------------ song ----
create table if not exists public.song (
  id               int primary key default 1 check (id = 1),
  title            text not null default '',
  artist           text not null default '',
  source_type      text not null default 'none'
                   check (source_type in ('none', 'youtube', 'spotify', 'file')),
  source_url       text not null default '',
  personal_message text not null default '',
  updated_at       timestamptz not null default now()
);

-- -------------------------------------------------------------- memories ----
create table if not exists public.memories (
  id             uuid primary key default gen_random_uuid(),
  media_type     text not null check (media_type in ('image', 'video')),
  media_url      text not null,
  poster_url     text,
  storage_path   text,
  poster_path    text,
  alt_text       text not null default '',
  caption        text not null default '',
  location       text not null default '',
  memory_date    text not null default '',
  autoplay_muted boolean not null default false,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

create index if not exists memories_sort_order_idx on public.memories (sort_order);

-- Make sure the single content rows exist.
insert into public.settings (id) values (1) on conflict (id) do nothing;
insert into public.song (id) values (1) on conflict (id) do nothing;

-- --------------------------------------------------- keep updated_at fresh --
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists settings_touch on public.settings;
create trigger settings_touch before update on public.settings
  for each row execute function public.touch_updated_at();

drop trigger if exists song_touch on public.song;
create trigger song_touch before update on public.song
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  ROW LEVEL SECURITY
--  Visitors: read only. Admins: full control. Nobody can touch the admins list
--  from the website at all.
-- ============================================================================

alter table public.settings enable row level security;
alter table public.song     enable row level security;
alter table public.memories enable row level security;
alter table public.admins   enable row level security;

-- settings ------------------------------------------------------------------
drop policy if exists "settings public read"  on public.settings;
drop policy if exists "settings admin write"  on public.settings;
drop policy if exists "settings admin insert" on public.settings;

create policy "settings public read"  on public.settings for select using (true);
create policy "settings admin write"  on public.settings for update
  using (public.is_admin()) with check (public.is_admin());
create policy "settings admin insert" on public.settings for insert
  with check (public.is_admin());

-- song ----------------------------------------------------------------------
drop policy if exists "song public read"  on public.song;
drop policy if exists "song admin write"  on public.song;
drop policy if exists "song admin insert" on public.song;

create policy "song public read"  on public.song for select using (true);
create policy "song admin write"  on public.song for update
  using (public.is_admin()) with check (public.is_admin());
create policy "song admin insert" on public.song for insert
  with check (public.is_admin());

-- memories ------------------------------------------------------------------
drop policy if exists "memories public read"  on public.memories;
drop policy if exists "memories admin insert" on public.memories;
drop policy if exists "memories admin update" on public.memories;
drop policy if exists "memories admin delete" on public.memories;

create policy "memories public read"  on public.memories for select using (true);
create policy "memories admin insert" on public.memories for insert
  with check (public.is_admin());
create policy "memories admin update" on public.memories for update
  using (public.is_admin()) with check (public.is_admin());
create policy "memories admin delete" on public.memories for delete
  using (public.is_admin());

-- admins --------------------------------------------------------------------
-- Deliberately no policies: the table is unreachable from the website.
-- Only the SQL editor (which bypasses RLS) can change who is an admin.
drop policy if exists "admins no access" on public.admins;

-- ============================================================================
--  STORAGE: a public bucket called "media"
--  Anyone can view the files (the birthday site needs to show them).
--  Only admins can upload, replace or delete.
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit)
values ('media', 'media', true, 209715200)   -- 200 MB per file
on conflict (id) do update
  set public = true, file_size_limit = 209715200;

drop policy if exists "media public read"   on storage.objects;
drop policy if exists "media admin insert"  on storage.objects;
drop policy if exists "media admin update"  on storage.objects;
drop policy if exists "media admin delete"  on storage.objects;

create policy "media public read" on storage.objects for select
  using (bucket_id = 'media');

create policy "media admin insert" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_admin());

create policy "media admin update" on storage.objects for update
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "media admin delete" on storage.objects for delete
  using (bucket_id = 'media' and public.is_admin());

-- ============================================================================
--  STEP 2 - MAKE YOURSELF THE ADMIN
-- ----------------------------------------------------------------------------
--  1. Go to  Authentication -> Users -> Add user -> Create new user
--     Enter your email and a password. Tick "Auto Confirm User".
--  2. Change the email below to that same email and run this one line:
--
--        select public.grant_admin('you@example.com');
--
--  Anyone in the admins table can log in at /admin. Nobody else can write
--  anything, even if they somehow reach the admin page.
-- ============================================================================

create or replace function public.grant_admin(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then
    return 'No user with that email yet. Create it under Authentication -> Users first.';
  end if;
  insert into public.admins (user_id, email) values (uid, lower(target_email))
    on conflict (user_id) do update set email = excluded.email;
  return 'Done. ' || target_email || ' can now log in at /admin';
end $$;

revoke all on function public.grant_admin(text) from public, anon, authenticated;

-- Optional: remove an admin again.
create or replace function public.revoke_admin(target_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.admins where lower(email) = lower(target_email);
  return 'Removed ' || target_email;
end $$;

revoke all on function public.revoke_admin(text) from public, anon, authenticated;
