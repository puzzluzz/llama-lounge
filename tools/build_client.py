#!/usr/bin/env python3
"""Build public/index.html for the Cloudflare version of Llama Lounge.

Takes the artifact game files (head2.html, sprites_world.js, helpers_bg_furn.js, tail2.js)
and swaps the Claude-specific pieces (room/db/user capabilities, device wallet) for:
  - a username/password login screen
  - a WebSocket connection to the game server
  - server-decided tokens and payouts
"""
import re, sys, pathlib

SRC = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else '/home/claude/llama')
OUT = pathlib.Path(__file__).resolve().parent.parent / 'public' / 'index.html'

head = (SRC / 'head2.html').read_text()
world = (SRC / 'sprites_world.js').read_text()
helpers = (SRC / 'helpers_bg_furn.js').read_text()
tail = (SRC / 'tail2.js').read_text()

def rep(s, a, b, n=1):
    c = s.count(a)
    assert c == n, f'expected {n} of {a[:70]!r}, found {c}'
    return s.replace(a, b)

def replace_func(s, header, new):
    """Replace a whole top-level function (header up to its matching closing brace)."""
    i = s.index(header)
    j = s.index('{', i)
    depth = 0; k = j
    while True:
        ch = s[k]
        if ch == '{': depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0: break
        k += 1
    return s[:i] + new + s[k + 1:]

