-- =====================================================================================
--  민공방 게임즈 회원 기능 — Supabase 스키마 (한 번만 실행하면 끝)
--
--  실행 방법
--    1. Supabase 대시보드 → 왼쪽 메뉴 SQL Editor → New query
--    2. 이 파일 전체를 붙여 넣고 Run (오른쪽 아래). "Success. No rows returned" 가 나오면 끝.
--    3. 사이트에서 본인 계정으로 먼저 가입한 뒤, 아래 한 줄을 이메일만 바꿔 SQL Editor 에서 실행하면 첫 관리자가 된다.
--
--       update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'mingeunb0@gmail.com');
--
--  다시 처음부터 깔고 싶으면 맨 아래 "초기화" 블록의 주석을 풀어 먼저 실행한다.
--
--  구조
--    profiles      회원 프로필(닉네임·역할·소식 메일 동의). 이메일·비밀번호는 auth.users 에만 있다.
--    public_profiles  다른 회원에게 보여도 되는 4개 열(id, nickname, role, created_at)만 담은 뷰.
--    posts / comments / reports / badges / user_badges
--  보안
--    모든 테이블 RLS 켬. 관리자 판정은 public.is_admin() (security definer, search_path 고정).
--    profiles 는 본인·관리자만 읽고, 본인은 nickname·newsletter_opt_in 두 열만 고칠 수 있다(열 단위 grant). role 은 SQL Editor 에서만 바꾼다.
--    도배 제한: 글 1분 3개·하루 20개, 댓글 1분 10개·하루 100개, 신고 1분 5개·하루 20개 (트리거, 작성 시각은 서버가 고정).
--    닉네임은 서버에서 보이지 않는 글자를 지우고 운영자 사칭 예약어를 막는다. 배지는 트리거로만 붙고 클라이언트는 쓸 수 없다.
-- =====================================================================================

-- ---------- 1. 관리자 판정 ----------------------------------------------------------
-- RLS 정책 안에서 profiles 를 다시 읽어도 재귀가 생기지 않도록 security definer 로 만든다.
-- plpgsql 은 본문을 실행할 때 검사하므로 profiles 테이블보다 먼저 만들어도 된다(language sql 은 만들 때 검사해 실패).
create or replace function public.is_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
end;
$$;

-- ---------- 2. 프로필 ---------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  nickname              text not null check (char_length(nickname) between 2 and 20),
  role                  text not null default 'user' check (role in ('user', 'admin')),
  newsletter_opt_in     boolean not null default false,
  newsletter_updated_at timestamptz,
  agreed_terms_at       timestamptz,
  created_at            timestamptz not null default now()
);
create unique index if not exists profiles_nickname_key on public.profiles (lower(nickname));

alter table public.profiles enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- 열 단위 권한: 본인이 고칠 수 있는 열은 두 개뿐. insert 는 트리거만, delete 는 RPC(delete_my_account)만 한다.
revoke all on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (nickname, newsletter_opt_in) on table public.profiles to authenticated;

-- 공개 프로필 뷰: 게시판에서 글쓴이 이름을 보여 주기 위한 4개 열. 뷰는 만든 사람(postgres) 권한으로 읽어 RLS 를 지나치므로
-- 여기 넣는 열은 "누구에게 보여도 되는 것"만 둔다. (Supabase 린터의 security_definer_view 경고는 의도한 것.)
create or replace view public.public_profiles
  with (security_invoker = false)
as
  select id, nickname, role, created_at from public.profiles;
grant select on public.public_profiles to anon, authenticated;

