create table public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.portfolio_admins enable row level security;
revoke all on public.portfolio_admins from anon, authenticated;
grant select on public.portfolio_admins to authenticated;
create policy "Admins can read their own membership" on public.portfolio_admins
for select to authenticated using (user_id = (select auth.uid()));

create table public.portfolio_content (
  id text primary key check (id = 'main'),
  data jsonb not null check (jsonb_typeof(data) = 'object' and octet_length(data::text) <= 1048576),
  updated_at timestamptz not null default now()
);
alter table public.portfolio_content enable row level security;
revoke all on public.portfolio_content from anon, authenticated;
grant select on public.portfolio_content to anon, authenticated;
grant insert, update on public.portfolio_content to authenticated;
create policy "Published portfolio is public" on public.portfolio_content
for select to anon, authenticated using (id = 'main');
create policy "Only portfolio admins insert content" on public.portfolio_content
for insert to authenticated with check (
  id = 'main' and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
);
create policy "Only portfolio admins update content" on public.portfolio_content
for update to authenticated using (
  exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
) with check (
  id = 'main' and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-media', 'portfolio-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

create policy "Only portfolio admins upload their media" on storage.objects
for insert to authenticated with check (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
);
create policy "Admins can inspect their own media" on storage.objects
for select to authenticated using (
  bucket_id = 'portfolio-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (select 1 from public.portfolio_admins where user_id = (select auth.uid()))
);