# ---------------------------------------------------------------- head: login screen + network layer
AUTH_HTML = '''  <div id="auth" class="gb">
    <div class="rt">🦙 <b>LLAMA LOUNGE</b></div>
    <div id="au_sub">LOG IN OR MAKE A NEW LLAMA ACCOUNT</div>
    <form id="au_form" autocomplete="on">
      <label>NAME<input id="au_u" name="username" autocomplete="username" maxlength="12" spellcheck="false" autocapitalize="off"></label>
      <label>PASSWORD<input id="au_p" name="password" type="password" autocomplete="current-password" maxlength="72"></label>
      <div id="au_err"></div>
      <div class="srow"><button class="gbbtn y" id="au_login" type="submit">LOG IN</button><button class="gbbtn" id="au_signup" type="button">SIGN UP</button></div>
    </form>
    <div class="aunote">Names: 3 to 12 letters or numbers. Passwords: 8+ characters, stored encrypted. Don't reuse a password from another site.</div>
  </div>
'''
AUTH_CSS = '''  #auth{left:50%;top:50%;transform:translate(-50%,-50%);display:none;z-index:6;width:min(calc(100% - 16px),calc(var(--px)*230px));text-align:center}
  #auth .rt{font-size:calc(var(--px)*9px);margin-bottom:calc(var(--px)*4px)} #auth .rt b{color:#c03070}
  #au_sub{font-size:calc(var(--px)*5px);color:#3858a8;margin-bottom:calc(var(--px)*6px)}
  #auth label{display:block;text-align:left;font-size:calc(var(--px)*6px);margin:calc(var(--px)*4px) 0}
  #auth input{display:block;width:100%;box-sizing:border-box;margin-top:calc(var(--px)*2px);font-family:'Press Start 2P',monospace;font-size:max(16px,calc(var(--px)*7px));padding:calc(var(--px)*4px);border:calc(var(--px)*1px) solid var(--ink);background:#fff}
  #au_err{min-height:calc(var(--px)*10px);color:#e02838;font-size:calc(var(--px)*5px);line-height:calc(var(--px)*8px)}
  #auth .srow{display:flex;justify-content:center;gap:calc(var(--px)*6px);margin-top:calc(var(--px)*4px)}
  #auth .gbbtn.y{background:#f8d030}
  .aunote{margin-top:calc(var(--px)*6px);font-size:calc(var(--px)*4.5px);line-height:calc(var(--px)*7px);color:#6a5a9a}
  #kicked{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(16,12,28,.85);color:#fff;z-index:9;text-align:center;padding:20px;font-size:12px;line-height:20px}
'''
NET_JS = r'''<script>
// ======================= NETWORK: talks to the Llama Lounge server =======================
// Presents the same room API the game was written against (presence + peer updates),
// plus NET.act() for anything that changes tokens. The server decides every payout.
const NET = {
  ws:null, peer:null, rid:0, wait:new Map(), peersCb:null, known:new Set(), handlers:{}, ready:false, closedForGood:false,
  connect(){
    if (this.ws && this.ws.readyState<2) return;
    const ws = new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws'); this.ws=ws;
    ws.onmessage = e => { let m; try { m=JSON.parse(e.data); } catch(_){ return; } this.onmsg(m); };
    ws.onclose = ev => { this.ready=false; for (const [id,res] of this.wait) res({ok:false,msg:'Connection lost, reconnecting...'}); this.wait.clear();
      if (ev.code===4003 || this.closedForGood) return; setTimeout(()=>this.connect(), 2000); };
  },
  send(o){ if (this.ws && this.ws.readyState===1) this.ws.send(JSON.stringify(o)); },
  act(a, data={}){ return new Promise(res=>{ if (!this.ready){ res({ok:false,msg:'Still connecting, try again in a second.'}); return; }
    const id=++this.rid; this.wait.set(id,res); this.send({...data, t:'act', a, id});
    setTimeout(()=>{ if (this.wait.has(id)){ this.wait.delete(id); res({ok:false,msg:'The server took too long, try again.'}); } }, 9000); }); },
  fix(p){ return {peer:p.peer, isMe:false, sameTab:false, kind:'viewer', presence:p.presence||{}}; },
  onmsg(m){
    if (m.t==='hello'){
      const gone=[...this.known].filter(id=>!m.peers.some(p=>p.peer===id)).map(id=>({peer:id}));
      this.peer=m.peer; this.ready=true; this.known=new Set(m.peers.map(p=>p.peer));
      if (this.peersCb) this.peersCb({peers:[{peer:m.peer,isMe:true,sameTab:true,kind:'viewer',presence:{}}], joined:m.peers.map(p=>this.fix(p)), updated:[], left:gone});
      if (this.roomResolve){ this.roomResolve(this.room); this.roomResolve=null; }
      if (this.handlers.hello) this.handlers.hello(m);
      return; }
    if (m.t==='peers'){ for (const p of (m.joined||[])) this.known.add(p.peer); for (const p of (m.left||[])) this.known.delete(p.peer);
      if (this.peersCb) this.peersCb({peers:[], joined:(m.joined||[]).map(p=>this.fix(p)), updated:(m.updated||[]).map(p=>this.fix(p)), left:m.left||[]}); return; }
    if (m.t==='res'){ const r=this.wait.get(m.id); if (r){ this.wait.delete(m.id); r(m); } return; }
    if (this.handlers[m.t]) this.handlers[m.t](m);
  },
};
NET.room = { presence: async p => { NET.send({t:'p', p}); }, onPeers(cb){ NET.peersCb=cb; return ()=>{}; }, onConnection(){ return ()=>{}; }, connected: () => NET.ready };
NET.roomPromise = new Promise(r=>{ NET.roomResolve=r; });
window.claude = { use: async name => name==='room' ? NET.roomPromise : null };
async function apiPost(path, body){ const r = await fetch(path, {method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body:JSON.stringify(body||{})}); let j={}; try { j=await r.json(); } catch(_){} return {ok:r.ok, status:r.status, ...j}; }
</script>
'''
head = rep(head, '  <div id="roompick" class="gb">', AUTH_HTML + '  <div id="kicked"></div>\n  <div id="roompick" class="gb">')
head = rep(head, '  #flash{', AUTH_CSS + '  #flash{')
head = rep(head, '<div data-a="llama">', '<div data-a="logout">LOG OUT</div><div data-a="llama">')
# network layer goes in before the game script starts
i = head.rindex('<script')
head = head[:i] + NET_JS + head[i:]
head = head.replace('<title>Llama Lounge</title>', '<title>Llama Lounge</title>\n<meta name="description" content="Llama Lounge: hang out, chat and play games as a llama.">') if '<title>Llama Lounge</title>' in head else head

# ---------------------------------------------------------------- game: server-backed wallet + actions
t = tail

