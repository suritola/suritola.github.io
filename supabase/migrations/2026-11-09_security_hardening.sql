-- =====================================================================================
--  2026-11-09 보안 보강 (이미 schema.sql 을 실행한 운영 DB 에 한 번 실행)
--  SQL Editor → New query → 이 파일 전체 붙여 넣기 → Run. 여러 번 실행해도 안전하다.
--  같은 내용이 schema.sql 에도 반영되어 있다(새로 까는 DB 는 schema.sql 만 실행).
--
--  1. 작성 시각 위조 막기: 글·댓글·신고의 created_at 을 서버 시각으로 고정(옛 날짜로 넣어 도배 제한을 피하던 길),
--     글의 updated_at, 신고의 resolved_at 도 넣을 때 비운다.
--  2. 도배 제한 강화: 1분 + 하루 한도, 신고에도 적용, 동시 요청 직렬화.
--  3. 닉네임 서버 검사: 보이지 않는 글자·방향 바꿈 글자 제거, = + - @ 로 시작 금지(CSV 수식 주입),
--     운영자·관리자·민공방·admin·staff·official 같은 사칭 예약어 금지(운영자 계정은 예외).
--  4. 쓰지 않는 표 권한 회수: anon 의 쓰기, 모두의 truncate·references·trigger.
-- =====================================================================================

-- ---------- 1. 넣을 때 시각 고정 ---------------------------------------------------------
create or replace function public.stamp_insert()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.created_at := now();
  if tg_table_name = 'posts' then
    new.updated_at := null;
  elsif tg_table_name = 'reports' then
    new.resolved_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists posts_stamp_insert on public.posts;
create trigger posts_stamp_insert before insert on public.posts
  for each row execute function public.stamp_insert();
drop trigger if exists comments_stamp_insert on public.comments;
create trigger comments_stamp_insert before insert on public.comments
  for each row execute function public.stamp_insert();
drop trigger if exists reports_stamp_insert on public.reports;
create trigger reports_stamp_insert before insert on public.reports
  for each row execute function public.stamp_insert();

-- ---------- 2. 도배 제한: rate_limit(1분 한도, 하루 한도, 글쓴이 열 이름) ---------------------
create or replace function public.rate_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  per_min int  := tg_argv[0]::int;
  per_day int  := tg_argv[1]::int;
  col     text := coalesce(tg_argv[2], 'author_id');
  who     uuid := (to_jsonb(new) ->> col)::uuid;
  n_min   int;
  n_day   int;
