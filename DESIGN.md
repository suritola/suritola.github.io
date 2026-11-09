# 민공방 게임즈 홈 — 디자인 결정 메모 (7차, 2026-11-09 밤)

## 7차: 6차 위에서 다듬기 + 애니메이션 + 대형 게임사 문법 (사용자: "되돌리진 말고 거기서 그대로 더 다듬어봐", "애니메이션도 좀 넣고", "맨 밑 엄청 큰 글자 별로", "누가 봐도 대기업 게임사같게")
kit(assets/)은 그대로 두고 `css/home.css`·`js/home.js`·`index.html`만 바꿨다. 참고는 scratchpad/ref2의 Blizzard·Nexon 1440 캡처(원리만).
- **겹침 버그**: kit의 `main > .hero{height:100svh}` 때문에 1366×768·1536×674에서 사실 줄(.hero__facts, absolute bottom)이 단추 위로 올라탔다 → 히어로를 `height:auto; min-height:100svh; display:grid`로, 사실 줄은 `.wrap` 격자의 둘째 줄(static). 키 낮은 데스크톱(max-height 760)은 워드마크 380·h1 한 단계 작게.
- **한 화면 한 섹션 상자 해제**: `body main > .section:not(.hero){height:auto; padding-block:clamp(80px,8vw,112px)}`. 1440에서 카드 구역 아래 40%가 비던 것이 사라짐. 어두운 띠(#soulsaver)는 88~128px. 앵커는 `scroll-margin-top: var(--nav)`.
- **거대 글자 제거**(사용자): footer-statement의 close-word 「민공방 게임즈」와 #letters의 giant-type-pass 모멘트, #studio의 liquid-type 모멘트를 뺐다(모멘트 0, modulepreload·enter.js의 mo-js 줄 삭제). #letters는 편지 스크린샷(s3) + 짧은 글 두 단락의 분할 구역, 끝은 연락 띠(#contact: h2+리드 | 메일·GitHub 단추) + 어두운 푸터.
- **대형 게임사 문법**(2라운드): 머리는 첫 화면 위에서 투명·흰 글자, 40px 넘기면 바탕색(`.nav.is-top`, 데스크톱만; 메가메뉴는 페이지 잉크로 되돌림). 히어로는 게임 워드마크 500px + 한 줄 h1(장르+출시) + 리드 한 문장 + 주 단추 1개와 글 링크 + 사실 4개 + 아래로 힌트(700px 이상 높이에서만). 「만드는 게임」은 세로 포스터 카드 2장(10:11, 폰 4:5; 아래 그늘 위에 꼬리표·제목·한 줄·플랫폼 아이콘, 호버 시 그림 1.04 + 설명 한 줄이 grid-template-rows 0fr→1fr로 올라옴, 터치에서는 항상 펼침). Soul Saver 구역은 글 제목 대신 게임 로고(ss_logo.webp, h2는 sr-only) + 숫자 띠(14·4·4, kit data-m-count 카운트업). 소식은 대표 카드 1(span-7) + 줄 카드 2(200px 썸네일 | 글), 꼬리표(Deepfold 코발트·Soul Saver 보라)+날짜. 푸터는 `.footer--dark.ground-inverse`(#17181c): 로고 락업·한 줄·소셜(GitHub·메일·Steam)·링크 3열(게임·공방·약관)·언어 토글·법적 고지.
- **애니메이션**(모두 `prefers-reduced-motion: no-preference` 안, 헤드리스 캡처는 `?live` 없으면 최종 상태): 히어로 진입은 kit(data-enter) 그대로; 키 아트 켄 번스 1.00→1.05/22초(진입 settle 뒤 1.2초부터, transform) + 포인터 시차 ±10px(`translate`, 사진을 사방 14px 크게 두어 가장자리 안 빔); 스크롤 등장 `.rv`(IntersectionObserver, 24px 아래서 600ms, 형제 순서 90ms stagger, 앵커로 건너뛴 것은 바로 보임); 구역 입자 — Deepfold 구역(#deepfold·#letters)은 종이 먼지가 7px/s로 떠오름(radial-gradient 3층 타일, 240·280·336의 최소공배수 1680px 이동으로 이음새 없음), Soul Saver 구역은 도트 별 두 층 깜빡임(opacity만); 보일 때만 재생(in-view). 호버: 그림 1.03~1.04(kit)·타일 2px 들림·소식 제목 코발트. 메뉴 현재 위치는 화면 가운데 구역 → `.nav__link[aria-current=page]`(kit 밑줄).
- **키 아트의 흐릿한 마름모**: 이미지 자체에 박힌 게임 UI 광맥 표지였다(CSS 장식 아님). sharp로 옆 지층을 타원 마스크로 복사해 덮음 — keyart_1920(+480/720/1280), keyart_1280(+480/720), keyart_16x9.jpg(OG), df_wide(+3), df_tall(+2), keyart_close(+3). 스크립트는 scratchpad/sharptool/patch*.mjs(저장소 밖).
- **사실 정정**: #deepfold 영문의 "about three hours"(확인 안 된 숫자) 삭제. 새 문구는 모두 data-en 병기.
- **검사**: 가로 넘침 0(375·768·1366·1440·1920), 콘솔 오류·CSP 위반 0(홈·board·profile·privacy·terms), CLS 0.0008(스크롤 전 구간), EN 전환 뒤 한글 잔류 0, 폰 메뉴·메가메뉴·포커스 링 확인. web-interface-guidelines 대조: 애니메이션은 transform/opacity(+포스터 설명의 grid-template-rows 전환 1곳), 이미지 width/height·lazy·fetchpriority, 아이콘 단추 aria-label, 제목 위계 h1→h2→h3, scroll-margin-top. 미처리: 장식 입자 루프(5초 초과 자동 재생)에 멈춤 단추는 두지 않음 — 모션 줄이기에서 정지, 대비 매우 약함.
- **캡처**: scratchpad/shots10/ (before_*, v6_before_*, round1~5_*).

---
# (6차 메모, 참고용 — 거대 타이포 2곳·footer-statement·한 화면 한 섹션은 7차에서 바뀜)

앞선 다섯 시안("개밤티", "별론데", "클로드스러운 어두운 색", "AI 같은 문구", "둥글둥글", "템플릿 같다")을 버리고
`design-taste-frontend`(tasteskill 2.5.1) 스킬의 시스템 위에 처음부터 다시 짰다. 이 문서는 그 결정의 근거다.

## 1. 참고 사이트에서 뽑은 수치 (agent-browser, 1440·375 캡처: scratchpad/ref2)
- **Supercell**: 컨테이너 1200(x 120~1320), 머리 78px, h1 56/70 -0.8px, 본문 20/31, 메뉴 14px, 단추 13px 700 높이 51.
  첫 화면 = 이름 + 한 줄 + 캐릭터 아트. 그 아래 **2열 16:9 소식 카드**(그림 → 태그 → 제목 한 줄), 글은 거의 없다.
- **Nexon**: 머리 56px, 컨테이너 1080(x 180), 히어로 글 36px 700 + 소제목 14px + 테두리 단추 1개, 게임 포스터 5열(세로 캡슐), 섹션 제목 "All Games"처럼 명사 하나.
- **Blizzard**: 머리 76px, 컨테이너 1200, 히어로 = 게임 로고(워드마크) + h1 48/53 + 한 줄 + 단추 1개, 그 아래 "FEATURED GAMES" + 플랫폼 필터. 어두운 바탕이지만 **키 아트가 화면의 80%**.
- 공통: 첫 화면은 게임 하나의 키 아트 풀블리드, 로고는 이미지, 글은 2~3줄, 단추 1~2개. 섹션 제목은 명사, 본문 16~20px, 메뉴 14~15px 4~6개.
  컨테이너 1080~1200, 머리 56~78px, 카드 모서리 4~8px, 호버는 그림 1.03 확대·카드 2px 들림 정도. 중국식 금·빨강 번쩍임 없음.
- 리오트·PS 스튜디오는 봇 차단/리다이렉트로 수치가 안 잡혔다(캡처 없음).

## 2. 종류와 딜 (스킬 1~4단계)
- 종류: **gaming** (page type software, site-kind gaming). 파는 것 "종이 광산 게임", 주 행동 "체험판 일정 보기"(#news).
  Deepfold는 아직 상점 페이지가 없어 위시리스트·구매가 없고, Soul Saver 구매는 그 게임 구역의 단추다.
- 히어로: `deal.mjs --type software --kind gaming --has photo` → 처음엔 **film**(트레일러 틀)이 나왔으나 트레일러가 없어 다시 딜 → **photo**
  (키 아트 풀블리드, 글은 왼쪽 차분한 지층 위, data-box="none" data-tone="dark", 아래 사실 4개).
- 팔레트: `start.mjs deal`이 준 clay-pine(녹색)은 공방 로고(코발트·노랑)와 부딪혀 `start.mjs brand`로 **로고의 코발트 #2f5bff**를 액션색으로,
  바탕 #f6f5f2(크림 아님, 거의 흰 따뜻한 회색), 잉크 #17181c. 어두운 전체 바탕은 쓰지 않는다(사용자 지적).
- 글꼴: 딜 1순위 **Urbanist**(라틴) + 한글은 **Pretendard Variable**(jsdelivr). Black Han Sans·Rubik·Noto Sans KR 제거.
- 부품: nav-centre · footer-statement(sand 바탕) · close-word · 리듬 dark-band(Soul Saver 구역, 그 게임의 남색 #120d2a) · 단추는 pill이 나왔지만
  사용자가 둥근 모양을 거부해 **solid + radius sharp(4/6/8)**. 마크는 공방 로고 SVG.
- 모멘트: `moments.mjs pick --page gaming --count 2` → **giant-type-pass**(#letters, "편지 열두 통" 글자 속으로 갱도 사진이 지나감)
  + **liquid-type**(#studio h2, 포인터가 지나면 물결). 둘 다 WebGL 0, 폰·모션 줄이기에서는 정지.
- 효과·바탕: `pick.mjs`가 #games bg-dots, #deepfold bg-field를 줬지만 backgrounds.css가 섹션 내용을 세로 가운데로 두고 폰 최소 높이를 없애
  한 화면 한 섹션 상자를 깨뜨려(1차 캡처에서 #deepfold가 폰에서 140px) **바탕 효과는 모두 뺐다**. WebGL grain-gradient도 UHD 620 때문에 뺌. 효과 0.

## 3. 화면 계획 (1440×900, 섹션 = 정확히 1화면)
hero(photo) → #games(타일 6+6) → #deepfold(글 5 / 사진 7, 3:2) → #how(카드 3장, 캡처 위·동사 제목) → #letters(스테이트먼트 모멘트)
→ #soulsaver(어두운 띠, 글 5 / 캡처 7, 구매 단추) → #ss-play(카드 3장) → #news(타일 3장) → #studio(h2 + 글 5 / 일정 7) → footer.closing(close-word + 링크).
폰에서는 카드 섹션이 내용만큼 자란다(1.3화면쯤). 분할은 모두 5/7(오른쪽 열 x 623)로 통일.

## 4. 문구
- 1인 개발자의 담백한 말투. 표어·대구·감탄사 없음. h1은 장르("종이로 만든 광산 게임"), 그 위에 게임 워드마크, 리드에 날짜 하나.
- 카드 제목은 동사+목적어("과거에 광맥을 심는다"), 섹션 제목은 명사("만드는 게임 두 개", "소식과 일정"). 숫자 띠(3·12·20) 삭제, 숫자는 문장 안으로.
- `copy-lint.mjs --kind gaming`: 0 FAIL 0 WARN. 모든 문구는 data-en으로 영어 병기(KO/EN 전환 유지).

## 5. 기능·보안
- KO/EN(js/site.js setLang), 로그인 모달·회원 메뉴(#auth), 게시판·프로필·약관 페이지 그대로. 공통 조각(언어 토글·로그인 단추·대화상자·토스트)은
  `css/auth.css`로 분리해 홈(kit)과 하위 페이지(site.css) 양쪽에서 같은 모양. 하위 페이지의 site.css는 토큰·글꼴·단추(입체 그림자 제거)·머리·푸터만 새 언어로.
- CSP 유지: 인라인 script 없음 — kit의 head 한 줄(m-enter, mo-js)은 `js/enter.js`로. style-src/font-src에 cdn.jsdelivr.net(Pretendard) 추가.
  kit 파일(assets/)은 스킬 원본 그대로(gate의 kit-edited 검사 대상), 쓰는 파일만 복사.
- 이미지: 키 아트·캡슐·스크린샷을 webp로(1280~2000px, 25~110KB). 눈·겨울 그림 없음, Deepfold 결말 노출 없음(편지 "열두 통"과 "하루가 끝난다"는 전제).

## 6. 검사 (스킬 6단계) — 결과
- `copy-lint.mjs --kind gaming`: 0 FAIL 0 WARN.
- `layout/check.mjs` 1440×900: 발견 0. 390×844: 폰 h1을 32px로 낮춰 32자 스트레스 3줄 통과(한글은 전각이라 44px면 4줄).
- `gate.mjs`: 1차 FAIL 1(ss-play/news 간격 — 폰 2화면 강제가 남긴 구멍) → 2차 FAIL 2(카드 섹션이 폰에서 1.4~1.6화면으로 자라며 다음 제목이 보임)
  → 3차 **GATE: PASS**. 웨이버 5건(`.taste-skill/waivers.json`): copy-headline(워드마크가 이름을 맡음), section-gaps(히어로 사실 줄은 kit 레이아웃),
  sparse #letters(폰에서 타이포 스테이트먼트는 34%), neighbour #how·#ss-play(폰에서 카드 섹션이 자람; --hm:2는 구멍을 남겼다).
- `perf.mjs`: WebGL 0, CLS 0, LCP 0.65s(CPU). FAIL로 남는 것: 글꼴 파일 18개/470KB(Pretendard 동적 서브셋 — 한글은 글리프 범위별로 쪼개 받는다, 대안인 단일 파일은 2MB),
  큰 그림은 srcset(480/720/1280)으로 폰에서 작은 파일을 받게 고침.
- 그라운드(bg-dots/bg-field)는 kit의 backgrounds.css가 섹션 상자를 깨서 뺐다(2절). 효과 0, 모멘트 2.
