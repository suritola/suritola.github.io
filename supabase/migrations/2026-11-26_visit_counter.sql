-- 방문자 수 (오늘·전체). 브라우저마다 무작위 ID 하나(localStorage)를 하루 한 번만 센다. IP·기기 정보는 저장하지 않는다.
-- 표는 직접 읽고 쓸 수 없고(RLS 켜고 정책 없음), 아래 두 함수로만 다룬다. 숫자는 관리자만 본다(board.html#admin).
create table if not exists public.site_visits (
  day date not null,
  vid uuid not null,
  primary key (day, vid)
);
alter table public.site_visits enable row level security;
revoke all on public.site_visits from anon, authenticated;

create or replace function public.log_visit(p_vid uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.site_visits (day, vid)
  values ((now() at time zone 'Asia/Seoul')::date, p_vid)
  on conflict do nothing;
$$;
revoke all on function public.log_visit(uuid) from public;
grant execute on function public.log_visit(uuid) to anon, authenticated;

create or replace function public.visit_stats()
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then raise exception 'admin only'; end if;
  return json_build_object(
    'today', (select count(*) from public.site_visits where day = (now() at time zone 'Asia/Seoul')::date),
    'total', (select count(distinct vid) from public.site_visits)
  );
end;
$$;
revoke all on function public.visit_stats() from public;
grant execute on function public.visit_stats() to authenticated;
