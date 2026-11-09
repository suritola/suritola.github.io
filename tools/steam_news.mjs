// Soul Saver 스팀 공지 → 게시판 공지 변환기.
//   node tools/steam_news.mjs            스팀에서 한국어판(lang 4)을 받아 변환
//   node tools/steam_news.mjs ev.json    저장해 둔 이벤트 JSON 으로 변환
// 결과: tools/steam_notices.json (데모 화면용) + 마이그레이션 파일의 "steam notices" 표시 사이 SQL 을 새로 씀.
// 출처: store.steampowered.com/events/ajaxgetadjacentpartnerevents (l=koreana, lang_list=4_0) 의 announcement_body.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const MIGRATION = join(ROOT, 'supabase/migrations/2026-11-09_board_rich_and_steam_news.sql');
const APPID = 5328770;
const SRC = `https://store.steampowered.com/events/ajaxgetadjacentpartnerevents/?appid=${APPID}&count_before=0&count_after=100&lang_list=4_0&l=koreana`;
const CLAN_IMG = 'https://clan.akamai.steamstatic.com/images';
const KO = 4; // Steam 언어 번호: 4 = 한국어

const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const BLOCK = 'h2|h3|ul|ol|li|p|blockquote';
const SIMPLE = { h1: 'h2', h2: 'h3', h3: 'h3', b: 'b', i: 'i', u: 'u', s: 's', strike: 's', p: 'p', quote: 'blockquote' }; // 글 제목이 h1 이라 한 단계씩 내린다

