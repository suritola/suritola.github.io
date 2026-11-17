// 소식 메일 일괄 발송(관리자) + 수신 거부 링크. Supabase Edge Function "newsletter".
//
// POST(관리자, Authorization: Bearer <로그인 토큰>) { subject, body, ad, test, offset }
//   - test: 나(관리자) 한 명에게만. 아니면 동의자에게 offset 부터 최대 100명씩 보내고 { sent, total, next } 를 돌려준다(화면이 next 로 이어 부른다).
//   - body 는 일반 글. 빈 줄로 문단을 나눈다. 메일 끝에 동의 안내와 사람마다 서명된 수신 거부 링크가 붙는다.
//   - ad: 광고성 정보면 제목 앞에 "(광고)"(정보통신망법 제50조).
// GET/POST ?u=<회원 id>&s=<서명>: 수신 거부(로그인 없이). 그래서 이 함수는 "Verify JWT" 를 끄고 배포하고, 관리자 확인은 안에서 한다.
//
// 비밀값(대시보드 Edge Functions → Secrets): MAIL_PROVIDER(resend | brevo), MAIL_API_KEY, MAIL_FROM_EMAIL, MAIL_FROM_NAME, UNSUB_SECRET.
// SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 는 Supabase 가 넣어 준다.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const SITE = 'https://suritola.github.io';
const ORIGINS = [SITE, 'http://127.0.0.1:8765', 'http://localhost:8765'];
const PAGE = 100;
const env = (k: string) => Deno.env.get(k) ?? '';

function cors(req: Request): Record<string, string> {
  const o = req.headers.get('origin') ?? '';
  return {
    'Access-Control-Allow-Origin': ORIGINS.includes(o) ? o : SITE,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    Vary: 'Origin',
  };
}

function json(req: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(req), 'Content-Type': 'application/json; charset=utf-8' } });
}

function page(title: string, msg: string, status = 200) {
  return new Response(
    `<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>` +
      `<body style="font-family:'Malgun Gothic',sans-serif;background:#f6f5f2;color:#17181c;padding:48px 20px"><div style="max-width:480px;margin:0 auto;background:#fff;border-radius:8px;padding:28px">` +
      `<h1 style="font-size:20px;margin:0 0 12px">${title}</h1><p style="line-height:1.7;margin:0 0 16px">${msg}</p><a href="${SITE}">민공방 게임즈 홈페이지</a></div></body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  );
}

async function sign(id: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env('UNSUB_SECRET')), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id)));
  return Array.from(mac.slice(0, 16), (b) => b.toString(16).padStart(2, '0')).join('');
}

function same(a: string, b: string) {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

function html(body: string, unsub: string) {
  const paras = esc(body.trim())
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;line-height:1.7">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');
  return (
    `<!doctype html><html lang="ko"><body style="margin:0;padding:24px;background:#f6f5f2;font-family:'Apple SD Gothic Neo','Malgun Gothic',sans-serif;color:#17181c">` +
    `<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:8px;padding:28px"><p style="margin:0 0 20px;font-weight:700">민공방 게임즈</p>${paras}` +
    `<hr style="border:0;border-top:1px solid #e9e8e6;margin:24px 0"><p style="margin:0;font-size:12px;color:#636365;line-height:1.6">` +
    `이 메일은 민공방 게임즈 홈페이지에서 소식 메일 받기에 동의하신 분께 보냅니다.<br>` +
    `더 받지 않으려면 <a href="${unsub}">수신 거부</a>를 누르세요. 홈페이지의 프로필에서도 끌 수 있습니다.<br>` +
    `민공방 게임즈 · mingeunb0@gmail.com · ${SITE}</p></div></body></html>`
  );
}

const text = (body: string, unsub: string) =>
  `${body.trim()}\n\n---\n민공방 게임즈 소식 메일입니다(받기에 동의하신 분께 보냅니다).\n수신 거부: ${unsub}\n${SITE}`;

type Mail = { to: string; subject: string; html: string; text: string; unsub: string };

