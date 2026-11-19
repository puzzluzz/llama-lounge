// Llama Lounge server
// - /api/*  accounts: sign up, log in, log out, profile (D1 database "DB")
// - /ws     realtime room: presence, chat, and every token-changing action (Durable Object "LOUNGE")
// Static game files in ./public are served by Workers Assets.
import { DurableObject } from "cloudflare:workers";

// ---------- tunables ----------
const VERSION = "2026-11-22j";             // bump with every release; the page compares it with its own and asks to refresh
const START_TOKENS = 10;
const SESSION_DAYS = 30;
const PBKDF2_ITERS = 100000;              // Workers' maximum for PBKDF2
const LOGIN_MAX_FAILS = 8;                // per username per 15 minutes
const IP_MAX_FAILS = 30;                  // per IP per 15 minutes
const SIGNUPS_PER_IP_HOUR = 5;
const WINDOW_MS = 15 * 60 * 1000;
// email: reset links last 30 minutes and work once; confirm links last 2 days. Limits are per 15 minutes.
const FRIENDS = { max: 100, inbox: 50 };
const DM = { len: 300, burst: 8, perDay: 300 };   // private messages: longest message, most per 10 seconds, most a day (kept forever)
// the staff chat log is kept forever too
const ROOM_IDS = new Set(["lounge", "barn", "casino", "arena", "lanes", "store"]);
const STAFF_GIVE_DAY = 500;   // most tokens a mod can give out in a day (the owner has no limit)
const AFK_MS = 12 * 60000;   // no moving, chatting or "I'm still here" for this long: no more fishing or bar tips until they're back
const SIPS = 5;                                   // sips or bites in every drink and snack   // friends plus sent requests per llama; requests waiting for one llama
const RESET_MS = 30 * 60 * 1000, VERIFY_MS = 48 * 3600 * 1000;
const FORGOT_PER_IP = 6, FORGOT_PER_EMAIL = 3, RESET_BAD_PER_IP = 10, PW_CHECK_FAILS = 8;

// six slot machines on the casino's back wall with a gap between each, two of each kind; stools are one tile in front (y 1)
// symbols: cherry, lemon, carrot, bell, seven, llama.
//   FRUIT FRENZY: three reels, one line; three of a kind pays pay x the bet (wins about 1 spin in 10, pays back about 89%)
//   LUCKY LINES:  a 3 x 3 grid with 5 lines (3 rows, 2 diagonals); each line of three pays pay x the bet (about 1 in 5, 89%)
//   PRIZE WHEEL:  16 slices; the slice it stops on is the prize x the bet (pays back about 88%, 100x jackpot about 1 in 667)
const SLOT_X = [1, 3, 5, 7, 9, 11];
const SLOTS = {
  fruit:   { w: [40, 30, 15, 8, 5, 2],   pay: [6, 13, 30, 60, 150, 500] },
  classic: { w: [28, 24, 19, 14, 9, 6],  pay: [2, 3, 5, 8, 20, 100] },
};
const SLOT_LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 4, 8], [6, 4, 2]];   // cells are row by row
const WHEEL = { slices: [0, 1, 0, 2, 0, 1, 0, 5, 0, 1, 0, 3, 0, 1, 0, 100], weight: { 0: 6856, 1: 7500, 2: 8000, 3: 4000, 5: 3000, 100: 150 } };
const slotKind = (x) => (x <= 3 ? "fruit" : x <= 7 ? "classic" : "gold");
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
  cider: { rm: "barn", x: 7.5, y: 4, items: { cider: 2, caramel: 3 } },     // two tiles wide: x is the middle of the stall
  snack: { rm: "barn", x: 10.5, y: 4, items: { capple: 2, corn: 2, pie: 3 } },
  bar:   { rm: "lounge", items: { soda: 1, juice: 1, shake: 2, nachos: 2, fries: 2, burger: 3 } },   // sit at the bar to order
  vend:  { rm: "store", x: 5, y: 0.5, items: { soda: 1, juice: 1, shake: 2 } },   // vending machine on the LLAMA STORE's back wall
};
// ---------- hunger and thirst ----------
// Meters go from 100 (full) to 0. They only drain while you're online: thirst empties in about an hour, hunger in 75 minutes.
// Everything you buy fills them right away. When either is empty, the mini-games pay half.
const NEEDS = { thirstMs: 60 * 60000, hungerMs: 75 * 60000, maxStep: 10 * 60000, saveMs: 60000, apple: 15, appleGap: 20000 };
const FOOD = { soda: { th: 30 }, juice: { th: 35, hu: 5 }, shake: { th: 25, hu: 20 }, cider: { th: 40 }, caramel: { th: 40, hu: 8 },
  capple: { hu: 30 }, corn: { hu: 35 }, pie: { hu: 45 }, nachos: { hu: 35, th: -5 }, fries: { hu: 35, th: -5 }, burger: { hu: 55 },
  chips: { hu: 25, th: -3 }, candy: { hu: 20 }, cookie: { hu: 30 } };
// ---------- wardrobe: clothes you buy in the LLAMA STORE and wear anywhere ----------
// s = the slot it goes in (one item per slot), p = price in tokens. The game draws each one; this list is the source of truth.
const WEAR_SLOTS = ["hat", "eyes", "neck", "shirt"];
const ITEMS = {
  cap: { s: "hat", p: 20 }, cowboy: { s: "hat", p: 30 }, beanie: { s: "hat", p: 15 }, party: { s: "hat", p: 10 }, tophat: { s: "hat", p: 40 }, flowers: { s: "hat", p: 25 },
  shades: { s: "eyes", p: 20 }, hearts: { s: "eyes", p: 25 }, stars: { s: "eyes", p: 25 },
  bandana: { s: "neck", p: 12 }, bowtie: { s: "neck", p: 15 }, scarf: { s: "neck", p: 18 }, lei: { s: "neck", p: 15 },
  tee_smile: { s: "shirt", p: 25 }, tee_cancelled: { s: "shirt", p: 25 }, tee_wild: { s: "shirt", p: 25 }, tee_cancel: { s: "shirt", p: 25 }, tee_woke: { s: "shirt", p: 25 },
  tee_lounge: { s: "shirt", p: 25 }, tee_acres: { s: "shirt", p: 25 }, tee_arena: { s: "shirt", p: 25 },
};
// ---------- player rooms ----------
// One room per player. Only the owner can change it. Public rooms are open to everyone; private ones let in the owner,
// people on the owner's invite list, people the owner let in after they knocked (for a few hours), and staff.
const PR = { w: 11, h: 7, maxFurn: 40,   // player rooms: 11 wide, 7 deep (the long wall is the right one; the door is at the front of the left wall)
  clear: ["0,6", "1,6", "2,6", "3,6"], knockGap: 20000, letInMs: 3 * 3600e3, nameMax: 24 };
// wallpaper and flooring for player rooms: price in TOKENS (0 = free for everyone); you buy one once and can use it any time
const DECO_WALL = { lavender: 0, cream: 15, mint: 15, pink: 15, night: 15, wood: 25, stripes: 30, damask: 35, brick: 35, stars: 40, floral: 30 };
const DECO_FLOOR = { wood: 0, checker: 20, carpet: 20, marble: 25, grass: 20, parquet: 30, tiles: 30, cobble: 25, plaid: 25 };
const PR_WALLS = Object.keys(DECO_WALL), PR_FLOORS = Object.keys(DECO_FLOOR);
// furniture you buy in the LLAMA STORE (kept in STORAGE until you place it); prices in tokens
const FURN_ITEMS = { cushion_pink: 5, cushion_teal: 5, cushion_gold: 5, stool: 6, hayseat: 6, log: 5, table: 12, lamp: 12, fern: 6, hay: 4, keg: 8, cabinet: 15, counter: 10, vending: 30, adminsign: 50, chair: 8, armchair: 15, bed: 25, bookshelf: 18, tv: 22, plant: 7, bigtv: 35, loveseat: 22, sofa: 30, snackvend: 30, rug_persian: 25, rug_round: 15, rug_stripe: 12, rug_shag: 18,
  beanbag: 10, barstool: 7, dbed: 40, coffeetable: 14, roundtable: 16, floorlamp: 16, lavalamp: 12, cubeshelf: 14, dresser: 20, cactus: 5, flowers: 6, boombox: 18 };
// what the store sells right now: one piece per category (the rest stay placeable for anyone who already owns them)
// vending machines players can put in their rooms, and what each one sells
const PV_ITEMS = { vending: { soda: 1, juice: 1, shake: 2 }, snackvend: { chips: 1, candy: 1, cookie: 2 } };
const FURN_SWITCH = new Set(["tv", "bigtv", "lamp", "floorlamp", "lavalamp", "boombox"]);   // things you can tap to switch on or off
const FURN_SIZE = { bed: 2, loveseat: 2, sofa: 3, bigtv: 2 };   // pieces bigger than one tile
const FURN_SIDEWAYS = new Set(["loveseat", "sofa"]);
// colour variants: same piece and price as their base, their own item so they're bought, stored and placed separately
const FURN_VARIANTS = { sofa_gray: "sofa", sofa_green: "sofa", sofa_red: "sofa", loveseat_mustard: "loveseat", loveseat_teal: "loveseat", loveseat_purple: "loveseat",
  armchair_mustard: "armchair", armchair_red: "armchair", armchair_gray: "armchair", bed_blue: "bed", bed_green: "bed", bed_purple: "bed", chair_walnut: "chair", chair_white: "chair", chair_red: "chair" };
const furnBase = (item) => FURN_VARIANTS[item] || item;   // couches run along their back, so they turn the other way
const FURN_SALE = new Set(["chair", "armchair", "bed", "table", "lamp", "bookshelf", "tv", "plant", "adminsign", "bigtv", "loveseat", "sofa", "vending", "snackvend", "rug_persian", "rug_round", "rug_stripe", "rug_shag",
  "beanbag", "barstool", "dbed", "coffeetable", "roundtable", "floorlamp", "lavalamp", "cubeshelf", "dresser", "cactus", "flowers", "boombox"]);
for (const [k, b] of Object.entries(FURN_VARIANTS)) { FURN_ITEMS[k] = FURN_ITEMS[b]; FURN_SALE.add(k); }   // variants cost the same as their base
const FURN_STAFF = new Set(["adminsign"]);   // only mods and the owner can buy these
const FURN_WALL = new Set(["adminsign"]);
const FURN_RUG = new Set(["rug_persian", "rug_round", "rug_stripe", "rug_shag"]);   // lie flat on the floor: walk on them, put furniture on top
const FURN_DIM = { dbed: [2, 2], rug_persian: [3, 2], rug_round: [2, 2], rug_stripe: [3, 1], rug_shag: [2, 2] };   // width x depth (swapped when turned)
const layerOf = (item) => (FURN_WALL.has(item) ? "wall" : FURN_RUG.has(item) ? "rug" : "floor");    // hang on a wall: placed on a tile along a wall, don't take up floor space
const prId = (rm) => { const m = /^p:(\d{1,9})$/.exec(String(rm || "")); return m ? +m[1] : 0; };
const cleanRoomName = (n) => String(n || "").replace(/[^A-Za-z0-9 '!?&.,:-]/g, "").replace(/\s+/g, " ").trim().slice(0, PR.nameMax);
const halfIfEmpty = (a, n) => (a && a.nd && (a.nd.hu <= 0 || a.nd.th <= 0)) ? Math.floor(n / 2) : n;

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
const profileOf = (env, u, timers = []) => ({ email: u.email || "", emailOk: !!u.email_ok, mailOn: mailOn(env), name: u.name.toUpperCase(), c: u.c, agreed: u.agreed, bet: u.bet, tk: u.tk, bestHay: u.best_hay, bestDash: u.best_dash, admin: isAdmin(env, u), staff: staffRole(env, u), timers });

// ---------- email ----------
// Sending uses Cloudflare Email Service: a "send_email" binding named EMAIL plus a MAIL_FROM address on a domain
// set up in Cloudflare. Until both exist, accounts still save emails; reset and confirm emails just aren't sent.
const mailOn = (env) => !!(env.EMAIL && env.MAIL_FROM);
const normEmail = (e) => String(e || "").trim().toLowerCase();
const emailOk = (e) => e.length <= 254 && /^[^\s@<>()",;:]{1,64}@[a-z0-9-]+(\.[a-z0-9-]+)*\.[a-z]{2,}$/.test(e);
const siteUrl = (env, url) => (env.APP_URL || url.origin).replace(/\/+$/, "");
async function sendMail(env, to, subject, lines, link, button) {
  if (!mailOn(env)) return false;
  const text = lines.join("\n\n") + (link ? "\n\n" + link : "") + "\n\nLlama Lounge";
  const html = `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#2a2340"><h2 style="color:#d62d6a">🦙 Llama Lounge</h2>${lines.map((l) => `<p>${l.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]))}</p>`).join("")}${link ? `<p><a href="${link}" style="display:inline-block;background:#ffd23f;color:#2a1d00;padding:12px 22px;border-radius:12px;font-weight:bold;text-decoration:none">${button}</a></p><p style="font-size:12px;color:#777">Or paste this link into your browser:<br>${link}</p>` : ""}</div>`;
  try { await env.EMAIL.send({ to, from: { email: env.MAIL_FROM, name: "Llama Lounge" }, subject, text, html }); return true; }
  catch (e) { console.error("mail failed", e && e.code, e && e.message); return false; }
}
// one-time links: only a hash of the token is stored, so a database leak can't be used to reset anyone
async function newLink(env, uid, kind, email, ms) {
  const raw = new Uint8Array(32); crypto.getRandomValues(raw); const tok = b64u(raw);
  await env.DB.prepare("DELETE FROM email_tokens WHERE (uid = ? AND kind = ?) OR expires < ?").bind(uid, kind, Date.now()).run();
  await env.DB.prepare("INSERT INTO email_tokens (hash, uid, kind, email, expires) VALUES (?, ?, ?, ?, ?)").bind(await sha256hex(tok), uid, kind, email, Date.now() + ms).run();
  return tok;
}
async function takeLink(env, tok, kind) {
  if (!/^[A-Za-z0-9_-]{40,50}$/.test(String(tok || ""))) return null;
  const h = await sha256hex(tok);
  const row = await env.DB.prepare("SELECT * FROM email_tokens WHERE hash = ? AND kind = ? AND expires > ?").bind(h, kind, Date.now()).first();
  if (row) await env.DB.prepare("DELETE FROM email_tokens WHERE hash = ?").bind(h).run();   // every link works once
  return row;
}
async function sendVerify(env, url, u, email) {
  const tok = await newLink(env, u.id, "verify", email, VERIFY_MS);
  return sendMail(env, email, "Confirm your Llama Lounge email", [`Hi ${u.name.toUpperCase()}!`, "Tap the button to confirm this is your email. That way you can reset your password if you ever forget it.", "Didn't make a Llama Lounge account? You can ignore this email."], `${siteUrl(env, url)}/#verify=${tok}`, "CONFIRM MY EMAIL");
}
// add the email columns and link table once per server start (safe to run on an existing database)
let authSchema = null;
function ensureAuthSchema(env) {
  if (!authSchema) authSchema = (async () => {
    for (const col of ["email TEXT", "email_ok INTEGER NOT NULL DEFAULT 0"]) {
      try { await env.DB.prepare("ALTER TABLE users ADD COLUMN " + col).run(); } catch (e) { if (!/duplicate column/i.test(String(e && e.message || e))) throw e; }
    }
    await env.DB.prepare("CREATE UNIQUE INDEX IF NOT EXISTS users_email ON users (email)").run();
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS email_tokens (hash TEXT PRIMARY KEY, uid INTEGER NOT NULL, kind TEXT NOT NULL, email TEXT NOT NULL, expires INTEGER NOT NULL)").run();
  })().catch((e) => { authSchema = null; throw e; });
  return authSchema;
}
async function setPassword(env, uid, pw) {
  const salt = new Uint8Array(16); crypto.getRandomValues(salt); const h = await pbkdf2(pw, salt, PBKDF2_ITERS);
  await env.DB.prepare("UPDATE users SET salt = ?, hash = ?, iters = ? WHERE id = ?").bind(b64(salt), b64(h), PBKDF2_ITERS, uid).run();
  await env.DB.prepare("DELETE FROM sessions WHERE uid = ?").bind(uid).run();   // sign out everywhere
}
async function checkPassword(u, pw) { const h = await pbkdf2(pw, unb64(u.salt), u.iters); return sameBytes(h, unb64(u.hash)); }