# wallet: the balance comes from the server; the client can't add or spend on its own
t = replace_func(t, 'const wallet = {', '''const wallet = {
  get(){ return Number.isInteger(store.tk) ? store.tk : 0; },
  add(){}, spend(){ return false; },        // tokens only change on the server
}''')
t = rep(t, 'function tokUI(dir){', '''function tkSet(v, why){ if (!Number.isFinite(v)) return; const d=v-wallet.get(); store.tk=v; saveStore(); tokUI(d>0?1:d<0?-1:0); if (why) localMsg(why); }
function tokUI(dir){''')
t = replace_func(t, 'function walletSave(delta){', 'function walletSave(){}')
t = replace_func(t, 'async function walletFlush(){', 'async function walletFlush(){}')
t = replace_func(t, 'async function initWallet(){', 'async function initWallet(){}')

# drinks cost a token (server)
m = re.search(r"  else if \(a==='grab'\)\{.*?\n", t)
t = t[:m.start()] + """  else if (a==='grab'){ const st=(me.p==='sit')?seatAt(me.gx,me.gy):null; if(!st||st.gy!==2||me.h) return; const gx=me.gx;
    NET.act('drink').then(r=>{ if (!r.ok){ localMsg(r.msg||'Could not buy a drink.'); return; } tkSet(r.tk); me.h=DRINK_IDS[gx%DRINK_IDS.length]; me.hl=5; localMsg(`You bought a ${DRINKS[me.h].label} for 1 TOKEN!`); sendPresence(true); }); }
""" + t[m.end():]

# bar tips (server pays every 30s while you're behind the bar)
m = re.search(r"  if \(me.bar\)\{ me.shift=.*?\n", t)
t = t[:m.start()] + "  if (me.bar && me.p==='bar'){ me.shift=(me.shift||0)+dt; if (me.shift>=TOKENS.BAR_EVERY){ me.shift=0; NET.act('bar_tick').then(r=>{ if (r.ok && Number.isFinite(r.tk)) tkSet(r.tk, '+1 TOKEN! Tips from working the bar!'); }); } }\n" + t[m.end():]
t = rep(t, "  if (me.bar){ me.p='bar'; me.d = Math.random()<0.5?'fr':'fl'; me.barT = 2.6+Math.random()*2.8; sendPresence(true); return; }",
           "  if (me.bar){ me.p='bar'; me.d = Math.random()<0.5?'fr':'fl'; me.barT = 2.6+Math.random()*2.8; sendPresence(true); if (!me.barOn){ me.barOn=true; me.shift=0; setTimeout(()=>NET.act('bar_tick'), 400); } return; }")
t = rep(t, "function leaveBar(tx,ty,pending){\n  me.bar=false;", "function leaveBar(tx,ty,pending){\n  me.bar=false; if (me.barOn){ me.barOn=false; NET.act('bar_off'); }")

# carrot harvest (server timers)
t = replace_func(t, 'function harvest(k){', '''function harvest(k){
  if (curRoom!=='barn' || me.p==='sit') return;
  let c = k ? CROPS.find(x=>x.k===k) : null; if (!c || !near(c.gx,c.gy)) c = (me.cropK && CROPS.find(x=>x.k===me.cropK && near(x.gx,x.gy))) || readyCropNear() || CROPS.find(x=>near(x.gx,x.gy));
  me.cropK=null; if (!c) return;
  if (cropProgress(c.k)<1){ localMsg(`Those carrots are still growing. Ready in ${Math.ceil(((+cropState[c.k])-Date.now())/1000)}s.`); return; }
  face(c.gx,c.gy); sendPresence(true);
  NET.act('harvest',{k:c.k}).then(r=>{ if (Number.isFinite(r.left)){ cropState[c.k]=Date.now()+r.left; store.crops=cropState; saveStore(); }
    if (!r.ok){ if (r.msg) localMsg(r.msg); return; } tkSet(r.tk, '+1 TOKEN! Fresh carrots!'); });
}''')

