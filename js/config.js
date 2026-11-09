/* 민공방 게임즈 회원 기능 설정 — SETUP.md 를 보고 채운다.
   SUPABASE_ANON_KEY 는 공개돼도 되는 키(anon public). 데이터는 DB의 RLS 정책이 지킨다.
   service_role 키는 절대 여기에 넣지 않는다. 두 값이 비어 있으면 회원 기능은 "준비 중"으로 보인다. */
window.MG_CONFIG = {
  SUPABASE_URL: '',        // 예: 'https://abcdefghijklmnop.supabase.co'
  SUPABASE_ANON_KEY: '',   // Project Settings → API → anon public
  GOOGLE_ENABLED: false,   // Supabase Authentication → Providers → Google 을 켠 뒤 true
  SITE_URL: 'https://suritola.github.io'
};