// same-origin check for anything that changes state
function originOk(req, url) { const o = req.headers.get("origin"); return !o || o === url.origin; }

// ---------- HTTP entry ----------
export default {
  async fetch(req, env, ctx) {
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
      try { await ensureAuthSchema(env); return await api(req, env, url, ctx); } catch (e) { console.error(e); return json({ error: "server error" }, 500); }
    }
    return env.ASSETS ? env.ASSETS.fetch(req) : new Response("not found", { status: 404 });
  },
};

async function api(req, env, url, ctx) {
  const later = (p) => (ctx && ctx.waitUntil ? ctx.waitUntil(p) : p);
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
    const name = String(body.u || "").trim(), pw = String(body.p || ""), email = normEmail(body.e);
    if (!/^[A-Za-z0-9_]{3,12}$/.test(name)) return json({ error: "Names are 3 to 12 letters, numbers or _." }, 400);
    if (!emailOk(email)) return json({ error: "Enter a real email. It's how you reset your password." }, 400);
    if (pw.length < 8 || pw.length > 72) return json({ error: "Passwords need 8 to 72 characters." }, 400);
    if (await blocked(env, "su:" + ip, SIGNUPS_PER_IP_HOUR)) return json({ error: "Too many new accounts from here. Try again later." }, 429);
    const salt = new Uint8Array(16); crypto.getRandomValues(salt);
    const hash = await pbkdf2(pw, salt, PBKDF2_ITERS);
    try {
      const r = await env.DB.prepare("INSERT INTO users (name, salt, hash, iters, created, tk, email) VALUES (?, ?, ?, ?, ?, ?, ?)").bind(name, b64(salt), b64(hash), PBKDF2_ITERS, Date.now(), START_TOKENS, email).run();
      await bump(env, "su:" + ip);
      const tok = await newSession(env, r.meta.last_row_id);
      const u = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(r.meta.last_row_id).first();
      later(sendVerify(env, url, u, email));
      return json(profileOf(env, u), 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
    } catch (e) {
      if (String(e).includes("UNIQUE")) return json({ error: String(e).includes("email") ? "That email already has an account. Log in, or use FORGOT PASSWORD." : "That name is taken." }, 409);
      throw e;
    }
  }
  if (path === "/api/login") {
    const name = String(body.u || "").trim(), pw = String(body.p || "");   // a llama name or an email
    const uk = "u:" + name.toLowerCase(), ik = "ip:" + ip;
    if (await blocked(env, uk, LOGIN_MAX_FAILS) || await blocked(env, ik, IP_MAX_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    const u = name.includes("@") ? (emailOk(normEmail(name)) ? await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(normEmail(name)).first() : null)
      : /^[A-Za-z0-9_]{3,12}$/.test(name) ? await env.DB.prepare("SELECT * FROM users WHERE name = ?").bind(name).first() : null;
    // always run the hash so a wrong name and a wrong password take the same time
    const salt = u ? unb64(u.salt) : new Uint8Array(16);
    const h = await pbkdf2(pw, salt, u ? u.iters : PBKDF2_ITERS);
    if (!u || !sameBytes(h, unb64(u.hash))) { await bump(env, uk); await bump(env, ik); return json({ error: "Wrong name, email or password." }, 401); }
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
    if (await blocked(env, "pw:" + u.id, PW_CHECK_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    if (!(await checkPassword(u, oldp))) { await bump(env, "pw:" + u.id); return json({ error: "Current password is wrong." }, 401); }
    await setPassword(env, u.id, np);
    if (u.email) later(sendMail(env, u.email, "Your Llama Lounge password was changed", [`Hi ${u.name.toUpperCase()}, your password was just changed and every other device was logged out.`, "If this wasn't you, use FORGOT PASSWORD on the login screen right away."]));
    const tok = await newSession(env, u.id);
    return json({ ok: true }, 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
  }
  // add or change the account email (needs the current password, so a stolen session can't redirect resets)
  if (path === "/api/email") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    const email = normEmail(body.e), pw = String(body.p || "");
    if (!emailOk(email)) return json({ error: "That doesn't look like an email." }, 400);
    if (await blocked(env, "pw:" + u.id, PW_CHECK_FAILS)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    if (!(await checkPassword(u, pw))) { await bump(env, "pw:" + u.id); return json({ error: "Password is wrong." }, 401); }
    if (email === u.email) return json({ error: "That's already your email." }, 400);
    try { await env.DB.prepare("UPDATE users SET email = ?, email_ok = 0 WHERE id = ?").bind(email, u.id).run(); }
    catch (e) { if (String(e).includes("UNIQUE")) return json({ error: "That email is on another account." }, 409); throw e; }
    await env.DB.prepare("DELETE FROM email_tokens WHERE uid = ? AND kind = 'reset'").bind(u.id).run();   // old reset links stop working
    later(sendVerify(env, url, u, email));
    if (u.email) later(sendMail(env, u.email, "Your Llama Lounge email was changed", [`Hi ${u.name.toUpperCase()}, the email on your account was changed to ${email}.`, "If this wasn't you, reply to a staff member in the game right away."]));
    const nu = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(u.id).first();
    return json({ ok: true, ...profileOf(env, nu) });
  }
  if (path === "/api/verify/resend") {
    const u = await sessionUser(env, req); if (!u) return json({ error: "not logged in" }, 401);
    if (!u.email || u.email_ok) return json({ ok: true });
    if (await blocked(env, "vr:" + u.id, 3)) return json({ error: "We just sent one. Check your inbox and spam folder." }, 429);
    await bump(env, "vr:" + u.id);
    return json({ ok: true, sent: await sendVerify(env, url, u, u.email) });
  }
  if (path === "/api/verify") {
    if (await blocked(env, "rs:" + ip, RESET_BAD_PER_IP)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    const row = await takeLink(env, body.t, "verify");
    if (!row) { await bump(env, "rs:" + ip); return json({ error: "This confirm link expired or was already used." }, 400); }
    const r = await env.DB.prepare("UPDATE users SET email_ok = 1 WHERE id = ? AND email = ?").bind(row.uid, row.email).run();
    if (!r.meta.changes) return json({ error: "This link is for an email that's no longer on the account." }, 400);
    return json({ ok: true });
  }
  // forgot password: the answer is always the same, so nobody can use it to find out which emails have accounts
  if (path === "/api/forgot") {
    const email = normEmail(body.e);
    if (!emailOk(email)) return json({ error: "Enter the email on your account." }, 400);
    if (await blocked(env, "fg:" + ip, FORGOT_PER_IP) || await blocked(env, "fe:" + email, FORGOT_PER_EMAIL)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    await bump(env, "fg:" + ip); await bump(env, "fe:" + email);
    const u = await env.DB.prepare("SELECT * FROM users WHERE email = ? AND banned = 0").bind(email).first();
    if (u) {
      const tok = await newLink(env, u.id, "reset", email, RESET_MS), link = `${siteUrl(env, url)}/#reset=${tok}`;
      if (!mailOn(env) && ["localhost", "127.0.0.1"].includes(url.hostname)) console.log("[dev] reset link for " + u.name + ": " + link);
      later(sendMail(env, email, "Reset your Llama Lounge password", [`Hi ${u.name.toUpperCase()}!`, "Someone asked to reset your password. Tap the button to pick a new one. The link works once and expires in 30 minutes.", "Didn't ask for this? Ignore this email and your password stays the same."], link, "RESET MY PASSWORD"));
    }
    return json({ ok: true, mailOn: mailOn(env) });
  }
  if (path === "/api/reset") {
    if (await blocked(env, "rs:" + ip, RESET_BAD_PER_IP)) return json({ error: "Too many tries. Wait 15 minutes and try again." }, 429);
    const np = String(body.p || "");
    if (np.length < 8 || np.length > 72) return json({ error: "Passwords need 8 to 72 characters." }, 400);
    const row = await takeLink(env, body.t, "reset");
    if (!row) { await bump(env, "rs:" + ip); return json({ error: "This reset link expired or was already used. Ask for a new one." }, 400); }
    const u = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(row.uid).first();
    if (!u || u.email !== row.email) return json({ error: "This reset link is no longer valid. Ask for a new one." }, 400);
    if (u.banned) return json({ error: "This account is banned." }, 403);
    await setPassword(env, u.id, np);   // also signs out every device
    await env.DB.prepare("UPDATE users SET email_ok = 1 WHERE id = ?").bind(u.id).run();   // opening the email proves it's theirs
    await env.DB.prepare("DELETE FROM email_tokens WHERE uid = ? AND kind = 'reset'").bind(u.id).run();
    await env.DB.prepare("DELETE FROM login_attempts WHERE k = ?").bind("u:" + u.name.toLowerCase()).run();
    later(sendMail(env, u.email, "Your Llama Lounge password was reset", [`Hi ${u.name.toUpperCase()}, your password was just reset and every other device was logged out.`, "If this wasn't you, reset it again right away and tell a staff member."]));
    const tok = await newSession(env, u.id);
    const nu = await env.DB.prepare("SELECT * FROM users WHERE id = ?").bind(u.id).first();
    return json(profileOf(env, nu), 200, { "set-cookie": sessCookie(tok, SESSION_DAYS * 86400) });
  }
  return json({ error: "not found" }, 404);
}

// ---------- spit arena ----------
// 60-second rounds. Everyone who presses PLAY during the countdown (or early in a round) shares the round.
// The server keeps the round clock, relays live moves between the players in it, and pays tokens.
const ARENA = {
  countdown: 4000, dur: 60000, lateJoin: 25000,            // you can still hop into a round with 25s or more left
  maxRate: 12,                                             // points a second nobody can beat (combo x5, frenzy x2)
  dayCap: 40,                                              // most arena tokens a llama can earn in one day
  colors: [["blue", 1], ["green", 2], ["pink", 4], ["gold", 6], ["rainbow", 8], ["fire", 10]],   // spit colours and the level that unlocks each
};
const arenaLevel = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
const etDay = (t) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date(t));   // 2026-11-19, Eric's time zone
function etWeek(t) { const d = new Date(etDay(t) + "T12:00:00Z"); const wd = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - wd); return d.toISOString().slice(0, 10); }   // Monday of the week
const unlocked = (lvl) => ARENA.colors.filter(([, l]) => lvl >= l).map(([c]) => c);

// BOWL-PHYSICS-START (generated from tools/bowl_physics.js by tools/sync_bowl.py; edit that file, not this copy)
// ---- BOWLING PHYSICS (shared: the server runs this exact code to decide which pins fall) ----
// Units are inches and seconds. Only + - * / and Math.sqrt are used, so every browser and the server get the same answer.
const BOWL = { HW: 20.75, BR: 4.3, PR: 2.4, HEAD: 720, WALL: 27, PIT: 772, DT: 1 / 480, MB: 4.3,
  MINX: -16, MAXX: 16, MINV: 230, MAXV: 330, MAXANG: 0.035, HOOK: 16 };
function bowlPins() { const p = []; for (let r = 0; r < 4; r++) for (let j = 0; j <= r; j++) p.push([(j - r / 2) * 12, BOWL.HEAD + r * 10.392]); return p; }
// clean up a throw so it is inside the rules (the server does this too)
function bowlClamp(s) {
  const n = (v, lo, hi) => Math.max(lo, Math.min(hi, Number.isFinite(+v) ? +v : 0));
  const vy = Math.round(n(s.vy, BOWL.MINV, BOWL.MAXV) * 1000) / 1000;
  const vx = Math.round(n(s.vx, -vy * BOWL.MAXANG, vy * BOWL.MAXANG) * 1000) / 1000;
  return { x: Math.round(n(s.x, BOWL.MINX, BOWL.MAXX) * 1000) / 1000, vx, vy, spin: Math.round(n(s.spin, -1, 1) * 1000) / 1000 };
}
// standing: 10 flags (1 = pin is up). rec: optional array that gets a snapshot every 4 steps for the animation.
function bowlSim(start, standing, rec) {
  const B = BOWL, dt = B.DT, home = bowlPins();
  const ball = { x: start.x, y: 0, vx: start.vx, vy: start.vy, gut: false };
  const pins = [];
  for (let i = 0; i < 10; i++) if (standing[i]) pins.push({ i, x: home[i][0], y: home[i][1], vx: 0, vy: 0, hit: false, pit: false });
  const R1 = B.BR + B.PR, R2 = B.PR * 2;
  let still = 0, steps = 0;
  for (; steps < 480 * 8; steps++) {
    // the ball: straight on the oily front, hooks on the dry back end, drops in the gutter if it rolls off the lane
    if (ball.y > 280 && ball.y < B.HEAD - 10 && !ball.gut) ball.vx += start.spin * B.HOOK * dt;
    ball.x += ball.vx * dt; ball.y += ball.vy * dt;
    if (!ball.gut && ball.y < B.HEAD - 14 && (ball.x > B.HW || ball.x < -B.HW)) { ball.gut = true; ball.vx = 0; ball.x = ball.x > 0 ? B.HW + 4.5 : -B.HW - 4.5; }
    if (ball.y > B.PIT + 30) { ball.vx = 0; ball.vy = 0; }
    // ball hits pins
    if (!ball.gut) for (const p of pins) {
      if (p.pit) continue; const dx = p.x - ball.x, dy = p.y - ball.y, d2 = dx * dx + dy * dy;
      if (d2 < R1 * R1) { const d = Math.sqrt(d2) || 0.0001, nx = dx / d, ny = dy / d;
        const rv = (ball.vx - p.vx) * nx + (ball.vy - p.vy) * ny;
        if (rv > 0) { const j = 1.55 * rv / (1 / B.MB + 1); ball.vx -= j / B.MB * nx; ball.vy -= j / B.MB * ny; p.vx += j * nx; p.vy += j * ny; p.hit = true; }
        const o = R1 - d; p.x += nx * o; p.y += ny * o; }
    }
    // pins hit each other (a flying pin knocks over a standing one)
    for (let a = 0; a < pins.length; a++) { const p = pins[a]; if (p.pit) continue;
      for (let b = a + 1; b < pins.length; b++) { const q = pins[b]; if (q.pit) continue;
        const dx = q.x - p.x, dy = q.y - p.y, d2 = dx * dx + dy * dy;
        if (d2 < R2 * R2) { const d = Math.sqrt(d2) || 0.0001, nx = dx / d, ny = dy / d;
          const rv = (p.vx - q.vx) * nx + (p.vy - q.vy) * ny;
          if (rv > 0) { const j = 1.8 * rv / 2; p.vx -= j * nx; p.vy -= j * ny; q.vx += j * nx; q.vy += j * ny; if (j > 5) { p.hit = true; q.hit = true; } }
          const o = (R2 - d) / 2; p.x -= nx * o; p.y -= ny * o; q.x += nx * o; q.y += ny * o; }
      } }
    // pins slide, bounce off the side walls, and drop into the pit
    let moving = ball.vy > 0 && ball.y < B.PIT + 30 ? 1 : 0;
    for (const p of pins) { if (p.pit) continue;
      p.x += p.vx * dt; p.y += p.vy * dt; const f = 1 - 2.2 * dt; p.vx *= f; p.vy *= f;
      if (p.x > B.WALL) { p.x = B.WALL; p.vx = -p.vx * 0.55; } if (p.x < -B.WALL) { p.x = -B.WALL; p.vx = -p.vx * 0.55; }
      if (p.y < B.HEAD - 40) { p.y = B.HEAD - 40; p.vy = -p.vy * 0.3; }
      if (p.y > B.PIT) { p.pit = true; p.hit = true; p.vx = 0; p.vy = 0; }
      if (p.vx * p.vx + p.vy * p.vy > 4) moving = 1; }
    if (rec && steps % 4 === 0) rec.push([Math.round(ball.x * 100) / 100, Math.round(ball.y * 100) / 100, ball.gut ? 1 : 0, pins.map((p) => [p.i, Math.round(p.x * 100) / 100, Math.round(p.y * 100) / 100, p.hit ? 1 : 0, p.pit ? 1 : 0])]);
    still = moving ? 0 : still + 1;
    if (still > 120 && ball.y > B.HEAD) break;
  }
  const home2 = bowlPins();
  const down = pins.filter((p) => p.hit || (p.x - home2[p.i][0]) * (p.x - home2[p.i][0]) + (p.y - home2[p.i][1]) * (p.y - home2[p.i][1]) > 6.25).map((p) => p.i);
  return { down, gutter: ball.gut, steps };
}
// ---- 5-frame scoring (the last frame gets bonus balls after a strike or spare) ----
const BOWL_FRAMES = 5;
function bowlScore(rolls) {
  const frames = []; let i = 0, total = 0;
  for (let f = 0; f < BOWL_FRAMES; f++) {
    const last = f === BOWL_FRAMES - 1, a = rolls[i], b = rolls[i + 1], c = rolls[i + 2];
    if (a === undefined) { frames.push({ marks: [], score: null }); continue; }
    if (!last) {
      if (a === 10) { const ok = b !== undefined && c !== undefined; if (ok) total += 10 + b + c; frames.push({ marks: ['X'], score: ok ? total : null }); i += 1; continue; }
      if (b === undefined) { frames.push({ marks: [mk(a)], score: null }); i += 1; continue; }
      if (a + b === 10) { const ok = c !== undefined; if (ok) total += 10 + c; frames.push({ marks: [mk(a), '/'], score: ok ? total : null }); i += 2; continue; }
      total += a + b; frames.push({ marks: [mk(a), mk(b)], score: total }); i += 2; continue;
    }
    // last frame: up to three balls
    const m = [a === 10 ? 'X' : mk(a)];
    if (b !== undefined) m.push(a === 10 ? (b === 10 ? 'X' : mk(b)) : (a + b === 10 ? '/' : mk(b)));
    if (c !== undefined) m.push(a === 10 && b !== 10 ? (b + c === 10 ? '/' : mk(c)) : (c === 10 ? 'X' : mk(c)));
    const needs = (a === 10 || (b !== undefined && a + b === 10)) ? 3 : 2;
    const have = [a, b, c].filter((v) => v !== undefined).length;
    if (have >= needs) total += a + (b || 0) + (needs === 3 ? (c || 0) : 0);
    frames.push({ marks: m, score: have >= needs ? total : null }); i += have;
  }
  return { frames, total };
  function mk(v) { return v === 0 ? '-' : String(v); }
}
// where the game is: which frame, which ball, which pins are standing, and whether it's over
function bowlState(rolls) {
  let i = 0, standing = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  for (let f = 0; f < BOWL_FRAMES; f++) {
    const last = f === BOWL_FRAMES - 1;
    if (!last) {
      if (rolls[i] === undefined) return { frame: f, ball: 0, done: false };
      if (rolls[i] === 10) { i += 1; continue; }
      if (rolls[i + 1] === undefined) return { frame: f, ball: 1, done: false };
      i += 2; continue;
    }
    const a = rolls[i], b = rolls[i + 1], c = rolls[i + 2];
    if (a === undefined) return { frame: f, ball: 0, done: false };
    if (b === undefined) return { frame: f, ball: 1, done: false, fresh: a === 10 };
    const extra = a === 10 || a + b === 10;
    if (!extra) return { frame: f, ball: 2, done: true };
    if (c === undefined) return { frame: f, ball: 2, done: false, fresh: (a === 10 && b === 10) || (a !== 10 && a + b === 10) };
    return { frame: f, ball: 3, done: true };
  }
  return { frame: BOWL_FRAMES, ball: 0, done: true };
}
// BOWL-PHYSICS-END

// ---------- dunk tank (Llama Acres) ----------
// A throw costs 1 coin; a bullseye dunks whoever is on the seat and pays 3. Whoever volunteers on the seat earns 1 per dunk.
const DUNK = { seat: [3, 6], target: [3, 8], cost: 1, prize: 3, sitPay: 1, gap: 2500, winCap: 30, sitCap: 15 };

// ---------- hay bale bowling ----------
// The server keeps each player's game, runs the same physics as the page to decide pinfall, and pays coins at the end.
const LANES = { minGap: 2200, dayCap: 40, expire: 30 * 60000 };

// ---------- realtime room ----------
const PRES_KEYS = new Set(["bj", "c", "n", "x", "y", "d", "p", "m", "s", "h", "hl", "sk", "e", "a", "sp", "td", "g", "fk", "rm", "fs", "sl", "j", "l", "ea"]);
function cleanPresence(p, name, tk, muted, staff) {
  const o = {};
  if (!p || typeof p !== "object") return o;
  for (const k of Object.keys(p)) if (PRES_KEYS.has(k)) o[k] = p[k];
  o.n = name; o.tk = tk; if (staff) o.st = staff; else delete o.st;   // the server decides who you are, what you hold and your staff badge
  if (o.s && typeof o.s === "object") { o.s = { k: +o.s.k || 0, t: String(o.s.t || "").slice(0, 120), y: o.s.y ? 1 : 0, f: o.s.f ? 1 : 0 }; if (muted) delete o.s; }
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
    const nd = await this.needsLoad(uid);
    const wear = await this.wearLoad(uid);
    server.serializeAttachment({ uid, name, staff, peer, pres: null, rate: [Date.now(), 0], nd, wear, act: Date.now() });
    // greet with everyone already here, the leaderboard and table states
    const peers = this.sockets().filter((w) => w !== server && w.readyState === 1).map((w) => w.deserializeAttachment()).filter((a) => a && a.pres && a.uid !== uid).map((a) => ({ peer: a.peer, presence: (prId(a.pres.rm) && (!this.prPriv || this.prPriv.get(prId(a.pres.rm)) !== false)) ? { ...a.pres, s: undefined, e: undefined } : a.pres }));   // never show what's said in a private room
    server.send(JSON.stringify({ t: "hello", v: VERSION, peer, peers, board: await this.board(), nd: { hu: nd.hu, th: nd.th, rate: { hu: 100 / NEEDS.hungerMs, th: 100 / NEEDS.thirstMs } } }));
    return new Response(null, { status: 101, webSocket: client });
  }

  sockets() { return this.ctx.getWebSockets(); }
  // presence goes to everyone, but what's said inside a private player room only reaches the people in it
  peersOut(ws, a, kind) {
    const full = JSON.stringify({ t: "peers", [kind]: [{ peer: a.peer, presence: a.pres }] });
    const id = prId(a.pres && a.pres.rm);
    if (!id || !(this.prPriv && this.prPriv.get(id))) { for (const w of this.sockets()) if (w !== ws) { try { w.send(full); } catch (e) {} } return; }
    const lite = JSON.stringify({ t: "peers", [kind]: [{ peer: a.peer, presence: { ...a.pres, s: undefined, e: undefined } }] });
    for (const w of this.sockets()) { if (w === ws) continue; const x = w.deserializeAttachment(); try { w.send(x && x.pres && x.pres.rm === a.pres.rm ? full : lite); } catch (e) {} }
  }
  send(ws, obj) { try { ws.send(JSON.stringify(obj)); } catch (e) {} }
  broadcast(obj, except) { const s = JSON.stringify(obj); for (const w of this.sockets()) if (w !== except) { try { w.send(s); } catch (e) {} } }

  async webSocketMessage(ws, raw) {
    const a = ws.deserializeAttachment(); if (!a) return;
    // simple flood control: 40 messages a second per connection
    const now = Date.now(); if (now - a.rate[0] > 1000) a.rate = [now, 0]; a.rate[1]++; if (a.rate[1] > 40) { ws.serializeAttachment(a); return; }
    let m; try { m = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw)); } catch (e) { return; }
    if (!m || typeof m !== "object") return;

    if (a.nd) await this.needsTick(ws, a, now);
    if (m.t === "p") {
      // balance / mute / ban are cached for a few seconds so moving around doesn't hit the database every step
      if (!a.uc || now - a.uc.t > 5000){ const u = await this.user(a.uid); if (!u || u.banned) { ws.close(4003, "banned"); return; } a.uc = { t: now, tk: u.tk, muted: u.muted, c: u.c || null }; a.staff = staffRole(this.env, u); }
      const first = !a.pres;
      if (m.p && prId(m.p.rm) && prId(m.p.rm) !== a.proom) return;   // you have to be let in (pr_enter) before you can be in a player room
      // anything a person does (walking, changing rooms, chatting) counts as being here
      if (m.p && (first || +m.p.x !== a.pres.x || +m.p.y !== a.pres.y || m.p.rm !== a.pres.rm || (m.p.s && typeof m.p.s === "object" && +m.p.s.k !== a.ck))) a.act = now;
      // chat log for staff: every new line, muted ones too (marked); action lines like "sat down" are marked as actions
      const rs = m.p && m.p.s;
      if (rs && typeof rs === "object" && rs.t && +rs.k !== a.ck) { const was = a.ck; a.ck = +rs.k; if (!first && was !== undefined) await this.chatLog(a, m.p.rm, (rs.f ? "* " : "") + String(rs.t).slice(0, 120), !!a.uc.muted); }
      else if (first && rs && typeof rs === "object") a.ck = +rs.k;
      if (first && a.ck === undefined) a.ck = 0;
      const prevSit = a.pres && a.pres.p === "sit" ? a.pres.rm + ":" + Math.floor(a.pres.x) + "," + Math.floor(a.pres.y) : null;
      a.pres = cleanPresence(m.p, a.name, a.uc.tk, !!a.uc.muted, a.staff); if (a.uc.c) a.pres.c = a.uc.c;   // everyone sees the llama the account picked
      // one llama per seat: whoever sat down first keeps it
      if (a.pres.p === "sit" && Number.isFinite(a.pres.x) && Number.isFinite(a.pres.y)) { const key = a.pres.rm + ":" + Math.floor(a.pres.x) + "," + Math.floor(a.pres.y);
        if (key !== prevSit) for (const w2 of this.sockets()) { if (w2 === ws) continue; const x = w2.deserializeAttachment(); const q = x && x.pres;
          if (q && q.p === "sit" && q.rm === a.pres.rm && Math.floor(q.x) === Math.floor(a.pres.x) && Math.floor(q.y) === Math.floor(a.pres.y)) { a.pres.p = "stand"; this.send(ws, { t: "seattaken" }); break; } } }
      if (a.wear && Object.keys(a.wear).length) a.pres.w = a.wear;   // and the clothes it owns and has on
      ws.serializeAttachment(a);
      { const pid = prId(a.pres.rm); if (pid && !(this.prPriv && this.prPriv.has(pid))) await this.prRoom(pid); }   // know if it's private before sending anything
      this.peersOut(ws, a, first ? "joined" : "updated");
      return;
    }
    if (m.t === "ar") { this.arenaRelay(ws, a, m, now); return; }
    if (m.t === "act") {
      let res;
      try { res = await this.act(ws, a, String(m.a || ""), m); } catch (e) { console.error(e); res = { ok: false, msg: "Server hiccup, try again." }; }
      if (res && Number.isFinite(res.tk)) { const a2 = ws.deserializeAttachment(); if (a2) { a2.uc = { ...(a2.uc || {}), t: Date.now(), tk: res.tk, muted: a2.uc ? a2.uc.muted : 0 }; ws.serializeAttachment(a2); } }
      this.send(ws, { t: "res", id: m.id, ...res });
    }
  }

  async webSocketClose(ws) { this.left(ws); try { const a = ws.deserializeAttachment(); if (a && a.nd) { this.needsDrain(a, Date.now()); await this.needsSave(a); } } catch (e) {} }
  async webSocketError(ws) { this.left(ws); }
  left(ws) { const a = ws.deserializeAttachment(); if (a && a.pres) this.broadcast({ t: "peers", left: [{ peer: a.peer }] }, ws); }

  // ---------- player rooms ----------
  async prTables() { if (this.prReady) return;
    for (const q of ["CREATE TABLE IF NOT EXISTS prooms (id INTEGER PRIMARY KEY AUTOINCREMENT, owner INTEGER NOT NULL UNIQUE, name TEXT NOT NULL, priv INTEGER NOT NULL DEFAULT 0, wall TEXT NOT NULL DEFAULT 'lavender', floor TEXT NOT NULL DEFAULT 'wood', t INTEGER NOT NULL)",
      "CREATE TABLE IF NOT EXISTS pinv (room INTEGER NOT NULL, uid INTEGER NOT NULL, PRIMARY KEY (room, uid))",
      "CREATE TABLE IF NOT EXISTS pfurn (id INTEGER PRIMARY KEY AUTOINCREMENT, room INTEGER NOT NULL, item TEXT NOT NULL, gx INTEGER NOT NULL, gy INTEGER NOT NULL, rot INTEGER NOT NULL DEFAULT 0)",
      "CREATE INDEX IF NOT EXISTS pfurn_room ON pfurn (room)",
      "CREATE TABLE IF NOT EXISTS finv (uid INTEGER NOT NULL, item TEXT NOT NULL, n INTEGER NOT NULL, PRIMARY KEY (uid, item))",
      "CREATE TABLE IF NOT EXISTS deco (uid INTEGER NOT NULL, k TEXT NOT NULL, PRIMARY KEY (uid, k))"]) await this.env.DB.prepare(q).run();
    try { await this.env.DB.prepare("ALTER TABLE pfurn ADD COLUMN off INTEGER NOT NULL DEFAULT 0").run(); } catch (e) {}   // TVs and lamps can be switched off (already there after the first time)
    this.prReady = true; this.prPriv = this.prPriv || new Map(); this.letIn = this.letIn || new Map(); this.knocks = this.knocks || new Map(); }
  async prRoom(id) { await this.prTables(); const r = await this.env.DB.prepare("SELECT r.*, u.name AS oname FROM prooms r JOIN users u ON u.id = r.owner WHERE r.id = ?").bind(id).first(); if (r) this.prPriv.set(r.id, !!r.priv); return r; }
  async prCanEnter(a, r) {
    if (!r) return false; if (r.owner === a.uid || !r.priv) return true;
    if (a.staff === "owner" || a.staff === "mod") return true;
    const li = this.letIn.get(r.id); if (li && (li.get(a.uid) || 0) > Date.now()) return true;
    return !!(await this.env.DB.prepare("SELECT 1 FROM pinv WHERE room = ? AND uid = ?").bind(r.id, a.uid).first());
  }
  prOut(r) { return { id: r.id, name: r.name, owner: r.oname.toUpperCase(), priv: !!r.priv, wall: r.wall, floor: r.floor }; }
  prCount(id) { const rm = "p:" + id, seen = new Set(); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === rm) seen.add(x.uid); } return seen.size; }
  toRoom(rm, obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === rm) { try { w.send(s); } catch (e) {} } } }
  async prFurn(id) { return ((await this.env.DB.prepare("SELECT id, item, gx, gy, rot, off FROM pfurn WHERE room = ? ORDER BY id").bind(id).all()).results || []).filter((f) => FURN_ITEMS[f.item]); }
  async prList(a) {
    await this.prTables(); await this.frTable();
    const mine = await this.env.DB.prepare("SELECT r.*, u.name AS oname FROM prooms r JOIN users u ON u.id = r.owner WHERE r.owner = ?").bind(a.uid).first();
    const rows = (await this.env.DB.prepare(`SELECT r.*, u.name AS oname,
        EXISTS(SELECT 1 FROM friends f WHERE f.st = 'ok' AND ((f.a = ? AND f.b = r.owner) OR (f.b = ? AND f.a = r.owner))) AS fr,
        EXISTS(SELECT 1 FROM pinv i WHERE i.room = r.id AND i.uid = ?) AS inv
      FROM prooms r JOIN users u ON u.id = r.owner WHERE u.banned = 0 AND r.owner != ? ORDER BY r.t DESC LIMIT 200`).bind(a.uid, a.uid, a.uid, a.uid).all()).results || [];
    const out = [];
    for (const r of rows) { this.prPriv.set(r.id, !!r.priv); const n = this.prCount(r.id); if (!r.fr && !r.inv && r.priv && !n) continue;   // strangers' private rooms only show while someone's in them
      const li = this.letIn.get(r.id); const can = !r.priv || !!r.inv || (li && (li.get(a.uid) || 0) > Date.now()) || a.staff === "owner" || a.staff === "mod";
      out.push({ ...this.prOut(r), n, friend: !!r.fr, invited: !!r.inv, can: !!can }); }
    out.sort((x, y) => (y.friend - x.friend) || (y.n - x.n));
    return { ok: true, mine: mine ? { ...this.prOut(mine), n: this.prCount(mine.id) } : null, rooms: out.slice(0, 60), staff: a.staff === "owner" || a.staff === "mod" };
  }
  // search rooms by room name or owner name (private rooms show up too, with a lock, so people can knock)
  async prSearch(a, m) {
    await this.prTables(); await this.frTable();
    const q = String(m.q || "").replace(/[^A-Za-z0-9 '!?&.,:_-]/g, "").trim().slice(0, 24); if (q.length < 2) return { ok: true, rooms: [] };
    const like = "%" + q.replace(/[%_]/g, "") + "%";
    const rows = (await this.env.DB.prepare(`SELECT r.*, u.name AS oname,
        EXISTS(SELECT 1 FROM friends f WHERE f.st = 'ok' AND ((f.a = ? AND f.b = r.owner) OR (f.b = ? AND f.a = r.owner))) AS fr,
        EXISTS(SELECT 1 FROM pinv i WHERE i.room = r.id AND i.uid = ?) AS inv
      FROM prooms r JOIN users u ON u.id = r.owner WHERE u.banned = 0 AND (r.name LIKE ? OR u.name LIKE ?) ORDER BY r.t DESC LIMIT 30`).bind(a.uid, a.uid, a.uid, like, like).all()).results || [];
    const out = rows.map((r) => { this.prPriv.set(r.id, !!r.priv); const li = this.letIn.get(r.id);
      const can = r.owner === a.uid || !r.priv || !!r.inv || (li && (li.get(a.uid) || 0) > Date.now()) || a.staff === "owner" || a.staff === "mod";
      return { ...this.prOut(r), n: this.prCount(r.id), friend: !!r.fr, invited: !!r.inv, can: !!can, mine: r.owner === a.uid }; });
    return { ok: true, rooms: out };
  }
  async prCreate(a, m) {
    await this.prTables();
    const have = await this.env.DB.prepare("SELECT id FROM prooms WHERE owner = ?").bind(a.uid).first(); if (have) return { ok: false, msg: "You already have a room. One per llama for now." };
    const name = cleanRoomName(m.name) || (a.name + "'S ROOM").slice(0, PR.nameMax);
    try { await this.env.DB.prepare("INSERT INTO prooms (owner, name, priv, wall, floor, t) VALUES (?, ?, 0, 'lavender', 'wood', ?)").bind(a.uid, name, Date.now()).run(); }
    catch (e) { if (String(e).includes("UNIQUE")) return { ok: false, msg: "You already have a room." }; throw e; }
    return this.prList(a);
  }
  async prMine(a) { await this.prTables(); const r = await this.env.DB.prepare("SELECT r.*, u.name AS oname FROM prooms r JOIN users u ON u.id = r.owner WHERE r.owner = ?").bind(a.uid).first(); if (r) this.prPriv.set(r.id, !!r.priv); return r; }
  async prInfo(a) { const r = await this.prMine(a); if (!r) return { ok: false, msg: "You don't have a room yet." };
    const inv = ((await this.env.DB.prepare("SELECT u.name FROM pinv i JOIN users u ON u.id = i.uid WHERE i.room = ? ORDER BY u.name").bind(r.id).all()).results || []).map((x) => x.name.toUpperCase());
    return { ok: true, room: this.prOut(r), invites: inv }; }
  async prSet(a, m) {
    const r = await this.prMine(a); if (!r) return { ok: false, msg: "You don't have a room yet." };
    const name = m.name !== undefined ? cleanRoomName(m.name) : r.name; if (!name) return { ok: false, msg: "Give your room a name." };
    const priv = m.priv !== undefined ? (m.priv ? 1 : 0) : r.priv, wall = PR_WALLS.includes(m.wall) ? m.wall : r.wall, floor = PR_FLOORS.includes(m.floor) ? m.floor : r.floor;
    // a wallpaper or floor you haven't bought can't be put up (free ones, and whatever the room already has, are fine)
    const own = await this.decoOwned(a.uid);
    if (wall !== r.wall && DECO_WALL[wall] && !own.includes("w:" + wall)) return { ok: false, msg: "Buy that wallpaper at the LLAMA STORE first." };
    if (floor !== r.floor && DECO_FLOOR[floor] && !own.includes("f:" + floor)) return { ok: false, msg: "Buy that floor at the LLAMA STORE first." };
    await this.env.DB.prepare("UPDATE prooms SET name = ?, priv = ?, wall = ?, floor = ? WHERE id = ?").bind(name, priv, wall, floor, r.id).run();
    const nr = await this.prRoom(r.id); this.toRoom("p:" + r.id, { t: "prr", room: this.prOut(nr) });
    if (priv) await this.prKickUnwelcome(nr);
    return { ok: true, room: this.prOut(nr) };
  }
  async prKickUnwelcome(r) {   // a room just went private: anyone inside who isn't allowed goes back to the lounge
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || x.pres.rm !== "p:" + r.id) continue;
      if (!(await this.prCanEnter(x, r))) { x.proom = 0; w.serializeAttachment(x); this.send(w, { t: "prkick", msg: `${r.name} is private now, so you headed back to the lounge.` }); } } }
  async prEnter(ws, a, m) {
    const id = Math.floor(+m.rid || 0); const r = id > 0 ? await this.prRoom(id) : null; if (!r) return { ok: false, msg: "That room doesn't exist anymore." };
    const owner = await this.user(r.owner); if (!owner || owner.banned) return { ok: false, msg: "That room is closed." };
    if (!(await this.prCanEnter(a, r))) return { ok: false, locked: true, msg: `${r.name} is private. Knock and the owner can let you in.` };
    a.proom = r.id; ws.serializeAttachment(a);
    return { ok: true, room: this.prOut(r), mine: r.owner === a.uid, furn: await this.prFurn(r.id) };
  }
  async prKnock(a, m, now) {
    const r = await this.prRoom(Math.floor(+m.rid || 0)); if (!r) return { ok: false, msg: "That room doesn't exist anymore." };
    if (await this.prCanEnter(a, r)) return { ok: true, open: true };
    const k = r.id + ":" + a.uid; if (now - (this.knocks.get(k) || 0) < PR.knockGap) return { ok: false, msg: "You just knocked. Give them a moment." };
    let sent = false; for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === r.owner) { this.send(w, { t: "knock", room: r.id, uid: a.uid, n: a.name }); sent = true; } }
    if (!sent) return { ok: false, msg: `${r.oname.toUpperCase()} isn't online right now, so nobody can answer.` };
    this.knocks.set(k, now); return { ok: true, msg: `You knocked on ${r.name}. Waiting for ${r.oname.toUpperCase()} to answer...` };
  }
  async prAnswer(a, m, now) {
    const r = await this.prMine(a); if (!r) return { ok: false };
    const uid = Math.floor(+m.uid || 0); if (!this.knocks.has(r.id + ":" + uid)) return { ok: false, msg: "That knock expired." };
    this.knocks.delete(r.id + ":" + uid);
    if (m.yes) { let li = this.letIn.get(r.id); if (!li) { li = new Map(); this.letIn.set(r.id, li); } li.set(uid, now + PR.letInMs); }
    this.toUid(uid, { t: "knockans", room: r.id, yes: !!m.yes, name: r.name });
    return { ok: true };
  }
  async prInvite(a, m) {
    const r = await this.prMine(a); if (!r) return { ok: false, msg: "You don't have a room yet." };
    const n = String(m.n || "").trim(); if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return { ok: false, msg: "No llama has that name." };
    const u = await this.env.DB.prepare("SELECT id, name FROM users WHERE name = ? AND banned = 0").bind(n).first(); if (!u) return { ok: false, msg: "No llama has that name." };
    if (u.id === a.uid) return { ok: false, msg: "It's your room, you're always invited!" };
    if (m.add) { const c = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM pinv WHERE room = ?").bind(r.id).first(); if (c.n >= 100) return { ok: false, msg: "Your invite list is full." };
      await this.env.DB.prepare("INSERT OR IGNORE INTO pinv (room, uid) VALUES (?, ?)").bind(r.id, u.id).run(); this.toUid(u.id, { t: "prinvited", room: r.id, name: r.name, by: a.name }); }
    else { await this.env.DB.prepare("DELETE FROM pinv WHERE room = ? AND uid = ?").bind(r.id, u.id).run(); const li = this.letIn.get(r.id); if (li) li.delete(u.id); if (r.priv) await this.prKickUnwelcome(r); }
    return this.prInfo(a);
  }
  async prKick(a, m) {
    const r = await this.prMine(a); if (!r) return { ok: false };
    const n = String(m.n || "").toUpperCase(); let done = false;
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || x.pres.rm !== "p:" + r.id || x.uid === a.uid || x.name !== n) continue;
      x.proom = 0; w.serializeAttachment(x); this.send(w, { t: "prkick", msg: `${a.name} asked you to leave ${r.name}.` }); done = true;
      const li = this.letIn.get(r.id); if (li) li.delete(x.uid); }
    return { ok: done, msg: done ? `${n} left your room.` : `${n} isn't in your room.` };
  }
  async furnStorage(uid) {
    await this.prTables();
    const own = (await this.env.DB.prepare("SELECT item, n FROM finv WHERE uid = ?").bind(uid).all()).results || [];
    const mine = await this.env.DB.prepare("SELECT id FROM prooms WHERE owner = ?").bind(uid).first();
    const placed = new Map(); if (mine) for (const f of await this.prFurn(mine.id)) placed.set(f.item, (placed.get(f.item) || 0) + 1);
    return own.filter((r) => FURN_ITEMS[r.item]).map((r) => ({ item: r.item, n: r.n, placed: placed.get(r.item) || 0 }));
  }
  async decoOwned(uid) { await this.prTables(); return ((await this.env.DB.prepare("SELECT k FROM deco WHERE uid = ?").bind(uid).all()).results || []).map((r) => r.k); }
  async decoBuy(a, m) {   // k is "w:<wallpaper>" or "f:<floor>"
    await this.prTables();
    const k = String(m.k || ""), [kind, id] = k.split(":"), table = kind === "w" ? DECO_WALL : kind === "f" ? DECO_FLOOR : null;
    const price = table && Object.hasOwn(table, id) ? table[id] : 0; if (!price) return { ok: false, msg: "The store doesn't sell that." };
    if (!a.pres || a.pres.rm !== "store") return { ok: false, msg: "Visit the LLAMA STORE to buy wallpaper and floors." };
    if ((await this.decoOwned(a.uid)).includes(k)) return { ok: false, msg: "You already have that one." };
    const tk = await this.debit(a.uid, price, "deco " + k); if (tk === null) return { ok: false, msg: `That costs ${price} TOKENS. Play some games to earn more!` };
    await this.env.DB.prepare("INSERT OR IGNORE INTO deco (uid, k) VALUES (?, ?)").bind(a.uid, k).run();
    return { ok: true, tk, deco: await this.decoOwned(a.uid) };
  }
  async furnBuy(a, m) {
    await this.prTables();
    const k = String(m.item || ""); const price = Object.hasOwn(FURN_ITEMS, k) && FURN_SALE.has(k) ? FURN_ITEMS[k] : 0; if (!price) return { ok: false, msg: "The store doesn't sell that." };
    if (FURN_STAFF.has(k) && !(await this.staffNow(a))) return { ok: false, msg: "Only staff can buy that." };
    if (!a.pres || a.pres.rm !== "store") return { ok: false, msg: "Visit the LLAMA STORE to buy furniture." };
    const have = await this.env.DB.prepare("SELECT n FROM finv WHERE uid = ? AND item = ?").bind(a.uid, k).first(); if (have && have.n >= 20) return { ok: false, msg: "You have plenty of those." };
    const tk = await this.debit(a.uid, price, "furniture " + k); if (tk === null) return { ok: false, msg: `That costs ${price} TOKENS. Play some games to earn more!` };
    await this.env.DB.prepare("INSERT INTO finv (uid, item, n) VALUES (?, ?, 1) ON CONFLICT(uid, item) DO UPDATE SET n = n + 1").bind(a.uid, k).run();
    return { ok: true, tk, furn: await this.furnStorage(a.uid) };
  }
  async prOwnRoomHere(a) {   // editing: only the owner, standing in their own room
    const r = await this.prMine(a); if (!r) return null; if (!a.pres || a.pres.rm !== "p:" + r.id) return null; return r; }
  // tiles a piece covers: the bed is two long (along x for rot 0/2, along y for rot 1/3); everything else is one tile
  furnTiles(item, gx, gy, rot) { if (FURN_DIM[item]) { let [W, D] = FURN_DIM[item]; if (rot % 2) [W, D] = [D, W]; const out = []; for (let i = 0; i < W; i++) for (let j = 0; j < D; j++) out.push([gx + i, gy + j]); return out; }
    const bi = furnBase(item), n = FURN_SIZE[bi] || 1, alongY = FURN_SIDEWAYS.has(bi) ? (rot === 0 || rot === 3) : rot % 2 === 1, out = []; for (let k = 0; k < n; k++) out.push(alongY ? [gx, gy + k] : [gx + k, gy]); return out; }
  furnFits(item, gx, gy, rot, furn, skipId) {   // null if it fits, otherwise the reason
    const layer = layerOf(item), wall = layer === "wall", tiles = this.furnTiles(item, gx, gy, rot);
    for (const [x, y] of tiles) {
      if (!(x >= 0 && y >= 0 && x < PR.w && y < PR.h)) return "That doesn't fit there.";
      if (layer === "floor" && PR.clear.includes(x + "," + y)) return "Keep the doorway clear.";
    }
    for (const f of furn) {
      if (f.id === skipId || layerOf(f.item) !== layer) continue;   // rugs only bump into rugs, wall items into wall items
      const ft = this.furnTiles(f.item, f.gx, f.gy, f.rot);
      if (ft.some(([x, y]) => tiles.some(([u, v]) => u === x && v === y))) return wall ? "Something is already there." : "Something is in the way.";
    }
    return null;
  }
  async prPlace(a, m) {
    const r = await this.prOwnRoomHere(a); if (!r) return { ok: false, msg: "Go into your own room to place furniture." };
    const k = String(m.item || ""); if (!Object.hasOwn(FURN_ITEMS, k)) return { ok: false, msg: "That's not furniture." };
    const gx = Math.floor(+m.gx), gy = Math.floor(+m.gy), rot = ((Math.floor(+m.rot) || 0) % 4 + 4) % 4;
    if (!(gx >= 0 && gy >= 0 && gx < PR.w && gy < PR.h)) return { ok: false, msg: "That's outside the room." };
    const wall = FURN_WALL.has(k);
    if (wall && gx !== 0 && gy !== 0) return { ok: false, msg: "Wall items go on a wall. Tap a spot right next to a wall." };
    if (wall && gx === 0 && gy >= PR.h - 2) return { ok: false, msg: "That's where the door is." };
    const furn = await this.prFurn(r.id); if (furn.length >= PR.maxFurn) return { ok: false, msg: `Rooms hold up to ${PR.maxFurn} pieces.` };
    { const why = this.furnFits(k, gx, gy, rot, furn, -1); if (why) return { ok: false, msg: why }; }
    const own = await this.env.DB.prepare("SELECT n FROM finv WHERE uid = ? AND item = ?").bind(a.uid, k).first();
    if (!own || furn.filter((f) => f.item === k).length >= own.n) return { ok: false, msg: "You don't have one of those in storage." };
    await this.env.DB.prepare("INSERT INTO pfurn (room, item, gx, gy, rot) VALUES (?, ?, ?, ?, ?)").bind(r.id, k, gx, gy, rot).run();
    const nf = await this.prFurn(r.id); this.toRoom("p:" + r.id, { t: "prf", room: r.id, furn: nf });
    return { ok: true, furn: nf, storage: await this.furnStorage(a.uid) };
  }
  async prToggle(ws, a, m) {   // switch a TV or lamp on or off: anyone in the room can, a couple of times a second at most
    const rm = a.pres && a.pres.rm, rid = rm && rm.startsWith("p:") ? Math.floor(+rm.slice(2) || 0) : 0;
    if (!rid || a.proom !== rid) return { ok: false, msg: "Walk into the room first." };
    const now = Date.now(); if (!a.tg || now - a.tg[0] > 10000) a.tg = [now, 0]; if (++a.tg[1] > 20) { ws.serializeAttachment(a); return { ok: false, msg: "Easy on the switch!" }; } ws.serializeAttachment(a);
    await this.prTables();
    const f = await this.env.DB.prepare("SELECT id, item FROM pfurn WHERE id = ? AND room = ?").bind(Math.floor(+m.fid || 0), rid).first();
    if (!f || !FURN_SWITCH.has(f.item)) return { ok: false, msg: "That doesn't switch on or off." };
    await this.env.DB.prepare("UPDATE pfurn SET off = 1 - off WHERE id = ?").bind(f.id).run();
    const nf = await this.prFurn(rid); this.toRoom("p:" + rid, { t: "prf", room: rid, furn: nf });
    return { ok: true };
  }
  async prMove(a, m) {   // drag a placed piece to another tile (same checks as placing it)
    const r = await this.prOwnRoomHere(a); if (!r) return { ok: false, msg: "Go into your own room to move furniture." };
    const id = Math.floor(+m.fid || 0); const f = await this.env.DB.prepare("SELECT * FROM pfurn WHERE id = ? AND room = ?").bind(id, r.id).first(); if (!f) return { ok: false, msg: "That piece is gone." };
    const gx = Math.floor(+m.gx), gy = Math.floor(+m.gy);
    if (!(gx >= 0 && gy >= 0 && gx < PR.w && gy < PR.h)) return { ok: false, msg: "That's outside the room." };
    if (FURN_WALL.has(f.item)) { if (gx !== 0 && gy !== 0) return { ok: false, msg: "Wall items go on a wall." }; if (gx === 0 && gy >= PR.h - 2) return { ok: false, msg: "That's where the door is." }; }
    const why = this.furnFits(f.item, gx, gy, f.rot, await this.prFurn(r.id), f.id); if (why) return { ok: false, msg: why };
    await this.env.DB.prepare("UPDATE pfurn SET gx = ?, gy = ? WHERE id = ?").bind(gx, gy, id).run();
    const nf = await this.prFurn(r.id); this.toRoom("p:" + r.id, { t: "prf", room: r.id, furn: nf });
    return { ok: true, furn: nf, storage: await this.furnStorage(a.uid) };
  }
  async prEditPiece(a, m, what) {
    const r = await this.prOwnRoomHere(a); if (!r) return { ok: false, msg: "Go into your own room to change furniture." };
    const id = Math.floor(+m.fid || 0); const f = await this.env.DB.prepare("SELECT * FROM pfurn WHERE id = ? AND room = ?").bind(id, r.id).first(); if (!f) return { ok: false, msg: "That piece is gone." };
    if (what === "rot") { const why = this.furnFits(f.item, f.gx, f.gy, (f.rot + 1) % 4, await this.prFurn(r.id), f.id); if (why) return { ok: false, msg: why === "Something is in the way." ? "No room to turn it there." : why }; }
    if (what === "rot") await this.env.DB.prepare("UPDATE pfurn SET rot = (rot + 1) % 4 WHERE id = ?").bind(id).run();
    else await this.env.DB.prepare("DELETE FROM pfurn WHERE id = ?").bind(id).run();
    const nf = await this.prFurn(r.id); this.toRoom("p:" + r.id, { t: "prf", room: r.id, furn: nf });
    return { ok: true, furn: nf, storage: await this.furnStorage(a.uid) };
  }
  async prStaff(a, m) {   // staff can reset a room's name (and make it private) if it breaks the rules
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can do that." };
    const r = await this.prRoom(Math.floor(+m.rid || 0)); if (!r) return { ok: false, msg: "No such room." };
    await this.env.DB.prepare("UPDATE prooms SET name = ? WHERE id = ?").bind((r.oname.toUpperCase() + "'S ROOM").slice(0, PR.nameMax), r.id).run();
    await this.logStaff(a.name, "roomreset", r.oname.toUpperCase());
    const nr = await this.prRoom(r.id); this.toRoom("p:" + r.id, { t: "prr", room: this.prOut(nr) }); return { ok: true, msg: "Room name reset." };
  }

  // ---------- wardrobe and inventory ----------
  async invTables() { if (this.invReady) return;
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS inv (uid INTEGER NOT NULL, item TEXT NOT NULL, t INTEGER NOT NULL, PRIMARY KEY (uid, item))").run();
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS wear (uid INTEGER PRIMARY KEY, hat TEXT, eyes TEXT, neck TEXT, shirt TEXT)").run();
    this.invReady = true; }
  async wearLoad(uid) { await this.invTables(); const r = await this.env.DB.prepare("SELECT * FROM wear WHERE uid = ?").bind(uid).first(); const w = {};
    if (r) for (const s of WEAR_SLOTS) if (r[s] && ITEMS[r[s]] && ITEMS[r[s]].s === s) w[s] = r[s]; return w; }
  async invInfo(uid) { await this.invTables(); const rows = (await this.env.DB.prepare("SELECT item FROM inv WHERE uid = ? ORDER BY t").bind(uid).all()).results || []; return { owned: rows.map((r) => r.item).filter((k) => ITEMS[k]) }; }
  async invBuy(ws, a, m) {
    await this.invTables();
    const k = String(m.item || ""); const it = Object.hasOwn(ITEMS, k) ? ITEMS[k] : null;
    if (!it) return { ok: false, msg: "The store doesn't sell that." };
    if (!a.pres || a.pres.rm !== "store") return { ok: false, msg: "Visit the LLAMA STORE to buy clothes." };
    const have = await this.env.DB.prepare("SELECT 1 FROM inv WHERE uid = ? AND item = ?").bind(a.uid, k).first();
    if (have) return { ok: false, msg: "You already own that. Find it in your wardrobe." };
    const tk = await this.debit(a.uid, it.p, "wardrobe " + k); if (tk === null) return { ok: false, msg: `That costs ${it.p} TOKENS. Play some games to earn more!` };
    await this.env.DB.prepare("INSERT OR IGNORE INTO inv (uid, item, t) VALUES (?, ?, ?)").bind(a.uid, k, Date.now()).run();
    return { ok: true, tk, ...(await this.invInfo(a.uid)) };
  }
  async invWear(ws, a, m) {
    await this.invTables();
    const slot = String(m.slot || ""); if (!WEAR_SLOTS.includes(slot)) return { ok: false, msg: "Bad slot." };
    let k = m.item == null || m.item === "" ? null : String(m.item);
    if (k) { if (!Object.hasOwn(ITEMS, k) || ITEMS[k].s !== slot) return { ok: false, msg: "That doesn't go there." };
      const have = await this.env.DB.prepare("SELECT 1 FROM inv WHERE uid = ? AND item = ?").bind(a.uid, k).first(); if (!have) return { ok: false, msg: "You don't own that yet." }; }
    await this.env.DB.prepare(`INSERT INTO wear (uid, ${slot}) VALUES (?, ?) ON CONFLICT(uid) DO UPDATE SET ${slot} = excluded.${slot}`).bind(a.uid, k).run();
    a.wear = { ...(a.wear || {}) }; if (k) a.wear[slot] = k; else delete a.wear[slot];
    if (a.pres){ if (Object.keys(a.wear).length) a.pres.w = a.wear; else delete a.pres.w; this.peersOut(ws, a, "updated"); }
    ws.serializeAttachment(a);
    return { ok: true, w: a.wear };
  }

  // ---------- food and drink: what you hold fills your meters a fifth at a time, one sip or bite at a time ----------
  async holdFood(uid, f) { await this.ctx.storage.put("held:" + uid, { hu: f.hu || 0, th: f.th || 0, left: SIPS, last: 0 }); }
  async sipHeld(ws, a, now) {
    const h = await this.ctx.storage.get("held:" + a.uid);
    if (!h || h.left <= 0) return { ok: true, nd: this.needsOut(a) };
    if (now - h.last < 900) return { ok: true, nd: this.needsOut(a) };   // one sip at a time
    h.left--; h.last = now;
    if (h.left > 0) await this.ctx.storage.put("held:" + a.uid, h); else await this.ctx.storage.delete("held:" + a.uid);
    await this.needsEat(ws, a, { hu: h.hu / SIPS, th: h.th / SIPS }, now);
    return { ok: true, nd: this.needsOut(a) };
  }

  // ---------- chat log (staff only) ----------
  async chatTable() { if (this.chatReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS chatlog (id INTEGER PRIMARY KEY AUTOINCREMENT, t INTEGER NOT NULL, uid INTEGER NOT NULL, name TEXT NOT NULL, rm TEXT NOT NULL, text TEXT NOT NULL, mu INTEGER NOT NULL DEFAULT 0)").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS chatlog_uid ON chatlog (uid, id)").run(); this.chatReady = true; }
  async chatLog(a, rm, text, muted) {
    await this.chatTable();
    const now = Date.now();
    await this.env.DB.prepare("INSERT INTO chatlog (t, uid, name, rm, text, mu) VALUES (?, ?, ?, ?, ?, ?)").bind(now, a.uid, a.name, (ROOM_IDS.has(rm) || prId(rm)) ? rm : "lounge", text, muted ? 1 : 0).run();
  }
  async dashChat(a, m) {
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can see the chat log." };
    await this.chatTable();
    const before = Number.isInteger(m.before) && m.before > 0 ? m.before : 2 ** 53, q = String(m.q || "").trim();
    const rows = /^[A-Za-z0-9_]{1,12}$/.test(q)
      ? await this.env.DB.prepare("SELECT c.*, u.role, u.muted, u.banned FROM chatlog c JOIN users u ON u.id = c.uid WHERE c.id < ? AND c.name LIKE ? ORDER BY c.id DESC LIMIT 80").bind(before, q + "%").all()
      : await this.env.DB.prepare("SELECT c.*, u.role, u.muted, u.banned FROM chatlog c JOIN users u ON u.id = c.uid WHERE c.id < ? ORDER BY c.id DESC LIMIT 80").bind(before).all();
    return { ok: true, me: a.staff, lines: (rows.results || []).map((r) => ({ id: r.id, t: r.t, n: r.name.toUpperCase(), rm: r.rm, text: r.text, mu: r.mu, st: r.role === "admin" ? "owner" : r.role === "mod" ? "mod" : "", muted: !!r.muted, banned: !!r.banned })) };
  }

  // ---------- private messages between friends ----------
  async dmTable() { if (this.dmReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS dms (id INTEGER PRIMARY KEY AUTOINCREMENT, a INTEGER NOT NULL, b INTEGER NOT NULL, t INTEGER NOT NULL, text TEXT NOT NULL, rd INTEGER NOT NULL DEFAULT 0)").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS dms_ab ON dms (a, b, id)").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS dms_b ON dms (b, rd)").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS dms_at ON dms (a, t)").run(); this.dmReady = true; }
  async dmSend(ws, a, m) {
    await this.dmTable(); await this.frTable();
    const now = Date.now(); if (!a.dmr || now - a.dmr[0] > 10000) a.dmr = [now, 0]; if (++a.dmr[1] > DM.burst) { ws.serializeAttachment(a); return { ok: false, msg: "Slow down a little." }; } ws.serializeAttachment(a);
    const text = String(m.text || "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, DM.len);
    if (!text) return { ok: false, msg: "Type a message first." };
    const me = await this.user(a.uid); if (!me || me.banned) return { ok: false, msg: "You can't send messages." };
    if (me.muted) return { ok: false, msg: "You're muted, so you can't send messages right now." };
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    if (!T.row || T.row.st !== "ok") return { ok: false, msg: "You can only message friends." };
    const dayStart = Date.parse(etDay(now) + "T00:00:00Z") - 12 * 3600e3;   // a little before midnight Eastern, then counted exactly below
    const sent = await this.env.DB.prepare("SELECT t FROM dms WHERE a = ? AND t > ? ORDER BY t DESC LIMIT ?").bind(a.uid, dayStart, DM.perDay + 1).all();
    if ((sent.results || []).filter((r) => etDay(r.t) === etDay(now)).length >= DM.perDay) return { ok: false, msg: `You've sent ${DM.perDay} messages today. You can send more tomorrow.` };
    const r = await this.env.DB.prepare("INSERT INTO dms (a, b, t, text) VALUES (?, ?, ?, ?) RETURNING id").bind(a.uid, T.u.id, now, text).first();
    const msg = { id: r.id, from: a.name, to: T.u.name.toUpperCase(), t: now, text };
    this.toUid(T.u.id, { t: "dm", m: msg });
    return { ok: true, m: msg };
  }
  async dmInbox(uid) {
    await this.dmTable();
    const rows = (await this.env.DB.prepare(`SELECT x.o, x.mid, x.un, u.name, d.text, d.t, d.a FROM (SELECT CASE WHEN a = ? THEN b ELSE a END AS o, MAX(id) AS mid, SUM(CASE WHEN b = ? AND rd = 0 THEN 1 ELSE 0 END) AS un FROM dms WHERE a = ? OR b = ? GROUP BY o) x JOIN users u ON u.id = x.o JOIN dms d ON d.id = x.mid WHERE u.banned = 0 ORDER BY x.mid DESC LIMIT 50`).bind(uid, uid, uid, uid).all()).results || [];
    return rows.map((r) => ({ n: r.name.toUpperCase(), un: r.un || 0, last: r.text, t: r.t, mine: r.a === uid }));
  }
  async dmThread(a, m) {
    await this.dmTable();
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const rows = (await this.env.DB.prepare("SELECT id, a, t, text FROM dms WHERE (a = ? AND b = ?) OR (a = ? AND b = ?) ORDER BY id DESC LIMIT 60").bind(a.uid, T.u.id, T.u.id, a.uid).all()).results || [];
    await this.env.DB.prepare("UPDATE dms SET rd = 1 WHERE a = ? AND b = ? AND rd = 0").bind(T.u.id, a.uid).run();
    return { ok: true, n: T.u.name.toUpperCase(), friend: !!(T.row && T.row.st === "ok"), msgs: rows.reverse().map((r) => ({ id: r.id, mine: r.a === a.uid, t: r.t, text: r.text })) };
  }

  // ---------- friends ----------
  // One row per pair: a asked b. st is 'req' until b accepts, then 'ok'. Either side can remove it.
  async frTable() { if (this.frReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS friends (a INTEGER NOT NULL, b INTEGER NOT NULL, st TEXT NOT NULL, t INTEGER NOT NULL, PRIMARY KEY (a, b))").run(); await this.env.DB.prepare("CREATE INDEX IF NOT EXISTS friends_b ON friends (b)").run(); this.frReady = true; }
  async frList(uid) {
    await this.frTable();
    const rows = (await this.env.DB.prepare("SELECT f.a, f.st, u.name FROM friends f JOIN users u ON u.id = CASE WHEN f.a = ? THEN f.b ELSE f.a END WHERE (f.a = ? OR f.b = ?) AND u.banned = 0 ORDER BY u.name").bind(uid, uid, uid).all()).results || [];
    const out = { friends: [], inc: [], out: [] };
    for (const r of rows) (r.st === "ok" ? out.friends : r.a === uid ? out.out : out.inc).push(r.name.toUpperCase());
    return out;
  }
  toUid(uid, obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === uid) { try { w.send(s); } catch (e) {} } } }
  async frTarget(a, m) {
    const n = String(m.n || "").trim();
    if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return { err: "No llama has that name." };
    const u = await this.env.DB.prepare("SELECT id, name, banned FROM users WHERE name = ?").bind(n).first();
    if (!u || u.banned) return { err: "No llama has that name." };
    if (u.id === a.uid) return { err: "You're already your own best friend!" };
    const row = await this.env.DB.prepare("SELECT a, b, st FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)").bind(a.uid, u.id, u.id, a.uid).first();
    return { u, row };
  }
  // invite a friend to whatever room you're in right now (they get a pop-up to come over)
  async roomInvite(ws, a, m) {
    await this.frTable();
    const now = Date.now(); if (!a.ri || now - a.ri[0] > 60000) a.ri = [now, 0]; if (++a.ri[1] > 12) { ws.serializeAttachment(a); return { ok: false, msg: "Slow down on the invites. Try again in a minute." }; } ws.serializeAttachment(a);
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const { u, row } = T, them = u.name.toUpperCase();
    if (!row || row.st !== "ok") return { ok: false, msg: `You can only invite friends. Add ${them} first.` };
    const rm = a.pres && a.pres.rm; if (!rm) return { ok: false, msg: "Walk into a room first." };
    let online = false, here = false;
    for (const w2 of this.sockets()) { const x = w2.deserializeAttachment(); if (x && x.uid === u.id) { online = true; if (x.pres && x.pres.rm === rm) here = true; } }
    if (!online) return { ok: false, msg: `${them} isn't online right now.` };
    if (here) return { ok: false, msg: `${them} is already here with you.` };
    if (!this.rinv) this.rinv = new Map(); const k = a.uid + ":" + u.id; if (now - (this.rinv.get(k) || 0) < 30000) return { ok: false, msg: `You just invited ${them}. Give them a moment.` }; this.rinv.set(k, now);
    let name = null;
    if (rm.startsWith("p:")) {
      const r = await this.prRoom(Math.floor(+rm.slice(2) || 0)); if (!r) return { ok: false, msg: "This room is gone." };
      if (r.priv) { if (r.owner !== a.uid) return { ok: false, msg: "This room is private. Only its owner can invite people." };
        await this.env.DB.prepare("INSERT OR IGNORE INTO pinv (room, uid) VALUES (?, ?)").bind(r.id, u.id).run(); }
      name = r.name;
    }
    this.toUid(u.id, { t: "rinv", by: a.name, rm, name });
    return { ok: true, msg: `Invite sent to ${them}!` };
  }
  async frAdd(ws, a, m) {
    await this.frTable();
    const now = Date.now(); if (!a.fr || now - a.fr[0] > 60000) a.fr = [now, 0]; if (++a.fr[1] > 10) { ws.serializeAttachment(a); return { ok: false, msg: "Slow down on the friend requests. Try again in a minute." }; } ws.serializeAttachment(a);
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const { u, row } = T, them = u.name.toUpperCase();
    if (row && row.st === "ok") return { ok: false, msg: `You and ${them} are already friends.` };
    if (row && row.a === a.uid) return { ok: false, msg: `You already asked ${them}. Waiting for them to accept.` };
    if (row) return this.frAccept(a, m);   // they already asked you, so this just accepts
    const mine = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM friends WHERE a = ? OR (b = ? AND st = 'ok')").bind(a.uid, a.uid).first();
    if (mine.n >= FRIENDS.max) return { ok: false, msg: `You can have up to ${FRIENDS.max} friends and requests. Remove some first.` };
    const theirs = await this.env.DB.prepare("SELECT COUNT(*) AS n FROM friends WHERE b = ? AND st = 'req'").bind(u.id).first();
    if (theirs.n >= FRIENDS.inbox) return { ok: false, msg: `${them} has too many friend requests waiting right now.` };
    await this.env.DB.prepare("INSERT OR IGNORE INTO friends (a, b, st, t) VALUES (?, ?, 'req', ?)").bind(a.uid, u.id, now).run();
    this.toUid(u.id, { t: "fr", ev: "req", n: a.name, fr: await this.frList(u.id) });
    return { ok: true, msg: `Friend request sent to ${them}!`, fr: await this.frList(a.uid) };
  }
  async frAccept(a, m) {
    await this.frTable();
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const { u, row } = T, them = u.name.toUpperCase();
    if (!row || row.st !== "req" || row.a !== u.id) return { ok: false, msg: `${them} hasn't sent you a request.` };
    await this.env.DB.prepare("UPDATE friends SET st = 'ok', t = ? WHERE a = ? AND b = ?").bind(Date.now(), u.id, a.uid).run();
    this.toUid(u.id, { t: "fr", ev: "acc", n: a.name, fr: await this.frList(u.id) });
    return { ok: true, msg: `You and ${them} are now friends!`, fr: await this.frList(a.uid) };
  }
  async frDrop(a, m, why) {   // decline a request, cancel your own, or unfriend
    await this.frTable();
    const T = await this.frTarget(a, m); if (T.err) return { ok: false, msg: T.err };
    const { u, row } = T;
    if (!row) return { ok: true, fr: await this.frList(a.uid) };
    if (why === "decline" && !(row.st === "req" && row.a === u.id)) return { ok: false, msg: "There's no request to decline." };
    await this.env.DB.prepare("DELETE FROM friends WHERE (a = ? AND b = ?) OR (a = ? AND b = ?)").bind(a.uid, u.id, u.id, a.uid).run();
    this.toUid(u.id, { t: "fr", ev: "upd", fr: await this.frList(u.id) });   // their list just updates quietly
    return { ok: true, fr: await this.frList(a.uid) };
  }

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
        // the llama picked at sign-up is the account's llama for good: once it's set, it never changes
        await this.env.DB.prepare("UPDATE users SET c = COALESCE(c, ?), agreed = MAX(agreed, ?), bet = ? WHERE id = ?").bind(c, Math.max(0, Math.min(9, +m.agreed || 0)), bet, uid).run();
        return { ok: true };
      }
      case "drink": {
        if (!this.near(a, "lounge", (x, y, p) => p.p === "sit" && Math.round(y) === 2)) return { ok: false, msg: "Sit at the bar first." };
        const tk = await this.debit(uid, 1, "drink"); if (tk === null) return { ok: false, msg: "Drinks cost 1 TOKEN. Earn some at the arcade, the bar or LLAMA ACRES!" };
        await this.holdFood(uid, { th: 30 });
        return { ok: true, tk, nd: this.needsOut(a) };
      }
      case "slot": {
        let sx = -1; if (!this.near(a, "casino", (x, y, p) => { sx = Math.round(x); return p.p === "sit" && Math.round(y) === 1 && SLOT_X.includes(sx); })) return { ok: false, msg: "Sit at a slot machine first." };
        const bet = SLOT_BETS.includes(+m.bet) ? +m.bet : 1, kind = slotKind(sx);
        if (now - (await this.timer(uid, "slot")) < 1300) return { ok: false, msg: "The reels are still spinning." };
        await this.setTimer(uid, "slot", now);
        let tk = await this.debit(uid, bet, "slot spin"); if (tk === null) return { ok: false, msg: `YOU NEED ${bet} TOKEN${bet > 1 ? "S" : ""} TO SPIN.` };
        let r, pay = 0, lines = [];
        if (kind === "fruit") { const M = SLOTS.fruit; r = [pickW(M.w), pickW(M.w), pickW(M.w)]; if (r[0] === r[1] && r[1] === r[2]) pay = M.pay[r[0]] * bet; }
        else if (kind === "classic") { const M = SLOTS.classic; r = Array.from({ length: 9 }, () => pickW(M.w));
          SLOT_LINES.forEach((L, i) => { if (r[L[0]] === r[L[1]] && r[L[1]] === r[L[2]]) { lines.push(i); pay += M.pay[r[L[0]]] * bet; } }); }
        else { const seg = pickW(WHEEL.slices.map((v) => WHEEL.weight[v])); r = [seg]; pay = WHEEL.slices[seg] * bet; }
        if (pay) tk = await this.credit(uid, pay, "slot win");
        return { ok: true, kind, r, lines, pay, bet, tk };
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
      case "afk_ok": { a.act = now; ws.serializeAttachment(a); return { ok: true }; }
      case "fish_cast": {
        if (now - (a.act || 0) > AFK_MS) return { ok: false, afk: true, msg: "Are you still there? Tap I'M STILL HERE to keep fishing." };
        if (!this.near(a, "barn", (x, y) => x >= POND.x0 - 1.6 && x <= POND.x1 + 1.6 && y >= POND.y0 - 1.6 && y <= POND.y1 + 1.6)) return { ok: false, msg: "Stand next to the pond to fish." };
        const bite = 10000 + rnd(10000);
        await this.setTimer(uid, "fish", now + bite);
        return { ok: true, bite };
      }
      case "fish_reel": {
        const t = await this.timer(uid, "fish");
        if (!t || now < t - 300 || now > t + 60000) return { ok: false, msg: "Nothing on the line." };   // a minute to reel, so a background tab still makes it
        await this.clearTimer(uid, "fish");
        const f = pickW(FISH.map((x) => x.w));
        return { ok: true, f, pay: FISH[f].pay, name: FISH[f].n, tk: await this.credit(uid, Math.max(1, halfIfEmpty(a, FISH[f].pay)), "fish") };
      }
      case "bar_tick": {
        if (now - (a.act || 0) > AFK_MS) return { ok: false, afk: true };
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
        let earn = Math.min(10, Math.floor(score / (id === "hay" ? 10 : 50))); if (isBest && score > 0) earn += 3; earn = halfIfEmpty(a, earn);
        const tk = await this.credit(uid, earn, "arcade " + id);
        if (isBest) this.broadcast({ t: "board", board: await this.board() });
        return { ok: true, earned: earn, best: isBest, tk };
      }
      case "apple": {
        if (!this.near(a, "barn", () => true)) return { ok: false };
        if (now - (a.nd && a.nd.apple || 0) < NEEDS.appleGap) return { ok: true, full: 0, nd: this.needsOut(a) };
        a.nd.apple = now; await this.needsEat(ws, a, { hu: NEEDS.apple }, now);
        return { ok: true, full: NEEDS.apple, nd: this.needsOut(a) };
      }
      case "buy": {
        const k = String(m.k || ""); const S = Object.hasOwn(STANDS, m.s) ? STANDS[m.s] : null; let cost = 0;
        if (m.s === "pv") {   // a machine in a player room: you must be in that room, next to that machine
          const rm = a.pres && a.pres.rm, rid = rm && rm.startsWith("p:") ? Math.floor(+rm.slice(2) || 0) : 0;
          if (!rid || a.proom !== rid) return { ok: false, msg: "Walk up to the machine first." };
          const f = await this.env.DB.prepare("SELECT item, gx, gy FROM pfurn WHERE id = ? AND room = ?").bind(Math.floor(+m.fid || 0), rid).first();
          if (!f || !PV_ITEMS[f.item]) return { ok: false, msg: "That machine is gone." };
          if (!this.near(a, rm, (x, y) => Math.abs(x - f.gx) <= 1.6 && Math.abs(y - f.gy) <= 1.6)) return { ok: false, msg: "Walk up to the machine first." };
          cost = Object.hasOwn(PV_ITEMS[f.item], k) ? PV_ITEMS[f.item][k] : 0;
          if (!cost) return { ok: false, msg: "That machine doesn't sell that." };
        } else {
          cost = S && Object.hasOwn(S.items, k) ? S.items[k] : 0;
          if (!cost) return { ok: false, msg: "They don't sell that here." };
          if (m.s === "bar") { if (!this.near(a, "lounge", (x, y, p) => p.p === "sit" && Math.round(y) === 2)) return { ok: false, msg: "Sit at the bar first." }; }
          else if (!this.near(a, S.rm, (x, y) => Math.abs(x - S.x) <= 2.1 && Math.abs(y - S.y) <= 1.6)) return { ok: false, msg: "Walk up to the stand first." };
        }
        const tk = await this.debit(uid, cost, "stand " + k); if (tk === null) return { ok: false, msg: `That costs ${cost} TOKENS. Play a game or harvest carrots to earn some!` };
        await this.holdFood(uid, FOOD[k] || {});   // fills a little with each sip or bite
        return { ok: true, k, tk, nd: this.needsOut(a) };
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
      case "arena_info": return this.arenaInfo(a, now);
      case "arena_join": return this.arenaJoin(ws, a, m, now);
      case "arena_end": return this.arenaEnd(ws, a, m, now);
      case "dunk_throw": return this.dunkThrow(a, m, now);
      case "bowl_info": return this.bowlInfo(a, now);
      case "bowl_start": return this.bowlStart(a, now);
      case "bowl_roll": return this.bowlRoll(a, m, now);
      case "dash_chat": return this.dashChat(a, m);
      case "gift_undo": return this.giftUndo(a, m);
      case "pr_list": return this.prList(a);
      case "pr_create": return this.prCreate(a, m);
      case "pr_search": return this.prSearch(a, m);
      case "pr_info": return this.prInfo(a);
      case "pr_set": return this.prSet(a, m);
      case "pr_enter": return this.prEnter(ws, a, m);
      case "pr_knock": return this.prKnock(a, m, now);
      case "pr_answer": return this.prAnswer(a, m, now);
      case "pr_invite": return this.prInvite(a, m);
      case "pr_kick": return this.prKick(a, m);
      case "pr_place": return this.prPlace(a, m);
      case "pr_move": return this.prMove(a, m);
      case "pr_toggle": return this.prToggle(ws, a, m);
      case "pr_rot": return this.prEditPiece(a, m, "rot");
      case "pr_pick": return this.prEditPiece(a, m, "pick");
      case "pr_staff": return this.prStaff(a, m);
      case "furn_info": return { ok: true, furn: await this.furnStorage(uid), deco: await this.decoOwned(uid) };
      case "deco_buy": return this.decoBuy(a, m);
      case "furn_buy": return this.furnBuy(a, m);
      case "inv_info": return { ok: true, ...(await this.invInfo(uid)), w: a.wear || {} };
      case "inv_buy": return this.invBuy(ws, a, m);
      case "inv_wear": return this.invWear(ws, a, m);
      case "dm_send": return this.dmSend(ws, a, m);
      case "dm_inbox": return { ok: true, inbox: await this.dmInbox(uid) };
      case "dm_thread": return this.dmThread(a, m);
      case "dm_read": { const T = await this.frTarget(a, m); if (!T.err) { await this.dmTable(); await this.env.DB.prepare("UPDATE dms SET rd = 1 WHERE a = ? AND b = ? AND rd = 0").bind(T.u.id, uid).run(); } return { ok: true }; }
      case "sip": return this.sipHeld(ws, a, now);
      case "fr_list": return { ok: true, fr: await this.frList(uid) };
      case "fr_add": return this.frAdd(ws, a, m);
      case "room_invite": return this.roomInvite(ws, a, m);
      case "fr_accept": return this.frAccept(a, m);
      case "fr_decline": return this.frDrop(a, m, "decline");
      case "fr_remove": return this.frDrop(a, m, "remove");
      case "bowl_quit": { await this.ctx.storage.delete("bowl:" + a.uid); this.bowlLiveDrop(a.uid); return { ok: true }; }
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

  // ---------- hunger and thirst ----------
  async needsTable() { if (this.needsReady) return; await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS needs (uid INTEGER PRIMARY KEY, hu REAL NOT NULL DEFAULT 100, th REAL NOT NULL DEFAULT 100)").run(); this.needsReady = true; }
  async needsLoad(uid) { await this.needsTable(); const r = await this.env.DB.prepare("SELECT hu, th FROM needs WHERE uid = ?").bind(uid).first();
    const now = Date.now(); return { hu: r ? r.hu : 100, th: r ? r.th : 100, t: now, saved: now, sent: now, apple: 0 }; }   // time away doesn't count
  needsDrain(a, now) { const N = a.nd, dt = Math.max(0, Math.min(NEEDS.maxStep, now - N.t)); N.hu = Math.max(0, N.hu - dt * 100 / NEEDS.hungerMs); N.th = Math.max(0, N.th - dt * 100 / NEEDS.thirstMs); N.t = now; }
  async needsSave(a) { await this.needsTable(); await this.env.DB.prepare("INSERT INTO needs (uid, hu, th) VALUES (?, ?, ?) ON CONFLICT(uid) DO UPDATE SET hu = excluded.hu, th = excluded.th").bind(a.uid, Math.round(a.nd.hu * 10) / 10, Math.round(a.nd.th * 10) / 10).run(); a.nd.saved = Date.now(); }
  needsOut(a) { return { hu: Math.round(a.nd.hu * 10) / 10, th: Math.round(a.nd.th * 10) / 10 }; }
  async needsTick(ws, a, now) {
    const was = a.nd.hu > 0 && a.nd.th > 0; this.needsDrain(a, now);
    if (now - a.nd.saved > NEEDS.saveMs) await this.needsSave(a);
    if (now - a.nd.sent > 30000 || was !== (a.nd.hu > 0 && a.nd.th > 0)) { a.nd.sent = now; this.send(ws, { t: "nd", ...this.needsOut(a) }); }
    ws.serializeAttachment(a);
  }
  async needsEat(ws, a, f, now) { if (!a.nd) return; this.needsDrain(a, now);
    a.nd.hu = Math.max(0, Math.min(100, a.nd.hu + (f.hu || 0))); a.nd.th = Math.max(0, Math.min(100, a.nd.th + (f.th || 0)));
    await this.needsSave(a); a.nd.sent = now; ws.serializeAttachment(a); }

  // ---------- spit arena ----------
  async arenaTable() {
    if (this.arenaReady) return;
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS arena (uid INTEGER PRIMARY KEY, xp INTEGER NOT NULL DEFAULT 0, best INTEGER NOT NULL DEFAULT 0, wk TEXT NOT NULL DEFAULT '', wk_best INTEGER NOT NULL DEFAULT 0, played INTEGER NOT NULL DEFAULT 0, wins INTEGER NOT NULL DEFAULT 0, streak INTEGER NOT NULL DEFAULT 0, last_day TEXT NOT NULL DEFAULT '', earn_day TEXT NOT NULL DEFAULT '', earned INTEGER NOT NULL DEFAULT 0, color TEXT NOT NULL DEFAULT 'blue')").run();
    this.arenaReady = true;
  }
  async arenaRow(uid) { await this.arenaTable(); return (await this.env.DB.prepare("SELECT * FROM arena WHERE uid = ?").bind(uid).first()) || { uid, xp: 0, best: 0, wk: "", wk_best: 0, played: 0, wins: 0, streak: 0, last_day: "", earn_day: "", earned: 0, color: "blue" }; }
  async arenaBoard(now) {
    await this.arenaTable(); const wk = etWeek(now);
    const q = async (sql, ...b) => ((await this.env.DB.prepare(sql).bind(...b).all()).results || []).map((r) => ({ n: r.name.toUpperCase(), s: r.s }));
    return { week: await q("SELECT u.name, a.wk_best AS s FROM arena a JOIN users u ON u.id = a.uid WHERE a.wk = ? AND a.wk_best > 0 AND u.banned = 0 ORDER BY a.wk_best DESC LIMIT 10", wk),
             all: await q("SELECT u.name, a.best AS s FROM arena a JOIN users u ON u.id = a.uid WHERE a.best > 0 AND u.banned = 0 ORDER BY a.best DESC LIMIT 5") };
  }
  arenaMe(r, now) {
    const lvl = arenaLevel(r.xp), today = etDay(now), yest = etDay(now - 86400000);
    const streak = r.last_day === today || r.last_day === yest ? r.streak : 0;
    return { xp: r.xp, lvl, lo: (lvl - 1) ** 2 * 100, hi: lvl ** 2 * 100, best: r.best, wkBest: r.wk === etWeek(now) ? r.wk_best : 0, played: r.played, wins: r.wins,
             streak, playedToday: r.last_day === today, earnedToday: r.earn_day === today ? r.earned : 0, cap: ARENA.dayCap, colors: unlocked(lvl), color: unlocked(lvl).includes(r.color) ? r.color : "blue",
             next: ARENA.colors.find(([, l]) => l > lvl) || null };
  }
  arenaMatchInfo(now) { const M = this.arenaM; if (!M || now > M.t0 + M.dur + 3000) return null;
    return { id: M.id, seed: M.seed, t0: M.t0, dur: M.dur, now, players: [...M.players.values()].map((p) => ({ n: p.n, c: p.c, sc: p.sc, peer: p.peer, done: p.done })) }; }
  arenaRoomBroadcast(obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === "arena") { try { w.send(s); } catch (e) {} } } }
  async arenaInfo(a, now) {
    const r = await this.arenaRow(a.uid);
    return { ok: true, me: this.arenaMe(r, now), board: await this.arenaBoard(now), match: this.arenaMatchInfo(now) };
  }
  async arenaJoin(ws, a, m, now) {
    if (!a.pres || a.pres.rm !== "arena") return { ok: false, msg: "Head to the SPIT ARENA to play." };
    const r = await this.arenaRow(a.uid), me = this.arenaMe(r, now);
    const color = me.colors.includes(m.color) ? m.color : me.color;
    if (color !== r.color) await this.env.DB.prepare("INSERT INTO arena (uid, color) VALUES (?, ?) ON CONFLICT(uid) DO UPDATE SET color = excluded.color").bind(a.uid, color).run();
    let M = this.arenaM;
    if (!M || now > M.t0 + M.dur - ARENA.lateJoin) {   // start a fresh round with a short countdown
      M = this.arenaM = { id: crypto.randomUUID().slice(0, 8), seed: (Math.random() * 2 ** 31) >>> 0, t0: now + ARENA.countdown, dur: ARENA.dur, players: new Map(), lastCast: 0 };
      this.arenaMs = this.arenaMs || new Map(); this.arenaMs.set(M.id, M);
      for (const [id, old] of this.arenaMs) if (now > old.t0 + old.dur + 120000) this.arenaMs.delete(id);   // forget rounds that ended two minutes ago
    }
    M.players.set(a.uid, { n: a.name, c: (a.pres && a.pres.c) || "twotone", peer: a.peer, sc: 0, color, done: false, joined: Math.max(now, M.t0) });
    a.arm = M.id; a.arc = color; ws.serializeAttachment(a);
    const info = this.arenaMatchInfo(now);
    this.arenaRoomBroadcast({ t: "am", match: info });
    return { ok: true, match: info, me, color };
  }
  // live moves: only between players in the same round. The server stamps who sent it.
  arenaRelay(ws, a, m, now) {
    const M = this.arenaMs && this.arenaMs.get(a.arm); if (!M || now > M.t0 + M.dur + 2000) return;
    const P = M.players.get(a.uid); if (!P) return;
    const raw = JSON.stringify(m); if (raw.length > 900) return;
    // the running score is kept for the wall scoreboard and for placing; it can only go up and never faster than the game allows
    if (Number.isFinite(+m.sc)) { const cap = Math.max(0, (now - P.joined) / 1000) * ARENA.maxRate + 10; P.sc = Math.max(P.sc, Math.min(cap, Math.floor(+m.sc))); }
    const out = JSON.stringify({ ...m, t: "ar", from: a.peer, n: a.name, c: P.c, col: P.color, sc: P.sc });   // server-stamped fields last so nobody can pretend to be someone else
    for (const w of this.sockets()) { if (w === ws) continue; const x = w.deserializeAttachment(); if (x && x.arm === M.id) { try { w.send(out); } catch (e) {} } }
    if (now - M.lastCast > 1500 && M === this.arenaM) { M.lastCast = now; this.arenaRoomBroadcast({ t: "am", match: this.arenaMatchInfo(now) }); }
  }
  async arenaEnd(ws, a, m, now) {
    const M = this.arenaMs && this.arenaMs.get(String(m.mid)); if (!M) return { ok: false, msg: "That round already ended." };
    const P = M.players.get(a.uid); if (!P) return { ok: false, msg: "You weren't in that round." };
    if (P.done) return { ok: false, msg: "Already counted." };
    if (now < M.t0 + M.dur - 2500) return { ok: false, msg: "The round isn't over yet." };
    P.done = true; if (a.arm === M.id) { a.arm = null; ws.serializeAttachment(a); }
    const secs = Math.max(0, (M.t0 + M.dur - P.joined) / 1000);
    const score = Math.max(0, Math.min(Math.floor(+m.score || 0), Math.floor(secs * ARENA.maxRate)));
    P.sc = Math.max(P.sc, score);
    const humans = [...M.players.values()]; const place = 1 + humans.filter((q) => q !== P && q.sc > score).length;
    const r = await this.arenaRow(a.uid), today = etDay(now), yest = etDay(now - 86400000), wk = etWeek(now);
    // daily streak: the first round each day keeps it going (or starts it again)
    const firstToday = r.last_day !== today; const streak = firstToday ? (r.last_day === yest ? r.streak + 1 : 1) : r.streak;
    let earn = Math.min(6, Math.floor(score / 25));
    const bonus = { streak: firstToday ? Math.min(5, streak) : 0, place: humans.length > 1 ? (place === 1 ? 3 : place === 2 ? 1 : 0) : 0 };
    earn += bonus.streak + bonus.place; earn = halfIfEmpty(a, earn);
    const earnedSoFar = r.earn_day === today ? r.earned : 0; earn = Math.max(0, Math.min(earn, ARENA.dayCap - earnedSoFar));
    const xp = r.xp + score + 20 + (humans.length > 1 && place === 1 ? 30 : 0);
    const best = score > r.best, wkBest = r.wk !== wk ? score : Math.max(r.wk_best, score), newWk = r.wk !== wk || score > r.wk_best;
    const win = humans.length > 1 && place === 1 ? 1 : 0;
    await this.env.DB.prepare(`INSERT INTO arena (uid, xp, best, wk, wk_best, played, wins, streak, last_day, earn_day, earned, color) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(uid) DO UPDATE SET xp = excluded.xp, best = MAX(best, excluded.best), wk = excluded.wk, wk_best = excluded.wk_best, played = played + 1, wins = wins + excluded.wins, streak = excluded.streak, last_day = excluded.last_day, earn_day = excluded.earn_day, earned = excluded.earned`)
      .bind(a.uid, xp, score, wk, wkBest, win, streak, today, today, earnedSoFar + earn, r.color || "blue").run();
    const tk = earn ? await this.credit(a.uid, earn, "spit arena") : (await this.user(a.uid)).tk;
    const before = arenaLevel(r.xp), after = arenaLevel(xp);
    const me = this.arenaMe({ ...r, xp, best: Math.max(r.best, score), wk, wk_best: wkBest, streak, last_day: today, earn_day: today, earned: earnedSoFar + earn }, now);
    const board = await this.arenaBoard(now);
    if (best || newWk) this.arenaRoomBroadcast({ t: "ab", board });
    return { ok: true, score, place, players: humans.length, earned: earn, bonus, capped: earnedSoFar + earn >= ARENA.dayCap, best, wkBest: newWk && score > 0, levelUp: after > before ? after : 0,
             newColors: unlocked(after).filter((c) => !unlocked(before).includes(c)), me, board, tk };
  }

  // ---------- dunk tank ----------
  async dunkThrow(a, m, now) {
    const [tx, ty] = DUNK.target;
    if (!this.near(a, "barn", (x, y, p) => p.p !== "sit" && y + 0.5 > ty && Math.max(Math.abs(x + 0.5 - tx), Math.abs(y + 0.5 - ty)) <= 4.6)) return { ok: false, msg: "Step up to the throwing spot in front of the target." };
    if (now - (this.dunkLast && this.dunkLast.get(a.uid) || 0) < DUNK.gap) return { ok: false, msg: "Wait for the ball to land." };
    (this.dunkLast = this.dunkLast || new Map()).set(a.uid, now);
    let tk = await this.debit(a.uid, DUNK.cost, "dunk throw"); if (tk === null) return { ok: false, msg: "A throw costs 1 COIN. Harvest carrots or go fishing to earn some!" };
    const hit = !!m.hit, today = etDay(now);
    const key = "dunk:" + a.uid, D = (await this.ctx.storage.get(key)) || {}; if (D.day !== today) { D.day = today; D.won = 0; D.paid = 0; }
    let won = 0; if (hit) { won = Math.max(0, Math.min(DUNK.prize, DUNK.winCap - D.won)); D.won += won; if (won) tk = await this.credit(a.uid, won, "dunk tank"); }
    await this.ctx.storage.put(key, D);
    // pay the brave llama on the seat (not if it's you)
    let sitter = null;
    if (hit) for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (!x || !x.pres || x.uid === a.uid) continue;
      const p = x.pres; if (p.rm !== "barn" || p.p !== "sit" || Math.floor(p.x) !== DUNK.seat[0] || Math.floor(p.y) !== DUNK.seat[1]) continue;
      sitter = x.name; const k2 = "dunk:" + x.uid, S2 = (await this.ctx.storage.get(k2)) || {}; if (S2.day !== today) { S2.day = today; S2.won = 0; S2.paid = 0; }
      const pay = Math.max(0, Math.min(DUNK.sitPay, DUNK.sitCap - S2.paid)); S2.paid += pay; await this.ctx.storage.put(k2, S2);
      if (pay) { const t2 = await this.credit(x.uid, pay, "dunked"); this.send(w, { t: "tk", tk: t2, msg: `SPLASH! ${a.name} dunked you. +${pay} COIN for being a good sport!` }); }
      break; }
    const ev = { t: "dk", by: a.name, peer: a.peer, hit, sitter };
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === "barn") { try { w.send(JSON.stringify(ev)); } catch (e) {} } }
    return { ok: true, hit, won, capped: hit && !won, tk };
  }

  // ---------- hay bale bowling ----------
  async bowlTable() {
    if (this.bowlReady) return;
    await this.env.DB.prepare("CREATE TABLE IF NOT EXISTS bowl (uid INTEGER PRIMARY KEY, best INTEGER NOT NULL DEFAULT 0, wk TEXT NOT NULL DEFAULT '', wk_best INTEGER NOT NULL DEFAULT 0, games INTEGER NOT NULL DEFAULT 0, strikes INTEGER NOT NULL DEFAULT 0, last_day TEXT NOT NULL DEFAULT '', earn_day TEXT NOT NULL DEFAULT '', earned INTEGER NOT NULL DEFAULT 0)").run();
    this.bowlReady = true;
  }
  async bowlRow(uid) { await this.bowlTable(); return (await this.env.DB.prepare("SELECT * FROM bowl WHERE uid = ?").bind(uid).first()) || { uid, best: 0, wk: "", wk_best: 0, games: 0, strikes: 0, last_day: "", earn_day: "", earned: 0 }; }
  async bowlBoard(now) {
    await this.bowlTable(); const wk = etWeek(now);
    const q = async (sql, ...b) => ((await this.env.DB.prepare(sql).bind(...b).all()).results || []).map((r) => ({ n: r.name.toUpperCase(), s: r.s }));
    return { week: await q("SELECT u.name, b.wk_best AS s FROM bowl b JOIN users u ON u.id = b.uid WHERE b.wk = ? AND b.wk_best > 0 AND u.banned = 0 ORDER BY b.wk_best DESC LIMIT 10", wk),
             all: await q("SELECT u.name, b.best AS s FROM bowl b JOIN users u ON u.id = b.uid WHERE b.best > 0 AND u.banned = 0 ORDER BY b.best DESC LIMIT 5") };
  }
  bowlMe(r, now) { const today = etDay(now);
    return { best: r.best, wkBest: r.wk === etWeek(now) ? r.wk_best : 0, games: r.games, strikes: r.strikes, playedToday: r.last_day === today, earnedToday: r.earn_day === today ? r.earned : 0, cap: LANES.dayCap }; }
  bowlLiveList(now) { const out = []; for (const [uid, L] of this.bowlLive || []) { if (now - L.at > 5 * 60000) { this.bowlLive.delete(uid); continue; } out.push({ n: L.n, c: L.c, sc: L.sc, f: L.f, lane: L.lane }); } return out; }
  bowlLiveDrop(uid) { if (this.bowlLive && this.bowlLive.delete(uid)) this.lanesBroadcast({ t: "bw", live: this.bowlLiveList(Date.now()) }); }
  lanesBroadcast(obj) { const s = JSON.stringify(obj); for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.pres && x.pres.rm === "lanes") { try { w.send(s); } catch (e) {} } } }
  bowlLaneFor(uid) { this.bowlLive = this.bowlLive || new Map(); const cur = this.bowlLive.get(uid); if (cur) return cur.lane;
    const used = new Set([...this.bowlLive.values()].map((L) => L.lane)); for (let i = 0; i < 4; i++) if (!used.has(i)) return i; return uid % 4; }
  async bowlGame(uid, now) { const G = await this.ctx.storage.get("bowl:" + uid); if (!G || now - G.last > LANES.expire) return null; return G; }
  bowlView(G) { const st = bowlState(G.rolls); return { rolls: G.rolls, standing: G.standing, card: bowlScore(G.rolls), frame: st.frame, ball: st.ball, done: st.done, lane: G.lane }; }
  async bowlInfo(a, now) {
    const G = await this.bowlGame(a.uid, now);
    return { ok: true, me: this.bowlMe(await this.bowlRow(a.uid), now), board: await this.bowlBoard(now), live: this.bowlLiveList(now), game: G ? this.bowlView(G) : null };
  }
  async bowlStart(a, now) {
    if (!a.pres || a.pres.rm !== "lanes") return { ok: false, msg: "Head to LLAMA LANES to bowl." };
    const lane = this.bowlLaneFor(a.uid);
    const G = { rolls: [], standing: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1], started: now, last: now - LANES.minGap, lane };
    await this.ctx.storage.put("bowl:" + a.uid, G);
    this.bowlLive.set(a.uid, { n: a.name, c: (a.pres && a.pres.c) || "twotone", sc: 0, f: 1, lane, at: now });
    this.lanesBroadcast({ t: "bw", live: this.bowlLiveList(now) });
    return { ok: true, game: this.bowlView(G) };
  }
  async bowlRoll(a, m, now) {
    const G = await this.bowlGame(a.uid, now); if (!G) return { ok: false, msg: "Start a new game first." };
    if (now - G.last < LANES.minGap) return { ok: false, msg: "Wait for the pins to settle." };
    const st0 = bowlState(G.rolls); if (st0.done) return { ok: false, msg: "That game is over." };
    const throwIn = bowlClamp(m);   // same limits as the page
    const res = bowlSim(throwIn, G.standing);
    const before = G.standing.slice(); const n = res.down.length;
    G.rolls.push(n); G.last = now;
    for (const i of res.down) G.standing[i] = 0;
    const st = bowlState(G.rolls);
    if (!st.done && (st.ball === 0 || st.fresh)) G.standing = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1];   // pinsetter: fresh rack
    const card = bowlScore(G.rolls);
    // what to call it
    const firstBall = st0.ball === 0 || (st0.frame === BOWL_FRAMES - 1 && before.every((v) => v === 1));
    const prev = G.rolls.length > 1 ? G.rolls[G.rolls.length - 2] : null;
    let call = res.gutter ? "GUTTER" : n === 0 ? "MISS" : "";
    if (firstBall && n === 10) call = "STRIKE"; else if (!firstBall && before.filter(Boolean).length === n && n > 0) call = "SPARE";
    const streak = (() => { let k = 0; for (let i = G.rolls.length - 1; i >= 0 && G.rolls[i] === 10; i--) k++; return k; })();
    if (call === "STRIKE" && streak >= 3) call = streak === 3 ? "TURKEY" : streak + " IN A ROW";
    const L = this.bowlLive && this.bowlLive.get(a.uid); if (L) { L.sc = card.total; L.f = Math.min(BOWL_FRAMES, st.frame + 1); L.at = now; }
    this.lanesBroadcast({ t: "bw", live: this.bowlLiveList(now), ev: call && call !== "MISS" ? { n: a.name, call } : null });
    const out = { ok: true, throw: throwIn, before, down: res.down, n, gutter: res.gutter, call, card, rolls: G.rolls, standing: G.standing, frame: st.frame, ball: st.ball, done: st.done };
    if (!st.done) { await this.ctx.storage.put("bowl:" + a.uid, G); return out; }
    // game over: record it and pay coins
    await this.ctx.storage.delete("bowl:" + a.uid); this.bowlLiveDrop(a.uid);
    const total = card.total, strikes = G.rolls.filter((v, i) => v === 10).length;
    const r = await this.bowlRow(a.uid), today = etDay(now), wk = etWeek(now);
    const firstToday = r.last_day !== today;
    let turkeys = 0; { let k = 0; for (const v of G.rolls) { if (v === 10) { k++; if (k === 3) turkeys++; } else k = 0; } }
    // plausibility: a game can't be faster than its rolls allow
    const minMs = (G.rolls.length - 1) * LANES.minGap;
    let earn = now - G.started >= minMs ? Math.min(15, Math.floor(total / 10)) : 0;
    const bonus = { daily: firstToday ? 2 : 0, turkey: turkeys * 3, perfect: total === BOWL_FRAMES * 30 ? 10 : 0 };
    earn += bonus.daily + bonus.turkey + bonus.perfect; earn = halfIfEmpty(a, earn);
    const soFar = r.earn_day === today ? r.earned : 0; earn = Math.max(0, Math.min(earn, LANES.dayCap - soFar));
    const best = total > r.best, wkBest = r.wk !== wk ? total : Math.max(r.wk_best, total), newWk = r.wk !== wk || total > r.wk_best;
    await this.env.DB.prepare(`INSERT INTO bowl (uid, best, wk, wk_best, games, strikes, last_day, earn_day, earned) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?)
      ON CONFLICT(uid) DO UPDATE SET best = MAX(best, excluded.best), wk = excluded.wk, wk_best = excluded.wk_best, games = games + 1, strikes = strikes + excluded.strikes, last_day = excluded.last_day, earn_day = excluded.earn_day, earned = excluded.earned`)
      .bind(a.uid, total, wk, wkBest, strikes, today, today, soFar + earn).run();
    const tk = earn ? await this.credit(a.uid, earn, "bowling") : (await this.user(a.uid)).tk;
    const board = await this.bowlBoard(now);
    if (best || newWk) this.lanesBroadcast({ t: "bb", board });
    this.lanesBroadcast({ t: "bw", live: this.bowlLiveList(now), ev: { n: a.name, call: "FINAL " + total } });
    return { ...out, final: { total, strikes, earned: earn, bonus, capped: soFar + earn >= LANES.dayCap, best, wkBest: newWk && total > 0,
      me: this.bowlMe({ ...r, best: Math.max(r.best, total), wk, wk_best: wkBest, games: r.games + 1, strikes: r.strikes + strikes, last_day: today, earn_day: today, earned: soFar + earn }, now), board, tk } };
  }

  // ---------- staff tools: mods mute, unmute and kick; the owner can also ban, unban and make or remove mods ----------
  // staff can add tokens to a player. Mods: not to themselves, and at most STAFF_GIVE_DAY a day in total. The owner has no limit.
  // take back a token gift: the owner can undo any gift, a mod only their own. Takes back what the player still has (never below 0), once.
  async giftUndo(a, m) {
    const st = await this.staffNow(a); if (!st) return { ok: false, msg: "Only staff can do that." };
    const g = await this.env.DB.prepare("SELECT id, uid, delta, reason FROM ledger WHERE id = ? AND reason LIKE 'staff gift by %'").bind(Math.floor(+m.gid || 0)).first();
    if (!g) return { ok: false, msg: "That gift isn't in the records." };
    const by = g.reason.slice(14);
    if (st !== "owner" && by.toUpperCase() !== String(a.name).toUpperCase()) return { ok: false, msg: "Mods can only undo their own gifts." };
    if (await this.env.DB.prepare("SELECT id FROM ledger WHERE reason LIKE ?").bind("gift undone #" + g.id + " %").first()) return { ok: false, msg: "That gift was already undone." };
    const u = await this.user(g.uid); if (!u) return { ok: false, msg: "That player is gone." };
    const take = Math.max(0, Math.min(g.delta, u.tk));
    const r = await this.env.DB.prepare("UPDATE users SET tk = tk - ? WHERE id = ? AND tk >= ? RETURNING tk").bind(take, u.id, take).first();
    if (!r) return { ok: false, msg: "Their balance changed. Try again." };
    await this.env.DB.prepare("INSERT INTO ledger (uid, delta, reason, t) VALUES (?, ?, ?, ?)").bind(u.id, -take, "gift undone #" + g.id + " by " + a.name, Date.now()).run();
    for (const w2 of this.sockets()) { const x = w2.deserializeAttachment(); if (x && x.uid === u.id) { if (x.uc) { x.uc.tk = r.tk; w2.serializeAttachment(x); } this.send(w2, { t: "tk", tk: r.tk, msg: take ? `A staff token gift of ${take} was taken back.` : "" }); } }
    await this.logStaff(a.name, "undogift", `${u.name.toUpperCase()} ${take}`);
    return { ok: true, msg: take < g.delta ? `Took back ${take} of ${g.delta} TOKENS (that's all ${u.name.toUpperCase()} had left).` : `Took back ${take} TOKENS from ${u.name.toUpperCase()}.` };
  }
  async staffGive(a, target, amount) {
    const n = Math.floor(+amount); if (!(n >= 1 && n <= 1000)) return { ok: false, msg: "Give between 1 and 1000 tokens." };
    if (!/^[A-Za-z0-9_]{3,12}$/.test(target)) return { ok: false, msg: "No player with that name." };
    const u = await this.env.DB.prepare("SELECT id, name, banned FROM users WHERE name = ?").bind(target).first();
    if (!u || u.banned) return { ok: false, msg: "No player named " + target.toUpperCase() };
    if (a.staff !== "owner" && u.id === a.uid) return { ok: false, msg: "Mods can't give tokens to themselves." };
    if (a.staff !== "owner") {
      const since = Date.parse(etDay(Date.now()) + "T00:00:00Z") - 12 * 3600e3;
      const rows = (await this.env.DB.prepare("SELECT delta, t FROM ledger WHERE reason = ? AND t > ?").bind("staff gift by " + a.name, since).all()).results || [];
      const today = rows.filter((r) => etDay(r.t) === etDay(Date.now())).reduce((x, r) => x + r.delta, 0);
      if (today + n > STAFF_GIVE_DAY) return { ok: false, msg: `Mods can give up to ${STAFF_GIVE_DAY} tokens a day. You have ${Math.max(0, STAFF_GIVE_DAY - today)} left today.` };
    }
    const tk = await this.credit(u.id, n, "staff gift by " + a.name);
    for (const w of this.sockets()) { const x = w.deserializeAttachment(); if (x && x.uid === u.id) { if (x.uc) { x.uc.tk = tk; w.serializeAttachment(x); } this.send(w, { t: "tk", tk, msg: `🎁 ${a.name} gave you ${n} TOKENS!` }); } }
    await this.logStaff(a.name, "give", `${u.name.toUpperCase()} ${n}`);
    return { ok: true, msg: `Gave ${u.name.toUpperCase()} ${n} TOKENS.` };
  }
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
    // every token gift by staff, from the permanent ledger (newest first), plus what each mod has given today
    const undone = new Map(); for (const r of ((await this.env.DB.prepare("SELECT reason, delta FROM ledger WHERE reason LIKE 'gift undone #%' ORDER BY id DESC LIMIT 300").all()).results || [])) { const mm = /^gift undone #(\d+) by (\w+)/.exec(r.reason); if (mm) undone.set(+mm[1], { by: mm[2].toUpperCase(), n: -r.delta }); }
    const gifts = ((await this.env.DB.prepare("SELECT l.id, l.delta, l.t, l.reason, u.name FROM ledger l JOIN users u ON u.id = l.uid WHERE l.reason LIKE 'staff gift by %' ORDER BY l.id DESC LIMIT 100").all()).results || [])
      .map((r) => ({ id: r.id, by: r.reason.slice(14).toUpperCase(), to: r.name.toUpperCase(), n: r.delta, t: r.t, undo: undone.get(r.id) || null }));
    const today = {}; for (const g2 of gifts) if (etDay(g2.t) === etDay(Date.now())) today[g2.by] = (today[g2.by] || 0) + g2.n;
    return { ok: true, me: a.staff, online, staff, muted, banned, gifts, giftsToday: today, giftCap: STAFF_GIVE_DAY, log: (await this.ctx.storage.get("modlog")) || [] };
  }
  async admin(a, m) {
    if (!(await this.staffNow(a))) return { ok: false, msg: "Only staff can do that." };
    const now = Date.now(); this.staffRate = this.staffRate || new Map();   // at most 20 staff actions a minute per account
    const sr = (this.staffRate.get(a.uid) || []).filter((t) => now - t < 60000);
    if (sr.length >= 20) return { ok: false, msg: "Slow down. Too many staff actions in a minute." }; sr.push(now); this.staffRate.set(a.uid, sr);
    const cmd = String(m.cmd || ""), target = String(m.target || "").trim();
    if (cmd === "give") return this.staffGive(a, target, m.amount);
    const ownerOnly = ["unban", "mod", "unmod"];   // mods can mute, kick and ban players; only the owner can unban or change mods
    if (![...ownerOnly, "mute", "unmute", "kick", "ban"].includes(cmd) || !/^[A-Za-z0-9_]{3,12}$/.test(target)) return { ok: false, msg: a.staff === "owner" ? "Use /mute, /unmute, /kick, /ban, /unban, /mod or /unmod NAME" : "Use /mute, /unmute, /kick or /ban NAME" };
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