# slot machine (server spins the reels)
t = replace_func(t, 'function slotSpin(){', '''function slotSpin(){
  if (curRoom!=='lounge' || !(me.p==='sit'&&me.gx===12&&me.gy===1)) return;
  if (slot.spin && performance.now()<slot.stopAt[2]+80) return;
  if (wallet.get()<1){ slotMsg('YOU NEED 1 TOKEN TO SPIN. EARN SOME AT THE ARCADE, THE BAR OR LLAMA ACRES!'); return; }
  slotMsg('SPINNING...'); slotEl.classList.remove('win');
  NET.act('slot').then(r=>{
    if (!r.ok){ slotMsg((r.msg||'TRY AGAIN.').toUpperCase()); return; }
    store.tk = r.tk + 0; tokUI(-1); slotTok();
    slotAnimate(r.r); me.slK=(me.slK||0)+1; me.lastSlot={k:me.slK, r:r.r}; sendPresence(true);
    setTimeout(()=>{ const nm=r.r.map(v=>SLOT_SYMS[v].n).join(' · ');
      if (r.pay){ slot.winUntil=performance.now()+1800; tokUI(1); slotMsg(`${nm}! YOU WIN ${r.pay} TOKENS!`); slotEl.classList.add('win'); if (r.pay>=25) action(`hit ${r.pay} TOKENS on the slots!`); }
      else slotMsg(`${nm}. NO LUCK THIS TIME.`); slotTok(); }, 1350);
  });
}''')
t = rep(t, "const SLOT_PAY={0:3, 1:5, 2:10, 3:25, 4:50};", "const SLOT_PAY={0:7, 1:12, 2:25, 3:60, 4:150};   // decided on the server; shown for reference")

# fishing (server picks the bite time and the fish)
t = replace_func(t, 'function startFish(){', '''function startFish(){
  if (!pondNear() || me.p==='sit' || me.fish) return;
  const cx=POND.reduce((a,p)=>a+p[0],0)/POND.length+0.5, cy=POND.reduce((a,p)=>a+p[1],0)/POND.length+0.5, dx=cx-(me.gx+0.5), dy=cy-(me.gy+0.5), L=Math.hypot(dx,dy)||1, k=Math.min(1.4, L-0.4);
  face(Math.round(me.gx+dx/L), Math.round(me.gy+dy/L)); me.p='stand'; sendPresence(true);
  me.fishK=(me.fishK||0)+1; const F={k:me.fishK, st:'wait', f:0, t0:performance.now(), biteAt:Infinity, bx:me.gx+0.5+dx/L*k, by:me.gy+0.5+dy/L*k}; me.fish=F;
  setTimeout(()=>NET.act('fish_cast').then(r=>{ if (me.fish!==F) return; if (!r.ok){ me.fish=null; localMsg(r.msg||'No luck casting.'); sendPresence(true); return; }
    F.st='cast'; F.biteAt=performance.now()+r.bite; localMsg('You cast your line...'); sendPresence(true); }), 250);
}''')
t = replace_func(t, 'function updateFish(){', '''function updateFish(){
  const F=me.fish; if (!F) return; const now=performance.now();
  if (F.st==='cast' && now>=F.biteAt){ F.st='bite'; F.gotAt=now+900; localMsg('Something is biting!'); sendPresence(true); }
  else if (F.st==='bite' && now>=F.gotAt && !F.reeling){ F.reeling=true;
    NET.act('fish_reel').then(r=>{ if (me.fish!==F) return; F.reeling=false;
      if (!r.ok){ F.st='cast'; F.biteAt=Infinity; startRecast(F); return; }
      F.st='got'; F.f=r.f; me.fishShow={f:r.f, until:performance.now()+2200}; tkSet(r.tk, `+${r.pay} TOKEN${r.pay>1?'S':''}! You caught a ${r.name}!`); if (r.f===2) action('caught a rare GOLDEN FISH!');
      F.recastAt=performance.now()+2300; sendPresence(true); }); }
  else if (F.st==='got' && now>=F.recastAt){ F.st='wait'; F.k=++me.fishK; startRecast(F); }
}
function startRecast(F){ NET.act('fish_cast').then(r=>{ if (me.fish!==F) return; if (!r.ok){ me.fish=null; sendPresence(true); return; } F.st='cast'; F.biteAt=performance.now()+r.bite; sendPresence(true); }); }''')
t = rep(t, "  o.fs = me.fish ? {k:me.fish.k, st:me.fish.st, f:me.fish.f, bx:me.fish.bx, by:me.fish.by} : null;",
           "  o.fs = me.fish ? {k:me.fish.k, st:(me.fish.st==='wait'?'cast':me.fish.st), f:me.fish.f, bx:me.fish.bx, by:me.fish.by} : null;")

