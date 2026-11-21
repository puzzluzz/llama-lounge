// ======================= NETWORK: talks to the Llama Lounge server =======================
// Presents the same room API the game was written against (presence + peer updates),
// plus NET.act() for anything that changes tokens. The server decides every payout.
const GAME_VERSION = "2026-11-30a";   // must match VERSION in src/worker.js
const NET = {
  ws:null, peer:null, rid:0, wait:new Map(), peersCb:null, peersQ:[], known:new Set(), handlers:{}, ready:false, closedForGood:false,
  peersOut(ch){ if (this.peersCb) this.peersCb(ch); else this.peersQ.push(ch); },
  // RECONNECTING: a dropped connection retries fast, then backs off (0.5s, 1s, 2s, 4s, 8s). Coming back to the tab or getting signal back retries at once.
  // A quiet "ping" every 20 seconds notices a connection that died without saying so (common on phones) and replaces it.
  tries:0, hellos:0, pingT:null, pongAt:0, retryT:null, wanted:false,
  connect(){
    this.wanted=true; clearTimeout(this.retryT);
    if (this.ws && this.ws.readyState<2) return;
    const ws = new WebSocket((location.protocol==='https:'?'wss://':'ws://')+location.host+'/ws'); this.ws=ws;
    ws.onmessage = e => { if (ws!==this.ws) return; if (e.data==='pong'){ this.pongAt=Date.now(); return; } let m; try { m=JSON.parse(e.data); } catch(_){ return; } this.onmsg(m); };
    ws.onopen = () => { if (ws!==this.ws) return; this.pongAt=Date.now(); clearInterval(this.pingT);
      this.pingT=setInterval(()=>{ if (ws!==this.ws || ws.readyState!==1) return; if (Date.now()-this.pongAt>48000){ this.drop(); return; } try { ws.send('ping'); } catch(_){} }, 20000); };
    ws.onclose = ev => { if (ws!==this.ws) return; const was=this.ready; this.ready=false; clearInterval(this.pingT); for (const [id,res] of this.wait) res({ok:false,msg:'Connection lost, reconnecting...'}); this.wait.clear();
      if (ev.code===4001 && !this.closedForGood && this.handlers.kick){ this.handlers.kick({msg:'You opened the LLAMA LOUNGE in another tab or window, so this one left the room. Reload to play here instead.'}); return; }
      if (ev.code===4003 || this.closedForGood) return;
      if (was && this.handlers.down) this.handlers.down();
      const wait=Math.min(8000, 500*Math.pow(2, this.tries++)); this.retryT=setTimeout(()=>this.connect(), wait); };
  },
  // give up on the current connection and start a new one right away
  drop(){ const old=this.ws; if (!old) return; this.ws=null; const was=this.ready; this.ready=false; clearInterval(this.pingT); try { old.onclose=null; old.onmessage=null; old.close(); } catch(_){}
    for (const [id,res] of this.wait) res({ok:false,msg:'Connection lost, reconnecting...'}); this.wait.clear();
    if (this.closedForGood || !this.wanted) return; if (was && this.handlers.down) this.handlers.down(); this.connect(); },
  // the tab came back or the device got signal again: don't wait for the retry timer
  wake(){ if (!this.wanted || this.closedForGood) return; if (!this.ws || this.ws.readyState>1){ this.tries=0; this.connect(); return; }
    if (this.ws.readyState===1){ const t=Date.now(); try { this.ws.send('ping'); } catch(_){} setTimeout(()=>{ if (this.ws && this.ws.readyState===1 && this.pongAt<t) this.drop(); }, 4000); } },
  send(o){ if (this.ws && this.ws.readyState===1) this.ws.send(JSON.stringify(o)); },
  act(a, data={}){ return new Promise(res=>{ if (!this.ready){ res({ok:false,msg:'Still connecting, try again in a second.'}); return; }
    const id=++this.rid; this.wait.set(id,res); this.send({...data, t:'act', a, id});
    setTimeout(()=>{ if (this.wait.has(id)){ this.wait.delete(id); res({ok:false,msg:'The server took too long, try again.'}); } }, 9000); }); },
  fix(p){ return {peer:p.peer, isMe:false, sameTab:false, kind:'viewer', presence:p.presence||{}}; },
  onmsg(m){
    if (m.t==='hello'){
      this.tries=0; this.hellos++; m.re=this.hellos>1;   // re: this is a reconnect, not the first hello
      const gone=[...this.known].filter(id=>!m.peers.some(p=>p.peer===id)).map(id=>({peer:id}));
      this.peer=m.peer; this.ready=true; this.known=new Set(m.peers.map(p=>p.peer));
      this.peersOut({peers:[{peer:m.peer,isMe:true,sameTab:true,kind:'viewer',presence:{}}], joined:m.peers.map(p=>this.fix(p)), updated:[], left:gone});
      if (this.roomResolve){ this.roomResolve(this.room); this.roomResolve=null; }
      if (this.handlers.hello) this.handlers.hello(m);
      return; }
    if (m.t==='peers'){ for (const p of (m.joined||[])) this.known.add(p.peer); for (const p of (m.left||[])) this.known.delete(p.peer);
      this.peersOut({peers:[], joined:(m.joined||[]).map(p=>this.fix(p)), updated:(m.updated||[]).map(p=>this.fix(p)), left:m.left||[]}); return; }
    if (m.t==='res'){ const r=this.wait.get(m.id); if (r){ this.wait.delete(m.id); r(m); } return; }
    if (this.handlers[m.t]) this.handlers[m.t](m);
  },
};
NET.room = { presence: async p => { NET.send({t:'p', p}); }, onPeers(cb){ NET.peersCb=cb; const q=NET.peersQ.splice(0); for (const ch of q) cb(ch); return ()=>{}; }, onConnection(){ return ()=>{}; }, connected: () => NET.ready };
NET.roomPromise = new Promise(r=>{ NET.roomResolve=r; });
window.claude = { use: async name => name==='room' ? NET.roomPromise : null };
async function apiPost(path, body){ const r = await fetch(path, {method:'POST', credentials:'same-origin', headers:{'content-type':'application/json'}, body:JSON.stringify(body||{})}); let j={}; try { j=await r.json(); } catch(_){} return {ok:r.ok, status:r.status, ...j}; }
addEventListener('online', ()=>NET.wake());
document.addEventListener('visibilitychange', ()=>{ if (!document.hidden) NET.wake(); });
addEventListener('pageshow', ()=>NET.wake());
