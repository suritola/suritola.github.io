/* 게시판: 해시 라우팅 (#cat=free&p=2 · #post=12 · #new · #edit=12 · #admin). 사용자 글은 전부 textContent 로만 넣는다. */
(function(){
  var t = MG.t, h = MG.h, say = MG.say, view = document.getElementById('view');
  var SIZE = 15;
  var CATS = {notice:['공지','Notice'], free:['자유','Free talk'], bug:['버그·건의','Bugs & ideas']};
  var GAMES = {soulsaver:'Soul Saver', deepfold:'Deepfold'};
  var I = {
    pen:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
    trash:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6"/></svg>',
    flag:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4M5 4h13l-2 4 2 4H5"/></svg>',
    back:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>',
    prev:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>',
    next:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>',
    check:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 5 5L20 7"/></svg>',
    copy:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/></svg>'
  };
  function params(){ return new URLSearchParams(location.hash.slice(1)); }
  function go(obj){ location.hash = new URLSearchParams(obj).toString(); }
  function cname(c){ return CATS[c] ? t(CATS[c][0], CATS[c][1]) : c; }
  function tag(c){ return h('span', {class:'tag tag--'+c}, cname(c)); }
  function gameTag(g){ return g && GAMES[g] ? h('span', {class:'tag tag--game'}, GAMES[g]) : null; }
  function authorEl(p){
    p = p || {};
    var name = p.nickname || t('탈퇴한 회원', 'Deleted user');
    return h('span', {class:'author'}, [h('span', {class:'avatar', 'aria-hidden':'true'}, name.charAt(0).toUpperCase()), name, p.role === 'admin' ? h('span', {class:'tag tag--admin'}, t('운영자', 'Staff')) : null]);
  }
  function ghost(icon, label, onclick, extra){ return h('button', {class:'btn--ghost' + (extra ? ' ' + extra : ''), type:'button', onclick:onclick, html: icon + '<span>' + label + '</span>'}); }
  function loading(){ return h('p', {class:'muted'}, t('불러오는 중…', 'Loading…')); }
  function fail(box, e){ box.textContent = ''; box.appendChild(h('p', {class:'empty'}, MG.errMsg(e))); }
  function uid(){ return MG.session ? MG.session.user.id : null; }
  // nickname/role of a set of authors (public_profiles view: 4 public columns only)
  function authors(ids){
    ids = ids.filter(function(v, i, a){ return v && a.indexOf(v) === i; });
    if (!ids.length) return Promise.resolve({});
    return MG.sb.from('public_profiles').select('id,nickname,role').in('id', ids).then(function(r){ var m = {}; (r.data || []).forEach(function(p){ m[p.id] = p; }); return m; });
  }

  /* ---------- router ---------- */
  function render(){
    var p = params();
    view.textContent = '';
    if (!MG.configured()) {
      view.appendChild(tabs('all'));
      view.appendChild(h('div', {class:'card', style:'margin-top:18px'}, h('p', {class:'notice'}, [h('b', {}, t('게시판 준비 중입니다.', 'The board is being prepared.')), ' ', t('회원 기능 설정이 끝나면 글을 읽고 쓸 수 있어요.', 'Reading and posting open as soon as the member service is set up.')])));
      return;
    }
    if (p.has('admin')) return renderAdmin();
    if (p.has('new')) return renderEditor(null);
    if (p.has('edit')) return renderEditor(Number(p.get('edit')));
    if (p.has('post')) return renderPost(Number(p.get('post')));
    renderList(p.get('cat') || 'all', Math.max(1, Number(p.get('p')) || 1));
  }

  /* ---------- list ---------- */
  function tabs(cat){
    var nav = h('nav', {class:'tabs', 'aria-label': t('분류', 'Categories')});
    [['all', t('전체', 'All')]].concat(Object.keys(CATS).map(function(c){ return [c, cname(c)]; })).forEach(function(x){
      nav.appendChild(h('a', {href:'#cat=' + x[0], 'aria-current': cat === x[0] ? 'true' : null}, x[1]));
    });
    var write = h('button', {class:'btn btn--sm', type:'button', disabled: !MG.configured(), onclick:function(){ if (!MG.session) return MG.openAuth('login'); go({new:1}); }, html: I.pen + '<span>' + t('글쓰기', 'Write') + '</span>'});
    return h('div', {class:'row row--between'}, [nav, write]);
  }
  function renderList(cat, page){
    view.appendChild(tabs(cat));
    var box = h('div', {class:'stack', style:'margin-top:18px'}); view.appendChild(box); box.appendChild(loading());
    var from = (page - 1) * SIZE;
    var qb = MG.sb.from('posts').select('id,category,game,title,author_id,created_at', {count:'exact'}).order('created_at', {ascending:false}).range(from, from + SIZE - 1);
    if (cat !== 'all') qb = qb.eq('category', cat);
    qb.then(function(r){
      if (r.error) return fail(box, r.error);
      var rows = r.data || [], total = r.count || 0;
      authors(rows.map(function(x){ return x.author_id; })).then(function(map){
        box.textContent = '';
        if (!rows.length) return box.appendChild(h('p', {class:'empty'}, t('아직 글이 없습니다. 첫 글을 남겨 보세요.', 'No posts yet. Be the first to write one.')));
        var ul = h('ul', {class:'post-list'});
        rows.forEach(function(x){
          ul.appendChild(h('li', {}, h('a', {class:'post-row', href:'#post=' + x.id}, [
            h('div', {}, [h('div', {class:'meta'}, [tag(x.category), gameTag(x.game)]), h('div', {class:'title'}, x.title)]),
            h('div', {class:'meta right'}, [authorEl(map[x.author_id]), h('time', {datetime:x.created_at}, MG.fmtDate(x.created_at))])
          ])));
        });
        box.appendChild(ul);
        var pages = Math.ceil(total / SIZE);
        if (pages > 1) box.appendChild(h('nav', {class:'pager', 'aria-label': t('쪽', 'Pages')}, [
          h('button', {type:'button', disabled: page <= 1, 'aria-label': t('이전 쪽', 'Previous page'), onclick:function(){ go({cat:cat, p:page - 1}); }, html:I.prev}),
          h('span', {}, page + ' / ' + pages),
          h('button', {type:'button', disabled: page >= pages, 'aria-label': t('다음 쪽', 'Next page'), onclick:function(){ go({cat:cat, p:page + 1}); }, html:I.next})
        ]));
      });
    });
  }

  /* ---------- post + comments ---------- */
  function renderPost(id){
    var box = h('div', {class:'stack'}); view.appendChild(box); box.appendChild(loading());
    Promise.all([
      MG.sb.from('posts').select('*').eq('id', id).maybeSingle(),
      MG.sb.from('comments').select('*').eq('post_id', id).order('created_at')
    ]).then(function(rs){
      var post = rs[0].data, cmts = rs[1].data || [];
      if (rs[0].error || !post) { box.textContent = ''; box.appendChild(h('a', {class:'btn--ghost', href:'#', html:I.back + '<span>' + t('목록으로', 'Back to list') + '</span>'})); return box.appendChild(h('p', {class:'empty'}, t('글이 없거나 지워졌습니다.', 'This post does not exist or was deleted.'))); }
      authors([post.author_id].concat(cmts.map(function(c){ return c.author_id; }))).then(function(map){
        box.textContent = '';
        box.appendChild(h('div', {}, h('a', {class:'btn--ghost', href:'#cat=' + post.category, html:I.back + '<span>' + t('목록으로', 'Back to list') + '</span>'})));
        var art = h('article', {class:'card post'});
        art.appendChild(h('div', {class:'meta'}, [tag(post.category), gameTag(post.game), h('time', {datetime:post.created_at}, MG.fmtDate(post.created_at, true)), post.updated_at ? h('span', {}, t('(수정됨)', '(edited)')) : null]));
        art.appendChild(h('h1', {}, post.title));
        art.appendChild(h('div', {class:'meta'}, authorEl(map[post.author_id])));
        art.appendChild(h('div', {class:'body'}, post.body));
        var mine = uid() === post.author_id, tools = h('div', {class:'tools'});
        if (mine) tools.appendChild(ghost(I.pen, t('수정', 'Edit'), function(){ go({edit:post.id}); }));
        if (mine || MG.isAdmin()) tools.appendChild(ghost(I.trash, t('삭제', 'Delete'), function(){
          confirmBox(art, t('이 글을 지울까요? 댓글도 함께 지워지며 되돌릴 수 없습니다.', 'Delete this post? Its comments go with it; this cannot be undone.'),
            function(){ return MG.sb.from('posts').delete().eq('id', post.id); },
            function(){ say(t('글을 지웠습니다.', 'Post deleted.')); go({cat:post.category}); });
        }, 'danger'));
        if (uid() && !mine) tools.appendChild(ghost(I.flag, t('신고', 'Report'), function(){ reportForm(art, {post_id:post.id}); }));
        art.appendChild(tools);
        box.appendChild(art);

        var sec = h('section', {class:'card', 'aria-labelledby':'cmtTitle'});
        sec.appendChild(h('h2', {id:'cmtTitle'}, t('댓글', 'Comments') + ' ' + cmts.length));
        if (cmts.length) {
          var ul = h('ul', {class:'cmts'});
          cmts.forEach(function(c){
            var li = h('li', {class:'cmt'}), cm = uid() === c.author_id, ct = h('span', {class:'tools'});
            if (cm || MG.isAdmin()) ct.appendChild(ghost(I.trash, t('삭제', 'Delete'), function(){
              confirmBox(li, t('이 댓글을 지울까요?', 'Delete this comment?'), function(){ return MG.sb.from('comments').delete().eq('id', c.id); }, function(){ say(t('댓글을 지웠습니다.', 'Comment deleted.')); render(); });
            }, 'danger'));
            if (uid() && !cm) ct.appendChild(ghost(I.flag, t('신고', 'Report'), function(){ reportForm(li, {post_id:post.id, comment_id:c.id}); }));
            li.appendChild(h('div', {class:'meta'}, [h('span', {class:'row'}, [authorEl(map[c.author_id]), h('time', {datetime:c.created_at}, MG.fmtDate(c.created_at, true))]), ct]));
            li.appendChild(h('div', {class:'body'}, c.body));
            ul.appendChild(li);
          });
          sec.appendChild(ul);
        } else sec.appendChild(h('p', {class:'muted'}, t('첫 댓글을 남겨 보세요.', 'Be the first to comment.')));
        if (uid()) {
          var f = h('form', {class:'cmt-form', novalidate:true});
          f.appendChild(h('div', {class:'field'}, [h('label', {for:'cBody', class:'sr'}, t('댓글', 'Comment')), h('textarea', {class:'input', id:'cBody', name:'body', required:true, maxlength:1000, placeholder:t('댓글을 남겨 주세요 (1,000자까지)', 'Write a comment (up to 1,000 characters)')}), h('p', {class:'err', id:'cBody-err', 'aria-live':'polite'})]));
          f.appendChild(h('div', {class:'row row--between'}, [h('span', {class:'hint'}, t('1분에 10개까지 쓸 수 있어요.', 'Up to 10 comments a minute.')), h('button', {class:'btn btn--sm', type:'submit'}, t('댓글 쓰기', 'Post comment'))]));
          f.addEventListener('submit', function(e){
            e.preventDefault(); if (!MG.validate(f)) return;
            var b = f.querySelector('[type=submit]'); b.disabled = true;
            MG.sb.from('comments').insert({post_id:post.id, author_id:uid(), body:f.body.value.trim()}).then(function(r){
              b.disabled = false;
              if (r.error) return MG.setErr(f.body, MG.errMsg(r.error));
              say(t('댓글을 남겼습니다.', 'Comment posted.')); render();
            });
          });
          sec.appendChild(f);
        } else {
          sec.appendChild(h('div', {class:'row', style:'margin-top:14px'}, [h('span', {class:'hint'}, t('로그인하면 댓글을 쓸 수 있어요.', 'Log in to join the conversation.')), h('button', {class:'btn btn--sm btn--light', type:'button', onclick:function(){ MG.openAuth('login'); }}, t('로그인', 'Log in'))]));
        }
        box.appendChild(sec);
      });
    });
  }
  // inline confirmation instead of window.confirm(): [delete] [cancel] under the item
  function confirmBox(host, msg, action, after){
    var old = host.querySelector('.confirm'); if (old) old.remove();
    var c = h('div', {class:'confirm', role:'alertdialog', 'aria-label': msg});
    var yes = h('button', {class:'btn btn--sm btn--danger', type:'button'}, t('지우기', 'Delete'));
    yes.addEventListener('click', function(){ yes.disabled = true; action().then(function(r){ if (r.error) { yes.disabled = false; say(MG.errMsg(r.error)); return; } after(); }); });
    c.appendChild(h('p', {}, msg));
    c.appendChild(h('div', {class:'row'}, [yes, h('button', {class:'btn btn--sm btn--light', type:'button', onclick:function(){ c.remove(); }}, t('취소', 'Cancel'))]));
    host.appendChild(c); yes.focus();
  }
  function reportForm(host, target){
    var old = host.querySelector('.report-form'); if (old) return old.querySelector('textarea').focus();
    var f = h('form', {class:'report-form', novalidate:true}), id = 'rep' + (target.comment_id || 'p' + target.post_id);
    f.appendChild(h('div', {class:'field'}, [h('label', {for:id}, t('신고 사유', 'Why are you reporting this?')), h('textarea', {class:'input', id:id, name:'reason', required:true, maxlength:500, placeholder:t('운영자만 볼 수 있어요 (500자까지)', 'Only staff can see this (up to 500 characters)')}), h('p', {class:'err', id:id + '-err', 'aria-live':'polite'})]));
    f.appendChild(h('div', {class:'row'}, [h('button', {class:'btn btn--sm', type:'submit'}, t('신고 보내기', 'Send report')), h('button', {class:'btn btn--sm btn--light', type:'button', onclick:function(){ f.remove(); }}, t('취소', 'Cancel'))]));
    f.addEventListener('submit', function(e){
      e.preventDefault(); if (!MG.validate(f)) return;
      var row = {reporter_id:uid(), post_id:target.post_id, comment_id:target.comment_id || null, reason:f.reason.value.trim()};
      MG.sb.from('reports').insert(row).then(function(r){
        if (r.error) return MG.setErr(f.reason, MG.errMsg(r.error));
        f.remove(); say(t('신고를 접수했습니다. 확인 뒤 처리할게요.', 'Report received. Staff will take a look.'));
      });
    });
    host.appendChild(f); f.querySelector('textarea').focus();
  }

  /* ---------- editor (new / edit) ---------- */
  function renderEditor(id){
    if (!uid()) { view.appendChild(h('div', {class:'card row'}, [h('span', {class:'lead'}, t('글을 쓰려면 로그인해 주세요.', 'Please log in to write a post.')), h('button', {class:'btn btn--sm', type:'button', onclick:function(){ MG.openAuth('login'); }}, t('로그인 / 가입', 'Log in / Sign up'))])); return; }
    var box = h('div', {class:'card'}); view.appendChild(box);
    if (id) { box.appendChild(loading()); MG.sb.from('posts').select('*').eq('id', id).maybeSingle().then(function(r){ box.textContent = ''; if (!r.data || (r.data.author_id !== uid() && !MG.isAdmin())) return box.appendChild(h('p', {class:'empty'}, t('수정할 수 없는 글입니다.', 'You cannot edit this post.'))); form(r.data); }); }
    else form(null);
    function form(post){
      var f = h('form', {class:'editor', novalidate:true});
      f.appendChild(h('h2', {}, post ? t('글 수정', 'Edit post') : t('새 글', 'New post')));
      var cat = h('select', {class:'input', id:'eCat', name:'category', required:true});
      Object.keys(CATS).forEach(function(c){ if (c !== 'notice' || MG.isAdmin()) cat.appendChild(h('option', {value:c, selected: post ? post.category === c : c === 'free'}, cname(c))); });
      var game = h('select', {class:'input', id:'eGame', name:'game'}, [h('option', {value:''}, t('게임 선택 안 함', 'No specific game'))].concat(Object.keys(GAMES).map(function(g){ return h('option', {value:g, selected: post && post.game === g}, GAMES[g]); })));
      f.appendChild(h('div', {class:'two'}, [
        h('div', {class:'field'}, [h('label', {for:'eCat'}, t('분류', 'Category')), cat, h('p', {class:'err', id:'eCat-err'})]),
        h('div', {class:'field'}, [h('label', {for:'eGame'}, t('관련 게임', 'Related game')), game, h('p', {class:'err', id:'eGame-err'})])
      ]));
      f.appendChild(h('div', {class:'field'}, [h('label', {for:'eTitle'}, t('제목', 'Title')), h('input', {class:'input', id:'eTitle', name:'title', type:'text', required:true, maxlength:100, value: post ? post.title : ''}), h('p', {class:'err', id:'eTitle-err', 'aria-live':'polite'})]));
      var body = h('textarea', {class:'input', id:'eBody', name:'body', required:true, maxlength:5000}); if (post) body.value = post.body;
      f.appendChild(h('div', {class:'field'}, [h('label', {for:'eBody'}, t('내용', 'Body')), body, h('p', {class:'err', id:'eBody-err', 'aria-live':'polite'}), h('span', {class:'hint'}, t('글자만 쓸 수 있어요 (5,000자까지). 줄 바꿈은 그대로 보입니다.', 'Plain text only (up to 5,000 characters). Line breaks are kept.'))]));
      f.appendChild(h('div', {class:'row row--between'}, [
        h('a', {class:'btn btn--sm btn--light', href: post ? '#post=' + post.id : '#'}, t('취소', 'Cancel')),
        h('button', {class:'btn btn--sm', type:'submit'}, post ? t('저장', 'Save') : t('올리기', 'Publish'))
      ]));
      f.addEventListener('submit', function(e){
        e.preventDefault(); if (!MG.validate(f)) return;
        var b = f.querySelector('[type=submit]'); b.disabled = true;
        var row = {category:f.category.value, game:f.game.value || null, title:f.elements.title.value.trim(), body:f.body.value.trim()}; // form.title is the HTML attribute, not the input
        var qb = post ? MG.sb.from('posts').update(row).eq('id', post.id).select('id').single() : MG.sb.from('posts').insert(Object.assign({author_id:uid()}, row)).select('id').single();
        qb.then(function(r){
          b.disabled = false;
          if (r.error) return MG.setErr(f.body, MG.errMsg(r.error));
          say(post ? t('저장했습니다.', 'Saved.') : t('글을 올렸습니다.', 'Posted.'));
          go({post:r.data.id});
        });
      });
      box.appendChild(f); f.elements.title.focus();
    }
  }

  /* ---------- admin: reports + newsletter list ---------- */
  function renderAdmin(){
    if (!MG.isAdmin()) return view.appendChild(h('p', {class:'empty'}, t('운영자만 볼 수 있는 화면입니다.', 'Staff only.')));
    view.appendChild(h('div', {}, h('a', {class:'btn--ghost', href:'#', html:I.back + '<span>' + t('게시판으로', 'Back to board') + '</span>'})));
    var rep = h('section', {class:'card'}, h('h2', {}, t('신고 목록', 'Reports'))), box = h('div'); rep.appendChild(box); box.appendChild(loading()); view.appendChild(rep);
    MG.sb.from('reports').select('*').is('resolved_at', null).order('created_at', {ascending:false}).then(function(r){
      if (r.error) return fail(box, r.error);
      var rows = r.data || [];
      authors(rows.map(function(x){ return x.reporter_id; })).then(function(map){
        box.textContent = '';
        if (!rows.length) return box.appendChild(h('p', {class:'muted'}, t('처리할 신고가 없습니다.', 'No open reports.')));
        var ul = h('ul', {class:'admin-list'});
        rows.forEach(function(x){
          var li = h('li');
          li.appendChild(h('div', {class:'meta row row--between'}, [h('span', {class:'row'}, [h('span', {class:'tag'}, x.comment_id ? t('댓글', 'Comment') : t('글', 'Post')), authorEl(map[x.reporter_id]), h('time', {datetime:x.created_at}, MG.fmtDate(x.created_at, true))]), h('a', {href:'#post=' + x.post_id}, t('대상 보기', 'Open'))]));
          li.appendChild(h('div', {class:'body', style:'white-space:pre-wrap'}, x.reason));
          var done = h('button', {class:'btn btn--sm btn--light', type:'button', html:I.check + '<span>' + t('처리 완료', 'Resolve') + '</span>'});
          done.addEventListener('click', function(){ done.disabled = true; MG.sb.from('reports').update({resolved_at:new Date().toISOString()}).eq('id', x.id).then(function(r2){ if (r2.error) { done.disabled = false; return say(MG.errMsg(r2.error)); } li.remove(); say(t('처리했습니다.', 'Resolved.')); }); });
          li.appendChild(h('div', {}, done));
          ul.appendChild(li);
        });
        box.appendChild(ul);
      });
    });
    var nl = h('section', {class:'card stack'}, [h('h2', {}, t('소식 메일 동의자', 'Newsletter subscribers')), h('p', {class:'hint'}, t('발송 기능은 아직 없어요. 아래 목록(이메일, 닉네임, 동의 일시)을 복사해 메일 도구에 붙여 넣으세요. 동의를 철회한 분에게는 보내면 안 됩니다.', 'There is no mailer yet. Copy the list below (email, nickname, consent date) into your mail tool. Never email people who have withdrawn consent.'))]);
    var pre = h('pre', {class:'pre'}, t('불러오는 중…', 'Loading…')); nl.appendChild(pre); view.appendChild(nl);
    MG.sb.rpc('newsletter_list').then(function(r){
      if (r.error) { pre.textContent = MG.errMsg(r.error); return; }
      var rows = r.data || [];
      pre.textContent = rows.length ? 'email,nickname,agreed_at\n' + rows.map(function(x){ return [x.email, '"' + String(x.nickname).replace(/"/g, '""') + '"', x.agreed_at].join(','); }).join('\n') : t('아직 동의한 분이 없습니다.', 'No subscribers yet.');
      if (rows.length) nl.appendChild(h('div', {class:'row'}, [h('span', {class:'hint'}, rows.length + t('명', ' people')), h('button', {class:'btn btn--sm btn--light', type:'button', onclick:function(){ navigator.clipboard && navigator.clipboard.writeText(pre.textContent).then(function(){ say(t('복사했습니다.', 'Copied.')); }, function(){ say(t('복사 실패 — 직접 선택해 주세요.', 'Copy failed — select the text instead.')); }); }, html:I.copy + '<span>' + t('CSV 복사', 'Copy CSV') + '</span>'})]));
    });
  }

  /* ---------- wire up ---------- */
  var lastUid = '__';
  MG.onAuth(function(s){ var u = s ? s.user.id : null; if (u === lastUid) return; lastUid = u; render(); }); // token refreshes must not wipe a half-written post
  addEventListener('hashchange', function(){ render(); scrollTo(0, 0); });
  document.addEventListener('mg:lang', render);
})();
