#!/usr/bin/env node
// 다운로드 탭의 베타 빌드 받기 링크를 베타 코드로 잠근다(js/beta-data.js 의 lock 을 쓴다).
// 베타 코드는 사이트 전체에 하나다: 그 코드 하나로 잠긴 게임을 모두 받을 수 있다.
//
// 쓰는 법(코드는 저장소에 남기지 않는다. 환경 변수나 인자로만 넘긴다):
//   MG_BETA_CODE=BETA-XXXX-XXXX node tools/beta_add.mjs set moonrope --url <받기 링크> [--version 2026-11-17] [--size "66 MB"]
//   (100MB 가 넘는 빌드: --parts <조각1 링크>,<조각2 링크>,... --file <저장할 zip 이름> --bytes <전체 바이트 수>. 다운로드 페이지가 조각을 받아 하나로 합친다)
//   node tools/beta_add.mjs rekey --old BETA-AAAA-AAAA --new BETA-BBBB-BBBB   (모든 게임을 새 코드로 다시 잠근다)
//   node tools/beta_add.mjs check --code BETA-XXXX-XXXX                       (코드로 무엇이 열리는지 본다)
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const beta = require(join(root, 'js', 'beta-crypto.js'));
const dataPath = join(root, 'js', 'beta-data.js');

function args(list) {
  const o = { _: [] };
  for (let i = 0; i < list.length; i++) {
    if (list[i].startsWith('--')) o[list[i].slice(2)] = list[i + 1], i++;
    else o._.push(list[i]);
  }
  return o;
}

function load() {
  const src = readFileSync(dataPath, 'utf8');
  const a = src.indexOf('['), b = src.lastIndexOf(']');
  return { head: src.slice(0, a), list: JSON.parse(src.slice(a, b + 1)), tail: src.slice(b + 1) };
}

function save(d) {
  writeFileSync(dataPath, d.head + JSON.stringify(d.list, null, 2) + d.tail);
}

const a = args(process.argv.slice(2));
const cmd = a._[0];
const d = load();

if (cmd === 'set') {
  const id = a._[1];
  const code = a.code || process.env.MG_BETA_CODE;
  const game = d.list.find((g) => g.id === id);
  if (!game || !(a.url || a.parts) || !code) {
    console.error('쓰는 법: MG_BETA_CODE=... node tools/beta_add.mjs set <게임 id> --url <받기 링크>');
    console.error('게임 id: ' + d.list.map((g) => g.id).join(', '));
    process.exit(1);
  }
  const inside = a.parts
    ? { parts: a.parts.split(',').map((s) => s.trim()).filter(Boolean), file: a.file, bytes: Number(a.bytes) || 0 }
    : { url: a.url };
  game.lock = await beta.seal(inside, code);
  if (a.version) game.version = a.version;
  if (a.size) game.size = a.size;
  delete game.href;
  save(d);
  console.log('잠금: ' + id + ' (' + (game.version || '') + ')');
} else if (cmd === 'rekey') {
  if (!a.old || !a.new) {
    console.error('쓰는 법: node tools/beta_add.mjs rekey --old <지금 코드> --new <새 코드>');
    process.exit(1);
  }
  for (const g of d.list) {
    if (!g.lock) continue;
    const inside = await beta.open(g.lock, a.old);
    if (!inside) {
      console.error(g.id + ': 지금 코드로 열리지 않는다. 아무것도 바꾸지 않았다.');
      process.exit(1);
    }
    g.lock = await beta.seal(inside, a.new);
  }
  save(d);
  console.log('새 코드로 다시 잠갔다: ' + d.list.filter((g) => g.lock).map((g) => g.id).join(', '));
} else if (cmd === 'check') {
  const code = a.code || process.env.MG_BETA_CODE;
  for (const g of d.list) {
    if (!g.lock) continue;
    const inside = await beta.open(g.lock, code);
    console.log(g.id + ': ' + (inside ? '열림 ' + (inside.url || inside.parts.length + '조각 ' + inside.file) : '열리지 않음'));
  }
} else {
  console.error('명령: set | rekey | check (파일 맨 위의 쓰는 법 참고)');
  process.exit(1);
}
