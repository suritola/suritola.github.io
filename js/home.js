/* 민공방 게임즈 홈: 스크롤 등장(.rv), 구역 입자 켜고 끄기(data-ambient), 메뉴 현재 위치(aria-current).
   모션 줄이기·IntersectionObserver 없음·헤드리스 캡처(?live 없이)에서는 최종 상태를 그대로 보여 준다. */
(function(){
  var html = document.documentElement;
  if (!('IntersectionObserver' in window)) return;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches || html.dataset.motion === 'off' ||
              (/HeadlessChrome/.test(navigator.userAgent) && html.dataset.motion !== 'live');

  /* 스크롤 등장: 섹션 제목, 격자의 칸, 사진 틀이 24px 아래에서 올라오며 나타난다(형제 순서대로 90ms씩 늦게) */
  if (!still) {
    var els = document.querySelectorAll('main > .section:not(.hero) :is(.section-head, .section-head--split, .grid > *, .wrap > .frame)');
    els.forEach(function(el){
      var i = 0, n = el; while ((n = n.previousElementSibling)) i++;
      el.style.setProperty('--i', Math.min(i, 5)); el.classList.add('rv');
    });
    html.classList.add('rv-on');
    /* 보이면 등장; 이미 화면 위로 지나간 것(앵커로 건너뛴 경우)도 바로 보여 준다 */
    var rio = new IntersectionObserver(function(es){ es.forEach(function(e){ if (e.isIntersecting || e.boundingClientRect.bottom < 0) { e.target.classList.add('is-in'); rio.unobserve(e.target); } }); }, {rootMargin: '0px 0px -10% 0px'});
    els.forEach(function(el){ rio.observe(el); });
  }

  /* 구역 입자(먼지·별): 보일 때만 움직인다 */
  var aio = new IntersectionObserver(function(es){ es.forEach(function(e){ e.target.classList.toggle('in-view', e.isIntersecting); }); });
  document.querySelectorAll('[data-ambient]').forEach(function(el){ aio.observe(el); });

  /* 메뉴 현재 위치: 화면 가운데에 있는 구역의 메뉴 글자에 밑줄 */
  var map = {games:'#games', deepfold:'#games', how:'#games', letters:'#games', soulsaver:'#games', 'ss-play':'#games', news:'#news', studio:'#studio'};
  var links = {}; document.querySelectorAll('.nav__links .nav__link[href^="#"]').forEach(function(a){ links[a.getAttribute('href')] = a; });
  var nio = new IntersectionObserver(function(es){
    es.forEach(function(e){ if (!e.isIntersecting) return;
      Object.keys(links).forEach(function(k){ links[k].removeAttribute('aria-current'); });
      var a = links[map[e.target.id]]; if (a) a.setAttribute('aria-current', 'page');
    });
  }, {rootMargin: '-45% 0px -45% 0px'});
  Object.keys(map).forEach(function(id){ var s = document.getElementById(id); if (s) nio.observe(s); });
})();
