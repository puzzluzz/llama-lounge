// The home page: live player count, and a log in that launches the game at /play.
// Passwords are only ever sent to /api/login; nothing is kept on the page or in storage.
(() => {
  'use strict';
  const $ = id => document.getElementById(id);

  // old email links pointed at the home page; the game handles them now
  if (/^#(reset|verify)=/.test(location.hash || '')) { location.replace('/play' + location.hash); return; }

  // ---- player count ----
  async function count() {
    let s = null;
    try { const r = await fetch('/api/status', { credentials: 'omit' }); if (r.ok) s = await r.json(); } catch (_) { /* offline: leave the last number up */ }
    if (!s) { if ($('count_n').textContent === '...') { $('count_n').textContent = ''; $('count_t').textContent = 'Player count is not available right now'; } return; }
    const n = Math.max(0, +s.online || 0), cap = +s.cap || 0, wait = Math.max(0, +s.waiting || 0);
    $('count_dot').classList.toggle('on', n > 0);
    $('count_n').textContent = String(n);
    $('count_t').textContent = (n === 1 ? 'llama online now' : 'llamas online now') + (cap && n >= cap ? (wait ? ', full, ' + wait + ' waiting in line' : ', full right now') : '');
  }
  count(); setInterval(() => { if (!document.hidden) count(); }, 20000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) count(); });

  // ---- already logged in? offer PLAY instead of the form ----
  fetch('/api/me', { credentials: 'same-origin' }).then(async r => {
    if (!r.ok) return; const p = await r.json(); if (!p || !p.name) return;
    $('back_n').textContent = String(p.name).toUpperCase(); $('login').hidden = true; $('back').hidden = false;
  }).catch(() => {});
  $('back_out').addEventListener('click', async () => {
    try { await fetch('/api/logout', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: '{}' }); } catch (_) { /* reload shows the real state */ }
    location.reload();
  });

  // ---- log in, then launch the game ----
  const err = $('li_err'), go = $('li_go');
  $('login').addEventListener('submit', async e => {
    e.preventDefault();
    const u = $('li_u').value.trim(), p = $('li_p').value;
    if (!u || !p) { err.textContent = 'Enter your llama name (or email) and your password.'; return; }
    err.textContent = ''; go.disabled = true; go.textContent = 'LOGGING IN...';
    let r = null, j = {};
    try { r = await fetch('/api/login', { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ u, p }) }); j = await r.json().catch(() => ({})); } catch (_) { /* handled below */ }
    $('li_p').value = '';
    if (r && r.ok && j.need2fa === 'passkey') {   // staff accounts: the passkey step happens in the game
      try { sessionStorage.setItem('ll_pk', JSON.stringify({ t: j.t, opts: j.opts, at: Date.now() })); } catch (_) { /* the game will ask for the password again */ }
      location.href = '/play'; return;
    }
    if (r && r.ok && j.name) { location.href = '/play'; return; }
    go.disabled = false; go.textContent = 'LOG IN AND PLAY';
    err.textContent = (j && j.error) || (r ? 'That did not work. Try again.' : 'Could not reach the game. Check your connection and try again.');
  });
})();