# arcade payouts (server checks the score is possible)
t = rep(t, "function startGame(id){", "function startGame(id){ arcade.t0=performance.now();")
m = re.search(r"  \{ const per = id==='hay' \? 10 : 50;.*?\n.*?\n", t)
t = t[:m.start()] + """  arcade.earned=0; NET.act('arcade',{game:id, score:sc, ms:Math.round(performance.now()-(arcade.t0||performance.now()))}).then(r=>{ if (!r.ok) return; arcade.earned=r.earned; arcade.newBest=r.best; if (r.earned) tkSet(r.tk, r.best ? `+${r.earned} TOKENS! Arcade milestones + new best!` : `+${r.earned} TOKENS! Arcade milestones!`); });
""" + t[m.end():]

# table games: the server runs the countdown, deals, and settles every bet
t = replace_func(t, 'function startTableGame(i, game){', '''function startTableGame(i, game){
  if (!amAt(i)) { localMsg('Sit at the table first!'); return; }
  if (tgState[i] && tgState[i].phase==='join') return;
  NET.act('tg_start',{i, g:game}).then(r=>{ if (!r.ok) localMsg(r.msg||'Could not start a game.'); });
}
function tgServer(m){ const i=m.i===1?1:0, now=performance.now(); if (curRoom!=='lounge') return;
  if (m.ph==='join'){ tgState[i]={phase:'join', game:m.g, end:now+m.left*1000, hostName:m.host, host:false};
    sysMsg(amAt(i) ? `${m.host} started ${TG_NAMES[m.g]} vs THE HOUSE! You're in. Your bet: ${curBet()?curBet()+' TOKENS':'FREE'}. Tap the table to change it.` : `${m.host} started ${TG_NAMES[m.g]} at the ${TABLE_NAMES[i]}! Sit there to join!`); }
  else if (m.ph==='res' && m.r && m.r.length) showResult(i, m.g, m.r, Math.min(m.w, m.r.length-1));
  else if (m.ph==='cancel') tgState[i]=null;
}''')
a0 = t.index("  // settle my own bet against the house\n"); a1 = t.index("  if (game==='roll') tableShow(i, W.v, false);", a0)
t = t[:a0] + "  // your own bet is settled on the server, which sends the result and your new balance\n" + t[a1:]
t = rep(t, "function resolveTable(i){", "function resolveTable_unused(i){")
t = rep(t, "  if (me.tgK!==undefined && false){}", "", 0) if False else t
# no client-side resolution timers: drop the host check that calls resolveTable
t = rep(t, "if (st.host) resolveTable(i); else if", "if (false) {} else if")   # the server resolves table games

# bets + llama + rules are saved to the account on the server
t = replace_func(t, 'function acctSave(){', '''function acctSave(){ clearTimeout(acctTimer); acctTimer=setTimeout(()=>{ NET.act('profile',{c:store.c||me.c, agreed:+store.agreed||0, bet:Number.isInteger(store.bet)?store.bet:2}); }, 400); }''')
t = rep(t, "const acctHasLlama = () => !!(acct && CHAR_IDS.includes(acct.c) && acct.n);", "const acctHasLlama = () => !!(acct && CHAR_IDS.includes(acct.c));")
t = replace_func(t, 'async function loadAccount(){', 'async function loadAccount(){ return !!acct; }')

