/* 다운로드 탭의 베타 코드 잠금: 받기 링크를 코드로 암호화(PBKDF2-SHA256 → AES-GCM 256)해 둔다.
   정적 사이트라 서버에서 코드를 검사할 수 없어서, 코드를 모르면 링크를 알 수 없게 하는 방식이다.
   브라우저(window.MGBeta)와 tools/beta_add.mjs(Node)가 같은 파일을 쓴다. */
(function (root) {
  var ITER = 250000;

  // 코드는 대소문자·띄어쓰기·하이픈을 가리지 않는다(쿠폰 코드처럼 MOON-ABCD-EFGH 를 아무렇게나 쳐도 된다)
  function norm(code) {
    return String(code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  }

  function toB64(buf) {
    var s = '', b = new Uint8Array(buf);
    for (var i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
    return btoa(s);
  }

  function fromB64(s) {
    var bin = atob(s), b = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
    return b;
  }

  function derive(code, salt, iter) {
    var subtle = root.crypto.subtle;
    return subtle
      .importKey('raw', new TextEncoder().encode(norm(code)), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return subtle.deriveKey(
          { name: 'PBKDF2', salt: salt, iterations: iter || ITER, hash: 'SHA-256' },
          base,
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        );
      });
  }

  /** 잠금을 코드로 연다. 맞으면 안의 내용(객체), 틀리면 null. */
  function open(lock, code) {
    if (!lock || !norm(code)) return Promise.resolve(null);
    return derive(code, fromB64(lock.salt), lock.iter)
      .then(function (key) {
        return root.crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(lock.iv) }, key, fromB64(lock.ct));
      })
      .then(function (plain) {
        return JSON.parse(new TextDecoder().decode(plain));
      })
      .catch(function () {
        return null;
      });
  }

  /** 내용을 코드로 잠근다(도구가 쓴다). */
  function seal(payload, code) {
    var salt = root.crypto.getRandomValues(new Uint8Array(16));
    var iv = root.crypto.getRandomValues(new Uint8Array(12));
    return derive(code, salt, ITER)
      .then(function (key) {
        return root.crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, new TextEncoder().encode(JSON.stringify(payload)));
      })
      .then(function (ct) {
        return { iter: ITER, salt: toB64(salt), iv: toB64(iv), ct: toB64(ct) };
      });
  }

  var api = { norm: norm, open: open, seal: seal };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MGBeta = api;
})(typeof self !== 'undefined' ? self : globalThis);
