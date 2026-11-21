// Live tests against a local copy of the server: accounts, the realtime room, per-room movement, and the security rules.
import WebSocket from "ws";
import { execFileSync } from "node:child_process";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function runApi(BASE, { root, persist }) {
  const fails = []; let n = 0;
  const check = (name, ok, detail = "") => { n++; if (ok) console.log("  ok   " + name); else { console.log("  FAIL " + name + (detail ? "  -> " + String(detail).slice(0, 300) : "")); fails.push(name); } };
  const post = async (path, body, cookie) => { const r = await fetch(BASE + path, { method: "POST", headers: { "content-type": "application/json", origin: BASE, ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body || {}) });
    let j = {}; try { j = await r.json(); } catch (e) {} const sc = r.headers.get("set-cookie"); return { status: r.status, j, cookie: sc ? sc.split(";")[0] : null }; };
  const sql = (q) => execFileSync(process.execPath, [root + "node_modules/wrangler/bin/wrangler.js", "d1", "execute", "llama-lounge", "--local", "--persist-to", persist, "--command", q], { cwd: root, stdio: "pipe", env: { ...process.env, LL_NESTED: "1" } });

  class Client {
    constructor(name, cookie) { this.name = name; this.cookie = cookie; this.msgs = []; this.rid = 0; this.wait = new Map(); }
    connect() { return new Promise((res, rej) => { const ws = new WebSocket(BASE.replace("http", "ws") + "/ws", { headers: { cookie: this.cookie, origin: BASE } }); this.ws = ws;
      ws.on("message", (d) => { let m; try { m = JSON.parse(String(d)); } catch (e) { return; } this.msgs.push(m);
        if (m.t === "hello") { this.peer = m.peer; res(this); } if (m.t === "res" && this.wait.has(m.id)) { this.wait.get(m.id)(m); this.wait.delete(m.id); } });
      ws.on("error", rej); ws.on("unexpected-response", (rq, rs) => rej(new Error("HTTP " + rs.statusCode))); setTimeout(() => rej(new Error("no hello")), 8000); }); }
    act(a, data = {}) { return new Promise((res) => { const id = ++this.rid; this.wait.set(id, res); this.ws.send(JSON.stringify({ ...data, t: "act", a, id })); setTimeout(() => { if (this.wait.has(id)) { this.wait.delete(id); res({ ok: false, msg: "TIMEOUT" }); } }, 9000); }); }
    pres(p) { this.p = { c: "twotone", x: 1.5, y: 10.5, d: "fr", p: "stand", rm: "lounge", ...(this.p || {}), ...p }; this.ws.send(JSON.stringify({ t: "p", p: this.p })); }
    mark() { this.from = this.msgs.length; }
    seen(peer) { const out = []; for (const m of this.msgs.slice(this.from || 0)) if (m.t === "peers") for (const k of ["joined", "updated"]) for (const e of m[k] || []) if (e.peer === peer) out.push(e.presence); return out; }
    close() { try { this.ws.close(); } catch (e) {} }
  }
  const tag = Date.now().toString(36).slice(-5);
  const names = { a: "ta_" + tag, b: "tb_" + tag, c: "tc_" + tag, o: "to_" + tag };

  console.log("Accounts");
  check("signup refuses a bad name", (await post("/api/signup", { u: "x", p: "longenough1", e: "x@example.com", t: 1 })).status === 400);
  check("signup refuses a short password", (await post("/api/signup", { u: "okname", p: "short", e: "y@example.com", t: 1 })).status === 400);
  check("signup refuses without agreeing to the terms", (await post("/api/signup", { u: "okname", p: "longenough1", e: "y@example.com" })).status === 400);
  const cookies = {};
  for (const k of Object.keys(names)) { const r = await post("/api/signup", { u: names[k], p: "testpass123", e: names[k] + "@example.com", t: 1 }); cookies[k] = r.cookie; if (r.status !== 200) check("signup " + names[k], false, JSON.stringify(r.j)); }
  check("signup makes accounts with a session", Object.values(cookies).every(Boolean));
  check("signup refuses a name that is taken", (await post("/api/signup", { u: names.a, p: "testpass123", e: "other" + tag + "@example.com", t: 1 })).status === 409);
  check("login refuses a wrong password", (await post("/api/login", { u: names.a, p: "wrongpass999" })).status === 401);
  { const r = await post("/api/login", { u: names.a, p: "testpass123" }); check("login works with the right password", r.status === 200 && !!r.cookie); }

  console.log("Connecting");
  { let code = 0; try { await new Client("anon", "s=bogus").connect(); } catch (e) { code = +String(e.message).replace("HTTP ", ""); } check("the room refuses a visitor who is not logged in", code === 401, code); }
  { let err = ""; try { await new Promise((res, rej) => { const ws = new WebSocket(BASE.replace("http", "ws") + "/ws", { headers: { cookie: cookies.a, origin: "https://evil.example" } }); ws.on("open", () => { ws.close(); res(); }); ws.on("unexpected-response", (q, s) => rej(new Error("HTTP " + s.statusCode))); ws.on("error", rej); }); } catch (e) { err = e.message; }
    check("the room refuses a connection from another website", err === "HTTP 403", err); }
  // staff roles come only from the database
  sql(`UPDATE users SET role='admin' WHERE name='${names.o}'; UPDATE users SET role='mod' WHERE name='${names.c}';`);
  const A = await new Client(names.a, cookies.a).connect(), B = await new Client(names.b, cookies.b).connect(), C = await new Client(names.c, cookies.c).connect(), O = await new Client(names.o, cookies.o).connect();
  check("four llamas connect", [A, B, C, O].every((x) => x.peer));

  console.log("Movement is per room");
  A.pres({ rm: "lounge" }); B.pres({ rm: "lounge" }); C.pres({ rm: "barn" }); O.pres({ rm: "barn" }); await sleep(500);
  B.mark(); C.mark();
  for (let i = 0; i < 5; i++) { A.pres({ x: 2.5 + i, y: 9.5 }); await sleep(40); }
  await sleep(400);
  { const b = B.seen(A.peer), c = C.seen(A.peer);
    check("a llama in the same room sees the walk", b.length > 0 && b[b.length - 1].x === 6.5, JSON.stringify(b.slice(-1)));
    check("steps are bundled (fewer messages than steps)", b.length < 5, b.length);
    check("a llama in another room gets none of the steps", c.length === 0, c.length); }
  C.mark(); A.pres({ s: { k: 1, t: "hello from the lounge" } }); await sleep(300);
  check("chat still reaches every room", C.seen(A.peer).some((p) => p.s && p.s.t === "hello from the lounge"));
  C.mark(); A.pres({ x: 8.5, y: 4.5 }); await sleep(300); C.pres({ rm: "lounge" }); await sleep(400);
  { const c = C.seen(A.peer); check("walking into a room shows everyone where they really are", c.length > 0 && c[c.length - 1].x === 8.5 && c[c.length - 1].y === 4.5, JSON.stringify(c.slice(-1))); }

  console.log("Nobody can fake who they are");
  B.mark(); A.pres({ n: "OWNER", tk: 999999, st: "owner", w: { hat: "crown" }, s: { k: 2, t: "i am the owner" } }); await sleep(300);
  { const p = B.seen(A.peer).pop() || {};
    check("a faked name is replaced by the real one", p.n === names.a.toUpperCase(), p.n);
    check("faked tokens are replaced by the real balance", p.tk === 10, p.tk);
    check("a faked staff badge is removed", !p.st, p.st);
    check("unowned clothes are not shown", !p.w || !p.w.hat, JSON.stringify(p.w)); }
  B.mark(); O.pres({ rm: "lounge", s: { k: 1, t: "owner here" } }); await sleep(300);
  check("the real owner does get the owner badge", (B.seen(O.peer).pop() || {}).st === "owner");

  console.log("Players cannot use staff powers");
  for (const cmd of ["mod", "unmod", "ban", "unban", "mute", "kick", "pkreset", "give"]) { const r = await A.act("admin", { cmd, target: names.b, amount: 500, hours: 1 }); check(`player: /${cmd} is refused`, r.ok === false, JSON.stringify(r)); }
  for (const act of ["dash", "health", "health_clear", "bug_list", "err_list", "err_clear", "report_list", "backup_list", "backup_now", "dash_chat"]) { const r = await A.act(act, {}); check(`player: ${act} is refused`, r.ok === false, JSON.stringify(r).slice(0, 120)); }
  await sleep(2100);   // let the action allowance refill
  check("a player is still a player afterwards", !String(sqlOut(sql(`SELECT role FROM users WHERE name='${names.a}'`))).includes("mod") );
  check("the target was not muted or banned", /"muted": 0/.test(sqlOut(sql(`SELECT muted, banned FROM users WHERE name='${names.b}'`))) );

  console.log("Mods are limited, the owner is not");
  { const r = await C.act("admin", { cmd: "mod", target: names.a }); check("mod: cannot make someone a mod", r.ok === false); }
  { const r = await C.act("admin", { cmd: "mute", target: names.o }); check("mod: cannot moderate the owner", r.ok === false); }
  { const r = await C.act("health"); check("mod: cannot see server health", r.ok === false); }
  { const r = await C.act("bug_list"); check("mod: cannot see bug reports", r.ok === false); }
  { const r = await C.act("dash"); check("mod: can open the dashboard", r.ok === true, JSON.stringify(r).slice(0, 120)); }
  { const r = await C.act("admin", { cmd: "mute", target: names.b }); check("mod: can mute a player", r.ok === true, r.msg); await C.act("admin", { cmd: "unmute", target: names.b }); }
  { const r = await O.act("health"); check("owner: sees server health", r.ok === true && r.now && r.now.online >= 4, JSON.stringify(r).slice(0, 160)); }
  await A.act("bug_report", { text: "test bug " + tag, room: "lounge", ver: "t", ua: "t", scr: "1x1" });
  { const r = await O.act("bug_list"); check("owner: sees the bug a player sent", r.ok === true && r.bugs.some((b) => b.text === "test bug " + tag)); }
  await sleep(2100);

  console.log("Tokens only change on the server");
  { const r = await A.act("furn_buy", { item: "plot" }); check("cannot buy what you cannot afford", r.ok === false, JSON.stringify(r)); }
  { const r = await A.act("furn_buy", { item: "plot", price: 0, tk: 99999 }); check("cannot name your own price", r.ok === false); }
  { const r = await A.act("no_such_action"); check("an unknown action is refused", r.ok === false); }
  check("balance is unchanged and never negative", /"tk": 10\b/.test(sqlOut(sql(`SELECT tk FROM users WHERE name='${names.a}'`))));

  console.log("Flood limits");
  await sleep(2100);
  { const rs = await Promise.all(Array.from({ length: 30 }, () => B.act("who", { n: names.a }))); const slow = rs.filter((r) => /Slow down/.test(r.msg || "")).length;
    check("a burst of actions gets slowed down", slow >= 4 && slow < 30, slow); }
  await sleep(2100);
  { const r = await B.act("who", { n: names.a }); check("and works again a moment later", r.ok === true, JSON.stringify(r).slice(0, 100)); }

  for (const x of [A, B, C, O]) x.close();
  return { fails, n };
}
function sqlOut(buf) { return String(buf); }