# start-up: log in first, then rules / llama / room
t = replace_func(t, 'async function startGate(){', '''async function startGate(){
  loadingEl.style.display='block';
  let r=null; try { r = await fetch('/api/me', {credentials:'same-origin'}); } catch(e){}
  loadingEl.style.display='none';
  if (r && r.ok){ applyProfile(await r.json()); afterLogin(); }
  else if (r && r.status===403){ const j=await r.json().catch(()=>({})); showKicked(j.error||'This account is banned.'); }
  else showAuth();
}
function applyProfile(p){
  acct = Object.assign({}, p); isAdminUser = !!p.admin;
  me.n = p.name; store.n = p.name; pname.value = p.name; pname.readOnly = true;
  if (CHAR_IDS.includes(p.c)){ me.c=p.c; store.c=p.c; setSel(p.c); }
  store.agreed = p.agreed||0; store.bet = Number.isInteger(p.bet)?p.bet:2; store.tk = p.tk;
  best.hay = p.bestHay||0; best.dash = p.bestDash||0;
  for (const tm of (p.timers||[])) cropState[tm.k] = Date.now()+tm.left; store.crops=cropState;
  saveStore(); tokUI(0);
}
function afterLogin(){
  NET.connect();
  if ((+store.agreed||0) < RULES_V){ rulesEl.style.display='flex'; return; }
  if (acctHasLlama()) autoEnter(); else pick.style.display='flex';
}
const authEl=document.getElementById('auth'), auErr=document.getElementById('au_err'); let isAdminUser=false;
function showAuth(){ closeAll(); authEl.style.display='block'; setTimeout(()=>document.getElementById('au_u').focus(), 50); }
async function doAuth(kind){
  const u=document.getElementById('au_u').value.trim(), p=document.getElementById('au_p').value;
  auErr.textContent = kind==='signup' ? 'MAKING YOUR ACCOUNT...' : 'LOGGING IN...';
  for (const b of authEl.querySelectorAll('button')) b.disabled=true;
  const r = await apiPost('/api/'+kind, {u, p});
  for (const b of authEl.querySelectorAll('button')) b.disabled=false;
  if (!r.ok){ auErr.textContent = (r.error||'Something went wrong.').toUpperCase(); return; }
  document.getElementById('au_p').value=''; authEl.style.display='none'; applyProfile(r); afterLogin();
}
document.getElementById('au_form').addEventListener('submit', e=>{ e.preventDefault(); doAuth('login'); });
document.getElementById('au_signup').addEventListener('click', ()=>doAuth('signup'));
for (const el of [document.getElementById('au_u'), document.getElementById('au_p')]) el.addEventListener('keydown', e=>e.stopPropagation());
function showKicked(msg){ const k=document.getElementById('kicked'); k.textContent=msg; k.style.display='flex'; NET.closedForGood=true; try{ NET.ws&&NET.ws.close(); }catch(e){} }
NET.handlers.tk = m => tkSet(m.tk, m.msg);
NET.handlers.tg = m => tgServer(m);
NET.handlers.board = m => { board={hay:lbClean(m.board.hay), dash:lbClean(m.board.dash)}; renderBoard(); };
NET.handlers.hello = m => { board={hay:lbClean(m.board.hay), dash:lbClean(m.board.dash)}; if (joined) sendPresence(true); };
NET.handlers.kick = m => showKicked(m.msg);''')

# leaderboard comes from the server
t = replace_func(t, 'async function initBoard(){', 'async function initBoard(){}')
t = replace_func(t, 'function reportScore(game,name,score){', 'function reportScore(){}')

# owner moderation commands in chat: /mute NAME, /unmute, /kick, /ban, /unban
t = rep(t, "  if (cmd.startsWith('/yell ')){", """  { const mm=/^\\/(mute|unmute|ban|unban|kick)\\s+(\\S+)/.exec(cmd); if (mm){ NET.act('admin',{cmd:mm[1], target:mm[2]}).then(r=>localMsg(r.msg||'Done.')); return; } }
  if (cmd.startsWith('/yell ')){""")

# log out from the menu
t = rep(t, "  else if (a==='room') showRoomPick(false);", "  else if (a==='room') showRoomPick(false);\n  else if (a==='logout'){ apiPost('/api/logout').then(()=>{ NET.closedForGood=true; location.reload(); }); }")

out = head + world + helpers + t
OUT.write_text(out)
print('wrote', OUT, len(out)//1024, 'KB')
