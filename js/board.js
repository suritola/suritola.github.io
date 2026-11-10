/* 게시판: 해시 라우팅 (#cat=free&p=2 · #post=12 · #new · #edit=12 · #admin).
   사용자 글: 옛 글(fmt text)과 댓글은 textContent, 서식 글(fmt html)은 DOMPurify 로 정화한 노드를 그대로 붙인다(문자열로 다시 잇지 않음). */
(function(){
  var t = MG.t, h = MG.h, say = MG.say, view = document.getElementById('view');
  if (window.top !== window.self) { view.hidden = true; try { window.top.location.href = location.href; } catch(e){} return; } // no framing (clickjacking on delete buttons)
  var SIZE = 15;
  var CATS = {notice:['공지','Notice'], free:['자유','General'], bug:['버그·건의','Bugs & feedback']};
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
  /* ---------- rich text: sanitize (DOMPurify) ---------- */
  // localhost?demo: Supabase 없이 에디터·변환된 스팀 공지를 그려 보는 로컬 전용 화면(배포 주소에서는 꺼짐)
  var DEMO = new URLSearchParams(location.search).has('demo') && /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
  var IMG_OK = /^https:\/\/((clan|shared)\.akamai\.steamstatic\.com\/|fiteqlskauepyiscjepl\.supabase\.co\/storage\/v1\/object\/public\/board\/)/;
  var FONTS = [['', '기본', 'Default'], ['ff-serif', '명조', 'Serif'], ['ff-display', '제목체', 'Display'], ['ff-mono', '고정폭', 'Mono']];
  var SIZES = [['fs-s', '작게', 'Small'], ['', '보통', 'Normal'], ['fs-l', '크게', 'Large'], ['fs-xl', '아주 크게', 'Huge']];
  var COLORS = [['c-red', '빨강', 'Red'], ['c-orange', '주황', 'Orange'], ['c-gold', '금색', 'Gold'], ['c-green', '초록', 'Green'], ['c-blue', '파랑', 'Blue'], ['c-purple', '보라', 'Purple'], ['c-pink', '분홍', 'Pink'], ['c-gray', '회색', 'Gray']];
  var CLS = [].concat(FONTS, SIZES, COLORS).map(function(x){ return x[0]; }).filter(Boolean);
  var PURIFY = {
    ALLOWED_TAGS: ['p', 'br', 'b', 'strong', 'i', 'em', 'u', 's', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'a', 'img', 'span'],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'width', 'height', 'class'],
    ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false, ALLOWED_URI_REGEXP: /^https:\/\//i, RETURN_DOM_FRAGMENT: true
  };
  var hooked = false;
  function purify(html){
    var P = window.DOMPurify;
    if (!P || !P.isSupported) return null;
    if (!hooked) { hooked = true; P.addHook('afterSanitizeAttributes', function(n){
      if (n.nodeType !== 1) return;
      if (n.hasAttribute('class')) {
        var keep = /^(SPAN|P)$/.test(n.tagName) ? n.getAttribute('class').split(/\s+/).filter(function(c){ return CLS.indexOf(c) >= 0; }).join(' ') : '';
        if (keep) n.setAttribute('class', keep); else n.removeAttribute('class');
      }
      ['width', 'height'].forEach(function(a){ var v = n.getAttribute(a); if (v !== null && !/^\d{1,4}$/.test(v)) n.removeAttribute(a); });
      if (n.tagName === 'A') {
        if (!/^https:\/\//i.test(n.getAttribute('href') || '')) n.removeAttribute('href');
        n.setAttribute('rel', 'nofollow ugc noopener noreferrer'); n.setAttribute('target', '_blank');
      }
      if (n.tagName === 'IMG') {
        if (!IMG_OK.test(n.getAttribute('src') || '')) { if (n.parentNode) n.parentNode.removeChild(n); return; }
        n.setAttribute('loading', 'lazy'); n.setAttribute('decoding', 'async'); n.setAttribute('referrerpolicy', 'no-referrer');
      }
    }); }
    return P.sanitize(html, PURIFY);
  }
  function bodyEl(post){
    if (post.fmt !== 'html') return h('div', {class:'body'}, post.body);
    var frag = purify(post.body);
    // DOMPurify 를 못 불러오면 서식 없이 글자만(DOMParser 문서는 스크립트·이미지를 실행하지 않는다)
    if (!frag) return h('div', {class:'body'}, new DOMParser().parseFromString(post.body, 'text/html').body.textContent);
    var d = h('div', {class:'body rich'}); d.appendChild(frag); return d;
  }
  window.MGBoard = {purify: purify}; // 정화 자체 시험용

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
  // CSV cell for spreadsheets: a leading = + - @ would run as a formula (e.g. IMPORTXML sending the list away), so prefix '
  function csv(v){ v = String(v == null ? '' : v); if (/^[=+\-@\t\r]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }
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
    if (DEMO) return renderDemo(p);
    if (!MG.configured()) {
      view.appendChild(tabs('all'));
      view.appendChild(h('div', {class:'card', style:'margin-top:18px'}, h('p', {class:'notice'}, [h('b', {}, t('게시판 준비 중입니다.', 'The board is coming soon.')), ' ', t('회원 기능이 열리면 글을 읽고 쓸 수 있습니다.', 'It opens together with member accounts.')])));
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
        if (!rows.length) return box.appendChild(h('p', {class:'empty'}, t('아직 글이 없습니다.', 'No posts yet.')));
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
        art.appendChild(bodyEl(post));
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
        } else sec.appendChild(h('p', {class:'muted'}, t('아직 댓글이 없습니다.', 'No comments yet.')));
        if (uid()) {
          var f = h('form', {class:'cmt-form', novalidate:true});
          f.appendChild(h('div', {class:'field'}, [h('label', {for:'cBody', class:'sr'}, t('댓글', 'Comment')), h('textarea', {class:'input', id:'cBody', name:'body', required:true, maxlength:1000, placeholder:t('댓글 (최대 1,000자)', 'Comment (up to 1,000 characters)')}), h('p', {class:'err', id:'cBody-err', 'aria-live':'polite'})]));
          f.appendChild(h('div', {class:'row row--between'}, [h('span', {class:'hint'}, t('댓글은 1분에 10개까지 쓸 수 있습니다.', 'Up to 10 comments a minute.')), h('button', {class:'btn btn--sm', type:'submit'}, t('댓글 쓰기', 'Post comment'))]));
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
          sec.appendChild(h('div', {class:'row', style:'margin-top:14px'}, [h('span', {class:'hint'}, t('댓글을 쓰려면 로그인해 주세요.', 'Log in to comment.')), h('button', {class:'btn btn--sm btn--light', type:'button', onclick:function(){ MG.openAuth('login'); }}, t('로그인', 'Log in'))]));
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
    f.appendChild(h('div', {class:'field'}, [h('label', {for:id}, t('신고 사유', 'Why are you reporting this?')), h('textarea', {class:'input', id:id, name:'reason', required:true, maxlength:500, placeholder:t('운영자만 볼 수 있습니다 (최대 500자)', 'Only staff can see this (up to 500 characters)')}), h('p', {class:'err', id:id + '-err', 'aria-live':'polite'})]));
    f.appendChild(h('div', {class:'row'}, [h('button', {class:'btn btn--sm', type:'submit'}, t('신고 보내기', 'Send report')), h('button', {class:'btn btn--sm btn--light', type:'button', onclick:function(){ f.remove(); }}, t('취소', 'Cancel'))]));
    f.addEventListener('submit', function(e){
      e.preventDefault(); if (!MG.validate(f)) return;
      var row = {reporter_id:uid(), post_id:target.post_id, comment_id:target.comment_id || null, reason:f.reason.value.trim()};
      MG.sb.from('reports').insert(row).then(function(r){
        if (r.error) return MG.setErr(f.reason, MG.errMsg(r.error));
        f.remove(); say(t('신고가 접수되었습니다. 확인 후 조치하겠습니다.', 'Report received. We\'ll review it.'));
      });
    });
    host.appendChild(f); f.querySelector('textarea').focus();
  }

  /* ---------- editor (new / edit) ---------- */
  function renderEditor(id){
    if (!uid() && !DEMO) { view.appendChild(h('div', {class:'card row'}, [h('span', {class:'lead'}, t('글을 쓰려면 로그인해 주세요.', 'Please log in to write a post.')), h('button', {class:'btn btn--sm', type:'button', onclick:function(){ MG.openAuth('login'); }}, t('로그인 / 가입', 'Log in / Sign up'))])); return; }
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
      var limit = MG.isAdmin() ? 60000 : 20000, rte = richEditor(post);
      f.appendChild(h('div', {class:'field'}, [h('span', {class:'label', id:'eBodyLbl'}, t('내용', 'Body')), rte.el, h('p', {class:'err', id:'eBody-err', 'aria-live':'polite'}), h('span', {class:'hint'}, t('사진은 png·jpg·webp만 올릴 수 있으며 긴 변 1920px로 줄여서 올라갑니다(하루 30장). 링크는 3개까지 넣을 수 있습니다.', 'Images (png, jpg, webp) are resized to 1920px on the long side. 30 images a day, up to 3 links per post.'))]));
      f.appendChild(h('div', {class:'row row--between'}, [
        h('a', {class:'btn btn--sm btn--light', href: post ? '#post=' + post.id : '#'}, t('취소', 'Cancel')),
        h('button', {class:'btn btn--sm', type:'submit'}, post ? t('저장', 'Save') : t('올리기', 'Publish'))
      ]));
      f.addEventListener('submit', function(e){
        e.preventDefault();
        var ok = MG.validate(f), html = rte.html(), msg = '';
        if (html === null) msg = t('서식 도구를 불러오지 못했습니다. 새로 고침해 주세요.', 'The editor failed to load. Please reload.');
        else if (!html) msg = t('필수 항목입니다.', 'Required.');
        else if (html.length > limit) msg = t('서식을 포함해 ' + limit.toLocaleString() + '자까지 쓸 수 있습니다. (지금 ' + html.length.toLocaleString() + '자)', 'Up to ' + limit.toLocaleString() + ' characters including formatting (now ' + html.length.toLocaleString() + ').');
        MG.setErr(rte.area, msg);
        if (msg) { if (ok) rte.area.focus(); return; }
        if (!ok) return;
        var row = {category:f.category.value, game:f.game.value || null, title:f.elements.title.value.trim(), body:html, fmt:'html'}; // form.title is the HTML attribute, not the input
        if (DEMO) { var old = box.querySelector('.post'); if (old) old.remove(); box.appendChild(demoPost(row)); return; }
        var b = f.querySelector('[type=submit]'); b.disabled = true;
        var qb = post ? MG.sb.from('posts').update(row).eq('id', post.id).select('id').single() : MG.sb.from('posts').insert(Object.assign({author_id:uid()}, row)).select('id').single();
        qb.then(function(r){
          b.disabled = false;
          if (r.error) return MG.setErr(rte.area, /^body_limit:/.test(r.error.message || '') ? r.error.message.replace(/^body_limit:\s*/, '') : MG.errMsg(r.error));
          say(post ? t('저장했습니다.', 'Saved.') : t('글을 올렸습니다.', 'Posted.'));
          go({post:r.data.id});
        });
      });
      box.appendChild(f); f.elements.title.focus();
    }
  }

  /* ---------- rich editor: contenteditable + toolbar ---------- */
  var savedRange = null, curArea = null;
  document.addEventListener('selectionchange', function(){
    var s = getSelection();
    if (curArea && s.rangeCount && curArea.contains(s.getRangeAt(0).commonAncestorContainer)) savedRange = s.getRangeAt(0).cloneRange();
  });
  function richEditor(post){
    var area = h('div', {class:'input rte-area', id:'eBody', contenteditable:'true', role:'textbox', 'aria-multiline':'true', 'aria-labelledby':'eBodyLbl'});
    curArea = area; savedRange = null;
    if (post && post.fmt === 'html') { var fr = purify(post.body); if (fr) area.appendChild(fr); }
    else if (post) post.body.split('\n').forEach(function(line){ area.appendChild(h('p', {}, line || h('br'))); }); // 옛 글자 글은 줄마다 문단으로
    if (!area.firstChild) area.appendChild(h('p', {}, h('br'))); // 첫 줄도 문단 안에서 시작
    function restore(){ area.focus(); if (savedRange) { var s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); } }
    function cmd(name, arg){ restore(); document.execCommand(name, false, arg || null); }
    // 글꼴·크기·색: execCommand 의 style/font 대신 정해 둔 class 를 단 span 으로 감싼다. 선택 안의 같은 종류 class 는 지운다.
    function wrap(prefixes, cls){
      restore();
      var s = getSelection(); if (!s.rangeCount) return;
      var r = s.getRangeAt(0);
      if (r.collapsed || !area.contains(r.commonAncestorContainer)) return say(t('글자를 먼저 선택해 주세요.', 'Select some text first.'));
      var frag = r.extractContents();
      frag.querySelectorAll('span').forEach(function(sp){
        var keep = (sp.getAttribute('class') || '').split(/\s+/).filter(function(c){ return c && !prefixes.some(function(p){ return c.indexOf(p) === 0; }); });
        if (keep.length) sp.setAttribute('class', keep.join(' ')); else sp.replaceWith.apply(sp, [].slice.call(sp.childNodes));
      });
      if (cls) { // 문단을 넘는 선택도 되도록 글자 조각마다 감싼다
        var w = document.createTreeWalker(frag, NodeFilter.SHOW_TEXT), texts = [];
        while (w.nextNode()) if (w.currentNode.nodeValue) texts.push(w.currentNode);
        texts.forEach(function(tn){ var sp = h('span', {class:cls}); tn.replaceWith(sp); sp.appendChild(tn); });
      }
      var first = frag.firstChild, last = frag.lastChild;
      r.insertNode(frag);
      if (first && last) { r = document.createRange(); r.setStartBefore(first); r.setEndAfter(last); s.removeAllRanges(); s.addRange(r); savedRange = r.cloneRange(); }
    }
    function btn(label, title, fn, cls){ return h('button', {type:'button', class:'rte-btn' + (cls ? ' ' + cls : ''), title:title, 'aria-label':title, onmousedown:function(e){ e.preventDefault(); }, onclick:fn, html:label}); }
    function pick(list, prefix, title){
      var sel = h('select', {class:'rte-sel', 'aria-label':title, title:title}, [h('option', {value:'-'}, title)].concat(list.map(function(x){ return h('option', {value:x[0]}, t(x[1], x[2])); })));
      sel.addEventListener('change', function(){ var v = sel.value; sel.value = '-'; if (v !== '-') wrap([prefix], v); });
      return sel;
    }
    var file = h('input', {type:'file', accept:'image/png,image/jpeg,image/webp', hidden:true});
    file.addEventListener('change', function(){ if (file.files[0]) upload(file.files[0]); file.value = ''; });
    function upload(f){
      if (DEMO || !uid()) return say(t('데모에서는 사진을 올리지 않습니다.', 'Uploads are off in the demo.'));
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return say(t('png·jpg·webp 사진만 올릴 수 있습니다.', 'Only png, jpg or webp images.'));
      if (f.size > 25e6) return say(t('사진이 너무 큽니다(25MB까지).', 'Image too large (25MB max).'));
      say(t('사진을 올리는 중…', 'Uploading…'));
      // canvas 로 다시 인코딩: EXIF(위치 등)를 버리고 긴 변 1920px 로 줄인다
      var cw, ch;
      createImageBitmap(f, {imageOrientation:'from-image'}).then(function(bmp){
        var k = Math.min(1, 1920 / Math.max(bmp.width, bmp.height)); cw = Math.round(bmp.width * k); ch = Math.round(bmp.height * k);
        var cv = h('canvas', {width:cw, height:ch}); cv.getContext('2d').drawImage(bmp, 0, 0, cw, ch); bmp.close();
        function enc(type, q){ return new Promise(function(res){ cv.toBlob(res, type, q); }); }
        return enc('image/webp', .85)
          .then(function(b){ return b && b.type === 'image/webp' ? b : enc('image/jpeg', .85); })
          .then(function(b){ if (!b) throw new Error('encode'); return b.size > 2e6 ? enc(b.type, .6) : b; });
      }).then(function(b){
        if (b.size > 2e6) throw new Error('size');
        var path = uid() + '/' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + (b.type === 'image/webp' ? '.webp' : '.jpg');
        return MG.sb.storage.from('board').upload(path, b, {contentType:b.type, upsert:false, cacheControl:'31536000'}).then(function(r){
          if (r.error) throw r.error;
          var img = h('img', {src:MG.sb.storage.from('board').getPublicUrl(path).data.publicUrl, alt:'', width:cw, height:ch});
          restore();
          var s = getSelection(), rg = s.rangeCount && area.contains(s.getRangeAt(0).commonAncestorContainer) ? s.getRangeAt(0) : null;
          if (rg) { rg.deleteContents(); rg.insertNode(img); rg.setStartAfter(img); rg.collapse(true); s.removeAllRanges(); s.addRange(rg); } else area.appendChild(img);
          say(t('사진을 넣었습니다.', 'Image added.'));
        });
      }).catch(function(e){
        var m = (e && e.message) || '';
        say(m === 'size' ? t('사진을 2MB 아래로 줄이지 못했습니다.', 'Could not get the image under 2MB.')
          : m === 'encode' ? t('이 사진은 읽을 수 없습니다.', 'This image could not be read.')
          : /row-level|policy/i.test(m) ? t('사진은 하루 30장까지 올릴 수 있습니다.', 'Up to 30 images a day.') : MG.errMsg(e));
      });
    }
    function link(){
      var had = savedRange && !savedRange.collapsed;
      var u = prompt(t('링크 주소 (https://로 시작)', 'Link URL (starting with https://)'), 'https://');
      if (u === null) return;
      u = u.trim();
      if (!/^https:\/\/[^\s"<>]+$/i.test(u)) return say(t('https://로 시작하는 주소만 넣을 수 있습니다.', 'Only https:// links are allowed.'));
      if (had) return cmd('createLink', u);
      restore(); // 선택이 없으면 주소 글자를 넣고 그것을 링크로
      var a = h('a', {href:u}, u), s = getSelection(), rg = s.rangeCount ? s.getRangeAt(0) : null;
      if (rg && area.contains(rg.commonAncestorContainer)) { rg.insertNode(a); rg.setStartAfter(a); rg.collapse(true); s.removeAllRanges(); s.addRange(rg); } else area.appendChild(a);
    }
    var I2 = function(d){ return '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>'; };
    var bar = h('div', {class:'rte-bar', role:'toolbar', 'aria-label':t('서식', 'Formatting'), 'aria-controls':'eBody'}, [
      h('div', {class:'rte-group'}, [
        btn('<b>B</b>', t('굵게', 'Bold'), function(){ cmd('bold'); }),
        btn('<i>I</i>', t('기울임', 'Italic'), function(){ cmd('italic'); }),
        btn('<u>U</u>', t('밑줄', 'Underline'), function(){ cmd('underline'); }),
        btn('<s>S</s>', t('취소선', 'Strikethrough'), function(){ cmd('strikeThrough'); })
      ]),
      h('div', {class:'rte-group'}, [
        btn('H2', t('큰 제목', 'Heading'), function(){ cmd('formatBlock', 'h2'); }),
        btn('H3', t('작은 제목', 'Subheading'), function(){ cmd('formatBlock', 'h3'); }),
        btn('¶', t('본문', 'Paragraph'), function(){ cmd('formatBlock', 'p'); }),
        btn(I2('M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01'), t('목록', 'Bulleted list'), function(){ cmd('insertUnorderedList'); }),
        btn(I2('M10 6h10M10 12h10M10 18h10M4 5h1v4M4 15h2l-2 3h2'), t('번호 목록', 'Numbered list'), function(){ cmd('insertOrderedList'); }),
        btn(I2('M7 7h4v4c0 3-2 5-4 6M15 7h4v4c0 3-2 5-4 6'), t('인용', 'Quote'), function(){ cmd('formatBlock', 'blockquote'); })
      ]),
      h('div', {class:'rte-group'}, [
        btn(I2('M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1'), t('링크', 'Link'), link),
        btn('<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-9 8"/></svg>', t('사진', 'Image'), function(){ file.click(); }),
        btn(I2('M5 5h12M11 5 8 19M15 15l5 5M20 15l-5 5'), t('서식 지우기', 'Clear formatting'), function(){ cmd('removeFormat'); wrap(['ff-', 'fs-', 'c-'], null); }),
        file
      ]),
      h('div', {class:'rte-group'}, [pick(FONTS, 'ff-', t('글꼴', 'Font')), pick(SIZES, 'fs-', t('크기', 'Size'))]),
      h('div', {class:'rte-group rte-colors'}, COLORS.map(function(c){ return btn('', t(c[1], c[2]), function(){ wrap(['c-'], c[0]); }, 'rte-sw ' + c[0]); })
        .concat(btn('', t('기본 색', 'Default color'), function(){ wrap(['c-'], null); }, 'rte-sw sw-none')))
    ]);
    area.addEventListener('focus', function(){ curArea = area; try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch(e){} });
    area.addEventListener('paste', function(e){ // 붙여 넣기는 글자만(남의 HTML·style 을 들이지 않음), 사진 파일은 올리기로
      var cd = e.clipboardData; if (!cd) return;
      e.preventDefault();
      var img = [].slice.call(cd.files || []).filter(function(x){ return /^image\//.test(x.type); })[0];
      if (img) return upload(img);
      document.execCommand('insertText', false, cd.getData('text/plain'));
    });
    area.addEventListener('drop', function(e){
      e.preventDefault();
      var img = e.dataTransfer && [].slice.call(e.dataTransfer.files || []).filter(function(x){ return /^image\//.test(x.type); })[0];
      if (img) upload(img);
    });
    return {
      el: h('div', {class:'rte'}, [bar, area]), area: area,
      // 저장할 HTML: 브라우저가 만든 div·strike 등을 허용 태그로 바꾼 뒤 정화. 비었으면 '', 정화기가 없으면 null
      html: function(){
        var c = area.cloneNode(true), MAP = {DIV:'p', STRIKE:'s', H1:'h2', H4:'h3', H5:'h3', H6:'h3'};
        c.querySelectorAll('div,strike,h1,h4,h5,h6').forEach(function(el){
          var n = document.createElement(MAP[el.tagName]);
          while (el.firstChild) n.appendChild(el.firstChild);
          el.replaceWith(n);
        });
        // 목록·인용을 p 안에 만드는 브라우저가 있어 그런 p 는 벗긴다
        c.querySelectorAll('p').forEach(function(p){ if (p.querySelector('ul,ol,blockquote,h2,h3,p')) p.replaceWith.apply(p, [].slice.call(p.childNodes)); });
        var fr = purify(c.innerHTML); if (!fr) return null;
        var out = document.createElement('div'); out.appendChild(fr);
        if (!out.textContent.trim() && !out.querySelector('img')) return '';
        return out.innerHTML.trim();
      }
    };
  }

  /* ---------- local demo (localhost?demo only) ---------- */
  function demoPost(row){
    var art = h('article', {class:'card post'});
    art.appendChild(h('div', {class:'meta'}, [tag(row.category), gameTag(row.game), h('time', {datetime:row.created_at || null}, row.created_at ? MG.fmtDate(row.created_at, true) : t('미리보기', 'Preview'))]));
    art.appendChild(h('h1', {}, row.title));
    art.appendChild(h('div', {class:'meta'}, authorEl({nickname:'박민근', role:'admin'})));
    art.appendChild(bodyEl(row));
    return art;
  }
  function renderDemo(p){
    view.appendChild(h('p', {class:'notice'}, 'DEMO — localhost 전용. 저장·업로드 없음.'));
    if (!p.has('notice')) return renderEditor(null);
    var box = h('div', {class:'stack'}, loading()); view.appendChild(box);
    fetch('tools/steam_notices.json').then(function(r){ return r.json(); }).then(function(list){
      box.textContent = '';
      var n = list[Number(p.get('notice'))] || list[0];
      box.appendChild(h('nav', {class:'tabs'}, list.map(function(x, i){ return h('a', {href:'?demo#notice=' + i, 'aria-current': x === n ? 'true' : null}, String(i)); })));
      box.appendChild(demoPost({category:'notice', game:'soulsaver', title:n.title, body:n.body, fmt:'html', created_at:new Date(n.posttime * 1000).toISOString()}));
    });
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
    var nl = h('section', {class:'card stack'}, [h('h2', {}, t('소식 메일 동의자', 'Newsletter subscribers')), h('p', {class:'hint'}, t('발송 기능은 아직 없습니다. 아래 목록(이메일, 닉네임, 동의 일시)을 복사해 메일 도구에 붙여 넣으세요. 동의를 철회한 분에게는 보내면 안 됩니다.', 'There is no mailer yet. Copy the list below (email, nickname, consent date) into your mail tool. Never email people who have withdrawn consent.'))]);
    var pre = h('pre', {class:'pre'}, t('불러오는 중…', 'Loading…')); nl.appendChild(pre); view.appendChild(nl);
    MG.sb.rpc('newsletter_list').then(function(r){
      if (r.error) { pre.textContent = MG.errMsg(r.error); return; }
      var rows = r.data || [];
      pre.textContent = rows.length ? 'email,nickname,agreed_at\n' + rows.map(function(x){ return [csv(x.email), csv(x.nickname), csv(x.agreed_at)].join(','); }).join('\n') : t('아직 동의한 분이 없습니다.', 'No subscribers yet.');
      if (rows.length) nl.appendChild(h('div', {class:'row'}, [h('span', {class:'hint'}, rows.length + t('명', ' people')), h('button', {class:'btn btn--sm btn--light', type:'button', onclick:function(){ navigator.clipboard && navigator.clipboard.writeText(pre.textContent).then(function(){ say(t('복사했습니다.', 'Copied.')); }, function(){ say(t('복사하지 못했습니다. 직접 선택해 주세요.', 'Copy failed. Select the text instead.')); }); }, html:I.copy + '<span>' + t('CSV 복사', 'Copy CSV') + '</span>'})]));
    });
  }

  /* ---------- wire up ---------- */
  var lastUid = '__';
  MG.onAuth(function(s){ var u = s ? s.user.id : null; if (u === lastUid) return; lastUid = u; render(); }); // token refreshes must not wipe a half-written post
  addEventListener('hashchange', function(){ render(); scrollTo(0, 0); });
  document.addEventListener('mg:lang', render);
})();
