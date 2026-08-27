-- ---------------------------------------------------------------------------
-- Storage for household & member profile photos.
--
-- How to use: Supabase dashboard → SQL Editor → paste this whole file → Run.
-- Separate from schema.sql (already run) so re-running that one never touches
-- storage. Safe to re-run.
--
-- A public "avatars" bucket, one folder per household (named by household_id
-- = auth.uid()) — a household can only write inside its own folder; anyone
-- can read (avatars aren't sensitive, and this keeps <img src> simple with a
-- plain public URL instead of signed-URL plumbing).
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars household write" on storage.objects;
create policy "avatars household write" on storage.objects
  for all using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects
  for select using (bucket_id = 'avatars');