begin
  -- 같은 사람이 동시에 여러 요청을 보내 한도를 함께 통과하지 않도록 한 사람씩 줄 세운다.
  perform pg_advisory_xact_lock(hashtext(tg_table_name || ':' || who::text));
  execute format(
    'select count(*) filter (where created_at > now() - interval ''1 minute''), count(*)
       from %I.%I where %I = $1 and created_at > now() - interval ''1 day''',
    tg_table_schema, tg_table_name, col)
    into n_min, n_day using who;
  if n_min >= per_min then
    raise exception 'rate_limit: 1분에 %개까지만 쓸 수 있습니다. 잠시 후 다시 시도해 주세요.', per_min
      using errcode = 'P0001';
  end if;
  if per_day is not null and n_day >= per_day then
    raise exception 'rate_limit: 하루에 %개까지만 쓸 수 있습니다. 내일 다시 시도해 주세요.', per_day
      using errcode = 'P0001';
  end if;
  return new;
end;
$$;
create index if not exists posts_author_created_idx    on public.posts (author_id, created_at);
create index if not exists comments_author_created_idx on public.comments (author_id, created_at);
create index if not exists reports_reporter_created_idx on public.reports (reporter_id, created_at);
drop trigger if exists posts_rate_limit on public.posts;
create trigger posts_rate_limit before insert on public.posts
  for each row execute function public.rate_limit('3', '20', 'author_id');
drop trigger if exists comments_rate_limit on public.comments;
create trigger comments_rate_limit before insert on public.comments
  for each row execute function public.rate_limit('10', '100', 'author_id');
drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit before insert on public.reports
  for each row execute function public.rate_limit('5', '20', 'reporter_id');

-- ---------- 3. 닉네임 서버 검사 ----------------------------------------------------------
-- 보이지 않는 글자(제어 문자, 폭 없는 공백, 방향 바꿈, 한글 채움 문자)를 지우고, 공백을 하나로 줄이고,
-- 앞쪽의 = + - @ 를 뗀다(관리자 CSV 를 시트에 붙일 때 수식으로 실행되지 않게).
create or replace function public.clean_nickname(s text)
returns text
language sql
immutable
set search_path = public
as $$
  select ltrim(btrim(regexp_replace(
           regexp_replace(coalesce(s, ''), '[\u0001-\u001f\u007f-\u009f\u00ad\u061c\u115f\u1160\u180e\u200b-\u200f\u202a-\u202e\u2060-\u206f\u3164\ufeff\uffa0]', '', 'g'),
           '\s+', ' ', 'g')), '=+-@ ');
$$;
-- 운영자 사칭 예약어. 공백·밑줄·점·하이픈을 빼고 본다(예: "운 영 자", "ad_min").
create or replace function public.nickname_reserved(s text)
returns boolean
language sql
immutable
set search_path = public
as $$
  select regexp_replace(lower(coalesce(s, '')), '[\s_.-]', '', 'g')
         ~ '(운영자|관리자|운영진|운영팀|민공방|mingongbang|admin|staff|moderator|official|공식)';
$$;

create or replace function public.profiles_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.nickname := public.clean_nickname(new.nickname);
  if new.role <> 'admin' and public.nickname_reserved(new.nickname) then
    raise exception '운영자·관리자·민공방·admin·staff 같은 말은 닉네임에 쓸 수 없습니다. / Words like admin, staff or official cannot be used in a nickname.'
      using errcode = 'P0001';
  end if;
  if tg_op = 'UPDATE' and new.newsletter_opt_in is distinct from old.newsletter_opt_in then
    new.newsletter_updated_at := now();
  end if;
  return new;
end;
$$;
drop trigger if exists profiles_before_update on public.profiles;
create trigger profiles_before_update
  before insert or update on public.profiles
  for each row execute function public.profiles_before_update();

-- 가입 트리거: 같은 정리를 먼저 하고, 예약어·너무 짧은 이름은 '손님' 으로 바꿔 가입 자체는 실패하지 않게 한다.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  base text;
  nick text;
  n    int := 0;
begin
  base := left(public.clean_nickname(coalesce(
            nullif(public.clean_nickname(new.raw_user_meta_data ->> 'nickname'), ''),
            nullif(public.clean_nickname(new.raw_user_meta_data ->> 'name'), ''),
            nullif(public.clean_nickname(new.raw_user_meta_data ->> 'full_name'), ''),
            nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
            '손님')), 20);
  base := btrim(base);
  if char_length(base) < 2 or public.nickname_reserved(base) then
    base := '손님';
  end if;
  nick := base;
  while exists (select 1 from public.profiles where lower(nickname) = lower(nick)) loop
    n := n + 1;
    nick := left(base, 20 - char_length(n::text) - 1) || '_' || n;
  end loop;

  insert into public.profiles (id, nickname, newsletter_opt_in, agreed_terms_at)
  values (
    new.id,
    nick,
    coalesce((new.raw_user_meta_data ->> 'newsletter_opt_in')::boolean, false),
    now()
  );
  return new;
end;
$$;

-- ---------- 4. 쓰지 않는 권한 회수 (방어 겹치기) -------------------------------------------
-- anon 은 읽기만 한다(글·댓글·배지·공개 프로필). truncate 는 RLS 를 거치지 않으므로 아무에게도 주지 않는다.
revoke insert, update, delete on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- =====================================================================================
--  확인용 (Security Advisor 대신 SQL 로 보기) — 필요할 때 한 줄씩 실행
-- =====================================================================================
-- RLS 가 꺼진 public 표 (결과가 없어야 한다)
--   select c.relname from pg_class c where c.relnamespace = 'public'::regnamespace and c.relkind = 'r' and not c.relrowsecurity;
-- search_path 가 고정되지 않은 public 함수 (결과가 없어야 한다)
--   select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace and (p.proconfig is null or not exists (select 1 from unnest(p.proconfig) c where c like 'search_path=%'));
-- anon 이 실행할 수 있는 security definer 함수 (is_admin 만 나와야 한다. 트리거 함수는 RPC 로 부를 수 없다)
--   select p.proname from pg_proc p where p.pronamespace = 'public'::regnamespace and p.prosecdef and has_function_privilege('anon', p.oid, 'execute') and p.prorettype <> 'trigger'::regtype;
-- anon 의 표 권한 (SELECT 만 나와야 한다)
--   select table_name, privilege_type from information_schema.role_table_grants where grantee = 'anon' and table_schema = 'public' order by 1, 2;
-- 소유자 권한으로 도는 뷰 (public_profiles 하나 — 의도한 것)
--   select relname, reloptions from pg_class where relnamespace = 'public'::regnamespace and relkind = 'v';
-- 정책 전체
--   select tablename, policyname, cmd, roles, qual, with_check from pg_policies where schemaname = 'public' order by 1, 2;
