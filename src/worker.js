// Llama Lounge server
// - /api/*  accounts: sign up, log in, log out, profile (D1 database "DB")
// - /ws     realtime room: presence, chat, and every token-changing action (Durable Object "LOUNGE")
// Static game files in ./public are served by Workers Assets.
import { DurableObject } from "cloudflare:workers";

// ---------- tunables ----------
const VERSION = "2026-11-19b";             // bump with every release; the page compares it with its own and asks to refresh
const START_TOKENS = 10;
const SESSION_DAYS = 30;
const PBKDF2_ITERS = 100000;              // Workers' maximum for PBKDF2
const LOGIN_MAX_FAILS = 8;                // per username per 15 minutes
const IP_MAX_FAILS = 30;                  // per IP per 15 minutes
const SIGNUPS_PER_IP_HOUR = 5;
const WINDOW_MS = 15 * 60 * 1000;

// three kinds of slot machine along the casino's back wall (x 0-3 FRUIT, 4-8 CLASSIC, 9-12 GOLD); stools are at y 1
// symbols: cherry, lemon, carrot, bell, seven, llama. Three of a kind pays SLOT_PAY x the bet.
const SLOTS = {
  fruit:   { w: [40, 30, 15, 8, 5, 2],   pay: [6, 13, 30, 60, 150, 500] },     // wins about 1 spin in 10, pays back about 89%
  classic: { w: [28, 24, 19, 14, 9, 6],  pay: [8, 15, 25, 50, 120, 500] },     // about 1 in 22, about 89%
  gold:    { w: [24, 22, 20, 16, 11, 7], pay: [4, 8, 15, 30, 100, 1000] },     // about 1 in 26, about 86%, llama jackpot 1 in ~2,900
};
const slotKind = (x) => (x <= 3 ? "fruit" : x <= 8 ? "classic" : "gold");
const SLOT_BETS = [1, 2, 5, 10];
// casino tables (seats are where players sit; the server checks them)
const TABLE_BETS = [1, 2, 5, 10];
const ROUL_SEATS = [[5, 5], [5, 6], [8, 5], [8, 6], [6, 7], [7, 7]];
const BJ_SEATS = [[10, 5], [11, 5], [10, 9], [11, 9]];
const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
// roulette bets: what wins and what it pays back in total (stake included). Single zero: the house edge is 2.7%.
const ROUL = {
  red: { win: (n) => RED.has(n), back: 2 }, black: { win: (n) => n > 0 && !RED.has(n), back: 2 },
  odd: { win: (n) => n > 0 && n % 2 === 1, back: 2 }, even: { win: (n) => n > 0 && n % 2 === 0, back: 2 },
  low: { win: (n) => n >= 1 && n <= 18, back: 2 }, high: { win: (n) => n >= 19, back: 2 },
  d1: { win: (n) => n >= 1 && n <= 12, back: 3 }, d2: { win: (n) => n >= 13 && n <= 24, back: 3 }, d3: { win: (n) => n >= 25, back: 3 },
};
// blackjack: cards are 0-51 (rank = c % 13 with 0 = ace, suit = c / 13); two decks shuffled fresh each hand
const cardVal = (c) => { const r = c % 13; return r === 0 ? 11 : r >= 9 ? 10 : r + 1; };
function handTotal(cards) { let t = 0, aces = 0; for (const c of cards) { t += cardVal(c); if (c % 13 === 0) aces++; } while (t > 21 && aces) { t -= 10; aces--; } return t; }
const FISH = [{ n: "BLUEGILL", pay: 1, w: 70 }, { n: "BIG ORANGE CARP", pay: 2, w: 25 }, { n: "GOLDEN FISH", pay: 5, w: 5 }];
const CROP_KEYS = new Set(); for (const y of [13, 15, 17]) for (let x = 2; x <= 5; x++) CROP_KEYS.add(x + "," + y);
const POND = { x0: 15, x1: 20, y0: 3, y1: 7 };
const TABLES = [{ gx: 8, gy: 8 }, { gx: 3, gy: 8 }];
const CROP_MS = 90000, BAR_MS = 30000;
// market stands in LLAMA ACRES: where each one is and what it sells (token prices)
const STANDS = {
  cider: { x: 7.5, y: 4, items: { cider: 2, caramel: 3 } },     // two tiles wide: x is the middle of the stall
  snack: { x: 10.5, y: 4, items: { capple: 2, corn: 2, pie: 3 } },
};

// ---------- helpers ----------
const enc = new TextEncoder();
const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const b64u = (buf) => b64(buf).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const json = (obj, status = 200, headers = {}) => new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });
const rnd = (n) => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };   // tiny modulo bias is fine for a game
const pickW = (ws) => { let r = rnd(ws.reduce((a, b) => a + b, 0)); for (let i = 0; i < ws.length; i++) { if ((r -= ws[i]) < 0) return i; } return 0; };

async function sha256hex(s) { const d = await crypto.subtle.digest("SHA-256", enc.encode(s)); return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join(""); }
async function pbkdf2(password, saltBytes, iters) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: saltBytes, iterations: iters }, key, 256));
}
function sameBytes(a, b) { if (a.length !== b.length) return false; return crypto.subtle.timingSafeEqual(a, b); }

