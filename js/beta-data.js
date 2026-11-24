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
    "version": "2026-11-24",
    "size": "672 MB",
    "platform": "Windows 64-bit",
    "lock": {
      "iter": 250000,
      "salt": "CQY9H5qHjm7zZ244efP6Vg==",
      "iv": "87vQ+JMlcCUpsv6/",
      "ct": "bpv+gyNaRaBJDFDjNkJ/nzsevKo4L6PBTlaum8iIDk2grGoCIAI2iCx+6rmaPQVnZvsyLcNFis76AJh5QOR8gkXsosLuAc62hJ780jqjF5NZ6Wl/LsgRY1ADysLxWW9q1sYhvY7IuyU1WMGzn4vp4ESR/fwiRdKzDJV+Dk77q7NBNWYOAaH64gqaq+5b9LnW+ecjriwh8e3xKdPJtPmJm2ZaE8Yk9fD10zDpH2M6uvGvVXYHbUS7LvqaFtny2vJKI6qlyIj2YhTC6vbRV2ROXimvU29XruIxwKp4O5fa+AY1gvaE5He9j1nEA8Ik5y5alG2SOA+xFF5RwKdwuE6sookRB3XqtbI2cxYRg95F17gRP3DfacBCWHjuKQcVIr0EHlX32J9GmqzpnkczZaZn87b8OiPVY1sY/4cg+Se+CPlbgYKMy30Bps+nrBGg6WsyUw9S7MdqYbrBTffHU22in+3aZ2jg1zEHy8dufXE8f+aFc2NM88b85UKlPQtFY4IH7X0CGloRW34b4T6bSxS4x1WhJRB1I/z5toWQDw4ZPQALG0snwmyJGvU/Ky4lZZcCg5pMvUeEX0kaZ4p/Qf6daaOcjVQmEqMcej0n2CQFqn/0TFE17VejZqI/69wsjjX86ceaOSrZ/rPMln0fLHSdSiXU8kc0y7KeOI0l/O0J3vK6LTPUJ+QnO5BPjVUpHPDhLDWm8lddTzEIG/cR0wR5Yj5z76U5VIv5KYHcKMDxccmuhN0T2b5y9yRqxeHOzPTrQtB1+KSTQur2MN1vONzkPKQz2BNMvPaRuREeV9GnmCVWwiaQEG9f4K1SNq5Vl+Q8xnRKpAOX78E/u/w+TIpW69Tn8bloTbLjTHBYO3sk5vXLUj4x0ODHpKOuSzEGYvkWXahLaO9Bkdm/WvLT+kFojOaj1q4QXTqjqSV0JFn8fYuVsy8R/B6/JhSbVZweWd+1uncKPDVa2CfCEP7vA9ARXE4t03FN/SsblgxzIPZguHlST4FKmzATx9PygT3X6iWzLQHQqJqqDHI/oCl+2Gjloj0EXo3WHvDBk1/YAd4sIezDQWiNaaVwHR3TUBxRg8g0zAkqe7ope8IBysc0DcN1iujnidEQJVM/r8Xol3tOjyYE2vvZYEBDhTKORQCnQc70X3UwHzJy+rU3VHYiMW3o/SzfjhiXiQZaeH36TlPyNPDd8Xcu2Rvd/GKrxJ/gRt0qLniR2edvBIM3Jlk7JeoRR2FwlpV0zHQ+pDw0rZezvlJrLSSFpVDiDQ3IXo98Xpl7JoxpzmucbUCVA0Q6MgXKuRDBR58="
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
