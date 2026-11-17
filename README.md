# 민공방 게임즈 웹사이트

https://suritola.github.io

회원 기능(가입·게시판·프로필)을 켜는 방법: [SETUP.md](SETUP.md) · DB 스키마: `supabase/schema.sql`

다운로드 탭(`download.html`): 게임 목록은 `js/beta-data.js`. 베타 빌드의 받기 링크는 사이트 전체에 하나인 베타 코드로 암호화해 둔다(`js/beta-crypto.js`, AES-GCM). 링크를 바꾸거나 코드를 바꿀 때는 `tools/beta_add.mjs`(파일 맨 위의 쓰는 법). 코드는 저장소에 넣지 않는다.