function cookieToken(req) { const m = /(?:^|;\s*)ll_s=([A-Za-z0-9_-]{20,})/.exec(req.headers.get("cookie") || ""); return m ? m[1] : null; }
const sessCookie = (tok, maxAge) => `ll_s=${tok}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
const clientIp = (req) => req.headers.get("cf-connecting-ip") || "local";

async function sessionUser(env, req) {
  const tok = cookieToken(req); if (!tok) return null;
  const h = await sha256hex(tok);
  const row = await env.DB.prepare("SELECT u.* FROM sessions s JOIN users u ON u.id = s.uid WHERE s.token_hash = ? AND s.expires > ?").bind(h, Date.now()).first();
  return row || null;
}
async function newSession(env, uid) {
  const raw = new Uint8Array(32); crypto.getRandomValues(raw); const tok = b64u(raw);
  await env.DB.prepare("INSERT INTO sessions (token_hash, uid, expires) VALUES (?, ?, ?)").bind(await sha256hex(tok), uid, Date.now() + SESSION_DAYS * 864e5).run();
  return tok;
}
// attempts limiter: returns true if this key is currently blocked
async function blocked(env, k, max) {
  const r = await env.DB.prepare("SELECT n, since FROM login_attempts WHERE k = ?").bind(k).first();
  return !!(r && Date.now() - r.since < WINDOW_MS && r.n >= max);
}
async function bump(env, k) {
  const now = Date.now();
  await env.DB.prepare("INSERT INTO login_attempts (k, n, since) VALUES (?, 1, ?) ON CONFLICT(k) DO UPDATE SET n = CASE WHEN ? - since > ? THEN 1 ELSE n + 1 END, since = CASE WHEN ? - since > ? THEN ? ELSE since END")
    .bind(k, now, now, WINDOW_MS, now, WINDOW_MS, now).run();
}
// staff: the owner is users.role = 'admin' (set in the database); mods are users.role = 'mod' and only the owner can make or remove them
// The owner is ONLY the account with users.role = 'admin' in the database. Never by name, setting or anything the browser sends.
const isAdmin = (env, u) => !!u && u.role === "admin";
const staffRole = (env, u) => (isAdmin(env, u) ? "owner" : u.role === "mod" ? "mod" : "");
const profileOf = (env, u, timers = []) => ({ name: u.name.toUpperCase(), c: u.c, agreed: u.agreed, bet: u.bet, tk: u.tk, bestHay: u.best_hay, bestDash: u.best_dash, admin: isAdmin(env, u), staff: staffRole(env, u), timers });

// same-origin check for anything that changes state
function originOk(req, url) { const o = req.headers.get("origin"); return !o || o === url.origin; }

// ---------- HTTP entry ----------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === "/ws") {
      if (!originOk(req, url) || !req.headers.get("origin")) return new Response("bad origin", { status: 403 });
      if (req.headers.get("upgrade") !== "websocket") return new Response("expected websocket", { status: 426 });
      const u = await sessionUser(env, req);
      if (!u) return new Response("not logged in", { status: 401 });
      if (u.banned) return new Response("banned", { status: 403 });
      // hand the verified identity to the room; the Durable Object is not reachable from the internet directly
      const fwd = new Request("https://room/ws", { headers: { upgrade: "websocket", "x-uid": String(u.id), "x-name": u.name.toUpperCase(), "x-staff": staffRole(env, u) } });
      return env.LOUNGE.get(env.LOUNGE.idFromName("main")).fetch(fwd);
    }
    if (url.pathname.startsWith("/api/")) {
      try { return await api(req, env, url); } catch (e) { console.error(e); return json({ error: "server error" }, 500); }
    }
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response("not found", { status: 404 });
  },
};

async function api(req, env, url) {
  const path = url.pathname;
  if (req.method === "GET" && path === "/api/me") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    if (u.banned) return json({ error: "This account is banned." }, 403);
    const t = await env.DB.prepare("SELECT k, t FROM timers WHERE uid = ? AND k LIKE 'crop:%'").bind(u.id).all();
    return json(profileOf(env, u, (t.results || []).map((r) => ({ k: r.k.slice(5), left: Math.max(0, r.t - Date.now()) }))));
  }
  if (req.method !== "POST") return json({ error: "not found" }, 404);
  if (!originOk(req, url)) return json({ error: "bad origin" }, 403);
  if (!(req.headers.get("content-type") || "").includes("application/json")) return json({ error: "bad request" }, 400);
  const body = await req.json().catch(() => ({}));
  const ip = clientIp(req);

  if (path === "/api/signup") {
    const name = String(body.u || "").trim(), pw = String(body.p || "");
    if (!/^[A-Za-z0-9_]{3,12}$/.test(name)) return json({ error: "Names are 3 to 12 letters, numbers or _." }, 400);
    if (pw.length < 8 || pw.length > 72) return json({ error: "Passwords need 8 to 72 characters." }, 400);
    if (await blocked(env, "su:" + ip, SIGNUPS_PER_IP_HOUR)) return json({ error: "Too many new accounts from here. Try again later." }, 429);
    const salt = new Uint8Array(16); crypto.getRandomValues(salt);
    const hash = await pbkdf2(pw, salt, PBKDF2_ITERS);
    try {
      const r = await env.DB.prepare("INSERT INTO users (name, salt, hash, iters, created, tk) VALUES (?, ?, ?, ?, ?, ?)").bind(name, b64(salt), b64(hash), PBKDF2_ITERS, Date.now(), START_TOKENS).run();
      await bump(env, "su:" + ip);
      const tok = await newSession(env, r.meta.last_row_id);
      const u = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(r.meta.last_row_id).first();
      return json(profileOf(env, u), 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
    } catch (e) {
      if (String(e).includes("UNIQUE")) return json({ error: "That name is taken." }, 409);
      throw e;
    }
  }
  if (path === "/api/login") {
    const name = String(body.u || "").trim(), pw = String(body.p || "");
    const uk = "u:" + name.toLowerCase(), ik = "ip:" + ip;
    if (await blocked(env, uk, LOGIN_MAX_FAILS) || await blocked(env, ik, IP_MAX_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    const u = /^[A-Za-z0-9_]{3,12}$/.test(name) ? await env.DB.prepare("SELECT * FROM users WHERE name = ?").bind(name).first() : null;
    // always run the hash so a wrong name and a wrong password take the same time
    const salt = u ? unb64(u.salt) : new Uint8Array(16);
    const h = await pbkdf2(pw, salt, u ? u.iters : PBKDF2_ITERS);
    if (!u || !sameBytes(h, unb64(u.hash))) { await bump(env, uk); await bump(env, ik); return json({ error: "Wrong name or password." }, 401); }
    if (u.banned) return json({ error: "This account is banned." }, 403);
    await env.DB.prepare("DELETE FROM login_attempts WHERE k = ?").bind(uk).run();
    await env.DB.prepare("DELETE FROM sessions WHERE expires < ?").bind(Date.now()).run();
    const tok = await newSession(env, u.id);
    return json(profileOf(env, u), 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
  }
  if (path === "/api/logout") {
    const tok = cookieToken(req); if (tok) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256hex(tok)).run();
    return json({ ok: true }, 200, { "set-cookie": sessCookie("x".repeat(24), 0) });
  }
  if (path === "/api/password") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    const oldp = String(body.old || ""), np = String(body.p || "");
    if (np.length < 8 || np.length > 72) return json({ error: "Passwords need 8 to 72 characters." }, 400);
    const h = await pbkdf2(oldp, unb64(u.salt), u.iters); if (!sameBytes(h, unb64(u.hash))) return json({ error: "Current password is wrong." }, 401);
    const salt = new Uint8Array(16); crypto.getRandomValues(salt); const nh = await pbkdf2(np, salt, PBKDF2_ITERS);
    await env.DB.prepare("UPDATE users SET salt = ?, hash = ?, iters = ? WHERE id = ?").bind(b64(salt), b64(nh), PBKDF2_ITERS, u.id).run();
    await env.DB.prepare("DELETE FROM sessions WHERE uid = ?").bind(u.id).run();   // sign out everywhere
    const tok = await newSession(env, u.id);
    return json({ ok: true }, 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
  }
  return json({ error: "not found" }, 404);
}

// ---------- realtime room ----------
const PRES_KEYS = new Set(["bj", "c", "n", "x", "y", "d", "p", "m", "s", "h", "hl", "sk", "e", "a", "sp", "td", "g", "fk", "rm", "fs", "sl", "j", "l", "ea"]);
function cleanPresence(p, name, tk, muted, staff) {
  const o = {};
  if (!p || typeof p !== "object") return o;
  for (const k of Object.keys(p)) if (PRES_KEYS.has(k)) o[k] = p[k];
  o.n = name; o.tk = tk; if (staff) o.st = staff; else delete o.st;   // the server decides who you are, what you hold and your staff badge
  if (o.s && typeof o.s === "object") { o.s = { k: +o.s.k || 0, t: String(o.s.t || "").slice(0, 120), y: o.s.y ? 1 : 0, f: o.s.f ? 1 : 0 }; if (muted && !o.s.f) delete o.s; }
  if (JSON.stringify(o).length > 3000) return { c: o.c, n: name, x: o.x, y: o.y, d: o.d, p: o.p, m: o.m, rm: o.rm, tk, ...(staff ? { st: staff } : {}) };
  return o;
}

export class Lounge extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.tables = [null, null];   // live table games (lost if the room ever sleeps, which only happens when it's empty)
  }

  async fetch(req) {
    const uid = +req.headers.get("x-uid"), name = req.headers.get("x-name"), staff = ["owner", "mod"].includes(req.headers.get("x-staff")) ? req.headers.get("x-staff") : "";
    // one llama per account: an older connection for this account (another tab, or one left over from a reload) is closed and removed for everyone
    for (const w of this.sockets()) { const old = w.deserializeAttachment(); if (!old || old.uid !== uid) continue;
      if (old.pres) this.broadcast({ t: "peers", left: [{ peer: old.peer }] }, w);
      try { w.serializeAttachment({ ...old, pres: null }); w.close(4001, "replaced"); } catch (e) {} }
    const pair = new WebSocketPair(); const [client, server] = Object.values(pair);
    const peer = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
    this.ctx.acceptWebSocket(server);
    server.serializeAttachment({ uid, name, staff, peer, pres: null, rate: [Date.now(), 0] });
    // greet with everyone already here, the leaderboard and table states
    const peers = this.sockets().filter((w) => w !== server && w.readyState === 1).map((w) => w.deserializeAttachment()).filter((a) => a && a.pres && a.uid !== uid).map((a) => ({ peer: a.peer, presence: a.pres }));
    server.send(JSON.stringify({ t: "hello", v: VERSION, peer, peers, board: await this.board() }));
    return new Response(null, { status: 101, webSocket: client });
  }

  sockets() { return this.ctx.getWebSockets(); }
  send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (e) {} }
  broadcast(obj, except) { const s = JSON.stringify(obj); for (const w of this.sockets()) if (w !== except) { try { w.send(s); } catch (e) {} } }

  async webSocketMessage(ws, raw) {
    const a = ws.deserializeAttachment(); if (!a) return;
    // simple flood control: 40 messages a second per connection
    const now = Date.now(); if (now - a.rate[0] > 1000) a.rate = [now, 0]; a.rate[1]++; if (a.rate[1] > 40) { ws.serializeAttachment(a); return; }
    let m; try { m = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw)); } catch (e) { return; }
    if (!m || typeof m !== "object") return;

    if (m.t === "p") {
      // balance / mute / ban are cached for a few seconds so moving around doesn't hit the database every step
      if (!a.uc || now - a.uc.t > 5000){ const u = await this.user(a.uid); if (!u || u.banned) { ws.close(4003, "banned"); return; } a.uc = { t: now, tk: u.tk, muted: u.muted }; a.staff = staffRole(this.env, u); }
      const first = !a.pres;
      a.pres = cleanPresence(m.p, a.name, a.uc.tk, !!a.uc.muted, a.staff); ws.serializeAttachment(a);
      this.broadcast({ t: "peers", [first ? "joined" : "updated"]: [{ peer: a.peer, presence: a.pres }] }, ws);
      return;
    }
    if (m.t === "act") {
      let res;
      try { res = await this.act(ws, a, String(m.a || ""), m); } catch (e) { console.error(e); res = { ok: false, msg: "Server hiccup, try again." }; }
      if (res && Number.isFinite(res.tk)) { const a2 = ws.deserializeAttachment(); if (a2) { a2.uc = { t: Date.now(), tk: res.tk, muted: a2.uc ? a2.uc.muted : 0 }; ws.serializeAttachment(a2); } }
      this.send(ws, { t: "res", id: m.id, ...res });
    }
  }

  async webSocketClose(ws) { this.left(ws); }
  async webSocketError(ws) { this.left(ws); }
  left(ws) { const a = ws.deserializeAttachment(); if (a && a.pres) this.broadcast({ t: "peers", left: [{ peer: a.peer }] }, ws); }

  // ---------- database helpers ----------
  async user(uid) { return this.env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(uid).first(); }
  async credit(uid, n, why) {
    if (n <= 0) return (await this.user(uid)).tk;
    const r = await this.env.DB.prepare("UPDATE users SET tk = tk + ? WHERE id = ? RETURNING tk").bind(n, uid).first();
    await this.env.DB.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(uid, n, why, Date.now()).run();
    return r.tk;
  }
  async debit(uid, n, why) {   // returns new balance, or null if they can't afford it
    if (n <= 0) return (await this.user(uid)).tk;
    const r = await this.env.DB.prepare("UPDATE users SET tk = tk - ? WHERE id = ? AND tk >= ? RETURNING tk").bind(n, uid, n).first();
    if (!r) return null;
    await this.env.DB.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(uid, -n, why, Date.now()).run();
    return r.tk;
  }
  async timer(uid, k) { const r = await this.env.DB.prepare("SELECT t FROM timers WHERE uid = ? AND k = ?").bind(uid, k).first(); return r ? r.t : 0; }
  async setTimer(uid, k, t) { await this.env.DB.prepare("INSERT INTO timers (uid, k, t) VALUES (?, ?, ?) ON CONFLICT(uid, k) DO UPDATE SET t = excluded.t").bind(uid, k, t).run(); }
  async clearTimer(uid, k) { await this.env.DB.prepare("DELETE FROM timers WHERE uid = ? AND k = ?").bind(uid, k).run(); }
  async board() {
    const top = async (col) => ((await this.env.DB.prepare(`SELECT name, ${col} AS s FROM users WHERE ${col} > 0 AND banned = 0 ORDER BY ${col} DESC LIMIT 5`).all()).results || []).map((r) => ({ n: r.name.toUpperCase(), s: r.s }));
    return { hay: await top("best_hay"), dash: await top("best_dash") };
  }
  near(a, rm, fn) { const p = a.pres; return !!(p && p.rm === rm && Number.isFinite(p.x) && Number.isFinite(p.y) && fn(p.x - 0.5, p.y - 0.5, p)); }

  // ---------- every token-changing action goes through here ----------
  async act(ws, a, kind, m) {
    const uid = a.uid, now = Date.now();
    switch (kind) {
      case "profile": {
        const c = ["twotone", "poophat", "tweed"].includes(m.c) ? m.c : null;
        const bet = Math.max(0, Math.min(10, Math.floor(+m.bet || 0)));
        await this.env.DB.prepare("UPDATE users SET c = COALESCE(?, c), agreed = MAX(agreed, ?), bet = ? WHERE id = ?").bind(c, Math.max(0, Math.min(9, +m.agreed || 0)), bet, uid).run();
        return { ok: true };
      }
      case "drink": {
        if (!this.near(a, "lounge", (x, y, p) => p.p === "sit" && Math.round(y) === 2)) return { ok: false, msg: "Sit at the bar first." };
        const tk = await this.debit(uid, 1, "drink"); if (tk === null) return { ok: false, msg: "Drinks cost 1 TOKEN. Earn some at the arcade, the bar or LLAMA ACRES!" };
        return { ok: true, tk };
      }
      case "slot": {
        let sx = -1; if (!this.near(a, "casino", (x, y, p) => { sx = Math.round(x); return p.p === "sit" && Math.round(y) === 1 && sx >= 0 && sx <= 12; })) return { ok: false, msg: "Sit at a slot machine first." };
        const bet = SLOT_BETS.includes(+m.bet) ? +m.bet : 1, M = SLOTS[slotKind(sx)];
        if (now - (await this.timer(uid, "slot")) < 1300) return { ok: false, msg: "The reels are still spinning." };
        await this.setTimer(uid, "slot", now);
        let tk = await this.debit(uid, bet, "slot spin"); if (tk === null) return { ok: false, msg: `YOU NEED ${bet} TOKEN${bet > 1 ? "S" : ""} TO SPIN.` };
        const r = [pickW(M.w), pickW(M.w), pickW(M.w)];
        const pay = r[0] === r[1] && r[1] === r[2] ? M.pay[r[0]] * bet : 0;
        if (pay) tk = await this.credit(uid, pay, "slot win");
        return { ok: true, r, pay, bet, tk };
      }
      case "harvest": {
        const k = String(m.k || ""); if (!CROP_KEYS.has(k)) return { ok: false };
        const [cx, cy] = k.split(",").map(Number);
        if (!this.near(a, "barn", (x, y) => Math.abs(x - cx) <= 1.6 && Math.abs(y - cy) <= 1.6)) return { ok: false, msg: "Walk up to the plot first." };
        const ready = await this.timer(uid, "crop:" + k);
        if (now < ready) return { ok: false, left: ready - now, msg: `Those carrots are still growing. Ready in ${Math.ceil((ready - now) / 1000)}s.` };
        await this.setTimer(uid, "crop:" + k, now + CROP_MS);
        return { ok: true, left: CROP_MS, tk: await this.credit(uid, 1, "harvest") };
      }
      case "fish_cast": {
        if (!this.near(a, "barn", (x, y) => x >= POND.x0 - 1.6 && x <= POND.x1 + 1.6 && y >= POND.y0 - 1.6 && y <= POND.y1 + 1.6)) return { ok: false, msg: "Stand next to the pond to fish." };
        const bite = 10000 + rnd(10000);
        await this.setTimer(uid, "fish", now + bite);
        return { ok: true, bite };
      }
      case "fish_reel": {
        const t = await this.timer(uid, "fish");
        if (!t || now < t - 300 || now > t + 20000) return { ok: false, msg: "Nothing on the line." };
        await this.clearTimer(uid, "fish");
        const f = pickW(FISH.map((x) => x.w));
        return { ok: true, f, pay: FISH[f].pay, name: FISH[f].n, tk: await this.credit(uid, FISH[f].pay, "fish") };
      }
      case "bar_tick": {
        if (!this.near(a, "lounge", (x, y, p) => p.p === "bar" && y < 1.2)) { await this.clearTimer(uid, "bar"); return { ok: false }; }
        const last = await this.timer(uid, "bar");
        if (!last) { await this.setTimer(uid, "bar", now); return { ok: true, started: true }; }
        if (now - last < BAR_MS - 1500) return { ok: false };
        await this.setTimer(uid, "bar", now);
        return { ok: true, tk: await this.credit(uid, 1, "bar tips") };
      }
      case "bar_off": { await this.clearTimer(uid, "bar"); return { ok: true }; }
      case "arcade": {
        const id = m.game === "dash" ? "dash" : "hay", score = Math.max(0, Math.floor(+m.score || 0)), ms = Math.max(0, +m.ms || 0);
        // plausibility: nobody scores faster than the game allows
        const maxRate = id === "hay" ? 25 : 24; if (ms < 3000 || score > (ms / 1000) * maxRate + 5) return { ok: false, msg: "That score didn't add up." };
        if (now - (await this.timer(uid, "arcade")) < Math.min(ms, 15000) - 500) return { ok: false };
        await this.setTimer(uid, "arcade", now);
        const col = id === "hay" ? "best_hay" : "best_dash";
        const u = await this.user(uid); const isBest = score > u[col];
        if (isBest) await this.env.DB.prepare(`UPDATE users SET ${col} = ? WHERE id = ?`).bind(score, uid).run();
        let earn = Math.min(10, Math.floor(score / (id === "hay" ? 10 : 50))); if (isBest && score > 0) earn += 3;
        const tk = await this.credit(uid, earn, "arcade " + id);
        if (isBest) this.broadcast({ t: "board", board: await this.board() });
        return { ok: true, earned: earn, best: isBest, tk };
      }
      case "buy": {
        const S = STANDS[m.s === "snack" ? "snack" : "cider"], k = String(m.k || ""), cost = Object.hasOwn(S.items, k) ? S.items[k] : 0;
        if (!cost) return { ok: false, msg: "They don't sell that here." };
        if (!this.near(a, "barn", (x, y) => Math.abs(x - S.x) <= 2.1 && Math.abs(y - S.y) <= 1.6)) return { ok: false, msg: "Walk up to the stand first." };
        const tk = await this.debit(uid, cost, "stand " + k); if (tk === null) return { ok: false, msg: `That costs ${cost} TOKENS. Harvest carrots or go fishing to earn some!` };
        return { ok: true, k, tk };
      }
      case "roulette": {
        if (!this.near(a, "casino", (x, y, p) => p.p === "sit" && ROUL_SEATS.some(([sx, sy]) => sx === Math.round(x) && sy === Math.round(y)))) return { ok: false, msg: "Sit at the roulette table first." };
        const kind = String(m.k || ""), num = Math.floor(+m.n), bet = TABLE_BETS.includes(+m.bet) ? +m.bet : 0;
        const straight = kind === "n" && num >= 0 && num <= 36;
        if (!bet || (!straight && !ROUL[kind])) return { ok: false, msg: "Pick a bet first." };
        if (now - (await this.timer(uid, "roul")) < 3200) return { ok: false, msg: "The ball is still rolling." };
        await this.setTimer(uid, "roul", now);
        let tk = await this.debit(uid, bet, "roulette bet"); if (tk === null) return { ok: false, msg: `You need ${bet} TOKEN${bet > 1 ? "S" : ""} for that bet.` };
        const n = rnd(37), won = straight ? n === num : ROUL[kind].win(n), pay = won ? bet * (straight ? 36 : ROUL[kind].back) : 0;
        if (pay) tk = await this.credit(uid, pay, "roulette win");
        this.broadcast({ t: "rl", n, by: a.name });   // everyone in the casino sees the wheel spin
        return { ok: true, n, pay, bet, tk };
      }
      case "bj": return this.blackjack(a, m, now);
      case "tg_start": return this.tableStart(ws, a, m);
      case "admin": return this.admin(a, m);
      case "dash": return this.dashboard(a);
    }
    return { ok: false, msg: "The game was just updated. Refresh the page to get the newest version." };
  }

  // ---------- blackjack: one hand per player against the dealer, kept in this room's storage between moves ----------
  async blackjack(a, m, now) {
    const uid = a.uid, key = "bj:" + uid, cmd = String(m.c || "");
    if (!this.near(a, "casino", (x, y, p) => p.p === "sit" && BJ_SEATS.some(([sx, sy]) => sx === Math.round(x) && sy === Math.round(y)))) return { ok: false, msg: "Sit at a blackjack table first." };
    let h = await this.ctx.storage.get(key);
    const view = (h, extra = {}) => ({ ok: true, p: h.p, d: h.done ? h.d : [h.d[0], -1], pt: handTotal(h.p), dt: h.done ? handTotal(h.d) : cardVal(h.d[0]), bet: h.bet, done: !!h.done, res: h.res || null, canDouble: !h.done && h.p.length === 2, ...extra });
    const finish = async (h, res) => {   // settle the hand and pay out
      h.done = true; h.res = res; await this.ctx.storage.delete(key);
      const back = res === "bj" ? Math.floor(h.bet * 2.5) : res === "win" ? h.bet * 2 : res === "push" ? h.bet : 0;
      const tk = back ? await this.credit(uid, back, "blackjack " + res) : (await this.user(uid)).tk;
      return view(h, { tk, back });
    };
    const dealerPlays = async (h) => { while (handTotal(h.d) < 17) h.d.push(h.deck.pop());
      const pt = handTotal(h.p), dt = handTotal(h.d); return finish(h, dt > 21 || pt > dt ? "win" : pt === dt ? "push" : "lose"); };
    if (cmd === "state") return h ? view(h) : { ok: true, idle: true };
    if (cmd === "deal") {
      if (h) return view(h);   // a hand is already going: pick it back up
      const bet = TABLE_BETS.includes(+m.bet) ? +m.bet : 0; if (!bet) return { ok: false, msg: "Pick a bet first." };
      if (now - (await this.timer(uid, "bj")) < 1200) return { ok: false, msg: "Shuffling..." };
      await this.setTimer(uid, "bj", now);
      const tk = await this.debit(uid, bet, "blackjack bet"); if (tk === null) return { ok: false, msg: `You need ${bet} TOKEN${bet > 1 ? "S" : ""} for that bet.` };
      const deck = [...Array(104).keys()].map((i) => i % 52); for (let k = deck.length - 1; k > 0; k--) { const j = rnd(k + 1); [deck[k], deck[j]] = [deck[j], deck[k]]; }
      h = { bet, deck, p: [deck.pop(), deck.pop()], d: [deck.pop(), deck.pop()] };
      const pbj = handTotal(h.p) === 21, dbj = handTotal(h.d) === 21;
      if (pbj || dbj) return finish(h, pbj && dbj ? "push" : pbj ? "bj" : "lose");
      await this.ctx.storage.put(key, h); return view(h, { tk });
    }
    if (!h) return { ok: false, msg: "Place a bet and deal first." };
    if (cmd === "hit") { h.p.push(h.deck.pop()); const t = handTotal(h.p);
      if (t > 21) return finish(h, "bust"); if (t === 21) return dealerPlays(h); await this.ctx.storage.put(key, h); return view(h); }
    if (cmd === "stand") return dealerPlays(h);
    if (cmd === "double") {
      if (h.p.length !== 2) return { ok: false, msg: "You can only double on your first two cards." };
      const tk = await this.debit(uid, h.bet, "blackjack double"); if (tk === null) return { ok: false, msg: "Not enough TOKENS to double." };
      h.bet *= 2; h.p.push(h.deck.pop()); if (handTotal(h.p) > 21) return finish(h, "bust"); return dealerPlays(h);
    }
    return { ok: false };
  }

  // ---------- table games: the server deals, rolls and settles every bet ----------
  seatedAt(i) {
    const T = TABLES[i], out = [];
    for (const w of this.sockets()) { const a = w.deserializeAttachment(); if (!a) continue;
      if (this.near(a, "lounge", (x, y, p) => p.p === "sit" && Math.abs(x - T.gx) + Math.abs(y - T.gy) === 1)) out.push({ w, a }); }
    return out;
  }
  async tableStart(ws, a, m) {
    const i = m.i === 1 ? 1 : 0, g = m.g === "card" ? "card" : "roll";
    if (!this.seatedAt(i).some((s) => s.a.peer === a.peer)) return { ok: false, msg: "Sit at the table first!" };
    if (this.tables[i]) return { ok: false, msg: "A game is already going at this table." };
    this.tables[i] = { g, host: a.name };
    this.broadcast({ t: "tg", i, ph: "join", g, left: 8, host: a.name });
    setTimeout(() => this.tableResolve(i).catch((e) => console.error(e)), 8000);
    return { ok: true };
  }
  async tableResolve(i) {
    const st = this.tables[i]; if (!st) return;
    const seated = this.seatedAt(i);
    if (!seated.length) { this.tables[i] = null; this.broadcast({ t: "tg", i, ph: "cancel" }); return; }
    const n = seated.length + 1; let vals;
    if (st.g === "card") { const deck = [...Array(52).keys()]; for (let k = deck.length - 1; k > 0; k--) { const j = rnd(k + 1); [deck[k], deck[j]] = [deck[j], deck[k]]; } vals = deck.slice(0, n); }
    else vals = Array.from({ length: n }, () => 1 + rnd(6));
    const house = vals[n - 1];
    const r = seated.map((s, k) => ({ p: s.a.peer, n: s.a.name, v: vals[k] })); r.push({ p: "house", n: "THE HOUSE", v: house });
    let w = 0; r.forEach((x, k) => { if (x.v > r[w].v) w = k; });
    this.broadcast({ t: "tg", i, ph: "res", g: st.g, r, w });
    // settle each player's own bet against the house
    const seen = new Set();
    for (const [k, s] of seated.entries()) {
      if (seen.has(s.a.uid)) continue; seen.add(s.a.uid);
      const u = await this.user(s.a.uid); const bet = Math.min(u.bet, u.tk); const v = vals[k];
      let tk = u.tk, note;
      if (!bet) note = v > house ? "You beat the house! (free game)" : v === house ? "You tied the house." : "The house wins this one.";
      else if (v > house) { tk = await this.credit(u.id, bet, "table win"); note = `You beat the house! +${bet} TOKENS`; }
      else if (v === house) note = "You tied the house. Your bet is returned.";
      else { const t2 = await this.debit(u.id, bet, "table loss"); if (t2 !== null) tk = t2; note = `The house wins. You lost ${bet} TOKEN${bet > 1 ? "S" : ""}.`; }
      for (const w2 of this.sockets()) { const a2 = w2.deserializeAttachment(); if (a2 && a2.uid === u.id) this.send(w2, { t: "tk", tk, msg: note }); }
    }
    setTimeout(() => { this.tables[i] = null; }, 4000);
  }

  // ---------- staff tools: mods mute, unmute and kick; the owner can also ban, unban and make or remove mods ----------
  async logStaff(by, cmd, target) {
    const log = (await this.ctx.storage.get("modlog")) || [];
    log.unshift({ t: Date.now(), by, cmd, target }); await this.ctx.storage.put("modlog", log.slice(0, 40));
  }
  // Re-reads the caller's role from the database on every staff request, so a removed mod loses access instantly.
  async staffNow(a) { const me = await this.user(a.uid); const st = me && !me.banned ? staffRole(this.env, me) : ""; a.staff = st; return st; }
  async dashboard(a) {
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can open the dashboard." };
    const online = []; const seen = new Set();
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || seen.has(x.uid)) continue; seen.add(x.uid);
      online.push({ n: x.name, rm: x.pres.rm || "lounge", st: x.staff || "", muted: !!(x.uc && x.uc.muted) }); }
    const rows = async (sql) => ((await this.env.DB.prepare(sql).all()).results || []).map((r) => ({ n: r.name.toUpperCase(), role: r.role }));
    const staff = await rows("SELECT name, role FROM users WHERE role IN ('admin','mod') ORDER BY role, name");
    const muted = await rows("SELECT name, role FROM users WHERE muted = 1 ORDER BY name LIMIT 50");
    const banned = await rows("SELECT name, role FROM users WHERE banned = 1 ORDER BY name LIMIT 50");
    return { ok: true, me: a.staff, online, staff, muted, banned, log: (await this.ctx.storage.get("modlog")) || [] };
  }
  async admin(a, m) {
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can do that." };
    const now = Date.now(); this.staffRate = this.staffRate || new Map();   // at most 20 staff actions a minute per account
    const sr = (this.staffRate.get(a.uid) || []).filter((t) => now - t < 60000);
    if (sr.length >= 20) return { ok: false, msg: "Slow down. Too many staff actions in a minute." }; sr.push(now); this.staffRate.set(a.uid, sr);
    const cmd = String(m.cmd || ""), target = String(m.target || "").trim();
    const ownerOnly = ["ban", "unban", "mod", "unmod"];
    if (![...ownerOnly, "mute", "unmute", "kick"].includes(cmd) || !/^[A-Za-z0-9_]{3,12}$/.test(target)) return { ok: false, msg: a.staff === "owner" ? "Use /mute, /unmute, /kick, /ban, /unban, /mod or /unmod NAME" : "Use /mute, /unmute or /kick NAME" };
    if (ownerOnly.includes(cmd) && a.staff !== "owner") return { ok: false, msg: "Only the owner can do that." };
    const u = await this.env.DB.prepare("SELECT id, name, role FROM users WHERE name = ?").bind(target).first();
    if (!u) return { ok: false, msg: "No player named " + target.toUpperCase() };
    const theirs = staffRole(this.env, u);
    if (u.id === a.uid) return { ok: false, msg: "You can't do that to yourself." };
    if (theirs === "owner") return { ok: false, msg: "Nobody can moderate the owner." };
    if (theirs === "mod" && a.staff !== "owner") return { ok: false, msg: "Mods can't moderate other mods." };
    if (cmd === "mute" || cmd === "unmute") await this.env.DB.prepare("UPDATE users SET muted = ? WHERE id = ?").bind(cmd === "mute" ? 1 : 0, u.id).run();
    if (cmd === "ban" || cmd === "unban") await this.env.DB.prepare("UPDATE users SET banned = ? WHERE id = ?").bind(cmd === "ban" ? 1 : 0, u.id).run();
    if (cmd === "ban") await this.env.DB.prepare("DELETE FROM sessions WHERE uid = ?").bind(u.id).run();
    if (cmd === "mod" || cmd === "unmod") await this.env.DB.prepare("UPDATE users SET role = ? WHERE id = ? AND role != 'admin'").bind(cmd === "mod" ? "mod" : "player", u.id).run();
    for (const w of this.sockets()) { const a2 = w.deserializeAttachment(); if (!a2 || a2.uid !== u.id) continue;
      if (cmd === "ban" || cmd === "kick") { this.send(w, { t: "kick", msg: cmd === "ban" ? "You have been banned from the lounge." : "You were removed from the lounge." }); try { w.close(4003, cmd); } catch (e) {} }
      else { // their badge and mute show up straight away
        a2.uc = null; if (cmd === "mod" || cmd === "unmod") a2.staff = cmd === "mod" ? "mod" : ""; w.serializeAttachment(a2);
        if (cmd === "mod" || cmd === "unmod") this.send(w, { t: "staff", st: cmd === "mod" ? "mod" : "", msg: cmd === "mod" ? "You are now a MOD! Open MENU > DASHBOARD." : "You are no longer a mod." }); } }
    await this.logStaff(a.name, cmd, u.name.toUpperCase());
    const done = { mute: "muted", unmute: "unmuted", kick: "kicked", ban: "banned", unban: "unbanned", mod: "is now a MOD", unmod: "is no longer a mod" }[cmd];
    return { ok: true, msg: `${u.name.toUpperCase()} ${done}.` };
  }
}
