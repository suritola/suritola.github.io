(function(){
  var q = new URLSearchParams(location.search);
  if (q.has('static')) document.documentElement.classList.add('static');
  if (q.has('static') || q.has('debug')) document.querySelectorAll('img[loading=lazy]').forEach(function(i){ i.loading = 'eager'; }); // capture: load every picture

  /* copy email */
  var copyBtn = document.getElementById('copyBtn'), copied = document.getElementById('copied'), copyTimer;
  copyBtn.addEventListener('click', function(){
    var mail = document.getElementById('mailText').textContent, en = document.documentElement.lang === 'en';
    var done = function(ok){
      copied.textContent = ok ? (en ? 'Copied' : '복사했습니다') : (en ? 'Copy failed. Select the address instead.' : '복사 실패. 주소를 직접 선택해 주세요.');
      clearTimeout(copyTimer); copyTimer = setTimeout(function(){ copied.textContent = ''; }, 3000);
    };
    if (navigator.clipboard) navigator.clipboard.writeText(mail).then(function(){ done(true); }, function(){ done(false); });
    else done(false);
  });

  /* screenshots: lightbox */
  var lb = document.getElementById('lb'), lbImg = document.getElementById('lbImg'), lbCap = document.getElementById('lbCap'), lbCount = document.getElementById('lbCount');
  var cur = {items:[], i:0};
  function show(i){
    cur.i = (i + cur.items.length) % cur.items.length;
    var img = cur.items[cur.i].querySelector('img');
    lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lbImg.width = img.width; lbImg.height = img.height;
    lbCap.textContent = img.alt;
    lbCount.textContent = (cur.i+1) + ' / ' + cur.items.length;
  }
  document.querySelectorAll('[data-gal]').forEach(function(gal){
    var items = Array.prototype.slice.call(gal.querySelectorAll('.shot'));
    items.forEach(function(btn, i){ btn.addEventListener('click', function(){ cur.items = items; show(i); lb.showModal(); }); });
  });
  document.getElementById('lbClose').addEventListener('click', function(){ lb.close(); });
  document.getElementById('lbPrev').addEventListener('click', function(){ show(cur.i-1); });
  document.getElementById('lbNext').addEventListener('click', function(){ show(cur.i+1); });
  lb.addEventListener('click', function(e){ if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function(e){ if (e.key==='ArrowLeft') show(cur.i-1); else if (e.key==='ArrowRight') show(cur.i+1); });
  lb.addEventListener('close', function(){ lbImg.src=''; });

  /* current section in the nav */
  if ('IntersectionObserver' in window) {
    var links = {}; document.querySelectorAll('.nav a[href^="#"]').forEach(function(a){ links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ var a = links[e.target.id]; if (a) a.setAttribute('aria-current', e.isIntersecting ? 'true' : 'false'); }); }, {rootMargin:'-45% 0px -45% 0px'});
    Object.keys(links).forEach(function(id){ var s = document.getElementById(id); if (s) io.observe(s); });
  }

  /* ?debug: list elements wider than the viewport */
  if (q.has('debug')) addEventListener('load', function(){
    var w = innerWidth, bad = [];
    document.querySelectorAll('body *').forEach(function(el){
      if (el.id === 'dbg' || el.closest('dialog')) return;
      var r = el.getBoundingClientRect();
      if (r.width && (r.right > w + 1 || r.left < -1)) bad.push(el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ').join('.') : '') + '[' + Math.round(r.left) + ',' + Math.round(r.right) + ']');
    });
    var d = document.createElement('pre'); d.id = 'dbg';
    d.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;margin:0;padding:6px;background:#000;color:#0f0;font:11px/1.3 monospace;max-width:100%;white-space:pre-wrap;word-break:break-all';
    d.textContent = 'DBG innerW=' + w + ' scrollW=' + document.documentElement.scrollWidth + ' H=' + document.documentElement.scrollHeight + '\n' + bad.slice(0, 40).join('\n');
    document.body.appendChild(d);
  });
})();
