-- 관리자 전용 영상 원본 보관함(소식 글 news-trailer.html의 '고화질 원본 받기').
-- 비공개 버킷: 읽기·올리기·지우기 모두 public.is_admin()만. 무료 요금제 파일 한도에 맞춰 조각당 50MB.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('admin-media', 'admin-media', false, 52428800, null)
on conflict (id) do update set public = false, file_size_limit = 52428800;

drop policy if exists admin_media_select on storage.objects;
create policy admin_media_select on storage.objects for select to authenticated
  using (bucket_id = 'admin-media' and public.is_admin());
drop policy if exists admin_media_insert on storage.objects;
create policy admin_media_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'admin-media' and public.is_admin());
drop policy if exists admin_media_delete on storage.objects;
create policy admin_media_delete on storage.objects for delete to authenticated
  using (bucket_id = 'admin-media' and public.is_admin());
