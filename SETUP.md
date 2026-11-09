# 회원 기능 켜기 (Supabase) — 사용자가 할 일

사이트의 가입·로그인·게시판·프로필은 **Supabase**(무료 플랜)를 백엔드로 씁니다. 아래를 순서대로 하면 켜집니다. 약 15분.
`js/config.js` 의 두 값이 비어 있는 동안은 회원 UI가 보이되 "준비 중" 안내만 뜨고, 사이트의 나머지는 평소대로 동작합니다.

## 1. Supabase 가입·프로젝트 만들기
1. https://supabase.com → Start your project → GitHub 계정으로 가입.
2. **New project**: Organization 아무거나, Name `mingongbang`, Database Password 는 길게 만들어 비밀번호 관리자에 저장(사이트에는 안 씀), **Region: Northeast Asia (Seoul)**. Create.
3. 1~2분 뒤 프로젝트가 준비됩니다.

## 2. 데이터베이스 만들기 (SQL 한 번)
1. 왼쪽 메뉴 **SQL Editor** → **New query**.
2. 이 저장소의 `supabase/schema.sql` 파일 내용을 전부 붙여 넣고 **Run**.
3. "Success. No rows returned" 가 나오면 끝. 테이블·보안 정책(RLS)·트리거·배지가 한 번에 만들어집니다.

## 3. 키를 사이트에 넣기
1. 왼쪽 메뉴 **Project Settings → API**.
2. **Project URL** 과 **Project API keys → `anon` `public`** 두 값을 복사.
3. 저장소의 `js/config.js` 를 열어 채웁니다.
   ```js
   SUPABASE_URL: 'https://xxxxxxxxxxxx.supabase.co',
   SUPABASE_ANON_KEY: 'eyJhbGciOi...긴 문자열...',
   ```
4. 커밋 → push. 1~2분 뒤 https://suritola.github.io 에서 로그인 단추가 실제로 동작합니다.

> **anon 키는 공개돼도 되는 키입니다.** 브라우저에 그대로 내려가는 걸 전제로 설계된 키이고, 데이터 보호는 DB의 RLS 정책(schema.sql)이 맡습니다.
> **`service_role` 키는 절대 config.js 나 저장소 어디에도 넣지 마세요.** 이 키는 모든 정책을 건너뛰는 관리자 키입니다.

## 4. 로그인 주소 등록
1. 왼쪽 메뉴 **Authentication → URL Configuration**.
2. **Site URL**: `https://suritola.github.io`
3. **Redirect URLs** 에 추가: `https://suritola.github.io/**`
   (가입 확인 메일·비밀번호 재설정 메일의 링크가 이 주소로 돌아옵니다. 로컬에서 시험하려면 `http://localhost:*/**` 도 추가.)
4. (권장) **Authentication → Providers → Email** 에서 *Minimum password length* 를 8 로. 사이트도 8자 이상을 요구합니다.
5. (권장) **Authentication → Emails(또는 Email Templates)** 에서 메일 제목·문구를 한국어로 바꿔 두면 좋습니다. 무료 플랜의 기본 메일 발송은 시간당 몇 통으로 제한되니, 회원이 늘면 *SMTP Settings* 에 Resend/Gmail 같은 SMTP 를 연결하세요.

## 5. (선택) 구글 로그인
1. https://console.cloud.google.com → 프로젝트 생성 → **APIs & Services → OAuth consent screen**(External, 앱 이름 "민공방 게임즈", 지원 이메일) → **Credentials → Create credentials → OAuth client ID**(Web application).
2. *Authorized redirect URIs* 에 Supabase 가 알려 주는 콜백 주소(`https://xxxxxxxxxxxx.supabase.co/auth/v1/callback`)를 넣고, 발급된 **Client ID / Client Secret** 을 복사.
3. Supabase **Authentication → Providers → Google** 을 켜고 두 값을 넣고 Save.
4. `js/config.js` 의 `GOOGLE_ENABLED: true` 로 바꾸고 push. 로그인 창에 "Google로 계속" 단추가 나타납니다.
   구글로 가입한 회원의 닉네임은 구글 이름으로 시작하며, 프로필에서 바꿀 수 있습니다.

## 6. 첫 관리자 지정
1. 사이트에서 본인 이메일로 **먼저 가입**합니다(확인 메일의 링크까지 누르기).
2. SQL Editor 에서 아래 한 줄을 이메일만 바꿔 실행:
   ```sql
   update public.profiles set role = 'admin' where id = (select id from auth.users where email = 'mingeunb0@gmail.com');
   ```
3. 다시 로그인하면 머리의 내 메뉴에 **관리** 가 생깁니다. 관리자는 공지 작성, 모든 글·댓글 삭제, 신고 목록 처리, 소식 메일 동의자 목록 보기를 할 수 있습니다.

## 7. 소식 메일 보내기 (아직 발송 기능 없음)
- 지금 만든 것: 가입·프로필에서 **수신 동의**를 받고 저장하는 것과, 관리자 화면(`board.html#admin`)에서 **동의자 목록을 CSV 로 복사**하는 것까지.
- 실제 발송은 나중에 Resend(무료 월 3,000통) 같은 서비스에 CSV 를 붙여 넣어 보내거나, Supabase Edge Function 으로 자동화하면 됩니다.
- 보낼 때 지킬 것: 동의한 사람에게만, 메일 끝에 "수신 거부는 프로필 페이지에서" 안내, 동의를 끈 사람은 다음 발송 전에 목록에서 제외.

## 동작 확인 체크
- [ ] 로그인 단추 → 가입 → 확인 메일 → 링크 클릭 → 자동 로그인, 머리에 닉네임이 보임
- [ ] 프로필: 닉네임 변경, 소식 메일 켜고 끄기, 배지 「공방 첫 손님」이 보임
- [ ] 게시판: 글쓰기(자유) → 배지 「첫 목소리」, 댓글, 본인 글 수정·삭제, 다른 사람 글 신고
- [ ] 관리자: 공지 작성, 남의 글 삭제, `#admin` 에서 신고 처리·동의자 목록
- [ ] 회원 탈퇴 → 글·댓글이 함께 사라짐

## 문제가 생기면
- "Database error saving new user": schema.sql 을 실행하지 않았거나 일부만 실행됨. 초기화 블록을 실행한 뒤 전체를 다시 Run.
- 가입 뒤 메일이 안 옴: Authentication → Logs 확인. 무료 플랜 기본 발송 한도(시간당 수 통)를 넘었으면 SMTP 연결.
- 로그인 뒤 글쓰기가 "권한이 없습니다": 확인 메일 링크를 아직 안 눌렀거나, Redirect URL 이 등록되지 않아 세션이 안 생긴 것. 4번 확인.
- 보안 점검: Supabase 대시보드 **Database → Linter(Security Advisor)** 에서 `public_profiles` 뷰의 *security_definer_view* 경고는 의도한 것(공개해도 되는 4개 열만 노출). 그 밖의 경고는 보고해 주세요.
