/* 다운로드 탭: 게임 목록 → (베타 게임) 베타 코드 입력 화면 → 맞는 코드면 zip 받기 시작.
   베타 코드는 사이트 전체에 하나다. 한 번 맞게 넣으면 이 탭을 닫을 때까지 다른 게임도 다시 묻지 않는다. */
(function () {
  var view = document.getElementById('dl');
  if (!view) return;
  var games = window.MG_DOWNLOADS || [];
  var STORE = 'mg-beta-code';

  function en() { return document.documentElement.lang === 'en'; }
  function t(ko, e) { return en() ? e : ko; }
  function pick(g, k) { return en() && g[k + 'En'] ? g[k + 'En'] : g[k] || ''; }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function savedCode() { try { return sessionStorage.getItem(STORE) || ''; } catch (e) { return ''; } }
  function remember(code) { try { sessionStorage.setItem(STORE, code); } catch (e) {} }
  function find(id) {
    for (var i = 0; i < games.length; i++) if (games[i].id === id) return games[i];
    return null;
  }
  function meta(g) {
    return [g.version && t('버전 ', 'Version ') + g.version, g.size, g.platform].filter(Boolean).map(esc).join(' · ');
  }

  // ---------- 목록 ----------
  function list() {
    view.innerHTML =
      '<div class="dl-grid">' + games.map(card).join('') + '</div>' +
      '<p class="hint dl-note">' + t('베타 테스트 게임은 개발자에게 받은 베타 코드가 있어야 받을 수 있습니다.', 'Beta builds need the beta code you received from the developer.') + '</p>';
  }

  function card(g) {
    var action = g.lock
      ? '<a class="btn" href="#get/' + esc(g.id) + '">' + t('다운로드', 'Download') + '</a>'
      : g.href
        ? '<a class="btn btn--light" href="' + esc(g.href) + '" target="_blank" rel="noopener">' + t('Steam에서 받기', 'Get it on Steam') + '</a>'
        : '<span class="hint">' + t('준비 중입니다', 'Coming soon') + '</span>';
    return (
      '<article class="dl-card">' +
      '<img src="' + esc(g.img) + '" width="720" height="405" alt="' + esc(pick(g, 'imgAlt')) + '" loading="lazy">' +
      '<div class="dl-body">' +
      '<p><span class="tag' + (g.lock ? ' tag--beta' : '') + '">' + esc(pick(g, 'tag')) + '</span></p>' +
      '<h2>' + esc(pick(g, 'title')) + '</h2>' +
      '<p>' + esc(pick(g, 'sub')) + '</p>' +
      '<p class="dl-meta">' + meta(g) + '</p>' +
      '<div class="dl-actions">' + action + '</div>' +
      '</div></article>'
    );
  }

  // ---------- 베타 코드 입력 ----------
  function keyScreen(g) {
    view.innerHTML =
      '<p><a class="link dl-back" href="#">' + t('← 다운로드 목록', '← All downloads') + '</a></p>' +
      '<div class="card dl-key">' +
      '<p><span class="tag tag--beta">' + esc(pick(g, 'tag')) + '</span></p>' +
      '<h2>' + esc(pick(g, 'title')) + '</h2>' +
      '<p class="dl-meta">' + meta(g) + '</p>' +
      '<form class="stack" id="keyForm" novalidate>' +
      '<div class="field"><label for="code">' + t('베타 코드', 'Beta code') + '</label>' +
      '<input class="input" id="code" name="code" type="text" inputmode="text" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="BETA-XXXX-XXXX" aria-describedby="codeHelp codeErr" required>' +
      '<p class="hint" id="codeHelp">' + t('개발자에게 받은 코드를 입력하세요. 대소문자와 하이픈(-)은 가리지 않습니다.', 'Enter the code you received from the developer. Case and dashes do not matter.') + '</p>' +
      '<p class="err" id="codeErr" role="alert"></p></div>' +
      '<button class="btn" type="submit" id="codeBtn">' + t('확인하고 다운로드', 'Check and download') + '</button>' +
      '</form></div>';
    var form = document.getElementById('keyForm');
    var input = document.getElementById('code');
    var btn = document.getElementById('codeBtn');
    var err = document.getElementById('codeErr');
    input.focus();
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var code = input.value;
      err.textContent = '';
      input.removeAttribute('aria-invalid');
      if (!window.MGBeta.norm(code)) {
        err.textContent = t('베타 코드를 입력하세요.', 'Enter your beta code.');
        input.setAttribute('aria-invalid', 'true');
        return;
      }
      btn.disabled = true;
      btn.textContent = t('확인하는 중...', 'Checking...');
      window.MGBeta.open(g.lock, code).then(function (inside) {
        if (!inside) {
          btn.disabled = false;
          btn.textContent = t('확인하고 다운로드', 'Check and download');
          err.textContent = t('코드가 맞지 않습니다. 다시 확인해 주세요.', 'That code is not right. Please check it and try again.');
          input.setAttribute('aria-invalid', 'true');
          input.select();
          return;
        }
        remember(code);
        start(g, inside.url, true);
      });
    });
  }

  // ---------- 받기 ----------
  function start(g, url, now) {
    view.innerHTML =
      '<p><a class="link dl-back" href="#">' + t('← 다운로드 목록', '← All downloads') + '</a></p>' +
      '<div class="card dl-key">' +
      '<h2>' + esc(pick(g, 'title')) + '</h2>' +
      '<p class="ok-msg">' + t('다운로드를 시작합니다.', 'Your download is starting.') + '</p>' +
      '<p>' + t('시작되지 않으면 ', 'If it does not start, ') + '<a class="link" id="dlLink" href="' + esc(url) + '" rel="noopener">' + t('여기를 누르세요', 'click here') + '</a></p>' +
      '<ol class="dl-steps">' +
      '<li>' + t('받은 zip 파일의 압축을 풉니다.', 'Unzip the file you downloaded.') + '</li>' +
      '<li>' + t('폴더 안의 실행 파일(.exe)을 실행합니다.', 'Run the .exe inside the folder.') + '</li>' +
      '<li>' + t('Windows가 "PC 보호" 창을 띄우면 "추가 정보" → "실행"을 누릅니다.', 'If Windows shows "Windows protected your PC", choose "More info" → "Run anyway".') + '</li>' +
      '</ol></div>';
    // 새로 고침해도 다시 받지 않게, 주소는 받은 뒤 화면으로 바꿔 둔다
    if (history.replaceState) history.replaceState(null, '', '#done/' + g.id);
    if (now) document.getElementById('dlLink').click();
  }

  // ---------- 화면 고르기 ----------
  function route() {
    var m = /^#(get|done)\/(.+)$/.exec(location.hash);
    var g = m ? find(decodeURIComponent(m[2])) : null;
    if (!g || !g.lock) return list();
    var code = savedCode();
    if (!code) return keyScreen(g);
    window.MGBeta.open(g.lock, code).then(function (inside) {
      if (inside) start(g, inside.url, m[1] === 'get');
      else keyScreen(g);
    });
  }

  addEventListener('hashchange', route);
  document.addEventListener('mg:lang', route);
  route();
})();
