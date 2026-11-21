// Fast checks that need no server: syntax, mistakes-only lint, and the rules this project never breaks.
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
const root = new URL("..", import.meta.url).pathname;
const read = (p) => readFileSync(root + p, "utf8");
const fails = [];
const check = (name, ok, detail = "") => { if (ok) console.log("  ok   " + name); else { console.log("  FAIL " + name + (detail ? "  -> " + detail : "")); fails.push(name); } };

export function runStatic() {
  console.log("Static checks");
  const worker = read("src/worker.js"), game = read("public/js/game.js"), net = read("public/js/net.js"), html = read("public/play.html"), home = read("public/index.html") + read("public/js/site.js") + read("public/css/site.css"), css = read("public/css/game.css"), headers = read("public/_headers");

  // 1. every script parses
  for (const f of ["src/worker.js", "public/js/game.js", "public/js/net.js"]) {
    let ok = true, msg = ""; try { execFileSync(process.execPath, ["--check", root + f], { stdio: "pipe" }); } catch (e) { ok = false; msg = String(e.stderr || e).split("\n").slice(0, 4).join(" "); }
    check("syntax: " + f, ok, msg);
  }
  // 2. lint for real mistakes (misspelled names, duplicate keys or cases, unreachable code)
  { let ok = true, msg = ""; const bin = root + "node_modules/eslint/bin/eslint.js";
    if (!existsSync(bin)) console.log("  skip lint (eslint is not installed)");
    else { try { execFileSync(process.execPath, [bin, "public/js", "src", "tests"], { cwd: root, stdio: "pipe" }); } catch (e) { ok = false; msg = String(e.stdout || e).trim().split("\n").slice(0, 12).join("\n        "); }
      check("lint: no undefined names, duplicate keys or dead code", ok, msg); } }
  // 3. the page and the server agree on the version
  { const a = (net.match(/const GAME_VERSION = "([^"]+)"/) || [])[1], b = (worker.match(/const VERSION = "([^"]+)"/) || [])[1];
    check("version: page and server match (" + a + ")", !!a && a === b, `page ${a}, server ${b}`); }
  // 4. SECURITY: nobody can make themselves staff
  { const sets = worker.match(/SET role[^"`]*/g) || [];
    check("security: exactly one place changes users.role", sets.length === 1, String(sets.length));
    check("security: that change can never touch an admin row", sets.every((s) => /role != 'admin'/.test(s)));
    check("security: nothing writes role 'admin'", !/SET role = 'admin'|role\s*=\s*\?[^;]*bind\(\s*"admin"/.test(worker) && !/"admin"\s*:\s*"player"/.test(worker));
    check("security: role changes are owner-only", /const ownerOnly = \[[^\]]*"mod", "unmod"[^\]]*\]/.test(worker) && /ownerOnly\.includes\(cmd\) && a\.staff !== "owner"/.test(worker));
    check("badges: only staff can give VIP, and FIRST 50 has no way to be handed out", /"vip", "unvip"\]\.includes\(cmd\)/.test(worker) && (worker.match(/SET founder/g) || []).length === 2 && /if \(bg && !staff\) o\.bg = bg; else delete o\.bg;/.test(worker));
    check("security: staff powers need a second login step", /const staffRole = \(env, u\) => \(tfaOn\(env, u\) \? baseRole\(env, u\) : ""\);/.test(worker) && /const tfaOn = \(env, u\) => !!\(u && \(u\.pk_on \|\| em2On\(env, u\)\)\);/.test(worker));
    check("security: email login codes are mods only, need a confirmed email, and pause after a reset or email change", /const em2On = \(env, u\) => !!\(u && u\.em2 && u\.email && u\.email_ok && mailOn\(env\) && baseRole\(env, u\) === "mod" && !\(u\.em2_hold > Date\.now\(\)\)\);/.test(worker));
    check("security: the server stamps name, tokens and staff badge on presence", /o\.n = name; o\.tk = tk; if \(staff\) o\.st = staff; else delete o\.st;/.test(worker));
    check("security: owner checks on health, bug reports and backups", ["health(a)", "healthClear(a)", "bugList(a)"].every((fn) => new RegExp("async " + fn.replace(/[()]/g, "\\$&") + "[^\\n]*\\n?[^\\n]*!== \"owner\"").test(worker))); }
  // 5. SECURITY: page hardening
  check("security: no inline scripts in the page", !/<script(?![^>]*\bsrc=)[^>]*>/.test(html));
  check("security: no inline event handlers", !/\son[a-z]+\s*=\s*["']/.test(html));
  check("security: the home page has no inline scripts or handlers", !/<script(?![^>]*\bsrc=)[^>]*>/.test(home) && !/\son[a-z]+\s*=\s*["']/.test(home));
  check("satire disclaimer is on the home page and the login screen", /SATIRE WARNING/.test(home) && /id="au_disc"[^>]*>SATIRE WARNING/.test(html));
  check("offensive language warning is on the home page, the login screen and in the Terms", /not filtered and can contain offensive language/.test(home) && /not filtered and can contain offensive language/.test(html) && /Chat is not filtered/.test(read("public/terms.html")));
  check("names and room names are still checked", /nameOk\(text\) \{[^\n]*hasSlur\(text\)/.test(worker) && /WF\.nameOk\(name\)/.test(worker));
  check("security: the home page never stores a password", !/localStorage|document\.cookie/.test(home));
  check("security: content policy only runs the game's own scripts", /script-src 'self'/.test(headers) && /frame-ancestors 'none'/.test(headers) && /object-src 'none'/.test(headers));
  check("security: no eval or new Function", !/\beval\(|new Function\(/.test(game + net + worker));
  // 6. house rules
  for (const [n, t] of [["game.js", game], ["net.js", net], ["play.html", html], ["home page", home], ["game.css", css]]) check("style: no em dashes in " + n, !t.includes("—"));
  // 7. every art file the game points at exists
  { const want = [...new Set((game.match(/\/art\/[a-z0-9]+\.png/g) || []))], have = new Set(existsSync(root + "public/art") ? readdirSync(root + "public/art") : []);
    check(`assets: all ${want.length} art files exist`, want.length > 0 && want.every((w) => have.has(w.slice(5))), want.filter((w) => !have.has(w.slice(5))).join(", ")); }
  // 8. every action the page sends exists on the server
  { const cases = new Set([...worker.matchAll(/case "([a-z_0-9]+)"/g)].map((m) => m[1]));
    const sent = new Set([...game.matchAll(/NET\.act\('([a-z_0-9]+)'/g)].map((m) => m[1]));
    const missing = [...sent].filter((a) => !cases.has(a));
    check(`actions: all ${sent.size} actions the page sends exist on the server`, missing.length === 0, missing.join(", ")); }
  return fails;
}
if (import.meta.url === "file://" + process.argv[1]) { const f = runStatic(); if (f.length) { console.log(`\n${f.length} static check(s) failed.`); process.exit(1); } console.log("\nAll static checks passed."); }
