# 민공방 게임즈 홈 — 디자인 결정 메모 (4차, 2026-11-09 밤)

## 4차: 게임사 홈 문법으로 다시 짬 (사용자 평 "개밤티·별론데·AI 같다" 반영)
참고: Supercell(supercell.com)·Blizzard(blizzard.com) 홈을 agent-browser로 1440에서 캡처해 **원리만** 가져왔다(코드·문구·그림은 안 씀).
- 공통 원리: 첫 화면은 **게임 하나의 키 아트 풀블리드** + 로고 + 한 줄 설명 + 버튼 1~2개. 그 아래 **게임 포스터 격자**(표지·제목·장르·상태). 섹션 제목은 명사 한두 단어("FEATURED GAMES"식), 글은 짧고 그림이 화면의 70%. 장식(기울인 종이·테이프·떠다니는 조각·반짝임·카운트업·스크롤마다 등장 애니메이션)은 없다. 푸터는 어둡고 촘촘한 법적 줄.
- 적용: 히어로를 Deepfold 키 아트 100svh 풀블리드로, 한 번만 올라오는 CSS 진입 애니메이션(GSAP 제거). "만드는 게임" 2장 포스터 격자 신설. Deepfold(종이 크림→살구) · Soul Saver(남색) 작품별 색 섹션은 유지하되 곧은 카드·격자만. 스크린샷은 스냅 캐러셀 대신 3열 격자 + 라이트박스. 소식은 그림 위·글 아래 카드 3장. 공방은 글 + 일정 표. 색·글꼴은 3차 그대로(크림 바탕, 코발트·해노랑, Black Han Sans/Rubik/Noto Sans KR; Press Start 2P는 더 안 씀).
- 문구: 대구·표어 금지. 제목은 명사("만드는 게임", "소식", "공방 소개", "연락"), 카드 제목은 동사+목적어("과거에 광맥을 심는다"), 1인 개발자의 담백한 말투. `design-taste-frontend/scripts/copy-lint.mjs --kind gaming` 0 FAIL(WARN 1: 숫자 띠 — 작품 사실이라 유지).
- 보안(보안 점검 반영): 모든 HTML에 CSP·referrer 메타, supabase-js에 SRI, 홈 인라인 스크립트를 `js/home.js`로 분리(CSP로 인라인 금지), site.js errMsg는 알 수 없는 서버 오류를 일반 문구로 바꾸고 원문은 console.warn(단 `rate_limit:`·닉네임 예약어 문구는 그대로).
- 검사: 375·768·1440 가로 스크롤 0(`?debug`), 로그인 모달·모바일 메뉴·라이트박스 동작, 5개 페이지 콘솔 CSP/SRI 위반 0. 캡처용 `?static`은 애니메이션을 끄고 모든 그림을 eager로 바꾼다.

---
# (3차 메모, 참고용)

근거 자료: `ui-ux-pro-max` 스킬(nextlevelbuilder/ui-ux-pro-max-skill)의 `SKILL.md`, `references/quick-reference.md`, `references/pro-rules.md`, `data/*.csv`.
스킬 `--design-system` 결과(쿼리 "indie game studio portfolio immersive dark")는 **구조·모션·접근성·체크리스트**에만 썼고, 색·타이포는 사용자 지시로 바꿨다(아래 "변경" 참고).

## 구조 (landing.csv)
- 10행 **Scroll-Triggered Storytelling**: 도입 훅(히어로) → 장 1(Deepfold, 노을 세계) → 장 2(Soul Saver, 밤 세계) → 소식·공방 → 클라이맥스 CTA(연락). 장마다 다른 색, 진행 표시(상단 진행 막대 + 현재 구간 메뉴 강조), 장 끝마다 작은 CTA.
- 32행 **Hero-Centric** + 31행 **Feature-Rich Showcase**(products.csv 12행 Gaming 추천): 큰 키 아트 배너, 기능 카드 3장, 수치 4개, 스크린샷 갤러리.
- "글만 많고 이미지가 약한 것"(AVOID) 회피: 사진 24장, 모든 장에 큰 이미지.

## 모션 (motion.csv, GSAP 3.12.5 + ScrollTrigger, cdnjs 고정 버전)
- 8행 Stagger List Standard: `back.out`, scale .85→1, each .08 — 카드·단계·수치 등장(종이 공작 느낌으로 ±3° 회전 추가).
- 5행 Scroll Reveal Standard: y 24, .5s, stagger .08, `power2.out`, start `top 85%`.
- 13행 Parallax Subtle: 배너·쇼케이스 이미지에만 yPercent ±6 scrub(본문 글에는 안 씀).
- 2행 Hover Standard: 카드 -4px 들림 200~300ms, 버튼은 입체 밑단(6px) + 눌림(translateY 4px).
- 정지 화면의 잔잔한 움직임: 종이 조각·편지 떠다님(7~11s), 픽셀 점 깜빡임, 유령 bob, 별 반짝임. `prefers-reduced-motion`에서 모두 끄고 최종 상태로 렌더(landing.csv 10행 조건). `?static`으로 캡처용 강제 정지.

