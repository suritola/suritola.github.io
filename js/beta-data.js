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
    "version": "2026-11-17",
    "size": "66 MB",
    "platform": "Windows 64-bit",
    "lock": {
      "iter": 250000,
      "salt": "Ttv6StWwPukSssc4PzLadg==",
      "iv": "fV7/myyRDgP7qP6a",
      "ct": "+ea/dDV8SaBFjfFfnEzg3iQqrpB70RewQWW8ciBa1VtxZ/i9+SFGoXV1R1xvG8uAfICXKZ8gRCNi5A946/quGniSu5SequQW76ldz+DBtxALrN3SlAj6399q5twwL+Ld/LiVb4cgoIIuOFkxHFetHO0c/9S1oYdzYdnH2+qs5185x4QTqzUfFfuJmkiP"
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