// 스팀 BBCode → 게시판 허용 HTML. 모르는 태그([Space] 같은 키 이름)는 글자 그대로 둔다.
export function bbcode(src) {
  const re = /\[(\/?)([a-z0-9*]+)(?:=([^\]]*))?\]/gi;
  let out = '', last = 0, m, liOpen = [];
  const text = s => { out += esc(s); };
  while ((m = re.exec(src))) {
    const [all, close, rawTag, arg] = m, tag = rawTag.toLowerCase();
    text(src.slice(last, m.index)); last = re.lastIndex;
    if (SIMPLE[tag]) out += `<${close}${SIMPLE[tag]}>`;
    else if (tag === 'list' || tag === 'olist') {
      const el = tag === 'list' ? 'ul' : 'ol';
      if (close) { if (liOpen.pop()) out += '</li>'; out += `</${el}>`; } else { out += `<${el}>`; liOpen.push(false); }
    } else if (tag === '*') {
      if (close) { if (liOpen.length && liOpen[liOpen.length - 1]) { out += '</li>'; liOpen[liOpen.length - 1] = false; } }
      else { if (liOpen.length && liOpen[liOpen.length - 1]) out += '</li>'; out += '<li>'; if (liOpen.length) liOpen[liOpen.length - 1] = true; }
    } else if (tag === 'url' && !close) {
      let href = arg;
      if (href == null) { const end = src.indexOf('[/url]', last); href = end < 0 ? '' : src.slice(last, end); }
      href = href.replace(/^["']|["']$/g, '');
      out += /^https:\/\//i.test(href) ? `<a href="${esc(href)}">` : '<a>';
    } else if (tag === 'url') out += '</a>';
    else if (tag === 'img' && !close) {
      const end = src.indexOf('[/img]', last), url = (end < 0 ? '' : src.slice(last, end)).trim().replace('{STEAM_CLAN_IMAGE}', CLAN_IMG);
      if (end >= 0) { last = end + 6; re.lastIndex = last; }
      if (/^https:\/\//.test(url)) out += `<img src="${esc(url)}" alt="">`;
    } else if (tag === 'previewyoutube' && !close) {
      // iframe 대신 링크만(CSP·추적 방지)
      const id = (arg || '').split(';')[0], end = src.indexOf('[/previewyoutube]', last);
      if (end >= 0) { last = end + 17; re.lastIndex = last; }
      if (/^[\w-]{6,20}$/.test(id)) out += `<p><a href="https://www.youtube.com/watch?v=${id}">YouTube 영상 보기</a></p>`;
    } else text(all);
  }
  text(src.slice(last));
  while (liOpen.length) { if (liOpen.pop()) out += '</li>'; }
  return out
    .replace(new RegExp(`\\s*\\n\\s*(</?(?:${BLOCK})>)`, 'g'), '$1')      // 블록 태그 앞뒤 줄바꿈은 스팀도 무시
    .replace(new RegExp(`(</?(?:${BLOCK})>)\\s*\\n\\s*`, 'g'), '$1')
    .replace(/<p><\/p>/g, '<p><br></p>')                                   // 스팀의 빈 [p][/p] = 빈 줄
    .trim()
    .replace(/\n/g, '<br>');
}

function convert(events) {
  return events.map(ev => {
    const a = ev.announcement_body, j = JSON.parse(ev.jsondata || '{}');
    const sub = (j.localized_subtitle || [])[KO] || (j.localized_subtitle || [])[0] || '';
    // 스팀 뉴스 화면은 제목 바로 밑에 부제를 흐린 큰 글씨로 보여 준다
    const body = (sub ? `<p><span class="fs-l c-gray">${esc(sub)}</span></p>` : '') + bbcode(a.body);
    return { gid: ev.gid, title: a.headline, posttime: a.posttime, body };
  }).sort((x, y) => x.posttime - y.posttime);
}

function sql(list) {
  const q = s => { if (s.includes('$q$')) throw new Error('본문에 $q$ 가 있음'); return '$q$' + s + '$q$'; };
  const rows = list.map(n => `  insert into public.posts (author_id, category, game, title, body, fmt, created_at)
  select admin_id, 'notice', 'soulsaver', ${q(n.title)}, ${q(n.body)}, 'html', to_timestamp(${n.posttime})
  where not exists (select 1 from public.posts where category = 'notice' and title = ${q(n.title)} and created_at = to_timestamp(${n.posttime}));`).join('\n');
  return `-- >>> steam notices (tools/steam_news.mjs 가 만든 구간, 손으로 고치지 말 것)
-- Soul Saver 스팀 공지 ${list.length}개(한국어판). 작성 시각은 스팀 원래 날짜. 이미 있으면(제목+날짜) 건너뛴다.
-- 작성 시각 고정·도배 제한 트리거를 이 블록 안에서만 끄고 다시 켠다. do 블록은 한 덩어리라 중간에 실패해도 트리거가 꺼진 채 남지 않는다.
do $do$
declare
  admin_id uuid := (select id from public.profiles where role = 'admin' order by created_at limit 1);
begin
  if admin_id is null then
    raise notice '관리자 계정이 없어 스팀 공지를 넣지 않았습니다.';
    return;
  end if;
  alter table public.posts disable trigger posts_stamp_insert;
  alter table public.posts disable trigger posts_rate_limit;
${rows}
  alter table public.posts enable trigger posts_stamp_insert;
  alter table public.posts enable trigger posts_rate_limit;
end
$do$;
-- <<< steam notices`;
}

// 자체 시험: 모르는 태그·목록·이미지·escape
const T = bbcode('[h2]A<b>[/h2]\n[list]\n[*]x [Space] y\n[*][b]z[/b]\n[/list]\n[p]a\nb[/p][img]{STEAM_CLAN_IMAGE}/1/2.png[/img][url=javascript:alert(1)]k[/url]');
console.assert(T === '<h3>A&lt;b&gt;</h3><ul><li>x [Space] y</li><li><b>z</b></li></ul><p>a<br>b</p><img src="https://clan.akamai.steamstatic.com/images/1/2.png" alt=""><a>k</a>', T);

const events = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], 'utf8')).events : (await (await fetch(SRC)).json()).events;
const list = convert(events);
writeFileSync(join(ROOT, 'tools/steam_notices.json'), JSON.stringify(list, null, 1) + '\n');
const mig = readFileSync(MIGRATION, 'utf8');
const s = mig.indexOf('-- >>> steam notices'), e = mig.indexOf('-- <<< steam notices');
if (s < 0 || e < 0) throw new Error('마이그레이션 파일에 steam notices 표시가 없음');
writeFileSync(MIGRATION, mig.slice(0, s) + sql(list) + mig.slice(e + '-- <<< steam notices'.length));
console.log(`공지 ${list.length}개 변환, 최대 본문 ${Math.max(...list.map(n => n.body.length))}자`);