async function deliver(mails: Mail[]) {
  const provider = env('MAIL_PROVIDER') || 'resend';
  const from = env('MAIL_FROM_EMAIL');
  const name = env('MAIL_FROM_NAME') || '민공방 게임즈';
  if (!env('MAIL_API_KEY') || !from) throw new Error('메일 발송 비밀값(MAIL_API_KEY, MAIL_FROM_EMAIL)이 없습니다');
  if (provider === 'brevo') {
    for (const m of mails) {
      const r = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': env('MAIL_API_KEY'), 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ sender: { email: from, name }, to: [{ email: m.to }], subject: m.subject, htmlContent: m.html, textContent: m.text, headers: { 'List-Unsubscribe': `<${m.unsub}>` } }),
      });
      if (!r.ok) throw new Error(`brevo ${r.status}: ${(await r.text()).slice(0, 200)}`);
    }
    return;
  }
  // Resend: 한 번에 100통까지 보내는 batch
  const r = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env('MAIL_API_KEY')}`, 'content-type': 'application/json' },
    body: JSON.stringify(
      mails.map((m) => ({
        from: `${name} <${from}>`,
        to: [m.to],
        subject: m.subject,
        html: m.html,
        text: m.text,
        headers: { 'List-Unsubscribe': `<${m.unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' },
      })),
    ),
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors(req) });
  const url = new URL(req.url);
  const service = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'));

  // ---------- 수신 거부(로그인 없이) ----------
  const u = url.searchParams.get('u'), s = url.searchParams.get('s');
  if (u && s) {
    if (!env('UNSUB_SECRET') || !same(await sign(u), s)) return page('링크가 맞지 않습니다', '수신 거부 링크가 바르지 않습니다. 홈페이지의 프로필에서 소식 메일을 끌 수 있습니다.', 400);
    const { error } = await service.rpc('newsletter_unsubscribe', { p_id: u });
    if (error) return page('처리하지 못했습니다', '잠시 뒤 다시 눌러 주세요. 홈페이지의 프로필에서도 끌 수 있습니다.', 500);
    return page('수신 거부했습니다', '앞으로 민공방 게임즈 소식 메일을 보내지 않습니다. 다시 받고 싶으면 홈페이지의 프로필에서 켤 수 있습니다.');
  }

  if (req.method !== 'POST') return json(req, { error: '지원하지 않는 요청입니다' }, 405);

  // ---------- 관리자 확인 ----------
  const auth = req.headers.get('authorization') ?? '';
  const asUser = createClient(env('SUPABASE_URL'), env('SUPABASE_ANON_KEY'), { global: { headers: { Authorization: auth } } });
  const { data: who } = await asUser.auth.getUser();
  if (!who?.user) return json(req, { error: '로그인이 필요합니다' }, 401);
  const { data: me } = await service.from('profiles').select('role').eq('id', who.user.id).single();
  if (me?.role !== 'admin') return json(req, { error: '운영자만 보낼 수 있습니다' }, 403);

  // ---------- 보내기 ----------
  let input: { subject?: string; body?: string; ad?: boolean; test?: boolean; offset?: number };
  try {
    input = await req.json();
  } catch {
    return json(req, { error: '요청을 읽지 못했습니다' }, 400);
  }
  const subject = String(input.subject ?? '').trim();
  const body = String(input.body ?? '').trim();
  if (!subject || subject.length > 120) return json(req, { error: '제목은 1~120자로 써 주세요' }, 400);
  if (!body || body.length > 20000) return json(req, { error: '본문은 1~20,000자로 써 주세요' }, 400);
  const fullSubject = (input.ad ? '(광고) ' : '') + subject;
  const offset = Math.max(0, Math.floor(Number(input.offset) || 0));

  let list: { id: string; email: string }[];
  if (input.test) {
    list = [{ id: who.user.id, email: who.user.email ?? '' }];
  } else {
    const { data, error } = await service.rpc('newsletter_recipients');
    if (error) return json(req, { error: '받는 사람 목록을 읽지 못했습니다: ' + error.message }, 500);
    list = (data ?? []) as { id: string; email: string }[];
  }
  const total = list.length;
  const part = input.test ? list : list.slice(offset, offset + PAGE);
  const base = `${env('SUPABASE_URL')}/functions/v1/newsletter`;
  const mails: Mail[] = [];
  for (const r of part) {
    if (!r.email) continue;
    const unsub = `${base}?u=${encodeURIComponent(r.id)}&s=${await sign(r.id)}`;
    mails.push({ to: r.email, subject: fullSubject, html: html(body, unsub), text: text(body, unsub), unsub });
  }
  try {
    if (mails.length) await deliver(mails);
  } catch (e) {
    return json(req, { error: String((e as Error).message ?? e), sent: 0, total }, 502);
  }
  if (input.test || offset === 0) {
    await service.from('newsletter_sends').insert({ subject: fullSubject, sent_by: who.user.id, recipients: input.test ? 1 : total, test: !!input.test });
  }
  const done = offset + part.length;
  return json(req, { sent: mails.length, total, next: !input.test && done < total ? done : null });
});
