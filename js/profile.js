/* 내 프로필: 닉네임 · 소식 메일 동의 · 가입일 · 배지 · 회원 탈퇴(페이지 안 확인 단계, confirm() 없음) */
(function(){
  var t = MG.t, h = MG.h, say = MG.say, view = document.getElementById('view');
  if (window.top !== window.self) { view.hidden = true; try { window.top.location.href = location.href; } catch(e){} return; } // no framing (clickjacking on account deletion)
  var BADGE_ICON = {
    first_visit:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 21V5a2 2 0 0 1 2-2h8l6 6v12"/><path d="M14 3v6h6M9 14h6M9 18h6"/></svg>',
    first_voice:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.3A8 8 0 1 1 21 12z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>',
    _:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/></svg>'
  };
  var LOCK = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>';
  function avatar(session, name, cls){
    var meta = session.user.user_metadata || {};
    return meta.avatar_url ? h('img', {class:cls, src:meta.avatar_url, alt:'', referrerpolicy:'no-referrer'}) : h('span', {class:cls, 'aria-hidden':'true'}, name.charAt(0).toUpperCase());
  }

  function render(session, profile){
    view.textContent = '';
    if (!MG.configured()) return view.appendChild(h('div', {class:'card'}, h('p', {class:'notice'}, [h('b', {}, t('회원 기능 준비 중입니다.', 'Member features are coming soon.')), ' ', t('가입과 로그인이 열리면 여기서 프로필과 배지를 볼 수 있습니다.', 'Your profile and badges will appear here once sign-up opens.')])));
    if (!session) return view.appendChild(h('div', {class:'card row row--between'}, [h('p', {class:'lead'}, t('프로필과 배지를 보려면 로그인해 주세요.', 'Log in to see your profile and badges.')), h('button', {class:'btn', type:'button', onclick:function(){ MG.openAuth('login'); }}, t('로그인 / 가입', 'Log in / Sign up'))]));
    var uid = session.user.id, p = profile || {}, name = p.nickname || (session.user.email || '').split('@')[0];
    var left = h('div', {class:'stack'}), right = h('div', {class:'stack'});
    view.appendChild(h('div', {class:'profile-grid'}, [left, right]));

    /* me */
    var me = h('section', {class:'card stack', 'aria-labelledby':'meTitle'});
    me.appendChild(h('h2', {id:'meTitle', class:'sr'}, t('내 정보', 'My info')));
    me.appendChild(h('div', {class:'me'}, [avatar(session, name, 'avatar avatar--lg'), h('div', {class:'info'}, [h('b', {}, name), h('span', {}, session.user.email || ''), h('span', {}, t('가입일 ', 'Joined ') + MG.fmtDate(p.created_at || session.user.created_at)), p.role === 'admin' ? h('span', {class:'tag tag--admin'}, t('운영자', 'Staff')) : null])]));
    if (!profile) me.appendChild(h('p', {class:'notice'}, t('프로필 정보를 아직 불러오지 못했습니다. 새로 고침해 보세요.', 'Profile data is not available yet. Try reloading.')));
    // nickname
    var nf = h('form', {class:'stack', novalidate:true});
    nf.appendChild(h('div', {class:'field'}, [h('label', {for:'nick'}, t('닉네임', 'Nickname')), h('div', {class:'row'}, [h('input', {class:'input', id:'nick', name:'nick', type:'text', required:true, minlength:2, maxlength:20, 'data-nick':true, autocomplete:'nickname', value:p.nickname || '', style:'flex:1;min-width:160px'}), h('button', {class:'btn btn--sm', type:'submit'}, t('저장', 'Save'))]), h('p', {class:'err', id:'nick-err', 'aria-live':'polite'}), h('span', {class:'hint'}, t('2~20자, 글자·숫자·밑줄. 게시판에서 이 이름으로 보입니다.', '2–20 letters, digits or underscores. Shown on the board.'))]));
    nf.addEventListener('submit', function(e){
      e.preventDefault(); if (!MG.validate(nf)) return;
      var v = nf.nick.value.trim(); if (v === p.nickname) return;
      MG.sb.from('profiles').update({nickname:v}).eq('id', uid).then(function(r){
        if (r.error) return MG.setErr(nf.nick, MG.errMsg(r.error));
        say(t('닉네임을 바꿨습니다.', 'Nickname updated.')); MG.refreshProfile();
      });
    });
    me.appendChild(nf);
    // newsletter
    var nl = h('input', {type:'checkbox', id:'news', role:'switch', 'aria-checked': String(!!p.newsletter_opt_in)}); nl.checked = !!p.newsletter_opt_in;
    nl.addEventListener('change', function(){
      nl.disabled = true;
      MG.sb.from('profiles').update({newsletter_opt_in:nl.checked}).eq('id', uid).then(function(r){
        nl.disabled = false;
        if (r.error) { nl.checked = !nl.checked; return say(MG.errMsg(r.error)); }
        nl.setAttribute('aria-checked', String(nl.checked));
        say(nl.checked ? t('소식 메일을 받습니다.', 'You will receive news emails.') : t('소식 메일을 받지 않습니다.', 'You will not receive news emails.')); MG.refreshProfile();
      });
    });
    me.appendChild(h('label', {class:'toggle', for:'news'}, [h('span', {}, [h('b', {}, t('소식 메일 받기', 'News emails')), h('small', {}, t('출시, 체험판, 공지 소식을 메일로 보내 드립니다. 언제든 해제할 수 있습니다.', 'Launch, demo and announcement emails. Unsubscribe any time.'))]), nl]));
    left.appendChild(me);

    /* badges */
    var bc = h('section', {class:'card', 'aria-labelledby':'badgeTitle'}, [h('h2', {id:'badgeTitle'}, t('배지', 'Badges')), h('p', {class:'hint', style:'margin-bottom:14px'}, t('사이트 활동에 따라 자동으로 지급됩니다.', 'Awarded automatically for activity on the site.'))]);
    var list = h('p', {class:'muted'}, t('불러오는 중…', 'Loading…')); bc.appendChild(list); right.appendChild(bc);
    Promise.all([MG.sb.from('badges').select('*').order('sort'), MG.sb.from('user_badges').select('badge_code,awarded_at').eq('user_id', uid)]).then(function(rs){
      if (rs[0].error) { list.textContent = MG.errMsg(rs[0].error); return; }
      var mine = {}; (rs[1].data || []).forEach(function(b){ mine[b.badge_code] = b.awarded_at; });
      var ul = h('ul', {class:'badges'});
      (rs[0].data || []).forEach(function(b){
        var got = mine[b.code];
        ul.appendChild(h('li', {class:'badge' + (got ? '' : ' locked')}, [
          h('span', {class:'ic', html: got ? (BADGE_ICON[b.code] || BADGE_ICON._) : LOCK}),
          h('b', {}, t(b.name_ko, b.name_en)),
          h('small', {}, t(b.desc_ko, b.desc_en)),
          got ? h('time', {datetime:got}, MG.fmtDate(got)) : h('small', {}, t('아직 없음', 'Not yet'))
        ]));
      });
      list.replaceWith(ul);
    });

    /* delete account */
    var dz = h('section', {class:'card danger-zone stack', 'aria-labelledby':'delTitle'});
    dz.appendChild(h('h2', {id:'delTitle'}, t('회원 탈퇴', 'Delete account')));
    dz.appendChild(h('p', {class:'hint'}, t('탈퇴하면 계정과 함께 아래 정보가 바로, 영구히 지워집니다. 되돌릴 수 없습니다.', 'Deleting your account removes the following immediately and permanently. This cannot be undone.')));
    dz.appendChild(h('ul', {}, [h('li', {}, t('이메일·비밀번호·닉네임·소식 메일 동의 등 계정과 프로필', 'Account and profile: email, password, nickname, newsletter consent')), h('li', {}, t('내가 쓴 글·댓글·신고 전부', 'Every post, comment and report you wrote')), h('li', {}, t('받은 배지', 'Your badges'))]));
    dz.appendChild(h('p', {class:'hint'}, t('인증 서버의 접속 기록은 위탁사(Supabase)의 보존 정책에 따라 일정 기간 뒤 지워집니다.', 'Authentication server logs are removed later under the processor\'s (Supabase) retention policy.')));
    var start = h('button', {class:'btn--ghost danger', type:'button'}, t('탈퇴 절차 시작', 'Start account deletion'));
    start.addEventListener('click', function(){
      start.hidden = true;
      var f = h('form', {class:'confirm', novalidate:true});
      f.appendChild(h('p', {}, t('정말 탈퇴할까요? 확인을 위해 닉네임을 똑같이 적어 주세요.', 'Really delete? Type your nickname exactly to confirm.')));
      f.appendChild(h('div', {class:'field'}, [h('label', {for:'delNick', class:'sr'}, t('닉네임 확인', 'Confirm nickname')), h('input', {class:'input', id:'delNick', name:'delNick', type:'text', required:true, autocomplete:'off', placeholder:name}), h('p', {class:'err', id:'delNick-err', 'aria-live':'polite'})]));
      f.appendChild(h('div', {}, [h('label', {class:'check'}, [h('input', {type:'checkbox', id:'delAck', required:true}), h('span', {}, t('위 내용을 이해했고, 계정을 영구 삭제하는 데 동의합니다.', 'I understand and agree to permanently delete my account.'))]), h('p', {class:'err', id:'delAck-err', 'aria-live':'polite'})]));
      var yes = h('button', {class:'btn btn--sm btn--danger', type:'submit'}, t('영구 삭제', 'Delete permanently'));
      f.appendChild(h('div', {class:'row'}, [yes, h('button', {class:'btn btn--sm btn--light', type:'button', onclick:function(){ f.remove(); start.hidden = false; start.focus(); }}, t('취소', 'Cancel'))]));
      f.addEventListener('submit', function(e){
        e.preventDefault(); if (!MG.validate(f)) return;
        if (f.delNick.value.trim() !== name) return MG.setErr(f.delNick, t('닉네임이 다릅니다.', 'That is not your nickname.'));
        yes.disabled = true;
        MG.sb.rpc('delete_my_account').then(function(r){
          if (r.error) { yes.disabled = false; return MG.setErr(f.delNick, MG.errMsg(r.error)); }
          say(t('탈퇴가 완료되었습니다. 이용해 주셔서 감사합니다.', 'Your account has been deleted. Thanks for being here.'));
          MG.sb.auth.signOut({scope:'local'}).then(function(){ setTimeout(function(){ location.href = 'index.html'; }, 1200); }, function(){ location.href = 'index.html'; });
        });
      });
      dz.appendChild(f); f.delNick.focus();
    });
    dz.appendChild(h('div', {}, start));
    left.appendChild(dz);
  }

  var lastKey = '__';
  MG.onAuth(function(s, p){ var k = (s ? s.user.id : '') + '|' + JSON.stringify(p || null); if (k === lastKey) return; lastKey = k; render(s, p); });
  document.addEventListener('mg:lang', function(){ lastKey = '__'; render(MG.session, MG.profile); });
})();
