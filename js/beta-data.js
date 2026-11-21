/* 다운로드 탭의 게임 목록. lock 이 있는 게임은 베타 코드로만 받기 링크가 풀린다(js/beta-crypto.js).
   lock 은 tools/beta_add.mjs 가 쓴다. 손으로 고칠 때도 = 뒤는 JSON 그대로 둔다. */
window.MG_DOWNLOADS = [
  {
    "id": "moonrope",
    "title": "문로프",
    "titleEn": "Moonrope",
    "sub": "달을 당겨 갯벌을 캐는 타이쿤 게임",
    "subEn": "Pull the moon, dig the mudflat: a tycoon game",
    "tag": "베타 테스트",
    "tagEn": "Beta test",
    "img": "img/mr_wide-720.webp",
    "imgAlt": "달에 밧줄을 건 바퀴와 물이 빠진 갯벌",
    "imgAltEn": "A winch roped to the moon above the drained mudflat",
    "version": "2026-11-19 (5f3b220)",
    "size": "83 MB",
    "platform": "Windows 64-bit",
    "lock": {
      "iter": 250000,
      "salt": "Jb6gHVF6FtsSmAVBPVa+5A==",
      "iv": "rTnh1pCZ+s4VBv4r",
      "ct": "iG4hXxJ8C+yLfmChJcC78AhIsW+MvokD+oncnQEsvZnTaODnXffZBHcGd93Ej9VIv8TlqH+LGSU2T1ymMF32cZcjLKYmJEIUTLyf4tQ10VyNNbFyiHbgL2FLtLouecViffsUn8ZpFfP5lYVfE38rIJBpzCe645KRWd/17gv1o+TvnQ=="
    }
  },
  {
    "id": "deepfold",
    "title": "Deepfold: One Day Deep",
    "titleEn": "Deepfold: One Day Deep",
    "sub": "종이로 만든 스토리 채굴 게임 · 2027년 출시 예정",
    "subEn": "Story-driven papercraft mining game · Coming 2027",
    "tag": "베타 테스트",
    "tagEn": "Beta test",
    "img": "img/keyart_1280-720.webp",
    "imgAlt": "노을 진 폐광촌 노을재와 권양탑",
    "imgAltEn": "The old mining town of Noeuljae at sunset, with its headframe",
    "version": "2026-11-21b",
    "size": "672 MB",
    "platform": "Windows 64-bit",
    "lock": {
      "iter": 250000,
      "salt": "ckFvSZ8gnFV1h/1aWpG7wQ==",
      "iv": "/LMvhQcIuFc/QrD4",
      "ct": "tCd4SmLrx2i7+xAAamk6HjvFFR5v4WHXtiZBM4JEywN2W8EK2liQgeX0cmRUzl4aI4UiQ5mt5G5G17+0ex60Vt1vUQv7CvucziqB0mlldoNhdWOHKQ+7iKNpTUf39daGU5U0tL4gdZXwFceF5TEEPbkDmVflda+lDavcUKYsu7Gjw/AAL62KVbD7840T6bENYbdr+aPkzB1pcJ7+mzJbP9TY5Jpxv2FbX0cy5NtiL0q7XuGil2J23MHKc/3xbBf18AEM/hOu1KWd9fhffUgFx/1+y25esW2dNFtb4p57ZHSkGBekRnZLH/KP+Boeyfy3NdpJWCsrGR1Og9qk8kWoAWjI/wQR9PGj2m2dNw1i5+ZbPgf4OaAM3efvtfY/WAxgkaApP1aEwGOHsdkAUqDU663VZQKltMI9a3pCsWQ9CYUcjSpQUIQ/7UA3YdaavyobfK88iv+WMCgTnWXhzgWIHavZHopppahWocvOlPhWiVWxtVnKGScvT+kGzYYVPtdGGOrGL00pnqG3PRmNZEQOlsdRjq+yeTTb2ZEPq6L9rnbVl78xF/7f1yrSO3beWBtZkRpVGhOTxmsulMRzKqL3abRUAHn+XgZz0LS+gSaWlMIut4LFcTqqCQsJJnKYIGTxi7K4gj3b96AVD8i8JuL4xJW+5Ew+PiG7ri9fMCUWZr05oT1dw86+Qb0N6L/oVPuQjfJBjk7ZPD4wHreLpqfzfhEeGgUw/uED2vmnBs4Hp7GBOsumWvCoZRepoyKRN0sm2py2KXJEy1alXe+5WRy0u3w000rsVeMm0Gvl4QbHqQrIV98vxdhOc3Ag8+VQmuW0Xf56Di4SG9IUWYXDgPfgqc0o2znRNkSJqLZR5KXEgW6Jf8Jqq4tfFJ6jLPxcLY992HIlDoCe2AxxBDCVZNczVAMoizOjYsooIo+1ZuS2BPeNDlbl2UZQ/5nfCJBChzmYj+LfGOUYKQTBzw510IFoXgMly7U8Qlplw0NJS3yzeqbuVGqWiavk9QCj2F7j1xl/0vrKQZIXgNT2xLqb8wsaNBDGqCTfXruUYhOgDms/RJfkcD5MODhBEP1jHp64J5DM/VZGcdSlTQhbsz0N1wdrqr8k+4NO4vRCmBYKU/wCLZDTNYt3UDuUi9WigJVujNydxnELDHBe5rnkIFoqWYQ6kL5DXsw6hPFtdIptd8Sral7HuEscBgnl3R1+vQI1CzvLUMwRFnbF8k8UByWl+03H1hG8OWJXn+jz20F6uW/iThxXx+HY56RRJDRsXYy/g67M6SC2hE2ZBfHeUIK6Jo2CejK8pvLDIp4VG/epOw=="
    }
  },
  {
    "id": "soulsaver",
    "title": "Soul Saver",
    "titleEn": "Soul Saver",
    "sub": "도트 로그라이트 슈터 · Steam 판매 중",
    "subEn": "Pixel-art roguelite shooter · Out on Steam",
    "tag": "출시",
    "tagEn": "Released",
    "img": "img/ss_shot1-720.webp",
    "imgAlt": "총잡이가 결계에 둘러싸인 보스를 조준한다",
    "imgAltEn": "The gunner takes aim at a boss wrapped in its barrier",
    "platform": "Windows · Steam",
    "href": "https://store.steampowered.com/app/5328770/"
  }
];