## 색·타이포 — 스킬 결과에서 바꾼 것 (사용자 지시 2026-11-09)
- 스킬이 준 "순수 검정 + 흰색" 팔레트(colors.csv 53행 Photography Studio)와 Archivo/Space Grotesk(typography.csv 44행)는 **버림**. 사용자 평: "너무 클로드스러운 어두운 디자인, 진짜 게임 사이트처럼".
- 바탕은 밝은 크림(#FFF8EE) + 작품별 컬러 섹션. 어두운 영역은 Soul Saver 장(밤·도트)과 푸터만.
- 스튜디오 색: 코발트 #2F5BFF + 해 노랑 #FFC63A. Deepfold: 노을 주황(#FFC48A→#F47A2A, 벽돌 #B8431A, 종이 질감 SVG 노이즈, 찢은 종이 가장자리). Soul Saver: 남색 #130C2C + 보라 #8B5CF6 + 시안 #5BE0FF, 픽셀 톱니 가장자리, CRT 주사선, 도트 폰트(typography.csv 52행 Pixel Retro의 Press Start 2P — 라벨·숫자에만).
- 글꼴: 한글 제목 **Black Han Sans**(google-fonts.csv: korean display), 라틴 제목 **Rubik 900**, 본문 **Noto Sans KR**(typography.csv 23행 Korean Modern). `font-synthesis:none`으로 가짜 굵기 방지.
- 금·빨강 번쩍임, 빽빽한 배너는 쓰지 않음(사용자 금지). 공지는 게임 공지 배너 카드 3장.

## 접근성·반응형 체크 (quick-reference §1·2·5·6·7, pro-rules 체크리스트)
- 대비: 본문 ≥4.5:1 확인(크림 위 #514B6B 8:1, 주황 위 먹색 5.9:1, 남색 위 #BDB3E6 9:1, 코발트 위 흰색 5.2:1 — 연락 섹션 그라데이션을 밝은 파랑에서 #2A4FE0~#1F3FCC로 낮춰 맞춤).
- 터치 타깃 ≥44px(메뉴 48, 갤러리 화살표 48, 푸터 링크 44), 포커스 링 3px(어두운 장에서는 시안·노랑).
- 이모지 아이콘 없음(인라인 SVG 2px 선 한 가족), 자동 회전 콘텐츠 없음, 라이트박스·메뉴는 `<dialog>`(Esc·포커스 가둠).
- 폭 375·768·1024·1440·1920 확인, 가로 스크롤 0(`?debug`로 뷰포트 밖 요소 자동 검사). 한글은 `keep-all`, 제목 구절은 `nowrap` 묶음.
- 이미지 width/height·lazy, 히어로 preload, 글꼴 `display=swap`.
- 위시리스트 링크가 아직 없으므로 "곧 공개" 상태 칩(비활성 버튼 대신).

## 사실 관계 (2026-11-09 정정)
Soul Saver: 2026-10-13 Steam 출시, ₩1,700, 무료 체험판. **플레이 가능한 캐릭터 14**(CharacterData.cs: 거너·검사·도적·궁수·연금술사·지도 제작자·시계공·우체부·유령·씨름꾼·공사 반장·인형사·장의사·사진사), **세계 4**(Chapters.cs: 초원 → 지하 묘역 → 불타는 지옥 → 영혼의 심연), 무한 모드·일일 도전·도전 모드, 자동 조준 없음, 결계 속 보스·무기 진화, 4개 언어(한국어·English·日本語·简体中文). 예전 "캐릭터 5·보스 3·특수 능력 20·세 스테이지"는 낡은 README 수치라 쓰지 않는다. 보스 수·특수 능력 수는 코드에서 확인되기 전까지 숫자를 적지 않는다.
Deepfold: 2027 출시 예정, 2027-02-22 넥스트 페스트 체험판(프롤로그~3장), 편지 12통, 3부작(2·3부 무료 업데이트), 20개 언어. 반전·결말·눈·겨울 이미지 없음.

## 회원 화면 (2026-11-09 추가: board · profile · privacy · terms · 로그인 모달)
- 공통 토큰·버튼·머리·바닥·모션 안전 규칙을 `css/site.css` 로 빼서 모든 페이지가 같은 파일을 쓴다(index.html 의 인라인 `<style>` 은 홈 전용만 남김). 언어 전환·메뉴·회원 모달은 `js/site.js`.
- 하위 페이지는 크림 바탕 + 흰 카드(`.card`, 둥글기 20, 두 겹 그림자), 입력은 2px 테두리·둥글기 14·포커스 링 4px(`.input`), 단추는 홈과 같은 입체 `.btn`(작은 변형 `.btn--sm`, 위험 `.btn--danger`). 분류 탭은 알약, 분류 태그는 작품 색(공지 벽돌·자유 코발트·버그 초록).
- 모달은 `<dialog>` 하나(로그인·가입·재설정·새 비밀번호 뷰 전환), 오류는 필드 바로 아래 `.err`, confirm() 대신 페이지 안 확인 상자(`.confirm`). 배지는 종이 조각처럼 ±1° 기울인 카드, 못 받은 배지는 자물쇠 아이콘.
- Supabase 설정이 비어 있으면 모달·게시판·프로필은 '준비 중' 주황 안내(`.notice`)만 보이고 입력은 비활성.
