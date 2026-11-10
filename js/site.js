/* 민공방 게임즈 공통 스크립트: KO/EN 전환 · 머리 · 모바일 메뉴 · 회원(Supabase) 모달 */
(function(){
  var q = new URLSearchParams(location.search);
  var CFG = window.MG_CONFIG || {};
  var SITE = (CFG.SITE_URL || location.origin).replace(/\/$/, '');
  var SB_CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js';
  function en(){ return document.documentElement.lang === 'en'; }
  function t(ko, e){ return en() ? e : ko; }

  /* ---------- language (KO/EN) ---------- */
  var ATTRS = [['data-en','text'],['data-en-alt','alt'],['data-en-label','aria-label'],['data-en-ph','placeholder']];
  function setLang(lang, root){
    ATTRS.forEach(function(pair){
      var attr = pair[0], target = pair[1], koAttr = attr.replace('-en','-ko');
      (root || document).querySelectorAll('['+attr+']').forEach(function(el){
        if (!el.hasAttribute(koAttr)) el.setAttribute(koAttr, target==='text' ? el.innerHTML : (el.getAttribute(target)||''));
        var v = el.getAttribute(lang==='en' ? attr : koAttr);
        if (target!=='text') el.setAttribute(target, v);
        else if (lang==='en') el.textContent = v;
        else el.innerHTML = v; // KO side keeps its own markup (nowrap spans)
      });
    });
    if (root) return;
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang button').forEach(function(b){ b.setAttribute('aria-pressed', String(b.dataset.lang===lang)); });
    try { localStorage.setItem('mg-lang', lang); } catch(e){}
    document.dispatchEvent(new CustomEvent('mg:lang'));
  }
  document.querySelectorAll('.lang button').forEach(function(b){ b.addEventListener('click', function(){ setLang(b.dataset.lang); }); });
  var saved = null; try { saved = localStorage.getItem('mg-lang'); } catch(e){}
  if ((q.get('lang') || saved || 'ko') === 'en') setLang('en');

  /* ---------- header + mobile menu ---------- */
  var header = document.getElementById('header');
  function onScroll(){ header.classList.toggle('scrolled', scrollY > 24); }
  if (header) { addEventListener('scroll', onScroll, {passive:true}); onScroll(); }
  var menu = document.getElementById('menu');
  if (menu) {
    document.getElementById('menuBtn').addEventListener('click', function(){ menu.showModal(); });
    document.getElementById('menuClose').addEventListener('click', function(){ menu.close(); });
    menu.querySelectorAll('a').forEach(function(a){ a.addEventListener('click', function(){ menu.close(); }); });
    menu.addEventListener('click', function(e){ if (e.target === menu) menu.close(); });
    if (q.has('menu')) menu.showModal(); // screenshot check
  }

  /* ---------- small helpers shared with board.js / profile.js ---------- */
  // h('div', {class:'x', onclick:fn}, [text, node]) — user text always goes through textContent, never innerHTML
  function h(tag, attrs, kids){
    var el = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function(k){
      if (k.slice(0,2) === 'on') el.addEventListener(k.slice(2), attrs[k]);
      else if (k === 'html') el.innerHTML = attrs[k];          // trusted template strings only
      else if (attrs[k] !== null && attrs[k] !== undefined && attrs[k] !== false) el.setAttribute(k, attrs[k] === true ? '' : attrs[k]);
    });
    [].concat(kids || []).forEach(function(c){ if (c === null || c === undefined || c === false) return; el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function fmtDate(iso, withTime){
    var d = new Date(iso);
    var o = withTime ? {year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'} : {year:'numeric',month:'2-digit',day:'2-digit'};
    return d.toLocaleString(en() ? 'en-US' : 'ko-KR', o);
  }
  var toastEl, toastTimer;
  function say(msg){
    if (!toastEl) { toastEl = h('div', {class:'toast', role:'status', 'aria-live':'polite'}); document.body.appendChild(toastEl); }
    toastEl.textContent = msg; toastEl.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function(){ toastEl.classList.remove('show'); }, 3200);
  }
  function setErr(input, msg){
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    var e = document.getElementById(input.id + '-err'); if (e) e.textContent = msg || '';
  }
  // Field-by-field check; messages land next to the field. Returns true when the form is clean.
  function validate(form){
    var ok = true;
    form.querySelectorAll('input,textarea,select').forEach(function(f){
      var msg = '', v = (f.value || '').trim();
      if (f.type === 'checkbox') { if (f.required && !f.checked) msg = t('동의가 필요합니다.', 'Required.'); }
      else if (f.required && !v) msg = t('필수 항목입니다.', 'Required.');
      else if (v && f.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = t('이메일 형식이 아닙니다.', 'Not a valid email.');
      else if (v && f.minLength > 0 && v.length < f.minLength) msg = t(f.minLength + '자 이상이어야 합니다.', 'At least ' + f.minLength + ' characters.');
      else if (v && f.maxLength > 0 && v.length > f.maxLength) msg = t(f.maxLength + '자까지만 쓸 수 있습니다.', 'At most ' + f.maxLength + ' characters.');
      else if (v && f.dataset.nick !== undefined && !/^[\p{L}\p{N}_ ]{2,20}$/u.test(v)) msg = t('닉네임은 2~20자의 글자·숫자·밑줄만 쓸 수 있습니다.', 'Nickname: 2–20 letters, digits or underscores.');
      setErr(f, msg); if (msg) ok = false;
    });
    var first = form.querySelector('[aria-invalid=true]'); if (first) first.focus();
    return ok;
  }
  function errMsg(e){
    var m = (e && e.message) || String(e || '');
    if (/^rate_limit:/.test(m) || /닉네임에 쓸 수 없습니다/.test(m)) return m; // server messages written for the player
    if (/Invalid login credentials/i.test(m)) return t('이메일 또는 비밀번호가 맞지 않습니다.', 'Wrong email or password.');
    if (/already registered|already been registered/i.test(m)) return t('이미 가입된 이메일입니다.', 'This email is already registered.');
    if (/Email not confirmed/i.test(m)) return t('메일함에서 인증 링크를 먼저 눌러 주세요.', 'Please confirm your email first.');
    if (/rate.?limit|too many|over_email_send_rate/i.test(m)) return t('요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.', 'Too many requests. Please try again in a minute.');
    if (/profiles_nickname_key|duplicate key/i.test(m)) return t('이미 쓰는 닉네임입니다.', 'That nickname is taken.');
    if (/Password should be/i.test(m)) return t('비밀번호가 너무 짧거나 단순합니다.', 'Password is too short or too simple.');
    if (/row-level security|permission denied|not allowed/i.test(m)) return t('권한이 없습니다. 로그인 상태를 확인해 주세요.', 'Not allowed. Check that you are logged in.');
    if (/Failed to fetch|NetworkError/i.test(m)) return t('서버에 연결할 수 없습니다.', 'Could not reach the server.');
    if (m) console.warn('[auth]', m);
    return t('알 수 없는 오류가 났습니다. 잠시 후 다시 시도해 주세요.', 'Something went wrong. Please try again.');
  }

  /* ---------- auth state ---------- */
  var ICON_USER = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
  var sb = null, session = null, profile = null, listeners = [], inited = false;
  function configured(){ return !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY); }
  function emit(){ inited = true; renderAuth(); listeners.forEach(function(f){ try { f(session, profile); } catch(e){ console.error(e); } }); }
  function onAuth(f){ listeners.push(f); if (inited) f(session, profile); }
  function loadProfile(){
    if (!session) { profile = null; return Promise.resolve(); }
    return sb.from('profiles').select('id,nickname,role,newsletter_opt_in,created_at').eq('id', session.user.id).maybeSingle()
      .then(function(r){ profile = r.data || null; }, function(){ profile = null; });
  }
  function refreshProfile(){ return loadProfile().then(emit); }
  function displayName(){ return (profile && profile.nickname) || (session && session.user.email ? session.user.email.split('@')[0] : ''); }

  renderAuth(); // login button at once; the real state replaces it when the session is known
  if (configured()) {
    var s = document.createElement('script'); s.src = SB_CDN; s.integrity = 'sha384-2zrRDgDHSYB/GN3nFW3fsZXoxEhKIr3N2h63Tc6DEOB9JJdFIu8xMJT2Cph/gBil'; s.crossOrigin = 'anonymous';
    s.onload = function(){
      sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
      MG.sb = sb;
      sb.auth.onAuthStateChange(function(ev, sess){
        session = sess;
        // supabase-js holds an auth lock inside this callback: do DB work on the next tick (docs recommendation)
        setTimeout(function(){
          if (ev === 'PASSWORD_RECOVERY') openAuth('newpass');
          loadProfile().then(emit);
        }, 0);
      });
    };
    s.onerror = function(){ emit(); say(t('회원 서비스를 불러오지 못했습니다.', 'Could not load the member service.')); };
    document.head.appendChild(s);
  } else {
    emit();
  }

  /* ---------- header: login button / user menu ---------- */
  function renderAuth(){
    var box = document.getElementById('auth'); if (!box) return;
    box.textContent = '';
    if (!session) {
      box.appendChild(h('button', {class:'auth-btn', type:'button', onclick:function(){ openAuth('login'); }, html: ICON_USER + '<span data-en="Log in">로그인</span>'}));
    } else {
      var name = displayName(), meta = session.user.user_metadata || {};
      var avatar = meta.avatar_url ? h('img', {class:'avatar', src: meta.avatar_url, alt:'', width:36, height:36, referrerpolicy:'no-referrer'}) : h('span', {class:'avatar', 'aria-hidden':'true'}, name.charAt(0).toUpperCase());
      var det = h('details', {class:'auth-menu'}, [
        h('summary', {'aria-label': t('내 메뉴', 'My menu')}, [avatar, h('span', {class:'nick'}, name)]),
        h('menu', {}, [
          h('li', {}, h('a', {href:'profile.html', html:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg><span data-en="My profile">내 프로필</span>'})),
          profile && profile.role === 'admin' ? h('li', {}, h('a', {href:'board.html#admin', html:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg><span data-en="Admin">관리</span>'})) : null,
          h('li', {}, h('button', {type:'button', onclick:function(){ sb.auth.signOut().then(function(){ say(t('로그아웃했습니다.', 'Logged out.')); }); }, html:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M10 17l5-5-5-5M15 12H3M21 3v18"/></svg><span data-en="Log out">로그아웃</span>'}))
        ])
      ]);
      box.appendChild(det);
    }
    setLang(document.documentElement.lang, box);
  }
  document.addEventListener('click', function(e){ document.querySelectorAll('.auth-menu[open]').forEach(function(d){ if (!d.contains(e.target)) d.removeAttribute('open'); }); });

  /* ---------- auth modal ---------- */
  var dlg = null;
  function field(id, label, type, extra){
    return '<div class="field"><label for="'+id+'">'+label+'</label><input class="input" id="'+id+'" name="'+id+'" type="'+type+'" '+(extra||'')+'><p class="err" id="'+id+'-err" aria-live="polite"></p></div>';
  }
  function buildDialog(){
    var legal = '<a href="terms.html" target="_blank" rel="noopener" data-en="Terms">이용약관</a>·<a href="privacy.html" target="_blank" rel="noopener" data-en="Privacy Policy">개인정보처리방침</a>';
    dlg = h('dialog', {class:'dlg', id:'authDlg', 'aria-labelledby':'authTitle', html:
      '<div class="dlg-in">' +
      '<button class="dlg-close" type="button" aria-label="닫기" data-en-label="Close"><svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg></button>' +
      '<div class="dlg-head"><img class="mark" src="img/logo-mark.svg" width="36" height="36" alt="">' +
      '<h2 id="authTitle" data-en="MinGongbang Games account">민공방 게임즈 계정</h2></div>' +
      '<p class="notice" id="authNotice" hidden><b data-en="Member features are coming soon.">회원 기능 준비 중입니다.</b> <span data-en="Sign-up and login will open soon.">가입과 로그인은 곧 열립니다.</span></p>' +
      '<div class="seg" role="tablist" aria-label="로그인 또는 가입" data-en-label="Log in or sign up">' +
      '<button type="button" role="tab" id="tabLogin" aria-controls="fLogin" aria-selected="true" data-view="login" data-en="Log in">로그인</button>' +
      '<button type="button" role="tab" id="tabSignup" aria-controls="fSignup" aria-selected="false" data-view="signup" data-en="Sign up">가입</button></div>' +
      // login
      '<form id="fLogin" role="tabpanel" aria-labelledby="tabLogin" data-view="login" novalidate>' +
      field('lEmail', '<span data-en="Email">이메일</span>', 'email', 'autocomplete="email" required') +
      field('lPass', '<span data-en="Password">비밀번호</span>', 'password', 'autocomplete="current-password" required') +
      '<p class="err form-err" aria-live="polite"></p>' +
      '<button class="btn btn--block" type="submit"><span data-en="Log in">로그인</span></button>' +
      '<button class="link" type="button" data-view="reset" data-en="Forgot your password?">비밀번호를 잊었나요?</button>' +
      '</form>' +
      // signup
      '<form id="fSignup" role="tabpanel" aria-labelledby="tabSignup" data-view="signup" novalidate hidden>' +
      field('sNick', '<span data-en="Nickname">닉네임</span>', 'text', 'autocomplete="nickname" required minlength="2" maxlength="20" data-nick') +
      field('sEmail', '<span data-en="Email">이메일</span>', 'email', 'autocomplete="email" required') +
      field('sPass', '<span data-en="Password (8+ characters)">비밀번호 (8자 이상)</span>', 'password', 'autocomplete="new-password" required minlength="8"') +
      '<div class="checks">' +
      '<label class="check"><input type="checkbox" id="sAge" required><span data-en="I am 14 or older. (required)">만 14세 이상입니다. <b>(필수)</b></span></label><p class="err" id="sAge-err" aria-live="polite"></p>' +
      '<label class="check"><input type="checkbox" id="sTerms" required><span><span data-en="I agree to the ">다음에 동의합니다: </span>'+legal+' <b data-en="(required)">(필수)</b></span></label><p class="err" id="sTerms-err" aria-live="polite"></p>' +
      '<label class="check"><input type="checkbox" id="sNews"><span data-en="Email me news and launch announcements. (optional)">소식·출시 알림 메일을 받겠습니다. <b>(선택)</b></span></label>' +
      '</div>' +
      '<p class="err form-err" aria-live="polite"></p>' +
      '<button class="btn btn--block" type="submit"><span data-en="Create account">가입하기</span></button>' +
      '</form>' +
      // reset
      '<form id="fReset" data-view="reset" novalidate hidden>' +
      '<h3 data-en="Reset password">비밀번호 재설정</h3><p class="hint" data-en="We will email you a link to set a new password.">새 비밀번호를 정할 수 있는 링크를 메일로 보내 드립니다.</p>' +
      field('rEmail', '<span data-en="Email">이메일</span>', 'email', 'autocomplete="email" required') +
      '<p class="err form-err" aria-live="polite"></p>' +
      '<button class="btn btn--block" type="submit"><span data-en="Send reset link">재설정 메일 보내기</span></button>' +
      '<button class="link" type="button" data-view="login" data-en="Back to log in">로그인으로 돌아가기</button>' +
      '</form>' +
      // new password (after recovery link)
      '<form id="fNewpass" data-view="newpass" novalidate hidden>' +
      '<h3 data-en="Set a new password">새 비밀번호 정하기</h3>' +
      field('nPass', '<span data-en="New password (8+ characters)">새 비밀번호 (8자 이상)</span>', 'password', 'autocomplete="new-password" required minlength="8"') +
      '<p class="err form-err" aria-live="polite"></p>' +
      '<button class="btn btn--block" type="submit"><span data-en="Change password">비밀번호 바꾸기</span></button>' +
      '</form>' +
      // oauth
      '<div class="oauth" id="oauth" hidden><span class="or" data-en="or">또는</span>' +
      '<button class="btn btn--light btn--block" type="button" id="googleBtn"><svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="fill:currentColor;stroke:none"><path d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.7h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3z"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z"/><path d="M6.4 13.9A6 6 0 0 1 6.1 12c0-.7.1-1.3.3-1.9V7.5H3.1A10 10 0 0 0 2 12c0 1.6.4 3.1 1.1 4.5l3.3-2.6z"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.5l3.3 2.6C7.2 7.7 9.4 5.9 12 5.9z"/></svg><span data-en="Continue with Google">Google로 계속</span></button>' +
      '<p class="hint" data-en="By continuing you confirm you are 14 or older and agree to the Terms and Privacy Policy.">계속하면 만 14세 이상임을 확인하고 이용약관·개인정보처리방침에 동의하는 것으로 봅니다.</p></div>' +
      '</div>'});
    document.body.appendChild(dlg);
    dlg.querySelector('.dlg-close').addEventListener('click', function(){ dlg.close(); });
    dlg.addEventListener('click', function(e){ if (e.target === dlg) dlg.close(); });
    dlg.querySelectorAll('[data-view]:not(form)').forEach(function(b){ b.addEventListener('click', function(){ showView(b.dataset.view); }); });
    dlg.querySelector('#fLogin').addEventListener('submit', submitLogin);
    dlg.querySelector('#fSignup').addEventListener('submit', submitSignup);
    dlg.querySelector('#fReset').addEventListener('submit', submitReset);
    dlg.querySelector('#fNewpass').addEventListener('submit', submitNewpass);
    dlg.querySelector('#googleBtn').addEventListener('click', function(){
      if (!needSb(dlg.querySelector('form:not([hidden])'))) return;
      sb.auth.signInWithOAuth({provider:'google', options:{redirectTo: location.origin + location.pathname}}).then(function(r){ if (r.error) formErr(dlg.querySelector('form:not([hidden])'), errMsg(r.error)); });
    });
  }
  function showView(v){
    dlg.querySelectorAll('form').forEach(function(f){ f.hidden = f.dataset.view !== v; f.querySelectorAll('.err').forEach(function(e){ e.textContent = ''; }); });
    dlg.querySelectorAll('[role=tab]').forEach(function(b){ b.setAttribute('aria-selected', String(b.dataset.view === v)); });
    dlg.querySelector('.seg').hidden = (v === 'reset' || v === 'newpass');
    dlg.querySelector('#oauth').hidden = !(CFG.GOOGLE_ENABLED && configured() && (v === 'login' || v === 'signup'));
    var first = dlg.querySelector('form[data-view="'+v+'"] input'); if (first) first.focus();
  }
  function openAuth(view){
    if (!dlg) buildDialog();
    var off = !configured();
    dlg.querySelector('#authNotice').hidden = !off;
    dlg.querySelectorAll('input,button[type=submit]').forEach(function(x){ x.disabled = off; });
    setLang(document.documentElement.lang, dlg);
    if (!dlg.open) dlg.showModal();
    showView(view || 'login');
  }
  function formErr(form, msg){ var e = form.querySelector('.form-err'); if (e) e.textContent = msg || ''; }
  function needSb(form){ if (sb) return true; formErr(form, t('연결 중입니다. 잠시 후 다시 눌러 주세요.', 'Connecting… please try again in a moment.')); return false; }
  function busy(form, on){ var b = form.querySelector('[type=submit]'); b.disabled = on; b.classList.toggle('busy', on); }
  function submitLogin(e){
    e.preventDefault(); var f = e.target; if (!needSb(f) || !validate(f)) return; busy(f, true); formErr(f, '');
    sb.auth.signInWithPassword({email: f.lEmail.value.trim(), password: f.lPass.value}).then(function(r){
      busy(f, false);
      if (r.error) return formErr(f, errMsg(r.error));
      dlg.close(); f.reset(); say(t('로그인했습니다.', 'Logged in.'));
    });
  }
  function submitSignup(e){
    e.preventDefault(); var f = e.target; if (!needSb(f) || !validate(f)) return; busy(f, true); formErr(f, '');
    sb.auth.signUp({email: f.sEmail.value.trim(), password: f.sPass.value, options:{
      emailRedirectTo: SITE + '/profile.html',
      data: {nickname: f.sNick.value.trim(), newsletter_opt_in: f.sNews.checked, age_14_plus: true, agreed_terms: true}
    }}).then(function(r){
      busy(f, false);
      if (r.error) return formErr(f, errMsg(r.error));
      if (r.data.session) { dlg.close(); f.reset(); say(t('가입이 완료되었습니다. 「공방 첫 손님」 배지를 받았습니다.', 'You\'re signed up. You earned the “First Guest” badge.')); return; }
      // email confirmation is on: Supabase also answers this way for an already-registered address (no account enumeration)
      f.querySelectorAll('.field,.checks,[type=submit]').forEach(function(x){ x.hidden = true; });
      f.querySelector('.form-err').className = 'ok-msg';
      f.querySelector('.ok-msg').textContent = t('확인 메일을 보냈습니다. 메일의 링크를 누르면 가입이 끝납니다. (이미 가입한 주소라면 로그인해 주세요.)', 'Check your inbox: click the link in the email to finish signing up. (Already registered? Just log in.)');
    });
  }
  function submitReset(e){
    e.preventDefault(); var f = e.target; if (!needSb(f) || !validate(f)) return; busy(f, true); formErr(f, '');
    sb.auth.resetPasswordForEmail(f.rEmail.value.trim(), {redirectTo: SITE + '/profile.html'}).then(function(r){
      busy(f, false);
      if (r.error) return formErr(f, errMsg(r.error));
      f.querySelector('.form-err').className = 'ok-msg';
      f.querySelector('.ok-msg').textContent = t('재설정 메일을 보냈습니다. 메일함을 확인해 주세요.', 'Reset email sent. Please check your inbox.');
    });
  }
  function submitNewpass(e){
    e.preventDefault(); var f = e.target; if (!needSb(f) || !validate(f)) return; busy(f, true); formErr(f, '');
    sb.auth.updateUser({password: f.nPass.value}).then(function(r){
      busy(f, false);
      if (r.error) return formErr(f, errMsg(r.error));
      dlg.close(); f.reset(); say(t('비밀번호를 바꿨습니다.', 'Password changed.'));
    });
  }
  document.addEventListener('mg:lang', function(){ if (dlg) setLang(document.documentElement.lang, dlg); if (inited) renderAuth(); });
  if (q.has('auth')) addEventListener('DOMContentLoaded', function(){ openAuth(q.get('auth') || 'login'); }); // screenshot check

  window.MG = {
    t: t, h: h, say: say, fmtDate: fmtDate, validate: validate, setErr: setErr, errMsg: errMsg, setLang: setLang,
    configured: configured, onAuth: onAuth, openAuth: openAuth, refreshProfile: refreshProfile,
    sb: null, get session(){ return session; }, get profile(){ return profile; },
    isAdmin: function(){ return !!(profile && profile.role === 'admin'); }
  };
})();
