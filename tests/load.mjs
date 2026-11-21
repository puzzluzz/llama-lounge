// Load test: bot llamas log in to a throwaway local server, walk and chat like players, and we measure what the server sends and how fast it answers.
//   node tests/load.mjs 50 100 200        (player counts to try; 20 seconds each)
// It runs against a local copy only. It never touches the live game.
import WebSocket from "ws";
import { spawn, execFileSync } from "node:child_process";
import { rmSync, writeFileSync } from "node:fs";
import { createHash, randomBytes } from "node:crypto";
const root = new URL("..", import.meta.url).pathname, wr = root + "node_modules/wrangler/bin/wrangler.js";
const PORT = 8798, BASE = "http://localhost:" + PORT, persist = root + ".wrangler/load-state";
const env = { ...process.env, LL_NESTED: "1", CI: "1", WRANGLER_SEND_METRICS: "false" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const sizes = process.argv.slice(2).map(Number).filter((n) => n > 0); if (!sizes.length) sizes.push(50, 100, 200);
const SECS = +process.env.LL_SECS || 20, MAXN = Math.max(...sizes);
const ROOMS = ["lounge", "lounge", "lounge", "barn", "casino", "arena", "lanes", "store", "gym", "cove", "jungle", "lounge"];   // a third of everyone in the lounge, the rest spread out

rmSync(persist, { recursive: true, force: true });
execFileSync(process.execPath, [wr, "d1", "execute", "llama-lounge", "--local", "--persist-to", persist, "--file", root + "schema.sql"], { cwd: root, stdio: "pipe", env });
const srv = spawn(process.execPath, [wr, "dev", "--local", "--port", String(PORT), "--persist-to", persist, "--show-interactive-dev-session=false"], { cwd: root, env, detached: true, stdio: "ignore" });
const stop = () => { try { process.kill(-srv.pid, "SIGKILL"); } catch (e) {} };
process.on("exit", stop); process.on("SIGINT", () => { stop(); process.exit(1); });
let up = false; for (let i = 0; i < 60 && !up; i++) { await sleep(1000); try { up = (await fetch(BASE + "/")).status === 200; } catch (e) {} }
if (!up) { console.log("The local server did not start."); process.exit(1); }
await fetch(BASE + "/api/me", { headers: { origin: BASE } });   // makes the server add its newer columns
// bot accounts and sessions go straight into the throwaway database (signing up 400 llamas would hit the sign-up limit)
{ const now = Date.now(); let sql = ""; const toks = [];
  for (let i = 0; i < MAXN; i++) { const tok = randomBytes(32).toString("base64url"); toks.push(tok);
    sql += `INSERT INTO users (id, name, salt, hash, iters, created, tk, c, agreed) VALUES (${1000 + i}, 'bot${i}', 'x', 'x', 1, ${now}, 10, 'twotone', 9);\n`;
    sql += `INSERT INTO sessions (token_hash, uid, expires) VALUES ('${createHash("sha256").update(tok).digest("hex")}', ${1000 + i}, ${now + 864e5});\n`; }
  writeFileSync(persist + "-seed.sql", sql);
  execFileSync(process.execPath, [wr, "d1", "execute", "llama-lounge", "--local", "--persist-to", persist, "--file", persist + "-seed.sql"], { cwd: root, stdio: "pipe", env });
  globalThis.TOKS = toks; }

class Bot {
  constructor(i) { this.i = i; this.rm = ROOMS[i % ROOMS.length]; this.x = 2 + (i * 7) % 8; this.y = 2 + (i * 3) % 7; this.k = 0; this.rid = 0; this.wait = new Map(); this.in = 0; this.inBytes = 0; this.moves = 0; this.out = 0; this.lat = []; this.actLat = []; this.fail = 0; this.seenK = new Map(); }
  connect() { return new Promise((res) => { const ws = new WebSocket(BASE.replace("http", "ws") + "/ws", { headers: { cookie: "ll_s=" + globalThis.TOKS[this.i], origin: BASE } }); this.ws = ws; let done = false;
    ws.on("message", (d) => { const s = String(d); this.in++; this.inBytes += s.length; if (s.charCodeAt(6) === 112 && !s.includes('"t:')) return;   /* a movement bundle with no chat in it: counted, not parsed (keeps the bots themselves from being the slow part) */ let m; try { m = JSON.parse(s); } catch (e) { return; }
      if (m.t === "hello" && !done) { done = true; res(true); }
      if (m.t === "res" && this.wait.has(m.id)) { this.actLat.push(Date.now() - this.wait.get(m.id)); this.wait.delete(m.id); if (!m.ok) this.fail++; }
      if (m.t === "peers") for (const e of m.updated || []) { this.moves++; const t = e.presence && e.presence.s && e.presence.s.t; if (t && t.startsWith("t:") && this.seenK.get(e.peer) !== e.presence.s.k) { this.seenK.set(e.peer, e.presence.s.k); const ts = +t.slice(2); if (ts > this.since) this.lat.push(Date.now() - ts); } } });
    ws.on("error", () => { if (!done) { done = true; res(false); } }); ws.on("close", () => { this.closed = true; }); setTimeout(() => { if (!done) { done = true; res(false); } }, 15000); }); }
  pres(extra) { if (this.closed) return; this.out++; this.ws.send(JSON.stringify({ t: "p", p: { c: "twotone", x: this.x + 0.5, y: this.y + 0.5, d: "fr", p: "stand", rm: this.rm, ...(this.s ? { s: this.s } : {}), ...extra } })); }
  step() { const dx = Math.random() < 0.5 ? 1 : -1, ax = Math.random() < 0.5; if (ax) this.x = Math.max(1, Math.min(10, this.x + dx)); else this.y = Math.max(1, Math.min(9, this.y + dx)); this.pres(); }
  chat() { this.s = { k: ++this.k, t: "t:" + Date.now() }; this.pres(); }
  act() { if (this.closed) return; const id = ++this.rid; this.wait.set(id, Date.now()); this.out++; this.ws.send(JSON.stringify({ t: "act", a: "who", n: "bot" + ((this.i + 1) % MAXN), id })); }
}
const pct = (a, p) => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(s.length * p))]; };
console.log(`\nLoad test: ${SECS} seconds at each size. Bots walk about a third of the time (10 steps a second while walking), chat every 20 to 40 seconds and do an action every 10 seconds.\n`);
console.log("players | connected | steps/s (all) | messages each player got/s | before today | chat delay ms (typical / worst 1%) | action reply ms (typical / worst 1%) | unanswered");
const bots = []; const rows = [];
for (const N of sizes) {
  while (bots.length < N) { const batch = []; for (let j = 0; j < 25 && bots.length < N; j++) { const b = new Bot(bots.length); bots.push(b); batch.push(b.connect().then((ok) => { b.ok = ok; if (ok) b.pres(); })); } await Promise.all(batch); }
  const live = bots.filter((b) => b.ok && !b.closed); await sleep(1500);
  for (const b of live) { b.in = 0; b.inBytes = 0; b.moves = 0; b.out = 0; b.lat = []; b.actLat = []; b.fail = 0; b.since = Date.now(); b.walking = Math.random() < 0.33; b.nextChat = Date.now() + 2000 + Math.random() * 30000; b.nextAct = Date.now() + Math.random() * 10000; }
  let steps = 0; const t0 = Date.now();
  const tick = setInterval(() => { const now = Date.now(); for (const b of live) { if (Math.random() < (b.walking ? 0.04 : 0.02)) b.walking = !b.walking;   /* walking a third of the time, in bursts of a few seconds */ if (b.walking) { b.step(); steps++; } if (now > b.nextChat) { b.chat(); b.nextChat = now + 20000 + Math.random() * 20000; } if (now > b.nextAct) { b.act(); b.nextAct = now + 10000; } } }, 100);
  await sleep(SECS * 1000); clearInterval(tick); await sleep(1500);
  const secs = (Date.now() - t0 - 1500) / 1000, alive = live.filter((b) => !b.closed);
  const lat = live.flatMap((b) => b.lat), al = live.flatMap((b) => b.actLat), pending = live.reduce((a, b) => a + b.wait.size, 0);
  const perPlayer = live.reduce((a, b) => a + b.in, 0) / live.length / secs, oldWay = steps / secs;   // before today every step went to every player
  const row = { N, ok: alive.length, stepsPerSec: Math.round(steps / secs), perPlayer: Math.round(perPlayer), oldWay: Math.round(oldWay), chat50: pct(lat, 0.5), chat99: pct(lat, 0.99), act50: pct(al, 0.5), act99: pct(al, 0.99), lost: pending };
  rows.push(row);
  console.log(`${String(N).padStart(7)} | ${String(row.ok).padStart(9)} | ${String(row.stepsPerSec).padStart(12)} | ${String(row.perPlayer).padStart(25)} | ${String(row.oldWay).padStart(16)} | ${(row.chat50 + " / " + row.chat99).padStart(34)} | ${(row.act50 + " / " + row.act99).padStart(36)} | ${row.lost}`);
}
for (const b of bots) { try { b.ws.close(); } catch (e) {} }
stop(); process.exit(0);
