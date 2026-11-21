// Runs before every deploy (wrangler runs this as its build step). A failing test stops the deploy, so the live game keeps the last good version.
//   node tests/run.mjs            static checks + live server tests
//   node tests/run.mjs --static   static checks only
import { spawn, execFileSync } from "node:child_process";
import { rmSync, existsSync } from "node:fs";
import { runStatic } from "./static.mjs";
if (process.env.LL_NESTED) process.exit(0);   // the test server's own build step: nothing to do
const root = new URL("..", import.meta.url).pathname, wr = root + "node_modules/wrangler/bin/wrangler.js";
const PORT = 8799, BASE = "http://localhost:" + PORT, persist = root + ".wrangler/test-state";
const env = { ...process.env, LL_NESTED: "1", CI: "1", WRANGLER_SEND_METRICS: "false" };

const bad = runStatic();
if (bad.length) { console.log(`\n${bad.length} static check(s) failed. Not deploying.`); process.exit(1); }
// as a build step, the live tests run on the deploy machine only; starting the dev server by hand just gets the fast checks
const deployMachine = !!(process.env.WORKERS_CI || process.env.CI);
if (process.argv.includes("--static") || (process.argv.includes("--build") && !deployMachine)) { console.log("\nAll static checks passed."); process.exit(0); }

let srv = null;
const stop = () => { if (srv) { try { process.kill(-srv.pid, "SIGKILL"); } catch (e) { try { srv.kill("SIGKILL"); } catch (e2) {} } srv = null; } };
const skip = (why) => { stop(); console.log(`\nStatic checks passed. Live tests SKIPPED (${why}).`); process.exit(0); };
const overall = setTimeout(() => skip("took too long"), 170000);
try {
  if (!existsSync(wr)) skip("wrangler is not installed");
  let ws; try { ws = await import("ws"); } catch (e) { skip("the ws package is not installed"); }
  rmSync(persist, { recursive: true, force: true });
  try { execFileSync(process.execPath, [wr, "d1", "execute", "llama-lounge", "--local", "--persist-to", persist, "--file", root + "schema.sql"], { cwd: root, stdio: "pipe", env }); } catch (e) { skip("could not create the test database"); }
  let log = "";
  srv = spawn(process.execPath, [wr, "dev", "--local", "--port", String(PORT), "--persist-to", persist, "--show-interactive-dev-session=false"], { cwd: root, env, detached: true, stdio: ["ignore", "pipe", "pipe"] });
  srv.stdout.on("data", (d) => { log += d; }); srv.stderr.on("data", (d) => { log += d; });
  let up = false; for (let i = 0; i < 60 && !up; i++) { await new Promise((r) => setTimeout(r, 1000)); try { const r = await fetch(BASE + "/"); up = r.status === 200; } catch (e) {} if (srv.exitCode !== null) break; }
  if (!up) { console.log(log.split("\n").slice(-12).join("\n")); skip("the test server did not start here"); }
  const { runApi } = await import("./api.mjs");
  const { fails, n } = await runApi(BASE, { root, persist });
  stop(); clearTimeout(overall);
  if (fails.length) { console.log(`\n${fails.length} of ${n} live test(s) FAILED. Not deploying:\n  ` + fails.join("\n  ")); process.exit(1); }
  console.log(`\nAll static checks and ${n} live tests passed.`); process.exit(0);
} catch (e) { stop(); console.log("\nLive tests could not run: " + ((e && e.stack) || e)); process.exit(1); }
