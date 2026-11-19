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
