-- 소식 메일 일괄 발송(사용자 지시 2026-11-17 "이메일 일괄 전송 기능").
-- Edge Function "newsletter"(supabase/functions/newsletter/index.ts)가 쓴다. SQL Editor 에 붙여 넣고 Run(여러 번 실행해도 된다).

-- 발송 기록: 관리자만 읽는다. 쓰기는 Edge Function(service_role)만.
create table if not exists public.newsletter_sends (
  id          bigint generated always as identity primary key,
  subject     text not null,
  sent_by     uuid references auth.users (id) on delete set null,
  recipients  integer not null,
  test        boolean not null default false,
  created_at  timestamptz not null default now()
);
alter table public.newsletter_sends enable row level security;
drop policy if exists newsletter_sends_admin_select on public.newsletter_sends;
create policy newsletter_sends_admin_select on public.newsletter_sends
  for select to authenticated using (public.is_admin());

-- 발송 대상: 소식 메일에 동의했고 메일 인증을 마친 회원. service_role(Edge Function)만 부른다.
create or replace function public.newsletter_recipients()
returns table (id uuid, email text, nickname text)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, u.email::text, p.nickname
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.newsletter_opt_in
    and u.email is not null
    and u.email_confirmed_at is not null
  order by p.created_at, p.id;
$$;
revoke execute on function public.newsletter_recipients() from public, anon, authenticated;
grant execute on function public.newsletter_recipients() to service_role;

-- 수신 거부: 메일의 링크를 누르면 Edge Function 이 서명을 확인한 뒤 부른다. service_role 만.
create or replace function public.newsletter_unsubscribe(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set newsletter_opt_in = false where id = p_id;
$$;
revoke execute on function public.newsletter_unsubscribe(uuid) from public, anon, authenticated;
grant execute on function public.newsletter_unsubscribe(uuid) to service_role;
