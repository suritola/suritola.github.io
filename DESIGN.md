# 민공방 게임즈 홈 — 디자인 결정 메모 (3차, 2026-11-09)

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

## 사실 관계
Soul Saver: 2026-10-13 Steam 출시, ₩1,700, 체험판, 캐릭터 5·보스 3·특수 능력 20·4개 언어. Deepfold: 2027 출시 예정, 2027-02-22 넥스트 페스트 체험판(프롤로그~3장), 편지 12통, 3부작(2·3부 무료 업데이트), 20개 언어. 반전·결말·눈·겨울 이미지 없음.