-- 가입하면 프로필을 자동으로 만든다. 닉네임은 가입 메타데이터, 구글 로그인은 구글 이름을 쓴다.
-- 닉네임이 겹치면 뒤에 숫자를 붙여서 가입 자체는 실패하지 않게 한다(프로필에서 바꿀 수 있다).
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

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- 3. 게시글 ---------------------------------------------------------------
create table if not exists public.posts (
  id         bigint generated always as identity primary key,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  category   text not null check (category in ('notice', 'free', 'bug')),
  game       text check (game in ('soulsaver', 'deepfold')),
  title      text not null check (char_length(title) between 1 and 100),
  body       text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_category_created_idx on public.posts (category, created_at desc);

alter table public.posts enable row level security;

drop policy if exists posts_select_all on public.posts;
create policy posts_select_all on public.posts
  for select
  using (true);

drop policy if exists posts_insert_own on public.posts;
create policy posts_insert_own on public.posts
  for insert to authenticated
  with check (author_id = auth.uid() and (category <> 'notice' or public.is_admin()));

drop policy if exists posts_update_own_or_admin on public.posts;
create policy posts_update_own_or_admin on public.posts
  for update to authenticated
  using (author_id = auth.uid() or public.is_admin())
  with check ((author_id = auth.uid() or public.is_admin()) and (category <> 'notice' or public.is_admin()));

drop policy if exists posts_delete_own_or_admin on public.posts;
create policy posts_delete_own_or_admin on public.posts
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 수정 시각을 남기고, 글쓴이·작성 시각은 바꿀 수 없게 고정한다.
create or replace function public.posts_before_update()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.author_id  := old.author_id;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists posts_before_update on public.posts;
create trigger posts_before_update
  before update on public.posts
  for each row execute function public.posts_before_update();

-- ---------- 4. 댓글 -----------------------------------------------------------------
create table if not exists public.comments (
  id         bigint generated always as identity primary key,
  post_id    bigint not null references public.posts (id) on delete cascade,
  author_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists comments_post_idx on public.comments (post_id, created_at);

alter table public.comments enable row level security;

drop policy if exists comments_select_all on public.comments;
create policy comments_select_all on public.comments
  for select
  using (true);

drop policy if exists comments_insert_own on public.comments;
create policy comments_insert_own on public.comments
  for insert to authenticated
  with check (author_id = auth.uid());

drop policy if exists comments_delete_own_or_admin on public.comments;
create policy comments_delete_own_or_admin on public.comments
  for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

revoke update on table public.comments from anon, authenticated;   -- 댓글 수정 기능은 없다

-- ---------- 5. 도배 제한 (1분·하루 한도) + 작성 시각 고정 ------------------------------
-- rate_limit(1분 한도, 하루 한도, 글쓴이 열 이름). 신고 트리거는 reports 표를 만든 뒤 6장에서 붙인다.
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
drop trigger if exists posts_rate_limit on public.posts;
create trigger posts_rate_limit before insert on public.posts
  for each row execute function public.rate_limit('3', '20', 'author_id');
drop trigger if exists comments_rate_limit on public.comments;
create trigger comments_rate_limit before insert on public.comments
  for each row execute function public.rate_limit('10', '100', 'author_id');

-- 넣을 때 created_at 을 서버 시각으로 고정한다(옛 날짜로 넣어 도배 제한을 피하지 못하게). 글의 updated_at, 신고의 resolved_at 도 비운다.
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
-- ---------- 6. 신고 -----------------------------------------------------------------
create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id     bigint references public.posts (id) on delete cascade,
  comment_id  bigint references public.comments (id) on delete cascade,
  reason      text not null check (char_length(reason) between 1 and 500),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  constraint reports_target_check check (post_id is not null or comment_id is not null)
);
create index if not exists reports_open_idx on public.reports (created_at desc) where resolved_at is null;

alter table public.reports enable row level security;

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated
  with check (reporter_id = auth.uid());

drop policy if exists reports_select_admin on public.reports;
create policy reports_select_admin on public.reports
  for select to authenticated
  using (public.is_admin());

drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists reports_reporter_created_idx on public.reports (reporter_id, created_at);
drop trigger if exists reports_rate_limit on public.reports;
create trigger reports_rate_limit before insert on public.reports
  for each row execute function public.rate_limit('5', '20', 'reporter_id');
drop trigger if exists reports_stamp_insert on public.reports;
create trigger reports_stamp_insert before insert on public.reports
  for each row execute function public.stamp_insert();

-- ---------- 7. 배지 (서버 규칙으로만 부여) --------------------------------------------
create table if not exists public.badges (
  code    text primary key,
  name_ko text not null,
  name_en text not null,
  desc_ko text not null,
  desc_en text not null,
  sort    int not null default 0
);
insert into public.badges (code, name_ko, name_en, desc_ko, desc_en, sort) values
  ('first_visit', '공방 첫 손님', 'First Guest', '민공방 게임즈 회원이 되었습니다.', 'Joined MinGongbang Games.', 1),
  ('first_voice', '첫 목소리',   'First Voice', '게시판에 첫 글을 남겼습니다.',     'Wrote a first post on the board.', 2)
on conflict (code) do update
  set name_ko = excluded.name_ko, name_en = excluded.name_en,
      desc_ko = excluded.desc_ko, desc_en = excluded.desc_en, sort = excluded.sort;

create table if not exists public.user_badges (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  badge_code text not null references public.badges (code) on delete cascade,
  awarded_at timestamptz not null default now(),
  primary key (user_id, badge_code)
);

alter table public.badges enable row level security;
alter table public.user_badges enable row level security;

drop policy if exists badges_select_all on public.badges;
create policy badges_select_all on public.badges
  for select
  using (true);

drop policy if exists user_badges_select_all on public.user_badges;
create policy user_badges_select_all on public.user_badges
  for select
  using (true);

revoke insert, update, delete on table public.badges, public.user_badges from anon, authenticated;

-- 가입하면 '공방 첫 손님', 첫 글을 쓰면 '첫 목소리'. 이미 있으면 그대로 둔다.
create or replace function public.award_badge()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  who uuid;
begin
  if tg_table_name = 'profiles' then
    who := new.id;
  else
    who := new.author_id;
  end if;
  insert into public.user_badges (user_id, badge_code)
  values (who, tg_argv[0])
  on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists profiles_award_first_visit on public.profiles;
create trigger profiles_award_first_visit
  after insert on public.profiles
  for each row execute function public.award_badge('first_visit');
drop trigger if exists posts_award_first_voice on public.posts;
create trigger posts_award_first_voice
  after insert on public.posts
  for each row execute function public.award_badge('first_voice');

-- ---------- 8. RPC --------------------------------------------------------------------
-- 소식 메일 동의자 목록 (관리자만, 그 외에는 빈 결과). 발송 기능은 아직 없어 관리자 화면에서 복사해 쓴다.
create or replace function public.newsletter_list()
returns table (email text, nickname text, agreed_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select u.email::text, p.nickname, coalesce(p.newsletter_updated_at, p.created_at)
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.newsletter_opt_in and public.is_admin()
  order by 3;
$$;
revoke execute on function public.newsletter_list() from public, anon;
grant execute on function public.newsletter_list() to authenticated;

-- 회원 탈퇴: 본인 auth.users 행을 지운다. profiles → posts/comments/reports/user_badges 가 연쇄 삭제된다.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in' using errcode = '28000';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;
revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- ---------- 9. 쓰지 않는 권한 회수 (방어 겹치기) -------------------------------------------
-- anon 은 읽기만 한다(글·댓글·배지·공개 프로필). truncate 는 RLS 를 거치지 않으므로 아무에게도 주지 않는다.
revoke insert, update, delete on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from anon, authenticated;

-- ---------- 초기화 (필요할 때만 주석을 풀어 실행) ----------------------------------------
-- drop trigger if exists on_auth_user_created on auth.users;
-- drop function if exists public.handle_new_user(), public.award_badge(), public.rate_limit(),
--   public.profiles_before_update(), public.posts_before_update(), public.newsletter_list(), public.delete_my_account(),
--   public.stamp_insert(), public.clean_nickname(text), public.nickname_reserved(text);
-- drop view if exists public.public_profiles;
-- drop table if exists public.user_badges, public.badges, public.reports, public.comments, public.posts, public.profiles;
-- drop function if exists public.is_admin();
