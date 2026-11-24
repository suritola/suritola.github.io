/* 소식 글의 영상: 언어에 맞는 판으로 바꾸고, 관리자에게만 고화질 원본 받기를 보여 준다.
   원본은 Supabase 비공개 버킷 admin-media(읽기 정책: public.is_admin())에 있다. 50MB 넘는 파일은 조각으로 올려 두고 받을 때 합친다. */
(function () {
  var t = MG.t, h = MG.h, say = MG.say;
  var BUCKET = 'admin-media';
  var FILES = window.NEWS_MEDIA || [];

  function swap() {
    var lang = document.documentElement.lang === 'en' ? 'en' : 'ko';
    document.querySelectorAll('video[data-ko]').forEach(function (v) {
      var src = v.getAttribute('data-' + lang), poster = v.getAttribute('data-poster-' + lang);
      if (v.getAttribute('src') === src) return;
      v.pause(); v.setAttribute('src', src); if (poster) v.setAttribute('poster', poster); v.load();
    });
  }
  swap();
  document.addEventListener('mg:lang', swap);

  var box = document.getElementById('adminDl');
  function save(blob, name) {
    var a = h('a', { href: URL.createObjectURL(blob), download: name });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 60000);
  }
  function get(f, btn) {
    btn.disabled = true;
    var blobs = [], i = 0;
    function next() {
      if (i >= f.parts.length) return Promise.resolve();
      btn.textContent = t('받는 중 ', 'Downloading ') + (i + 1) + ' / ' + f.parts.length;
      return MG.sb.storage.from(BUCKET).download(f.parts[i]).then(function (r) {
        if (r.error) throw r.error;
        blobs.push(r.data); i++; return next();
      });
    }
    next().then(function () {
      var blob = new Blob(blobs, { type: 'video/mp4' });
      if (blob.size !== f.size) throw new Error(t('크기가 맞지 않습니다', 'Size mismatch'));
      save(blob, f.name);
      btn.textContent = t('다시 받기', 'Download again');
    }).catch(function (e) {
      say(MG.errMsg(e)); btn.textContent = t('다시 시도', 'Retry');
    }).then(function () { btn.disabled = false; });
  }
  function render() {
    box.textContent = '';
    if (!MG.isAdmin()) { box.hidden = true; return; }
    box.hidden = false;
    box.appendChild(h('h2', {}, t('관리자: 고화질 원본 받기', 'Admin: download the originals')));
    box.appendChild(h('p', { class: 'hint' }, t('관리자에게만 보입니다. 편집 전 원본 그대로(1080p 60fps)입니다.', 'Only admins see this. Untouched masters (1080p 60fps).')));
    var ul = h('ul', { class: 'dl-list' });
    FILES.forEach(function (f) {
      var btn = h('button', { class: 'btn btn--sm', type: 'button' }, t('받기', 'Download'));
      btn.addEventListener('click', function () { get(f, btn); });
      ul.appendChild(h('li', { class: 'row' }, [h('span', {}, f.label + ' · ' + (f.size / 1048576).toFixed(0) + ' MB'), btn]));
    });
    box.appendChild(ul);
  }
  MG.onAuth(render);
})();
