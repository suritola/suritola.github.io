/* 로고 애니메이션: 방문(탭)마다 한 번. 모션 줄이기를 켠 사람에게는 틀지 않는다. 눌러서 넘길 수 있다. */
(function () {
  try {
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (sessionStorage.getItem("mgIdent")) return;
    sessionStorage.setItem("mgIdent", "1");
  } catch (e) { return; }
  if (window.MGIdent) window.MGIdent.play(document.body, {});
})();
