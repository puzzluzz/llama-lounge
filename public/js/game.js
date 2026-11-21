// ---- crash reports: if something breaks in this browser, tell the server (grouped there; staff see them in DASHBOARD > ERRORS) ----
(()=>{ const sent=new Set(); let n=0;
  const send=(m,src,line,col,stack)=>{ try { m=String(m||'').slice(0,300); if (!m || /^Script error\.?$/.test(m)) return; src=String(src||'');
      if (src && !src.startsWith(location.origin)) return;   // browser extensions, not the game
      const k=m+'|'+src+'|'+line; if (sent.has(k) || n>=8) return; sent.add(k); n++;
      const r=(typeof window.__llRoom==='function')?String(window.__llRoom()||''):'', ua=(navigator.userAgent.match(/(iPhone|iPad|Android|Windows|Macintosh|Linux)/)||[''])[0]+' '+((navigator.userAgent.match(/(Edg|Chrome|Firefox|Safari)\/[\d.]+/)||[''])[0]);
      fetch('/api/clienterr',{method:'POST', credentials:'same-origin', keepalive:true, headers:{'content-type':'application/json'}, body:JSON.stringify({m, s:src.replace(location.origin,''), l:line|0, st:String(stack||'').slice(0,1200), ua, r})}).catch(()=>{}); } catch(_){} };
  addEventListener('error', e=>{ if (e && e.message) send(e.message, e.filename, e.lineno, e.colno, e.error && e.error.stack); });
  addEventListener('unhandledrejection', e=>{ const r=e && e.reason; send('Unhandled: '+(r && r.message || r), (r && r.stack && (r.stack.match(/(https?:[^\s)]+):(\d+)/)||[])[1]) || location.href, r && r.stack && +((r.stack.match(/:(\d+):\d+/)||[])[1]||0), 0, r && r.stack); });
  window.__boom = () => { if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) setTimeout(()=>{ null.boom(); }, 0); };   // test hook (localhost only)
})();

(() => {
'use strict';

// ======================= PIXEL ICONS =======================
// Every icon in the game is 12x12 pixel art, drawn here once at start-up. Any emoji that ends up in the page
// (labels, titles, messages, even chat) is swapped for its pixel icon automatically, so nothing shows as an emoji.
const PIXPAL={k:'#1d1530',w:'#ffffff',y:'#ffd23f',Y:'#c88a10',o:'#f08a24',r:'#e83850',R:'#a01c34',p:'#ff6e9c',P:'#c8306a',b:'#4aa8ff',B:'#2060c0',c:'#b8e4ff',g:'#48c060',G:'#22803a',l:'#a8e878',n:'#a86a34',N:'#6a3e1c',t:'#e8b878',s:'#d0ccdc',S:'#7c7890',v:'#9a60e0',V:'#5e34a0',f:'#f8dcb8'};
const PIXSRC={
  jungle:'...kk..kk.../..kggkkggk../.kgglggglgk./kgggkggkgggk/kgk.knnk.kgk/kk..knnk..kk/....knNk..../....knNk..../....knNk..../...knnNNk.../..kgggggGk../..kkkkkkkk..',
  glove:'............/...kkkkk..../..krrrrrk.../.krwwrrrrk../.krwrrrrrRk./.krrrrrrrRk./kkkrrrrrRRk./krrkrrrRRk../krrrrrRRRk../.kRRRRRRk.../.kwwwwwwk.../.kkkkkkkk...',
  chest:'............/..kkkkkkkk../.knnnnnnnnk./knttttttttNk/kkkkkyykkkkk/knnnkyyknnNk/knnnnkknnnNk/kyyyyyyyyyYk/knnnnnnnnnNk/knnnnnnnnNNk/kNNNNNNNNNNk/kkkkkkkkkkkk',
  radar:'........kk../.......kSk../......kSk.../.....kSk..../....kSk...../...kSk....../..kSk......./.kkSkkkkk.../kbbbbbbbbk../kbcccccccbk./.kbbbbbbbk../..kkkkkkk...',
  coin:'...kkkkkk.../..kyyyyyyk../.kyyyyyyyYk./kyywYYYYyyYk/kywYyyyyYyYk/kywYyyyyYyYk/kyyYyyyyYyYk/kyyYyyyyYyYk/kyyyYYYYyYYk/.kyyyyyyyYk./..kYYYYYYk../...kkkkkk...',
  star:'.....kk...../....kyyk..../....kwyk..../kkkkkwyykkkk/kyywwyyyyyYk/.kyyyyyyyYk./..kyyyyyYk../..kyyyyyYk../.kyyYkkyyYk./.kyYk..kyYk./kyYk....kYYk/kkk......kkk',
  splash:'.....kk...../....kck...../...kcbk..k../...kbbk.kck./..kcbbbkkbk./..kcbbbk.k../.kcbbbbbk.../.kcwbbbbk.../.kcwbbbBk.k./..kcbbBk.kck/...kkkk...k./............',
  drop:'.....kk...../....kcck..../....kcbk..../...kcbbbk.../...kcbbbk.../..kcbbbbbk../..kcwbbbbk../.kcwbbbbbBk./.kcwbbbbbBk./.kcbbbbbBBk./..kBbbbBBk../...kkkkkk...',
  bag:'....kkkk..../...kk..kk.../...k....k.../.kkkkkkkkkk./.kppppppppk./.kpwpppppPk./.kpwpppppPk./.kpppkkpppk./.kppkyykppk./.kpppkkppPk./.kPPPPPPPPk./.kkkkkkkkkk.',
  backpack:'....kkkk..../...knnnnk.../..kknkknkk../.knnnnnnnnk./.kntnnnnnNk./.knttkkkkNk./.knnkyyykNk./.knnkkkkkNk./.knnnnnnnNk./.knnnnnnNNk./.kNNNNNNNNk./..kkkkkkkk..',
  house:'.....kk...../....krrk..../...krrrrk.../..krrrrrrk../.krrrrrrrrk./kRRRRRRRRRRk/.kttttttttk./.kkkktkkkkk./.kkcktknnnk./.kkkktknnyk./.kttttknnnk./kkkkkkkkkkkk',
  burger:'...kkkkkk.../..ktttttwk../.kttwtttttk./.kttttttttk./.kkkkkkkkkk./kgglgglgglgk/kNNNNNNNNNNk/.krrrrrrrrk./.kkkkkkkkkk./.kttttttttk./..knnnnnnk../...kkkkkk...',
  bowl:'..kkk......./.kwwwk....../.kwwSk....../..kwk......./..krk......./.kwwSk....../kwwwwSk.kkk./kwwwwSkkvvvk/kwwwwSkkwvVk/.kwwSk.kvvVk/.kwwSk.kVVVk/..kkk...kkk.',   // a bowling pin with a ball rolling up to it
  chat:'.kkkkkkkkkk./kwwwwwwwwwck/kwkwkwkwwwck/kwwwwwwwwwck/kwkkkwkkwwck/kwwwwwwwwwck/kcwwwwwwwcck/.kkkwwkkkkk./...kwwk...../...kwk....../...kk......./............',
  lock:'............/....kkkk..../...kssssk.../..ksk..ksk../..ksk..kSk../.kkkkkkkkkk./.kyyyyyyyYk./.kywykkyyYk./.kyyykkyyYk./.kyyyykyyYk./.kYYYYYYYYk./.kkkkkkkkkk.',
  slots:'.kkkkkkkkk../krrrrrrrrRk./krkkkkkkkRkk/krkwkwkwkRky/krkpkykrkRky/krkwkwkwkRkk/krkkkkkkkRk./krryyyyyrRk./krrrrrrrrRk./kRRRRRRRRRk./kSSSSSSSSSk./.kkkkkkkkk..',
  gift:'..kk...kk.../.kyyk.kyyk../..kyykyyk.../kkkkkkkkkkkk/kppppyypppPk/kppppyypppPk/kkkkkkkkkkkk/.kppppyyppk./.kppppyyppk./.kppppyyppk./.kPPPPYYPPk./.kkkkkkkkkk.',
  trophy:'.kkkkkkkkkk./kkyyyyyyyYkk/kykywyyyyYky/kykywyyyyYky/.kkywyyyyYk./..kyyyyyYk../...kyyyYk.../....kyYk..../....kyYk..../...kkkkkk.../..kYyyyyYk../..kkkkkkkk..',
  door:'..kkkkkkkk../..knnnnnnk../..kntttnNk../..kntttnNk../..kntttnNk../..knnnnnNk../..knttnyNk../..kntttnNk../..kntttnNk../..kntttnNk../..knnnnnNk../.kkkkkkkkkk.',
  shield:'.kkkkkkkkkk./.kbbbbbwwbk./.kbbbbbwwBk./.kbbbbbwwBk./.kwwwwwwwBk./.kwwwwwbbBk./.kbbbbwbbBk./..kbbbwbBk../..kbbbwbBk../...kbbwBk.../....kbBk..../.....kk.....',
  handshake:'............/.......kk.../kkkkkkkkgk../kggggggggGk./kkkkkkkkGk../.......kk.../...kk......./..kbkkkkkkkk/.kbbbbbbbbbk/..kBkkkkkkkk/...kk......./............',
  cocktail:'kkkkkkkkkkkk/kcwwwccccc.k/.kcpccccck../..kcpcccy.../...kcccyyk../....kcck..../.....kk...../.....kk...../.....kk...../.....kk...../...kkkkkk.../..kssssssk..',
  cup:'.......kk.../......kk..../..kkkkkkkk../..kwwwkwwk../..krrrrrrk../..kwrrrrRk../..kwrrrrRk../..kwyyyyRk../..kwrrrrRk../..krrrrrRk../...krrrRk.../...kkkkkk...',
  shirt:'............/..kkk..kkk../.kbbbkkbbbk./kbbbbbbbbbbk/kbwbbbbbbbBk/kkkbbbbbbkkk/..kbbbbbbk../..kwbbbbBk../..kbbbbbBk../..kbbbbbBk../..kBBBBBBk../..kkkkkkkk..',
  box:'............/..kkkkkkkk../.kttttttttk./kttttnnttttk/kkkkknnkkkkk/kttttnnttttk/kttttttttttk/ktwttttttnNk/ktwttttttnNk/kttttttttnNk/knnnnnnnnnNk/kkkkkkkkkkkk',
  palette:'...kkkkkk.../..kttttttk../.kttrrtttbk./ktttrrttbbtk/kttttttttttk/kyytttkktttk/kyytttk.kttk/ktttttkkttk./kgggtttttk../kgggttttk.../.kttttkk..../..kkkk......',
  fire:'.....k....../....kok..k../...kook.kok./..koook.kok./..koooykkook/.kooyyyoooko/.kooyyyyoook/.koyywyyyook/.koyywwyyook/..koyyyyyok./...kooooookk/....kkkkkk..',
  check:'............/..........kk/.........kgk/........kggk/.kk....kggk./kgggk.kggk../kggggkggk.../.kggggggk.../..kgggggk.../...kgggk..../....kkk...../............',
  wheat:'.....k....../....kyk...../...kykyk..../...kyyyk.k../..kykyk.kyk./..kyyyk.kyyk/...kykykyk../....kyyyk.../.....kyk..../.....kYk..../.....kYk..../.....kkk....',
  crown:'............/.k...kk...k./kwk.kwyk.kyk/kyk.kyyk.kyk/kyykkyyykyyk/kywyyyyyyyYk/kyyyyyyyyyYk/kYrYYbbYYrYk/kyyyyyyyyyYk/kYYYYYYYYYYk/kkkkkkkkkkkk/............',
  heart:'............/.kkk...kkk../krrrk.krrrk./krwrrkrrrrRk/krwrrrrrrrRk/krrrrrrrrrRk/.krrrrrrrRk./..krrrrrRk../...krrrRk.../....krRk..../.....kk...../............',
  goldheart:'............/.kkk...kkk../kyyyk.kyyyk./kywyykyyyyYk/kywyyyyyyyYk/kyyyyyyyyyYk/.kyyyyyyyYk./..kyyyyyYk../...kyyyYk.../....kyYk..../.....kk...../............',
  envelope:'............/kkkkkkkkkkkk/kSwwwwwwwwSk/kwSwwwwwwSwk/kwwSwwwwSwwk/kwwwSkkSwwwk/kwwwkSSkwwwk/kwwkwwwwkwwk/kwkwwwwwwkwk/kkSSSSSSSSkk/kkkkkkkkkkkk/............',
  pepper:'........kk../.......kgk../......kgk.../....kkkkk.../...krrrrRk../..krwrrrRk../..krwrrrRk../.krrrrrrRk../.krrrrrRk.../krrrrrRk..../kRRRRkk...../kkkkk.......',
  sparkle:'.....kk...../.....kbk..../.....kbk..../..k..kbk..k./..kbkkbkkbk./kkkkbbbbkkkk/kbbbbwbbbbBk/kkkkbbbbkkkk/..kbkkbkkBk./..k..kbk..k./.....kBk..../.....kk.....',
  chair:'..kkkkkk..../..knnnnNk.../..kntttNk.../..kntttNk.../..knnnnNk.../..kNnnnNk.../.kkkkkkkkk../.ktttttttNk./.knnnnnnnNk./.kNk....kNk./.kNk....kNk./.kkk....kkk.',
  bulb:'...kkkkk..../..kyyyyyk.../.kyywyyyYk../.kywyyyyYk../.kywyyyyYk../.kyyyyyyYk../..kyyyyYk.../...kyyYk..../...kssSk..../...kSSSk..../...kssSk..../....kkk.....',
  hand:'......kk.kk...../.....kftkftk..../...kkkftkftkkk../..kftkftkftkftk./..kftkftkftkftk./..kftkftkftkftk./..kftkfffftkftk./.kffffffffffftk./ktffffffffffftk./.kffffffffffftk./.ktffffffffftk../..kffffffffftk../..ktfffffffftk../...kttffffttk.../....kkttttkk..../......kkkk......',
  dice:'.kkkkkkkkkk./kwwwwwwwwwSk/kwkkwwwwwwSk/kwkkwwwwwwSk/kwwwwkkwwwSk/kwwwwkkwwwSk/kwwwwwwkkwSk/kwwwwwwkkwSk/kwwwwwwwwwSk/kSSSSSSSSSSk/.kkkkkkkkkk./............',
  ball:'...kkkkkk.../..kwwwwwSk../.kwrwwwrwSk./kwwrwwwrwwSk/kwrwwwwwrwSk/kwrwwwwwrwSk/kwwrwwwrwwSk/kwwrwwwrwSSk/.kwrwwwrSSk./..kSwwwSSk../...kkkkkk.../............',
  wheel:'...kkkkkk.../..kRrrrrRk../.kRkkkkkkRk./kRkpkyykbkRk/kRkkpkkbkkRk/kRkyykkyykRk/kRkkbkkpkkRk/kRkbkyykpkRk/.kRkkkkkkRk./..kRRRRRRk../...kSkkSk.../..kkk..kkk..',
  hourglass:'.kkkkkkkkkk./.knnnnnnnnk./..kwwwwwwk../..kwyyyywk../...kwyywk.../....kwyk..../....kwyk..../...kwwywk.../..kwwyywwk../..kwyyyyyk../.knnnnnnnnk./.kkkkkkkkkk.',
  disk:'kkkkkkkkkkk./kbkwwwwwkbkk/kbkwwwwwkbBk/kbkwwwwwkbBk/kbkkkkkkkbBk/kbbbbbbbbbBk/kbbkkkkkbbBk/kbbkSSwkbbBk/kbbkSSwkbbBk/kBBkkkkkBBBk/kkkkkkkkkkkk/............',
  gold1:'.kk......kk./.kbk....kbk./..kbk..kbk../...kbkkbk.../...kkkkkk.../..kyyyyyYk../.kyyykkyyYk./.kyykkkyyYk./.kyyykkyyYk./.kyykkkkyYk./..kYyyyyYk../...kkkkkk...',
  silver2:'.kk......kk./.kbk....kbk./..kbk..kbk../...kbkkbk.../...kkkkkk.../..kwwwwwSk../.kwwkkkwwSk./.kwwwwkwwSk./.kwwwkwwwSk./.kwwkkkkwSk./..kSwwwwSk../...kkkkkk...',
  bronze3:'.kk......kk./.kbk....kbk./..kbk..kbk../...kbkkbk.../...kkkkkk.../..koooooNk../.kookkkooNk./.kooookkoNk./.koooookoNk./.kookkkooNk./..kNooooNk../...kkkkkk...',
  reddot:'............/............/...kkkkkk.../..krrrrrRk../.krwwrrrrRk./.krwrrrrrRk./.krrrrrrrRk./.krrrrrrrRk./..kRrrrrRk../...kkkkkk.../............/............',
  chart:'k.........../k........kk./k.......kgk./k......kgk../k..kk.kgk.../k.kgkkgk..../kkgk.kk...../kgk........./kk........../k.........../kkkkkkkkkkkk/............',
  hundred:'............/............/rr..rr...rr./.r.r..r.r..r/.r.r..r.r..r/.r.r..r.r..r/.r.r..r.r..r/rrr.rr...rr./............/RRRRRRRRRRRR/.RRRRRRRRRR./............',
  smile:'.....kkkkkk...../...kkyyyyyykk.../..kyywwyyyyyyk../.kyywyyyyyyyyYk./.kywykwyykwyyYk./kyyyykkyykkyyyYk/kyyyykkyykkyyyYk/kyppyyyyyyyyppYk/kyyykkkkkkkkyyYk/kyyyykRppRkyyyYk/.kyyyykkkkyyyYk./.kYyyyyyyyyyYYk./..kYYyyyyyyYYk../...kkYYYYYYkk.../.....kkkkkk...../................',
  send:'.kk............./kwwkk.........../kwwwwkk........./kwwwwwwkk......./kwwwwwwwwkk...../.kwwwwwwwwwkk.../..kkkkkwwwwwwkk./.....kSSSSSSSSSk/..kkkkksssssskk./.kssssssssskk.../ksssssssskk...../ksssssskk......./ksssskk........./ksskk.........../.kk............./................',
  scroll:'.kkkkkkkkk../kttttttttNk./ktkkkkkkkk../.ktttttttk../.ktSSSSStk../.ktttttttk../.ktSSSSStk../.ktttttttk../.ktSSSStttk./.kkkkkkkkttk/..kttttttttk/..kkkkkkkkk.',
  muscle:'..kkkkk........./.kfffffk......../.kftftfk......../.kfffffk......../..kfffk........./..kfffk...kkk.../..kfffk..kfwfk../..kfffk.kfwffftk/..kfffkkfffffftk/..kffffffffffftk/..kffffffffffftk/..kffffffffffftk/..ktffffffffftkk/...kttttttttttk./....kkkkkkkkkk../................',
  llama:'.kk..kk...../.kwk.kwk..../.kwkkkwk..../.kwwwwwwk.../kwwwwkwwwk../kwwwwwwwwwk./kwwwwwwwwwwk/.kwwwwwwwSwk/..kkwwwwkkk./...kwwwwk.../...kwwwwk.../...kkkkkk...',
  zzz:'............/......kkkkk./......kbbbk./.......kbk../......kbbbk./..kkkkkkkkk./..kbbbbk..../....kbk...../...kbk....../..kbbbbk..../..kkkkkk..../............',
  speaker:'.......k..../......kk..k./....kkSk...k/.kkkkwSk.k.k/.kSSkwSk..kk/.kSSkwSk..kk/.kSSkwSk.k.k/.kkkkwSk...k/....kkSk..k./......kk..../.......k..../............',
  music:'.....kkkkkvvvVk./....kvvvvvvvvvVk/....kvvvvvVVVvVk/....kvvVVVkkkvVk/....kvVkkk..kvVk/....kvVk....kvVk/....kvVk....kvVk/....kvVk...kkvVk/....kvVk.kkvvvVk/...kkvVkkvvwvvVk/.kkvvvVkkvvvvvVk/kvvwvvVkkVVvvVVk/kvvvvvVk.kkVVkk./kVVvvVVk...kk.../.kkVVkk........./...kk...........',
  bed:'............/kk........../kNk........./kNkkkkkkkkk./kNwwSkpppppk/kNwwSkpppppk/kNkkkkkkkkkk/kNnnnnnnnnNk/kNNNNNNNNNNk/kNk......kNk/kkk......kkk/............',
  plate:'............/............/....kkkk..../..kkwwwwkk../.kwwssssSwk./kwwsrrrrsSwk/kwwsryyrsSwk/kwwsrrrrsSwk/.kwSssssSwk./..kkwwwwkk../....kkkk..../............',
  books:'............/.kkk.kkk..../.kbk.krk.kk./.kbk.krkkgk./.kwk.kwkgkk./.kbk.krkgk../.kbk.krkkgk./.kbk.krk.kgk/.kwk.kwk.kwk/.kbk.krk.kgk/kkkkkkkkkkkk/kNNNNNNNNNNk',
  tv:'..k......k../...k....k.../....k..k..../kkkkkkkkkkkk/kSkkkkkkkkSk/kSkbbbbbckSk/kSkbbbbbbkSk/kSkbbbbbbkSk/kSkkkkkkkkSk/kSSSSSSSSSSk/kkkkkkkkkkkk/..kk....kk..',
  plant:'....kk....../...kglk.kk../...kgglkglk./....kgglglk./.kk..kgglk../kglkkkgglk../.kgglkgk..../..kkkkkkkk../..knnnnnNk../..kntnnnNk../...knnnNk.../...kkkkkk...',
  yarn:'...kkkkkk.../..kpppppPk../.kpwkpppkPk./kpwppkpkppPk/kpppppkppPPk/kppppkpkpPPk/kpppkpppkPPk/kppkpppppkPk/.kPkpppppPk./..kPPPPPPkk./...kkkkkk.kk/...........k',
  apple:'.....kk...../.....kNkk.../...kkkkglk../..krrrrkkk../.krwrrrrrRk./.krwrrrrrRk./.krrrrrrrRk./.krrrrrrrRk./.krrrrrrRRk./..kRrrrRRk../...kkkkkk.../............',
  corn:'.....kk...../....kyyk..../...kyYyYk.../...kyyyyk.../...kyYyYk.../.k.kyyyyk.k./kgkkyYyYkkgk/kggkyyyykggk/.kggkyykggk./..kgggggggk./...kGGGGGk../....kkkkk...',
  cookie:'...kkkkkk.../..kttttttk../.ktNtttttnk./ktttttNtttnk/kttNttttttnk/ktttttttNtnk/kttttNttttnk/ktNtttttttnk/.ktttttNtnk./..knnnnnnk../...kkkkkk.../............',
  search:'..kkkkk...../.kcccccSk.../kccwwcccSk../kcwcccccSk../kcwcccccSk../kcccccccSk../.kcccccSkk../..kkkkkkSSk./........kSSk/.........kSk/..........kk/............',
  gear:'....kkkk..../.kk.kSSk.kk./kSSkkSSkkSSk/.kSSSSSSSSk./.kSSkkkkSSk./kkSk....kSkk/kSSk....kSSk/kkSk....kSkk/.kSSkkkkSSk./.kSSSSSSSSk./kSSkkSSkkSSk/.kk.kkkk.kk.',
  globe:'...kkkkkk.../..kbbggbbk../.kbgggbbbbk./kbbgggbbgbBk/kbbbggbggbBk/kbbbbgggbbBk/kbbbgggbbbBk/kbbbbggbbbBk/kbbbbbbggBBk/.kbbbbbbBBk./..kBBBBBBk../...kkkkkk...',
  up:'.....kk...../....kgGk..../...kgggGk.../..kggggggk../.kgggggggGk./kkkkggGGkkkk/....kgGk..../....kgGk..../....kgGk..../....kgGk..../....kgGk..../....kkkk....',
  turkey:'............/.......kkk../......knnnk./.....knttnNk/....kntttnNk/...knttttnNk/...kntttnNk./..kknnnnNk../.kwkkkkkk.../kwwk......../kwk........./.k..........',
  joystick:'....kkk...../...krrrk..../...kwrrk..../...krrRk..../....kkk...../.....kk...../.....kk...../.kkkkkkkkkk./kSSSSSSkrkSk/kSSSSSSkkkSk/kSSSSSSSSSSk/.kkkkkkkkkk.',
  carrot:'.......k.kk./......kgkgk./.....kglgk../....kkgkk.../...koook..../..koooook.../..kwoooNk.../.kooooNk..../.kooooNk..../kooooNk...../koNNk......./kkk.........',
  fish:'............/..kkk......./.kcbbk...kk./kcbbbbkk.kbk/kcwkbbbbkbBk/kcbbbbbbbbBk/kcbbbbbbbbBk/.kcBbbbBkkBk/..kBBBBk..kk/...kkkk...../............/............',
  pin:'...kkkkk..../..krrrrrk.../.krwwrrrRk../.krwkkrrRk../.krrkkrrRk../.krrrrrrRk../..krrrrRk.../...krrRk..../...krRk...../....kk....../...kSSk...../....kk......',
  sofa:'............/.kkkkkkkkkk./kppppppppppk/kpwppppppPPk/kpkkkkkkkkPk/kppppppppppk/kPkpppppppkk/kPkpppppppPk/kPPPPPPPPPPk/kkkkkkkkkkkk/.kk......kk./............',
  cards:'.kkkkkkk..../kwwwwwwwk.../kwrwwwwwkkk./kwwwwwwkwwwk/kwwwrwwkwkwk/kwwrrrwkwkwk/kwwwrwwkkkkk/kwwwwwwkwkwk/kwwwwwrkwwwk/kwwwwwwkwwwk/.kkkkkkkkkkk/............',
  ticket:'............/.kkkkkkkkkk./kyyyyyyyyyyk/kykkyyyyykyk/.kyyyyyyyyk./..kyyyyyyk../.kyyyyyyyyk./kykkyyyyykyk/kyyyyyyyyyyk/.kkkkkkkkkk./............/............',
  x:'............/.kk......kk./.kkk....kkk./..kkk..kkk../...kkkkkk.../....kkkk..../....kkkk..../...kkkkkk.../..kkk..kkk../.kkk....kkk./.kk......kk./............',
  hammer:'............/.kkkkkk...../kSSSSSSk..../kSwwwwSSkk../kSSSSSSkNk../.kkkkkkkNNk./.......kNNk./........kNNk/.........kNk/..........kk/............/............',
  broom:'............/..........kk/.........knk/........knk./.......knk../..kkkkknk.../.kyyyykk..../kyyyyyyk..../kyYyYyyk..../kyYyYyk...../kYYYYk....../kkkkk.......',
  key:'............/..kkkk....../.kyyyyk...../kyykkyyk..../kykk.kyk..../kyykkyykkkkk/.kyyyyyyyyyk/..kkkkkkykyk/........kkkk/............/............/............',
  bell:'.....kk...../....kyyk..../...kyyyyk.../..kywyyyYk../..kywyyyYk../..kywyyyYk../.kyyyyyyyYk./.kyyyyyyyYk./kkkkkkkkkkkk/kYYYYYYYYYYk/kkkkkkkkkkkk/.....kk.....',
  noentry:'....kkkk..../..kkrrrrkk../.krrrrrrrrk./.krrrwwwrrk./krrrrrwwwrRk/krrwrrrwwrRk/krrwwrrrwrRk/krrwwwrrrrRk/.krrwwwrrRk./.krrrrrrRRk./..kkRRRRkk../....kkkk....',
  flag:'.kk........./.kwkkkkkkk../.kwkrrrrrrk./.kwkrrrrrrrk/.kwkrrrrrrRk/.kwkrrrrrRRk/.kwkkkkkkkkk/.kwk......../.kwk......../.kwk......../.kwk......../.kkk........',
  eye:'............/............/...kkkkkk.../..kwwwwwwk../.kwwkkkkwwk./kwwkbbwbkwwk/kwwkbbbbkwwk/.kwwkkkkwwk./..kwwwwwwk../...kkkkkk.../............/............',
  arrowr:'............/......kk..../......kgk.../......kggk../kkkkkkkgggk./kgggggggggGk/kgggggggggGk/kkkkkkkgggk./......kggk../......kgk.../......kk..../............',
  people:'............/..kkk...kkk./.kpppk.kbbbk/.kpppk.kbbbk/.kpppk.kbbbk/..kkk...kkk./.kpppkkkbbbk/kpppppkbbbbk/kpppppkbbbbk/kppppppkbbbk/kkkkkkkkkkkk/............',
  clock:'...kkkkkk.../..kwwwwwwk../.kwwwkwwwSk./kwwwwkwwwwSk/kwwwwkwwwwSk/kwwwwkkkwwSk/kwwwwwwwwwSk/kwwwwwwwwwSk/.kwwwwwwwSk./..kSSSSSSk../...kkkkkk.../............',
  play:'............/............/....k......./....kk....../....kkk...../....kkkk..../....kkkk..../....kkk...../....kk....../....k......./............/............',
  undo:'............/...k......../..kk......../.kkkkkkkk.../kkkkkkkkkk../.kkk.....kk./..kk......kk/...k......kk/..........kk/.........kk./.....kkkkk../.....kkkk...',
  playl:'............/............/.......k..../......kk..../.....kkk..../....kkkk..../....kkkk..../.....kkk..../......kk..../.......k..../............/............',
  d_jobs:'.....kkkkkk...../....kwwwwyyk..../...kwwwwyyyyk.../..kwwwwyyyyyyk../.kwwwyyykyyyyyk./.kwwyyykkkkyyyk./kwwwyykkkyyyyyYk/kwwyyyykkkyyyYYk/kwyyyyyykkkyYYYk/.kyyyykkkkyYYYk./.kyyyyyykyYYYYk./..kyyyyyyYYYYk../...kyyyyYYYYk.../....kyyYYYYk..../.....kkkkkk...../................',
  d_friends:'.........kwsk.../........kwwwsk../....kkkkwwwwssk./...kwwskwwkwksk./..kwwwwskwwwsk../..kwkwkskkwsk.../..kpwwwpkwwwsk../..kwwwwskwwwssk./...kwwskwwwwssk./..kkkkkkkwwwssk./.kwwwwwwskssssk./kwwwwwwwwskkkk../kwwwwwwwwsk...../ksssssssssk...../.kkkkkkkkk....../................',
  d_chat:'................/..kkkkkkkkkkk.../.kwwwwwwwwwwwk../kwwwwwwwwwwwwsk./kwwwwwwwwwwwwsk./kwwkkwwkkwwkksk./kwwkkwwkkwwkksk./kwwwwwwwwwwwwsk./kswwwwwwwwwwssk./.kssswwwwsssssk./..kkkkwwkkkkkk../.....kwk......../.....kk........./.....k........../................/................',
  d_map:'................/................/..kkkkkkkkkkkk../.kwwwssssSwwwwk./.kwggssssSwrwrk./.kwgwsssskwwrwk./.kwwwssssSwrwrk./.kwwwssskSwwwwk./.kwwwskssSwwwwk./.kwwwssssSwwwwk./.kwwwksssSwwwwk./.kwkwssssSwwwwk./.kwwwssssSwwwwk./..kkkkkkkkkkkk../................/................',
  d_rooms:'................/.......kk..kkk../......kwwk.kSk../.....kwwwwkkSk../....kwwwwwwkSk../...kwwwwwwwwkk../..kwwwwwwwwwwk../.kkkkkkkkkkkkkk./..kwwwwwwwwwwk../..kwkkkwwkkkwk../..kwkbkwwkskwk../..kwkkkwwkskwk../..kwwwwwwkkkwk../..kssssssksssk../.kkkkkkkkkkkkkk./................',
  d_bag:'................/.....kkkkkk...../....kwkkkkwk..../....kk....kk..../.kkkkkkkkkkkkkk./kwwwwwwwwwwwwwsk/kwwwwwwwwwwwwwsk/kwwwwwwkkwwwwwsk/kkkkkkkyykkkkkkk/kwwwwwwkkwwwwwsk/kwwwwwwwwwwwwwsk/kwwwwwwwwwwwwssk/kswwwwwwwwwwsssk/kssssssssssssssk/.kkkkkkkkkkkkkk./................',
  plinko:'.....kk...../....kwpk..../....kppk..../.....kk...../............/.....y....../....y.y...../...y.y.y..../..y.y.y.y.../kkkkkkkkkkkk/kykgkbkgkykk/kkkkkkkkkkkk',
  d_shop:'................/................/...kkkkkkkkkk.../..kwwwwwwwwwsk../..kwwwwwwwwwsk../.kkkwwwwwwwwkkk./kwwwkwwwwwwkwwsk/kwwwkkkkkkkkwwsk/kwwwkwwwwwwkwwsk/kwwwwwwwwwwwwssk/kssssssssssssssk/kkkkkkkkkkkkkkkk/.kSk........kSk./.kkk........kkk./................/................',
  bdg_new:'............/..kkk.kkk.../.kglgkgllk../.kgggkgggk../..kGGkGGk.../....kgk...../....kgk...../....kgk...../..kkkkkkk.../.knnnnnnnk../.kNNNNNNNk../..kkkkkkk...',
  bdg_wk:'..kkk..kkk../..krk..krk../...krkkrk.../....krrk..../...kkkkkk.../..knnnnnnk../.knwnnnnnNk./.knnnnnnnNk./.knnnnnnNNk./.knnnnnNNNk./..kNNNNNNk../...kkkkkk...',
  bdg_mo:'..kkk..kkk../..krk..krk../...krkkrk.../....krrk..../...kkkkkk.../..kssssssk../.kswsssssSk./.ksssssssSk./.kssssssSSk./.ksssssSSSk./..kSSSSSSk../...kkkkkk...',
  bdg_3m:'..kkk..kkk../..krk..krk../...krkkrk.../....krrk..../...kkkkkk.../..kyyyyyyk../.kywyyyyyYk./.kyyyyyyyYk./.kyyyyyyYYk./.kyyyyyYYYk./..kYYYYYYk../...kkkkkk...',
  bdg_6m:'..kkk..kkk../..kbk..kbk../...kbkkbk.../....kbbk..../...kkkkkk.../..kppppppk../.kpwpppppPk./.kpppppppPk./.kppppppPPk./.kpppppPPPk./..kPPPPPPk../...kkkkkk...',
  bdg_1y:'..kkk..kkk../..kvk..kvk../...kvkkvk.../....kvvk..../...kkkkkk.../..kcccccck../.kcwcccccbk./.kcccccccbk./.kccccccbbk./.kcccccbbbk./..kbbbbbbk../...kkkkkk...',
  bdg_2y:'..kkk..kkk../..kyk..kyk../...kykkyk.../....kyyk..../...kkkkkk.../..kvvvvvvk../.kvwvvvvvVk./.kvvvvvvvVk./.kvvvvvvVVk./.kvvvvvVVVk./..kVVVVVVk../...kkkkkk...',
  bug:'...k....k.../....k..k..../....kkkk..../..kkkkkkkk../.krwrkkrrrk./krrkrkkrkrrk/krrrrkkrrrrk/krkrrkkrrkrk/krrrrkkrrrrk/.krrrkkrrrk./..kkkkkkkk../............',
  stall:'............/kkkkkkkkkkkk/krwrwrwrwrwk/krwrwrwrwrwk/kkkkkkkkkkkk/.krkrkrkrkr./.k........k./.k.kkkkkk.k./.k.kyyyyk.k./.k.kyYYyk.k./knnnnnnnnnnk/kkkkkkkkkkkk',
  em_wow:'.....kkkkkk...../...kkyyyyyYkk.../..kyyyyyyyyyYk../.kyywyykkyyyyYk./.kywyyykkyyyyYk./kyyyyyykkyyyyyYk/kyyyyyykkyyyyyYk/kyyyyyykkyyyyyYk/kYyyyyykkyyyyyYk/.kyyyyyyyyyyyYk./.kYyyyykkyyyyYk./..kYyyykkyyYYk../...kyyYYYYYkk.../..kyYYkkkkk...../..kYkk........../...k............',
  em_huh:'.....kkkkkk...../...kkcccccBkk.../..kccbbbbbbcBk../.kcbbbwwwwbbbBk./.kcbbwwbbwwbbBk./kcbbbbbbbwwbbbBk/kcbbbbbbwwbbbbBk/kcbbbbbwwbbbbbBk/kBbbbbbwwbbbbbBk/.kcbbbbbbbbbbBk./.kBbbbbwwbbbbBk./..kBbbbwwbbBBk../...kcbBBBBBkk.../..kcBBkkkkk...../..kBkk........../...k............',
  em_lol:'....kkkkkkkk..../...kyyyyyyyYk.../..kyyyyyyyyyYk../.kyyyyyyyyyyyYk./kyyyykyyyykyyyYk/kyyykykyykykyyYk/kyyyyyyyyyyyyyYk/kcyyyyyyyyyyyyck/kcyykkkkkkkkyyck/cyyykwwwwwwkyyYc/kyyykRRRRRRkyyYk/kYyyykppppkyyyYk/.kYyykppppkyyYk./..kYyyykkyyyYk../...kYYYYYYYYk.../....kkkkkkkk....',
  em_zzz:'kkkkkkk...../kbbbbbk...../kkkkbbk...../..kbbk....../.kbbk......./kbbkkkk...../kbbbbbkkkkkk/kkkkkkkkbbbk/........kbk./.......kbk../.......kbbbk/.......kkkkk',
  em_palm:'............../kkkkkkkkk...../kffffffffkk.../kkkkkkkkfkyk../kfffffffffkykk/kkkkkkkkkkyykc/.kyyyyyyyyyykk/.kykkkyykkkyyk/.kpyyyyyyyypyk/.kyyyyyyyyYYk./..kyykkkkyYYk./..kyyyyyYYYk../...kkyyyYYkk../.....kkkkk....',
  warn:'.....kk...../....kyyk..../....kyyk..../...kyyyyk.../...kykkyk.../..kyykkyyk../..kyykkyyk../.kyyykkyyyk./.kyyyyyyyyk./kyyyykkyyyYk/kyyyyyyyyYYk/kkkkkkkkkkkk',
  camr:'............/...kkk....../...kwwk...../....kwwk..../.....kwwk.../......kwwk../......kwwk../.....kwwk.../....kwwk..../...kwwk...../...kkk....../............',
  caml:'............/......kkk.../.....kwwk.../....kwwk..../...kwwk...../..kwwk....../..kwwk....../...kwwk...../....kwwk..../.....kwwk.../......kkk.../............',
  back:'............/......kk..../.....kkk..../....kkk...../...kkk....../..kkk......./..kkk......./...kkk....../....kkk...../.....kkk..../......kk..../............'
};
const PIXURL={}, PIXIMG={};
const EMO={'🌴':'jungle','🥊':'glove','🧰':'chest','📡':'radar','⚠️':'warn','⚠':'warn','🐞':'bug','🏪':'stall','🪙':'coin','💰':'coin','⭐':'star','💦':'splash','💧':'drop','🛍':'bag','🎒':'backpack','🏠':'house','🍔':'burger','🎳':'bowl','💬':'chat','🔐':'lock','🔒':'lock','🎰':'slots','🎁':'gift','🏆':'trophy','🚪':'door','🛡':'shield','🤝':'handshake','🍸':'cocktail','🥤':'cup','👕':'shirt','📦':'box','🎨':'palette','🔥':'fire','✅':'check','✔':'check','✓':'check','🌾':'wheat','👑':'crown','💛':'goldheart','📨':'envelope','📧':'envelope','🌶':'pepper','✳':'sparkle','🪑':'chair','💡':'bulb','✋':'hand','👋':'hand','🎲':'dice','⚾':'ball','🎡':'wheel','⏳':'hourglass','⏰':'clock','💾':'disk','🥇':'gold1','🥈':'silver2','🥉':'bronze3','🔴':'reddot','📈':'chart','💯':'hundred','😄':'smile','📜':'scroll','📋':'scroll','💪':'muscle','🦙':'llama','💤':'zzz','🔊':'speaker','🎵':'music','🛏':'bed','🍽':'plate','📚':'books','📺':'tv','🪴':'plant','🧶':'yarn','🍎':'apple','🌽':'corn','🍪':'cookie','🔍':'search','⚙':'gear','🌍':'globe','⬆':'up','🦃':'turkey','🕹':'joystick','🥕':'carrot','🎣':'fish','📍':'pin','🛋':'sofa','🃏':'cards','✕':'x','👥':'people','🎫':'ticket','🔨':'hammer','🧹':'broom','🔑':'key','🔔':'bell','👁':'eye','➡':'arrowr','🕐':'clock','🎯':'plinko','▶':'play','◀':'playl','↩':'undo','♥':'heart','🚫':'noentry','🚩':'flag'};
(function(){ const c=document.createElement('canvas'), x=c.getContext('2d'); let css='';
  for (const [n,src] of Object.entries(PIXSRC)){ const rows=src.split('/'); c.width=rows[0].length; c.height=rows.length; x.clearRect(0,0,c.width,c.height); src.split('/').forEach((r,j)=>{ for (let i=0;i<r.length;i++){ const col=PIXPAL[r[i]]; if (col){ x.fillStyle=col; x.fillRect(i,j,1,1); } } }); PIXURL[n]=c.toDataURL(); { const im=new Image(); im.src=PIXURL[n]; PIXIMG[n]=im; } css+=`.pi-${n}{background-image:url(${PIXURL[n]})}`; }
  /* sizes are whole multiples of the 12px art in real screen pixels, so every art pixel stays square */
  const dpr=window.devicePixelRatio||1, snap=t=>Math.max(1,Math.round(t*dpr/12))*12/dpr;
  const snap16=t=>Math.max(1,Math.round(t*dpr/16))*16/dpr;
  const st=document.createElement('style'); st.textContent=`:root{--pi1:${snap(16)}px;--pi2:${snap(24)}px;--pi3:${snap(36)}px;--q2:${snap16(20)}px}`+css; document.head.appendChild(st); })();
const pix = (n, cls) => `<span class="pi pi-${n}${cls?' '+cls:''}" aria-hidden="true"></span>`;
const EMO_KEYS=Object.keys(EMO).sort((a,b)=>b.length-a.length).map(e=>e.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');
const EMO_RE=new RegExp('('+EMO_KEYS+')\\uFE0F?','gu'), EMO_HAS=new RegExp(EMO_KEYS,'u');
const ICO_SKIP=new Set(['SCRIPT','STYLE','TEXTAREA','INPUT','OPTION','TITLE','CANVAS','SVG','svg']);
function iconText(t){ const p=t.parentNode, s=t.data; if (!p || ICO_SKIP.has(p.nodeName) || !EMO_HAS.test(s)) return;
  const f=document.createDocumentFragment(); let last=0, m; EMO_RE.lastIndex=0;
  while ((m=EMO_RE.exec(s))){ if (m.index>last) f.appendChild(document.createTextNode(s.slice(last,m.index))); const i=document.createElement('span'); i.className='pi pi-'+EMO[m[1]]; i.setAttribute('aria-hidden','true'); f.appendChild(i); last=m.index+m[0].length; }
  if (last<s.length) f.appendChild(document.createTextNode(s.slice(last))); p.replaceChild(f,t); }
function iconize(root){ if (!root) return; if (root.nodeType===3) return iconText(root); if (root.nodeType!==1 || ICO_SKIP.has(root.nodeName)) return;
  const w=document.createTreeWalker(root, NodeFilter.SHOW_TEXT), list=[]; let n; while ((n=w.nextNode())) if (EMO_HAS.test(n.data)) list.push(n); list.forEach(iconText); }
iconize(document.body);
new MutationObserver(ms=>{ for (const m of ms){ if (m.type==='characterData') iconText(m.target); else for (const n of m.addedNodes) iconize(n); } }).observe(document.body, {childList:true, subtree:true, characterData:true});
// menu tiles draw their icon from data-i
for (const d of document.querySelectorAll('.menu [data-i]')){ const k=EMO[d.dataset.i.replace(/\uFE0F/g,'')]; if (k) d.style.setProperty('--ic', `url(${PIXURL[k]})`); }

// ======================= CHARACTERS & SPRITES =======================
const OUT = '#1a1020', HOOF = '#2b1d18';
const CHARS = {
  twotone: { label:'Two-Tone', blurb:'Half gold, half teal, red fur coat.', split:true, ears:'up', tuft:true,
    fur:{ a:['#e2a93f','#b17823','#f8d77f'], b:['#5aa99e','#3a7c73','#93d4c8'] }, outfit:'furcoat', tag:'#f0b94a' },
  poophat: { label:'Poop Hat', blurb:'Crying, grinning, gold chain.', ears:'droop', hat:'poop', tears:true,
    fur:{ a:['#efe1c8','#c6b08d','#fffaf0'] }, outfit:'chain', tag:'#d29a5c' },
  tweed:   { label:'The Professor', blurb:'Tweed jacket and a fancy ascot.', ears:'droop', tuft:true,
    fur:{ a:['#3f8fd4','#285f9a','#7cbcec'] }, outfit:'tweed', tag:'#5ab0ff' },
  // from the La Llama P.I.C. art: tee = a shirt the llama comes with (any shirt you buy goes over it), look = glasses it comes with, teeth = its grin
  metal:   { label:'Metalhead', blurb:'Pixel shades, spiked collar, band tee.', ears:'mixed', tuft:true, look:'pixel', teeth:'buck',
    fur:{ a:['#8e4c26','#5e2c12','#b8703e'] }, tee:{c:['#262a3e','#161828','#3c4260'], pr:'band'}, outfit:'collar', tag:'#e07a3a' },
  money:   { label:'Easy Money', blurb:'Face tattoos, gold tooth, white suit.', ears:'up', tuft:true, look:'big', teeth:'gold', tattoo:true,
    fur:{ a:['#eedcc2','#c6a888','#fff6e6'] }, tee:{c:['#f4f2ee','#c4c0b8','#ffffff']}, outfit:'suit', tag:'#f0c048' },
  gingham: { label:'Picnic', blurb:'Red gingham from ears to toes.', ears:'up', tuft:true, look:'round', teeth:'buck', check:true,
    fur:{ a:['#e8303a','#a8141e','#ff6a70'], b:['#fbeee6','#e2cfc4','#ffffff'] }, tag:'#ff5a64' },
  cancel:  { label:'Uncancelable', blurb:'Big red sun hat with flowers.', ears:'droop', hat:'sunhat', teeth:'gold',
    fur:{ a:['#f0e2cc','#c8ae8e','#fffaf0'] }, tag:'#c83a3a' }
};
// PENNY works the LLAMA STORE register; she's drawn like everyone else but isn't a llama players can pick
CHARS.gus = { label:'Gus', blurb:'Shows new llamas around.', ears:'up', npc:true, hat:'cap', fur:{ a:['#f2c27a','#c8904a','#fff0cc'] }, tag:'#f2c27a' };   // GUS the tour guide (only you see him, during the tour)
CHARS.penny = { label:'Penny', blurb:'Runs the LLAMA STORE.', ears:'up', npc:true, outfit:'apron', hat:'visor', fur:{ a:['#c9b6f0','#9f8ad6','#ece2ff'] }, tag:'#c9b6f0' };
// casino dealers: green dealer's visor, black vest over a white shirt, red bow tie
const DEALER_VISOR=['#3fb86a','#1f7a44','#9ae8b0'];
CHARS.rico  = { label:'Rico',  blurb:'Spins the roulette wheel.', ears:'up',    npc:true, outfit:'dealer', hat:'visor', visorCol:DEALER_VISOR, fur:{ a:['#ead9b6','#c4a77a','#fff4dc'] }, tag:'#3fb86a' };
CHARS.lucky = { label:'Lucky', blurb:'Deals blackjack.',          ears:'droop', npc:true, outfit:'dealer', hat:'visor', visorCol:DEALER_VISOR, fur:{ a:['#9a7450','#74543a','#c09670'] }, tag:'#3fb86a' };
CHARS.ace   = { label:'Ace',   blurb:'Deals blackjack.',          ears:'droop', npc:true, outfit:'dealer', hat:'visor', visorCol:DEALER_VISOR, fur:{ a:['#6a5a4c','#4c3e32','#8c7a68'] }, tag:'#3fb86a' };
CHARS.model = { label:'Model', blurb:'Shows off the latest looks.', ears:'up', npc:true, fur:{ a:['#f4f0ea','#cfc8bc','#ffffff'] }, tag:'#ff5c8a' };
CHARS.dot   = { label:'Dot',   blurb:'Deals blackjack.',          ears:'up',    npc:true, outfit:'dealer', hat:'visor', visorCol:DEALER_VISOR, fur:{ a:['#c4c4d4','#9494a8','#ececf4'] }, tag:'#3fb86a' };
const CHAR_IDS = Object.keys(CHARS).filter(k=>!CHARS[k].npc);
const SW = 28, SH = 46;
const RED = ['#e3263f','#a3132b','#ff6b7d'];
const TWEED = ['#7a5838','#5a3e25','#9a7651'];
const HAT = ['#7a4216','#55290b','#a8642e'];
const hash = (x,y) => (((x*73856093) ^ (y*19349663)) >>> 0);

// ======================= WARDROBE ITEMS (the server keeps the same slots and prices) =======================
const WEAR_SLOTS=['hat','eyes','neck','shirt','hands','legs'], SLOT_NAMES={hat:'HATS', eyes:'GLASSES', neck:'NECK', shirt:'SHIRTS', hands:'GLOVES', legs:'SHORTS'};
const ITEMS={
  cap:{s:'hat',p:20,n:'PINK CAP',c:['#f85888','#c8306a','#ffa0c0']}, cowboy:{s:'hat',p:30,n:'COWBOY HAT',c:['#b07438','#7a4a1c','#d8a060']},
  beanie:{s:'hat',p:15,n:'TEAL BEANIE',c:['#3fb8a8','#22806e','#8ae8d8']}, party:{s:'hat',p:10,n:'PARTY HAT',c:['#f8d030','#f85888','#ffffff']},
  tophat:{s:'hat',p:40,n:'TOP HAT',c:['#2e2840','#1a1626','#5a5070']}, flowers:{s:'hat',p:25,n:'FLOWER CROWN',c:['#4aa04a','#2e7a2e','#f85888']},
  shades:{s:'eyes',p:20,n:'COOL SHADES',c:['#1a1626','#3a3456','#6a6a9a']}, hearts:{s:'eyes',p:25,n:'HEART GLASSES',c:['#f85888','#c8306a','#ffd0e0']}, stars:{s:'eyes',p:25,n:'STAR GLASSES',c:['#f8d030','#c89818','#fff4b0']},
  bandana:{s:'neck',p:12,n:'RED BANDANA',c:['#e03048','#a81830','#ffffff']}, bowtie:{s:'neck',p:15,n:'BOW TIE',c:['#8a48e0','#5a2aa8','#c8a0ff']},
  scarf:{s:'neck',p:18,n:'COZY SCARF',c:['#f08a30','#f4e6c8','#b85a18']}, lei:{s:'neck',p:15,n:'FLOWER LEI',c:['#f85888','#f8d030','#ffffff']},
  tee_smile:{s:'shirt',p:25,n:'SMILE TEE',c:['#6b6b4a','#4e4e34','#8a8a64'],pr:'smile'}, tee_cancelled:{s:'shirt',p:25,n:'CANCELLED TEE',c:['#4b3bb0','#33287e','#6a5ad0'],pr:'cancelled'},
  tee_wild:{s:'shirt',p:25,n:'GONE WILD TEE',c:['#2c2a34','#1a1820','#4a4856'],pr:'wild'}, tee_cancel:{s:'shirt',p:25,n:'CANCEL CULTURE TEE',c:['#2c2a34','#1a1820','#4a4856'],pr:'cancel'},
  tee_woke:{s:'shirt',p:25,n:'GOT WOKE? TEE',c:['#f4f4f0','#c8c8c4','#ffffff'],pr:'woke'},
  tee_lounge:{s:'shirt',p:25,n:'LOUNGE TEE',c:['#f85888','#c8306a','#ffa0c0'],pr:'lounge'}, tee_acres:{s:'shirt',p:25,n:'ACRES TEE',c:['#4aa04a','#2e7a2e','#7fd07f'],pr:'acres'},
  tee_arena:{s:'shirt',p:25,n:'SPIT ARENA TEE',c:['#3a7ad8','#28589e','#6aa8f0'],pr:'arena'},
  // ponchos: a woven serape draped over the shoulders, striped, with a V hem and fringe. st = the stripe bands from the shoulders down, fr = fringe colour
  poncho:{s:'shirt',p:35,n:'CLASSIC PONCHO',c:['#e03048','#a81830','#ff7088'],pon:true, st:['#e03048','#f8d030','#2e8a4a','#f08a30','#2a5aa8','#f8f0e0','#e03048','#8a48e0','#f8d030','#2e8a4a'], fr:'#f8f0e0'},
  // boxing kit: c = main, shade, shine; cuff = the band at the wrist or waist
  gloves:{s:'hands',p:30,n:'BOXING GLOVES',c:['#e8303c','#a8141e','#ff8a90'],cuff:'#f8f4ea'},
  shorts:{s:'legs',p:30,n:'BOXING SHORTS',c:['#2a5ad8','#1a3a98','#78a0ff'],cuff:'#f8f4ea'},
  // the November batch
  crown:{s:'hat',p:50,n:'GOLDEN CROWN',c:['#f6c945','#c8951c','#fff6c0']}, chullo:{s:'hat',p:25,n:'LLAMA CHULLO',c:['#d8303c','#8e1a26','#f8d030']}, headphones:{s:'hat',p:30,n:'HEADPHONES',c:['#3a3e52','#22242e','#f85888']},
  nerd:{s:'eyes',p:15,n:'NERD GLASSES',c:['#1a1626','#3a3456','#ffffff']}, glasses3d:{s:'eyes',p:15,n:'3D GLASSES',c:['#f4f4f0','#c8c8c4','#ffffff']},
  chain:{s:'neck',p:40,n:'GOLD CHAIN',c:['#f6c945','#c8951c','#fff6c0']}, tie:{s:'neck',p:15,n:'NECKTIE',c:['#2a5ad8','#1a3a98','#78a0ff']},
  hoodie_gray:{s:'shirt',p:35,n:'GRAY HOODIE',c:['#8a8a96','#5e5e6a','#b0b0ba'],hood:true}, hoodie_pink:{s:'shirt',p:35,n:'PINK HOODIE',c:['#f878b0','#c84880','#ffb0d0'],hood:true},
  sweater:{s:'shirt',p:30,n:'HOLIDAY SWEATER',c:['#2e8a5a','#1e5e3e','#5ab884'],knit:true}, tee_heart:{s:'shirt',p:25,n:'HEART TEE',c:['#f4f4f0','#c8c8c4','#ffffff'],pr:'heart'}, tee_llama:{s:'shirt',p:25,n:'LLAMA TEE',c:['#3a7ad8','#28589e','#6aa8f0'],pr:'llama'},
  poncho_orange:{s:'shirt',p:35,n:'ORANGE PONCHO',c:['#f08a30','#b85a18','#ffb870'],pon:true, st:['#f08a30','#f08a30','#5a3418','#f8e8c8','#f08a30','#f08a30','#b85a18','#f8e8c8','#f08a30','#f08a30'], fr:'#f8e8c8'},
};
// shirt prints, 6 x 4 pixels, used for the worn shirt and the one on the hanger
const TEE_PRINTS={ smile:['..aa..','.abba.','.aaaa.','..cc..'], cancelled:['.bbbb.','bbccbb','.bbbb.','dddddd'], wild:['..e...','.efe.e','efffef','ffffff'], cancel:['gggggg','......','gggggg','gggg..'], woke:['hhhhh.','......','hhhhhh','hh....'],
  lounge:['gggggg','g.ii.g','g.ii.g','gggggg'], band:['g.gg.g','gggggg','.g..g.','g.gg.g'], acres:['...jj.','..kk..','.kk...','kk....'], arena:['.g..g.','gg.gg.','.g..g.','......'], heart:['.l..l.','llllll','.llll.','..ll..'], llama:['g.....','gg....','.gggg.','.g..g.'] };
const TEE_PC={l:'#e8304c',a:'#d8b07a',b:'#6fd0ff',c:'#1a1626',d:'#d8b07a',e:'#ffb030',f:'#e03048',g:'#ffffff',h:'#1a1626',i:'#f8d030',j:'#4aa04a',k:'#ff8a30'};
const cleanWear = w => { const o={}; if (w && typeof w==='object') for (const s2 of WEAR_SLOTS){ const k=w[s2]; if (typeof k==='string' && ITEMS[k] && ITEMS[k].s===s2) o[s2]=k; } return o; };
const wearKey = w => w ? WEAR_SLOTS.map(s2=>w[s2]||'').join(',')+(w.hold?',h':'') : '';
function buildSprite(cid, dir, frame, pose, wear, only) {
  const W = cleanWear(wear), L = !only;   // only: draw just the worn items (for the store racks and previews)
  const ch = CHARS[cid];
  const front = dir[0] === 'f';
  const flip = (dir === 'fl' || dir === 'bl');
  const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH;
  const g = cv.getContext('2d');
  const put = (x,y,col) => { x=Math.round(x); y=Math.round(y); if(!col||x<0||y<0||x>=SW||y>=SH) return; g.fillStyle=col; g.fillRect(flip?SW-1-x:x,y,1,1); };
  const rect = (x,y,w,h,col) => { for(let j=0;j<h;j++) for(let i=0;i<w;i++){ const X=x+i,Y=y+j; put(X,Y,typeof col==='function'?col(X,Y):col); } };
  const inE = (x,y,cx,cy,rx,ry) => { const dx=(x-cx)/rx, dy=(y-cy)/ry; return dx*dx+dy*dy<=1; };
  const ell = (cx,cy,rx,ry,col) => { for(let y=Math.floor(cy-ry-1);y<=Math.ceil(cy+ry+1);y++) for(let x=Math.floor(cx-rx-1);x<=Math.ceil(cx+rx+1);x++) if(inE(x,y,cx,cy,rx,ry)) put(x,y,typeof col==='function'?col(x,y):col); };
  const oell = (cx,cy,rx,ry,col,out=OUT) => { ell(cx,cy,rx+1,ry+1,out); ell(cx,cy,rx,ry,col); };

  const sit = pose === 'sit';
  const bob = (!sit && (frame===1||frame===3)) ? 1 : 0;
  const oy = sit ? 6 : bob;
  const splitX = (y) => (front && y>=14+oy && y<=23+oy) ? 16 : 14;
  const side = (x,y) => ch.split ? ((((x<splitX(y)) !== flip) === front) ? 'a' : 'b') : 'a';
  const pal = (x,y) => ch.check ? ((((x>>1)+(y>>1))&1) ? ch.fur.b : ch.fur.a) : ch.fur[side(x,y)];   // gingham: 2x2 checks
  const shadeFn = (cx,cy,rx,ry,palFn) => (x,y) => { const p=palFn(x,y); const nx=(flip?-(x-cx):(x-cx))/rx, ny=(y-cy)/ry; if(nx>0.5||ny>0.6) return p[1]; if(nx<-0.3&&ny<-0.2) return p[2]; return p[0]; };
  const fur = (cx,cy,rx,ry) => shadeFn(cx,cy,rx,ry,pal);
  const coatFn = (cx,cy,rx,ry) => (x,y) => { const h=hash(x,y)%7; if(h===0) return RED[2]; if(h===1) return RED[1]; return shadeFn(cx,cy,rx,ry,()=>RED)(x,y); };
  const tweedFn = (cx,cy,rx,ry) => (x,y) => { let c=shadeFn(cx,cy,rx,ry,()=>TWEED)(x,y); if((x+y)%4===0) c='#4f3620'; if(x%5===2&&y%2===0) c='#a8463a'; return c; };
  const TEE = W.shirt ? ITEMS[W.shirt] : (L && ch.tee ? ch.tee : null);   // a bought shirt goes over the one a llama comes with
  const teeFn = (cx,cy,rx,ry) => shadeFn(cx,cy,rx,ry,()=>TEE.c);
  const bodyFn = TEE ? teeFn : ch.outfit==='furcoat' ? coatFn : ch.outfit==='tweed' ? tweedFn : fur;

  // legs
  if (L && !sit) {
    const lUp = frame===1?1:0, rUp = frame===3?1:0;
    const leg = (x0,up) => { const y0=35, y1=44-up; rect(x0-1,y0,5,y1-y0+2,OUT); rect(x0,y0,3,y1-y0,(x,y)=>pal(x,y)[1]); rect(x0,y1,3,1,HOOF); };
    leg(9,lUp); leg(16,rUp);
  }
  // arms
  const swing = sit ? 0 : (frame===1?-1:frame===3?1:0);
  const armFn = TEE ? fur(13.5,32+oy,7,6) : bodyFn(13.5,32+oy,7,6);   // a shirt's sleeves are drawn with the shirt
  const arm = (cx,dy) => { oell(cx,31+oy+dy,1.8,4,armFn); put(cx-1,35+oy+dy,HOOF); put(cx,35+oy+dy,HOOF); put(cx+1,35+oy+dy,HOOF); };
  if (L || TEE){ arm(5.5,swing); arm(21.5,-swing); }
  // neck
  if (L){ rect(10,18+oy,8,9,OUT); rect(11,18+oy,6,9,fur(13.5,22+oy,3,5)); }
  // torso
  if (L || TEE) oell(13.5,31.5+oy,6.8,5.6,bodyFn(13.5,31.5+oy,6.8,5.6));
  if (W.legs){ const C=ITEMS[W.legs].c, CF=ITEMS[W.legs].cuff, bot=sit?37:40;   // satin boxing trunks: wide white waistband, a stripe down each side, split between the legs
    for (let y=34;y<=bot;y++){ const x0=y<=35?7:8, x1=y<=35?20:19, gap = !sit && y>=38;
      for (let x=x0;x<=x1;x++){ if (gap && x>=13 && x<=14) continue; let c = y<=35 ? CF : (x>=16?C[1]:C[0]);
        if (y>35 && (x===x0+1 || x===x1-1)) c = CF;                       // side stripe
        if (y>35 && x>=x0+2 && x<=x0+3 && y<=bot-1) c = c===CF?c:C[2];      // satin shine
        if (y===35 && (x===12||x===15)) c=C[1];                              // drawstring dimples
        put(x,y+oy,c); }
      put(x0-1,y+oy,OUT); put(x1+1,y+oy,OUT); if (gap){ put(12,y+oy,OUT); put(15,y+oy,OUT); } }
    for (let x=7;x<=20;x++) put(x,33+oy,OUT);
    for (let x=8;x<=19;x++) if (sit || x<12 || x>15) put(x,bot+1+oy,OUT);
    if (!sit) for (let x=12;x<=15;x++) put(x,38+oy,OUT);
    if (front) { put(13,36+oy,CF); put(14,37+oy,CF); } }
  if (TEE && TEE.pon){   // poncho: drapes from a neck hole over both arms, woven stripes, a V hem with fringe; hooves peek out under it
    const ST=TEE.st, rows={24:[11,16],25:[9,18],26:[7,20],27:[5,22],28:[4,23],29:[3,24],30:[3,24],31:[3,24],32:[3,24],33:[3,24],34:[4,23],35:[5,22],36:[6,21],37:[8,19],38:[10,17],39:[12,15]}, sp=y=>rows[y];   // sloped shoulders, widest at the arms, a deep V at the front
    for (let y=24;y<=39;y++){ const [x0,x1]=sp(y), band=ST[Math.min(ST.length-1,Math.max(0,y-27<0?0:Math.floor((y-27)/1.3)))];
      for (let x=x0;x<=x1;x++){ let c=band; const edge=(x<=x0+1)||(x>=x1-1);
        if ((y-25)%3===2 && !edge) c = (x%2) ? tint(band,-0.25)||band : band;   // a woven row
        if (x>=x1-2 || (flip && x<=x0+2 && !front)) c=tint(c,-0.2)||c; else if (x<=x0+2) c=tint(c,0.15)||c;
        put(x,y+oy,c); }
      put(x0-1,y+oy,OUT); put(x1+1,y+oy,OUT); }
    for (let x=11;x<=16;x++) put(x,23+oy,OUT); for (const [x,y] of [[9,24],[10,24],[17,24],[18,24],[7,25],[8,25],[19,25],[20,25],[5,26],[6,26],[21,26],[22,26],[4,27],[23,27],[3,28],[24,28]]) put(x,y+oy,OUT);
    if (front){ for (let x=12;x<=15;x++){ put(x,24+oy,fur(13.5,22+oy,3,5)(x,24+oy)); put(x,25+oy,fur(13.5,22+oy,3,5)(x,25+oy)); } put(11,25+oy,OUT); put(16,25+oy,OUT); put(12,26+oy,OUT); put(15,26+oy,OUT); put(13,26+oy,OUT); put(14,26+oy,OUT); }   // V neck
    // hem outline and fringe along the V
    const hem=[[3,34],[4,35],[5,36],[6,37],[7,37],[8,38],[9,38],[10,39],[11,39],[12,40],[13,40],[14,40],[15,40],[16,39],[17,39],[18,38],[19,38],[20,37],[21,37],[22,36],[23,35],[24,34]];
    for (const [x,y] of hem) put(x,y+oy,OUT);
    for (const [x,y] of hem) if (x%2===1) put(x,y+1+oy,TEE.fr);   // tassel fringe
  }
  else if (TEE){   // a proper T-shirt over the torso: short sleeves over the front legs, crew collar, hem, shading and the shirt's print
    const C=TEE.c, span={25:[10,17],26:[6,21],27:[4,23],28:[4,23],29:[4,23]}, sp=y=>span[y]||[8,19];
    for (let y=25;y<=37;y++){ const [x0,x1]=sp(y);
      for (let x=x0;x<=x1;x++){ let c=C[0]; if (x>=17) c=C[1]; if (x<=9 && y>=26 && y<=33) c=C[2];
        if ((x<8||x>19) && y===29) c=C[1]; if (y===37) c=C[1]; if (y===25 && x>=11 && x<=16) c=C[1]; put(x,y+oy,c); }
      put(x0-1,y+oy,OUT); put(x1+1,y+oy,OUT); }
    for (let x=10;x<=17;x++) put(x,24+oy,OUT); for (let x=6;x<=9;x++) put(x,25+oy,OUT); for (let x=18;x<=21;x++) put(x,25+oy,OUT); put(5,26+oy,OUT); put(22,26+oy,OUT);
    for (let x=3;x<=7;x++) put(x,30+oy,OUT); for (let x=20;x<=24;x++) put(x,30+oy,OUT); for (let x=8;x<=19;x++) put(x,38+oy,OUT);
    if (front){ for (let x=12;x<=15;x++) put(x,25+oy,fur(13.5,22+oy,3,5)(x,25+oy));   // the neck shows through the collar
      const P2=TEE_PRINTS[TEE.pr], PC=TEE_PC;
      if (P2) P2.forEach((row,j)=>{ for (let i=0;i<6;i++) if (row[i]!=='.') put(11+i,30+j+oy,PC[row[i]]); }); }
    else { for (let x=11;x<=16;x++) put(x,25+oy,C[1]); }
    if (TEE.hood){   // hoodie: thick hood around the neck, drawstrings and a front pocket; from behind, the hood hangs on the back
      if (front){ for (let x=8;x<=19;x++){ put(x,22+oy,OUT); put(x,23+oy,C[1]); put(x,24+oy,(x>=11&&x<=16)?C[1]:C[0]); } put(7,23+oy,OUT); put(20,23+oy,OUT); put(7,24+oy,OUT); put(20,24+oy,OUT);
        for (const x of [12,15]) for (let y=25;y<=28;y++) put(x,y+oy,y===28?C[2]:'#f4f4f0');
        for (let x=10;x<=17;x++){ put(x,32+oy,OUT); for (let y=33;y<=35;y++) put(x,y+oy,(x===10||x===17)?OUT:C[1]); } }
      else { oell(13.5,25.5+oy,4.6,2.6,(x,y)=>(y<25+oy)?C[0]:C[1]); } }
    if (TEE.knit){   // holiday sweater: a white zigzag band with red dots across the chest, ribbed hem and cuffs
      for (let x=5;x<=22;x++){ const zz=(x%4<2)?27:28; if (put) { put(x,zz+oy,'#ffffff'); } if (x%4===0) put(x,30+oy,'#e8304c'); }
      for (let x=8;x<=19;x++) if (x%2) put(x,36+oy,C[1]); for (const x of [4,6,21,23]) put(x,29+oy,C[1]); } }
  // tail (back)
  if (L && !front) oell(13.5,37.5+oy,1.6,1.3,fur(13.5,37.5+oy,1.6,1.3));
  if (W.hands){ const C=ITEMS[W.hands].c, CF=ITEMS[W.hands].cuff;   // big round boxing gloves over the front hooves: padded mitt, thumb, white cuff
    const glove=(cx,dy)=>{ const cy=35.5+oy+dy; oell(cx,cy,2.6,2.3,(x,y)=>{ const nx=(flip?-(x-cx):(x-cx)), ny=y-cy; return (nx<-0.8&&ny<-0.6)?C[2]:(nx>0.9||ny>1)?C[1]:C[0]; });
      const tx=Math.round(cx+(front?1.6:-1.6)), ty=Math.round(cy-1); if (front){ put(tx,ty,C[1]); put(tx,ty+1,OUT); }
      for (let x=Math.round(cx-2);x<=Math.round(cx+2);x++){ put(x,Math.round(cy-3),OUT); put(x,Math.round(cy-2.5)+0,CF); }
      put(Math.round(cx-3),Math.round(cy-2.5),OUT); put(Math.round(cx+3),Math.round(cy-2.5),OUT); };
    glove(5.5,swing); if (!(wear && wear.hold)) glove(21.5,-swing); }
  // outfit details (a worn shirt covers the character's own outfit)
  if (!L || W.shirt) {}
  else if (ch.outfit==='collar') {   // black leather collar with a silver ring at the throat
    for (let x=10;x<=17;x++){ put(x,22+oy,OUT); put(x,23+oy,'#2a2c38'); put(x,24+oy,(x===11||x===16)?'#9aa0b0':'#20222c'); put(x,25+oy,OUT); }
    if (front){ for (const [x,y] of [[13,25],[14,25],[12,26],[15,26],[12,27],[15,27],[13,28],[14,28]]) put(x,y+oy,'#c8ccd8'); put(13,26+oy,OUT); put(14,26+oy,'#e8ecf4'); } }
  else if (ch.outfit==='suit') {   // white jacket open over a red shirt with a big collar, gold chain and a glowing pendant
    if (front){ for (let y=25;y<=33;y++){ const w=Math.max(0,3-Math.floor((y-25)/3)); for (let x=13-w;x<=14+w;x++) put(x,y+oy, x>=14?'#b8141e':'#e02a34'); put(12-w,y+oy,'#a8a49c'); put(15+w,y+oy,'#a8a49c'); }
      for (const [x,y] of [[9,24],[10,25],[11,26],[18,24],[17,25],[16,26]]) put(x,y+oy,'#e02a34'); for (const [x,y] of [[8,24],[9,25],[10,26],[19,24],[18,25],[17,26]]) put(x,y+oy,OUT);
      for (let x=9;x<=18;x++){ const t=(x-13.5)/4.5; put(x,Math.round(26+4*(1-t*t))+oy,(x%2)?'#f6c945':'#c8951c'); } put(13,31+oy,'#fff6c0'); put(14,31+oy,'#f6c945'); put(13,32+oy,'#f6c945'); put(14,32+oy,'#c8951c');
      put(19,33+oy,'#e02a34'); put(20,33+oy,'#e02a34'); }   // pocket square
    else { for (let x=10;x<=17;x++) put(x,25+oy,'#e02a34'); } }
  else if (ch.outfit==='dealer') {   // casino dealer: black vest over a crisp white shirt, red bow tie, gold buttons
    if (front){ for (let y=25;y<=34;y++){ const w=Math.max(1,3-Math.floor((y-25)/3)); for (let x=9;x<=18;x++){ const shirt = x>=14-w && x<=13+w; put(x,y+oy, shirt ? (x<=13?'#ffffff':'#e4e0d8') : (x===9||x===18) ? OUT : (x<=11?'#3a3048':'#241c30')); } }
      for (const [x,y,c] of [[11,24,'#e02a34'],[12,24,'#ff5a62'],[13,24,'#a01820'],[14,24,'#a01820'],[15,24,'#ff5a62'],[16,24,'#e02a34'],[11,25,'#a01820'],[12,25,'#e02a34'],[15,25,'#e02a34'],[16,25,'#a01820'],[10,24,OUT],[17,24,OUT]]) put(x,y+oy,c);
      for (const y of [29,32]){ put(12,y+oy,'#f6c945'); put(15,y+oy,'#f6c945'); } }
    else { for (let x=9;x<=18;x++) put(x,25+oy,(x===9||x===18)?OUT:'#241c30'); } }
  else if (ch.outfit==='sign') {   // holds up a hand-written cardboard sign in green scaly gloves
    if (front){ rect(4,28+oy,20,10,OUT); rect(5,29+oy,18,8,(x,y)=> (x+y*3)%11===0 ? '#b08a58' : '#c8a070'); rect(5,36+oy,18,1,'#a88050');
      for (const [y,x0,x1] of [[30,7,20],[32,6,21],[34,8,19]]) for (let x=x0;x<=x1;x++) if ((x*7+y)%5!==0) put(x,y+oy,'#3a2a1c');
      for (const cx of [4,23]){ oell(cx,31+oy,2.4,2.6,(x,y)=>((x+y)%3===0)?'#1a8a3a':((x*y)%4===0?'#5ad06a':'#2eae4e')); } }
    else { rect(3,29+oy,2,8,'#a88050'); rect(23,29+oy,2,8,'#a88050'); } }
  else if (ch.outfit==='furcoat') {
    oell(13.5,26+oy,8.3,2.6,coatFn(13.5,26+oy,8.3,2.6));
    if (front) for (let y=27;y<=35;y++){ const h=y<29?2:y<32?1:0; rect(13-h,y+oy,2+2*h,1,'#1d1726'); }
  } else if (ch.outfit==='tweed') {
    if (front) {
      for (let y=26;y<=33;y++){ const h=Math.max(0,3-Math.floor((y-26)/2.5)); rect(13-h,y+oy,2+2*h,1,'#2f4c7a'); put(12-h,y+oy,'#3e2a18'); put(15+h,y+oy,'#3e2a18'); }
      const asc = (x,y) => ((x+y)%3===0) ? '#f3d1a2' : '#c7452f';
      rect(11,24+oy,6,1,OUT); rect(11,25+oy,6,2,asc); rect(13,27+oy,2,4,asc); rect(12,31+oy,4,2,asc); put(11,31+oy,OUT); put(16,31+oy,OUT); rect(12,33+oy,4,1,OUT);
    } else { rect(10,25+oy,8,1,'#c7452f'); }
  } else if (ch.outfit==='apron') {
    const AP=['#2fbf63','#1f8a4c','#7fe0a0'];
    if (front) {
      rect(9,25+oy,10,1,OUT); for (let y=26;y<=36;y++){ const w=y<29?3:5; rect(13-w,y+oy,2*w+2,1,(x,yy)=> (x===13-w||x===14+w) ? OUT : (x>=16?AP[1]:AP[0])); }
      rect(8,37+oy,12,1,OUT); put(10,25+oy,AP[2]); put(17,25+oy,AP[2]);
      rect(11,31+oy,4,3,'#f8f8f0'); rect(11,31+oy,4,1,'#d8d8d0'); put(16,28+oy,'#f85888'); put(17,28+oy,'#f85888');   // pocket and a pink name badge
    } else { for (let x=10;x<=17;x++){ put(x,25+oy,AP[1]); } for (let y=26;y<=33;y++){ put(10+Math.floor((y-26)/1.2),y+oy,AP[1]); put(17-Math.floor((y-26)/1.2),y+oy,AP[1]); } }
  } else if (ch.outfit==='chain') {
    if (front) {
      for (let x=9;x<=18;x++){ const t=(x-13.5)/4.5; const y=Math.round(25+5*(1-t*t)); put(x,y+oy,(x%2)?'#f6c945':'#c8951c'); }
      put(13,31+oy,'#f6c945'); put(14,31+oy,'#c8951c'); put(13,32+oy,'#fff1a8'); put(14,32+oy,'#f6c945'); put(13,33+oy,'#c8951c');
    } else { for (let x=10;x<=17;x++) put(x,25+oy,(x%2)?'#f6c945':'#c8951c'); }
  }
  // ears (upright ears tuck under hats that cover the top of the head)
  if (!L) {}
  else if (ch.ears==='up' && ['cap','beanie','tophat','cowboy','chullo','headphones'].includes(W.hat)) {}
  else if (ch.ears==='mixed') {   // one ear flopped over, one standing tall
    oell(5,11.5+oy,3.4,1.5,fur(5,11.5+oy,3.4,1.5)); for(let x=3;x<=6;x++) put(x,11.5+oy,pal(x,11+oy)[1]);
    if (!['cap','beanie','tophat','cowboy','chullo','headphones'].includes(W.hat)){ oell(18,4.4+oy,1.8,4.8,fur(18,4.4+oy,1.8,4.8)); for(let y=2;y<=6;y++) put(18,y+oy,pal(18,y+oy)[1]); put(19,0+oy,pal(19,0)[2]); } }
  else if (ch.ears==='up') {
    const ear = (cx) => { oell(cx,5+oy,1.7,4.2,fur(cx,5+oy,1.7,4.2)); for(let y=3;y<=6;y++) put(cx,y+oy,pal(cx,y+oy)[1]); };
    ear(9); ear(18);
  } else {
    const ear = (cx) => { oell(cx,11.5+oy,3.4,1.5,fur(cx,11.5+oy,3.4,1.5)); for(let x=cx-2;x<=cx+1;x++) put(x,11.5+oy,pal(x,11+oy)[1]); };
    ear(5); ear(22);
  }
  // snout peeking (back)
  if (L && !front) oell(19,16+oy,3,2.4,fur(19,16+oy,3,2.4));
  // head
  if (L) oell(13.5,13+oy,6.6,5.6,fur(13.5,13+oy,6.6,5.6));
  if (L && ch.tuft && !W.hat) {
    const tf = (x,y) => ((x+y)%2) ? pal(x,y)[0] : pal(x,y)[2];
    oell(12,7.6+oy,1.6,1.2,tf); oell(14.6,7+oy,1.6,1.2,tf); oell(16.8,8+oy,1.3,1,tf);
  }
  if (L && front) {
    // muzzle
    ell(16.5,18.2+oy,5.5,4.2,(x,y)=> inE(x,y,13.5,13+oy,6.6,5.6) ? pal(x,y)[1] : OUT);
    ell(16.5,18.2+oy,4.5,3.2,(x,y)=>{ const p=pal(x,y); const nx=(flip?-(x-16.5):(x-16.5))/4.5; return nx>0.55?p[0]:p[2]; });
    put(15,16+oy,OUT); put(18,16+oy,OUT);
    // grin
    const T='#f4efdc', TG='#b8b29c', LIP='#3a1a1c';
    put(12,18+oy,OUT); put(13,19+oy,OUT); for(let x=14;x<=19;x++) put(x,19+oy,OUT); put(20,19+oy,OUT); put(21,18+oy,OUT);
    for(let x=14;x<=19;x++) put(x,20+oy,x===16?TG:T); put(13,20+oy,OUT); put(20,20+oy,OUT);
    for(let x=14;x<=19;x++) put(x,21+oy,LIP);
    if (ch.teeth==='buck'){ for (let x=15;x<=18;x++){ put(x,20+oy,T); put(x,21+oy,x===16||x===17?T:TG); } put(16,21+oy,'#d8d2bc'); put(17,20+oy,TG); put(14,21+oy,LIP); put(19,21+oy,LIP); for (let x=15;x<=18;x++) put(x,22+oy,LIP); }   // two big front teeth
    if (ch.teeth==='gold'){ put(17,20+oy,'#f8d030'); put(18,20+oy,'#c89818'); put(17,19+oy,'#fffbe0'); }   // a gold tooth with a glint
    // eyes
    const eye = (x0) => { const sh=pal(x0,13+oy)[1]; for(let i=0;i<3;i++) put(x0+i,11+oy,OUT); put(x0,12+oy,'#ffffff'); put(x0+1,12+oy,'#ffffff'); put(x0+2,12+oy,'#1b1020'); for(let i=0;i<3;i++) put(x0+i,13+oy,sh); };
    if (ch.look==='big' && !W.eyes){ for (const x0 of [8,15]){ rect(x0,10+oy,4,4,OUT); rect(x0+1,11+oy,2,2,'#14101c'); put(x0+1,11+oy,'#ffffff'); put(x0+3,11+oy,'#14101c'); put(x0+3,12+oy,'#14101c'); } }
    else eye(9), eye(15);
    if (ch.tattoo){ const ink='#4a3a30'; for (const x of [8,9,11]) put(x,8+oy,ink); for (const x of [16,18,19]) put(x,8+oy,ink); put(13,7+oy,ink); put(12,8+oy,ink); put(14,8+oy,ink); put(13,8+oy,'#6a5a48');   // EASY, MONEY and an eye in a triangle on the brow
      put(8,15+oy,ink); put(8,16+oy,'#2e8a3a'); put(8,17+oy,ink); put(20,15+oy,'#6a7a5a'); put(21,15+oy,'#6a7a5a'); put(14,16+oy,'#c8ccd8'); }   // $ on a cheek, a bill tattoo, a nose ring
    if (!W.eyes && ch.look==='pixel'){ rect(6,10+oy,16,1,OUT); rect(6,11+oy,7,3,OUT); rect(15,11+oy,7,3,OUT); rect(13,11+oy,2,1,OUT);   // pixel "deal with it" shades
      for (const x0 of [7,16]) for (let i=0;i<5;i++) for (let j=0;j<2;j++) if ((i+j)%2===0 && i<4) put(x0+i,11+j+oy,'#d8d8e0'); put(11,11+oy,'#6a6a7a'); put(20,11+oy,'#6a6a7a'); }
    if (!W.eyes && ch.look==='round'){ for (const cx of [10,17]){ ell(cx,11.5+oy,3.2,3.2,'#b8bcc8'); ell(cx,11.5+oy,2.3,2.3,(x,y)=>(y<11+oy)?'#f4f0f0':'#d8c8cc'); put(cx-1,10+oy,'#ffffff'); put(cx,12+oy,'#5a3a40'); } rect(13,10+oy,2,1,'#b8bcc8'); put(6,11+oy,'#b8bcc8'); put(21,11+oy,'#b8bcc8'); }
    if (ch.tears) { put(9,14+oy,'#8fd8ff'); put(9,15+oy,'#5fbff0'); put(9,16+oy,'#8fd8ff'); put(15,14+oy,'#8fd8ff'); put(14,15+oy,'#5fbff0'); }
  }
  // neckwear
  if (W.neck){ const C=ITEMS[W.neck].c;
    if (W.neck==='bandana'){
      if (front){ for (let y=23;y<=29;y++){ const a2=y-23; const x0=8+a2, x1=19-a2; if (x1<x0) break; put(x0-1,y+oy,OUT); put(x1+1,y+oy,OUT); for (let x=x0;x<=x1;x++) put(x,y+oy,(y===23)?C[1]:((x*2+y)%5===0)?C[2]:(x>=15?C[1]:C[0])); } put(13,30+oy,OUT); put(14,30+oy,OUT); for (let x=8;x<=19;x++) put(x,22+oy,OUT); put(17,24+oy,C[1]); put(18,23+oy,C[1]); }
      else { for (let x=9;x<=18;x++){ put(x,23+oy,OUT); put(x,24+oy,C[0]); put(x,25+oy,OUT); } rect(12,26+oy,4,2,OUT); put(13,26+oy,C[0]); put(14,26+oy,C[1]); } }
    else if (W.neck==='bowtie'){
      if (front){ const wing=(xs,dir)=>{ for (let k=0;k<4;k++){ const x=xs+dir*k, h=1+k; for (let y=24-h;y<=24+h;y++) put(x,y+oy,(k===3||y===24-h||y===24+h)?OUT:(y===24?C[1]:C[0])); } };
        wing(12,-1); wing(15,1); rect(13,22+oy,2,5,OUT); put(13,23+oy,C[1]); put(14,23+oy,C[1]); put(13,24+oy,C[0]); put(14,24+oy,C[0]); put(13,25+oy,C[1]); put(14,25+oy,C[1]); put(10,22+oy,C[2]); put(17,22+oy,C[2]); }
      else { for (let x=10;x<=17;x++) put(x,23+oy,C[1]); } }
    else if (W.neck==='scarf'){
      for (let x=8;x<=19;x++){ put(x,21+oy,OUT); for (let y=22;y<=25;y++) put(x,y+oy,((x+y)%4<2)?C[0]:C[1]); put(x,26+oy,OUT); } put(7,22+oy,OUT); put(7,23+oy,OUT); put(7,24+oy,OUT); put(7,25+oy,OUT); put(20,22+oy,OUT); put(20,23+oy,OUT); put(20,24+oy,OUT); put(20,25+oy,OUT);
      if (front){ for (let y=26;y<=33;y++){ put(15,y+oy,OUT); put(19,y+oy,OUT); for (let x=16;x<=18;x++) put(x,y+oy,(y%3===0)?C[1]:C[0]); } for (let x=16;x<=18;x++){ put(x,34+oy,C[2]); put(x,35+oy,(x%2)?C[2]:null); } put(15,34+oy,OUT); put(19,34+oy,OUT); }
      else { for (let y=26;y<=29;y++){ put(10,y+oy,OUT); put(13,y+oy,OUT); put(11,y+oy,C[0]); put(12,y+oy,C[1]); } } }
    else if (W.neck==='chain'){   // heavy gold chain with a big shiny medallion
      if (front){ for (let x=9;x<=18;x++){ const t2=(x-13.5)/4.5, y=Math.round(23+4*(1-t2*t2)); put(x,y+oy,(x%2)?C[0]:C[1]); put(x,y+1+oy,OUT); }
        oell(13.5,30.5+oy,1.9,1.9,(x,y)=>(x<13.5&&y<30.5+oy)?C[2]:(x>14?C[1]:C[0])); put(13,30+oy,'#ffffff'); }
      else { for (let x=9;x<=18;x++) put(x,23+oy,(x%2)?C[0]:C[1]); } }
    else if (W.neck==='tie'){   // a necktie: knot at the collar, widening to a point
      if (front){ rect(12,23+oy,4,3,OUT); put(13,24+oy,C[1]); put(14,24+oy,C[1]);
        for (let y=26;y<=33;y++){ const w=y<29?1:2; for (let x=13-w+1;x<=14+w-1;x++) put(x,y+oy,((x+y)%3===0)?C[2]:(x>=14?C[1]:C[0])); put(13-w,y+oy,OUT); put(14+w,y+oy,OUT); }
        put(13,34+oy,OUT); put(14,34+oy,OUT); put(12,34+oy,OUT); put(15,34+oy,OUT); }
      else { for (let x=10;x<=17;x++) put(x,24+oy,C[1]); } }
    else if (W.neck==='lei'){ const fl=['#f85888','#f8d030','#ffffff','#ff8a30'];
      const pts=[]; for (let x=8;x<=19;x+=2){ const t2=(x-13.5)/5.5; pts.push([x, Math.round(23+(front?4.5:1)*(1-t2*t2))]); }
      pts.forEach(([x,y],k)=>{ const c=fl[k%fl.length]; put(x,y-1+oy,c); put(x-1,y+oy,c); put(x+1,y+oy,c); put(x,y+1+oy,c); put(x,y+oy,'#f8d030'); if (k%2) put(x+1,y+1+oy,'#4aa04a'); }); } }
  if (L && !front && !W.eyes && (ch.look==='pixel' || ch.look==='round')){ for (let x=7;x<=20;x++) put(x,11+oy, ch.look==='pixel'?OUT:'#b8bcc8'); }
  // eyewear (only seen from the front; a strap from the back)
  if (W.eyes){ const C=ITEMS[W.eyes].c;
    if (!front){ for (let x=7;x<=20;x++) put(x,11+oy,OUT); }
    else if (W.eyes==='shades'){ rect(7,10+oy,12,1,OUT); rect(7,11+oy,5,3,OUT); rect(14,11+oy,5,3,OUT); rect(12,11+oy,2,1,OUT); rect(8,11+oy,3,2,C[1]); rect(15,11+oy,3,2,C[1]); put(8,11+oy,C[2]); put(15,11+oy,C[2]); put(9,11+oy,'#ffffff'); put(16,11+oy,'#ffffff'); put(6,11+oy,OUT); put(19,11+oy,OUT); }
    else if (W.eyes==='nerd'){   // thick round black frames: the eyes still show through
      for (const x0 of [6,13]){ for (let x=x0;x<=x0+5;x++){ put(x,9+oy,OUT); put(x,14+oy,OUT); } for (let y=10;y<=13;y++){ put(x0,y+oy,OUT); put(x0+5,y+oy,OUT); } put(x0+1,10+oy,C[2]); }
      put(11,11+oy,OUT); put(12,11+oy,OUT); put(5,11+oy,OUT); put(19,11+oy,OUT); }
    else if (W.eyes==='glasses3d'){   // white cardboard frames, one red lens and one blue
      rect(6,9+oy,14,6,OUT); rect(7,10+oy,12,4,C[0]); rect(8,11+oy,4,2,'#e8304c'); rect(14,11+oy,4,2,'#3ac8f0'); put(8,11+oy,'#ff8a96'); put(14,11+oy,'#9ae8ff'); put(12,13+oy,C[1]); put(13,13+oy,C[1]); put(5,11+oy,OUT); put(20,11+oy,OUT); }
    else { const shape = W.eyes==='hearts' ? ['.#.#.','#####','#####','.###.','..#..'] : ['..#..','.###.','#####','.#.#.','#...#'];
      for (const x0 of [6,13]){ shape.forEach((row,j)=>{ for (let i=0;i<5;i++) if (row[i]==='#'){ for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const ii=i+dx, jj=j+dy; if (ii<0||ii>4||jj<0||jj>4||shape[jj][ii]!=='#') put(x0+ii,9+jj+oy,OUT); } } });
        shape.forEach((row,j)=>{ for (let i=0;i<5;i++) if (row[i]==='#') put(x0+i,9+j+oy,(j<=1&&i<=1)?C[2]:(i>=3?C[1]:C[0])); }); }
      put(11,11+oy,OUT); put(12,11+oy,OUT); put(5,11+oy,OUT); put(18,11+oy,OUT); } }
  // hats sit on the head (a hat replaces a character's own hat)
  if (W.hat){ const C=ITEMS[W.hat].c, hf=(cx,cy,rx,ry)=>shadeFn(cx,cy,rx,ry,()=>C);
    if (W.hat==='cap'){ oell(13.5,6.8+oy,6.4,3.2,hf(13.5,6.8+oy,6.4,3.2)); for (let x=9;x<=18;x++) put(x,9+oy,C[1]); put(13,3+oy,C[2]); put(14,3+oy,C[1]); for (let y=5;y<=8;y++) put(13,y+oy,C[1]);
      if (front){ for (let x=16;x<=24;x++){ put(x,9+oy,OUT); put(x,10+oy,x>=22?C[1]:C[0]); put(x,11+oy,OUT); } put(25,10+oy,OUT); put(17,10+oy,C[2]); }
      else { rect(12,8+oy,4,2,OUT); put(13,8+oy,'#ffffff'); put(14,8+oy,'#ffffff'); } }
    else if (W.hat==='cowboy'){ oell(13.5,8.8+oy,10.4,1.6,hf(13.5,8.8+oy,10.4,1.6)); for (let x=4;x<=7;x++) put(x,7+oy,C[0]); for (let x=20;x<=23;x++) put(x,7+oy,C[0]); put(3,7+oy,OUT); put(24,7+oy,OUT);
      oell(13.5,5+oy,5,3.2,hf(13.5,5+oy,5,3.2)); for (let x=9;x<=18;x++){ put(x,7+oy,'#3a2010'); put(x,6+oy,(x%3===0)?'#f8d030':'#5a3418'); } put(13,2+oy,C[1]); put(14,2+oy,C[1]); put(11,3+oy,C[2]); }
    else if (W.hat==='beanie'){ oell(13.5,6.6+oy,6.6,3.8,(x,y)=>((x+Math.round(y))%3===0)?C[1]:(x>=16?C[1]:C[0])); for (let x=7;x<=20;x++){ put(x,9+oy,(x%2)?C[1]:C[0]); put(x,10+oy,(x%2)?C[1]:C[2]); put(x,11+oy,OUT); } put(6,9+oy,OUT); put(6,10+oy,OUT); put(21,9+oy,OUT); put(21,10+oy,OUT);
      oell(13.5,2.4+oy,2.2,1.9,(x,y)=>((x+y)%2)?'#ffffff':'#e8e8f0'); }
    else if (W.hat==='party'){ for (let y=0;y<=9;y++){ const hw=Math.round(0.6+y*0.62); const xa=Math.round(13.5-hw), xb=Math.round(13.5+hw); for (let x=xa;x<=xb;x++) put(x,y+oy,(x===xa||x===xb)?OUT:(((x+y*2)>>1)%3===0?C[1]:(((x+y*2)>>1)%3===1?C[0]:'#58c8f0'))); }
      rect(7,10+oy,14,1,OUT); oell(13.5,0+oy,1.4,1.2,'#ffffff'); }
    else if (W.hat==='tophat'){ oell(13.5,9+oy,8.6,1.4,hf(13.5,9+oy,8.6,1.4)); rect(8,-1+oy,12,10,OUT); rect(9,0+oy,10,9,C[0]); rect(16,0+oy,3,9,C[1]); rect(9,6+oy,10,2,'#e03048'); rect(16,6+oy,3,2,'#a81830'); rect(10,1+oy,1,4,C[2]); }
    else if (W.hat==='crown'){   // gold band with three points, a ruby in the middle and sapphires either side
      for (const [cx,top] of [[9,2],[13.5,0],[18,2]]) for (let y=top;y<=6;y++){ const hw=(y-top)*0.65; for (let x=Math.round(cx-hw);x<=Math.round(cx+hw);x++) put(x,y+oy, (x===Math.round(cx-hw)||x===Math.round(cx+hw)||y===top)?OUT:(x>=16?C[1]:C[0])); }
      rect(7,6+oy,14,4,OUT); rect(8,7+oy,12,2,C[0]); rect(16,7+oy,4,2,C[1]); for (let x=8;x<=19;x++) put(x,6+oy,x%2?C[2]:C[0]);
      put(13,7+oy,'#e8304c'); put(14,7+oy,'#e8304c'); put(13,8+oy,'#a8141e'); put(14,8+oy,'#a8141e'); put(10,8+oy,'#3a8ef0'); put(17,8+oy,'#3a8ef0'); put(9,1+oy,C[2]); put(13,0+oy,C[2]); }
    else if (W.hat==='chullo'){   // Andean knit hat: stripes and a diamond band, ear flaps with braided tassels, pom-pom on top
      oell(13.5,6.4+oy,6.8,3.8,(x,y)=>{ const r=y-oy; if (r<4) return C[0]; if (r<6) return ((x+r)%4<2)?C[2]:'#ffffff'; if (r<8) return (Math.abs(((x+1)%4)-2)+Math.abs(r-7)<2)?'#2a8a5a':C[0]; return C[1]; });
      for (const x0 of [6,20]){ rect(x0-1,9+oy,3,7,OUT); rect(x0,9+oy,1,6,C[0]); put(x0,11+oy,C[2]); put(x0,13+oy,'#ffffff'); for (let y=15;y<=18;y++) put(x0,y+oy,(y%2)?'#f8d030':'#d8a818'); }
      for (let x=7;x<=20;x++){ put(x,10+oy,(x%2)?C[1]:C[0]); put(x,11+oy,OUT); }
      oell(13.5,2.0+oy,1.8,1.6,(x,y)=>((x+y)%2)?'#f8d030':'#ffe680'); }
    else if (W.hat==='headphones'){   // padded band over the head, chunky ear cups with a coloured ring
      for (let x=7;x<=20;x++){ const t2=(x-13.5)/6.5, y=Math.round(4-3*(1-t2*t2)); put(x,y+oy,OUT); put(x,y+1+oy,C[0]); put(x,y+2+oy,OUT); }
      for (const cx of [6,21]){ oell(cx,11+oy,1.8,3,(x,y)=>(y<10+oy)?C[0]:C[1]); put(cx,9+oy,C[2]); put(cx,10+oy,C[2]); put(cx,11+oy,C[2]); } }
    else if (W.hat==='flowers'){ for (let x=6;x<=21;x++){ const y=Math.round(8+oy-Math.abs(x-13.5)*0.1); put(x,y,C[0]); put(x,y+1,C[1]); if (x%3===0) put(x,y-1,'#6ac06a'); }
      [[7,'#f85888'],[10,'#f8d030'],[13.5,'#ffffff'],[17,'#8ad0ff'],[20,'#f85888']].forEach(([x,c])=>{ x=Math.round(x); const y=6+oy; put(x,y-1,c); put(x-1,y,c); put(x+1,y,c); put(x,y+1,c); put(x-1,y-1,OUT); put(x+1,y-1,OUT); put(x,y,'#f8d030'); }); } }
  // poop hat
  if (L && ch.hat==='poop' && !W.hat) {
    const hf = (cx,cy,rx,ry) => shadeFn(cx,cy,rx,ry,()=>HAT);
    oell(13.5,8.3+oy,7.6,2.2,hf(13.5,8.3+oy,7.6,2.2));
    oell(13.5,5+oy,5.6,1.9,hf(13.5,5+oy,5.6,1.9));
    oell(13.5,2.3+oy,3.6,1.5,hf(13.5,2.3+oy,3.6,1.5));
    put(15,1+oy,HAT[2]);
    if (front) { put(11,5+oy,'#fff'); put(12,5+oy,OUT); put(15,5+oy,'#fff'); put(16,5+oy,OUT); put(13,8+oy,OUT); put(14,8+oy,OUT); put(13,9+oy,'#ff8a96'); put(14,9+oy,'#ff8a96'); }
  }
  // wide red sun hat with a bunch of flowers on one side
  if (L && ch.hat==='sunhat' && !W.hat) {
    const H=['#b8202a','#801018','#e04a52'];
    oell(13.5,8.6+oy,10.6,2.4,(x,y)=> y>9.4+oy ? H[1] : (x>17?H[1]:H[0]));
    oell(13.5,5+oy,5.4,3.4,(x,y)=> x>16?H[1]:(x<11&&y<5+oy?H[2]:H[0])); for (let x=8;x<=19;x++) put(x,7+oy,'#5a0c12');
    for (const [x,y,c] of [[5,5,'#f05a78'],[6,4,'#f05a78'],[4,4,'#c83a58'],[8,3,'#3ad0b0'],[9,4,'#2ea890'],[7,6,'#ffffff'],[6,7,'#ffffff'],[8,7,'#ffffff'],[7,8,'#f8d030'],[10,3,'#f0b090'],[11,4,'#d89070'],[4,6,'#4a7af0']]){ put(x,y+oy,c); }
    for (const [x,y] of [[3,4],[4,3],[5,3],[6,3],[7,2],[8,2],[9,2],[10,2]]) put(x,y+oy,OUT); }
  // pink store visor: a band round the head and a brim over the snout
  if (L && ch.hat==='visor') {
    const V=ch.visorCol||['#f85888','#c8306a','#ffa0c0'];
    for (let x=7;x<=20;x++){ const y=Math.round(8.4+oy-Math.abs(x-13.5)*0.08); put(x,y-1,OUT); put(x,y,(x%3)?V[0]:V[2]); put(x,y+1,V[1]); }
    if (front){ for (let x=17;x<=23;x++){ put(x,9+oy,OUT); put(x,10+oy,V[0]); put(x,11+oy,OUT); } put(23,10+oy,OUT); }
    else { for (let x=4;x<=9;x++){ put(x,9+oy,OUT); put(x,10+oy,V[1]); } }
  }
  // folded legs when sitting
  if (L && sit && front) {
    const fl = (cx) => { oell(cx,42.5,2.4,1.4,(x,y)=>pal(x,y)[1]); put(cx+2,42,HOOF); put(cx+2,43,HOOF); };
    fl(10); fl(17);
  }
  return cv;
}
const spriteCache = new Map();
function sprite(cid,dir,frame,pose,wear){ const k=cid+'|'+dir+'|'+frame+'|'+pose+'|'+wearKey(wear); let s=spriteCache.get(k); if(!s){ s=buildSprite(cid,dir,frame,pose,wear); spriteCache.set(k,s);} return s; }
function teeIcon(id){ const k='tee:'+id; let c=itemIconCache.get(k); if (c) return c; const it=ITEMS[id], C=it.c;
  if (it.pon){ c=document.createElement('canvas'); c.width=19; c.height=17; const x=c.getContext('2d'), R=(a,b,w,h,col)=>{ x.fillStyle=col; x.fillRect(a,b,w,h); };
    // laid flat: a wide woven rectangle with a neck slit, stripes, a V hem and fringe
    const sp=y=> y===0?[6,12]: y===1?[3,15]: y<=9?[1,17]: y===10?[2,16]: y===11?[4,14]: y===12?[6,12]: [8,10];
    for (let y=0;y<=13;y++){ const [a,b]=sp(y), band=it.st[Math.min(it.st.length-1,Math.floor(y/1.4))]; R(a-1,y,1,1,OUT); R(b+1,y,1,1,OUT);
      for (let i=a;i<=b;i++){ let col=band; if (y%3===2 && i%2) col=tint(band,-0.25)||band; if (i>=b-1) col=tint(col,-0.2)||col; else if (i<=a+1) col=tint(col,0.15)||col; R(i,y,1,1,col); } }
    R(6,0,7,1,OUT); R(8,1,3,2,OUT); R(9,3,1,1,OUT);
    for (const [a,y] of [[1,10],[2,11],[3,11],[4,12],[5,12],[6,13],[7,13],[8,14],[9,14],[10,14],[11,13],[12,13],[13,12],[14,12],[15,11],[16,11],[17,10]]){ R(a,y,1,1,OUT); if (a%2===0) R(a,y+1,1,1,it.fr); }
    itemIconCache.set(k,c); return c; }
  c=document.createElement('canvas'); c.width=17; c.height=16; const x=c.getContext('2d'); const R=(a,b,w,h,col)=>{ x.fillStyle=col; x.fillRect(a,b,w,h); };
  // same shape as the worn shirt: sleeves, crew collar, hem, shading, then the print
  R(5,0,7,1,OUT); R(1,1,15,1,OUT); R(0,2,17,4,OUT); R(0,6,4,1,OUT); R(13,6,4,1,OUT); R(3,6,11,9,OUT); R(4,15,9,1,OUT);
  R(2,1,13,1,C[0]); R(1,2,15,3,C[0]); R(1,5,3,1,C[1]); R(13,5,3,1,C[1]); R(4,5,9,9,C[0]); R(4,14,9,1,C[1]);
  R(11,2,4,3,C[1]); R(10,5,3,9,C[1]); R(4,2,2,7,C[2]); R(6,1,5,1,C[1]); R(7,1,3,1,OUT);
  const P2=TEE_PRINTS[it.pr], PC=TEE_PC;
  if (P2) P2.forEach((row,j)=>{ for (let i=0;i<6;i++) if (row[i]!=='.') R(5+i,6+j,1,1,PC[row[i]]); });
  itemIconCache.set(k,c); return c; }
// one item on its own, cropped to its pixels (store racks)
const itemIconCache=new Map();
function itemIcon(id){ let c=itemIconCache.get(id); if (c) return c; const it=ITEMS[id];
  if (it.s==='hands'){ const M=['.oooo....','oaccao...','oacaaaoo.','oaaaaaabo','oaaaaoabo','oaaaabbo.','.obbbbo..','.owwwwo..','.owwwwo..','.oooooo..'];   // a padded mitt with its thumb tucked in, white cuff
    c=document.createElement('canvas'); c.width=19; c.height=10; const x=c.getContext('2d'), C=it.c, col={o:OUT,a:C[0],b:C[1],c:C[2],w:it.cuff};
    M.forEach((row,yy)=>{ for (let i2=0;i2<9;i2++){ const ch=row[i2]; if (ch==='.') continue; x.fillStyle=col[ch]; x.fillRect(i2,yy,1,1); x.fillStyle=ch==='c'?C[0]:col[ch]; x.fillRect(18-i2,yy,1,1); } });
    itemIconCache.set(id,c); return c; }
  const full=buildSprite('twotone','fr',0,'stand',{[it.s]:id},true), x=full.getContext('2d'), d=x.getImageData(0,0,SW,SH).data;
  let x0=SW,y0=SH,x1=-1,y1=-1; for (let y=0;y<SH;y++) for (let i=0;i<SW;i++) if (d[(y*SW+i)*4+3]){ if(i<x0)x0=i; if(i>x1)x1=i; if(y<y0)y0=y; if(y>y1)y1=y; }
  c=document.createElement('canvas'); c.width=Math.max(1,x1-x0+1); c.height=Math.max(1,y1-y0+1); c.getContext('2d').drawImage(full,-x0,-y0); itemIconCache.set(id,c); return c; }

// ======================= WORLD =======================
const ARC_X = 9, JUKE_X = 12;   // arcade cabinet and jukebox spots on the lounge's back wall
const TW = 40, TH = 20, WH = 96;
const ROOM_DIMS = { lounge:[13,12], barn:[22,20], casino:[13,12], arena:[13,12], lanes:[13,12], store:[13,12], account:[9,6], gym:[13,12], cove:[20,16], jungle:[20,16] };
let N = 13, NY = 12;   // current room: N = width (gx) and row stride, NY = depth (gy)
const proj = (gx,gy) => [(gx-gy)*TW/2, (gx+gy)*TH/2];
let BLOCK = new Uint8Array(N*NY);
const FURN = [], SEATS = [];
const block = (x,y) => { BLOCK[y*N+x] = 1; };
// two rooms share one grid; each build function lays out its own furniture
let curRoom = 'lounge';
const ROOM_NAMES = { lounge:'LLAMA LOUNGE', barn:'LLAMA ACRES', casino:'LLAMA CASINO', arena:'SPIT ARENA', lanes:'LLAMA LANES', store:'LLAMA STORE', account:'ACCOUNT', gym:'BOXING GYM', cove:'TREASURE COVE', jungle:'JUNGLE TEMPLE' };
const ROOMS = ['lounge','barn','casino','arena','lanes','gym','cove','jungle','store','account'];
// player rooms are 'p:<id>'; their name, door and layout get registered when you go in
const isP = r => /^p:\d{1,9}$/.test(String(r||''));
const validRoom = r => ROOMS.includes(r) || isP(r);
const PRD = {};   // player room data you've been let into, by room key
const PRN = {};   // player room names you've seen (for "X went to ...")
const roomName = r => ROOM_NAMES[r] || (isP(r) ? (PRN[r] || 'a player room') : 'the lounge');
const CASINO_SLOT_X = [1,3,5,7,9,11];   // six machines on the casino's back wall with a gap between each, two of each kind; stools one tile in front (the server checks the same spots)
const slotKind = x => x<=3 ? 'fruit' : x<=7 ? 'classic' : 'gold';
// what each kind looks like and pays (three of a kind, times the bet); the server holds the same table and decides every spin
const SLOT_KINDS = {
  fruit:   { name:'FRUIT FRENZY',   note:'WINS OFTEN',        pay:[6,13,30,60,150,500],   cab:['#38a048','#38a048','#207030','#185828'], lite:'#78e078', top:['#f8d030','#e8b820','#b88818'] },
  classic: { name:'LUCKY LINES',    note:'5 WAYS TO WIN',     pay:[2,3,5,8,20,100],   cab:['#d03040','#d03040','#981c2c','#5a1020'], lite:'#e86070', top:['#f8d030','#e8b820','#b88818'] },
  gold:    { name:'PRIZE WHEEL',    note:'UP TO 100X',        pay:[0,0,0,0,0,0],   cab:['#7838c0','#7838c0','#502088','#301060'], lite:'#b080f0', top:['#fff0a0','#f8d030','#c09018'] } };
const SLOT_BETS = [1,2,5,10];
const SLOT_LINES = [[0,1,2],[3,4,5],[6,7,8],[0,4,8],[6,4,2]];   // LUCKY LINES: cells are row by row (same as the server)
const WHEEL_SLICES = [0,1,0,2,0,1,0,5,0,1,0,3,0,1,0,100];        // PRIZE WHEEL (same as the server)
const WHEEL_ODDS = {1:'3 IN 10', 2:'1 IN 12', 3:'1 IN 25', 5:'1 IN 33', 100:'1 IN 667'};
const WHEEL_COL = {0:['#3a3050','#4a4068'], 1:['#3878d0','#58a0f0'], 2:['#28a048','#58d070'], 3:['#d07818','#f8a038'], 5:['#c02860','#f05890'], 100:['#c09018','#f8d030']};
const ROUL_SEATS = [[5,5],[5,6],[8,5],[8,6],[6,7],[7,7]], BJ_SEATS = [[10,5],[11,5],[10,9],[11,9],[2,6],[2,7]];   // the server checks the same seats
const seatIn = (list,x,y) => curRoom==='casino' && list.some(([a,b])=>a===x&&b===y);
const isSlotSeat = (x,y) => curRoom==='casino' && y===1 && CASINO_SLOT_X.includes(x);
const DANCE = new Set(), CROPS = [], POND = [];
const DUNK_SEAT = [3,6], DUNK_TGT = [3,8];   // left of the barn: the target stands in front of the tank, you throw from the grass in front of the target   // the server checks the same tiles
function clearWorld(){ [N,NY]=ROOM_DIMS[curRoom]; if (BLOCK.length!==N*NY) BLOCK=new Uint8Array(N*NY); FURN.length=0; SEATS.length=0; BLOCK.fill(0); DANCE.clear(); CROPS.length=0; POND.length=0; }
function lounge(tx,ty,col){
  FURN.push({t:'table',gx:tx,gy:ty}); block(tx,ty);
  const cs=[[-1,0,'fr'],[1,0,'bl'],[0,-1,'fl'],[0,1,'br']];
  for (const [dx,dy,d] of cs){ SEATS.push({gx:tx+dx,gy:ty+dy,dir:d,lift:5}); FURN.push({t:'cushion',gx:tx+dx,gy:ty+dy,col}); }
}
function buildLoungeWorld(){
  clearWorld();
  for (let x=0;x<=6;x++){ block(x,0); FURN.push({t:'bar',gx:x,gy:1}); block(x,1); }
  for (let x=0;x<=6;x++){ SEATS.push({gx:x,gy:2,dir:'br',lift:9}); FURN.push({t:'stool',gx:x,gy:2}); }
  FURN.push({t:'rope',gx:7,gy:0}); block(7,0);   // rope: tap it to go behind the bar
  FURN.push({t:'arcade',gx:9,gy:0}); block(9,0);
  FURN.push({t:'keg',gx:10,gy:0}); block(10,0);
  FURN.push({t:'hay',gx:11,gy:0}); block(11,0);
  FURN.push({t:'jukebox',gx:12,gy:0}); block(12,0);
  for (let x=8;x<=11;x++) for (let y=2;y<=5;y++) DANCE.add(y*N+x);
  // The slot machine is saved but not placed: its art, pop-up and server payouts are all still here.
  // To bring it back, add these two lines (and give it a free spot on the back wall):
  //   FURN.push({t:'slots',gx:12,gy:0}); block(12,0);
  //   SEATS.push({gx:12,gy:1,dir:'br',lift:9}); FURN.push({t:'stool',gx:12,gy:1});
  FURN.push({t:'sidetable',gx:0,gy:6}); block(0,6);
  FURN.push({t:'fern',gx:0,gy:9}); block(0,9);
  FURN.push({t:'fern',gx:0,gy:11,flip:true,ox:-0.15,oy:0.15}); block(0,11);   // tucked into the corner so it doesn't cover the door
  for (const [gy,arm] of [[4,'a'],[5,'b'],[7,'a'],[8,'b']]){ FURN.push({t:'sofa',gx:0,gy,arm}); SEATS.push({gx:0,gy,dir:'fr',lift:7}); if(arm==='b') FURN.push({t:'sofaArm',gx:0,gy,dz:0.1}); }
  FURN.push({t:'hay',gx:12,gy:11}); block(12,11);
  FURN.push({t:'fern',gx:12,gy:10,flip:true}); block(12,10);
  lounge(8,8,['#f8b830','#c07818','#f8e880']);
  lounge(3,8,['#48c8b8','#208878','#a8f0e0']);
}
// LLAMA ACRES: outdoor barnyard
// LLAMA ACRES: big outdoor barnyard (22 x 20)
let BARN_PATH = new Set(), FARM_PATH = new Set();
// ACCOUNT: a small room with the changing booth (swap your llama for 20 TOKENS) and the account desk (email and password)
let boothHit=null, deskHit=null; const BOOTH=[7,0], ACCT_DESK=[3,0], BOOTH_PRICE=20;
PRD.account = { name:'ACCOUNT', wall:'stars', floor:'marble', furn:[] };   // drawn like a player room, but nobody owns it
function buildAccountWorld(){
  clearWorld();
  FURN.push({t:'booth',gx:BOOTH[0],gy:BOOTH[1]}); block(BOOTH[0],BOOTH[1]);
  FURN.push({t:'acctdesk',gx:ACCT_DESK[0],gy:ACCT_DESK[1]}); block(ACCT_DESK[0],ACCT_DESK[1]); block(ACCT_DESK[0]+1,ACCT_DESK[1]);
  const put=(item,gx,gy,rot)=>{ const D=FURN_DEF[item]; FURN.push({...D.mk(rot), gx, gy, item, rot}); if (D.rug) return; if (D.seat) SEATS.push({gx,gy,dir:SEAT_DIRS[rot],lift:D.seat}); else block(gx,gy); };
  /* along the left wall: a little table, three wooden chairs facing into the room, another little table */
  put('rug_round',3,2,0); put('roundtable',0,0,0); put('chair',0,1,0); put('chair',0,2,0); put('chair',0,3,0); put('roundtable',0,4,0);
  put('plant',2,0,0); put('flowers',6,0,0); put('floorlamp',8,0,0); put('cactus',8,2,0);
}
function buildBarnWorld(){
  clearWorld();
  BARN_PATH = new Set([[14,1],[14,2],[13,3],[13,4],[12,5],[12,6],[11,7],[11,8],[10,8],[9,8],[8,9],[7,10],[7,11],[7,12]].map(([x,y])=>y*N+x));
  FURN.push({t:'barn',gx:0,gy:0}); for (let x=0;x<=3;x++) for (let y=0;y<=3;y++) block(x,y);
  FURN.push({t:'hay',gx:4,gy:0}); block(4,0);
  FURN.push({t:'hay',gx:0,gy:4}); block(0,4);
  for (const x of [5,6]){ SEATS.push({gx:x,gy:0,dir:'fr',lift:10}); FURN.push({t:'hayseat',gx:x,gy:0}); }
  for (const y of [5,6]){ SEATS.push({gx:0,gy:y,dir:'fr',lift:10}); FURN.push({t:'hayseat',gx:0,gy:y}); }
  FURN.push({t:'gate',gx:14,gy:0}); block(14,0);
  // two campfires, each with four log seats right up against the fire pit
  for (const [FX,FY] of [[10,11],[11,16]]){
    FURN.push({t:'campfire',gx:FX,gy:FY}); block(FX,FY);
    for (const [dx,dy,d,ax] of [[-1,0,'fr','y'],[1,0,'bl','y'],[0,-1,'fl','x'],[0,1,'br','x']]){ SEATS.push({gx:FX+dx,gy:FY+dy,dir:d,lift:6}); FURN.push({t:'log',gx:FX+dx,gy:FY+dy,ax}); } }
  // big pond (6 x 5) with open bank all round (the server checks the same bounds for fishing)
  FURN.push({t:'pond',gx:15,gy:3,w:6,h:5,dz:-40}); for (let x=15;x<=20;x++) for (let y=3;y<=7;y++){ block(x,y); POND.push([x,y]); }
  // dirt footpath the whole way round the pond
  for (let x=14;x<=21;x++) for (let y=2;y<=8;y++) if (x===14||x===21||y===2||y===8) BARN_PATH.add(y*N+x);
  // farm: three rows of four plots with stone walkways between the rows and all round
  for (const y of [13,15,17]) for (let x=2;x<=5;x++){ const k=x+','+y; CROPS.push({gx:x,gy:y,k}); FURN.push({t:'crop',gx:x,gy:y,k}); block(x,y); }
  FARM_PATH = new Set(); for (let x=1;x<=6;x++) for (let y=12;y<=18;y++) if (x===1||x===6||y%2===0) FARM_PATH.add(y*N+x);
  // single benches spread around the field: by the farm, behind and beside the pond, out on the grass
  for (const [x,y,d,ax] of [[0,13,'fr','y'],[4,11,'fl','x'],[17,1,'fl','x'],[13,6,'fr','y'],[17,13,'fl','x']]){   // two-seat benches
    const x2=ax==='x'?x+1:x, y2=ax==='y'?y+1:y; SEATS.push({gx:x,gy:y,dir:d,lift:8}); SEATS.push({gx:x2,gy:y2,dir:d,lift:8}); FURN.push({t:'bench',gx:x,gy:y,ax,len:2,dz:ax==='x'?0.5:0}); }
  FURN.push({t:'scarecrow',gx:0,gy:15}); block(0,15);
  // market stalls, two tiles wide (the server checks the same spots)
  FURN.push({t:'cider',gx:7,gy:4,w:2,dz:0.5}); block(7,4); block(8,4);
  FURN.push({t:'snack',gx:10,gy:4,w:2,dz:0.5}); block(10,4); block(11,4);
  for (const [x,y] of [[0,9],[21,19],[21,16],[1,19],[15,17],[11,2],[9,19]]){ FURN.push({t:'tree',gx:x,gy:y}); block(x,y); }
  // apples on the grass: tap to eat (they grow back)
  for (const [x,y] of [[8,15],[9,18],[14,14],[18,15],[20,10],[13,8]]){ FURN.push({t:'apple',gx:x,gy:y,k:'a'+x+','+y}); block(x,y); }
  FURN.push({t:'hay',gx:21,gy:0}); block(21,0);
  // dunk tank: sit on the plank over the water (the server checks the same seat), throw at the target from in front of it
  SEATS.push({gx:DUNK_SEAT[0],gy:DUNK_SEAT[1],dir:'fl',lift:26,dunk:true}); FURN.push({t:'dunktank',gx:DUNK_SEAT[0],gy:DUNK_SEAT[1]});
  FURN.push({t:'dunktarget',gx:DUNK_TGT[0],gy:DUNK_TGT[1]}); block(DUNK_TGT[0],DUNK_TGT[1]);
  FURN.push({t:'dunksign',gx:DUNK_SEAT[0]+2,gy:DUNK_SEAT[1]}); block(DUNK_SEAT[0]+2,DUNK_SEAT[1]);
}
// LLAMA CASINO: red carpet, slot row on the back wall, a roulette table, two blackjack tables
const PLK={gx:0, gy:3, rows:8, bets:[1,2,5], mult:[9,3,1.3,0.7,0.4,0.7,1.3,3,9]};   // must match PLINKO in src/worker.js
function buildCasinoWorld(){
  clearWorld();
  for (const x of CASINO_SLOT_X){ FURN.push({t:'slots',gx:x,gy:0}); block(x,0); SEATS.push({gx:x,gy:1,dir:'br',lift:9}); FURN.push({t:'stool',gx:x,gy:1}); }
  FURN.push({t:'fern',gx:12,gy:11,flip:true}); block(12,11);
  // roulette in the middle (2 x 2) with stools on three sides
  FURN.push({t:'roulette',gx:6,gy:5,dz:1}); for (const [x,y] of [[6,5],[7,5],[6,6],[7,6]]) block(x,y);
  for (const [x,y,d] of [[5,5,'fr'],[5,6,'fr'],[8,5,'bl'],[8,6,'bl'],[6,7,'br'],[7,7,'br']]){ SEATS.push({gx:x,gy:y,dir:d,lift:9}); FURN.push({t:'stool',gx:x,gy:y,c:'casino'}); }
  // two blackjack tables on the right (2 x 1), players sit on the front side facing the dealer
  for (const [tx,ty] of [[10,4],[10,8]]){ FURN.push({t:'blackjack',gx:tx,gy:ty,dz:0.5}); block(tx,ty); block(tx+1,ty);
    for (const x of [tx,tx+1]){ SEATS.push({gx:x,gy:ty+1,dir:'br',lift:9}); FURN.push({t:'stool',gx:x,gy:ty+1,c:'casino'}); } }
  // the third table runs along the left wall between PLINKO and the ropes: dealer against the wall, stools on the right side
  FURN.push({t:'blackjack',gx:1,gy:6,rot:1,dz:0.5}); block(1,6); block(1,7);
  for (const y of [6,7]){ SEATS.push({gx:2,gy:y,dir:'bl',lift:9}); FURN.push({t:'stool',gx:2,gy:y,c:'casino'}); }
  // velvet ropes marking the way in from the door
  for (const [x,y] of [[2,9],[2,11]]){ FURN.push({t:'stanchion',gx:x,gy:y}); block(x,y); block(0,y); block(1,y); }
  // dealers stand behind each table, facing the players
  FURN.push({t:'dealer',c:'rico',gx:6,gy:4,x:7,y:4.45,game:'roul'}); block(6,4); block(7,4);
  for (const [tx,ty,c] of [[10,4,'lucky'],[10,8,'dot']]){ FURN.push({t:'dealer',c,gx:tx,gy:ty-1,x:tx+1,y:ty-0.55,game:'bj',tx,ty}); block(tx,ty-1); block(tx+1,ty-1); }
  FURN.push({t:'dealer',c:'ace',gx:0,gy:6,x:0.45,y:7,dir:'fr',game:'bj',tx:1,ty:6,rot:1}); block(0,6); block(0,7);
  FURN.push({t:'plinko',gx:PLK.gx,gy:PLK.gy}); block(PLK.gx,PLK.gy); block(PLK.gx,PLK.gy+1);   /* PLINKO against the empty left wall */   /* the rope runs to the wall: nobody walks through it */
}
// SPIT ARENA room: a painted ring in the middle (tap it or press PLAY), spectator stools along the back wall
const ARENA_RING = { cx:6.5, cy:6, r:2.9 };
function buildArenaWorld(){
  clearWorld();
  for (let x=1; x<=11; x+=2){ SEATS.push({gx:x,gy:1,dir:'fl',lift:9}); FURN.push({t:'stool',gx:x,gy:1,c:'casino'}); }   // spectators face the mat
  FURN.push({t:'fern',gx:12,gy:11,flip:true}); block(12,11); FURN.push({t:'fern',gx:0,gy:0}); block(0,0);
}
// LLAMA LANES: four lanes running toward the back wall, pins at the far end, an approach area by the door
const LANE_GX = [1,4,7,10];   // each lane is two tiles wide starting here
const laneAt = (gx,gy) => gy>=0 && gy<=7 ? LANE_GX.findIndex(L=>gx===L||gx===L+1) : -1;
function buildLanesWorld(){
  clearWorld();
  for (const L of LANE_GX) for (let gy=0; gy<=7; gy++){ block(L,gy); block(L+1,gy); }
  for (const L of LANE_GX) FURN.push({t:'lanepins', gx:L, gy:0});
  for (const [x,y] of [[3,8],[9,8]]){ FURN.push({t:'balerack',gx:x,gy:y}); block(x,y); }
  for (const x of [2,5,8,11]){ SEATS.push({gx:x,gy:11,dir:'bl',lift:9}); FURN.push({t:'stool',gx:x,gy:11,c:'casino'}); }
  FURN.push({t:'fern',gx:12,gy:9,flip:true}); block(12,9);
}
// LLAMA STORE: the shirts hang framed on the left wall; a checkout counter, two clothing racks and a table of folded shirts
const STORE_COUNTER=[[8,2],[9,2],[10,2]], STORE_TABLE=[], STORE_VEND=[5,0];
// two long racks across the shop; every spot holds one item you can buy (same art as when you wear it)
const RACK_ROWS=[['poncho','tee_smile','tee_cancelled','tee_wild','tee_cancel','tee_woke','tee_lounge'],['poncho_orange','tee_acres','tee_arena','bandana','bowtie','scarf','lei'],['cap','cowboy','beanie','party','tophat','flowers','gloves','shorts']];
const RACK_UNUSED=['cap','cowboy','beanie','party','tophat','flowers','tee_lounge','tee_acres','tee_arena'];
// glass accessories case next to the register: two tiles, each item sits on the velvet at its spot
// furniture showroom: one piece from each category on display (tap one to shop for furniture)
// the store is split in two: furniture on the left half (a living room, a bedroom and a dining set), clothing on the right half
// [item, gx, gy, rot, notag] - notag hides the price tag on repeats (the dining chairs)
// the LLAMA STORE sells clothes (and LIMITED RARES); furniture is bought from the SHOP pop-up anywhere.
// left side of the store: a lounge corner to sit in, the LIMITED RARES showcase, and model llamas wearing outfits from the racks
const STORE_DECO=[['plant',0,0],['floorlamp',0,3]];   // [item, x, y, turn]
const STORE_SHOW=[['rug_persian',1,1,0,1],['statue',1,1,0],['throne',3,1,0]];   // LIMITED RARES on a red carpet in the back corner: tap them to buy (store only)
const STORE_SNACK=[4,0];   // snack machine, next to the drink machine
const STORE_DISPLAY=[{t:'teetable',gx:1,gy:6,w:2,items:['tee_smile','tee_lounge','tee_acres','tee_arena','tee_woke','tee_cancel'],pick:'tee_smile'},{t:'hatstand',gx:3,gy:4,items:['cowboy','cap','beanie','tophat'],pick:'cap'},{t:'hatstand',gx:2,gy:9,items:['party','flowers','beanie','cowboy'],pick:'flowers'}];
const STORE_MODELS=[{gx:4,gy:6,pick:'cowboy',w:{hat:'cowboy',neck:'bandana',shirt:'poncho'}},{gx:4,gy:8,pick:'tophat',w:{hat:'tophat',eyes:'shades',neck:'bowtie',shirt:'tee_lounge'}},{gx:1,gy:4,pick:'flowers',w:{hat:'flowers',eyes:'hearts',neck:'lei',shirt:'tee_smile'}}];
const STORE_CASE=[[6,2],[7,2]], CASE_ITEMS=[['shades',6.3],['hearts',6.82],['stars',7.42]];
const STORE_RACKS=RACK_ROWS.flatMap((row,j)=>row.map((id,i)=>[13-row.length+i,4+3*j,id,i===0?-1:i===row.length-1?1:0]));   // rows end at the right wall
const rackItemAt=(x,y)=>{ const r=STORE_RACKS.find(([a,b])=>a===x&&b===y); return r?r[2]:null; };
function buildStoreWorld(){
  clearWorld();
  for (const [x,y] of STORE_COUNTER){ FURN.push({t:'counter',gx:x,gy:y,reg:x===9,end:x===10?1:x===8?-1:0}); block(x,y); }
  FURN.push({t:'clerk',gx:8,gy:1}); for (let x=8;x<=10;x++) for (let y=0;y<=1;y++) block(x,y);   // the cashier's spot behind the register
  for (const [x,y,item,end] of STORE_RACKS){ FURN.push({t:'rack',gx:x,gy:y,item,end}); block(x,y); }
  STORE_CASE.forEach(([x,y],k)=>{ FURN.push({t:'glasscase',gx:x,gy:y,end:k===0?-1:1}); block(x,y); });
  FURN.push({t:'vending',gx:STORE_VEND[0],gy:STORE_VEND[1]}); block(STORE_VEND[0],STORE_VEND[1]);

  for (const [item,x,y,rt] of STORE_DECO){ const ro=rt===undefined?1:rt, D=FURN_DEF[item]; FURN.push({...D.mk(ro), gx:x, gy:y}); if (D.rug) continue; const tl=furnTiles(item,x,y,ro);
    if (D.seat) for (const [tx,ty] of (D.seatAll ? tl : tl.slice(0,1))) SEATS.push({gx:tx,gy:ty,dir:SEAT_DIRS[ro],lift:D.seat}); for (const [tx,ty] of (D.seat ? (D.seatAll ? [] : tl.slice(1)) : tl)) block(tx,ty); }
  for (const [item,x,y,rt,nt] of STORE_SHOW){ const ro=rt===undefined?1:rt; FURN.push({...FURN_DEF[item].mk(ro), gx:x, gy:y, show:item, notag:!!nt}); if (!FURN_DEF[item].rug) for (const [tx,ty] of furnTiles(item,x,y,ro)) block(tx,ty); }
  for (const M of STORE_MODELS){ FURN.push({t:'model',gx:M.gx,gy:M.gy,pick:M.pick,w:M.w}); block(M.gx,M.gy); }
  for (const D of STORE_DISPLAY){ FURN.push({...D}); for (let i=0;i<(D.w||1);i++) block(D.gx+i,D.gy); }
  FURN.push({t:'snackvend',gx:STORE_SNACK[0],gy:STORE_SNACK[1],svend:true}); block(STORE_SNACK[0],STORE_SNACK[1]);
  FURN.push({t:'fern',gx:12,gy:11,flip:true}); block(12,11);
  FURN.push({t:'fern',gx:0,gy:11}); block(0,11);
}
function buildWorld(){ if (isP(curRoom)) buildPlayerWorld(); else if (curRoom==='account') buildAccountWorld(); else if (curRoom==='store') buildStoreWorld(); else if (curRoom==='barn') buildBarnWorld(); else if (curRoom==='casino') buildCasinoWorld(); else if (curRoom==='arena') buildArenaWorld(); else if (curRoom==='lanes') buildLanesWorld(); else if (curRoom==='gym') buildGymWorld(); else if (curRoom==='cove') buildCoveWorld(); else if (curRoom==='jungle') buildJungleWorld(); else buildLoungeWorld(); }
buildLoungeWorld();
const seatAt = (x,y) => SEATS.find(s=>s.gx===x&&s.gy===y);
const walkable = (x,y) => x>=0&&y>=0&&x<N&&y<NY&&!BLOCK[y*N+x];
const DIRS8 = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
// Seats (chairs, stools, cushions, benches, logs) are only stepped on when you're going to sit there:
// paths go around them, and fall back to crossing one only if there's no other way.
// One llama per tile: where other llamas in this room are standing, or are walking to, can't be where you stop.
// Paths go around them when they can; squeezing past is allowed only if there's no other way.
function llamaTiles(){ const occ=new Set(); if (typeof others==='undefined') return occ;
  for (const o of others.values()){ if (!sameRoom(o) || o.leaving) continue;
    for (const [x,y] of [[o.x,o.y],[o.tx,o.ty]]) if (Number.isFinite(x)&&Number.isFinite(y)) occ.add(Math.floor(y)*N+Math.floor(x)); }
  return occ; }
function findPath(sx,sy,tx,ty){ const occ=llamaTiles(); if (occ.has(ty*N+tx)) return null;
  return findPath2(sx,sy,tx,ty,true,occ) || findPath2(sx,sy,tx,ty,false,occ) || findPath2(sx,sy,tx,ty,true,null) || findPath2(sx,sy,tx,ty,false,null); }
function findPath2(sx,sy,tx,ty,avoidSeats,occ){
  if (!walkable(tx,ty)) return null;
  const prev = new Int16Array(N*NY).fill(-1); const s=sy*N+sx, t=ty*N+tx;
  const seat = new Uint8Array(N*NY); if (avoidSeats) for (const st of SEATS) if (st.gx>=0&&st.gy>=0&&st.gx<N&&st.gy<NY) seat[st.gy*N+st.gx]=1;   /* seats only count as start or end points, and you can't hop seat to seat */
  const pass = (x,y) => walkable(x,y) && (!seat[y*N+x] || y*N+x===t) && !(occ && occ.has(y*N+x) && y*N+x!==s);
  const q=[s]; prev[s]=s; let qi=0;
  while (qi<q.length){ const c=q[qi++]; if(c===t) break; const cx=c%N, cy=(c/N)|0;
    for (const [dx,dy] of DIRS8){ const nx=cx+dx, ny=cy+dy; if(!pass(nx,ny)) continue; if(dx&&dy&&(!pass(cx+dx,cy)||!pass(cx,cy+dy))) continue; const n=ny*N+nx; if(prev[n]!==-1) continue; if (avoidSeats && seat[c] && seat[n]) continue; prev[n]=c; q.push(n); } }
  if (prev[t]===-1) return null;
  const path=[]; let c=t; while(c!==s){ path.push([c%N,(c/N)|0]); c=prev[c]; } return path.reverse();
}


// ======================= PIXEL RASTER HELPERS =======================
const INK = '#181020';
let g;
function polyPx(pts,col){
  // trace each edge with the same Bresenham steps linePx uses, then fill between the outermost edge pixels per row,
  // so a fill always lands exactly on (never past) the ink outline drawn along the same edges
  const lo={}, hi={}; let minY=Infinity, maxY=-Infinity;
  const mark=(x,y)=>{ if(!(y in lo)||x<lo[y]) lo[y]=x; if(!(y in hi)||x>hi[y]) hi[y]=x; if(y<minY)minY=y; if(y>maxY)maxY=y; };
  for (let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length];
    let x0=Math.round(a[0]), y0=Math.round(a[1]); const x1=Math.round(b[0]), y1=Math.round(b[1]);
    const dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1; let e=dx+dy;
    for(;;){ mark(x0,y0); if(x0===x1&&y0===y1) break; const e2=2*e; if(e2>=dy){e+=dy;x0+=sx;} if(e2<=dx){e+=dx;y0+=sy;} } }
  g.fillStyle=col;
  for (let y=minY; y<=maxY; y++) if (y in lo) g.fillRect(lo[y], y, hi[y]-lo[y]+1, 1);
}
function linePx(x0,y0,x1,y1,col){ x0=Math.round(x0);y0=Math.round(y0);x1=Math.round(x1);y1=Math.round(y1); g.fillStyle=col;
  const dx=Math.abs(x1-x0), dy=-Math.abs(y1-y0), sx=x0<x1?1:-1, sy=y0<y1?1:-1; let e=dx+dy;
  for(;;){ g.fillRect(x0,y0,1,1); if(x0===x1&&y0===y1) break; const e2=2*e; if(e2>=dy){e+=dy;x0+=sx;} if(e2<=dx){e+=dx;y0+=sy;} } }
function ellPx(cx,cy,rx,ry,col){ g.fillStyle=col; for(let y=Math.floor(cy-ry);y<=Math.ceil(cy+ry);y++){ const dy=(y+0.5-cy)/ry; if(Math.abs(dy)>1) continue; const hw=rx*Math.sqrt(1-dy*dy); const x0=Math.round(cx-hw), x1=Math.round(cx+hw); if(x1>x0) g.fillRect(x0,y,x1-x0,1);} }
function ellO(cx,cy,rx,ry,col){ ellPx(cx,cy,rx+1,ry+1,INK); ellPx(cx,cy,rx,ry,col); }
function diamondPx(x0,y0,col){ g.fillStyle=col; for(let j=0;j<19;j++){ const half = j<10 ? 2*(j+1) : 2*(19-j); g.fillRect(x0-half,y0+j,half*2,1);} }

// ======================= STATIC BACKGROUND (GBC palette) =======================
let BGX = 270, BGY = 130;
const bg = document.createElement('canvas'); bg.width = 540; bg.height = 400;
function sizeBG(){ BGX = NY*20+12; BGY = 130; const w=(N+NY)*20+24, h=(N+NY)*10+160; if (bg.width!==w) bg.width=w; if (bg.height!==h) bg.height=h; }
function rnd(seed){ let s=seed>>>0; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
// panelled wooden door with a sky window and brass knob, on the left wall (sg -1) or the back wall (sg 1); xa..xb are wall pixels
function drawDoor(ox, oy, xa, xb, sg, kx){ const H=46;

    for (let x=xa; x<xb; x++){ const b=Math.floor(sg*x/2), top=b-H, i=x-xa, w=xb-xa;
      g.fillStyle=INK; g.fillRect(ox+x, oy+top-1, 1, H+1);
      if (i===0||i===w-1) continue;
      const trim = i<=2 || i>=w-3;
      if (trim){ g.fillStyle = i<=1||i>=w-2 ? '#c8a068' : '#e8c890'; g.fillRect(ox+x, oy+top, 1, H); continue; }
      g.fillStyle='#e8c890'; g.fillRect(ox+x, oy+top, 1, 2); g.fillStyle=INK; g.fillRect(ox+x, oy+top+2, 1, 1);
      g.fillStyle='#b06a30'; g.fillRect(ox+x, oy+top+3, 1, H-3);
      const inner = i>=5 && i<=w-6;
      if (inner){
        // window showing the sky outside
        g.fillStyle=INK; g.fillRect(ox+x, oy+top+6, 1, 1); g.fillRect(ox+x, oy+top+17, 1, 1);
        const per=(typeof period==='string')?period:'night'; g.fillStyle = per==='day' ? '#98d0f8' : per==='dusk' ? '#f8a878' : '#384890'; g.fillRect(ox+x, oy+top+7, 1, 10);
        if (i===Math.floor(w/2)) { g.fillStyle='#e8c890'; g.fillRect(ox+x, oy+top+7, 1, 10); }
        if (per==='day' && i===6){ g.fillStyle='#f8f8f8'; g.fillRect(ox+x, oy+top+9, 1, 2); }
        // two inset panels
        for (const [p0,p1] of [[20,30],[33,H-4]]){ g.fillStyle='#8a4a20'; g.fillRect(ox+x, oy+top+p0, 1, 1); g.fillRect(ox+x, oy+top+p1, 1, 1); g.fillStyle='#c87838'; g.fillRect(ox+x, oy+top+p0+1, 1, p1-p0-1); }
      } else if (i===4 || i===w-5){ for (const [p0,p1] of [[20,30],[33,H-4]]){ g.fillStyle='#8a4a20'; g.fillRect(ox+x, oy+top+p0, 1, p1-p0+1); } g.fillStyle=INK; g.fillRect(ox+x, oy+top+6, 1, 12); }
    }
    // brass knob + plate
    const kb=Math.floor(sg*kx/2)-H; g.fillStyle=INK; g.fillRect(ox+kx-1, oy+kb+27, 4, 6); g.fillStyle='#f8d030'; g.fillRect(ox+kx, oy+kb+28, 2, 2); g.fillStyle='#c09018'; g.fillRect(ox+kx, oy+kb+30, 2, 2); g.fillStyle='#f8f0a0'; g.fillRect(ox+kx, oy+kb+28, 1, 1);
  }
function buildBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY;
  for (let x=-NY*20; x<N*20; x++){
    const left = x<0;
    const base = left ? Math.floor(-x/2) : Math.floor(x/2);
    const top = base-WH;
    g.fillStyle = left ? '#b8a0f0' : '#d0b8f8'; g.fillRect(ox+x, oy+top, 1, WH+2);
    if (((left?-x:x)%8)<2){ g.fillStyle = left ? '#a890e0' : '#c0a8f0'; g.fillRect(ox+x, oy+top+6, 1, WH-34); }
    g.fillStyle = left ? '#7860c8' : '#8870d8'; g.fillRect(ox+x, oy+base-26, 1, 28);
    g.fillStyle = '#f8f8f8'; g.fillRect(ox+x, oy+base-28, 1, 2);
    g.fillStyle = INK; g.fillRect(ox+x, oy+base-29, 1, 1);
    g.fillStyle = '#382878'; g.fillRect(ox+x, oy+top-4, 1, 5);
    g.fillStyle = INK; g.fillRect(ox+x, oy+top-5, 1, 1); g.fillRect(ox+x, oy+base, 1, 1);
  }
  g.fillStyle=INK; g.fillRect(ox-1, oy-WH-5, 2, WH+6); g.fillRect(ox-NY*20-1, oy+NY*10-WH-5, 1, WH+6); g.fillRect(ox+N*20, oy+N*10-WH-5, 1, WH+6);
  // window on right wall
  { const x0=164,x1=196,h0=34,h1=74;
    for(let x=x0; x<x1; x++){ const b=Math.floor(x/2); const edge=x<x0+3||x>=x1-3; g.fillStyle=INK; g.fillRect(ox+x,oy+b-h1-1,1,h1-h0+2);
      if(x===x0||x===x1-1) continue; const per=(typeof period==='string')?period:'night'; const sky = per==='day' ? (x%2?'#88c8f8':'#90d0f8') : per==='dusk' ? '#f8a068' : '#3858a8';
      g.fillStyle=edge?'#f8f8f8':sky; g.fillRect(ox+x,oy+b-h1,1,h1-h0); if(!edge&&per==='dusk'){ g.fillStyle='#f8d090'; g.fillRect(ox+x,oy+b-h0-14,1,11); }
      if(!edge){ g.fillStyle='#f8f8f8'; g.fillRect(ox+x,oy+b-h1,1,3); g.fillRect(ox+x,oy+b-h0-3,1,3); if(x===180){ g.fillRect(ox+x,oy+b-h1,2,h1-h0);} } }
    const per=(typeof period==='string')?period:'night';
    if (per==='night'){ const r=rnd(7); for(let i=0;i<9;i++){ const x=Math.round(x0+4+r()*24); if(x>=178&&x<=182) continue; const b=Math.floor(x/2); g.fillStyle='#f8f8f8'; g.fillRect(ox+x, oy+b-h1+5+Math.floor(r()*28),1,1); }
      g.fillStyle='#f8e878'; g.fillRect(ox+186, oy+93-66, 4, 4); g.fillStyle='#3858a8'; g.fillRect(ox+188, oy+93-66, 2, 2); }
    else if (per==='day'){ g.fillStyle='#f8e040'; g.fillRect(ox+186, oy+93-68, 5, 5); g.fillStyle='#f8f8f8'; g.fillRect(ox+168, oy+84-62, 8, 2); g.fillRect(ox+170, oy+85-64, 4, 2); g.fillRect(ox+184, oy+92-52, 7, 2); }
    else { g.fillStyle='#f87838'; g.fillRect(ox+170, oy+85-44, 6, 4); }
  }
  // shelves + bottles
  const r = rnd(42);
  const cols = ['#48c048','#f04040','#f8c030','#58b8f8','#b058e0','#f8f8f8','#30a080'];
  for (const h of [40,58]){
    for (let x=4; x<140; x++){ const b=Math.floor(x/2); g.fillStyle='#c87838'; g.fillRect(ox+x, oy+b-h, 1, 2); g.fillStyle=INK; g.fillRect(ox+x, oy+b-h+2, 1, 1); }
    for (let x=8; x<134; x+=6+Math.floor(r()*3)){ const b=Math.floor(x/2); const bh=5+Math.floor(r()*5); const c=cols[Math.floor(r()*cols.length)];
      g.fillStyle=INK; g.fillRect(ox+x-1, oy+b-h-bh-1, 5, bh+1); g.fillRect(ox+x, oy+b-h-bh-3, 3, 3);
      g.fillStyle=c; g.fillRect(ox+x, oy+b-h-bh, 3, bh); g.fillRect(ox+x+1, oy+b-h-bh-2, 1, 2); g.fillStyle='#f8f8f8'; g.fillRect(ox+x, oy+b-h-bh+1, 1, 2); }
  }
  drawDoor(ox, oy, -220, -200, -1, -205);   // the lounge's door, on the left wall at gy 10
  // floor
  // floor: each tile filled and edged with the same pixel steps, so no colour pokes past the grout lines
  const T=(gx,gy)=>{ const p=proj(gx,gy); return [ox+p[0], oy+p[1]]; };
  { // tiles: each one has a bevelled edge (light along the back edges, shadow along the front), faint marble veins, speckles,
    // and every other tile a small inlaid diamond; the grout lines are drawn over the top afterwards
    const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10, img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
    const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)], A=hx('#f8d8a0'), B=hx('#f0c080'), inlay=hx('#e0a868'), inlay2=hx('#fff0c8');
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy, gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue;
      const tx=Math.floor(gx), ty=Math.floor(gy), u=gx-tx, v=gy-ty, odd=(tx+ty)%2; let c=odd?B:A;
      const vein=Math.abs(Math.sin((u*2.3+v*1.1+dhash(tx,ty)*4)*3.1+Math.sin(v*7+tx)*0.6)); if (vein<0.05) c=dshade(c,0.94);
      if (dhash(Math.floor(gx*22),Math.floor(gy*22))<0.05) c=dshade(c,0.95);
      if (u<0.08||v<0.08) c=dshade(c,1.07); else if (u>0.92||v>0.92) c=dshade(c,0.92);
      if (!odd){ const dm=Math.abs(u-0.5)+Math.abs(v-0.5); if (dm<0.1) c = dm<0.05 ? inlay2 : inlay; }
      const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
    g.putImageData(img,x0,y0); }
  for (let gy=0; gy<NY; gy++) for (let gx=0; gx<N; gx++){ const a=T(gx,gy), b=T(gx+1,gy), c=T(gx+1,gy+1), d=T(gx,gy+1);
    linePx(a[0],a[1],b[0],b[1],'#d8a060'); linePx(b[0],b[1],c[0],c[1],'#d8a060'); linePx(c[0],c[1],d[0],d[1],'#d8a060'); linePx(d[0],d[1],a[0],a[1],'#d8a060'); }
  // welcome mat at the door
  { const M=(x,y)=>{ const p=proj(x,y); return [ox+p[0], oy+p[1]]; };
    polyPx([M(0.04,10.12),M(0.6,10.12),M(0.6,10.88),M(0.04,10.88)],INK); polyPx([M(0.08,10.17),M(0.56,10.17),M(0.56,10.83),M(0.08,10.83)],'#4a8a38');
    polyPx([M(0.16,10.27),M(0.48,10.27),M(0.48,10.73),M(0.16,10.73)],'#68b048');
    for (const u of [10.35,10.5,10.65]){ const a=M(0.2,u), b=M(0.44,u); linePx(a[0],a[1],b[0],b[1],'#4a8a38'); } }
  // rugs
  const rug = (x0,y0,x1,y1,c1,c2) => {
    const pts=(a,b,c,d)=>[proj(a,b),proj(c,b),proj(c,d),proj(a,d)].map(p=>[ox+p[0],oy+p[1]]);
    polyPx(pts(x0-0.05,y0-0.05,x1+0.05,y1+0.05),INK);
    polyPx(pts(x0,y0,x1,y1),c2);
    polyPx(pts(x0+0.18,y0+0.18,x1-0.18,y1-0.18),c1);
    const cx=(x0+x1)/2, cy=(y0+y1)/2, k=0.95; polyPx([proj(cx,cy-k),proj(cx+k,cy),proj(cx,cy+k),proj(cx-k,cy)].map(p=>[ox+p[0],oy+p[1]]),c2);
  };
  rug(7,7,10,10,'#f05888','#f8d030');
  rug(2,7,5,10,'#3890e0','#f8d030');
}

// ======================= LLAMA CASINO BACKGROUND =======================
function buildCasinoBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY;
  for (let x=-NY*20; x<N*20; x++){
    const left=x<0, ax=left?-x:x, base=Math.floor(ax/2), top=base-WH;
    g.fillStyle = left ? '#5e1834' : '#6e2040'; g.fillRect(ox+x, oy+top, 1, WH+2);                       // wallpaper
    if (ax%12===0){ g.fillStyle = left ? '#74264a' : '#843058'; g.fillRect(ox+x, oy+top+6, 1, WH-36); }   // pinstripes
    for (const v of [44,60,76]) if ((ax+v)%12===6){ g.fillStyle='#c09018'; g.fillRect(ox+x, oy+base-v, 1, 1); g.fillRect(ox+x, oy+base-v-2, 1, 1); }
    g.fillStyle = left ? '#30081a' : '#3a0c22'; g.fillRect(ox+x, oy+base-28, 1, 28);                      // wainscot
    if (ax%20===10){ g.fillStyle='#22040f'; g.fillRect(ox+x, oy+base-24, 1, 20); }
    g.fillStyle='#f8d030'; g.fillRect(ox+x, oy+base-30, 1, 2); g.fillStyle=INK; g.fillRect(ox+x, oy+base-31, 1, 1);   // gold rail
    g.fillStyle='#c09018'; g.fillRect(ox+x, oy+top-4, 1, 5); g.fillStyle=INK; g.fillRect(ox+x, oy+top-5, 1, 1); g.fillRect(ox+x, oy+base, 1, 1);
  }
  g.fillStyle=INK; g.fillRect(ox-1, oy-WH-5, 2, WH+6); g.fillRect(ox-NY*20-1, oy+NY*10-WH-5, 1, WH+6); g.fillRect(ox+N*20, oy+N*10-WH-5, 1, WH+6);
  drawDoor(ox, oy, -220, -200, -1, -205);   // door on the left wall at gy 10 (to the LLAMA LOUNGE)
  // brass wall sconces with a warm glow
  for (const [x,sg] of [[-70,-1],[-150,-1],[134,1],[250,1]]){ const b=Math.floor(sg*x/2), y=oy+b-70;
    g.fillStyle='rgba(248,208,96,0.18)'; for (let r=10;r>4;r-=2){ g.fillRect(ox+x-r, y-r, r*2+1, r*2+1); }
    g.fillStyle=INK; g.fillRect(ox+x-3, y-4, 7, 7); g.fillStyle='#f8f0d0'; g.fillRect(ox+x-2, y-3, 5, 4); g.fillStyle='#c09018'; g.fillRect(ox+x-2, y+1, 5, 1); g.fillRect(ox+x, y+2, 1, 4); }
  // carpet: big diamond medallions spanning 2 x 2 tiles (gold heart, teal and gold bands, deep red field, dark lattice where they meet)
  const T=(gx,gy)=>{ const p=proj(gx,gy); return [ox+p[0], oy+p[1]]; };
  { const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10; const img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
    const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    const C={gold:hex('#e8b838'),gold2:hex('#b88818'),dark:hex('#3a0818'),teal:hex('#1e6a70'),teal2:hex('#2a8a8a'),red:hex('#961630'),red2:hex('#a81c38'),lat:hex('#5a0c20'),cream:hex('#f0d890')};
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy; const gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue;
      // round medallion in the middle of every 2 x 2 block: gold heart, eight teal petals, gold and dark rings
      const bx=Math.floor(gx/2)*2+1, by=Math.floor(gy/2)*2+1, dx=gx-bx, dy=gy-by, r=Math.hypot(dx,dy), ang=Math.atan2(dy,dx);
      // small gold star where four blocks meet
      const ex=gx-Math.round(gx/2)*2, ey=gy-Math.round(gy/2)*2, er=Math.hypot(ex,ey);
      let c;
      if (r<0.13) c=C.gold; else if (r<0.18) c=C.dark;
      else if (r<0.5){ const k=(r-0.18)/0.32, petal=Math.cos(ang*8) > k*1.7-0.75; c = petal ? (Math.cos(ang*8)>k*1.7-0.35 ? C.teal2 : C.teal) : C.red2; if (petal && Math.abs(Math.cos(ang*8)-(k*1.7-0.75))<0.08) c=C.cream; }
      else if (r<0.55) c=C.gold; else if (r<0.6) c=C.dark;
      else if (er<0.1) c=C.gold; else if (er<0.3 && Math.min(Math.abs(ex),Math.abs(ey))<0.035) c=C.gold2;
      else if (er<0.36 && er>0.31) c=C.gold2;
      else { const hatch=((Math.floor((gx+gy)*6))%2===0); c = hatch ? C.red : C.red2; if (r>0.6 && r<0.64) c=C.lat; }
      const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
    g.putImageData(img,x0,y0); }
  // gold border round the edge of the carpet
  { const a=T(0.1,0.1), b=T(N-0.1,0.1), c=T(N-0.1,NY-0.1), d=T(0.1,NY-0.1); for (const [p1,p2] of [[a,b],[b,c],[c,d],[d,a]]) linePx(p1[0],p1[1],p2[0],p2[1],'#d8a830'); }
  // black runner from the door
  { const R=(x0,y0,x1,y1,c)=>polyPx([T(x0,y0),T(x1,y0),T(x1,y1),T(x0,y1)],c); R(0,9.85,3.1,11.15,'#d8a830'); R(0,9.95,3,11.05,'#1a0810'); R(0,10.15,3,10.85,'#2a1018'); }
}

// ======================= SPIT ARENA ROOM BACKGROUND =======================
function buildArenaBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY;
  for (let x=-NY*20; x<N*20; x++){
    const left=x<0, ax=left?-x:x, base=Math.floor(ax/2), top=base-WH;
    g.fillStyle = left ? '#1c2452' : '#232c62'; g.fillRect(ox+x, oy+top, 1, WH+2);                     // navy wall
    g.fillStyle = left ? '#ff5c8a' : '#ff6e96'; g.fillRect(ox+x, oy+base-58, 1, 6);                    // pink stripe
    g.fillStyle = left ? '#f8c828' : '#ffd23f'; g.fillRect(ox+x, oy+base-50, 1, 3);                    // gold stripe
    g.fillStyle = left ? '#141a3c' : '#182046'; g.fillRect(ox+x, oy+base-26, 1, 26);                   // padded lower wall
    if (ax%16===0){ g.fillStyle='#0c1030'; g.fillRect(ox+x, oy+base-26, 1, 26); }
    // pennant bunting along the top
    { const k=ax%14, cols=['#ff5c8a','#ffd23f','#5ad0ff','#7ce07c']; const col=cols[Math.floor(ax/14)%4]; const len = k<7 ? k : 13-k; if (k<13){ g.fillStyle=col; g.fillRect(ox+x, oy+top+4, 1, Math.max(1,len)); } g.fillStyle=INK; g.fillRect(ox+x, oy+top+3, 1, 1); }
    g.fillStyle=INK; g.fillRect(ox+x, oy+top-1, 1, 1); g.fillRect(ox+x, oy+base, 1, 1);
  }
  g.fillStyle=INK; g.fillRect(ox-1, oy-WH-5, 2, WH+6); g.fillRect(ox-NY*20-1, oy+NY*10-WH-5, 1, WH+6); g.fillRect(ox+N*20, oy+N*10-WH-5, 1, WH+6);
  drawDoor(ox, oy, -220, -200, -1, -205);
  // floor: wooden court boards with a painted sand ring in the middle
  const T=(gx,gy)=>{ const p=proj(gx,gy); return [ox+p[0], oy+p[1]]; };
  { const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10; const img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
    const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    const C={w1:hex('#c88a4a'),w2:hex('#b87a3c'),seam:hex('#8a5426'),sand:hex('#ead098'),sand2:hex('#dcbc80'),red:hex('#d8304c'),white:hex('#f8f0e0'),pink:hex('#ff6e96'),line:hex('#f8f0e0')};
    const R=ARENA_RING;
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy; const gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue;
      const d=Math.hypot(gx-R.cx, gy-R.cy); let c;
      if (d<R.r-0.25){ const n=((Math.floor(gx*9)*7+Math.floor(gy*9)*13)%5===0); c = n ? C.sand2 : C.sand; const dd=Math.hypot(gx-R.cx,gy-R.cy); if (dd<0.55 && dd>0.42) c=C.pink; }
      else if (d<R.r-0.12) c=C.white; else if (d<R.r+0.12) c=C.red; else if (d<R.r+0.22) c=C.white;
      else { const board=Math.floor(gy*2.5); c = woodGrain(board%2 ? C.w1 : C.w2, gx+board*1.7, (gy*2.5)%1, board); if ((gy*2.5)%1<0.06) c=C.seam; if (Math.abs(((gx+board*1.7)%4))<0.04) c=C.seam;
        if (Math.abs(gx-0.6)<0.04 || Math.abs(gx-(N-0.6))<0.04 || Math.abs(gy-(NY-0.6))<0.04) c=C.line; }
      const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
    g.putImageData(img,x0,y0); }
  { const R=(x0,y0,x1,y1,c)=>polyPx([T(x0,y0),T(x1,y0),T(x1,y1),T(x0,y1)],c); R(0,9.85,2.6,11.15,'#f8f0e0'); R(0,9.95,2.5,11.05,'#2a3270'); }
}

// ======================= LLAMA LANES ROOM BACKGROUND =======================
function buildLanesBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY;
  for (let x=-NY*20; x<N*20; x++){
    const left=x<0, ax=left?-x:x, base=Math.floor(ax/2), top=base-WH;
    g.fillStyle = left ? '#2a1640' : '#321a4c'; g.fillRect(ox+x, oy+top, 1, WH+2);
    // retro wallpaper: little stars and swooshes
    if ((ax*7)%23===0){ g.fillStyle = left ? '#5a3a80' : '#6a4890'; g.fillRect(ox+x, oy+top+14+((ax*3)%30), 1, 1); }
    g.fillStyle = left ? '#ff8a3a' : '#ff9a48'; g.fillRect(ox+x, oy+base-44, 1, 3);
    g.fillStyle = left ? '#5ad0ff' : '#68dcff'; g.fillRect(ox+x, oy+base-40, 1, 2);
    g.fillStyle = left ? '#1a0c28' : '#200f30'; g.fillRect(ox+x, oy+base-22, 1, 22);
    g.fillStyle=INK; g.fillRect(ox+x, oy+top-1, 1, 1); g.fillRect(ox+x, oy+base, 1, 1);
  }
  g.fillStyle=INK; g.fillRect(ox-1, oy-WH-5, 2, WH+6); g.fillRect(ox-NY*20-1, oy+NY*10-WH-5, 1, WH+6); g.fillRect(ox+N*20, oy+N*10-WH-5, 1, WH+6);
  drawDoor(ox, oy, -220, -200, -1, -205);
  const T=(gx,gy)=>{ const p=proj(gx,gy); return [ox+p[0], oy+p[1]]; };
  { const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10; const img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
    const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    const C={m1:hex('#ecc890'),m2:hex('#e2bc80'),seam:hex('#caa068'),gut:hex('#3a3448'),gut2:hex('#4a4458'),cap:hex('#7a5a9a'),foul:hex('#d83048'),arrow:hex('#9a6a38'),deck:hex('#f4dcaa'),
             cp1:hex('#2a2470'),cp2:hex('#352e86'),dot1:hex('#ffd23f'),dot2:hex('#ff6e96'),dot3:hex('#5ad0ff')};
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy; const gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue;
      let c=null; const li=LANE_GX.findIndex(L=>gx>=L && gx<L+2);
      if (li>=0 && gy<8){ const u=gx-LANE_GX[li];
        if (u<0.16 || u>1.84) c=(u<0.08||u>1.92)?C.gut2:C.gut;
        else { const b=Math.floor((u-0.16)*12); c = b%2 ? C.m1 : C.m2; if (((u-0.16)*12)%1<0.08) c=C.seam;
          if (gy<1.3) c=C.deck; if (gy>7.85) c=C.foul;
          const ar=[0.5,0.83,1.17,1.5]; for (const a of ar){ if (gy>5.4 && gy<5.9 && Math.abs(u-a)<(gy-5.4)*0.12) c=C.arrow; } } }
      else if (li<0 && gy<8) c = C.cap;
      if (!c){ // retro carpet on the approach and the lounge area
        const k=(Math.floor(gx*3)+Math.floor(gy*3))%7; c = ((Math.floor(gx*1.5)+Math.floor(gy*1.5))%2) ? C.cp1 : C.cp2;
        if (k===0 && ((gx*3)%1)<0.3 && ((gy*3)%1)<0.3) c=[C.dot1,C.dot2,C.dot3][Math.floor(gx+gy)%3]; }
      const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
    g.putImageData(img,x0,y0); }
}


// ======================= BOXING GYM =======================
// the ring: inside tiles gx 4..8, gy 3..7 (edges at 4..9 and 3..8), raised RING.H pixels; fighters stand at RING.A and RING.B
const RING = { x0:4, y0:3, x1:9, y1:8, H:10, A:[5,5], B:[7,5], outA:[3,8], outB:[10,6] };
const inRing = (x,y) => x>=RING.x0 && x<RING.x1 && y>=RING.y0 && y<RING.y1;
const ringLift = (x,y) => (curRoom==='gym' && x>=RING.x0 && x<=RING.x1 && y>=RING.y0 && y<=RING.y1) ? RING.H : 0;
const GYM_BAGS = [[1,2],[1,5],[11,3]];
function buildGymWorld(){
  clearWorld();
  // the ring and a one-tile margin round its back edges (so nobody stands half under the apron); fighters are put in by the bell
  for (let x=RING.x0-1; x<=RING.x1; x++) for (let y=RING.y0-1; y<=RING.y1; y++) if (x<RING.x1 && y<RING.y1 || false) block(x,y);
  for (let x=RING.x0; x<RING.x1; x++) for (let y=RING.y0; y<RING.y1; y++){
    if (y===RING.y1-1) FURN.push({t:'ropeseg', gx:x, gy:y, side:'S', dz:0.3});
    if (x===RING.x1-1) FURN.push({t:'ropeseg', gx:x, gy:y, side:'E', dz:0.32});
    if (y===RING.y0) FURN.push({t:'ropeseg', gx:x, gy:y, side:'N', dz:-0.6});
    if (x===RING.x0) FURN.push({t:'ropeseg', gx:x, gy:y, side:'W', dz:-0.62}); }
  FURN.push({t:'ringpost', gx:RING.x1-1, gy:RING.y1-1, dz:0.45});
  FURN.push({t:'ringsteps', gx:RING.x0, gy:RING.y1}); block(RING.x0, RING.y1);
  for (const [x,y] of GYM_BAGS){ FURN.push({t:'hbag', gx:x, gy:y}); block(x,y); }
  FURN.push({t:'lockers', gx:2, gy:0}); block(2,0); FURN.push({t:'lockers', gx:3, gy:0, b:1}); block(3,0);
  FURN.push({t:'cooler', gx:10, gy:0}); block(10,0);
  FURN.push({t:'weights', gx:12, gy:0}); block(12,0);
  FURN.push({t:'ringbell', gx:10, gy:8}); block(10,8);
  for (const [x,y] of [[6,10],[9,10]]){ FURN.push({t:'gbench', gx:x, gy:y, dz:0.5}); for (const xx of [x,x+1]) SEATS.push({gx:xx, gy:y, dir:'br', lift:7}); }
  FURN.push({t:'fern', gx:12, gy:11, flip:true}); block(12,11);
}
// lettering laid along a slanted face (slope 0.5 = along +gx on screen, -0.5 = along +gy)
function slantText(c, str, x, y, slope, col, sc=1){ const w=pfW(str,sc)+2, h=5*sc+2, cv=document.createElement('canvas'); cv.width=w; cv.height=h; pfDraw(cv.getContext('2d'), str, 1, 1, col, sc);
  for (let i=0;i<w;i++) c.drawImage(cv, i,0,1,h, Math.round(x+i), Math.round(y+i*slope), 1, h); }
function buildGymBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY, T=(gx,gy,h=0)=>{ const p=proj(gx,gy); return [ox+p[0], oy+p[1]-h]; };
  // walls: painted navy dado with a red and white racing stripe, exposed brick above, dark steel trim on top
  for (let x=-NY*20; x<N*20; x++){
    const left=x<0, ax=left?-x:x, base=Math.floor(ax/2), sh=left?0.86:1;
    for (let hh=0; hh<=WH; hh++){ let c;
      if (hh<3) c='#141826'; else if (hh<26) c = (ax%18===0) ? '#1a2446' : '#24315e';
      else if (hh<29) c='#e03a48'; else if (hh<31) c='#f4ede0';
      else if (hh>WH-4) c='#2c2c38';
      else { const row=Math.floor((hh-31)/6), off=(row%2)*7, bx=Math.floor((ax+off)/14), mort=((hh-31)%6===5) || ((ax+off)%14===13);
        if (mort) c='#6a3a2c'; else { const v=dhash(bx*3+row, row*7+bx); c = v<0.18 ? '#8e3a26' : v<0.4 ? '#b25236' : v<0.55 ? '#a2482e' : '#9c4430'; if ((hh-31)%6===0 && !mort) c=dshadeHex(c,1.12); } }
      g.fillStyle=sh===1?c:dshadeHex(c,sh); g.fillRect(ox+x, oy+base-hh, 1, 1); }
    g.fillStyle=INK; g.fillRect(ox+x, oy+base-WH-1, 1, 1); g.fillRect(ox+x, oy+base+1, 1, 1);
  }
  g.fillStyle=INK; g.fillRect(ox-1, oy-WH-1, 2, WH+2); g.fillRect(ox-NY*20-1, oy+NY*10-WH-1, 1, WH+2); g.fillRect(ox+N*20, oy+N*10-WH-1, 1, WH+2);
  // three high windows on the back wall, light falling in
  for (const wx of [18,186]){ const per=(typeof period==='string')?period:'day', sky = per==='day' ? ['#9ad4fa','#c4e8ff'] : per==='dusk' ? ['#f8a070','#ffc890'] : ['#2e3e88','#46589e'];
    for (let x=wx; x<wx+22; x++){ const b=Math.floor(x/2); g.fillStyle=INK; g.fillRect(ox+x, oy+b-84, 1, 16);
      if (x===wx || x===wx+21) continue; const frame = x===wx+1 || x===wx+20 || x===wx+11; g.fillStyle = frame ? '#3a3a48' : sky[(x-wx)<6?1:0]; g.fillRect(ox+x, oy+b-83, 1, 14);
      if (!frame){ g.fillStyle='#3a3a48'; g.fillRect(ox+x, oy+b-76, 1, 1); } } }
  drawDoor(ox, oy, -220, -200, -1, -205);
  // floor: dark rubber gym tiles with flecks, a lighter border lane round the room
  { const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10, img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
    const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    const C={a:hx('#3b3e4c'),b:hx('#363946'),fl1:hx('#4c5062'),fl2:hx('#2e303a'),fl3:hx('#4a5a98'),fl4:hx('#8a4a56'),seam:hx('#2a2c38'),hi:hx('#454858'),lane:hx('#2e3140')};
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy, gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue;
      const tx=Math.floor(gx), ty=Math.floor(gy), u=gx-tx, v=gy-ty; let c=((tx+ty)%2)?C.a:C.b;
      if (gx<0.5 || gy<0.5) c=C.lane;
      const h=dhash(Math.floor(gx*26), Math.floor(gy*26)); if (h<0.05) c=C.fl1; else if (h<0.09) c=C.fl2; else if (h<0.093) c=C.fl3; else if (h<0.096) c=C.fl4;
      if (u<0.05||v<0.05) c=C.hi; if (u>0.96||v>0.96) c=C.seam;
      const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
    g.putImageData(img,x0,y0); }
  // welcome mat
  { const R=(a,b,c,d,col)=>polyPx([T(a,b),T(c,b),T(c,d),T(a,d)],col); R(0.05,10.12,1.6,10.88,INK); R(0.1,10.18,1.55,10.82,'#c83a44'); R(0.25,10.32,1.4,10.68,'#e8505a'); }
  // the ring: soft shadow, blue skirted apron, canvas mat with a painted logo and a spotlight on it
  const {x0,y0,x1,y1,H}=RING;
  polyPx([T(x0-0.15,y1+0.25),T(x1+0.25,y1+0.25),T(x1+0.25,y0-0.15),T(x1,y0),T(x0,y1)],'rgba(10,8,20,0.45)');
  polyPx([T(x0,y1,0),T(x1,y1,0),T(x1,y1,H),T(x0,y1,H)],'#2c4fc4'); polyPx([T(x1,y0,0),T(x1,y1,0),T(x1,y1,H),T(x1,y0,H)],'#1f3a98');
  for (let k=0;k<=25;k++){ const u=k/25; const a=T(x0+(x1-x0)*u,y1,1), b=T(x0+(x1-x0)*u,y1,H-2); if (k%3===0) linePx(a[0],a[1],b[0],b[1],'#24439f'); const c2=T(x1,y0+(y1-y0)*u,1), d2=T(x1,y0+(y1-y0)*u,H-2); if (k%3===0) linePx(c2[0],c2[1],d2[0],d2[1],'#172e7a'); }
  for (const [p,q] of [[T(x0,y1,H-2),T(x1,y1,H-2)],[T(x1,y0,H-2),T(x1,y1,H-2)]]){ linePx(p[0],p[1],q[0],q[1],'#ffd23f'); }
  slantText(g, 'LLAMA BOXING CLUB', T(x0+0.55,y1,0)[0], T(x0+0.55,y1,0)[1]-8, 0.5, '#f4ede0');
  { const p=T(x1,y0+1.6,0); slantText(g, 'LBC', p[0]-1, p[1]-8, -0.5, '#ffd23f'); }
  const L=(p,q,c)=>linePx(p[0],p[1],q[0],q[1],c);
  L(T(x0,y1,0),T(x1,y1,0),INK); L(T(x1,y0,0),T(x1,y1,0),INK); L(T(x0,y1,0),T(x0,y1,H),INK); L(T(x1,y1,0),T(x1,y1,H),INK); L(T(x1,y0,0),T(x1,y0,H),INK);
  // mat
  polyPx([T(x0,y0,H),T(x1,y0,H),T(x1,y1,H),T(x0,y1,H)],'#d6cdb8');
  polyPx([T(x0+0.2,y0+0.2,H),T(x1-0.2,y0+0.2,H),T(x1-0.2,y1-0.2,H),T(x0+0.2,y1-0.2,H)],'#ece6d8');
  { // spotlight: an ordered dither of lighter canvas in a soft oval round the middle, and the painted logo
    const [cx,cy]=T((x0+x1)/2,(y0+y1)/2,H);
    for (let yy=-30; yy<=30; yy++) for (let xx=-62; xx<=62; xx++){ const r=(xx*xx)/(62*62)+(yy*yy)/(31*31); if (r>1) continue; const m=((xx+yy)&1)===0, m2=((xx&1)===0 && (yy&1)===0);
      if (r<0.55 ? m : m2){ const [gx,gy]=[((cx+xx-ox)/20+(cy+yy+H-oy)/10)/2, ((cy+yy+H-oy)/10-(cx+xx-ox)/20)/2]; if (gx>x0+0.22 && gx<x1-0.22 && gy>y0+0.22 && gy<y1-0.22){ g.fillStyle='#f8f4ec'; g.fillRect(Math.round(cx+xx),Math.round(cy+yy),1,1); } } }
    ellPx(cx,cy,30,15,INK); ellPx(cx,cy,29,14,'#f4ede0'); ellPx(cx,cy,26,13,'#d8303c'); ellPx(cx,cy,19,9,'#ffd23f'); ellPx(cx,cy,17,8,'#2c4fc4');
    const st=[]; for (let k=0;k<10;k++){ const a=-Math.PI/2+k*Math.PI/5, r=k%2?5.5:13; st.push([cx+Math.cos(a)*r, cy+Math.sin(a)*r*0.5]); } polyPx(st,'#f4ede0'); }
  L(T(x0,y0,H),T(x1,y0,H),'#b8ae98'); L(T(x0,y0,H),T(x0,y1,H),'#b8ae98'); L(T(x0,y1,H),T(x1,y1,H),INK); L(T(x1,y0,H),T(x1,y1,H),INK);
  L(T(x0+0.02,y1,H-1),T(x1,y1,H-1),'#f4ede0'); L(T(x1,y0+0.02,H-1),T(x1,y1,H-1),'#c8c0ac');
}
function dshadeHex(c,k){ const r=Math.max(0,Math.min(255,Math.round(parseInt(c.slice(1,3),16)*k))), gg=Math.max(0,Math.min(255,Math.round(parseInt(c.slice(3,5),16)*k))), b=Math.max(0,Math.min(255,Math.round(parseInt(c.slice(5,7),16)*k))); return '#'+[r,gg,b].map(v=>v.toString(16).padStart(2,'0')).join(''); }
// corner pads: red and blue on the two side corners, white on the back and front ones
const RING_PAD = { '4,8':['#e83850','#a81c34','#ff8090'], '9,3':['#3a6ae8','#1f3a98','#8ab0ff'], '4,3':['#f4ede0','#b8ae98','#ffffff'], '9,8':['#f4ede0','#b8ae98','#ffffff'] };
const ROPE_COLS = [['#e83850','#9a1c30'],['#f4ede0','#a8a090'],['#3a6ae8','#1c3488']];
function ringPost(cx, cy){ const H=RING.H, k=cx+','+cy, pad=RING_PAD[k]; const [bx,by]=P(cx,cy,H), X=Math.round(bx), Y=Math.round(by);
  g.fillStyle=INK; g.fillRect(X-2,Y-31,5,32); g.fillStyle='#6a6e80'; g.fillRect(X-1,Y-30,3,30); g.fillStyle='#a8aec0'; g.fillRect(X-1,Y-30,1,30); g.fillStyle='#454858'; g.fillRect(X+1,Y-30,1,30);
  g.fillStyle=INK; g.fillRect(X-3,Y-33,7,3); g.fillStyle='#c8ccd8'; g.fillRect(X-2,Y-32,5,1);
  // padded cover over the turnbuckles
  g.fillStyle=INK; g.fillRect(X-4,Y-25,9,20); g.fillStyle=pad[0]; g.fillRect(X-3,Y-24,7,18); g.fillStyle=pad[2]; g.fillRect(X-3,Y-24,2,18); g.fillStyle=pad[1]; g.fillRect(X+2,Y-24,2,18);
  g.fillStyle=pad[1]; g.fillRect(X-3,Y-18,7,1); g.fillRect(X-3,Y-12,7,1); }
function ropeSpan(a, b, side){ for (let r=0;r<3;r++){ const hh=RING.H+20-r*6; const p=P(a[0],a[1],hh), q=P(b[0],b[1],hh); linePx(p[0],p[1],q[0],q[1],ROPE_COLS[r][0]); linePx(p[0],p[1]+1,q[0],q[1]+1,ROPE_COLS[r][1]); } }
function drawGymPiece(f, t, sx, sy){
  switch (f.t){
    case 'ropeseg': { const {x0,y0,x1,y1}=RING, s=f.side;
      if (s==='S'){ ropeSpan([f.gx,y1],[f.gx+1,y1]); if (f.gx===x0) ringPost(x0,y1); if (f.gx===Math.floor((x0+x1)/2)){ const p=P(f.gx+0.5,y1,RING.H+8), q=P(f.gx+0.5,y1,RING.H+21); g.fillStyle='#f4ede0'; g.fillRect(Math.round(p[0]),Math.round(q[1]),1,Math.round(p[1]-q[1])); } }
      else if (s==='E'){ ropeSpan([x1,f.gy],[x1,f.gy+1]); if (f.gy===y0) ringPost(x1,y0); }
      else if (s==='N'){ ropeSpan([f.gx,y0],[f.gx+1,y0]); if (f.gx===x0) ringPost(x0,y0); }
      else if (s==='W'){ ropeSpan([x0,f.gy],[x0,f.gy+1]); }
      break; }
    case 'ringpost': ringPost(RING.x1, RING.y1); break;
    case 'ringsteps': { // two wooden steps up to the apron
      for (let k=1;k>=0;k--){ const h=(k+1)*4, d=0.55-k*0.25; box(f.gx+0.15, f.gy+0.02, 0.7, d, h, '#b07a44', '#8a5a30', '#6a4220'); } break; }
    case 'hbag': { // heavy bag on a chain: red leather, white band, black caps; swings when hit
      const kick=f.hitT ? Math.max(0, 1-(performance.now()-f.hitT)/1400) : 0, sw=Math.round(Math.sin((performance.now()-(f.hitT||0))/90)*3*kick);
      ellPx(sx, sy, 9, 3, 'rgba(10,8,20,0.35)');
      const X=sx+sw, top=sy-58, bot=sy-14;
      for (let y=sy-104; y<top; y+=3){ g.fillStyle=INK; g.fillRect(sx+Math.round(sw*(y-(sy-104))/(top-(sy-104)))-1, y, 3, 2); g.fillStyle='#a8aec0'; g.fillRect(sx+Math.round(sw*(y-(sy-104))/(top-(sy-104))), y, 1, 1); }
      g.fillStyle=INK; g.fillRect(X-8, top-1, 17, bot-top+3); g.fillRect(X-7, top-2, 15, 1); g.fillRect(X-7, bot+2, 15, 1);
      g.fillStyle='#c8303c'; g.fillRect(X-7, top, 15, bot-top+1); g.fillStyle='#ff6a70'; g.fillRect(X-6, top+1, 3, bot-top-1); g.fillStyle='#e04450'; g.fillRect(X-3, top+1, 2, bot-top-1); g.fillStyle='#8a1a24'; g.fillRect(X+4, top, 3, bot-top+1);
      g.fillStyle='#22202c'; g.fillRect(X-7, top, 15, 5); g.fillRect(X-7, bot-3, 15, 4); g.fillStyle='#3c3a48'; g.fillRect(X-6, top+1, 3, 3);
      g.fillStyle='#f4ede0'; g.fillRect(X-7, top+17, 15, 6); g.fillStyle='#c8c0ac'; g.fillRect(X+4, top+17, 3, 6); pfDraw(g, 'LBC', X-5, top+18, '#c8303c');
      g.fillStyle=INK; for (let k=-1;k<=1;k++){ g.fillRect(X+k*4, top-6, 1, 6); } g.fillStyle='#a8aec0'; g.fillRect(X-1, top-7, 3, 2);
      break; }
    case 'lockers': { // pair of blue steel lockers against the back wall: vents, number tags, handles
      const a=P(f.gx+0.08,f.gy+0.15), b=P(f.gx+0.92,f.gy+0.15); box(f.gx+0.06,f.gy+0.05,0.88,0.42,40,'#4a7ae0','#2f5cc8','#2448a0');
      for (const u of [0.28,0.72]){ const [px,py]=P(f.gx+u,f.gy+0.47,0); const X=Math.round(px), Y=Math.round(py);
        g.fillStyle='#24489e'; for (let k=0;k<4;k++) g.fillRect(X-4, Y-36+k*2, 6, 1);
        g.fillStyle='#f4ede0'; g.fillRect(X-2, Y-26, 4, 3); g.fillStyle=INK; g.fillRect(X-1, Y-25, 2, 1);
        g.fillStyle='#c8ccd8'; g.fillRect(X+2, Y-20, 1, 5); g.fillStyle=INK; g.fillRect(X+3, Y-20, 1, 5); }
      { const p=P(f.gx+0.5,f.gy+0.47,0), q=P(f.gx+0.5,f.gy+0.47,40); linePx(p[0],p[1],q[0],q[1],'#1c3a88'); }
      if (f.b){ const [px,py]=P(f.gx+0.5,f.gy+0.25,40); g.fillStyle=INK; g.fillRect(Math.round(px)-6,Math.round(py)-4,13,5); g.fillStyle='#f4ede0'; g.fillRect(Math.round(px)-5,Math.round(py)-3,11,3); g.fillStyle='#e03a48'; g.fillRect(Math.round(px)-5,Math.round(py)-2,11,1); }
      break; }
    case 'cooler': { // water cooler: white cabinet, upturned blue bottle, two taps
      box(f.gx+0.25,f.gy+0.2,0.5,0.45,22,'#f4f2ee','#d8d4cc','#b8b2a8');
      const [px,py]=P(f.gx+0.5,f.gy+0.42,22); const X=Math.round(px), Y=Math.round(py);
      g.fillStyle=INK; g.fillRect(X-6,Y-17,13,17); g.fillRect(X-4,Y-19,9,2);
      g.fillStyle='#5ab4f0'; g.fillRect(X-5,Y-16,11,15); g.fillStyle='#9ad8ff'; g.fillRect(X-4,Y-15,2,12); g.fillStyle='#3a8ad0'; g.fillRect(X+3,Y-16,2,15); g.fillStyle='#c8ecff'; g.fillRect(X-3,Y-18,7,1);
      const wl=Math.round(Math.sin(t*1.3)); g.fillStyle='#bfe8ff'; g.fillRect(X-4,Y-9+wl,9,1);
      const [tx,ty]=P(f.gx+0.5,f.gy+0.65,14); g.fillStyle=INK; g.fillRect(Math.round(tx)-5,Math.round(ty)-1,4,3); g.fillRect(Math.round(tx)+2,Math.round(ty)-1,4,3); g.fillStyle='#e83850'; g.fillRect(Math.round(tx)-4,Math.round(ty),2,1); g.fillStyle='#3a6ae8'; g.fillRect(Math.round(tx)+3,Math.round(ty),2,1);
      break; }
    case 'weights': { // two-shelf rack of dumbbells
      box(f.gx+0.1,f.gy+0.08,0.8,0.5,2,'#6a6e80','#454858','#2e3040',0,4); box(f.gx+0.1,f.gy+0.08,0.8,0.5,2,'#6a6e80','#454858','#2e3040',0,16);
      for (const [u,v] of [[0.12,0.1],[0.12,0.52],[0.86,0.1],[0.86,0.52]]){ const p=P(f.gx+u,f.gy+v,0), q=P(f.gx+u,f.gy+v,18); g.fillStyle=INK; g.fillRect(Math.round(p[0])-1,Math.round(q[1]),3,Math.round(p[1]-q[1])); g.fillStyle='#8a8ea0'; g.fillRect(Math.round(p[0]),Math.round(q[1]),1,Math.round(p[1]-q[1])); }
      for (const [h,n] of [[6,3],[18,3]]) for (let k=0;k<n;k++){ const [px,py]=P(f.gx+0.25+k*0.25, f.gy+0.32, h+2); const X=Math.round(px), Y=Math.round(py);
        g.fillStyle=INK; g.fillRect(X-5,Y-4,11,6); g.fillStyle='#22202c'; g.fillRect(X-4,Y-3,3,4); g.fillRect(X+2,Y-3,3,4); g.fillStyle='#4a4858'; g.fillRect(X-4,Y-3,1,4); g.fillRect(X+2,Y-3,1,4); g.fillStyle='#c8ccd8'; g.fillRect(X-1,Y-2,3,2); }
      break; }
    case 'ringbell': { // the bell on a post by the ring: rings (and shakes) at the start of every round
      const shake=BXFX.bellT && performance.now()-BXFX.bellT<900 ? (Math.floor(performance.now()/50)%2?1:-1) : 0;
      ellPx(sx,sy,13,5,'rgba(10,8,20,0.35)');
      for (const [u,v] of [[0.22,0.22],[0.78,0.22],[0.22,0.78],[0.78,0.78]]) box(f.gx+u-0.04,f.gy+v-0.04,0.08,0.08,14,'#6a4220','#5a3418','#3a2010');
      box(f.gx+0.16,f.gy+0.16,0.68,0.68,3,'#b47a44','#8a5a30','#6a4220',0,14);
      const [bxp,byp]=P(f.gx+0.5,f.gy+0.45,17); const X=Math.round(bxp)+shake, Y=Math.round(byp)-1; const BW=[2,4,5,6,6,7,7,8];
      g.fillStyle=INK; g.fillRect(X-1,Y-11,3,3);
      BW.forEach((w,j)=>{ g.fillStyle=INK; g.fillRect(X-w-1,Y-9+j,w*2+3,1); }); g.fillStyle=INK; g.fillRect(X-10,Y-1,21,2);
      BW.forEach((w,j)=>{ g.fillStyle='#e8b838'; g.fillRect(X-w,Y-9+j,w*2+1,1); g.fillStyle='#fff0a0'; g.fillRect(X-w+1,Y-9+j,Math.max(1,Math.floor(w*0.45)),1); g.fillStyle='#b88818'; g.fillRect(X+w-1,Y-9+j,2,1); });
      g.fillStyle='#8a6410'; g.fillRect(X-9,Y-1,19,1);
      { const [hx,hy]=P(f.gx+0.62,f.gy+0.72,17); const HX=Math.round(hx), HY=Math.round(hy); g.fillStyle=INK; g.fillRect(HX-6,HY-1,9,3); g.fillRect(HX+2,HY-3,4,5); g.fillStyle='#b07a44'; g.fillRect(HX-5,HY,7,1); g.fillStyle='#c8ccd8'; g.fillRect(HX+3,HY-2,2,3); }
      if (shake){ g.fillStyle='#fff8c0'; for (const [dx,dy] of [[-12,-8],[-13,-4],[12,-8],[13,-4],[-12,-12],[12,-12]]) g.fillRect(X+dx,Y+dy,2,1); }
      break; }
    case 'gbench': { // padded gym bench, two seats long: black leather top with red piping on chrome legs
      for (const u of [0.15,1.75]) for (const v of [0.3,0.7]) box(f.gx+u,f.gy+v-0.04,0.08,0.08,6,'#c8ccd8','#8a8ea0','#5a5e70');
      box(f.gx+0.08,f.gy+0.24,1.84,0.52,2,'#8a8ea0','#5a5e70','#454858',0,5);
      box(f.gx+0.04,f.gy+0.2,1.92,0.6,4,'#2e2c38','#1c1a24','#141218',0,7);
      { const a=P(f.gx+0.1,f.gy+0.8,11), b=P(f.gx+1.92,f.gy+0.8,11); linePx(a[0],a[1],b[0],b[1],'#c8303c'); const c=P(f.gx+0.1,f.gy+0.26,11), d=P(f.gx+1.92,f.gy+0.26,11); linePx(c[0],c[1]+1,d[0],d[1]+1,'#3e3c4a'); }
      break; }
  }
}
// wall signs: the club's name, a live scoreboard over the ring, and two fight posters
const GYMS = { title:null, board:document.createElement('canvas'), boardKey:'', posters:null };
function gymPoster(a, b, col){ const c=document.createElement('canvas'); c.width=26; c.height=36; const x=c.getContext('2d');
  x.fillStyle=INK; x.fillRect(0,0,26,36); x.fillStyle='#f4ede0'; x.fillRect(1,1,24,34); x.fillStyle=col; x.fillRect(2,2,22,15);
  // two llama heads facing off with gloves up
  for (const [hx,fl] of [[6,0],[16,1]]){ x.fillStyle='#1d1530'; x.fillRect(hx,6,4,8); x.fillRect(hx+(fl?-2:2),8,4,3); x.fillRect(hx+(fl?0:1),4,1,2); x.fillRect(hx+(fl?3:2),4,1,2); x.fillStyle=fl?'#3a6ae8':'#e8303c'; x.fillRect(hx+(fl?-3:5),11,3,3); }
  x.fillStyle='#ffd23f'; x.fillRect(12,8,2,2); x.fillRect(11,9,4,1); pfDraw(x,a,3,19,'#1d1530'); pfDraw(x,'VS',8,25,'#e8303c'); pfDraw(x,b,3,30,'#1d1530'); return c; }
function drawGymSigns(t){
  if (!GYMS.title){ const sc=2, txt='BOXING CLUB', tw=pfW(txt,sc), W=tw+18, H=5*sc+20, c=document.createElement('canvas'); c.width=W; c.height=H; const m=c.getContext('2d');
    m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#ffd23f'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#1d2450'; m.fillRect(3,3,W-6,H-6); m.fillStyle='#e03a48'; m.fillRect(3,3,W-6,2); m.fillRect(3,H-5,W-6,2);
    pfDraw(m,'LLAMA',(W-pfW('LLAMA'))>>1,7,'#8ab0ff'); pfDraw(m,txt,10,14,'#7a1020',sc); pfDraw(m,txt,9,13,'#ffffff',sc); GYMS.title=c;
    GYMS.posters=[gymPoster('RUSTY','DUKE','#e03a48'), gymPoster('YOU?','DUKE','#3a6ae8')]; }
  wallPlate(GYMS.title, -112, 54, -1);
  wallPlate(GYMS.posters[0], -30, 46, -1); wallPlate(GYMS.posters[1], 236, 46, 1);
  // scoreboard over the ring: who's fighting and the round, or that the ring is open
  const S=BXS.s, key = S ? `${S.a.n}|${S.b.n}|${S.round}|${S.phase}|${BXS.win||''}|${Math.floor(t*2)%2}` : 'open|'+(Math.floor(t*1.5)%2);
  if (key!==GYMS.boardKey){ GYMS.boardKey=key; const c=GYMS.board, W=96, H=30; c.width=W; c.height=H; const m=c.getContext('2d');
    m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#3a3a48'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#0c0a16'; m.fillRect(3,3,W-6,H-6);
    for (let i=0;i<9;i++){ m.fillStyle=(Math.floor(t*4)+i)%3===0?'#ffd23f':'#7a6420'; m.fillRect(6+i*10,4,2,1); }
    const fit=(s,max)=>{ s=String(s); while (s.length>1 && pfW(s)>max) s=s.slice(0,-1); return s; };
    if (S){ const A=fit(S.a.n,38), B=fit(S.b.n,38); pfDraw(m,A,6,8,'#ff8a90'); pfDraw(m,B,W-6-pfW(B),8,'#8ab0ff'); pfDraw(m,'VS',(W-pfW('VS'))>>1,8,'#ffffff');
      const line = S.phase==='over' ? (BXS.win ? fit(BXS.win+' WINS',84) : 'DRAW') : S.phase==='fight' ? `ROUND ${S.round}` : S.phase==='rest' ? 'BREAK' : 'GET READY'; pfDraw(m,line,(W-pfW(line))>>1,18,'#ffd23f'); }
    else { pfDraw(m,'RING OPEN',(W-pfW('RING OPEN'))>>1,9,(Math.floor(t*1.5)%2)?'#7ce07c':'#3fae4a'); pfDraw(m,'TAP TO BOX',(W-pfW('TAP TO BOX'))>>1,18,'#c8c0e0'); } }
  wallPlate(GYMS.board, 130, 56, 1);
}

// ======================= TREASURE COVE =======================
// a sandy island in the sea (the server has the same shape and solid list); the dock at (0,8) is the way out
const COVE_SOLID_L = ["5,2","17,3","17,10","4,12","10,13","12,2","13,2","14,2","12,3","13,3","14,3","8,6","14,11","7,10","1,6","1,10","2,5"];
const COVE_PALMS = [[5,2],[17,3],[17,10],[4,12],[10,13]], COVE_ROCKS = [[8,6,0],[14,11,1],[7,10,2]], COVE_TORCH = [[1,6],[1,10]];
const coveShape = (gx,gy) => { const dx=Math.max(0,Math.abs(gx-10)-5), dy=Math.max(0,Math.abs(gy-8)-3); return Math.sqrt(dx*dx+dy*dy)-4.2; };   // < 0 on the sand
const coveSandT = (x,y) => x>=0 && y>=0 && x<20 && y<16 && coveShape(x+0.5,y+0.5)<=0;
const coveDigT = (x,y) => coveSandT(x,y) && !COVE_SOLID_L.includes(x+','+y) && !(x<=2 && y>=7 && y<=9);
function buildCoveWorld(){
  clearWorld();
  for (let y=0;y<NY;y++) for (let x=0;x<N;x++) if (!coveSandT(x,y) && !(x===0 && y===8)) block(x,y);
  for (const [x,y] of COVE_PALMS){ FURN.push({t:'palm', gx:x, gy:y, s:(x*7+y*3)%3}); block(x,y); }
  for (const [x,y,k] of COVE_ROCKS){ FURN.push({t:'cvrock', gx:x, gy:y, k}); block(x,y); }
  for (const [x,y] of COVE_TORCH){ FURN.push({t:'torch', gx:x, gy:y}); block(x,y); }
  FURN.push({t:'wreck', gx:12, gy:2, dz:1.2}); for (let x=12;x<=14;x++) for (let y=2;y<=3;y++) block(x,y);
  FURN.push({t:'cvsign', gx:2, gy:5}); block(2,5);
  FURN.push({t:'rowboat', gx:0, gy:9, dz:-0.6});
}
// sky and open sea behind the island (one cached picture per time of day), with gulls drawn live
const CSKY = { key:'', cv:null, W:2000, H:420, X0:1000, Y0:300 };
function buildCoveSky(per){ const W=CSKY.W, H=CSKY.H, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const bands = per==='night' ? ['#0e1638','#141e48','#1a2858','#22346a','#2a407a'] : per==='dusk' ? ['#4a3a8a','#8a4a8a','#d8607a','#f89070','#ffc080'] : ['#4aa8ec','#62b8f2','#7ec8f6','#9cd6fa','#bce4fc'];
  const hz=CSKY.Y0-40, bh=Math.ceil(hz/bands.length);
  for (let i=0;i<bands.length;i++){ x.fillStyle=bands[i]; x.fillRect(0,i*bh,W,bh+1); if (i<bands.length-1){ x.fillStyle=bands[i+1]; for (let yy=i*bh+bh-6; yy<i*bh+bh; yy++) for (let xx=((yy&1)?0:1); xx<W; xx+= (yy-(i*bh+bh-6))<3 ? 4 : 2) x.fillRect(xx,yy,1,1); } }
  // sun or moon low over the water
  if (per==='night'){ pDisc(x, 1340, hz-120, 13, '#f4f0d8'); pDisc(x, 1346, hz-124, 11, bands[1]); const r=rnd(3); x.fillStyle='#f4f0d8'; for (let i=0;i<70;i++) x.fillRect(Math.floor(r()*W), Math.floor(r()*(hz-30)), 1, 1); }
  else { const sx=per==='dusk'?1240:1380, sy=per==='dusk'?hz-26:hz-170, rr=per==='dusk'?26:16; pDisc(x,sx,sy,rr+4, per==='dusk'?'#ffd0a0':'#e8f6ff'); pDisc(x,sx,sy,rr, per==='dusk'?'#ff8a48':'#fff4b0'); if (per!=='dusk'){ pDisc(x,sx-4,sy-4,rr-8,'#fffce0'); } }
  // far islands on the horizon, a tiny palm on one
  const far = per==='night' ? '#1a2a50' : per==='dusk' ? '#6a4a7a' : '#5a9ab8';
  for (const [cx,w,h] of [[310,180,26],[560,90,14],[1610,140,20]]){ x.fillStyle=far; for (let j=0;j<h;j++){ const ww=Math.round(w*Math.sqrt(1-((h-j)/h)**2)); x.fillRect(cx-ww/2|0, hz-j, ww, 1); } }
  x.fillStyle=far; x.fillRect(302,hz-46,3,20); for (const [dx,dy] of [[-8,-3],[-5,-5],[0,-6],[5,-5],[8,-3]]) x.fillRect(303+dx-1,hz-46+dy+3,3,1);
  // the sea: deep blue bands to the bottom, long light streaks and a sun glitter path
  const sea = per==='night' ? ['#16305a','#14284e','#122244'] : per==='dusk' ? ['#5a5a9a','#3a4a88','#2a3a74'] : ['#3a9ccc','#2a88ba','#20709a'];
  x.fillStyle=sea[0]; x.fillRect(0,hz,W,30); x.fillStyle=sea[1]; x.fillRect(0,hz+30,W,60); x.fillStyle=sea[2]; x.fillRect(0,hz+90,W,H-hz-90);
  for (const [y0,col] of [[hz+30,sea[1]],[hz+90,sea[2]]]) for (let yy=y0-8; yy<y0; yy++){ x.fillStyle=col; const st=yy-(y0-8); for (let xx=(yy&1); xx<W; xx+= st<3 ? 4 : st<6 ? 2 : 2) { if (st<6 || ((xx>>1)&1)===0 || true) x.fillRect(xx,yy,1,1); } }
  for (const [y0,col] of [[hz+30,sea[0]],[hz+90,sea[1]]]) for (let yy=y0; yy<y0+4; yy++){ x.fillStyle=col; for (let xx=(yy&1)+((yy-y0)>1?2:0); xx<W; xx+=4) x.fillRect(xx,yy,1,1); }
  x.fillStyle=per==='night'?'#2a4878':'#8ad0ec'; const r2=rnd(11); for (let i=0;i<160;i++){ const yy=hz+2+Math.floor(r2()*r2()*(H-hz-4)), ww=6+Math.floor(r2()*26); x.fillRect(Math.floor(r2()*W), yy, ww, 1); }
  x.fillStyle=per==='night'?'#f4f0d8':per==='dusk'?'#ffc890':'#fffbe0'; const gx0=per==='night'?1340:per==='dusk'?1240:1380; for (let yy=hz+2; yy<hz+70; yy+=3){ const ww=Math.max(2, 22-(yy-hz)/4|0); x.fillRect(gx0-ww/2+((yy*7)%9)-4|0, yy, ww, 1); }
  x.fillStyle=sea[2]; x.fillRect(0,hz,W,1);
  CSKY.cv=c; CSKY.key=per; CSKY.top=bands[0]; CSKY.bot=sea[2]; }
function drawCoveSky(ctx, t){ const per=(typeof period==='string')?period:'day'; if (CSKY.key!==per) buildCoveSky(per);
  const dx=OX-CSKY.X0, dy=OY-CSKY.Y0+10; if (dy>0){ ctx.fillStyle=CSKY.top; ctx.fillRect(0,0,LW,dy+1); } ctx.drawImage(CSKY.cv, dx, dy);
  ctx.fillStyle=CSKY.bot; ctx.fillRect(0, dy+CSKY.H-1, LW, LH);
  // two gulls gliding across
  const now=performance.now()/1000; for (let i=0;i<2;i++){ const span=LW+80, X=Math.round(((i*610+now*(14+i*5))%span)-40), Y=Math.round(dy+CSKY.Y0-170-i*36+Math.sin(now*0.7+i)*6), f=Math.floor(now*4+i)%2;
    ctx.fillStyle=per==='night'?'#c8d0e8':'#f8f8f8'; ctx.fillRect(X,Y,2,1); ctx.fillStyle='#3a3a48'; if (f){ ctx.fillRect(X-4,Y-1,4,1); ctx.fillRect(X+2,Y-1,4,1); ctx.fillRect(X-5,Y-2,1,1); ctx.fillRect(X+6,Y-2,1,1); } else { ctx.fillRect(X-4,Y+1,4,1); ctx.fillRect(X+2,Y+1,4,1); } } }
const COVEFX = { shore:[], glint:[] };
function buildCoveBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY, T=(gx,gy,h=0)=>{ const p=proj(gx,gy); return [ox+p[0], oy+p[1]-h]; };
  const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10, img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
  const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  const C={s1:hx('#f2dca6'),s2:hx('#ead096'),s3:hx('#f8e8bc'),sd:hx('#d6b47a'),rip:hx('#e2c488'),wet:hx('#d2b27a'),wet2:hx('#c4a26a'),foam:hx('#f4fbff'),sh1:hx('#5cd2d8'),sh2:hx('#4cc0d0'),sh3:hx('#9ae8ea'),md:hx('#34a6c4'),dp:hx('#2a8ab4'),dd:hx('#20709a'),shell:hx('#f8b8c8'),shell2:hx('#ffffff'),peb:hx('#a89a88')};
  COVEFX.shore.length=0; COVEFX.glint.length=0;
  for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy, gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
    if (gx<0||gy<0||gx>=N||gy>=NY) continue;
    const d=coveShape(gx,gy), h=dhash(Math.floor(gx*24),Math.floor(gy*24)); let c;
    if (d<-0.42){ c=C.s1; const rp=Math.sin(gx*3.1+gy*1.3+Math.sin(gy*2.2+gx*0.7)*1.4); if (rp>0.93) c=C.rip; else if (rp<-0.96) c=C.s3;
      if (h<0.05) c=C.sd; else if (h<0.07) c=C.s2; else if (h>0.996) c=C.shell; else if (h>0.992) c=C.shell2; else if (h>0.985) c=C.peb; }
    else if (d<-0.1){ c = d<-0.3 ? C.wet : C.wet2; if (h<0.06) c=C.sd; }
    else if (d<0.04){ c=C.foam; if ((px+py)%3===0) COVEFX.shore.push([px+x0-ox, py+y0-oy]); }
    else if (d<1.1){ const k=Math.sin(gx*4.2+gy*2.6)+Math.sin(gx*1.7-gy*3.9); c = d<0.35 ? C.sh3 : (k>1.1 ? C.sh3 : (Math.floor(gx*2+gy*2)%2 ? C.sh1 : C.sh2)); if (d>0.35 && d<0.5 && ((px+py)&1)) c=C.sh1; }
    else if (d<2.2){ c = d<1.25 && ((px+py)&1) ? C.sh2 : C.md; if (Math.sin(gx*5+gy*3)>0.97) c=C.sh1; }
    else { if (d>2.9 || (d>2.5 && ((px+py)&1)) || (d>2.7 && (px&1))) continue; c = d<2.35 && ((px+py)&1) ? C.md : C.dp; }
    if (d>0.3 && h>0.993) COVEFX.glint.push([px+x0-ox, py+y0-oy]);
    const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
  g.putImageData(img,x0,y0);
  // a painted X and a dug-out ring for decoration (not where the treasure is!)
  { const [cx,cy]=T(9.5,9.5); g.fillStyle='#c4864a'; for (let k=-5;k<=5;k++){ g.fillRect(Math.round(cx+k*2),Math.round(cy+k),2,1); g.fillRect(Math.round(cx-k*2),Math.round(cy+k),2,1); } }
  // the dock: planks on posts from the edge of the room onto the sand
  { const P0=(gx,gy,h=0)=>T(gx,gy,h);
    for (const [u,v] of [[-0.6,8.08],[-0.6,8.92],[0.5,8.08],[0.5,8.92]]){ const a=P0(u,v,-6), b=P0(u,v,4); g.fillStyle=INK; g.fillRect(Math.round(a[0])-2,Math.round(b[1]),4,Math.round(a[1]-b[1])+1); g.fillStyle='#6a4220'; g.fillRect(Math.round(a[0])-1,Math.round(b[1]),2,Math.round(a[1]-b[1])); }
    polyPx([P0(-0.9,8.02,4),P0(1.35,8.02,4),P0(1.35,8.98,4),P0(-0.9,8.98,4)],INK);
    for (let k=0;k<9;k++){ const u0=-0.86+k*0.245, u1=u0+0.21; polyPx([P0(u0,8.06,4),P0(u1,8.06,4),P0(u1,8.94,4),P0(u0,8.94,4)], k%2?'#b07a44':'#c48a50'); const a=P0(u0+0.05,8.3,4), b=P0(u0+0.05,8.7,4); linePx(a[0],a[1],b[0],b[1],'#9a6436'); }
    polyPx([P0(-0.9,8.98,4),P0(1.35,8.98,4),P0(1.35,8.98,1),P0(-0.9,8.98,1)],'#7a4c26'); linePx(...P0(-0.9,8.98,1),...P0(1.35,8.98,1),INK); }
}
// live water: foam that breathes along the shore, and glints on the shallows
function drawCoveWater(t){ const ox=OX, oy=OY; const s=COVEFX.shore; g.fillStyle='#ffffff';
  for (let i=0;i<s.length;i++){ const [x,y]=s[i]; const w=Math.sin(t*1.6+x*0.05+y*0.11); if (w>0.35){ g.fillRect(ox+x, oy+y+(w>0.8?1:0), 1, 1); } }
  g.fillStyle='#e8fbff'; const gl=COVEFX.glint; for (let i=0;i<gl.length;i++){ if (((t*0.9+i*0.137)%1)<0.12){ const [x,y]=gl[i]; g.fillRect(ox+x-1,oy+y,3,1); g.fillRect(ox+x,oy+y-1,1,3); } } }
// holes in the sand (from the server, and new ones as they're dug)
const COVEH = new Map();   // "x,y" -> {t, f}
function drawCoveGround(t, noWater){ if (!noWater) drawCoveWater(t); const now=Date.now();
  for (const [k,h] of COVEH){ if (now-h.t>120000){ COVEH.delete(k); continue; } const [x,y]=k.split(',').map(Number); const [sx,sy]=P(x+0.5,y+0.5); const X=Math.round(sx), Y=Math.round(sy), age=(now-h.t)/120000;
    ellPx(X+5,Y-1,6,2,'#e2c488'); ellPx(X+5,Y-2,4,1,'#f2dca6');   // the dug-out sand piled beside it
    ellPx(X,Y,9,4,INK); ellPx(X,Y,8,3,'#b8925a'); ellPx(X,Y+1,6,2,age<0.6?'#7a5a32':'#9a7a4a'); g.fillStyle='#d6b47a'; g.fillRect(X-7,Y-2,4,1);
    if (h.f && now-h.t<6000 && Math.floor(now/180)%2){ g.fillStyle='#fff6a0'; g.fillRect(X-1,Y-6,3,1); g.fillRect(X,Y-7,1,3); } } }
// little crabs wandering the beach (just for fun)
const CRABS = [{x:6.5,y:12.5,a:0},{x:15.5,y:7.5,a:2},{x:11.5,y:4.5,a:4}];
function coveCrabs(dt){ for (const c of CRABS){ c.a+=dt*0.5; const tx=c.x+Math.cos(c.a*1.3)*dt*0.5, ty=c.y+Math.sin(c.a)*dt*0.25; if (coveSandT(Math.floor(tx),Math.floor(ty)) && !COVE_SOLID_L.includes(Math.floor(tx)+','+Math.floor(ty))){ c.x=tx; c.y=ty; } else c.a+=1.6; } return CRABS; }
function drawCovePiece(f, t, sx, sy){
  switch (f.t){
    case 'palm': { // coconut palm: ringed, curving trunk, coconuts, big drooping fronds that sway a little
      ellPx(sx+6,sy+1,18,5,'rgba(110,80,30,0.28)');
      const lean=[8,-7,5][f.s], hgt=[64,58,70][f.s], sway=Math.sin(t*0.8+f.gx)*1.2;
      const pts=[]; for (let k=0;k<=hgt;k+=2){ const u=k/hgt; pts.push([sx+lean*u*u, sy-3-k]); }
      for (const [x,y] of pts){ g.fillStyle=INK; g.fillRect(Math.round(x)-4,Math.round(y)-1,9,3); }
      pts.forEach(([x,y],i)=>{ const X=Math.round(x), Y=Math.round(y); g.fillStyle=(i%3===0)?'#8a5a2a':'#b07a44'; g.fillRect(X-3,Y-1,7,2); g.fillStyle=(i%3===0)?'#6a4220':'#c89058'; g.fillRect(X-3,Y-1,2,2); g.fillStyle='#7a4c26'; g.fillRect(X+2,Y-1,2,2); });
      const [tx,ty]=pts[pts.length-1], TX=Math.round(tx), TY=Math.round(ty);
      for (const [dx,dy] of [[-3,3],[2,4],[-1,6]]){ pDisc(g,TX+dx,TY+dy,3,INK); pDisc(g,TX+dx,TY+dy,2,'#6a4a22'); g.fillStyle='#9a7040'; g.fillRect(TX+dx-1,TY+dy-1,1,1); }
      const fr=[[-1,-0.25,30],[1,-0.25,30],[-1,0.55,26],[1,0.55,26],[-0.35,-1,22],[0.4,-0.9,22],[0,0.9,18]];
      for (const [vx,vy,L] of fr){ const ang=Math.atan2(vy,vx), dir=Math.sign(vx)||1; const seg=[];
        for (let k=0;k<=L;k++){ const u=k/L, droop=u*u*14; seg.push([TX+Math.cos(ang)*k+sway*u, TY+Math.sin(ang)*k*0.6+droop]); }
        for (const [x,y] of seg){ g.fillStyle=INK; g.fillRect(Math.round(x)-1,Math.round(y)-1,3,3); }
        const lw=(i,u)=>Math.max(0,Math.round(6*Math.sin(Math.PI*Math.min(1,u*1.1))) - (i%3===2?2:0));
        seg.forEach(([x,y],i)=>{ const w=lw(i,i/L); for (let j=1;j<=w+1;j++){ g.fillStyle=INK; g.fillRect(Math.round(x)+(j>w?0:0),Math.round(y)+j+(j===w+1?0:0),1,1); g.fillRect(Math.round(x),Math.round(y)-j,1,1); } });
        seg.forEach(([x,y],i)=>{ const w=lw(i,i/L); for (let j=1;j<=w;j++){ g.fillStyle = j===w ? '#2f9a40' : '#4cbc54'; g.fillRect(Math.round(x),Math.round(y)-j,1,1); g.fillStyle = j===w ? '#1a6a2a' : '#2a8a3a'; g.fillRect(Math.round(x),Math.round(y)+j,1,1); } });
        seg.forEach(([x,y])=>{ g.fillStyle='#8ae070'; g.fillRect(Math.round(x),Math.round(y),1,1); }); }
      break; }
    case 'cvrock': { // weathered boulders with a lit top, cracks and a bit of moss
      const S=[[13,8,0,0],[8,6,-10,2],[7,5,9,3]][f.k%3], parts=f.k===1?[[0,0,13,9],[-11,3,8,6],[10,4,7,5]]:f.k===2?[[0,0,10,7],[8,3,6,5]]:[[0,0,12,8],[-9,3,7,5]];
      ellPx(sx,sy+2,18,5,'rgba(90,70,30,0.3)');
      for (const [dx,dy,rx,ry] of parts){ pEll(g,sx+dx,sy-ry+dy,rx+1,ry+1,INK); pEll(g,sx+dx,sy-ry+dy,rx,ry,'#8e8a98'); pEll(g,sx+dx-2,sy-ry+dy-2,rx-3,ry-3,'#aeaab8'); pEll(g,sx+dx-3,sy-ry+dy-3,Math.max(1,rx-7),Math.max(1,ry-6),'#c8c4d0');
        g.fillStyle='#6a6676'; g.fillRect(sx+dx+rx-4,sy-ry+dy,2,ry-1); g.fillRect(sx+dx-1,sy-ry+dy+1,1,3); g.fillStyle='#6aa048'; g.fillRect(sx+dx-rx+2,sy+dy-3,4,1); g.fillRect(sx+dx-rx+3,sy+dy-4,2,1); }
      break; }
    case 'torch': { // tiki torch: bamboo pole, wrapped head, live flame
      ellPx(sx,sy,5,2,'rgba(90,70,30,0.3)');
      g.fillStyle=INK; g.fillRect(sx-2,sy-34,5,34); g.fillStyle='#c8a058'; g.fillRect(sx-1,sy-34,3,34); g.fillStyle='#e8c878'; g.fillRect(sx-1,sy-34,1,34); g.fillStyle='#8a6a30'; for (const k of [8,17,26]) g.fillRect(sx-1,sy-k,3,1);
      g.fillStyle=INK; g.fillRect(sx-4,sy-42,9,9); g.fillStyle='#8a5a2a'; g.fillRect(sx-3,sy-41,7,7); g.fillStyle='#b07a44'; g.fillRect(sx-3,sy-41,7,2); g.fillRect(sx-3,sy-37,7,1);
      { const fl=t*10+f.gy; const H=[9,13,8]; for (let k=0;k<3;k++){ const h=H[k]+Math.round(Math.sin(fl+k*2.1)*2); const x=sx-3+k*3; for (let y=0;y<h;y++){ const w=Math.max(1,Math.round((1-y/h)*2.5)); g.fillStyle = y<h*0.35 ? '#f84818' : y<h*0.7 ? '#f8a020' : '#f8e860'; g.fillRect(x-w+1, sy-43-y, w*2-1, 1); } } }
      if ((typeof period==='string') && period!=='day'){ g.fillStyle='rgba(255,180,80,0.10)'; for (let r=18;r>6;r-=4) g.fillRect(sx-r, sy-48-r/2, r*2, r); }
      break; }
    case 'cvsign': { // wooden sign: TREASURE COVE with an X
      ellPx(sx,sy,8,3,'rgba(90,70,30,0.3)'); g.fillStyle=INK; g.fillRect(sx-2,sy-30,4,30); g.fillStyle='#8a5a2a'; g.fillRect(sx-1,sy-30,2,30);
      const w=pfW('TREASURE')+10, X=sx-(w>>1), Y=sy-44; g.fillStyle=INK; g.fillRect(X-1,Y-1,w+2,22); g.fillStyle='#c48a50'; g.fillRect(X,Y,w,20); g.fillStyle='#a86c3a'; g.fillRect(X,Y+9,w,1); g.fillRect(X,Y+19,w,1); g.fillStyle='#d8a068'; g.fillRect(X,Y,w,1);
      pfDraw(g,'TREASURE',X+5,Y+2,'#3a1c0c'); pfDraw(g,'COVE',X+((w-pfW('COVE'))>>1),Y+12,'#3a1c0c'); g.fillStyle='#d8303c'; for (let k=0;k<5;k++){ g.fillRect(X+w-9+k,Y+11+k,1,1); g.fillRect(X+w-5-k,Y+11+k,1,1); }
      break; }
    case 'rowboat': { // little rowboat tied to the dock, bobbing
      const bob=Math.round(Math.sin(t*1.5)*1.2), [px,py]=P(f.gx+0.35,f.gy+0.55,0), X=Math.round(px), Y=Math.round(py)+bob;
      g.fillStyle='rgba(20,60,90,0.35)'; ellPx(X,Y+3,17,4,'rgba(20,60,90,0.35)');
      g.fillStyle=INK; for (let j=0;j<8;j++){ const w=16-j*1.2|0; g.fillRect(X-w-1,Y-6+j,w*2+3,1); }
      for (let j=0;j<7;j++){ const w=15-j*1.2|0; g.fillStyle=j<2?'#d8303c':j<3?'#f4ede0':'#9a6436'; g.fillRect(X-w,Y-5+j,w*2+1,1); }
      g.fillStyle='#6a4220'; g.fillRect(X-12,Y-6,25,1); g.fillStyle='#c48a50'; g.fillRect(X-3,Y-6,7,2); g.fillStyle=INK; g.fillRect(X-14,Y-8,1,3); g.fillStyle='#e8d8b0'; for (let k=0;k<6;k++) g.fillRect(X-14-k*2,Y-9-k,1,1);
      break; }
    case 'wreck': { // an old wooden boat run aground: curved planked sides rising at bow and stern, an open hull with its ribs showing, a hole stove in the side, a snapped mast and a torn sail
      const S0=[12.1,3.25], B0=[14.95,2.35], len=48;
      const beam=u=>0.62*Math.pow(Math.sin(Math.PI*(0.06+0.88*u)),0.6), sheer=u=>15+11*Math.pow(2*u-1,2)+(u>0.5?3*(u-0.5):0);
      const at=(u,side,h)=>{ const cx=S0[0]+(B0[0]-S0[0])*u, cy=S0[1]+(B0[1]-S0[1])*u, w=beam(u); return P(cx-side*w*0.45, cy+side*w*0.9, h); };
      { const [a1,b1]=at(0.5,0,0); ellPx(a1,b1+4,62,15,'rgba(110,80,30,0.3)'); }
      const N=[], F=[], NB=[]; for (let k=0;k<=len;k++){ const u=k/len; N.push(at(u,1,sheer(u))); F.push(at(u,-1,sheer(u))); NB.push(at(u,1,0)); }
      // outline everything first, then fill inside it
      polyPx([...F, ...N.slice().reverse()], INK); polyPx([...N, ...NB.slice().reverse()], INK);
      for (let k=0;k<=len;k++){ g.fillStyle=INK; g.fillRect(Math.round(F[k][0])-1,Math.round(F[k][1])-1,3,3); g.fillRect(Math.round(N[k][0])-1,Math.round(N[k][1])-1,3,3); }
      // inside of the hull: the far side's inner planks, the dark bilge, ribs curving across
      const FI=[], NI=[]; for (let k=0;k<=len;k++){ const u=k/len; FI.push(at(u,-0.55,sheer(u)*0.45)); NI.push(at(u,0.55,sheer(u)*0.55)); }
      polyPx([...F, ...N.slice().reverse()], '#5a3418');
      polyPx([...F, ...FI.slice().reverse()], '#8a5a30');
      for (let r=1;r<3;r++){ for (let k=0;k<len;k++){ const u=k/len, u2=(k+1)/len, a=at(u,-1+0.15*r,sheer(u)*(1-0.18*r)), b2=at(u2,-1+0.15*r,sheer(u2)*(1-0.18*r)); linePx(a[0],a[1],b2[0],b2[1],'#6a4220'); } }
      polyPx([...FI, ...NI.slice().reverse()], '#3a1e0c');
      for (let k=4;k<len;k+=5){ const u=k/len; const pts=[]; for (let j=0;j<=8;j++){ const sd=-1+j/4; pts.push(at(u, sd, sheer(u)*(0.45+0.55*Math.abs(sd)))); } for (let j=0;j<8;j++){ linePx(pts[j][0],pts[j][1],pts[j+1][0],pts[j+1][1],'#b07a44'); linePx(pts[j][0]+1,pts[j][1],pts[j+1][0]+1,pts[j+1][1],'#7a4c26'); } }
      // near side: curved planks following the sheer, darker and wetter toward the sand
      for (let k=0;k<len;k++){ const u=k/len, u2=(k+1)/len; for (let r=0;r<6;r++){ const f0=r/6, f1=(r+1)/6; polyPx([at(u,1,sheer(u)*f0),at(u2,1,sheer(u2)*f0),at(u2,1,sheer(u2)*f1),at(u,1,sheer(u)*f1)], r<1?'#6a4220':r<2?'#7e4e28':(r%2?'#a06a38':'#b47a44')); } }
      for (let r=1;r<6;r++) for (let k=0;k<len;k++){ const u=k/len, u2=(k+1)/len, a=at(u,1,sheer(u)*r/6), b2=at(u2,1,sheer(u2)*r/6); linePx(a[0],a[1],b2[0],b2[1],'#5a3418'); }
      for (let k=3;k<len;k+=7){ const u=k/len, f=(k*13)%6; const a=at(u,1,sheer(u)*f/6), b2=at(u,1,sheer(u)*(f+1)/6); linePx(a[0],a[1],b2[0],b2[1],'#5a3418'); }
      // gunwale rail along both top edges
      for (let k=0;k<len;k++){ linePx(N[k][0],N[k][1],N[k+1][0],N[k+1][1],'#d8a868'); linePx(N[k][0],N[k][1]+1,N[k+1][0],N[k+1][1]+1,'#8a5a30'); linePx(F[k][0],F[k][1],F[k+1][0],F[k+1][1],'#c8945a'); }
      // a hole stove in the side, some barnacles, sand drifted against the hull
      { const u=0.36, pts=[[-0.05,0.25],[0.02,0.5],[0.07,0.62],[0.1,0.4],[0.08,0.2]].map(([du,f])=>at(u+du,1,sheer(u+du)*f)); polyPx(pts,INK); polyPx(pts.map(([x,y],i)=>[x+(i===0?1:i===3?-1:0),y+(i===2?1:i===4?-1:0)]),'#2a160a'); }
      g.fillStyle='#ece8dc'; for (const [u,f] of [[0.15,0.2],[0.18,0.32],[0.72,0.25],[0.76,0.15],[0.55,0.3]]){ const [x,y]=at(u,1,sheer(u)*f); g.fillRect(Math.round(x),Math.round(y),2,1); }
      for (let k=0;k<=len;k++){ const u=k/len, [x,y]=at(u,1,0), hh=2+((k*7)%3)+(k%9===0?2:0); g.fillStyle='#e8cc94'; g.fillRect(Math.round(x)-1,Math.round(y)-hh,3,hh+1); g.fillStyle='#f4dca8'; g.fillRect(Math.round(x)-1,Math.round(y)-hh,2,1); }
      // stem post at the bow
      { const a=at(1,0,sheer(1)-2), b2=at(1,0,sheer(1)+7); g.fillStyle=INK; g.fillRect(Math.round(a[0])-2,Math.round(b2[1]),5,Math.round(a[1]-b2[1])+1); g.fillStyle='#b47a44'; g.fillRect(Math.round(a[0])-1,Math.round(b2[1])+1,3,Math.round(a[1]-b2[1])-1); g.fillStyle='#d8a868'; g.fillRect(Math.round(a[0])-1,Math.round(b2[1])+1,1,Math.round(a[1]-b2[1])-1); }
      // snapped mast leaning back, a yard and a torn sail flapping
      { const [mx,my]=at(0.52,0,sheer(0.52)*0.5); const MX=Math.round(mx), MY=Math.round(my);
        for (let k=0;k<40;k++){ const X=MX-Math.round(k*0.3), Y=MY-k; g.fillStyle=INK; g.fillRect(X-2,Y,5,1); g.fillStyle=k%9===4?'#6a4220':'#a06a38'; g.fillRect(X-1,Y,2,1); g.fillStyle='#c8945a'; g.fillRect(X-1,Y,1,1); }
        { const X=MX-12, Y=MY-40; g.fillStyle=INK; g.fillRect(X-1,Y-1,6,4); g.fillStyle='#e8d8b0'; g.fillRect(X,Y,4,1); g.fillStyle='#b8a880'; g.fillRect(X,Y+1,4,1); }   // jagged break
        const yx=MX-10, yy=MY-31; g.fillStyle=INK; g.fillRect(yx-12,yy-1,26,3); g.fillStyle='#a06a38'; g.fillRect(yx-11,yy,24,1);
        for (let j=0;j<16;j++){ const torn = (j>9 && j<12) ? 5 : 0, wv=Math.round(Math.sin(t*2.6+j*0.45)*1.2), w=20-Math.floor(j*0.6)-torn; if (w<4) continue; const x0=yx-10+wv+(j>12?4:0); g.fillStyle=INK; g.fillRect(x0-1, yy+2+j, w+2, 1); g.fillStyle=j%4===1?'#ddd2b8':'#f2ead6'; g.fillRect(x0, yy+2+j, w, 1); if (j%5===3){ g.fillStyle='#c8bc9c'; g.fillRect(x0+w-3,yy+2+j,3,1); } }
        g.fillStyle=INK; g.fillRect(yx+9,yy+18,2,2); g.fillRect(yx+6,yy+15,2,1); }
      break; }
    case 'crab': { const s=Math.floor(t*8+f.gx*3)%2; const X=sx, Y=sy-2; g.fillStyle=INK; g.fillRect(X-4,Y-3,9,5); g.fillRect(X-6,Y-5,3,3); g.fillRect(X+4,Y-5,3,3);
      g.fillStyle='#e8503c'; g.fillRect(X-3,Y-2,7,3); g.fillRect(X-5,Y-4,1,1); g.fillRect(X+5,Y-4,1,1); g.fillStyle='#ff8a70'; g.fillRect(X-2,Y-2,3,1); g.fillStyle='#f8f8f8'; g.fillRect(X-2,Y-4,1,1); g.fillRect(X+2,Y-4,1,1); g.fillStyle=INK; g.fillRect(X-2,Y-3,1,1); g.fillRect(X+2,Y-3,1,1);
      g.fillStyle=INK; for (const dx of [-4,-2,2,4]) g.fillRect(X+dx, Y+1+((dx>0)===!!s?1:0), 1, 2); break; }
  }
}
// PIRATE CHEST (furniture you can only dig up): iron-banded wooden chest, lid open on a heap of gold and gems
function drawPirateChest(f, t){ const x=f.gx, y=f.gy; const [sx,sy]=P(x+0.5,y+0.5);
  ellPx(sx,sy+1,16,5,'rgba(24,16,40,0.3)');
  box(x+0.16,y+0.24,0.68,0.52,12,'#e8b838','#8a5a2a','#6a4220');   // body (top is the gold heap)
  for (const u of [0.24,0.5,0.76]){ const a=P(x+0.16+0.68*u,y+0.76,0), b=P(x+0.16+0.68*u,y+0.76,12); linePx(a[0],a[1],b[0],b[1],'#3a3a48'); const c=P(x+0.84,y+0.24+0.52*u,0), d=P(x+0.84,y+0.24+0.52*u,12); linePx(c[0],c[1],d[0],d[1],'#2a2a36'); }
  { const a=P(x+0.16,y+0.76,6), b=P(x+0.84,y+0.76,6); linePx(a[0],a[1],b[0],b[1],'#c8a040'); const [lx,ly]=P(x+0.5,y+0.76,7); g.fillStyle=INK; g.fillRect(Math.round(lx)-2,Math.round(ly)-3,5,5); g.fillStyle='#ffd23f'; g.fillRect(Math.round(lx)-1,Math.round(ly)-2,3,3); g.fillStyle=INK; g.fillRect(Math.round(lx),Math.round(ly)-1,1,2); }
  // the open lid standing up at the back
  { const a=P(x+0.16,y+0.24,12), b=P(x+0.84,y+0.24,12), c=P(x+0.84,y+0.02,22), d=P(x+0.16,y+0.02,22); polyPx([a,b,c,d],INK); const a2=P(x+0.2,y+0.23,13), b2=P(x+0.8,y+0.23,13), c2=P(x+0.8,y+0.04,21), d2=P(x+0.2,y+0.04,21); polyPx([a2,b2,c2,d2],'#7a4c26');
    for (const u of [0.15,0.5,0.85]){ const p=P(x+0.2+0.6*u,y+0.23,13), q=P(x+0.2+0.6*u,y+0.04,21); linePx(p[0],p[1],q[0],q[1],'#3a3a48'); } const p=P(x+0.2,y+0.14,17), q=P(x+0.8,y+0.14,17); linePx(p[0],p[1],q[0],q[1],'#a86c3a'); }
  // gold heap with gems poking out, glinting
  { const [cx,cy]=P(x+0.5,y+0.5,13); for (const [dx,dy,r] of [[0,0,5],[-5,1,3],[5,1,3],[1,-3,3]]){ pDisc(g,Math.round(cx+dx),Math.round(cy+dy),r,'#c88a10'); pDisc(g,Math.round(cx+dx)-1,Math.round(cy+dy)-1,r-1,'#ffd23f'); }
    for (const [dx,dy,c] of [[-3,-1,'#e83850'],[3,-2,'#4aa8ff'],[0,-4,'#48c060']]){ g.fillStyle=INK; g.fillRect(Math.round(cx+dx)-1,Math.round(cy+dy)-1,3,3); g.fillStyle=c; g.fillRect(Math.round(cx+dx),Math.round(cy+dy),1,1); }
    if (Math.floor(t*2+x)%3===0){ g.fillStyle='#fffbe0'; g.fillRect(Math.round(cx)+2,Math.round(cy)-8,1,3); g.fillRect(Math.round(cx)+1,Math.round(cy)-7,3,1); } }

}


// ======================= JUNGLE TEMPLE =======================
// a clearing in the jungle (20 x 16) with thick undergrowth all round; the path in at (0,8) is the way out. The server has the same lists.
const JUNGLE_SOLID_L = new Set(["9,2","6,13","3,11","15,12","10,5","7,9","8,9","13,7","1,7","12,3","8,13","2,5","6,5"]);
for (let x=2;x<=6;x++) for (let y=1;y<=4;y++) JUNGLE_SOLID_L.add(x+','+y);
const jWater = (x,y) => (x>=14 && y>=1 && y<=4) || (x>=17 && y>=5);
const jFloor = (x,y) => (x===0 && y===8) || (x>=1 && x<=18 && y>=1 && y<=14 && !jWater(x,y));
const jDigT = (x,y) => jFloor(x,y) && x>=1 && !JUNGLE_SOLID_L.has(x+','+y) && !(x<=2 && y>=7 && y<=9);
const huntDigT = (x,y) => curRoom==='jungle' ? jDigT(x,y) : coveDigT(x,y);
const isHunt = r => r==='cove' || r==='jungle';
function buildJungleWorld(){
  clearWorld();
  for (let y=0;y<NY;y++) for (let x=0;x<N;x++) if (!jFloor(x,y)) block(x,y);
  FURN.push({t:'temple', gx:2, gy:1, dz:-1}); for (let x=2;x<=6;x++) for (let y=1;y<=4;y++) block(x,y);
  for (const [x,y] of [[2,5],[6,5]]){ FURN.push({t:'brazier', gx:x, gy:y}); block(x,y); }
  for (const [x,y,v] of [[9,2,0],[6,13,1],[3,11,2],[15,12,1]]){ FURN.push({t:'jtree', gx:x, gy:y, v}); block(x,y); }
  FURN.push({t:'idol', gx:10, gy:5}); block(10,5);
  FURN.push({t:'jpillar', gx:7, gy:9, dz:0.6}); block(7,9); block(8,9);
  FURN.push({t:'jcolumn', gx:13, gy:7}); block(13,7);
  FURN.push({t:'jsign', gx:1, gy:7}); block(1,7);
  for (const [x,y,v] of [[12,3,0],[8,13,1]]){ FURN.push({t:'jbush', gx:x, gy:y, v}); block(x,y); }
}
// the path: cobbles from the way in up to the temple stairs, with a branch to the idol
const JPATH = [[[0,8.5],[3.2,8.5],[4.5,6.6],[4.5,5.2]], [[3.2,8.5],[7.5,7.2],[10.5,6.4]]];
function segDist(px,py,ax,ay,bx,by){ const dx=bx-ax, dy=by-ay, l=dx*dx+dy*dy, u=Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/l)); return Math.hypot(px-ax-u*dx, py-ay-u*dy); }
const jPathD = (gx,gy) => { let d=9; for (const L of JPATH) for (let i=0;i<L.length-1;i++) d=Math.min(d, segDist(gx,gy,L[i][0],L[i][1],L[i+1][0],L[i+1][1])); return d; };
// backdrop: misty sky, three layers of canopy, tall trunks, sun rays and hanging vines (cached per time of day)
const JSKY = { key:'', cv:null, W:2000, H:440, X0:1000, Y0:320 };
function buildJungleSky(per){ const W=JSKY.W, H=JSKY.H, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d');
  const sky = per==='night' ? ['#0c1a24','#12242e','#183038'] : per==='dusk' ? ['#f0a070','#e8c088','#c8d098'] : ['#d8f0c8','#c4e8b4','#b0dca0'];
  for (let i=0;i<3;i++){ x.fillStyle=sky[i]; x.fillRect(0,i*60,W,61); if (i<2){ x.fillStyle=sky[i+1]; for (let yy=i*60+52; yy<i*60+60; yy++) for (let xx=(yy&1); xx<W; xx+= (yy-(i*60+52))<4 ? 4 : 2) x.fillRect(xx,yy,1,1); } }
  x.fillStyle=sky[2]; x.fillRect(0,180,W,H-180);
  if (per==='night'){ const r=rnd(5); x.fillStyle='#e8f0d8'; for (let i=0;i<60;i++) x.fillRect(Math.floor(r()*W), Math.floor(r()*150), 1, 1); pDisc(x,1450,70,10,'#f0f0d8'); }
  const layers = per==='night' ? [['#1a3a30',150],['#143028',190],['#0e241e',240]] : per==='dusk' ? [['#8aa070',150],['#5a7a48',190],['#3a5a30',240]] : [['#8cc488',150],['#5a9a54',190],['#3a7a3a',240]];
  layers.forEach(([col,base],li)=>{ const r=rnd(20+li*7); x.fillStyle=col;
    // round tree crowns along the line, then fill below
    for (let cx=-40; cx<W+40; cx+=26+Math.floor(r()*30)){ const rr=24+Math.floor(r()*26)-li*3, cy=base-Math.floor(r()*30); pDisc(x,cx,cy,rr,col); }
    x.fillRect(0,base,W,H-base);
    // trunks of the nearer layers
    if (li>0){ const tr=rnd(40+li); for (let k=0;k<14;k++){ const tx=Math.floor(tr()*W), tw=4+li*3; x.fillStyle=li===1?(per==='night'?'#0e2018':'#3a5a30'):(per==='night'?'#0a1812':'#2a4422'); x.fillRect(tx, base-10, tw, H-base+10); } }
    // light leaf edges
    const hi = per==='night' ? '#24483a' : li===0 ? '#a8d8a0' : li===1 ? '#78b868' : '#58985a'; x.fillStyle=hi; const r2=rnd(60+li); for (let i=0;i<220;i++){ const xx=Math.floor(r2()*W), yy=base-60+Math.floor(r2()*70); x.fillRect(xx,yy,2,1); } });
  // sun rays slanting down through the canopy (a sparse dither of pale light)
  if (per!=='night'){ for (const [rx,rw] of [[380,46],[820,30],[1260,56],[1640,36]]) for (let yy=60; yy<H; yy++){ const fade=Math.max(0,1-(yy-60)/(H-60)); x.fillStyle = per==='dusk' ? `rgba(255,210,150,${(0.16*fade).toFixed(3)})` : `rgba(255,250,210,${(0.18*fade).toFixed(3)})`; x.fillRect(rx+Math.floor((yy-60)*0.55), yy, rw, 1); } }
  // vines hanging from the top
  const vr=rnd(77); for (let i=0;i<34;i++){ const vx=Math.floor(vr()*W), len=60+Math.floor(vr()*140); for (let yy=0; yy<len; yy++){ const wob=Math.round(Math.sin(yy*0.08+i)*2); x.fillStyle=per==='night'?'#1a3a24':'#2f6a2e'; x.fillRect(vx+wob,yy,2,1); if (yy%9===0){ x.fillStyle=per==='night'?'#24502e':'#4caa48'; x.fillRect(vx+wob+(yy%18?2:-3),yy,3,2); } } }
  JSKY.cv=c; JSKY.key=per; JSKY.top=sky[0]; JSKY.bot=layers[2][0]; }
function drawJungleSky(ctx, t){ const per=(typeof period==='string')?period:'day'; if (JSKY.key!==per) buildJungleSky(per);
  const dx=OX-JSKY.X0, dy=OY-JSKY.Y0+20; if (dy>0){ ctx.fillStyle=JSKY.top; ctx.fillRect(0,0,LW,dy+1); } ctx.drawImage(JSKY.cv, dx, dy); ctx.fillStyle=JSKY.bot; ctx.fillRect(0, dy+JSKY.H-1, LW, LH);
  // two parrots flying across, wings flapping
  const now=performance.now()/1000; for (let i=0;i<2;i++){ const span=LW+120, X=Math.round(((i*700+now*(22+i*7))%span)-60), Y=Math.round(dy+JSKY.Y0-200-i*40+Math.sin(now*1.3+i)*5), f=Math.floor(now*6+i)%2, cA=i?'#3a8ae8':'#e83a3a', cB=i?'#ffd23f':'#3a8ae8';
    ctx.fillStyle=INK; ctx.fillRect(X-4,Y-2,9,4); ctx.fillStyle=cA; ctx.fillRect(X-3,Y-1,7,2); ctx.fillStyle='#ffd23f'; ctx.fillRect(X+4,Y-1,2,1); ctx.fillStyle=cB; ctx.fillRect(X-6,Y,3,1); ctx.fillStyle=cA; if (f){ ctx.fillRect(X-1,Y-5,3,3); } else { ctx.fillRect(X-1,Y+1,3,3); } } }
const JFX = { water:[], fall:[] };
function buildJungleBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY, T=(gx,gy,h=0)=>{ const p=proj(gx,gy); return [ox+p[0], oy+p[1]-h]; };
  // the cliff behind the pool: a jagged rock face with ledges and cracks, ferns along the top, and the waterfall pouring out of a notch
  { const X0=Math.round(14*20)-1, X1=N*20, topH=x=>72+Math.round(Math.sin(x*0.21)*5+Math.sin(x*0.07)*7)+((x%13)<3?4:0);
    for (let x=X0; x<X1; x++){ const base=Math.floor(x/2), th=topH(x);
      for (let hh=0; hh<=th; hh++){ const n=dhash(Math.floor(x/6), Math.floor((hh+(x%6))/5)), ledge=(hh%17)<2; let c = n<0.3 ? '#6e6c5e' : n<0.65 ? '#7e7c6c' : '#908e7c'; if (ledge) c='#5a584c'; if ((hh+3)%17===0) c='#a4a290';
        if (((x*7+hh*3)%37)===0) c='#4a4840'; if (hh<6) c='#4a5a3a'; if (hh>th-6) c = n<0.5 ? '#3e7a2c' : '#4c9a3a'; g.fillStyle=c; g.fillRect(ox+x, oy+base-hh, 1, 1); }
      g.fillStyle=INK; g.fillRect(ox+x, oy+base-th-1, 1, 1);
      if (x%5===0){ g.fillStyle='#2e6a2c'; for (let k=0;k<4;k++) g.fillRect(ox+x+(k%2), oy+base-th-2-k, 1, 1); g.fillStyle='#5ea044'; g.fillRect(ox+x+1, oy+base-th-5, 2, 1); } }
    // the falling water: a sheet with ragged edges and darker streaks (animated streaks are drawn on top each frame)
    const fx0=304, fx1=342; for (let x=fx0; x<fx1; x++){ const base=Math.floor(x/2), th=topH(x)-2, edge=Math.min(x-fx0, fx1-1-x);
      for (let hh=3; hh<=th; hh++){ if (edge<2 && ((hh+x)%4)===0) continue; g.fillStyle = edge===0 ? '#9ad8e8' : ((x*5+hh)%9<2 ? '#7ac4d8' : ((x+hh*3)%7===0 ? '#ffffff' : '#c4ecf6')); g.fillRect(ox+x, oy+base-hh, 1, 1); }
      if (x>fx0+1 && x<fx1-2) JFX.fall.push([x, base]); }
    for (let x=fx0-3; x<fx1+3; x++){ const base=Math.floor(x/2), th=topH(x); g.fillStyle='#5a584c'; g.fillRect(ox+x, oy+base-th, 1, 2); } }
  // jungle hedge along the other back edges: big leafy clumps, darker at the bottom
  const CL=[]; const leafy=(cx,cy,r,dark)=>CL.push([cx,cy,r,dark]);
  const flushLeafy=()=>{ for (const [cx,cy,r] of CL) pDisc(g,cx,cy,r+1,INK); for (const [cx,cy,r,d] of CL) pDisc(g,cx,cy,r,d?'#24502a':'#2e6430'); for (const [cx,cy,r,d] of CL) pDisc(g,cx-1,cy-2,r-2,d?'#2e6430':'#3a7a34');
    for (const [cx,cy,r] of CL) pDisc(g,cx-2,cy-4,Math.max(2,r-5),'#4c9a42'); const rr=rnd(99); g.fillStyle='#78c860'; for (const [cx,cy,r] of CL) for (let k=0;k<3;k++) g.fillRect(cx-r+2+Math.floor(rr()*(2*r-4)), cy-r+2+Math.floor(rr()*r), 2, 1);
    g.fillStyle='#1a3a1c'; for (const [cx,cy,r] of CL) for (let k=0;k<2;k++) g.fillRect(cx-r+3+Math.floor(rr()*(2*r-6)), cy+Math.floor(rr()*(r-2)), 2, 1); CL.length=0; };
  { const r=rnd(19); for (let gx=0; gx<14; gx+=0.55){ const [x,y]=T(gx,0); leafy(Math.round(x), Math.round(y)-14-Math.floor(r()*14), 9+Math.floor(r()*6), r()<0.5); }
    for (let gy=0; gy<NY; gy+=0.55){ if (gy>7.3 && gy<9.4) continue; const [x,y]=T(0,gy); leafy(Math.round(x), Math.round(y)-14-Math.floor(r()*14), 9+Math.floor(r()*6), r()<0.5); } flushLeafy(); }
  // ground: dark loam, leaf litter, moss, cobbled paths, the pool and stream
  { const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10, img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
    const hx=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    const C={s1:hx('#5e4a2c'),s2:hx('#6a5432'),s3:hx('#523e24'),lf1:hx('#8a6a30'),lf2:hx('#a87a34'),lf3:hx('#c8843a'),lg:hx('#4a7a2a'),m1:hx('#3e6a2a'),m2:hx('#4c7e32'),m3:hx('#5e9238'),
      cb1:hx('#9a9a84'),cb2:hx('#8a8c76'),cb3:hx('#aaa894'),mort:hx('#3e3020'),cbm:hx('#5e7a40'),w1:hx('#2a7a70'),w2:hx('#348a7c'),w3:hx('#5aaa98'),wd:hx('#1e5e58'),rk:hx('#7a7a6a'),rk2:hx('#5a5a4c'),ug:hx('#24461e'),ug2:hx('#2e5626')};
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy, gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue;
      const tx=Math.floor(gx), ty=Math.floor(gy), h=dhash(Math.floor(gx*22),Math.floor(gy*22)); let c;
      const inW = jWater(tx,ty), edge = !inW && !jFloor(tx,ty);
      if (inW){ const k=Math.sin(gx*2.3+gy*4.1)+Math.sin(gx*5.1-gy*1.7); c = k>1.3 ? C.w3 : k>0.2 ? C.w2 : C.w1; if (gy<1.3 || (gx>=17 && gx<17.12)) c=C.wd;
        // mossy stones round the water's edge
        const ex = Math.min(gx-14<0?9:gx-14, gy-1<0?9:gy-1, 4.99-gy<0?9:(gx<17?4.99-gy:9), gx>=17 ? gx-17 : 9); if (ex<0.16){ c = h<0.5 ? C.rk : C.rk2; if (h<0.15) c=C.m2; }
        if (h>0.995) JFX.water.push([wx,wy]); }
      else if (edge){ c = h<0.5 ? C.ug : C.ug2; if (h>0.97) c=C.m1; }
      else { const pd=jPathD(gx,gy);
        if (pd<0.42){ const sx=gx*2.4+Math.sin(gy*3)*0.3, sy=gy*2.4+Math.sin(gx*3)*0.3, fx=sx-Math.floor(sx), fy=sy-Math.floor(sy), sh=dhash(Math.floor(sx),Math.floor(sy));
          c = (fx<0.12||fy<0.12) ? C.mort : sh<0.33 ? C.cb1 : sh<0.66 ? C.cb2 : C.cb3; if (!(fx<0.12||fy<0.12) && (fx<0.22 || fy<0.22)) c = sh<0.5 ? C.cb3 : C.cb1; if (pd>0.34 && h<0.5) c=C.cbm; if (h<0.04 && c!==C.mort) c=C.cbm; }
        else { const moss=Math.sin(gx*0.9+Math.sin(gy*1.3)*2)+Math.sin(gy*1.1-gx*0.4); c = (tx+ty)%2 ? C.s1 : C.s2; if (h<0.06) c=C.s3;
          if (moss>1.05){ c = h<0.3 ? C.m1 : h<0.7 ? C.m2 : C.m3; } else if (h>0.94) c=C.lf1; else if (h>0.91) c=C.lf2; else if (h>0.9) c=C.lf3; else if (h>0.88) c=C.lg; } }
      const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
    g.putImageData(img,x0,y0); }
  // low undergrowth on the front edges (kept short so llamas behind it still show)
  { const r=rnd(23); for (let gx=0.2; gx<N; gx+=0.38){ if (jWater(Math.floor(gx),NY-2)) continue; const [x,y]=T(gx,NY-0.45); leafy(Math.round(x), Math.round(y)-4-Math.floor(r()*3), 8+Math.floor(r()*3), r()<0.4); }
    for (let gy=0.3; gy<NY; gy+=0.6){ const [x,y]=T(N-0.4,gy); if (gy>4.5) continue; leafy(Math.round(x), Math.round(y)-3-Math.floor(r()*3), 6+Math.floor(r()*3), r()<0.4); } flushLeafy(); }
  // ferns and flowers dotted about the ground
  { const r=rnd(31); for (let i=0;i<46;i++){ const gx=1+r()*17, gy=1+r()*13; const tx=Math.floor(gx), ty=Math.floor(gy); if (!jFloor(tx,ty) || jPathD(gx,gy)<0.6 || JUNGLE_SOLID_L.has(tx+','+ty)) continue; const [x,y]=T(gx,gy); const X=Math.round(x), Y=Math.round(y);
      if (i%3===0){ g.fillStyle=['#ff6ea0','#ffd23f','#f8f8f8','#c87af0'][i%4]; g.fillRect(X,Y-2,2,2); g.fillStyle='#3e6a2a'; g.fillRect(X,Y,1,2); }
      else { g.fillStyle='#2e5a26'; for (const [a,b] of [[-3,-2],[-2,-3],[0,-4],[2,-3],[3,-2]]) g.fillRect(X+a,Y+b,1,Math.abs(b)); g.fillStyle='#5ea044'; g.fillRect(X-2,Y-3,1,2); g.fillRect(X+2,Y-3,1,2); g.fillRect(X,Y-4,1,3); } } }
}
// live water: the falling sheet, foam where it lands, ripples and the stream running away
function drawJungleWater(t){ const ox=OX, oy=OY, f=JFX.fall;
  for (let i=0;i<f.length;i++){ const [x,base]=f[i]; for (let k=0;k<3;k++){ const hh=68-(((t*70)+(x*13)%66+k*22)%66); g.fillStyle=(k%2)?'#ffffff':'#e8f8fc'; g.fillRect(ox+x, oy+base-Math.round(hh), 1, 4); } }
  { const [cx,cy]=P(16.2,1.3); for (let k=0;k<14;k++){ const a=t*3+k*0.9, r=4+((t*8+k*3)%10); g.fillStyle=(k%2)?'#ffffff':'#c8eef4'; g.fillRect(Math.round(cx+Math.cos(a)*r*1.6), Math.round(cy+Math.sin(a)*r*0.5), 2, 1); } }
  g.fillStyle='#bfe8e0'; const w=JFX.water; for (let i=0;i<w.length;i++){ const [x,y]=w[i]; const ph=(t*0.7+i*0.31)%1; if (ph<0.4){ const r=Math.round(ph*8); g.fillRect(ox+x-r,oy+y,1,1); g.fillRect(ox+x+r,oy+y,1,1); } }
  for (let k=0;k<12;k++){ const u=((t*0.25+k/12)%1), gy=5+u*10, gx=17.3+((k*0.37)%1.4); const [x,y]=P(gx,gy); g.fillStyle='#8acabc'; g.fillRect(Math.round(x),Math.round(y),3,1); } }
const BUTTERFLIES=[{x:8,y:11,a:0,c:'#ffd23f'},{x:13,y:5,a:2,c:'#5ab0ff'},{x:5,y:8,a:4,c:'#ff6ea0'}];
function drawJungleGround(t){ drawJungleWater(t); drawCoveGround(t, true); }
function drawJungleAir(t){ const now=performance.now()/1000;
  for (const b of BUTTERFLIES){ b.a+=0.012; const gx=b.x+Math.sin(b.a*1.3)*1.6, gy=b.y+Math.cos(b.a)*1.2; const [x,y]=P(gx,gy,22+Math.sin(b.a*3)*6); const X=Math.round(x), Y=Math.round(y), f=Math.floor(now*10+b.x)%2;
    g.fillStyle=INK; g.fillRect(X,Y-1,1,3); g.fillStyle=b.c; if (f){ g.fillRect(X-3,Y-2,3,2); g.fillRect(X+1,Y-2,3,2); g.fillRect(X-2,Y,2,1); g.fillRect(X+1,Y,2,1); } else { g.fillRect(X-1,Y-3,1,3); g.fillRect(X+1,Y-3,1,3); } }
  if ((typeof period==='string') && period==='night'){ for (let k=0;k<14;k++){ const gx=2+((k*5.3)%15)+Math.sin(now*0.5+k)*0.6, gy=2+((k*3.7)%12)+Math.cos(now*0.4+k)*0.6; const [x,y]=P(gx,gy,12+((k*7)%20)); if (Math.sin(now*2+k*1.7)>0.2){ g.fillStyle='#e8ff80'; g.fillRect(Math.round(x),Math.round(y),1,1); g.fillStyle='rgba(232,255,128,0.25)'; g.fillRect(Math.round(x)-1,Math.round(y)-1,3,3); } } } }
function drawJunglePiece(f, t, sx, sy){
  switch (f.t){
    case 'temple': { // a stepped stone temple: four tiers of mossy blocks, a staircase up the front, a shrine on top with a carved doorway, vines, and a toucan
      const X0=2, Y0=1, Wd=5, Dp=4, TH=14, ST=['#a8aa92','#8a8c78','#6e705e'], top=c=>c;
      for (let k=0;k<4;k++){ const ins=k*0.42; box(X0+ins, Y0+ins, Wd-2*ins, Dp-2*ins, TH, ST[0], ST[1], ST[2], 0, k*TH);
        // block joints on both visible faces
        const fy=Y0+Dp-ins, fx=X0+Wd-ins, h0=k*TH;
        { const a=P(X0+ins,fy,h0+7), b=P(fx,fy,h0+7); linePx(a[0],a[1],b[0],b[1],'#6e705e'); const c=P(fx,Y0+ins,h0+7), d=P(fx,fy,h0+7); linePx(c[0],c[1],d[0],d[1],'#55574a'); }
        for (let u=X0+ins+0.35+(k%2)*0.2; u<fx-0.1; u+=0.55){ const a=P(u,fy,h0+(((u*10)|0)%2?7:0)), b=P(u,fy,h0+(((u*10)|0)%2?14:7)); linePx(a[0],a[1],b[0],b[1],'#6e705e'); }
        for (let v=Y0+ins+0.3+(k%2)*0.25; v<fy-0.1; v+=0.55){ const a=P(fx,v,h0+(((v*10)|0)%2?7:0)), b=P(fx,v,h0+(((v*10)|0)%2?14:7)); linePx(a[0],a[1],b[0],b[1],'#4a4c40'); }
        // moss along the top edge of each tier
        for (let u=X0+ins; u<fx; u+=0.08){ if (dhash(Math.floor(u*20),k)>0.45){ const [mx,my]=P(u,fy,h0+TH); g.fillStyle=dhash(Math.floor(u*20),k+9)>0.5?'#4c8a34':'#3e7a2c'; g.fillRect(Math.round(mx),Math.round(my),2,1+((u*30|0)%3===0?1:0)); } }
        for (let v=Y0+ins; v<fy; v+=0.09){ if (dhash(Math.floor(v*20),k+3)>0.5){ const [mx,my]=P(fx,v,h0+TH); g.fillStyle='#3e7a2c'; g.fillRect(Math.round(mx)-1,Math.round(my),2,1); } } }
      // staircase up the middle of the front face
      { const sx0=X0+1.95, sx1=X0+3.05, n=16; for (let k=n-1;k>=0;k--){ const v0=Y0+Dp-(k/n)*(3*0.42+0.12), h=(k/n)*4*TH; box(sx0, v0-0.08, sx1-sx0, 0.12, 3.5, '#c4c6ae', '#9a9c86', '#7a7c68', 0, h); } }
      { for (const sxe of [X0+1.85, X0+3.05]){ const a=P(sxe,Y0+Dp,0), b=P(sxe,Y0+Dp-1.38,4*TH); linePx(a[0],a[1],b[0],b[1],INK); linePx(a[0]+1,a[1],b[0]+1,b[1],'#55574a'); } }
      // shrine on top: a block with a dark carved doorway and a heavy lintel
      { const s0=X0+1.55, s1=Y0+1.45, sw=1.9, sd=1.1, h=4*TH; box(s0,s1,sw,sd,22,'#b4b69e','#94967f','#74766a',0,h); box(s0-0.1,s1-0.1,sw+0.2,sd+0.2,5,'#c4c6ae','#9a9c86','#7a7c68',0,h+22);
        const a=P(s0+0.6,s1+sd,h), b=P(s0+1.3,s1+sd,h), c=P(s0+1.3,s1+sd,h+15), d=P(s0+0.6,s1+sd,h+15); polyPx([a,b,c,d],INK); polyPx([P(s0+0.66,s1+sd,h),P(s0+1.24,s1+sd,h),P(s0+1.24,s1+sd,h+14),P(s0+0.66,s1+sd,h+14)],'#1a120c');
        const glow=(Math.sin(t*2)+1)/2; g.fillStyle=glow>0.5?'#ff5a3a':'#c83a28'; const [ex,ey]=P(s0+0.95,s1+sd,h+10); g.fillRect(Math.round(ex)-3,Math.round(ey),2,1); g.fillRect(Math.round(ex)+2,Math.round(ey)+1,2,1);
        // carved llama head above the door
        const [hx,hy]=P(s0+0.95,s1+sd,h+19); const HX=Math.round(hx), HY=Math.round(hy); g.fillStyle='#74766a'; g.fillRect(HX-3,HY-2,7,4); g.fillRect(HX-3,HY-5,2,3); g.fillRect(HX+2,HY-5,2,3); g.fillStyle='#55574a'; g.fillRect(HX-1,HY,1,1); g.fillRect(HX+1,HY,1,1);
        // toucan on the corner of the roof, blinking
        const [tx,ty]=P(s0+sw,s1+0.1,h+27); const TX=Math.round(tx), TY=Math.round(ty); g.fillStyle=INK; g.fillRect(TX-3,TY-8,6,8); g.fillRect(TX+2,TY-7,7,3); g.fillStyle='#1d1530'; g.fillRect(TX-2,TY-7,4,6); g.fillStyle='#ffffff'; g.fillRect(TX-1,TY-5,3,2); g.fillStyle='#ff9a24'; g.fillRect(TX+3,TY-6,5,1); g.fillStyle='#ffd23f'; g.fillRect(TX+3,TY-5,4,1); g.fillStyle='#e83850'; g.fillRect(TX+7,TY-6,1,1);
        if (Math.floor(t*0.7)%5!==0){ g.fillStyle=INK; g.fillRect(TX,TY-6,1,1); } g.fillStyle='#ffd23f'; g.fillRect(TX-1,TY,1,2); g.fillRect(TX+1,TY,1,2); }
      // vines draped down the tiers
      for (const [u,len] of [[X0+0.3,30],[X0+4.4,38],[X0+1.2,20]]){ const [vx,vy]=P(u,Y0+Dp-0.3,3*TH+12); for (let k=0;k<len;k++){ const X=Math.round(vx+Math.sin(k*0.25)*1.5), Y=Math.round(vy+k); g.fillStyle='#2e6a2c'; g.fillRect(X,Y,1,1); if (k%5===2){ g.fillStyle='#4caa48'; g.fillRect(X+(k%10?1:-2),Y,2,2); } } }
      for (const [v,len] of [[Y0+0.6,26],[Y0+2.6,34]]){ const [vx,vy]=P(X0+Wd-0.3,v,3*TH+12); for (let k=0;k<len;k++){ const X=Math.round(vx+Math.sin(k*0.3)*1.2), Y=Math.round(vy+k); g.fillStyle='#2e6a2c'; g.fillRect(X,Y,1,1); if (k%5===1){ g.fillStyle='#4caa48'; g.fillRect(X+(k%10?1:-2),Y,2,2); } } }
      break; }
    case 'brazier': { // stone brazier on a pedestal, burning
      ellPx(sx,sy+1,8,3,'rgba(20,12,4,0.35)'); box(f.gx+0.32,f.gy+0.32,0.36,0.36,14,'#a8aa92','#8a8c78','#6e705e');
      const [bx,by]=P(f.gx+0.5,f.gy+0.5,14); const X=Math.round(bx), Y=Math.round(by); g.fillStyle=INK; g.fillRect(X-9,Y-5,19,7); g.fillStyle='#8a8c78'; g.fillRect(X-8,Y-4,17,5); g.fillStyle='#b4b69e'; g.fillRect(X-8,Y-4,17,1); g.fillStyle='#3a2a1a'; g.fillRect(X-6,Y-4,13,2);
      const fl=t*9+f.gx; const H=[11,15,10]; for (let k=0;k<3;k++){ const h=H[k]+Math.round(Math.sin(fl+k*2.1)*3); const x=X-5+k*4; for (let y=0;y<h;y++){ const w=Math.max(1,Math.round((1-y/h)*3)); g.fillStyle = y<h*0.35 ? '#f84818' : y<h*0.7 ? '#f8a020' : '#f8e860'; g.fillRect(x-w+1, Y-5-y, w*2-1, 1); } }
      if ((typeof period==='string') && period!=='day'){ g.fillStyle='rgba(255,170,70,0.09)'; for (let r=20;r>6;r-=4) g.fillRect(X-r, Y-14-r/2, r*2, r); }
      break; }
    case 'jtree': { // giant jungle tree: buttress roots, ridged bark, a huge layered crown, vines hanging down
      const v=f.v||0, hgt=[78,70,86][v], lean=[2,-3,1][v];
      ellPx(sx+4,sy+2,30,9,'rgba(10,24,8,0.35)');
      for (const [dx,dy,len] of [[-1,0,10],[1,0,9],[0,1,7]]){ for (let k=0;k<len;k++){ const X=sx+Math.round(dx*(4+k*0.9)), Y=sy-1+Math.round(dy*k*0.4)-Math.round((len-k)*0.6); g.fillStyle=INK; g.fillRect(X-1,Y-1,3,4); g.fillStyle='#6a4a2a'; g.fillRect(X,Y,1,2); } }
      for (let k=0;k<hgt;k++){ const u=k/hgt, X=sx+Math.round(lean*u*u), Y=sy-2-k, w=Math.round(6-u*2); g.fillStyle=INK; g.fillRect(X-w-1,Y,2*w+3,1); for (let i=-w;i<=w;i++){ g.fillStyle = i<-w+2 ? '#9a7048' : (i>w-3 ? '#4a321a' : (((i+k*0.3)|0)%3===0 ? '#5a3c20' : '#7a5632')); g.fillRect(X+i,Y,1,1); } }
      const [cx,cy]=[sx+lean, sy-hgt]; const blobs=[[0,-8,18],[-16,0,14],[16,-2,15],[-8,-18,13],[10,-18,13],[0,6,12],[-24,8,9],[24,6,10],[0,-26,10]];
      for (const [dx,dy,r] of blobs) pDisc(g,cx+dx,cy+dy,r+1,INK);
      for (const [dx,dy,r] of blobs) pDisc(g,cx+dx,cy+dy,r,'#2a6a28');
      for (const [dx,dy,r] of blobs) pDisc(g,cx+dx-2,cy+dy-3,r-4,'#3e8a34');
      for (const [dx,dy,r] of blobs) pDisc(g,cx+dx-4,cy+dy-6,Math.max(2,r-10),'#58aa48');
      g.fillStyle='#8ade70'; const rr=rnd(f.gx*31+f.gy); for (let k=0;k<28;k++){ const b=blobs[Math.floor(rr()*blobs.length)]; g.fillRect(cx+b[0]-Math.floor(rr()*b[2]), cy+b[1]-Math.floor(rr()*b[2]*0.8), 2, 1); }
      for (const [dx,len] of [[-18,34],[6,26],[20,40],[-6,18]]){ const sw=Math.sin(t*0.9+dx)*1.2; for (let k=0;k<len;k++){ const X=Math.round(cx+dx+Math.sin(k*0.2)*1.5+sw*k/len), Y=cy+8+k; g.fillStyle='#24521e'; g.fillRect(X,Y,1,1); if (k%6===3){ g.fillStyle='#4caa48'; g.fillRect(X+(k%12?1:-2),Y,2,2); } } }
      break; }
    case 'idol': { // a stone llama idol on a plinth, mossy, with glowing red gem eyes
      ellPx(sx,sy+1,12,4,'rgba(10,24,8,0.35)'); box(f.gx+0.18,f.gy+0.18,0.64,0.64,10,'#b4b69e','#94967f','#74766a'); box(f.gx+0.12,f.gy+0.12,0.76,0.76,3,'#c4c6ae','#9a9c86','#7a7c68',0,10);
      const [px,py]=P(f.gx+0.5,f.gy+0.5,13); const X=Math.round(px), Y=Math.round(py);
      const S=['...kk....kk...','..kssk..kssk..','..kssk..kssk..','..ksSkkkkSsk..','.kssssssssSSk.','.ksskwsssskSk.','.ksskrkssrkSk.','.ksssssssssSk.','.kssssssssSSk.','..ksssmmssSk..','..kssmsssSSk..','...kssssSSk...','...ksssssSk...','...kssmssSk...','..kSssssSSSk..','..kSSSSSSSSk..','..kkkkkkkkkk..'];
      const pal={k:INK,s:'#a8aa92',S:'#74766a',w:'#c8cab4',m:'#4c8a34',r:'#e83a3a'};
      for (let j=0;j<S.length;j++) for (let i=0;i<S[j].length;i++){ const ch=S[j][i]; if (ch==='.') continue; g.fillStyle=pal[ch]; g.fillRect(X-7+i, Y-S.length+j, 1, 1); }
      const gl=(Math.sin(t*2.5)+1)/2; if (gl>0.6){ g.fillStyle='#ffb0a0'; g.fillRect(X-7+5,Y-S.length+6,1,1); g.fillRect(X-7+9,Y-S.length+6,1,1); }
      g.fillStyle='#4c8a34'; g.fillRect(X-5,Y-S.length+3,3,1); g.fillRect(X+2,Y-S.length+4,2,1);
      break; }
    case 'jpillar': { // a fallen carved column lying in the moss, broken at one end
      const A=P(f.gx+0.12,f.gy+0.5,5), B=P(f.gx+1.88,f.gy+0.5,5), n=Math.ceil(Math.hypot(B[0]-A[0],B[1]-A[1]));
      ellPx((A[0]+B[0])/2,(A[1]+B[1])/2+6,28,6,'rgba(10,24,8,0.35)');
      for (let i=0;i<=n;i++){ const u=i/n; ellPx(A[0]+(B[0]-A[0])*u, A[1]+(B[1]-A[1])*u, 6, 6, INK); }
      for (let i=0;i<=n;i++){ const u=i/n, X=A[0]+(B[0]-A[0])*u, Y=A[1]+(B[1]-A[1])*u, ring=(i%9===0); ellPx(X,Y,5,5, ring?'#8a8c78':'#a8aa92'); g.fillStyle=ring?'#74766a':'#c4c6ae'; g.fillRect(Math.round(X)-3,Math.round(Y)-4,4,1); g.fillStyle='#74766a'; g.fillRect(Math.round(X)-1,Math.round(Y)+3,4,1); if (dhash(i,3)>0.7){ g.fillStyle='#4c8a34'; g.fillRect(Math.round(X)-2,Math.round(Y)-5,3,1); } }
      ellPx(A[0],A[1],6,6,INK); ellPx(A[0],A[1],5,5,'#c4c6ae'); ellPx(A[0],A[1],3,3,'#a8aa92'); g.fillStyle='#8a8c78'; g.fillRect(Math.round(A[0])-1,Math.round(A[1])-1,2,2);
      g.fillStyle=INK; for (const [dx,dy] of [[2,-5],[4,-3],[3,0],[5,2]]) g.fillRect(Math.round(B[0])+dx,Math.round(B[1])+dy,1,2);
      break; }
    case 'jcolumn': { // a broken column still standing, fluted, jagged top, moss creeping up
      ellPx(sx,sy+1,9,3,'rgba(10,24,8,0.35)'); box(f.gx+0.2,f.gy+0.2,0.6,0.6,4,'#b4b69e','#94967f','#74766a');
      const H=30; for (let k=0;k<H;k++){ const Y=sy-6-k; g.fillStyle=INK; g.fillRect(sx-7,Y,15,1); for (let i=-6;i<=6;i++){ g.fillStyle = (i+6)%4===0 ? '#74766a' : i<-3 ? '#c4c6ae' : i>3 ? '#8a8c78' : '#a8aa92'; g.fillRect(sx+i,Y,1,1); } }
      const jag=[3,1,4,0,2,5,1,3,0,2,4,1,3]; for (let i=-6;i<=6;i++){ const d=jag[i+6]; g.fillStyle=INK; g.fillRect(sx+i,sy-6-H-d,1,d+1); g.fillStyle='#c4c6ae'; g.fillRect(sx+i,sy-6-H-d+1,1,d); }
      for (let k=0;k<12;k++){ g.fillStyle=k%3?'#3e7a2c':'#4c8a34'; g.fillRect(sx-6+((k*5)%12), sy-6-((k*3)%10), 2, 1); }
      break; }
    case 'jsign': { // wooden sign at the way in
      ellPx(sx,sy,8,3,'rgba(10,24,8,0.35)'); g.fillStyle=INK; g.fillRect(sx-2,sy-30,4,30); g.fillStyle='#7a4c26'; g.fillRect(sx-1,sy-30,2,30);
      const w=pfW('TEMPLE')+16, X=sx-(w>>1), Y=sy-44; g.fillStyle=INK; g.fillRect(X-1,Y-1,w+2,22); g.fillStyle='#a86c3a'; g.fillRect(X,Y,w,20); g.fillStyle='#8a5a30'; g.fillRect(X,Y+9,w,1); g.fillRect(X,Y+19,w,1); g.fillStyle='#c48a50'; g.fillRect(X,Y,w,1);
      pfDraw(g,'LOST',X+((w-pfW('LOST'))>>1),Y+2,'#2a1408'); pfDraw(g,'TEMPLE',X+((w-pfW('TEMPLE'))>>1),Y+12,'#2a1408');
      g.fillStyle='#3e7a2c'; for (let k=0;k<10;k++) g.fillRect(X+w-6+((k*3)%6), Y-2+k*2, 2, 1); g.fillStyle='#4caa48'; g.fillRect(X+w-4,Y+6,3,2); g.fillRect(X+w-6,Y+14,3,2);
      break; }
    case 'jbush': { // leafy bush with flowers
      ellPx(sx,sy+1,13,4,'rgba(10,24,8,0.35)'); const B=[[0,-8,9],[-8,-4,7],[8,-4,7],[0,-14,6]];
      for (const [dx,dy,r] of B) pDisc(g,sx+dx,sy+dy,r+1,INK); for (const [dx,dy,r] of B) pDisc(g,sx+dx,sy+dy,r,'#2e6a2c'); for (const [dx,dy,r] of B) pDisc(g,sx+dx-1,sy+dy-2,r-3,'#4c9a42');
      const fc=f.v?'#ff6ea0':'#ffd23f'; for (const [dx,dy] of [[-6,-8],[4,-12],[7,-5],[-2,-15],[0,-5]]){ g.fillStyle=INK; g.fillRect(sx+dx-1,sy+dy-1,4,4); g.fillStyle=fc; g.fillRect(sx+dx,sy+dy,2,2); g.fillStyle='#ffffff'; g.fillRect(sx+dx,sy+dy,1,1); }
      break; }
  }
}
// GOLDEN IDOL (furniture you can only dig up at the jungle temple): a gold llama on a carved stone pedestal, ruby eyes, glinting
function drawGoldIdol(f, t){ const [sx,sy]=P(f.gx+0.5,f.gy+0.5);
  ellPx(sx,sy+1,11,4,'rgba(24,16,40,0.3)'); box(f.gx+0.22,f.gy+0.22,0.56,0.56,9,'#b4b69e','#94967f','#74766a'); box(f.gx+0.18,f.gy+0.18,0.64,0.64,2,'#c4c6ae','#9a9c86','#7a7c68',0,9);
  const [px,py]=P(f.gx+0.5,f.gy+0.5,11); const X=Math.round(px), Y=Math.round(py);
  const S=['....kk...kk.....', '...kyyk.kyyk....', '...kyyk.kyyk....', '...kyyykkyyk....', '..kyyyyyyyyyk...', '..kywyyyyyyYk...', '..kyrkyyyrkYk...', '..kyyyyyyyyYk...', '...kyyyyyyYk....', '....kyyyyYk.....', '....kywyyYk.....', '....kyyyyYk.....', '...kyyyyyyYk....', '..kywyyyyyyYk...', '.kyyyyyyyyyYYk..', '.kywyyyyyyyYYk..', '.kyyyyyyyyYYYk..', '.kyykyyyykyYYk..', '.kyyk.kyyk.kYk..', '.kyyk.kyyk.kYk..', '.kYYk.kYYk.kYk..', '.kkkk.kkkk.kkk..'];
  const pal={k:INK,y:'#ffd23f',Y:'#c88a10',w:'#fff6c0',r:'#e83850'};
  for (let j=0;j<S.length;j++) for (let i=0;i<S[j].length;i++){ const ch=S[j][i]; if (ch==='.') continue; g.fillStyle=pal[ch]; g.fillRect(X-8+i, Y-S.length+j, 1, 1); }
  if (Math.floor(t*1.5+f.gx)%3===0){ g.fillStyle='#ffffff'; g.fillRect(X-5,Y-S.length+4,1,3); g.fillRect(X-6,Y-S.length+5,3,1); } }

// LLAMA STORE background: warm boutique walls with wood wainscoting, a shop window on the right wall, plank floor
function buildStoreBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY;
  for (let x=-NY*20; x<N*20; x++){
    const left=x<0, ax=left?-x:x, base=Math.floor(ax/2), top=base-WH;
    g.fillStyle = left ? '#f2e2c8' : '#f8ecd6'; g.fillRect(ox+x, oy+top, 1, WH+2);
    if ((ax%12)===0){ g.fillStyle = left ? '#e6d2b2' : '#efdcbc'; g.fillRect(ox+x, oy+top+8, 1, WH-40); }
    g.fillStyle = left ? '#9a6436' : '#a86e3e'; g.fillRect(ox+x, oy+base-30, 1, 30);           // wainscoting
    if ((ax%10)===0){ g.fillStyle = left ? '#7e4e28' : '#8a562e'; g.fillRect(ox+x, oy+base-28, 1, 26); }
    g.fillStyle = '#c8905a'; g.fillRect(ox+x, oy+base-31, 1, 2);
    g.fillStyle = INK; g.fillRect(ox+x, oy+base-32, 1, 1);
    g.fillStyle = '#d8a860'; g.fillRect(ox+x, oy+top-4, 1, 4); g.fillStyle='#f8d890'; g.fillRect(ox+x, oy+top-4, 1, 1);   // crown molding
    g.fillStyle=INK; g.fillRect(ox+x, oy+top-5, 1, 1); g.fillRect(ox+x, oy+base, 1, 1);
  }
  g.fillStyle=INK; g.fillRect(ox-1, oy-WH-5, 2, WH+6); g.fillRect(ox-NY*20-1, oy+NY*10-WH-5, 1, WH+6); g.fillRect(ox+N*20, oy+N*10-WH-5, 1, WH+6);
  // shop window on the right wall, with OPEN in it
  { const x0=132,x1=200,h0=36,h1=60, per=(typeof period==='string')?period:'night';
    for (let x=x0; x<x1; x++){ const b=Math.floor(x/2); const edge=x<x0+3||x>=x1-3; g.fillStyle=INK; g.fillRect(ox+x,oy+b-h1-1,1,h1-h0+2);
      if (x===x0||x===x1-1) continue;
      const sky = per==='day' ? (x%2?'#88c8f8':'#90d0f8') : per==='dusk' ? '#f8a068' : '#3858a8';
      g.fillStyle=edge?'#7e4e28':sky; g.fillRect(ox+x,oy+b-h1,1,h1-h0);
      if (!edge){ g.fillStyle='#7e4e28'; g.fillRect(ox+x,oy+b-h1,1,3); g.fillRect(ox+x,oy+b-h0-3,1,3); if (x===166) g.fillRect(ox+x,oy+b-h1,2,h1-h0);
        g.fillStyle='rgba(255,255,255,0.18)'; if (((x-x0)%17)<3) g.fillRect(ox+x,oy+b-h1+6,1,h1-h0-14); } }
    const op=document.createElement('canvas'); op.width=pfW('OPEN',1)+6; op.height=10; const oc=op.getContext('2d');
    oc.fillStyle=INK; oc.fillRect(0,0,op.width,10); oc.fillStyle='#241838'; oc.fillRect(1,1,op.width-2,8); pfDraw(oc,'OPEN',3,2,'#ff6e96',1);
    for (let x=0;x<op.width;x++){ const wx=145+x; g.drawImage(op, x,0,1,10, ox+wx, oy+Math.floor(wx/2)-54, 1, 10); } }
  drawDoor(ox, oy, -220, -200, -1, -205);
  { const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10; const img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
    const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
    const C={p1:hex('#d8a468'),p2:hex('#cf9a5e'),p3:hex('#e0ae74'),seam:hex('#a87440'),mat:hex('#3f8a5a'),mat2:hex('#2f6e46'),rug:hex('#f2c4d4'),rug2:hex('#e6a8bc'),lr:hex('#e8dcc0'),lr3:hex('#dccfae'),lr2:hex('#8a6a4a')};
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy; const gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue;
      const row=Math.floor(gy*3), off=(row*0.73)%2, u=(gx+off)%2;
      let c = woodGrain([C.p1,C.p2,C.p3][row%3], gx*1.6+off, (gy*3)%1, row*5+Math.floor((gx+off)/2)); if ((gy*3)%1<0.07 || u<0.035) c=C.seam;
      if (gx>=0.6 && gx<2.6 && gy>=9.4 && gy<10.8) c = ((gx-0.6)<0.12||(gx-0.6)>1.88||(gy-9.4)<0.1||(gy-9.4)>1.3) ? C.mat2 : C.mat;   // door mat
      if (gx>=6.6 && gx<12.7 && gy>=3.3 && gy<11.3){ const e=Math.min(gx-6.6,12.7-gx,gy-3.3,11.3-gy); if (e>0.08) c = e<0.22 ? C.rug2 : C.rug; }   // pink rug under the clothing racks
      if (gx>=0.6 && gx<4.4 && gy>=0.7 && gy<3.9){ const e=Math.min(gx-0.6,4.4-gx,gy-0.7,3.9-gy); if (e>0.08) c = e<0.22 ? C.lr2 : ((Math.floor(gx*2)+Math.floor(gy*2))%2 ? C.lr : C.lr3); }   // living-room rug in the furniture half
      const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
    g.putImageData(img,x0,y0); }
}

// ======================= PLAYER ROOMS: furniture, world and walls/floors =======================
// furniture you buy in the LLAMA STORE (prices match the server); mk turns a placed piece into what the room draws
const FURN_DEF = {
  cushion_pink:{n:'PINK CUSHION',p:5,seat:5,mk:()=>({t:'cushion',col:['#f85888','#b83068','#f8a8c8']})},
  cushion_teal:{n:'TEAL CUSHION',p:5,seat:5,mk:()=>({t:'cushion',col:['#48c8b8','#208878','#a8f0e0']})},
  cushion_gold:{n:'GOLD CUSHION',p:5,seat:5,mk:()=>({t:'cushion',col:['#f8b830','#c07818','#f8e880']})},
  stool:{n:'BAR STOOL',p:6,seat:9,mk:()=>({t:'stool'})}, hayseat:{n:'HAY SEAT',p:6,seat:10,mk:()=>({t:'hayseat'})},
  log:{n:'LOG SEAT',p:5,seat:6,mk:rot=>({t:'log',ax:rot%2?'x':'y'})},
  table:{n:'CANDLE TABLE',p:12,mk:()=>({t:'table'})}, lamp:{n:'SIDE LAMP',p:12,mk:()=>({t:'sidetable'})},
  fern:{n:'POTTED FERN',p:6,mk:rot=>({t:'fern',flip:rot%2===1})}, hay:{n:'HAY BALE',p:4,mk:()=>({t:'hay'})},
  keg:{n:'BARREL',p:8,mk:()=>({t:'keg'})}, cabinet:{n:'CABINET',p:15,mk:()=>({t:'cabinet'})},
  counter:{n:'COUNTER',p:10,mk:()=>({t:'counter',end:0})}, vending:{n:'DRINK MACHINE',p:30,cat:'machines',mk:rot=>({t:'vending',rot})}, snackvend:{n:'SNACK MACHINE',p:30,cat:'machines',mk:rot=>({t:'snackvend',rot})},
  chair:{n:'WOODEN CHAIR',p:8,seat:10,cat:'seating',mk:rot=>({t:'chair',rot})}, armchair:{n:'ARMCHAIR',p:15,seat:10,cat:'sofas',mk:rot=>({t:'armchair',rot})},
  bed:{sz:2,n:'COZY BED',p:25,seat:11,cat:'beds',mk:rot=>({t:'bed',rot})}, bookshelf:{n:'BOOKSHELF',p:18,cat:'shelves',mk:rot=>({t:'bookshelf',rot})},
  tv:{n:'TV',p:22,cat:'electronics',mk:rot=>({t:'tv',rot})}, bigtv:{n:'BIG SCREEN TV',p:35,cat:'electronics',iconRot:0,mk:rot=>({t:'bigtv',rot,dz:1})},
  loveseat:{n:'LOVE SEAT',p:22,seat:10,seatAll:true,cat:'sofas',iconRot:1,mk:rot=>({t:'couch',rot,n:2,col:['#f08aa8','#c85a80','#a84468','#ffc0d4']})},
  sofa:{n:'SOFA',p:30,seat:10,seatAll:true,cat:'sofas',iconRot:1,mk:rot=>({t:'couch',rot,n:3,col:['#6a88e0','#4462b8','#344c98','#a8c0f8']})}, plant:{n:'BIG PLANT',p:7,cat:'plants',mk:()=>({t:'plant'})},
  adminsign:{n:'ADMIN SIGN',p:50,cat:'staff',wall:true,staff:true,mk:()=>({t:'adminsign', dz:-3})},
};
FURN_DEF.table.cat='tables'; FURN_DEF.lamp.cat='lighting';
Object.assign(FURN_DEF, {
  beanbag:{n:'BEAN BAG',p:10,seat:6,cat:'seating',mk:rot=>({t:'beanbag',rot})}, barstool:{n:'BAR STOOL',p:7,seat:14,cat:'seating',mk:rot=>({t:'pstool',rot})},
  dbed:{n:'DOUBLE BED',p:40,seat:11,cat:'beds',mk:rot=>({t:'dbed',rot})},
  coffeetable:{n:'COFFEE TABLE',p:14,cat:'tables',mk:()=>({t:'ctable'})}, roundtable:{n:'ROUND TABLE',p:16,cat:'tables',mk:()=>({t:'rtable'})},
  floorlamp:{n:'FLOOR LAMP',p:16,cat:'lighting',mk:()=>({t:'flamp'})}, lavalamp:{n:'LAVA LAMP',p:12,cat:'lighting',mk:()=>({t:'lava'})},
  cubeshelf:{n:'CUBE SHELF',p:14,cat:'shelves',mk:rot=>({t:'cube',rot})}, dresser:{n:'DRESSER',p:20,cat:'shelves',mk:rot=>({t:'dresser',rot})},
  cactus:{n:'CACTUS',p:5,cat:'plants',mk:()=>({t:'cactus'})}, flowers:{n:'FLOWER POT',p:6,cat:'plants',mk:()=>({t:'flowers'})},
  boombox:{n:'BOOMBOX',p:18,cat:'electronics',mk:rot=>({t:'boombox',rot})} });
// FARM & GARDEN: garden plots only go in a FARM (up to 6 each); the rest is decoration that goes anywhere
Object.assign(FURN_DEF, { tchest:{n:'PIRATE CHEST',p:25,cat:'treasure',mk:()=>({t:'tchest'})}, gidol:{n:'GOLDEN IDOL',p:25,cat:'treasure',mk:()=>({t:'gidol'})}, plot:{n:'GARDEN PLOT',p:20,cat:'farm',farmOnly:true,mk:()=>({t:'plot'})}, scarecrow:{n:'SCARECROW',p:15,cat:'farm',mk:()=>({t:'scarecrow'})},
  wheelbarrow:{n:'WHEELBARROW',p:14,cat:'farm',mk:()=>({t:'wheelbarrow'})}, trough:{n:'WATER TROUGH',p:12,cat:'farm',mk:()=>({t:'trough'})},
  beehive:{n:'BEEHIVE',p:18,cat:'farm',mk:()=>({t:'beehive'})}, appletree:{n:'APPLE TREE',p:25,cat:'farm',mk:()=>({t:'appletree'})},
  sunflowers:{n:'SUNFLOWERS',p:8,cat:'farm',mk:()=>({t:'sunflowers'})}, gfence:{n:'PICKET FENCE',p:6,cat:'farm',mk:rot=>({t:'gfence',rot})} });
// LIMITED RARES: numbered runs from the store's LIMITED shelf, never sold again (the server keeps the numbers)
Object.assign(FURN_DEF, { statue:{n:'CRYSTAL LLAMA STATUE',p:150,cat:'rares',rare:true,mk:()=>({t:'statue'})}, throne:{n:'GOLDEN LLAMA THRONE',p:250,seat:12,cat:'rares',rare:true,mk:rot=>({t:'throne',rot})} });
Object.assign(FURN_DEF, { rug_persian:{n:'PERSIAN RUG',p:25,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'persian',rot,dz:-60})}, rug_round:{n:'BRAIDED ROUND RUG',p:15,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'round',rot,dz:-60})},
  rug_stripe:{n:'STRIPED RUNNER',p:12,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'stripe',rot,dz:-60})}, rug_shag:{n:'SHAG RUG',p:18,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'shag',rot,dz:-60})},
  rug_mat_green:{n:'GREEN WELCOME MAT',p:6,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'mat_green',rot,dz:-60})}, rug_mat_red:{n:'RED WELCOME MAT',p:6,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'mat_red',rot,dz:-60})}, rug_mat_blue:{n:'BLUE WELCOME MAT',p:6,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'mat_blue',rot,dz:-60})}, rug_mat_coir:{n:'COCONUT WELCOME MAT',p:6,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'mat_coir',rot,dz:-60})}, rug_mat_pink:{n:'PINK WELCOME MAT',p:6,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'mat_pink',rot,dz:-60})}, rug_mat_purple:{n:'PURPLE WELCOME MAT',p:6,cat:'rugs',rug:true,mk:rot=>({t:'rug',k:'mat_purple',rot,dz:-60})} });
const COUCH_COL={blue:['#6a88e0','#4462b8','#344c98','#a8c0f8'], pink:['#f08aa8','#c85a80','#a84468','#ffc0d4'], teal:['#48b8a8','#2a8a7c','#1e6a5e','#7fe0d0'], green:['#78b850','#558c36','#3e6c26','#b8e890'],
  mustard:['#e8b840','#c08e22','#9a6e14','#ffe08a'], gray:['#8a8a9a','#66667a','#4e4e60','#c4c4d4'], red:['#e05050','#b03838','#8a2828','#ff9a9a'], purple:['#a070e0','#7a4cb8','#5e3898','#d4b8ff']};
// [item key, base piece, colour name, how it's coloured]
const FURN_VARIANTS=[['sofa_gray','sofa','GRAY',{col:COUCH_COL.gray}],['sofa_green','sofa','GREEN',{col:COUCH_COL.green}],['sofa_red','sofa','RED',{col:COUCH_COL.red}],
  ['loveseat_mustard','loveseat','MUSTARD',{col:COUCH_COL.mustard}],['loveseat_teal','loveseat','TEAL',{col:COUCH_COL.teal}],['loveseat_purple','loveseat','PURPLE',{col:COUCH_COL.purple}],
  ['armchair_mustard','armchair','MUSTARD',{col:COUCH_COL.mustard}],['armchair_red','armchair','RED',{col:COUCH_COL.red}],['armchair_gray','armchair','GRAY',{col:COUCH_COL.gray}],
  ['bed_blue','bed','BLUE',{qc:'#5a88e0'}],['bed_green','bed','GREEN',{qc:'#5ab86a'}],['bed_purple','bed','PURPLE',{qc:'#a070e0'}],
  ['chair_walnut','chair','WALNUT',{wc:'#7a4a2a'}],['chair_white','chair','WHITE',{wc:'#e8e4dc'}],['chair_red','chair','RED',{wc:'#d04a3a'}]];
const furnBase = item => (FURN_DEF[item] && FURN_DEF[item].base) || item;
for (const [k,base,cn,extra] of FURN_VARIANTS){ const B0=FURN_DEF[base]; FURN_DEF[k]={...B0, base, n:`${B0.n} (${cn})`, mk:rot=>({...B0.mk(rot), ...extra})}; }
// what the store sells, by category (one of each for now; add more pieces to a category by giving them its cat)
const FURN_CATS=[['rares','⭐ LIMITED RARES'],['staff','🛡️ STAFF ONLY'],['farm','🌾 FARM & GARDEN'],['seating','🪑 SEATING'],['sofas','🛋️ SOFAS & ARMCHAIRS'],['beds','🛏️ BEDS'],['tables','🍽️ TABLES'],['lighting','💡 LIGHTING'],['shelves','📚 SHELVES'],['electronics','📺 ELECTRONICS'],['plants','🪴 PLANTS'],['machines','🥤 VENDING MACHINES'],['rugs','🧶 RUGS']];
const SEAT_DIRS=['fr','fl','br','bl'];
const PR_WALL={ lavender:['#b8a0f0','#d0b8f8','#7860c8','#8870d8'], cream:['#f2e2c8','#f8ecd6','#9a6436','#a86e3e'], mint:['#a8e0c8','#c0eed8','#4a9a7a','#58aa88'],
  barn:['#b0443a','#c4584a','#6a2620','#7a2c24'], pink:['#f8b8d0','#fcd0e0','#c86890','#d87aa0'], night:['#2a2450','#342c60','#141030','#1a1438'], wood:['#a87444','#b8834e','#6a4220','#7a4c26'] };
const PR_FLOOR={ meadow:['#68b048','#58a03e','#86c85e'], wood:['#d8a468','#cf9a5e','#a87440'], checker:['#f4f0f8','#3a3458','#d8d0e8'], carpet:['#4a64c8','#3a54b0','#6a84e0'], marble:['#ece8f0','#d8d2e2','#b8b0c8'], grass:['#6ab04a','#5aa040','#88c860'] };
function buildPlayerWorld(){
  clearWorld(); const R=PRD[curRoom]; if (!R) return;
  for (const f of R.furn||[]){ const D=FURN_DEF[f.item]; if (!D) continue; FURN.push({...D.mk(f.rot||0), gx:f.gx, gy:f.gy, fid:f.id, item:f.item, rot:f.rot||0, off:!!f.off, ...(f.crop?{crop:f.crop, planted:f.planted, ready:f.ready, wat:f.wat, wby:f.wby}:{})}); if (D.wall || D.rug) continue; const tl=furnTiles(f.item,f.gx,f.gy,f.rot);
    if (furnBase(f.item)==='dbed'){ const r=f.rot||0; for (const [tx,ty] of tl){ const isHead = r===0 ? tx===f.gx : r===1 ? ty===f.gy : r===2 ? tx===f.gx+1 : ty===f.gy+1, half = r%2 ? tx-f.gx : ty-f.gy;
        if (isHead) SEATS.push({gx:tx,gy:ty,dir:SEAT_DIRS[r],lift:D.seat, bed:{cx: r%2 ? f.gx+half+0.5 : f.gx+1, cy: r%2 ? f.gy+1 : f.gy+half+0.5, headLeft: r===0||r===3, hx: r===0?-1:r===2?1:0, hy: r===1?-1:r===3?1:0}}); else block(tx,ty); } continue; }
    if (D.seat){ const r=f.rot||0; SEATS.push({gx:f.gx,gy:f.gy,dir:SEAT_DIRS[r],lift:D.seat, bed: furnBase(f.item)==='bed' ? {cx: r%2 ? f.gx+0.5 : f.gx+1, cy: r%2 ? f.gy+1 : f.gy+0.5, headLeft: r===0||r===3, hx: r===0?-1:r===2?1:0, hy: r===1?-1:r===3?1:0} : null}); } else block(f.gx,f.gy); for (const [tx,ty] of tl.slice(1)){ if (D.seatAll) SEATS.push({gx:tx,gy:ty,dir:SEAT_DIRS[f.rot||0],lift:D.seat}); else block(tx,ty); } }
}
// ---- wallpaper and flooring art: every pixel comes from these, so the room, the shop swatches and the settings swatches match ----
const DHX=new Map(), dh=h=>{ let v=DHX.get(h); if (!v){ v=[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]; DHX.set(h,v); } return v; };
const dhash=(a,b)=>{ let n=(a*374761393+b*668265263)|0; n=(n^(n>>>13))*1274126177|0; return ((n^(n>>>16))>>>0)/4294967296; };
const dmul=(c,f)=>[Math.min(255,c[0]*f|0),Math.min(255,c[1]*f|0),Math.min(255,c[2]*f|0)];
const dmix=(a,b,t)=>[a[0]+(b[0]-a[0])*t|0,a[1]+(b[1]-a[1])*t|0,a[2]+(b[2]-a[2])*t|0];
// walls: field(s,h) above the chair rail, low(s,h) below it (s = pixels along the wall, h = pixels above the floor), and trim colours
const DECO_WALL={
  lavender:{n:'LAVENDER PAINT',p:0, field:(s,h)=>s%10===0?dmix(dh('#b8a0f0'),dh('#7860c8'),0.25):dh('#c4acf4'), low:()=>dh('#8068cc'), trim:'#7860c8'},
  cream:{n:'CREAM PAINT',p:15, field:(s,h)=>s%10===0?dmix(dh('#f2e2c8'),dh('#9a6436'),0.18):dh('#f5e8d0'), low:()=>dh('#a06a3a'), trim:'#9a6436'},
  mint:{n:'MINT PAINT',p:15, field:(s,h)=>s%10===0?dmix(dh('#a8e0c8'),dh('#4a9a7a'),0.25):dh('#b4e6d0'), low:()=>dh('#509e80'), trim:'#4a9a7a'},
  pink:{n:'BUBBLEGUM PAINT',p:15, field:(s,h)=>s%10===0?dmix(dh('#f8b8d0'),dh('#c86890'),0.25):dh('#fac4d8'), low:()=>dh('#cc6e96'), trim:'#c86890'},
  night:{n:'MIDNIGHT PAINT',p:15, field:(s,h)=>s%10===0?dh('#262048'):dh('#2e2858'), low:()=>dh('#161232'), trim:'#141030'},
  wood:{n:'WOOD PANELING',p:25, field:(s,h)=>{ const pl=Math.floor(s/9), c=dh(['#a87444','#b8834e','#9c6a3c'][pl%3]); if (s%9===0) return dh('#5a3418'); const gr=dhash(pl,Math.floor(h/7)); return (gr<0.12 && (h+pl)%5===0) ? dmul(c,0.85) : c; }, low:(s,h)=>((s%18===0)||h===3||h===22)?dh('#4a2a12'):dh('#6a4220'), trim:'#6a4220'},
  stripes:{n:'REGENCY STRIPES',p:30, field:(s,h)=>{ const k=s%14; if (k===0) return dh('#e0b860'); return dh(k<7?'#2c3c74':'#3c5090'); },
    low:(s,h)=>{ const k=s%24; if (k===0||h===2||h===23) return dh('#3a2210'); if ((k===3||k===21)&&h>5&&h<20 || (h===6||h===19)&&k>3&&k<21) return dh('#4a2e16'); if ((k===4)&&h>6&&h<19 || h===7&&k>4&&k<20) return dh('#8a5a30'); return dh('#6a4220'); }, trim:'#3a2210'},
  damask:{n:'TEAL DAMASK',p:35, field:(s,h)=>{ const col=Math.floor(s/20), a=s%20, b=(h+(col%2)*12)%24, dx=Math.abs(a-10), dy=Math.abs(b-12), r=dx*1.15+dy;
      if (Math.abs(r-8)<0.7 || (r<2.2) || (dx<0.6 && (dy>9&&dy<12)) || (Math.abs(dx-4)<0.7 && Math.abs(dy-4)<0.7)) return dh('#d8b45a');
      if (Math.abs(r-6)<0.5) return dh('#2a7070'); return (dhash(s,h)<0.05)?dh('#1a5252'):dh('#1e5c5c'); }, low:(s,h)=>h===24?dh('#d8b45a'):dh('#123c3c'), trim:'#0e2e2e'},
  brick:{n:'EXPOSED BRICK',p:35, field:(s,h)=>{ const row=Math.floor(h/6), off=(row%2)*7, bx=Math.floor((s+off)/14);
      if (h%6===0 || (s+off)%14===0) return dh('#cbbcaa'); const c=dh(['#b0503a','#a04530','#c0603e','#984028','#b85a40'][Math.floor(dhash(bx,row)*5)]);
      if (h%6===5) return dmul(c,1.15); if ((s+off)%14===1) return dmul(c,1.08); return dhash(s,h)<0.08?dmul(c,0.88):c; },
    low:(s,h)=>{ const row=Math.floor(h/6), off=(row%2)*7; if (h%6===0 || (s+off)%14===0) return dh('#a89a8a'); return dmul(dh(['#b0503a','#a04530','#c0603e','#984028'][Math.floor(dhash(Math.floor((s+off)/14),row+50)*4)]),0.82); }, trim:'#6a6a72', rail:'#b8b4ac'},
  stars:{n:'STARRY NIGHT',p:40, field:(s,h,left)=>{ const t=Math.min(1,h/96), base=dmix(dh('#2a2e74'),dh('#14163c'),t);
      if (!left && Math.hypot(s-46,h-74)<7 && Math.hypot(s-49,h-76)>5.5) return dh('#fff4c0');   // crescent moon
      const cx=Math.floor(s/9), cy=Math.floor(h/9), r=dhash(cx,cy+7), sx=cx*9+4, sy=cy*9+4;
      if (r<0.18 && ((s===sx&&Math.abs(h-sy)<=1)||(h===sy&&Math.abs(s-sx)<=1))) return dh(r<0.06?'#fff8d0':'#ffffff');
      return dhash(s,h)<0.006 ? dh('#a8b0f0') : base; }, low:(s,h)=>(h===24||((s%12===6)&&h===12))?dh('#f0d870'):dh('#101232'), trim:'#0c0e28'},
  floral:{n:'ROSE GARDEN',p:30, field:(s,h)=>{ const col=Math.floor(s/16), a=s%16, b=(h+(col%2)*8)%16, dx=a-8, dy=b-8, d=Math.abs(dx)+Math.abs(dy);
      if (d<=1) return dh('#a83050'); if (d<=2) return dh('#e86a8a'); if (d===3) return dh('#c84a6a');
      if ((dx===4&&dy===1)||(dx===5&&dy===2)||(dx===-4&&dy===-1)||(dx===-5&&dy===-2)) return dh('#5a9a5a'); if ((dx===4&&dy===2)||(dx===-4&&dy===-2)) return dh('#3e7a3e');
      return ((s+h)%4===0)?dh('#efe4ce'):dh('#f6eedc'); }, low:(s,h)=>(s%5===0)?dh('#6a8a62'):dh('#8aa880'), trim:'#5a7a52'},
};
// floors: px(gx,gy) with gx,gy in tiles (fractions allowed)
// farms start with these two (free for everyone): red barn planks with a white rail, and a meadow with little flowers
DECO_WALL.barn={n:'BARN PLANKS',p:0, field:(s,h)=>{ const pl=Math.floor(s/8), c=dh(['#b0443a','#bc4c40','#a63e34'][pl%3]); if (s%8===0) return dh('#6a2620'); if (dhash(pl,Math.floor(h/9))<0.1 && (h%9===4) && (s%8===4)) return dh('#3a1a14'); return c; },
  low:(s,h)=>{ if (h>=22) return dh('#f4efe4'); if (h===21) return dh('#cfc6b6'); const pl=Math.floor(s/8); if (s%8===0) return dh('#5a2018'); return dmul(dh(['#a63e34','#9a382e'][pl%2]),0.92); }, trim:'#5a2018'};
const fr=v=>v-Math.floor(v);
// floor detail helpers: a colour nudged lighter (f>1) or darker (f<1), and wood grain for a plank
const dshade=(c,f)=>[Math.max(0,Math.min(255,Math.round(c[0]*f))),Math.max(0,Math.min(255,Math.round(c[1]*f))),Math.max(0,Math.min(255,Math.round(c[2]*f)))];
function woodGrain(c, along, across, board){   // streaks running along the plank, plus the odd knot
  const s=dhash(board,7)*6.283, w=Math.sin(along*2.1+s+Math.sin(across*9+s)*1.4);
  let f = w>0.82 ? 0.9 : w<-0.9 ? 1.06 : 1;
  const kn=dhash(board,Math.floor(along/3.2)); if (kn<0.18){ const kx=(Math.floor(along/3.2)+0.5)*3.2, kd=Math.hypot((along-kx)*0.55, (across-0.5)*1.6); if (kd<0.16) f=0.78; else if (kd<0.26) f=0.9; }
  return f===1 ? c : dshade(c,f); }
const DECO_FLOOR={
  wood:{n:'OAK PLANKS',p:0, px:(gx,gy)=>{ const row=Math.floor(gy*3), u=(gx+(row*0.73)%2)%2; if ((gy*3)%1<0.07 || u<0.035) return dh('#a87440'); return dh(['#d8a468','#cf9a5e','#d8a468'][row%3]); }},
  checker:{n:'CHECKERBOARD',p:20, px:(gx,gy)=>{ const k=(Math.floor(gx)+Math.floor(gy))%2, c=dh(k?'#3a3458':'#f4f0f8'); return (fr(gx)<0.03||fr(gy)<0.03)?dh('#d8d0e8'):c; }},
  carpet:{n:'BLUE CARPET',p:20, px:(gx,gy)=>{ const c=((Math.floor(gx*4)+Math.floor(gy*4))%2)?dh('#4a64c8'):dh('#3a54b0'); return dhash(Math.floor(gx*40),Math.floor(gy*40))<0.15?dmul(c,1.12):c; }},
  marble:{n:'MARBLE TILE',p:25, px:(gx,gy)=>{ const k=(Math.floor(gx)+Math.floor(gy))%2; if (fr(gx)<0.04||fr(gy)<0.04) return dh('#b8b0c8'); const c=dh(k?'#d8d2e2':'#ece8f0'), v=Math.sin(gx*9+Math.sin(gy*7)*2.2+k*3); return Math.abs(v)<0.07?dh('#a8a0bc'):c; }},
  meadow:{n:'MEADOW',p:0, px:(gx,gy)=>{ const cx=Math.floor(gx*8), cy=Math.floor(gy*8), r=dhash(cx,cy+900); if (r<0.012) return dh('#fff4b0'); if (r<0.022) return dh('#ffffff'); if (r<0.03) return dh('#f890b8');
    const h2=Math.floor(dhash(Math.floor(gx*6),Math.floor(gy*6))*8); return dh(h2===0?'#82c45c':h2===1?'#58a03e':h2===2?'#4e9238':'#68b048'); }},
  grass:{n:'INDOOR LAWN',p:20, px:(gx,gy)=>{ const h2=Math.floor(dhash(Math.floor(gx*7),Math.floor(gy*7))*9); return dh(h2===0?'#88c860':h2===1?'#5aa040':h2===2?'#4a9038':'#6ab04a'); }},
  parquet:{n:'PARQUET',p:30, px:(gx,gy)=>{ const cx=Math.floor(gx*2), cy=Math.floor(gy*2), ux=fr(gx*2), uy=fr(gy*2), vert=(cx+cy)%2;
      if (ux<0.05||uy<0.05) return dh('#6a4220'); const a=vert?ux:uy, b=vert?uy:ux, i=Math.floor(a*3); if (fr(a*3)<0.09) return dh('#7a4c26');
      const c=dh(['#c88a50','#b87a42','#d89a5e'][(i+cx+cy)%3]); return (Math.floor(b*12)%5===2 && dhash(cx*3+i,cy)<0.5)?dmul(c,0.9):c; }},
  tiles:{n:'PAINTED TILES',p:30, px:(gx,gy)=>{ const u=fr(gx), v=fr(gy); if (u<0.04||v<0.04) return dh('#ddd2bc');
      const du=Math.abs(u-0.53), dv=Math.abs(v-0.53), d=du+dv, cr=Math.min(Math.hypot(u-0.06,v-0.06),Math.hypot(u-1,v-0.06),Math.hypot(u-0.06,v-1),Math.hypot(u-1,v-1));
      if (d<0.12) return dh('#f0c040'); if (d<0.2) return dh('#2a5aa8'); if (d<0.25) return dh('#f8f4ea'); if (Math.abs(d-0.32)<0.03) return dh('#2a5aa8');
      if (cr<0.16) return dh('#3a6ac8'); if (cr<0.2) return dh('#f0c040'); return dh('#f8f4ea'); }},
  cobble:{n:'COBBLESTONE',p:25, px:(gx,gy)=>{ const S2=3, x=gx*S2, y=gy*S2, ix=Math.floor(x), iy=Math.floor(y); let d1=9,d2=9,id=0;
      for (let j=-1;j<=1;j++) for (let i=-1;i<=1;i++){ const cx=ix+i, cy=iy+j, px2=cx+0.2+dhash(cx,cy)*0.6, py2=cy+0.2+dhash(cy,cx+9)*0.6, d=Math.hypot(x-px2,(y-py2)*1); if (d<d1){ d2=d1; d1=d; id=cx*131+cy; } else if (d<d2) d2=d; }
      if (d2-d1<0.08) return dh('#4a4850'); const c=dh(['#9a98a0','#8a8890','#aaa8b0','#7e7c86'][Math.floor(dhash(id,3)*4)]); return d1<0.18?dmul(c,1.12):(d2-d1<0.14?dmul(c,0.86):c); }},
  plaid:{n:'TARTAN CARPET',p:25, px:(gx,gy)=>{ const a=fr(gx*2), b=fr(gy*2), ba=a>0.35&&a<0.65, bb=b>0.35&&b<0.65; let c=dh('#b83a3a');
      if (ba&&bb) c=dh('#1e4630'); else if (ba||bb) c=dh('#2a5a3a'); if (Math.abs(a-0.5)<0.025||Math.abs(b-0.5)<0.025) c=dh('#e8c040'); if (Math.abs(a-0.1)<0.02||Math.abs(b-0.1)<0.02) c=dh('#f0e8d8');
      return ((Math.floor(gx*40)+Math.floor(gy*40))%2)?c:dmul(c,0.94); }},
};
// a little preview tile of a wallpaper or floor, for the shop and the room settings
// wallpaper and floors are bag items too: wp_<id> and fl_<id>. These turn an item key into its kind and name, and draw its icon.
const decoOf = item => { const m=/^(wp|fl)_(\w+)$/.exec(item||''); if (!m) return null; const kind=m[1]==='wp'?'w':'f', T=(kind==='w'?DECO_WALL:DECO_FLOOR)[m[2]]; return T ? {kind, id:m[2], T} : null; };
const itemName = item => { const d=decoOf(item); if (d) return d.kind==='w' ? (/PAINT|WALL/.test(d.T.n) ? d.T.n : d.T.n+' WALLPAPER') : (/FLOOR/.test(d.T.n) ? d.T.n : d.T.n+' FLOOR'); return FURN_DEF[item] ? FURN_DEF[item].n : item; };
function decoIcon(item, CS){ const d=decoOf(item), R2=Math.max(1,Math.min(3,Math.round(window.devicePixelRatio||1))), S2=CS*R2, c=document.createElement('canvas'); c.width=c.height=S2; const m=c.getContext('2d'); m.imageSmoothingEnabled=false;
  const pad=Math.round(S2*0.1), w=S2-pad*2, sw=decoSwatch(d.kind,d.id,40,40); m.fillStyle=INK; m.fillRect(pad-R2,pad-R2,w+R2*2,w+R2*2); m.drawImage(sw,pad,pad,w,w);
  m.fillStyle='rgba(255,255,255,.35)'; m.fillRect(pad,pad,w,Math.max(1,R2)); return c; }
function decoSwatch(kind, id, W=44, H=34){ const cv=document.createElement('canvas'); cv.width=W; cv.height=H; const m=cv.getContext('2d'), img=m.createImageData(W,H), D2=img.data;
  for (let y=0;y<H;y++) for (let x=0;x<W;x++){ let c;
    if (kind==='w'){ const T=DECO_WALL[id]||DECO_WALL.lavender, h=H-1-y+8; c = h<26 ? T.low(x+3,h,false) : (h<29 ? dh(T.rail||'#f8f8f8') : T.field(x+3,h,false)); }
    else { const T=DECO_FLOOR[id]||DECO_FLOOR.wood; c=T.px(x/18+0.02, y/18+0.02); }
    const i=(y*W+x)*4; D2[i]=c[0]; D2[i+1]=c[1]; D2[i+2]=c[2]; D2[i+3]=255; }
  m.putImageData(img,0,0); return cv; }
// FARMS: an open field under the sky (same day, dusk and night as LLAMA ACRES): hills behind, a low fence along the back,
// the field on a slab of earth with a grassy lip, a wooden gate where the door would be, and the farm's name on a signboard
function buildFarmBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY, Q=(gx,gy,h=0)=>{ const [x,y]=proj(gx,gy); return [ox+x, oy+y-h]; }, R=PRD[curRoom]||{}, per=(typeof period==='string')?period:'day', sky=barnSky();
  // (the sky and the rolling hills are painted across the whole screen each frame, behind this layer: see drawFarmSky)
  // earth slab under the field: front-left and front-right faces, with a grassy lip
  const D=14, dirt=['#8a5a32','#7a4c28','#6a4020'];
  { const a=Q(0,NY), b=Q(N,NY), c=Q(N,0); 
    polyPx([[a[0],a[1]],[b[0],b[1]],[b[0],b[1]+D],[a[0],a[1]+D]], dirt[0]); polyPx([[b[0],b[1]],[c[0],c[1]],[c[0],c[1]+D],[b[0],b[1]+D]], dirt[1]);
    for (const [p,q,col] of [[a,b,'#5a3618'],[b,c,'#4e2e14']]) for (const dy of [5,10]) linePx(p[0],p[1]+dy,q[0],q[1]+dy,col);
    const rr=rnd(3); g.fillStyle='#a8784a'; for (let i=0;i<40;i++){ const u=rr(), left=rr()<0.5, p=left?a:b, q=left?b:c, dy=2+Math.floor(rr()*(D-4)); g.fillRect(Math.round(p[0]+(q[0]-p[0])*u), Math.round(p[1]+(q[1]-p[1])*u)+dy, 2, 1); }
    linePx(a[0],a[1]+D,b[0],b[1]+D,INK); linePx(b[0],b[1]+D,c[0],c[1]+D,INK); linePx(a[0],a[1],a[0],a[1]+D,INK); linePx(c[0],c[1],c[0],c[1]+D,INK); linePx(b[0],b[1],b[0],b[1]+D,INK);
    // grass hanging over the lip, a few stones and roots in the earth
    const r2=rnd(11); for (const [p,q] of [[a,b],[b,c]]) for (let k=0;k<70;k++){ const u=r2(), X=Math.round(p[0]+(q[0]-p[0])*u), Y=Math.round(p[1]+(q[1]-p[1])*u), L=1+Math.floor(r2()*3); g.fillStyle=r2()<0.5?'#5aa040':'#4a9038'; g.fillRect(X,Y+1,1,L); if (r2()<0.25){ g.fillStyle='#78c058'; g.fillRect(X,Y+1,1,1); } }
    for (const [p,q] of [[a,b],[b,c]]) for (let k=0;k<7;k++){ const u=0.08+r2()*0.84, X=Math.round(p[0]+(q[0]-p[0])*u), Y=Math.round(p[1]+(q[1]-p[1])*u)+5+Math.floor(r2()*5); g.fillStyle=INK; g.fillRect(X-1,Y-1,5,4); g.fillStyle='#9a9aa8'; g.fillRect(X,Y,3,2); g.fillStyle='#c0c0cc'; g.fillRect(X,Y,1,1); }
    for (const [p,q] of [[a,b],[b,c]]) for (let k=0;k<5;k++){ const u=0.1+r2()*0.8, X=Math.round(p[0]+(q[0]-p[0])*u), Y=Math.round(p[1]+(q[1]-p[1])*u)+2; g.fillStyle='#4a2c14'; g.fillRect(X,Y,1,3); g.fillRect(X+1,Y+3,1,2); g.fillRect(X-1,Y+4,1,1); } }
  // the field itself (floor art), with the edge tiles fading into a grassy lip
  { const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10; const img=g.getImageData(x0,y0,x1-x0,y1-y0), Dd=img.data, W=x1-x0, lip=[94,168,70];
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy; const gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue; let c=(DECO_FLOOR[R.floor]||DECO_FLOOR.meadow).px(gx,gy);
      if (gx>N-0.05 || gy>NY-0.05) c=lip;
      const i=(py*W+px)*4; Dd[i]=c[0]; Dd[i+1]=c[1]; Dd[i+2]=c[2]; Dd[i+3]=255; }
    g.putImageData(img,x0,y0); }
  // the farm's name on a wooden signboard, standing outside the field behind the back-right fence on its own two posts,
  // turned to run along the fence (drawn column by column on the slant, like the wall plaques) so both posts stay outside
  { const nm=(R.name||'').toUpperCase(); let sc=2, lines=[nm]; const maxW=Math.min(220, N*20-40);
    if (pfW(nm,2)+16>maxW){ const w=nm.split(' '); let best=null; for (let k=1;k<w.length;k++){ const a2=w.slice(0,k).join(' '), b2=w.slice(k).join(' '), m2=Math.max(pfW(a2,2),pfW(b2,2)); if (!best||m2<best[0]) best=[m2,a2,b2]; } if (best && best[0]+16<=maxW) lines=[best[1],best[2]]; else sc=1; }
    const tw=Math.max(24,...lines.map(l=>pfW(l,sc))), PW=(tw+16)+((tw+16)%2), LH2=5*sc+(sc===2?4:3), PH=lines.length*LH2+8, POST=30;
    const cv=document.createElement('canvas'); cv.width=PW; cv.height=PH; const m=cv.getContext('2d');
    m.fillStyle=INK; m.fillRect(0,0,PW,PH); m.fillStyle='#b8844a'; m.fillRect(2,2,PW-4,PH-4); m.fillStyle='#d0a064'; m.fillRect(2,2,PW-4,2); m.fillStyle='#8a5a30'; for (let yy=6; yy<PH-3; yy+=5) m.fillRect(2,yy,PW-4,1); m.fillStyle='#6a4220'; m.fillRect(2,PH-4,PW-4,2);
    lines.forEach((l,k)=>{ let x=Math.round((PW-pfW(l,sc))/2); x-=x%2; const y=4+k*LH2; pfDraw(m,l,x+1,y+1,'#5a3418',sc); pfDraw(m,l,x,y,'#fff4d0',sc); });
    const GY=-1.3, gx0=Math.max(0.6, N*0.6-PW/40), [bx,by]=Q(gx0,GY);   // left end of the board on the ground line behind the fence
    const post=gx=>{ const [X0,Y0]=Q(gx,GY), X=Math.round(X0), Y=Math.round(Y0); g.fillStyle=INK; g.fillRect(X-3,Y-POST-PH+2,6,POST+PH-2); g.fillStyle='#8a5a30'; g.fillRect(X-2,Y-POST-PH+3,4,POST+PH-4); g.fillStyle='#a8743e'; g.fillRect(X-2,Y-POST-PH+3,1,POST+PH-4); g.fillStyle='rgba(0,0,0,0.18)'; g.fillRect(X-3,Y,7,2); };
    post(gx0+0.25); post(gx0+PW/20-0.25);
    for (let x=0;x<PW;x++){ const X=Math.round(bx)+x; g.drawImage(cv, x,0,1,PH, X, Math.round(by)+Math.floor(x/2)-POST-PH, 1, PH); } }
  // low split-rail fence along the two back edges (gaps where the gate is)
  const post=(gx,gy)=>{ const [X0,Y0]=Q(gx,gy), X=Math.round(X0), Y=Math.round(Y0); g.fillStyle=INK; g.fillRect(X-2,Y-15,4,15); g.fillStyle='#a8743e'; g.fillRect(X-1,Y-14,2,14); g.fillStyle='#c8945a'; g.fillRect(X-1,Y-14,1,14); };
  const rail=(p,q)=>{ for (const h of [6,11]){ const a=Q(p[0],p[1],h), b=Q(q[0],q[1],h); linePx(a[0],a[1]-1,b[0],b[1]-1,INK); linePx(a[0],a[1],b[0],b[1],'#b8844a'); linePx(a[0],a[1]+1,b[0],b[1]+1,INK); } };
  for (let x=0;x<N;x+=2){ rail([x,0],[Math.min(N,x+2),0]); } for (let x=0;x<=N;x+=2) post(x,0);
  for (let y=0;y<NY-2;y+=2){ rail([0,y],[0,Math.min(NY-2,y+2)]); } for (let y=2;y<=NY-2;y+=2) post(0,y);
  // the entrance: a worn dirt patch with stepping stones, two posts (the front one tucked just inside the corner) under a crossbeam
  // with a little hanging sign, and the gate itself swung open against the inside of the fence
  { const GY0=NY-2, GY1=NY-0.16, H=34;
    // worn path at the gate
    { const rr=rnd(17); for (let k=0;k<70;k++){ const u=0.05+rr()*0.9, v=GY0+0.15+rr()*1.7, [X0,Y0]=Q(u,v); g.fillStyle=rr()<0.5?'#b88a5a':'#a87a4a'; g.fillRect(Math.round(X0),Math.round(Y0),2,1); }
      for (const [u,v] of [[0.35,GY0+0.55],[0.65,GY0+1.25],[0.45,GY0+1.75]]){ const [X0,Y0]=Q(u,v), X=Math.round(X0), Y=Math.round(Y0); g.fillStyle='#6a5a50'; g.fillRect(X-3,Y,7,2); g.fillStyle='#a89a90'; g.fillRect(X-3,Y-1,7,2); g.fillStyle='#c8bcb2'; g.fillRect(X-2,Y-1,3,1); } }
    // the open gate: hinged on the back post, lying along the inside of the fence (frame, two rails, a cross brace, iron hinges)
    { const gx=0.12, a0=GY0-0.02, a1=GY0-1.05, L=(p,q,c)=>linePx(p[0],p[1],q[0],q[1],c);
      for (const h of [3,8,13]){ const p=Q(gx,a0,h), q=Q(gx,a1,h); L([p[0],p[1]-1],[q[0],q[1]-1],INK); L(p,q,h===8?'#a8743e':'#c0884a'); L([p[0],p[1]+1],[q[0],q[1]+1],INK); }
      for (const v of [a0,a1,(a0+a1)/2]){ const p=Q(gx,v,2), q=Q(gx,v,14); const X=Math.round(p[0]); g.fillStyle=INK; g.fillRect(X-1,Math.round(q[1])-1,3,Math.round(p[1]-q[1])+2); g.fillStyle='#b07a44'; g.fillRect(X,Math.round(q[1]),1,Math.round(p[1]-q[1])); }
      { const p=Q(gx,a0,3), q=Q(gx,a1,13); L(p,q,INK); L([p[0],p[1]-1],[q[0],q[1]-1],'#c0884a'); }
      for (const h of [4,12]){ const [X0,Y0]=Q(gx,a0,h); g.fillStyle='#3a3a44'; g.fillRect(Math.round(X0)-1,Math.round(Y0)-1,3,2); } }
    // posts and crossbeam
    const A=Q(0,GY0), B=Q(0.06,GY1); for (const p of [A,B]){ const X=Math.round(p[0]), Y=Math.round(p[1]); g.fillStyle='rgba(0,0,0,0.18)'; g.fillRect(X-3,Y,8,2); g.fillStyle=INK; g.fillRect(X-3,Y-H,7,H+1); g.fillStyle='#9a6a3a'; g.fillRect(X-2,Y-H+1,5,H-1); g.fillStyle='#b8844a'; g.fillRect(X-2,Y-H+1,1,H-1); g.fillStyle='#7a4e26'; g.fillRect(X+2,Y-H+1,1,H-1); g.fillStyle=INK; g.fillRect(X-4,Y-H-2,9,3); g.fillStyle='#c0884a'; g.fillRect(X-3,Y-H-1,7,1); }
    { const p=Q(-0.06,GY0-0.25,H+3), q=Q(0.12,GY1+0.25,H+3); for (const d of [-1,0,1,2]) linePx(p[0],p[1]+d,q[0],q[1]+d, d===-1||d===2?INK:d===0?'#c0884a':'#9a6a3a'); }
    // hanging sign with a wheat sheaf
    { const m=Q(0.03,(GY0+GY1)/2), MX=Math.round(m[0]), MY=Math.round(m[1])-H+6; g.fillStyle=INK; g.fillRect(MX-4,MY-2,1,4); g.fillRect(MX+4,MY-2,1,4); g.fillRect(MX-7,MY+2,15,10); g.fillStyle='#e8c070'; g.fillRect(MX-6,MY+3,13,8); g.fillStyle='#f4d890'; g.fillRect(MX-6,MY+3,13,1); g.fillStyle='#c09040'; g.fillRect(MX-6,MY+10,13,1);
      g.fillStyle='#8a5a20'; g.fillRect(MX,MY+5,1,5); g.fillRect(MX-2,MY+6,1,4); g.fillRect(MX+2,MY+6,1,4); g.fillStyle='#d8a030'; g.fillRect(MX-1,MY+4,3,2); g.fillRect(MX-3,MY+5,2,2); g.fillRect(MX+2,MY+5,2,2); g.fillStyle='#6a3a10'; g.fillRect(MX-2,MY+8,5,1); } }
}
// FARM BACKDROP, pixel-exact: every shape is filled row by row with whole pixels (no smoothed canvas circles), one shared palette,
// far layers paler and bluer. Sky + sun, then drifting clouds, then the land (mountains, hills with trees and a barn, field rows).
// Sky and land are drawn once per time of day into cached layers in world space, so they pan with the camera; only the clouds move.
const FSKY={key:'', sky:null, land:null, clouds:[], W:1800, H:330, X0:900, Y0:250};
function fHex(h){ const n=parseInt(h.slice(1),16); return [n>>16,(n>>8)&255,n&255]; }
function fMix(a,b,t){ const A=fHex(a), B=fHex(b); return '#'+A.map((v,i)=>Math.round(v+(B[i]-v)*t).toString(16).padStart(2,'0')).join(''); }
function fTone(h,per){ return per==='night' ? fMix(fMix(h,'#141a44',0.62),'#000000',0.1) : per==='dusk' ? fMix(fMix(h,'#ff9466',0.22),'#3a2050',0.12) : h; }
// whole-pixel disc and ellipse
function pDisc(c,x,y,r,col){ c.fillStyle=col; for (let j=-r;j<=r;j++){ const w=Math.floor(Math.sqrt(r*r-j*j+r*0.8)); c.fillRect(x-w,y+j,w*2+1,1); } }
function pEll(c,x,y,rx,ry,col){ c.fillStyle=col; for (let j=-ry;j<=ry;j++){ const w=Math.floor(rx*Math.sqrt(Math.max(0,1-(j*j)/(ry*ry+ry*0.8)))); c.fillRect(x-w,y+j,w*2+1,1); } }
function farmCloud(per, big){ const W=big?64:44, H=big?26:18, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'), k=big?1:0.7;
  const lobes=[[0.22,0.66,0.2],[0.42,0.48,0.28],[0.63,0.56,0.24],[0.82,0.7,0.16]].map(([u,v,r])=>[Math.round(u*W),Math.round(v*H),Math.round(r*W*0.55)]);
  const C0=fTone('#ffffff',per), C1=fTone('#e4effa',per), C2=fTone('#c9dcee',per);
  for (const [u,v,r] of lobes) pDisc(x,u,v+1,r,C2); x.fillStyle=C2; x.fillRect(lobes[0][0],H-6,lobes[3][0]-lobes[0][0],5);
  for (const [u,v,r] of lobes) pDisc(x,u,v,r,C1); x.fillStyle=C1; x.fillRect(lobes[0][0],H-7,lobes[3][0]-lobes[0][0],4);
  for (const [u,v,r] of lobes) pDisc(x,u-1,v-1,Math.max(1,r-2),C0);
  x.clearRect(0,H-2,W,2); return c; }
function farmTree(per, sz){ const W=sz*2+6, H=sz*3+4, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'), cx=Math.floor(W/2);
  const D=fTone('#2f6e3a',per), M=fTone('#3f8a46',per), L=fTone('#5ba85a',per), HL=fTone('#7cc46e',per), T=fTone('#5a3c22',per);
  x.fillStyle=T; x.fillRect(cx-1,H-sz-1,2,sz+1); x.fillStyle=fTone('#3e2814',per); x.fillRect(cx,H-sz-1,1,sz+1);
  const cy=H-sz-Math.round(sz*0.7); pDisc(x,cx,cy+1,sz,D); pDisc(x,cx-Math.round(sz*0.45),cy+2,Math.round(sz*0.6),D); pDisc(x,cx+Math.round(sz*0.45),cy+2,Math.round(sz*0.6),D);
  pDisc(x,cx,cy,sz-1,M); pDisc(x,cx-Math.round(sz*0.4),cy+1,Math.round(sz*0.5),M); pDisc(x,cx+Math.round(sz*0.4),cy+1,Math.round(sz*0.5),M);
  pDisc(x,cx-Math.round(sz*0.25),cy-Math.round(sz*0.3),Math.round(sz*0.45),L); if (sz>=4) pDisc(x,cx-Math.round(sz*0.35),cy-Math.round(sz*0.45),Math.max(1,Math.round(sz*0.2)),HL);
  return c; }
function buildFarmSky(per){ const W=FSKY.W, H=FSKY.H, X0=FSKY.X0, Y0=FSKY.Y0;
  // ---- sky: 8 bands with a two-row checker blend between each ----
  const SKY = per==='night' ? ['#0b1030','#0e1438','#121a42','#16204c','#1b2756','#212e60','#28376a','#304074']
    : per==='dusk' ? ['#3c3a7a','#56448a','#784e92','#9c5a8e','#c46a82','#e2826e','#f2a066','#f8c07a']
    : ['#3f8fe0','#4f9be6','#61a8ec','#74b5f0','#89c2f3','#9fcef6','#b6daf8','#cce6fa'];
  const sky=document.createElement('canvas'); sky.width=W; sky.height=H; const a=sky.getContext('2d'), bh=Math.floor((Y0+20)/8);
  for (let k=0;k<8;k++){ a.fillStyle=SKY[k]; a.fillRect(0,k*bh,W,k===7?H:bh); }
  for (let k=1;k<8;k++){ const y=k*bh; a.fillStyle=SKY[k]; for (let x=0;x<W;x+=4) a.fillRect(x,y-3,1,1); for (let x=0;x<W;x+=2) a.fillRect(x+(k%2),y-2,1,1); for (let x=0;x<W;x++) if (x%4!==2) a.fillRect(x,y-1,1,1); }   /* ordered dither ramp: 25%, 50%, 75% of the next band */
  if (per==='night'){ const r=rnd(21); for (let i=0;i<150;i++){ const x=Math.floor(r()*W), y=Math.floor(r()*bh*6), big=i%17===0; a.fillStyle=i%5?'#c8d0f8':'#ffffff'; a.fillRect(x,y,1,1); if (big){ a.fillStyle='#8a94c8'; a.fillRect(x-1,y,1,1); a.fillRect(x+1,y,1,1); a.fillRect(x,y-1,1,1); a.fillRect(x,y+1,1,1); } } }
  { const sx2=X0+160, sy2=per==='dusk'?Y0-46:Y0-150;
    if (per==='night'){ pDisc(a,sx2,sy2,9,'#2a3470'); pDisc(a,sx2,sy2,7,'#f4eec8'); pDisc(a,sx2+3,sy2-2,6,SKY[1]); a.fillStyle='#d8d2a8'; a.fillRect(sx2-5,sy2+1,2,1); a.fillRect(sx2-3,sy2+4,1,1); }
    else { const s0=per==='dusk'?'#ffd08a':'#ffffff'; pDisc(a,sx2,sy2,15,fMix(SKY[2],s0,0.18)); pDisc(a,sx2,sy2,12,fMix(SKY[2],s0,0.35)); pDisc(a,sx2,sy2,9,per==='dusk'?'#ffb050':'#ffe066'); pDisc(a,sx2,sy2,7,per==='dusk'?'#ffc870':'#fff09a'); pDisc(a,sx2-2,sy2-2,3,'#fffbe0'); } }
  // ---- land ----
  const land=document.createElement('canvas'); land.width=W; land.height=H; const b=land.getContext('2d'), T=h=>fTone(h,per);
  const ridge=(wx,base,amp,f1,f2,ph)=>Math.round(base+amp*Math.sin(wx*f1+ph)+amp*0.35*Math.sin(wx*f2+ph*1.7));
  // far mountains: soft rounded peaks, a lit rim on top, paler snow on the tallest
  const MT=[T('#a9c4e4'),T('#c4d8ef'),T('#94b0d6'),per==='night'?'#6a78a8':T('#eef4fc')], mtTop=[];
  // a row of peaks: each is a rounded cone; the range is the tallest one at each column, with a shaded side, a lit rim and snow on top
  const PK=[]; { const r=rnd(77); for (let wx=-X0-60; wx<W-X0+60; wx+=70+Math.floor(r()*70)) PK.push([wx, 92+Math.floor(r()*44), 0.62+r()*0.35]); }
  const mh=wx=>{ let best=70; for (const [px,ph,sl] of PK){ const d=Math.abs(wx-px), h=ph - d*sl - (d*d)/900; if (h>best) best=h; } return Math.round(best); };
  for (let x=0;x<W;x++){ const wx=x-X0, h=mh(wx), y=Y0-h; mtTop.push(y); b.fillStyle=MT[0]; b.fillRect(x,y,1,H-y);
    const rising=mh(wx+4)>=mh(wx-4);   /* look a few columns either side so the shade doesn't flicker on gentle slopes */ if (!rising){ b.fillStyle=MT[2]; b.fillRect(x,y+1,1,H-y); } b.fillStyle=MT[1]; b.fillRect(x,y,1,1);
    if (h>112){ const sn=Math.min(7,Math.round((h-112)/3)+1); b.fillStyle=MT[3]; b.fillRect(x,y,1,sn); if (!rising){ b.fillStyle=T('#cfdcf0'); b.fillRect(x,y+1,1,Math.max(0,sn-1)); } } }
  // a soft haze line where the mountains meet the hills
  b.fillStyle=T('#bcd2ec'); for (let x=0;x<W;x+=2){ const wx=x-X0; b.fillRect(x, Y0-ridge(wx,60,12,1/74,1/31,2.1)-3, 1, 1); }
  // mid hills
  const HL=[T('#8fc97c'),T('#a9db8f'),T('#7ab469')], mid=[];
  for (let x=0;x<W;x++){ const wx=x-X0, h=ridge(wx,60,12,1/74,1/31,2.1), y=Y0-h; mid.push(y); b.fillStyle=HL[0]; b.fillRect(x,y,1,H-y); const sl=ridge(wx+2,60,12,1/74,1/31,2.1)-h; if (sl<0){ b.fillStyle=HL[2]; b.fillRect(x,y+1,1,Math.min(5,1-sl*3)); } b.fillStyle=HL[1]; b.fillRect(x,y,1,1); }
  // tree line along the mid hills (sprites, varied sizes), leaving room for the farm buildings
  { const trees=[farmTree(per,3),farmTree(per,4),farmTree(per,5),farmTree(per,6)], r=rnd(33); let x=10;
    while (x<W-10){ const wx=x-X0; if (wx>-290 && wx<-170){ x+=8; continue; } if (r()<0.7){ const tr=trees[Math.floor(r()*4)]; b.drawImage(tr, x-Math.floor(tr.width/2), mid[x]+3-tr.height); } x+=7+Math.floor(r()*14); } }
  // red barn with a gambrel roof, white trim and a hayloft, and a silo with a dome
  { const bx=X0-262, by=mid[X0-240]+4, R2=(x,y,w,h,c)=>{ b.fillStyle=c; b.fillRect(bx+x,by+y,w,h); };
    const RED=T('#c0463a'), RD=T('#8e2e26'), RL=T('#d8604e'), RF=T('#5a3a3a'), RFL=T('#7a5050'), WH=T('#f4efe4'), OUT=T('#3a1612');
    R2(-1,-20,34,20,OUT); R2(0,-19,32,19,RED); for (let k=3;k<32;k+=4) R2(k,-19,1,19,RD); R2(0,-19,32,1,RL);
    for (let i=0;i<6;i++){ R2(-3+i,-21-i,38-2*i,1,OUT); R2(-2+i,-21-i,36-2*i,1,i%2?RF:RFL); } for (let i=0;i<5;i++){ R2(3+i*2,-27-i,26-4*i,1,OUT); R2(4+i*2,-27-i,24-4*i,1,i%2?RFL:RF); } R2(10,-32,12,1,OUT);
    R2(11,-13,10,13,OUT); R2(12,-12,8,12,WH); R2(13,-11,6,11,RED); R2(13,-11,6,1,WH); R2(15,-11,2,11,WH); for (let k=0;k<6;k++){ R2(13+k,-11+Math.round(k*11/6),1,1,WH); R2(18-k,-11+Math.round(k*11/6),1,1,WH); }
    R2(12,-25,8,6,OUT); R2(13,-24,6,4,WH); R2(14,-23,4,3,per==='night'?'#ffe9a0':T('#3a2a2a'));
    R2(37,-38,14,38,OUT); R2(38,-37,12,37,T('#b8bccb')); R2(39,-37,3,37,T('#dadce6')); R2(47,-37,3,37,T('#9a9eb0')); for (let k=0;k<6;k++) R2(38,-31+k*6,12,1,T('#8a8ea0'));
    for (let i=0;i<5;i++){ const w=12-Math.round(i*i*0.55); R2(44-Math.floor(w/2),-38-i,w,1,i===4?OUT:T(i<2?'#9a9eb0':'#b8bccb')); } R2(43,-44,2,2,OUT); }
  // near hills: fields in curved bands that follow the hill, with hedgerows between
  { const top=[]; for (let x=0;x<W;x++){ const wx=x-X0; top.push(Y0-ridge(wx,28,7,1/58,1/24,4.0)); }
    const G=T('#6fb85a'), GR=T('#8cd070'), WHT=T('#e8c66a'), WHR=T('#d0a84e'), CR=T('#5aa84a'), CRR=T('#4a9640'), HED=T('#3d7a3a'), HEDL=T('#4f9046');
    const r=rnd(57); let x=0; const bands=[]; while (x<W){ const w=70+Math.floor(r()*110); bands.push([x, Math.min(W,x+w), Math.floor(r()*3)]); x+=w; }
    for (const [x0,x1,kind] of bands) for (let xx=x0; xx<x1; xx++){ const y=top[xx];
      b.fillStyle=G; b.fillRect(xx,y,1,H-y); b.fillStyle=GR; b.fillRect(xx,y,1,1);
      for (let k=0;k<5;k++){ const y0b=y+4+k*10, kk=(kind+k)%3, base = kk===0?WHT:kk===1?CR:G, row = kk===0?WHR:kk===1?CRR:null;
        b.fillStyle=base; b.fillRect(xx,y0b,1,9); if (row){ b.fillStyle=row; for (let yy=y0b+1; yy<y0b+9; yy+=3) b.fillRect(xx,yy,1,1); }
        b.fillStyle=HED; b.fillRect(xx,y0b+9,1,1); if (xx%3===0){ b.fillStyle=HEDL; b.fillRect(xx,y0b+8,1,1); } }
    } }
  FSKY.topCol=SKY[0]; { const d=land.getContext('2d').getImageData(W>>1,H-1,1,1).data; FSKY.botCol=`rgb(${d[0]},${d[1]},${d[2]})`; }
  FSKY.sky=sky; FSKY.land=land; FSKY.clouds=[farmCloud(per,true),farmCloud(per,false),farmCloud(per,true),farmCloud(per,false)]; FSKY.key=per; }
function drawFarmSky(ctx){ const per=(typeof period==='string')?period:'day'; if (FSKY.key!==per) buildFarmSky(per);
  const dx=OX-FSKY.X0, dy=OY-FSKY.Y0+48;
  if (dy>0){ ctx.fillStyle=FSKY.topCol; ctx.fillRect(0,0,LW,dy+1); } ctx.drawImage(FSKY.sky, dx, dy);
  const now=performance.now()/1000;
  FSKY.clouds.forEach((cl,i)=>{ const sp=[3,4.5,2.2,3.6][i], y=[92,112,78,120][i], span=FSKY.W+cl.width, cx=dx+((i*470+now*sp)%span)-cl.width; const X=Math.round(cx), Y=Math.round(dy+y); if (X>-cl.width && X<LW) ctx.drawImage(cl, X, Y); });
  ctx.drawImage(FSKY.land, dx, dy);
  ctx.fillStyle=FSKY.botCol; ctx.fillRect(0, dy+FSKY.H-1, LW, LH); }
function buildPlayerBG(){
  if ((PRD[curRoom]||{}).farm) return buildFarmBG();
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY, R=PRD[curRoom]||{}, Wc=PR_WALL[R.wall]||PR_WALL.lavender, Fc=PR_FLOOR[R.floor]||PR_FLOOR.wood;
  { const T=DECO_WALL[R.wall]||DECO_WALL.lavender, x0=ox-NY*20, W2=(N+NY)*20, yTop=oy-WH-6, H2=Math.max(N,NY)*10+WH+8, img=g.getImageData(x0,yTop,W2,H2), D2=img.data, rail=dh(T.rail||'#f8f8f8'), trim=dh(T.trim), ink=dh(INK);
    for (let x=-NY*20; x<N*20; x++){ const left=x<0, ax=left?-x:x, base=Math.floor(ax/2), top=base-WH, sh=left?0.9:1;   // the left wall sits a touch darker
      for (let yy=top-5; yy<=base; yy++){ const h=base-yy; let c;
        if (yy===top-5 || yy===base) c=ink; else if (yy<top) c=trim; else if (h===29) c=ink; else if (h>=27) c=rail; else if (h<27) c=T.low(ax,h,left); 
        if (h>29 && yy>=top) c=T.field(ax,h,left);
        if (c!==ink) c=dmul(c,sh);
        const px=x-(x0-ox), py=yy-(yTop-oy); if (px<0||py<0||px>=W2||py>=H2) continue; const i=(py*W2+px)*4; D2[i]=c[0]; D2[i+1]=c[1]; D2[i+2]=c[2]; D2[i+3]=255; } }
    g.putImageData(img,x0,yTop); }
  g.fillStyle=INK; g.fillRect(ox-1, oy-WH-5, 2, WH+6); g.fillRect(ox-NY*20-1, oy+NY*10-WH-5, 1, WH+6); g.fillRect(ox+N*20, oy+N*10-WH-5, 1, WH+6);
  drawDoor(ox, oy, -(NY)*20, -(NY-1)*20, -1, -((NY-1)*20+5));   // door at the front of the left wall
  { const x0=ox-NY*20, x1=ox+N*20, y0=oy, y1=oy+(N+NY)*10; const img=g.getImageData(x0,y0,x1-x0,y1-y0), D=img.data, W=x1-x0;
    const hex=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)], F=Fc.map(hex), mat=hex('#3f8a5a'), mat2=hex('#2f6e46');
    for (let py=0; py<y1-y0; py++) for (let px=0; px<W; px++){ const wx=px+x0-ox, wy=py+y0-oy; const gx=(wx/20+wy/10)/2, gy=(wy/10-wx/20)/2;
      if (gx<0||gy<0||gx>=N||gy>=NY) continue; let c;
      c=(DECO_FLOOR[R.floor]||DECO_FLOOR.wood).px(gx,gy);
      const i=(py*W+px)*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
    g.putImageData(img,x0,y0); }
  // the room's name on a plaque on the right wall
  // 2x pixel letters lined up on even columns, so the wall's slant moves each letter as one piece and it stays easy to read
  { const nm=(R.name||'').toUpperCase(), maxW=N*20-28; let sc=2, lines=[nm];
    if (pfW(nm,2)+16>maxW){ const w=nm.split(' '); let best=null; for (let k=1;k<w.length;k++){ const a=w.slice(0,k).join(' '), b=w.slice(k).join(' '), m2=Math.max(pfW(a,2),pfW(b,2)); if (!best||m2<best[0]) best=[m2,a,b]; }
      if (best && best[0]+16<=maxW) lines=[best[1],best[2]]; else sc=1; }
    const tw=Math.max(24,...lines.map(l=>pfW(l,sc))), PW=tw+16+((tw+16)%2), LH2=5*sc+(sc===2?4:3), PH=lines.length*LH2+(sc===2?8:7);
    const cv=document.createElement('canvas'); cv.width=PW; cv.height=PH; const m=cv.getContext('2d');
    m.fillStyle=INK; m.fillRect(0,0,PW,PH); m.fillStyle='#f8e8b0'; m.fillRect(2,2,PW-4,PH-4); m.fillStyle='#fff6d0'; m.fillRect(2,2,PW-4,2); m.fillStyle='#c8a050'; m.fillRect(2,PH-4,PW-4,2);
    lines.forEach((l,k)=>{ let x=Math.round((PW-pfW(l,sc))/2); x-=x%2; const y=(sc===2?4:4)+k*LH2; pfDraw(m,l,x+1,y+1,'#d8b870',sc); pfDraw(m,l,x,y,'#5a3418',sc); });
    let wx=Math.round(N*10-PW/2); wx-=((wx%2)+2)%2; const top=Math.max(70, PH+40);
    for (let x=0;x<PW;x++){ const X=wx+x; g.drawImage(cv, x,0,1,PH, ox+X, oy+Math.floor(X/2)-top, 1, PH); } }
}

// ======================= FURNITURE DRAW =======================
let OX=0, OY=0;

// ======================= LLAMA ACRES BACKGROUND =======================
function buildBarnBG(){
  g = bg.getContext('2d'); g.clearRect(0,0,bg.width,bg.height);
  const ox=BGX, oy=BGY; const per=(typeof period==='string')?period:'day';
  // sky
  const sky = barnSky();
  for (let y=0;y<bg.height;y++){ g.fillStyle = sky[Math.min(2,Math.floor(y/70))]; g.fillRect(0,y,bg.width,1); }
  { const r=rnd(5); if (per==='night'){ for(let i=0;i<70;i++){ g.fillStyle=i%5?'#c8d0f8':'#f8f8f8'; g.fillRect(Math.floor(r()*bg.width), Math.floor(r()*170), 1, 1); } g.fillStyle='#f8f0c0'; g.fillRect(ox+150,oy-110,8,8); g.fillStyle=sky[0]; g.fillRect(ox+153,oy-111,6,6); }
    else if (per==='day'){ g.fillStyle='#f8e040'; g.fillRect(ox+150,oy-112,10,10); g.fillStyle='#f8f8f8'; for (const [cx,cy,w] of [[-170,-95,26],[-60,-108,20],[70,-90,30],[200,-70,22]]){ g.fillRect(ox+cx,oy+cy,w,4); g.fillRect(ox+cx+4,oy+cy-3,w-10,3); } }
    else { g.fillStyle='#f8d070'; g.fillRect(ox+150,oy-60,12,8); } }
  // LLAMA ACRES spelled out in puffy cloud letters, like skywriting
  { const txt='LLAMA ACRES'; const m=document.createElement('canvas'); m.width=80; m.height=8; const mc=m.getContext('2d');
    if (typeof pfDraw==='function') pfDraw(mc, txt, 1, 1, '#000'); const px=mc.getImageData(0,0,80,8).data;
    const on=[]; let maxX=0; for (let y=0;y<8;y++) for (let x=0;x<80;x++) if (px[(y*80+x)*4+3]>0){ on.push([x,y]); if (x>maxX) maxX=x; }
    const step=7, cx=ox+Math.round(N*20*0.5)+40, cy=oy-6; const x0=cx-Math.round((maxX+1)*step/2), y0=cy-Math.round(7*step/2);
    const night=per==='night', dusk=per==='dusk';
    const edge = night ? '#5a6498' : dusk ? '#d8a090' : '#c0d4ec', body = night ? '#9aa4d0' : dusk ? '#fbe6da' : '#ffffff', under = night ? '#7a84b8' : dusk ? '#f0c8b8' : '#dfe9f6';
    const rr=rnd(31); const pts=on.map(([x,y])=>[x0+x*step+Math.round((rr()-0.5)*1.5), y0+y*step+Math.round((rr()-0.5)*1.5), 4.6+rr()*0.8]);
    for (const [x,y,r] of pts) ellPx(x,y,r+1.3,r+1.1,edge);
    const set=new Set(on.map(([x,y])=>x+','+y)); const mids=[];
    for (const [x,y] of on) for (const [dx,dy] of [[1,0],[0,1]]) if (set.has((x+dx)+','+(y+dy))) mids.push([x0+(x+dx/2)*step, y0+(y+dy/2)*step, 4.2]);
    for (const [x,y,r] of mids) ellPx(x,y,r+1.3,r+1.1,edge);
    for (const [x,y,r] of pts) ellPx(x,y+1,r,r*0.92,under);
    for (const [x,y,r] of mids) ellPx(x,y+1,r,r*0.92,under);
    for (const [x,y,r] of mids) ellPx(x,y-0.5,r-0.6,r*0.8,body);
    for (const [x,y,r] of pts) ellPx(x,y-0.5,r-0.6,r*0.8,body);
    for (const [x,y,r] of pts) if (rr()<0.5){ g.fillStyle='#ffffff'; g.fillRect(Math.round(x-1.5),Math.round(y-2),2,1); }
    // a few wisps trailing off the ends
    for (let i=0;i<6;i++){ const sx2=x0-14-i*7, sy2=y0+20+Math.round(Math.sin(i)*3); ellPx(sx2,sy2,3-i*0.35,2.2-i*0.25,edge); ellPx(sx2,sy2,2.4-i*0.35,1.6-i*0.25,body); } }
  // rolling hills behind the fence
  const hillC = per==='night' ? ['#28485a','#2c5848'] : per==='dusk' ? ['#6a7848','#5a8848'] : ['#88c070','#68b058'];
  for (let x=-BGX;x<bg.width-BGX;x++){ const edge = x<0 ? -x/2 : x/2;
    const h1=34+Math.round(Math.sin(x/37)*10+Math.sin(x/13)*3), h2=18+Math.round(Math.sin(x/23+1)*6);
    g.fillStyle=hillC[0]; g.fillRect(ox+x, oy+edge-h1, 1, h1+1); g.fillStyle=hillC[1]; g.fillRect(ox+x, oy+edge-h2, 1, h2+1); }
  // grass + dirt path, each tile filled and edged with matching pixel steps
  const T=(gx,gy)=>{ const p=proj(gx,gy); return [ox+p[0], oy+p[1]]; };
  const isStone=(x,y)=>FARM_PATH.has(y*N+x);
  const isPath=(x,y)=>BARN_PATH.has(y*N+x)||isStone(x,y);
  for (let gy=0; gy<NY; gy++) for (let gx=0; gx<N; gx++){ const path=isPath(gx,gy), st=isStone(gx,gy);
    polyPx([T(gx,gy),T(gx+1,gy),T(gx+1,gy+1),T(gx,gy+1)], st ? (((gx+gy)%2)?'#c8bca0':'#d2c6aa') : path ? (((gx+gy)%2)?'#d8b070':'#e0bc80') : (((gx+gy)%2)?'#78c050':'#80c858')); }
  for (let gy=0; gy<NY; gy++) for (let gx=0; gx<N; gx++){ const c = isStone(gx,gy)?'#a89c80':isPath(gx,gy)?'#c09858':'#6cb048'; const a=T(gx,gy), b=T(gx+1,gy), cc=T(gx+1,gy+1), d=T(gx,gy+1);
    linePx(a[0],a[1],b[0],b[1],c); linePx(b[0],b[1],cc[0],cc[1],c); linePx(cc[0],cc[1],d[0],d[1],c); linePx(d[0],d[1],a[0],a[1],c); }
  // flagstones: each walkway tile split into four slabs with a light top edge
  for (let gy=0; gy<NY; gy++) for (let gx=0; gx<N; gx++){ if (!isStone(gx,gy)) continue;
    const m1=T(gx+0.5,gy), m2=T(gx+0.5,gy+1), m3=T(gx,gy+0.5), m4=T(gx+1,gy+0.5); linePx(m1[0],m1[1],m2[0],m2[1],'#a89c80'); linePx(m3[0],m3[1],m4[0],m4[1],'#a89c80');
    for (const [u,v] of [[0.05,0.05],[0.55,0.05],[0.05,0.55],[0.55,0.55]]){ const p1=T(gx+u+0.03,gy+v+0.02), p2=T(gx+u+0.4,gy+v+0.02); linePx(p1[0],p1[1]+1,p2[0],p2[1]+1,'#e4dac2'); } }
  // tufts, pebbles and flowers
  { const r=rnd(11); for (let i=0;i<N*NY*1.7;i++){ const gx=r()*N, gy=r()*NY; const cx=Math.floor(gx), cy=Math.floor(gy); const [x,y]=T(gx,gy); const X=Math.round(x), Y=Math.round(y);
      if (isPath(cx,cy)){ if (i%3===0){ g.fillStyle='#b89050'; g.fillRect(X,Y,2,1); } continue; }
      const k=i%9; if (k<5){ g.fillStyle='#58a038'; g.fillRect(X,Y,1,2); g.fillRect(X+2,Y-1,1,3); g.fillStyle='#98d870'; g.fillRect(X+1,Y,1,1); }
      else if (k<8){ g.fillStyle=['#f8f8f8','#f8e040','#f878b8'][k-5]; g.fillRect(X,Y,2,2); g.fillStyle='#f8c030'; g.fillRect(X,Y,1,1); } } }
  // soil edge under the front so the field sits like a little island
  for (let x=-NY*20; x<=N*20; x++){ const yb = x<= (N-NY)*10*0 + (N*20-NY*20)/2 ? 0 : 0; }
  { const L=T(0,NY), B=T(N,NY), R=T(N,0);
    const edge=(p,q)=>{ const n=Math.max(1,Math.abs(q[0]-p[0])); for (let i=0;i<=n;i++){ const x=Math.round(p[0]+(q[0]-p[0])*i/n), y=Math.round(p[1]+(q[1]-p[1])*i/n);
      g.fillStyle='#8a5a30'; g.fillRect(x,y+1,1,7); g.fillStyle='#6a4020'; g.fillRect(x,y+5,1,3); g.fillStyle=INK; g.fillRect(x,y+8,1,1); } };
    edge(L,B); edge(B,R); }
  // wooden fence along the two back edges
  const post=(x,y)=>{ g.fillStyle=INK; g.fillRect(x-2,y-21,5,22); g.fillStyle='#a87040'; g.fillRect(x-1,y-20,3,20); g.fillStyle='#c89060'; g.fillRect(x-1,y-20,1,20); g.fillStyle=INK; g.fillRect(x-1,y-22,3,1); };
  const rail=(a,b,h)=>{ linePx(a[0],a[1]-h-1,b[0],b[1]-h-1,INK); linePx(a[0],a[1]-h,b[0],b[1]-h,'#c08850'); linePx(a[0],a[1]-h+1,b[0],b[1]-h+1,'#986030'); linePx(a[0],a[1]-h+2,b[0],b[1]-h+2,INK); };
  for (const [x0,x1] of [[4,14],[15,N]]){ rail(T(x0,0),T(x1,0),15); rail(T(x0,0),T(x1,0),8); }   // gap for the gate
  rail(T(0,4),T(0,NY),15); rail(T(0,4),T(0,NY),8);
  for (let x=4;x<=N;x++){ if (x===14||x===15) continue; const p=T(x,0); post(Math.round(p[0]),Math.round(p[1])); }   // the gate draws its own posts
  for (let y=4;y<=NY;y++){ const p=T(0,y); post(Math.round(p[0]),Math.round(p[1])); }
  g = null;
}
function barnSky(){ const per=(typeof period==='string')?period:'day'; return per==='day' ? ['#78b8f0','#98ccf8','#b8e0f8'] : per==='dusk' ? ['#d86858','#f09868','#f8c890'] : ['#181c50','#222a68','#2c3a80']; }
function rebuildBG(){ sizeBG(); if (isP(curRoom) || curRoom==='account') buildPlayerBG(); else if (curRoom==='store') buildStoreBG(); else if (curRoom==='barn') buildBarnBG(); else if (curRoom==='casino') buildCasinoBG(); else if (curRoom==='arena') buildArenaBG(); else if (curRoom==='lanes') buildLanesBG(); else if (curRoom==='gym') buildGymBG(); else if (curRoom==='cove') buildCoveBG(); else if (curRoom==='jungle') buildJungleBG(); else buildBG(); }

function P(gx,gy,h=0){ const [x,y]=proj(gx,gy); return [OX+x, OY+y-h]; }
// faint wood grain on a box: broken streaks along the left face (l), right face (r) and top (t)
function grain(gx,gy,w,d,h,lift,col,faces='lrt'){
  const a=gx, b=gy, c=gx+w, e=gy+d, H=n=>{ const v=Math.sin(n*12.9898+gx*78.233+gy*37.719+h*3.1)*43758.5453; return v-Math.floor(v); };
  g.globalAlpha=0.5;
  if (h>=4) for (let v=lift+2,i=0; v<=lift+h-2; v+=3,i++){
    if (faces.includes('l') && w>=0.2){ const u0=0.06+H(i)*0.35, u1=Math.min(0.94,u0+0.2+H(i+5)*0.4); const p=P(a+w*u0,e,v), q=P(a+w*u1,e,v); linePx(p[0],p[1],q[0],q[1],col); }
    if (faces.includes('r') && d>=0.2){ const s0=0.06+H(i+9)*0.35, s1=Math.min(0.94,s0+0.2+H(i+13)*0.4); const p=P(c,b+d*s0,v+1), q=P(c,b+d*s1,v+1); linePx(p[0],p[1],q[0],q[1],col); }
  }
  if (faces.includes('t')) for (let k=1;k<4;k++){ const o=k/4+(H(k+20)-0.5)*0.08, u0=0.05+H(k+30)*0.3, u1=Math.min(0.95,u0+0.3+H(k+40)*0.4);
    const p = w>=d ? P(a+w*u0,b+d*o,lift+h) : P(a+d*0+w*o,b+d*u0,lift+h), q = w>=d ? P(a+w*u1,b+d*o,lift+h) : P(a+w*o,b+d*u1,lift+h);
    if (Math.min(w,d)>=0.15) linePx(p[0],p[1],q[0],q[1],col); }
  g.globalAlpha=1;
}
function frm(f){ const r=f.rot||0, x=f.gx, y=f.gy;
  const W=(u,v)=> r===0?[x+u,y+v]: r===1?[x+v,y+u]: r===2?[x+u,y+1-v]:[x+1-v,y+u];
  const RB=(u0,v0,du,dv)=>{ const a=W(u0,v0), b=W(u0+du,v0+dv); return [Math.min(a[0],b[0]), Math.min(a[1],b[1]), Math.abs(b[0]-a[0]), Math.abs(b[1]-a[1])]; };
  const FP=(u,v,h)=>{ const [wx,wy]=W(u,v); return P(wx,wy,h); };
  return {r, W, RB, FP, face: r<2}; }
function wbox(gx,gy,w,d,h,top,lf,rf,inset=0,lift=0,col='#5a3418',faces='lrt'){ box(gx,gy,w,d,h,top,lf,rf,inset,lift); grain(gx+inset,gy+inset,w-2*inset,d-2*inset,h,lift,col,faces); }
// tiles a piece covers: most are one tile, the bed is two long (along x when rot is 0/2, along y when 1/3)
const FURN_DIM={dbed:[2,2],rug_persian:[3,2],rug_round:[2,2],rug_stripe:[3,1],rug_shag:[2,2],rug_mat_green:[2,1],rug_mat_red:[2,1],rug_mat_blue:[2,1],rug_mat_coir:[2,1],rug_mat_pink:[2,1],rug_mat_purple:[2,1]};   // rugs: width x depth, swapped when turned
const FURN_SIZE={bed:2,loveseat:2,sofa:3,bigtv:2}, FURN_SIDEWAYS=new Set(['loveseat','sofa']);   // couches run along their back, so they turn the other way
function furnTiles(item,gx,gy,rot){ rot=rot||0; if (FURN_DIM[item]){ let [W,D]=FURN_DIM[item]; if (rot%2) [W,D]=[D,W]; const o=[]; for (let i=0;i<W;i++) for (let j=0;j<D;j++) o.push([gx+i,gy+j]); return o; } const bi=(typeof furnBase==='function')?furnBase(item):item, n=FURN_SIZE[bi]||1, alongY = FURN_SIDEWAYS.has(bi) ? (rot===0||rot===3) : rot%2===1, out=[]; for (let k=0;k<n;k++) out.push(alongY ? [gx,gy+k] : [gx+k,gy]); return out; }
function box(gx,gy,w,d,h,top,lf,rf,inset=0,lift=0){
  const a=gx+inset, b=gy+inset, c=gx+w-inset, e=gy+d-inset;
  polyPx([P(a,e,lift),P(c,e,lift),P(c,e,lift+h),P(a,e,lift+h)],lf);
  polyPx([P(c,b,lift),P(c,e,lift),P(c,e,lift+h),P(c,b,lift+h)],rf);
  polyPx([P(a,b,lift+h),P(c,b,lift+h),P(c,e,lift+h),P(a,e,lift+h)],top);
  const L=(p,q)=>linePx(p[0],p[1],q[0],q[1],INK);
  L(P(a,b,lift+h),P(c,b,lift+h)); L(P(a,b,lift+h),P(a,e,lift+h)); L(P(a,e,lift+h),P(c,e,lift+h)); L(P(c,b,lift+h),P(c,e,lift+h));
  L(P(a,e,lift+h),P(a,e,lift)); L(P(c,e,lift+h),P(c,e,lift)); L(P(c,b,lift+h),P(c,b,lift));
  L(P(a,e,lift),P(c,e,lift)); L(P(c,b,lift),P(c,e,lift));
  // shared finish for every box in the game: a light rim just inside the top's front edges, and a soft dark band at the foot of each side
  if (w-2*inset>=0.12 && d-2*inset>=0.12){ const hi=tint(top,0.28); if (hi){ const S1=(p,q)=>linePx(p[0],p[1]-1,q[0],q[1]-1,hi); S1(P(a,e,lift+h),P(c,e,lift+h)); S1(P(c,b,lift+h),P(c,e,lift+h)); } }
  if (h>=4){ const dl=tint(lf,-0.22), dr=tint(rf,-0.22); if (dl && c-a>=0.12){ const p=P(a,e,lift+1), q=P(c,e,lift+1); linePx(p[0]+1,p[1],q[0]-1,q[1],dl); } if (dr && e-b>=0.12){ const p=P(c,b,lift+1), q=P(c,e,lift+1); linePx(p[0]-1,p[1],q[0]+1,q[1],dr); } }
}
// lighten (k>0) or darken (k<0) a #rrggbb colour; cached because boxes are drawn every frame
const TINT=new Map();
function recol(hex, base, ref){ if (!base) return hex; const m=/^#([0-9a-f]{6})$/i.exec(hex); if (!m) return hex; const n=parseInt(m[1],16), L=(0.3*(n>>16&255)+0.59*(n>>8&255)+0.11*(n&255))/255;
  return tint(base, Math.max(-0.8, Math.min(0.8, (L-ref)*1.6))) || hex; }
function tint(col, k){ const key=col+k; if (TINT.has(key)) return TINT.get(key); let out=null; const m=/^#([0-9a-f]{6})$/i.exec(col||'');
  if (m){ const n=parseInt(m[1],16), ch=[n>>16&255, n>>8&255, n&255].map(v=>Math.round(k>0 ? v+(255-v)*k : v*(1+k))); out='#'+ch.map(v=>v.toString(16).padStart(2,'0')).join(''); }
  TINT.set(key,out); return out; }
const JUKE = ['#f84848','#f8d030','#48c048','#58b8f8','#b058e0'];
// padded loveseat armrest: chunky block with a soft rounded top and a rolled front end
function sofaArmrest(y0){
  const D=0.18, H=15, x0=0.2, x1=0.94;
  box(x0,y0,x1-x0,D,H,'#e86890','#b83868','#902850');
  // soft top: lighter centre stripe + shine
  const [a1,b1]=P(x0+0.06,y0+D/2,H), [a2,b2]=P(x1-0.08,y0+D/2,H); linePx(a1,b1,a2,b2,'#f898b8');
  const [c1,d1]=P(x0+0.2,y0+D/2,H), [c2,d2]=P(x0+0.45,y0+D/2,H); linePx(c1,d1-1,c2,d2-1,'#fcc8d8');
  // stitched seam along the side
  { const [s1,t1]=P(x0+0.08,y0+D,H-4), [s2,t2]=P(x1-0.06,y0+D,H-4); for (let k=0;k<=1;k+=0.12){ g.fillStyle='#902850'; g.fillRect(Math.round(s1+(s2-s1)*k), Math.round(t1+(t2-t1)*k), 1, 1); } }
  // rolled end cap facing the room
  const [ex,ey]=P(x1,y0+D/2,H-4); ellPx(ex,ey,4,4,INK); ellPx(ex,ey,3,3,'#c84878'); ellPx(ex-1,ey-1,1.5,1.5,'#e86890');
}

// slot machine symbols, 5x5 each
const SLOT_SYMS = [
  {n:'CHERRY', c:'#e02838', r:['...#.','..#..','.#.#.','##.##','##.##']},
  {n:'LEMON',  c:'#f8d030', r:['.###.','#####','#####','#####','.###.']},
  {n:'CARROT', c:'#f07818', r:['...##','..##.','.##..','##...','#....']},
  {n:'BELL',   c:'#e0a020', r:['..#..','.###.','.###.','#####','..#..']},
  {n:'SEVEN',  c:'#c02838', r:['#####','...#.','..#..','.#...','.#...']},
  {n:'LLAMA',  c:'#a06808', r:['#...#','#####','.###.','.#.#.','.###.']},
];
// big 16x16 versions for the slot pop-up (same order as SLOT_SYMS)
const SLOT_BIG_PAL={K:'#181020',r:'#e02838',d:'#982028',w:'#fff0f0',p:'#f88898',g:'#388030',G:'#68b848',y:'#f8d030',Y:'#c89018',o:'#f07818',O:'#b85010',c:'#f0e4c8',C:'#c8b08c',m:'#d8a868',M:'#a87040'};
const SLOT_BIG_ROWS={
  cherry:["............KK..", "..........KKGGK.", ".........KGGgGK.", "........KggKKK..", ".......KggK.....", ".......KgKgK....", "......KgKKgK....", "...KKKgK.KgK....", "..KrrrgK.KgKK...", ".KrrprrKKrprrK..", "KrrwwrrrrrwrrrK.", "KrrwrrdrrwwrrrK.", "KrrrrrdrrrrrrdK.", ".KrddddKrrrrddK.", "..KrrrK.KrdddK..", "...KKK...KKKK..."],
  lemon:["................", "...........KK...", "......KKKKKGGK..", "....KKyyyyGggK..", "...KyyywyyyyK...", "..KyywwyyyyyyK..", ".KyywwyyyyyyyyK.", ".KyyyyyyyyyyyyKK", "Kyyyyyyyyyyyyyyy", "KyyyyyyyyyyyooyK", ".KyyyyyyyyyyoyK.", "..KyoyyyyyoooK..", "...KyyoooooyK...", "....KKyyyyKK....", "......KKKK......", "................"],
  carrot:["...........KK...", "..........KGGKK.", "........KKGGgKgK", ".......KooGoKGK.", "......KoooGoggGK", "......KoooGgOKGG", ".....KoooooGGGKK", ".....KoowoOOOK..", "....KoowoOOOK...", "...KoowoOOOK....", "...KowoOOKK.....", "..KowoOKK.......", "..KooOK.........", ".KooKK..........", ".KoK............", "..K............."],
  bell:["......KYYK......", "......KYYK......", ".....KyyYYK.....", "....KywyyYYK....", "...KywwyyyYYK...", "...KywyyyyYYK...", "...KywyyyyyYK...", "...KwyyyyyyYK...", "..KywyyyyyyYYK..", "..KywyyyyyyyYK..", ".KyyyyyyyyyyYYK.", ".KyyyyyyyyyyYYK.", "KYYYYYYYYYYYYYYK", ".KKKKKYYYYKKKKK.", ".....KYYYYK.....", "......KKKK......"],
  seven:["................", "..KKKKKKKKKKKK..", ".KwwwwwrrrrrrrK.", ".KwrrrrrrrrrrrK.", ".KddddddddddddK.", ".KwrrKKKKKrrrdK.", ".KwrrK..KrrrdK..", "..KKK...KrrrdK..", ".......KrrrdK...", ".......KrrrdK...", "......KrrrdK....", ".....KrrrdK.....", ".....KrrrdK.....", "....KrrrdK......", ".....KKKK.......", "................"],
  llama:["...KcK....KcK...", "...KccK..KccK...", "...KcpKKKKpcK...", "...KcpcccKpcK...", "...KccccccccK...", "...KccccccccK...", "..KccwKccwKCCK..", "..KccKKccKKCCK..", "...KpccccccpK...", "...KcccccccCK...", "...KcmmmmmMcK...", "....KmmmmmMK....", "....KmKmmKMK....", "....KmmmmmMK....", "....KmmMMmMK....", ".....KmmmMK....."]
};
const SLOT_BIG=['cherry','lemon','carrot','bell','seven','llama'].map(k=>{ const mk=(blur)=>{ const cv=document.createElement('canvas'); cv.width=16; cv.height=16; const x=cv.getContext('2d');
    SLOT_BIG_ROWS[k].forEach((row,j)=>{ for (let i=0;i<16;i++){ const ch=row[i]; if (ch==='.') continue; let col=SLOT_BIG_PAL[ch];
      if (blur) col = ch==='K' ? '#8880a0' : '#c8c0d8'; x.fillStyle=col; x.fillRect(i,j,1,1); } }); return cv; };
  return {img:mk(false), blur:mk(true)}; });
function drawSlotSym(i, x, y, blur){ const S=SLOT_SYMS[i]; g.fillStyle=blur?'#b8b8c8':S.c; S.r.forEach((row,j)=>{ for (let k=0;k<5;k++) if (row[k]==='#') g.fillRect(x+k,y+j,1,1); }); }
// fluffy pixel cloud with a label and an arrow (used for the doorway signs)
function drawCloudSign(cx, cy, text, arrow, t, sc=1){
  const tw=(typeof pfW==='function')?pfW(text,sc):text.length*4*sc; const w=Math.max(30, tw+16*sc), h=8+5*sc; const x0=Math.round(cx-w/2), y0=Math.round(cy-h/2);
  const puffs=[[0,0,w/2,h/2],[-w/4,-3*sc,w/4,6*sc],[w/4,-3*sc,w/4,6*sc],[0,-4*sc,w/5,6*sc],[-w/2+4*sc,2,5*sc,4*sc],[w/2-4*sc,2,5*sc,4*sc]];
  for (const [dx,dy,rx,ry] of puffs) ellPx(cx+dx,cy+dy,rx+1,ry+1,INK);
  for (const [dx,dy,rx,ry] of puffs) ellPx(cx+dx,cy+dy,rx,ry,'#f8f8f8');
  ellPx(cx-w/4,cy-4,w/6,3,'#ffffff'); g.fillStyle='#d8e0f0'; g.fillRect(x0+4,y0+h-2,w-8,1);
  // centre the text on the cloud's visible middle (puffs rise above the base ellipse)
  const visTop=cy-10*sc, visBot=cy+h/2, vc=(visTop+visBot)/2;
  if (typeof pfDraw==='function') pfDraw(g, text, Math.round(cx-tw/2), Math.round(vc-2.5*sc), '#3858a8', sc);
  const bob=Math.floor(t*3)%2;
  g.fillStyle=INK;
  if (arrow==='none'){}
  else if (arrow==='down'){ const ax=Math.round(cx), ay=y0+h+3+bob; g.fillRect(ax-1,ay-1,3,5); g.fillRect(ax-4,ay+3,9,1); g.fillRect(ax-3,ay+4,7,1); g.fillRect(ax-2,ay+5,5,1); g.fillRect(ax-1,ay+6,3,1); g.fillStyle='#f8d030'; g.fillRect(ax,ay,1,4); g.fillRect(ax-2,ay+4,5,1); g.fillRect(ax-1,ay+5,3,1); }
  else { const ax=x0-6-bob, ay=Math.round(cy); g.fillRect(ax-1,ay-4,1,9); g.fillRect(ax,ay-3,1,7); g.fillRect(ax+1,ay-2,1,5); g.fillRect(ax+2,ay-1,6,3); g.fillStyle='#f8d030'; g.fillRect(ax+1,ay-1,1,3); g.fillRect(ax+2,ay,5,1); g.fillRect(ax,ay-2,1,5); }
}
// tall potted saguaro: terracotta pot with rim, ribbed rounded trunk, two curved arms, spines and a bloom
function drawSaguaro(f, sx, sy, t){
  const ox=f.ox||0, oy=f.oy||0, fl=f.flip?-1:1; { const [x,y]=P(f.gx+0.5+ox,f.gy+0.5+oy); sx=Math.round(x); sy=Math.round(y); }
  box(f.gx+0.27+ox,f.gy+0.27+oy,0.46,0.46,8,'#e07848','#c05830','#984020');
  box(f.gx+0.22+ox,f.gy+0.22+oy,0.56,0.56,3,'#f09868','#d06838','#a84828',0,8);
  ellPx(sx,sy-11,5,2,'#5a3018'); g.fillStyle='#7a4828'; g.fillRect(sx-3,sy-12,2,1); g.fillRect(sx+2,sy-11,1,1);
  const D='#2a7a38', M='#48a048', L='#70c860', H2='#a0e088';
  // a rounded vertical stalk: ink outline, then ribbed fill (dark edge, mid, light rib, mid, dark edge)
  const stalk=(x0,w,top,bot)=>{ g.fillStyle=INK; g.fillRect(x0-1,top+1,w+2,bot-top-1); g.fillRect(x0,top,w,1);
    for (let i=0;i<w;i++){ const c = i===0||i===w-1 ? D : (i===Math.floor(w/2)-1 ? L : (i===Math.floor(w/2) ? H2 : M)); g.fillStyle=c; g.fillRect(x0+i, top+(i===0||i===w-1?2:1), 1, bot-top-(i===0||i===w-1?2:1)); } };
  // arms first (behind the trunk): elbow out, then up
  const arm=(dir, y, out, up)=>{ const xE = dir<0 ? sx-4-out : sx+4; g.fillStyle=INK; g.fillRect(xE-1, y-1, out+2, 6);
    g.fillStyle=M; g.fillRect(xE, y, out, 4); g.fillStyle=D; g.fillRect(xE, y+3, out, 1); g.fillStyle=L; g.fillRect(xE, y+1, out, 1);
    const ax = dir<0 ? sx-4-out : sx+4+out-5; stalk(ax, 5, y-up, y+4); };
  arm(-fl, sy-28, 5, 12);
  arm( fl, sy-36, 5, 10);
  stalk(sx-4, 8, sy-52, sy-11);
  // spines along the ribs
  g.fillStyle='#f8f8e0'; for (let k=0;k<8;k++){ g.fillRect(sx-5, sy-48+k*5, 1, 1); g.fillRect(sx+4, sy-46+k*5, 1, 1); if (k%2) g.fillRect(sx, sy-47+k*5, 1, 1); }
  for (const [x,y] of [[sx-11*fl+(fl<0?-1:0),sy-38],[sx-11*fl+(fl<0?-1:0),sy-32],[sx+8*fl+(fl<0?-1:0),sy-44],[sx+8*fl+(fl<0?-1:0),sy-38]]) g.fillRect(x,y,1,1);
  // bloom on top, gently swaying
  const sw=Math.round(Math.sin(t*1.2)); g.fillStyle=INK; g.fillRect(sx-3+sw,sy-56,6,4); g.fillStyle='#f878b8'; g.fillRect(sx-2+sw,sy-55,4,2); g.fillStyle='#fcc0dc'; g.fillRect(sx-2+sw,sy-55,1,1); g.fillStyle='#f8d030'; g.fillRect(sx+sw,sy-55,1,1);
}
// a little pile of shiny apples on the grass (eaten ones leave a core while they grow back)
function drawApple(x,y,big){ const r=big?4:3.4; ellPx(x,y,r+1,r+0.6,INK); ellPx(x,y,r,r-0.4,'#d82838'); ellPx(x+1,y+1,r-1.2,r-1.6,'#a01828'); ellPx(x-1,y-1,r-2,r-2.2,'#f05858');
  g.fillStyle='#ffd0d0'; g.fillRect(Math.round(x-2),Math.round(y-2),1,1); g.fillStyle=INK; g.fillRect(Math.round(x),Math.round(y-r-1),1,2); g.fillStyle='#6a4020'; g.fillRect(Math.round(x),Math.round(y-r),1,1);
  g.fillStyle=INK; g.fillRect(Math.round(x)+1,Math.round(y-r-2),3,2); g.fillStyle='#58b040'; g.fillRect(Math.round(x)+1,Math.round(y-r-1),2,1); g.fillStyle='#88d860'; g.fillRect(Math.round(x)+2,Math.round(y-r-2),1,1); }
function drawAppleCore(x,y){ g.fillStyle=INK; g.fillRect(x-2,y-6,4,7); g.fillStyle='#f8f0c8'; g.fillRect(x-1,y-5,2,5); g.fillStyle='#d82838'; g.fillRect(x-2,y-6,4,1); g.fillRect(x-2,y,4,1); g.fillStyle='#6a4020'; g.fillRect(x,y-8,1,2); }
// market stall: plank counter on four posts under a striped, scalloped awning with a name board on top
function drawStall(f, sx, sy, t){
  const gx=f.gx, gy=f.gy, cider=f.t==='cider', W=f.w||1; const PP=(u,v,h=0)=>P(gx+u*W,gy+v,h);
  { const [cx,cy]=PP(0.5,0.5); sx=Math.round(cx); sy=Math.round(cy); }
  const A1=cider?'#d83838':'#3a9a48', A2='#f8f0e0', A1d=cider?'#a82830':'#2a7838', A2d='#d8ccb0';
  const post=(u,v,h)=>{ const [x,y]=PP(u,v); const X=Math.round(x), Y=Math.round(y); g.fillStyle=INK; g.fillRect(X-2,Y-h,4,h+1); g.fillStyle='#a87040'; g.fillRect(X-1,Y-h,2,h); g.fillStyle='#c89060'; g.fillRect(X-1,Y-h,1,h); };
  ellPx(sx,sy+1,16*W,6*W,'rgba(40,80,20,0.3)');
  post(0.12,0.3,40); post(0.88,0.3,40);
  // counter with planks
  box(gx+0.1,gy+0.4,W-0.2,0.5,12,'#c88a50','#a86a34','#7e4c24');
  for (const v of [4,8]){ linePx(...PP(0.1,0.9,v),...PP(0.9,0.9,v),'#7e4c24'); linePx(...PP(0.9,0.4,v),...PP(0.9,0.9,v),'#5e3418'); }
  box(gx+0.06,gy+0.36,W-0.12,0.58,2,'#e0a868','#c88a50','#9a6434',0,12);
  if (cider){
    // cider barrel with a brass tap, steaming cups, a basket of apples
    { const [x,y]=PP(0.3,0.52,14); const X=Math.round(x), Y=Math.round(y);
      g.fillStyle=INK; g.fillRect(X-6,Y-14,13,15); g.fillStyle='#a8682c'; g.fillRect(X-5,Y-13,11,13); g.fillStyle='#c8884c'; g.fillRect(X-3,Y-13,3,13);
      g.fillStyle='#585868'; g.fillRect(X-5,Y-11,11,1); g.fillRect(X-5,Y-3,11,1); ellPx(X,Y-14,5.5,2,'#7e4c24'); ellPx(X,Y-14,4,1.2,'#a8682c');
      g.fillStyle=INK; g.fillRect(X+5,Y-7,4,3); g.fillStyle='#f8d030'; g.fillRect(X+6,Y-6,2,1); }
    for (const [u,v] of [[0.5,0.68],[0.6,0.58],[0.7,0.68]]){ const [x,y]=PP(u,v,14); const X=Math.round(x), Y=Math.round(y);
      g.fillStyle=INK; g.fillRect(X-2,Y-6,6,7); g.fillRect(X+4,Y-4,2,3); g.fillStyle='#f0e8d8'; g.fillRect(X-1,Y-5,4,5); g.fillStyle='#c87028'; g.fillRect(X-1,Y-5,4,1);
      const st=Math.floor(t*3+u*10)%3; g.fillStyle='rgba(255,255,255,0.75)'; g.fillRect(X+(st===1?1:0),Y-9-st,1,2); g.fillRect(X+2-(st===2?1:0),Y-11+st%2,1,2); }
    { const [x,y]=PP(0.62,0.98); const X=Math.round(x), Y=Math.round(y); g.fillStyle=INK; g.fillRect(X-6,Y-6,13,7); g.fillStyle='#c89858'; g.fillRect(X-5,Y-5,11,5); g.fillStyle='#a07038'; g.fillRect(X-5,Y-3,11,1);
      for (const [dx,dy] of [[-3,-7],[1,-7],[-1,-9],[4,-7]]){ ellPx(X+dx,Y+dy,2.2,2,INK); ellPx(X+dx,Y+dy,1.6,1.4,'#d82838'); g.fillStyle='#f87070'; g.fillRect(X+dx-1,Y+dy-1,1,1); } }
  } else {
    // caramel apples on sticks, a stack of corn, a pie on a cake stand
    for (const [u,v] of [[0.16,0.5],[0.22,0.62],[0.28,0.5],[0.34,0.62],[0.4,0.5]]){ const [x,y]=PP(u,v,14); const X=Math.round(x), Y=Math.round(y);
      g.fillStyle=INK; g.fillRect(X,Y-10,1,3); ellPx(X,Y-4,3,3,INK); ellPx(X,Y-4,2.2,2.2,'#d82838'); g.fillStyle='#d89838'; g.fillRect(X-2,Y-7,5,2); g.fillStyle='#f8a0a0'; g.fillRect(X+1,Y-4,1,1); g.fillStyle='#e8d0a0'; g.fillRect(X,Y-9,1,2); }
    { const [x,y]=PP(0.72,0.48,14); const X=Math.round(x), Y=Math.round(y);
      g.fillStyle=INK; g.fillRect(X-4,Y-1,9,2); g.fillRect(X-1,Y-4,3,4); g.fillStyle='#d8d8e8'; g.fillRect(X-3,Y-1,7,1);
      g.fillStyle=INK; g.fillRect(X-5,Y-9,11,5); g.fillStyle='#c88a50'; g.fillRect(X-4,Y-8,9,3); g.fillStyle='#e8c070'; g.fillRect(X-4,Y-8,9,1); g.fillStyle='#a86a34'; g.fillRect(X-2,Y-7,1,1); g.fillRect(X+2,Y-7,1,1); }
    for (const [u,v,k] of [[0.56,0.8,0],[0.66,0.76,1],[0.61,0.74,2]]){ const [x,y]=PP(u,v,14+k*2); const X=Math.round(x), Y=Math.round(y);
      g.fillStyle=INK; g.fillRect(X-4,Y-2,9,4); g.fillStyle='#f8d030'; g.fillRect(X-3,Y-1,6,2); g.fillStyle='#d8a818'; g.fillRect(X-2,Y,1,1); g.fillRect(X,Y-1,1,1); g.fillStyle='#58a840'; g.fillRect(X+3,Y-1,2,2); }
  }
  post(0.12,0.92,34); post(0.88,0.92,34);
  // awning: slopes from the back posts down to the front, stripes run front to back, scalloped front edge
  const n=8*W, H0=42, H1=34, u0=0.02, u1=0.98, vb=0.24, vf=1.02;
  for (let k=0;k<n;k++){ const a=u0+(u1-u0)*k/n, b=u0+(u1-u0)*(k+1)/n, c=k%2?A2:A1;
    polyPx([PP(a,vb,H0),PP(b,vb,H0),PP(b,vf,H1),PP(a,vf,H1)],c);
    const m=(a+b)/2, [x,y]=PP(m,vf,H1); ellPx(x,y+1,2.6,2.2,INK); ellPx(x,y+0.5,1.9,1.6,k%2?A2d:A1d); }
  { const L=(p1,p2)=>linePx(p1[0],p1[1],p2[0],p2[1],INK); L(PP(u0,vb,H0),PP(u1,vb,H0)); L(PP(u1,vb,H0),PP(u1,vf,H1)); L(PP(u0,vb,H0),PP(u0,vf,H1)); L(PP(u0,vf,H1),PP(u1,vf,H1)); }
  // name board standing on the awning
  { const name=cider?'APPLE CIDER':'FARM SNACKS', tw=pfW(name), w=tw+10, h=11; const [x,y]=PP(0.5,0.45,H0-2); const bx=Math.round(x-w/2), by=Math.round(y-h);
    g.fillStyle=INK; g.fillRect(bx+3,by+h,1,3); g.fillRect(bx+w-4,by+h,1,3);
    g.fillStyle=INK; g.fillRect(bx+1,by,w-2,h); g.fillRect(bx,by+1,w,h-2); g.fillStyle=A2; g.fillRect(bx+1,by+1,w-2,h-2); g.fillStyle=A1; g.fillRect(bx+1,by+h-3,w-2,2);
    pfDraw(g,name,bx+5,by+2,cider?'#a82830':'#2a6830');
    g.fillStyle=cider?'#d82838':'#f8d030'; g.fillRect(bx+2,by+3,2,2); g.fillRect(bx+w-4,by+3,2,2); }
}
// classic bubbler jukebox: walnut body, arched glass dome ringed by colour tubes, spinning record, chrome grille
// draw a piece into a scratch canvas, then put it down with the same 1-pixel INK outline every other piece has
const INKO={cv:null, x:null};
function inkOutline(sx, sy, draw){
  const W=96, H=140, x0=Math.round(sx)-48, y0=Math.round(sy)-124;
  if (!INKO.cv){ INKO.cv=document.createElement('canvas'); INKO.cv.width=W; INKO.cv.height=H; INKO.x=INKO.cv.getContext('2d', {willReadFrequently:true}); }
  const sc=INKO.x, keep=g; sc.setTransform(1,0,0,1,0,0); sc.clearRect(0,0,W,H); sc.imageSmoothingEnabled=false; sc.setTransform(1,0,0,1,-x0,-y0);
  g=sc; try { draw(); } finally { g=keep; }
  sc.setTransform(1,0,0,1,0,0); const img=sc.getImageData(0,0,W,H), D=img.data, solid=i=>D[i*4+3]>200;
  const edge=[]; for (let y=0;y<H;y++) for (let x=0;x<W;x++){ const i=y*W+x; if (D[i*4+3]>200) continue;
    if ((x>0&&solid(i-1))||(x<W-1&&solid(i+1))||(y>0&&solid(i-W))||(y<H-1&&solid(i+W))) edge.push(i); }
  const ink=[parseInt(INK.slice(1,3),16),parseInt(INK.slice(3,5),16),parseInt(INK.slice(5,7),16)];
  for (const i of edge){ D[i*4]=ink[0]; D[i*4+1]=ink[1]; D[i*4+2]=ink[2]; D[i*4+3]=255; }
  sc.putImageData(img,0,0); g.drawImage(INKO.cv, x0, y0); }
function drawJukebox(f, sx, sy, t){
  const gx=f.gx, x0=gx+0.1, x1=gx+0.9, yB=f.gy+0.36, yF=f.gy+0.8, on=jukeOn(), BASE=30, ARCH=13, r=(x1-x0)/2, cxm=(x0+x1)/2;
  const vtop=x=>BASE+ARCH*Math.sqrt(Math.max(0,1-((x-cxm)/r)**2));
  const px=(x,y,v,c)=>{ const [X,Y]=P(x,y,v); g.fillStyle=c; g.fillRect(Math.round(X),Math.round(Y),1,1); };
  ellPx(sx,sy+1,15,5,'rgba(0,0,0,0.25)');
  // solid body: arch silhouettes stacked from back to front (top shading), then the side face
  for (let y=yB; y<yF; y+=0.04) for (let x=x0; x<=x1+0.001; x+=0.05){ const [X,Yt]=P(x,y,vtop(x)), [,Yb]=P(x,y,0); g.fillStyle = y<yB+0.05 ? INK : '#5a2c18'; g.fillRect(Math.round(X),Math.round(Yt),1,Math.round(Yb-Yt)+1); }
  for (let y=yB; y<=yF; y+=0.02){ const [X,Yt]=P(x1,y,vtop(x1)), [,Yb]=P(x1,y,0); g.fillStyle = y>yF-0.03 ? INK : '#6a3820'; g.fillRect(Math.round(X),Math.round(Yt),1,Math.round(Yb-Yt)+1);
    if (y>yB+0.06 && y<yF-0.06){ px(x1,y,6,'#e0b048'); px(x1,y,BASE-1,'#e0b048'); } }
  // top of the arch: a light rim so the dome reads as rounded
  for (let x=x0; x<=x1+0.001; x+=0.05) px(x,yB+0.04,vtop(x)+1,INK);
  // front face, column by column
  const cols=Math.round((x1-x0)/0.05); const sh=on?Math.floor(t*8):0;
  for (let i=0;i<=cols;i++){ const x=x0+i*0.05, top=Math.round(vtop(x)), edge=i<=1||i>=cols-1, pillar=i<=3||i>=cols-3;
    for (let v=0; v<=top; v++){ let c;
      if (edge || v===top) c=INK;
      else if (v<=2) c = v===2 ? '#e0b048' : '#5a2c18';
      else if (pillar && v<top-2){ const k=Math.floor((v*0.5+(i<4?0:2)-(on?t*6:0)))%JUKE.length; c = on ? JUKE[(k+JUKE.length)%JUKE.length] : '#8a5a9a'; if (on && (v+Math.floor(t*14)+i*3)%9===0) c='#ffffff'; }
      else if (v>=top-2) c = on ? JUKE[(Math.floor(i/2)+sh)%JUKE.length] : '#a878c8';
      else if (v<=13){ c = (i%2) ? '#2a1830' : '#d8a840'; if (v===3||v===13) c='#e0b048'; }
      else if (v<=15) c = v===14 ? '#f0f0f8' : '#a8a8b8';
      else if (v<=27){ c='#30204a'; }
      else c = (v+i)%7===0 ? '#e8d0f8' : (on ? '#c088e8' : '#9068b0');
      px(x,yF,v,c); } }
  // record behind the window: black disc, coloured label, a sheen that turns while it plays
  { const [cx,cy]=P(cxm,yF,21.5); const ang=on?t*5:0; ellPx(cx,cy,5.5,5,INK); ellPx(cx,cy,4.6,4.2,'#282030'); ellPx(cx,cy,1.8,1.6,'#f84848'); g.fillStyle='#f8d030'; g.fillRect(Math.round(cx),Math.round(cy),1,1);
    g.fillStyle='#8878a0'; g.fillRect(Math.round(cx+Math.cos(ang)*3.4),Math.round(cy+Math.sin(ang)*3),1,1); g.fillRect(Math.round(cx-Math.cos(ang)*3.4),Math.round(cy-Math.sin(ang)*3),1,1); }
  // song-select buttons under the window
  for (let k=0;k<4;k++){ const [X,Y]=P(x0+0.22+k*0.12,yF,15); g.fillStyle=(on && Math.floor(t*2)%4===k)?'#f8d030':'#f8f8f8'; g.fillRect(Math.round(X),Math.round(Y)-1,1,1); }
}
// a stream of music notes drifting up while it plays: single and double notes in the tube colours, swaying and fading out.
// Drawn after the jukebox's ink outline so the notes stay borderless.
function drawJukeNotes(sx, sy, t){ const on=jukeOn();
  if (on){ for (let k=0;k<5;k++){ const ph=(t*0.35+k/5)%1; const nx=Math.round(sx-14+((k*11)%26)+Math.sin(t*2.2+k*1.7)*5+ph*8), ny=Math.round(sy-48-ph*54);
      g.globalAlpha = ph>0.75 ? (1-ph)/0.25 : Math.min(1,ph*6); const col=JUKE[k%JUKE.length], dbl=k%3===1;
      // borderless pixel notes: the tube colour, a light highlight on the head and a darker shade underneath (single = flag, double = beamed pair)
      const spr = dbl ? JNOTE2 : JNOTE1, shades={c:col, d:jShade(col,-0.38), h:jShade(col,0.55)};
      for (let r=0;r<spr.length;r++) for (let q=0;q<spr[r].length;q++){ const ch=spr[r][q]; if (ch==='.') continue; g.fillStyle=shades[ch]; g.fillRect(nx+q-3, ny+r-7, 1, 1); }
      g.globalAlpha=1; } }
}
// jukebox note sprites (c = colour, h = highlight, d = shade) and a colour helper
const JNOTE1=['...cc.','...cdc','...c.d','...c..','...c..','.ccc..','chcc..','cccd..','.dd...'];
const JNOTE2=['...cccccc','...dddddd','...c....c','...c....c','...c....c','.ccc..ccc','chcc.chcc','cccd.cccd','.dd...dd.'];
function jShade(hex, f){ const n=parseInt(hex.slice(1),16); let r=n>>16, g2=(n>>8)&255, b=n&255; const m=v=>Math.max(0,Math.min(255,Math.round(f<0 ? v*(1+f) : v+(255-v)*f)));
  return '#'+[m(r),m(g2),m(b)].map(v=>v.toString(16).padStart(2,'0')).join(''); }
// upright arcade cabinet: side profile with an overhanging marquee, slanted screen, control panel with stick and buttons
function drawArcade3D(f, sx, sy, t){
  const gx=f.gx, gy=f.gy, x0=gx+0.14, x1=gx+0.86;
  const PRO=[[0.1,0],[0.86,0],[0.86,17],[0.94,19],[0.66,23],[0.62,24],[0.52,41],[0.8,42],[0.8,51],[0.1,51]];
  const Q=(pts,c)=>polyPx(pts,c);
  const at=(x,[y,v])=>P(x,gy+y,v);
  ellPx(sx,sy+1,14,5,'rgba(0,0,0,0.25)');
  // front surfaces, back to front
  Q([at(x0,PRO[9]),at(x1,PRO[9]),at(x1,PRO[8]),at(x0,PRO[8])],'#4868c0');            // top
  Q([at(x0,PRO[7]),at(x1,PRO[7]),at(x1,PRO[8]),at(x0,PRO[8])],INK);                     // marquee frame
  Q([at(x0,PRO[5]),at(x1,PRO[5]),at(x1,PRO[6]),at(x0,PRO[6])],INK);                     // screen bezel
  Q([at(x0,PRO[3]),at(x1,PRO[3]),at(x1,PRO[4]),at(x0,PRO[4])],'#283880');              // control panel
  Q([at(x0,PRO[1]),at(x1,PRO[1]),at(x1,PRO[2]),at(x0,PRO[2])],'#2848a0');              // lower front
  Q([at(x0,PRO[2]),at(x1,PRO[2]),at(x1,PRO[3]),at(x0,PRO[3])],'#f8d030');              // panel lip trim
  // right side panel with the profile shape and side art
  Q(PRO.map(p=>at(x1,p)),'#3858a8');
  { const pts=PRO.map(p=>at(x1,p)); for (let i=0;i<pts.length;i++){ const a=pts[i], b=pts[(i+1)%pts.length]; linePx(a[0],a[1],b[0],b[1],INK); } }
  for (let v=4; v<48; v+=1){ const y=0.2+0.08*Math.sin(v*0.35)+0.18; const [X,Y]=P(x1,gy+y,v); g.fillStyle=v%6<3?'#f878b8':'#f8d030'; g.fillRect(Math.round(X),Math.round(Y),2,1); }
  // coin door
  { for (const [u,v,c] of [[0.42,9,INK],[0.42,10,'#f84848'],[0.56,9,INK],[0.56,10,'#f84848']]){ const [X,Y]=P(gx+u,gy+0.86,v); g.fillStyle=c; g.fillRect(Math.round(X),Math.round(Y),2,2); }
    const [a1,b1]=P(gx+0.34,gy+0.86,13), [a2,b2]=P(gx+0.66,gy+0.86,13), [a3,b3]=P(gx+0.34,gy+0.86,4), [a4,b4]=P(gx+0.66,gy+0.86,4); linePx(a1,b1,a2,b2,INK); linePx(a3,b3,a4,b4,INK); linePx(a1,b1,a3,b3,INK); linePx(a2,b2,a4,b4,INK); }
  // screen: an attract-mode llama hopping over hay, mapped onto the slanted glass
  { const W=15, H=17; const scr=(i,j)=>{ const tt=t*1.6, gr=H-3;
      if (j>=gr) return (i+Math.floor(tt*8))%4<2 ? '#48c048' : '#38a038';
      const hx=Math.floor((W+4)-((tt*10)%(W+8))); if (j>=gr-2 && (i===hx||i===hx+1)) return '#f8d030';
      const hop=Math.max(0, Math.round(Math.sin(Math.min(Math.PI, Math.max(0, ((tt*10)%(W+8)-(W-2))/2.2)))*5)); const lx=4, ly=gr-4-hop;
      if (i>=lx && i<=lx+2 && j>=ly && j<=ly+3) return (i===lx+2&&j===ly) ? '#181020' : '#f0e4c8'; if (i===lx+3 && j===ly) return '#f0e4c8';
      if (j<=2){ const sc=String(100+Math.floor(t*7)%900); return (i>=1 && i<12 && (i+j)%2===0 && j===1) ? '#f8f8f8' : '#101830'; }
      return ((i*7+j*13+Math.floor(t*2))%41===0) ? '#a8c8f8' : '#101830'; };
    const p0=PRO[5], p1=PRO[6];
    for (let j=0;j<H;j++) for (let i=0;i<W;i++){ const u=(j+0.5)/H, y=p1[0]+(p0[0]-p1[0])*u-0.015, v=p1[1]+(p0[1]-p1[1])*u; const x=x0+0.07+(i+0.5)/W*(x1-x0-0.14);
      const [X,Y]=P(x,gy+y,v); g.fillStyle=scr(i,j); g.fillRect(Math.round(X),Math.round(Y),1,2); } }
  // marquee: lit panel with chase lights and PLAY
  { const p0=PRO[7], p1=PRO[8]; const lit=Math.floor(t*6);
    for (let v=p0[1]+1; v<p1[1]; v++) for (let x=x0+0.05; x<x1-0.04; x+=0.05){ const [X,Y]=P(x,gy+p0[0]+0.005,v); const k=Math.round((x-x0)/0.05);
      const border = v===p0[1]+1 || v===p1[1]-1; g.fillStyle = border ? (((k+lit)%3===0)?'#ffffff':'#f84848') : '#f8d030'; g.fillRect(Math.round(X),Math.round(Y),1,1); }
    // a little llama head in the middle of the marquee
    { const [mx,my]=P((x0+x1)/2,gy+p0[0]+0.005,(p0[1]+p1[1])/2); const X=Math.round(mx), Y=Math.round(my), c=(Math.floor(t*3)%2)?'#c02838':'#e83848';
      g.fillStyle=c; for (const [i,j] of [[-2,-3],[2,-3],[-2,-2],[2,-2],[-2,-1],[-1,-1],[0,-1],[1,-1],[2,-1],[-1,0],[0,0],[1,0],[-1,1],[1,1],[-1,2],[0,2],[1,2]]) g.fillRect(X+i,Y+j,1,1);
      g.fillStyle='#ffffff'; g.fillRect(X-1,Y,1,1); g.fillRect(X+1,Y,1,1); } }
  // control panel: joystick and two buttons
  { const [jx,jy]=P(gx+0.36,gy+0.8,21); g.fillStyle=INK; g.fillRect(Math.round(jx),Math.round(jy)-5,1,5); ellPx(jx,jy-6,2,2,INK); ellPx(jx,jy-6.3,1.3,1.3,'#f84848');
    for (const [u,c] of [[0.56,'#f8d030'],[0.68,'#48c048']]){ const [bx,by]=P(gx+u,gy+0.82,21); ellPx(bx,by,1.8,1.2,INK); g.fillStyle=c; g.fillRect(Math.round(bx)-1,Math.round(by)-1,2,1); } }
}
// roulette table (2 x 2): wood rail, green felt with the number layout, a spinning wheel with an orbiting ball
function drawRoulette(f, t){
  const gx=f.gx, gy=f.gy, W=2, D=2;
  { const [cx,cy]=P(gx+1,gy+1); ellPx(cx,cy+2,32,13,'rgba(0,0,0,0.3)'); }
  // casino-cabinet build, like the slots: gold foot, burgundy pedestal, mahogany body with gold trim and chase lights, padded leather rail
  box(gx+0.5,gy+0.5,1,1,2,'#ffd23f','#c88a10','#a06808');
  box(gx+0.68,gy+0.68,0.64,0.64,7,'#6a1c34','#521428','#3a0e1c',0,2);
  box(gx+0.02,gy+0.02,1.96,1.96,6,'#9a4424','#7e3418','#5e2410',0,9);
  { const fl=Math.floor(t*3), E=(a,b,z,c)=>{ const p=P(a[0],a[1],z), q=P(b[0],b[1],z); linePx(p[0],p[1],q[0],q[1],c); };
    const fA=[gx+0.02,gy+1.98], fB=[gx+1.98,gy+1.98], rB=[gx+1.98,gy+0.02];
    E(fA,fB,9,'#ffd23f'); E(fB,rB,9,'#c88a10'); E(fA,fB,14,'#ffd23f'); E(fB,rB,14,'#c88a10');
    for (let i=0;i<=8;i++){ const u=i/8; for (const [a,b,k] of [[fA,fB,0],[fB,rB,1]]){ const [x,y]=P(a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u, 11.5); g.fillStyle=INK; g.fillRect(Math.round(x)-1,Math.round(y)-1,3,3); g.fillStyle=((i+k*9+fl)%2)?'#ffffff':'#ff5c8a'; g.fillRect(Math.round(x),Math.round(y),1,1); } } }
  box(gx+0.02,gy+0.02,1.96,1.96,2,'#c03858','#8a1c3c','#6a1430',0,15);
  { const a=P(gx+0.1,gy+1.9,17), b=P(gx+1.9,gy+1.9,17), c2=P(gx+1.9,gy+0.1,17); linePx(a[0],a[1],b[0],b[1],'#ff8aa8'); linePx(b[0],b[1],c2[0],c2[1],'#e06080'); }
  const Q=(u0,v0,u1,v1,c)=>polyPx([P(gx+u0,gy+v0,17),P(gx+u1,gy+v0,17),P(gx+u1,gy+v1,17),P(gx+u0,gy+v1,17)],c);
  Q(0.14,0.14,1.86,1.86,INK); Q(0.16,0.16,1.84,1.84,'#1a6e34'); Q(0.2,0.2,1.8,1.8,'#22903e');
  // number layout on the far half: three rows of red/black boxes with a green zero
  Q(1.0,0.3,1.12,1.7,'#30b050');
  for (let i=0;i<6;i++) for (let j=0;j<3;j++){ const u0=1.14+i*0.11, v0=0.32+j*0.46; Q(u0,v0,u0+0.1,v0+0.44,(i+j)%2?'#c02838':'#181020'); }
  { const a=P(gx+1.14,gy+1.72,17), b=P(gx+1.8,gy+1.72,17); linePx(a[0],a[1],b[0],b[1],'#ffd23f'); const c2=P(gx+1.14,gy+0.28,17); linePx(a[0],a[1],c2[0],c2[1],'#ffd23f'); }
  // wheel on the near half, sunk in a polished wooden bowl with a gold rim
  const [wx,wy]=P(gx+0.55,gy+1.0,18);
  ellPx(wx,wy+2,15,8,INK); ellPx(wx,wy+1,14.5,7.5,'#5e2410'); ellPx(wx,wy+0.5,14,7.2,'#9a4424'); ellPx(wx,wy,13.5,7,'#ffd23f'); ellPx(wx,wy+0.3,13,6.6,'#c88a10');
  const ra = (typeof rlAnim!=='undefined' && rlAnim) ? (performance.now()-rlAnim.t0)/1000 : 99, spinning = ra < 2.4;
  const rot = t*1.6 + (spinning ? (2.4*ra - ra*ra*0.5)*6 : 0);
  ellPx(wx,wy+1,13,7,INK); ellPx(wx,wy,12.5,6.5,'#6a3418'); ellPx(wx,wy-0.5,10.5,5.3,'#c09018');
  for (let k=0;k<18;k++){ const a=rot+k/18*Math.PI*2, col = k===0 ? '#28a048' : k%2 ? '#c02838' : '#181020';
    for (let r=4.5;r<=9.5;r+=0.8){ g.fillStyle=col; g.fillRect(Math.round(wx+Math.cos(a)*r),Math.round(wy+Math.sin(a)*r*0.52),1,1); g.fillRect(Math.round(wx+Math.cos(a+0.17)*r),Math.round(wy+Math.sin(a+0.17)*r*0.52),1,1); } }
  ellPx(wx,wy,4,2.2,'#8a4a20'); ellPx(wx,wy-1,1.6,1.2,'#f8d030'); g.fillStyle='#f8f0a0'; g.fillRect(Math.round(wx),Math.round(wy)-3,1,2);
  { const settle = spinning ? Math.min(1, ra/2.4) : 1; const ba = spinning ? -ra*9*(1-settle*0.7) : rot+((rlAnim?rlAnim.n:0)/37)*Math.PI*2; const rr = spinning ? 10.2-settle*3.5 : 6.6;
    g.fillStyle='#ffffff'; g.fillRect(Math.round(wx+Math.cos(ba)*rr),Math.round(wy+Math.sin(ba)*rr*0.52)-1,2,2); }
  // result plate over the table for a few seconds after a spin
  if (rlAnim && ra>=2.4 && ra<7){ const n=rlAnim.n, txt=String(n)+' '+(n===0?'GREEN':RL_RED.has(n)?'RED':'BLACK'); const [px,py]=P(gx+1,gy+1,40); const w=pfW(txt)+10;
    g.fillStyle=INK; g.fillRect(Math.round(px-w/2)+1,Math.round(py)-11,w-2,11); g.fillRect(Math.round(px-w/2),Math.round(py)-10,w,9); g.fillStyle='#f8f8f8'; g.fillRect(Math.round(px-w/2)+1,Math.round(py)-10,w-2,9);
    g.fillStyle=rlCol(n); g.fillRect(Math.round(px-w/2)+2,Math.round(py)-8,2,3); pfDraw(g,txt,Math.round(px-w/2)+6,Math.round(py)-9,INK); }
  // chip stacks on the layout
  for (const [u,v,c] of [[1.3,0.55,'#f84848'],[1.52,1.05,'#3890e0'],[1.66,0.5,'#f8d030']]){ const [x,y]=P(gx+u,gy+v,17); for (let k=0;k<3;k++){ ellPx(x,y-k*1.5,2.4,1.2,INK); ellPx(x,y-k*1.5-0.5,1.8,0.8,c); g.fillStyle='#ffffff'; g.fillRect(Math.round(x)-1,Math.round(y-k*1.5)-1,1,1); } }
}
// blackjack table (2 x 1): curved green felt facing the players, dealer's chip tray and shoe at the back, a card at each seat
function drawBlackjack(f, t){
  const gx=f.gx, gy=f.gy, RT=f.rot===1;   /* rot 1: the table runs along y (dealer by the left wall, players on the +x side) */
  const L=(u,v,z)=>RT ? P(gx+v,gy+u,z) : P(gx+u,gy+v,z), BX=(u,v,w,d,...a)=>RT ? box(gx+v,gy+u,d,w,...a) : box(gx+u,gy+v,w,d,...a);
  { const [cx,cy]=L(1,0.5); ellPx(cx,cy+2,28,10,'rgba(0,0,0,0.3)'); }
  // same build as the roulette table and the slots: gold feet, burgundy pedestals, mahogany apron with gold trim and chase lights, padded rail
  for (const u of [0.5,1.5]){ BX(u-0.2,0.32,0.4,0.36,2,'#ffd23f','#c88a10','#a06808'); BX(u-0.12,0.4,0.24,0.2,7,'#6a1c34','#521428','#3a0e1c',0,2); }
  // half-moon felt: straight dealer edge at the back, curved player edge at the front, padded rail and wooden apron
  const depth=u=>0.5+0.38*Math.sqrt(Math.max(0,1-((u-1)/0.96)**2));
  const curve=[]; for (let u=0.04;u<=1.961;u+=0.06) curve.push([u,0.08+depth(u)]);
  // curved apron, built from solid bands so there are no gaps: gold foot trim, mahogany, gold piping, padded burgundy rail
  const edge=[[0.04,0.08], ...curve, [1.96,0.08]];   /* the straight ends too, so the sides are closed all the way round */
  const band=(z0,z1,c0,c1)=>{ for (let i=0;i<edge.length-1;i++){ const [u0,v0]=edge[i], [u1,v1]=edge[i+1]; polyPx([L(u0,v0,z1),L(u1,v1,z1),L(u1,v1,z0),L(u0,v0,z0)], c1 && u0>=1 ? c1 : c0); } };
  band(7,8,INK); band(8,9,'#ffd23f','#c88a10'); band(9,12.5,'#9a4424','#7e3418'); band(12.5,13.5,'#ffd23f','#c88a10');
  { const fl=Math.floor(t*3); for (let i=1;i<curve.length-1;i+=2){ const [x,y]=L(curve[i][0],curve[i][1],10.5); g.fillStyle=INK; g.fillRect(Math.round(x)-1,Math.round(y)-1,3,3); g.fillStyle=((i>>1)+fl)%2?'#ffffff':'#ff5c8a'; g.fillRect(Math.round(x),Math.round(y),1,1); } }
  const felt=[L(0.04,0.08,13),L(1.96,0.08,13),...curve.slice().reverse().map(([u,v])=>L(u,v,13))];
  polyPx(felt,INK); polyPx(felt.map(([x,y],i)=>[x+(i===0?1:i===1?-1:0), y+(i<2?1:-1)]),'#1e8a3c');
  band(13,15.5,'#c03858','#8a1c3c'); band(15.5,16.5,INK);
  for (let i=0;i<edge.length-1;i++){ const a=L(edge[i][0],edge[i][1],15.5), b=L(edge[i+1][0],edge[i+1][1],15.5); linePx(a[0],a[1],b[0],b[1],'#ff8aa8'); }
  { const a=L(0.04,0.08,15.5), b=L(1.96,0.08,15.5); linePx(a[0],a[1]-1,b[0],b[1]-1,INK); linePx(a[0],a[1],b[0],b[1],'#8a1c3c'); }

  { const a=L(0.04,0.08,13), b=L(1.96,0.08,13); linePx(a[0],a[1],b[0],b[1],'#ffd23f'); linePx(a[0],a[1]-1,b[0],b[1]-1,INK); }
  { const a=L(0.3,0.38,13), b=L(1.7,0.38,13); for (let i=0;i<=20;i++){ const u=i/20, x=a[0]+(b[0]-a[0])*u, y=a[1]+(b[1]-a[1])*u+Math.sin(u*Math.PI)*4; g.fillStyle='#f8d030'; g.fillRect(Math.round(x),Math.round(y),1,1); } }
  // each seated player's cards, face up on the felt in front of their stool
  { const players=[]; if (me.bj && me.p==='sit') players.push([me.gx,me.gy,me.bj]); for (const o of others.values()) if (sameRoom(o) && o.bj && o.p==='sit') players.push([Math.floor(o.x),Math.floor(o.y),o.bj]);
    for (const [x,y,cards] of players){ const lu=RT?y-gy:x-gx, lv=RT?x-gx:y-gy; if (lv!==1 || lu<0 || lu>1) continue; cards.forEach((cd,i)=>{ const [cx,cy]=L(lu+0.3+i*0.12,0.68,13); const X=Math.round(cx), Y=Math.round(cy); g.fillStyle=INK; g.fillRect(X-1,Y-4,5,6); g.fillStyle='#f8f8f8'; g.fillRect(X,Y-3,3,4); g.fillStyle=(Math.floor(cd/13)===1||Math.floor(cd/13)===2)?'#c02838':INK; g.fillRect(X+1,Y-2,1,2); }); } }
  // dealer chip tray and card shoe
  { const [x,y]=L(1,0.2,13); g.fillStyle=INK; g.fillRect(Math.round(x)-8,Math.round(y)-3,17,4); ['#f84848','#3890e0','#48c048','#f8d030','#181020','#f8f8f8','#b058e0','#f84848'].forEach((c,i)=>{ g.fillStyle=c; g.fillRect(Math.round(x)-7+i*2,Math.round(y)-2,2,2); }); }
  { const [x,y]=L(1.7,0.25,13); g.fillStyle=INK; g.fillRect(Math.round(x)-3,Math.round(y)-5,7,6); g.fillStyle='#c02838'; g.fillRect(Math.round(x)-2,Math.round(y)-4,5,4); g.fillStyle='#f8f8f8'; g.fillRect(Math.round(x)-2,Math.round(y)-4,2,1); }
  // a card face up at each empty seat
  for (const u of [0.5,1.5]){ const seatX=RT?gx+1:gx+(u<1?0:1), seatY=RT?gy+(u<1?0:1):gy+1; if ((me.bj && me.p==='sit' && me.gx===seatX && me.gy===seatY) || [...others.values()].some(o=>sameRoom(o)&&o.bj&&Math.floor(o.x)===seatX&&Math.floor(o.y)===seatY)) continue; const [x,y]=L(u,0.7,13); g.fillStyle=INK; g.fillRect(Math.round(x)-2,Math.round(y)-3,5,6); g.fillStyle='#f8f8f8'; g.fillRect(Math.round(x)-1,Math.round(y)-2,3,4); g.fillStyle=u<1?'#c02838':'#181020'; g.fillRect(Math.round(x),Math.round(y)-1,1,2); }
}
// small potted fern: short glazed teal pot, a mound of arching fronds with leaflets
function drawFern(f, sx, sy, t){
  const ox=f.ox||0, oy=f.oy||0, fl=f.flip?-1:1; { const [x,y]=P(f.gx+0.5+ox,f.gy+0.5+oy); sx=Math.round(x); sy=Math.round(y); }
  box(f.gx+0.31+ox,f.gy+0.31+oy,0.38,0.38,8,'#48c8b8','#289888','#1a6860');
  box(f.gx+0.28+ox,f.gy+0.28+oy,0.44,0.44,2,'#78e0d0','#38b0a0','#208070',0,8);
  { const [bx,by]=P(f.gx+0.5+ox,f.gy+0.69+oy,4); linePx(bx-4,by-2,bx+4,by+2,'#a8f0e8'); }
  ellPx(sx,sy-10,3.5,1.5,'#5a3018');
  const bx=sx, by=sy-11, sway=Math.sin(t*1.4+f.gx)*0.05;
  // [angle, length, droop]: back fronds first so the front ones sit on top
  const fronds=[[-2.6,10,0.06],[-0.55,10,0.06],[-2.05,11,0.045],[-1.1,11,0.045],[-1.6,9,0.03],[-2.95,9,0.09],[-0.2,9,0.09],[-1.85,7,0.05],[-1.3,7,0.05]];
  const pts=fr=>{ const [a0,L,dr]=fr; const a=a0+sway; const out=[]; for (let k=0;k<=L;k++) out.push([bx+Math.cos(a)*k*fl, by+Math.sin(a)*k+dr*k*k]); return out; };
  for (const fr of fronds){ const P2=pts(fr); for (let i=1;i<P2.length;i++){ const [x,y]=P2[i]; ellPx(x,y,1.5,1.5,INK); } }
  for (const fr of fronds){ const P2=pts(fr); for (let i=1;i<P2.length;i++){ const [x,y]=P2[i]; const X=Math.round(x), Y=Math.round(y);
      if (i%2===1 && i<P2.length-1){ g.fillStyle='#48a040'; g.fillRect(X-1,Y,1,2); g.fillStyle='#2a7a38'; g.fillRect(X+1,Y,1,2); }
      g.fillStyle = i<P2.length*0.5 ? '#58b048' : '#78d060'; g.fillRect(X,Y,1,1); g.fillStyle='#2a7a38'; g.fillRect(X,Y+1,1,1); } }
  g.fillStyle='#a0e888'; g.fillRect(bx-1,by-6,1,1); g.fillRect(bx+2,by-5,1,1);
}
// potted palm: cream planter with a gold band, ringed curving trunk, arching fronds with leaflets, coconuts
function drawPalm(f, sx, sy, t){
  const ox=f.ox||0, oy=f.oy||0, fl=f.flip?-1:1; { const [x,y]=P(f.gx+0.5+ox,f.gy+0.5+oy); sx=Math.round(x); sy=Math.round(y); }
  box(f.gx+0.26+ox,f.gy+0.26+oy,0.48,0.48,10,'#f0e8d8','#d8ccb8','#b8a890');
  box(f.gx+0.22+ox,f.gy+0.22+oy,0.56,0.56,2,'#f8d030','#e0b020','#b88818',0,10);
  { const [bx,by]=P(f.gx+0.5+ox,f.gy+0.74+oy,5); linePx(bx-6,by-3,bx+6,by+3,'#f8d030'); }
  ellPx(sx,sy-12,5,2,'#5a3018');
  // trunk: gentle curve, ring every 3px
  const top=[sx+4*fl, sy-42]; const tp=u=>[Math.round(sx+(top[0]-sx)*u*u), Math.round(sy-12+(top[1]-(sy-12))*u)];
  for (let i=0;i<=30;i++){ const u=i/30, [x,y]=tp(u), w=u<0.5?3:2; g.fillStyle=INK; g.fillRect(x-w-1,y,w*2+2,1); g.fillStyle = (i%3===0) ? '#7a4a20' : '#a87040'; g.fillRect(x-w,y,w*2,1); g.fillStyle='#c89060'; g.fillRect(x-w,y,1,1); }
  // fronds
  const [Tx,Ty]=top; const sway=Math.sin(t*1.3)*0.06;
  const fronds=[[-2.9,19,0.035],[-2.3,17,0.05],[-1.75,13,0.07],[-1.2,13,0.07],[-0.55,17,0.05],[0.05,19,0.035],[-1.47,9,0.09]];
  const pts=fr=>{ const [a0,L,dr]=fr; const a=a0+sway*fl; const out=[]; for (let s2=0;s2<=L;s2++){ out.push([Tx+Math.cos(a)*s2*(fl), Ty+Math.sin(a)*s2+dr*s2*s2]); } return out; };
  const order=fl>0?fronds:fronds.map(([a,L,d])=>[a,L,d]);
  for (const fr of order){ const P2=pts(fr); for (let i=1;i<P2.length;i++){ const [x,y]=P2[i]; ellPx(x,y+1,1.6,1.6,INK); } }
  for (const fr of order){ const P2=pts(fr); for (let i=1;i<P2.length;i++){ const [x,y]=P2[i]; const X=Math.round(x), Y=Math.round(y);
      if (i%2===0 && i<P2.length-1){ g.fillStyle=INK; g.fillRect(X-1,Y+1,1,3); g.fillRect(X+1,Y+1,1,3); g.fillStyle='#48a040'; g.fillRect(X-1,Y+1,1,2); g.fillStyle='#2a7a38'; g.fillRect(X+1,Y+1,1,2); }
      g.fillStyle = i<P2.length*0.6 ? '#58b048' : '#70c860'; g.fillRect(X,Y,1,2); g.fillStyle='#2a7a38'; g.fillRect(X,Y+1,1,1); } }
  // coconuts under the crown
  for (const [dx,dy] of [[-2,3],[2,4],[0,5]]){ ellPx(Tx+dx*fl,Ty+dy,2.2,2.2,INK); ellPx(Tx+dx*fl,Ty+dy,1.5,1.5,'#7a4a20'); g.fillStyle='#a87040'; g.fillRect(Math.round(Tx+dx*fl-1),Math.round(Ty+dy-1),1,1); }
}
const pondCache = {};
// ---- FARM: plot state comes from the server (ready time in server clock; SRV_OFF lines our clock up with it) ----
let SRV_OFF=0;
const CROP_INFO={carrot:{n:'CARROTS',seed:1,ms:20*60e3,pay:3}, corn:{n:'CORN',seed:2,ms:45*60e3,pay:5}, berry:{n:'STRAWBERRIES',seed:3,ms:2*3600e3,pay:8}, pumpkin:{n:'PUMPKINS',seed:5,ms:6*3600e3,pay:13}};
function plotState(f){ if (!f || !f.crop) return null; const now=Date.now()+SRV_OFF, span=Math.max(1,f.ready-f.planted); return { crop:f.crop, p:Math.max(0,Math.min(1,(now-f.planted)/span)), ready:now>=f.ready, left:Math.max(0,f.ready-now), wat:!!f.wat, wby:f.wby||'' }; }
const fmtLeft = ms => { const m=Math.ceil(ms/60000); if (m<=1) return Math.max(1,Math.ceil(ms/1000))+' SEC'; if (m<60) return m+' MIN'; const h=Math.floor(m/60), r=m%60; return h+' H'+(r?' '+r+' MIN':''); };
// one crop at a spot on the soil: stage 0 seed, 1 sprout, 2 growing, 3 ripe
function drawCrop(k, stage, X, Y, t){
  const R=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(X+x,Y+y,w,h); };
  if (stage===0){ R(-2,-1,4,1,'#6a4428'); R(-1,-2,2,1,'#7a5232'); R(0,-2,1,1,'#e8d8a0'); return; }
  if (stage===1){ R(0,-4,1,4,'#4aa040'); R(-2,-5,2,1,'#6ac858'); R(1,-6,2,1,'#6ac858'); R(-1,-4,1,1,'#58b048'); return; }
  const sway=Math.round(Math.sin(t*2+X*0.7)*0.6);
  if (k==='carrot'){ for (const [dx,h] of [[-2,6],[0,8],[2,6]]){ R(dx+sway,-h,1,h,'#3a8a34'); R(dx-1+sway,-h,1,1,'#6ac858'); R(dx+1+sway,-h+2,1,1,'#6ac858'); }
    if (stage===3){ R(-2,-1,5,2,INK); R(-1,-1,3,2,'#f08a24'); R(-1,-1,1,1,'#ffb860'); } return; }
  if (k==='corn'){ const H=stage===3?15:10; R(0,-H,1,H,'#3e8a34'); R(1,-H+1,1,H-1,'#58a848'); R(-3,-H+5,3,1,'#58b048'); R(2,-H+3,3,1,'#58b048'); R(-2,-H+9,2,1,'#4a9a40');
    if (stage===3){ R(-1,-H-2,3,2,'#e8d070'); R(0,-H-3,1,1,'#c8a848'); R(2,-H+5,3,6,INK); R(3,-H+6,2,4,'#f8d030'); R(3,-H+6,1,1,'#fff0a0'); R(2,-H+9,1,2,'#58b048'); } return; }
  if (k==='berry'){ ellPx(X,Y-3,stage===3?4:3,stage===3?3:2.5,'#2e7a34'); ellPx(X-1,Y-4,stage===3?3:2,2,'#4aa048');
    if (stage===3) for (const [dx,dy] of [[-3,-3],[1,-5],[2,-2],[-1,-1]]){ R(dx,dy,2,2,'#e83850'); R(dx,dy,1,1,'#ff9aa8'); } return; }
  if (k==='pumpkin'){ if (stage===2){ R(-4,-1,9,1,'#3e8a34'); ellPx(X-2,Y-2,2,1.5,'#58b048'); ellPx(X+3,Y-2,2,1.5,'#4aa040'); R(0,-3,1,2,'#3e8a34'); return; }
    R(-5,0,11,1,'#3e8a34'); ellPx(X,Y-3,5,3.5,INK); ellPx(X,Y-3,4,2.5,'#f08a24'); R(-1,-5,1,4,'#d06a14'); R(2,-5,1,4,'#d06a14'); R(-3,-4,1,1,'#ffb060'); R(0,-8,1,2,'#5a8a2a'); R(1,-8,2,1,'#5a8a2a'); return; }
}
// sunflower sprites (outlined by sprO), shared palette
const SF_PAL={y:'#ffd23f', o:'#f0a020', h:'#fff3a0', B:'#6a3410', b:'#8a4a18', d:'#3a1a06', g:'#5ab04a', G:'#3e8a34', l:'#88d468', k:INK};
const SF_HEAD=['....yhy....','..y.yyy.y..','.yhyBBByyo.','..yBbbbBo..','hyBbdbdbByo','yyBbbdbbBoo','hyBbdbdbBoo','..yBbbbBo..','.yyoBBBooo.','..o.ooo.o..','....ooo....'];
const SF_LEAF_L=['.lgg','ggGk','.GG.'], SF_LEAF_R=['ggl.','kGgg','.GG.'];
function sprO(rows,x,y,pal){ g.fillStyle=INK; for (let j=0;j<rows.length;j++) for (let i=0;i<rows[j].length;i++){ if (rows[j][i]==='.') continue; for (const [a,b] of [[1,0],[-1,0],[0,1],[0,-1]]){ const r2=rows[j+b], c=r2&&r2[i+a]; if (!c || c==='.') g.fillRect(x+i+a,y+j+b,1,1); } } spr(rows,x,y,pal); }
function drawFurn(f,t){
  const cx=f.gx+0.5, cy=f.gy+0.5; const [sx,sy]=P(cx,cy);
  switch(f.t){
    case 'ropeseg': case 'ringpost': case 'ringsteps': case 'hbag': case 'lockers': case 'cooler': case 'weights': case 'ringbell': case 'gbench': drawGymPiece(f,t,sx,sy); break;
    case 'palm': case 'cvrock': case 'torch': case 'cvsign': case 'rowboat': case 'wreck': case 'crab': drawCovePiece(f,t,sx,sy); break;
    case 'tchest': drawPirateChest(f,t); break;
    case 'gidol': drawGoldIdol(f,t); break;
    case 'temple': case 'brazier': case 'jtree': case 'idol': case 'jpillar': case 'jcolumn': case 'jsign': case 'jbush': drawJunglePiece(f,t,sx,sy); break;
    case 'lanepins': { // ten llama pins in a triangle at the far end of the lane (hidden while someone bowls there, so it looks reset)
      
      const pts=[]; for (let r=0;r<4;r++) for (let j=0;j<=r;j++) pts.push([f.gx+1+(j-r/2)*0.28, 1.15-r*0.24]);
      pts.sort((a,b)=>(a[0]+a[1])-(b[0]+b[1]));
      for (const [px,py] of pts){ const [x,y]=P(px,py); const X=Math.round(x), Y=Math.round(y);
        g.fillStyle=INK; g.fillRect(X-2,Y-8,4,9); g.fillStyle='#f8f8f0'; g.fillRect(X-1,Y-7,2,7); g.fillStyle='#e03048'; g.fillRect(X-1,Y-5,2,1); g.fillStyle=INK; g.fillRect(X-2,Y-9,1,1); g.fillRect(X+1,Y-9,1,1); }
      break; }
    case 'dunktank': {
      const dp=dunkDepth(), sitter=dunkSitter();
      const a=f.gx+0.04, b=f.gy+0.04, c=f.gx+0.96, e=f.gy+0.96;
      const FL=(u,v)=>P(a+(c-a)*u, e, v), FR=(u,v)=>P(c, b+(e-b)*u, v), quad=(F,u0,u1,v0,v1,col)=>polyPx([F(u0,v0),F(u1,v0),F(u1,v1),F(u0,v1)],col);
      // carnival base: red skirt with white stripes
      box(a,b,c-a,e-b,6,'#d8d0e0','#e03048','#c02838');
      for (let k=0;k<8;k+=2){ quad(FL,k/8+0.02,(k+1)/8,0.5,5.5,'#f8f0f0'); quad(FR,k/8+0.02,(k+1)/8,0.5,5.5,'#e8e0e8'); }
      // mesh safety screen behind the seat
      { const v0=27, v1=56, pb=(u,v)=>P(a+0.08+(c-a-0.16)*u, b+0.1, v);
        for (let v=v0; v<=v1; v+=4){ const p0=pb(0,v), p1=pb(1,v); linePx(p0[0],p0[1],p1[0],p1[1],'rgba(70,80,104,0.55)'); }
        for (let u=0; u<=1.001; u+=0.125){ const p0=pb(u,v0), p1=pb(u,v1); linePx(p0[0],p0[1],p1[0],p1[1],'rgba(70,80,104,0.55)'); }
        for (const u of [0,1]){ const p0=pb(u,6), p1=pb(u,v1+2); linePx(p0[0],p0[1],p1[0],p1[1],'#4a5468'); linePx(p0[0]+1,p0[1],p1[0]+1,p1[1],'#8a96ac'); }
        { const p0=pb(0,v1+2), p1=pb(1,v1+2); linePx(p0[0],p0[1],p1[0],p1[1],'#e03048'); linePx(p0[0],p0[1]-1,p1[0],p1[1]-1,'#c02838'); } }
      // the water: deeper and darker toward the bottom, an empty strip of glass at the top
      const W0=6, W1=22, TOP=26;
      for (const [v0,v1,cl,cr] of [[W0,11,'#1c5aa8','#164a90'],[11,16,'#2a78d0','#2066b8'],[16,W1,'#4a9ae8','#3a86d8'],[W1,TOP,'#c8ecfa','#b0dcf0']]){ quad(FL,0,1,v0,v1,cl); quad(FR,0,1,v0,v1,cr); }
      polyPx([P(a,b,W1),P(c,b,W1),P(c,e,W1),P(a,e,W1)],'#6ab8f0');   // water surface seen through the glass
      { const ripple=dp>0?1.5:0.5; for (let u=0; u<=1; u+=0.04){ const [x,y]=FL(u,W1); g.fillStyle='#e8f8ff'; g.fillRect(Math.round(x), Math.round(y+Math.sin(t*4+u*20)*ripple), 1, 1); const [x2,y2]=FR(u,W1); g.fillRect(Math.round(x2), Math.round(y2+Math.sin(t*4+u*20+2)*ripple), 1, 1); } }
      // bubbles drifting up
      for (let k=0;k<6;k++){ const F=k%2?FR:FL, u=0.15+((k*0.37)%0.7), v=W0+1+((t*(4+k)+k*3.7)%(W1-W0-2)); const [x,y]=F(u,v); g.fillStyle='rgba(232,248,255,0.85)'; g.fillRect(Math.round(x),Math.round(y),1,1); if (k<2){ g.fillRect(Math.round(x)+1,Math.round(y)-1,1,1); } }
      // glass glints
      { const g1=FL(0.12,8), g2=FL(0.3,TOP-2), g3=FL(0.2,8), g4=FL(0.36,TOP-6); linePx(g1[0],g1[1],g2[0],g2[1],'rgba(255,255,255,0.55)'); linePx(g3[0],g3[1],g4[0],g4[1],'rgba(255,255,255,0.35)');
        const g5=FR(0.7,9), g6=FR(0.85,TOP-3); linePx(g5[0],g5[1],g6[0],g6[1],'rgba(255,255,255,0.4)'); }
      // steel frame: corner posts and a rim round the top
      const steel=(p,q,dark)=>{ linePx(p[0],p[1],q[0],q[1],dark?'#3a4458':'#5a6478'); linePx(p[0]+1,p[1],q[0]+1,q[1],dark?'#5a6478':'#a8b4c8'); };
      steel(P(a,e,6),P(a,e,TOP)); steel(P(c,e,6),P(c,e,TOP),true); steel(P(c,b,6),P(c,b,TOP),true);
      for (const [p,q] of [[P(a,e,TOP),P(c,e,TOP)],[P(c,b,TOP),P(c,e,TOP)],[P(a,b,TOP),P(c,b,TOP)],[P(a,b,TOP),P(a,e,TOP)]]){ linePx(p[0],p[1]-1,q[0],q[1]-1,'#a8b4c8'); linePx(p[0],p[1],q[0],q[1],'#3a4458'); }
      { const L=(p,q)=>linePx(p[0],p[1],q[0],q[1],INK); L(P(a,e,0),P(c,e,0)); L(P(c,b,0),P(c,e,0)); }
      // silver ladder up the right side
      { const r0=P(c+0.06,f.gy+0.22,0), r1=P(c+0.06,f.gy+0.48,0); for (const [x,y] of [r0,r1]){ g.fillStyle=INK; g.fillRect(Math.round(x)-1,Math.round(y)-30,3,30); g.fillStyle='#c8d0e0'; g.fillRect(Math.round(x),Math.round(y)-30,1,30); }
        for (let v=4; v<30; v+=5){ const p=[r0[0],r0[1]-v], q=[r1[0],r1[1]-v]; linePx(p[0],p[1],q[0],q[1],'#8a96ac'); } }
      // seat plank on steel brackets (drops when someone gets dunked)
      { const lift=dp>0?18:27; box(f.gx+0.2,f.gy+0.34,0.6,0.32,2,'#e0a868','#c88a4a','#a86a34',0,lift);
        const k1=P(f.gx+0.24,f.gy+0.66,lift), k2=P(f.gx+0.76,f.gy+0.66,lift); g.fillStyle='#4a5468'; g.fillRect(Math.round(k1[0]),Math.round(k1[1]),2,3); g.fillRect(Math.round(k2[0])-1,Math.round(k2[1]),2,3); }
      if (!sitter){ const [px,py]=P(f.gx+0.5,f.gy+0.5,0); const x0=Math.round(px)-14, y0=Math.round(py)-45-26+6+dp;
        dunkClip(Math.round(py)-21, ()=>g.drawImage(sprite('poophat', 'fl', 0, 'sit'), x0, y0));
        if (dp>0) dunkSplash(Math.round(px), Math.round(py)-21, t); else pfDraw(g,'DUNKY',x0+3,y0-7,'#ffd23f'); }
      break; }
    case 'dunksign': { // carnival sign on two posts: striped border, chasing bulbs, big DUNK!
      const tw=pfW('1 COIN')+8, W=tw+10, H=20, cv=dunkSignCv;   /* slimmer board: a 2-pixel striped border instead of 3 */ if (cv.width!==W){ cv.width=W; cv.height=H; }
      const m=cv.getContext('2d'); m.clearRect(0,0,W,H);
      m.fillStyle=INK; m.fillRect(1,0,W-2,H); m.fillRect(0,1,W,H-2);
      for (let x=1;x<W-1;x++) for (let y=1;y<H-1;y++){ if (x>2&&x<W-3&&y>2&&y<H-3) continue; m.fillStyle=(Math.floor((x+y)/3)%2)?'#e03048':'#f8f8f0'; m.fillRect(x,y,1,1); }
      m.fillStyle=INK; m.fillRect(3,3,W-6,H-6); m.fillStyle='#fff4d8'; m.fillRect(4,4,W-8,H-8);
      const lit=Math.floor(t*6); let k=0; const bulb=(x,y)=>{ m.fillStyle=((k++)+lit)%3===0?'#ffffff':'#ffd23f'; m.fillRect(x,y,1,1); };
      for (let x=3;x<W-3;x+=4) bulb(x,1); for (let y=4;y<H-3;y+=4) bulb(W-2,y); for (let x=W-4;x>=3;x-=4) bulb(x,H-2); for (let y=H-4;y>=4;y-=4) bulb(1,y);
      { const dw=pfW('DUNK!'); pfDraw(m,'DUNK!',Math.round(W/2-dw/2),5,'#8a1424'); pfDraw(m,'DUNK!',Math.round(W/2-dw/2),4,(Math.floor(t*2)%3===0)?'#ff5c8a':'#e03048'); }
      // little target and "1 COIN"
      { const tx=Math.round(W/2-tw/2)+2; for (const [r,c] of [[2,'#e03048'],[1,'#f8f8f0'],[0,'#e03048']]){ m.fillStyle=c; m.fillRect(tx-r,13-r,r*2+1,r*2+1); }
        pfDraw(m,'1 COIN',tx+5,11,'#1c4aa8'); }
      const [px,py]=P(f.gx+0.5,f.gy+0.55,0), X=Math.round(px)+4, Y=Math.round(py);
      ellPx(X,Y+1,11,3,'rgba(40,80,20,0.3)');
      for (const dx of [-10,9]){ g.fillStyle=INK; g.fillRect(X+dx-1,Y-18,4,19); g.fillStyle='#a86a34'; g.fillRect(X+dx,Y-18,2,18); g.fillStyle='#c88a50'; g.fillRect(X+dx,Y-18,1,18); }
      g.drawImage(cv, Math.round(X-W/2), Y-18-H+4);
      break; }
    case 'dunktarget': {
      const [px,py]=P(f.gx+0.5,f.gy+0.5,0), X=Math.round(px), Y=Math.round(py);
      g.fillStyle=INK; g.fillRect(X-1,Y-34,3,34); g.fillStyle='#c8c8d8'; g.fillRect(X,Y-34,1,34);
      // arm reaching to the tank
      { const [ax,ay]=P(DUNK_SEAT[0]+0.35,DUNK_SEAT[1]+0.6,26); const dx=Math.round(ax)-X, dy=Math.round(ay)-(Y-31), n=Math.max(Math.abs(dx),Math.abs(dy));
        for (let i=0;i<=n;i++){ const x=X+Math.round(dx*i/n), y=Y-31+Math.round(dy*i/n); g.fillStyle=INK; g.fillRect(x,y-1,1,3); g.fillStyle='#c8c8d8'; g.fillRect(x,y,1,1); } }
      const hitNow = DK.flash && performance.now()-DK.flash<400; const cy=Y-38;
      for (const [r,c] of [[9,INK],[8,'#f8f8f8'],[6,'#e03048'],[4,'#f8f8f8'],[2,'#e03048']]){ g.fillStyle = hitNow && c!==INK ? '#ffd23f' : c; for (let yy=-r;yy<=r;yy++){ const w=Math.round(Math.sqrt(r*r-yy*yy)); g.fillRect(X-w, cy+yy, w*2+1, 1); } }
      break; }
    case 'clerk': { // PENNY, drawn with the same sprite code as the players; her working front leg is drawn with the register
      const {scanning, custom}=clerkState(t), fr = scanning ? (Math.floor(t*3.2)%2 ? 1 : 0) : custom ? (Math.floor(t*5)%2 ? 1 : 0) : 0;
      const blink=(t%3.1)<0.12, X=Math.round(sx)-14, Y=Math.round(sy)-45;
      g.drawImage(sprite('penny','fl',fr,'stand'), X, Y);
      if (blink){ g.fillStyle='#9f8ad6'; g.fillRect(X+SW-1-11,Y+12+(fr===1?1:0),3,1); g.fillRect(X+SW-1-17,Y+12+(fr===1?1:0),3,1); }
      break; }
    case 'counter': { // checkout counter: wooden front, cream top, cash register in the middle
      box(f.gx,f.gy,1,1,20,'#f4e6c8','#b07a48','#8a5a30');
      { const [x,y]=P(f.gx+0.5,f.gy+1,10); g.fillStyle='#c8905a'; g.fillRect(Math.round(x)-8,Math.round(y)-1,16,1); }
      if (f.reg){ box(f.gx+0.22,f.gy+0.25,0.56,0.5,7,'#9aa0b8','#585870','#3a3a50',0,20);
        const [x,y]=P(f.gx+0.5,f.gy+0.35,31); const X=Math.round(x), Y=Math.round(y);
        const beat=Math.floor(t*4);
        g.fillStyle=INK; g.fillRect(X-5,Y-6,10,7); g.fillStyle='#48e078'; g.fillRect(X-4,Y-5,8,5); g.fillStyle='#e8fff0'; for (let k=0;k<3;k++) if ((beat+k)%4) g.fillRect(X-3+k*2,Y-4,1,1+((beat*7+k*3)%3));
        // PENNY's front leg: scans items across the counter, or waves when someone walks up (same outline and shading as the sprites)
        { const {custom, scanning}=clerkState(t), [bx,by]=P(8.5,1.5,0), fr = scanning ? (Math.floor(t*3.2)%2 ? 1 : 0) : 0;
          const sh=[Math.round(bx)-14+6, Math.round(by)-45+28+fr]; let hp;
          if (custom){ hp=[sh[0]-4+Math.round(Math.sin(t*10)*2), sh[1]-20]; }
          else if (scanning){ const u=Math.sin(t*Math.PI*1.6); const [x,y]=P(8.95+u*0.22, 2.38, 22+Math.abs(u)*2); hp=[Math.round(x),Math.round(y)]; }
          else { const [x,y]=P(8.9,2.2,24); hp=[Math.round(x),Math.round(y)]; }
          const seg=(r,col)=>{ for (let k=0;k<=12;k++){ const x=sh[0]+(hp[0]-sh[0])*k/12, y=sh[1]+(hp[1]-sh[1])*k/12; ellPx(x,y,r,r,col); } };
          seg(2.6,OUT); seg(1.6,'#c9b6f0'); { const k=0.5, x=sh[0]+(hp[0]-sh[0])*k, y=sh[1]+(hp[1]-sh[1])*k; g.fillStyle='#ece2ff'; g.fillRect(Math.round(x)-1,Math.round(y)-1,1,1); }
          g.fillStyle=OUT; g.fillRect(hp[0]-2,hp[1]-1,5,3); g.fillStyle=HOOF; g.fillRect(hp[0]-1,hp[1],3,1);
          if (scanning){ const u=Math.sin(t*Math.PI*1.6); const [gx2,gy2]=P(9.0,2.62,20); const GX=Math.round(gx2), GY=Math.round(gy2);
            g.fillStyle=INK; g.fillRect(GX-4,GY-1,8,3); g.fillStyle='#2a2a40'; g.fillRect(GX-3,GY,6,1);   // scanner glass
            if (Math.abs(u)<0.3){ g.fillStyle='rgba(255,40,60,0.95)'; g.fillRect(GX-3,GY,6,1); g.fillStyle='rgba(255,60,80,0.45)'; g.fillRect(GX-1,GY-6,1,6); } } }
        // ka-ching: every 7 seconds the cash drawer slides out with a sparkle
        const ph=t%7; if (ph<1.1){ const out=Math.min(1,ph*5)*(ph>0.9?(1.1-ph)*5:1);
          const [dx,dy]=P(f.gx+0.5,f.gy+0.82+out*0.18,20); const DX=Math.round(dx), DY=Math.round(dy);
          g.fillStyle=INK; g.fillRect(DX-6,DY-3,12,5); g.fillStyle='#9aa0b8'; g.fillRect(DX-5,DY-2,10,3); g.fillStyle='#f8d030'; g.fillRect(DX-4,DY-2,2,1); g.fillRect(DX,DY-2,2,1); g.fillStyle='#58b858'; g.fillRect(DX+2,DY-2,2,1);
          if (ph>0.25 && ph<0.8){ g.fillStyle='#fff6b0'; const sxp=DX+7, syp=DY-8-Math.round((ph-0.25)*8); g.fillRect(sxp,syp,1,1); g.fillRect(sxp-1,syp+1,3,1); g.fillRect(sxp,syp+2,1,1); } } }
      else { const [x,y]=P(f.gx+0.5,f.gy+0.5,20); const X=Math.round(x), Y=Math.round(y);   // little stack of paper bags
        if (f.end===1){ g.fillStyle=INK; g.fillRect(X-4,Y-10,8,10); g.fillStyle='#d8b07a'; g.fillRect(X-3,Y-9,6,8); g.fillStyle='#f85888'; g.fillRect(X-3,Y-6,6,2); }
        if (f.end===-1){ g.fillStyle=INK; g.fillRect(X-3,Y-6,7,6); g.fillStyle='#f8d030'; g.fillRect(X-2,Y-5,5,4); } }
      break; }
    case 'rack': { // one stretch of a long chrome rack, with the item for this spot hanging from it
      const z=32;
      { const a=P(f.gx,f.gy+0.5,1), b=P(f.gx+1,f.gy+0.5,1); linePx(a[0],a[1],b[0],b[1],'#6a6a80'); }
      const post=u=>{ const [x0,y0]=P(f.gx+u,f.gy+0.5,0), [x1,y1]=P(f.gx+u,f.gy+0.5,z+2); const X=Math.round(x0);
        g.fillStyle=INK; g.fillRect(X-1,Math.round(y1),3,Math.round(y0-y1)+1); g.fillStyle='#e0e0f0'; g.fillRect(X,Math.round(y1),1,Math.round(y0-y1)); ellPx(x0,y0,4,1.6,'#585870'); };
      if (f.end===-1) post(0.08); if (f.end===1) post(0.92);
      { const a=P(f.gx+(f.end===-1?0.08:0),f.gy+0.5,z), b=P(f.gx+(f.end===1?0.92:1),f.gy+0.5,z); linePx(a[0],a[1]-1,b[0],b[1]-1,INK); linePx(a[0],a[1],b[0],b[1],'#f0f0ff'); linePx(a[0],a[1]+1,b[0],b[1]+1,INK); }
      const [hx,hy]=P(f.gx+0.5,f.gy+0.5,z); const HX=Math.round(hx), HY=Math.round(hy), it=ITEMS[f.item];
      const ic = it.s==='shirt' ? teeIcon(f.item) : itemIcon(f.item), W2=ic.width;
      const wire=(x0,y0,x1,y1)=>linePx(x0,y0,x1,y1,'#b8b8cc');
      let tagX, tagY;
      if (it.s==='shirt' || it.s==='neck'){   // wire hanger: hook over the rail, triangle, bar at the shoulders
        g.fillStyle='#b8b8cc'; g.fillRect(HX,HY-2,1,4); g.fillRect(HX+1,HY-2,1,1);
        wire(HX,HY+2,HX-7,HY+6); wire(HX,HY+2,HX+7,HY+6); wire(HX-7,HY+6,HX+7,HY+6);
        const top = it.s==='shirt' ? HY+5 : HY+6; g.drawImage(ic, HX-Math.floor(W2/2), top);
        if (it.s==='neck'){ g.fillStyle='#d8d8e8'; g.fillRect(HX-7,HY+6,15,1); }
        tagX=HX+Math.ceil(W2/2)-2; tagY=top+3; }
      else if (it.s==='eyes'){   // a little display card hanging on the hook
        g.fillStyle='#b8b8cc'; g.fillRect(HX,HY+1,1,2);
        const cw=Math.max(15,W2+4), cx0=HX-Math.floor(cw/2), cy0=HY+3;
        g.fillStyle=OUT; g.fillRect(cx0,cy0,cw,11); g.fillStyle='#ffffff'; g.fillRect(cx0+1,cy0+1,cw-2,9); g.fillStyle='#e8e2f6'; g.fillRect(cx0+1,cy0+8,cw-2,2);
        g.fillStyle=OUT; g.fillRect(HX-1,cy0+1,3,1);
        g.drawImage(ic, HX-Math.floor(W2/2), cy0+3); tagX=cx0+cw-2; tagY=cy0+7; }
      else {   // hats hang from a peg by a little loop
        g.fillStyle=INK; g.fillRect(HX,HY+1,1,3); g.fillStyle='#b8b8cc'; g.fillRect(HX-1,HY+3,3,1);
        g.drawImage(ic, HX-Math.floor(W2/2), HY+4); tagX=HX+Math.ceil(W2/2)-1; tagY=HY+7; }
      // price tag on a string (green once you own it)
      itemHits.push({id:f.item, x0:HX-Math.floor(W2/2)-3, x1:tagX+9, y0:HY-3, y1:HY+24});
      const own=INV.owned.includes(f.item);
      g.fillStyle='#8a8aa0'; g.fillRect(tagX,tagY,2,1);
      g.fillStyle=OUT; g.fillRect(tagX+2,tagY-1,6,5); g.fillStyle=own?'#7fe0a0':'#fff8e0'; g.fillRect(tagX+3,tagY,4,3); g.fillStyle=own?'#1f8a4c':'#c89818'; g.fillRect(tagX+4,tagY+1,2,1);
      break; }
    case 'adminsign': { // ADMIN plaque: deep purple, gold trim, a little crown; hangs flat on the wall next to its tile
      let cv=adminSignCv; if (!cv){ const txt='ADMIN', W=pfW(txt,2)+22, H=18; cv=adminSignCv=document.createElement('canvas'); cv.width=W; cv.height=H; const m=cv.getContext('2d');
        m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#f8c838'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#3a1e6a'; m.fillRect(3,3,W-6,H-6); m.fillStyle='#5a3498'; m.fillRect(3,3,W-6,2);
        const cr=['#.#.#','#####','#####']; cr.forEach((row,j)=>{ for (let i=0;i<5;i++) if (row[i]==='#'){ m.fillStyle='#f8c838'; m.fillRect(6+i,7+j,1,1); } });
        pfDraw(m,txt,14,5,'#1a0e30',2); pfDraw(m,txt,13,4,'#ffe070',2); }
      const onRight = f.gy===0;   // corner tile (0,0) uses the right wall
      const [X,Y]=onRight ? P(f.gx+0.5,0,52) : P(0,f.gy+0.5,52), W=cv.width, H=cv.height, sl=onRight?0.5:-0.5;
      const x0=Math.round(X-W/2), y0=Math.round(Y-H/2-sl*W/2);
      for (let x=0;x<W;x++) g.drawImage(cv, x,0,1,H, x0+x, y0+Math.round(x*sl), 1, H);
      const glint=(t*0.4)%1; if (glint<0.25){ const gx2=Math.round(W*glint*4); g.fillStyle='rgba(255,255,255,0.5)'; g.fillRect(x0+gx2, y0+Math.round(gx2*sl)+2, 1, H-4); }
      break; }
    case 'chair': { // wooden chair: four legs, grained seat, ladder back: two posts, a middle rail and a top rail (back drawn first when it is on the far side)
      const r=f.rot||0, x=f.gx, y=f.gy, far = r<2, K=h=>recol(h,f.wc,0.55);
      const back = r===0 ? [x+0.16,y+0.2,0.1,0.6] : r===1 ? [x+0.2,y+0.16,0.6,0.1] : r===2 ? [x+0.2,y+0.74,0.6,0.1] : [x+0.74,y+0.2,0.1,0.6];
      const along = back[3]>back[2] ? (u)=>[back[0]+back[2]/2, back[1]+back[3]*u] : (u)=>[back[0]+back[2]*u, back[1]+back[3]/2];   /* follow the back's long side (facing away used to bunch the posts in the middle) */
      const drawBack=()=>{
        for (const u of [0.1,0.9]){ const [bx,by]=along(u); box(bx-0.05,by-0.05,0.1,0.1,15,K('#d8a468'),K('#9a6436'),K('#7a4c26'),0,11); }
        /* ladder back: a slim middle rail between the posts, with open gaps above and below it, so you see through the back from every side */
        wbox(back[0]+0.02,back[1]+0.02,back[2]-0.04,back[3]-0.04,2,K('#e8bc80'),K('#a86c3a'),K('#86522a'),0,16,K('#7a4c26'));
        wbox(back[0]-0.01,back[1]-0.01,back[2]+0.02,back[3]+0.02,4,K('#f0c890'),K('#b07440'),K('#8a5a30'),0,23,K('#7a4c26'));
      };
      if (f.part==='front'){ if (!far) drawBack(); break; }
      for (const [u,v] of [[0.26,0.26],[0.74,0.26],[0.26,0.74],[0.74,0.74]]){ const [lx,ly]=P(x+u,y+v,0), [,ty]=P(x+u,y+v,9); g.fillStyle=INK; g.fillRect(Math.round(lx)-1,Math.round(ty),3,Math.round(ly-ty)+1); g.fillStyle=K('#8a5a30'); g.fillRect(Math.round(lx),Math.round(ty),1,Math.round(ly-ty)); }
      if (far) drawBack();
      wbox(x+0.2,y+0.2,0.6,0.6,2,K('#e8b878'),K('#b07440'),K('#8a5a30'),0,9,K('#b07440'));
      if (!far) drawBack();
      break; }
    case 'armchair': case 'couch': { // velvet seating, n seats wide: base, back, two arms and one cushion per seat, drawn far to near
      const r=f.rot||0, x=f.gx, y=f.gy, n=f.n||1, C=f.col||['#48b8a8','#2a8a7c','#1e6a5e','#7fe0d0'], HI=C[3];
      // u runs along the seats (0..n), v from the back (0) to the front (1)
      const R=(u0,u1,v0,v1)=> r===0 ? [x+v0,y+u0,v1-v0,u1-u0] : r===1 ? [x+u0,y+v0,u1-u0,v1-v0] : r===2 ? [x+u0,y+1-v1,u1-u0,v1-v0] : [x+1-v1,y+u0,v1-v0,u1-u0];
      const B=(q,h,lift,top)=>{ const k=R(...q); box(k[0],k[1],k[2],k[3],h,top||C[0],C[1],C[2],0,lift); return k; };
      const mid=(q,h)=>{ const k=R(...q); return P(k[0]+k[2]/2,k[1]+k[3]/2,h); };
      const U0=0.1, U1=n-0.1, V0=0.1, V1=0.9, BK=0.3, AW=0.2;   // every edge lands on a whole pixel, so both arms come out the same width
      // a point on the piece in its own frame (u along the seats, v back to front), and a line between two such points
      const Q=(u,v,h)=>{ const [wx,wy] = r===0 ? [x+v,y+u] : r===1 ? [x+u,y+v] : r===2 ? [x+u,y+1-v] : [x+1-v,y+u]; return P(wx,wy,h); };
      const LN=(u0,v0,h0,u1,v1,h1,col)=>{ const a2=Q(u0,v0,h0), b2=Q(u1,v1,h1); linePx(a2[0],a2[1],b2[0],b2[1],col); };
      const SW=(U1-U0-2*AW)/n, faceV = r<2 ? BK : V0;   // the side of the back you can see: the cushioned front, or (turned away) its outer back
      const back=()=>{ B([U0,U1,V0,BK],16,9);
        for (let i=1;i<n;i++){ const us=U0+AW+i*SW; LN(us,faceV,11,us,faceV,24,C[2]); LN(us,V0,25,us,BK,25,C[2]); }   // a seam between seat backs
        if (r>=2) LN(U0+0.02,V0,21,U1-0.02,V0,21,C[1]);   // welt line across the outer back
        for (let i=0;i<n;i++){ const um=U0+AW+(i+0.5)*SW; for (const [du,h] of [[-0.12,19],[0.12,19],[0,15]]){ const [bx,by]=Q(um+du,faceV,h); g.fillStyle=C[2]; g.fillRect(Math.round(bx),Math.round(by),1,1); g.fillStyle=tint(C[0],0.12)||C[0]; g.fillRect(Math.round(bx),Math.round(by)-1,1,1); } } };   // buttoned tufting
      const arm=(u0,u1)=>{ B([u0,u1,BK,V1],8,9); if (r<2){ LN(u0+0.04,V1,14,u1-0.04,V1,14,HI); LN(u0+0.04,V1,11,u1-0.04,V1,11,C[2]); } };   // rolled front on the arm
      if (f.part==='front'){ if (f.su===n-1 || n===1) arm(U1-AW,U1); if (r>=2) back(); break; }
      for (const [u,v] of [[U0+0.06,V0+0.06],[U1-0.06,V0+0.06],[U0+0.06,V1-0.06],[U1-0.06,V1-0.06]]){ const k=R(u,u,v,v); const [lx,ly]=P(k[0],k[1],0); g.fillStyle=INK; g.fillRect(Math.round(lx)-1,Math.round(ly)-3,3,4); g.fillStyle='#5a3418'; g.fillRect(Math.round(lx),Math.round(ly)-2,1,2); }
      B([U0,U1,V0,V1],7,2); LN(U0+0.02, r<2?V1:V0, 4, U1-0.02, r<2?V1:V0, 4, C[2]);   // skirt line along the base
      if (r<2) back();
      arm(U0,U0+AW);
      for (let i=0;i<n;i++){ const s0=U0+AW+i*SW, s1=U0+AW+(i+1)*SW; B([s0+0.01,s1-0.01,BK,V1],3,9,HI); if (r<2) LN(s0+0.04,V1,10,s1-0.04,V1,10,C[2]);   // seat cushion with piping
        const [cx,cy]=Q((s0+s1)/2,(BK+V1)/2,12); g.fillStyle=tint(HI,-0.12)||C[1]; g.fillRect(Math.round(cx)-2,Math.round(cy),4,1); }
      arm(U1-AW,U1);
      if (r>=2) back();
      break; }
    case 'beanbag': { // slouchy bean bag: a squashed blob with a raised back, a sitting dent and a soft shine
      const {FP}=frm(f), M='#9a5ae0', D='#6e3cb0', L='#c8a0f8', [cx,cy]=P(f.gx+0.5,f.gy+0.5,0), X=Math.round(cx), Y=Math.round(cy), [bx0,by0]=FP(0.5,0.25,0), BX=Math.round(bx0), BY=Math.round(by0);
      const bump=()=>{ ellO(BX,BY-9,9,7,M); ellPx(BX-1,BY-8,8,5.5,M); ellPx(BX+3,BY-7,4,4,D); ellPx(BX-3,BY-12,3,1.5,L); };
      if ((f.rot||0)<2) bump();
      ellO(X,Y-4,13,6,D); ellPx(X,Y-5,12,5,M); ellPx(X+1,Y-5,6,2.5,tint(M,-0.12)); ellPx(X-6,Y-7,3,1,L);
      if ((f.rot||0)>=2) bump();
      g.fillStyle=D; g.fillRect(X+8,Y-3,3,1); g.fillRect(X-10,Y-3,2,1);
      break; }
    case 'pstool': { // tall bar stool: round base, chrome post, foot ring and a padded red seat
      const [cx,cy]=P(f.gx+0.5,f.gy+0.5,0), X=Math.round(cx), Y=Math.round(cy);
      ellO(X,Y-1,6,3,'#8a8a98'); ellPx(X-2,Y-2,2,1,'#c8c8d4');
      g.fillStyle=INK; g.fillRect(X-2,Y-18,4,17); g.fillStyle='#c0c0cc'; g.fillRect(X-1,Y-18,2,17); g.fillStyle='#f0f0f8'; g.fillRect(X-1,Y-18,1,17);
      ellPx(X,Y-8,7,3,INK); ellPx(X,Y-8,6,2,'#a8a8b8'); ellPx(X,Y-8,3,1,INK); g.fillStyle='#c0c0cc'; g.fillRect(X-1,Y-9,2,2);
      ellO(X,Y-19,8,4,'#b02838'); ellPx(X,Y-21,8,3.5,INK); ellPx(X,Y-21,7,3,'#e03048'); ellPx(X-2,Y-22,3,1,'#ff7088');
      break; }
    case 'ctable': { // low coffee table: walnut top with grain, a lower shelf, a magazine and a mug
      const x=f.gx, y=f.gy;
      for (const [u,v] of [[0.14,0.14],[0.86,0.14],[0.14,0.86],[0.86,0.86]]) box(x+u-0.04,y+v-0.04,0.08,0.08,9,'#7a4a2a','#5a3418','#4a2810');
      wbox(x+0.12,y+0.12,0.76,0.76,1,'#8a5a34','#6a4222','#5a3418',0,3,'#5a3418','t');
      wbox(x+0.08,y+0.08,0.84,0.84,2,'#9a6438','#7a4a2a','#5a3418',0,9,'#6a4020','t');
      { const k=0.2; polyPx([P(x+k,y+0.3,11),P(x+0.48,y+0.3,11),P(x+0.48,y+0.62,11),P(x+k,y+0.62,11)],'#f0e8d8'); const [mx,my]=P(x+0.34,y+0.46,11); g.fillStyle='#e05050'; g.fillRect(Math.round(mx)-3,Math.round(my)-1,5,1); g.fillStyle='#5a88e0'; g.fillRect(Math.round(mx)-1,Math.round(my)+1,4,1); }
      { const [mx,my]=P(x+0.66,y+0.5,11), X=Math.round(mx), Y=Math.round(my); g.fillStyle=INK; g.fillRect(X-3,Y-6,6,7); g.fillStyle='#f8f4ec'; g.fillRect(X-2,Y-5,4,5); g.fillStyle='#6a4020'; g.fillRect(X-2,Y-5,4,1); g.fillStyle=INK; g.fillRect(X+3,Y-4,2,1); g.fillRect(X+4,Y-4,1,3); g.fillRect(X+3,Y-2,2,1); }
      break; }
    case 'rtable': { // round pedestal table: flared foot, turned post, a round grained top with a rim and a little vase of flowers
      const [cx,cy]=P(f.gx+0.5,f.gy+0.5,0), X=Math.round(cx), Y=Math.round(cy);
      ellO(X,Y-1,8,4,'#7a4c26'); ellPx(X,Y-2,6,2.5,'#9a6436');
      g.fillStyle=INK; g.fillRect(X-3,Y-15,6,13); g.fillStyle='#9a6436'; g.fillRect(X-2,Y-15,4,13); g.fillStyle='#c8905a'; g.fillRect(X-2,Y-15,1,13); g.fillStyle=INK; g.fillRect(X-3,Y-9,6,1);
      ellPx(X,Y-16,16,8,INK); ellPx(X,Y-17,15,7,'#9a6436'); ellPx(X,Y-18,14,6.5,'#c8905a'); ellPx(X,Y-18,13,6,'#d8a468');
      g.globalAlpha=0.5; for (const dy of [-21,-18,-15]){ g.fillStyle='#b07440'; g.fillRect(X-8+(dy%3),Y+dy,9,1); } g.globalAlpha=1; g.fillStyle='#f0c890'; g.fillRect(X-9,Y-22,5,1);
      { const VX=X+3, VY=Y-19; g.fillStyle=INK; g.fillRect(VX-3,VY-6,6,7); g.fillStyle='#5ab8e8'; g.fillRect(VX-2,VY-5,4,5); g.fillStyle='#a8e0ff'; g.fillRect(VX-2,VY-5,1,4);
        g.fillStyle='#3a8a3a'; g.fillRect(VX-1,VY-10,1,4); g.fillRect(VX+1,VY-9,1,3); for (const [fx,fy,c] of [[-2,-12,'#f878a8'],[1,-11,'#f8d030'],[-1,-14,'#ffffff']]){ g.fillStyle=INK; g.fillRect(VX+fx-1,VY+fy-1,3,3); g.fillStyle=c; g.fillRect(VX+fx,VY+fy,1,1); } }
      break; }
    case 'flamp': { // tall floor lamp: weighted base, brass pole with a joint, a big drum shade that glows when on
      const [cx,cy]=P(f.gx+0.5,f.gy+0.5,0), X=Math.round(cx), Y=Math.round(cy), lit=!f.off;
      ellO(X,Y-1,7,3,'#4a4a58'); ellPx(X-2,Y-2,2,1,'#8a8a9a');
      g.fillStyle=INK; g.fillRect(X-2,Y-40,3,39); g.fillStyle='#d8b050'; g.fillRect(X-1,Y-40,1,39); g.fillStyle=INK; g.fillRect(X-2,Y-22,3,2);
      if (lit){ ellPx(X,Y-44,22,15,'rgba(248,232,120,0.16)'); ellPx(X,Y-44,13,9,'rgba(248,240,160,0.24)'); ellPx(X,Y-1,12,5,'rgba(248,232,120,0.18)'); }
      { const SH=lit?'#f8e870':'#c8c0b0', SD=lit?'#e0c050':'#a8a090', SL=lit?'#fffbe0':'#e0d8c8';
        polyPx([[X-6,Y-52],[X+6,Y-52],[X+9,Y-39],[X-9,Y-39]],INK); polyPx([[X-5,Y-51],[X+5,Y-51],[X+8,Y-40],[X-8,Y-40]],SH);
        g.fillStyle=SD; g.fillRect(X+3,Y-50,3,10); g.fillStyle=SL; g.fillRect(X-5,Y-50,1,9); g.fillStyle=SD; g.fillRect(X-8,Y-40,16,1); g.fillStyle=SL; g.fillRect(X-4,Y-51,8,1); }
      break; }
    case 'lava': { // lava lamp: silver cone base and cap, glass with glowing blobs drifting up and down (they settle when it's off)
      const [cx,cy]=P(f.gx+0.5,f.gy+0.5,0), X=Math.round(cx), Y=Math.round(cy), on=!f.off;
      polyPx([[X-5,Y],[X+5,Y],[X+3,Y-6],[X-3,Y-6]],INK); polyPx([[X-4,Y-1],[X+4,Y-1],[X+2,Y-5],[X-2,Y-5]],'#a8a8b8'); g.fillStyle='#e0e0ec'; g.fillRect(X-3,Y-2,1,1);
      polyPx([[X-3,Y-6],[X+3,Y-6],[X+4,Y-13],[X+2,Y-19],[X-2,Y-19],[X-4,Y-13]],INK); polyPx([[X-2,Y-7],[X+2,Y-7],[X+3,Y-13],[X+1,Y-18],[X-1,Y-18],[X-3,Y-13]], on?'#ff8a3a':'#a85a3a');
      if (on) ellPx(X,Y-12,9,9,'rgba(255,138,58,0.14)');
      for (let i=0;i<3;i++){ const ph=t*0.5+i*2.1, by = on ? Y-9-((Math.sin(ph)*0.5+0.5)*8) : Y-8-i*0.5, bx=X+(i-1); g.fillStyle=on?'#ffd23f':'#c8902a'; g.fillRect(Math.round(bx)-1,Math.round(by)-1,2+(i%2),2); }
      g.fillStyle='rgba(255,255,255,0.45)'; g.fillRect(X-2,Y-16,1,6);
      polyPx([[X-2,Y-19],[X+2,Y-19],[X+1,Y-22],[X-1,Y-22]],INK); g.fillStyle='#c0c0cc'; g.fillRect(X-1,Y-21,2,2);
      break; }
    case 'cube': { // cube shelf: a white 2x2 cubby unit holding books, a woven basket, a plant and a picture frame
      const {RB,FP,face}=frm(f);
      box(...RB(0.1,0.25,0.8,0.5),26,'#f8f4ec','#dcd4c4','#c4bcac');
      if (face){ const Q2=(u0,u1,h0,h1,col)=>polyPx([FP(u0,0.75,h0),FP(u1,0.75,h0),FP(u1,0.75,h1),FP(u0,0.75,h1)],col);
        for (const [u0,h0] of [[0.14,2],[0.52,2],[0.14,14],[0.52,14]]) Q2(u0,u0+0.34,h0,h0+10,'#8a8070');
        for (const [u0,h0] of [[0.16,3],[0.54,3],[0.16,15],[0.54,15]]) Q2(u0,u0+0.3,h0,h0+8,'#5a5248');
        { const cols=['#e03048','#3a7ad8','#f8d030','#4aa04a']; for (let i=0;i<4;i++) Q2(0.18+i*0.065,0.18+i*0.065+0.05,3,9+(i%2),cols[i]); }   // books
        Q2(0.56,0.82,3,8,'#c89858'); for (let h=4;h<8;h+=2){ const a2=FP(0.57,0.75,h), b2=FP(0.81,0.75,h); linePx(a2[0],a2[1],b2[0],b2[1],'#9a7038'); }   // basket
        { const [px,py]=FP(0.33,0.75,15); ellPx(Math.round(px),Math.round(py)-1,3,1.5,'#c8642e'); ellPx(Math.round(px),Math.round(py)-4,3.5,3,'#3a8f3a'); ellPx(Math.round(px)-1,Math.round(py)-5,1.5,1,'#6ac06a'); }   // plant
        Q2(0.6,0.78,16,22,INK); Q2(0.62,0.76,17,21,'#a8d8f8'); }   // little picture frame
      break; }
    case 'dresser': { // wooden dresser: three drawers with brass pulls, a top with a jewellery box and a tiny round mirror
      const {RB,FP,face}=frm(f);
      wbox(...RB(0.1,0.25,0.8,0.5),20,'#b07440','#8a5a30','#6a4220',0,2,'#5a3418',face?'r':'lr');
      for (const [u,v] of [[0.14,0.3],[0.86,0.3],[0.14,0.7],[0.86,0.7]]){ const k=RB(u-0.03,v-0.03,0.06,0.06); box(...k,2,'#6a4220','#4a2e16','#3a2410'); }
      wbox(...RB(0.07,0.22,0.86,0.56),2,'#d8a468','#9a6436','#7a4c26',0,22,'#9a6436','t');
      if (face){ for (const h0 of [4,10,16]){ const q=[FP(0.15,0.75,h0),FP(0.85,0.75,h0),FP(0.85,0.75,h0+5),FP(0.15,0.75,h0+5)]; polyPx(q,'#9a6436'); for (let i=0;i<4;i++){ const a2=q[i], b2=q[(i+1)%4]; linePx(a2[0],a2[1],b2[0],b2[1],'#5a3418'); }
          for (const u of [0.35,0.65]){ const [kx,ky]=FP(u,0.75,h0+2.5); g.fillStyle=INK; g.fillRect(Math.round(kx)-1,Math.round(ky)-1,3,2); g.fillStyle='#f0c860'; g.fillRect(Math.round(kx),Math.round(ky)-1,1,1); } } }
      { const [jx,jy]=FP(0.32,0.5,24); g.fillStyle=INK; g.fillRect(Math.round(jx)-3,Math.round(jy)-4,7,5); g.fillStyle='#c83a5a'; g.fillRect(Math.round(jx)-2,Math.round(jy)-3,5,3); g.fillStyle='#f8d030'; g.fillRect(Math.round(jx),Math.round(jy)-3,1,1); }
      { const [mx,my]=FP(0.66,0.4,24); ellPx(Math.round(mx),Math.round(my)-7,4,5,INK); ellPx(Math.round(mx),Math.round(my)-7,3,4,'#c8e8f8'); g.fillStyle='#ffffff'; g.fillRect(Math.round(mx)-1,Math.round(my)-9,1,2); g.fillStyle=INK; g.fillRect(Math.round(mx)-1,Math.round(my)-2,3,2); }
      break; }
    case 'cactus': { // potted cactus: ribbed body with two arms, little spines and a pink flower on top
      const x=f.gx, y=f.gy; box(x+0.34,y+0.34,0.32,0.32,6,'#5a3018','#c8642e','#a04a1c'); box(x+0.31,y+0.31,0.38,0.38,2,'#4a2810','#e07a40','#b85a28',0,6);
      const [cx,cy]=P(x+0.5,y+0.5,8), X=Math.round(cx), Y=Math.round(cy), G='#4aa04a', GD='#2e7a2e', GL='#7fd07f';
      const col=(x0,y0,w,h)=>{ g.fillStyle=INK; g.fillRect(x0-1,y0-1,w+2,h+2); g.fillStyle=G; g.fillRect(x0,y0,w,h); g.fillStyle=GD; g.fillRect(x0+w-1,y0,1,h); g.fillStyle=GL; g.fillRect(x0,y0,1,h); };
      col(X-6,Y-12,3,5); col(X-6,Y-12,4,2); col(X+4,Y-15,3,6); col(X+3,Y-11,3,2);
      col(X-3,Y-20,6,20); g.fillStyle=GD; g.fillRect(X,Y-19,1,18); g.fillStyle=INK; g.fillRect(X-2,Y-21,4,1);
      g.fillStyle='#f8f4e0'; for (const [dx,dy] of [[-4,-16],[3,-13],[-4,-8],[3,-5],[-7,-10],[7,-12]]) g.fillRect(X+dx,Y+dy,1,1);
      g.fillStyle=INK; g.fillRect(X-2,Y-24,4,3); g.fillStyle='#f878b8'; g.fillRect(X-1,Y-23,2,2); g.fillStyle='#ffd0e8'; g.fillRect(X-1,Y-23,1,1);
      break; }
    case 'plot': { // raised garden bed: plank frame, dark soil with furrows, and what's growing (stages from seed to ripe)
      const x=f.gx, y=f.gy, st=plotState(f), wet=st&&st.wat;
      box(x+0.06,y+0.06,0.88,0.88,5,'#9a6636','#b07a44','#7a4a22');
      { const a=x+0.15,b=y+0.15,c=x+0.85,e=y+0.85; polyPx([P(a,b,5),P(c,b,5),P(c,e,5),P(a,e,5)], wet?'#3a2214':'#5a3820');
        for (let k=0;k<3;k++){ const v=b+0.12+k*0.23, p=P(a+0.05,v,5), q=P(c-0.05,v,5); linePx(p[0],p[1],q[0],q[1], wet?'#2a180c':'#4a2c16'); }
        if (wet){ g.fillStyle='#7ab8e8'; for (const [u,v] of [[0.3,0.4],[0.62,0.7],[0.7,0.3]]){ const [px2,py2]=P(x+u,y+v,5); g.fillRect(Math.round(px2),Math.round(py2),1,1); } } }
      if (st){ const stage = st.ready ? 3 : st.p<0.15 ? 0 : st.p<0.5 ? 1 : 2;
        for (const [u,v] of [[0.33,0.33],[0.67,0.33],[0.33,0.67],[0.67,0.67]]){ const [X,Y]=P(x+u,y+v,5); drawCrop(st.crop, stage, Math.round(X), Math.round(Y), t); }
        const [bx,by]=P(x+0.5,y+0.5,30), BX=Math.round(bx), BY=Math.round(by);
        if (!st.ready){ g.fillStyle=INK; g.fillRect(BX-9,BY,18,4); g.fillStyle='#3a3050'; g.fillRect(BX-8,BY+1,16,2); g.fillStyle=st.wat?'#58b8f8':'#7ce07c'; g.fillRect(BX-8,BY+1,Math.max(1,Math.round(16*st.p)),2); }
        else { const bob=Math.round(Math.sin(t*4)*1.5), Y2=BY-2+bob; g.fillStyle=INK; g.fillRect(BX-3,Y2-3,7,7); g.fillStyle='#ffe066'; g.fillRect(BX-2,Y2-2,5,5); g.fillStyle='#fff8c0'; g.fillRect(BX-1,Y2-2,1,2); g.fillStyle=INK; g.fillRect(BX,Y2-1,1,2); g.fillRect(BX,Y2+2,1,1); } }
      if (f.fid){ const q=[P(x,y+1,0),P(x+1,y,0),P(x,y,0),P(x+1,y+1,0)]; pvHits.push({x0:Math.min(...q.map(v=>v[0]))-2, x1:Math.max(...q.map(v=>v[0]))+2, y0:Math.min(...q.map(v=>v[1]))-30, y1:Math.max(...q.map(v=>v[1]))+2, f}); }
      break; }
    case 'scarecrow': { // farm scarecrow: post and crossbar, burlap head with stitched smile, straw hat, plaid shirt under blue overalls, straw hands, and a crow on one arm
      const X=Math.round(sx), Y=Math.round(sy), R=(x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(X+x,Y+y,w,h); };
      ellPx(X,Y,9,3,'rgba(0,0,0,0.22)');
      R(-2,-40,5,40,INK); R(-1,-40,3,40,'#9a6a3a'); R(1,-40,1,40,'#7a4e26');
      R(-17,-33,35,5,INK); R(-16,-32,33,3,'#9a6a3a'); R(-16,-30,33,1,'#7a4e26');
      // shirt with sleeves, then overalls
      R(-15,-34,31,8,INK); R(-14,-33,29,6,'#d84a3a'); for (let i=-14;i<15;i+=4) R(i,-33,1,6,'#a8302a'); R(-14,-31,29,1,'#a8302a'); R(-14,-33,29,1,'#f07a60');
      R(-9,-35,19,20,INK); R(-8,-34,17,18,'#d84a3a'); for (let i=-8;i<9;i+=4) R(i,-34,1,18,'#a8302a'); for (let j=-34;j<-16;j+=4) R(-8,j,17,1,'#a8302a');
      R(-7,-26,15,12,INK); R(-6,-25,13,10,'#4a6ad8'); R(-6,-25,13,1,'#7a98f0'); R(-5,-32,2,7,'#4a6ad8'); R(4,-32,2,7,'#4a6ad8'); R(-5,-32,2,1,'#f8d030'); R(4,-32,2,1,'#f8d030');
      R(-4,-21,7,4,'#3a54b0'); R(-3,-20,5,2,'#5a7ae0'); R(-1,-20,1,2,'#3a54b0');   /* bib pocket */ R(2,-17,3,2,'#e8c860');   /* patch */
      // straw hands and tufts
      g.fillStyle='#f0d060'; for (const [a,b] of [[-19,-33],[-19,-31],[-18,-29],[-20,-30],[18,-33],[18,-31],[17,-29],[19,-30],[-3,-14],[0,-14],[3,-14],[-1,-13],[2,-13]]) g.fillRect(X+a,Y+b,1,2);
      g.fillStyle='#c8a030'; for (const [a,b] of [[-18,-32],[18,-32],[-2,-13],[1,-13]]) g.fillRect(X+a,Y+b,1,2);
      // head with stitched face, rope at the neck
      ellPx(X,Y-41,6.5,6,INK); ellPx(X,Y-41,5.5,5,'#dcbc80'); ellPx(X-1,Y-42,3,2.5,'#ecd09a');
      R(-3,-43,2,2,INK); R(2,-43,2,2,INK); R(-3,-38,7,1,INK); R(-3,-39,1,1,INK); R(3,-39,1,1,INK); R(-1,-38,1,1,'#dcbc80'); R(1,-38,1,1,'#dcbc80');
      R(-5,-36,11,2,'#b08848'); R(-5,-36,11,1,'#d0a860');
      // straw hat with a red band
      R(-10,-47,21,3,INK); R(-9,-46,19,1,'#f0d070'); R(-6,-53,13,7,INK); R(-5,-52,11,5,'#e8c860'); R(-5,-52,11,1,'#f8e090'); R(-5,-48,11,2,'#d84a3a'); g.fillStyle='#c8a040'; for (let i=-8;i<10;i+=3) g.fillRect(X+i,Y-45,1,1);
      // a crow perched on the right arm, hopping now and then
      { const hop=Math.floor(t*0.7)%5===0 ? -1 : 0, cx2=X+13, cy2=Y-38+hop; g.fillStyle=INK; g.fillRect(cx2-3,cy2,8,5); g.fillRect(cx2+3,cy2-3,4,4); g.fillRect(cx2-6,cy2+1,4,2);
        g.fillStyle='#2a2838'; g.fillRect(cx2-2,cy2+1,6,3); g.fillRect(cx2+4,cy2-2,2,2); g.fillStyle='#4a4860'; g.fillRect(cx2-1,cy2+1,3,1); g.fillStyle='#f8a020'; g.fillRect(cx2+7,cy2-1,2,1); g.fillStyle='#ffffff'; g.fillRect(cx2+5,cy2-2,1,1); g.fillStyle=INK; g.fillRect(cx2,cy2+5,1,1); g.fillRect(cx2+2,cy2+5,1,1); }
      break; }
    case 'wheelbarrow': { // red wheelbarrow, hand-drawn on the floor's slant: soil heaped in a tapered tub, front wheel with spokes, wooden handles with grips, two legs
      const ox=Math.round(sx)-16, oy=Math.round(sy)-19, o=(x,y)=>[ox+x, oy+y], L=(a,b,c)=>linePx(a[0],a[1],b[0],b[1],c), F=(pts,c)=>polyPx(pts.map(q=>o(q[0],q[1])),c);
      ellPx(ox+17,oy+20,14,3,'rgba(0,0,0,0.22)');
      // handles and legs first: the tub hides their front ends
      for (const [a,b] of [[[10,4],[34,16]],[[4,10],[28,22]]]){ L(o(...a),o(...b),INK); L(o(a[0],a[1]+1),o(b[0],b[1]+1),'#b07a44'); L(o(a[0],a[1]+2),o(b[0],b[1]+2),INK); }
      for (const [x,y] of [[32,15],[26,21]]){ g.fillStyle=INK; g.fillRect(ox+x-1,oy+y-1,4,4); g.fillStyle='#2e2e38'; g.fillRect(ox+x,oy+y,2,2); g.fillStyle='#5a5a68'; g.fillRect(ox+x,oy+y,1,1); }
      for (const [a,b] of [[[13,15],[12,21]],[[21,12],[21,17]]]){ L(o(...a),o(...b),INK); L(o(a[0]+1,a[1]),o(b[0]+1,b[1]),'#7a4a22'); L(o(a[0]+2,a[1]),o(b[0]+2,b[1]),INK); }
      // tub: rim rhombus A B C D, tapered bottom D' C' B'
      const A=[12,2], B=[24,8], C=[16,12], D=[4,6], Dp=[7,11], Cp=[16,17], Bp=[22,13];
      F([D,C,Cp,Dp],'#d84a3a'); F([C,B,Bp,Cp],'#a8302a');
      F([[5,6.5],[15.5,11.5],[15.5,12.5],[5.5,7.5]],'#f07a64');   /* light catching the left face just under the rim */
      F([[17,12],[23,9],[23,10],[17,13]],'#c03a30');
      F([A,B,C,D],'#5a3a20');
      // soil heap with lumps
      ellPx(ox+14,oy+7,6,2.5,'#7a5232'); ellPx(ox+13,oy+6.5,4,1.5,'#8e6440'); ellPx(ox+12,oy+6,2,0.8,'#a87a50');
      g.fillStyle='#4a2e18'; for (const [x,y] of [[9,8],[18,8],[15,10],[11,4]]) g.fillRect(ox+x,oy+y,1,1);
      // little trowel stuck in the soil
      g.fillStyle=INK; g.fillRect(ox+17,oy+1,3,4); g.fillStyle='#9a6a3a'; g.fillRect(ox+18,oy+2,1,2); g.fillStyle=INK; g.fillRect(ox+16,oy+4,4,3); g.fillStyle='#c8d0dc'; g.fillRect(ox+17,oy+5,2,1);
      for (const [p,q] of [[A,B],[B,C],[C,D],[D,A],[D,Dp],[C,Cp],[B,Bp],[Dp,Cp],[Cp,Bp]]) L(o(...p),o(...q),INK);
      // front wheel: tyre, rim, spokes and hub, on a little fork
      L(o(5,14),o(8,11),INK); L(o(5,14),o(10,12),INK);
      { const W=ox+5, V=oy+15; ellPx(W,V,4.5,5,INK); ellPx(W,V,3.5,4,'#2e2e38'); ellPx(W,V,2.3,2.8,'#8a8a98'); ellPx(W,V,1.3,1.8,'#2e2e38');
        const sp=Math.floor(t*0)%2; g.fillStyle='#8a8a98'; g.fillRect(W,V-3,1,7); g.fillRect(W-2,V,5,1); g.fillStyle='#d8dce6'; g.fillRect(W,V,1,1); g.fillStyle='#5a5a68'; g.fillRect(W-3,V-2,1,1); g.fillRect(W+3,V+2,1,1); }
      break; }
    case 'trough': { // wooden water trough with iron bands and stubby legs; the water ripples and catches the light
      const x=f.gx, y=f.gy; box(x+0.1,y+0.24,0.8,0.52,10,'#9a6636','#b07a44','#7a4a22');
      grain(x+0.1,y+0.24,0.8,0.52,10,0,'#8a5a2e','lr');
      for (const u of [0.24,0.76]){ const a=P(x+u,y+0.76,1), b=P(x+u,y+0.76,10); linePx(a[0],a[1],b[0],b[1],'#4a4a58'); linePx(a[0]+1,a[1],b[0]+1,b[1],'#7a7a8a'); }
      { const a=P(x+0.9,y+0.34,1), b=P(x+0.9,y+0.34,10); linePx(a[0],a[1],b[0],b[1],'#4a4a58'); }
      { const a=x+0.17,b=y+0.31,c=x+0.83,e=y+0.69; polyPx([P(a,b,10),P(c,b,10),P(c,e,10),P(a,e,10)],'#5a3a1e'); polyPx([P(a+0.02,b+0.04,9),P(c-0.02,b+0.04,9),P(c-0.02,e-0.02,9),P(a+0.02,e-0.02,9)],'#3e88d0');
        polyPx([P(a+0.02,b+0.04,9),P(c-0.02,b+0.04,9),P(c-0.06,b+0.12,9),P(a+0.06,b+0.12,9)],'#2e70b8');
        const sh=t*0.6; for (let k=0;k<4;k++){ const u=a+0.08+(((k*0.19)+sh*0.08)%0.56), v=b+0.16+(k%2)*0.2, p=P(u,v,9), q=P(u+0.1,v,9); linePx(p[0],p[1],q[0],q[1],'#a8dcff'); }
        const gl=P(x+0.3,y+0.45,9); g.fillStyle='#e8f6ff'; g.fillRect(Math.round(gl[0]),Math.round(gl[1]),2,1); }
      break; }
    case 'beehive': { // white hive boxes on a little wooden stand: frame lines, an entrance with a landing board, a gabled roof, honey drip and busy bees
      const x=f.gx, y=f.gy;
      for (const [u,v] of [[0.24,0.76],[0.76,0.76],[0.76,0.24]]){ const a=P(x+u,y+v,0), b=P(x+u,y+v,5); linePx(a[0],a[1],b[0],b[1],INK); linePx(a[0]+1,a[1],b[0]+1,b[1],'#7a4a22'); }
      box(x+0.2,y+0.2,0.6,0.6,2,'#9a6a3a','#8a5a30','#6a4222',0,5);
      box(x+0.24,y+0.24,0.52,0.52,9,'#f6f2e6','#f2ecda','#d8d0bc',0,7); box(x+0.24,y+0.24,0.52,0.52,8,'#fdf6de','#f8e8b8','#e0cc90',0,16); box(x+0.24,y+0.24,0.52,0.52,7,'#f6f2e6','#f2ecda','#d8d0bc',0,24);
      for (const z of [11,20,28]){ const a=P(x+0.26,y+0.76,z), b=P(x+0.74,y+0.76,z), c=P(x+0.76,y+0.26,z), d=P(x+0.76,y+0.74,z); linePx(a[0],a[1],b[0],b[1],'#c8c0a8'); linePx(c[0],c[1],d[0],d[1],'#b8b098'); }
      // entrance slot and landing board
      { const a=P(x+0.36,y+0.76,8), b=P(x+0.64,y+0.76,8); linePx(a[0],a[1],b[0],b[1],INK); linePx(a[0],a[1]-1,b[0],b[1]-1,INK); polyPx([P(x+0.34,y+0.76,7),P(x+0.66,y+0.76,7),P(x+0.66,y+0.86,6),P(x+0.34,y+0.86,6)],'#b07a44'); }
      // gabled roof with overhang
      { const r0=31, rh=7, A=P(x+0.16,y+0.84,r0), B=P(x+0.84,y+0.84,r0), C=P(x+0.84,y+0.16,r0), D=P(x+0.16,y+0.16,r0), E=P(x+0.16,y+0.5,r0+rh), F=P(x+0.84,y+0.5,r0+rh);
        polyPx([A,B,F,E],'#c0854a'); polyPx([B,C,F],'#8a5a30'); polyPx([D,E,F,C],'#a8743e');
        for (const [p,q] of [[A,B],[B,F],[E,F],[A,E],[B,C],[C,F]]) linePx(p[0],p[1],q[0],q[1],INK); const m=P(x+0.3,y+0.67,r0+3.5), n=P(x+0.7,y+0.67,r0+3.5); linePx(m[0],m[1],n[0],n[1],'#d8a060'); }
      // honey drip
      { const [hx,hy]=P(x+0.66,y+0.76,15); const drip=2+Math.floor((t*1.5)%3); g.fillStyle='#e8a018'; g.fillRect(Math.round(hx),Math.round(hy),2,drip); g.fillStyle='#ffd048'; g.fillRect(Math.round(hx),Math.round(hy),1,1); }
      for (let k=0;k<4;k++){ const an=t*(2.2+k*0.45)+k*1.7, bx2=sx+Math.cos(an)*(10+k*2), by2=sy-26+Math.sin(an*1.3)*7-k*3, X=Math.round(bx2), Y=Math.round(by2), fl=Math.floor(t*20+k)%2;
        g.fillStyle='rgba(255,255,255,0.8)'; g.fillRect(X-1,Y-2+fl,2,1); g.fillRect(X+1,Y-2+fl,2,1); g.fillStyle=INK; g.fillRect(X-1,Y,4,3); g.fillStyle='#f8d030'; g.fillRect(X,Y,1,3); g.fillRect(X+2,Y,1,3); }
      break; }
    case 'appletree': { // apple tree: rooted trunk with bark, a big shaded crown in layered leafy clumps, ripe red apples and the odd one on the grass
      const x=f.gx, y=f.gy, X=Math.round(sx), Y=Math.round(sy); ellPx(X+2,Y+1,15,5,'rgba(0,0,0,0.22)');
      g.fillStyle=INK; g.fillRect(X-4,Y-24,8,24); g.fillRect(X-7,Y-3,14,3); g.fillStyle='#7a4e26'; g.fillRect(X-3,Y-24,6,24); g.fillRect(X-6,Y-2,12,1); g.fillStyle='#9a6a3a'; g.fillRect(X-2,Y-24,2,22); g.fillStyle='#5a3418'; g.fillRect(X+1,Y-20,1,3); g.fillRect(X-1,Y-12,1,3); g.fillRect(X+1,Y-7,1,2);
      g.fillStyle=INK; g.fillRect(X-9,Y-28,6,2); g.fillRect(X+3,Y-31,7,2);
      for (const [cx,cy,rx,ry,c] of [[0,-36,17,12,'#2a7a34'],[-11,-42,10,9,'#2e8a3a'],[11,-43,10,9,'#2a7a34'],[0,-50,12,9,'#3a9a44'],[-7,-56,7,6,'#48b050'],[7,-55,7,6,'#3a9a44']]) ellO(X+cx,Y+cy,rx,ry,c);
      for (const [cx,cy,rx,ry,c] of [[-10,-45,5,4,'#4aa850'],[-3,-53,6,4,'#58c060'],[4,-58,4,3,'#68d070'],[9,-46,4,3,'#40a048'],[-12,-38,3,2,'#3a9a44'],[3,-40,5,3,'#3a9a44']]) ellPx(X+cx,Y+cy,rx,ry,c);
      g.fillStyle='#1e6a2a'; for (const [a,b] of [[-14,-33],[12,-34],[-2,-27],[6,-29],[-16,-40],[16,-41]]) g.fillRect(X+a,Y+b,3,1);
      for (const [a,b] of [[-11,-35],[7,-33],[-4,-44],[11,-45],[-8,-52],[4,-51],[0,-31],[14,-38],[-14,-42]]){ g.fillStyle=INK; g.fillRect(X+a-1,Y+b-1,5,5); g.fillStyle='#e83850'; g.fillRect(X+a,Y+b,3,3); g.fillStyle='#ff9aa8'; g.fillRect(X+a,Y+b,1,1); g.fillStyle='#a82838'; g.fillRect(X+a+2,Y+b+2,1,1); g.fillStyle='#5a3418'; g.fillRect(X+a+1,Y+b-2,1,1); }
      { const [ax,ay]=P(x+0.82,y+0.78,0); const A=Math.round(ax), B=Math.round(ay); g.fillStyle=INK; g.fillRect(A-1,B-3,5,4); g.fillStyle='#e83850'; g.fillRect(A,B-2,3,2); g.fillStyle='#ff9aa8'; g.fillRect(A,B-2,1,1); }
      break; }
    case 'sunflowers': { // three sunflowers in a little tilled bed: hand-drawn heads (layered petals, seeded centres), leafy stems that sway
      const X=Math.round(sx), Y=Math.round(sy);
      ellPx(X,Y+1,11,3.2,INK); ellPx(X,Y+0.6,10,2.4,'#5a3820'); ellPx(X-3,Y,5,1.2,'#7a5232'); g.fillStyle='#3e2414'; for (const [a,b] of [[4,1],[-7,1],[1,2],[7,0]]) g.fillRect(X+a,Y+b,1,1);
      g.fillStyle='#4a9a3a'; for (const [a,h] of [[-9,3],[-8,2],[9,3],[8,2],[-2,2],[3,3]]) g.fillRect(X+a,Y-h+1,1,h);
      for (const [dx,h,flip] of [[-6,20,1],[1,30,0],[7,16,1]]){ const sw=Math.round(Math.sin(t*1.3+dx*0.7)*0.8), top=Y-h, hx=X+dx+sw;
        g.fillStyle=INK; g.fillRect(X+dx-1,top,4,h); g.fillStyle='#3e8a34'; g.fillRect(X+dx,top,1,h); g.fillStyle='#5ab04a'; g.fillRect(X+dx+1,top,1,h);
        for (const [ly,side] of [[Math.round(h*0.35),flip?1:-1],[Math.round(h*0.62),flip?-1:1]]) spr(side<0?SF_LEAF_L:SF_LEAF_R, side<0?X+dx-5:X+dx+2, Y-ly-1, SF_PAL);
        sprO(SF_HEAD, hx-5, top-10, SF_PAL); }
      break; }
    case 'gfence': { // white picket fence along one edge of the tile (turns with the piece): two rails behind, pointed pickets in front, soft shading on the shady side
      const x=f.gx, y=f.gy, along=(f.rot||0)%2===0, pt=u=> along ? [x+u, y+0.5] : [x+0.5, y+u];
      for (const h of [4,10]){ const [a1,b1]=pt(0.02), [a2,b2]=pt(0.98), p=P(a1,b1,h), q=P(a2,b2,h); linePx(p[0],p[1]-2,q[0],q[1]-2,INK); linePx(p[0],p[1]-1,q[0],q[1]-1,'#ffffff'); linePx(p[0],p[1],q[0],q[1],'#d8d2c4'); linePx(p[0],p[1]+1,q[0],q[1]+1,INK); }
      { const [a,b]=pt(0.5), [mx,my]=P(a,b,0); ellPx(Math.round(mx),Math.round(my)+1,12,2,'rgba(0,0,0,0.15)'); }
      for (const u of [0.1,0.36,0.62,0.88]){ const [a,b]=pt(u), [X0,Y0]=P(a,b,0), X=Math.round(X0), Y=Math.round(Y0), H=14;
        g.fillStyle=INK; g.fillRect(X-2,Y-H,5,H+1); g.fillRect(X-1,Y-H-1,3,1); g.fillRect(X,Y-H-2,1,1);
        g.fillStyle='#ffffff'; g.fillRect(X-1,Y-H,2,H); g.fillRect(X,Y-H-1,1,1); g.fillStyle='#e2ddd2'; g.fillRect(X+1,Y-H+1,1,H-1); g.fillStyle='#c8c2b4'; g.fillRect(X-1,Y-2,3,2); }
      break; }
    case 'flowers': { // glazed blue pot of tulips: red, yellow and pink heads on green stems with leaves
      const x=f.gx, y=f.gy; box(x+0.32,y+0.32,0.36,0.36,7,'#2a3a7a','#4a6ad8','#3a54b0'); box(x+0.29,y+0.29,0.42,0.42,2,'#1a2450','#6a8ae8','#4a6ad8',0,7);
      const [cx,cy]=P(x+0.5,y+0.5,9), X=Math.round(cx), Y=Math.round(cy);
      ellPx(X,Y,5,1.5,'#3a2010');
      for (const [dx,h,c] of [[-4,12,'#e03048'],[0,16,'#f8d030'],[4,13,'#f878b8'],[-1,10,'#ffffff'],[2,9,'#e03048']]){ g.fillStyle='#3a8a3a'; g.fillRect(X+dx,Y-h,1,h); }
      g.fillStyle='#4aa04a'; g.fillRect(X-6,Y-6,3,2); g.fillRect(X+4,Y-7,3,2); g.fillRect(X-3,Y-9,2,3);
      for (const [dx,h,c] of [[-4,12,'#e03048'],[0,16,'#f8d030'],[4,13,'#f878b8'],[-1,10,'#ffffff'],[2,9,'#e03048']]){ g.fillStyle=INK; g.fillRect(X+dx-2,Y-h-4,5,5); g.fillStyle=c; g.fillRect(X+dx-1,Y-h-3,3,3); g.fillStyle=tint(c,-0.25)||c; g.fillRect(X+dx,Y-h-3,1,3); g.fillStyle=INK; g.fillRect(X+dx,Y-h-4,1,1); }
      break; }
    case 'boombox': { // chunky boombox: two speakers, a tape deck, a carry handle, and music notes floating up when it's on
      const {RB,FP,face}=frm(f), on=!f.off;
      box(...RB(0.12,0.38,0.76,0.26),13,'#4a4a5a','#2e2e3a','#24242e',0,0);
      { const a2=FP(0.24,0.5,13), b2=FP(0.24,0.5,18), c2=FP(0.76,0.5,18), d2=FP(0.76,0.5,13); for (const [p0,p1] of [[a2,b2],[b2,c2],[c2,d2]]){ linePx(p0[0],p0[1]-0,p1[0],p1[1],INK); } }
      if (face){ const circ=(uc,hc,ru,rh,col)=>{ const pts=[]; for (let i=0;i<14;i++){ const a3=i/14*Math.PI*2; pts.push(FP(uc+Math.cos(a3)*ru,0.64,hc+Math.sin(a3)*rh)); } polyPx(pts,col); };
        const pump = on ? (Math.floor(t*4)%2) : 0;
        for (const uc of [0.27,0.73]){ circ(uc,6.5,0.13+pump*0.01,5+pump*0.3,INK); circ(uc,6.5,0.11,4.2,'#6a6a7c'); circ(uc,6.5,0.05,2,'#1a1a22'); }
        { const q=[FP(0.42,0.64,4),FP(0.58,0.64,4),FP(0.58,0.64,10),FP(0.42,0.64,10)]; polyPx(q,'#1a1a22'); const k2=FP(0.5,0.64,7); g.fillStyle='#c8c8d4'; g.fillRect(Math.round(k2[0])-2,Math.round(k2[1]),4,1); }
        { const k2=FP(0.5,0.64,11.5); g.fillStyle=on?'#3ddc75':'#2a6a3a'; g.fillRect(Math.round(k2[0]),Math.round(k2[1]),1,1); } }
      if (on){ const [nx,ny]=FP(0.5,0.5,20); for (let i=0;i<2;i++){ const ph=(t*0.6+i*0.5)%1, X=Math.round(nx+(i?6:-6)+Math.sin(ph*6)*2), Y=Math.round(ny-ph*14); g.globalAlpha=1-ph; g.fillStyle=INK; g.fillRect(X,Y-4,1,5); g.fillRect(X-2,Y,3,2); g.fillStyle=i?'#f878b8':'#5ab8e8'; g.fillRect(X+1,Y-4,2,1); g.globalAlpha=1; } }
      break; }
    case 'rug': { // flat on the floor; u along the width, v along the depth (swapped when turned)
      const k=f.k, x=f.gx, y=f.gy, sw=(f.rot||0)%2, [W0,D0]=FURN_DIM['rug_'+k]||[2,2], W=sw?D0:W0, D=sw?W0:D0;
      const F=(u,v)=>{ const [a2,b2]= sw ? [x+v*W/D0*0+v, y+u] : [x+u, y+v]; return P(a2,b2,0); };   // u runs the long way
      const UL=sw?D:W, VL=sw?W:D;   // long side, short side in the rug's own terms
      const q=(u0,v0,u1,v1,col)=>polyPx([F(u0,v0),F(u1,v0),F(u1,v1),F(u0,v1)],col);
      const ol=(u0,v0,u1,v1)=>{ const pts=[F(u0,v0),F(u1,v0),F(u1,v1),F(u0,v1)]; for (let i=0;i<4;i++){ const a2=pts[i], b2=pts[(i+1)%4]; linePx(a2[0],a2[1],b2[0],b2[1],INK); } };
      if (k.startsWith('mat_')){ const [C0,C1,C2]=({green:['#3f8a5a','#2f6e46','#6ab88a'],red:['#c8344a','#8e1c2e','#f07080'],blue:['#3a6ad8','#22489a','#7aa4f0'],coir:['#c8944a','#8a6024','#e8c080'],pink:['#f070a8','#b83c78','#ffb0d0'],purple:['#8a5cd8','#5a34a0','#b898f0']})[k.slice(4)]||['#3f8a5a','#2f6e46','#6ab88a'], L=UL, Wd=VL, mu=0.2, mv=0.06;   // welcome mat: chunky bristle mat, dark edge, light trim, a row of cream 'WELCOME' letters
        q(mu,mv,L-mu,Wd-mv,C1); q(mu+0.07,mv+0.1,L-mu-0.07,Wd-mv-0.1,C0);
        { const t=[F(mu+0.12,mv+0.17),F(L-mu-0.12,mv+0.17),F(L-mu-0.12,Wd-mv-0.17),F(mu+0.12,Wd-mv-0.17)]; for (let n=0;n<4;n++){ const a2=t[n], b2=t[(n+1)%4]; linePx(a2[0],a2[1],b2[0],b2[1],C2); } }
        for (let u=mu+0.15; u<L-mu-0.12; u+=0.08) for (let v=mv+0.22; v<Wd-mv-0.2; v+=0.1){ const c=F(u,v); if ((Math.round(u*37)+Math.round(v*23))%4===0){ g.fillStyle=C1; g.fillRect(Math.round(c[0]),Math.round(c[1]),1,1); } }
        { const n=7, u0=mu+0.32, u1=L-mu-0.32; for (let n2=0;n2<n;n2++){ const c=F(u0+(u1-u0)*n2/(n-1), Wd/2); const X=Math.round(c[0]), Y=Math.round(c[1]); g.fillStyle='#fff4d8'; g.fillRect(X-1,Y-2,2,3); g.fillStyle=C1; g.fillRect(X,Y-1,1,1); } }
        ol(mu,mv,L-mu,Wd-mv); }
      else if (k==='persian'){ const L=UL, Wd=VL, m=0.08;
        // fringe on the short ends
        for (let v=m+0.06; v<Wd-m; v+=0.12){ for (const [u0,u1] of [[m,m-0.07],[L-m,L-m+0.07]]){ const a2=F(u0,v), b2=F(u1,v); linePx(a2[0],a2[1],b2[0],b2[1],'#f4ead0'); } }
        q(m,m,L-m,Wd-m,'#7a1424'); q(m+0.1,m+0.1,L-m-0.1,Wd-m-0.1,'#e8b84a'); q(m+0.14,m+0.14,L-m-0.14,Wd-m-0.14,'#9a1c30');
        q(m+0.26,m+0.26,L-m-0.26,Wd-m-0.26,'#c8344a');
        // border pattern: little gold diamonds round the band
        for (let u=m+0.3; u<L-m-0.25; u+=0.22) for (const v of [m+0.2, Wd-m-0.2]){ const c=F(u,v); g.fillStyle='#f0c860'; g.fillRect(Math.round(c[0]),Math.round(c[1]),1,1); }
        // centre medallion: navy diamond with a gold edge and a cream heart, and corner pieces
        const cu=L/2, cv=Wd/2, md=(r,col)=>polyPx([F(cu-r*1.4,cv),F(cu,cv-r),F(cu+r*1.4,cv),F(cu,cv+r)],col);
        md(0.42,'#e8b84a'); md(0.36,'#243c78'); md(0.2,'#e8b84a'); md(0.14,'#c8344a'); md(0.06,'#f4ead0');
        for (const [cu2,cv2] of [[m+0.26,m+0.26],[L-m-0.26,m+0.26],[m+0.26,Wd-m-0.26],[L-m-0.26,Wd-m-0.26]]){ const du=cu2<cu?1:-1, dv=cv2<cv?1:-1; polyPx([F(cu2,cv2),F(cu2+du*0.35,cv2),F(cu2,cv2+dv*0.3)],'#243c78'); }
        ol(m,m,L-m,Wd-m); }
      else if (k==='round'){ const [cx,cy]=F(UL/2,VL/2), R=Math.min(UL,VL)/2-0.04, RX=R*28.28, RY=R*14.14, X=Math.round(cx), Y=Math.round(cy);
        const rings=['#6a8a5a','#f0e2c0','#c8643a','#e8b848','#3a8a8a','#f0e2c0','#c8643a','#e8b848'];
        ellPx(X,Y,RX+1,RY+1,INK);
        rings.forEach((c,i)=>{ const t2=1-i/rings.length; ellPx(X,Y,RX*t2,RY*t2,c);
          // braid texture: little dark stitches round each ring
          const dk=tint(c,-0.25); g.fillStyle=dk; for (let a2=0; a2<Math.PI*2; a2+=0.32+i*0.05){ g.fillRect(Math.round(X+Math.cos(a2+i)*RX*t2*0.93), Math.round(Y+Math.sin(a2+i)*RY*t2*0.93), 1, 1); } }); }
      else if (k==='stripe'){ const L=UL, Wd=VL, m=0.1;
        for (let v=m+0.06; v<Wd-m; v+=0.12){ for (const [u0,u1] of [[m,m-0.08],[L-m,L-m+0.08]]){ const a2=F(u0,v), b2=F(u1,v); linePx(a2[0],a2[1],b2[0],b2[1],'#efe4cc'); } }
        q(m,m,L-m,Wd-m,'#f2e6c8');
        const bands=[['#2f7f86',0.16],['#f2e6c8',0.06],['#e8a838',0.12],['#f2e6c8',0.06],['#d8584a',0.2],['#f2e6c8',0.06],['#e8a838',0.12],['#f2e6c8',0.06],['#2f7f86',0.16]];
        const tot=bands.reduce((a2,b2)=>a2+b2[1],0), span=L-2*m-0.3, st=m+0.15; let u=st;
        for (const [c,wd] of bands){ const u1=u+wd/tot*span; if (c!=='#f2e6c8'){ q(u,m+0.08,u1,Wd-m-0.08,c); const a2=F(u,m+0.08), b2=F(u,Wd-m-0.08); linePx(a2[0],a2[1],b2[0],b2[1],tint(c,-0.25)); } u=u1; }
        // little zigzag stitched down the middle band
        { const um=L/2; for (let v=m+0.15; v<Wd-m-0.1; v+=0.14){ const c=F(um+((Math.round(v*7)%2)?0.05:-0.05), v); g.fillStyle='#fff4d8'; g.fillRect(Math.round(c[0]),Math.round(c[1]),1,1); } }
        ol(m,m,L-m,Wd-m); }
      else { // shag: soft rounded square with fluffy uneven edges and a tufted texture
        const L=UL, Wd=VL, m=0.12, c0='#f49ac0', c1='#e07aa6', c2='#ffc4dc', cut=0.22;
        const pts=[F(m+cut,m),F(L-m-cut,m),F(L-m,m+cut),F(L-m,Wd-m-cut),F(L-m-cut,Wd-m),F(m+cut,Wd-m),F(m,Wd-m-cut),F(m,m+cut)];
        const big=pts.map(([a2,b2])=>{ const [cx,cy]=F(L/2,Wd/2); return [a2+(a2-cx)*0.04, b2+(b2-cy)*0.08]; });
        polyPx(big,INK); polyPx(pts,c0);
        let sd=x*7+y*13; const rnd=()=>{ sd=(sd*9301+49297)%233280; return sd/233280; };
        for (let i=0;i<70;i++){ const c=F(m+0.06+rnd()*(L-2*m-0.12), m+0.06+rnd()*(Wd-2*m-0.12)); g.fillStyle = rnd()<0.5 ? c1 : c2; g.fillRect(Math.round(c[0]),Math.round(c[1]), 1, rnd()<0.4?2:1); }
        for (let i=0;i<26;i++){ const t2=i/26, j=Math.floor(t2*8), a2=pts[j], b2=pts[(j+1)%8], fr=t2*8-j, ex=a2[0]+(b2[0]-a2[0])*fr, ey=a2[1]+(b2[1]-a2[1])*fr; g.fillStyle=c1; g.fillRect(Math.round(ex),Math.round(ey),1,1); } }
      break; }
    case 'bigtv': { // wide flat-screen on a long grained media console with doors, a soundbar and a picture that changes
      const {RB,FP,face}=frm(f), R=(u0,u1,v0,v1)=>RB(u0,v0,u1-u0,v1-v0), FL=FP;
      { const k=R(0.04,1.96,0.2,0.85); wbox(k[0],k[1],k[2],k[3],10,'#a86c3a','#7a4c26','#6a4220',0,0,'#4a2e16','t'); }
      if (face) for (const u of [0.04,0.68,1.32,1.96]){ const a2=FL(u,0.85,1), b2=FL(u,0.85,9); linePx(a2[0],a2[1],b2[0],b2[1],'#3a2410'); }
      if (face) for (const u of [0.6,0.76,1.24,1.4]){ const k2=FL(u,0.85,5); g.fillStyle='#f0c070'; g.fillRect(Math.round(k2[0]),Math.round(k2[1]),1,1); }
      if (face) for (const [u0,u1] of [[0.12,0.6],[0.76,1.24],[1.4,1.88]]){ for (let h=3;h<=7;h+=2){ const a2=FL(u0,0.85,h), b2=FL(u1,0.85,h); g.globalAlpha=0.35; linePx(a2[0],a2[1],b2[0],b2[1],'#3a2410'); g.globalAlpha=1; } }
      { const k=R(0.88,1.12,0.42,0.6); box(k[0],k[1],k[2],k[3],3,'#2a2a3a','#1a1a26','#121220',0,10); }
      { const k=R(0.62,1.38,0.62,0.76); box(k[0],k[1],k[2],k[3],2,'#3a3a4a','#22222e','#1a1a26',0,10); }
      { const k=R(0.1,1.9,0.46,0.56); box(k[0],k[1],k[2],k[3],27,'#2a2a3a','#1a1a26','#121220',0,13); }
      if (!face){ for (let h=22; h<=34; h+=3){ const a2=FL(0.7,0.46,h), b2=FL(1.3,0.46,h); linePx(a2[0],a2[1],b2[0],b2[1],'#3a3a4c'); } const a2=FL(1.6,0.46,16), b2=FL(1.65,0.5,10); linePx(a2[0],a2[1],b2[0],b2[1],'#121220'); break; }
      if (f.off){ const vs=0.56; polyPx([FL(0.17,vs,15),FL(1.83,vs,15),FL(1.83,vs,38),FL(0.17,vs,38)], '#141822'); { const a2=FL(0.3,34), b2=FL(0.7,22); linePx(a2[0],a2[1],b2[0],b2[1],'rgba(255,255,255,0.16)'); } const k2=FL(1.84,vs,14); g.fillStyle='#a02030'; g.fillRect(Math.round(k2[0]),Math.round(k2[1]),1,1); break; }
      const ph=Math.floor(t*0.8)%4, SC=[['#58c8f0','#3aa860','#2a8048'],['#f8a060','#f878a8','#c05888'],['#1a2a60','#f8e070','#3a4a90'],['#a8e0f8','#f8f8f8','#c8d8e8']][ph], vs=0.56;
      polyPx([FL(0.17,vs,22),FL(1.83,vs,22),FL(1.83,vs,38),FL(0.17,vs,38)], SC[0]);
      polyPx([FL(0.17,vs,15),FL(1.83,vs,15),FL(1.83,vs,23),FL(0.17,vs,23)], SC[1]);
      { const c2=FL(1.35,vs,33); ellPx(c2[0],c2[1],2,2,SC[2]); }
      for (let h=16; h<38; h+=3){ const a2=FL(0.18,vs,h), b2=FL(1.82,vs,h); g.globalAlpha=0.18; linePx(a2[0],a2[1],b2[0],b2[1],'#000'); g.globalAlpha=1; }
      { const a2=FL(0.24,vs,35), b2=FL(0.6,vs,35); linePx(a2[0],a2[1],b2[0],b2[1],'rgba(255,255,255,0.7)'); }
      { const k2=FL(1.84,vs,14); g.fillStyle=(Math.floor(t*2)%2)?'#60f080':'#208040'; g.fillRect(Math.round(k2[0]),Math.round(k2[1]),1,1); }
      break; }
    case 'bed': case 'dbed': { // two tiles long (the double bed is two wide too): grained wooden frame on legs, tall headboard, footboard, pillow, folded sheet and a patchwork quilt
      const r=f.rot||0, x=f.gx, y=f.gy, Q=h=>recol(h,f.qc,0.5), VW=f.t==='dbed'?2:1;
      // u runs from the head (0) to the foot (2), v across the bed (0..1, stretched to the bed's width)
      const R=(u0,u1,v0,v1)=>{ v0*=VW; v1*=VW; return r===0 ? [x+u0,y+v0,u1-u0,v1-v0] : r===2 ? [x+2-u1,y+v0,u1-u0,v1-v0] : r===1 ? [x+v0,y+u0,v1-v0,u1-u0] : [x+v0,y+2-u1,v1-v0,u1-u0]; };
      const B=(q,h,c0,c1,c2,lift,gc)=>{ const k=R(...q); if (gc) wbox(k[0],k[1],k[2],k[3],h,c0,c1,c2,0,lift,gc); else box(k[0],k[1],k[2],k[3],h,c0,c1,c2,0,lift); };
      const headFar = r<2;
      const head=()=>{ B([0,0.1,0.02,0.98],18,'#d8a468','#9a6436','#7a4c26',2,'#6a4220'); B([-0.01,0.11,0.0,1.0],3,'#f0c890','#b07440','#8a5a30',20,'#8a5a30');
        const k=R(0,0.1,0.3,0.7); const [cx,cy]=P(k[0]+k[2]/2,k[1]+k[3]/2,22); g.fillStyle='#f8d890'; g.fillRect(Math.round(cx)-1,Math.round(cy)+1,2,1); };
      const foot=()=>{ B([1.9,2.0,0.02,0.98],9,'#d8a468','#9a6436','#7a4c26',2,'#6a4220'); B([1.89,2.01,0.0,1.0],2,'#f0c890','#b07440','#8a5a30',11,'#8a5a30'); };
      const FRONT=f.part==='front';
      if (!FRONT) for (const [u,v] of [[0.06,0.06],[1.94,0.06],[0.06,0.94],[1.94,0.94]]){ const k=R(u,u,v,v); const [lx,ly]=P(k[0],k[1],0); g.fillStyle=INK; g.fillRect(Math.round(lx)-1,Math.round(ly)-3,3,4); g.fillStyle='#7a4c26'; g.fillRect(Math.round(lx),Math.round(ly)-2,1,2); }
      if (!FRONT){ if (headFar) head(); else foot();
      B([0.04,1.96,0.05,0.95],4,'#c8905a','#9a6436','#7a4c26',2,'#6a4220');
      B([0.1,1.9,0.08,0.92],4,'#fbf8f4','#dcd6e2','#c4bed0',6); }
      const pillow=()=>{ for (const [p0,p1] of (VW>1 ? [[0.08,0.46],[0.54,0.92]] : [[0.16,0.84]])){ B([0.16,0.5,p0,p1],3,'#ffffff','#e6e2ec','#cfc9da',10); const k=R(0.16,0.5,p0,p1); const [cx,cy]=P(k[0]+k[2]/2,k[1]+k[3]/2,13); g.fillStyle='#e6e2ec'; g.fillRect(Math.round(cx)-2,Math.round(cy),4,1); } };
      const quilt=()=>{ B([0.66,1.9,0.08,0.92],2,Q('#f878a8'),Q('#d85888'),Q('#b84070'),10); B([0.58,0.72,0.08,0.92],2,'#ffffff','#e8e4ee','#d0cad8',10.5);
        // patchwork squares on top of the quilt
        for (let i=0;i<4;i++) for (let j=0;j<3*VW;j++){ if ((i+j)%2) continue; const k=R(0.78+i*0.27,0.78+i*0.27+0.2,(0.16+j*0.26)/VW,(0.16+j*0.26+0.18)/VW); polyPx([P(k[0],k[1],12),P(k[0]+k[2],k[1],12),P(k[0]+k[2],k[1]+k[3],12),P(k[0],k[1]+k[3],12)],Q('#ffa8c8')); } };
      if (f.part==='front'){ quilt(); const hv = VW>1 && f.st ? ((r%2===0) ? f.st[1]-y : f.st[0]-x) : 0, o=VW>1 ? hv*0.5 : 0, sc=1/VW;   // a lump where the sleeper is
        B([0.7,1.75,o+0.24*sc,o+0.76*sc],2,Q('#f878a8'),Q('#d85888'),Q('#b84070'),12); B([0.82,1.5,o+0.32*sc,o+0.68*sc],1,Q('#ff9ac0'),Q('#e070a0'),Q('#c85888'),14); break; }
      if (headFar){ pillow(); quilt(); } else { quilt(); pillow(); }
      if (headFar) foot(); else head();
      break; }
    case 'bookshelf': { // tall bookcase: crown and base trim, three shelves of books in every colour, a little plant on top (turned around you just see its wooden back)
      const {RB,FP,face}=frm(f);
      wbox(...RB(0.08,0.2,0.84,0.6),34,'#c8905a','#9a6436','#7a4c26',0,0,'#6a4220',face?'r':'lr');
      wbox(...RB(0.05,0.17,0.9,0.66),3,'#e0b070','#a86c3a','#86522a',0,34,'#a86c3a','t'); box(...RB(0.06,0.18,0.88,0.64),2,'#7a4c26','#6a4220','#5a3418');
      if (face){ const FL=(u,v)=>FP(0.08+0.84*u, 0.8, v), cols=['#e03048','#3a7ad8','#f8d030','#4aa04a','#8a48e0','#f08a30','#f4f0e8','#2fbfa8'];
      polyPx([FL(0.05,3),FL(0.95,3),FL(0.95,32),FL(0.05,32)],'#4a2e16');
      for (const sv of [4,14,24]){ let u=0.08, k=0;
        while (u<0.9){ const w=0.07+((k*7+sv)%3)*0.02, h=6+((k*5+sv)%4), lean=(k*3+sv)%11===0; const c=cols[(k*3+sv)%cols.length];
          const q = lean ? [FL(u,sv),FL(u+w,sv),FL(u+w+0.05,sv+h-1),FL(u+0.05,sv+h-1)] : [FL(u,sv),FL(u+w,sv),FL(u+w,sv+h),FL(u,sv+h)];
          polyPx(q, c); const a2=FL(u+w*0.3,sv+h-2); g.fillStyle='rgba(255,255,255,0.35)'; g.fillRect(Math.round(a2[0]),Math.round(a2[1]),1,1); u+=w+0.015; k++; }
        const a2=FL(0.03,sv-1), b2=FL(0.97,sv-1); linePx(a2[0],a2[1],b2[0],b2[1],'#c8905a'); linePx(a2[0],a2[1]+1,b2[0],b2[1]+1,'#5a3418'); } }
      { const [px,py]=FP(0.32,0.5,37); ellPx(px,py-1,2.5,1.5,'#c8642e'); ellPx(px,py-4,3,2.5,'#3a8f3a'); ellPx(px-1,py-6,1.5,1.5,'#6ac06a'); }
      break; }
    case 'tv': { // TV on a low wooden stand with doors; black bezel, glowing screen with scanlines (turned around: the back of the set, with vents and a cable)
      const {RB,FP,face}=frm(f);
      wbox(...RB(0.1,0.18,0.8,0.64),10,'#8a5a30','#6a4220','#5a3418',0,0,'#3a2410','rt');
      if (face){ const FL=(u,v)=>FP(0.1+0.8*u, 0.82, v); const a2=FL(0.5,1), b2=FL(0.5,9); linePx(a2[0],a2[1],b2[0],b2[1],'#3a2410'); for (const u of [0.42,0.58]){ const k2=FL(u,5); g.fillStyle='#e8c070'; g.fillRect(Math.round(k2[0]),Math.round(k2[1]),1,1); } }
      box(...RB(0.42,0.42,0.16,0.16),2,'#2a2a3a','#1a1a26','#121220',0,10);
      box(...RB(0.12,0.44,0.76,0.1),19,'#2a2a3a','#1a1a26','#121220',0,12);
      if (!face){ const BK=(u,v)=>FP(0.12+0.76*u, 0.44, v); for (let v=18; v<=26; v+=3){ const a2=BK(0.3,v), b2=BK(0.7,v); linePx(a2[0],a2[1],b2[0],b2[1],'#3a3a4c'); }
        { const a2=BK(0.8,13), b2=BK(0.85,3); linePx(a2[0],a2[1],b2[0],b2[1],'#121220'); } break; }
      const FL=(u,v)=>FP(0.12+0.76*u, 0.54, v), ph=Math.floor(t*1.3)%4, sc=[['#58c8f0','#3a9ad0'],['#f878a8','#d05888'],['#7fe0a0','#4ab070'],['#f8d030','#d0a018']][ph];
      if (f.off){ polyPx([FL(0.07,14),FL(0.93,14),FL(0.93,29),FL(0.07,29)], '#141822'); { const a2=FL(0.18,27), b2=FL(0.4,22); linePx(a2[0],a2[1],b2[0],b2[1],'rgba(255,255,255,0.18)'); } const k2=FL(0.88,13); g.fillStyle='#a02030'; g.fillRect(Math.round(k2[0]),Math.round(k2[1]),1,1); break; }
      polyPx([FL(0.07,14),FL(0.93,14),FL(0.93,29),FL(0.07,29)], sc[0]);
      for (let v=15; v<29; v+=3){ const a2=FL(0.08,v), b2=FL(0.92,v); g.globalAlpha=0.35; linePx(a2[0],a2[1],b2[0],b2[1],sc[1]); g.globalAlpha=1; }
      { const a2=FL(0.14,27), b2=FL(0.34,27); linePx(a2[0],a2[1],b2[0],b2[1],'rgba(255,255,255,0.7)'); const c2=FL(0.14,25); g.fillStyle='rgba(255,255,255,0.5)'; g.fillRect(Math.round(c2[0]),Math.round(c2[1]),1,1); }
      { const k2=FL(0.88,13); g.fillStyle=(Math.floor(t*2)%2)?'#ff4050':'#a02030'; g.fillRect(Math.round(k2[0]),Math.round(k2[1]),1,1); }
      break; }
    case 'plant': { // big leafy plant: terracotta pot with a rim and soil, then separate pointed leaves fanning out (back ones darker, front ones lighter)
      const x=f.gx, y=f.gy; box(x+0.3,y+0.3,0.4,0.4,8,'#5a3018','#c8642e','#a04a1c');
      box(x+0.26,y+0.26,0.48,0.48,2,'#4a2810','#e07a40','#b85a28',0,8);
      { const [sx2,sy2]=P(x+0.5,y+0.5,10); ellPx(Math.round(sx2),Math.round(sy2),4,1.5,'#3a2010'); }
      const [cx,cy]=P(x+0.5,y+0.5,10); const X=Math.round(cx), Y=Math.round(cy);
      const leaf=(ang,len,wid,col,lift)=>{ const a2=ang*Math.PI/180, dx=Math.cos(a2), dy=Math.sin(a2), nx=-dy, ny=dx, bx=X+dx*2, by=Y-lift+dy*2;
        const tip=[bx+dx*len, by+dy*len], m=[bx+dx*len*0.45, by+dy*len*0.45], pts=[[bx,by],[m[0]+nx*wid,m[1]+ny*wid],tip,[m[0]-nx*wid,m[1]-ny*wid]];
        linePx(X,Y,bx,by,'#2a5a1a');
        polyPx(pts,col); for (let i=0;i<4;i++){ const p0=pts[i], p1=pts[(i+1)%4]; linePx(p0[0],p0[1],p1[0],p1[1],INK); }
        linePx(bx+dx,by+dy,tip[0]-dx*2,tip[1]-dy*2,tint(col,-0.25)); const hx2=m[0]+nx*wid*0.45, hy2=m[1]+ny*wid*0.45; g.fillStyle=tint(col,0.35); g.fillRect(Math.round(hx2),Math.round(hy2),1,1); };
      // back layer, middle layer, then the leaves nearest you
      for (const [ang,len,lift] of [[-150,11,4],[-30,11,4],[-110,13,6],[-70,13,6]]) leaf(ang,len,3.2,'#2e7a2e',lift);
      for (const [ang,len,lift] of [[-170,10,1],[-10,10,1],[-125,12,9],[-55,12,9],[-90,14,10]]) leaf(ang,len,3.4,'#3f9a3a',lift);
      for (const [ang,len,lift] of [[-140,9,0],[-40,9,0],[-95,10,14],[160,7,-1],[20,7,-1]]) leaf(ang,len,3,'#5cbc52',lift);
      break; }
    case 'glasscase': { // accessories case: wood base, purple velvet top, glasses laid out under glass
      const a=f.gx+(f.end===-1?0.06:0), c=f.gx+(f.end===1?0.94:1), b=f.gy+0.14, e=f.gy+0.86, Hb=11, Hg=20;
      box(a,b,c-a,e-b,Hb,'#e8dcf8','#8a5a30','#6a4220');
      { const [x,y]=P((a+c)/2,e,4); g.fillStyle='#b07a48'; g.fillRect(Math.round(x)-7,Math.round(y),14,1); }
      for (const [id,x] of CASE_ITEMS){ if (Math.floor(x)!==f.gx) continue; const ic=itemIcon(id); const [px,py]=P(x,f.gy+0.5,Hb); g.drawImage(ic, Math.round(px)-Math.floor(ic.width/2), Math.round(py)-ic.height+1);
        itemHits.push({id, x0:Math.round(px)-Math.floor(ic.width/2)-3, x1:Math.round(px)+Math.ceil(ic.width/2)+6, y0:Math.round(py)-ic.height-8, y1:Math.round(py)+5});
        g.fillStyle=OUT; g.fillRect(Math.round(px)+Math.ceil(ic.width/2)-1,Math.round(py)-1,5,4); g.fillStyle=INV.owned.includes(id)?'#7fe0a0':'#fff8e0'; g.fillRect(Math.round(px)+Math.ceil(ic.width/2),Math.round(py),3,2); }
      // glass: see-through faces with bright edges
      const corners=[[a,b],[c,b],[c,e],[a,e]], T=corners.map(([x,y])=>P(x,y,Hg)), B=corners.map(([x,y])=>P(x,y,Hb));
      polyPx([T[0],T[1],T[2],T[3]],'rgba(200,230,255,0.22)'); polyPx([B[3],B[2],T[2],T[3]],'rgba(200,230,255,0.16)'); polyPx([B[1],B[2],T[2],T[1]],'rgba(170,210,240,0.2)');
      const ed=(p,q,col)=>linePx(p[0],p[1],q[0],q[1],col);
      ed(T[0],T[1],'#e8f4ff'); ed(T[1],T[2],'#e8f4ff'); ed(T[2],T[3],'#ffffff'); ed(T[3],T[0],'#e8f4ff');
      if (f.end===-1) ed(B[3],T[3],'#d8ecff'); if (f.end===1) ed(B[1],T[1],'#d8ecff'); ed(B[2],T[2],'#ffffff');
      { const s0=P(a+0.15,e,Hg-2), s1=P(a+0.3,e,Hb+3); ed(s0,s1,'rgba(255,255,255,0.7)'); }   // shine
      break; }
    case 'vending': case 'snackvend': { // vending machine against the back wall: lit sign, a window of drinks or snacks, a coin panel and a pick-up flap
      const snack=f.t==='snackvend', {RB,FP,face}=frm(f), H=46, K=RB(0.12,0.12,0.76,0.74), a=K[0], b=K[1], c=K[0]+K[2], e=K[1]+K[3];
      if (snack) box(...K,H,'#f0f0f8','#3a7ad8','#2a5aa8'); else box(...K,H,'#f0f0f8','#e03048','#b0203a');
      { const q=[P(a,e,0),P(c,e,0),P(c,b,0),P(a,b,H),P(c,e,H)], hb={x0:Math.min(...q.map(v=>v[0]))-2, x1:Math.max(...q.map(v=>v[0]))+2, y0:Math.min(...q.map(v=>v[1]))-2, y1:Math.max(...q.map(v=>v[1]))+2};
        if (curRoom==='store' && !f.fid && !f.show){ if (f.svend) svendHit=hb; else vendHit=hb; } else if (f.fid) pvHits.push({...hb, f}); }
      if (!face){ const BK=(u,v)=>FP(0.12+0.76*u, 0.12, v); for (let v=30; v<=40; v+=3){ const a2=BK(0.25,v), b2=BK(0.75,v); linePx(a2[0],a2[1],b2[0],b2[1],snack?'#2a4a88':'#8a1a2c'); } const a2=BK(0.5,6), b2=BK(0.55,1); linePx(a2[0],a2[1],b2[0],b2[1],'#121220'); break; }
      const FL=(u,v)=>FP(0.12+0.76*u, 0.86, v), quad=(u0,u1,v0,v1,col)=>polyPx([FL(u0,v0),FL(u1,v0),FL(u1,v1),FL(u0,v1)],col);
      quad(0.08,0.66,12,40,INK); quad(0.11,0.63,13,39,snack?'#1a2030':'#1e2a40');
      if (snack){ const cols=['#f8d030','#8a48e0','#f07830','#48c048','#e03048','#f8f0e0'];
        for (let r=0;r<3;r++){ for (let k=0;k<3;k++){ const [x,y]=FL(0.17+k*0.16, 16+r*8); const X=Math.round(x), Y=Math.round(y); g.fillStyle=INK; g.fillRect(X-1,Y-6,5,7); g.fillStyle=cols[(k+r*2)%cols.length]; g.fillRect(X,Y-5,3,5); g.fillStyle='rgba(255,255,255,0.45)'; g.fillRect(X,Y-5,1,1); }
          const l0=FL(0.12,15+r*8), l1=FL(0.62,15+r*8); linePx(l0[0],l0[1]+1,l1[0],l1[1]+1,'#8890a8'); } }
      else { const cols=['#f84848','#48c048','#f878b8','#f8d030'];
        for (let r=0;r<3;r++) for (let k=0;k<4;k++){ const [x,y]=FL(0.16+k*0.12, 16+r*8); g.fillStyle=INK; g.fillRect(Math.round(x),Math.round(y)-5,3,6); g.fillStyle=cols[(k+r)%4]; g.fillRect(Math.round(x)+1,Math.round(y)-4,1,4); } }
      const glow=(Math.floor(t*1.5+(snack?3:0))%7)!==0; quad(0.08,0.92,42,45,glow?(snack?'#a8e0ff':'#ffe070'):(snack?'#6a98c0':'#c0a040'));
      quad(0.72,0.9,24,34,INK); quad(0.74,0.88,25,33,'#d8d8e8'); for (let k=0;k<3;k++){ const [x,y]=FL(0.81,31-k*2.5); g.fillStyle=k===0?'#48c048':'#f8d030'; g.fillRect(Math.round(x)-1,Math.round(y)-1,2,1); }
      quad(0.2,0.6,4,8,INK); quad(0.22,0.58,5,7,'#2a2a3a');   // pick-up flap
      break; }
    case 'booth': { // changing booth: a wooden cabinet, purple velvet curtain parted at the front, a gold marquee sign on top
      const x0=f.gx+0.08, y0=f.gy+0.08, x1=f.gx+0.92, y1=f.gy+0.92, H=44;
      box(f.gx+0.02,f.gy+0.02,0.96,0.96,3,'#9a6a3a','#7a4a24','#5e3818');
      box(x0,y0,0.84,0.84,H,'#5a2a7a','#8a3ac0','#6a4a2a',0,3);
      const FL=(u,v)=>P(x0+(x1-x0)*u, y1, 3+v), RT=(u,v)=>P(x1, y0+(y1-y0)*u, 3+v), quad=(F,u0,u1,v0,v1,col)=>polyPx([F(u0,v0),F(u1,v0),F(u1,v1),F(u0,v1)],col);
      quad(FL,0.38,0.62,0,38,'#1c1028');                                                  // dark gap where the curtains part
      for (const u of [0.1,0.22,0.3,0.7,0.78,0.9]){ const a=FL(u,1), b=FL(u,38); linePx(a[0],a[1],b[0],b[1],'#6a2a98'); }   // velvet folds
      for (const u of [0.16,0.84]){ const a=FL(u,2), b=FL(u,36); linePx(a[0],a[1],b[0],b[1],'#b070e8'); }
      for (const u of [0.36,0.64]){ const a=FL(u,14), b=FL(u+(u<0.5?-0.06:0.06),16); linePx(a[0],a[1],b[0],b[1],'#f6c945'); }   // gold tie-backs
      { const a=FL(0,39), b=FL(1,39); linePx(a[0],a[1],b[0],b[1],'#f6c945'); linePx(a[0],a[1]+1,b[0],b[1]+1,'#c8951c'); }   // curtain rod
      for (let k=0;k<3;k++){ const a=RT(0.12,6+k*12), b=RT(0.88,6+k*12); linePx(a[0],a[1],b[0],b[1],'#4e3018'); }   // wood planks on the side
      quad(RT,0.3,0.7,18,32,INK); quad(RT,0.34,0.66,19,31,'#bfe4f0'); { const a=RT(0.4,21), b=RT(0.5,29); linePx(a[0],a[1],b[0],b[1],'#ffffff'); }   // little mirror
      // lit marquee over the booth: CHANGING BOOTH in gold on purple, chasing bulbs all round, standing on two little posts
      { const [sx,sy]=P(f.gx+0.5,f.gy+0.7,3+H); const W=46, HH=23, X=Math.round(sx)-23, Y=Math.round(sy)-HH-7;
        for (const [u,v] of [[0.2,0.78],[0.8,0.2]]){ const [fx,fy]=P(f.gx+u,f.gy+v,3+H), PX=Math.round(fx)-1, top=Y+HH, len=Math.max(2,Math.round(fy)-top); g.fillStyle=INK; g.fillRect(PX-1,top,3,len+1); g.fillStyle='#b8841a'; g.fillRect(PX,top,1,len); g.fillStyle=INK; g.fillRect(PX-2,top+len,5,1); }
        g.fillStyle=INK; g.fillRect(X-1,Y-1,W+2,HH+2); g.fillStyle='#e0a82a'; g.fillRect(X,Y,W,HH); g.fillStyle='#f6c945'; g.fillRect(X,Y,W,1); g.fillStyle='#b8841a'; g.fillRect(X,Y+HH-1,W,1);
        g.fillStyle='#4a1e6a'; g.fillRect(X+3,Y+3,W-6,HH-6); g.fillStyle='#5e2a84'; g.fillRect(X+3,Y+3,W-6,1);
        pfDraw(g,'CHANGING',X+((W-pfW('CHANGING'))>>1)+1,Y+5,'#2a0c40'); pfDraw(g,'CHANGING',X+((W-pfW('CHANGING'))>>1),Y+4,'#ffe070');
        pfDraw(g,'BOOTH',X+((W-pfW('BOOTH'))>>1)+1,Y+12,'#2a0c40'); pfDraw(g,'BOOTH',X+((W-pfW('BOOTH'))>>1),Y+11,'#ffffff');
        const on=Math.floor(t*4)%2, bulbs=[]; for (let x=X+2;x<X+W-1;x+=4){ bulbs.push([x,Y+1]); bulbs.push([x,Y+HH-2]); } for (let y=Y+5;y<Y+HH-3;y+=4){ bulbs.push([X+1,y]); bulbs.push([X+W-2,y]); }
        bulbs.forEach(([x,y],k)=>{ g.fillStyle=((k>>1)%2===on)?'#fff6c0':'#a87a20'; g.fillRect(x,y,1,1); });
        const tw=Math.floor(t*2)%3; g.fillStyle=tw===0?'#ffffff':'#ffe070'; g.fillRect(X+W-4,Y-6,1,5); g.fillRect(X+W-6,Y-4,5,1); }
      { const q=[P(f.gx,f.gy+1,0),P(f.gx+1,f.gy+1,0),P(f.gx+1,f.gy,0),P(f.gx+0.5,f.gy+0.5,3+H+34)]; boothHit={x0:Math.min(...q.map(v=>v[0])), x1:Math.max(...q.map(v=>v[0])), y0:Math.min(...q.map(v=>v[1])), y1:Math.max(...q.map(v=>v[1]))}; }
      break; }
    case 'statue': { // crystal llama statue: a llama carved from glassy ice-blue crystal on a white marble plinth, with twinkles
      const x=f.gx, y=f.gy;
      box(x+0.16,y+0.16,0.68,0.68,7,'#f6f2fc','#cfc6e0','#aea4c4'); box(x+0.12,y+0.12,0.76,0.76,2,'#ffffff','#ddd6ea','#bdb4d0',0,7);
      for (const u of [0.3,0.5,0.7]){ const a=P(x+u,y+0.84,1), b=P(x+u,y+0.84,6); linePx(a[0],a[1],b[0],b[1],'#e4dcf0'); }   // fluting on the plinth
      const cv=crystalLlama(); const [sx,sy]=P(x+0.5,y+0.5,9); g.drawImage(cv, Math.round(sx)-14, Math.round(sy)-44);
      for (let k=0;k<4;k++){ const ph=(t*1.3+k*0.27)%1; if (ph>0.35) continue; const [qx,qy]=[[-7,-36],[6,-24],[-3,-14],[8,-40]][k], X=Math.round(sx)+qx, Y=Math.round(sy)+qy, on=ph<0.18;
        g.fillStyle='#ffffff'; g.fillRect(X,Y-(on?2:1),1,on?5:3); g.fillRect(X-(on?2:1),Y,on?5:3,1); }
      break; }
    case 'throne': { // golden llama throne: gold frame, red velvet seat and back panel, rolled arms, a little crown on top
      const r=f.rot||0, x=f.gx, y=f.gy, far=r<2, GD='#f6c945', GM='#d8a222', GS='#a8761a', VR='#c8263a', VD='#8e1426', VL='#ee5468';
      const back = r===0 ? [x+0.12,y+0.14,0.12,0.72] : r===1 ? [x+0.14,y+0.12,0.72,0.12] : r===2 ? [x+0.76,y+0.14,0.12,0.72] : [x+0.14,y+0.76,0.72,0.12];
      const arms = r%2===0 ? [[x+0.18,y+0.12,0.66,0.12],[x+0.18,y+0.76,0.66,0.12]] : [[x+0.12,y+0.18,0.12,0.66],[x+0.76,y+0.18,0.12,0.66]];
      const drawBack=()=>{ box(...back,26,GD,GM,GS,0,10); const c=[back[0]+back[2]/2, back[1]+back[3]/2];
        const pad = r%2===0 ? [back[0]+(r===0?back[2]:0)-0.005, back[1]+0.1] : [back[0]+0.1, back[1]+(r===1?back[3]:0)-0.005];
        if (r%2===0) polyPx([P(pad[0],pad[1],14),P(pad[0],pad[1]+0.52,14),P(pad[0],pad[1]+0.52,32),P(pad[0],pad[1],32)], VR);
        else polyPx([P(pad[0],pad[1],14),P(pad[0]+0.52,pad[1],14),P(pad[0]+0.52,pad[1],32),P(pad[0],pad[1],32)], VR);
        { const [cx,cy]=P(c[0],c[1],37); const X=Math.round(cx), Y=Math.round(cy); g.fillStyle=INK; g.fillRect(X-5,Y-5,11,6); g.fillStyle=GD; g.fillRect(X-4,Y-4,9,4);   // crown
          g.fillStyle=INK; for (const dx of [-4,0,4]) g.fillRect(X+dx,Y-8,1,3); g.fillStyle=GD; for (const dx of [-4,0,4]) g.fillRect(X+dx,Y-7,1,2); g.fillStyle='#e8304a'; g.fillRect(X,Y-3,1,1); g.fillStyle='#48a8f0'; g.fillRect(X-3,Y-3,1,1); g.fillRect(X+3,Y-3,1,1); g.fillStyle='#fff6c0'; g.fillRect(X-4,Y-4,1,1); } };
      // open arm rests: a post at each end, a gold rail with a red velvet pad on top, and nothing in between so you can see through them
      const drawArm=A=>{ const [ax,ay,aw,ad]=A, s2=0.12, ends = r%2===0 ? [[ax,ay],[ax+aw-s2,ay]] : [[ax,ay],[ax,ay+ad-s2]];
        for (const [px,py] of ends) box(px,py,s2,s2,7,GD,GM,GS,0,10);
        box(ax,ay,aw,ad,2,GD,GM,GS,0,17); box(ax+0.03,ay+0.03,aw-0.06,ad-0.06,1,VL,VR,VD,0,19);
        { const [ex,ey] = r%2===0 ? [ax+(r===0?aw-0.06:0.06), ay+ad/2] : [ax+aw/2, ay+(r===1?ad-0.06:0.06)]; const [cx,cy]=P(ex,ey,19); const X=Math.round(cx), Y=Math.round(cy);   // rolled scroll at the front end
          g.fillStyle=INK; g.fillRect(X-2,Y-2,5,5); g.fillStyle=GD; g.fillRect(X-1,Y-1,3,3); g.fillStyle='#fff6c0'; g.fillRect(X-1,Y-1,1,1); g.fillStyle=GS; g.fillRect(X,Y,1,1); } };
      if (f.part==='front'){ if (!far) drawBack(); for (const A of arms){ const near = r%2===0 ? A[1]>y+0.5 : A[0]>x+0.5; if (near) drawArm(A); } break; }
      for (const [u,v] of [[0.2,0.2],[0.8,0.2],[0.2,0.8],[0.8,0.8]]){ const [lx,ly]=P(x+u,y+v,0), [,ty]=P(x+u,y+v,10); g.fillStyle=INK; g.fillRect(Math.round(lx)-1,Math.round(ty),3,Math.round(ly-ty)+1); g.fillStyle=GM; g.fillRect(Math.round(lx),Math.round(ty),1,Math.round(ly-ty)); g.fillStyle=GD; g.fillRect(Math.round(lx)-1,Math.round(ly)-1,3,1); }
      if (far) drawBack();
      box(x+0.14,y+0.14,0.72,0.72,3,GD,GM,GS,0,7); box(x+0.2,y+0.2,0.6,0.6,3,VL,VR,VD,0,10);   // gold frame, plump velvet cushion
      for (const A of arms) drawArm(A);
      if (!far) drawBack();
      break; }
    case 'acctdesk': { // two-tile wooden desk with a computer showing a padlock, a little bell and a stack of forms
      box(f.gx+0.06,f.gy+0.1,1.88,0.8,16,'#a8743e','#8a5a2c','#6a4220');
      for (const u of [0.25,1.75]){ const a=P(f.gx+u,f.gy+0.9,2), b=P(f.gx+u,f.gy+0.9,14); linePx(a[0],a[1],b[0],b[1],'#5a3418'); }
      box(f.gx+0.55,f.gy+0.25,0.7,0.12,15,'#2a2c3a','#3a3e52','#22242e',0,16);   // monitor
      { const S2=(u,v)=>P(f.gx+0.58+0.64*u,f.gy+0.37,16+2+v*12), q=[S2(0,0),S2(1,0),S2(1,1),S2(0,1)]; polyPx(q,'#2a6ad8'); const glow=Math.floor(t*2)%4===0;
        const [cx,cy]=S2(0.5,0.45); const X=Math.round(cx), Y=Math.round(cy); g.fillStyle='#f6c945'; g.fillRect(X-2,Y,5,4); g.fillStyle='#c8951c'; g.fillRect(X,Y+1,1,2); g.fillStyle=glow?'#ffffff':'#d8e4f8'; g.fillRect(X-1,Y-3,1,3); g.fillRect(X+1,Y-3,1,3); g.fillRect(X,Y-4,1,1); }
      box(f.gx+0.75,f.gy+0.4,0.3,0.1,1,'#2a2c3a','#3a3e52','#22242e',0,16);
      box(f.gx+1.4,f.gy+0.5,0.35,0.25,3,'#f8f4ec','#d8d0c0','#c0b8a8',0,16); box(f.gx+1.42,f.gy+0.48,0.33,0.25,2,'#ffffff','#e0d8c8','#c8c0b0',0,19);   // forms
      { const [bx,by]=P(f.gx+0.25,f.gy+0.6,17); g.fillStyle=INK; g.fillRect(Math.round(bx)-3,Math.round(by)-3,7,4); g.fillStyle='#f6c945'; g.fillRect(Math.round(bx)-2,Math.round(by)-3,5,3); g.fillStyle='#ffffff'; g.fillRect(Math.round(bx)-1,Math.round(by)-3,1,1); g.fillStyle=INK; g.fillRect(Math.round(bx),Math.round(by)-5,1,2); }   // service bell
      { const q=[P(f.gx,f.gy+1,0),P(f.gx+2,f.gy+1,0),P(f.gx+2,f.gy,0),P(f.gx+1,f.gy+0.4,34)]; deskHit={x0:Math.min(...q.map(v=>v[0])), x1:Math.max(...q.map(v=>v[0])), y0:Math.min(...q.map(v=>v[1])), y1:Math.max(...q.map(v=>v[1]))}; }
      break; }
    case 'foldtable': { // display table with stacks of folded shirts
      box(f.gx+0.06,f.gy+0.06,0.88,0.88,13,'#f4e6c8','#a87444','#86582e');
      PRODUCTS.slice(f.k*2, f.k*2+3).forEach((pr,j)=>{ const u=[0.3,0.68,0.5][j], v=[0.35,0.4,0.72][j]; let lift=13;
        for (let h=0; h<3-j%2; h++){ box(f.gx+u-0.17,f.gy+v-0.13,0.34,0.26,2,pr.bg,shadeHex(pr.bg,0.75),shadeHex(pr.bg,0.6),0,lift); lift+=2; } });
      break; }
    case 'balerack': { box(f.gx,f.gy,1,1,8,'#6a4a8a','#4a3068','#3a2050',0.1);
      for (const [dx,dy,c] of [[0.3,0.35,'#e8b838'],[0.7,0.35,'#d8a028'],[0.5,0.7,'#f0c848']]){ const [x,y]=P(f.gx+dx,f.gy+dy,8); const X=Math.round(x),Y=Math.round(y);
        g.fillStyle=INK; g.fillRect(X-4,Y-7,9,8); g.fillStyle=c; g.fillRect(X-3,Y-6,7,6); g.fillStyle='#a87818'; g.fillRect(X-3,Y-4,7,1); g.fillRect(X-3,Y-2,7,1); g.fillStyle='#fff0a0'; g.fillRect(X-2,Y-6,2,1); }
      break; }
    case 'cabinet': box(f.gx,f.gy,1,1,20,'#a85830','#884020','#682818',0.05);
      if (f.gx%2===0){ g.fillStyle=INK; g.fillRect(sx-4,sy-26,4,6); g.fillRect(sx+1,sy-27,4,7); g.fillStyle='#c8f0f8'; g.fillRect(sx-3,sy-25,2,4); g.fillRect(sx+2,sy-26,2,5); } break;
    case 'bar': box(f.gx,f.gy,1,1,24,'#f0a050','#c86828','#984818');
      { const [lx,ly]=P(f.gx,f.gy+1,6), [rx,ry]=P(f.gx+1,f.gy+1,6); g.fillStyle='#f8d030'; for(let x=lx+1;x<rx;x++){ g.fillRect(x, Math.round(ly+(x-lx)*(ry-ly)/(rx-lx)), 1, 2);} }
      { const [tx,ty]=P(f.gx,f.gy+1,24), [ux,uy]=P(f.gx+1,f.gy+1,24); g.fillStyle='#f8d098'; for(let x=tx+1;x<ux;x++){ g.fillRect(x, Math.round(ty+(x-tx)*(uy-ty)/(ux-tx))-2, 1, 1);} }
      if (f.gx===3){ g.fillStyle=INK; g.fillRect(sx-2,sy-37,5,10); g.fillStyle='#d8d8e8'; g.fillRect(sx-1,sy-36,3,8); g.fillStyle=INK; g.fillRect(sx-4,sy-31,3,3); g.fillStyle='#f8c030'; g.fillRect(sx-3,sy-30,1,1); }
      { const CUPC=['#f84848','#48c048','#f878b8','#f8c030','#58b8f8','#b058e0','#f87830'];
        const cup=(px,py,col,tall)=>{ const H=tall?7:5; g.fillStyle=INK; g.fillRect(px-1,py-H-1,6,H+2); g.fillRect(px+5,py-H+1,2,3); g.fillStyle='#e8f0f8'; g.fillRect(px,py-H,4,H); g.fillStyle=col; g.fillRect(px,py-H+2,4,H-2); g.fillStyle='#f8f8f8'; g.fillRect(px,py-H,4,1); g.fillRect(px,py-H+2,1,H-3); g.fillStyle='#e8f0f8'; g.fillRect(px+5,py-H+2,1,1); };
        // back cup (always there)
        if (f.gx%2===0){ const [bx,by]=P(f.gx+0.35,1.3,24); cup(Math.round(bx)-2,Math.round(by),CUPC[(f.gx+3)%7],true); }
        // front cup, in front of the stool, gets picked up when someone sits there
        if (!(typeof stoolTaken==='function' && stoolTaken(f.gx))){ const [fx,fy]=P(f.gx+0.55,1.78,24); cup(Math.round(fx)-2,Math.round(fy),CUPC[f.gx%7],false); if (typeof cupHits!=='undefined') cupHits.push({gx:f.gx, x0:Math.round(fx)-3, x1:Math.round(fx)+5, y0:Math.round(fy)-6, y1:Math.round(fy)+1}); } }
      break;
    case 'stool': { const gold=f.c==='casino'; g.fillStyle=INK; g.fillRect(sx-2,sy-10,4,10); g.fillStyle=gold?'#c09018':'#585870'; g.fillRect(sx-1,sy-10,2,10); ellO(sx,sy,4,2,gold?'#8a6810':'#383848'); ellO(sx,sy-11,6,3,gold?'#282030':'#f84848'); g.fillStyle=gold?'#f8d030':'#f8a8a8'; g.fillRect(sx-3,sy-13,3,1); break; }
    case 'stanchion': { // brass post with a red velvet rope looping back to the wall
      const [hx,hy]=P(0.02,f.gy+0.5,22); const top=[sx,sy-22];
      for (let i=0;i<=16;i++){ const u=i/16, x=top[0]+(hx-top[0])*u, y=top[1]+(hy-top[1])*u+Math.sin(u*Math.PI)*7; ellPx(x,y,1.4,1.4,INK); }
      for (let i=0;i<=16;i++){ const u=i/16, x=top[0]+(hx-top[0])*u, y=top[1]+(hy-top[1])*u+Math.sin(u*Math.PI)*7; g.fillStyle=i%3?'#c02838':'#e04858'; g.fillRect(Math.round(x),Math.round(y),1,1); }
      ellPx(sx,sy,5,2,INK); ellPx(sx,sy-0.5,4,1.5,'#c09018'); g.fillStyle=INK; g.fillRect(sx-2,sy-22,4,22); g.fillStyle='#f8d030'; g.fillRect(sx-1,sy-22,2,22); g.fillStyle='#fff0a0'; g.fillRect(sx-1,sy-22,1,22);
      ellPx(sx,sy-24,3,3,INK); ellPx(sx,sy-24,2,2,'#f8d030'); break; }
    case 'plinko': {
      // PLINKO cabinet against the left wall: two tiles wide, the pegboard on the face toward the room, gold marquee with chase lights
      const x0=f.gx+0.06, x1=f.gx+0.9, y0=f.gy+0.04, y1=f.gy+1.96, H=46, flash=Math.floor(t*3);
      box(x0,y0,x1-x0,y1-y0,6,'#2a1450','#2a1450','#2a1450');                                  // pedestal
      box(x0+0.02,y0+0.02,x1-x0-0.04,y1-y0-0.04,H-6,'#7a3cd8','#5a2aa8','#3e1c80',0,6);        // cabinet
      box(x0-0.03,y0-0.03,x1-x0+0.06,y1-y0+0.06,9,'#ffe070','#f0b820','#c08810',0,H);         // gold marquee
      // face toward the room (+x): u runs left to right along it, v is height
      const [Lx,Ly]=P(x1-0.02,y1-0.02,0); const F=(u,v)=>[Math.round(Lx+u), Math.round(Ly-u*0.5)-v];
      const px=(u,v,c)=>{ const [X,Y]=F(u,v); g.fillStyle=c; g.fillRect(X,Y,1,1); };
      const W=Math.round((y1-y0-0.04)*20);
      for (let v=7; v<H-1; v++){ px(1,v,'#9a64f0'); px(W-1,v,'#3e1c80'); }
      // marquee: chase lights and the word PLINKO in tiny pixel letters
      for (let u=2; u<W-1; u+=2) px(u, H+7, ((u/2)+flash)%2 ? '#ffffff' : '#ff5c8a');
      { const word='PLINKO', w=pfW(word), u0=Math.round((W-w)/2); let uu=u0; for (const ch of word){ const gl=PF[ch]; for (let j=0;j<5;j++) for (let i=0;i<gl[j].length;i++) if (gl[j][i]==='#') px(uu+i, H+5-j, '#5a1c80'); uu+=gl[0].length+1; } }
      // pegboard window: dark glass, ink frame, rows of gold pegs, prize buckets along the bottom
      const bu0=3, bu1=W-3, bvB=10, bvT=H-3;
      for (let u=bu0; u<=bu1; u++) for (let v=bvB; v<=bvT; v++) px(u,v, (u===bu0||u===bu1||v===bvB||v===bvT) ? INK : '#1c1238');
      const cu=(bu0+bu1)/2;
      for (let r=0;r<6;r++) for (let j=0;j<r+3;j++){ const u=Math.round(cu+(j-(r+2)/2)*4.4), v=bvT-6-r*4; px(u,v,'#ffd23f'); }
      const BC=['#ffd23f','#48c060','#4aa8ff','#a070e0','#e83850','#a070e0','#4aa8ff','#48c060','#ffd23f'];
      for (let k=0;k<9;k++){ const u=Math.round(cu+(k-4)*3.9); for (const du of [-1,0,1]) for (const v of [bvB+1,bvB+2]) px(u+du,v,BC[k]); }
      // a demo ball bouncing down every few seconds
      { const cyc=(t*1000)%3600, step=Math.floor(cyc/260); if (step<=6){ const seed=Math.floor(t*1000/3600); let off=0; for (let r=0;r<step;r++) off += ((seed*7+r*3)%5<2) ? -1 : 1;
          const u=Math.round(cu+off*2.2), v=bvT-3-step*4; px(u,v,'#ffffff'); px(u+1,v,'#ffffff'); px(u,v-1,'#ff9ab8'); px(u+1,v-1,'#ffffff'); } }
      // coin tray under the board
      for (let u=Math.round(cu)-6; u<=Math.round(cu)+6; u++){ px(u,7,INK); px(u,6,'#d8d8e8'); px(u,5,'#a8a8b8'); px(u,4,INK); }
      break; }
    case 'dealer': { // casino dealers, drawn with the player sprite code; they get busy while someone is playing
      const [px,py]=P(f.x,f.y); let busy=false;
      if (f.game==='roul') busy = typeof rlAnim!=='undefined' && rlAnim && (performance.now()-rlAnim.t0)/1000 < 2.6;
      else { const at=(x,y)=>f.rot ? x===f.tx+1 && (y===f.ty||y===f.ty+1) : y===f.ty+1 && (x===f.tx||x===f.tx+1); busy = (me.bj && me.p==='sit' && at(me.gx,me.gy)) || [...others.values()].some(o=>sameRoom(o) && o.bj && o.p==='sit' && at(Math.floor(o.x),Math.floor(o.y))); }
      const fr = busy ? (Math.floor(t*(f.game==='roul'?6:2.5))%2) : ((t+f.gy*0.7)%5 < 0.35 ? 1 : 0);
      g.drawImage(sprite(f.c,f.dir||'fl',fr,'stand'), Math.round(px)-14, Math.round(py)-45); break; }
    case 'teetable': { // a low wooden display table with stacks of folded tees; tap to shop the tees
      box(f.gx+0.08,f.gy+0.15,f.w-0.16,0.7,9,'#c8905a','#a06838','#7a4a24');
      { const [a,b]=[P(f.gx+0.08,f.gy+0.85,9),P(f.gx+f.w-0.08,f.gy+0.85,9)]; linePx(a[0],a[1],b[0],b[1],'#e8b878'); }
      const TEES=[['#ff6e9c','#c8306a','#ffb0c8'],['#3fb8a8','#22806e','#8ae8d8'],['#ffd23f','#c88a10','#fff0a0'],['#2c2a34','#1a1820','#5a5866'],['#4aa8ff','#2060c0','#a8d8ff'],['#f4f0e8','#c8c0b0','#ffffff']];
      TEES.forEach((C,i)=>{ const u=f.gx+0.32+(i%3)*((f.w-0.64)/2), v=f.gy+(i<3?0.33:0.67);
        for (let k=0;k<3;k++){ box(u-0.14,v-0.11,0.28,0.22,1.8,C[0],C[1],C[1],0,9+k*2); const [a,b]=[P(u-0.14,v+0.11,9+k*2+1.8),P(u+0.14,v+0.11,9+k*2+1.8)]; linePx(a[0],a[1],b[0],b[1],C[2]); }
        const [x,y]=P(u,v,9+6); g.fillStyle=C[2]; g.fillRect(Math.round(x)-1,Math.round(y)-1,3,1); g.fillStyle=C[1]; g.fillRect(Math.round(x),Math.round(y),1,1); });
      { const l=P(f.gx,f.gy+1,0), r=P(f.gx+f.w,f.gy,0), top=P(f.gx+f.w/2,f.gy+0.5,20), b=P(f.gx+f.w,f.gy+1,0); itemHits.push({id:f.pick, x0:Math.round(l[0]), x1:Math.round(r[0]), y0:Math.round(top[1]), y1:Math.round(b[1])+2}); }
      break; }
    case 'hatstand': { // a brass hat stand with hats hung on its pegs; tap to shop the hats
      const [px,py]=P(f.gx+0.5,f.gy+0.5); const X=Math.round(px), Y=Math.round(py);
      ellPx(X,Y,7,3,INK); ellPx(X,Y-0.5,6,2.5,'#c88a10'); ellPx(X,Y-1,4.5,1.8,'#ffd23f');
      g.fillStyle=INK; g.fillRect(X-2,Y-44,4,43); g.fillStyle='#ffd23f'; g.fillRect(X-1,Y-43,2,42); g.fillStyle='#fff2a0'; g.fillRect(X-1,Y-43,1,42);
      ellPx(X,Y-45,2.5,2.5,INK); ellPx(X,Y-45,1.5,1.5,'#ffd23f');
      f.items.forEach((id,i)=>{ const ic=itemIcon(id), side=i%2?1:-1, hy=Y-40+Math.floor(i/2)*13, hx=X+side*7;
        g.fillStyle=INK; g.fillRect(Math.min(X,hx),hy+3,Math.abs(hx-X)+1,2); g.drawImage(ic, Math.round(hx-ic.width/2), Math.round(hy-ic.height/2)); });
      itemHits.push({id:f.pick, x0:X-16, x1:X+16, y0:Y-50, y1:Y+3}); break; }
    case 'guide': { // GUS the tour guide: bobs a little and faces you
      const [px,py]=P(f.gx+0.5,f.gy+0.5), dir = me.x+me.y > f.gx+f.gy+1 ? (me.x-me.y > f.gx-f.gy ? 'fr' : 'fl') : (me.x-me.y > f.gx-f.gy ? 'br' : 'bl');
      g.drawImage(sprite('gus',dir,Math.floor(t*2)%2,'stand',{hat:'cap'}), Math.round(px)-14, Math.round(py)-46+(Math.floor(t*2)%2)); break; }
    case 'model': { // a model llama on a round stand, wearing an outfit from the racks; tap it to try the look on
      const [px,py]=P(f.gx+0.5,f.gy+0.5); const X=Math.round(px), Y=Math.round(py);
      ellPx(X,Y+1,11,5,INK); ellPx(X,Y,10,4.5,'#c88a10'); ellPx(X,Y-1,10,4.5,'#ffd23f'); ellPx(X,Y-1.5,8,3.4,'#fff2a0');
      const dir='fr';   /* display models stand still */
      g.drawImage(sprite('model',dir,0,'stand',f.w), X-14, Y-48);
      itemHits.push({id:f.pick, x0:X-12, x1:X+12, y0:Y-48, y1:Y+4}); break; }
    case 'roulette': drawRoulette(f, t); break;
    case 'blackjack': drawBlackjack(f, t); break;
    case 'cushion': { const [c0,c1,c2]=f.col; const sh=shadeHex(c0,0.62);
      box(f.gx+0.17,f.gy+0.17,0.66,0.66,6,c0,c1,sh);
      // puffy top: lighter inset + piping + tuft button
      const k=0.1; polyPx([P(f.gx+0.17+k,f.gy+0.17+k,6),P(f.gx+0.83-k,f.gy+0.17+k,6),P(f.gx+0.83-k,f.gy+0.83-k,6),P(f.gx+0.17+k,f.gy+0.83-k,6)],c2);
      const k2=0.2; polyPx([P(f.gx+0.17+k2,f.gy+0.17+k2,6),P(f.gx+0.83-k2,f.gy+0.17+k2,6),P(f.gx+0.83-k2,f.gy+0.83-k2,6),P(f.gx+0.17+k2,f.gy+0.83-k2,6)],c0);
      const [bx,by]=P(f.gx+0.5,f.gy+0.5,6); g.fillStyle=INK; g.fillRect(Math.round(bx)-1,Math.round(by)-1,3,2); g.fillStyle=c2; g.fillRect(Math.round(bx),Math.round(by)-1,1,1);
      // side seam
      { const [lx,ly]=P(f.gx+0.17,f.gy+0.83,3), [rx,ry]=P(f.gx+0.83,f.gy+0.83,3); for(let x=Math.round(lx)+2;x<Math.round(rx)-1;x+=2){ g.fillStyle=sh; g.fillRect(x, Math.round(ly+(x-lx)*(ry-ly)/(rx-lx)), 1, 1);} }
      break; }
    case 'table': {
      // leg + foot
      box(f.gx+0.33,f.gy+0.33,0.34,0.34,2,'#884020','#682818','#4a1a10');
      g.fillStyle=INK; g.fillRect(sx-3,sy-12,6,11); g.fillStyle='#a85830'; g.fillRect(sx-2,sy-12,2,10); g.fillStyle='#784020'; g.fillRect(sx,sy-12,2,10);
      // top slab
      box(f.gx+0.06,f.gy+0.06,0.88,0.88,3,'#e08840','#b86020','#884018',0,11);
      const k=0.08; polyPx([P(f.gx+0.06+k,f.gy+0.06+k,14),P(f.gx+0.94-k,f.gy+0.06+k,14),P(f.gx+0.94-k,f.gy+0.94-k,14),P(f.gx+0.06+k,f.gy+0.94-k,14)],'#f0a050'); grain(f.gx+0.1,f.gy+0.1,0.8,0.8,3,11,'#c87030','t');
      { const [ax,ay]=P(f.gx+0.22,f.gy+0.2,13), [bx2,by2]=P(f.gx+0.6,f.gy+0.2,13); linePx(ax,ay+1,bx2,by2+1,'#f8c880'); }
      const ty=sy-14;
      { const fl=Math.sin(t*9+f.gx)>0; g.fillStyle=INK; g.fillRect(sx-2,ty-6,4,6); g.fillStyle='#f8f8f8'; g.fillRect(sx-1,ty-5,2,4); g.fillStyle=fl?'#f8d030':'#f87830'; g.fillRect(sx-1,ty-8,2,2); }
      g.fillStyle=INK; g.fillRect(sx-9,ty-3,4,5); g.fillStyle='#f878b8'; g.fillRect(sx-8,ty-2,2,3);
      // fanned cards
      g.fillStyle=INK; g.fillRect(sx+2,ty+1,5,4); g.fillRect(sx+5,ty,5,4); g.fillStyle='#f8f8f8'; g.fillRect(sx+3,ty+2,3,2); g.fillRect(sx+6,ty+1,3,2); g.fillStyle='#f84848'; g.fillRect(sx+4,ty+2,1,1); g.fillStyle=INK; g.fillRect(sx+7,ty+1,1,1);
      drawTableFx(f,sx,sy+1); break; }
    case 'jukebox': inkOutline(sx, sy, ()=>drawJukebox(f, sx, sy, t)); drawJukeNotes(sx, sy, t); break;
    case 'arcade': inkOutline(sx, sy, ()=>drawArcade3D(f, sx, sy, t)); break;
    case 'sofa': { const T='#e05888', L='#b83868', R='#902850', gy=f.gy;
      box(0.02,gy,0.24,1,26,T,L,R);
      if (f.arm==='a') sofaArmrest(gy+0.02);
      const c0 = f.arm==='a' ? 0.16 : 0.03, c1 = f.arm==='a' ? 0.97 : 0.84;
      box(0.12,gy+c0,0.8,c1-c0,9,'#f078a0',L,R);
      break; }
    case 'sofaArm': { sofaArmrest(f.gy+0.8); break; }
    case 'sidetable': {
      box(f.gx+0.2,f.gy+0.2,0.6,0.6,2,'#884020','#682818','#4a1a10');
      g.fillStyle=INK; g.fillRect(sx-2,sy-14,4,13); g.fillStyle='#a85830'; g.fillRect(sx-1,sy-14,2,13);
      wbox(f.gx+0.12,f.gy+0.12,0.76,0.76,3,'#f0a050','#c86828','#984818',0,13,'#c06020','t');
      // little lamp
      g.fillStyle=INK; g.fillRect(sx-2,sy-22,4,7); g.fillStyle='#f8d030'; g.fillRect(sx-1,sy-21,2,5);
      const lit = f.fid ? !f.off : lampOn();   // a lamp in someone's room has its own switch
      if (lit){ g.fillStyle='rgba(248,232,120,0.28)'; ellPx(sx,sy-24,16,11,'rgba(248,232,120,0.22)'); ellPx(sx,sy-24,10,7,'rgba(248,240,160,0.3)'); }
      { const SH=lit?'#f8e870':'#b8b0a0', SD=lit?'#e0c050':'#989080', SL=lit?'#fffbe0':'#d0c8b8';   // drum shade: wider at the bottom, rim lines, light side
        polyPx([[sx-4,sy-30],[sx+4,sy-30],[sx+6,sy-21],[sx-6,sy-21]], INK); polyPx([[sx-3,sy-29],[sx+3,sy-29],[sx+5,sy-22],[sx-5,sy-22]], SH);
        g.fillStyle=SD; g.fillRect(sx+2,sy-28,2,6); g.fillStyle=SL; g.fillRect(sx-3,sy-28,1,5); g.fillStyle=SD; g.fillRect(sx-5,sy-22,10,1); g.fillStyle=SL; g.fillRect(sx-3,sy-29,6,1); }
      if (lit){ g.fillStyle='#f8e870'; g.fillRect(sx-7,sy-25,1,1); g.fillRect(sx+6,sy-25,1,1); g.fillRect(sx,sy-32,1,1); }
      // book
      g.fillStyle=INK; g.fillRect(sx+3,sy-18,7,3); g.fillStyle='#3890e0'; g.fillRect(sx+4,sy-17,5,1);
      break; }
    case 'rope': {
      const post=(wx,wy)=>{ const [px,py]=P(wx,wy); ellPx(px,py,4,2,INK); ellPx(px,py-1,3,1.5,'#c08018'); g.fillStyle=INK; g.fillRect(px-2,py-19,4,19); g.fillStyle='#f8d030'; g.fillRect(px-1,py-19,2,18); g.fillStyle='#f8f8f8'; g.fillRect(px-1,py-17,1,6); ellPx(px,py-21,3,3,INK); ellPx(px,py-21,2,2,'#f8d030'); return [px,py-17]; };
      const a=post(7.04,0.12), b=post(7.04,0.9);
      // k: 0 = hooked across, 1 = unhooked and hanging from the back post
      const k=(typeof ropeK==='number')?ropeK:0; const ke=k*k*(3-2*k);
      const hang=[a[0]+3, a[1]+15]; const swing = (k>0.05&&k<0.95) ? Math.sin(t*14)*2*(1-Math.abs(2*k-1)) : 0;
      const e=[b[0]+(hang[0]-b[0])*ke+swing, b[1]+(hang[1]-b[1])*ke];
      const sag=6*(1-ke)+2*ke;
      const pts=[]; for(let i=0;i<=12;i++){ const u=i/12; pts.push([a[0]+(e[0]-a[0])*u, a[1]+(e[1]-a[1])*u + Math.sin(u*Math.PI)*sag]); }
      for (let i=0;i<12;i++){ linePx(pts[i][0],pts[i][1]+1,pts[i+1][0],pts[i+1][1]+1,INK); }
      for (let i=0;i<12;i++){ linePx(pts[i][0],pts[i][1],pts[i+1][0],pts[i+1][1],'#d02838'); }
      for (let i=0;i<12;i++){ linePx(pts[i][0],pts[i][1]-1,pts[i+1][0],pts[i+1][1]-1,'#f05868'); }
      // redraw post tops over the rope ends
      for (const q of [a,b]){ ellPx(q[0],q[1]-4,3,3,INK); ellPx(q[0],q[1]-4,2,2,'#f8d030'); }
      if (k>0.5){ g.fillStyle=INK; g.fillRect(Math.round(e[0])-1,Math.round(e[1])-1,3,3); g.fillStyle='#f8d030'; g.fillRect(Math.round(e[0]),Math.round(e[1]),1,1); }   // loose brass hook
      break; }
    case 'saguaro': drawSaguaro(f, sx, sy, t); break;

    // ---------- LLAMA LOUNGE: sit-down slot machine ----------
    case 'slots': {
      // isometric slot cabinet filling its tile; the reel window is laid on the face toward the stool
      const x0=f.gx+0.03, x1=f.gx+0.97, y0=f.gy+0.34, y1=f.gy+0.88, H=38;
      const mine = me.p==='sit' && me.gx===f.gx && isSlotSeat(me.gx,me.gy); const sv = mine ? slotView() : slotIdle(f.gx);
      const now=performance.now(), win=sv.win, flash=Math.floor(t*(win?10:3));
      const K=SLOT_KINDS[slotKind(f.gx)];
      box(x0,y0,x1-x0,y1-y0,6,K.cab[3],K.cab[3],K.cab[3]);                 // pedestal
      box(x0+0.02,y0+0.02,x1-x0-0.04,y1-y0-0.04,H-6,K.cab[0],K.cab[1],K.cab[2],0,6);   // cabinet
      box(x0-0.02,y0-0.02,x1-x0+0.04,y1-y0+0.04,7,K.top[0],K.top[1],K.top[2],0,H);    // gold topper
      // face coordinates: u runs along the front face (left to right), v is height
      const [Lx,Ly]=P(x0+0.02,y1-0.02,0); const F=(u,v)=>[Math.round(Lx+u), Math.round(Ly+u*0.5)-v];
      const px=(u,v,c)=>{ const [X,Y]=F(u,v); g.fillStyle=c; g.fillRect(X,Y,1,1); };
      const W=Math.round((x1-x0-0.04)*20);   // face width in pixels
      // highlight strip down the left edge of the face
      for (let v=7; v<H-1; v++) px(1,v,K.lite);
      // chase lights on the topper face
      for (let u=2; u<W-1; u+=2) px(u, H+3, ((u/2)+flash)%2 ? '#f8f8f8' : '#f84848');
      // reel window: thin ink frame left/right, chrome top/bottom, three 5-pixel reels with dividers
      const wu0=0, wu1=Math.min(W,18), vT=H-8, vB=vT-12;
      for (let u=wu0; u<=wu1; u++) for (let v=vB; v<=vT; v++){ const side=u===wu0||u===wu1, tb=v===vB||v===vT, rim=v===vT-1||v===vB+1;
        px(u,v, side||tb ? INK : rim ? (v===vT-1 ? '#f0f0f8' : '#a8a8b8') : ((u-wu0)%6===0 ? '#181020' : '#f8f4e8')); }
      if (slotKind(f.gx)==='gold'){ // prize wheel machine: a little wheel in the window instead of reels
        const vm=(vT+vB)/2, spinA = sv.spin && now<sv.stopAt[2] ? (now-sv.t0)/90 : (sv.r.length===1 ? -(sv.r[0]+0.5)*Math.PI/8-Math.PI/2 : 0);
        for (let u=wu0+3; u<=wu1-3; u++) for (let v=vB+1; v<=vT-1; v++){ const dx=u-9, dy=v-vm, d=Math.sqrt(dx*dx+dy*dy*1.4); if (d>5.6) continue;
          let a=Math.atan2(-dy,dx)-spinA; a=((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2); const sl=WHEEL_SLICES[Math.floor(a/(Math.PI/8))%16]; px(u,v, d>4.8 ? '#f8d030' : WHEEL_COL[sl][1]); }
        px(9,vT,'#f84848'); }
      else for (let k=0;k<3;k++){ const u0=wu0+1+k*6; const spinning = sv.spin && now<sv.stopAt[k];
        const rr = sv.r.length===9 ? sv.r[3+k] : sv.r.length===1 ? (sv.r[0]+k*5)%6 : sv.r[k]; const S=SLOT_SYMS[spinning ? (Math.floor(t*18)+k*2)%SLOT_SYMS.length : (rr||0)%SLOT_SYMS.length]; const off = spinning ? (Math.floor(t*40)+k)%3-1 : 0;
        if (win && flash%2) for (let i=0;i<5;i++) for (let v=vB+2; v<=vT-2; v++) px(u0+i, v, '#fff4b0');
        for (let i=0;i<5;i++){ px(u0+i, vB+2, '#d8ccb0'); px(u0+i, vT-2, '#d8ccb0'); }
        S.r.forEach((row,j)=>{ const v=vT-3-j-off; if (v<vB+2||v>vT-2) return; for (let i=0;i<5;i++) if (row[i]==='#') px(u0+i, v, spinning ? '#a8a0b8' : S.c); }); }
      { const vm=Math.round((vT+vB)/2); px(wu0,vm,'#f84848'); px(wu1,vm,'#f84848'); }
      // button strip + coin tray, drawn flat on the face
      for (let u=0; u<=W; u++){ px(u,15,INK); px(u,14,'#383040'); px(u,13,'#585068'); px(u,12,INK); }
      [['#f84848',2],['#f8d030',6],['#48c048',10],['#58b8f8',14]].forEach(([c,u])=>{ px(u,14,c); px(u+1,14,c); });
      for (let u=5; u<=13; u++){ px(u,10,INK); px(u,9,'#d8d8e8'); px(u,8,'#a8a8b8'); px(u,7,INK); }
      px(4,9,INK); px(4,8,INK); px(14,9,INK); px(14,8,INK);
      if (win && flash%2){ px(7,9,'#f8d030'); px(10,8,'#f8d030'); px(12,9,'#f8d030'); }
      // lever on the right side
      { const pulled = sv.spin && now-sv.t0<350; const [bx,by]=P(x1+0.01,f.gy+0.55,22); const X=Math.round(bx), base=Math.round(by);
        g.fillStyle=INK; g.fillRect(X-1,base-2,4,5); g.fillStyle='#a8a8b8'; g.fillRect(X,base-1,2,3);
        const top = pulled ? base-5 : base-16; g.fillStyle=INK; g.fillRect(X,top,3,base-top); g.fillStyle='#e8e8f0'; g.fillRect(X+1,top+1,1,base-top-1);
        ellPx(X+1,top-1,3,3,INK); ellPx(X+1,top-1,2,2,'#f84848'); g.fillStyle='#ffa0a0'; g.fillRect(X,top-2,1,1); }
      break; }
    // ---------- LLAMA ACRES ----------
    case 'barn': {
      const R='#c83828', RS='#a82418', RD='#8a1c14', W='#f8f0e0', X0=0.12, X1=3.9, Y0=0.12, Y1=3.9, H=40, RH=68;
      const L=(p,q,c)=>linePx(p[0],p[1],q[0],q[1],c);
      // back roof slope peeks out past the ridge
      polyPx([P(-0.06,2,RH),P(X1+0.16,2,RH),P(X1+0.16,Y0-0.12,H-2),P(-0.06,Y0-0.12,H-2)],'#4a4a58');
      // long wall (faces the bottom-left) with vertical planks and a stone base
      polyPx([P(X0,Y1,0),P(X1,Y1,0),P(X1,Y1,H),P(X0,Y1,H)],RS);
      for (let u=X0+0.18; u<X1-0.05; u+=0.18) L(P(u,Y1,4),P(u,Y1,H-1),'#962014');
      // gable end wall (faces the bottom-right) with planks
      polyPx([P(X1,Y0,0),P(X1,Y1,0),P(X1,Y1,H),P(X1,Y0,H)],RD);
      polyPx([P(X1,Y0,H),P(X1,Y1,H),P(X1,2,RH-2)],RD);
      for (let v=Y0+0.18; v<Y1-0.05; v+=0.18){ const top = H + (RH-2-H)*(1-Math.abs(v-2)/1.9); L(P(X1,v,4),P(X1,v,Math.min(top,RH-3)-1),'#781410'); }
      // stone foundation
      polyPx([P(X0,Y1,0),P(X1,Y1,0),P(X1,Y1,4),P(X0,Y1,4)],'#888898'); polyPx([P(X1,Y0,0),P(X1,Y1,0),P(X1,Y1,4),P(X1,Y0,4)],'#686878');
      for (let u=X0+0.25; u<X1; u+=0.42) L(P(u,Y1,0),P(u,Y1,4),'#585868');
      // white corner + eave trim
      L(P(X1,Y1,0),P(X1,Y1,H),W); L(P(X1-0.04,Y1,0),P(X1-0.04,Y1,H),W); L(P(X0,Y1,0),P(X0,Y1,H),W);
      L(P(X1,Y0,H),P(X1,2,RH-2),W); L(P(X1,Y1,H),P(X1,2,RH-2),W);
      // windows on the long wall
      for (const u of [0.7,1.9]){ const Wf=[P(u,Y1,16),P(u+0.62,Y1,16),P(u+0.62,Y1,30),P(u,Y1,30)]; polyPx(Wf,W);
        polyPx([P(u+0.09,Y1,18),P(u+0.53,Y1,18),P(u+0.53,Y1,28),P(u+0.09,Y1,28)],'#f8c858');
        L(P(u+0.31,Y1,18),P(u+0.31,Y1,28),W); L(P(u+0.09,Y1,23),P(u+0.53,Y1,23),W); }
      // big double doors with white X bracing
      { const d0=1.15, d1=2.85, dh=30; const D=[P(X1,d0,0),P(X1,d1,0),P(X1,d1,dh),P(X1,d0,dh)]; polyPx(D,'#a02418');
        for (let v=d0+0.14; v<d1; v+=0.14) L(P(X1,v,1),P(X1,v,dh-1),'#881c10');
        L(D[0],D[1],W); L(D[1],D[2],W); L(D[2],D[3],W); L(D[3],D[0],W); L(P(X1,2,0),P(X1,2,dh),W);
        L(P(X1,d0,0),P(X1,2,dh),W); L(P(X1,2,0),P(X1,d0,dh),W); L(P(X1,2,0),P(X1,d1,dh),W); L(P(X1,d1,0),P(X1,2,dh),W);
        L(P(X1,d0-0.06,dh+2),P(X1,d1+0.06,dh+2),INK); }
      // hayloft door in the gable with hay poking out
      { const Hl=[P(X1,1.6,46),P(X1,2.4,46),P(X1,2.4,58),P(X1,1.6,58)]; polyPx(Hl,W); polyPx([P(X1,1.68,47),P(X1,2.32,47),P(X1,2.32,57),P(X1,1.68,57)],'#302018');
        polyPx([P(X1,1.68,47),P(X1,2.32,47),P(X1,2.32,50),P(X1,1.68,50)],'#f8d030'); const [hx,hy]=P(X1,1.9,51); g.fillStyle='#f8e070'; g.fillRect(Math.round(hx),Math.round(hy),3,1); g.fillRect(Math.round(hx)+4,Math.round(hy)+1,2,1);
        const [px,py]=P(X1,2,62); g.fillStyle=INK; g.fillRect(Math.round(px)-1,Math.round(py),3,2); }
      // front roof slope: grey shingles, ridge cap and eave edge
      const roof=[P(-0.06,Y1+0.16,H-2),P(X1+0.16,Y1+0.16,H-2),P(X1+0.16,2,RH),P(-0.06,2,RH)];
      polyPx(roof,'#787888');
      for (let k=1;k<=6;k++){ const fr=k/7; const y=Y1+0.16-(Y1+0.16-2)*fr, h=(H-2)+(RH-(H-2))*fr; L(P(-0.02,y,h),P(X1+0.12,y,h),'#606070');
        for (let u=0.1+(k%2)*0.17; u<X1+0.1; u+=0.34){ const [sx2,sy2]=P(u,y,h); g.fillStyle='#606070'; g.fillRect(Math.round(sx2),Math.round(sy2)+1,1,3); } }
      L(P(-0.06,2,RH),P(X1+0.16,2,RH),'#a8a8b8'); L(P(-0.06,2,RH+1),P(X1+0.16,2,RH+1),INK);
      L(P(-0.06,Y1+0.16,H-3),P(X1+0.16,Y1+0.16,H-3),'#a8a8b8');
      // outlines
      L(roof[0],roof[1],INK); L(roof[1],roof[2],INK); L(roof[3],roof[0],INK);
      L(P(X1+0.16,2,RH),P(X1+0.16,Y0-0.12,H-2),INK); L(P(X1+0.16,Y0-0.12,H-2),P(X1,Y0,H-2),INK);
      L(P(X0,Y1,0),P(X1,Y1,0),INK); L(P(X1,Y1,0),P(X1,Y0,0),INK); L(P(X1,Y0,0),P(X1,Y0,H-1),INK); L(P(X0,Y1,0),P(X0,Y1,H-3),INK);
      break; }
    case 'bench': {
      // wooden park bench, L tiles long: legs at the ends and the middle, slatted seat, backrest on the far side
      const W1='#c88a50', W2='#a86a34', W3='#7e4c24', X=f.ax==='x', L=f.len||1;
      const along=[0.14, ...(L>1?[L/2-0.03]:[]), L-0.2];
      const [cx2,cy2]=P(f.gx+(X?L/2:0.5), f.gy+(X?0.5:L/2)); ellPx(cx2,cy2+1,13+(L-1)*14,4+(L-1)*3,'rgba(40,80,20,0.3)');
      if (X){ for (const u of along) for (const v of [0.3,0.7]) box(f.gx+u-0.03,f.gy+v-0.03,0.06,0.06,7,W3,W3,'#5e3418');
        box(f.gx+0.08,f.gy+0.22,L-0.16,0.56,2,W1,W2,W3,0,7);
        for (const v of [0.4,0.6]) linePx(...P(f.gx+0.1,f.gy+v,9),...P(f.gx+L-0.1,f.gy+v,9),W2);
        for (const u of along) box(f.gx+u-0.03,f.gy+0.16,0.06,0.06,15,W3,W3,'#5e3418',0,7);
        box(f.gx+0.08,f.gy+0.14,L-0.16,0.08,3,W1,W2,W3,0,12); box(f.gx+0.08,f.gy+0.14,L-0.16,0.08,4,W1,W2,W3,0,18); }
      else { for (const v of along) for (const u of [0.3,0.7]) box(f.gx+u-0.03,f.gy+v-0.03,0.06,0.06,7,W3,W3,'#5e3418');
        box(f.gx+0.22,f.gy+0.08,0.56,L-0.16,2,W1,W2,W3,0,7);
        for (const u of [0.4,0.6]) linePx(...P(f.gx+u,f.gy+0.1,9),...P(f.gx+u,f.gy+L-0.1,9),W2);
        for (const v of along) box(f.gx+0.16,f.gy+v-0.03,0.06,0.06,15,W3,W3,'#5e3418',0,7);
        box(f.gx+0.14,f.gy+0.08,0.08,L-0.16,3,W1,W2,W3,0,12); box(f.gx+0.14,f.gy+0.08,0.08,L-0.16,4,W1,W2,W3,0,18); }
      break; }
    case 'hayseat': box(f.gx+0.1,f.gy+0.15,0.8,0.7,10,'#f8d030','#e0b020','#b88818');
      { g.fillStyle='#c09018'; for (let k=0;k<6;k++) g.fillRect(sx-10+k*4,sy-6-((k*3)%3),1,2); g.fillStyle='#f8e888'; g.fillRect(sx-6,sy-12,5,1); g.fillStyle='#884020'; g.fillRect(sx-1,sy-10,1,9); } break;
    case 'gate': {
      // farm archway: two tall capped posts, a crossbeam, and a white swing gate with a diagonal brace
      const a=P(f.gx,0), b=P(f.gx+1,0);
      const post=(p)=>{ const X=Math.round(p[0]), Y=Math.round(p[1]); g.fillStyle=INK; g.fillRect(X-3,Y-40,7,41); g.fillStyle='#8a5a30'; g.fillRect(X-2,Y-39,5,39); g.fillStyle='#a87040'; g.fillRect(X-2,Y-39,2,39); g.fillStyle=INK; g.fillRect(X-4,Y-43,9,4); g.fillStyle='#c89060'; g.fillRect(X-3,Y-42,7,2); };
      post(a); post(b);
      linePx(a[0]-4,a[1]-37,b[0]+4,b[1]-37,INK); linePx(a[0]-4,a[1]-36,b[0]+4,b[1]-36,'#a87040'); linePx(a[0]-4,a[1]-35,b[0]+4,b[1]-35,'#8a5a30'); linePx(a[0]-4,a[1]-34,b[0]+4,b[1]-34,INK);
      // white five-bar farm gate hung between the posts: open rails you can see through, end stiles, a diagonal brace, hinges and a latch
      const A=[a[0]+3,a[1]], B=[b[0]-3,b[1]];
      const at=(u,h)=>[A[0]+(B[0]-A[0])*u, A[1]+(B[1]-A[1])*u-h];
      const bar=(p1,p2,thick)=>{ for (let k=-1;k<=thick;k++) linePx(p1[0],p1[1]+k,p2[0],p2[1]+k, (k===-1||k===thick)?INK:(k===0?'#ffffff':'#e0dccf')); };
      for (const h of [5,14,23]) bar(at(0,h),at(1,h),2);
      bar(at(0.05,6),at(0.95,22),1);                                                // brace, hinge side low to latch side high
      for (const u of [0,1]){ const [x,y]=at(u,0); const X=Math.round(x)+(u?-2:0); g.fillStyle=INK; g.fillRect(X-1,Math.round(y)-26,4,24); g.fillStyle='#f4f0e4'; g.fillRect(X,Math.round(y)-25,2,22); g.fillStyle='#c8c4b8'; g.fillRect(X+1,Math.round(y)-25,1,22); }
      for (const h of [7,21]){ const [x,y]=at(0,h); g.fillStyle=INK; g.fillRect(Math.round(x)-5,Math.round(y)-1,5,3); g.fillStyle='#585868'; g.fillRect(Math.round(x)-4,Math.round(y),3,1); }   // hinges
      { const [x,y]=at(1,15); const X=Math.round(x), Y=Math.round(y); g.fillStyle=INK; g.fillRect(X-1,Y-2,6,4); g.fillStyle='#a8a8b8'; g.fillRect(X,Y-1,4,2); g.fillStyle='#d8d8e8'; g.fillRect(X,Y-1,1,1); }   // latch
      const cx=Math.round((a[0]+b[0])/2), cy=Math.round((a[1]+b[1])/2);
      break; }
    case 'pond': {
      // pond fitted to its w x h tiles (a rounded iso shape, so the footpath round it stays clear):
      // muddy bank, deep and shallow water, lily pads and rocks are cached; ripples and reeds animate
      const w=f.w||3, h=f.h||3, cxg=f.gx+w/2, cyg=f.gy+h/2, ex=w/2, ey=h/2, pw=2.6;
      const [pcx,pcy]=P(cxg,cyg); const cx=Math.round(pcx), cy=Math.round(pcy), HW=(w+h)*10+4, HH=(w+h)*5+4;
      const sup=(a,r)=>{ const c=Math.cos(a), sn=Math.sin(a); return [r*ex*Math.sign(c)*Math.pow(Math.abs(c),2/pw), r*ey*Math.sign(sn)*Math.pow(Math.abs(sn),2/pw)]; };
      const key='pond'+w+'x'+h; let pc=pondCache[key];
      if (!pc){ pc=document.createElement('canvas'); pc.width=HW*2; pc.height=HH*2; const q=pc.getContext('2d'); pondCache[key]=pc;
        const norm=(gx,gy)=>pondNorm(gx,gy,ex,ey,pw);
        const layer=(r,col,ox=0,oy=0)=>{ q.fillStyle=col; for (let y=-HH;y<HH;y++){ let run=null; for (let x=-HW;x<=HW;x++){ const dx=x-ox, dy=y-oy; const inside = x<HW && norm((dx/20+dy/10)/2,(dy/10-dx/20)/2)<=r;
            if (inside && run===null) run=x; else if (!inside && run!==null){ q.fillRect(HW+run,HH+y,x-run,1); run=null; } } } };
        layer(1.0,INK); layer(0.975,'#b89058'); layer(0.91,'#9a7444'); layer(0.875,INK); layer(0.86,'#2858a8'); layer(0.62,'#3870c8',4,-3); layer(0.34,'#4890e0',8,-5);
        const at=(gx,gy)=>[HW+(gx-gy)*10, HH+(gx+gy)*5];
        const ell=(x,y,rx,ry,col)=>{ q.fillStyle=col; for (let j=-Math.round(ry);j<=Math.round(ry);j++){ const ww=Math.round(rx*Math.sqrt(Math.max(0,1-(j/ry)*(j/ry)))); q.fillRect(Math.round(x-ww),Math.round(y+j),ww*2,1); } };
        for (const [fx,fy] of [[-0.55,0.25],[0.5,-0.4],[0.6,0.35],[-0.15,0.55],[0.1,-0.1],[-0.6,-0.3]]){ const [X,Y]=at(fx*ex,fy*ey); ell(X,Y,5,2.5,'#2a7030'); ell(X,Y-0.5,4.4,2,'#48a040'); q.fillStyle='#2858a8'; q.fillRect(Math.round(X),Math.round(Y)-1,2,1); }
        { let [X,Y]=at(0.5*ex,-0.4*ey); q.fillStyle='#f878b8'; q.fillRect(Math.round(X)-1,Math.round(Y)-3,2,2); q.fillStyle='#f8d030'; q.fillRect(Math.round(X)-1,Math.round(Y)-3,1,1);
          [X,Y]=at(-0.55*ex,0.25*ey); q.fillStyle='#f8f0f8'; q.fillRect(Math.round(X)-1,Math.round(Y)-3,2,2); q.fillStyle='#f8d030'; q.fillRect(Math.round(X)-1,Math.round(Y)-3,1,1); }
        for (let i=0;i<12;i++){ const a=i/12*Math.PI*2+0.3, r=3-(i%3)*0.4; const [gx,gy]=sup(a,0.93); const [X,Y]=at(gx,gy); ell(X,Y,r+1,r*0.7+1,INK); ell(X,Y,r,r*0.7,'#9898a8'); q.fillStyle='#c8c8d8'; q.fillRect(Math.round(X-1),Math.round(Y-1),1,1); }
      }
      g.drawImage(pc, cx-HW, cy-HH);
      { const ph=t*1.4; g.fillStyle='#b8e0f8'; for (let i=0;i<9;i++){ const [gx,gy]=sup(i*0.7+0.4, 0.25+((i*37)%50)/100); const [X,Y]=P(cxg+gx,cyg+gy); g.fillRect(Math.round(X+Math.sin(ph+i)*2),Math.round(Y),3+(i%2),1); } }
      // cattails along the back bank, swaying
      { const sway=Math.round(Math.sin(t*1.5)); for (const [a,hh] of [[3.3,15],[3.5,19],[3.7,13],[4.55,16],[4.75,12],[5.6,14],[5.8,18],[2.9,11]]){ const [gx,gy]=sup(a,0.9); const [x,y]=P(cxg+gx,cyg+gy); const X=Math.round(x), Y=Math.round(y);
          g.fillStyle='#3a8030'; g.fillRect(X,Y-hh,1,hh); g.fillStyle='#58a840'; g.fillRect(X+1,Y-hh+3,1,hh-3);
          if (hh>=14){ g.fillStyle=INK; g.fillRect(X-1+sway,Y-hh-5,3,6); g.fillStyle='#7a4a28'; g.fillRect(X+sway,Y-hh-4,1,4); } } }
      break; }
    case 'signpost': { g.fillStyle=INK; g.fillRect(sx-2,sy-30,4,30); g.fillStyle='#a87040'; g.fillRect(sx-1,sy-30,2,29);
      g.fillStyle=INK; g.fillRect(sx-20,sy-42,40,17); g.fillStyle='#c08850'; g.fillRect(sx-19,sy-41,38,15); g.fillStyle='#a87040'; g.fillRect(sx-19,sy-34,38,1);
      if (typeof pfDraw==='function'){ pfDraw(g,'LLAMA',sx-9,sy-40,'#f8f8f8'); pfDraw(g,'ACRES',sx-9,sy-32,'#f8f8f8'); } break; }
    case 'campfire': {
      ellPx(sx,sy,13,6,INK); ellPx(sx,sy,12,5,'#787888'); ellPx(sx,sy,8,3,'#383038');
      g.fillStyle='#a8a8b8'; for (const [a,b] of [[-11,-1],[-6,3],[4,3],[10,0],[6,-4],[-5,-4]]) g.fillRect(sx+a,sy+b,3,2);
      g.fillStyle=INK; g.fillRect(sx-8,sy-3,16,4); g.fillStyle='#884020'; g.fillRect(sx-7,sy-2,14,2); g.fillStyle='#a85830'; g.fillRect(sx-4,sy-5,8,3);
      { const fl=t*9; const H=[12,16,11]; for (let k=0;k<3;k++){ const h=H[k]+Math.round(Math.sin(fl+k*2.1)*3); const x=sx-6+k*5;
          for (let y=0;y<h;y++){ const w=Math.max(1,Math.round((1-y/h)*4)); g.fillStyle = y<h*0.35 ? '#f84818' : y<h*0.7 ? '#f8a020' : '#f8e860'; g.fillRect(x-w+2+Math.round(Math.sin(fl*1.3+y*0.6+k))*(y>h/2?1:0), sy-4-y, w*2-1, 1); } }
        if (Math.floor(t*5)%3===0){ g.fillStyle='#f8e860'; g.fillRect(sx+Math.round(Math.sin(t*7)*5), sy-24-Math.round((t*20)%10), 1, 1); } }
      break; }
    case 'log': {
      // round log lying on the grass: stamped along its length, bark grooves, ringed cut end toward the viewer
      const along = f.ax==='x'; const r=4.2, hgt=4.6;
      const A = along ? P(f.gx+0.14,f.gy+0.5,hgt) : P(f.gx+0.5,f.gy+0.14,hgt), B = along ? P(f.gx+0.86,f.gy+0.5,hgt) : P(f.gx+0.5,f.gy+0.86,hgt);
      const n=Math.ceil(Math.hypot(B[0]-A[0],B[1]-A[1]));
      ellPx(sx,sy+1,13,4,'rgba(40,80,20,0.35)');
      for (let i=0;i<=n;i++){ const u=i/n; ellPx(A[0]+(B[0]-A[0])*u, A[1]+(B[1]-A[1])*u, r+1, r+1, INK); }
      for (let i=0;i<=n;i++){ const u=i/n; ellPx(A[0]+(B[0]-A[0])*u, A[1]+(B[1]-A[1])*u, r, r, '#8a5428'); }
      for (let i=0;i<=n;i++){ const u=i/n; ellPx(A[0]+(B[0]-A[0])*u, A[1]+(B[1]-A[1])*u-1.5, r-1.5, r-2.2, '#a86a34'); }
      linePx(A[0],A[1]-3,B[0],B[1]-3,'#c88a50');
      for (const k of [0.25,0.55,0.8]){ const x=A[0]+(B[0]-A[0])*k, y=A[1]+(B[1]-A[1])*k; linePx(x-1,y+1,x+2,y+(along?2:0),'#5e3418'); }
      { const [ex,ey]=B; ellPx(ex,ey,r+1,r+1,INK); ellPx(ex,ey,r,r,'#e8c088'); ellPx(ex,ey,r-1.6,r-1.6,'#c89058'); ellPx(ex,ey,r-2.6,r-2.6,'#e8c088'); g.fillStyle='#a87040'; g.fillRect(Math.round(ex),Math.round(ey),1,1); }
      break; }
    case 'crop': {
      box(f.gx+0.08,f.gy+0.08,0.84,0.84,3,'#9a6034','#7a4824','#5e3618');
      for (const u of [0.3,0.5,0.7]) linePx(...P(f.gx+0.14,f.gy+u,3),...P(f.gx+0.86,f.gy+u,3),'#7a4824');
      const prog = (typeof cropProgress==='function') ? cropProgress(f.k) : 1;
      for (const [u,v] of [[0.3,0.3],[0.7,0.3],[0.5,0.55],[0.3,0.75],[0.7,0.75]]){ const [px,py]=P(f.gx+u,f.gy+v,3); const X=Math.round(px), Y=Math.round(py);
        if (prog>=1){ g.fillStyle='#f87818'; g.fillRect(X-1,Y-1,3,2); g.fillStyle=INK; g.fillRect(X-1,Y,3,1); g.fillStyle='#48a838'; g.fillRect(X-2,Y-5,1,4); g.fillRect(X,Y-6,1,5); g.fillRect(X+2,Y-5,1,4); g.fillStyle='#78d058'; g.fillRect(X,Y-6,1,2); }
        else { const h=1+Math.floor(prog*4); g.fillStyle='#58b040'; g.fillRect(X,Y-h,1,h); if (h>2){ g.fillRect(X-1,Y-h+1,1,1); g.fillRect(X+1,Y-h+1,1,1); } } }
      if (prog>=1 && Math.floor(t*2+f.gx)%4===0){ const [px,py]=P(f.gx+0.5,f.gy+0.5,14); g.fillStyle='#f8f8a0'; g.fillRect(Math.round(px),Math.round(py),1,1); }
      break; }
    case 'tree': { box(f.gx+0.4,f.gy+0.4,0.2,0.2,26,'#8a5a30','#784a28','#5a3418');
      const L='#58a840', M='#489038', D='#387828';
      for (const [dx,dy,r] of [[0,-44,14],[-9,-34,11],[9,-34,11],[0,-30,12]]) ellPx(sx+dx,sy+dy,r+1,r*0.85+1,INK);
      for (const [dx,dy,r,c] of [[0,-44,14,M],[-9,-34,11,M],[9,-34,11,D],[0,-30,12,M],[-4,-46,7,L],[-10,-36,5,L]]) ellPx(sx+dx,sy+dy,r,r*0.85,c);
      g.fillStyle='#e04848'; for (const [dx,dy] of [[-6,-40],[5,-48],[8,-32],[-2,-30]]) g.fillRect(sx+dx,sy+dy,2,2); break; }
    case 'cider': case 'snack': drawStall(f, sx, sy, t); break;
    case 'fern': drawFern(f, sx, sy, t); break;
    case 'apple': { const ready = (typeof appleReady==='function') ? appleReady(f.k) : true;
      ellPx(sx,sy+1,9,3,'rgba(40,80,20,0.3)');
      const bite = (typeof appleBite==='function') ? appleBite(f.k) : 99;
      if (ready){ drawApple(sx-4,sy-3,false); drawApple(sx+3,sy-4,false); drawApple(sx,sy-1,true); }
      else if (bite<0.7){ drawApple(sx,sy-1-Math.round(bite*6),true); g.fillStyle='#f8f0c8'; g.fillRect(sx+2,sy-5-Math.round(bite*6),3,3);
        for (let i=0;i<6;i++){ const a=i*1.05, r=4+bite*16; g.fillStyle=i%2?'#d82838':'#f8f0c8'; g.fillRect(Math.round(sx+Math.cos(a)*r),Math.round(sy-6+Math.sin(a)*r*0.6-bite*8),1,1); } }
      else drawAppleCore(sx,sy);
      break; }
    case 'pumpkin': { ellPx(sx,sy-4,8,5,INK); ellPx(sx,sy-4,7,4,'#f08828'); g.fillStyle='#c86018'; g.fillRect(sx-3,sy-7,1,6); g.fillRect(sx+2,sy-7,1,6); g.fillStyle='#f8b058'; g.fillRect(sx-5,sy-6,2,1);
      g.fillStyle=INK; g.fillRect(sx-1,sy-11,3,4); g.fillStyle='#589038'; g.fillRect(sx,sy-10,1,3); break; }
    case 'keg': { // octagonal wooden keg, built from iso faces like the rest of the furniture
      const cx=f.gx+0.5, cy=f.gy+0.5, A=0.36, B=0.15, H=26;
      const v=[[A,-B],[A,B],[B,A],[-B,A],[-A,B],[-A,-B],[-B,-A],[B,-A]].map(([dx,dy])=>[cx+dx,cy+dy]);
      const Q=(i,h)=>P(v[i][0],v[i][1],h);
      const faces=[[0,1,'#984818'],[1,2,'#b86028'],[2,3,'#c87030']];
      for (const [i,j,c] of faces) polyPx([Q(i,0),Q(j,0),Q(j,H),Q(i,H)],c);
      // staves: lighter centre stripe + dark seams
      for (const [i,j,c] of faces){ const m=[(v[i][0]+v[j][0])/2,(v[i][1]+v[j][1])/2]; const [a1,b1]=P(m[0],m[1],1), [a2,b2]=P(m[0],m[1],H-1); linePx(a1,b1,a2,b2, c==='#c87030'?'#e09050':'#c87038'); }
      for (const i of [1,2]){ const [a1,b1]=Q(i,1), [a2,b2]=Q(i,H-1); linePx(a1,b1,a2,b2,'#683018'); }
      // iron hoops
      for (const hh of [5,6,H-6,H-5]) for (const [i,j] of [[0,1],[1,2],[2,3]]){ const p1=Q(i,hh), p2=Q(j,hh); linePx(p1[0],p1[1],p2[0],p2[1], (hh===6||hh===H-5)?'#a8a8b8':'#585868'); }
      // lid
      polyPx(v.map((_,i)=>Q(i,H)),'#e09858');
      const vi=v.map(([x,y])=>[cx+(x-cx)*0.62, cy+(y-cy)*0.62]); polyPx(vi.map(([x,y])=>P(x,y,H)),'#c87838');
      { const [bx,by]=P(cx+0.12,cy-0.06,H); g.fillStyle=INK; g.fillRect(Math.round(bx)-1,Math.round(by)-1,3,2); g.fillStyle='#784020'; g.fillRect(Math.round(bx),Math.round(by)-1,1,1); }
      // outlines
      const L=(p,q)=>linePx(p[0],p[1],q[0],q[1],INK);
      for (let i=0;i<8;i++) L(Q(i,H),Q((i+1)%8,H));
      L(Q(0,0),Q(1,0)); L(Q(1,0),Q(2,0)); L(Q(2,0),Q(3,0)); L(Q(0,0),Q(0,H)); L(Q(3,0),Q(3,H));
      // brass tap on the front face
      { const [tx,ty]=P((v[1][0]+v[2][0])/2,(v[1][1]+v[2][1])/2,12); const X=Math.round(tx), Y=Math.round(ty);
        g.fillStyle=INK; g.fillRect(X-2,Y-2,5,4); g.fillRect(X-1,Y+2,3,3); g.fillStyle='#f8d030'; g.fillRect(X-1,Y-1,3,2); g.fillRect(X,Y+2,1,2); g.fillStyle='#f8f0a0'; g.fillRect(X-1,Y-1,1,1);
        g.fillStyle=INK; g.fillRect(X-1,Y-6,3,4); g.fillStyle='#c03070'; g.fillRect(X,Y-5,1,3); }
      break; }
    case 'barrel': { box(f.gx,f.gy,1,1,8,'#f08850','#d06838','#a84828',0.25); g.fillStyle='#683018'; g.fillRect(sx-7,sy-9,14,2);
      ellPx(sx,sy-16,9,9,INK); ellPx(sx,sy-16,8,8,'#48a048'); ellPx(sx-2,sy-18,4,5,'#78d070');
      g.fillStyle='#2a7a38'; for (const dx of [-5,-2,2,5]) g.fillRect(sx+dx,sy-23,1,14);
      g.fillStyle='#f8f8d0'; for (const [a,b] of [[-6,-19],[-3,-22],[1,-21],[4,-18],[6,-14],[-6,-12],[0,-12]]) g.fillRect(sx+a,sy+b,1,1);
      g.fillStyle=INK; g.fillRect(sx-4,sy-28,8,5); g.fillStyle='#f85888'; g.fillRect(sx-3,sy-27,6,3); g.fillStyle='#f8b8d8'; g.fillRect(sx-2,sy-27,2,1); g.fillStyle='#f8d030'; g.fillRect(sx,sy-26,1,1);
      break; }
    case 'hay': { box(f.gx+0.08,f.gy+0.12,0.84,0.76,11,'#f8d030','#e0b020','#b88818');
      box(f.gx+0.2,f.gy+0.25,0.6,0.5,10,'#f8e060','#e0b020','#b88818',0,11);
      // straw texture + twine
      g.fillStyle='#c09018'; for (let k=0;k<7;k++){ g.fillRect(sx-12+k*3,sy-4-((k*7)%5),1,2); g.fillRect(sx-8+k*2,sy-15-((k*5)%4),1,2); }
      g.fillStyle='#884020'; { const [a1,b1]=P(f.gx+0.5,f.gy+0.88,0); g.fillRect(Math.round(a1)-1,Math.round(b1)-11,1,11); const [a2,b2]=P(f.gx+0.5,f.gy+0.75,11); g.fillRect(Math.round(a2)-1,Math.round(b2)-10,1,10); }
      g.fillStyle='#f8e060'; g.fillRect(sx+6,sy-25,1,3); g.fillRect(sx+8,sy-24,1,2); g.fillRect(sx-7,sy-24,1,2);
      break; }
  }
}


// ======================= GAME STATE =======================
const STEP = 0.3;
let store = {};
try { store = JSON.parse(localStorage.getItem('llamaLounge')||'{}') || {}; } catch(e){ store={}; }
function saveStore(){ try { localStorage.setItem('llamaLounge', JSON.stringify(store)); } catch(e){} }
const me = { c: CHAR_IDS.includes(store.c)?store.c:'twotone', n: (typeof store.n==='string'?store.n:'').slice(0,12), gx:1, gy:10, x:1.5, y:10.5, d:'fr', p:'stand', path:[], moving:false, prog:0, from:null, to:null, anim:0, sayK:0, bubble:null, h:null, hl:0, sipStart:-9999, sipK:0, emote:null, emK:0, act:null, pending:null };
const others = new Map();
let room = null, joined = false, myPeer = null;
const clean = (s,max) => (typeof s==='string' ? s : '').replace(/[\u0000-\u001f\u007f-\u009f​-‏‪-‮⁦-⁩]/g,'').slice(0,max);
// ======================= LLAMA TOKENS (wallet) =======================
// Balance lives on this device for now. When the lounge moves to its own server, swap these
// three functions for server calls (get balance / credit / debit) and nothing else needs to change.
const TOKENS = { START:10, DRINK:1, BET:2, BAR_EVERY:30 };
const wallet = {
  get(){ return Number.isInteger(store.tk) ? store.tk : 0; },
  add(){}, spend(){ return false; },        // tokens only change on the server
};
// Balance is kept in this viewer's private db space (data/users/<id>/wallet), so it survives leaving,
// reloading and switching devices. The browser copy is only a fallback when db isn't available.
let walletRef=null, walletReady=false, walletDelta=0, walletBusy=false, walletDirty=false;
function walletSave(){}
async function walletFlush(){}
async function initWallet(){}
function tkSet(v, why){ if (!Number.isFinite(v)) return; const d=v-wallet.get(); store.tk=v; saveStore(); tokUI(d>0?1:d<0?-1:0); if (why) localMsg(why); if (typeof sheetHead==='function') for (const el of document.querySelectorAll('.gb.sheet')) if (el.style.display==='block') sheetHead(el); }   /* keep 'YOU HAVE N TOKENS' in open pop-ups current */
function tokUI(dir){ const el=document.getElementById('tokn'), row=document.getElementById('tokrow'); if(!el) return; el.textContent=wallet.get();
  if (dir){ row.classList.remove('up','down'); void row.offsetWidth; row.classList.add(dir>0?'up':'down'); }
  if (typeof sendPresence==='function' && joined) sendPresence(); }
const DRINKS = { soda:{label:'HAY SODA', c:'#f84848'}, ajuice:{label:'APPLE JUICE', c:'#f0c040'}, juice:{label:'GRASS JUICE', c:'#48c048'}, shake:{label:'BERRY SHAKE', c:'#f878b8'}, cider:{label:'HOT APPLE CIDER', c:'#c87028'}, caramel:{label:'CARAMEL APPLE CIDER', c:'#e8a038'},
  capple:{label:'CARAMEL APPLE', c:'#d83838', food:true}, corn:{label:'CORN ON THE COB', c:'#f8d030', food:true}, pie:{label:'SLICE OF APPLE PIE', c:'#e8c070', food:true},
  nachos:{label:'HAY NACHOS', c:'#f8c040', food:true}, fries:{label:'ALFALFA FRIES', c:'#f8d860', food:true}, burger:{label:'CLOVER BURGER', c:'#c87838', food:true}, chips:{label:'BAG OF HAY CHIPS', c:'#8a48e0', food:true}, candy:{label:'CLOVER CANDY BAR', c:'#7a3a18', food:true}, cookie:{label:'OAT COOKIE', c:'#c88a50', food:true} };
const DRINK_IDS = Object.keys(DRINKS), BAR_IDS = ['soda','juice','shake'];   // the bar pours these; cider and snacks come from the stands in LLAMA ACRES
const FOOD_PX = {   // held snacks, bottom row sits in the hoof; bites come off the top
  capple:['...K...','...T...','.KKTKK.','KCCCCCK','KCRCCRK','KRRRRWK','KRRRRRK','.KRRRK.','..KKK..'],
  corn:['.KKK.','KYyYK','KyYyK','KYyYK','KyYyK','KYyYK','GKYKG','GGKGG','.GGG.'],
  pie:['K.......','KFK.....','KFFKK...','KFFFFKK.','KFFFFFFK','KBBBBBBK','.KKKKKK.'],
  nachos:['..K.K...','.KYKYK..','KYyYKYK.','KYYyYYyK','KCCCCCCK','.KRRRRK.','..KKKK..'],
  fries:['.K.K.K.','KYKYKYK','KYKYKYK','KRRRRRK','KRWRRWK','KRRRRRK','.KKKKK.'],
  burger:['.KKKKK.','KBBTBBK','KGGGGGK','KMMMMMK','KYYYYYK','KBBBBBK','.KKKKK.'],
  chips:['.K.K.K.','KPKPKPK','KPPPPPK','KPYYYPK','KPYyYPK','KPYYYPK','KPPPPPK','KKKKKKK'],
  candy:['KKKKK','KOOOK','KMMMK','KMDMK','KMMMK','KMDMK','KMMMK','KOOOK','KKKKK'],
  cookie:['.KKKK.','KBBBBK','KBDBBK','KBBBDK','KDBBBK','KBBDBK','.KKKK.'] };
const FOOD_PAL = {K:'#181020',T:'#e8d0a0',C:'#d89838',R:'#d82838',W:'#f8a0a0',Y:'#f8d030',y:'#d8a818',G:'#58a840',F:'#e8c070',B:'#c88a50',M:'#7a3a18',P:'#8a48e0',O:'#f07830',D:'#4a2010'};
const EMOTES = ['heart','bang','huh','note','lol','zzz','wave','flex','palm'];
const SONGS = ['LOUNGE GROOVE','HAYLOFT HOP','FUNKY HOOVES'];

function dirFrom(dx,dy,prev){ const sx=dx-dy, sy=dx+dy; const v = sy>0?'f':sy<0?'b':prev[0]; const s = sx>0?'r':sx<0?'l':prev[1]; return v+s; }
const WALK_PX = 46; // screen pixels per second: one steady pace in every direction
const stepLen = (dx,dy) => Math.hypot((dx-dy)*TW/2, (dx+dy)*TH/2);
function startStep(){ if (me.fish) stopFish(true);
  { const nx=me.path[0], occ=llamaTiles(); if (nx && occ.has(nx[1]*N+nx[0])){ const end=me.path[me.path.length-1];   // someone stepped into the way
      const p2 = (end[0]===nx[0]&&end[1]===nx[1]) ? null : findPath(me.gx,me.gy,end[0],end[1]);
      if (p2 && p2.length && !occ.has(p2[0][1]*N+p2[0][0])) me.path=p2; else { me.path=[]; me.moving=false; me.x=me.gx+0.5; me.y=me.gy+0.5; me.pending=null; sendPresence(); return; } } } me.from=[me.gx,me.gy]; me.to=me.path[0]; me.stepT = Math.max(0.2, stepLen(me.to[0]-me.gx, me.to[1]-me.gy)/(WALK_PX*(ndEmpty()?0.6:1))); me.d=dirFrom(me.to[0]-me.gx, me.to[1]-me.gy, me.d); me.moving=true; me.p=me.bar?'bar':'stand'; sendPresence(); }
function walkTo(tx,ty,pending){
  if (userTap) camMan=false;   // tapping somewhere to walk: the camera goes back to following your llama
  if (me.bar){ leaveBar(tx,ty,pending); return true; }
  if (me.cash){ leaveCash(tx,ty,pending); return true; }
  me.pending = pending||null;
  if (me.moving){ const rest=findPath(me.to[0],me.to[1],tx,ty); if(!rest) return false; me.path=[me.path[0],...rest]; return true; }
  if (me.gx===tx && me.gy===ty){ arrive(); return true; }
  { const occ=llamaTiles(); if (occ.has(ty*N+tx) && !seatAt(tx,ty)){ let best=null, bd=1e9;   // someone's standing there: stop right next to them instead
      for (let r=1;r<=3 && !best;r++) for (let dx=-r;dx<=r;dx++) for (let dy=-r;dy<=r;dy++){ const x=tx+dx, y=ty+dy; if (Math.max(Math.abs(dx),Math.abs(dy))!==r || !walkable(x,y) || seatAt(x,y) || occ.has(y*N+x)) continue;
        const d=Math.hypot(dx,dy)*10+Math.hypot(x-me.gx,y-me.gy); if (d<bd){ bd=d; best=[x,y]; } }
      if (!best) return false; if (best[0]===me.gx && best[1]===me.gy){ arrive(); return true; } tx=best[0]; ty=best[1]; } }
  const p=findPath(me.gx,me.gy,tx,ty); if(!p||!p.length) return false; me.path=p; me.prog=0; startStep(); return true;
}
const onDance = () => DANCE.has(me.gy*N+me.gx);
function arrive(){
  if (me.act && !arcade.on) me.act=null;
  if (me.bar){ me.p='bar'; me.d = Math.random()<0.5?'fr':'fl'; me.barT = 2.6+Math.random()*2.8; sendPresence(true); if (!me.barOn){ me.barOn=true; me.shift=0; setTimeout(()=>NET.act('bar_tick'), 400); } return; }
  if (me.cash){ me.p='wipe'; me.d='fl'; me.cashT=4+Math.random()*4; sendPresence(true); if (!me.cashOn){ me.cashOn=true; me.shift=0; setTimeout(()=>NET.act('shop_tick'), 400); } return; }
  if (me.after){ const af=me.after; me.after=null; if (af[0]!==me.gx||af[1]!==me.gy){ if (walkTo(af[0],af[1],af[2])) return; } else if (af[2]){ me.p='stand'; sendPresence(true); doAction(af[2]); return; } }
  let s=seatAt(me.gx,me.gy); if (s && seatTaken(s.gx,s.gy)){ s=null; localMsg("Someone's already sitting there."); }
  if (s){ me.p='sit'; me.d=s.dir; if (isSlotSeat(s.gx,s.gy)) setTimeout(openSlots, 150); else if (seatIn(ROUL_SEATS,s.gx,s.gy)) setTimeout(()=>openTable('roul'),150); else if (seatIn(BJ_SEATS,s.gx,s.gy)) setTimeout(()=>openTable('bj'),150); }
  else { me.p = onDance() ? 'dance' : 'stand'; me.d = 'f'+me.d[1]; }   // turn to face the screen
  const pend=me.pending; me.pending=null;
  sendPresence(true);
  if (pend) doAction(pend);
}
const seatTaken=(x,y)=>[...others.values()].some(o=>!o.leaving && sameRoom(o) && o.p==='sit' && Math.floor(o.x)===x && Math.floor(o.y)===y);
function toggleSit(){ if(me.moving||!joined) return; const s=seatAt(me.gx,me.gy); if (s && me.p!=='sit' && seatTaken(s.gx,s.gy)){ localMsg("Someone's already sitting there."); return; } if(me.p==='sit'){ me.p=onDance()?'dance':'stand'; if(!s) me.d='f'+me.d[1]; } else { me.p='sit'; if(s) me.d=s.dir; else me.d='f'+me.d[1]; } sendPresence(true); }
const keys = new Set();
function keyStep(){
  let dx=0, dy=0;
  if (keys.has('up')){ dx-=1; dy-=1; } if (keys.has('down')){ dx+=1; dy+=1; }
  if (keys.has('left')){ dx-=1; dy+=1; } if (keys.has('right')){ dx+=1; dy-=1; }
  dx=Math.sign(dx); dy=Math.sign(dy); if(!dx&&!dy) return false;
  const occ=llamaTiles(); const tryStep=(a,b)=>{ const nx=me.gx+a, ny=me.gy+b; if(!walkable(nx,ny) || occ.has(ny*N+nx)) return false; if(a&&b&&(!walkable(me.gx+a,me.gy)||!walkable(me.gx,me.gy+b))) return false; me.path=[[nx,ny]]; me.prog=0; startStep(); return true; };
  if (tryStep(dx,dy) || (dx&&dy&&(tryStep(dx,0)||tryStep(0,dy)))) return true;
  const nd = dirFrom(dx,dy,me.d); if (nd!==me.d && me.p!=='sit'){ me.d=nd; sendPresence(); }
  return false;
}
function updateMe(dt){
  if (me.cash && me.p==='wipe'){ me.shift=(me.shift||0)+dt; if (me.shift>=TOKENS.BAR_EVERY){ me.shift=0; NET.act('shop_tick').then(r=>{ if (r.ok && Number.isFinite(r.tk)) tkSet(r.tk, '+1 TOKEN! Penny says thanks for the help!'); }); }
    me.cashT-=dt; if (me.cashT<=0 && !me.moving){ const fromRight = me.gx===CASH_SPOTS[0][0]; me.path = fromRight ? [[9,0],[8,0],[7,0],[7,1]] : [[7,0],[8,0],[9,0],[9,1]]; me.prog=0; startStep(); } }   // wipe one end, then walk round behind Penny to the other
  if (me.bar && me.p==='bar'){ me.shift=(me.shift||0)+dt; if (me.shift>=TOKENS.BAR_EVERY){ me.shift=0; NET.act('bar_tick').then(r=>{ if (r.ok && Number.isFinite(r.tk)) tkSet(r.tk, '+1 TOKEN! Tips from working the bar!'); }); } }
  if (me.moving){
    me.anim+=dt; me.prog+=dt/(me.stepT||STEP);
    if (me.prog>=1){
      const leftover=(me.prog-1)*(me.stepT||STEP);
      me.gx=me.to[0]; me.gy=me.to[1]; me.path.shift();
      if (!me.path.length && keys.size && !uiOpen()){ if(!keyStep()){ me.moving=false; } else me.prog=0; }
      else if (me.path.length){ startStep(); me.prog=Math.min(0.5, leftover/me.stepT); }
      else { me.moving=false; }
      if (!me.moving){ me.prog=0; me.anim=0; me.x=me.gx+0.5; me.y=me.gy+0.5; arrive(); }
    }
    if (me.moving){ me.x = me.from[0]+0.5+(me.to[0]-me.from[0])*me.prog; me.y = me.from[1]+0.5+(me.to[1]-me.from[1])*me.prog; }
  } else if (me.bar){
    me.barT -= dt;
    if (me.barT>0.6 && !barSpotOK(me.gx, barBusy())) me.barT=0.6;   // someone stepped in next to us: shuffle over shortly
    if (me.barT<=0){ const tx=pickBarSpot(); if (tx===null){ me.barT=0.8; } else { const st=tx>me.gx?1:-1; me.path=[]; for(let x=me.gx+st; x!==tx+st; x+=st) me.path.push([x,0]); me.prog=0; startStep(); } }
  } else if (keys.size && !uiOpen() && !arcade.on) keyStep();
  if (me.p==='dance') me.anim+=dt;
  const now=performance.now();
  if (bubbleGone(me.bubble)) me.bubble=null;
  if (me.emote && now>me.emote.until) me.emote=null;
  updateALabel();
}

// ======================= ACTIONS =======================
function near(tx,ty){ return !me.moving && Math.max(Math.abs(me.gx-tx),Math.abs(me.gy-ty))<=1; }
function context(){
  if (!joined || arcade.on) return null;
  if (me.bar) return 'unbar';
  if (curRoom==='barn'){
    if (me.fish) return 'reel';
    if (me.p!=='sit' && inDunkZone()) return 'dunk';
    if (me.p!=='sit' && pondNear()) return 'fish';
    if (me.p!=='sit' && readyCropNear()) return 'harvest';
    { const k=standNear(); if (k) return k==='cider'?'fw':'snack'; }
    if (me.h) return DRINKS[me.h].food ? 'bite' : 'sip';
    return me.p==='sit' ? 'stand' : 'sit';
  }
  if (curRoom==='arena') return me.h ? (DRINKS[me.h].food ? 'bite' : 'sip') : 'arena';
  if (curRoom==='lanes') return me.h ? (DRINKS[me.h].food ? 'bite' : 'sip') : 'bowl';
  if (curRoom==='gym'){ if (me.p==='sit') return 'stand'; if (me.h) return DRINKS[me.h].food ? 'bite' : 'sip'; return 'box'; }
  if (curRoom==='cove' || curRoom==='jungle') return me.h ? (DRINKS[me.h].food ? 'bite' : 'sip') : 'dig';
  if (isP(curRoom)){ if (plotNear() && !PRED.on) return 'plot'; if (pvNear() && !PRED.on) return 'pvend'; if (me.h) return DRINKS[me.h].food ? 'bite' : 'sip'; return me.p==='sit' ? 'stand' : 'sit'; }
  if (curRoom==='store'){
    if (me.cash) return 'unhelp';
    if (me.p!=='sit' && !me.moving && me.gx===CASH_DOOR[0] && me.gy===CASH_DOOR[1]) return 'help';
    if (me.p!=='sit' && STORE_COUNTER.some(([x,y])=>near(x,y))) return 'shop';
    if (standNear()==='vend') return 'vend';
    if (standNear()==='svend') return 'svend';
    if (me.p!=='sit' && (STORE_RACKS.some(([x,y])=>near(x,y)) || STORE_CASE.some(([x,y])=>near(x,y)))) return 'clothes';
    if (me.h) return DRINKS[me.h].food ? 'bite' : 'sip';
    return me.p==='sit' ? 'stand' : 'sit'; }
  if (curRoom==='casino'){
    if (me.p==='sit' && isSlotSeat(me.gx,me.gy)) return 'spin';
    if (me.p==='sit' && seatIn(ROUL_SEATS,me.gx,me.gy)) return 'roul';
    if (me.p==='sit' && seatIn(BJ_SEATS,me.gx,me.gy)) return 'bj';
    if (me.h) return DRINKS[me.h].food ? 'bite' : 'sip';
    return me.p==='sit' ? 'stand' : 'sit';
  }
  if (me.p!=='sit' && onDance()) return 'flip';
  if (me.p!=='sit' && near(ARC_X,0)) return 'arcade';
  if (me.p!=='sit' && near(JUKE_X,0)) return 'juke';
  if (near(0,6)) return 'lamp';
  const s = (me.p==='sit') ? seatAt(me.gx,me.gy) : null;
  if (s && s.gy===2 && s.gx<=6) return 'grab';
  if (me.p==='sit' && nearTable()>=0) return 'tmenu'+nearTable();
  if (me.h) return DRINKS[me.h].food ? 'bite' : 'sip';
  return me.p==='sit' ? 'stand' : 'sit';
}
const ALABEL = {help:'HELP', unhelp:'LEAVE', pvend:'BUY', vend:'DRINKS', svend:'SNACKS', clothes:'CLOTHES', shop:'SHOP', dunk:'THROW',  arena:'PLAY', bowl:'BOWL', box:'BOX', dig:'DIG', fish:'FISH', reel:'STOP', spin:'SPIN', harvest:'HARVEST', fw:'CIDER', snack:'SNACKS', eat:'EAT', bite:'EAT', goBarn:'OUTSIDE', goLounge:'INSIDE', goLoungeC:'LOUNGE', goCasino:'CASINO', roul:'BET', bj:'CARDS', unbar:'LEAVE', bartend:'BAR', flip:'FLIP', tmenu0:'GAMES', tmenu1:'GAMES', lamp:'LAMP', arcade:'PLAY', juke:'MUSIC', order:'ORDER', grab:'GRAB', sip:'SIP', sit:'SIT', stand:'STAND'};
const alabel=document.getElementById('alabel'); let lastLabel='';
function updateALabel(){ const c=context(); const l = arcade.on ? (arcade.mode==='menu'?'SELECT':arcade.over?'RETRY':arcade.mode==='dash'?'JUMP':'---') : (c ? (c==='plot' ? plotLabel() : ALABEL[c]) : 'SIT'); if(l!==lastLabel){ alabel.textContent=l; lastLabel=l; } }
// ---- bartending: slip past the rope, pace behind the bar pouring drinks ----
const BAR_MAX=2;
const sameRoom = o => (o.rm||'lounge')===curRoom;
const otherBartenders = () => [...others.values()].filter(o=>!o.leaving && o.p==='bar' && sameRoom(o));
// tiles other bartenders are on or heading to: keep at least one empty tile between llamas so they never overlap
function barBusy(){ const occ=[]; for (const o of otherBartenders()){ occ.push(Math.floor(o.x)); occ.push(Math.floor(o.tx)); } return occ; }
function barSpotOK(x, occ){ return occ.every(q=>Math.abs(q-x)>=2); }
function pickBarSpot(){ const occ=barBusy(); const opts=[];
  for (let x=0;x<=6;x++){ if (x===me.gx || !barSpotOK(x,occ)) continue; const lo=Math.min(x,me.gx), hi=Math.max(x,me.gx); if (occ.some(q=>q>=lo&&q<=hi)) continue; opts.push(x); }
  return opts.length ? opts[Math.floor(Math.random()*opts.length)] : null; }
// gate: swings open while a llama passes the rope, then hooks closed again
let ropeK=0, ropeHold=0;
function updateRope(dt){
  const passing = (l, walking) => walking && l.y<1.7 && l.x>6.2 && l.x<8.2;
  let want = joined && passing(me, me.moving);
  for (const o of others.values()) if (passing(o, o.walking)) want=true;
  if (want) ropeHold=0.45; else ropeHold=Math.max(0, ropeHold-dt);
  const target = ropeHold>0 ? 1 : 0; ropeK += Math.sign(target-ropeK)*Math.min(Math.abs(target-ropeK), dt*(target?5:3));
}
function enterBar(){ if (otherBartenders().length>=BAR_MAX){ localMsg('The bar is full! Two llamas are already pouring.'); return; } me.bar=true; me.shift=0; me.h=null; me.path=[[7,0],[6,0]]; me.prog=0; startStep(); action('is working the bar!'); localMsg(`You earn 1 TOKEN in tips every ${TOKENS.BAR_EVERY} seconds back here.`); }
function leaveBar(tx,ty,pending){
  me.bar=false; if (me.barOn){ me.barOn=false; NET.act('bar_off'); } const from = me.moving ? me.to : [me.gx,me.gy];
  const out=[]; for (let x=from[0]+1; x<=7; x++) out.push([x,0]); out.push([7,1]);
  me.after = (tx===7&&ty===1&&!pending) ? null : [tx,ty,pending||null]; me.pending=null;
  if (me.moving){ me.path=[me.path[0], ...out]; me.p='stand'; }
  else { me.path=out; me.prog=0; startStep(); }
}
// ---- helping the LLAMA STORE cashier: in at the end of the counter, wipe it down from behind, never on PENNY's tile ----
// PENNY stands at (8,1). The tiles that really sit behind the counter on screen are (9,1) (behind its right half) and (7,1) (behind its left end).
// The helper wipes at one, then walks around behind Penny (row 0) to the other, never through her. CASH_LOOP is that route, from the door in.
const CASH_SPOTS=[[9,1],[7,1]], CASH_DOOR=[11,1], CASH_LOOP=[[11,1],[10,1],[9,1],[9,0],[8,0],[7,0],[7,1]];
const otherHelpers = () => [...others.values()].filter(o=>!o.leaving && o.p==='wipe' && sameRoom(o));
function cashClick(){ if (curRoom!=='store') return; if (me.cash){ leaveCash(CASH_DOOR[0],CASH_DOOR[1],null); return; }
  if (otherHelpers().length){ localMsg("Someone's already helping Penny. Try again in a bit."); return; }
  if (me.gx===CASH_DOOR[0] && me.gy===CASH_DOOR[1] && !me.moving) enterCash(); else walkTo(CASH_DOOR[0],CASH_DOOR[1],'help'); }
function enterCash(){ if (otherHelpers().length){ localMsg("Someone's already helping Penny. Try again in a bit."); return; } if (me.p==='sit') me.p='stand';
  me.cash=true; me.shift=0; me.h=null; me.path=[[10,1],[9,1]]; me.prog=0; startStep(); action('is helping at the counter!');
  localMsg(`You're wiping down the counter for Penny. You earn 1 TOKEN every ${TOKENS.BAR_EVERY} seconds back here. Tap the floor to stop.`); }
function leaveCash(tx,ty,pending){
  me.cash=false; if (me.cashOn){ me.cashOn=false; NET.act('shop_off'); } const from = me.moving ? me.to : [me.gx,me.gy];
  // step out the nearer way along the loop: back past the register to the door, or out at the counter's left end
  let i=CASH_LOOP.findIndex(([x,y])=>x===from[0]&&y===from[1]); if (i<0) i=2; const out = i<=3 ? CASH_LOOP.slice(0,i).reverse() : CASH_LOOP.slice(i+1);
  if (!out.length) out.push(i<=3 ? CASH_DOOR : CASH_LOOP[CASH_LOOP.length-1]);
  const end=out[out.length-1]; me.after = (tx===end[0]&&ty===end[1]&&!pending) ? null : [tx,ty,pending||null]; me.pending=null;
  if (me.moving){ me.path=[me.path[0], ...out]; me.p='stand'; } else { me.path=out; me.prog=0; startStep(); } }
// a cleaning rag swishing over the counter top in front of each helper (drawn after the counter so it sits on top)
const RAGS=[];
function drawRags(t){ for (const [x,y,walking] of RAGS){ if (walking) continue; const sw=Math.sin(t*7+x*3)*0.25, [cx,cy]=P(x+0.9+sw, y+0.9-sw, 20),   /* same screen column as the llama, on the counter top in front of it */ X=Math.round(cx), Y=Math.round(cy);
    g.fillStyle=INK; g.fillRect(X-5,Y-3,11,6); g.fillRect(X-4,Y-4,9,1); g.fillStyle='#5ab0e8'; g.fillRect(X-4,Y-2,9,4); g.fillStyle='#8ad0f8'; g.fillRect(X-4,Y-3,9,1); g.fillStyle='#d8f0ff'; g.fillRect(X-3,Y-2,3,1); g.fillStyle='#3a88c8'; g.fillRect(X-4,Y,9,1); g.fillRect(X-2,Y-2,1,3); g.fillRect(X+2,Y-2,1,3);   // folded cloth with stitching
    if (Math.sin(t*5+x)>0.85){ const sx2=X+(sw>0?-6:6), sy2=Y-2; g.fillStyle='#ffffff'; g.fillRect(sx2,sy2-1,1,3); g.fillRect(sx2-1,sy2,3,1); } }
  RAGS.length=0; }
function ropeClick(){ if (me.bar){ leaveBar(7,1,null); return; } if (otherBartenders().length>=BAR_MAX){ localMsg('The bar is full! Two llamas are already pouring.'); return; } if (near(7,0)) doAction('bartend'); else walkTo(7,1,'bartend'); }
function face(tx,ty){ me.d = dirFrom(tx-me.gx, ty-me.gy, me.d); }
function doAction(a){
  a = a || context(); if(!a) return;
  if (a==='travel'){ const r=me.travelTo; me.travelTo=null; if (r) switchRoom(r); return; }
  if (a==='goBarn'){ if (!me.moving) showSwap('barn'); return; }
  if (a==='roul'||a==='bj'){ openTable(a); return; }
  if (a==='arena'){ openArena(); return; }
  if (a==='bowl'){ openBowl(); return; }
  if (a==='box'){ openBox(); return; }
  if (a==='dig'){ coveDig(); return; }
  if (a==='shop'){ openCatalog(); return; }
  if (a==='leaveroom'){ prLeaveNow(); return; }
  if (a==='vend'){ openFw('vend'); return; }
  if (a==='svend'){ openFw('svend'); return; }
  if (a==='booth'){ openBooth(); return; }
  if (a==='acctdesk'){ openAccount(); return; }
  if (a==='plinko'){ openPlinko(); return; }
  if (a==='pvend'){ pvOpen(); return; }
  if (a==='plot'){ plotOpen(); return; }
  if (a==='clothes'){ const r=STORE_RACKS.find(([x,y])=>near(x,y)); openWardrobe('shop', r ? r[2] : STORE_CASE.some(([x,y])=>near(x,y)) ? 'shades' : null); return; }
  if (a==='dunk'){ openDunk(); return; }
  if (a==='goCasino'){ if (!me.moving) showSwap('casino'); return; }
  if (a==='goLoungeC'){ if (!me.moving) showSwap('lounge'); return; }
  if (a==='goLounge'){ if (!me.moving && near(14,0)) showSwap('lounge'); return; }
  if (a==='harvest'){ harvest(); return; }
  if (a==='fw'||a==='snack'){ const k=a==='fw'?'cider':'snack'; if (nearStand(STANDS[k])) openFw(k); return; }
  if (a==='eat'){ if (me.appleK) eatApple(me.appleK); return; }
  if (a==='fish'){ startFish(); return; }
  if (a==='reel'){ stopFish(); return; }
  if (a==='spin'){ if (slotEl.style.display==='block') slotSpin(); else openSlots(); return; }
  if (a==='bartend'){ if(me.bar||me.moving||!near(7,0)) return; enterBar(); return; }
  if (a==='unbar'){ if(me.bar) leaveBar(7,1,null); return; }
  if (a==='help'){ cashClick(); return; }
  if (a==='unhelp'){ if (me.cash) leaveCash(CASH_DOOR[0],CASH_DOOR[1],null); return; }
  if (a==='arcade'){ if(!near(ARC_X,0)) return; face(ARC_X,0); sendPresence(true); startArcade(); }
  else if (a==='tmenu0'||a==='tmenu1'){ openTableMenu(+a.slice(5)); }
  else if (a==='flip'){ if(!onDance()||me.moving||me.p==='sit') return; const now=performance.now(); if(now-(me.flipStart||-9999)<FLIP_T) return; me.flipStart=now; me.flK=(me.flK||0)+1; sendPresence(true); }
  else if (a==='lamp'){ if(!near(0,6)) return; if(me.p!=='sit') face(0,6); toggleLamp(); }
  else if (a==='juke'){ if(!near(JUKE_X,0)) return; face(JUKE_X,0); nextSong(); sendPresence(true); }
  else if (a==='order'){ const id = BAR_IDS[Math.floor(Math.random()*BAR_IDS.length)]; me.h=id; localMsg(`You ordered a ${DRINKS[id].label}!`); sendPresence(true); }
  else if (a==='grab'){ const st=(me.p==='sit')?seatAt(me.gx,me.gy):null; if(!st||st.gy!==2) return; openFw('bar'); }
  else if (a==='sip'||a==='bite'){ if(!me.h) return; const now=performance.now(); if (now-me.sipStart<SIP_T) return; me.sipStart=now; me.sipK=(me.sipK+1)%10000;
    setTimeout(()=>{ if(!me.h) return; NET.act('sip').then(r=>{ if (r && r.nd) ndSet(r.nd); }); me.hl=Math.max(0,(me.hl||SIPS)-1); if(me.hl===0){ localMsg(DRINKS[me.h].food ? `Yum! You ate the whole ${DRINKS[me.h].label}.` : `You finished your ${DRINKS[me.h].label}!`); me.h=null; } sendPresence(true); }, SIP_T);
    sendPresence(true); }
  else if (a==='sit'||a==='stand') toggleSit();
}
function emote(type){ if(!joined) return; me.emK=(me.emK+1)%10000; me.emote={t:type, until:performance.now()+3000}; me.lastEm={k:me.emK,t:type}; sendPresence(true); }

// ======================= MUSIC (shared jukebox) =======================
const juke = { s: 0, ts: 0 };
const lamp = { on: true, ts: 0 };
const lampOn = () => lamp.on;
function toggleLamp(){ lamp.on=!lamp.on; lamp.ts=Date.now(); sendPresence(true); }
const jukeOn = () => juke.s>=0 && juke.s<SONGS.length;
// volumes 0-100, saved on this device. Older saves that turned music off start at 0.
let mvol = Number.isFinite(+store.mvol) ? Math.max(0,Math.min(100,+store.mvol)) : (store.music===false ? 0 : 60);
let svol = Number.isFinite(+store.svol) ? Math.max(0,Math.min(100,+store.svol)) : 80;
let musicOn = mvol > 0;
function nextSong(){ juke.s = juke.s>=SONGS.length-1 ? -1 : juke.s+1; juke.ts = Date.now(); songChanged(true); }
function songChanged(mine, who){ restartSong(); if (jukeOn()) localMsg(`${mine?'You':who} played ♪ ${SONGS[juke.s]}!`); else localMsg(`${mine?'You':who} turned the jukebox off.`); }
let actx=null, master=null, sfxBus=null, noiseBuf=null, nextTime=0, stepIdx=0;
function ensureAudio(){
  try {
    if (!actx){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return; actx=new AC(); master=actx.createGain(); master.connect(actx.destination); sfxBus=actx.createGain(); sfxBus.connect(actx.destination); applyVolumes();
      noiseBuf=actx.createBuffer(1, actx.sampleRate*0.1, actx.sampleRate); const d=noiseBuf.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=Math.random()*2-1; }
    if (actx.state==='suspended') actx.resume().catch(()=>{});
  } catch(e){}
}
const SONG_DATA = [
  { bpm:100, lead:[72,0,76,0,79,0,76,74, 72,0,0,69,71,0,72,0, 74,0,77,0,81,0,79,77, 76,0,74,0,72,0,0,0],
    bass:[48,0,0,48,55,0,0,55, 45,0,0,45,52,0,0,52, 50,0,0,50,57,0,0,57, 43,0,0,43,47,0,50,0], kick:[0,8,16,24], hat:2 },
  { bpm:132, lead:[76,79,84,79,76,0,74,76, 77,81,86,81,77,0,76,74, 72,76,79,76,72,0,71,72, 74,0,79,0,74,72,71,0],
    bass:[48,0,48,0,53,0,53,0, 50,0,50,0,55,0,55,0, 45,0,45,0,53,0,53,0, 55,0,55,0,43,0,47,0], kick:[0,4,8,12,16,20,24,28], hat:2 },
  { bpm:112, lead:[69,0,72,74,0,76,0,74, 72,0,69,0,67,69,0,0, 69,0,72,74,0,79,0,76, 74,0,72,0,71,72,69,0],
    bass:[45,0,45,57,0,45,55,0, 43,0,43,55,0,43,53,0, 41,0,41,53,0,41,52,0, 40,0,40,52,0,47,52,0], kick:[0,6,8,14,16,22,24,30], hat:1 },
];
const mtof = m => 440*Math.pow(2,(m-69)/12);
// master = music bus, sfxBus = sound effects. Curves feel even across the slider.
function applyVolumes(){ if (!actx) return; const m=(mvol/100)**2*0.07, f=(svol/100)**2*0.12; master.gain.setTargetAtTime(m, actx.currentTime, 0.03); sfxBus.gain.setTargetAtTime(f, actx.currentTime, 0.03); }
function tone(type,freq,t,dur,vol,bus){ const o=actx.createOscillator(), gn=actx.createGain(); o.type=type; o.frequency.value=freq; gn.gain.setValueAtTime(vol,t); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(gn); gn.connect(bus||master); o.start(t); o.stop(t+dur+0.02); }
function noise(t,dur,vol,hp,bus){ const s=actx.createBufferSource(); s.buffer=noiseBuf; const f=actx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; const gn=actx.createGain(); gn.gain.setValueAtTime(vol,t); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur); s.connect(f); f.connect(gn); gn.connect(bus||master); s.start(t); s.stop(t+dur+0.02); }
// ---- sound effects (made in code, nothing recorded) ----
function sfxReady(){ ensureAudio(); return actx && actx.state==='running' && svol>0; }
function wetNoise(t, dur, vol, type, f0, f1, q){ const s=actx.createBufferSource(); s.buffer=noiseBuf; const f=actx.createBiquadFilter(); f.type=type; f.Q.value=q||1;
  f.frequency.setValueAtTime(f0,t); f.frequency.exponentialRampToValueAtTime(f1,t+dur); const gn=actx.createGain(); gn.gain.setValueAtTime(0.0001,t); gn.gain.exponentialRampToValueAtTime(vol,t+0.012); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur);
  s.connect(f); f.connect(gn); gn.connect(sfxBus); s.start(t); s.stop(t+dur+0.02); }
function pop(t, f0, f1, dur, vol){ const o=actx.createOscillator(), gn=actx.createGain(); o.type='sine'; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(f1,t+dur);
  gn.gain.setValueAtTime(vol,t); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(gn); gn.connect(sfxBus); o.start(t); o.stop(t+dur+0.02); }
// "ptoo": a lip pop and a wet hiss. scale is 1 for your own spit and quieter for other llamas.
function sfxSpit(scale){ try { if (!sfxReady()) return; const t=actx.currentTime+0.01, v=scale;
  pop(t, 420, 140, 0.07, 0.9*v); wetNoise(t+0.015, 0.16, 0.8*v, 'bandpass', 3200, 900, 1.4); wetNoise(t+0.03, 0.1, 0.35*v, 'highpass', 5000, 3000); } catch(e){} }
// the splat when it lands
function sfxSplat(scale){ try { if (!sfxReady()) return; const t=actx.currentTime+0.005, v=scale;
  wetNoise(t, 0.2, 0.9*v, 'lowpass', 1600, 300, 0.8); pop(t, 200, 70, 0.12, 0.6*v); wetNoise(t+0.04, 0.12, 0.3*v, 'bandpass', 2400, 1200, 2); } catch(e){} }
function restartSong(){ if(actx){ nextTime=actx.currentTime+0.08; stepIdx=0; } }
function scheduleMusic(){
  if (!actx || !musicOn || !jukeOn() || !joined || actx.state!=='running') return;
  const sd=SONG_DATA[juke.s]; const st=60/sd.bpm/4;
  if (nextTime < actx.currentTime-0.2) nextTime = actx.currentTime+0.05;
  while (nextTime < actx.currentTime+0.25){
    const i=stepIdx%32;
    if (sd.lead[i]) tone('square', mtof(sd.lead[i]), nextTime, st*1.8, 0.5);
    if (sd.bass[i]) tone('triangle', mtof(sd.bass[i]), nextTime, st*2.2, 0.9);
    if (sd.kick.includes(i)) { const o=actx.createOscillator(), gn=actx.createGain(); o.frequency.setValueAtTime(150,nextTime); o.frequency.exponentialRampToValueAtTime(40,nextTime+0.12); gn.gain.setValueAtTime(0.7,nextTime); gn.gain.exponentialRampToValueAtTime(0.0001,nextTime+0.14); o.connect(gn); gn.connect(master); o.start(nextTime); o.stop(nextTime+0.16); }
    if (i%sd.hat===0) noise(nextTime, 0.03, i%4===0 ? 0.07 : 0.04, 8500);
    nextTime += st; stepIdx++;
  }
}
const musicbtn=document.getElementById('musicbtn');
const sndEl=document.getElementById('sndbox'), mvolEl=document.getElementById('mvol'), svolEl=document.getElementById('svol');
function sndUI(){ mvolEl.value=mvol; svolEl.value=svol; document.getElementById('mvol_n').textContent=mvol+'%'; document.getElementById('svol_n').textContent=svol+'%';
  mvolEl.style.setProperty('--f', mvol+'%'); svolEl.style.setProperty('--f', svol+'%');
  musicbtn.classList.toggle('off', mvol===0); musicbtn.title = mvol ? 'Sound' : 'Music off'; document.getElementById('mmute').textContent = mvol ? 'MUTE MUSIC' : 'MUSIC ON'; }
function setMvol(v, save){ const was=musicOn; mvol=Math.round(v); musicOn=mvol>0; store.mvol=mvol; store.music=musicOn; if (save) saveStore(); applyVolumes(); sndUI(); if (musicOn && !was){ ensureAudio(); restartSong(); } }
function setSvol(v, save){ svol=Math.round(v); store.svol=svol; if (save) saveStore(); applyVolumes(); sndUI(); }
function setMusic(on){ setMvol(on ? (store.mlast||60) : 0, true); }
musicbtn.addEventListener('click', ()=>{ ensureAudio(); if (sndEl.style.display==='block'){ sndEl.style.display='none'; return; } closeAll(); sndUI(); sndEl.style.display='block'; });
mvolEl.addEventListener('input', ()=>{ ensureAudio(); setMvol(+mvolEl.value, false); });
mvolEl.addEventListener('change', ()=>{ if (mvol) store.mlast=mvol; saveStore(); });
svolEl.addEventListener('input', ()=>{ ensureAudio(); setSvol(+svolEl.value, false); });
svolEl.addEventListener('change', ()=>{ saveStore(); sfxSpit(1); });
document.getElementById('mmute').addEventListener('click', ()=>{ ensureAudio(); if (mvol){ store.mlast=mvol; setMvol(0,true); } else setMvol(store.mlast||60, true); });
document.getElementById('snd_close').addEventListener('click', ()=>{ sndEl.style.display='none'; });
sndUI();

// ======================= ARCADE (game selector + 2 games) =======================
const GAMES = [ {id:'hay', name:'HAY CATCH', blurb:'CATCH HAY, DODGE POOP'}, {id:'dash', name:'LLAMA DASH', blurb:'JUMP THE FENCES'} ];
const best = { hay: +store.bestHay || +store.best || 0, dash: +store.bestDash || 0 };
const arcade = { on:false, mode:'menu', sel:0, over:false, t:0, ready:0, ptr:null, newBest:false,
  // hay
  score:0, lives:3, x:-1, items:[], spawn:0, combo:0, pops:[], parts:[], hit:0, shake:0, dirX:0, catchFx:0,
  // dash
  dist:0, y:0, vy:0, obs:[], nextObs:0, speed:0, jumpHeld:false, scroll:0, coins:0 };
const exitbtn=document.getElementById('exitbtn');
// the arcade has an X in its header like every other pop-up (the old EXIT button in the top bar is gone)
const arcX=document.getElementById('arcx');
function startArcade(){ closeAll(); arcade.on=true; arcade.mode='menu'; arcade.over=false; exitbtn.style.display='none'; arcX.style.display='flex'; sendPresence(true); }
function exitArcade(){ arcade.on=false; arcade.ptr=null; exitbtn.style.display='none'; arcX.style.display='none'; sendPresence(true); }
arcX.addEventListener('click', e=>{ e.stopPropagation(); exitArcade(); }); arcX.addEventListener('pointerdown', e=>e.stopPropagation());
// menu rows: one place for drawing, text and taps
const ARC_ROW=(B,i)=>({ y:B.y+54+i*34, h:i<GAMES.length?28:20 });
const AF=(px,w)=>`${w||600} ${px}px PixFix, 'Pixelify Sans', monospace`;
exitbtn.addEventListener('click', exitArcade);
function arcadeBox(){ const w=Math.min(LW-12, 230), h=Math.min(LH-UIB-48, 190); return {x:Math.round((LW-w)/2), y:Math.round(Math.max(40, (LH-UIB-h)/2+6)), w, h}; }
function startGame(id){ arcade.t0=performance.now();
  Object.assign(arcade,{mode:id, over:false, t:0, ready:1.4, newBest:false, pops:[], parts:[], shake:0});
  if (id==='hay') Object.assign(arcade,{score:0, lives:3, x:-1, items:[], spawn:0.4, combo:0, hit:0, catchFx:0});
  if (id==='dash') Object.assign(arcade,{dist:0, y:0, vy:0, obs:[], nextObs:1.2, speed:95, scroll:0, coins:0, score:0});
}
function arcadeMenu(){ arcade.mode='menu'; arcade.over=false; }
function arcadeOver(){
  arcade.over=true; arcade.shake=0.35;
  const id=arcade.mode, sc=arcade.score;
  me.gK=(me.gK||0)+1; me.lastScore={k:me.gK, id, v:sc}; reportScore(id, me.n||'YOU', sc); sendPresence(true);
  if (sc>best[id]){ best[id]=sc; arcade.newBest=true; store[id==='hay'?'bestHay':'bestDash']=sc; saveStore(); acctSave(); }
  arcade.earned=0; NET.act('arcade',{game:id, score:sc, ms:Math.round(performance.now()-(arcade.t0||performance.now()))}).then(r=>{ if (!r.ok) return; arcade.earned=r.earned; arcade.newBest=r.best; if (r.earned) tkSet(r.tk, r.best ? `+${r.earned} TOKENS! Arcade milestones + new best!` : `+${r.earned} TOKENS! Arcade milestones!`); });
  if (id==='hay' && sc>=5) action(`scored ${sc} at HAY CATCH!`);
  if (id==='dash' && sc>=30) action(`ran ${sc}m in LLAMA DASH!`);
}
function pop(x,y,text,col){ arcade.pops.push({x,y,text,col,t:0}); }
function burst(x,y,col,n){ for(let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=30+Math.random()*50; arcade.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-30,t:0,col,sz:Math.random()<0.35?1:2}); } }
// little dust puffs (dash): drift back and up, light gravity
function dust(x,y,n,spd){ for(let i=0;i<n;i++) arcade.parts.push({x:x+Math.random()*3,y:y-Math.random()*2,vx:-(spd||40)*(0.3+Math.random()*0.4),vy:-10-Math.random()*22,t:0,col:Math.random()<0.5?'#e8c890':'#d0a868',sz:Math.random()<0.5?1:2,life:0.45}); }
function dashJump(){ if (arcade.mode!=='dash'||arcade.over||arcade.ready>0) return; if (arcade.y<=0.01){ arcade.vy=175; arcade.jumpHeld=true; } }
function arcadePressA(){
  if (arcade.mode==='menu'){ if (arcade.sel>=GAMES.length) exitArcade(); else startGame(GAMES[arcade.sel].id); return; }
  if (arcade.over){ startGame(arcade.mode); return; }
  if (arcade.mode==='dash') dashJump();
}
function arcadeBack(){ if (arcade.mode!=='menu') arcadeMenu(); else exitArcade(); }
function arcadeNav(k){ if (arcade.mode!=='menu') return false; const n=GAMES.length+1; if(k==='up') arcade.sel=(arcade.sel+n-1)%n; if(k==='down') arcade.sel=(arcade.sel+1)%n; return true; }
function arcadePointer(lx,ly){
  const B=arcadeBox();
  if (arcade.mode==='menu'){ for (let i=0;i<=GAMES.length;i++){ const r=ARC_ROW(B,i); if (ly>=r.y-2 && ly<r.y+r.h+2 && lx>=B.x+12 && lx<=B.x+B.w-12){ arcade.sel=i; arcadePressA(); return; } } return; }
  if (arcade.over){ startGame(arcade.mode); return; }
  if (arcade.mode==='dash'){ dashJump(); return; }
  arcade.ptr=lx;
}

function updateArcade(dt){
  if (!arcade.on) return;
  arcade.t+=dt; if (arcade.shake>0) arcade.shake-=dt;
  for (const p of arcade.pops) p.t+=dt; arcade.pops=arcade.pops.filter(p=>p.t<0.9);
  for (const p of arcade.parts){ p.t+=dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.vy+=160*dt; } arcade.parts=arcade.parts.filter(p=>p.t<(p.life||0.7));
  if (arcade.mode==='menu' || arcade.over) return;
  if (arcade.ready>0){ arcade.ready-=dt; return; }
  const B=arcadeBox();
  if (arcade.mode==='hay'){
    const pw=28; if (arcade.x<0) arcade.x=(B.w-pw)/2;
    let dir=0; if(keys.has('left')) dir-=1; if(keys.has('right')) dir+=1;
    if (arcade.ptr!==null){ const target=arcade.ptr-B.x-pw/2; const d=target-arcade.x; dir = Math.abs(d)<3?0:Math.sign(d); }
    arcade.x=Math.max(0,Math.min(B.w-pw, arcade.x+dir*140*dt)); arcade.dirX=dir;
    const lvl=Math.min(1, arcade.t/75);
    arcade.spawn-=dt;
    if (arcade.spawn<=0){
      const r=Math.random();
      const type = (r<0.025 && arcade.lives<3) ? 'heart' : r<0.09 ? 'apple' : r<0.30+lvl*0.12 ? 'poop' : 'hay';
      arcade.items.push({type, x:6+Math.random()*(B.w-20), y:-10, v:(42+lvl*70)*(0.85+Math.random()*0.35), wob:Math.random()*6});
      if (Math.random()<lvl*0.35) arcade.items.push({type:'hay', x:6+Math.random()*(B.w-20), y:-24, v:42+lvl*60, wob:Math.random()*6});
      arcade.spawn = 0.85 - lvl*0.5;
    }
    const py=B.h-12-46;
    for (const it of arcade.items){ it.y+=it.v*dt;
      const cx=it.x+4;
      if (!it.done && it.y+6>=py+3 && it.y<=py+20 && cx>=arcade.x+3 && cx<=arcade.x+pw-3){ it.done=true;
        const sx=B.x+cx, sy=B.y+it.y;
        if (it.type==='poop'){ arcade.lives--; arcade.combo=0; arcade.hit=0.5; arcade.shake=0.3; burst(sx,sy,'#a8642e',10); pop(sx,sy,'OUCH','#f84848'); if(arcade.lives<=0) arcadeOver(); }
        else if (it.type==='heart'){ arcade.lives=Math.min(3,arcade.lives+1); burst(sx,sy,'#f84848',8); pop(sx,sy,'+LIFE','#f84848'); }
        else { arcade.combo++; const mult=Math.min(4,1+Math.floor(arcade.combo/5)); const pts=(it.type==='apple'?5:1)*mult; arcade.score+=pts; arcade.catchFx=0.15;
          burst(sx,sy,it.type==='apple'?'#f8c030':'#f8d030',it.type==='apple'?10:5); pop(sx,sy,'+'+pts+(mult>1?' x'+mult:''), it.type==='apple'?'#c08000':'#183070'); } }
      else if (!it.done && it.y>B.h-14){ it.done=true; if (it.type==='hay'||it.type==='apple'){ arcade.combo=0; } if (it.type==='poop') burst(B.x+cx,B.y+B.h-12,'#a8642e',4); }
    }
    arcade.items=arcade.items.filter(it=>!it.done);
    if (arcade.hit>0) arcade.hit-=dt; if (arcade.catchFx>0) arcade.catchFx-=dt;
  }
  if (arcade.mode==='dash'){
    arcade.speed = Math.min(230, 95 + arcade.t*4.2);
    const dx=arcade.speed*dt; arcade.scroll+=dx; arcade.dist+=dx; arcade.score=Math.floor(arcade.dist/10);
    const held = keys.has('up') || arcade.jumpHeld;
    const wasAir=arcade.y>0.5;
    arcade.vy -= (held && arcade.vy>0 ? 330 : 620)*dt; arcade.y += arcade.vy*dt; if (arcade.y<=0){ arcade.y=0; arcade.vy=0; }
    { const gy=B.y+B.h-14; if (wasAir && arcade.y<=0) dust(B.x+44, gy, 7, 70);   // landing puff
      if (arcade.y<=0){ arcade.dustT=(arcade.dustT||0)-dt; if (arcade.dustT<=0){ arcade.dustT=0.09; dust(B.x+42, gy, 1, arcade.speed); } } }
    arcade.nextObs-=dt;
    if (arcade.nextObs<=0){
      const r=Math.random(); const lvl=Math.min(1,arcade.t/60);
      let o;
      if (r<0.32) o={type:'fence', w:11, h:11}; else if (r<0.6) o={type:'bale', w:12, h:8}; else if (r<0.8) o={type:'cactus', w:7, h:16};
      else if (r<0.9 && lvl>0.3) o={type:'bird', w:12, h:7, fly:24}; else o={type:'apple', w:7, h:7, fly:28+Math.random()*10, coin:true};
      o.x=B.w+10; arcade.obs.push(o);
      if (!o.coin && Math.random()<lvl*0.25) arcade.obs.push({type:'bale', w:12, h:8, x:B.w+24});
      arcade.nextObs = Math.max(0.55, (1.25 - lvl*0.5) * (0.8+Math.random()*0.6));
    }
    const gx=36, ground=B.h-14; // llama feet x (box coords)
    for (const o of arcade.obs){ o.x-=dx;
      const ox0=o.x, ox1=o.x+o.w, oyTop = ground-(o.fly||0)-o.h, oyBot = ground-(o.fly||0);
      const lx0=gx+9, lx1=gx+19, lyTop=ground-arcade.y-34, lyBot=ground-arcade.y-1;
      if (!o.done && ox1>lx0 && ox0<lx1 && oyBot>lyTop && oyTop<lyBot){
        if (o.coin){ o.done=true; arcade.dist+=50; burst(B.x+o.x+3,B.y+oyTop+3,'#f8c030',8); pop(B.x+o.x,B.y+oyTop,'+5m','#c08000'); }
        else { burst(B.x+lx0+5, B.y+lyTop+10, '#f84848', 12); arcadeOver(); }
      }
    }
    arcade.obs=arcade.obs.filter(o=>!o.done && o.x>-20);
  }
}

const HEART=['.XX.XX.','XXXXXXX','XXXXXXX','.XXXXX.','..XXX..','...X...'];
function bmp(rows,x,y,col){ g.fillStyle=col; rows.forEach((r,j)=>{ for(let i=0;i<r.length;i++) if(r[i]==='X') g.fillRect(x+i,y+j,1,1); }); }
let arcadeText=null;
function drawArcade(t){
  if (!arcade.on) return;
  const B0=arcadeBox(); const sh = arcade.shake>0 ? Math.round((Math.random()*2-1)*2) : 0; const B={...B0, x:B0.x+sh, y:B0.y+(sh?Math.round(Math.random()*2-1):0)};
  g.fillStyle='rgba(16,12,28,0.65)'; g.fillRect(0,0,LW,LH);
  // cabinet frame
  // cabinet frame: ink outline, a yellow header band (title, icon and X go on top of it) and a blue bezel round the screen
  g.fillStyle='rgba(0,0,0,0.35)'; g.fillRect(B.x-3,B.y+B.h+5,B.w+10,3);
  g.fillStyle=INK; g.fillRect(B.x-5,B.y-25,B.w+10,B.h+30);
  g.fillStyle='#3858a8'; g.fillRect(B.x-4,B.y-24,B.w+8,B.h+28);
  g.fillStyle='#f8d030'; g.fillRect(B.x-4,B.y-24,B.w+8,20); g.fillStyle='#fce88a'; g.fillRect(B.x-4,B.y-24,B.w+8,1);
  g.fillStyle='#d8a818'; for (let i=0;i<B.w+8;i+=2) g.fillRect(B.x-4+i+((i/2)%2),B.y-6,1,1);   /* dithered shade along the bottom of the band */
  g.fillStyle=INK; g.fillRect(B.x-4,B.y-5,B.w+8,1); g.fillStyle='#5878c8'; g.fillRect(B.x-4,B.y-4,B.w+8,1);
  g.save(); g.beginPath(); g.rect(B.x,B.y,B.w,B.h); g.clip();
  if (arcade.mode==='menu') drawArcadeMenu(B,t);
  else if (arcade.mode==='hay') drawHay(B,t);
  else drawDash(B,t);
  for (const p of arcade.parts){ g.globalAlpha=Math.max(0,Math.min(1,(p.life||0.7)-p.t)*2.2); g.fillStyle=p.col; const sz=p.sz||2; g.fillRect(snp(p.x),snp(p.y),sz,sz); } g.globalAlpha=1;
  if (arcade.over || arcade.ready>0 && arcade.mode!=='menu'){ /* text drawn in overlay */ }
  if (arcade.over){ g.fillStyle=INK; g.fillRect(B.x+B.w/2-66, B.y+B.h/2-38, 132, 66); g.fillStyle='#f8f8f8'; g.fillRect(B.x+B.w/2-65, B.y+B.h/2-37, 130, 64); }
  g.restore();
  if (arcade.mode==='hay') for (let i=0;i<3;i++) bmp(HEART, B.x+B.w-50+i*9, B.y-18, i<arcade.lives?'#f84848':'#b07818');   /* left of the X */
  arcadeText = { B };
}
function drawArcadeMenu(B,t){
  g.fillStyle='#183070'; g.fillRect(B.x,B.y,B.w,B.h);
  for (let i=0;i<30;i++){ const sx=(i*53+Math.floor(t*10*(1+i%3)))%B.w, sy=(i*37)%B.h; g.fillStyle=i%4?'#3858a8':'#f8f8f8'; g.fillRect(B.x+sx,B.y+sy,1,1); }
  for (let i=0;i<=GAMES.length;i++){ const {y,h}=ARC_ROW(B,i), on=i===arcade.sel, x=B.x+14, w=B.w-28;
    g.fillStyle=INK; g.fillRect(x,y,w,h+2); g.fillRect(x-1,y+1,w+2,h);   /* ink outline with clipped corners and a 2px drop */
    g.fillStyle=on?'#f8d030':'#f8f8f8'; g.fillRect(x+1,y+1,w-2,h-2); g.fillStyle=on?'#fce88a':'#ffffff'; g.fillRect(x+1,y+1,w-2,1);
    if (on){ const ax=x+6, ay=y+Math.floor(h/2), bob=Math.floor(t*4)%2; g.fillStyle=INK; for (let k=0;k<4;k++) g.fillRect(ax+bob+k, ay-3+k, 1, 7-2*k); } }   /* little pixel arrow on the picked row */
  // little llama mascot
  const fr=Math.floor(t*6)%4; g.drawImage(sprite(me.c, Math.floor(t/1.2)%2?'fr':'fl', fr, 'stand'), B.x+B.w-40, B.y+6);
}
// ---- arcade art helpers (all in game pixels; snp() snaps moving things to real screen pixels so they glide smoothly) ----
function snp(v){ const k=S*DPR; return Math.round(v*k)/k; }
function spr(rows, x, y, pal, flipX){ for (let j=0;j<rows.length;j++){ const r=rows[j]; for (let i=0;i<r.length;i++){ const ch=r[i]; if (ch==='.') continue; g.fillStyle=pal[ch]; g.fillRect(x+(flipX?r.length-1-i:i), y+j, 1, 1); } } }
function arcSky(B, cols){ const n=cols.length, bh=B.h/n;
  for (let i=0;i<n;i++){ g.fillStyle=cols[i]; g.fillRect(B.x, B.y+Math.floor(i*bh), B.w, Math.ceil(bh)+1); }
}
function arcCloud(x,y,big){ const k=big?2:1; g.fillStyle='#cfe6f8'; g.fillRect(x+2*k,y+8*k,19*k,2*k);
  g.fillStyle='#ffffff'; for (const [a,b,c,d] of [[0,4,22,5],[3,1,8,5],[9,0,8,6],[15,2,6,4]]) g.fillRect(x+a*k,y+b*k,c*k,d*k); g.fillStyle='#f2f9ff'; g.fillRect(x+10*k,y+1*k,5*k,1*k); }
function arcSun(cx,cy,r,t){ const p=Math.sin(t*2)*0.6; ellPx(cx,cy,r+4+p,r+4+p,'rgba(255,244,190,0.35)'); ellPx(cx,cy,r+1.5,r+1.5,'rgba(255,240,170,0.6)'); ellPx(cx,cy,r,r,'#ffe066'); ellPx(cx-1.5,cy-1.5,r-2.5,r-2.5,'#fff3a8'); }
const ARC_PAL={k:INK, y:'#f8d030', Y:'#d09a18', h:'#fff1a0', t:'#b06a28', a:'#f8c030', A:'#d08818', w:'#fff7d0', g:'#48b048', G:'#2e8a34', b:'#a8642e', B:'#6e3c1a', c:'#c98a52', r:'#e84848', R:'#a82838', n:'#b07838', N:'#7a4a1e', m:'#d8a060', s:'#58b058', S:'#3a8a3c', l:'#8ad46a', f:'#f8f8f8', o:'#f8a030', e:'#30303a'};
const SP_BALE=['.kkkkkkkkkk.','khhhhhthhhhk','kyyyyytyyyyk','kyYyyytyyYyk','kyyyyytyyyyk','kyyYyytyYyyk','kYYYYYtYYYYk','.kkkkkkkkkk.'];
const SP_APPLE=['.....k...','....kgg..','..kkkGgk.','.kawaaaak','kawaaaaAk','kaaaaaaAk','kaaaaaAAk','.kaaaAAk.','..kkkkk..'];
const SP_POOP=['....kk....','...kbck...','..kbcbbk..','..kkkkkk..','.kbcbbbbk.','.kkkkkkkk.','kbcbbbbbBk','kbbbbbbBBk','.kkkkkkkk.'];
const SP_FENCE=['kk.......kk','kmk.....kmk','kmkkkkkkkmk','kmmmmmmmmmk','kNkkkkkkkNk','kmk.....kmk','kmkkkkkkkmk','kmmmmmmmmmk','kNkkkkkkkNk','kmk.....kmk','kNk.....kNk'];
const SP_CACTUS=['....kk.....','...ksSk....','...kssk....','.kkkssk.kk.','ksSkssSkssk','kssksskksSk','kssssssSssk','.kkksssskk.','...kssSk...','...kssSk...','...ksssk...','...kssSk...','...kssSk...','...ksssk...','...kssSk...','..kkkkkkk..'];
const SP_BIRD=[['....kkk.....','...kfffk....','.kkffffkkko.','kfffffffkoo.','.kkfffffk...','...kkkkk....'],['............','..kkkkk.....','.kffffffkko.','kfffffffkoo.','.kkfffffk...','..kfk.......']];
function groundShadow(cx,gy,w,a){ if (a<=0.02) return; g.fillStyle=`rgba(20,40,20,${Math.min(0.35,a)})`; g.fillRect(snp(cx-w/2+1),gy,w-2,1); g.fillRect(snp(cx-w/2),gy+1,w,1); }

function drawHay(B,t){
  arcSky(B, ['#7cc4f2','#8acbf4','#99d2f6','#a8d9f8','#b8e0f9','#c8e8fa']);
  arcSun(B.x+B.w-30, B.y+30, 8, t);
  for (let k=0;k<3;k++){ const cx=((t*(5+k*3)+k*95)%(B.w+60))-40; arcCloud(snp(B.x+cx), B.y+10+k*20, k===1); }
  const GY=B.y+B.h-12;
  // far hills with a little red barn, then near hills with a fence line
  for (let x=0;x<B.w;x++){ const h=Math.round(30+Math.sin((x+40)/31)*9+Math.sin(x/13)*3); g.fillStyle='#a6dca0'; g.fillRect(B.x+x,GY-h,1,h); }
  { const bx=B.x+28, by=GY-41; g.fillStyle=INK; g.fillRect(bx-1,by+3,18,12); g.fillStyle='#c83838'; g.fillRect(bx,by+4,16,10); g.fillStyle=INK; for (let i=0;i<9;i++) g.fillRect(bx-1+i,by+3-i/2|0,18-2*i,1);
    g.fillStyle='#8a2a2a'; for (let i=1;i<8;i++) g.fillRect(bx+i,by+3-(i/2|0)+1,16-2*i,1); g.fillStyle='#f8f8f8'; g.fillRect(bx+6,by+8,4,6); g.fillStyle='#c83838'; g.fillRect(bx+7,by+9,2,5); }
  for (let x=0;x<B.w;x++){ const h=Math.round(16+Math.sin((x+t*6)/24)*5+Math.sin(x/9)*2); g.fillStyle='#78c878'; g.fillRect(B.x+x,GY-h,1,h); g.fillStyle='#8ed88a'; g.fillRect(B.x+x,GY-h,1,1); }
  g.fillStyle='#b08048'; for (let x=6;x<B.w;x+=22){ g.fillRect(B.x+x,GY-10,2,8); } g.fillRect(B.x,GY-8,B.w,1); g.fillRect(B.x,GY-5,B.w,1);
  // ground: grass lip and dirt with pebbles (flashes red when you get hit)
  g.fillStyle='#58c858'; g.fillRect(B.x,GY,B.w,4); g.fillStyle='#86e07a'; g.fillRect(B.x,GY,B.w,1);
  g.fillStyle='#3e9e42'; for (let x=1;x<B.w;x+=5) g.fillRect(B.x+x,GY-1,1,2);
  g.fillStyle='#c08850'; g.fillRect(B.x,GY+4,B.w,8); g.fillStyle='#a06c38'; for (let x=3;x<B.w;x+=11){ g.fillRect(B.x+x,GY+6+(x%3),2,1); g.fillRect(B.x+x+5,GY+9,1,1); }
  if (arcade.hit>0){ g.fillStyle=`rgba(248,72,72,${Math.min(0.35,arcade.hit)})`; g.fillRect(B.x,B.y,B.w,B.h); }
  // shadows under falling things, then the things
  for (const it of arcade.items){ const d=Math.max(0,(it.y)/(B.h-12)); groundShadow(B.x+it.x+4, GY+1, 6+Math.round(d*4), d*0.35); }
  for (const it of arcade.items){ const x=snp(B.x+it.x+Math.sin(it.y/12+it.wob)*1.5), y=snp(B.y+it.y);
    if (it.type==='hay') spr(SP_BALE, x-2, y-1, ARC_PAL);
    else if (it.type==='apple'){ spr(SP_APPLE, x-1, y-2, ARC_PAL); if (Math.floor(t*6+it.wob)%3===0){ g.fillStyle='#fffbe0'; g.fillRect(x-3,y,1,1); g.fillRect(x+9,y+4,1,1); g.fillRect(x+3,y-5,1,1); } }
    else if (it.type==='heart'){ bmp(HEART,x,y,'#f84848'); }
    else { spr(SP_POOP, x-1, y-3, ARC_PAL); g.fillStyle='#14101a'; const fx=Math.sin(t*9+it.wob)*5; g.fillRect(snp(x+4+fx),y-6+Math.round(Math.cos(t*13)*1.5),1,1); }
  }
  // the llama: a shadow, a little squash when it catches, blinking when hit
  const fr = arcade.dirX ? Math.floor(t*8)%4 : 0, lx=snp(B.x+arcade.x);
  groundShadow(lx+14, GY+1, 16, 0.3);
  if (!(arcade.hit>0 && Math.floor(t*16)%2)){ const img=sprite(me.c, arcade.dirX<0?'fl':'fr', fr, 'stand'), sq=arcade.catchFx>0?2:0; g.drawImage(img, lx, GY-46+2+sq, img.width, img.height-sq); }
  drawPops();
}
function drawPops(){ /* text pops drawn in overlay */ }
function drawDash(B,t){
  const ground=B.y+B.h-14, sc=arcade.scroll;
  arcSky(B, ['#ff9e6b','#ffad78','#ffbd87','#ffcc99','#ffdbad','#ffe9c4']);
  // retro sun with stripes, slow clouds
  { const cx=B.x+B.w-50, cy=B.y+56; arcSun(cx,cy,15,t); g.fillStyle='#ffcc99'; for (let i=0;i<4;i++) g.fillRect(cx-16,cy+3+i*3,33,1+(i>>1)); }
  for (let k=0;k<2;k++){ const cx=(((B.w+60)-((sc*0.06+k*140)%(B.w+60)))-40); g.globalAlpha=0.85; arcCloud(snp(B.x+cx), B.y+16+k*16, false); g.globalAlpha=1; }
  // mountains: purple with snow caps and a shaded side
  const fo=sc*0.15, fi=Math.floor(fo), ff=fo-fi;
  for (let x=-1;x<=B.w;x++){ const s1=x+fi, ph=((s1/40)%2+2)%2, tri=Math.abs(ph-1), h1=Math.round(30+(1-tri)*30), X=snp(B.x+x-ff);
    g.fillStyle = ph<1 ? '#c486b0' : '#a96a98'; g.fillRect(X,ground-h1,1.0001,h1); if (h1>52){ g.fillStyle='#fbe6f0'; g.fillRect(X,ground-h1,1.0001,Math.min(4,h1-52)); } }
  // hills with little trees
  const ho=sc*0.45, hi2=Math.floor(ho), hf=ho-hi2;
  for (let x=-1;x<=B.w;x++){ const s2=x+hi2, h2=Math.round(14+Math.sin(s2/26)*6+Math.sin(s2/11)*2), X=snp(B.x+x-hf); g.fillStyle='#6fb24f'; g.fillRect(X,ground-h2,1.0001,h2); g.fillStyle='#88c862'; g.fillRect(X,ground-h2,1.0001,1);
    if (((s2%47)+47)%47===0){ g.fillStyle='#5a3a1a'; g.fillRect(X,ground-h2-4,1,4); g.fillStyle='#3f8a3a'; g.fillRect(X-3,ground-h2-11,7,6); g.fillRect(X-2,ground-h2-13,5,2); g.fillStyle='#57a84a'; g.fillRect(X-2,ground-h2-12,2,2); } }
  // ground: grass lip, dirt, scrolling pebbles and stripes
  g.fillStyle='#e2b264'; g.fillRect(B.x,ground,B.w,14); g.fillStyle='#78c048'; g.fillRect(B.x,ground,B.w,3); g.fillStyle='#a2dc6a'; g.fillRect(B.x,ground,B.w,1); g.fillStyle=INK; g.fillRect(B.x,ground+3,B.w,1);
  { const o=sc%16; g.fillStyle='#bf8c42'; for (let x=-16;x<B.w+16;x+=16){ const X=snp(B.x+x-o); g.fillRect(X,ground+7,6,2); g.fillRect(X+10,ground+11,2,1); } g.fillStyle='#f2cc84'; for (let x=-16;x<B.w+16;x+=16) g.fillRect(snp(B.x+x-o+3),ground+5,2,1); }
  // speed lines when it gets fast
  if (arcade.speed>165 && !arcade.over){ const a=Math.min(0.5,(arcade.speed-165)/120); g.fillStyle=`rgba(255,255,255,${a})`; for (let k=0;k<5;k++){ const yy=B.y+20+((k*37)%(B.h-60)), L=14+(k%3)*8, xx=((B.w+40)-((sc*1.6+k*67)%(B.w+40)))-20; g.fillRect(snp(B.x+xx),yy,L,1); } }
  // obstacles
  for (const o of arcade.obs){ const x=snp(B.x+o.x), yb=ground-(o.fly||0);
    if (o.type!=='bird' && o.type!=='apple') groundShadow(x+o.w/2, ground+1, o.w+2, 0.28);
    if (o.type==='fence') spr(SP_FENCE, x, yb-o.h, ARC_PAL);
    else if (o.type==='bale') spr(SP_BALE, x, yb-8, ARC_PAL);
    else if (o.type==='cactus') spr(SP_CACTUS, x-2, yb-16, ARC_PAL);
    else if (o.type==='bird'){ groundShadow(x+6, ground+1, 8, 0.18); spr(SP_BIRD[Math.floor(t*10)%2], x, yb-6, ARC_PAL); }
    else if (o.type==='apple'){ const bob=Math.round(Math.sin(t*5+o.x/20)); spr(SP_APPLE, x-1, yb-8+bob, ARC_PAL); if (Math.floor(t*6)%2){ g.fillStyle='#fffbe0'; g.fillRect(x-3,yb-6+bob,1,1); g.fillRect(x+9,yb-2+bob,1,1); } }
  }
  // the llama: shadow shrinks as it jumps
  const air=arcade.y>0.5; const fr = arcade.over ? 0 : air ? 1 : Math.floor(t*12)%4;
  groundShadow(B.x+50, ground+1, Math.max(6, 16-Math.round(arcade.y/6)), 0.3-Math.min(0.2,arcade.y/200));
  g.drawImage(sprite(me.c, 'fr', fr, 'stand'), B.x+36, snp(ground-46+1-arcade.y));
}
function drawArcadeText(c, t){
  const B=arcadeText.B; c.textBaseline='top';
  const title = arcade.mode==='menu' ? 'ARCADE' : (GAMES.find(x=>x.id===arcade.mode)||{}).name;
  // header: joystick icon, title, and the HTML X button kept lined up with the band
  { const ic=PIXIMG.joystick; if (ic && ic.complete){ const sm=c.imageSmoothingEnabled; c.imageSmoothingEnabled=false; c.drawImage(ic, B.x, B.y-20, 12, 12); c.imageSmoothingEnabled=sm; } }
  c.textBaseline='middle'; c.font=AF(11,700); c.fillStyle=INK; c.fillText(title, B.x+16, B.y-13.5); c.textBaseline='top';
  { const r=ui.getBoundingClientRect(), sz=Math.round(Math.max(26, Math.min(36, 16*S))); arcX.style.width=arcX.style.height=sz+'px';
    arcX.style.left=Math.round(r.left+(B.x+B.w-4)*S-sz)+'px'; arcX.style.top=Math.round(r.top+(B.y-14)*S-sz/2)+'px'; }
  if (arcade.mode==='menu'){
    c.fillStyle='#f8d030'; c.font=AF(13,700); c.fillText('SELECT GAME', B.x+14, B.y+14);
    c.fillStyle='#a8c8f8'; c.font=AF(8); c.fillText('ARROWS + A, OR TAP A GAME', B.x+14, B.y+32);
    for (let i=0;i<=GAMES.length;i++){ const {y,h}=ARC_ROW(B,i), id=i<GAMES.length?GAMES[i].id:null; c.fillStyle=INK; c.textBaseline='middle';
      if (id){ c.font=AF(11,700); c.fillText(GAMES[i].name, B.x+28, y+9.5);
        const top=board[id][0], u=id==='dash'?'m':''; c.font=AF(8); c.fillStyle='#5a4a78'; c.fillText('BEST '+best[id]+u+(top?'   TOP: '+top.n+' '+top.s+u:'   '+GAMES[i].blurb), B.x+28, y+20.5); }
      else { c.font=AF(11,700); c.fillText('EXIT', B.x+28, y+h/2+0.5); } }
    c.textBaseline='top'; return;
  }
  const unit = arcade.mode==='dash' ? 'm' : '';
  c.font=AF(8); c.fillStyle=INK;
  c.fillText('SCORE '+arcade.score+unit, B.x+3, B.y+3); c.fillText('BEST '+best[arcade.mode]+unit, B.x+3, B.y+11);
  if (arcade.mode==='hay' && arcade.combo>=5 && !arcade.over){ const mult=Math.min(4,1+Math.floor(arcade.combo/5)); c.fillStyle=Math.floor(t*6)%2?'#c03070':'#183070'; c.fillText('COMBO x'+mult, B.x+3, B.y+19); }
  for (const p of arcade.pops){ c.globalAlpha=Math.max(0,1-p.t/0.9); c.fillStyle=p.col; c.fillText(p.text, p.x-8, p.y-10-p.t*18); } c.globalAlpha=1;
  const mx=B.x+B.w/2; c.textAlign='center';
  if (arcade.ready>0 && !arcade.over){ c.font=AF(11,700); c.fillStyle=INK; c.fillText(arcade.ready>0.5?'READY?':'GO!', mx, B.y+B.h/2-30);
    c.font=AF(8); if (arcade.mode==='hay'){ c.fillText('CATCH HAY. DODGE POOP.', mx, B.y+B.h/2-14); c.fillText('GOLD APPLE = 5  ♥ = LIFE', mx, B.y+B.h/2-4); c.fillText('5 IN A ROW = COMBO!', mx, B.y+B.h/2+6); }
    else { c.fillText('TAP / SPACE / ▲ TO JUMP', mx, B.y+B.h/2-14); c.fillText('HOLD FOR A BIGGER JUMP', mx, B.y+B.h/2-4); c.fillText('GRAB APPLES FOR +5m', mx, B.y+B.h/2+6); } }
  if (arcade.over){ c.font=AF(11,700); c.fillStyle=INK; c.fillText('GAME OVER', mx, B.y+B.h/2-32);
    c.font=AF(8); c.fillText('SCORE '+arcade.score+unit+'  BEST '+best[arcade.mode]+unit, mx, B.y+B.h/2-18);
    { const e=arcade.earned||0; const fs=c.fillStyle; c.fillStyle=e?'#f8d030':'#a8c8f8'; c.fillText(e ? '+'+e+' TOKENS!' : (arcade.mode==='hay'?'10 PTS = 1 TOKEN':'50M = 1 TOKEN'), mx, B.y+B.h/2-8); c.fillStyle=fs; }
    if (arcade.newBest){ c.fillStyle=Math.floor(t*6)%2?'#c03070':'#c08000'; c.fillText('NEW BEST!', mx, B.y+B.h/2-8); c.fillStyle=INK; }
    c.fillText('A: PLAY AGAIN', mx, B.y+B.h/2+4); c.fillText('B / X: GAME MENU', mx, B.y+B.h/2+14); }
  c.textAlign='left';
}

// ======================= MULTIPLAYER =======================
let lastSent=0, pendingSend=false;
function presencePayload(){
  const tx = me.moving ? me.to[0]+0.5 : me.x, ty = me.moving ? me.to[1]+0.5 : me.y;
  const o = { c:me.c, n:me.n||'LLAMA', x:Math.round(tx*100)/100, y:Math.round(ty*100)/100, d:me.d, p:me.p, m:me.moving?1:0 };
  o.s = me.lastSay || null;
  o.h = me.h || null;
  o.hl = me.h ? (me.hl||SIPS) : null;
  o.sk = me.sipK || null;
  o.e = me.lastEm || null;
  o.a = arcade.on ? 'arcade' : (typeof AR!=='undefined' && AR.on) ? 'arena' : (typeof BW!=='undefined' && BW.on) ? 'bowl' : null;
  o.sp = me.lastSpit || null;
  o.td = me.lastTable || null;
  o.g = me.lastScore || null;
  o.tg = me.lastTG || null;
  o.fk = me.flK || null;
  o.tk = wallet.get();
  o.rm = curRoom;
  o.fs = me.fish ? {k:me.fish.k, st:(me.fish.st==='wait'?'cast':me.fish.st), f:me.fish.f, bx:me.fish.bx, by:me.fish.by} : null;
  o.sl = me.lastSlot || null;
  o.ea = me.lastEat || null;
  o.bj = (curRoom==='casino' && me.bj) ? me.bj : null;
  if (juke.ts) o.j = { s:juke.s, ts:juke.ts };
  if (lamp.ts) o.l = { on:lamp.on?1:0, ts:lamp.ts };
  return o;
}
function sendPresence(force){
  if (!room || !joined) return;
  const now=performance.now();
  if (!force && now-lastSent<90){ pendingSend=true; return; }
  lastSent=now; pendingSend=false;
  room.presence(presencePayload()).catch(()=>{});
}
function readPeer(peer){
  const pr = peer.presence||{};
  if (!CHAR_IDS.includes(pr.c)) return null;
  const x=+pr.x, y=+pr.y; if(!isFinite(x)||!isFinite(y)) return null;
  const s = (pr.s&&typeof pr.s==='object') ? {k:+pr.s.k||0, t:clean(pr.s.t,120), f:pr.s.f===1, y:pr.s.y===1} : null;
  const e = (pr.e&&typeof pr.e==='object'&&EMOTES.includes(pr.e.t)) ? {k:+pr.e.k||0, t:pr.e.t} : null;
  const j = (pr.j&&typeof pr.j==='object'&&isFinite(+pr.j.ts)&&Number.isInteger(+pr.j.s)&&+pr.j.s>=-1&&+pr.j.s<SONGS.length) ? {s:+pr.j.s, ts:+pr.j.ts} : null;
  const l = (pr.l&&typeof pr.l==='object'&&isFinite(+pr.l.ts)) ? {on:!!pr.l.on, ts:+pr.l.ts} : null;
  const sp = (pr.sp&&typeof pr.sp==='object'&&typeof pr.sp.to==='string') ? {k:+pr.sp.k||0, to:pr.sp.to.slice(0,64)} : null;
  const td = (pr.td&&typeof pr.td==='object'&&[0,1].includes(+pr.td.i)) ? {k:+pr.td.k||0, i:+pr.td.i, v:Math.max(1,Math.min(6,+pr.td.v||1)), coin:!!pr.td.coin} : null;
  const tg = (pr.tg&&typeof pr.tg==='object'&&[0,1].includes(+pr.tg.i)&&['roll','card'].includes(pr.tg.g)&&['join','res'].includes(pr.tg.ph)) ? {k:+pr.tg.k||0, i:+pr.tg.i, g:pr.tg.g, ph:pr.tg.ph, b:Math.max(0,Math.min(10,Math.floor(+pr.tg.b||0))), left:Math.max(0,Math.min(15,+pr.tg.left||0)),
    r: Array.isArray(pr.tg.r) ? pr.tg.r.slice(0,8).map(x=>({p:String((x&&x.p)||'').slice(0,64), n:clean(String((x&&x.n)||''),12).toUpperCase()||'LLAMA', v:Math.max(0,Math.min(51,Math.floor(+(x&&x.v)||0)))})) : [], w:Math.max(0,Math.min(7,Math.floor(+pr.tg.w||0)))} : null;
  const gsc = (pr.g&&typeof pr.g==='object'&&['hay','dash'].includes(pr.g.id)&&isFinite(+pr.g.v)) ? {k:+pr.g.k||0, id:pr.g.id, v:Math.max(0,Math.min(99999,Math.floor(+pr.g.v)))} : null;
  const bj = Array.isArray(pr.bj) ? pr.bj.slice(0,8).map(v=>Math.max(0,Math.min(51,Math.floor(+v||0)))) : null;
  const ea = (pr.ea&&typeof pr.ea==='object'&&/^a\d{1,2},\d{1,2}$/.test(String(pr.ea.a))) ? {k:+pr.ea.k||0, a:String(pr.ea.a)} : null;
  return { w: cleanWear(pr.w), st: ['owner','mod'].includes(pr.st) ? pr.st : '', bj, ea, l, c:pr.c, n:clean(pr.n,12)||'LLAMA', x:Math.min(40,Math.max(0,x)), y:Math.min(40,Math.max(0,y)), d:['fr','fl','br','bl'].includes(pr.d)?pr.d:'fr',
    p:['sit','dance','bar'].includes(pr.p)?pr.p:'stand', s, e, j, h: DRINK_IDS.includes(pr.h)?pr.h:null, hl:Math.max(0,Math.min(SIPS,Math.floor(+pr.hl||SIPS))), sk:+pr.sk||0, a: pr.a==='arcade'?'arcade':null, sp, td, g:gsc, tg, fk:+pr.fk||0, tk:Math.max(0,Math.min(1e6,Math.floor(+pr.tk||0))), rm: validRoom(pr.rm)?pr.rm:'lounge', fs: (pr.fs&&typeof pr.fs==='object'&&['cast','bite','got'].includes(pr.fs.st)) ? {k:+pr.fs.k||0, st:pr.fs.st, f:Math.max(0,Math.min(2,Math.floor(+pr.fs.f||0))), bx:Math.max(0,Math.min(40,+pr.fs.bx||0)), by:Math.max(0,Math.min(40,+pr.fs.by||0))} : null, sl: (pr.sl&&typeof pr.sl==='object'&&Array.isArray(pr.sl.r)) ? {k:+pr.sl.k||0, r:pr.sl.r.slice(0,3).map(v=>Math.max(0,Math.min(SLOT_SYMS.length-1,Math.floor(+v||0))))} : null };
}
function upsertPeer(peer){
  if (peer.isMe && peer.sameTab) return;
  if (peer.kind !== 'viewer') return;
  const st = readPeer(peer); const id = peer.peer;
  if (!st) return;
  if (joined && me.n && st.n.toUpperCase()===String(me.n).toUpperCase()){ const o=others.get(id); if (o) others.delete(id); return; }   // never draw yourself twice
  let o = others.get(id); const now=performance.now();
  if (o && o.leaving){ others.delete(id); o=null; }
  if (!o){ o = { id, x:st.x, y:st.y, anim:0, lastK: st.s?st.s.k:0, lastE: st.e?st.e.k:0, lastSk: st.sk, lastSp: st.sp?st.sp.k:0, lastTd: st.td?st.td.k:0, lastG: st.g?st.g.k:0, lastTG: st.tg?st.tg.k:0, lastFk: st.fk||0, lastEa: st.ea?st.ea.k:0, flipStart:-9999, bubble:null, emote:null, sipStart:-9999, flinch:0 }; others.set(id,o); if (isFriend(st.n)) localMsg(`⭐ Your friend ${st.n.toUpperCase()} is online in ${roomName(st.rm)}!`); else sysMsg(`${st.n.toUpperCase()} is online in ${roomName(st.rm)}!`); }
  else {
    const here = st.rm===curRoom;
    if (st.sl && st.sl.k !== o.lastSl){ o.lastSl = st.sl.k; if (here) slotRemote(st.sl.r, Math.floor(st.x)); }
    if (st.s && st.s.k !== o.lastK){ o.lastK = st.s.k; if (st.s.t && !BLOCKS.has(String(st.n||'').toUpperCase())){   /* blocked players' chat never shows */ if(st.s.f){ if (here) sysMsg(`${st.n.toUpperCase()} ${st.s.t}`); } else if (!here) chatMsg(st.n, st.s.t, st.s.y); else { o.bubble=mkBubble(st.s.t); chatMsg(st.n, st.s.t, st.s.y); addBar(st.n, st.s.t, st.c, o.x, o.y, false, st.s.y); } } }
    if (st.e && st.e.k !== o.lastE){ o.lastE = st.e.k; o.emote={t:st.e.t, until:now+3000}; }
    if (st.sk !== o.lastSk){ o.lastSk = st.sk; o.sipStart = now; }
    if (st.sp && st.sp.k !== o.lastSp && here){ o.lastSp = st.sp.k; const tgt = st.sp.to===myPeer ? me : others.get(st.sp.to);
      launchSpit(o, tgt||null, st.d); if (tgt===me){ localMsg(`${st.n.toUpperCase()} spat on you!`); } }
    if (st.td && st.td.k !== o.lastTd && here){ o.lastTd = st.td.k; tableShow(st.td.i, st.td.v, st.td.coin); }
    if (st.ea && st.ea.k !== o.lastEa){ o.lastEa = st.ea.k; if (here && st.rm==='barn') appleState[st.ea.a]={back:Date.now()+APPLE_MS, at:Date.now()}; }
    if (st.fk && st.fk !== o.lastFk){ o.lastFk = st.fk; o.flipStart = now; }
    if (st.tg && st.tg.k !== o.lastTG && here){ o.lastTG = st.tg.k; tgRemote(st, o); }
    if (st.g && st.g.k !== o.lastG){ o.lastG = st.g.k; reportScore(st.g.id, st.n, st.g.v); }
  }
  if (st.j && st.j.ts > juke.ts){ juke.s=st.j.s; juke.ts=st.j.ts; if (o.j && o.j.ts!==st.j.ts) songChanged(false, st.n.toUpperCase()); else restartSong(); }
  o.j = st.j;
  if (st.l && st.l.ts > lamp.ts){ lamp.on=st.l.on; lamp.ts=st.l.ts; }
  if (st.fs && st.fs.st==='got' && (!o.fs || o.fs.st!=='got' || o.fs.k!==st.fs.k)) o.fishShow={f:st.fs.f, until:performance.now()+2200};
  if (o.rm && st.rm && o.rm!==st.rm) sysMsg(`${st.n.toUpperCase()} went to ${roomName(st.rm)}.`);
  o.w=st.w; o.st=st.st; o.bj=st.bj; o.tk=st.tk; o.rm=st.rm; o.fs=st.fs; o.c=st.c; o.n=st.n; o.tx=st.x; o.ty=st.y; o.d=st.d; o.p=st.p; o.h=st.h; o.hl=st.hl; o.a=st.a;
  if (Math.hypot(o.tx-o.x,o.ty-o.y)>3){ o.x=o.tx; o.y=o.ty; }
}
const LEAVE_T=1200;
// someone logged off: in your room they walk to the door, then fade out; anywhere else they just go
function walkOut(o){
  o.leaving = Infinity; o.tx=o.x; o.ty=o.y;   // already not counted or tappable, but not fading yet
  const door = DOORWAY[curRoom];
  if (!joined || !sameRoom(o) || !door){ o.leaving=performance.now(); return; }
  const path = findPath(Math.floor(o.x), Math.floor(o.y), door[0], door[1]);
  if (!path || !path.length){ o.leaving=performance.now(); return; }
  if (o.p==='sit' || o.p==='bar') o.p='stand'; o.fs=null; o.bubble=null; o.emote=null;
  o.exitPath = path; o.exitBy = performance.now()+12000;
}
function updateOthers(dt){
  for (const [id,o] of others){ if (o.leaving && performance.now()-o.leaving>LEAVE_T) others.delete(id); }
  const sp = 1.6/STEP, now=performance.now();
  for (const o of others.values()){
    if (o.exitPath){ // walking out: next tile of the path, then start fading at the door
      if (Math.hypot(o.tx-o.x, o.ty-o.y)<0.02){ const nx=o.exitPath.shift();
        if (nx && now<o.exitBy){ o.d=dirFrom(nx[0]-Math.floor(o.tx), nx[1]-Math.floor(o.ty), o.d); o.tx=nx[0]+0.5; o.ty=nx[1]+0.5; }
        else { o.exitPath=null; o.leaving=now; } } }
    const dx=o.tx-o.x, dy=o.ty-o.y, dist=Math.hypot(dx,dy);
    if (dist>0.01){ const L=stepLen(dx,dy); const f = L>0 ? Math.min(1, (WALK_PX*1.15*dt)/L) : 1; o.x+=dx*f; o.y+=dy*f; o.anim+=dt; o.walking=true; }
    else { o.x=o.tx; o.y=o.ty; o.walking=false; if(o.p==='dance') o.anim+=dt; else o.anim=0; }
    if (bubbleGone(o.bubble)) o.bubble=null;
    if (o.emote && now>o.emote.until) o.emote=null;
  }
}
const stxt = document.getElementById('stxt'), dot = document.getElementById('dot');
function updateStatus(){
  if (!room){ dot.className=''; stxt.textContent = 'SOLO MODE'; return; }
  if (!room.connected()){ dot.className=''; stxt.textContent='RECONNECTING'; return; }
  let n=1, all=1; for (const o of others.values()) if(!o.leaving){ all++; if (sameRoom(o)) n++; } dot.className='on'; const away=all-n, other='OTHER ROOMS';
  stxt.innerHTML = `${n} HERE · <b class="onl" title="Llamas online in every room">${all} ONLINE</b>`;   /* total online, across every room */ if (typeof updateRoombar==='function') updateRoombar();
}
async function initRoom(){
  try { room = (window.claude && typeof window.claude.use==='function') ? await window.claude.use('room') : null; } catch(e){ room=null; }
  if (!room){ updateStatus(); return; }
  room.onPeers(ch => {
    for (const p of ch.peers) if (p.isMe && p.sameTab) myPeer = p.peer;
    for (const p of ch.joined) upsertPeer(p);
    for (const p of ch.updated) upsertPeer(p);
    for (const p of ch.left){ const o=others.get(p.peer); if(o && !o.leaving){ sysMsg(`${o.n.toUpperCase()} left.`); walkOut(o); } }
    updateStatus();
  }, () => { room=null; updateStatus(); });
  room.onConnection(() => updateStatus(), () => { room=null; updateStatus(); });
  if (joined) sendPresence(true);
  updateStatus();
}

// ======================= TEXT BOX / LOG =======================
const tbox=document.getElementById('tbox'), ttext=document.getElementById('ttext'), tarrow=document.getElementById('tarrow');
const loglines=document.getElementById('loglines');
const tq=[]; let tcur=null;
const LINE=38;
function paginate(s){
  const lines=[]; let cur='';
  for (let w of s.split(/\s+/).filter(Boolean)){
    while (w.length>LINE){ if(cur){lines.push(cur);cur='';} lines.push(w.slice(0,LINE)); w=w.slice(LINE); }
    if (!w) continue;
    const test = cur ? cur+' '+w : w; if (test.length>LINE){ lines.push(cur); cur=w; } else cur=test;
  }
  if (cur) lines.push(cur);
  const pages=[]; for(let i=0;i<lines.length;i+=2) pages.push(lines.slice(i,i+2).join('\n')); return pages.length?pages:[''];
}
function logLine(t,sys){ const d=document.createElement('div'); d.className='ln'+(sys?' sys':''); d.textContent=t; loglines.appendChild(d); while(loglines.children.length>80) loglines.removeChild(loglines.firstChild); const lb=document.getElementById('logbox'); lb.scrollTop=lb.scrollHeight; }
// ---- event cards: the old message box along the bottom is gone. Each kind of event shows a small card the
// FIRST time this player runs into it, then never again on this device. Everything still goes in the CHAT LOG.
const SEEN_K='ll_seenMsg'; let SEEN; try{ SEEN=new Set(JSON.parse(localStorage.getItem(SEEN_K)||'[]')); }catch(_){ SEEN=new Set(); }
function msgKey(s){ const t=String(s).replace(EMO_RE,' ').replace(/\d+/g,'#');
  /* names and item names are written in capitals, so leave them out: "You bought a CACTUS!" and "You bought a SOFA!" are the same kind of event */
  const k=t.replace(/\b[A-Z][A-Z0-9_'.-]*[A-Z0-9]\b/g,' ').replace(/[^a-z#]+/gi,' ').trim().toLowerCase();
  return (k.replace(/#/g,'').trim().length>=6 ? k : t.toLowerCase().replace(/\s+/g,' ').trim()).slice(0,90); }
const EVQ=[]; let evCur=null, evTimer=0;
function queue(s){ s=String(s||'').trim(); if (!s) return; const k=msgKey(s); if (SEEN.has(k)) return; SEEN.add(k);
  try{ localStorage.setItem(SEEN_K, JSON.stringify([...SEEN].slice(-600))); }catch(_){}
  if (EVQ.length<3) EVQ.push(s); if (!evCur) evNext(); }
function evNext(){ const el=document.getElementById('evpop'); clearTimeout(evTimer); evCur=EVQ.shift()||null;
  if (!evCur){ el.classList.remove('on'); return; }
  const m=evCur.match(EMO_RE), ic=m ? EMO[m[0].replace(/️/g,'')] : 'star', txt=m && evCur.indexOf(m[0])===0 ? evCur.slice(m[0].length).trim() : evCur;
  el.querySelector('.evi').innerHTML=pix(ic||'star'); el.querySelector('.evt').textContent=txt;
  el.classList.remove('on'); void el.offsetWidth; el.classList.add('on');
  evTimer=setTimeout(evNext, Math.min(9000, 3800+txt.length*45)); }
function chatMsg(name,text,yell){ logLine(name.toUpperCase()+(yell?' YELLS: ':': ')+text); }
// ---- chat bars: rise slowly, never overlap, blink, vanish ----
const bars=[];
function addBar(name, text, cid, gx, gy, mine, yell){
  const head=(name.toUpperCase()+':');
  const body=yell?text.toUpperCase()+'!':text;
  const wOf=t=>(pfW(head)+2+pfW(t,1,!yell)+10)*0.9;   // first guess; the real size is measured when it's drawn
  const [wx,wy]=proj(gx,gy);
  const st = mine ? (me.st||'') : (([...others.values()].find(o=>o.n && o.n.toUpperCase()===name.toUpperCase())||{}).st||'');
  bars.push({st, head, body, yell:!!yell, cid, mine, x:wx, y:wy-66-14, w:wOf(body), h:22/S, born:performance.now(), dur:Math.min(18000, 4500+text.length*110)});
  if (bars.length>14) bars.shift();
}
function updateBars(dt){
  const now=performance.now();
  for (let i=bars.length-1;i>=0;i--){ const b=bars[i]; b.y -= 4*dt; if (now > b.born+b.dur+1000) bars.splice(i,1); }
  // older bars always sit above newer ones they overlap with
  for (let i=bars.length-2;i>=0;i--){ const a=bars[i];
    for (let j=i+1;j<bars.length;j++){ const b=bars[j];
      if (Math.abs(a.x-b.x) < (a.w+b.w)/2+2 && a.y+a.h+3 > b.y) a.y = b.y-3-a.h; } }
}
function mkBubble(text){ return {text, start:performance.now(), dur:Math.min(16000, 3500+text.length*100)}; }
const bubbleGone = b => !b || performance.now() > b.start + b.dur + 1200;

function sysMsg(text){ queue(text); logLine(text,true); }
function localMsg(text){ queue(text); logLine(String(text),true); }
function action(text){ me.sayK=(me.sayK+1)%100000; me.lastSay={k:me.sayK, t:text, f:1}; sysMsg(`${(me.n||'YOU').toUpperCase()} ${text}`); sendPresence(true); }
function updateText(dt){
  if (!tcur && tq.length){ tcur={pages:tq.shift(), pi:0, ci:0, hold:0}; tbox.style.display='block'; }
  if (!tcur){ tbox.style.display='none'; return; }
  const page=tcur.pages[tcur.pi];
  if (tcur.ci < page.length){ tcur.ci=Math.min(page.length, tcur.ci+dt*90); { let n=Math.floor(tcur.ci); const cc=page.charCodeAt(n-1); if (cc>=0xD800 && cc<=0xDBFF) n++; if (page.charCodeAt(n)===0xFE0F) n++; ttext.textContent=page.slice(0,n); } tarrow.style.display='none'; return; }
  ttext.textContent=page; const more = tcur.pi<tcur.pages.length-1; tarrow.style.display = more?'block':'none';
  tcur.hold+=dt; const wait = more?1.5:(tq.length?0.9:2.2);
  if (tcur.hold>wait) advanceText();
}
function advanceText(){ if(!tcur) return; const page=tcur.pages[tcur.pi]; if(tcur.ci<page.length){ tcur.ci=page.length; return; } if(tcur.pi<tcur.pages.length-1){ tcur.pi++; tcur.ci=0; tcur.hold=0; } else tcur=null; }
tbox.addEventListener('pointerdown', e=>{ e.stopPropagation(); advanceText(); });
document.getElementById('evpop').addEventListener('pointerdown', e=>{ e.stopPropagation(); evNext(); });

// ---- word filter (the same copy lives in src/worker.js and public/index.html) ----
// SLURS: a message with one of these isn't sent at all. SWEARS: masked with stars in chat and DMs.
// Names and room names can't contain either. Checks see through leetspeak (n1gg3r), repeated letters,
// accents, and spaced-out letters (f a g). Words match whole (with -s/-es/-ed/-ing endings) unless listed in *_ROOT,
// which also match inside longer words (motherfucker).
const WF = (() => {
  const SLUR_ROOT = ["nigger", "nigga", "niggah", "nigguh", "niglet", "faggot", "fagot", "wetback", "towelhead", "raghead", "sandnigger", "porchmonkey", "jigaboo", "zipperhead", "golliwog", "kneegrow", "heilhitler", "siegheil", "whitepower", "gasthejews", "killalljews", "tranny", "trannies", "shemale", "retard"];
  const SLUR_WORD = ["fag", "fags", "faggy", "dyke", "chink", "chinks", "gook", "gooks", "spic", "spick", "spics", "kike", "kyke", "kikes", "beaner", "beaners", "coon", "coons", "wog", "wogs", "paki", "pakis", "negro", "negroes", "jap", "japs", "gyppo", "pikey", "darkie", "darky", "camel jockey", "mongoloid", "spaz", "spastic"];
  const SWEAR_ROOT = ["fuck", "fuk", "fck", "shit", "bitch", "cunt", "asshole", "motherf", "whore", "slut", "dickhead", "cocksucker", "wanker", "twat", "bollock", "pussy", "jackass", "dumbass", "fatass", "bullshit", "porn", "jizz", "blowjob", "handjob"];
  const SWEAR_WORD = ["ass", "asses", "arse", "dick", "dicks", "cock", "cocks", "tits", "titties", "boobs", "cum", "bastard", "bastards", "prick", "piss", "pissed", "damnit", "goddamn", "skank", "hoe", "hoes", "rape", "raped", "rapist", "nude", "nudes", "sex", "sexy", "penis", "vagina", "dildo", "milf", "thot", "wtf", "stfu", "fml", "kys"];
  const LEET = { "0": "o", "1": "i", "!": "i", "|": "i", "3": "e", "4": "a", "@": "a", "5": "s", "$": "s", "7": "t", "+": "t", "8": "b", "9": "g", "6": "g", "2": "z", "€": "e", "£": "l" };
  const letters = (s) => String(s).toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/[0-9!|@$+€£]/g, (c) => LEET[c] || c).replace(/[^a-z]/g, "");
  const pat = (w) => w.replace(/[^a-z]/g, "").split("").map((c) => c + "+").join("");   // n+i+g+g+e+r+ : any number of each letter, but never fewer
  const rx = (list, whole) => new RegExp(whole ? "^(?:" + list.map(pat).join("|") + ")(?:e?s|e?d|ing)?$" : "(?:" + list.map(pat).join("|") + ")");
  const slurRoot = rx(SLUR_ROOT), slurWord = rx(SLUR_WORD.filter((w) => !w.includes(" ")), true), swearRoot = rx(SWEAR_ROOT), swearWord = rx(SWEAR_WORD, true);
  const slurPhrase = rx(SLUR_WORD.filter((w) => w.includes(" ")));
  // the words of a message (letters only), plus runs of single letters joined up ("f a g" -> "fag")
  const words = (text) => { const raw = String(text).split(/[\s_.,;:\-*~/\\()[\]{}"'`^#%&=<>?]+/).map(letters).filter(Boolean), out = raw.slice(); let run = "";
    for (const w of raw) { if (w.length === 1) run += w; else { if (run.length > 1) out.push(run); run = ""; } } if (run.length > 1) out.push(run); return out; };
  const isSlurWord = (w) => slurRoot.test(w) || slurWord.test(w);
  const isSwearWord = (w) => swearRoot.test(w) || swearWord.test(w);
  return {
    // true if the text has a slur anywhere (also caught when letters are spread over several words: "nig ger")
    slur(text) { const ws = words(text); return ws.some(isSlurWord) || slurRoot.test(letters(text)) || slurPhrase.test(letters(text)); },
    // chat and DMs: swear words become stars (same length), everything else stays as typed
    mask(text) { return String(text).replace(/[^\s]+/g, (tok) => { const w = letters(tok); return w && (isSwearWord(w) || isSlurWord(w)) ? "*".repeat(Math.min(tok.length, 12)) : tok; }); },
    // names and room names: no slurs and no swears, even inside other letters ("xxfuckxx")
    nameOk(text) { const l = letters(text), ws = words(text); return !(this.slur(text) || swearRoot.test(l) || ws.some(isSwearWord)); },
  };
})();

const chatin = document.getElementById('chatin');
document.getElementById('emobtn').addEventListener('click', e=>{ e.preventDefault(); ensureAudio(); if (!joined) return; if (curMenu===emenu && emenu.style.display==='block') closeAll(); else showMenu(emenu); });   // EMOTES, right by the send button
/* the send button doesn't take focus away from the box, so the phone keyboard stays up too */
document.getElementById('saybtn').addEventListener('pointerdown', e=>{ if (document.activeElement===chatin) e.preventDefault(); });
document.getElementById('chatrow').addEventListener('submit', e => {
  e.preventDefault(); const raw = clean(chatin.value.trim(),120); if(!raw||!joined) return;
  chatin.value=''; setTimeout(()=>{ if (uiOpen() || arcade.on || (typeof TOUR!=='undefined' && TOUR.on)) chatin.blur(); }, 0);   /* a command that opens a pop-up steps out of the box; otherwise stay in the box: type the next line and hit Enter again (Esc or tapping the game leaves it) */
  const cmd = raw.toLowerCase();
  if (cmd==='/roll'){ const v=1+Math.floor(Math.random()*6); const ti=nearTable(); if(ti>=0){ me.tdK=(me.tdK||0)+1; me.lastTable={k:me.tdK,i:ti,v,coin:false}; tableShow(ti,v,false); } action(`rolled a ${v}!`); return; }
  if (cmd==='/flip'){ const h=Math.random()<0.5; const ti=nearTable(); if(ti>=0){ me.tdK=(me.tdK||0)+1; me.lastTable={k:me.tdK,i:ti,v:h?1:2,coin:true}; tableShow(ti,h?1:2,true); } action(`flipped a coin: ${h?'HEADS':'TAILS'}!`); return; }
  { const bm=/^\/ban\s+(\S+)(?:\s+(\d+|perm|permanent))?\s*$/.exec(cmd); if (bm && me.st){ openBan(bm[1], bm[2]===undefined ? undefined : (/^\d+$/.test(bm[2]) ? +bm[2] : 0)); return; } }   // every ban goes through the pop-up and its are-you-sure step
  { const mm=/^\/(mute|unmute|ban|unban|kick|mod|unmod|pkreset)\s+(\S+)(?:\s+(\d+|perm|permanent))?/.exec(cmd); if (mm){ NET.act('admin',{cmd:mm[1], target:mm[2], hours: mm[3] && /^\d+$/.test(mm[3]) ? +mm[3] : 0}).then(r=>localMsg(r.msg||'Done.')); return; } }
  if (WF.slur(raw)){ localMsg("That message has a word that isn't allowed here, so it wasn't sent."); NET.act('wf_hit',{}); return; }   // the server checks too
  if (cmd==='/tour' || cmd==='/gus'){ if (TOUR.on) return; tourStart(); return; }   // GUS comes back for another tour
  if (cmd.startsWith('/yell ')){ const t2=WF.mask(raw.slice(6).trim()); if(!t2) return; me.sayK=(me.sayK+1)%100000; me.lastSay={k:me.sayK, t:t2, y:1}; chatMsg(me.n||'YOU', t2, true); addBar(me.n||'YOU', t2, me.c, me.x, me.y, true, true); sendPresence(true); return; }
  const said=WF.mask(raw); me.sayK = (me.sayK+1) % 100000; me.lastSay = {k:me.sayK, t:raw};   /* the server masks it for everyone else (and counts it) */
  me.bubble = mkBubble(said); chatMsg(me.n||'YOU', said); addBar(me.n||'YOU', said, me.c, me.x, me.y, true);
  sendPresence(true);
});

// ======================= MENUS =======================
const shopEl=document.getElementById('shop'), shopImgEl=document.getElementById('shopimg'), shopName=document.getElementById('shopname'), shopLink=document.getElementById('shoplink');
function openShop(i){ const pr=PRODUCTS[i]; closeAll(); shopImgEl.src=pr.pop; shopImgEl.style.background=pr.bg;
  shopName.textContent=pr.name; const sp=document.getElementById('shopprice'); sp.textContent=pr.price; sp.style.display=''; document.getElementById('shopsub').textContent=pr.title; shopLink.href=pr.url; shopLink.textContent='VIEW PRODUCT ▶'; shopEl.style.display='block'; }
// the framed logo above the door opens the same popup, pointing at the main site
function openLogo(){ closeAll(); shopImgEl.src=LOGO.src; shopImgEl.style.background='#f8f0d8';
  shopName.textContent='LA LLAMA PIC'; const sp=document.getElementById('shopprice'); sp.textContent=''; sp.style.display='none';
  document.getElementById('shopsub').textContent='The La Llama Politically Incorrect Club'; shopLink.href='https://llamalifematters.com/'; shopLink.textContent='VISIT SITE ▶'; shopEl.style.display='block'; }
document.getElementById('shopclose').addEventListener('click', ()=>closeAll());
const menu=document.getElementById('menu'), emenu=document.getElementById('emenu'), logbox=document.getElementById('logbox'), pick=document.getElementById('pick');
let curMenu=null, menuIdx=0;
function uiOpen(){ return ($id('boxbox') && $id('boxbox').style.display==='block') || (typeof rulesEl!=='undefined' && rulesEl.style.display==='flex') || (typeof roomPickEl!=='undefined' && roomPickEl.style.display==='flex') || (typeof swapEl!=='undefined' && swapEl.style.display==='block') || (typeof slotEl!=='undefined' && slotEl.style.display==='block') || (document.getElementById('plkbox')||{style:{}}).style.display==='block' || (typeof fwEl!=='undefined' && fwEl.style.display==='block') || (typeof tblEl!=='undefined' && tblEl.style.display==='block') || (typeof dashEl!=='undefined' && dashEl.style.display==='block') || (typeof sndEl!=='undefined' && sndEl.style.display==='block') || (typeof dkEl!=='undefined' && dkEl.style.display==='block') || (typeof jobsEl!=='undefined' && jobsEl.style.display==='block') || pmenuEl.style.display==='block' || tmenuEl.style.display==='block' || lboard.style.display==='block' || shopEl.style.display==='block' || !!curMenu || logbox.style.display==='block' || pick.style.display==='flex'; }
function items(m){ return [...m.children].filter(c=>!c.classList.contains('sheetx') && !c.classList.contains('shead')); }
function setMenu(i){ const it=items(curMenu); menuIdx=(i+it.length)%it.length; it.forEach((m,k)=>m.classList.toggle('on',k===menuIdx)); }
function showMenu(m){ closeAll(); curMenu=m; m.style.display='block'; setMenu(0); }
function openMenu(){ if(pick.style.display==='flex'||!joined||arcade.on) return; if(curMenu) closeAll(); else showMenu(menu); }
function closeAll(){ { const dp=document.getElementById('dailypop'); if (dp) dp.style.display='none'; const ib=document.getElementById('itembox'); if (ib) ib.style.display='none'; } if (joined && typeof roomPickEl!=='undefined') roomPickEl.style.display='none'; if (typeof swapEl!=='undefined') swapEl.style.display='none'; if (typeof slotEl!=='undefined') slotEl.style.display='none'; { const pk=document.getElementById('plkbox'); if (pk) pk.style.display='none'; } if (typeof fwEl!=='undefined') fwEl.style.display='none'; if (typeof tblEl!=='undefined') tblEl.style.display='none'; if (typeof dashEl!=='undefined') dashEl.style.display='none'; if (typeof sndEl!=='undefined') sndEl.style.display='none'; if (typeof dkEl!=='undefined') dkEl.style.display='none'; if (typeof jobsEl!=='undefined') jobsEl.style.display='none'; const acb=document.getElementById('acctbox'); if (acb) acb.style.display='none'; { const wb=document.getElementById('wfbox'); if (wb) wb.style.display='none'; const bb=document.getElementById('bugbox'); if (bb) bb.style.display='none'; { const pb=document.getElementById('plotbox'); if (pb) pb.style.display='none'; const bxb=document.getElementById('boxbox'); if (bxb) bxb.style.display='none'; } { const bx=document.getElementById('banbox'); if (bx) bx.style.display='none'; } { const rb=document.getElementById('repbox'); if (rb) rb.style.display='none'; } const mk=document.getElementById('mktbox'); if (mk) mk.style.display='none'; } const dmb=document.getElementById('dmbox'); if (dmb) dmb.style.display='none'; const ctb=document.getElementById('catbox'); if (ctb) ctb.style.display='none'; const wdb=document.getElementById('wardbox'); if (wdb) wdb.style.display='none'; const prb=document.getElementById('roomsbox'); if (prb && joined) prb.style.display='none'; const frb=document.getElementById('frbox'); if (frb) frb.style.display='none'; pmenuEl.style.display='none'; tmenuEl.style.display='none'; lboard.style.display='none'; shopEl.style.display='none'; menu.style.display='none'; emenu.style.display='none'; logbox.style.display='none'; curMenu=null; }
function menuAct(el){
  if (curMenu===emenu){ closeAll(); emote(el.dataset.e); return; }
  const a=el.dataset.a;
  if (a==='emote'){ showMenu(emenu); return; }
  closeAll();
  if (a==='llama' && !acctHasLlama()) openPicker();   // your llama is picked once, at sign-up
  else if (a==='room') showRoomPick(false);
  else if (a==='dash') openDash();
  else if (a==='account'){ openAccount(); }
  else if (a==='market'){ openMarket(); }
  else if (a==='tour'){ tourStart(); }
  else if (a==='terms'){ window.open('/terms', '_blank', 'noopener'); }
  else if (a==='bug'){ $id('bug_msg').textContent=''; $id('bugbox').style.display='block'; sheetHead($id('bugbox')); setTimeout(()=>$id('bug_text').focus(), 50); }
  else if (a==='friends'){ openFriends(); }
  else if (a==='wardrobe'){ openWardrobe(bagTab()); }
  else if (a==='logout'){ apiPost('/api/logout').then(()=>{ NET.closedForGood=true; location.reload(); }); }
  else if (a==='sit') toggleSit();
  else if (a==='tips'){ tipsOff=!tipsOff; if(!tipsOff){ tipHidden={}; store.tipHidden={}; } store.tipsOff=tipsOff; saveStore(); mtips.textContent=tipsOff?'TIPS: OFF':'TIPS: ON'; localMsg(tipsOff?'Tips are off.':'Tips are back on!'); }
  else if (a==='rules') showRules();
  else if (a==='spit') spitAuto();
  else if (a==='scores') openBoard();
  else if (a==='drop'){ if(me.h){ localMsg('You put your drink down.'); me.h=null; me.hl=0; sendPresence(true);} }
  else if (a==='log'){ logbox.style.display='block'; logbox.scrollTop=logbox.scrollHeight; }
}
for (const m of [menu,emenu]) items(m).forEach((el,k)=>{ el.addEventListener('pointerdown', e=>{ e.stopPropagation(); setMenu(k); menuAct(el); }); });
document.getElementById('logx').addEventListener('pointerdown', e=>{ e.stopPropagation(); closeAll(); });
document.getElementById('menubtn').addEventListener('click', ()=>openMenu());

// ======================= PICKER =======================
const cardsEl=document.getElementById('cards'), pname=document.getElementById('pname'), who=document.getElementById('who');
let sel = me.c; const previews = [];
for (const id of CHAR_IDS){
  const card=document.createElement('div'); card.className='card';
  const pc=document.createElement('canvas'); pc.width=SW; pc.height=SH; card.appendChild(pc); cardsEl.appendChild(card);
  card.addEventListener('pointerdown', e=>{ e.stopPropagation(); setSel(id); });
  previews.push({id,pc,card});
}
function setSel(id){ sel=id; for(const p of previews) p.card.classList.toggle('sel',p.id===id); who.textContent = CHARS[id].label.toUpperCase(); }
function pickMode(booth){ pick.classList.toggle('booth', !!booth);
  pick.querySelector('.tt').innerHTML = booth ? 'Step into the <b>BOOTH</b>' : 'Which <b>LLAMA</b> will<br>you choose?';
  pick.querySelector('.picknote').textContent = booth ? `Switch to any llama for ${BOOTH_PRICE} TOKENS. Your name, clothes and tokens stay the same.` : 'Choose carefully: this llama is yours for good.';
  $id('bGo').textContent = booth ? `SWITCH · ${BOOTH_PRICE}` : 'OK'; }
function openPicker(){ closeAll(); if(arcade.on) exitArcade(); pickMode(false); pname.value=me.n; setSel(me.c); pick.style.display='flex'; }
function openBooth(){ closeAll(); pickMode(true); pname.value=me.n; setSel(me.c); pick.style.display='flex'; }
let boothBusy=false;
function boothSwitch(){ if (boothBusy) return; if (sel===me.c){ localMsg("That's already you! Pick a different llama."); return; }
  boothBusy=true; $id('bGo').textContent='...';
  NET.act('llama_change',{c:sel}).then(r=>{ boothBusy=false; $id('bGo').textContent=`SWITCH · ${BOOTH_PRICE}`;
    if (!r || !r.ok){ localMsg((r&&r.msg)||"The booth is stuck. Try again."); return; }
    me.c=r.c; store.c=r.c; saveStore(); if (acct) acct.c=r.c; acctSave(); pick.style.display='none'; pickMode(false);
    if (Number.isFinite(r.tk)) tkSet(r.tk, `TA-DA! You're ${CHARS[r.c].label.toUpperCase()} now.`); sendPresence(true); }); }
function enter(){
  if (pick.classList.contains('booth')){ boothSwitch(); return; }
  ensureAudio(); restartSong();
  me.c = sel; me.n = clean(pname.value.trim(),12).toUpperCase() || CHARS[sel].label.toUpperCase().slice(0,12);
  store.c=me.c; store.n=me.n; saveStore(); if (acct){ acct.c=me.c; acct.n=me.n; } acctSave();
  pick.style.display='none'; pname.blur(); updateChatLimit();
  if (!joined){ showRoomPick(true); return; }
  sendPresence(true);
}
document.getElementById('bGo').addEventListener('pointerdown', e=>{ e.stopPropagation(); e.preventDefault(); enter(); });
pname.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); e.stopPropagation(); enter(); } });
const PREV_DIRS=['fr','fl','bl','br'];
function drawPreviews(t){
  if (pick.style.display!=='flex') return;
  const di=Math.floor(t/1.1)%4, fr=Math.floor(t*6)%4;
  for (const p of previews){ const c=p.pc.getContext('2d'); c.clearRect(0,0,SW,SH); const on=p.id===sel; c.drawImage(sprite(p.id, on?PREV_DIRS[di]:'fr', on?fr:0, 'stand'),0,0); }
}
const flashEl=document.getElementById('flash');
function flash(){ flashEl.style.transition='none'; flashEl.style.opacity='1'; requestAnimationFrame(()=>requestAnimationFrame(()=>{ flashEl.style.transition='opacity .7s ease'; flashEl.style.opacity='0'; })); }

// ======================= INPUT =======================
const cv=document.getElementById('game'), ui=document.getElementById('ui');
let S=2, DPR=1, LW=240, LH=216, UIB=28, UIT=0, camX=0, camY=60, camInit=false, camMan=false, camPX=0, camPY=0, userTap=false, camArrSt='', frameDt=0.016, ZLEVELS=[2], zoomStep=(+store.zoom||0);
function resize(){
  DPR=Math.min(2, devicePixelRatio||1);
  const W=innerWidth, H=innerHeight;
  { const fit = Math.min(W/545, (H-60)/385);           // scale where the whole room fits
    let base;
    if (W < 700 && H > W*1.4) base = Math.max(1.5, Math.min(2, Math.round(((H-210)/385)*4)/4));   // tall phones: use the height, the camera pans sideways
    else if (W < 700) base = Math.max(1.5, Math.min(2, Math.round(fit*2)/2));   // phones: zoom out a bit, keep llamas readable
    else base = Math.max(2, Math.min(5, Math.floor(fit)));
    ZLEVELS = W < 700 ? [1, 1.5, 1.75, 2, 2.5, 3, 4] : [1, 2, 3, 4, 5, 6];
    let bi = ZLEVELS.indexOf(base); if (bi<0) bi = ZLEVELS.findIndex(v=>v>=base);
    const zi = Math.max(0, Math.min(ZLEVELS.length-1, bi + zoomStep)); zoomStep = zi - bi; S = ZLEVELS[zi];
    const dpr = devicePixelRatio||1; S = Math.max(1, Math.round(S*dpr)) / dpr; }   // whole device pixels per game pixel = crisp edges
  LW=Math.ceil(W/S); LH=Math.ceil(H/S); hudSizes();
  cv.width=LW; cv.height=LH; cv.style.width=(LW*S)+'px'; cv.style.height=(LH*S)+'px';
  ui.width=Math.round(LW*S*DPR); ui.height=Math.round(LH*S*DPR); ui.style.width=(LW*S)+'px'; ui.style.height=(LH*S)+'px';
  // UI scale: full size normally, a step smaller on short (sideways) or very narrow phones
  { let px = 2; if (H < 520) px = H < 400 ? 1.5 : 1.75; if (W < 340) px = Math.min(px, 1.75); document.documentElement.style.setProperty('--px', px); }
}
// chat length: what fits on one line of a chat bubble
function updateChatLimit(){ const name=(me.n||'YOU').length; const max=Math.floor((Math.min(LW*S-20, 340)-30)/6.6)-name; chatin.maxLength=Math.max(10, Math.min(120, max)); if (chatin.value.length>chatin.maxLength) chatin.value=chatin.value.slice(0,chatin.maxLength); }
addEventListener('resize', ()=>{ resize(); updateChatLimit(); });
// the dock and top bar are HTML; measure them so the camera frames the room in the space between
function hudSizes(){ const d=document.getElementById('dock'), st=document.getElementById('status');
  const dh = d && d.classList.contains('on') ? d.offsetHeight : 0, th = st ? st.getBoundingClientRect().bottom : 0;
  document.documentElement.style.setProperty('--dockh', dh+'px');
  UIB = Math.ceil((dh+6)/S); UIT = innerWidth < 700 ? Math.ceil(th/S) : 0; }
if (window.ResizeObserver){ const ro=new ResizeObserver(()=>{ hudSizes(); }); ro.observe(document.getElementById('dock')); ro.observe(document.getElementById('status')); }
// tapping outside a pop-up closes it
document.getElementById('scrim').addEventListener('pointerdown', e=>{ e.preventDefault(); if (joined && !(typeof rulesEl!=='undefined' && rulesEl.style.display==='flex') && pick.style.display!=='flex') closeAll(); });
// ---- camera arrows: each tap slides the view about half a screen; tapping the floor to walk brings it back to your llama ----
const camLEl=document.getElementById('camL'), camREl=document.getElementById('camR'); let camPanW=100;
function camSlide(dir){ if (!camMan){ camMan=true; camPX=camX; camPY=camY; } camPX += dir*camPanW; ensureAudio(); }
for (const [el,dir] of [[camLEl,-1],[camREl,1]]){ el.addEventListener('pointerdown', e=>{ e.stopPropagation(); e.preventDefault(); camSlide(dir); }); el.addEventListener('click', e=>e.stopPropagation()); }
// ---- zoom: mouse wheel, pinch, and +/- buttons ----
function setZoom(delta){ const before=zoomStep; zoomStep+=delta; resize(); if (zoomStep===before) return; store.zoom=zoomStep; saveStore(); camInit=false; camMan=false; updateChatLimit(); }
document.getElementById('zin').addEventListener('click', ()=>setZoom(1));
document.getElementById('zout').addEventListener('click', ()=>setZoom(-1));
let wheelAcc=0, wheelT=0;
cv.addEventListener('wheel', e=>{ e.preventDefault(); if (arcade.on) return; const now=performance.now(); if (now-wheelT>400) wheelAcc=0; wheelT=now; wheelAcc+=e.deltaY;
  if (wheelAcc<=-60){ setZoom(1); wheelAcc=0; } else if (wheelAcc>=60){ setZoom(-1); wheelAcc=0; } }, {passive:false});
const touches=new Map(); let pinchD0=0;
cv.addEventListener('pointerdown', e=>{ if (e.isPrimary) touches.clear(); touches.set(e.pointerId,{x:e.clientX,y:e.clientY}); if (touches.size===2){ const [a,b]=[...touches.values()]; pinchD0=Math.hypot(a.x-b.x,a.y-b.y); } }, true);
cv.addEventListener('pointermove', e=>{ if(!touches.has(e.pointerId)) return; touches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if (touches.size===2 && pinchD0>0){ const [a,b]=[...touches.values()]; const d=Math.hypot(a.x-b.x,a.y-b.y);
    if (d/pinchD0>1.3){ setZoom(1); pinchD0=d; } else if (d/pinchD0<0.77){ setZoom(-1); pinchD0=d; } } });
const dropTouch=e=>{ touches.delete(e.pointerId); if (touches.size<2) pinchD0=0; };
// listen on the whole window: a finger can lift over a popup, and a missed lift would look like a stuck second finger
addEventListener('pointerup', dropTouch); addEventListener('pointercancel', dropTouch); addEventListener('blur', ()=>{ touches.clear(); pinchD0=0; });
window.__llRoom=()=>curRoom;   // lets the crash reporter (outside this closure) name the room
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)){ window.__peers=()=>[...others.values()].filter(o=>!o.leaving).map(o=>({n:o.n, rm:o.rm, x:+o.tx.toFixed(2), y:+o.ty.toFixed(2)})); window.__ward=(t,k)=>openWardrobe(t,null,k); window.__arc=()=>startArcade(); window.__fsky=()=>({key:FSKY.key, n:FSKY.clouds.length, w:FSKY.clouds.map(c=>c.width), OX, OY, LW, LH, X0:FSKY.X0}); window.__scr=(gx,gy,h)=>{ const [x,y]=P(gx,gy,h||0); return [x*S,y*S]; }; window.__pred=()=>({on:PRED.on, piece:PRED.piece&&PRED.piece.item, box:document.getElementById('plotbox').style.display}); window.__fi=(k,cs)=>furnIcon(k,cs); window.__go=r=>goRoom(r); window.__arena=()=>openArena(); window.__bowl=()=>openBowl(); window.__close=()=>closeAll(); window.__dash=()=>openDash(); window.__mkt=()=>openMarket(); window.__tour=()=>tourStart(); window.__period=v=>{ period=v; rebuildBG(); }; window.__juke=v=>{ juke.s=v; }; window.__tnext=()=>$id('tour_next').click(); window.__msg=t=>localMsg(t); window.__give=k=>{ me.h=k; me.hl=SIPS; me.autoEat=true; me.sipStart=performance.now()-SIP_T+600; }; window.__prgo=id=>prGo(id); window.__plk=()=>plkGo(); window.__bxw=(t,k,sm)=>bxWordImg(t,k,sm).toDataURL(); window.__pkAdd=p=>pkAdd(p); window.__api=(u,b)=>apiPost(u,b); window.__auView=()=>auView; window.__acct=()=>!!(acct && acct.name); window.__cvs=()=>({earned:CVS.earned, heat:CVS.heat, holes:[...COVEH.keys()].length, dig:!!CVS.dig, tk:wallet.get()}); window.__fb=(k,r,bg)=>{ const D=FURN_DEF[k], c=document.createElement('canvas'); c.width=90; c.height=90; const sg=g, sOX=OX, sOY=OY; try{ g=c.getContext('2d'); g.fillStyle=bg||'#5aa83c'; g.fillRect(0,0,90,90); OX=45; OY=50; drawFurn({...D.mk(), rot:r, gx:0, gy:0}, 0); } finally { g=sg; OX=sOX; OY=sOY; } return c.toDataURL(); }; window.__plots=()=>FURN.filter(f=>f.item==='plot').map(f=>[f.fid,f.gx,f.gy,!!plotState(f)]); window.__plotR=()=>{ me.plotF=null; plotCur=null; }; window.__plotF=()=>[me.plotF||null, plotCur, $id('plotbox').style.display]; window.__act=(n,a)=>NET.act(n,a); window.__doorPt=()=>{ const d=DOORWAY[curRoom]; if (curRoom==='barn'){ const [x,y]=P(14.5,0); return [x*S,(y-24)*S]; } if (d[0]===0){ const [x,y]=P(0,d[1]+0.5); return [x*S,(y-22)*S]; } if (d[1]===0){ const [x,y]=P(d[0]+0.5,0); return [x*S,(y-22)*S]; } const [x,y]=P(d[0]+0.5,d[1]+0.5); return [x*S,y*S]; }; window.__room=()=>curRoom; window.__walk=(x,y)=>walkTo(x,y); window.__path=()=>me.path.map(p=>p.join(',')).join(' '); window.__hl=()=>[me.h,me.hl]; window.__pm=n=>{ for (const [id,o] of others) if (o.n && o.n.toUpperCase()===n.toUpperCase()) return openPlayerMenu(id, innerWidth/2, innerHeight*0.6); }; } window.__blocks=()=>{ let o=''; for (let y=0;y<NY;y++){ for (let x=0;x<N;x++) o+= SEATS.some(q=>q.gx===x&&q.gy===y)?'s':BLOCK[y*N+x]?'#':'.'; o+='\n'; } return o; }; window.__sheet=(ids,pose,w)=>{ const dirs=['fr','fl','br','bl'], c=document.createElement('canvas'); c.width=ids.length*dirs.length*30; c.height=48; const x=c.getContext('2d'); ids.forEach((id,i)=>dirs.forEach((d,j)=>x.drawImage(buildSprite(id,d,0,pose||'stand',w||{}),(i*4+j)*30,1))); return c.toDataURL(); }; window.__fishShow=f=>{ me.fishShow={f, until:performance.now()+2200}; }; window.__fbox=()=>Object.keys(FURN_DEF).map(k=>{ const b=furnBox(k); return b?k+':'+b.w+'x'+b.h:k; }).join(' ');
if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) window.__tile=(x,y)=>{ const [a,b]=P(x,y,0); return [a*S,b*S]; }; window.__me=()=>[me.p,me.gx,me.gy,me.d,me.h||null]; window.__wear=(sl,id)=>wdWear(sl,id); window.__face=d=>{ me.d=d; }; window.__dbg=()=>({me:[me.x,me.y,me.p], furn:FURN.filter(f=>f.fid).map(f=>[f.t,f.gx,f.gy,f.dz||0,f.rot])});   // local test helper only
function toGrid(clientX, clientY){
  const wx = clientX/S - OX, wy = clientY/S - OY;
  return [Math.floor((wx/(TW/2) + wy/(TH/2))/2), Math.floor((wy/(TH/2) - wx/(TW/2))/2)];
}
function nearestFree(tx,ty){ let best=null, bd=1e9; for (const [dx,dy] of DIRS8){ const x=tx+dx, y=ty+dy; if(!walkable(x,y)) continue; const d=Math.abs(x-me.gx)+Math.abs(y-me.gy)+(dx&&dy?0.5:0); if(d<bd){bd=d;best=[x,y];} } return best; }
cv.addEventListener('pointerdown', e => {
  userTap=true;   // any walk started by this tap brings the camera back to your llama (cleared again just after)
  if (!joined || pick.style.display==='flex') return;
  if (touches.size>=2) return;
  if (arcade.on){ arcadePointer(e.clientX/S, e.clientY/S); try{cv.setPointerCapture(e.pointerId);}catch(_){} return; }
  if (uiOpen()){ closeAll(); return; }
  chatin.blur(); ensureAudio();
  if (!PRED.on && doorHit(e)){ showRoomPick(false); return; }   /* tap the door in any room: the LLAMA MAP */
  if (curRoom==='barn'){ barnPointer(e); return; }
  if (curRoom==='casino'){ casinoPointer(e); return; }
  if (curRoom==='arena'){ arenaPointer(e); return; }
  if (curRoom==='lanes'){ lanesPointer(e); return; }
  if (curRoom==='gym'){ gymPointer(e); return; }
  if (curRoom==='cove' || curRoom==='jungle'){ covePointer(e); return; }
  if (curRoom==='store'){ storePointer(e); return; }
  if (curRoom==='account'){ accountPointer(e); return; }
  if (isP(curRoom)){ playerPointer(e); return; }
  { const lx=e.clientX/S, ly=e.clientY/S; for (const h of shopHit){ if(lx>=h.x0&&lx<h.x1&&ly>=h.y0&&ly<=h.y1){ openShop(h.i); return; } }
    const lcx=OX-210, lcy=OY+105-75.5; if (SHOW_MERCH && Math.abs(lx-lcx)<=13 && Math.abs(ly-lcy)<=13){ openLogo(); return; } }
  { const lx=e.clientX/S, ly=e.clientY/S;
    if (boardHit && lx>=boardHit.x0 && lx<=boardHit.x1 && ly>=boardHit.y0 && ly<=boardHit.y1){ openBoard(); return; }
    for (const h of cupHits){ if (lx>=h.x0-2&&lx<=h.x1+2&&ly>=h.y0-3&&ly<=h.y1+2){ cupClick(h.gx); return; } }
    for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id) { openPlayerMenu(h.id, e.clientX, e.clientY); return; } if (me.h){ doAction('sip'); return; } break; } } }
  /* the whole bar counter (top, front and a little margin) counts as tapping that spot's cup: walk to the stool and open the menu */
  if (curRoom==='lounge'){ for (let dh=-4; dh<=28; dh+=2) for (const dx of [0,-4,4]){ const [bx,by]=toGrid(e.clientX+dx*S, e.clientY+dh*S); if (by===1 && bx>=0 && bx<=6){ cupClick(bx); return; } } }
  { const lx=e.clientX/S, ly=e.clientY/S; for (let i=0;i<TABLES.length;i++){ const [tx,ty]=P(TABLES[i].gx+0.5,TABLES[i].gy+0.5); if (Math.abs(lx-tx)<=14 && ly>=ty-24 && ly<=ty+5){ tableClick(i); return; } } }
  { const lx=e.clientX/S, ly=e.clientY/S; const [tx,ty]=P(0.5,6.5);
    if (Math.abs(lx-tx)<=10 && ly>=ty-34 && ly<=ty+4){ if(near(0,6)) doAction('lamp'); else { const t=nearestFree(0,6); if(t) walkTo(t[0],t[1],'lamp'); } return; } }
  { const lx=e.clientX/S, ly=e.clientY/S; const [rx,ry]=P(7.04,0.5); if (Math.abs(lx-rx)<=11 && ly>=ry-26 && ly<=ry+6){ ropeClick(); return; } }
  // the door sits on the wall, outside the floor grid, so check it before the grid bounds
  const [gx,gy] = toGrid(e.clientX, e.clientY);
  if (gx<0||gy<0||gx>=N||gy>=NY) return;
  if (gx===7 && gy===0){ ropeClick(); return; }
  if ((gx===ARC_X||gx===JUKE_X) && gy===0){ const act = gx===ARC_X?'arcade':'juke'; if(near(gx,0)) doAction(act); else { const t=nearestFree(gx,0); if(t) walkTo(t[0],t[1],act); } return; }
  if (gx===0 && gy===6){ if(near(0,6)) doAction('lamp'); else { const t=nearestFree(0,6); if(t) walkTo(t[0],t[1],'lamp'); } return; }
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const s of SEATS){ const d=Math.abs(s.gx-gx)+Math.abs(s.gy-gy); if(d<=1 && d<bd){ bd=d; best=s; } }
  if (best) walkTo(best.gx,best.gy);
});
cv.addEventListener('pointerdown', ()=>{ userTap=false; });   // runs after the tap handler above
cv.addEventListener('pointermove', e => { if (arcade.on && arcade.ptr!==null) arcade.ptr = e.clientX/S; });
const endPtr = () => { arcade.ptr=null; arcade.jumpHeld=false; };
cv.addEventListener('contextmenu', e=>e.preventDefault());   /* a long press (holding furniture) shouldn't pop up the phone's menu */
cv.addEventListener('pointerup', endPtr); cv.addEventListener('pointercancel', endPtr);
const KEYMAP = {ArrowUp:'up',KeyW:'up',ArrowDown:'down',KeyS:'down',ArrowLeft:'left',KeyA:'left',ArrowRight:'right',KeyD:'right'};
let navArrow=false;
function navKey(k){
  if (pick.style.display==='flex'){ const i=CHAR_IDS.indexOf(sel); if(k==='left') setSel(CHAR_IDS[(i+CHAR_IDS.length-1)%CHAR_IDS.length]); if(k==='right') setSel(CHAR_IDS[(i+1)%CHAR_IDS.length]); return true; }
  if (curMenu){ if(k==='up') setMenu(menuIdx-1); if(k==='down') setMenu(menuIdx+1); return true; }
  if (logbox.style.display==='block'){ if(k==='up') logbox.scrollTop-=40; if(k==='down') logbox.scrollTop+=40; return true; }
  if (joined && navArrow && (k==='left'||k==='right') && camArrSt && camArrSt!=='off' && !uiOpen()){ camSlide(k==='left'?-1:1); return true; }   /* arrow keys slide the camera like the on-screen arrows */
  return false;
}
function pressA(){
  ensureAudio();
  if (pick.style.display==='flex'){ enter(); return; }
  if (curMenu){ menuAct(items(curMenu)[menuIdx]); return; }
  if (logbox.style.display==='block'){ closeAll(); return; }
  if (arcade.on){ arcadePressA(); return; }
  doAction();
}
document.getElementById('abtn').addEventListener('click', ()=>pressA());
addEventListener('keydown', e => {
  const ae=document.activeElement;
  if (ae===chatin){ if(e.key==='Escape') chatin.blur(); return; }
  if (ae && (/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) || ae.isContentEditable)) return;   /* typing in any box (bug report, notes, search...) never moves your llama or starts a game */
  if (typeof bxMe==='function' && bxMe() && BXS.s && BXS.s.phase!=='over'){ const mk={KeyA:'jab',KeyS:'hook',KeyD:'block',KeyF:'dodge',KeyJ:'jab',KeyK:'hook',KeyL:'block',Semicolon:'dodge'}[e.code]; if (mk){ e.preventDefault(); if (!e.repeat) bxPick(mk); return; } if (/^(Arrow|Space|Key)/.test(e.code)) { e.preventDefault(); return; } }
  if (ae===pname) return;
  const k=KEYMAP[e.code];
  if (k){ e.preventDefault(); if (arcade.on){ if(arcadeNav(k)) return; if(k==='up' && !e.repeat) dashJump(); keys.add(k); return; } navArrow=e.code.startsWith('Arrow'); if(navKey(k)) return; return; }   /* walking is tap/click only; arrows still move through menus and arcade games */
  if (e.key==='Enter'){ e.preventDefault(); if(pick.style.display==='flex'||uiOpen()||arcade.on) pressA(); else chatin.focus(); return; }
  if (e.code==='Space'||e.code==='KeyZ'){ e.preventDefault(); if (!e.repeat && !(curRoom==='arena' && context()==='arena')) pressA(); return; }   /* the Spit Arena only opens with a click */
  if (e.code==='KeyX'||e.key==='Escape'){ e.preventDefault(); if(arcade.on) arcadeBack(); else if(uiOpen()&&pick.style.display!=='flex') closeAll(); return; }
  if (e.code==='KeyM'){ e.preventDefault(); openMenu(); return; }
  if (e.code==='KeyI' && joined){ e.preventDefault(); if ($id('wardbox').style.display==='block') closeAll(); else openWardrobe(bagTab()); return; }
  const n = parseInt(e.key,10); if (n>=1 && n<=9 && joined && !arcade.on){ emote(EMOTES[n-1]); return; }
  if (e.code==='KeyQ' && joined && !arcade.on){ e.preventDefault(); spitAuto(); return; }
  if (e.code==='KeyF' && joined && !arcade.on){ e.preventDefault(); doAction('flip'); return; }
});
addEventListener('keyup', e => { const k=KEYMAP[e.code]; if(k) keys.delete(k); if(e.code==='Space'||e.code==='KeyZ') arcade.jumpHeld=false; });
addEventListener('blur', () => keys.clear());

// ======================= RENDER =======================
const ctx = cv.getContext('2d');
const uctx = ui.getContext('2d'); uctx.__pf = true;
const EMO_BMP = {
  heart:{c:'#f84848', r:HEART},
  bang:{c:'#f84848', r:['...X...','...X...','...X...','...X...','.......','...X...']},
  huh:{c:'#3858a8', r:['.XXXX..','X....X.','....X..','...X...','.......','...X...']},
  note:{c:'#b058e0', r:['...XX..','...X.X.','...X...','.XXX...','XXXX...','.XX....']},
  lol:{c:'#f8a030', r:['X.....X','.X...X.','X.....X','.......','XXXXXXX','.XXXXX.']},
  zzz:{c:'#3858a8', r:['XXXX...','..X....','.X.XXX.','XXXX.X.','....X..','....XXX']},
  wave:{c:'#c87838', r:['X.X.X..','X.X.X.X','XXXXX.X','XXXXXXX','.XXXXX.','..XXX..']},
  flex:{c:'#f84848', r:['..XX...','.X..X..','.X..XX.','XX...XX','XXXXXXX','.XXXXX.']},
  palm:{c:'#3858a8', r:['XX...XX','.......','.......','..XXX..','.......','.......']},
};
// emote balloons over a llama use the menu's 12 x 12 pixel icons, drawn once into small canvases
const EMO_ICON={heart:'heart', bang:'em_wow', huh:'em_huh', note:'music', lol:'em_lol', zzz:'em_zzz', wave:'hand', flex:'muscle', palm:'em_palm'};
const PIXC={};
function pixCanvas(name){ if (PIXC[name]) return PIXC[name]; const rows=(PIXSRC[name]||PIXSRC.star).split('/'), c=document.createElement('canvas'); c.width=rows[0].length; c.height=rows.length; const m=c.getContext('2d');
  rows.forEach((r,j)=>{ for (let i=0;i<r.length;i++){ const col=PIXPAL[r[i]]; if (!col) continue; m.fillStyle=col; m.fillRect(i,j,1,1); } }); return PIXC[name]=c; }
const DANCE_DIRS=['fr','fl','bl','br'];
function drawWaveIcon(x, y, t){
  // a little outlined hand that rocks side to side, with motion lines
  const ph = Math.floor(t*5)%2, sh = ph ? -1 : 1; const fill=new Set(); const add=(a,b)=>fill.add(a+','+b);
  for (let a=4;a<=8;a++) for (let b=5;b<=7;b++) add(a,b);             // palm
  for (const fx of [4,6,8]) for (let b=1;b<=4;b++) add(fx + (b<2?sh:0), b);  // fingers (tips lean)
  add(5,4); add(7,4);                                                    // fill between fingers at the base
  add(3,5); add(2,4+(ph?0:1));                                           // thumb
  add(5,8); add(6,8); add(7,8);                                          // wrist
  g.fillStyle=INK; for (const k of fill){ const [a,b]=k.split(',').map(Number); for (const [da,db] of [[1,0],[-1,0],[0,1],[0,-1]]){ if(!fill.has((a+da)+','+(b+db))) g.fillRect(x+a+da,y+b+db,1,1); } }
  for (const k of fill){ const [a,b]=k.split(',').map(Number); g.fillStyle = (a===4||b<=1) ? '#f8e0c0' : '#f0b878'; g.fillRect(x+a,y+b,1,1); }
  g.fillStyle='#c87838'; g.fillRect(x+5,y+6,3,1);
  g.fillStyle='#3858a8'; if (ph){ g.fillRect(x+11,y+2,1,1); g.fillRect(x+12,y+3,1,2); g.fillRect(x+11,y+5,1,1); } else { g.fillRect(x,y+2,1,1); g.fillRect(x-1+0,y+3,1,2); g.fillRect(x,y+5,1,1); }
}
const FLIP_T=700;
// bartender bottle: held up while walking, tipped sideways to pour when standing still
const BOTTLE_UP=['.KCCK.','.KGGK.','.KGGK.','KKGGKK','KLGGGK','KLWWGK','KLWWGK','KGWWGK','KGGGGK','.KKKK.'];
const BOTTLE_POUR=['.KKKKKKK....','KLLLLLLGKKKK','KGWWWWGGGGGC','KGWWWWGGKKKK','.KKKKKKK....'];
const BOTTLE_COLS=['#48a048','#c87830','#5878d8','#c03070'];
function drawBottle(o, x0, y0, oy, dir, walking, t){
  const flip = (dir==='fl'||dir==='bl');
  const seed = Math.abs(Math.round((o.x*13+o.y*7)))%4;
  const PAL = {K:INK, G:BOTTLE_COLS[seed], L:'#f8f8f8', W:'#f8f0d0', C:'#d8a868'};
  const ph = ((t*0.42) + seed*0.25) % 1;
  const pouring = !walking && ph>0.35 && ph<0.8;
  const draw = (rows, bx, by) => { rows.forEach((r,j)=>{ for (let i=0;i<r.length;i++){ const ch = r[flip ? r.length-1-i : i]; if (ch==='.') continue; g.fillStyle=PAL[ch]; g.fillRect(bx+i, by+j, 1, 1); } }); };
  if (pouring){
    const w=BOTTLE_POUR[0].length; const bx = flip ? x0+4-w+6 : x0+16, by = y0+17+oy;
    draw(BOTTLE_POUR, bx, by);
    const sx = flip ? bx-1 : bx+w; const k=Math.floor(t*14)%3;
    g.fillStyle=PAL.G; for (let y=0; y<7; y++){ if ((y+k)%3===2) continue; g.fillRect(sx, by+3+y, 1, 1); }
  } else {
    const bx = flip ? x0+3 : x0+19, by = y0+(walking?14:13)+oy+(walking&&Math.floor(t*6)%2?1:0);
    draw(BOTTLE_UP, bx, by);
  }
}
/* sitting, facing the camera: two legs hang over the front of the seat, bent at the knee, hooves swinging a little.
   Drawn after the seat's front edge so they hang in front of it. Short seats (cushions, hay) get folded legs. */
// the crystal statue's llama: the normal llama drawing, recoloured into ice-blue crystal (made once, then reused)
let crystalCv=null;
function crystalLlama(){ if (crystalCv) return crystalCv; const src=sprite('twotone','fr',0,'stand',{}), c=document.createElement('canvas'); c.width=SW; c.height=SH; const x=c.getContext('2d'); x.drawImage(src,0,0);
  const im=x.getImageData(0,0,SW,SH), d=im.data, PAL=[[90,110,180],[120,180,232],[168,220,248],[214,242,255],[255,255,255]];
  for (let i=0;i<d.length;i+=4){ if (!d[i+3]) continue; const L=(d[i]*0.3+d[i+1]*0.59+d[i+2]*0.11), px=(i/4)%SW, py=Math.floor(i/4/SW);
    let k = L<45 ? 0 : L<110 ? 1 : L<170 ? 2 : 3; if (k>0 && (px+py)%7===0) k=Math.min(4,k+1);   // diagonal glints
    [d[i],d[i+1],d[i+2]]=PAL[k]; d[i+3]=k===0?255:235; }
  x.putImageData(im,0,0); crystalCv=c; return c; }
function drawSitLegs(L, t){ const ch=CHARS[L.c]||CHARS.twotone, flip=L.dir==='fl', X=L.x, Y=L.y, len=Math.max(2,Math.min(8,L.lift-1));
  const furAt=(x,y)=>{ if (ch.check) return ((((x>>1)+(y>>1))&1) ? ch.fur.b : ch.fur.a); if (ch.split) return x<14 ? ch.fur.a : ch.fur.b; return ch.fur.a; };
  const SHO = L.W.legs && ITEMS[L.W.legs] ? ITEMS[L.W.legs] : null;
  const px=(x,y,col)=>{ g.fillStyle=col; g.fillRect(X+(flip?SW-1-x:x), Y+y, 1, 1); };
  const sw=Math.sin(t*2.6+L.seed*1.7);
  for (const [hx,ph] of [[9,1],[16,-1]]){ const kick=Math.round(sw*ph*1.2);   // the two legs swing opposite ways
    const rows=[[40,hx,3],[41,hx,4],[42,hx+1,3]];                                   // thigh coming forward, a rounded knee
    for (let k=0;k<len-1;k++){ const lean=Math.floor((k+1)/3), off = k>=len-3 ? kick : 0; rows.push([43+k, hx+1+lean+off, 3]); }   // shin angled toward the way it faces
    { const pr=rows[rows.length-1]; rows.push([43+len-1, pr[1], 4]); }              // hoof, a little wider than the shin
    for (const [y,x0,w] of rows){ px(x0-1,y,OUT); px(x0+w,y,OUT); }
    { const [y,x0,w]=rows[rows.length-1]; for (let x=x0-1;x<=x0+w;x++) px(x,y+1,OUT); }
    rows.forEach(([y,x0,w],i)=>{ const last=i===rows.length-1; for (let x=x0;x<x0+w;x++){ let col;
      if (last) col = x===x0+3 ? '#4a3428' : HOOF; else if (SHO && y<=41) col = x===x0 ? SHO.cuff : SHO.c[x>=x0+2?1:0]; else { const P2=furAt(x,y); col = x===x0+w-1 ? P2[1] : (x===x0 && y<43 ? P2[2] : P2[0]); }
      px(x,y,col); } });
    px(hx+1,39,OUT); }   // crease where the leg meets the body
}
function drawLlama(o, t, isMe){
  o._legs = null;
  let WR = isMe ? me.w : o.w;   // what they're wearing
  const BXL = curRoom==='gym' ? boxLook(o, isMe) : null; if (BXL) WR = BXL.W;   // in the ring: corner gloves and shorts
  if (WR && WR.hands && o.p!=='bar' && (isMe ? me.h : o.h)) WR = {...WR, hold:1};   // holding food or a drink: that glove rides on the lifting hoof instead
  const [sx0,sy0] = P(o.x,o.y); const sx=Math.round(sx0)+(BXL?BXL.dx:0), sy=Math.round(sy0)+(BXL?BXL.dy:0);
  const seat = (o.p==='sit') ? seatAt(Math.floor(o.x),Math.floor(o.y)) : null;
  const lift = seat ? seat.lift : ringLift(o.x,o.y);
  const walking = isMe ? me.moving : o.walking;
  const dancing = o.p==='dance' && !walking;
  if (!seat) ellPx(sx, sy-lift, 8, 3, 'rgba(24,16,40,0.28)');   // soft see-through shadow on any floor
  let fr = walking ? Math.floor((o.anim||0)*6.5)%4 : 0, dir=BXL ? BXL.dir : o.d;
  let hop = 0;
  if (dancing){ const a=(o.anim||0); dir = DANCE_DIRS[Math.floor(a*2.5)%4]; fr = Math.floor(a*8)%4; hop = (Math.floor(a*5)%2)?2:0; }
  const bartending = o.p==='bar', wiping = o.p==='wipe'; const pose = (dancing||bartending||wiping) ? 'stand' : ((BXL && BXL.pose) || o.p);
  if (wiping) RAGS.push([o.x, o.y, isMe ? me.moving : !!o.walking]);
  const x0 = sx-14, y0 = sy-45-lift-hop;
  const fl = (isMe?me.flinch:o.flinch)||0; const jit = performance.now()<fl ? (Math.floor(t*30)%2?1:-1) : 0;
  const su=((isMe?me.sipStart:o.sipStart)!=null)?(performance.now()-(isMe?me.sipStart:o.sipStart))/SIP_T:2; const gulp=((isMe?me.h:o.h) && su>=0.3 && su<=0.8 && Math.floor(su*12)%2)?1:0;
  const fe = performance.now()-((isMe?me.flipStart:o.flipStart)||-9999);
  if (fe>=0 && fe<FLIP_T){ const u=fe/FLIP_T; const jump=Math.round(Math.sin(u*Math.PI)*20); const rot=Math.min(3,Math.floor(u*4.4));
    g.save(); g.translate(x0+14, y0+23-jump); g.rotate(rot*Math.PI/2*((dir==='fl'||dir==='bl')?-1:1)); g.drawImage(sprite(o.c, dir, 1, 'stand', WR), -14, -23); g.restore();
    if (u>0.15 && u<0.85){ g.fillStyle='#f8f8f8'; g.fillRect(x0+14+Math.round(Math.cos(u*12)*14), y0+20-jump+Math.round(Math.sin(u*12)*10), 2, 2); } }
  else {
    if (fe>=FLIP_T && fe<FLIP_T+350){ const k=(fe-FLIP_T)/350; g.fillStyle=k<0.5?'#f8f070':'#f8f8f8'; for(let a=0;a<6;a++){ const r=4+k*10; g.fillRect(x0+14+Math.round(Math.cos(a*1.05)*r), y0+44+Math.round(Math.sin(a*1.05)*r*0.4), 2, 1); } }
    if (seat && seat.dunk){ const dp=dunkDepth(); dunkClip(sy-21, ()=>g.drawImage(sprite(o.c, dir, fr, pose, WR), x0+jit, y0-gulp+dp)); if (dp>0) dunkSplash(sx, sy-21, t); }
    else if (seat && seat.bed){ const B2=seat.bed, [bx,by]=P(B2.cx+B2.hx*0.62, B2.cy+B2.hy*0.62, 12); const X=Math.round(bx), Y=Math.round(by);   // in bed: tucked under the quilt, just the head resting on the pillow
      const spr=sprite(o.c, B2.headLeft?'fr':'fl', 0, 'stand', WR), HH=25; g.drawImage(spr, 0, 0, 28, HH, X-14, Y-HH, 28, HH);
      if (!o.leaving) llamaHits.push({id: isMe?null:o.id, x0:X-12, x1:X+12, y0:Y-HH, y1:Y});
      if (Math.floor(t*0.8)%3===0) pfDraw(g,'z',X+(B2.headLeft?12:-16),Y-HH-2-Math.floor(t*2)%3,'#e8ecff',1);
      return [X, Y-HH-2]; }
    else { g.drawImage(sprite(o.c, dir, fr, pose, WR), x0+jit, y0-gulp); o._legs = (o.p==='sit' && seat && !seat.dunk && dir[0]==='f') ? {x:x0+jit, y:y0-gulp, dir, c:o.c, W:WR||{}, lift, seed:(o.n||'').length} : null; } }
  if (jit){ g.fillStyle='#a8e0f8'; g.fillRect(x0+22,y0+6,2,3); g.fillStyle='#f8f8f8'; g.fillRect(x0+22,y0+6,1,1); }
  if (!o.leaving) llamaHits.push({id: isMe?null:o.id, x0:x0+4, x1:x0+24, y0:y0, y1:y0+46});
  const oy = pose==='sit'?6:((walking||dancing)&&(fr===1||fr===3)?1:0);
  const front=dir[0]==='f', flip=(dir==='fl'||dir==='bl');
  if (o.c==='twotone'){
    const ph=((t*0.8)+((o.x*7+o.y*3)%1))%1;
    if (ph<0.3){ const gxp = front ? (flip?19:8) : (flip?9:18); const px=x0+(flip?SW-1-gxp:gxp), py=y0+10+oy; const r=ph<0.15?1:2;
      g.fillStyle='#f8f8f8'; g.fillRect(px,py,1,1); g.fillRect(px-r,py,r,1); g.fillRect(px+1,py,r,1); g.fillRect(px,py-r,1,r); g.fillRect(px,py+1,1,r); }
  } else if (o.c==='poophat'){
    const cx=x0+14, top=y0+oy;
    for (let i=0;i<3;i++){ const a=t*3.2+i*2.1; const fx=Math.round(cx+Math.cos(a)*12), fy=Math.round(top+4+Math.sin(a*1.7)*5); g.fillStyle=INK; g.fillRect(fx,fy,2,1); if(Math.floor(t*20+i)%2){ g.fillStyle='#f8f8f8'; g.fillRect(fx,fy-1,1,1);} }
    g.fillStyle='#78a838';
    for (let i=0;i<3;i++) for (let k=0;k<5;k+=1){ if((k+Math.floor(t*6))%2) continue; g.fillRect(cx-6+i*6+Math.round(Math.sin(t*4+k+i)), top-2-k, 1, 1); }
  }
  // held drink (raise, tilt back + gulp, lower)
  const h = bartending ? null : (isMe ? me.h : o.h);
  if (bartending) drawBottle(o, x0, y0, oy, dir, walking, t);
  if (h){
    const ss = isMe ? me.sipStart : o.sipStart; const u = (performance.now()-ss)/SIP_T;
    const sipping = u>=0 && u<1;
    const hand = [flip?1:22, 31+oy];
    const mouth = front ? [flip?5:19, 15+oy] : [flip?3:21, 11+oy];
    // ease up to the mouth, hold for the sip, ease back down
    const ease=v=>v<=0?0:v>=1?1:v*v*(3-2*v);
    const p = !sipping ? 0 : u<0.06 ? 0 : u<0.3 ? ease((u-0.06)/0.24) : u<0.66 ? 1 : u<0.9 ? 1-ease((u-0.66)/0.24) : 0;
    const hx = Math.round(hand[0]+(mouth[0]-hand[0])*p), hy = Math.round(hand[1]+(mouth[1]-hand[1])*p);
    const tilt = p>0.75 ? ((front&&!flip)||(!front&&!flip) ? -1 : 1) : 0;
    const X=x0+hx, Y=y0+hy, col=DRINKS[h].c; const lvl = Math.max(1, Math.ceil((isMe ? (me.hl||SIPS) : (o.hl||SIPS))*5/SIPS));   /* the cup or snack art has 5 levels; spread the sips across them */
    // the front leg holding it: from the shoulder to the hoof, so it lifts with the food or drink
    { const C2=CHARS[o.c]||CHARS[isMe?me.c:o.c]||{}, fur=(C2.fur&&C2.fur.a)||['#efe1c8','#c6b08d'], sh = [hand[0]<12 ? 6 : 17, (front?25:24)+oy];   // shoulder on the same side as the hoof
      const ax=x0+sh[0], ay=y0+sh[1], bx=X+(FOOD_PX[h] ? (flip?1:2) : (flip?3:0)), by=Y+(FOOD_PX[h]?2:3);
      // a rounded leg (outline, fur, a darker underside), drawn like PENNY's arm in the store, so it moves smoothly instead of in jagged steps
      { const n=Math.max(6, Math.ceil(Math.hypot(bx-ax,by-ay))*2), seg=(r,col,ox=0,oy2=0)=>{ for (let k=0;k<=n;k++){ ellPx(ax+0.5+ox+(bx-ax)*k/n, ay+0.5+oy2+(by-ay)*k/n, r, r, col); } };
        seg(2.5,INK); seg(1.55,fur[1]||fur[0],0,0.5); seg(1.1,fur[0],-0.3,-0.2); }
      g.fillStyle=INK; g.fillRect(bx-1,by,4,3); g.fillStyle='#3a2a1a'; g.fillRect(bx,by+1,2,1);
      { const GW=(isMe?me.w:o.w)||{}, GI=GW.hands&&ITEMS[GW.hands]; if (GI){ g.fillStyle=INK; g.fillRect(bx-2,by-1,6,5); g.fillStyle=GI.c[0]; g.fillRect(bx-1,by,4,3); g.fillStyle=GI.c[2]; g.fillRect(bx-1,by,1,1); g.fillStyle=GI.cuff; g.fillRect(bx-1,by-1,4,1); } } }
    if (FOOD_PX[h]){ const rows=FOOD_PX[h], H=rows.length, keep=Math.max(2,Math.round(H*lvl/5)), bx=X+(flip?-2:0), by=Y+6-H;
      rows.forEach((row,j)=>{ if (j<H-keep) return; for (let i=0;i<row.length;i++){ const ch=row[i]; if (ch==='.') continue; g.fillStyle=FOOD_PAL[ch]; g.fillRect(bx+i,by+j,1,1); } });
      if (keep<H){ g.fillStyle=INK; g.fillRect(bx+1,by+H-keep,rows[0].length-2,1); }
      if (sipping && u>=0.3 && u<=0.8 && Math.floor(u*20)%2){ g.fillStyle='#f8f0d8'; g.fillRect(X+(flip?-3:6),Y-2,1,1); g.fillRect(X+(flip?-4:7),Y,1,1); }
    } else {
    // cup body drawn column by column so it can lean while drinking
    for (let c2=-1;c2<=4;c2++){ const lean = tilt ? Math.round((c2-1.5)*tilt*0.5) : 0;
      g.fillStyle=INK; g.fillRect(X+c2, Y-1+lean, 1, 7);
      if (c2>=0 && c2<=3){ g.fillStyle='#e8f0f8'; g.fillRect(X+c2, Y+lean, 1, 5); const fill=Math.round(lvl*0.8); g.fillStyle=col; g.fillRect(X+c2, Y+5-fill+lean, 1, fill); if(c2===0){ g.fillStyle='#f8f8f8'; g.fillRect(X, Y+lean, 1, 2); } } }
    g.fillStyle=INK; g.fillRect(X+(flip?-3:5), Y+1, 2, 3); g.fillStyle='#e8f0f8'; g.fillRect(X+(flip?-2:5), Y+2, 1, 1);
    if (!sipping){ g.fillStyle=INK; g.fillRect(X+2,Y-4,1,4); g.fillStyle='#f8f8f8'; g.fillRect(X+3,Y-4,1,1); }
    if (sipping && u>=0.3 && u<=0.8){ const k=Math.floor((u-0.3)*16); g.fillStyle='#f8f8f8'; for(let b=0;b<2;b++){ const by=Y-3-((k+b*3)%6); g.fillRect(X+(front?(flip?-2:6):(flip?6:-2))+b, by, 1, 1); } }
    }
  }
  // balloon: emote beats chat dots
  const em = isMe ? me.emote : o.emote, playing = isMe ? (arcade.on || (typeof AR!=='undefined' && AR.on) || (typeof BW!=='undefined' && BW.on)) : (o.a==='arcade' || o.a==='arena' || o.a==='bowl');
  if (em && EMO_ICON[em.t]){ const bx=sx-3, by=y0+oy-29, bounce=Math.floor(t*4)%2, sway = em.t==='wave' ? (Math.floor(t*5)%2 ? -1 : 1) : 0; const ic=pixCanvas(EMO_ICON[em.t]);   /* emotes float on their own, no speech bubble */
    g.drawImage(ic, bx-4+Math.floor((18-ic.width)/2)+sway, by+3+Math.floor((18-ic.height)/2)-bounce); }
  else if (em || playing){ const bx=sx-3, by=y0+oy-29; g.fillStyle=INK; g.fillRect(bx+1,by,18,20); g.fillRect(bx,by+1,20,18); g.fillRect(bx+1,by+19,4,3); g.fillRect(bx,by+22,2,1);   // rounded speech bubble beside the head, tail pointing back at the llama
    g.fillStyle='#ffffff'; g.fillRect(bx+1,by+1,18,18); g.fillRect(bx+2,by+19,2,2); g.fillStyle='#e6e0f2'; g.fillRect(bx+1,by+18,18,1);
    if (em && EMO_ICON[em.t]){ const bounce=Math.floor(t*4)%2, sway = em.t==='wave' ? (Math.floor(t*5)%2 ? -1 : 1) : 0; const ic=pixCanvas(EMO_ICON[em.t]); g.drawImage(ic, bx+1+Math.floor((18-ic.width)/2)+sway, by+1+Math.floor((18-ic.height)/2)-bounce); }   /* centred whatever the icon's size */   // the same pixel icons as the EMOTES menu
    else if (em){ const E=EMO_BMP[em.t]; bmp(E.r, bx+5, by+4, E.c); }
    else if (playing){ g.fillStyle=INK; g.fillRect(bx+4,by+5,10,5); g.fillStyle='#f84848'; g.fillRect(bx+11,by+6,1,1); g.fillStyle='#f8f8f8'; g.fillRect(bx+5,by+6,1,2); }
  }
  if (dancing && Math.floor(t*3+o.x)%3===0){ g.fillStyle='#b058e0'; g.fillRect(x0-2, y0+12, 2, 2); g.fillRect(x0, y0+7, 1, 6); g.fillRect(x0+1, y0+7, 2, 1); }
  return [sx, y0+oy-2, !!(em||playing)];
}
// ---- pixel wall signs (part of the room, so pop-ups cover them) ----
const SIGNS = {};
function signImg(text, col, shadow){
  const m=document.createElement('canvas'); const mc=m.getContext('2d'); mc.font="8px 'Press Start 2P', monospace";
  const w=Math.ceil(mc.measureText(text).width)+2; m.width=w; m.height=11; mc.font="8px 'Press Start 2P', monospace"; mc.textBaseline='top';
  mc.fillStyle='#fff'; mc.fillText(text,0,1);
  const src=mc.getImageData(0,0,w,11).data; const out=document.createElement('canvas'); out.width=w; out.height=11; const oc=out.getContext('2d');
  const on=(x,y)=> x>=0&&y>=0&&x<w&&y<11 && src[(y*w+x)*4+3]>110;
  for (let y=0;y<11;y++) for (let x=0;x<w;x++){ if(on(x,y)){ oc.fillStyle=col; oc.fillRect(x,y,1,1); } else if(shadow && on(x-1,y-1)){ oc.fillStyle=shadow; oc.fillRect(x,y,1,1); } }
  return out;
}
function buildSigns(){

  { const t=signImg('BAR','#f8d030',null); const w=3*9+7, h=16; const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
    x.fillStyle=INK; x.fillRect(0,0,w,h); x.fillStyle='#f8d030'; x.fillRect(1,1,w-2,h-2); x.fillStyle='#382878'; x.fillRect(2,2,w-4,h-4);
    SIGNS.bar=c;
    const GL={B:['XXXXX.','XX..XX','XX..XX','XXXXX.','XX..XX','XX..XX','XXXXX.'],A:['.XXXX.','XX..XX','XX..XX','XXXXXX','XX..XX','XX..XX','XX..XX'],R:['XXXXX.','XX..XX','XX..XX','XXXXX.','XX.XX.','XX..XX','XX..XX']};
    SIGNS.barL=['B','A','R'].map(ch=>{ const cc=document.createElement('canvas'); cc.width=7; cc.height=8; const x=cc.getContext('2d');
      GL[ch].forEach((r,j)=>{ for(let i=0;i<6;i++) if(r[i]==='X'){ x.fillStyle=INK; x.fillRect(i+1,j+1,1,1);} });
      GL[ch].forEach((r,j)=>{ for(let i=0;i<6;i++) if(r[i]==='X'){ x.fillStyle=(j<2)?'#f8f070':'#f8d030'; x.fillRect(i,j,1,1);} });
      return cc; }); }

  { const GL={D:['XXXX..','XX.XX.','XX..XX','XX..XX','XX..XX','XX.XX.','XXXX..'],A:['.XXXX.','XX..XX','XX..XX','XXXXXX','XX..XX','XX..XX','XX..XX'],N:['XX..XX','XXX.XX','XXXXXX','XX.XXX','XX..XX','XX..XX','XX..XX'],C:['.XXXX.','XX..XX','XX....','XX....','XX....','XX..XX','.XXXX.'],E:['XXXXXX','XX....','XX....','XXXXX.','XX....','XX....','XXXXXX']};
    const mk=(ch,c1,c2)=>{ const cc=document.createElement('canvas'); cc.width=7; cc.height=8; const x=cc.getContext('2d');
      GL[ch].forEach((r,j)=>{ for(let i=0;i<6;i++) if(r[i]==='X'){ x.fillStyle=INK; x.fillRect(i+1,j+1,1,1);} });
      GL[ch].forEach((r,j)=>{ for(let i=0;i<6;i++) if(r[i]==='X'){ x.fillStyle=(j<2)?c2:c1; x.fillRect(i,j,1,1);} }); return cc; };
    SIGNS.danceOn='DANCE'.split('').map(ch=>mk(ch,'#f85888','#f8b8d8')); SIGNS.danceOff='DANCE'.split('').map(ch=>mk(ch,'#8a6ab8','#a890d8'));
    const w=5*9+7, h=16; const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
    x.fillStyle=INK; x.fillRect(0,0,w,h); x.fillStyle='#f85888'; x.fillRect(1,1,w-2,h-2); x.fillStyle='#382878'; x.fillRect(2,2,w-4,h-4); SIGNS.dancePlq=c; }
  SIGNS.dance=[signImg('DANCE','#f85888',INK), signImg('DANCE','#a890e0',INK)];
}
function wallText(img, wx, wy, slope){ for (let x=0;x<img.width;x++){ const dy=Math.round(x*slope); g.drawImage(img, x,0,1,img.height, OX+wx+x, OY+wy+dy-img.height, 1, img.height); } }
// small plate with pixel text, laid flat on a wall (slope 0.5 back wall, -0.5 left wall); h is the plate's bottom height above the floor
const plateCache={};
function plateImg(text, fg, bgc, rim){ const k=text+fg+bgc+rim; if (plateCache[k]) return plateCache[k]; const w=pfW(text)+10, h=11; const c=document.createElement('canvas'); c.width=w; c.height=h; const x=c.getContext('2d');
  x.fillStyle=INK; x.fillRect(1,0,w-2,h); x.fillRect(0,1,w,h-2); x.fillStyle=rim; x.fillRect(1,1,w-2,h-2); x.fillStyle=bgc; x.fillRect(2,2,w-4,h-4); pfDraw(x,text,5,3,fg); return plateCache[k]=c; }
function wallPlate(img, cx, h, sg){ const wx=Math.round(cx-img.width/2); const wy = sg>0 ? Math.round(wx/2-h) : Math.round(-wx/2-h); wallText(img, wx, wy, sg*0.5); }
const marquee = document.createElement('canvas'), dunkSignCv = document.createElement('canvas');
const arenaBoardCv = document.createElement('canvas'), arenaTitleCv = document.createElement('canvas');
const laneMonCv = [0,1,2,3].map(()=>document.createElement('canvas')), lanesTitleCv=document.createElement('canvas');
let laneMonHit = [];
const storeTitleCv=document.createElement('canvas'), storeFurnCv=document.createElement('canvas'), storeClothCv=document.createElement('canvas');
// PENNY the cashier: scans for a few seconds, pauses, and stops to wave when someone walks up to the counter
function clerkState(t){ const custom = curRoom==='store' && joined && STORE_COUNTER.some(([x,y])=>near(x,y)); return { custom, scanning: !custom && (t%4)<2.6 }; }
function drawStoreSigns(t){
  drawShopWall(t);
  { const sc=3, txt='LLAMA STORE', tw=pfW(txt,sc), W=tw+12, H=5*sc+9; if (storeTitleCv.width!==W){ storeTitleCv.width=W; storeTitleCv.height=H; }
    const m=storeTitleCv.getContext('2d'); m.clearRect(0,0,W,H); m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#f85888'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#b83068'; m.fillRect(1,H-3,W-2,2);
    pfDraw(m,txt,7,5,'#7a1838',sc); pfDraw(m,txt,6,4,(Math.floor(t*2)%6===0)?'#ffffff':'#fff4d8',sc); wallPlate(storeTitleCv, 160, 66, 1); }   /* on the wall face, not sticking up over it */
  { if (!storeFurnCv.dataset.ok){ storeFurnCv.dataset.ok=1; const txt='LIMITED RARES', W=pfW(txt,1)+10; storeFurnCv.width=W; storeFurnCv.height=11; const m=storeFurnCv.getContext('2d'); m.fillStyle=INK; m.fillRect(0,0,W,11); m.fillStyle='#e0a418'; m.fillRect(1,1,W-2,9); pfDraw(m,txt,5,3,'#ffffff',1); }
    wallPlate(storeFurnCv, 32, 53, 1); }   /* just above the rares, under the big sign */
  { if (!storeClothCv.dataset.ok){ storeClothCv.dataset.ok=1; const txt='CLOTHING', W=pfW(txt,1)+10; storeClothCv.width=W; storeClothCv.height=11; const m=storeClothCv.getContext('2d'); m.fillStyle=INK; m.fillRect(0,0,W,11); m.fillStyle='#f85888'; m.fillRect(1,1,W-2,9); pfDraw(m,txt,5,3,'#ffffff',1); }
    wallPlate(storeClothCv, 231, 48, 1); }
}
function drawLanesSigns(t){
  { const sc=2, txt='LLAMA LANES', tw=pfW(txt,sc), W=tw+16, H=5*sc+12; if (lanesTitleCv.width!==W){ lanesTitleCv.width=W; lanesTitleCv.height=H; }
    const m=lanesTitleCv.getContext('2d'); m.clearRect(0,0,W,H); m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#ff9a48'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#2a1640'; m.fillRect(3,3,W-6,H-6);
    pfDraw(m,txt,9,7,'#7a3a10',sc); pfDraw(m,txt,8,6,(Math.floor(t*2)%5===0)?'#ffffff':'#ffd23f',sc); wallPlate(lanesTitleCv, -110, 92, -1); }
  laneMonHit = [];
  LANE_GX.forEach((L,i)=>{ const cv=laneMonCv[i], W=46, H=26; if (cv.width!==W){ cv.width=W; cv.height=H; }
    const m=cv.getContext('2d'); m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#4a4058'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#0a0c18'; m.fillRect(2,2,W-4,H-4);
    const who=(typeof BW!=='undefined') ? BW.live.find(q=>q.lane===i) : null;
    pfDraw(m, 'LANE '+(i+1), 4, 4, '#ff9a48');
    if (who){ pfDraw(m, who.n.slice(0,8), 4, 12, '#e8ecff'); const sc=String(who.sc); pfDraw(m, sc, W-4-pfW(sc), 4, '#7ce07c'); pfDraw(m, 'F'+who.f, W-4-pfW('F'+who.f), 12, '#ffd23f'); }
    else pfDraw(m, Math.floor(t*1.5+i)%2 ? 'OPEN' : 'BOWL!', 4, 13, '#5ad0ff');
    const cx=(L+1)*20; wallPlate(cv, cx, 70, 1); const wx=Math.round(cx-W/2), wy=Math.round(wx/2-70); laneMonHit.push({x0:OX+wx, x1:OX+wx+W, y0:OY+wy, y1:OY+wy+H+W/2}); });
}
let arenaBoardHit = null;
function drawArenaSigns(t){
  // title on the left wall
  { const sc=2, tw=pfW('SPIT ARENA',sc), W=tw+16, H=5*sc+12; if (arenaTitleCv.width!==W){ arenaTitleCv.width=W; arenaTitleCv.height=H; }
    const m=arenaTitleCv.getContext('2d'); m.clearRect(0,0,W,H); m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#ff5c8a'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#2a0e30'; m.fillRect(3,3,W-6,H-6);
    const fl = Math.floor(t*3)%7===0; pfDraw(m,'SPIT ARENA',9,7,'#7a1a40',sc); pfDraw(m,'SPIT ARENA',8,6,fl?'#ffffff':'#ff8fb1',sc);
    wallPlate(arenaTitleCv, -125, 92, -1); }
  // live scoreboard on the back wall: the round that's on now, or this week's leaders
  const W=112, H=60; if (arenaBoardCv.width!==W){ arenaBoardCv.width=W; arenaBoardCv.height=H; }
  const m=arenaBoardCv.getContext('2d'); m.clearRect(0,0,W,H);
  m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#5a6070'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#0a0c18'; m.fillRect(3,3,W-6,H-6);
  const AM = (typeof AR!=='undefined') ? AR.live : null, nowS = Date.now() + ((typeof AR!=='undefined')?AR.off:0);
  const live = AM && nowS < AM.t0 + AM.dur + 2500;
  if (live){
    const left = Math.max(0, Math.ceil((AM.t0 + AM.dur - nowS)/1000)), pre = nowS < AM.t0;
    pfDraw(m, pre ? 'STARTING' : 'LIVE', 7, 7, (Math.floor(t*2)%2||pre)?'#ff5c8a':'#ff9cb8');
    pfDraw(m, pre ? String(Math.ceil((AM.t0-nowS)/1000)) : `0:${String(left).padStart(2,'0')}`, W-8-pfW(pre ? String(Math.ceil((AM.t0-nowS)/1000)) : `0:${String(left).padStart(2,'0')}`), 7, '#ffd23f');
    const ps = [...AM.players].sort((a,b)=>b.sc-a.sc).slice(0,4);
    ps.forEach((p,i)=>{ const y=19+i*9; const nm=p.n.slice(0,10); pfDraw(m, `${i+1}`, 7, y, i===0?'#ffd23f':'#8890b0'); pfDraw(m, nm, 16, y, '#e8ecff'); const sc=String(p.sc); pfDraw(m, sc, W-8-pfW(sc), y, '#7ce07c'); });
  } else {
    pfDraw(m, 'THIS WEEK', 7, 7, '#ffd23f');
    const b = (typeof AR!=='undefined' && AR.board) ? AR.board.week : [];
    if (!b.length){ pfDraw(m, 'NO SCORES YET', 7, 22, '#8890b0'); pfDraw(m, 'TAP THE RING', 7, 34, '#ff8fb1'); pfDraw(m, 'TO PLAY!', 7, 43, '#ff8fb1'); }
    b.slice(0,4).forEach((p,i)=>{ const y=19+i*9; pfDraw(m, `${i+1}`, 7, y, i===0?'#ffd23f':'#8890b0'); pfDraw(m, p.n.slice(0,10), 16, y, '#e8ecff'); const sc=String(p.s); pfDraw(m, sc, W-8-pfW(sc), y, '#7ce07c'); });
  }
  // little bulbs along the bottom edge
  { const lit=Math.floor(t*6); for (let x=6, k=0; x<W-6; x+=5, k++){ m.fillStyle=(k+lit)%4===0?'#ffffff':'#ff5c8a'; m.fillRect(x,H-3,2,1); } }
  wallPlate(arenaBoardCv, 150, 82, 1);
  { const wx=Math.round(150-W/2), wy=Math.round(wx/2-82); arenaBoardHit = {x0:OX+wx, x1:OX+wx+W, y0:OY+wy, y1:OY+wy+H+W/2}; }
}
function drawCasinoSigns(t){
  // CASINO marquee on the back wall: dark board, gold letters, a ring of chasing bulbs
  const sc=3, tw=pfW('CASINO',sc), W=tw+20, H=5*sc+14; if (marquee.width!==W){ marquee.width=W; marquee.height=H; }
  const m=marquee.getContext('2d'); m.clearRect(0,0,W,H); m.fillStyle=INK; m.fillRect(0,0,W,H); m.fillStyle='#c09018'; m.fillRect(1,1,W-2,H-2); m.fillStyle='#2a0818'; m.fillRect(3,3,W-6,H-6);
  pfDraw(m,'CASINO',11,8,'#7a5008',sc); pfDraw(m,'CASINO',10,7,(Math.floor(t*2)%6===0)?'#fff0a0':'#f8d030',sc);
  const lit=Math.floor(t*8); let k=0; const bulb=(x,y)=>{ const on=(k++ + lit)%3===0; m.fillStyle=on?'#ffffff':'#f8a830'; m.fillRect(x,y,1,1); };
  for (let x=4;x<W-4;x+=3) bulb(x,4); for (let y=7;y<H-4;y+=3) bulb(W-5,y); for (let x=W-5;x>=4;x-=3) bulb(x,H-5); for (let y=H-8;y>=7;y-=3) bulb(4,y);
  wallPlate(marquee, 130, 52, 1);   /* centred on the back wall */
}
function drawSigns(t){
  if (!SIGNS.bar) return;
  const flick = (Math.sin(t*13)+Math.sin(t*7.3)) > -1.7;
  // left wall: x=-20v, y=10v-h ; right wall: x=20u, y=10u-h
  drawShopWall(t);
  wallText(SIGNS.bar, 55, 27-74, 0.5);
  SIGNS.barL.forEach((im,i)=>{ const lx=4+i*9; g.drawImage(im, OX+55+lx, OY+27-74-16+4+Math.round((lx+3)*0.5)); });
  { const X0=149, WY=74.5-77.5; wallText(SIGNS.dancePlq, X0, WY, 0.5); const L=(jukeOn()&&flick)?SIGNS.danceOn:SIGNS.danceOff; L.forEach((im,i)=>{ const lx=4+i*9; g.drawImage(im, OX+X0+lx, OY+WY-16+4+Math.round((lx+3)*0.5)); }); }
}
buildSigns();
// ---- merch wall (left wall) ----
// The framed shirts and the round logo over the door are taken down for now; set this to true to hang them again.
// While it's false the LLAMA LOUNGE neon sign hangs on that wall instead.
const SHOW_MERCH = false;
const merchHere = () => curRoom==='store' || (curRoom==='lounge' && SHOW_MERCH);   // the LLAMA STORE always has them
const PRODUCTS = [
  {"name": "SMILE CONFUSES THE WOKE", "title": "T-Shirt: Puzzluzz, The 'Smile It Confuses The Woke' Llama", "price": "$38.99", "url": "https://llamalifematters.com/product/t-shirt-puzzluzz-the-smile-it-confuses-the-woke-llama/", "bg": "#f8e8a0", "hi": "/art/f5ecb859cca2.png", "pop": "/art/70c742effb3b.png"},
  {"name": "CANCELLED YOU FIRST", "title": "T-Shirt: KGS, The 'You Can't Cancel Me 'Cause I Cancelled You Before' Llama", "price": "$38.99", "url": "https://llamalifematters.com/product/t-shirt-ksg-the-you-cant-cancel-me-cause-i-cancelled-you-before-llama/", "bg": "#f8b8d8", "hi": "/art/d09fac850501.png", "pop": "/art/3a8851d3993f.png"},
  {"name": "LLAMAS GONE WILD", "title": "T-Shirt: 'Llamas Gone Wild'", "price": "$38.99", "url": "https://llamalifematters.com/product/t-shirt-llamas-gone-wild/", "bg": "#a8d8f8", "hi": "/art/e68309918ac7.png", "pop": "/art/75f410049711.png"},
  {"name": "CANCEL CANCEL CULTURE", "title": "T-Shirt: Cancel Cancel Culture", "price": "$32.99", "url": "https://llamalifematters.com/product/cancel-cancel-tshirt/", "bg": "#f8d030", "hi": "/art/99a8428b626c.png", "pop": "/art/8cb141446312.png"},
  {"name": "GOT WOKE?", "title": "T-Shirt: 'Got Woke?'", "price": "$38.99", "url": "https://llamalifematters.com/product/t-shirt-got-woke/", "bg": "#3890e0", "hi": "/art/5122f5ad1b6f.png", "pop": "/art/9f57b9556027.png"}
];
for (const pr of PRODUCTS){ pr.hi_img=new Image(); pr.hi_img.src=pr.hi; }
const SHIRT_BMP=[
"....XXXX..XXXX....",
"..XXooooXXooooXX..",
".XooooooooooooooX.",
"XooooooooooooooooX",
"XoooXooooooooXoooX",
".XXXXooooooooXXXX.",
"....XooooooooX....",
"....XooooooooX....",
"....XooooooooX....",
"....XooooooooX....",
"....XooooooooX....",
"....XooooooooX....",
"....XXXXXXXXXX...."];
const PRINT_COLS = { metal:['#8e4c26','#8e4c26'], money:['#eedcc2','#eedcc2'], gingham:['#e8303a','#fbeee6'], cancel:['#f0e2cc','#f0e2cc'], twotone:['#e2a93f','#5aa99e'], tweed:['#3f8fd4','#3f8fd4'], poophat:['#efe1c8','#efe1c8'], twotoneb:['#f8d030','#f8d030'], tweedg:['#48c8b8','#48c8b8'] };
function shadeHex(h,k){ const n=parseInt(h.slice(1),16); const r=Math.round(((n>>16)&255)*k), g2=Math.round(((n>>8)&255)*k), b=Math.round((n&255)*k); return '#'+[r,g2,b].map(v=>Math.min(255,v).toString(16).padStart(2,'0')).join(''); }
function shirtImg(pr){
  const c=document.createElement('canvas'); c.width=18; c.height=13; const x=c.getContext('2d');
  const dark=shadeHex(pr.shirt, pr.shirt==='#f8f8f8'?0.82:0.72);
  SHIRT_BMP.forEach((r,j)=>{ for(let i=0;i<r.length;i++){ const ch=r[i]; if(ch==='X'){ x.fillStyle=INK; x.fillRect(i,j,1,1);} else if(ch==='o'){ x.fillStyle = (i>=11&&j>=5)||i>=15 ? dark : pr.shirt; x.fillRect(i,j,1,1);} } });
  // little llama head print
  const [a,b]=PRINT_COLS[pr.print]; const px=7, py=5;
  x.fillStyle=a; x.fillRect(px,py,1,2); x.fillStyle=b; x.fillRect(px+3,py,1,2);
  x.fillStyle=a; x.fillRect(px,py+2,2,3); x.fillStyle=b; x.fillRect(px+2,py+2,2,3);
  x.fillStyle=INK; x.fillRect(px,py+3,1,1); x.fillRect(px+2,py+3,1,1); x.fillStyle='#f8f8f8'; x.fillRect(px+1,py+5,2,1);
  x.fillStyle=pr.shirt==='#f8f8f8'?INK:'#f8f8f8'; x.fillRect(px-1,py+7,6,1);
  return c;
}
const FRAME_V=[1.25,3.1,4.95,6.8,8.65];
const LOGO=new Image(); LOGO.src="/art/c5cb79ed2272.png";
let shopHit=[];
function drawShopWall(t){
  shopHit=[]; if (!merchHere()){ for (const pr of PRODUCTS) pr.at=null; return; }
  { const xc=-210, x0=xc-13, W=27, hTop=92, hBot=59;
    for (let x=x0;x<x0+W;x++){ const base=Math.floor(-x/2); const top=base-hTop, H=hTop-hBot;
      g.fillStyle=INK; g.fillRect(OX+x,OY+top,1,H); if(x===x0||x===x0+W-1) continue;
      g.fillStyle='#c88830'; g.fillRect(OX+x,OY+top+1,1,H-2); if(x===x0+1||x===x0+W-2) continue;
      g.fillStyle='#f8e8b0'; g.fillRect(OX+x,OY+top+2,1,1);
      g.fillStyle='#f8f0d8'; g.fillRect(OX+x,OY+top+3,1,H-6); } }
  PRODUCTS.forEach((pr,i)=>{
    const xc=Math.round(-20*FRAME_V[i]), x0=xc-17, W=35, hTop=88, hBot=36;
    for (let x=x0;x<x0+W;x++){ const base=Math.floor(-x/2); const top=base-hTop, H=hTop-hBot;
      g.fillStyle=INK; g.fillRect(OX+x,OY+top,1,H); if(x===x0||x===x0+W-1) continue;
      g.fillStyle='#c88830'; g.fillRect(OX+x,OY+top+1,1,H-2); if(x===x0+1||x===x0+W-2) continue;
      g.fillStyle='#f8e8b0'; g.fillRect(OX+x,OY+top+2,1,1);
      g.fillStyle=pr.bg; g.fillRect(OX+x,OY+top+3,1,H-6); }
    const baseC=Math.floor(-xc/2);
    pr.at=[OX+xc, OY+baseC-62];
    // twinkle so it looks clickable
    const ph=(t*0.5+i*0.37)%1; if (ph<0.12){ const sx=OX+xc+12, sy=OY+baseC-82; g.fillStyle='#f8f8f8'; g.fillRect(sx,sy,1,1); g.fillRect(sx-1,sy,3,1); g.fillRect(sx,sy-1,1,3); }
    shopHit.push({i, x0:OX+x0, x1:OX+x0+W, y0:OY+Math.floor(-(x0+W)/2)-hTop, y1:OY+Math.floor(-x0/2)-hBot});
  });
}
const DANCE_COLS=['#f85888','#f8d030','#48c8b8','#b058e0','#58b8f8'];
// one lit glass dance tile per colour, drawn once: a raised frame (bright along the back edges, dark along the front),
// the glowing panel, a glossy shine stripe and four little light bulbs
const DTILE={};
function danceTile(col, on){ const key=col+(on?1:0); if (DTILE[key]) return DTILE[key];
  const cv=document.createElement('canvas'); cv.width=41; cv.height=21; const m=cv.getContext('2d'), img=m.createImageData(41,21), D=img.data;
  const base=[parseInt(col.slice(1,3),16),parseInt(col.slice(3,5),16),parseInt(col.slice(5,7),16)];
  for (let py=0; py<21; py++) for (let px=0; px<41; px++){ const wx=px-20, wy=py, u=(wx/20+wy/10)/2, v=(wy/10-wx/20)/2; if (u<0||v<0||u>=1||v>=1) continue;
    let f=1; const rim = u<0.12||v<0.12||u>0.88||v>0.88;
    if (rim) f = (u<0.12||v<0.12) && !(u>0.88||v>0.88) ? 1.2 : 0.7;
    else { const d=Math.hypot(u-0.5,v-0.5); f = on ? 1.04+Math.max(0,0.2-d)*0.8 : 1;
      if (u-v>-0.2 && u-v<0.02 && u+v<1.05) f*=on?1.16:1.1;   // glossy stripe
      for (const [bu,bv] of [[0.3,0.3],[0.7,0.3],[0.3,0.7],[0.7,0.7]]) if (Math.abs(u-bu)<0.045 && Math.abs(v-bv)<0.045) f = on ? 1.45 : 1.18; }
    const i=(py*41+px)*4, c=dshade(base,f); D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; }
  m.putImageData(img,0,0); return DTILE[key]=cv; }
function drawDanceFloor(t){
  const on=jukeOn(); const beat=Math.floor(t*(on?3:0.5));
  for (const k of DANCE){ const gx=k%N, gy=(k/N)|0; const [x,y]=P(gx,gy);
    const c = on ? DANCE_COLS[(gx*3+gy*2+beat)%DANCE_COLS.length] : ((gx+gy)%2?'#504078':'#5a4888');
    const [tx,ty]=P(gx,gy); g.drawImage(danceTile(c, on), Math.round(tx)-20, Math.round(ty)); }
  const L=(a,b)=>linePx(a[0],a[1],b[0],b[1],INK);
  for (const k of DANCE){ const gx=k%N, gy=(k/N)|0; const a=P(gx,gy), b=P(gx+1,gy), c=P(gx+1,gy+1), d=P(gx,gy+1); L(a,b); L(b,c); L(c,d); L(d,a); }
}
// "LLAMA LOUNGE" neon sign, lit in the dance floor colours. It hangs on the left wall (where the shirts were),
// slanted to sit flat on the wall; when SHOW_MERCH is on it goes back up in the night sky above the right wall.
const SIGN_CV=document.createElement('canvas'), SIGN_G=SIGN_CV.getContext('2d');
function neonBoard(t, sc){
  const on=jukeOn(), beat=Math.floor(t*(on?3:0.5)), text='LLAMA LOUNGE', pad=3;
  const w=pfW(text,sc), bw=w+16, bh=5*sc+14;
  if (SIGN_CV.width!==bw+pad*2 || SIGN_CV.height!==bh+pad*2){ SIGN_CV.width=bw+pad*2; SIGN_CV.height=bh+pad*2; }
  const cx=SIGN_G; cx.clearRect(0,0,SIGN_CV.width,SIGN_CV.height); cx.imageSmoothingEnabled=false;
  const bx=pad, by=pad, x0=bx+8, y0=by+7;
  cx.fillStyle=INK; cx.fillRect(bx-1,by-1,bw+2,bh+2); cx.fillStyle='#241838'; cx.fillRect(bx,by,bw,bh);
  const glow = on || Math.floor(t*0.7)%9!==0;   // the border tube flickers now and then when the music is off
  cx.fillStyle = glow ? '#f85888' : '#7a3a5a'; cx.fillRect(bx+2,by+2,bw-4,1); cx.fillRect(bx+2,by+bh-3,bw-4,1); cx.fillRect(bx+2,by+2,1,bh-4); cx.fillRect(bx+bw-3,by+2,1,bh-4);
  // letters: soft halo, ink shadow, then the coloured tube with a white-hot core
  let x=x0, i=0;
  for (const ch of text){ if (ch===' '){ x+=3*sc; continue; }
    const col = DANCE_COLS[(i*2+beat)%DANCE_COLS.length]; const gw=(PF[ch]||PF.A)[0].length*sc;
    cx.globalAlpha=0.35; for (const [ox,oy] of [[-2,0],[2,0],[0,-2],[0,2]]) pfDraw(cx, ch, x+ox, y0+oy, col, sc); cx.globalAlpha=1;
    pfDraw(cx, ch, x+1, y0+1, INK, sc); pfDraw(cx, ch, x, y0, col, sc);
    const gl=PF[ch]; if (gl){ cx.fillStyle='rgba(255,255,255,0.55)'; for (let j=0;j<5;j++) for (let k=0;k<gl[j].length;k++) if (gl[j][k]==='#') cx.fillRect(x+k*sc+1, y0+j*sc+1, 1, 1); }
    x += gw + sc; i++; }
  return {bw, bh, pad};
}
function drawSkySign(t){
  if (!SHOW_MERCH){
    // on the left wall: each 1-pixel column steps up half a pixel, like the wall itself
    const {bw, bh, pad}=neonBoard(t, 3), W=SIGN_CV.width, xl=Math.round(-106-W/2), hTop=bh+57;
    // two little brackets holding it to the wall
    for (const bxw of [xl+pad+14, xl+pad+bw-15]){ const top=Math.floor(-bxw/2)-hTop-3; g.fillStyle=INK; g.fillRect(OX+bxw-1,OY+top-1,3,4); g.fillStyle='#8a7aa8'; g.fillRect(OX+bxw,OY+top,1,2); }
    for (let x=0;x<W;x++){ const wxp=xl+x; g.drawImage(SIGN_CV, x,0,1,SIGN_CV.height, OX+wxp, OY+Math.floor(-wxp/2)-hTop, 1, SIGN_CV.height); }
    signGlow=[OX-106, OY+53-hTop+SIGN_CV.height/2, W];   // where the night glow goes
    return; }
  const {bw, bh, pad}=neonBoard(t, 4), x0=Math.round(OX+188-bw/2), y0=Math.round(OY-96+1+Math.sin(t*1.2)*1.5);
  g.fillStyle='#3a3050'; g.fillRect(x0+14,y0-14,1,14); g.fillRect(x0+bw-15,y0-14,1,14);   // hung from two wires
  g.drawImage(SIGN_CV, x0-pad, y0-pad);
  for (const [dx,dy,ph] of [[-22,-5,0],[bw+20,1,1.7],[bw*0.3,-15,3.1],[bw*0.75,-11,4.4],[-14,29,2.2],[bw+12,33,5.3]]){ const on2=Math.sin(t*2.3+ph)>0.2; if (!on2) continue;
    const sx=Math.round(x0+dx), sy=Math.round(y0+dy); g.fillStyle='#f8f0c0'; g.fillRect(sx,sy,1,1); if (Math.sin(t*2.3+ph)>0.75){ g.fillRect(sx-1,sy,3,1); g.fillRect(sx,sy-1,1,3); } }
}
let signGlow=null;
const overlayItems = [];
function render(t){
  g = ctx; ctx.imageSmoothingEnabled=false;
  if (!joined){ ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle='#0a0814'; ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height); return; }   // nothing behind the start screens until you pick a room
  const [wx,wy] = proj(me.x,me.y);
  const viewH = LH-UIB-UIT, roomL=-NY*20-24, roomR=N*20+24, roomT=-114, roomB=(N+NY)*10+16;
  // dead-zone camera: holds still while you walk around the middle, glides when you near an edge
  const clampX = v => (LW >= roomR-roomL) ? 0 : Math.max(roomL+LW/2, Math.min(roomR-LW/2, v));
  const clampY = v => (viewH >= roomB-roomT) ? (roomT+roomB)/2 : Math.max(roomT+viewH/2, Math.min(roomB-viewH/2, v));
  const px = wx, py = wy-22;
  if (!camInit){ camX=clampX(px); camY=clampY(py); camInit=true; }
  const hx = LW*0.22, hy = viewH*0.2;
  let tx=camX, ty=camY;
  if (px-camX > hx) tx = px-hx; else if (px-camX < -hx) tx = px+hx;
  if (py-camY > hy) ty = py-hy; else if (py-camY < -hy) ty = py+hy;
  if (camMan){ camPX=clampX(camPX); camPY=clampY(camPY); tx=camPX; ty=camPY; }   // the player slid the view with the arrows: hold it there until they tap to walk
  tx=clampX(tx); ty=clampY(ty);
  { const busy = (typeof pmenuEl!=='undefined' && pmenuEl.style.display==='block') || !!document.querySelector('.gb.sheet[style*="display: block"], .gb.sheet[style*="display: flex"]');   // pop-up open: arrows step aside
    const wide = LW < roomR-roomL - 2, st = !wide || arcade.on || busy ? 'off' : (camMan ? camPX : tx) <= roomL+LW/2+1 ? 'L' : (camMan ? camPX : tx) >= roomR-LW/2-1 ? 'R' : 'mid';
    if (st!==camArrSt){ camArrSt=st; camLEl.classList.toggle('on', st!=='off'); camREl.classList.toggle('on', st!=='off'); camLEl.classList.toggle('end', st==='L'); camREl.classList.toggle('end', st==='R'); }
    camPanW = LW*0.45; }
  const k=Math.min(1, frameDt*3.5); camX += (tx-camX)*k; camY += (ty-camY)*k;
  if (Math.abs(tx-camX)<0.3) camX=tx; if (Math.abs(ty-camY)<0.3) camY=ty;
  OX = Math.round(LW/2 - camX); OY = Math.round(UIT + viewH/2 - camY);
  if (isP(curRoom) && (PRD[curRoom]||{}).farm) drawFarmSky(ctx);
  else if (curRoom==='cove') drawCoveSky(ctx, t);
  else if (curRoom==='jungle') drawJungleSky(ctx, t);
  else if (curRoom==='barn'){ const sk=barnSky(); const top=OY-BGY; ctx.fillStyle=sk[2]; ctx.fillRect(0,0,LW,LH); ctx.fillStyle=sk[1]; ctx.fillRect(0,0,LW,top+140); ctx.fillStyle=sk[0]; ctx.fillRect(0,0,LW,top+70); }
  else { ctx.fillStyle='#100c1c'; ctx.fillRect(0,0,LW,LH); }
  ctx.drawImage(bg, OX-BGX, OY-BGY);
  if (curRoom==='lounge'){ drawSkySign(t); drawSigns(t); drawBoardWall(t); drawDanceFloor(t); } else { shopHit=[]; boardHit=null; if (isP(curRoom)) drawPlayerRoom(t); else if (curRoom==='store') drawStoreSigns(t); else if (curRoom==='casino') drawCasinoSigns(t); else if (curRoom==='arena') drawArenaSigns(t); else if (curRoom==='lanes') drawLanesSigns(t); else if (curRoom==='gym') drawGymSigns(t); else if (curRoom==='cove') drawCoveGround(t); else if (curRoom==='jungle') drawJungleGround(t); }
  const items = [];
  for (const f of FURN) items.push({d: f.gx+f.gy+1+(f.dz||0), f});
  if (joined) items.push({d: me.x+me.y+0.02, l: me, me:true});
  if (curRoom==='gym' && BXS.s && BXS.s.b.bot) items.push({d: BOT_LL.x+BOT_LL.y+0.01, l: BOT_LL});
  if (curRoom==='cove') for (const c of coveCrabs(Math.min(0.05,frameDt||0.016))) items.push({d:c.x+c.y, f:{t:'crab', gx:c.x-0.5, gy:c.y-0.5}});
  // someone sitting in a chair or couch whose back or arm is on the camera side: draw those parts again over them
  if (isP(curRoom)){ const sitters=[]; if (joined && me.p==='sit') sitters.push([me.gx,me.gy,me.x+me.y+0.02]); for (const o of others.values()) if (sameRoom(o) && o.p==='sit') sitters.push([Math.floor(o.x),Math.floor(o.y),o.x+o.y+0.01]);
    for (const [sx2,sy2,d] of sitters){ const f=FURN.find(q=>q.fid && (q.t==='couch'||q.t==='armchair'||q.t==='chair'||q.t==='bed'||q.t==='dbed') && furnTiles(q.item,q.gx,q.gy,q.rot).some(([x,y])=>x===sx2&&y===sy2)); if (f){ const su=furnTiles(f.item,f.gx,f.gy,f.rot).findIndex(([x,y])=>x===sx2&&y===sy2); items.push({d:d+0.005, f:{...f, part:'front', su, st:[sx2,sy2]}}); } } }
  for (const o of others.values()) if (sameRoom(o)) items.push({d: o.x+o.y+0.01, l: o});
  /* a two-seat bench is sorted as one long piece, so whoever sits on its near end would be drawn under it: draw sitters right after their bench */
  for (const it of items){ if (!it.l || it.l.p!=='sit') continue; const tx=Math.floor(it.l.x), ty=Math.floor(it.l.y);
    const b=FURN.find(f=>f.t==='bench' && (f.ax==='x' ? (ty===f.gy && tx>=f.gx && tx<f.gx+(f.len||1)) : (tx===f.gx && ty>=f.gy && ty<f.gy+(f.len||1))));
    if (b) it.d=Math.max(it.d, b.gx+b.gy+1+(b.dz||0)+0.01); }
  for (const it of items.slice()) if (it.l && it.l.p==='sit') items.push({d:it.d+0.008, legs:it.l});   // dangling legs go over the seat's front edge
  items.sort((a,b)=>a.d-b.d);
  overlayItems.length = 0; llamaHits.length = 0; cupHits.length = 0; itemHits.length = 0; vendHit = null; pvHits.length = 0;
  for (const it of items){
    if (it.legs){ if (it.legs._legs){ g.globalAlpha = it.legs.leaving ? Math.max(0, Math.min(1, 1-(performance.now()-it.legs.leaving)/LEAVE_T)) : 1; drawSitLegs(it.legs._legs, t); g.globalAlpha=1; } continue; }
    if (it.f){ if (PDR.on && PDR.fid && it.f.fid===PDR.fid){ g.globalAlpha=0.25; drawFurn(it.f, t); g.globalAlpha=1; continue; } drawFurn(it.f, t); if (it.f.show) showroomTag(it.f); }
    else { const fa = (!it.me && it.l.leaving) ? Math.max(0, Math.min(1, 1-(performance.now()-it.l.leaving)/LEAVE_T)) : 1; g.globalAlpha=fa; const pos = drawLlama(it.l, t, it.me); g.globalAlpha=1; overlayItems.push({l:it.l, x:pos[0], y:pos[1], me:it.me, balloon:pos[2] || fishAbove(it.l, it.me), fa}); }
  }
  if (isP(curRoom)) prGhost(t);
  drawRags(t); drawSpits(t); drawDunk(t);
  if (curRoom==='gym') drawBoxFx(t); else if (curRoom==='cove') drawCoveDigs(t); else if (curRoom==='jungle'){ drawCoveDigs(t); drawJungleAir(t); }
  drawFishing(t);
  drawNight(t);
  arcadeText=null;   /* the arcade itself is drawn on the sharp overlay canvas (drawOverlay) so moving things glide instead of stepping */
  drawOverlay(t);
  drawSlotPopup(t);
  drawTablePopup(t);
}
function wrapChars(text, max){ const out=[]; let cur='';
  for (let w of text.split(/\s+/).filter(Boolean)){ while (w.length>max){ if(cur){out.push(cur);cur='';} out.push(w.slice(0,max)); w=w.slice(max); } if(!w) continue;
    const test=cur?cur+' '+w:w; if(test.length>max){ out.push(cur); cur=w; } else cur=test; }
  if (cur) out.push(cur); return out.slice(0,7); }

// ======================= PIXEL FONT (3x5, drawn on the game's own pixel grid) =======================
const PF = {
 A:['.#.','#.#','###','#.#','#.#'], B:['##.','#.#','##.','#.#','##.'], C:['.##','#..','#..','#..','.##'], D:['##.','#.#','#.#','#.#','##.'],
 E:['###','#..','##.','#..','###'], F:['###','#..','##.','#..','#..'], G:['.##','#..','#.#','#.#','.##'], H:['#.#','#.#','###','#.#','#.#'],
 I:['###','.#.','.#.','.#.','###'], J:['..#','..#','..#','#.#','.#.'], K:['#.#','#.#','##.','#.#','#.#'], L:['#..','#..','#..','#..','###'],
 M:['#...#','##.##','#.#.#','#...#','#...#'], N:['#..#','##.#','#.##','#..#','#..#'], O:['.#.','#.#','#.#','#.#','.#.'], P:['##.','#.#','##.','#..','#..'],
 Q:['.#.','#.#','#.#','##.','.##'], R:['##.','#.#','##.','#.#','#.#'], S:['.###','#...','.##.','...#','###.'], T:['###','.#.','.#.','.#.','.#.'],
 U:['#.#','#.#','#.#','#.#','###'], V:['#.#','#.#','#.#','#.#','.#.'], W:['#...#','#...#','#.#.#','##.##','#...#'], X:['#.#','#.#','.#.','#.#','#.#'],
 Y:['#.#','#.#','.#.','.#.','.#.'], Z:['###','..#','.#.','#..','###'],
 '0':['###','#.#','#.#','#.#','###'], '1':['.#.','##.','.#.','.#.','###'], '2':['##.','..#','.#.','#..','###'], '3':['##.','..#','.#.','..#','##.'],
 '4':['#.#','#.#','###','..#','..#'], '5':['###','#..','##.','..#','##.'], '6':['.##','#..','###','#.#','###'], '7':['###','..#','.#.','.#.','.#.'],
 '8':['###','#.#','###','#.#','###'], '9':['###','#.#','###','..#','##.'],
 '.':['.','.','.','.','#'], ',':['.','.','.','#','#'], '!':['#','#','#','.','#'], '?':['##.','..#','.#.','...','.#.'], ':':['.','#','.','#','.'], ';':['.','#','.','#','#'],
 "'":['#','#','.','.','.'], '"':['#.#','#.#','...','...','...'], '-':['...','...','###','...','...'], '+':['...','.#.','###','.#.','...'], '=':['...','###','...','###','...'],
 '/':['..#','..#','.#.','#..','#..'], '(':['.#','#.','#.','#.','.#'], ')':['#.','.#','.#','.#','#.'], '[':['##','#.','#.','#.','##'], ']':['##','.#','.#','.#','##'],
 '#':['#.#','###','#.#','###','#.#'], '$':['.##','##.','.#.','.##','##.'], '%':['#.#','..#','.#.','#..','#.#'], '*':['...','#.#','.#.','#.#','...'], '&':['.#.','#.#','.#.','#.#','.##'],
 '@':['###','#.#','#.#','#..','.##'], '_':['...','...','...','...','###'], '<':['..#','.#.','#..','.#.','..#'], '>':['#..','.#.','..#','.#.','#..'], '^':['.#.','#.#','...','...','...'],
 // lowercase (used for chat text, so messages show the way they were typed)
a:["...", ".##", "#.#", "#.#", ".##"], b:["#..", "##.", "#.#", "#.#", "##."], c:["...", ".##", "#..", "#..", ".##"], d:["..#", ".##", "#.#", "#.#", ".##"], e:["...", ".#.", "###", "#..", ".##"], f:[".##", "#..", "##.", "#..", "#.."], g:["...", ".##", "#.#", ".##", "##."], h:["#..", "##.", "#.#", "#.#", "#.#"], i:["#", ".", "#", "#", "#"], j:[".#", "..", ".#", ".#", "#."], k:["#..", "#.#", "##.", "#.#", "#.#"], l:["#.", "#.", "#.", "#.", ".#"], m:[".....", "##.#.", "#.#.#", "#.#.#", "#.#.#"], n:["...", "##.", "#.#", "#.#", "#.#"], o:["...", ".#.", "#.#", "#.#", ".#."], p:["...", "##.", "#.#", "##.", "#.."], q:["...", ".##", "#.#", ".##", "..#"], r:["...", "#.#", "##.", "#..", "#.."], s:["...", ".##", "#..", "..#", "##."], t:[".#.", "###", ".#.", ".#.", "..#"], u:["...", "#.#", "#.#", "#.#", ".##"], v:["...", "#.#", "#.#", "#.#", ".#."], w:[".....", "#...#", "#.#.#", "#.#.#", ".#.#."], x:["...", "#.#", ".#.", ".#.", "#.#"], y:["...", "#.#", "#.#", ".##", "##."], z:["...", "###", ".#.", "#..", "###"],
 '~':['...','.#.','#.#','...','...'], '♦':['..#..','.###.','#####','.###.','..#..'], '♠':['..#..','.###.','#####','..#..','.###.'], '♣':['.###.','#.#.#','#####','..#..','.###.'], '♥':['#.#','###','###','.#.','...'], '♪':['.##','.#.','.#.','##.','##.'], '▶':['#..','##.','###','##.','#..'], '▲':['...','.#.','###','...','...'], '▼':['...','###','.#.','...','...'],
};
const pfFallback = ch => { const c=document.createElement('canvas').getContext('2d'); c.font='6px monospace'; return Math.ceil(c.measureText(ch).width); };
function pfW(str, sc=1, lc=false){ let w=0; for (const ch0 of String(str)){ const ch=(lc && /[a-z]/.test(ch0)) ? ch0 : ch0.toUpperCase(); if (ch===' ') { w+=3; continue; } const gl=PF[ch]; w += (gl ? gl[0].length : pfFallback(ch0)) + 1; } return Math.max(0,w-1)*sc; }
function pfDraw(c, str, x, y, col, sc=1, lc=false){
  x=Math.round(x); y=Math.round(y); c.fillStyle=col;
  for (const ch0 of String(str)){ const ch=(lc && /[a-z]/.test(ch0)) ? ch0 : ch0.toUpperCase(); if (ch===' '){ x+=3*sc; continue; }
    const gl=PF[ch];
    if (!gl){ const f=c.font, b=c.textBaseline; c.font=(6*sc)+'px monospace'; c.textBaseline='top'; c.fillText(ch0, x, y-1); const w=Math.ceil(c.measureText(ch0).width); c.font=f; c.textBaseline=b; x+=w+sc; continue; }
    for (let j=0;j<5;j++){ const r=gl[j]; for (let i=0;i<r.length;i++) if (r[i]==='#') c.fillRect(x+i*sc, y+j*sc, sc, sc); }
    x += (gl[0].length+1)*sc; }
  return x;
}
// route every 'Press Start 2P' text call on the overlay through the pixel font, so nothing depends on a web font loading
(function(){
  const scOf = f => { const m=/(\d+(?:\.\d+)?)px/.exec(f||''); const z=m?+m[1]:6; return z>=8?2:1; };
  const isPF = f => /Press Start/.test(f||'');
  const _fill = CanvasRenderingContext2D.prototype.fillText, _meas = CanvasRenderingContext2D.prototype.measureText;
  CanvasRenderingContext2D.prototype.measureText = function(t){ if (this.__pf && isPF(this.font)) return {width: pfW(t, scOf(this.font))}; return _meas.call(this, t); };
  CanvasRenderingContext2D.prototype.fillText = function(t, x, y){ if (!(this.__pf && isPF(this.font))) return _fill.apply(this, arguments);
    const sc=scOf(this.font), w=pfW(t,sc), h=5*sc; const a=this.textAlign, bl=this.textBaseline;
    if (a==='center') x-=w/2; else if (a==='right'||a==='end') x-=w;
    if (bl==='alphabetic'||bl==='bottom'||bl==='ideographic') y-=h; else if (bl==='middle') y-=h/2;
    pfDraw(this, t, x, y, this.fillStyle, sc); };
})();

// staff badges: a gold crown for the owner, a blue shield for mods (set by the server, so nobody can fake one)
const BADGE = { owner:{rows:['#.#.#','#####','#####','#####'], c:'#f0b818', d:'#a87808'}, mod:{rows:['##.##','#####','#####','.###.','..#..'], c:'#f5c518', d:'#b8860b'} };
const BADGE_W = 7;
function drawBadge(c, st, x, y){ const B=BADGE[st]; if (!B) return; const H=B.rows.length, y0=y+Math.floor((5-H)/2);
  c.fillStyle=INK; B.rows.forEach((r,j)=>{ for (let i=0;i<5;i++) if (r[i]==='#'){ c.fillRect(x+i-1,y0+j,1,1); c.fillRect(x+i+1,y0+j,1,1); c.fillRect(x+i,y0+j-1,1,1); c.fillRect(x+i,y0+j+1,1,1); } });
  B.rows.forEach((r,j)=>{ for (let i=0;i<5;i++) if (r[i]==='#'){ c.fillStyle = j===H-1 || (st==='mod' && (i===4 || j===3)) ? B.d : B.c; c.fillRect(x+i,y0+j,1,1); } });
  c.fillStyle='#ffffff'; if (st==='owner') c.fillRect(x+2,y0+2,1,1); else c.fillRect(x+1,y0+1,1,1); }
const staffOf = (isMe, l) => isMe ? (me.st||'') : ((l && l.st) || '');
function drawOverlay(t){
  const c = uctx; c.setTransform(1,0,0,1,0,0); c.clearRect(0,0,ui.width,ui.height);
  const k = S*DPR; c.setTransform(k,0,0,k,0,0);
  c.textBaseline='alphabetic';
  if (!arcade.on){
    c.imageSmoothingEnabled=true; c.imageSmoothingQuality='high';
    if (merchHere()) for (const pr of PRODUCTS){ if (pr.at && pr.hi_img.complete) c.drawImage(pr.hi_img, pr.at[0]-14, pr.at[1]-14, 28, 28); }
    if (merchHere() && LOGO.complete) c.drawImage(LOGO, OX-210-9, OY+105-75.5-9, 18, 18);
    overlayItems.sort((a,b)=>a.y-b.y);
    // ---- name tags and chat bubbles in the app's own style (sizes are screen pixels, so they stay sharp at any zoom) ----
    const u = 1/S;                                  // one screen pixel in game units
    const pill = (x,y,w,h,r) => { c.beginPath(); if (c.roundRect) c.roundRect(x,y,w,h,r); else c.rect(x,y,w,h); };
    for (const it of overlayItems){
      const name = (it.me ? (me.n||'YOU') : it.l.n).toUpperCase(); const fa = it.fa==null?1:it.fa;
      const cid = it.me ? me.c : (it.l && it.l.c); const tag = (CHARS[cid]||{}).tag || '#f8d030';
      const st = staffOf(it.me, it.l), icons = [st ? 'crown' : null, !it.me && isFriend(name) ? 'star' : null].filter(Boolean), icon = '';
      c.font = `800 ${10.5*u}px Inter, system-ui, sans-serif`; const isz = 12*u, tw = c.measureText(name).width + icons.length*(isz+3*u);
      const h = 18*u, w = tw + 22*u, nx = it.x - w/2, ny = (it.balloon ? it.y - 27 : it.y) - h - 5*u;   // with an emote bubble showing, the name sits above it
      c.globalAlpha = fa;
      c.shadowColor='rgba(0,0,0,0.35)'; c.shadowBlur=6*u*S*DPR; c.shadowOffsetY=1.5*u*S*DPR;
      c.fillStyle = it.me ? '#ffd23f' : 'rgba(22,15,40,0.78)'; pill(nx, ny, w, h, h/2); c.fill();
      c.shadowColor='transparent'; c.shadowBlur=0; c.shadowOffsetY=0;
      // little pointer down to the head
      c.beginPath(); c.moveTo(it.x-4*u, ny+h-0.5*u); c.lineTo(it.x+4*u, ny+h-0.5*u); c.lineTo(it.x, ny+h+4*u); c.closePath(); c.fill();
      c.fillStyle = tag; c.beginPath(); c.arc(nx+9*u, ny+h/2, 3*u, 0, Math.PI*2); c.fill();
      { let ix=nx+15*u; const sm=c.imageSmoothingEnabled; c.imageSmoothingEnabled=false; for (const k of icons){ if (PIXIMG[k] && PIXIMG[k].complete) c.drawImage(PIXIMG[k], Math.round(ix*S*DPR)/(S*DPR), Math.round((ny+h/2-isz/2)*S*DPR)/(S*DPR), Math.round(isz*S*DPR)/(S*DPR), Math.round(isz*S*DPR)/(S*DPR)); ix+=isz+3*u; } c.imageSmoothingEnabled=sm;
        c.fillStyle = it.me ? '#2a1d00' : '#ffffff'; c.textBaseline='middle'; c.fillText(name, ix, ny+h/2+0.5*u); }
      c.globalAlpha = 1;
    }
    c.textBaseline='alphabetic';
    drawTableGames(c, t);
    const now=performance.now(), u15=u*1.15, DPX=S*DPR, snapD=v=>Math.round(v*DPX)/DPX;   /* chat bubbles are 15% bigger; snapped to real pixels so the crown and text move together */
    for (const b of bars){ const u=u15;
      const age=now-b.born; if (age>b.dur && Math.floor((age-b.dur)/140)%2===1) continue;
      const crown = !!b.st, icon = '';
      // measure (and shorten if it won't fit) once per zoom level
      if (b._S!==S){ b._S=S; c.font=`800 ${11*u}px Inter, system-ui, sans-serif`; const hw=c.measureText(b.head).width + (crown ? 15*u : 0); c.font=`500 ${12*u}px Inter, system-ui, sans-serif`;
        const maxW=Math.min(LW-10, 340*u) - hw - 22*u; let txt=b.body; if (c.measureText(txt).width>maxW){ while (txt.length>1 && c.measureText(txt+'…').width>maxW) txt=txt.slice(0,-1); txt=txt.trimEnd()+'…'; }
        b._txt=txt; b._hw=hw; b.w=hw+5*u+c.measureText(txt).width+26*u; b.h=22*u; }   /* even padding: 13 on each side, so the words sit centred over the llama */
      let bx=OX+b.x-b.w/2; bx=snapD(Math.max(3*u, Math.min(LW-b.w-3*u, bx))); const by=snapD(OY+b.y);
      c.shadowColor='rgba(0,0,0,0.3)'; c.shadowBlur=8*S*DPR*u; c.shadowOffsetY=2*S*DPR*u;
      c.fillStyle = b.yell ? '#ff5c8a' : b.mine ? '#fff4c8' : '#ffffff'; pill(bx, by, b.w, b.h, 8*u); c.fill();
      { const tx=snapD(Math.max(bx+10*u, Math.min(bx+b.w-10*u, OX+b.x))); c.beginPath(); c.moveTo(tx-4*u, by+b.h-0.5*u); c.lineTo(tx+4*u, by+b.h-0.5*u); c.lineTo(tx, by+b.h+4*u); c.closePath(); c.fill(); }   /* little pointer down to the llama, like the name tag */
      c.shadowColor='transparent'; c.shadowBlur=0; c.shadowOffsetY=0;
      const tag=(CHARS[b.cid]||{}).tag||'#f8d030'; c.fillStyle=tag; pill(bx+6*u, by+5*u, 3*u, b.h-10*u, 1.5*u); c.fill();
      c.textBaseline='middle';
      c.font=`800 ${11*u}px Inter, system-ui, sans-serif`; c.fillStyle = b.yell ? '#ffffff' : '#c03070'; if (crown && PIXIMG.crown && PIXIMG.crown.complete){ const sm=c.imageSmoothingEnabled; c.imageSmoothingEnabled=false; c.drawImage(PIXIMG.crown, snapD(bx+13*u), snapD(by+b.h/2-6*u), snapD(12*u), snapD(12*u)); c.imageSmoothingEnabled=sm; } c.fillText(b.head, bx+13*u+(crown?15*u:0), by+b.h/2+0.5*u);
      c.font=`${b.yell?800:500} ${12*u}px Inter, system-ui, sans-serif`; c.fillStyle = b.yell ? '#ffffff' : '#1d1530'; c.fillText(b._txt, bx+13*u+b._hw+5*u, by+b.h/2+0.5*u);
      c.textBaseline='alphabetic';
    }
  } else { const g0=g; g=c; c.imageSmoothingEnabled=false; try { drawArcade(t); } finally { g=g0; } if (arcadeText) drawArcadeText(c, t); }
}


// ======================= PLINKO (casino, left wall) =======================
// the server picks the ball's path (8 fair left/right bounces); this just animates it down the pegs into its bucket
const plkEl=document.getElementById('plkbox'), plkCv=document.getElementById('plkcv'), plkCx=plkCv.getContext('2d');
const PLKB={cx:88, top:42, sp:16, rh:15, W:176, H:218};   // board layout in canvas pixels
const PLK_COL=[['#ffd23f','#a06808'],['#48c060','#1f7a34'],['#4aa8ff','#1c5ab8'],['#a070e0','#5a2aa8'],['#e83850','#8a1c2c']];
const plkBucketCol=k=>PLK_COL[Math.min(4, Math.abs(k-4)===4?0:Math.abs(k-4)===3?1:Math.abs(k-4)===2?2:Math.abs(k-4)===1?3:4)];
const PLKS={bet:1, balls:[], wait:false, seq:0};   // several balls can be falling at once
try{ const b=+localStorage.getItem('ll_plkBet'); if (PLK.bets.includes(b)) PLKS.bet=b; }catch(_){}
function plkHit(lx,ly){ if (curRoom!=='casino') return false; const [ax,ay]=P(PLK.gx+0.9,PLK.gy+1.9,0), [bx,by]=P(PLK.gx+0.9,PLK.gy+0.1,0); return lx>=Math.min(ax,bx)-2 && lx<=Math.max(ax,bx)+2 && ly>=Math.min(ay,by)-58 && ly<=Math.max(ay,by)+2; }
function plkNear(){ return !me.moving && me.p!=='sit' && me.gx<=1 && me.gy>=PLK.gy-1 && me.gy<=PLK.gy+2; }
function plkGo(){ if (plkNear()){ openPlinko(); return; } if (me.p==='sit') doAction('stand'); if (!walkTo(1,PLK.gy+1,'plinko') && !walkTo(1,PLK.gy,'plinko')) localMsg('Walk up to the PLINKO machine.'); }
function plkMsg(t,good){ const el=$id('plk_msg'); el.textContent=t; el.classList.toggle('good',!!good); }
function plkBetUI(){ for (const b of $id('plk_bet').querySelectorAll('[data-pb]')) b.classList.toggle('on', +b.dataset.pb===PLKS.bet); }
function plkFit(){ const dpr=window.devicePixelRatio||1, room=Math.min(plkEl.clientWidth-44, 360), k=Math.max(1, Math.floor(room*dpr/PLKB.W)); plkCv.style.width=(PLKB.W*k/dpr)+'px'; plkCv.style.height=(PLKB.H*k/dpr)+'px'; }
function openPlinko(){ closeAll(); plkEl.style.display='block'; plkBetUI(); plkFit(); if (!PLKS.balls.length) plkMsg(`PICK A BET, THEN DROP THE BALL. ${PLKS.bet} TOKEN${PLKS.bet>1?'S':''} A BALL.`); }
document.getElementById('plk_bet').addEventListener('click', e=>{ const b=e.target.closest('[data-pb]'); if (!b) return; PLKS.bet=+b.dataset.pb; try{ localStorage.setItem('ll_plkBet', PLKS.bet); }catch(_){} plkBetUI(); plkMsg(`${PLKS.bet} TOKEN${PLKS.bet>1?'S':''} A BALL. GOOD LUCK!`); });
document.getElementById('plk_drop').addEventListener('click', ()=>{ ensureAudio(); plkDrop(); });
addEventListener('resize', ()=>{ if (plkEl.style.display==='block') plkFit(); });
function plkDrop(){ if (PLKS.wait) return; if (!plkNear()){ plkEl.style.display='none'; plkGo(); return; }
  if (PLKS.balls.filter(B=>!B.done).length>=8){ plkMsg('LET A FEW BALLS LAND FIRST!'); return; }
  if (wallet.get()<PLKS.bet){ plkMsg(`YOU NEED ${PLKS.bet} TOKEN${PLKS.bet>1?'S':''} TO DROP A BALL.`); return; }
  PLKS.wait=true; NET.act('plinko',{bet:PLKS.bet}).then(r=>{ PLKS.wait=false; if (!r.ok){ if (Number.isFinite(r.tk)) tkSet(r.tk); plkMsg(r.msg||'That did not work.'); return; }
    tkSet(r.tk - r.pay);   /* the bet comes off now; any win is added when the ball lands */
    sfxTone(880,0.05,'square',0.1); const seq=++PLKS.seq; PLKS.balls.push({path:r.path, slot:r.slot, pay:r.pay, bet:r.bet, tk:r.tk, seq, t0:performance.now(), done:false}); plkMsg('DROPPING... TAP DROP AGAIN FOR ANOTHER BALL!'); }).catch(()=>{ PLKS.wait=false; }); }
// where the ball is at time s (seconds since the drop): a fall to the first peg, then one hop per row
function plkBallPos(B, s){ const {cx,top,sp,rh}=PLKB, hop=0.2, fall=0.32;
  if (s<fall){ const u=s/fall; return [cx, top-18+u*u*13, -1]; }
  let k=Math.floor((s-fall)/hop), u=((s-fall)%hop)/hop; if (k>=B.path.length){ const off=B.path.reduce((a,v)=>a+(v?1:-1),0); const fx=cx+off*sp/2; const v=Math.min(1,(s-fall-B.path.length*hop)/0.25); return [fx, top+(B.path.length-1)*rh-5+v*16, B.path.length]; }
  let off=0; for (let i=0;i<k;i++) off+=B.path[i]?1:-1; const x0=cx+off*sp/2, x1=x0+(B.path[k]?sp/2:-sp/2), y0=top+k*rh-5, y1=y0+rh;
  return [x0+(x1-x0)*u, y0+(y1-y0)*u-Math.sin(Math.PI*u)*6, k]; }
function drawPlinko(t){ if (plkEl.style.display!=='block') return; const c=plkCx, {cx,top,sp,rh,W,H}=PLKB; c.imageSmoothingEnabled=false;
  const R2=(x,y,w,h,col)=>{ c.fillStyle=col; c.fillRect(Math.round(x),Math.round(y),w,h); };
  const fl=Math.floor(t*4);
  // cabinet: ink outline, gold rim with chase lights, purple bevel, deep-space glass with a soft vertical glow
  R2(0,0,W,H,'#1d1530'); R2(2,2,W-4,H-4,'#ffd23f'); R2(3,3,W-6,1,'#fff2a0'); R2(4,4,W-8,H-8,'#7a3cd8'); R2(5,5,W-10,1,'#9a64f0'); R2(7,7,W-14,H-14,'#1d1530');
  const glass=['#160e30','#1a1238','#1e1540','#221848','#1e1540','#1a1238'];
  for (let y=8;y<H-8;y++) R2(8,y,W-16,1, glass[Math.min(glass.length-1, Math.floor((y-8)/((H-16)/glass.length)))]);
  for (let x=10;x<W-10;x+=8){ R2(x,2,3,2,((x/8)+fl)%2?'#ffffff':'#ff5c8a'); R2(x,H-4,3,2,((x/8)+fl+1)%2?'#ffffff':'#ff5c8a'); }
  for (let y=12;y<H-10;y+=8){ R2(2,y,2,3,((y/8)+fl)%2?'#ffffff':'#ff5c8a'); R2(W-4,y,2,3,((y/8)+fl+1)%2?'#ffffff':'#ff5c8a'); }
  // twinkling stars in the glass
  for (let i=0;i<22;i++){ const x=12+((i*67)%(W-24)), y=26+((i*41)%(H-80)); const tw=(i+fl)%6; if (tw===0){ R2(x,y,1,1,'#ffffff'); R2(x-1,y,1,1,'#6a58b0'); R2(x+1,y,1,1,'#6a58b0'); R2(x,y-1,1,1,'#6a58b0'); R2(x,y+1,1,1,'#6a58b0'); } else if (tw<3) R2(x,y,1,1,'#4a3a88'); }
  // marquee sign
  { const w=86, x=cx-w/2; R2(x-1,9,w+2,19,'#1d1530'); R2(x,10,w,17,'#ffd23f'); R2(x,10,w,2,'#fff2a0'); R2(x,24,w,3,'#c88a10'); for (let k=0;k<w;k+=6) R2(x+k+2,13,1,1,(k/6+fl)%2?'#ffffff':'#ff9ab8');
    const txt='PLINKO'; const tw=pfW(txt,2); pfDraw(c,txt,cx-tw/2+1,14,'#c8306a',2); pfDraw(c,txt,cx-tw/2,13,'#5a1c80',2); }
  const NOW=performance.now(); PLKS.balls=PLKS.balls.filter(B=>!B.done || NOW-B.doneAt<1400);
  const live=PLKS.balls.map(B=>{ const s=(NOW-B.t0)/1000; return {B, s, cur:plkBallPos(B,s)}; });
  // pegs: round gold studs with a shine, flashing white when a ball bounces off them
  for (let r=0;r<PLK.rows;r++) for (let j=0;j<r+3;j++){ const x=Math.round(cx+(j-(r+2)/2)*sp), y=top+r*rh; const lit = live.some(L=>!L.B.done && L.cur[2]===r && Math.abs(L.cur[0]-x)<sp/2+1 && ((L.s-0.32)%0.2)<0.07);
    R2(x-2,y-1,4,4,'#1d1530'); R2(x-1,y-2,2,6,'#1d1530'); R2(x-1,y-1,2,3, lit?'#ffffff':'#ffd23f'); R2(x-2,y,4,1, lit?'#ffffff':'#ffd23f'); R2(x-1,y-1,1,1,'#fff6c8'); R2(x,y+1,1,1, lit?'#ffe070':'#c88a10'); }
  // buckets: colored cups with dividers and their payouts (they flash when a ball lands in them)
  const by=top+PLK.rows*rh+1, bw=sp-1;
  for (let k=0;k<9;k++){ const x=Math.round(cx+(k-4)*sp-bw/2), [c0,c1]=plkBucketCol(k), hot = live.some(L=>L.B.done && L.B.slot===k) && Math.floor(t*8)%2;
    R2(x-1,by,bw+2,30,'#1d1530'); R2(x,by+1,bw,28, hot?'#ffffff':c0); R2(x,by+1,bw,2, hot?'#ffffff':'rgba(255,255,255,.35)'); R2(x,by+21,bw,8,c1);
    const m=PLK.mult[k], txt=(m===Math.floor(m) ? String(m) : String(m).replace(/^0/,''))+'X'; pfDraw(c, txt, x+Math.round((bw-pfW(txt))/2), by+8, hot?c1:'#1d1530'); }
  for (let k=0;k<=9;k++){ const x=Math.round(cx+(k-4.5)*sp); R2(x-1,by-4,2,6,'#1d1530'); R2(x-1,by-5,2,1,'#ffd23f'); }
  { const t2='PAYOUT = BET X BUCKET'; pfDraw(c,t2,cx-pfW(t2)/2,H-15,'#8a7ac8'); }
  const ball=(x,y,a)=>{ c.globalAlpha=a; R2(x-3,y-2,6,4,'#1d1530'); R2(x-2,y-3,4,6,'#1d1530'); R2(x-2,y-2,4,4,'#ff6e9c'); R2(x-3,y-1,6,2,'#ff6e9c'); R2(x-2,y-2,2,1,'#ffffff'); R2(x-2,y-1,1,1,'#ffd0e0'); R2(x+1,y+1,1,1,'#c8306a'); c.globalAlpha=1; };
  if (!live.some(L=>!L.B.done)) ball(cx, top-18+Math.round(Math.sin(t*3)), 1);
  for (const {B,s,cur} of live){ if (B.done) continue;
    for (const [dt,a] of [[0.09,0.18],[0.05,0.35]]) if (s-dt>0){ const q=plkBallPos(B,s-dt); ball(q[0],q[1],a); }
    ball(cur[0],cur[1],1);
    if (cur[2]>=0 && cur[2]<PLK.rows){ const k=cur[2], u=((s-0.32)%0.2)/0.2; if (u<0.05 && B._tick!==k){ B._tick=k; sfxTone(660+k*50,0.04,'square',0.04); } }
    // landing: pay out once
    if (cur[2]>=PLK.rows && s>0.32+PLK.rows*0.2+0.25){ B.done=true; B.doneAt=NOW; if (B.pay) tkSet(B.seq===PLKS.seq ? B.tk : wallet.get()+B.pay);
      if (B.pay>B.bet){ sfxChime([523,659,784,1047]); plkMsg(`${PLK.mult[B.slot]}X! YOU WON ${B.pay} TOKEN${B.pay>1?'S':''}!`, true); }
      else if (B.pay>0){ sfxChime([523,659]); plkMsg(`${PLK.mult[B.slot]}X. YOU GOT ${B.pay} BACK.`); }
      else { sfxTone(220,0.2,'square',0.08); plkMsg('NO LUCK THIS TIME. TRY AGAIN!'); } } }
}

// ======================= BAR DRINKING (tap the cup, tap to sip) =======================
const SIP_T=1300, SIPS=3;   // sips or bites in every drink and snack (the server's SIPS must match)
const cupHits=[];
function stoolTaken(gx){ if (joined && me.p==='sit' && me.gy===2 && me.gx===gx && !me.moving && me.h) return true;
  for (const o of others.values()){ if (sameRoom(o) && o.p==='sit' && Math.floor(o.y)===2 && Math.floor(o.x)===gx && o.h) return true; } return false; }
function cupClick(gx){ const st=(me.p==='sit'&&!me.moving)?seatAt(me.gx,me.gy):null;
  if (st && st.gy===2 && me.gx===gx){ if(!me.h) doAction('grab'); else doAction('sip'); return; }
  let busy=false; for (const o of others.values()) if (sameRoom(o)&&o.p==='sit'&&Math.floor(o.x)===gx&&Math.floor(o.y)===2) busy=true;
  if (busy){ localMsg('Someone is sitting there!'); return; } walkTo(gx,2,'grab'); }

// ======================= PLAYER MENU (tap another llama) =======================
const pmenuEl=document.getElementById('pmenu'); let pmTarget=null;
function openPlayerMenu(id, cx, cy){ const o=others.get(id); if(!o) return; closeAll(); pmTarget=id;
  document.getElementById('pm_name').textContent=o.n.toUpperCase(); if (typeof pmFriendBtn==='function') pmFriendBtn(); if (typeof pmBlockBtn==='function') pmBlockBtn(); if (typeof pmModLoad==='function') pmModLoad(o); pmCard(o); pmLoad(o);
  pmenuEl.style.display='block'; const r=pmenuEl.getBoundingClientRect();
  pmenuEl.style.left=Math.max(8,Math.min(innerWidth-r.width-8, cx-r.width/2))+'px'; pmenuEl.style.top=Math.max(8,Math.min(innerHeight-r.height-70, cy-r.height-12))+'px'; pmFit(); }
// the card grows once the stats and the MOD TOOLS arrive: keep it on screen (it scrolls if the screen is short)
function pmFit(){ if (pmenuEl.style.display!=='block') return;
  // the lowest the card may reach: above the dock buttons and the chat bar (whichever is higher on screen)
  let lim=innerHeight-70; for (const id of ['signs','dock','chatrow','bottom']){ const e=document.getElementById(id); if (e && getComputedStyle(e).display!=='none' && getComputedStyle(e).visibility!=='hidden'){ const b=e.getBoundingClientRect(); if (b.height && b.top>innerHeight*0.4) lim=Math.min(lim, b.top-8); } }
  pmenuEl.style.maxHeight=Math.max(200, lim-8)+'px'; const r=pmenuEl.getBoundingClientRect();
  if (r.bottom > lim) pmenuEl.style.top=Math.max(8, lim-r.height)+'px'; }
document.getElementById('pm_spit').addEventListener('click', ()=>{ const id=pmTarget; closeAll(); if(id) spitAt(id); });
document.getElementById('pm_wave').addEventListener('click', ()=>{ const id=pmTarget; closeAll(); const o=others.get(id); if(o && !me.moving && me.p!=='sit') me.d=dirFrom(Math.round(o.x-me.x), Math.round(o.y-me.y), me.d); emote('wave'); });
document.getElementById('pm_close').addEventListener('click', ()=>closeAll());

// ======================= SPIT =======================
const llamaHits=[]; const spits=[];
const itemHits=[]; let vendHit=null, svendHit=null;   // the vending machine, so tapping anywhere on it works   // where each store item was drawn this frame, so tapping the item itself opens it
function llamaWorld(l){ const seat=(l.p==='sit')?seatAt(Math.floor(l.x),Math.floor(l.y)):null; const [wx,wy]=proj(l.x,l.y); return [wx, wy-45-(seat?seat.lift:0)+(l.p==='sit'?6:0)]; }
function launchSpit(from, to, dir){
  const [fx,fy]=llamaWorld(from); const fdir=dir||from.d||'fr';
  const mouthX = fx + ((fdir==='fr'||fdir==='br')?6:-6), mouthY=fy+19;
  let tx,ty; if (to){ const [ax,ay]=llamaWorld(to); tx=ax; ty=ay+12; } else { const dx=(fdir==='fr'||fdir==='br')?1:-1, dy=fdir[0]==='f'?1:-1; tx=mouthX+dx*40; ty=mouthY+dy*20+10; }
  const vol = from===me ? 1 : 0.35; sfxSpit(vol);
  spits.push({x0:mouthX,y0:mouthY,x1:tx,y1:ty,t:0,dur:0.45,to,vol});
}
function spitAt(id){
  const tgt=others.get(id); if(!tgt||!joined) return;
  if (!me.moving && me.p!=='sit'){ me.d=dirFrom(Math.round(tgt.x-me.x), Math.round(tgt.y-me.y), me.d); }
  me.spK=(me.spK||0)+1; me.lastSpit={k:me.spK, to:id}; launchSpit(me, tgt, me.d); sendPresence(true);
}
function spitAuto(){
  if (!joined) return; let best=null, bd=6;
  for (const o of others.values()){ if (!sameRoom(o)) continue; const d=Math.hypot(o.x-me.x,o.y-me.y); if(d<bd){bd=d;best=o;} }
  if (best) spitAt(best.id); else { me.spK=(me.spK||0)+1; me.lastSpit={k:me.spK, to:''}; launchSpit(me,null,me.d); sendPresence(true); }
}
function drawSpits(t){
  const dt=1/60;
  for (let i=spits.length-1;i>=0;i--){ const p=spits[i]; p.t+=dt;
    const u=Math.min(1,p.t/p.dur); const x=p.x0+(p.x1-p.x0)*u, y=p.y0+(p.y1-p.y0)*u - Math.sin(u*Math.PI)*16;
    if (u<1){ g.fillStyle=INK; g.fillRect(OX+Math.round(x)-1,OY+Math.round(y)-1,4,3); g.fillStyle='#c8f0f8'; g.fillRect(OX+Math.round(x),OY+Math.round(y),2,1); }
    else { if(!p.hit){ p.hit=true; if(p.to){ p.to.flinch=performance.now()+700; sfxSplat(p.to===me ? Math.max(p.vol, 0.8) : p.vol); } p.splat=0; }
      p.splat+=dt; const k=p.splat*30; g.fillStyle='#c8f0f8'; for(let a=0;a<6;a++){ const ang=a*1.05; g.fillRect(OX+Math.round(p.x1+Math.cos(ang)*k),OY+Math.round(p.y1+Math.sin(ang)*k*0.7),2,2); }
      if (p.splat>0.3) spits.splice(i,1); }
  }
}

// ======================= TABLE DICE / COIN =======================
const TABLES=[{gx:8,gy:8},{gx:3,gy:8}];
const tableFx=[null,null];
function nearTable(){ if (curRoom!=='lounge') return -1; for (let i=0;i<TABLES.length;i++){ const T=TABLES[i]; if (Math.max(Math.abs(me.gx-T.gx),Math.abs(me.gy-T.gy))<=1) return i; } return -1; }
function tableShow(i,v,coin){ tableFx[i]={v,coin,until:performance.now()+8000,t0:performance.now()}; }
const PIPS={1:[[2,2]],2:[[0,0],[4,4]],3:[[0,0],[2,2],[4,4]],4:[[0,0],[4,0],[0,4],[4,4]],5:[[0,0],[4,0],[2,2],[0,4],[4,4]],6:[[0,0],[4,0],[0,2],[4,2],[0,4],[4,4]]};
function drawTableFx(f,sx,sy){
  const i=TABLES.findIndex(T=>T.gx===f.gx&&T.gy===f.gy); const fx=tableFx[i]; if(!fx) return;
  if (performance.now()>fx.until){ tableFx[i]=null; return; }
  const age=(performance.now()-fx.t0)/1000; const bounce = age<0.5 ? Math.round(Math.abs(Math.sin(age*14))*(4*(1-age*2))) : 0;
  const x=sx+3, y=sy-17-bounce;
  if (fx.coin){ ellPx(x+3,y+3,4,4,INK); ellPx(x+3,y+3,3,3,'#f8d030'); g.fillStyle=INK; g.fillRect(x+2,y+1,1,4); if(fx.v===1){ g.fillRect(x+4,y+1,1,4); g.fillRect(x+2,y+3,3,1);} else { g.fillRect(x+1,y+1,4,1);} }
  else { const v= age<0.5 ? 1+Math.floor(age*40)%6 : fx.v; g.fillStyle=INK; g.fillRect(x-1,y-1,9,9); g.fillStyle='#f8f8f8'; g.fillRect(x,y,7,7); g.fillStyle=INK; for(const [a,b] of PIPS[v]) g.fillRect(x+1+a,y+1+b,1,1); }
}

// ======================= TABLE GAMES (click a lounge table) =======================
const TG_NAMES={roll:'HIGH ROLL', card:'HIGH CARD'};
const TABLE_NAMES=['PINK TABLE','BLUE TABLE'];
const tgState=[null,null];
const CARD_R=['2','3','4','5','6','7','8','9','10','J','Q','K','A'], SUITS=['♣','♦','♥','♠'];
const cardTxt=v=>CARD_R[Math.floor(v/4)]+SUITS[v%4];
const tmenuEl=document.getElementById('tmenu');
function nearTo(i,x,y){ const T=TABLES[i]; return Math.max(Math.abs(Math.floor(x)-T.gx),Math.abs(Math.floor(y)-T.gy))===1; }
function seatedAt(i, bet=0){ const list=[];
  if (joined && me.p==='sit' && !me.moving && nearTo(i,me.x,me.y) && wallet.get()>=bet) list.push({p:myPeer||'me', n:(me.n||'YOU').toUpperCase()});
  for (const o of others.values()) if (sameRoom(o) && o.p==='sit' && (o.tk||0)>=bet && nearTo(i,o.x,o.y)) list.push({p:o.id, n:o.n.toUpperCase()});
  return list; }
function amAt(i){ return joined && me.p==='sit' && !me.moving && nearTo(i,me.x,me.y); }
function freeCushion(i){ let best=null, bd=1e9; for (const s of SEATS){ if (!nearTo(i,s.gx+0.5,s.gy+0.5)) continue; if (s.gy===2) continue;
    let taken=false; for (const o of others.values()) if (sameRoom(o) && o.p==='sit' && Math.floor(o.x)===s.gx && Math.floor(o.y)===s.gy) taken=true; if (taken) continue;
    const d=Math.hypot(s.gx-me.gx,s.gy-me.gy); if(d<bd){bd=d;best=s;} } return best; }
function tableClick(i){ if (!joined) return; if (amAt(i)){ openTableMenu(i); return; } const c=freeCushion(i); if (c) walkTo(c.gx,c.gy,'tmenu'+i); else localMsg('That table is full!'); }
function openTableMenu(i){
  closeAll(); tmenuEl.dataset.t=i;
  document.getElementById('tm_title').textContent=TABLE_NAMES[i]+' GAMES';
  const ps=seatedAt(i).map(p=>p.n);
  document.getElementById('tm_who').textContent = 'AT THIS TABLE: '+(ps.length?ps.join(', '):'NOBODY');
  tmenuEl.dataset.solo = ps.length<2 ? '1' : ''; setBet(curBet());
  const busy = tgState[i] && tgState[i].phase==='join';
  for (const b of tmenuEl.querySelectorAll('[data-g]')) b.disabled = busy;
  tmenuEl.dataset.busy = busy ? '1' : ''; setBet(curBet());
  tmenuEl.style.display='block';
}
for (const b of document.querySelectorAll('#tmenu [data-g]')) b.addEventListener('click', ()=>{ const i=+tmenuEl.dataset.t; closeAll(); startTableGame(i, b.dataset.g); });
document.getElementById('tm_close').addEventListener('click', ()=>closeAll());
const MAX_BET=10, tmMinus=document.getElementById('tm_minus'), tmPlus=document.getElementById('tm_plus'), tmBet=document.getElementById('tm_bet');
const curBet = () => Math.max(0, Math.min(MAX_BET, wallet.get(), Number.isInteger(store.bet) ? store.bet : TOKENS.BET));
function setBet(v){ const cap=Math.min(MAX_BET, wallet.get()); v=Math.max(0, Math.min(cap, v)); if (store.bet!==v){ store.bet=v; saveStore(); acctSave(); }
  tmBet.textContent = v ? `${v} TOKEN${v>1?'S':''}` : 'FREE'; tmMinus.disabled = v<=0; tmPlus.disabled = v>=cap;
  const busy = tmenuEl.dataset.busy==='1';
  document.getElementById('tm_note').textContent = (busy ? 'GAME STARTING! STAY SEATED TO JOIN. ' : 'EVERYONE SEATED PLAYS THE HOUSE. ') +
    (v ? `BEAT THE HOUSE TO WIN ${v}, LOSE AND IT TAKES ${v}. YOU HAVE ${wallet.get()}.` : 'FREE GAME: NO TOKENS ON THE LINE.'); }
tmMinus.addEventListener('click', ()=>setBet(curBet()-1));
tmPlus.addEventListener('click', ()=>setBet(curBet()+1));
function startTableGame(i, game){
  if (!amAt(i)) { localMsg('Sit at the table first!'); return; }
  if (tgState[i] && tgState[i].phase==='join') return;
  NET.act('tg_start',{i, g:game}).then(r=>{ if (!r.ok) localMsg(r.msg||'Could not start a game.'); });
}
function tgServer(m){ const i=m.i===1?1:0, now=performance.now(); if (curRoom!=='lounge') return;
  if (m.ph==='join'){ tgState[i]={phase:'join', game:m.g, end:now+m.left*1000, hostName:m.host, host:false};
    sysMsg(amAt(i) ? `${m.host} started ${TG_NAMES[m.g]} vs THE HOUSE! You're in. Your bet: ${curBet()?curBet()+' TOKENS':'FREE'}. Tap the table to change it.` : `${m.host} started ${TG_NAMES[m.g]} at the ${TABLE_NAMES[i]}! Sit there to join!`); }
  else if (m.ph==='res' && m.r && m.r.length) showResult(i, m.g, m.r, Math.min(m.w, m.r.length-1));
  else if (m.ph==='cancel') tgState[i]=null;
}
function tgRemote(st, o){
  const tg=st.tg, i=tg.i, now=performance.now();
  if (tg.ph==='join'){
    tgState[i]={phase:'join', game:tg.g, end:now+tg.left*1000, hostName:st.n.toUpperCase(), host:false};
    sysMsg(amAt(i) ? `${st.n.toUpperCase()} started ${TG_NAMES[tg.g]} vs THE HOUSE! You're in. Your bet: ${curBet()?curBet()+' TOKENS':'FREE'}. Tap the table to change it.` : `${st.n.toUpperCase()} started ${TG_NAMES[tg.g]} at the ${TABLE_NAMES[i]}! Sit there to join!`);
  } else if (tg.r.length) showResult(i, tg.g, tg.r, Math.min(tg.w, tg.r.length-1));
}
function resolveTable_unused(i){
  const st=tgState[i]; const game=st.game;
  const players=seatedAt(i); if (!players.length){ tgState[i]=null; return; }
  players.push({p:'house', n:'THE HOUSE'});   // every player bets against the house
  let vals=[];
  if (game==='card'){ const deck=[...Array(52).keys()]; for(let k=deck.length-1;k>0;k--){ const j=Math.floor(Math.random()*(k+1)); [deck[k],deck[j]]=[deck[j],deck[k]]; } vals=players.map((_,k)=>deck[k]); }
  else vals=players.map(()=>1+Math.floor(Math.random()*6));
  let w=0; vals.forEach((v,k)=>{ if(v>vals[w]) w=k; });
  const r=players.map((p,k)=>({p:p.p, n:p.n, v:vals[k]}));
  me.tgK=(me.tgK||0)+1; me.lastTG={k:me.tgK, i, g:game, ph:'res', r, w}; sendPresence(true);
  showResult(i, game, r, w);
}
function showResult(i, game, r, w){
  tgState[i]={phase:'res', game, r, w, until:performance.now()+8000, start:performance.now()};
  const W=r[w]; const winnerIsMe = W.p==='me' || (myPeer && W.p===myPeer);
  const val = game==='roll' ? W.v : cardTxt(W.v);
  const H=r.find(x=>x.p==='house'); const show=v=> game==='roll' ? v : cardTxt(v);
  const beat=r.filter(x=>x.p!=='house' && H && x.v>H.v).map(x=>x.n);
  const tied=r.filter(x=>x.p!=='house' && H && x.v===H.v).map(x=>x.n);
  if (H) sysMsg(`THE HOUSE drew ${show(H.v)}. ` + (beat.length ? `${beat.join(', ')} beat the house!` : tied.length ? `${tied.join(', ')} tied the house.` : 'The house wins this round!'));
  // your own bet is settled on the server, which sends the result and your new balance
  if (game==='roll') tableShow(i, W.v, false);
}
function tgTick(){ const now=performance.now();
  for (let i=0;i<tgState.length;i++){ const st=tgState[i]; if(!st) continue;
    if (st.phase==='join' && now>st.end){ if (false) {} else if (now>st.end+4000) tgState[i]=null; }
    else if (st.phase==='res' && now>st.until) tgState[i]=null; } }
function refFor(p){ if (p==='me' || (myPeer && p===myPeer)) return joined?me:null; return others.get(p)||null; }
function drawTableGames(c, t){
  const now=performance.now(); c.textBaseline='top';
  for (let i=0;i<tgState.length;i++){ const st=tgState[i]; if(!st) continue; const [tx,ty]=P(TABLES[i].gx+0.5,TABLES[i].gy+0.5);
    if (st.phase==='join'){ const left=Math.max(0,Math.ceil((st.end-now)/1000)); if (Math.floor(t*3)%2===0 || left<=3){
        const label='JOIN! '+left; c.font=AF(8); const w=Math.ceil(c.measureText(label).width)+8; const bx=Math.round(tx-w/2), by=Math.round(ty-44);
        c.fillStyle=INK; c.fillRect(bx-1,by-1,w+2,11); c.fillStyle='#f8d030'; c.fillRect(bx,by,w,9); c.fillStyle=INK; c.fillText(label,bx+4,by+2);
        c.fillStyle=INK; c.fillRect(Math.round(tx)-2,by+10,5,1); c.fillRect(Math.round(tx)-1,by+11,3,1); }
      continue; }
    // results: badge over each player's head
    st.r.forEach((r,k)=>{ const ref = r.p==='house' ? null : refFor(r.p); let hx,hy;
      if (ref){ const [wx,wy]=llamaWorld(ref); hx=OX+wx; hy=OY+wy-22; } else if (r.p==='house'){ hx=tx; hy=ty-19; } else return;
      const hv=(st.r.find(x=>x.p==='house')||{v:-1}).v; const anyBeat=st.r.some(x=>x.p!=='house'&&x.v>hv);
      const win = r.p==='house' ? st.r.every(x=>x.p==='house'||x.v<hv) : r.v>hv; const txt = st.game==='roll' ? String(r.v) : cardTxt(r.v);
      const red = st.game==='card' && (r.v%4===1||r.v%4===2);
      // white plate in the name-tag style: ink outline with clipped corners, colour pip (gold for a win), pixel font, pointer
      const lab = r.p==='house' ? 'HOUSE '+txt : txt; const tw=pfW(lab), w=tw+9, h=9;
      const bx=Math.round(hx-w/2), by=Math.round(hy-h-2);
      c.fillStyle=INK; c.fillRect(bx+1,by,w-2,h); c.fillRect(bx,by+1,w,h-2);
      c.fillRect(Math.round(hx)-1,by+h,3,1); c.fillRect(Math.round(hx),by+h+1,1,1);
      c.fillStyle='#f8f8f8'; c.fillRect(bx+1,by+1,w-2,h-2);
      c.fillStyle = win ? '#f8d030' : '#a8a8b8'; c.fillRect(bx+2,by+3,2,3);
      if (r.p==='house'){ pfDraw(c,'HOUSE ',bx+6,by+2,'#5a5070'); pfDraw(c,txt,bx+7+pfW('HOUSE '),by+2,red?'#e02838':INK); }
      else pfDraw(c,txt,bx+6,by+2,red?'#e02838':INK);
      if (win){ const cx=Math.round(hx), cy=by-8+(Math.floor(t*4)%2); c.fillStyle=INK; c.fillRect(cx-6,cy-1,13,8); c.fillStyle='#f8d030'; c.fillRect(cx-5,cy+2,11,4); c.fillRect(cx-5,cy,2,2); c.fillRect(cx-1,cy-0,3,2); c.fillRect(cx+4,cy,2,2); c.fillStyle='#f84848'; c.fillRect(cx-1,cy+3,2,2); }
    });
  }
}


// ======================= ROOMS: LLAMA LOUNGE <-> LLAMA ACRES =======================
const roomPickEl=document.getElementById('roompick'), loadingEl=document.getElementById('loading');
// where you appear in a room, by the room you came from
const ENTRY = { lounge:{ any:{at:[1,10], to:[3,10]} }, barn:{ any:{at:[14,1], to:[13,3]} }, casino:{ any:{at:[1,10], to:[3,10]} }, arena:{ any:{at:[1,10], to:[3,10]} }, lanes:{ any:{at:[1,10], to:[3,10]} }, store:{ any:{at:[1,10], to:[3,10]} }, account:{ any:{at:[1,5], to:[2,4]} }, gym:{ any:{at:[1,10], to:[3,10]} }, cove:{ any:{at:[0,8], to:[3,8]} }, jungle:{ any:{at:[0,8], to:[3,8]} } };
let entryFrom = null;
const entryFor = r => { const E=ENTRY[r]; return (entryFrom && E[entryFrom]) || E.any || E[Object.keys(E)[0]]; };
// pick a free tile near the room's entrance so new arrivals don't stand on top of each other
function spawnSpot(r){ const [cx,cy]=entryFor(r).to; const taken=new Set(); for (const o of others.values()) if (!o.leaving && sameRoom(o)) taken.add(Math.floor(o.tx??o.x)+','+Math.floor(o.ty??o.y));
  const opts=[]; for (let dy=-2;dy<=2;dy++) for (let dx=-2;dx<=2;dx++){ const x=cx+dx, y=cy+dy; if (!walkable(x,y) || seatAt(x,y) || taken.has(x+','+y)) continue; if (curRoom==='lounge' && DANCE.has(y*N+x)) continue; opts.push([x,y]); }
  return opts.length ? opts[Math.floor(Math.random()*opts.length)] : [cx,cy]; }
function roomCount(r){ let n=(joined&&curRoom===r)?1:0; for (const o of others.values()) if(!o.leaving && (o.rm||'lounge')===r) n++; return n; }
function showRoomPick(first){
  // launching, tapping a door and leaving a room all open the ROOMS pop-up (MAP and PLAYER ROOMS tabs), on the tab you had last
  if (typeof openRooms==='function'){ loadingEl.style.display='none'; roomPickEl.style.display='none'; openRooms(); return; }
  closeAll(); loadingEl.style.display='none';
  document.getElementById('rp_title').textContent = first ? `WELCOME${acctHasLlama()||store.n?' BACK':''}, ${(me.n||'LLAMA').toUpperCase()}! WHERE TO?` : 'LLAMA MAP';
  for (const b of roomPickEl.querySelectorAll('[data-r]')) b.classList.toggle('here', joined && b.dataset.r===curRoom);
  for (const r of ROOMS){ const n=roomCount(r); document.getElementById('rp_n_'+r).textContent = (joined&&curRoom===r) ? `YOU ARE HERE${n>1?' · '+n+' LLAMAS':''}` : (n ? `${n} LLAMA${n>1?'S':''} HERE` : 'NOBODY HERE YET'); }
  document.getElementById('rp_close').style.display = joined ? '' : 'none';
  roomPickEl.dataset.first = first ? '1' : ''; roomPickEl.style.display='flex';
}
// first room after launching joins the game; after that it's a normal room switch
function goRoom(r){ roomPickEl.style.display='none'; $id('roomsbox').style.display='none';
  if (!joined){ if (tourWanted()) setTimeout(()=>{ if (joined && !TOUR.on) tourStart(); }, 1600);   /* brand-new llamas get the tour first; the daily reward waits until it's done */
    else if (dailyLater){ dailyLater=false; setTimeout(()=>{ if (!uiOpen() && $id('roomsbox').style.display!=='block') dailyPop(); }, 1800); } ensureAudio(); restartSong(); setRoom(r); joined=true; updateRoombar(); flash(); sysMsg(`${me.n} entered ${ROOM_NAMES[r]}!`); if (wallet.get()) localMsg(`You have ${wallet.get()} TOKENS.`); setTimeout(()=>walkTo(...spawnSpot(r)), 500); sendPresence(true); }
  else switchRoom(r); }
for (const b of document.querySelectorAll('#roompick [data-r]')) b.addEventListener('click', ()=>goRoom(b.dataset.r));
document.getElementById('rp_close').addEventListener('click', ()=>{ roomPickEl.style.display='none'; });

function setRoom(r){ if (typeof TOUR!=='undefined' && TOUR.on) setTimeout(()=>tourGuide(true), 0); if (me.fish) stopFish(true); if (typeof AR!=='undefined' && AR.on) arenaClose(true); if (typeof BW!=='undefined' && BW.on) bowlClose(true);
  curRoom = (ROOMS.includes(r) || (isP(r) && PRD[r])) ? r : 'lounge'; store.room = isP(curRoom) ? 'lounge' : curRoom; saveStore();
  if (typeof prEditStop==='function') prEditStop();
  buildWorld(); rebuildBG();
  if (typeof bxHudDraw==='function'){ bxHudDraw(); coveHud(); if (curRoom==='cove' || curRoom==='jungle') enterCove(); if (curRoom==='gym') NET.act('box_info').then(r=>{ if (r && r.ok){ BXUI.info=r; BXS.s=r.s; bxHudDraw(); } }); }
  me.bar=false; me.path=[]; me.moving=false; me.p='stand'; me.pending=null; me.after=null; me.prog=0;
  const [sx,sy]=entryFor(curRoom).at; me.gx=sx; me.gy=sy; me.x=sx+0.5; me.y=sy+0.5; me.d='fr';
  tgState[0]=tgState[1]=null; tableFx[0]=tableFx[1]=null; camInit=false; camMan=false;
  document.getElementById('stitle').textContent = roomName(curRoom); updateStatus(); updateRoombar(); setTimeout(roombarShowHere, 50);
}
// ---- bottom-left room selector: walk to the doorway, then confirm the swap ----
const swapEl=document.getElementById('swapbox'), roombarEl=document.getElementById('roombar'); let swapTo=null;
const DOORWAY = { lounge:[0,10], barn:[14,1], casino:[0,10], arena:[0,10], lanes:[0,10], store:[0,10], account:[0,5], gym:[0,10], cove:[0,8], jungle:[0,8] };   // each room has one door; you walk to it whichever room you're going to
function showSwap(r){ if (!joined || r===curRoom || !validRoom(r)) return; if (isP(r) && !PRD[r]){ prGo(+r.slice(2)); return; } closeAll(); swapTo=r; document.getElementById('sw_text').textContent=`GO TO ${roomName(r)}?`; swapEl.style.display='block'; }
document.getElementById('sw_go').addEventListener('click', ()=>{ swapEl.style.display='none'; const r=swapTo; swapTo=null; if (!r) return; if (isP(r)){ prGo(+r.slice(2)); return; } if (arcade.on) exitArcade(); localMsg(`Heading to ${roomName(r)}...`); goThroughDoor(r); });
// the door art sits on a wall next to the doorway tile: tapping it (or the doorway tile) opens the map
function doorHit(e){ const d=DOORWAY[curRoom]; if (!d) return false; const [gx,gy]=toGrid(e.clientX,e.clientY); if (gx===d[0] && gy===d[1]) return true;
  const lx=e.clientX/S, ly=e.clientY/S; let px, py, w=12; if (curRoom==='barn'){ [px,py]=P(14.5,0); w=20; } else if (d[0]===0) [px,py]=P(0, d[1]+0.5); else if (d[1]===0) [px,py]=P(d[0]+0.5, 0); else return false;   /* LLAMA ACRES: the farm gate in the fence */
  return Math.abs(lx-px)<=w && ly>=py-52 && ly<=py+4; }
function goThroughDoor(r){ const [dx,dy]=DOORWAY[curRoom]||[0,10]; if (me.gx===dx && me.gy===dy && !me.moving && !me.bar){ switchRoom(r); return; } me.travelTo=r; if (!walkTo(dx,dy,'travel')){ me.travelTo=null; switchRoom(r); } }
document.getElementById('sw_stay').addEventListener('click', ()=>{ swapEl.style.display='none'; swapTo=null; });
function updateRoomsSign(){ const el=$id('rooms_on'), btn=$id('roomsbtn'); if (!el) return; const n=[...others.values()].filter(o=>!o.leaving && isP(o.rm)).length + (isP(curRoom)?1:0); el.textContent=n||''; el.classList.toggle('on', n>0); btn.classList.toggle('here', isP(curRoom)); }
function updateRoombar(){ updateRoomsSign(); roombarEl.style.display = joined ? 'flex' : 'none'; document.getElementById('dock').classList.toggle('on', !!joined); document.body.classList.toggle('joined', !!joined); for (const b of roombarEl.querySelectorAll('[data-go]')){ const r=b.dataset.go; b.classList.toggle('here', r===curRoom); const n = roomCount(r); const [ic,lb]=({lounge:['🍸','LOUNGE'], barn:['🌾','ACRES'], casino:['🎰','CASINO'], arena:['💦','ARENA'], lanes:['🎳','LANES'], store:['🛍️','STORE'], account:['🔐','ACCOUNT']})[r] || ['🚪',r.toUpperCase()]; b.innerHTML = `<span class="ri">${ic}</span><span class="rl">${lb}</span>` + (n ? `<span class="cnt">${n}</span>` : ''); } }
// fades show which side has more rooms; a mouse wheel scrolls the bar sideways; your room's tab stays in view
function roombarEdges(){ const el=roombarEl, max=el.scrollWidth-el.clientWidth; el.classList.toggle('fl', el.scrollLeft>2); el.classList.toggle('fr', max>2 && el.scrollLeft<max-2);
  const w=document.getElementById('rbwrap'); if (w){ w.classList.toggle('over', max>2); document.getElementById('rb_l').disabled = el.scrollLeft<=2; document.getElementById('rb_r').disabled = el.scrollLeft>=max-2; } }
document.getElementById('rb_l').addEventListener('click', ()=>roombarEl.scrollBy({left:-180, behavior:'smooth'}));
document.getElementById('rb_r').addEventListener('click', ()=>roombarEl.scrollBy({left:180, behavior:'smooth'}));
// click and drag the bar sideways with a mouse (a real drag doesn't count as a click on a room)
{ let sx=0, sl=0, down=false, dragged=false;
  roombarEl.addEventListener('pointerdown', e=>{ if (e.pointerType!=='mouse' || roombarEl.scrollWidth<=roombarEl.clientWidth) return; down=true; dragged=false; sx=e.clientX; sl=roombarEl.scrollLeft; });
  addEventListener('pointermove', e=>{ if (!down) return; const dx=e.clientX-sx; if (!dragged && Math.abs(dx)>5){ dragged=true; roombarEl.classList.add('dragging'); } if (dragged) roombarEl.scrollLeft=sl-dx; });
  addEventListener('pointerup', ()=>{ if (!down) return; down=false; roombarEl.classList.remove('dragging'); if (dragged) setTimeout(()=>{ dragged=false; }, 0); });
  roombarEl.addEventListener('click', e=>{ if (dragged){ e.stopPropagation(); e.preventDefault(); } }, true); }
roombarEl.addEventListener('scroll', roombarEdges, {passive:true}); addEventListener('resize', roombarEdges);
roombarEl.addEventListener('wheel', e=>{ if (Math.abs(e.deltaY)>Math.abs(e.deltaX) && roombarEl.scrollWidth>roombarEl.clientWidth){ e.preventDefault(); roombarEl.scrollLeft+=e.deltaY; } }, {passive:false});
function roombarShowHere(){ const b=roombarEl.querySelector('.here'); if (b && roombarEl.scrollWidth>roombarEl.clientWidth){ const L=b.offsetLeft, R=L+b.offsetWidth; if (L<roombarEl.scrollLeft || R>roombarEl.scrollLeft+roombarEl.clientWidth) roombarEl.scrollTo({left:Math.max(0,L-24), behavior:'smooth'}); } roombarEdges(); }
for (const b of roombarEl.querySelectorAll('[data-go]')) b.addEventListener('click', ()=>{ ensureAudio(); const r=b.dataset.go;
  if (!joined) return; if (r==='rooms'){ openRooms(); return; } if (r===curRoom){ localMsg(`You're already in ${ROOM_NAMES[r]}.`); return; }
  showSwap(r); });
function switchRoom(r){
  if (r===curRoom){ localMsg(`You're already in ${roomName(r)}.`); return; }
  if (arcade.on) exitArcade();
  entryFrom = curRoom; setRoom(r); flash(); sendPresence(true);
  if (isP(r)){ localMsg(`Welcome to ${roomName(r)}!`); setTimeout(()=>walkTo(...spawnSpot(r)), 400); if (PRED.pending){ PRED.pending=false; setTimeout(prEditStart, 600); } return; }
  if (r==='gym' || r==='cove' || r==='jungle'){ localMsg(r==='gym' ? 'Welcome to the BOXING GYM! Tap the ring to box a bot or challenge a llama. Punch a heavy bag for fun.' : r==='jungle' ? 'Welcome to the JUNGLE TEMPLE! Treasure is buried round the ruins. Follow the detector and press DIG.' : 'Welcome to TREASURE COVE! Your detector beeps faster the closer you are. Stand on the spot and press DIG.'); setTimeout(()=>walkTo(...spawnSpot(r)), 400); return; }
  localMsg(r==='account' ? `Welcome to ACCOUNT! Step into the booth to switch llamas (${BOOTH_PRICE} TOKENS), or visit the desk for your email and password.` : r==='barn' ? 'You stepped outside to LLAMA ACRES!' : r==='casino' ? 'Welcome to the LLAMA CASINO! Feeling lucky?' : r==='arena' ? 'Welcome to the SPIT ARENA! Press PLAY to start a round.' : r==='lanes' ? 'Welcome to LLAMA LANES! Press BOWL to roll a game.' : r==='store' ? 'Welcome to the LLAMA STORE! Tap a shirt on the wall, or the counter to see them all.' : 'You headed back into the LLAMA LOUNGE!');
  setTimeout(()=>walkTo(...spawnSpot(r)), 400);
}
// showroom pieces: a price tag and a tap area that opens the furniture shop
function showroomTag(f){ const [bx,by]=P(f.gx+0.5,f.gy+0.95,0), X=Math.round(bx), Y=Math.round(by);
  if (!f.notag){ g.fillStyle=OUT; g.fillRect(X-6,Y-3,12,7); g.fillStyle='#fff8e0'; g.fillRect(X-5,Y-2,10,5); pfDraw(g, String(FURN_DEF[f.show].p), X-4, Y-2, '#a06808', 1); }
  const top=P(f.gx+0.5,f.gy+0.5,36), l=P(f.gx,f.gy+1,0), r=P(f.gx+1,f.gy,0), b=P(f.gx+1,f.gy+1,0);
  itemHits.push({id:f.show, furn:true, x0:Math.round(l[0]), x1:Math.round(r[0]), y0:Math.round(top[1]), y1:Math.round(b[1])+4}); }
// tap the vending machine: open it if you're next to it, otherwise walk over and open it when you get there
function svendGo(){ if (me.p!=='sit' && nearStand(STANDS.svend)){ openFw('svend'); return; } if (me.p==='sit') doAction('stand'); if (!walkTo(STORE_SNACK[0],STORE_SNACK[1]+1,'svend')) localMsg('Walk up to the snack machine.'); }
function vendGo(){ if (me.p!=='sit' && nearStand(STANDS.vend)){ openFw('vend'); return; } if (me.p==='sit') doAction('stand'); if (!walkTo(STORE_VEND[0],STORE_VEND[1]+1,'vend')) localMsg('Walk up to the vending machine.'); }
function storePointer(e){
  const lx=e.clientX/S, ly=e.clientY/S;
  for (let i=itemHits.length-1;i>=0;i--){ const h=itemHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if (h.furn) openWardrobe('shop', null, 'rares'); else openWardrobe('shop', h.id); return; } }
  if (svendHit && lx>=svendHit.x0&&lx<=svendHit.x1&&ly>=svendHit.y0&&ly<=svendHit.y1){ svendGo(); return; }
  if (vendHit && lx>=vendHit.x0&&lx<=vendHit.x1&&ly>=vendHit.y0&&ly<=vendHit.y1){ vendGo(); return; }
  for (const h of shopHit){ if (lx>=h.x0&&lx<h.x1&&ly>=h.y0&&ly<=h.y1){ openShop(h.i); return; } }
  { const lcx=OX-210, lcy=OY+105-75.5; if (Math.abs(lx-lcx)<=13 && Math.abs(ly-lcy)<=13){ openLogo(); return; } }
  for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } if (me.h){ doAction('sip'); return; } break; } }
  const [gx,gy]=toGrid(e.clientX, e.clientY); if (gx<0||gy<0||gx>=N||gy>=NY) return;
  { const it=rackItemAt(gx,gy); if (it){ openWardrobe('shop', it); return; } }
  if (STORE_CASE.some(([x,y])=>x===gx&&y===gy)){ openWardrobe('shop', gx===7 ? 'stars' : 'shades'); return; }
  if (gx===STORE_VEND[0] && gy===STORE_VEND[1]){ vendGo(); return; }
  if (gx===STORE_SNACK[0] && gy===STORE_SNACK[1]){ svendGo(); return; }
  if (STORE_COUNTER.some(([x,y])=>x===gx&&y===gy)){ openCatalog(); return; }
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const s2 of SEATS){ const d=Math.abs(s2.gx-gx)+Math.abs(s2.gy-gy); if(d<=1 && d<bd){ bd=d; best=s2; } }
  if (best) walkTo(best.gx,best.gy);
}
function lanesPointer(e){
  const lx=e.clientX/S, ly=e.clientY/S;
  for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } if (me.h){ doAction('sip'); return; } break; } }
  for (const h of laneMonHit) if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ openBowl(); return; }
  const [gx,gy]=toGrid(e.clientX, e.clientY); if (gx<0||gy<0||gx>=N||gy>=NY) return;
  if (laneAt(gx,gy)>=0){ openBowl(); return; }
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const s2 of SEATS){ const d=Math.abs(s2.gx-gx)+Math.abs(s2.gy-gy); if(d<=1 && d<bd){ bd=d; best=s2; } }
  if (best) walkTo(best.gx,best.gy);
}
function arenaPointer(e){
  const lx=e.clientX/S, ly=e.clientY/S;
  for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } if (me.h){ doAction('sip'); return; } break; } }
  if (arenaBoardHit && lx>=arenaBoardHit.x0 && lx<=arenaBoardHit.x1 && ly>=arenaBoardHit.y0 && ly<=arenaBoardHit.y1){ openArena(); return; }
  const [gx,gy]=toGrid(e.clientX, e.clientY); if (gx<0||gy<0||gx>=N||gy>=NY) return;
  if (Math.hypot(gx+0.5-ARENA_RING.cx, gy+0.5-ARENA_RING.cy) < ARENA_RING.r){ openArena(); return; }
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const s2 of SEATS){ const d=Math.abs(s2.gx-gx)+Math.abs(s2.gy-gy); if(d<=1 && d<bd){ bd=d; best=s2; } }
  if (best) walkTo(best.gx,best.gy);
}
function casinoPointer(e){
  const lx=e.clientX/S, ly=e.clientY/S;
  for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } if (me.h){ doAction('sip'); return; } break; } }
  const [gx,gy]=toGrid(e.clientX, e.clientY); if (gx<0||gy<0||gx>=N||gy>=NY) return;
  if (me.p==='sit' && (seatIn(ROUL_SEATS,me.gx,me.gy)||seatIn(BJ_SEATS,me.gx,me.gy)) && !walkable(gx,gy) && Math.abs(gx-me.gx)<=2 && Math.abs(gy-me.gy)<=2){ openTable(seatIn(BJ_SEATS,me.gx,me.gy)?'bj':'roul'); return; }
  if (gy===0 && CASINO_SLOT_X.includes(gx)){ if (me.p==='sit' && me.gx===gx && me.gy===1) slotSpin(); else walkTo(gx,1); return; }
  if (plkHit(lx,ly) || (gx===PLK.gx && (gy===PLK.gy||gy===PLK.gy+1))){ plkGo(); return; }
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const s2 of SEATS){ const d=Math.abs(s2.gx-gx)+Math.abs(s2.gy-gy); if(d<=1 && d<bd){ bd=d; best=s2; } }
  if (best) walkTo(best.gx,best.gy);
}
function boothNear(){ return Math.abs(me.gx-BOOTH[0])<=1 && Math.abs(me.gy-BOOTH[1])<=1 && !me.moving; }
function deskGo(){ if (Math.abs(me.gx-ACCT_DESK[0]-0.5)<=1.5 && me.gy<=1 && !me.moving && me.p!=='sit'){ openAccount(); return; } if (me.p==='sit') doAction('stand'); if (!walkTo(ACCT_DESK[0],ACCT_DESK[1]+1,'acctdesk') && !walkTo(ACCT_DESK[0]+1,ACCT_DESK[1]+1,'acctdesk')) localMsg('Walk up to the account desk.'); }
function accountPointer(e){
  const lx=e.clientX/S, ly=e.clientY/S, [gx,gy]=toGrid(e.clientX, e.clientY), inH=h=>h && lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1;
  for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (inH(h)){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } if (me.h){ doAction('sip'); return; } break; } }
  if ((gx===BOOTH[0]&&gy===BOOTH[1]) || inH(boothHit)){ boothGo(); return; }
  if ((gy===ACCT_DESK[1] && (gx===ACCT_DESK[0]||gx===ACCT_DESK[0]+1)) || inH(deskHit)){ deskGo(); return; }
  if (gx<0||gy<0||gx>=N||gy>=NY) return;
  const st=seatAt(gx,gy); if (st){ if (seatTaken(st.gx,st.gy)) localMsg("Someone's already sitting there."); else walkTo(gx,gy); return; }
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
}
function boothGo(){ if (boothNear() && me.p!=='sit'){ openBooth(); return; } if (me.p==='sit') doAction('stand'); if (!walkTo(BOOTH[0],BOOTH[1]+1,'booth') && !walkTo(BOOTH[0]-1,BOOTH[1]+1,'booth')) localMsg('Walk up to the changing booth.'); }
function barnPointer(e){
  const lx=e.clientX/S, ly=e.clientY/S;
  { const [gx0,gy0]=toGrid(e.clientX, e.clientY); const [px,py]=P(DUNK_TGT[0]+0.5,DUNK_TGT[1]+0.5,0);
    if ((gx0===DUNK_TGT[0]&&gy0===DUNK_TGT[1]) || (Math.abs(lx-px)<=11 && ly>=py-50 && ly<=py-26)){ if (inDunkZone() && me.p!=='sit' && !me.moving) openDunk(); else walkTo(DUNK_TGT[0], DUNK_TGT[1]+2, 'dunk'); return; } }
  for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } if (me.h){ doAction('sip'); return; } break; } }
  const [gx,gy]=toGrid(e.clientX, e.clientY); if (gx<0||gy<0||gx>=N||gy>=NY) return;
  if (POND.some(([x,y])=>x===gx&&y===gy)){ if (me.fish) return; if (pondNear() && me.p!=='sit') startFish(); else { let best=null,bd=1e9; for (const [x,y] of POND) for (const [dx,dy] of DIRS8){ const ax=x+dx, ay=y+dy; if(!walkable(ax,ay)) continue; const d=Math.hypot(ax-me.gx,ay-me.gy); if(d<bd){bd=d;best=[ax,ay];} } if (best) walkTo(best[0],best[1],'fish'); } return; }
  for (const k in STANDS){ const ST=STANDS[k]; const [px,py]=P(ST.gx+1,ST.gy+0.5);
    if ((gy===ST.gy && (gx===ST.gx||gx===ST.gx+1)) || (Math.abs(lx-px)<=34 && ly>=py-62 && ly<=py+10)){ if (nearStand(ST) && me.p!=='sit') openFw(k); else { const a=nearestFree(ST.gx,ST.gy), b=nearestFree(ST.gx+1,ST.gy); const d=q=>q?Math.hypot(q[0]-me.gx,q[1]-me.gy):1e9; const t=d(a)<=d(b)?a:b; if (t) walkTo(t[0],t[1],k==='cider'?'fw':'snack'); } return; } }
  const ap=FURN.find(f=>f.t==='apple'&&f.gx===gx&&f.gy===gy);
  if (ap){ if (!appleReady(ap.k)){ localMsg('Just a core left. That apple will grow back soon!'); return; }
    me.appleK=ap.k; if (near(gx,gy)&&me.p!=='sit') eatApple(ap.k); else { const t=nearestFree(gx,gy); if (t) walkTo(t[0],t[1],'eat'); } return; }
  const crop=CROPS.find(c=>c.gx===gx&&c.gy===gy);
  if (crop){ me.cropK=crop.k; if (near(gx,gy)&&me.p!=='sit') harvest(crop.k); else { const t=nearestFree(gx,gy); if (t) walkTo(t[0],t[1],'harvest'); } return; }
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const s of SEATS){ const d=Math.abs(s.gx-gx)+Math.abs(s.gy-gy); if(d<=1 && d<bd){ bd=d; best=s; } }
  if (best) walkTo(best.gx,best.gy);
}
// ---- apples: tap one to eat it; everyone in LLAMA ACRES sees it go, and it grows back ----
const APPLE_MS = 120000;
const appleState = {};   // apple key -> {back: time it regrows, at: when it was eaten}
function appleReady(k){ const a=appleState[k]; return !a || Date.now()>=a.back; }
function appleBite(k){ const a=appleState[k]; return a ? (Date.now()-a.at)/1000 : 99; }
function eatApple(k){
  if (curRoom!=='barn' || me.p==='sit' || me.moving) return;
  const ap = FURN.find(f=>f.t==='apple' && f.k===k); if (!ap || !near(ap.gx,ap.gy)) return;
  if (!appleReady(k)){ localMsg('Someone already ate that one. It will grow back soon!'); return; }
  appleState[k]={back:Date.now()+APPLE_MS, at:Date.now()}; NET.act('apple').then(r=>{ if (r && r.nd) ndSet(r.nd); if (r && r.full) setTimeout(()=>localMsg(`+${r.full} 🍔 That hit the spot!`), 900); });
  face(ap.gx,ap.gy); me.eaK=(me.eaK||0)+1; me.lastEat={k:me.eaK, a:k}; sendPresence(true);
  localMsg(['CRUNCH! A juicy red apple.','Mmm, sweet and crisp!','Apple a day keeps the vet away!'][me.eaK%3]); try { if (actx && actx.state==='running'){ const t0=actx.currentTime; noise(t0,0.07,0.6,1800,sfxBus); noise(t0+0.09,0.06,0.45,2200,sfxBus); } } catch(_){}
}
// ---- market stands in LLAMA ACRES: spend tokens on cider or a snack you carry around (the server charges for it) ----
const fwEl=document.getElementById('fwbox');
const STANDS={ bar:{gx:0,gy:2, title:'🍸 THE BAR', note:'DRINKS FILL 💧 THIRST, FOOD FILLS 🍔 HUNGER. ENJOY IT ANYWHERE!', items:[['soda','HAY SODA',1],['juice','GRASS JUICE',2],['shake','BERRY SHAKE',3],['fries','ALFALFA FRIES',1],['nachos','HAY NACHOS',2],['burger','CLOVER BURGER',3]]},
  cider:{gx:7,gy:4, title:'🍎 APPLE CIDER', note:'FRESH PRESSED FROM THE ORCHARD. SIP IT ANYWHERE!', items:[['ajuice','APPLE JUICE',1],['cider','HOT CIDER',2],['caramel','CARAMEL CIDER',3]]},
  svend:{gx:4,gy:0, rm:'store', title:'🍪 SNACK MACHINE', note:'CRUNCHY, SWEET AND READY. EAT IT ANYWHERE!', items:[['chips','HAY CHIPS',1],['candy','CANDY BAR',2],['cookie','OAT COOKIE',3]]},
  vend:{gx:5,gy:0, rm:'store', title:'🥤 VENDING MACHINE', note:'ICE COLD AND READY. SIP IT ANYWHERE!', items:[['soda','HAY SODA',1],['juice','GRASS JUICE',2],['shake','BERRY SHAKE',3]]},
  snack:{gx:10,gy:4, title:'🌽 FARM SNACKS', note:'HOMEMADE TREATS FROM LLAMA ACRES. EAT IT ANYWHERE!', items:[['corn','CORN ON THE COB',1],['capple','CARAMEL APPLE',2],['pie','APPLE PIE',3]]} };
let standOpen=null;
const nearStand = ST => near(ST.gx,ST.gy) || near(ST.gx+1,ST.gy);   // stalls are two tiles wide
// vending machines placed in player rooms (anyone in the room can use them; the server checks the machine is really there)
const PV_ITEMS = { vending:{title:'🥤 DRINK MACHINE', note:'ICE COLD AND READY. SIP IT ANYWHERE!', items:[['soda','HAY SODA',1],['juice','GRASS JUICE',2],['shake','BERRY SHAKE',3]]},
  snackvend:{title:'🍪 SNACK MACHINE', note:'CRUNCHY, SWEET AND READY. EAT IT ANYWHERE!', items:[['chips','HAY CHIPS',1],['candy','CANDY BAR',2],['cookie','OAT COOKIE',3]]} };
const pvHits=[];
const pvNear = () => isP(curRoom) && me.p!=='sit' ? FURN.find(f=>f.fid && PV_ITEMS[f.item] && Math.abs(me.gx-f.gx)<=1 && Math.abs(me.gy-f.gy)<=1) : null;
function pvOpen(f){ f = f || (me.pvF && FURN.find(q=>q.fid===me.pvF && Math.abs(me.gx-q.gx)<=1 && Math.abs(me.gy-q.gy)<=1)) || pvNear(); me.pvF=null; if (!f) return; const D=PV_ITEMS[f.item]; STANDS.pv={gx:f.gx, gy:f.gy, rm:curRoom, fid:f.fid, title:D.title, note:D.note, items:D.items}; openFw('pv'); }
function pvGo(f){ if (f.item==='plot'){ plotGo(f); return; } if (me.p!=='sit' && Math.abs(me.gx-f.gx)<=1 && Math.abs(me.gy-f.gy)<=1){ pvOpen(f); return; } if (me.p==='sit') doAction('stand');
  const spots=[[f.gx,f.gy+1],[f.gx+1,f.gy+1],[f.gx-1,f.gy+1],[f.gx+1,f.gy],[f.gx-1,f.gy]].filter(([x,y])=>x>=0&&y>=0&&x<N&&y<NY&&walkable(x,y)).sort((p,q)=>Math.hypot(p[0]-me.gx,p[1]-me.gy)-Math.hypot(q[0]-me.gx,q[1]-me.gy));
  me.pvF=f.fid; if (!spots.length || !walkTo(spots[0][0], spots[0][1], 'pvend')) localMsg('Walk up to the machine.'); }
// ---- garden plots: walk up and PLANT, WATER (visitors) or HARVEST (the farmer); the server checks all of it ----
const plotNear = () => { if (!isP(curRoom) || me.p==='sit') return null; const ok=f=>f.fid && f.item==='plot' && Math.abs(me.gx-f.gx)<=1 && Math.abs(me.gy-f.gy)<=1 && !(me.gx===f.gx&&me.gy===f.gy);
  /* two plots next to you: the one you used last, then the one straight ahead (not diagonal) */
  return FURN.find(f=>ok(f) && f.fid===plotCur) || FURN.find(f=>ok(f) && (f.gx===me.gx||f.gy===me.gy)) || FURN.find(ok) || null; };
const plotMine = () => !!(PRD[curRoom] && PRD[curRoom].mine);
function plotLabel(){ const f=plotNear(), st=plotState(f), mine=plotMine(); if (!st) return mine?'PLANT':'PLOT'; if (st.ready) return mine?'HARVEST':'RIPE!'; return (!mine && !st.wat) ? 'WATER' : 'GROWING'; }
function plotGo(f){ if (me.p!=='sit' && Math.abs(me.gx-f.gx)<=1 && Math.abs(me.gy-f.gy)<=1){ plotOpen(f); return; } if (me.p==='sit') doAction('stand');
  const spots=[[f.gx,f.gy+1],[f.gx+1,f.gy],[f.gx-1,f.gy],[f.gx,f.gy-1],[f.gx+1,f.gy+1],[f.gx-1,f.gy+1],[f.gx+1,f.gy-1],[f.gx-1,f.gy-1]].filter(([x,y])=>x>=0&&y>=0&&x<N&&y<NY&&walkable(x,y)).sort((p,q)=>Math.hypot(p[0]-me.gx,p[1]-me.gy)-Math.hypot(q[0]-me.gx,q[1]-me.gy));
  me.plotF=f.fid; if (!spots.length || !walkTo(spots[0][0], spots[0][1], 'plot')) localMsg('Walk up to the plot.'); }
let plotCur=null;
function plotOpen(f){ f = f || (me.plotF && FURN.find(q=>q.fid===me.plotF && Math.abs(me.gx-q.gx)<=1 && Math.abs(me.gy-q.gy)<=1)) || plotNear(); me.plotF=null; if (!f) return;
  face(f.gx, f.gy); const st=plotState(f), mine=plotMine();
  if (st && st.ready && mine) return plotDo('farm_harvest', f);
  if (st && !st.ready && !mine && !st.wat) return plotDo('farm_water', f);
  plotCur=f.fid; plotDraw(); const box=$id('plotbox'); box.style.display='block'; if (typeof sheetHead==='function') sheetHead(box); }
function plotDo(act, f, crop){ NET.act(act, {fid:f.fid, crop}).then(r=>{ if (!r.ok){ localMsg(r.msg||'That did not work.'); return; }
  if (Number.isFinite(r.tk)) tkSet(r.tk); localMsg(r.msg||'Done!');
  if (act==='farm_harvest'){ sfxChime([660,880,1100]); const [hx,hy]=P(f.gx+0.5,f.gy+0.5,20); } else sfxTone(act==='farm_water'?520:700,0.08,'square',0.05);
  if (r.furn && PRD[curRoom]){ PRD[curRoom].furn=r.furn; buildWorld(); } if ($id('plotbox').style.display==='block') plotDraw(); }); }
function cropIcon(k, stage){ const key='crop@'+k+'@'+stage; let c=furnIconCache.get(key); if (c) return c; c=document.createElement('canvas'); c.width=20; c.height=20; const sg=g; try { g=c.getContext('2d'); drawCrop(k, stage, 10, 19, 0); } finally { g=sg; } furnIconCache.set(key,c); return c; }
function plotDraw(){ const B=$id('pl_body'), f=FURN.find(q=>q.fid===plotCur); if (!f){ $id('plotbox').style.display='none'; return; } const st=plotState(f), mine=plotMine(); let h='';
  if (!st){
    if (!mine){ h='<div class="fre">Nothing is growing here yet. Only the farmer can plant.</div>'; }
    else { h='<div class="fre">What should we plant? Seeds cost TOKENS now, and the harvest sells for more. Visitors can water a crop once to make it grow faster.</div><div class="plgrid">';
      for (const [k,C] of Object.entries(CROP_INFO)) h+=`<button class="plc" data-crop="${k}"><canvas data-ci="${k}" width="20" height="20"></canvas><b>${C.n}</b><small>SEEDS ${C.seed} 🪙 · READY IN ${fmtLeft(C.ms)}</small><em>SELLS FOR ${C.pay} 🪙</em></button>`;
      h+='</div>'; } }
  else { const C=CROP_INFO[st.crop]||{n:'CROP'};
    h=`<div class="plst"><canvas data-ci="${st.crop}" data-stage="${st.ready?3:2}" width="20" height="20"></canvas><div><b>${C.n}</b><small>${st.ready ? 'READY TO HARVEST!' : 'READY IN '+fmtLeft(st.left)}</small></div></div>`;
    h+=`<div class="plbar"><i style="width:${Math.round(st.p*100)}%"></i></div>`;
    h+=`<div class="fre">${st.wat ? '💧 Watered by '+esc(String(st.wby).toUpperCase())+'.' : mine ? 'Friends who visit can water it once to make it grow faster.' : ''}${mine ? ' It sells for '+C.pay+' 🪙.' : ''}</div>`;
    if (st.ready && mine) h+='<div class="srow"><button class="gbbtn y" id="pl_harvest">🌾 HARVEST</button></div>';
    else if (!st.ready && !mine && !st.wat) h+='<div class="srow"><button class="gbbtn y" id="pl_water">💧 WATER IT</button></div>'; }
  B.innerHTML=h;
  for (const cv of B.querySelectorAll('canvas[data-ci]')){ const ic=cropIcon(cv.dataset.ci, +(cv.dataset.stage||3)); cv.getContext('2d').drawImage(ic,0,0); }
  for (const b of B.querySelectorAll('[data-crop]')) b.onclick=()=>{ $id('plotbox').style.display='none'; plotDo('farm_plant', f, b.dataset.crop); };
  const hv=$id('pl_harvest'); if (hv) hv.onclick=()=>plotDo('farm_harvest', f); const wt=$id('pl_water'); if (wt) wt.onclick=()=>plotDo('farm_water', f); }
setInterval(()=>{ if ($id('plotbox') && $id('plotbox').style.display==='block') plotDraw(); }, 1000);
const standRoom = k => STANDS[k].rm || (k==='bar' ? 'lounge' : 'barn');
function standNear(){ if (me.p==='sit') return null; for (const k in STANDS) if (k!=='bar' && standRoom(k)===curRoom && nearStand(STANDS[k])) return k; return null; }
function openFw(k){ k = k || standNear(); const S=STANDS[k]; if (!S || standRoom(k)!==curRoom) return; closeAll(); standOpen=k;
  document.getElementById('fw_t').textContent=S.title; document.getElementById('fw_n').textContent=S.note;
  const row=document.getElementById('fw_items'); row.innerHTML='';
  for (const [id,label,cost] of S.items){ const b=document.createElement('button'); b.className='gbbtn y'; const F=FOOD_FILL[id]||{}; b.innerHTML=`${label}<br><small>${cost} TOKEN${cost>1?'S':''} · ${F.hu?'🍔+'+F.hu:''}${F.hu&&F.th>0?' ':''}${F.th>0?'💧+'+F.th:''}</small>`; b.addEventListener('click', ()=>buyAt(k,id)); row.appendChild(b); }
  document.getElementById('fw_msg').textContent = me.h ? `YOU'RE HOLDING ${DRINKS[me.h].label}. A NEW ONE REPLACES IT.` : `YOU HAVE ${wallet.get()} TOKENS`; fwEl.style.display='block'; }
document.getElementById('fw_close').addEventListener('click', ()=>{ fwEl.style.display='none'; });
// the room ♥ button always sits just under the status card, however tall that card is
{ const st=document.getElementById('status'), lb=document.getElementById('likebtn'); const place=()=>{ const r=st.getBoundingClientRect(); if (r.height) lb.style.top=Math.round(r.bottom+8)+'px'; };
  try{ new ResizeObserver(place).observe(st); }catch(_){} addEventListener('resize', place); place(); }
const FOOD_FILL = { chips:{hu:33,th:-3}, candy:{hu:50}, cookie:{hu:100}, soda:{th:33}, juice:{th:50,hu:5}, shake:{th:100,hu:15}, ajuice:{th:33}, cider:{th:50}, caramel:{th:100,hu:8}, corn:{hu:33}, capple:{hu:50}, pie:{hu:100}, fries:{hu:33,th:-3}, nachos:{hu:50,th:-5}, burger:{hu:100} };   // 1 token = a third, 2 = half, 3 = full   // same as the server
function buyAt(k,id){ ensureAudio(); document.getElementById('fw_msg').textContent = DRINKS[id] && !DRINKS[id].food ? 'POURING...' : 'WRAPPING IT UP...';
  NET.act('buy',{s:k, k:id, fid:(STANDS[k]&&STANDS[k].fid)||0}).then(r=>{ if (!r.ok){ document.getElementById('fw_msg').textContent=(r.msg||'TRY AGAIN.').toUpperCase(); return; }
    me.h = DRINKS[r.k] ? r.k : id; me.hl=SIPS; me.autoEat=true; me.sipStart=performance.now()-SIP_T+600; if (r.nd) ndSet(r.nd); if (k!=='bar') face(STANDS[k].gx+(me.gx>STANDS[k].gx?1:0),STANDS[k].gy);
    tkSet(r.tk, `You bought ${DRINKS[me.h].food?'a':'a cup of'} ${DRINKS[me.h].label}! Your llama ${DRINKS[me.h].food?'is eating':'is drinking'} it now.`); sendPresence(true); fwEl.style.display='none'; }); }
// ---- carrot patch: harvest ripe plots for tokens (timers kept per player) ----
const REGROW_MS = 90000;
const cropState = (store.crops && typeof store.crops==='object') ? store.crops : {};
function cropProgress(k){ const r=+cropState[k]||0; const left=r-Date.now(); return left<=0 ? 1 : Math.max(0, 1-left/REGROW_MS); }
function readyCropNear(){ return CROPS.find(c=>near(c.gx,c.gy) && cropProgress(c.k)>=1) || null; }
function harvest(k){
  if (curRoom!=='barn' || me.p==='sit') return;
  let c = k ? CROPS.find(x=>x.k===k) : null; if (!c || !near(c.gx,c.gy)) c = (me.cropK && CROPS.find(x=>x.k===me.cropK && near(x.gx,x.gy))) || readyCropNear() || CROPS.find(x=>near(x.gx,x.gy));
  me.cropK=null; if (!c) return;
  if (cropProgress(c.k)<1){ localMsg(`Those carrots are still growing. Ready in ${Math.ceil(((+cropState[c.k])-Date.now())/1000)}s.`); return; }
  face(c.gx,c.gy); sendPresence(true);
  NET.act('harvest',{k:c.k}).then(r=>{ if (Number.isFinite(r.left)){ cropState[c.k]=Date.now()+r.left; store.crops=cropState; saveStore(); }
    if (!r.ok){ if (r.msg) localMsg(r.msg); return; } tkSet(r.tk, '+1 TOKEN! Fresh carrots!'); });
}
// ---- slot machine ----
const slotBet = () => SLOT_BETS.includes(store.slotBet) ? store.slotBet : 1;
const myKind = () => SLOT_KINDS[slotKind(me.gx)];
let slot={r:[4,3,2], spin:false, t0:0, stopAt:[0,0,0], win:false, winUntil:0};
function slotView(){ if (slot.spin && performance.now()>slot.stopAt[2]) slot.spin=false; slot.win = performance.now()<slot.winUntil; return slot; }
function slotAnimate(r, lines){ const now=performance.now(); const wheel=myKind()===SLOT_KINDS.gold; slot={r, lines:lines||[], spin:true, t0:now, stopAt: wheel ? [now+2600,now+2600,now+2600] : [now+700,now+1000,now+1300], win:false, winUntil:0, a0:slot.aEnd||0, aEnd:wheel ? wheelAngle(r[0], slot.aEnd||0) : (slot.aEnd||0)}; }
// the wheel turns several times, then lands with the chosen slice under the pointer at the top
function wheelAngle(seg, from){ const per=Math.PI*2/16, target=-(seg+0.5)*per - Math.PI/2; let a=target; while (a < from + Math.PI*2*4) a += Math.PI*2; return a; }
// big slot machine popup in the middle of the screen
const slotEl=document.getElementById('slotbox'), slotCv=document.getElementById('slotcv'), slotCx=slotCv.getContext('2d');
function slotMsg(t){ document.getElementById('sl_msg').textContent=t; }
function slotTok(){ document.getElementById('sl_tok').textContent=`YOU HAVE ${wallet.get()} TOKENS`; }
function slotBetUI(){ const b=slotBet(); for (const el of document.querySelectorAll('#sl_bet [data-bet]')) el.classList.toggle('on', +el.dataset.bet===b);
  document.getElementById('sl_spin').textContent=`SPIN ${b} ▶`; drawSlotPay(); }
for (const el of document.querySelectorAll('#sl_bet [data-bet]')) el.addEventListener('click', ()=>{ store.slotBet=+el.dataset.bet; saveStore(); slotBetUI(); if (!slot.spin) slotMsg(`${slotBet()} TOKEN${slotBet()>1?'S':''} A SPIN. PRIZES ARE x${slotBet()}.`); });
function openSlots(){ if (!(me.p==='sit' && isSlotSeat(me.gx,me.gy))) return; closeAll(); slotEl.classList.remove('win'); slotTok(); const K=myKind();
  document.getElementById('sl_title').textContent=`🎰 ${K.name} · ${K.note}`; slotBetUI();
  if (!slot.spin) slotMsg(`PICK YOUR BET, THEN SPIN. ${slotBet()} TOKEN${slotBet()>1?'S':''} A SPIN.`); slotEl.style.display='block'; }
document.getElementById('sl_spin').addEventListener('click', ()=>{ ensureAudio(); slotSpin(); });
document.getElementById('sl_close').addEventListener('click', ()=>{ slotEl.style.display='none'; });
const slotPayCv=document.getElementById('slpaycv'), slotPayCx=slotPayCv.getContext('2d');
function drawSlotPay(){
  // paytable for this machine at the current bet: each symbol x3 and what it pays, in the game's pixel art and font
  const c=slotPayCx; c.clearRect(0,0,130,40); const K=myKind(), bet=slotBet();
  if (K===SLOT_KINDS.gold){ const odds={0:'1/2',1:'3/10',2:'1/12',3:'1/25',5:'1/33',100:'1/667'};
    [1,2,3,5,100,0].forEach((v,i)=>{ const col=i%3, row=Math.floor(i/3), x=4+col*43, y=2+row*19; c.fillStyle='#f8f4e8'; c.fillRect(x,y,40,18);
      c.fillStyle=WHEEL_COL[v][1]; c.fillRect(x+2,y+2,5,5); pfDraw(c, v===100?'J '+(v*bet):v?('X'+v+' '+(v*bet)):'BLANK', x+9, y+2, v===100?'#c03070':v?INK:'#8a7aa8'); pfDraw(c, odds[v], x+9, y+10, '#1e8a3a'); }); return; }
  SLOT_BIG.forEach((S,i)=>{ const col=i%3, row=Math.floor(i/3), x=4+col*43, y=2+row*19;
    c.fillStyle='#f8f4e8'; c.fillRect(x,y,40,18); c.fillStyle='#d8ccb0'; c.fillRect(x,y+17,40,1);
    c.drawImage(S.img, x+1, y+1); pfDraw(c,K===SLOT_KINDS.classic?'LINE':'X3',x+18,y+2,'#8a7aa8'); pfDraw(c,String(K.pay[i]*bet),x+18,y+10,i===5?'#c03070':INK); });
}
function drawSlotPopup(t){
  if (slotEl.style.display!=='block') return;
  { const kk=slotKind(me.gx); if (kk==='classic'){ drawLinesPopup(t); return; } if (kk==='gold'){ drawWheelPopup(t); return; } }
  const c=slotCx, now=performance.now(), n=SLOT_BIG.length; c.imageSmoothingEnabled=false;
  c.fillStyle='#181020'; c.fillRect(0,0,130,70);
  const win = now<slot.winUntil, blink = win && Math.floor(t*8)%2;
  for (let k=0;k<3;k++){ const x0=6+k*41, y0=4, RW=36, RH=62, cy=y0+RH/2;
    c.fillStyle='#f8f4e8'; c.fillRect(x0,y0,RW,RH);
    c.save(); c.beginPath(); c.rect(x0,y0,RW,RH); c.clip();
    const spinning = slot.spin && now<slot.stopAt[k];
    if (spinning){ const off=Math.floor(t*160+k*9)%22, base=Math.floor(t*7.3)+k*2;
      for (let j=-2;j<=2;j++) c.drawImage(SLOT_BIG[(base+j+60)%n].blur, x0+10, Math.round(cy-8+j*22+off)); }
    else { const r=slot.r[k]; for (let j=-1;j<=1;j++) c.drawImage(SLOT_BIG[(r+j+n)%n].img, x0+10, cy-8+j*22); }
    c.restore();
    if (blink){ c.fillStyle='rgba(248,208,48,0.35)'; c.fillRect(x0,cy-11,RW,22); }
    // curved reel shading top and bottom, gold reel edges
    c.fillStyle='rgba(24,16,32,0.5)'; c.fillRect(x0,y0,RW,5); c.fillRect(x0,y0+RH-5,RW,5);
    c.fillStyle='rgba(24,16,32,0.22)'; c.fillRect(x0,y0+5,RW,6); c.fillRect(x0,y0+RH-11,RW,6);
    c.fillStyle='#c09018'; c.fillRect(x0-1,y0,1,RH); c.fillRect(x0+RW,y0,1,RH); }
  // payline arrows
  c.fillStyle = blink ? '#f8d030' : '#e02838';
  for (let i=0;i<3;i++){ c.fillRect(1+i,35-2+i,1,5-2*i); c.fillRect(128-i,35-2+i,1,5-2*i); }
  document.getElementById('sl_spin').disabled = slot.spin && now<slot.stopAt[2];
}
// LUCKY LINES: a 3 x 3 grid of symbols; each column stops in turn, then winning lines light up
function drawLinesPopup(t){
  const c=slotCx, now=performance.now(), n=SLOT_BIG.length; c.imageSmoothingEnabled=false;
  c.fillStyle='#2a0818'; c.fillRect(0,0,130,70);
  const r = slot.r && slot.r.length===9 ? slot.r : [0,1,2,3,4,5,1,2,3];
  const done = !slot.spin || now>=slot.stopAt[2], win = now<slot.winUntil, blink = win && Math.floor(t*6)%2;
  for (let col=0; col<3; col++){ const x0=17+col*33, spinning = slot.spin && now<slot.stopAt[col];
    c.fillStyle='#f8f4e8'; c.fillRect(x0-2, 2, 28, 66); c.fillStyle='#c09018'; c.fillRect(x0-3,2,1,66); c.fillRect(x0+26,2,1,66);
    c.save(); c.beginPath(); c.rect(x0-2,2,28,66); c.clip();
    for (let row=0; row<3; row++){ const y=5+row*21;
      if (spinning){ const off=Math.floor(t*150+col*7)%21, k=(Math.floor(t*8)+row+col*2)%n; c.drawImage(SLOT_BIG[k].blur, x0+4, y+off-10); c.drawImage(SLOT_BIG[(k+1)%n].blur, x0+4, y+off+11); }
      else c.drawImage(SLOT_BIG[r[row*3+col]].img, x0+4, y); }
    c.restore(); }
  // the five lines: arrows on both sides, and the winners drawn across
  const cell=(i)=>[17+(i%3)*33+12, 5+Math.floor(i/3)*21+8];
  if (done) for (const li of (slot.lines||[])){ const L=SLOT_LINES[li]; c.strokeStyle = blink ? '#ffffff' : ['#f8d030','#f84848','#48c048','#58b8f8','#f878b8'][li]; c.lineWidth=2;
    c.beginPath(); const a=cell(L[0]), b=cell(L[2]); c.moveTo(a[0]-12,a[1]); c.lineTo(b[0]+12,b[1]); c.stroke(); }
  ['#f8d030','#f84848','#48c048'].forEach((col,i)=>{ c.fillStyle=col; c.fillRect(2,11+i*21,6,5); c.fillRect(122,11+i*21,6,5); });
  c.fillStyle='#58b8f8'; c.fillRect(2,2,6,4); c.fillRect(122,62,6,4); c.fillStyle='#f878b8'; c.fillRect(2,62,6,4); c.fillRect(122,2,6,4);
  document.getElementById('sl_spin').disabled = slot.spin && now<slot.stopAt[2];
}
// PRIZE WHEEL: 16 slices; it spins several turns and slows to a stop under the pointer
function drawWheelPopup(t){
  const c=slotCx, now=performance.now(); c.imageSmoothingEnabled=false; c.fillStyle='#1c0c30'; c.fillRect(0,0,130,70);
  const u = slot.spin ? Math.min(1,(now-slot.t0)/(slot.stopAt[2]-slot.t0)) : 1, e=1-Math.pow(1-u,3);
  const ang = (slot.a0||0) + ((slot.aEnd||0)-(slot.a0||0))*e, cx=65, cy=36, R=31, per=Math.PI*2/16;
  const win = now<slot.winUntil, blink = win && Math.floor(t*6)%2;
  // slices, pixel by pixel so it stays crisp
  for (let y=-R; y<=R; y++) for (let x=-R; x<=R; x++){ const d=Math.sqrt(x*x+y*y); if (d>R) continue;
    let a=Math.atan2(y,x)-ang; a=((a%(Math.PI*2))+Math.PI*2)%(Math.PI*2); const i=Math.floor(a/per)%16, v=WHEEL_SLICES[i], C=WHEEL_COL[v];
    c.fillStyle = d>R-1.2 ? '#181020' : d>R-3 ? '#f8d030' : d<5 ? '#f8f4e8' : (Math.abs((a%per)-0.0)<0.04 ? '#181020' : (d>R*0.62 ? C[1] : C[0]));
    c.fillRect(cx+x, cy+y, 1, 1); }
  // labels upright at each slice
  for (let i=0;i<16;i++){ const v=WHEEL_SLICES[i]; if (!v) continue; const a=ang+(i+0.5)*per, lx=cx+Math.cos(a)*R*0.68, ly=cy+Math.sin(a)*R*0.68; const s2=v===100?'J':String(v); pfDraw(c, s2, Math.round(lx-pfW(s2)/2), Math.round(ly-2), '#ffffff'); }
  // pointer at the top and hub
  c.fillStyle='#181020'; c.fillRect(cx-4,0,9,3); c.fillRect(cx-3,3,7,2); c.fillRect(cx-2,5,5,2); c.fillStyle=blink?'#ffffff':'#f84848'; c.fillRect(cx-3,0,7,2); c.fillRect(cx-2,2,5,2); c.fillRect(cx-1,4,3,2);
  c.fillStyle='#c09018'; c.fillRect(cx-2,cy-2,5,5);
  // bulbs around the edge of the screen
  const lit=Math.floor(t*8); for (let k=0;k<12;k++){ const x=k<6?6:123, y=8+(k%6)*11; c.fillStyle=((k+lit)%3===0)?'#ffffff':'#f8a830'; c.fillRect(x,y,2,2); }
  document.getElementById('sl_spin').disabled = slot.spin && now<slot.stopAt[2];
}
// ======================= CASINO TABLES: roulette and blackjack (the server spins, deals and pays) =======================
const tblEl=document.getElementById('tblbox'), tbCv=document.getElementById('tbcv'), tbCx=tbCv.getContext('2d');
const RL_RED=new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);
const rlCol = n => n===0 ? '#28a048' : RL_RED.has(n) ? '#c02838' : '#181020';
const RL_BETS=[['red','RED','r','1 TO 1'],['black','BLACK','k','1 TO 1'],['odd','ODD','','1 TO 1'],['even','EVEN','','1 TO 1'],['low','1-18','','1 TO 1'],['high','19-36','','1 TO 1'],['d1','1ST 12','','2 TO 1'],['d2','2ND 12','','2 TO 1'],['d3','3RD 12','','2 TO 1']];
let tblKind=null, rlPick=store.rlPick||'red', rlNum=Number.isInteger(store.rlNum)?store.rlNum:17, rlHist=[], rlBusy=false, bjHand=null, bjBusy=false;
let rlAnim=null;   // {n, t0, by}: wheel animation everyone in the casino sees
const tbBet = () => SLOT_BETS.includes(store.tbBet) ? store.tbBet : 1;
function tbMsg(t){ document.getElementById('tb_msg').textContent=t; }
function tbTok(){ document.getElementById('tb_tok').textContent=`YOU HAVE ${wallet.get()} TOKENS`; }
function tbBetUI(){ const b=tbBet(); for (const el of document.querySelectorAll('#tb_bet [data-bet]')) el.classList.toggle('on', +el.dataset.bet===b); }
for (const el of document.querySelectorAll('#tb_bet [data-bet]')) el.addEventListener('click', ()=>{ store.tbBet=+el.dataset.bet; saveStore(); tbBetUI(); renderTableUI(); });
function openTable(kind){ if (curRoom!=='casino' || me.p!=='sit') return; closeAll(); tblKind=kind; tbBetUI(); tbTok();
  document.getElementById('tb_title').textContent = kind==='roul' ? '🎡 ROULETTE · SINGLE ZERO' : '🃏 BLACKJACK · PAYS 3 TO 2';
  if (kind==='bj'){ bjHand=null; tbMsg('PICK YOUR BET AND DEAL.'); NET.act('bj',{c:'state'}).then(r=>{ if (r.ok && !r.idle){ bjHand=r; tbMsg('YOUR HAND IS STILL ON THE TABLE.'); } renderTableUI(); }); }
  else tbMsg(`PICK A BET, CHOOSE YOUR CHIP, THEN SPIN.`);
  renderTableUI(); tblEl.style.display='block'; }
function renderTableUI(){
  const opts=document.getElementById('tb_opts'), acts=document.getElementById('tb_acts'), betRow=document.getElementById('tb_bet'); opts.innerHTML=''; acts.innerHTML='';
  const btn=(label,cls,fn,dis)=>{ const b=document.createElement('button'); b.className='gbbtn'+(cls?' '+cls:''); b.innerHTML=label; b.disabled=!!dis; b.addEventListener('click', ()=>{ ensureAudio(); fn(); }); return b; };
  if (tblKind==='roul'){
    for (const [k,label,cls] of RL_BETS) opts.appendChild(btn(label, (cls||'')+(rlPick===k?' on':''), ()=>{ rlPick=k; store.rlPick=k; saveStore(); renderTableUI(); }));
    const numRow=document.createElement('div'); numRow.style.gridColumn='1 / -1'; numRow.style.display='flex'; numRow.style.justifyContent='center'; numRow.style.gap='calc(var(--px)*3px)';
    numRow.appendChild(btn('−','',()=>{ rlNum=(rlNum+36)%37; rlPick='n'; store.rlNum=rlNum; store.rlPick='n'; saveStore(); renderTableUI(); }));
    numRow.appendChild(btn(`ONE NUMBER: ${rlNum} · 35 TO 1`, rlPick==='n'?'on':'', ()=>{ rlPick='n'; store.rlPick='n'; saveStore(); renderTableUI(); }));
    numRow.appendChild(btn('+','',()=>{ rlNum=(rlNum+1)%37; rlPick='n'; store.rlNum=rlNum; store.rlPick='n'; saveStore(); renderTableUI(); }));
    opts.appendChild(numRow); betRow.style.display='flex';
    acts.appendChild(btn(`SPIN ${tbBet()} ▶`,'y',rlSpin,rlBusy)); acts.appendChild(btn('CLOSE','',()=>{ tblEl.style.display='none'; }));
  } else {
    const playing = bjHand && !bjHand.done;
    betRow.style.display = playing ? 'none' : 'flex';
    if (playing){ acts.appendChild(btn('HIT','y',()=>bjAct('hit'),bjBusy)); acts.appendChild(btn('STAND','y',()=>bjAct('stand'),bjBusy)); if (bjHand.canDouble) acts.appendChild(btn('DOUBLE','',()=>bjAct('double'),bjBusy||wallet.get()<bjHand.bet)); }
    else { acts.appendChild(btn(`DEAL ${tbBet()} ▶`,'y',()=>bjAct('deal'),bjBusy)); acts.appendChild(btn('CLOSE','',()=>{ tblEl.style.display='none'; })); }
  }
  tbTok();
}
function rlBetLabel(){ return rlPick==='n' ? `NUMBER ${rlNum}` : (RL_BETS.find(b=>b[0]===rlPick)||['','RED'])[1]; }
function rlSpin(){
  if (rlBusy) return; const bet=tbBet(); if (wallet.get()<bet){ tbMsg(`YOU NEED ${bet} TOKENS FOR THAT CHIP. TRY A SMALLER ONE!`); return; }
  rlBusy=true; renderTableUI(); tbMsg(`${bet} ON ${rlBetLabel()}... NO MORE BETS!`);
  NET.act('roulette',{k:rlPick, n:rlNum, bet}).then(r=>{
    if (!r.ok){ rlBusy=false; renderTableUI(); tbMsg((r.msg||'TRY AGAIN.').toUpperCase()); return; }
    store.tk=r.tk-(r.pay||0); tokUI(-1); tbTok(); rlAnim={n:r.n, t0:performance.now(), mine:true};
    setTimeout(()=>{ rlBusy=false; rlHist.unshift(r.n); rlHist=rlHist.slice(0,8); const col=r.n===0?'GREEN':RL_RED.has(r.n)?'RED':'BLACK';
      if (r.pay){ store.tk=r.tk; tokUI(1); tbMsg(`${r.n} ${col}! YOU WIN ${r.pay} TOKENS!`); if (r.pay>=50) action(`won ${r.pay} TOKENS at roulette!`); } else tbMsg(`${r.n} ${col}. NO LUCK THIS TIME.`);
      renderTableUI(); }, 2600);
  });
}
NET.handlers.rl = m => { if (curRoom!=='casino') return; if (!(rlAnim && rlAnim.mine && rlAnim.n===m.n && performance.now()-rlAnim.t0<500)) rlAnim={n:m.n, t0:performance.now(), by:m.by}; };
function bjAct(c){
  if (bjBusy) return; const bet=tbBet(); if (c==='deal' && wallet.get()<bet){ tbMsg(`YOU NEED ${bet} TOKENS FOR THAT BET.`); return; }
  bjBusy=true; renderTableUI();
  NET.act('bj',{c, bet}).then(r=>{ bjBusy=false;
    if (!r.ok){ tbMsg((r.msg||'TRY AGAIN.').toUpperCase()); renderTableUI(); return; }
    const before=wallet.get(); bjHand=r; if (Number.isFinite(r.tk)) tkSet(r.tk);
    me.bj = r.done ? null : r.p.slice(0,8); me.bjK=(me.bjK||0)+1; sendPresence(true);
    if (r.done){ const R={bj:`BLACKJACK! YOU WIN ${r.back} TOKENS!`, win:`YOU WIN ${r.back} TOKENS!`, push:'PUSH. YOUR BET COMES BACK.', lose:`DEALER WINS WITH ${r.dt}.`, bust:`BUST WITH ${r.pt}. DEALER WINS.`}[r.res]||'';
      tbMsg(R + ' DEAL AGAIN?'); if (r.back>=50) action(`won ${r.back} TOKENS at blackjack!`); setTimeout(()=>{ if (bjHand===r){ me.bj=null; sendPresence(true); } }, 4000); }
    else tbMsg(`YOU HAVE ${r.pt}. DEALER SHOWS ${r.dt}. HIT, STAND${r.canDouble?' OR DOUBLE':''}?`);
    renderTableUI(); });
}
// a playing card on any canvas: white face with rank and suit, or a red back for the dealer's hidden card
const BJ_R=['A','2','3','4','5','6','7','8','9','10','J','Q','K'], BJ_S=['♠','♥','♦','♣'];
function drawCard(c, x, y, card){ c.fillStyle=INK; c.fillRect(x+1,y,12,17); c.fillRect(x,y+1,14,15);
  if (card<0){ c.fillStyle='#c02838'; c.fillRect(x+1,y+1,12,15); c.fillStyle='#e85868'; for (let j=0;j<15;j+=2) for (let i=(j/2)%2;i<12;i+=2) c.fillRect(x+1+i,y+1+j,1,1); c.fillStyle='#f8f0d0'; c.fillRect(x+3,y+3,8,11); c.fillStyle='#c02838'; c.fillRect(x+4,y+4,6,9); return; }
  c.fillStyle='#f8f8f8'; c.fillRect(x+1,y+1,12,15); const red=(Math.floor(card/13)===1||Math.floor(card/13)===2), col=red?'#c02838':INK, rk=BJ_R[card%13], st=BJ_S[Math.floor(card/13)];
  pfDraw(c,rk,x+2,y+2,col); pfDraw(c,st,x+(rk.length>1?3:4),y+9,col); }
function drawTablePopup(t){
  if (tblEl.style.display!=='block') return; const c=tbCx; c.fillStyle='#1e7a3a'; c.fillRect(0,0,150,66); c.fillStyle='#24903f'; c.fillRect(2,2,146,62);
  if (tblKind==='roul'){
    // big result badge (rolling while the wheel spins) and the last few numbers
    const now=performance.now(); let n=null, rolling=false;
    if (rlAnim){ const a=(now-rlAnim.t0)/1000; if (a<2.4){ rolling=true; n=Math.floor(a*20+rlAnim.n)%37; } else n=rlAnim.n; } else if (rlHist.length) n=rlHist[0];
    c.fillStyle=INK; c.fillRect(9,9,48,48); c.fillStyle=n===null?'#2a6a40':rlCol(n); c.fillRect(10,10,46,46); c.fillStyle='#f8d030'; c.fillRect(10,10,46,2); c.fillRect(10,54,46,2);
    if (n!==null){ const s2=String(n), w=pfW(s2,4); pfDraw(c,s2,33-Math.round(w/2),23,rolling?'#d8d8e8':'#f8f8f8',4); } else pfDraw(c,'?',29,23,'#f8f8f8',4);
    pfDraw(c,'LAST',66,9,'#f8f0d0'); rlHist.forEach((h,i)=>{ const x=66+(i%4)*20, y=17+Math.floor(i/4)*14; c.fillStyle=INK; c.fillRect(x,y,18,12); c.fillStyle=rlCol(h); c.fillRect(x+1,y+1,16,10); pfDraw(c,String(h),x+9-Math.round(pfW(String(h))/2),y+4,'#f8f8f8'); });
    pfDraw(c,'BET: '+rlBetLabel(),66,49,'#f8f0d0');
  } else {
    pfDraw(c,'DEALER',6,5,'#f8f0d0'); pfDraw(c,'YOU',6,36,'#f8f0d0');
    if (bjHand){ bjHand.d.forEach((cd,i)=>drawCard(c,38+i*15,3,cd)); bjHand.p.forEach((cd,i)=>drawCard(c,38+i*15,34,cd));
      pfDraw(c,String(bjHand.dt),6,13,'#f8d030'); pfDraw(c,String(bjHand.pt),6,44,'#f8d030'); pfDraw(c,`BET ${bjHand.bet}`,6,56,'#f8f0d0'); }
    else { pfDraw(c,'BLACKJACK PAYS 3 TO 2',36,22,'#f8d030'); pfDraw(c,'DEALER STANDS ON 17',38,32,'#f8f0d0'); }
  }
}
// other players' machines spin on their own cabinets
const remoteSlots = {};
function slotRemote(r, gx){ if (curRoom!=='casino') return; const now=performance.now(); remoteSlots[gx]={r, spin:true, t0:now, stopAt:[now+700,now+1000,now+1300], win:false, winUntil:0}; }
function slotIdle(gx){ const rs=remoteSlots[gx]; if (rs){ if (rs.spin && performance.now()>rs.stopAt[2]) rs.spin=false; return rs; } return {r:[gx%6,(gx*2+1)%6,(gx*5+3)%6], spin:false, win:false, stopAt:[0,0,0], t0:0}; }
function slotSpin(){
  if (!(me.p==='sit' && isSlotSeat(me.gx,me.gy))) return;
  if (slot.spin && performance.now()<slot.stopAt[2]+80) return;
  const bet=slotBet(); if (wallet.get()<bet){ slotMsg(bet>1 ? `YOU NEED ${bet} TOKENS FOR THAT BET. TRY A SMALLER ONE!` : 'YOU NEED 1 TOKEN TO SPIN. EARN SOME AT THE ARCADE, THE BAR OR LLAMA ACRES!'); return; }
  slotMsg('SPINNING...'); slotEl.classList.remove('win');
  NET.act('slot',{bet}).then(r=>{
    if (!r.ok){ slotMsg((r.msg||'TRY AGAIN.').toUpperCase()); return; }
    store.tk = r.tk + 0 - (r.pay||0); tokUI(-1); slotTok();
    slotAnimate(r.r, r.lines); me.slK=(me.slK||0)+1; me.lastSlot={k:me.slK, r:r.r}; sendPresence(true);
    const wait = r.kind==='gold' ? 2650 : 1350;
    setTimeout(()=>{ const nm = r.kind==='gold' ? (WHEEL_SLICES[r.r[0]]===100 ? 'JACKPOT' : WHEEL_SLICES[r.r[0]] ? 'X'+WHEEL_SLICES[r.r[0]] : 'BLANK') : r.kind==='classic' ? ((r.lines||[]).length ? (r.lines.length+' LINE'+(r.lines.length>1?'S':'')) : 'NO LINES') : r.r.map(v=>SLOT_SYMS[v].n).join(' · ');
      if (r.pay){ store.tk = r.tk; slot.winUntil=performance.now()+1800; tokUI(1); slotMsg(`${nm}! YOU WIN ${r.pay} TOKENS!`); slotEl.classList.add('win'); if (r.pay>=50) action(`hit ${r.pay} TOKENS on ${myKind().name}!`); }
      else slotMsg(`${nm}. NO LUCK THIS TIME.`); slotTok(); }, wait);
  });
}


// ---- fishing pond: cast, wait for a bite, catch a fish for tokens ----
const FISH_KINDS=[{n:'BLUEGILL', c:'#78a8d8', d:'#4878a8', pay:1, w:70},{n:'BIG ORANGE CARP', c:'#f89038', d:'#c06018', pay:2, w:25},{n:'GOLDEN FISH', c:'#f8d030', d:'#c09018', pay:5, w:5}];
// how far a spot is from the pond's middle: 1 = outer bank, under about 0.86 = open water (same shape the pond is drawn with)
function pondNorm(gx,gy,ex,ey,pw){ const a=Math.atan2(gy/ey,gx/ex); return Math.pow(Math.pow(Math.abs(gx)/ex,pw)+Math.pow(Math.abs(gy)/ey,pw),1/pw)/(1+0.035*Math.sin(a*5+1)+0.02*Math.sin(a*9)); }
// where the bobber lands: walk from the llama toward the middle of the pond until we're well inside the water, then a little further
function bobberSpot(){ const f=FURN.find(q=>q.t==='pond'); if (!f) return null; const w=f.w||3, h=f.h||3, cx=f.gx+w/2, cy=f.gy+h/2, ex=w/2, ey=h/2;
  const x0=me.gx+0.5, y0=me.gy+0.5, dx=cx-x0, dy=cy-y0, L=Math.hypot(dx,dy)||1;
  for (let d=0; d<=L; d+=0.05){ const x=x0+dx/L*d, y=y0+dy/L*d; if (pondNorm(x-cx,y-cy,ex,ey,2.6) <= 0.7){ const d2=Math.min(L-0.3, d+0.35); return [x0+dx/L*Math.max(d,d2), y0+dy/L*Math.max(d,d2)]; } }
  return [cx, cy]; }
function pondNear(){ return curRoom==='barn' && !me.moving && POND.some(([x,y])=>Math.max(Math.abs(me.gx-x),Math.abs(me.gy-y))<=1); }
function pickFish(){ let r=Math.random()*100; for (let i=0;i<FISH_KINDS.length;i++){ if ((r-=FISH_KINDS[i].w)<0) return i; } return 0; }
function startFish(){
  if (!pondNear() || me.p==='sit' || me.fish) return;
  const cx=POND.reduce((a,p)=>a+p[0],0)/POND.length+0.5, cy=POND.reduce((a,p)=>a+p[1],0)/POND.length+0.5, dx=cx-(me.gx+0.5), dy=cy-(me.gy+0.5), L=Math.hypot(dx,dy)||1, k=Math.min(1.4, L-0.4);
  face(Math.round(me.gx+dx/L), Math.round(me.gy+dy/L)); me.p='stand'; sendPresence(true);
  const spot=bobberSpot() || [me.gx+0.5+dx/L*k, me.gy+0.5+dy/L*k];
  me.fishK=(me.fishK||0)+1; const F={k:me.fishK, st:'wait', f:0, t0:performance.now(), biteAt:Infinity, bx:spot[0], by:spot[1]}; me.fish=F;
  setTimeout(()=>NET.act('fish_cast').then(r=>{ if (me.fish!==F) return; if (!r.ok){ me.fish=null; localMsg(r.msg||'No luck casting.'); sendPresence(true); if (r.afk) afkAsk(); return; }
    F.st='cast'; F.biteAt=performance.now()+r.bite; localMsg('You cast your line...'); sendPresence(true); }), 250);
}
function stopFish(quiet){ if (!me.fish) return; me.fish=null; if (!quiet) localMsg('You reeled in your line.'); sendPresence(true); }
function updateFish(){
  const F=me.fish; if (!F) return; const now=performance.now();
  if (F.st==='cast' && now>=F.biteAt){ F.st='bite'; F.gotAt=now+900; localMsg('Something is biting!'); sendPresence(true); }
  else if (F.st==='bite' && now>=F.gotAt && !F.reeling){ F.reeling=true;
    NET.act('fish_reel').then(r=>{ if (me.fish!==F) return; F.reeling=false;
      if (!r.ok){ F.st='cast'; F.biteAt=Infinity; startRecast(F); return; }
      F.st='got'; F.f=r.f; me.fishShow={f:r.f, until:performance.now()+2200}; tkSet(r.tk, `+${r.pay} TOKEN${r.pay>1?'S':''}! You caught a ${r.name}!`); if (r.f===2) action('caught a rare GOLDEN FISH!');
      F.recastAt=performance.now()+2300; sendPresence(true); }); }
  else if (F.st==='got' && now>=F.recastAt){ F.st='wait'; F.k=++me.fishK; startRecast(F); }
}
function startRecast(F){ NET.act('fish_cast').then(r=>{ if (me.fish!==F) return; if (!r.ok){ me.fish=null; sendPresence(true); if (r.afk) afkAsk(); return; } F.st='cast'; F.biteAt=performance.now()+r.bite; sendPresence(true); }); }
// Browsers slow down timers in background tabs (to about once a minute after 5 minutes), which would make fishing
// miss its bites. A tiny worker keeps a steady tick going, so fishing carries on while you're in another tab.
// food and drink you buy get eaten or drunk on their own: a sip or bite every couple of seconds until it's gone
function autoEatTick(){ if (!me.autoEat) return; if (!me.h){ me.autoEat=false; return; } if (me.bar || arcade.on) return;
  if (performance.now()-me.sipStart > SIP_T+700) doAction(DRINKS[me.h].food ? 'bite' : 'sip'); }
const BG_TICK = (()=>{ try { const w=new Worker(URL.createObjectURL(new Blob(['setInterval(function(){postMessage(0)},250)'],{type:'text/javascript'}))); w.onmessage=()=>{ updateFish(); afkTick(); autoEatTick(); }; return w; } catch(e){ return null; } })();
if (!BG_TICK) setInterval(()=>{ updateFish(); afkTick(); autoEatTick(); }, 250);
// ---- "Are you still there?": after 10 minutes with no input, ask; after 2 more minutes with no answer, log out of the room ----
const AFK_ASK=10*60000, AFK_GRACE=2*60000; let lastInput=Date.now(), afkShownAt=0, afkPing=0, afkTitle=null, afkBlink=0;
for (const ev of ['pointerdown','keydown','wheel','touchstart']) addEventListener(ev, ()=>{ if (!afkShownAt) lastInput=Date.now(); }, {passive:true, capture:true});
function afkAsk(){ if (afkShownAt || !joined) return; afkShownAt=Date.now(); const el=document.getElementById('afkbox'); el.style.display='flex'; afkCount(); afkTitle=document.title;
  try { ensureAudio(); if (actx){ const o=actx.createOscillator(), gn=actx.createGain(); o.frequency.value=880; gn.gain.value=0.06*(svol/100); o.connect(gn); gn.connect(actx.destination); o.start(); o.stop(actx.currentTime+0.15); } } catch(_){} }
function afkCount(){ const left=Math.max(0, AFK_GRACE-(Date.now()-afkShownAt)); document.getElementById('afk_left').textContent=`${Math.floor(left/60000)}:${String(Math.floor(left/1000)%60).padStart(2,'0')}`; }
function afkHere(){ document.getElementById('afkbox').style.display='none'; afkShownAt=0; lastInput=Date.now(); afkPing=Date.now(); if (afkTitle){ document.title=afkTitle; afkTitle=null; } NET.act('afk_ok');
  if (curRoom==='barn' && !me.fish && pondNear() && me.p!=='sit') setTimeout(startFish, 300); }
function afkLogout(){ document.getElementById('afkbox').style.display='none'; if (me.fish) stopFish(true); if (afkTitle){ document.title=afkTitle; afkTitle=null; }
  NET.closedForGood=true; try{ NET.ws&&NET.ws.close(1000,'away'); }catch(_){} document.getElementById('afkout').style.display='flex'; afkShownAt=0; joined=false; }
function afkTick(){
  if (!joined || NET.closedForGood) return; const now=Date.now();
  if (!afkShownAt){ if (now-lastInput > AFK_ASK) afkAsk(); else if (now-lastInput < 60000 && now-afkPing > 60000){ afkPing=now; NET.act('afk_ok'); } return; }
  afkCount(); if (now-afkBlink>1000){ afkBlink=now; document.title = (Math.floor(now/1000)%2) ? '(!) Are you still there?' : (afkTitle||document.title); }
  if (now-afkShownAt > AFK_GRACE) afkLogout(); }
function drawFishBmp(f, x, y){ const K=FISH_KINDS[f]; g.fillStyle=INK; g.fillRect(x,y,9,5); g.fillRect(x+9,y+1,2,3); g.fillStyle=K.c; g.fillRect(x+1,y+1,7,3); g.fillRect(x+9,y+2,1,1); g.fillStyle=K.d; g.fillRect(x+1,y+3,7,1); g.fillStyle='#f8f8f8'; g.fillRect(x+2,y+1,1,1); g.fillStyle=INK; g.fillRect(x+2,y+2,1,1); }
/* the bite "!" and a freshly caught fish show above the head, so the name tag moves up out of their way (like an emote bubble) */
function fishAbove(l, isMe){ if (curRoom!=='barn') return false; const F=isMe?me.fish:l.fs, sh=isMe?me.fishShow:l.fishShow; return !!((F && F.st==='bite') || (sh && performance.now()<sh.until)); }
function drawFishing(t){
  if (curRoom!=='barn') return;
  const list=[]; if (joined) list.push({l:me, F:me.fish, show:me.fishShow});
  for (const o of others.values()) if (sameRoom(o) && !o.leaving) list.push({l:o, F:o.fs, show:o.fishShow});
  const now=performance.now();
  for (const {l,F,show} of list){
    const [sx0,sy0]=P(l.x,l.y); const sx=Math.round(sx0), sy=Math.round(sy0); const flip=(l.d==='fl'||l.d==='bl'); const back=l.d[0]==='b';
    if (F){
      const hx = sx + (flip?-7:7), hy = sy-24; const tipx = hx + (flip?-13:13), tipy = hy-14;
      linePx(hx,hy,tipx,tipy,INK); linePx(hx,hy-1,tipx,tipy-1,'#a87040');
      const [bx0,by0]=P(F.bx,F.by); const bite=F.st==='bite'; const bob = bite ? 2+Math.round(Math.sin(t*30)) : Math.round(Math.sin(t*3)); const bx=Math.round(bx0), by=Math.round(by0)+bob;
      // line with a little sag
      let px=tipx, py=tipy; for (let i=1;i<=10;i++){ const u=i/10; const x=tipx+(bx-tipx)*u, y=tipy+(by-2-tipy)*u+Math.sin(u*Math.PI)*4; linePx(px,py,x,y,'#e8e8f0'); px=x; py=y; }
      if (bite){ g.fillStyle='#b8e0f8'; const r=3+Math.floor((t*12)%4); g.fillRect(bx-r,by+2,2,1); g.fillRect(bx+r,by+2,2,1); }
      g.fillStyle=INK; g.fillRect(bx-2,by-3,4,5); g.fillStyle='#f84848'; g.fillRect(bx-1,by-2,2,2); g.fillStyle='#f8f8f8'; g.fillRect(bx-1,by,2,1);
      if (bite && Math.floor(t*6)%2===0){ g.fillStyle=INK; g.fillRect(sx-1,sy-62,3,7); g.fillRect(sx-1,sy-53,3,2); g.fillStyle='#f8d030'; g.fillRect(sx,sy-61,1,5); g.fillRect(sx,sy-52,1,1); }
    }
    if (show && now<show.until){ const up=Math.min(6, Math.floor((2200-(show.until-now))/40)); drawFishBmp(show.f, sx-5, sy-60-up); if (Math.floor(t*8)%2) { g.fillStyle='#f8f8a0'; g.fillRect(sx+7,sy-64-up,1,1); g.fillRect(sx-8,sy-58-up,1,1); } }
  }
}

// ======================= CONTEXT TIPS =======================
const TIPS = {
  myroom:'<b>YOUR ROOM</b> Hold any piece for 2.5 seconds to pick it up, then drag it. Add more from 🎒 INVENTORY > ITEMS. Open 🏠 ROOMS > SETTINGS to name it, change the walls and floor, make it private or invite friends.',
  counter:'<b>CHECKOUT</b> Press SHOP or tap the counter to see the real La Llama P.I.C. shirts.',
  racks:'<b>CLOTHES</b> Tap anything on the racks or in the glass case to try it on and buy it with tokens. Change outfits any time in MENU > WARDROBE.',
  arcade:'<b>ARCADE</b> Tap the cabinet to play HAY CATCH or LLAMA DASH.',
  juke:'<b>JUKEBOX</b> Tap it to change the song. Everyone hears it. The ♪ button mutes it for you.',
  lamp:'<b>LAMP</b> Tap the lamp to switch it on and off for everyone.',
  bar:'<b>BAR</b> Tap the cup in front of you to pick it up.',
  bar2:'<b>DRINK</b> Your llama drinks it on its own, a sip at a time (3 sips a cup). MENU > DROP DRINK puts it down.',
  table:'<b>TABLE GAMES</b> Tap the table to start HIGH ROLL or HIGH CARD. Anyone sitting here joins in!',
  dance: (matchMedia && matchMedia('(pointer: coarse)').matches) ? '<b>DANCE FLOOR</b> Your llama dances while the jukebox plays. Tap the pink FLIP button to do a FLIP!' : '<b>DANCE FLOOR</b> Your llama dances while the jukebox plays. Press F to do a FLIP!',
  merch:'<b>MERCH WALL</b> Tap a framed shirt to see it in the shop, or the logo over the door to visit the site.',
  scores:'<b>HIGH SCORES</b> Tap the chalkboard to see the top arcade players.',
  sofa:'<b>LOVESEAT</b> Kick back! Tap the floor to get up.',
  slots:'<b>SLOTS</b> The machine pops up when you sit. Pick your bet and press SPIN. Three of a kind wins; the prize list is on the machine.',
  roulette:'<b>ROULETTE</b> Pick a bet (a colour, odd or even, a half, a dozen or one number), choose your chip and SPIN. One number pays 35 to 1.',
  blackjack:'<b>BLACKJACK</b> Pick your bet and DEAL. Get closer to 21 than the dealer without going over. Blackjack pays 3 to 2.',
  door:'<b>ROOMS</b> Tap ROOMS at the bottom (or any door) to go to LLAMA ACRES, the LLAMA CASINO or any other room.',
  gate:'<b>ROOMS</b> Tap ROOMS at the bottom (or the gate) to go back to the LLAMA LOUNGE or any other room.',
  pond:'<b>FISHING POND</b> Press FISH (or tap the pond) to cast a line. Wait for a bite to catch a fish for TOKENS!',
  fishing:'<b>FISHING</b> Watch the bobber... Fish bite every 10 to 20 seconds. Common fish pay 1, big orange ones 2, rare GOLDEN fish 5. Press STOP or walk away to reel in.',
  crops:'<b>CARROT PATCH</b> Tap a ripe plot (or press HARVEST) for 1 TOKEN. Plots regrow in 90 seconds.',
  campfire:'<b>CAMPFIRE</b> Kick back by the fire. Tap the grass to get up.',
  rope:'<b>BAR ROPE</b> Tap the rope to slip behind the bar and pour drinks.',
  bartend:'<b>BARTENDER</b> You\'re pouring drinks! Tap the floor or press LEAVE to step out.',
};
const tipEl=document.getElementById('tip'), tipTxt=document.getElementById('tiptxt'), mtips=document.getElementById('mtips');
let tipHidden = (store.tipHidden && typeof store.tipHidden==='object') ? store.tipHidden : {}; let tipsOff = !!store.tipsOff; let tipKey=null;
function tipContext(){
  if (!joined) return null;
  if (me.bar) return 'bartend';
  if (me.moving) return null;
  if (curRoom==='barn'){
    if (me.fish) return 'fishing';
    if (me.p!=='sit' && near(14,0)) return 'gate';
    if (me.p!=='sit' && pondNear()) return 'pond';
    if (me.p!=='sit' && CROPS.some(c=>near(c.gx,c.gy))) return 'crops';
    const sb=(me.p==='sit')?seatAt(me.gx,me.gy):null; if (sb && sb.gy>=10) return 'campfire';
    return null; }
  if (isP(curRoom)) return (PRD[curRoom] && PRD[curRoom].mine && !PRED.on && me.p!=='sit') ? 'myroom' : null;
  if (curRoom==='store'){ if (me.p!=='sit' && STORE_COUNTER.some(([x,y])=>near(x,y))) return 'counter'; if (me.p!=='sit' && (STORE_RACKS.some(([x,y])=>near(x,y)) || STORE_CASE.some(([x,y])=>near(x,y)))) return 'racks'; if (me.p!=='sit' && me.gx<=1 && me.gy>=1 && me.gy<=9) return 'merch'; return null; }
  if (curRoom==='casino') return me.p!=='sit' ? null : isSlotSeat(me.gx,me.gy) ? 'slots' : seatIn(ROUL_SEATS,me.gx,me.gy) ? 'roulette' : seatIn(BJ_SEATS,me.gx,me.gy) ? 'blackjack' : null;
  { const [dx,dy]=DOORWAY[curRoom]||[0,10]; if (me.p!=='sit' && me.gx===dx && me.gy===dy) return 'door'; }
  if (me.p!=='sit' && near(7,0)) return 'rope';
  const s = (me.p==='sit') ? seatAt(me.gx,me.gy) : null;
  if (s && s.gy===2 && s.gx<=6) return me.h ? 'bar2' : 'bar';
  if (me.h) return 'bar2';
  if (me.p==='sit' && nearTable()>=0) return 'table';
  if (s && s.gx===0) return 'sofa';
  if (near(0,6)) return 'lamp';
  if (me.p!=='sit' && near(ARC_X,0)) return 'arcade';
  if (me.p!=='sit' && near(JUKE_X,0)) return 'juke';
  if (me.p!=='sit' && me.gx>=10 && me.gy<=2) return 'scores';
  if (onDance()) return 'dance';
  if (SHOW_MERCH && me.gx<=1 && me.gy>=1 && me.gy<=9) return 'merch';
  return null;
}
function updateTip(){
  const k = (tipsOff || arcade.on || uiOpen()) ? null : tipContext();
  const show = k && !tipHidden[k];
  if ((show?k:null)!==tipKey){ tipKey = show?k:null; if (show){ tipTxt.innerHTML=TIPS[k]; tipEl.style.display='flex'; } else tipEl.style.display='none'; }
}
new MutationObserver(()=>document.body.classList.toggle('tipon', tipEl.style.display==='flex')).observe(tipEl,{attributes:true,attributeFilter:['style']});
document.getElementById('tipx').addEventListener('click', ()=>{ if(tipKey){ tipHidden[tipKey]=true; store.tipHidden=tipHidden; saveStore(); tipKey=null; tipEl.style.display='none'; } });
document.getElementById('tipall').addEventListener('click', ()=>{ tipsOff=true; store.tipsOff=true; saveStore(); mtips.textContent='TIPS: OFF'; tipKey=null; tipEl.style.display='none'; localMsg('Tips are off. Turn them back on in the MENU.'); });
mtips.textContent = tipsOff ? 'TIPS: OFF' : 'TIPS: ON';

// ======================= DAY / NIGHT (real local time) =======================
function dayPeriod(){ const h=new Date().getHours(); return (h>=7&&h<17)?'day':(h>=17&&h<20)||(h>=6&&h<7)?'dusk':'night'; }
let period=dayPeriod();
setInterval(()=>{ const p=dayPeriod(); if(p!==period){ period=p; rebuildBG(); } }, 30000);
// evening and night in the LLAMA LOUNGE: the neon sign washes the left wall, the bar glows warm underneath,
// the arcade and jukebox throw coloured light, and the dance floor lights the room in its colours when music plays
function loungeGlow(t, k){
  g.save(); g.globalCompositeOperation='lighter';
  const a=v=>(v*k).toFixed(3), pulse=0.85+Math.sin(t*2.2)*0.15;
  if (signGlow){ const [cx,cy,W]=signGlow;   // neon sign: a wash of pink and violet on the wall around it
    ellPx(cx,cy,W/2+16,26,`rgba(130,30,110,${a(0.22*pulse)})`); ellPx(cx,cy,W/2,15,`rgba(80,50,150,${a(0.22*pulse)})`); ellPx(cx+8,cy+44,W/2-6,14,`rgba(100,30,90,${a(0.14)})`); }
  for (let x=0; x<=6; x++){ const [bx,by]=P(x+0.5,1.95,2); ellPx(bx,by,13,4,`rgba(150,80,20,${a(0.30)})`); }   // warm strip under the bar
  { const [cx,cy]=P(3.5,1,30); ellPx(cx,cy,60,16,`rgba(120,70,20,${a(0.16)})`); }   // bottle shelf
  { const [ax,ay]=P(ARC_X+0.5,0.6,14); const fl=0.8+((Math.floor(t*6)%3)*0.1); ellPx(ax,ay,16,12,`rgba(30,120,160,${a(0.32*fl)})`); ellPx(ax,ay+10,22,8,`rgba(20,90,140,${a(0.18*fl)})`); }   // arcade screen
  if (jukeOn()){ const [jx,jy]=P(JUKE_X+0.5,0.6,16); ellPx(jx,jy,18,13,`rgba(140,40,120,${a(0.30*pulse)})`); }
  { const on=jukeOn(), [dx,dy]=P(10,4,0), c=DANCE_COLS[Math.floor(t*2)%DANCE_COLS.length], n=parseInt(c.slice(1),16), r=(n>>16)&255, gg=(n>>8)&255, b=n&255;
    ellPx(dx,dy,48,24,`rgba(${r>>2},${gg>>2},${b>>2},${a(on?0.55:0.25)})`); if (on) ellPx(dx,dy-26,30,18,`rgba(${r>>3},${gg>>3},${b>>3},${a(0.5)})`); }
  g.restore(); }
function drawNight(t){
  if (period==='day') return;
  const lounge = curRoom==='lounge';   // the lounge gets its own evening look: darker, with everything that lights up glowing
  if (lounge){ g.save(); g.globalCompositeOperation='multiply'; g.fillStyle = period==='night' ? 'rgb(86,78,168)' : 'rgb(236,176,184)'; g.fillRect(0,0,LW,LH); g.restore(); }   // multiply keeps the colours rich instead of greying them
  else { g.fillStyle = period==='night' ? 'rgba(20,16,70,0.30)' : 'rgba(150,70,40,0.12)'; g.fillRect(0,0,LW,LH); }
  if (lounge) loungeGlow(t, period==='night' ? 1 : 0.55);
  if (period==='night'){
    g.save(); g.globalCompositeOperation='lighter';
    if (curRoom==='barn'){ const [cx,cy]=P(10.5,11.5); const fl=0.32+Math.sin(t*9)*0.04; ellPx(cx,cy-10,34,20,`rgba(140,70,10,${fl})`); ellPx(cx,cy-10,18,11,'rgba(160,90,20,0.35)'); }
    else if (lampOn()){ const [lx,ly]=P(0.5,6.5); ellPx(lx,ly-24,20,14,'rgba(120,100,30,0.35)'); ellPx(lx,ly-22,12,9,'rgba(120,100,40,0.35)'); }
    if (curRoom==='lounge') for (const T of TABLES){ const [cx,cy]=P(T.gx+0.5,T.gy+0.5); ellPx(cx,cy-16,10,7,'rgba(110,70,20,0.35)'); }
    if (jukeOn()){ const [jx,jy]=P(10.5,0.5); ellPx(jx,jy-18,16,12,'rgba(80,30,90,0.35)'); }
    g.restore();
  }
}

// ======================= LEADERBOARD (shared; swap for your own server later) =======================
let lbDb=null, lbCanWrite=false, board={hay:[],dash:[]}, boardHit=null;
const lbClean = list => (Array.isArray(list)?list:[]).filter(e=>e&&typeof e==='object').map(e=>({n:clean(String(e.n||''),12).toUpperCase()||'LLAMA', s:Math.max(0,Math.floor(+e.s||0))})).sort((a,b)=>b.s-a.s).slice(0,10);
async function initBoard(){}
const lbQueue=[]; let lbBusy=false;
function reportScore(){}
async function lbFlush(){
  if (lbBusy||!lbQueue.length) return; lbBusy=true;
  try { const ref=lbDb.doc('board/scores'); const snap=await ref.get(); const d=(snap.exists&&snap.data())||{}; const cur={hay:lbClean(d.hay), dash:lbClean(d.dash)}; let changed=false;
    while (lbQueue.length){ const q=lbQueue.shift(); const list=cur[q.game]; const ex=list.find(e=>e.n===q.name);
      if (ex){ if(q.score>ex.s){ ex.s=q.score; changed=true; } } else { list.push({n:q.name,s:q.score}); changed=true; }
      list.sort((a,b)=>b.s-a.s); cur[q.game]=list.slice(0,10); }
    if (changed) await ref.set(cur);
  } catch(e){ if (e && e.code==='invalid_argument') lbCanWrite=false; }
  lbBusy=false; if (lbQueue.length) lbFlush();
}
const lboard=document.getElementById('lboard');
function renderBoard(){
  for (const id of ['hay','dash']){ const el=document.getElementById('lb_'+id); el.textContent='';
    const list=board[id]; if(!list.length){ const d=document.createElement('div'); d.className='lbe'; d.textContent='NO SCORES YET'; el.appendChild(d); continue; }
    list.forEach((e,i)=>{ const d=document.createElement('div'); d.className='lbe'+(e.n===(me.n||'').toUpperCase()?' me':''); const a=document.createElement('span'); a.textContent=(i+1)+'. '+e.n; const b=document.createElement('span'); b.textContent=e.s+(id==='dash'?'m':''); d.append(a,b); el.appendChild(d); }); }
}
function openBoard(){ closeAll(); renderBoard(); lboard.style.display='block'; }
document.getElementById('lbclose').addEventListener('click', ()=>closeAll());
function drawBoardWall(t){
  // chalkboard on the right wall, right of the window (u 10.2..11.8)
  const x0=204, W=32, hTop=90, hBot=46;
  for (let x=x0;x<x0+W;x++){ const base=Math.floor(x/2); const top=base-hTop, H=hTop-hBot;
    g.fillStyle=INK; g.fillRect(OX+x,OY+top,1,H); if(x===x0||x===x0+W-1) continue;
    g.fillStyle='#a86030'; g.fillRect(OX+x,OY+top+1,1,H-2); if(x===x0+1||x===x0+W-2) continue;
    g.fillStyle='#285838'; g.fillRect(OX+x,OY+top+3,1,H-6); }
  const cx=x0+W/2, base=Math.floor(cx/2);
  // trophy
  const tx=OX+Math.round(cx)-4, ty=OY+base-hTop+6;
  g.fillStyle=INK; g.fillRect(tx-1,ty-1,10,8); g.fillStyle='#f8d030'; g.fillRect(tx,ty,8,6); g.fillStyle='#f8f070'; g.fillRect(tx+1,ty+1,2,3);
  g.fillStyle=INK; g.fillRect(tx-3,ty,2,4); g.fillRect(tx+9,ty,2,4); g.fillRect(tx+3,ty+7,2,3); g.fillRect(tx+1,ty+10,6,2); g.fillStyle='#f8d030'; g.fillRect(tx+2,ty+10,4,1);
  // chalk score lines (top 3 of each, as bars)
  const lists=[board.hay, board.dash];
  for (let k=0;k<2;k++) for (let r=0;r<3;r++){ const e=lists[k][r]; const y=OY+base-hTop+22+k*12+r*3; const len = e ? 6+Math.min(16, Math.round(e.n.length*1.5)) : 4;
    g.fillStyle = e ? (r===0?'#f8f070':'#e8f0e0') : '#4a7858'; g.fillRect(OX+x0+5, y+Math.round((x0+5)/2)-base, len, 1); }
  if (Math.floor(t*1.5)%4===0){ g.fillStyle='#f8f8f8'; g.fillRect(tx+9,ty-3,1,1); }
  boardHit={x0:OX+x0, x1:OX+x0+W, y0:OY+Math.floor((x0)/2)-hTop, y1:OY+Math.floor((x0+W)/2)-hBot};
}

// ======================= LOOP =======================
rebuildBG(); resize();
setSel(me.c); pname.value=me.n; tokUI(0); initWallet();
const RULES_V=1; const rulesEl=document.getElementById('rules');
function showRules(){ closeAll(); rulesEl.style.display='flex'; rulesEl.scrollTop=0; }
document.getElementById('ragree').addEventListener('click', ()=>{ store.agreed=RULES_V; saveStore(); acctSave(); rulesEl.style.display='none'; if (!joined){ if (acctHasLlama()) autoEnter(); else pick.style.display='flex'; } });

// ======================= GAME ACCOUNT (tied to the player's sign-in) =======================
// Each signed-in player gets a private profile doc: data/users/<id>/profile. It remembers their llama,
// name, rules agreement, best scores and bet, so signing in anywhere drops them straight into the lounge.
// Tokens live next to it in data/users/<id>/wallet. Swap these for your own server's account API later.
let acctRef=null, acct=null, acctTimer=null;
async function loadAccount(){ return !!acct; }
function acctSave(){ clearTimeout(acctTimer); acctTimer=setTimeout(()=>{ NET.act('profile',{c:store.c||me.c, agreed:+store.agreed||0, bet:Number.isInteger(store.bet)?store.bet:2}); }, 400); }
const acctHasLlama = () => !!(acct && CHAR_IDS.includes(acct.c));
function autoEnter(){ try { setSel(me.c); pname.value=me.n; enter(); } catch(e){ console.error(e); if (!joined){ roomPickEl.style.display='none'; $id('roomsbox').style.display='none'; pick.style.display='flex'; } } }
async function startGate(){
  if (await handleEmailLink()) return;   // a reset link shows the new-password form first
  loadingEl.style.display='block';
  let r=null; try { r = await fetch('/api/me', {credentials:'same-origin'}); } catch(e){}
  loadingEl.style.display='none';
  if (r && r.ok){ applyProfile(await r.json()); afterLogin(); }
  else if (r && r.status===403){ const j=await r.json().catch(()=>({})); showKicked(j.error||'This account is banned.'); }
  else showAuth('login', pendingNote, /confirmed/.test(pendingNote)), pendingNote='';
}
function applyProfile(p){
  acct = Object.assign({}, p); isAdminUser = !!p.admin; me.st = ['owner','mod'].includes(p.staff) ? p.staff : ''; dashMenu();
  me.n = p.name; store.n = p.name; pname.value = p.name; pname.readOnly = true;
  if (CHAR_IDS.includes(p.c)){ me.c=p.c; store.c=p.c; setSel(p.c); }
  store.agreed = p.agreed||0; store.bet = Number.isInteger(p.bet)?p.bet:2; store.tk = p.tk;
  best.hay = p.bestHay||0; best.dash = p.bestDash||0;
  for (const tm of (p.timers||[])) cropState[tm.k] = Date.now()+tm.left; store.crops=cropState;
  saveStore(); tokUI(0);
}
function afterLogin(){
  NET.connect(); maybeAskEmail();
  if (pendingNote){ const n=pendingNote; pendingNote=''; const t=setInterval(()=>{ if (joined){ clearInterval(t); setTimeout(()=>localMsg(n), 1500); } }, 500); }
  if ((+store.agreed||0) < RULES_V){ rulesEl.style.display='flex'; return; }
  if (acctHasLlama()) autoEnter(); else pick.style.display='flex';
}
const authEl=document.getElementById('auth'), auErr=document.getElementById('au_err'); let isAdminUser=false;
// ---- login screen: LOG IN / SIGN UP tabs, plus FORGOT PASSWORD and RESET (from an email link) ----
const $id = id=>document.getElementById(id);
let auView='login', resetTok='', pendingNote='';
const AU_VIEWS = {
  login:  {sub:'Welcome back! Log in with your llama name or email.', u:'NAME OR EMAIL', ua:'username', um:254, e:false, p:'PASSWORD', pa:'current-password', go:'LOG IN', forgot:true, back:false, note:"Don't reuse a password from another site."},
  signup: {sub:'Make your llama account. You start with 10 tokens!', u:'LLAMA NAME', ua:'username', um:12, e:true, p:'PASSWORD', pa:'new-password', go:'MAKE MY LLAMA', forgot:false, back:false, note:'Names: 3 to 12 letters, numbers or _. Passwords: 8+ characters, stored encrypted. Your email is only used for password resets and is never shown to other players.'},
  forgot: {sub:"Enter your account's email and we'll send you a link to pick a new password.", u:null, e:true, p:null, go:'SEND RESET LINK', forgot:false, back:true, note:'The link works once and expires in 30 minutes. Check your spam folder too.'},
  pk:     {sub:'This account has a passkey. Confirm it\'s you with Face ID, your fingerprint or your screen lock.', u:null, e:false, p:null, go:'USE MY PASSKEY', forgot:false, back:true, note:'No device with you? Use one of the backup codes you saved when you set up the passkey.'},
  reset:  {sub:'Pick a new password for your llama. This logs you out everywhere else.', u:null, e:false, p:'NEW PASSWORD', pa:'new-password', go:'SAVE NEW PASSWORD', forgot:false, back:true, note:'8+ characters. Make it one you don\'t use anywhere else.'},
};
function authView(v, msg, good){
  auView=v; const V=AU_VIEWS[v]; authEl.className='gb v-'+v;
  for (const b of $id('au_tabs').children) b.classList.toggle('on', b.dataset.v===v);
  $id('au_sub').textContent=V.sub;
  $id('au_ul').style.display=V.u?'':'none'; if (V.u){ $id('au_ut').textContent=V.u; $id('au_u').maxLength=V.um; $id('au_u').autocomplete=V.ua; }
  $id('au_el').style.display=V.e?'':'none'; $id('au_tl').style.display = v==='signup' ? '' : 'none';
  $id('au_pl').style.display=V.p?'':'none'; if (V.p){ $id('au_pt').textContent=V.p; $id('au_p').autocomplete=V.pa; }
  $id('au_go').textContent=V.go; $id('au_forgot').style.display=V.forgot?'':'none'; $id('au_back').style.display=V.back?'':'none';
  $id('au_note').textContent=V.note; auErr.textContent=msg||''; auErr.classList.toggle('good', !!good); $id('au_pkbk').style.display = v==='pk' ? 'block' : 'none'; $id('au_tabs').style.visibility = v==='pk' ? 'hidden' : '';
  setTimeout(()=>{ const f = V.u ? $id('au_u') : V.e ? $id('au_e') : $id('au_p'); if (authEl.style.display==='block') f.focus(); }, 50);
}
function showAuth(v, msg, good){ closeAll(); authEl.style.display='block'; authView(v||'login', msg, good); }
async function doAuth(){
  const v=auView, u=$id('au_u').value.trim(), e=$id('au_e').value.trim(), p=$id('au_p').value;
  if (v==='pk') return pkLogin(false);
  const busy={login:'LOGGING IN...', signup:'MAKING YOUR ACCOUNT...', forgot:'SENDING...', reset:'SAVING...'}[v];
  if ((v==='signup'||v==='forgot') && !/^\S+@\S+\.\S+$/.test(e)){ auErr.classList.remove('good'); auErr.textContent='Enter a real email.'; return; }
  if (v==='signup' && !$id('au_t').checked){ auErr.classList.remove('good'); auErr.textContent='Please tick the box to confirm you\'re 13 or older and agree to the Terms.'; return; }
  auErr.classList.remove('good'); auErr.textContent=busy;
  for (const b of authEl.querySelectorAll('button')) b.disabled=true;
  const r = v==='login' ? await apiPost('/api/login',{u,p}) : v==='signup' ? await apiPost('/api/signup',{u,e,p,t:1}) : v==='forgot' ? await apiPost('/api/forgot',{e}) : await apiPost('/api/reset',{t:resetTok,p});
  for (const b of authEl.querySelectorAll('button')) b.disabled=false;
  if (r.need2fa==='passkey'){ PKL.t=r.t; PKL.opts=r.opts; PKL.reset = v==='reset'; $id('au_p').value=''; authView('pk'); return; }
  if (!r.ok){ auErr.textContent = r.error||'Something went wrong.'; return; }
  if (v==='forgot'){ authView('login', r.mailOn===false ? "Password reset emails aren't switched on yet. Ask a staff member in the game for help." : 'If that email has an account, a reset link is on its way. Check your inbox and spam folder.', r.mailOn!==false); $id('au_u').value=e; return; }
  if (v==='reset'){ resetTok=''; pendingNote='Your password was changed. Every other device was logged out.'; }
  $id('au_p').value=''; authEl.style.display='none'; applyProfile(r); afterLogin();
}
$id('au_form').addEventListener('submit', e=>{ e.preventDefault(); doAuth(); });
for (const b of $id('au_tabs').children) b.addEventListener('click', ()=>authView(b.dataset.v));
$id('au_forgot').addEventListener('click', ()=>{ const u=$id('au_u').value.trim(); if (u.includes('@')) $id('au_e').value=u; authView('forgot'); });
$id('au_back').addEventListener('click', ()=>{ resetTok=''; PKL.t=null; authView('login'); });
// ---- passkeys: the second login step for staff, and adding one from the ACCOUNT desk ----
const PKL = { t:null, opts:null, reset:false };
const pkEnc = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const pkDec = s => Uint8Array.from(atob(String(s).replace(/-/g,'+').replace(/_/g,'/')+'==='.slice((String(s).length+3)%4)), c=>c.charCodeAt(0));
const pkSupported = () => !!(window.PublicKeyCredential && navigator.credentials && window.isSecureContext);
async function pkLogin(useCode){ auErr.classList.remove('good');
  if (!PKL.t){ authView('login', 'That took too long. Log in again.'); return; }
  let body={t:PKL.t};
  if (useCode){ const c=$id('au_code').value.trim(); if (c.replace(/[^A-Za-z0-9]/g,'').length!==8){ auErr.textContent='Backup codes look like ABCD-1234.'; return; } body.code=c; }
  else { if (!pkSupported()){ auErr.textContent='This browser can\'t use passkeys. Use a backup code, or try another browser.'; return; }
    auErr.textContent='WAITING FOR YOUR PASSKEY...';
    try { const o=PKL.opts; const cred=await navigator.credentials.get({publicKey:{challenge:pkDec(o.challenge), rpId:o.rpId, allowCredentials:(o.allowCredentials||[]).map(c=>({type:'public-key', id:pkDec(c.id)})), userVerification:'required', timeout:o.timeout||60000}});
      const R=cred.response; body.cred={id:cred.id, clientDataJSON:pkEnc(R.clientDataJSON), authenticatorData:pkEnc(R.authenticatorData), signature:pkEnc(R.signature)}; }
    catch(err){ auErr.textContent='The passkey was cancelled or didn\'t work. Try again, or use a backup code.'; return; } }
  for (const b of authEl.querySelectorAll('button')) b.disabled=true;
  const r=await apiPost('/api/login2', body);
  for (const b of authEl.querySelectorAll('button')) b.disabled=false;
  if (!r.ok){ auErr.textContent=r.error||'That didn\'t work.'; if (/Log in again/.test(r.error||'')){ PKL.t=null; } return; }
  PKL.t=null; $id('au_code').value=''; if (PKL.reset){ resetTok=''; pendingNote='Your password was changed. Every other device was logged out.'; }
  authEl.style.display='none'; applyProfile(r); afterLogin(); }
$id('au_usecode').addEventListener('click', ()=>pkLogin(true));
$id('au_code').addEventListener('keydown', e=>{ if (e.key==='Enter'){ e.preventDefault(); pkLogin(true); } });
async function pkAdd(p){ if (!pkSupported()) return {error:'This browser or device can\'t make passkeys. Try Safari on iPhone, Chrome on Android, or a recent browser on your computer.'};
  const s=await apiPost('/api/pk/start',{p}); if (!s.ok) return s; const o=s.opts;
  let cred; try { cred=await navigator.credentials.create({publicKey:{...o, challenge:pkDec(o.challenge), user:{...o.user, id:pkDec(o.user.id)}, excludeCredentials:(o.excludeCredentials||[]).map(c=>({type:'public-key', id:pkDec(c.id)}))}}); }
  catch(err){ return {error: err && err.name==='InvalidStateError' ? 'This device already has a passkey for your llama.' : 'Making the passkey was cancelled or didn\'t work.'}; }
  const R=cred.response; if (!R.getPublicKey || !R.getAuthenticatorData) return {error:'This browser is too old for passkeys. Update it and try again.'};
  return apiPost('/api/pk/finish',{t:s.t, cred:{id:cred.id, alg:R.getPublicKeyAlgorithm(), spki:pkEnc(R.getPublicKey()), authenticatorData:pkEnc(R.getAuthenticatorData()), clientDataJSON:pkEnc(R.clientDataJSON)}}); }
function pkCodesHtml(codes){ return `<div class="pkcodes"><b>YOUR BACKUP CODES</b><small>Save these somewhere safe (not on this device). Each one works once if you can't use your passkey. They won't be shown again.</small><div class="pkgrid">${codes.map(c=>`<code>${esc(c)}</code>`).join('')}</div><div class="srow"><button class="gbbtn s" type="button" id="pk_copy">COPY ALL</button></div></div>`; }
function pkSection(){ const el=$id('ac_pk'); if (!el) return;
  apiPost('/api/pk/status').then(r=>{ if (!r.ok){ el.innerHTML='<div class="acv">Could not load.</div>'; return; }
    el.innerHTML = (r.on ? `<div class="acst ok">✅ ON · ${r.keys} PASSKEY${r.keys===1?'':'S'} · ${r.codes} BACKUP CODE${r.codes===1?'':'S'} LEFT</div>` : `<div class="acv">Staff logins can be stolen with just a password. Add a passkey and every login will also ask for Face ID, your fingerprint or your screen lock.</div>`)
      + `<div class="acv pkhint">First type the password you log in with, to prove it's you. You don't make up a passkey: your device creates it when you tap the button.</div><input id="pk_p" type="password" autocomplete="current-password" placeholder="Your login password" maxlength="72"><div class="srow pkbtns"><button class="gbbtn y" id="pk_add">${r.on?'ADD ANOTHER DEVICE':'ADD A PASSKEY'}</button>${r.on?'<button class="gbbtn" id="pk_codes">NEW BACKUP CODES</button><button class="gbbtn" id="pk_off">TURN OFF</button>':''}</div><div id="pk_out"></div>`;
    const pw=()=>$id('pk_p').value, out=$id('pk_out'), showCodes=codes=>{ out.innerHTML=pkCodesHtml(codes); $id('pk_copy').onclick=()=>{ try{ navigator.clipboard.writeText(codes.join('\n')); acMsg('Copied! Paste them somewhere safe.', true); }catch(_){ acMsg('Copy didn\'t work. Write them down instead.'); } }; };
    $id('pk_add').onclick=async ()=>{ if (!pw()) return acMsg('Enter your login password first.'); acMsg('FOLLOW THE STEPS ON YOUR DEVICE...'); const r2=await pkAdd(pw()); if (!r2.ok) return acMsg(r2.error||'That did not work.');
      $id('pk_p').value=''; acMsg('Passkey added! Logins on this llama now need it.', true); pkSection(); if (r2.codes) setTimeout(()=>showCodes(r2.codes), 300); };
    const c=$id('pk_codes'); if (c) c.onclick=async ()=>{ if (!pw()) return acMsg('Enter your password first.'); const r2=await apiPost('/api/pk/codes',{p:pw()}); if (!r2.ok) return acMsg(r2.error||'That did not work.'); $id('pk_p').value=''; acMsg('New backup codes made. The old ones stopped working.', true); showCodes(r2.codes); };
    const o=$id('pk_off'); if (o) o.onclick=async ()=>{ if (!pw()) return acMsg('Enter your password first.'); if (!o.classList.contains('sure')){ o.classList.add('sure'); o.textContent='REALLY TURN OFF?'; return; } const r2=await apiPost('/api/pk/off',{p:pw()}); if (!r2.ok) return acMsg(r2.error||'That did not work.'); acMsg('Passkeys removed. Logins only need your password now.', true); pkSection(); };
    acInputs(); }); }
for (const b of document.querySelectorAll('.eye')) b.addEventListener('click', ()=>{ const i=$id(b.dataset.for); const show=i.type==='password'; i.type=show?'text':'password'; b.textContent=show?'HIDE':'SHOW'; i.focus(); });
for (const el of authEl.querySelectorAll('input')) el.addEventListener('keydown', e=>e.stopPropagation());
// email links land on /#reset=... or /#verify=... (the part after # never reaches any server log). Read it, then wipe it from the address bar.
async function handleEmailLink(){
  const m=/^#(reset|verify)=([A-Za-z0-9_-]{40,50})$/.exec(location.hash||''); if (!m) return false;
  try { history.replaceState(null, '', location.pathname+location.search); } catch(_){}
  if (m[1]==='reset'){ resetTok=m[2]; showAuth('reset'); return true; }
  const r=await apiPost('/api/verify',{t:m[2]}); pendingNote = r.ok ? 'Email confirmed! You can now reset your password by email if you ever need to.' : (r.error||'That confirm link did not work.');
  return false;
}
addEventListener('hashchange', async ()=>{ const v=await handleEmailLink(); if (!v && pendingNote && joined){ localMsg(pendingNote); pendingNote=''; } });
// ---- friends: requests, list with who's online and where, GO to their room ----
const FR = { friends:[], inc:[], out:[] }; const frEl=$id('frbox'), frBody=$id('fr_body');
const isFriend = n => FR.friends.includes(String(n||'').toUpperCase());
function frWhere(n){ for (const o of others.values()) if (!o.leaving && o.n && o.n.toUpperCase()===n) return o.rm||'lounge'; return null; }
// a llama picture at a whole-number size (crop = how many sprite rows from the top: 22 is just the head)
const picCache=new Map();
function llamaPic(c, wear, cssH, crop){ if (!CHARS[c]) c=me.c&&CHARS[me.c]?me.c:Object.keys(CHARS)[0]; const dpr=window.devicePixelRatio||1, H=crop||SH, k=Math.max(1,Math.round(cssH*dpr/H)), key=[c,wearKey(wear||{}),k,H].join('|');
  let u=picCache.get(key); if (!u){ const cv=document.createElement('canvas'); cv.width=SW*k; cv.height=H*k; const x=cv.getContext('2d'); x.imageSmoothingEnabled=false; x.drawImage(sprite(c,'fr',0,'stand',wear||{}),0,0,SW,H,0,0,SW*k,H*k); u=cv.toDataURL(); picCache.set(key,u); }
  return `<img class="lpic" src="${u}" style="width:${SW*k/dpr}px;height:${H*k/dpr}px" alt="">`; }
const emptyBox=(t,sub)=>`<div class="empty">${llamaPic(me.c, me.w, 88)}<b>${t}</b>${sub?`<small>${sub}</small>`:''}</div>`;
function frSet(fr){ if (!fr) return; FR.c={...(FR.c||{}), ...(fr.c||{})}; FR.friends=fr.friends||[]; FR.inc=fr.inc||[]; FR.out=fr.out||[];
  const b=$id('fr_badge'); b.textContent=FR.inc.length; b.classList.toggle('on', FR.inc.length>0); $id('menubtn').classList.toggle('frdot', FR.inc.length>0);
  const q=$id('fr_req'); q.textContent=FR.inc.length; q.classList.toggle('on', FR.inc.length>0); frSign();
  if (frEl.style.display==='block') frDraw(); pmFriendBtn(); }
// the FRIENDS sign: green pill = friends online now, pink badge = requests waiting
function frSign(){ const n=FR.friends.filter(f=>frWhere(f)).length, el=$id('fr_on'); el.textContent=n; el.classList.toggle('on', n>0);
  $id('frbtn').setAttribute('aria-label', `Friends: ${n} online` + (FR.inc.length ? `, ${FR.inc.length} request${FR.inc.length>1?'s':''}` : '')); }
setInterval(()=>{ if (joined) frSign(); }, 2000);
$id('frbtn').addEventListener('click', ()=>{ ensureAudio(); openFriends(); });
function frMsg(t, good){ const el=$id('fr_msg'); el.textContent=t||''; el.classList.toggle('good', !!good); }
function frLoad(){ NET.act('fr_list').then(r=>{ if (r.ok) frSet(r.fr); }); }
function frDo(a, n){ return NET.act(a, {n}).then(r=>{ if (r.fr) frSet(r.fr); if (r.msg) frMsg(r.msg, r.ok); return r; }); }
function frDraw(){
  const row = (n, sub, on, btns) => `<div class="frr"><span class="frf">${llamaPic(FR.c&&FR.c[n], null, 34, 22)}<span class="frd${on?' on':''}"></span></span><span class="frn">${esc(n)}${sub?`<small>${sub}</small>`:''}</span>${btns?`<span class="fra">${btns}</span>`:''}</div>`;
  let h='';
  if (FR.inc.length){ h+='<div class="frh">FRIEND REQUESTS</div>'; for (const n of FR.inc) h+=row(n, 'wants to be friends', !!frWhere(n), `<button class="gbbtn y" data-fa="fr_accept" data-n="${esc(n)}">ACCEPT</button><button class="gbbtn frx" data-fa="fr_decline" data-n="${esc(n)}" aria-label="Decline">✕</button>`); }
  const list=[...FR.friends].sort((a,b)=>(!!frWhere(b))-(!!frWhere(a)) || a.localeCompare(b));
  h+=`<div class="frh">FRIENDS · ${FR.friends.filter(n=>frWhere(n)).length} ONLINE</div>`;
  if (list.some(n=>{ const r2=frWhere(n); return r2 && r2!==curRoom; })) h+=`<div class="fre">Tap 📨 INVITE to ask a friend over to ${esc(roomName(curRoom))}.</div>`;
  if (!list.length) h+=emptyBox('NO FRIENDS YET', 'Tap another llama and press ⭐ ADD, or type their name above.');
  for (const n of list){ const rm=frWhere(n);
    h+=row(n, rm ? (rm===curRoom ? 'Here with you' : 'In '+roomName(rm)) : 'Offline', !!rm, `<button class="gbbtn frm" data-dm="${esc(n)}" aria-label="Message ${esc(n)}">💬</button>` + (rm && rm!==curRoom ? `<button class="gbbtn frinv" data-inv="${esc(n)}" aria-label="Invite ${esc(n)} to this room">📨<span class="ilb"> INVITE</span></button><button class="gbbtn y" data-go2="${rm}">GO ▶</button>` : '') + `<button class="gbbtn frx" data-fa="fr_remove" data-n="${esc(n)}" aria-label="Remove friend">✕</button>`); }
  if (FR.out.length){ h+='<div class="frh">SENT</div>'; for (const n of FR.out) h+=row(n, 'waiting for them to accept', !!frWhere(n), `<button class="gbbtn" data-fa="fr_remove" data-n="${esc(n)}">CANCEL</button>`); }
  frBody.innerHTML=h; sheetHead(frEl);
}
frBody.addEventListener('click', e=>{ const b=e.target.closest('button'); if (!b) return; ensureAudio();
  if (b.dataset.go2){ closeAll(); showSwap(b.dataset.go2); return; }
  if (b.dataset.dm){ openDM(b.dataset.dm); return; }
  if (b.dataset.inv){ b.disabled=true; NET.act('room_invite',{n:b.dataset.inv}).then(r=>{ frMsg(r.msg||(r.ok?'Invite sent!':'Could not send that invite.'), r.ok); if (r.ok){ b.textContent='✓ SENT'; } else b.disabled=false; }); return; }
  const a=b.dataset.fa, n=b.dataset.n; if (!a) return;
  if (a==='fr_remove' && FR.friends.includes(n) && !confirm(`Remove ${n} from your friends?`)) return;
  frDo(a, n); });
function openFriends(){ closeAll(); frMsg(''); frDraw(); frEl.style.display='block'; frLoad(); }
$id('fr_close').addEventListener('click', ()=>{ frEl.style.display='none'; });
$id('fr_form').addEventListener('submit', e=>{ e.preventDefault(); const n=$id('fr_name').value.trim(); if (!n) return;
  if (!/^[A-Za-z0-9_]{3,12}$/.test(n)) return frMsg('Llama names are 3 to 12 letters, numbers or _.');
  frDo('fr_add', n).then(r=>{ if (r.ok) $id('fr_name').value=''; }); });
$id('fr_name').addEventListener('keydown', e=>e.stopPropagation());
// the button on the pop-up you get by tapping another llama
function pmFriendBtn(){ const b=$id('pm_friend'); const o=pmTarget&&others.get(pmTarget); if (!b||!o) return; const n=o.n.toUpperCase();
  b.textContent = FR.friends.includes(n) ? '💬 MESSAGE' : FR.out.includes(n) ? '⏳ ASKED' : FR.inc.includes(n) ? '⭐ ACCEPT' : '⭐ ADD';
  b.disabled = FR.out.includes(n); }
$id('pm_friend').addEventListener('click', ()=>{ const o=pmTarget&&others.get(pmTarget); if (!o) return; const n=o.n.toUpperCase(); closeAll();
  if (FR.friends.includes(n)){ openDM(n); return; }
  NET.act(FR.inc.includes(n)?'fr_accept':'fr_add', {n}).then(r=>{ if (r.fr) frSet(r.fr); localMsg(r.msg||(r.ok?'Done.':'That did not work.')); }); });
NET.handlers.fr = m => { frSet(m.fr);
  if (m.ev==='req') localMsg(`⭐ ${String(m.n).toUpperCase()} sent you a friend request! Open Menu > FRIENDS to accept.`);
  else if (m.ev==='acc') localMsg(`⭐ ${String(m.n).toUpperCase()} accepted your friend request!`); };

// ---- LLAMA STORE catalog: every shirt with a link to the website ----
function openCatalog(){ closeAll(); const el=$id('catbox');
  $id('cat_body').innerHTML = PRODUCTS.map((pr,i)=>`<div class="ci" data-i="${i}" role="button" tabindex="0"><img src="${pr.pop}" alt="" style="background:${pr.bg}"><b>${esc(pr.name)}</b><small>${esc(pr.price)}</small><a href="${esc(pr.url)}" target="_blank" rel="noopener noreferrer">VIEW ▶</a></div>`).join('');
  el.style.display='block'; }
$id('cat_body').addEventListener('click', e=>{ if (e.target.closest('a')) return; const c=e.target.closest('.ci'); if (c) openShop(+c.dataset.i); });
$id('cat_close').addEventListener('click', ()=>{ $id('catbox').style.display='none'; });
// ---- wardrobe: buy clothes in the LLAMA STORE, wear them anywhere ----
const INV={owned:[]}; me.w={};
const WD={tab:'shop', pick:null, dir:0, kind:'clothes', furn:[]};
// themed room kits (same list as KITS in src/worker.js): the set costs 20% less than its pieces
const KITS = { living: { n: "COZY LIVING ROOM", items: { sofa: 1, coffeetable: 1, armchair: 1, floorlamp: 1, rug_shag: 1, plant: 1, tv: 1 } },
  bedroom: { n: "DREAMY BEDROOM", items: { dbed: 1, dresser: 1, lavalamp: 1, rug_round: 1, bookshelf: 1, flowers: 1 } },
  diner: { n: "RETRO DINER", items: { roundtable: 1, chair_red: 4, barstool: 2, vending: 1 } },
  game: { n: "GAME ROOM", items: { bigtv: 1, beanbag: 2, boombox: 1, lavalamp: 1, snackvend: 1, rug_stripe: 1 } },
  study: { n: "STUDY NOOK", items: { bookshelf: 2, table: 1, chair_walnut: 1, lamp: 1, cubeshelf: 1, cactus: 1 } },
  starter: { n: "STARTER KIT", items: { chair: 1, table: 1, lamp: 1, plant: 1, rug_mat_green: 1 } },
  farm: { n: "FARM STARTER", items: { plot: 2, scarecrow: 1, sunflowers: 1, trough: 1, gfence: 2 } } };
const kitFull = k => Object.entries(KITS[k].items).reduce((t,[it,n])=>t+((FURN_DEF[it]||{}).p||0)*n, 0), kitPrice = k => Math.round(kitFull(k)*0.8);
let DECO_OWN=[];
function wdFurnLoad(){ return NET.act('furn_info').then(r=>{ if (r.ok){ WD.furn=r.furn; WD.rares=r.rares||WD.rares; DECO_OWN=r.deco||DECO_OWN; if ($id('wardbox').style.display==='block') wdDraw(); } }); } const WD_DIRS=['fr','fl','bl','br'];
function wdLoad(){ return NET.act('inv_info').then(r=>{ if (r.ok){ INV.owned=r.owned||[]; me.w=cleanWear(r.w); if ($id('wardbox').style.display==='block') wdDraw(); } }); }
function wdMsg(t,good){ const el=$id('wd_msg'); el.textContent=t||''; el.classList.toggle('good',!!good); }
function wdPreview(){ const c=$id('wd_prev'), x=c.getContext('2d'); x.clearRect(0,0,SW,SH); const w={...me.w}; if (WD.pick) w[ITEMS[WD.pick].s]=WD.pick; x.drawImage(sprite(me.c, WD_DIRS[WD.dir], 0, 'stand', w), 0, 0); }
function wdInfo(){
  const id=WD.pick, acts=$id('wd_acts'); acts.innerHTML='';
  if (!id){ $id('wd_name').textContent='YOUR LLAMA'; const on=WEAR_SLOTS.filter(s2=>me.w[s2]).map(s2=>ITEMS[me.w[s2]].n); $id('wd_sub').textContent = on.length ? 'Wearing: '+on.join(', ') : 'Tap an item to try it on.'; return; }
  const it=ITEMS[id], own=INV.owned.includes(id), on=me.w[it.s]===id, inStore=curRoom==='store';
  $id('wd_name').textContent=it.n; const ow=ISTAT&&ISTAT.wear?ISTAT.wear[id]||0:null; $id('wd_sub').innerHTML = `<span class="wdd">${esc(WEAR_DESC[id]||'')}</span>` + esc(own ? (on ? 'You have this on.' : 'In your closet.') : `${it.p} TOKENS · ${inStore ? 'Trying it on. Buy it to keep it.' : 'Buy it at the LLAMA STORE.'}`) + (ow!=null ? `<span class="wdo">${pix('people')} ${ow} LLAMA${ow===1?'':'S'} HAVE ONE</span>` : ''); if (!ISTAT) itemStats().then(()=>{ if (WD.pick===id) wdInfo(); });
  const btn=(label,cls,fn,dis)=>{ const b=document.createElement('button'); b.className='gbbtn '+(cls||''); b.textContent=label; b.disabled=!!dis; b.addEventListener('click',fn); acts.appendChild(b); };
  if (!own) btn(inStore ? `BUY · ${it.p} 🪙` : 'BUY IN THE STORE', 'y', ()=>wdBuy(id), !inStore);
  else if (on) btn('TAKE OFF','',()=>wdWear(it.s,null)); else btn('WEAR IT','y',()=>wdWear(it.s,id));
}
function wdCard(id){ const it=ITEMS[id], own=INV.owned.includes(id), on=me.w[it.s]===id;
  return `<div class="wi${WD.pick===id?' sel':''}" data-id="${id}"><canvas width="20" height="16" data-ic="${id}"></canvas><b>${esc(it.n)}</b>${on?'<small class="on">WEARING</small>':own?'<small class="own">OWNED ✓</small>':`<small>${it.p} 🪙</small>`}</div>`; }
function wdDraw(){
  const shop=WD.tab==='shop';
  for (const b of $id('wd_tabs').children) b.classList.toggle('on', b.dataset.t===WD.tab);
  $id('wd_tabs').style.display = shop ? 'none' : ''; $id('wardbox').querySelector('.wdtop').style.display = (WD.tab==='storage' || (shop && WD.kind!=='clothes')) ? 'none' : '';
  $id('wd_title').textContent = shop ? (WD.kind==='furn' ? '🛋️ FURNITURE SHOP' : WD.kind==='rares' ? '⭐ LIMITED RARES' : '🛍️ CLOTHES SHOP') : '🎒 INVENTORY';
  let h='';
  if (shop && WD.kind==='rares'){ const RR=WD.rares; if (!RR || !RR.list) h+='<div class="fre">Loading...</div>'; else { h+='<div class="wdh">⭐ LIMITED RARES</div><div class="fre">Made in small numbered runs and never sold again. Each llama can buy '+(RR.list[0]?RR.list[0].each:2)+' of each. After that, the only way is trading!</div><div class="wdg">';
      const skew=Date.now()-(RR.now||Date.now());
      for (const r of RR.list){ const left=r.max-r.sold, notYet=r.open>Date.now()-skew, mineN=(RR.mine||[]).filter(m=>m.item===r.k).map(m=>'#'+m.serial);
        const when=notYet ? new Date(r.open).toLocaleString([], {weekday:'short', hour:'numeric', minute:'2-digit'}) : '';
        h+=`<div class="wi fi rare" data-f="${r.k}"><canvas width="80" height="80" data-fk="${r.k}"></canvas><b>${esc(r.n)}</b><small>${r.p} 🪙 · ${left>0?`<span class="rl">${left} OF ${r.max} LEFT</span>`:'<span class="rso">SOLD OUT</span>'}${mineN.length?` · <span class="own">YOURS: ${mineN.join(' ')}</span>`:''}</small>`+
          (notYet ? `<button class="gbbtn" disabled>DROPS ${esc(when.toUpperCase())}</button>` : left<=0 ? '<button class="gbbtn" disabled>SOLD OUT</button>' : `<button class="gbbtn y" data-buyr="${r.k}" ${curRoom!=='store'?'disabled':''}>${curRoom==='store'?'BUY':'IN STORE'}</button>`)+'</div>'; }
      h+='</div>'; } }
  else if (shop && WD.kind==='furn'){ const own=k=>{ const r=WD.furn.find(x=>x.item===k); return r?r.n:0; }, dragIn=prInMine();
    { const SC=[['furn','🛋️ FURNITURE'],['farm','🌾 FARM'],['rugs','🧶 RUGS'],['kits','🎁 KITS'],['deco','🎨 WALLS & FLOORS']]; if (!SC.some(c=>c[0]===WD.cat)) WD.cat = SC.some(c=>c[0]===store.shopCat) ? store.shopCat : 'furn';
      h+=`<div class="shopcats">${SC.map(([k,l])=>`<button type="button" data-scat="${k}" class="${WD.cat===k?'on':''}">${l}</button>`).join('')}</div>`; }
    const C=WD.cat, catOk = cat => C==='farm' ? cat==='farm' : C==='rugs' ? cat==='rugs' : C==='furn' ? !['farm','rugs','rares'].includes(cat) : false;   // which shelves show on this tab
    h+= dragIn ? '<div class="fre"><b>Drag any picture into your room</b> to buy it and put it down in one go, or tap BUY and place it later from 🎒 INVENTORY > ITEMS.</div>' : '<div class="fre">Buy from anywhere. Furniture goes into 🎒 INVENTORY > ITEMS, ready to place in your own room. LIMITED RARES are only sold at the LLAMA STORE.</div>';
    h+='<div class="srow" style="margin:0 0 6px"><button class="gbbtn" id="wd_market">🏪 MARKETPLACE: BUY AND SELL WITH OTHER LLAMAS</button></div>';
    if (C==='kits'){ h+='<div class="wdh">🎁 ROOM KITS</div><div class="fre">A whole themed set in one go, for 20% less than buying the pieces one by one. Everything goes into 🎒 INVENTORY > ITEMS.</div><div class="wdg kits">'+Object.keys(KITS).map(k=>{ const K=KITS[k], list=Object.entries(K.items);
      return `<div class="wi fi kit"><canvas width="190" height="40" data-kit="${k}"></canvas><b>${esc(K.n)}</b><small class="kl">${list.map(([it,n])=>(n>1?n+' × ':'')+esc((FURN_DEF[it]||{n:it}).n)).join(' · ')}</small><small>${kitPrice(k)} 🪙 <s>${kitFull(k)}</s> · <span class="own">SAVE ${kitFull(k)-kitPrice(k)}</span></small><button class="gbbtn y" data-buykit="${k}">BUY KIT</button></div>`; }).join('')+'</div>'; }
    for (const [cat,label] of FURN_CATS){ if ((cat==='staff' && !me.st) || cat==='rares' || !catOk(cat)) continue; const ORD=Object.keys(FURN_DEF), ks=ORD.filter(k=>FURN_DEF[k].cat===cat).sort((p,q)=>ORD.indexOf(furnBase(p))-ORD.indexOf(furnBase(q))); if (!ks.length) continue;   /* colours sit right after their base piece */ h+=`<div class="wdh">${label}</div><div class="wdg">`;
    h+=ks.map(k=>`<div class="wi fi${dragIn?' drag':''}" data-f="${k}"><canvas width="80" height="80" data-fk="${k}"></canvas><b>${esc(FURN_DEF[k].n)}</b><small class="pr">${FURN_DEF[k].p} 🪙</small>${own(k)?`<small class="own">YOU HAVE ${own(k)}</small>`:''}<button class="gbbtn y" data-buyf="${k}">BUY</button></div>`).join('')+'</div>'; }
    const dcard=(kind,k,T)=>{ if (!T.p) return ''; const n=own((kind==='w'?'wp_':'fl_')+k); return `<div class="wi fi"><canvas width="88" height="88" data-dsw="${kind}:${k}"></canvas><b>${esc(T.n)}</b><small class="pr">${T.p} 🪙</small>${n?`<small class="own">YOU HAVE ${n}</small>`:''}<button class="gbbtn y" data-buyd="${kind}:${k}">BUY</button></div>`; };
    if (C==='deco'){ h+='<div class="wdh">🎨 WALLPAPER</div><div class="fre">Wallpaper and floors go into 🎒 INVENTORY > ITEMS. Put one up from there (or 🏠 ROOMS > SETTINGS); the one it replaces goes back in your bag, so you can keep it or trade it.</div><div class="wdg">'+Object.entries(DECO_WALL).map(([k,T])=>dcard('w',k,T)).join('')+'</div>';
    h+='<div class="wdh">🎨 FLOORS</div><div class="wdg">'+Object.entries(DECO_FLOOR).map(([k,T])=>dcard('f',k,T)).join('')+'</div>'; } }
  else if (WD.tab==='shop'){ for (const s2 of WEAR_SLOTS){ h+=`<div class="wdh">${SLOT_NAMES[s2]}</div><div class="wdg">`+Object.keys(ITEMS).filter(k=>ITEMS[k].s===s2 && !ITEMS[k].hide).map(wdCard).join('')+'</div>'; }
    if (curRoom!=='store') h='<div class="fre">Browse and try things on here. To buy clothes, visit the 🛍️ LLAMA STORE.</div>'+h;
    h+='<div class="srow"><button class="gbbtn" id="wd_toinv">🎒 MY INVENTORY</button></div>'; }
  else if (WD.tab==='storage'){ const list=WD.furn.filter(x=>FURN_DEF[x.item]&&x.n>0), inMine=isP(curRoom) && PRD[curRoom] && PRD[curRoom].mine, decos=WD.furn.filter(x=>decoOf(x.item)&&x.n>0);
    const decoH = decos.length ? '<div class="wdh">🎨 WALLPAPER & FLOORS</div><div class="wdg">'+decos.map(x=>`<div class="wi fi"><canvas width="80" height="80" data-fk="${x.item}"></canvas><b>${esc(itemName(x.item))}</b><small class="own">${x.n} IN YOUR BAG</small><button class="gbbtn y" data-putup="${x.item}">PUT UP</button></div>`).join('')+'</div>' : '';
    if (!list.length && decos.length) h=decoH; else if (!list.length) h=emptyBox('NO ITEMS YET', 'Tap SHOP at the bottom to buy furniture, then place it in your room.');
    else { const card=x=>{ const left=x.n-x.placed; return `<div class="wi fi${inMine&&left>0?' drag':''}" data-pf="${x.item}"><canvas width="80" height="80" data-fk="${x.item}"></canvas><b>${esc(FURN_DEF[x.item].n)}</b><small class="own">${left} LEFT${x.placed?` · ${x.placed} PLACED`:''}</small>${inMine?`<button class="gbbtn y" data-placef="${x.item}" ${left<=0?'disabled':''}>PLACE</button>`:''}</div>`; };
      h=`<div class="fre">${inMine ? 'Drag a picture into your room, or tap PLACE. Only you can place furniture, and only in your own room.' : 'Furniture you own. You can place it in your own room.'}</div>`;
      for (const [cat,label] of [...FURN_CATS,[null,'📦 OTHER']]){ const ls=list.filter(x=>(FURN_DEF[x.item].cat||null)===cat); if (ls.length) h+=`<div class="wdh">${label}</div><div class="wdg">${ls.map(card).join('')}</div>`; }
      h+=decoH;
      h+=`<div class="srow"><button class="gbbtn y" id="wd_place">${inMine?'🛋️ ARRANGE MY ROOM':'🏠 GO TO MY ROOM'}</button></div>`; } }
  else { const mine=INV.owned.filter(k=>ITEMS[k]);
    if (!mine.length) h=emptyBox('NO CLOTHES YET', 'Buy some at the 🛍️ LLAMA STORE, then wear them anywhere.');
    h+='<div class="srow"><button class="gbbtn" id="wd_toshop">🛍️ BROWSE THE STORE</button></div>';
    /* what you have on right now comes first, then everything else by slot */
    const worn=WEAR_SLOTS.map(s2=>me.w && me.w[s2]).filter(k=>k && mine.includes(k));
    if (worn.length) h+=`<div class="wdh">👕 WEARING NOW</div><div class="wdg">`+worn.map(wdCard).join('')+'</div>';
    for (const s2 of WEAR_SLOTS){ const list=mine.filter(k=>ITEMS[k].s===s2 && !worn.includes(k)); if (list.length) h+=`<div class="wdh">${SLOT_NAMES[s2]}</div><div class="wdg">`+list.map(wdCard).join('')+'</div>'; } }
  const body=$id('wd_body'); body.innerHTML=h;
  { const ti=$id('wd_toinv'); if (ti) ti.onclick=()=>{ WD.tab='clothing'; WD.pick=null; wdDraw(); }; const ts=$id('wd_toshop'); if (ts) ts.onclick=()=>{ WD.tab='shop'; WD.pick=null; wdDraw(); }; }
  for (const cv of body.querySelectorAll('canvas[data-fk]')){ const ic=furnIcon(cv.dataset.fk,88); cv.width=ic.width; cv.height=ic.height; cv.getContext('2d').drawImage(ic,0,0); }
  for (const cv of body.querySelectorAll('canvas[data-kit]')){ const R2=Math.max(1,Math.min(3,Math.round(window.devicePixelRatio||1))), its=Object.keys(KITS[cv.dataset.kit].items).slice(0,4), IC=40, GAP=10, W=its.length*IC+(its.length-1)*GAP;   // each piece in its own spot, evenly spaced
    cv.width=W*R2; cv.height=IC*R2; cv.style.width=W+'px'; cv.style.height=IC+'px'; const m=cv.getContext('2d');
    its.forEach((it,i)=>{ const ic=furnIcon(it,IC); m.drawImage(ic, 0,0,ic.width,ic.height, i*(IC+GAP)*R2, 0, IC*R2, IC*R2); }); }
  for (const cv of body.querySelectorAll('canvas[data-dsw]')){ const [kind,id]=cv.dataset.dsw.split(':'), m=cv.getContext('2d'); m.imageSmoothingEnabled=false; m.drawImage(decoSwatch(kind,id,40,40),4,4,80,80); m.strokeStyle=INK; m.lineWidth=2; m.strokeRect(5,5,78,78); }
  { const kk=$id('wd_kind'); if (kk) for (const b of kk.children) b.onclick=()=>{ WD.kind=b.dataset.k; WD.pick=null; wdMsg(''); wdDraw(); }; }
  { const mk=$id('wd_market'); if (mk) mk.onclick=()=>openMarket(); }
  { const pl=$id('wd_place'); if (pl) pl.onclick=()=>{ if (isP(curRoom) && PRD[curRoom] && PRD[curRoom].mine){ closeAll(); prEditStart(); } else { closeAll(); NET.act('pr_list').then(r=>{ if (r.ok && r.mine){ PRED.pending=true; prGo(r.mine.id); } else openRooms(); }); } }; }
  for (const cv of body.querySelectorAll('canvas[data-ic]')){ const id=cv.dataset.ic, ic=ITEMS[id].s==='shirt'?teeIcon(id):itemIcon(id), x=cv.getContext('2d'); x.imageSmoothingEnabled=false; x.drawImage(ic, Math.floor((20-ic.width)/2), Math.floor((16-ic.height)/2)); }
  wdPreview(); wdInfo(); sheetHead($id('wardbox'));
}
$id('wd_body').addEventListener('click', e=>{
  const pu=e.target.closest('[data-putup]'); if (pu){ const d=decoOf(pu.dataset.putup); if (!d) return; pu.disabled=true; wdMsg('PUTTING IT UP...');
    NET.act('pr_set', {...(d.kind==='w'?{wall:d.id}:{floor:d.id}), rid:(isP(curRoom)&&PRD[curRoom]&&PRD[curRoom].mine)?+curRoom.slice(2):0}).then(r=>{ if (!r.ok){ pu.disabled=false; return wdMsg(r.msg||'That did not work.'); } DECO_OWN=r.deco||DECO_OWN; prApplyRoom(r.room); if (PRUI.info) PRUI.info.room=r.room;
      wdMsg(`${itemName(pu.dataset.putup)} is up in your room! The old one went back in your bag.`, true); wdFurnLoad(); }); return; }
  const sc=e.target.closest('[data-scat]'); if (sc){ WD.cat=sc.dataset.scat; store.shopCat=WD.cat; saveStore(); wdDraw(); $id('wd_body').scrollTop=0; return; }   // shop category tabs (remembered)
  const bk=e.target.closest('[data-buykit]'); if (bk){ const k=bk.dataset.buykit; if (!confirm(`Buy the ${KITS[k].n} kit for ${kitPrice(k)} TOKENS?`)) return; bk.disabled=true; wdMsg('BUYING...');
    NET.act('kit_buy',{kit:k}).then(r=>{ bk.disabled=false; if (Number.isFinite(r.tk)) tkSet(r.tk); if (!r.ok) return wdMsg(r.msg||'That did not work.'); WD.furn=r.furn||WD.furn; localMsg(`🎁 ${r.msg} It's all in your 🎒 ITEMS.`); wdMsg(`${r.msg} It's all in your 🎒 ITEMS.`, true); wdDraw(); }); return; }
  const bd=e.target.closest('[data-buyd]'); if (bd){ const k=bd.dataset.buyd, [kind,id]=k.split(':'), T=(kind==='w'?DECO_WALL:DECO_FLOOR)[id]; wdMsg('BUYING...'); NET.act('deco_buy',{k}).then(r=>{ if (!r.ok) return wdMsg(r.msg||'That did not work.'); DECO_OWN=r.deco||DECO_OWN; if (r.furn) WD.furn=r.furn; tkSet(r.tk, `You bought ${T.n}! It's in your 🎒 ITEMS.`); wdMsg(`Bought ${T.n}! Put it up from 🎒 ITEMS.`, true); wdDraw(); }); return; }
  const br=e.target.closest('[data-buyr]'); if (br){ const k=br.dataset.buyr; br.disabled=true; wdMsg('BUYING...'); NET.act('rare_buy',{item:k}).then(r=>{ if (Number.isFinite(r.tk)) tkSet(r.tk); if (!r.ok){ wdMsg(r.msg||'That did not work.'); br.disabled=false; return; }
    WD.rares=r.rares; WD.furn=r.furn; localMsg(`⭐ ${r.msg} It's in your 🎒 ITEMS.`); wdMsg(r.msg); wdDraw(); }); return; }
  const bf=e.target.closest('[data-buyf]'); if (bf){ const k=bf.dataset.buyf; wdMsg('BUYING...'); NET.act('furn_buy',{item:k}).then(r=>{ if (!r.ok) return wdMsg(r.msg||'That did not work.'); WD.furn=r.furn; tkSet(r.tk, `You bought a ${FURN_DEF[k].n}! It's in your items.`); wdMsg(`Bought a ${FURN_DEF[k].n}! It's in your 🎒 ITEMS.`, true); wdDraw(); }); return; }
  const c=e.target.closest('.wi'); if (c && c.classList.contains('fi') && !e.target.closest('button')){ const k=c.dataset.f||c.dataset.pf; if (k && FURN_DEF[k]){ ensureAudio(); openItem(k); } return; }
  if (!c || c.classList.contains('fi')) return; ensureAudio(); WD.pick = WD.pick===c.dataset.id ? null : c.dataset.id; wdMsg(''); wdDraw(); });
for (const b of $id('wd_tabs').children) b.addEventListener('click', ()=>{ WD.tab=b.dataset.t; store.wdTab=WD.tab; saveStore(); wdDraw(); });
const bagTab=()=> store.wdTab==='storage' ? 'storage' : 'clothing';   // the bag opens on the tab you had last
$id('wd_prev').addEventListener('click', ()=>{ WD.dir=(WD.dir+1)%4; wdPreview(); });
// inventory ITEMS: PLACE picks the piece in edit mode; pressing a card and pulling it out of the sheet starts a drag into the room
function prCanMove(){ return prInMine() || (isP(curRoom) && !!me.st); }   // staff can move pieces in any player room (the server re-checks and logs it)
const HOLD_MS=2500;   // hold a piece this long to pick it up and move it
function holdRing(on, x, y){ const el=$id('holdring'); if (!on){ el.classList.remove('on'); return; } el.style.left=x+'px'; el.style.top=y+'px'; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); }
function prInMine(){ return isP(curRoom) && PRD[curRoom] && PRD[curRoom].mine; }
function prTakeOut(item){ if (!prInMine()) return; closeAll(); if (!PRED.on) prEditStart(); PRED.item=item; PRED.piece=null; prEditBar(); localMsg(`Tap or drag on the floor to place your ${FURN_DEF[item].n}. Press DONE when you're finished.`); }
$id('wardbox').addEventListener('click', e=>{ const b=e.target.closest('[data-placef]'); if (!b || b.disabled) return; e.stopPropagation(); ensureAudio(); prTakeOut(b.dataset.placef); });
$id('wardbox').addEventListener('pointerdown', e=>{ const c=e.target.closest('.wi.drag[data-pf], .wi.drag[data-f]'); if (!c || e.target.closest('button') || !prInMine()) return;
  if (e.pointerType!=='mouse' && e.target.tagName!=='CANVAS') return;   // on touch, grab the picture; swiping elsewhere scrolls the list
  e.preventDefault(); try{ e.target.setPointerCapture && e.target.releasePointerCapture(e.pointerId); }catch(_){}
  const item=c.dataset.pf || c.dataset.f, buy=!c.dataset.pf; const sx=e.clientX, sy=e.clientY, id=e.pointerId;
  const mv=ev=>{ if (ev.pointerId!==id) return; const box=$id('wardbox').getBoundingClientRect(); const out = ev.clientX<box.left || ev.clientX>box.right || ev.clientY<box.top || ev.clientY>box.bottom;
    if (out || Math.hypot(ev.clientX-sx, ev.clientY-sy)>12){ off(); closeAll(); if (!PRED.on) prEditStart(); PRED.item=null; PRED.piece=null; prEditBar();
      prDragStart(ev, {item, rot:0, ox:0, oy:0, buy}); PDR.on=true; prDragAim(ev); } };
  const up=ev=>{ if (ev.pointerId===id) off(); }; const off=()=>{ removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); };
  addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up); });
function openWardrobe(tab, pick, kind){ closeAll(); WD.tab = tab==='closet' ? 'clothing' : (tab||'clothing'); WD.kind = kind || 'clothes'; wdFurnLoad(); WD.pick=pick||null; WD.dir=0; wdMsg(''); $id('wardbox').style.display='block'; wdDraw(); wdLoad(); }
function wdBuy(id){ wdMsg('BUYING...'); NET.act('inv_buy',{item:id}).then(r=>{ if (!r.ok) return wdMsg(r.msg||'That did not work.');
  INV.owned=r.owned||INV.owned; tkSet(r.tk, `You bought the ${ITEMS[id].n}!`); wdWear(ITEMS[id].s, id, `Bought the ${ITEMS[id].n} and put it on!`); }); }
function wdWear(slot, id, msg){ NET.act('inv_wear',{slot, item:id}).then(r=>{ if (!r.ok) return wdMsg(r.msg||'That did not work.'); me.w=cleanWear(r.w); sendPresence(true); wdMsg(msg || (id ? `You put on the ${ITEMS[id].n}.` : 'Taken off.'), true); wdDraw(); }); }
$id('cat_clothes').addEventListener('click', ()=>openWardrobe('shop'));
$id('cat_furn').addEventListener('click', ()=>openWardrobe('shop', null, 'furn'));
$id('afk_here').addEventListener('click', e=>{ e.stopPropagation(); afkHere(); });
$id('afk_back').addEventListener('click', ()=>location.reload());
$id('invbtn').addEventListener('click', ()=>{ ensureAudio(); openWardrobe(bagTab()); });
$id('roomsbtn').addEventListener('click', ()=>{ ensureAudio(); if (joined) openRooms(); });
// ---- GUIDED FIRST VISIT: GUS stands next to you and walks you through the game, one card at a time ----
const TOUR_STEPS=[
  {t:'HI, I\'M GUS!', p:'Welcome to the Llama Lounge! I\'ll show you around. Tap anywhere on the floor and your llama walks there.', el:null},
  {t:'FOOD AND DRINKS', p:'Your llama gets hungry and thirsty. These bars show how full it is. Tap a cup on the bar to order a drink. Snacks are in LLAMA ACRES and the LLAMA STORE.', el:'#status'},
  {t:'SAY HI', p:'Type here and press enter to talk. Everyone in the room sees it in a bubble over your llama. Tap the smiley button next to it to wave, flex, laugh and more.', el:'#chatrow'},
  {t:'JOBS AND TOKENS', p:'TOKENS buy clothes, furniture and more. Earn them from jobs, games and your daily reward. JOBS shows what you can do in this room.', el:'#jobsbtn'},
  {t:'ROOMS', p:'Tap ROOMS to go anywhere. The MAP tab takes you to the CASINO, SPIT ARENA, LANES, ACRES and the STORE. The PLAYER ROOMS tab is where you make your own room and visit other llamas.', el:'#roomsbtn'},
  {t:'SHOP', p:'Furniture, wallpaper, floors and whole ROOM KITS. Everything you buy goes into your bag, ready for your room.', el:'#shopbtn'},
  {t:'YOUR BAG', p:'Your clothes, furniture, wallpaper and floors live here. Buy clothes at the LLAMA STORE, or trade with other llamas.', el:'#invbtn'},
  {t:'FRIENDS', p:'Tap another llama to see their card. You can add them as a friend or trade. If someone is being mean, BLOCK or REPORT them from there. Friends can send you messages.', el:'#frbtn'},
  {t:'THE MENU', p:'The MARKETPLACE, your ACCOUNT, rules, REPORT A BUG and more. Want me again? Pick ASK GUS FOR A TOUR here, or type /tour in chat. Have fun!', el:'#menubtn'}];
const TOUR={on:false, i:0, raf:0};
function tourWanted(){ return !store.toured && acct && acct.since && Date.now()-acct.since < 3*864e5; }
function tourStart(){ if (!joined) return; closeAll(); TOUR.on=true; TOUR.i=0; document.body.classList.add('touring'); $id('tour_pic').innerHTML=llamaPic('gus', {hat:'cap'}, 60); tourGuide(true); tourShow(); tourTrack(); }
function tourEnd(){ TOUR.on=false; document.body.classList.remove('touring'); $id('tourring').classList.remove('on'); cancelAnimationFrame(TOUR.raf); tourGuide(false); store.toured=1; saveStore();
  if (dailyLater){ dailyLater=false; setTimeout(()=>{ if (!uiOpen()) dailyPop(); }, 600); } }
function tourShow(){ const S=TOUR_STEPS[TOUR.i]; $id('tour_t').textContent=S.t; $id('tour_p').textContent=S.p; $id('tour_n').textContent=`${TOUR.i+1} / ${TOUR_STEPS.length}`;
  $id('tour_back').style.visibility = TOUR.i ? '' : 'hidden'; $id('tour_next').textContent = TOUR.i===TOUR_STEPS.length-1 ? 'DONE!' : 'NEXT'; $id('tour_skip').style.display = TOUR.i===TOUR_STEPS.length-1 ? 'none' : '';
  // keep the card out of the way of the thing it points at
  const tb=$id('tourbox'), el=S.el && document.querySelector(S.el), r=el && el.getBoundingClientRect(); tb.style.top = (r && r.top < 200) ? 'auto' : ''; tb.style.bottom = (r && r.top < 200) ? 'calc(var(--dockh,90px) + 110px)' : ''; }
function tourTrack(){ cancelAnimationFrame(TOUR.raf); const ring=$id('tourring');
  const step=()=>{ if (!TOUR.on) return; { const busy=!!document.querySelector('.gb.sheet[style*="display: block"], .gb.sheet[style*="display: flex"]'); $id('tourbox').style.visibility=busy?'hidden':''; ring.style.visibility=busy?'hidden':''; }   /* step aside while a pop-up is open */
    const S=TOUR_STEPS[TOUR.i], el=S.el && document.querySelector(S.el), r=el && el.offsetParent!==null ? el.getBoundingClientRect() : null;
    if (r && r.width){ ring.classList.add('on'); ring.style.left=(r.left-8)+'px'; ring.style.top=(r.top-8)+'px'; ring.style.width=(r.width+16)+'px'; ring.style.height=(r.height+16)+'px'; } else ring.classList.remove('on');
    TOUR.raf=requestAnimationFrame(step); }; step(); }
// GUS himself: a llama standing beside you in the room (only on your screen)
function tourGuide(on){ for (let i=FURN.length-1;i>=0;i--) if (FURN[i].t==='guide') FURN.splice(i,1); if (!on) return;
  const spot=[[1,0],[0,1],[-1,0],[0,-1],[1,1]].map(([dx,dy])=>[me.gx+dx,me.gy+dy]).find(([x,y])=>x>=0&&y>=0&&x<N&&y<NY&&walkable(x,y)) || [me.gx,me.gy];
  FURN.push({t:'guide', gx:spot[0], gy:spot[1]}); }
$id('tour_next').addEventListener('click', ()=>{ ensureAudio(); if (TOUR.i>=TOUR_STEPS.length-1) return tourEnd(); TOUR.i++; tourShow(); });
$id('tour_back').addEventListener('click', ()=>{ if (TOUR.i>0){ TOUR.i--; tourShow(); } });
$id('tour_skip').addEventListener('click', ()=>tourEnd());
// ---- MARKETPLACE: everything is checked and done by the server; this just shows the listings ----
const MK={tab:(['buy','sell','mine'].includes(store.mkTab)?store.mkTab:'buy'), list:null, fee:0.05, max:10, q:'', sort:'cheap', have:null, rares:null};
const mkName = (it, serial) => (serial ? '⭐ ' : '') + itemName(it) + (serial ? ` #${serial}` : '');
function mkMsg(t, good){ const m=$id('mk_msg'); m.textContent=t||''; m.className='prmsg'+(good?' good':''); }
function openMarket(){ closeAll(); $id('mktbox').style.display='block'; mkMsg(''); mkDraw(); mkLoad(); }
function mkLoad(){ NET.act('mkt_list').then(r=>{ if (r.ok){ MK.list=r.list; MK.fee=r.fee; MK.max=r.max; mkDraw(); } }); NET.act('furn_info').then(r=>{ if (r.ok){ MK.have=r.furn; MK.rares=r.rares; WD.furn=r.furn; if (MK.tab==='sell') mkDraw(); } }); }
function mkGot(r){ if (r.list){ MK.list=r.list; } if (r.furn){ MK.have=r.furn; WD.furn=r.furn; } if (r.rares) MK.rares=r.rares; if (Number.isFinite(r.tk)) tkSet(r.tk); }
function mkDraw(){ const B=$id('mk_body'); for (const t of $id('mk_tabs').children) t.classList.toggle('on', t.dataset.t===MK.tab); sheetHead($id('mktbox'));
  const focus=document.activeElement && document.activeElement.id==='mk_q'; let h='';
  if (MK.tab==='buy'){ h+=`<div class="mktop"><input id="mk_q" type="search" placeholder="Search for an item" value="${esc(MK.q)}" autocapitalize="off" spellcheck="false"><select id="mk_sort"><option value="cheap" ${MK.sort==='cheap'?'selected':''}>CHEAPEST</option><option value="new" ${MK.sort==='new'?'selected':''}>NEWEST</option></select></div>`;
    if (!MK.list) h+='<div class="fre">Loading...</div>'; else { const q=MK.q.trim().toLowerCase(); let L=MK.list.filter(x=>!q || mkName(x.item,x.serial).toLowerCase().includes(q) || x.seller.toLowerCase().includes(q));
      L = MK.sort==='cheap' ? L.slice().sort((a,b)=>a.price-b.price||b.id-a.id) : L;
      if (!L.length) h+=emptyBox(q?'NOTHING MATCHES':'NOTHING FOR SALE YET', q?'Try a different search.':'Be the first: open SELL and put something up.');
      for (const x of L.slice(0,120)) h+=`<div class="mkr"><canvas data-fk="${x.item}"></canvas><span class="mkn"><b>${esc(mkName(x.item,x.serial))}</b><small>sold by ${esc(x.seller)}</small></span><span class="mkp">${x.price} 🪙</span>${x.mine?'<button class="gbbtn" disabled>YOURS</button>':`<button class="gbbtn y" data-mbuy="${x.id}" data-p="${x.price}">BUY</button>`}</div>`; } }
  else if (MK.tab==='sell'){ h+=`<div class="fre">Pick a price and tap SELL. It waits in the market until someone buys it (you can take it back any time). You get the price minus ${Math.round(MK.fee*100)}%, even if you're offline. Only things in your bag can be sold, not pieces placed in your room.</div>`;
    if (!MK.have) h+='<div class="fre">Loading...</div>'; else { const rareItems=new Set(((MK.rares&&MK.rares.mine)||[]).map(r=>r.item));
      const rows=MK.have.filter(x=>(FURN_DEF[x.item]||decoOf(x.item)) && !(FURN_DEF[x.item]&&FURN_DEF[x.item].rare) && FURN_DEF[x.item]?.cat!=='staff' && x.n-(x.placed||0)>0);
      const low=it=>{ const c=(MK.list||[]).filter(l=>l.item===it&&!l.serial).map(l=>l.price); return c.length?Math.min(...c):null; };
      if (!rows.length && !rareItems.size) h+=emptyBox('NOTHING TO SELL', 'Buy furniture, wallpaper or floors in the SHOP, then sell what you don\'t need here.');
      for (const x of rows){ const lw=low(x.item); h+=`<div class="mkr"><canvas data-fk="${x.item}"></canvas><span class="mkn"><b>${esc(itemName(x.item))}</b><small>${x.n-(x.placed||0)} in your bag${lw?` · cheapest now ${lw}`:''}</small></span><input type="number" min="1" max="100000" inputmode="numeric" placeholder="PRICE" data-mp="${x.item}"><button class="gbbtn y" data-msell="${x.item}">SELL</button></div>`; }
      for (const r of ((MK.rares&&MK.rares.mine)||[])){ h+=`<div class="mkr"><canvas data-fk="${r.item}"></canvas><span class="mkn"><b>${esc(mkName(r.item,r.serial))}</b><small>limited rare · pick it up from your room first if it's placed</small></span><input type="number" min="1" max="100000" inputmode="numeric" placeholder="PRICE" data-mpr="${r.id}"><button class="gbbtn y" data-msellr="${r.id}">SELL</button></div>`; } } }
  else { const mine=(MK.list||[]).filter(x=>x.mine); h+=`<div class="fre">${mine.length} of ${MK.max} spots used. Taking something back puts it straight back in your bag.</div>`;
    if (!MK.list) h+='<div class="fre">Loading...</div>'; else if (!mine.length) h+=emptyBox('NOTHING LISTED', 'Open SELL to put something up for sale.');
    for (const x of mine) h+=`<div class="mkr"><canvas data-fk="${x.item}"></canvas><span class="mkn"><b>${esc(mkName(x.item,x.serial))}</b><small>listed ${new Date(x.t).toLocaleDateString([], {month:'short',day:'numeric'})}</small></span><span class="mkp">${x.price} 🪙</span><button class="gbbtn" data-mback="${x.id}">TAKE BACK</button></div>`; }
  B.innerHTML=h;
  for (const cv of B.querySelectorAll('canvas[data-fk]')){ const ic=furnIcon(cv.dataset.fk,44); cv.width=ic.width; cv.height=ic.height; cv.getContext('2d').drawImage(ic,0,0); }
  const q=$id('mk_q'); if (q){ if (focus){ q.focus(); q.setSelectionRange(q.value.length,q.value.length); } q.addEventListener('input', ()=>{ MK.q=q.value; mkDraw(); }); }
  const so=$id('mk_sort'); if (so) so.addEventListener('change', ()=>{ MK.sort=so.value; mkDraw(); }); }
for (const t of $id('mk_tabs').children) t.addEventListener('click', ()=>{ ensureAudio(); MK.tab=t.dataset.t; store.mkTab=MK.tab; saveStore(); mkMsg(''); mkDraw(); });
$id('mk_body').addEventListener('click', e=>{ const b=e.target.closest('button'); if (!b || b.disabled) return; ensureAudio();
  if (b.dataset.mbuy){ const x=(MK.list||[]).find(l=>l.id===+b.dataset.mbuy); if (!x) return; if (!confirm(`Buy ${mkName(x.item,x.serial)} from ${x.seller} for ${x.price} TOKENS?`)) return; b.disabled=true; mkMsg('BUYING...');
    NET.act('mkt_buy',{lid:x.id, price:x.price}).then(r=>{ mkGot(r); mkMsg(r.msg||(r.ok?'':'That did not work.'), r.ok); if (r.ok) localMsg(`🏪 You bought ${mkName(x.item,x.serial)}! It's in your 🎒 ITEMS.`); else mkLoad(); mkDraw(); }); return; }
  if (b.dataset.msell || b.dataset.msellr){ const inp=b.dataset.msell ? B_inp(`[data-mp="${b.dataset.msell}"]`) : B_inp(`[data-mpr="${b.dataset.msellr}"]`), price=Math.floor(+inp.value||0);
    if (!(price>=1)){ mkMsg('Type a price first.'); inp.focus(); return; } const nm=b.dataset.msell ? itemName(b.dataset.msell) : 'this rare', you=price-Math.floor(price*MK.fee);
    if (!confirm(`Sell ${nm} for ${price} TOKENS? You'll get ${you} when it sells.`)) return; b.disabled=true; mkMsg('LISTING...');
    NET.act('mkt_sell', b.dataset.msell ? {item:b.dataset.msell, price} : {rare:+b.dataset.msellr, price}).then(r=>{ mkGot(r); mkMsg(r.msg||(r.ok?'':'That did not work.'), r.ok); mkDraw(); }); return; }
  if (b.dataset.mback){ b.disabled=true; NET.act('mkt_back',{lid:+b.dataset.mback}).then(r=>{ mkGot(r); mkMsg(r.msg||(r.ok?'':'That did not work.'), r.ok); mkDraw(); }); return; } });
const B_inp = sel => $id('mk_body').querySelector(sel);
NET.handlers.mkt_sold = m => { tkSet(m.tk, `🏪 SOLD! ${m.to} bought your ${itemName(m.item)} for ${m.price}. You got ${m.got} TOKENS.`); if ($id('mktbox').style.display==='block') mkLoad(); };
$id('wf_ok').addEventListener('click', ()=>{ $id('wfbox').style.display='none'; });
$id('bug_send').addEventListener('click', ()=>{ const t=$id('bug_text').value.trim(), m=$id('bug_msg'); if (t.length<5){ m.className='prmsg'; m.textContent='Tell us a little more first.'; return; }
  const b=$id('bug_send'); b.disabled=true; m.className='prmsg'; m.textContent='SENDING...';
  NET.act('bug_report',{text:t, room:curRoom, ver:GAME_VERSION, ua:navigator.userAgent.slice(0,160), scr:`${innerWidth}x${innerHeight}`}).then(r=>{ b.disabled=false;
    if (!r.ok){ m.textContent=r.msg||'Could not send that. Try again.'; return; } $id('bug_text').value=''; m.className='prmsg good'; m.textContent='Thanks! Your report was sent.'; }); });
for (const t of $id('pr_tabs').children) t.addEventListener('click', ()=>{ ensureAudio(); PRUI.view=t.dataset.v; prDraw(); if (t.dataset.v==='list') prRefresh(); });
$id('mapbtn').addEventListener('click', ()=>{ ensureAudio(); if (joined) showRoomPick(false); });
$id('shopbtn').addEventListener('click', ()=>{ ensureAudio(); if (joined) openWardrobe('shop', null, 'furn'); });


// ======================= ITEM DETAIL CARD (tap any furniture in the shop or your items) =======================
const FURN_DESC={ vending:'Keeps the hay soda ice cold. Every good hangout needs one.', snackvend:'Crunchy, sweet snacks for when the munchies hit.',
  chair:'A sturdy wooden chair. Llamas sit, chairs hold. Simple.', armchair:'Deep, squishy and perfect for judging everyone\'s outfits.',
  bed:'Soft sheets and a fluffy pillow. Climb in and catch some Z\'s.', dbed:'Room for two llamas and all of their drama.',
  bookshelf:'Full of books nobody has read. Makes you look smart.', tv:'Plays llama reality shows all day long.', bigtv:'Bigger screen, bigger drama. Movie night at your place.',
  loveseat:'A cozy two seater for you and your favorite llama.', sofa:'Three seats of pure comfort. Bring the whole herd.', plant:'A big leafy friend that never talks back.',
  adminsign:'Lets everyone know who keeps the lounge running.', table:'A little table with a flickering candle. Very fancy.', lamp:'A side table with a warm, glowing lamp.',
  beanbag:'Flop down and sink in. Getting back up is the hard part.', barstool:'Tall, spinny and great for posing.', coffeetable:'Holds snacks, drinks and the remote you can never find.',
  roundtable:'Gather round for games, gossip and snacks.', floorlamp:'Tall lamp, warm light, instant cozy.', lavalamp:'Groovy blobs that float up and down forever.',
  cubeshelf:'Cubbies for all your stuff. Neat freaks love it.', dresser:'Drawers for hats, shades and bandanas.', cactus:'Low care, high style. Please do not hug.',
  flowers:'A pot of bright flowers to cheer up any corner.', boombox:'Old school beats. Turn it up!', statue:'A sparkling crystal llama. Only 50 were ever made.',
  throne:'A solid gold seat fit for llama royalty. Only 25 were ever made.', rug_persian:'A fancy patterned rug that ties the whole room together.',
  rug_round:'A braided round rug, soft under your hooves.', rug_stripe:'A long striped runner for halls and walkways.', rug_shag:'Super fluffy. Your hooves will thank you.', rug_mat_green:'A bristly welcome mat. Wipe your hooves!', rug_mat_red:'A bristly welcome mat. Wipe your hooves!', rug_mat_blue:'A bristly welcome mat. Wipe your hooves!', rug_mat_coir:'A bristly welcome mat. Wipe your hooves!', rug_mat_pink:'A bristly welcome mat. Wipe your hooves!', rug_mat_purple:'A bristly welcome mat. Wipe your hooves!' };
const WEAR_DESC={ cap:'A bright pink cap for sunny days and bad hair days.', cowboy:'Yeehaw! For llamas who ride the range.', beanie:'Warm, cozy and a little bit artsy.',
  party:'Every day is a party when you wear this.', tophat:'Very fancy. Monocle not included.', flowers:'A crown of fresh flowers. Instant spring.',
  shades:'Too cool for school.', hearts:'See the world through love-colored glasses.', stars:'For llamas who were born to be famous.',
  bandana:'A classic red bandana with outlaw style.', bowtie:'Dapper and ready for a night out.', scarf:'Toasty and stylish when the wind picks up.', lei:'Aloha! Fresh flowers from the islands.',
  tee_smile:'Spread good vibes wherever you walk.', tee_cancelled:'A La Llama P.I.C. classic.', tee_wild:'A La Llama P.I.C. classic.', tee_cancel:'A La Llama P.I.C. classic.',
  tee_woke:'A La Llama P.I.C. classic.', tee_lounge:'Show some love for the Llama Lounge.', tee_acres:'Straight from the farm at LLAMA ACRES.', tee_arena:'Rep the Spit Arena.',
  poncho:'A woven poncho. The most llama thing you can wear.', poncho_orange:'The classic poncho in a bold orange.', gloves:'Float like a butterfly, spit like a llama.', shorts:'Ready for the ring.' };
const ITD={k:null, rot:0}; let ISTAT=null, ISTAT_T=0, ISTAT_P=null;
function itemStats(){ if (ISTAT && Date.now()-ISTAT_T<60000) return Promise.resolve(ISTAT); if (ISTAT_P) return ISTAT_P;
  ISTAT_P=NET.act('item_stats').then(r=>{ ISTAT_P=null; if (r && r.ok){ ISTAT=r; ISTAT_T=Date.now(); } return ISTAT; }).catch(()=>{ ISTAT_P=null; return ISTAT; }); return ISTAT_P; }
const canTurn = k => { const D=FURN_DEF[k]; return !!D && !D.wall && D.mk.length>0; };
function itMsg(t,good){ const el=$id('it_msg'); el.textContent=t||''; el.classList.toggle('good',!!good); }
function openItem(k){ const D=FURN_DEF[k]; if (!D) return; ITD.k=k; ITD.rot=D.iconRot||0; itMsg(''); itDraw(); const el=$id('itembox'); el.style.display='block'; sheetHead(el); el.scrollTop=0;
  itemStats().then(()=>{ if (ITD.k===k && el.style.display==='block') itDraw(); }); }
function itDraw(){ const k=ITD.k, D=FURN_DEF[k], base=furnBase(k); if (!D) return;
  const cat=FURN_CATS.find(c=>c[0]===D.cat), em=cat ? cat[1].split(' ')[0] : '📦';
  $id('it_title').textContent=`${em} ${D.n}`;
  const tl=furnTiles(k,0,0,0), W=Math.max(...tl.map(t=>t[0]))+1, Dp=Math.max(...tl.map(t=>t[1]))+1;
  const mine=(WD.furn||[]).find(x=>x.item===k), have=mine?mine.n:0, placed=mine?mine.placed||0:0, owners=ISTAT&&ISTAT.furn ? (ISTAT.furn[k]||0) : null;
  const inStore=curRoom==='store', inMine=prInMine();
  let feat='';
  if (D.seat) feat+=`<div class="itf">${pix(base==='bed'||base==='dbed'?'bed':'chair')}<span>${base==='bed'||base==='dbed' ? 'Llamas can climb in and lie down' : D.seatAll ? `Seats ${tl.length} llamas` : 'A llama can sit here'}</span></div>`;
  if (D.wall) feat+=`<div class="itf">${pix('pin')}<span>Hangs on the wall</span></div>`;
  if (D.rug) feat+=`<div class="itf">${pix('yarn')}<span>Lies flat, so you can put things on top</span></div>`;
  if (D.staff) feat+=`<div class="itf">${pix('shield')}<span>Only staff can buy this</span></div>`;
  let rare=''; const RR=WD.rares; if (D.rare && RR && RR.list){ const r=RR.list.find(x=>x.k===k); if (r){ const left=r.max-r.sold, ser=(RR.mine||[]).filter(m=>m.item===k).map(m=>'#'+m.serial);
    rare=`<div class="itrare">${pix('star')}<div><b>LIMITED RARE · ${r.max} EVER MADE</b><small>${left>0?`${left} left in the store`:'Sold out. Trade with other llamas to get one.'}${ser.length?` · Yours: ${ser.join(' ')}`:''}</small></div></div>`; } }
  const stat=(v,l)=>`<div><b>${v}</b><small>${l}</small></div>`;
  let h=`<div class="itv"><canvas id="it_cv"></canvas>${canTurn(k)?`<button type="button" class="gbbtn itrot" id="it_rot" aria-label="Turn it">${pix('arrowr')} TURN</button>`:''}</div>
    <div class="itd">${esc(FURN_DESC[base]||FURN_DESC[k]||'A fine piece for any llama pad.')}</div>${rare}
    <div class="itg">${stat(`${pix('coin')} ${D.p}`,'PRICE')}${stat(D.wall?'WALL':`${W} x ${Dp}`, D.wall?'SPOT':'TILES')}${stat(have,'YOU OWN')}${stat(owners==null?'...':owners, owners===1?'LLAMA OWNS ONE':'LLAMAS OWN ONE')}</div>${feat}`;
  let btn='';
  if (inMine && have-placed>0) btn+=`<button class="gbbtn y" id="it_place">${pix('sofa')} PLACE IN MY ROOM</button>`;
  if (D.staff && !me.st) btn+='';
  else if (D.rare){ const r=RR&&RR.list&&RR.list.find(x=>x.k===k); if (r && r.max-r.sold>0 && r.open<=Date.now()) btn+=`<button class="gbbtn${inMine?'':' y'}" id="it_buy" ${inStore?'':'disabled'}>${inStore?`BUY · ${D.p} ${'🪙'}`:'BUY IT IN THE STORE'}</button>`; }
  else if (D.cat) btn+=`<button class="gbbtn${inMine&&have-placed>0?'':' y'}" id="it_buy">BUY · ${D.p} 🪙</button>`;
  if (btn) h+=`<div class="srow">${btn}</div>`;
  $id('it_body').innerHTML=h;
  const cv=$id('it_cv'), ic=furnIcon(k,168,ITD.rot); cv.width=ic.width; cv.height=ic.height; cv.style.width=cv.style.height='168px'; cv.getContext('2d').drawImage(ic,0,0);
  { const b=$id('it_rot'); if (b) b.onclick=()=>{ ITD.rot=(ITD.rot+1)%4; itDraw(); }; }
  { const b=$id('it_place'); if (b) b.onclick=()=>prTakeOut(k); }
  { const b=$id('it_buy'); if (b) b.onclick=()=>itBuy(k, b); }
  sheetHead($id('itembox')); }
function itBuy(k, b){ const D=FURN_DEF[k]; b.disabled=true; itMsg('BUYING...');
  NET.act(D.rare?'rare_buy':'furn_buy',{item:k}).then(r=>{ if (Number.isFinite(r.tk)) tkSet(r.tk); if (!r.ok){ itMsg(r.msg||'That did not work.'); b.disabled=false; return; }
    WD.furn=r.furn||WD.furn; if (r.rares) WD.rares=r.rares; ISTAT=null; localMsg(`You bought ${D.rare?'the':'a'} ${D.n}! It's in your 🎒 ITEMS.`); itMsg(D.rare ? (r.msg||'Yours!') : `Bought! It's in your 🎒 ITEMS.`, true); wdDraw(); itDraw(); itemStats().then(()=>itDraw()); }); }

// ======================= LLAMA PROFILE CARD (tap another llama) =======================
const PM={n:null, p:null};
// account-age badges: every one you've earned shows on your profile card, newest tier first
const AGE_BADGES=[['bdg_2y',730,'2 YEARS'],['bdg_1y',365,'1 YEAR'],['bdg_6m',182,'6 MONTHS'],['bdg_3m',91,'3 MONTHS'],['bdg_mo',30,'1 MONTH'],['bdg_wk',7,'1 WEEK']];
function ageBadges(since){ if (!since) return ''; const days=(Date.now()-since)/864e5, got=AGE_BADGES.filter(b=>days>=b[1]);
  const list = got.length ? got : [['bdg_new',0,'NEW LLAMA']];
  return `<div class="pmbdg">${list.map((b,i)=>`<span class="bdg${i===0?' top':''}" title="${b[2]}">${pix(b[0])}<small>${b[2]}</small></span>`).join('')}</div>`; }
function pmCard(o){ const P=PM.p&&PM.p.n===o.n.toUpperCase() ? PM.p : null;
  $id('pm_pic').innerHTML=llamaPic(o.c, o.w||{}, 92);
  const since = P&&P.since ? new Date(P.since).toLocaleDateString([], {month:'short', year:'numeric'}).toUpperCase() : '';
  const st = P&&P.st==='owner' ? `<span class="pmst own">${pix('crown')} OWNER</span>` : P&&P.st==='mod' ? `<span class="pmst mod">${pix('crown')} MOD</span>` : '';
  $id('pm_meta').innerHTML = (since?`LLAMA SINCE ${since}`:'LOADING...') + (st?'<br>'+st:'') + (isFriend(o.n)?` <span class="pmst fr">${pix('star')} FRIEND</span>`:'');
  if (!P){ $id('pm_info').innerHTML=''; return; }
  const sc=(ic,v,l)=>`<div>${pix(ic)}<b>${v}</b><small>${l}</small></div>`;
  let h=ageBadges(P.since)+`<div class="pmsc">${sc('joystick',P.hay,'HAY CATCH')}${sc('fire',P.dash,'LLAMA DASH')}${sc('splash',P.arena,'SPIT ARENA')}${sc('bowl',P.bowl,'BOWLING')}</div>`;
  if (P.rares && P.rares.length) h+=`<div class="pmr">${pix('star')}<span>${P.rares.map(r=>`${esc((FURN_DEF[r.item]||{n:r.item}).n)} #${r.serial}`).join(', ')}</span></div>`;
  if (P.room) h+=`<div class="pmroom">${pix('house')}<span><b>${esc(P.room.name)}</b><small>${P.room.priv?`${pix('lock')} PRIVATE`:'OPEN TO ALL'}${P.room.likes?` · ♥ ${P.room.likes}`:''}</small></span><button class="gbbtn y" id="pm_visit">${P.room.priv?'KNOCK':'VISIT'}</button></div>`;
  $id('pm_info').innerHTML=h;
  { const b=$id('pm_visit'); if (b) b.onclick=()=>{ const R2=P.room; closeAll(); if (!R2.priv) prGo(R2.id); else { localMsg('KNOCKING...'); NET.act('pr_knock',{rid:R2.id}).then(r=>{ if (r.open) prGo(R2.id); else if (r.msg) localMsg(r.msg); }); } }; }
}
function pmLoad(o){ const n=o.n.toUpperCase(); if (PM.p && PM.p.n===n && Date.now()-PM.t<30000) return; NET.act('who',{n:o.n}).then(r=>{ if (r.ok && r.p){ PM.p=r.p; PM.t=Date.now(); const cur=others.get(pmTarget); if (cur && cur.n.toUpperCase()===r.p.n && pmenuEl.style.display==='block'){ pmCard(cur); pmFit(); } } }); }

// ======================= PLAYER ROOMS (UI) =======================
// one room per llama; only its owner can change it. Public rooms are open; private ones need an invite or a knock.
const PRUI={view:'list', list:null, info:null, q:'', found:null, tab:(['pop','top','feat','fr'].includes(store.prTab)?store.prTab:'pop')};
const furnIconCache=new Map(); let adminSignCv=null;
function furnBox(item, rot){ const D=FURN_DEF[item], big=document.createElement('canvas'); big.width=220; big.height=180; const sg=g, sOX=OX, sOY=OY;
  try { g=big.getContext('2d'); g.imageSmoothingEnabled=false; OX=110; OY=90; drawFurn({...D.mk(rot==null ? (D.iconRot||0) : rot), gx:0, gy:0}, 0); } catch(e){} finally { g=sg; OX=sOX; OY=sOY; }
  let src=big; if (D.wall && adminSignCv) src=adminSignCv;
  const W=src.width, H=src.height, px=src.getContext('2d').getImageData(0,0,W,H).data; let x0=W,y0=H,x1=-1,y1=-1;
  for (let yy=0;yy<H;yy++) for (let xx=0;xx<W;xx++) if (px[(yy*W+xx)*4+3]>0){ if(xx<x0)x0=xx; if(xx>x1)x1=xx; if(yy<y0)y0=yy; if(yy>y1)y1=yy; }
  return x1<0 ? null : {src, x0, y0, w:x1-x0+1, h:y1-y0+1}; }
/* Shop and bag pictures: drawn once at 1x, then blown up by a WHOLE number so every art pixel stays square (no warped, uneven pixels). */
function furnIcon(item, CS=88, rot){ if (decoOf(item)){ const k2='deco@'+item+'@'+CS; let c2=furnIconCache.get(k2); if (!c2){ c2=decoIcon(item,CS); furnIconCache.set(k2,c2); } return c2; } const R=Math.max(1,Math.min(3,Math.round(window.devicePixelRatio||1))), S=CS*R, key=item+'@'+S+'@'+(rot==null?'':rot); let c=furnIconCache.get(key); if (c) return c; c=document.createElement('canvas'); c.width=S; c.height=S;   /* sized in real screen pixels, so whole-number blow-ups stay crisp on phones too */
  const b=furnBox(item, rot); if (b){ const m=c.getContext('2d'), room=S-6*R, fit=Math.min(room/b.w, room/b.h), k=fit>=1 ? Math.floor(fit) : fit, dw=Math.round(b.w*k), dh=Math.round(b.h*k), dx=Math.round((S-dw)/2), dy=Math.round((S-dh)/2);
    if (!FURN_DEF[item].wall && !FURN_DEF[item].rug){ m.fillStyle='rgba(40,20,70,.13)'; m.beginPath(); m.ellipse(S/2, Math.min(S-3*R, dy+dh-Math.max(2*R,dh*0.06)), Math.min(S/2-2*R, dw*0.48), Math.max(3*R, dw*0.12), 0, 0, Math.PI*2); m.fill(); }
    m.imageSmoothingEnabled = k<1; m.imageSmoothingQuality='high'; m.drawImage(b.src, b.x0, b.y0, b.w, b.h, dx, dy, dw, dh); }
  furnIconCache.set(key,c); return c; }
function prMsg(t,good){ const el=document.querySelector('#pr_body .prmsg'); if (el){ el.textContent=t||''; el.classList.toggle('good',!!good); } }
// ROOMS has two tabs, MAP (the main places) and PLAYER ROOMS; with no tab asked for it opens on whichever one you had last
function openRooms(view){ closeAll(); PRUI.view=view||(store.prView==='map'?'map':'list'); if (!PRUI.list && store.prCache && store.prCache.rooms) PRUI.list=store.prCache;   /* last list from this device shows instantly; a fresh one replaces it */ $id('roomsbox').style.display='block'; prDraw(); prRefresh(); }
function prRefresh(){ NET.act('pr_list').then(r=>{ if (r.ok){ PRUI.list=r; try{ store.prCache=r; saveStore(); }catch(_){} for (const x of (r.mines||(r.mine?[r.mine]:[]))) PRN['p:'+x.id]=x.name; for (const x of r.rooms) PRN['p:'+x.id]=x.name; if ($id('roomsbox').style.display==='block' && PRUI.view==='list') prDraw(); } });
  if (PRUI.view==='settings') NET.act('pr_info',{rid:PRUI.rid||0}).then(r=>{ if (r.ok){ PRUI.info=r; if (PRUI.view==='settings') prDraw(); } }); }
const lock = (p, pw) => p ? (pw ? ' 🔒🔑' : ' 🔒') : '';
function prRow(x, btns){ return `<div class="prr"><div class="prn"><b>${esc(x.name)}${lock(x.priv, x.pw)}${x.farm?'<span class="prfarm">🌾 FARM</span>':''}${x.feat?'<span class="prfeat">🏆 FEATURED</span>':''}</b><small>by ${esc(x.owner)}${x.friend?' · ⭐ friend':''}${x.invited?' · invited':''}</small></div>${x.likes?`<span class="prlk">♥ ${x.likes}</span>`:''}${x.n?`<span class="prcnt">● ${x.n}</span>`:''}${btns}</div>`; }
function prDraw(){
  const B=$id('pr_body'); let h='';
  for (const t of $id('pr_tabs').children) t.classList.toggle('on', t.dataset.v===(PRUI.view==='map'?'map':'list'));
  if (PRUI.view!=='settings' && store.prView!==PRUI.view){ store.prView=PRUI.view; saveStore(); }
  if (PRUI.view==='settings'){ sheetHead($id('roomsbox')); return prDrawSettings(); }
  $id('pr_title').textContent = joined ? '🏠 ROOMS' : `WELCOME${acctHasLlama()||store.n?' BACK':''}, ${(me.n||'LLAMA').toUpperCase()}!`; sheetHead($id('roomsbox'));
  if (PRUI.view==='map'){ B.innerHTML=[...roomPickEl.querySelectorAll('.rpb[data-r]')].map(b=>{ const r=b.dataset.r, c=b.cloneNode(true), n=roomCount(r), i=c.querySelector('.rpx i');
      c.removeAttribute('id'); c.classList.toggle('here', joined && curRoom===r); if (i){ i.removeAttribute('id'); i.textContent = joined && curRoom===r ? `YOU ARE HERE${n>1?' · '+n+' LLAMAS':''}` : (n ? `${n} LLAMA${n>1?'S':''} HERE` : 'NOBODY HERE YET'); } return c.outerHTML; }).join('')+'<div class="prmsg"></div>';
    return; }
  const L=PRUI.list; if (!L){ B.innerHTML='<div class="fre">Loading...</div>'; if (!prDraw.retry) prDraw.retry=setTimeout(()=>{ prDraw.retry=0; if ($id('roomsbox').style.display==='block' && !PRUI.list) prRefresh(); }, 1000); return; }   /* on the launch screen the connection may still be opening: ask again */
  const keepFocus = document.activeElement && document.activeElement.id==='pr_q';
  h+=`<input id="pr_q" class="prq" type="search" maxlength="24" placeholder="Search rooms or owners" value="${esc(PRUI.q)}" autocapitalize="off" spellcheck="false">`;
  if (PRUI.q.trim().length>=2){
    const btn2=x=> curRoom==='p:'+x.id ? '<span class="prcnt">YOU\'RE HERE</span>' : x.can ? `<button class="gbbtn y" data-go="${x.id}">GO ▶</button>` : `<button class="gbbtn" data-knock="${x.id}">🚪 KNOCK</button>`+(x.pw?`<button class="gbbtn" data-pwask="${x.id}">🔑</button>`:'')+(PRUI.pwFor===x.id?`</div><div class="prpw"><input id="pr_pwin" type="password" maxlength="24" placeholder="Room password" autocomplete="off"><button class="gbbtn y" data-pwgo="${x.id}">ENTER</button>`:'');
    h+='<div class="prsec">SEARCH RESULTS</div>';
    if (!PRUI.found) h+='<div class="fre">Searching...</div>';
    else if (!PRUI.found.length) h+=`<div class="fre">No rooms match "${esc(PRUI.q.trim())}".</div>`;
    else for (const x of PRUI.found) h+=prRow(x, btn2(x));
    h+='<div class="prmsg"></div>'; B.innerHTML=h; prSearchWire(keepFocus); return; }
  { const allMine=L.mines||(L.mine?[L.mine]:[]), mines=allMine.filter(x=>!x.farm), farms=allMine.filter(x=>x.farm), max=L.maxRooms||1;   // up to maxRooms rooms each, plus one farm
    h+=`<div class="prsec">YOUR ROOMS (${mines.length}/${max})${farms.length?' · FARM':''}</div>`;
    for (const x of farms){ const here=curRoom==='p:'+x.id; h+=prRow(x, (here?'':`<button class="gbbtn y" data-go="${x.id}">GO ▶</button>`)+`<button class="gbbtn" data-set="${x.id}">SETTINGS</button>`); }
    for (const x of mines){ const here=curRoom==='p:'+x.id; h+=prRow(x, (here?'':`<button class="gbbtn y" data-go="${x.id}">GO ▶</button>`)+`<button class="gbbtn" data-set="${x.id}">SETTINGS</button>`); }
    if (mines.length<max) h+=`<div class="fre">${mines.length?'Make another room!':'Make a room of your own! Fill it with furniture from the SHOP and invite your friends.'}</div><input id="pr_newname" maxlength="24" placeholder="${esc((me.n||'').toUpperCase())}'S ${mines.length?['','SECOND','THIRD','FOURTH'][mines.length]+' ROOM':'ROOM'}"><div class="srow"><button class="gbbtn y" id="pr_create">CREATE ${mines.length?'ANOTHER':'MY'} ROOM</button></div>`; }
  { const allMine=L.mines||(L.mine?[L.mine]:[]); if (!allMine.some(x=>x.farm)) h+=`<div class="prfarmnew"><div class="fre"><b>🌾 START A FARM</b><br>Grow carrots, corn, strawberries and pumpkins in garden plots, then sell the harvest for TOKENS. Up to ${L.maxPlots||12} plots. Garden plots and farm decorations are in the SHOP under FARM &amp; GARDEN. One farm each, on top of your rooms.</div><div class="srow"><button class="gbbtn y" id="pr_createfarm">CREATE ${esc((me.n||'').toUpperCase())} ACRES</button></div></div>`; }
  const btn=x=> curRoom==='p:'+x.id ? '<span class="prcnt">YOU\'RE HERE</span>' : x.can ? `<button class="gbbtn y" data-go="${x.id}">GO ▶</button>` : `<button class="gbbtn" data-knock="${x.id}">🚪 KNOCK</button>`+(x.pw?`<button class="gbbtn" data-pwask="${x.id}">🔑</button>`:'')+(PRUI.pwFor===x.id?`</div><div class="prpw"><input id="pr_pwin" type="password" maxlength="24" placeholder="Room password" autocomplete="off"><button class="gbbtn y" data-pwgo="${x.id}">ENTER</button>`:'');
  const staffBtn=x=> L.staff ? `<button class="gbbtn" data-reset="${x.id}" title="Staff: reset this room's name">↺</button>` : '';
  // room browser: what's busy right now, the most-liked rooms, the owner's picks, and friends' rooms
  const T=PRUI.tab||'pop', TABS=[['pop','🔥 POPULAR'],['top','♥ TOP'],['feat','🏆 FEATURED'],['fr','⭐ FRIENDS']];
  h+=`<div class="seg prtabs">${TABS.map(([k,l])=>`<button data-tab="${k}" class="${k===T?'on':''}">${l}</button>`).join('')}</div>`;
  let rows=L.rooms.slice();
  if (T==='pop') rows.sort((a,b)=>(b.n-a.n)||(b.likes-a.likes)||(b.feat-a.feat));
  else if (T==='top') rows=rows.filter(x=>x.likes>0).sort((a,b)=>(b.likes-a.likes)||(b.n-a.n));
  else if (T==='feat') rows=rows.filter(x=>x.feat);
  else rows=rows.filter(x=>x.friend).sort((a,b)=>(b.n-a.n)||(b.likes-a.likes));
  const featBtn=x=> L.owner ? `<button class="gbbtn" data-feat="${x.id}" data-on="${x.feat?0:1}" title="Owner: feature this room">${x.feat?'★':'☆'}</button>` : '';
  const none={pop:'No other rooms yet. Make yours and invite friends!', top:'No liked rooms yet. Visit a room and tap ♥ to like it.', feat:'No featured rooms yet.', fr:'None of your friends have rooms yet.'}[T];
  if (!rows.length) h+=`<div class="fre">${none}</div>`; for (const x of rows) h+=prRow(x, btn(x)+featBtn(x)+staffBtn(x));
  h+='<div class="prmsg"></div>';
  B.innerHTML=h; prSearchWire(keepFocus);
}
let prQT=null;
function prSearchWire(keepFocus){ const q=$id('pr_q'); if (!q) return; if (keepFocus){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  q.addEventListener('input', ()=>{ PRUI.q=q.value; clearTimeout(prQT); if (q.value.trim().length<2){ PRUI.found=null; prDraw(); return; }
    PRUI.found=null; prQT=setTimeout(()=>{ const asked=q.value.trim(); NET.act('pr_search',{q:asked}).then(r=>{ if (PRUI.q.trim()!==asked) return; PRUI.found = r.ok ? r.rooms : []; if (PRUI.view==='list') prDraw(); }); }, 300); }); }
$id('pr_body').addEventListener('click', e=>{ const b=e.target.closest('button'); if (!b) return; ensureAudio();
  if (b.dataset.r){ const r=b.dataset.r; if (joined && r===curRoom){ prMsg(`You're already in ${ROOM_NAMES[r]}.`); return; } goRoom(r); return; }
  if (b.dataset.tab){ PRUI.tab=b.dataset.tab; store.prTab=PRUI.tab; saveStore(); prDraw(); return; }
  if (b.dataset.feat){ NET.act('pr_feature',{rid:+b.dataset.feat, on:b.dataset.on==='1'}).then(r=>{ if (r.ok){ PRUI.list=r; prDraw(); } else prMsg(r.msg||'Could not change that.'); }); return; }
  if (b.dataset.go){ prGo(+b.dataset.go); return; }
  if (b.dataset.knock){ prMsg('KNOCKING...'); NET.act('pr_knock',{rid:+b.dataset.knock}).then(r=>{ if (r.open){ prGo(+b.dataset.knock); return; } prMsg(r.msg||'', r.ok); }); return; }
  if (b.dataset.reset){ if (!confirm('Reset this room\'s name?')) return; NET.act('pr_staff',{rid:+b.dataset.reset}).then(r=>{ prMsg(r.msg||'', r.ok); prRefresh(); }); return; }
  if (b.dataset.set){ PRUI.rid=+b.dataset.set||0; PRUI.view='settings'; PRUI.info=null; PRUI.delAsk=false; prDraw(); prRefresh(); return; }
  if (b.dataset.pwask){ PRUI.pwFor = PRUI.pwFor===+b.dataset.pwask ? null : +b.dataset.pwask; prDraw(); setTimeout(()=>{ const i=$id('pr_pwin'); if (i) i.focus(); }, 30); return; }
  if (b.dataset.pwgo){ const pw=($id('pr_pwin')||{}).value||''; if (!pw) return prMsg('Type the password first.'); prMsg('CHECKING...'); prGo(+b.dataset.pwgo, pw); return; }
  if (b.id==='pr_createfarm'){ prMsg('PLOWING...'); NET.act('pr_create',{kind:'farm'}).then(r=>{ if (!r.ok) return prMsg(r.msg||'That did not work.'); PRUI.list=r; prDraw(); if (r.created) prGo(r.created); }); return; }
  if (b.id==='pr_setpw'){ const pw=($id('pr_pwnew').value||''); if (pw.length<4) return prMsg('Passwords are 4 to 24 characters.'); NET.act('pr_pw',{rid:PRUI.rid||0, pw}).then(r=>{ if (!r.ok) return prMsg(r.msg||'That did not work.'); PRUI.info.room=r.room; prApplyRoom(r.room); prDraw(); prMsg(r.msg,true); }); return; }
  if (b.id==='pr_clearpw'){ NET.act('pr_pw',{rid:PRUI.rid||0, pw:''}).then(r=>{ if (!r.ok) return prMsg(r.msg||'That did not work.'); PRUI.info.room=r.room; prApplyRoom(r.room); prDraw(); prMsg(r.msg,true); }); return; }
  if (b.id==='pr_delete'){ PRUI.delAsk=true; prDraw(); setTimeout(()=>{ const d=$id('pr_body').querySelector('.prdel'); if (d) d.scrollIntoView({block:'nearest'}); }, 30); return; }
  if (b.id==='pr_delno'){ PRUI.delAsk=false; prDraw(); return; }
  if (b.id==='pr_delyes'){ const rid=PRUI.rid || (PRUI.info&&PRUI.info.room&&PRUI.info.room.id); if (!rid) return; b.disabled=true;
    NET.act('pr_delete',{rid, confirm:'DELETE'}).then(r=>{ PRUI.delAsk=false; if (!r.ok){ b.disabled=false; return prMsg(r.msg||'That did not work.'); }
      delete PRD['p:'+rid]; PRUI.list=r; PRUI.view='list'; PRUI.rid=0; PRUI.info=null; prDraw(); prMsg(r.msg||'Deleted.', true); }); return; }
  if (b.id==='pr_create'){ const n=($id('pr_newname').value||'').trim(); prMsg('BUILDING...'); NET.act('pr_create',{name:n}).then(r=>{ if (!r.ok) return prMsg(r.msg||'That did not work.'); PRUI.list=r; prDraw(); if (r.created) prGo(r.created); }); return; }
  if (b.id==='pr_back'){ PRUI.view='list'; prDraw(); prRefresh(); return; }
  if (b.classList.contains('lock')){ prMsg('Buy that one in the SHOP first (🎨 WALLPAPER and FLOORS, at the bottom).'); return; }
  if (b.dataset.wall||b.dataset.floor||b.dataset.priv!==undefined){ const upd = b.dataset.wall?{wall:b.dataset.wall}:b.dataset.floor?{floor:b.dataset.floor}:{priv:b.dataset.priv==='1'};
    upd.rid=PRUI.rid||0; NET.act('pr_set',upd).then(r=>{ if (!r.ok) return prMsg(r.msg||'That did not work.'); if (r.deco) DECO_OWN=r.deco; PRUI.info.room=r.room; prApplyRoom(r.room); prDraw(); }); return; }
  if (b.id==='pr_savename'){ const n=$id('pr_name').value.trim(); NET.act('pr_set',{name:n, rid:PRUI.rid||0}).then(r=>{ if (!r.ok) return prMsg(r.msg||'That did not work.'); PRUI.info.room=r.room; prApplyRoom(r.room); prDraw(); prMsg('Saved!',true); }); return; }
  if (b.id==='pr_inv'){ const n=$id('pr_invname').value.trim(); if (!n) return; NET.act('pr_invite',{n, add:true, rid:PRUI.rid||0}).then(r=>{ if (!r.ok) return prMsg(r.msg||'That did not work.'); PRUI.info=r; prDraw(); prMsg('Invited!',true); }); return; }
  if (b.dataset.uninv){ NET.act('pr_invite',{n:b.dataset.uninv, add:false, rid:PRUI.rid||0}).then(r=>{ if (r.ok){ PRUI.info=r; prDraw(); } }); return; }
  if (b.dataset.kickp){ NET.act('pr_kick',{n:b.dataset.kickp, rid:PRUI.rid||0}).then(r=>prMsg(r.msg||'', r.ok)); return; }
  if (b.id==='pr_edit'){ const id=PRUI.rid || (PRUI.info&&PRUI.info.room&&PRUI.info.room.id) || (PRUI.list&&PRUI.list.mine&&PRUI.list.mine.id); if (!id) return; if (curRoom!=='p:'+id){ PRED.pending=true; prGo(id); } else openWardrobe('storage'); return; }
});
$id('pr_body').addEventListener('keydown', e=>e.stopPropagation());
const DSW_URL={};
function prDrawSettings(){ if (!prDrawSettings.loaded){ prDrawSettings.loaded=1; NET.act('furn_info').then(r=>{ if (r.ok){ DECO_OWN=r.deco||[]; if ($id('roomsbox').style.display==='block' && PRUI.view==='settings') prDrawSettings(); } }); }
  const B=$id('pr_body'), I=PRUI.info; $id('pr_title').textContent='⚙️ ROOM SETTINGS';
  if (!I){ B.innerHTML='<div class="fre">Loading...</div>'; return; } const R=I.room;
  const here=curRoom==='p:'+R.id; const inside=[...others.values()].filter(o=>!o.leaving && o.rm==='p:'+R.id).map(o=>o.n.toUpperCase());
  let h = R.farm ? `<div class="prsec">NAME</div><div class="fre"><b>${esc(R.name)}</b><br>Farms are named after their farmer.</div>` : `<div class="prsec">NAME</div><input id="pr_name" maxlength="24" value="${esc(R.name)}"><div class="srow"><button class="gbbtn" id="pr_savename">SAVE NAME</button></div>`;
  h+=`<div class="prsec">WHO CAN COME IN</div><div class="seg"><button data-priv="0" class="${R.priv?'':'on'}">🌍 PUBLIC</button><button data-priv="1" class="${R.priv?'on':''}">🔒 PRIVATE</button></div>`;
  h+=`<div class="fre" style="margin-top:6px">${R.priv?(R.pw?'Only you, people you invite, people you let in when they knock, and anyone with the password.':'Only you, people you invite, and people you let in when they knock.'):'Anyone can come in.'}</div>`;
  h+=`<div class="prsec">PASSWORD 🔑</div><div class="fre">${R.pw?'This room has a password. Share it with people you want to let in any time.':'Give your room a password so friends can come in without knocking. Setting one makes the room private.'}</div><div class="prpw"><input id="pr_pwnew" type="password" maxlength="24" placeholder="${R.pw?'New password':'4 to 24 characters'}" autocomplete="new-password"><button class="gbbtn y" id="pr_setpw">${R.pw?'CHANGE':'SET'}</button>${R.pw?'<button class="gbbtn" id="pr_clearpw">REMOVE</button>':''}</div>`;
  const own=k=>DECO_OWN.includes(k), sw=(kind,k,T,cur)=>{ const ok=!T.p||own(kind+':'+k)||cur; return `<button ${kind==='w'?'data-wall':'data-floor'}="${k}" class="${cur?'on':''}${ok?'':' lock'}" title="${esc(T.n)}${ok?'':` (${T.p} TOKENS in the SHOP)`}" data-sw="${kind}:${k}">${ok?'':'<span>🔒</span>'}</button>`; };
  if (!R.farm) h+='<div class="prsec">WALLPAPER</div><div class="sw">'+Object.entries(DECO_WALL).filter(([k])=>k!=='barn').map(([k,T])=>sw('w',k,T,R.wall===k)).join('')+'</div>';   /* farms have no walls */
  h+='<div class="prsec">FLOOR</div><div class="sw">'+Object.entries(DECO_FLOOR).map(([k,T])=>sw('f',k,T,R.floor===k)).join('')+'</div>';
  h+='<div class="fre">🔒 ones are for sale in the SHOP. Putting one up uses it from your bag, and the one you take down goes back in your bag.</div>';
  h+=`<div class="prsec">INVITED (${I.invites.length})</div>`+(I.invites.length?I.invites.map(n=>`<span class="chip">${esc(n)}<button data-uninv="${esc(n)}" aria-label="Remove ${esc(n)}">✕</button></span>`).join(''):'<div class="fre">Nobody yet. Invited llamas can always come in, even when it\'s private.</div>');
  h+=`<input id="pr_invname" maxlength="12" placeholder="Invite by llama name" autocapitalize="off" spellcheck="false"><div class="srow"><button class="gbbtn" id="pr_inv">INVITE</button></div>`;
  if (inside.length){ h+='<div class="prsec">IN YOUR ROOM NOW</div>'+inside.map(n=>`<div class="prr"><div class="prn"><b>${esc(n)}</b></div><button class="gbbtn" data-kickp="${esc(n)}">ASK TO LEAVE</button></div>`).join(''); }
  h+=`<div class="srow"><button class="gbbtn y" id="pr_edit">🎒 PLACE FURNITURE</button><button class="gbbtn" id="pr_back">◀ ROOMS</button></div><div class="prmsg"></div>`;
  // delete this room: asks first, says what happens to the furniture (and any crops)
  { const kind=R.farm?'farm':'room', n=I.furnN||0, c=I.crops||0;
    if (!PRUI.delAsk) h+=`<div class="prsec">DELETE ${R.farm?'FARM':'ROOM'}</div><div class="srow"><button class="gbbtn bad" id="pr_delete">DELETE THIS ${R.farm?'FARM':'ROOM'}</button></div>`;
    else h+=`<div class="prdel"><div class="bnq">Delete <b>${esc(R.name)}</b>?</div><div class="fre">${n ? `${n} ${n===1?'piece':'pieces'} of furniture will go back to your bag.` : 'There\'s no furniture in it.'}${c ? ` The ${c} ${c===1?'crop':'crops'} growing here will be lost.` : ''} Anyone inside goes back to the lounge. This can't be undone.</div><div class="srow"><button class="gbbtn bad" id="pr_delyes">YES, DELETE</button><button class="gbbtn" id="pr_delno">GO BACK</button></div></div>`; }
  B.innerHTML=h; for (const b of B.querySelectorAll('[data-sw]')){ const k=b.dataset.sw; if (!DSW_URL[k]){ const [kind,id]=k.split(':'); DSW_URL[k]=decoSwatch(kind,id).toDataURL(); } b.style.backgroundImage=`url(${DSW_URL[k]})`; }
}
function prApplyRoom(room){ const key='p:'+room.id; PRN[key]=room.name; ROOM_NAMES[key]=room.name; if (PRD[key]){ const { likes, liked, ...rest } = room; Object.assign(PRD[key], rest);   /* like counts come from their own updates */ if (curRoom===key){ rebuildBG(); document.getElementById('stitle').textContent=room.name; } } }
// going to a player room: ask the server first (it decides who gets in), then walk out the door
function prGo(id, pw){ const fresh=!joined;   /* picked from the launch screen: once the server lets you in, you join right there (no stop in the lounge) */
  NET.act('pr_enter',{rid:id, pw:pw||undefined}).then(r=>{
  if (!r.ok){ if (r.locked){ if ($id('roomsbox').style.display!=='block') openRooms(); if (r.pw){ PRUI.pwFor=id; if (PRUI.view!=='list'){ PRUI.view='list'; } prDraw(); } prMsg(r.msg); } else localMsg(r.msg||'That room is closed.'); PRED.pending=false; return; }
  PRUI.pwFor=null;
  const key='p:'+id; PRD[key]={...r.room, furn:r.furn, mine:r.mine}; PRN[key]=r.room.name; ROOM_NAMES[key]=r.room.name; { const W=r.room.farm?12:11, H=r.room.farm?9:7; ROOM_DIMS[key]=[W,H]; ENTRY[key]={any:{at:[1,H-1],to:[3,H-1]}}; DOORWAY[key]=[0,H-1]; }   /* farms are a bigger open field */   /* player rooms: 11 wide, 7 deep; the door is at the front of the short left wall */ ROOM_SHORT[key]=r.room.farm?'FARM':'ROOM';
  if (fresh && !joined){ goRoom(key); if (PRED.pending){ PRED.pending=false; setTimeout(()=>{ if (curRoom===key) prEditStart(); }, 800); } return; }
  closeAll(); if (curRoom===key){ buildWorld(); if (PRED.pending){ PRED.pending=false; prEditStart(); } return; }
  if (arcade.on) exitArcade(); localMsg(`Heading to ${r.room.name}...`); goThroughDoor(key); }); }
// ---- edit mode (owner only; the server checks every change) ----
const PRED={on:false, item:null, piece:null, storage:[], pending:false};
function prEditStart(){ const R=PRD[curRoom]; if (!R || !R.mine) return; PRED.on=true; PRED.item=null; PRED.piece=null; document.body.classList.add('editing'); prEditBar(); NET.act('furn_info').then(r=>{ if (r.ok){ PRED.storage=r.furn; prEditBar(); } }); localMsg('EDIT MODE: drag pieces to move them, or drag new ones up from the bar. Tap a piece to turn it or put it away.'); }
function prEditStop(){ if (!PRED.on) return; PRED.on=false; PRED.item=null; PRED.piece=null; document.body.classList.remove('editing'); $id('editbar').classList.remove('piece'); }
function prEditBar(){ const el=$id('eb_items'), bar=$id('editbar'); bar.classList.toggle('piece', !!PRED.piece);
  if (PRED.piece){ const D=FURN_DEF[PRED.piece.item]; $id('eb_piece').innerHTML=`<button class="gbbtn" id="eb_rot">↻ TURN</button><button class="gbbtn" id="eb_pick">📦 PUT AWAY</button><button class="gbbtn" id="eb_cancel">✕</button>`; return; }
  const list=PRED.storage.filter(x=>FURN_DEF[x.item]);
  if (!list.length){ el.innerHTML='<div class="fre">No items yet. Tap SHOP to buy furniture.</div>'; return; }
  el.innerHTML=list.map(x=>{ const left=x.n-x.placed; return `<button class="ebi${PRED.item===x.item?' on':''}" data-it="${x.item}" title="${esc(FURN_DEF[x.item].n)}" ${left<=0?'disabled':''}><canvas width="48" height="48" data-fi="${x.item}"></canvas><i>×${left}</i></button>`; }).join('');
  for (const cv of el.querySelectorAll('canvas[data-fi]')){ const ic=furnIcon(cv.dataset.fi,48); cv.width=ic.width; cv.height=ic.height; cv.getContext('2d').drawImage(ic,0,0); } }
$id('editbar').addEventListener('pointerdown', e=>{ e.stopPropagation(); const b=e.target.closest('.ebi'); if (b && !b.disabled && b.dataset.it) prDragStart(e, {item:b.dataset.it, rot:0, ox:0, oy:0, fromBar:true}); });
// ---- drag and drop: press a piece (or an item in the bar), drag it, let go to drop it; a see-through copy shows where it lands ----
const PDR={on:false, armed:false};
function prDragStart(e, o){ clearTimeout(PDR.lp); Object.assign(PDR, {on:false, armed:true, auto:false, staff:false, buy:false, fromBar:false, tapHit:null, longPress:false, id:e.pointerId, sx:e.clientX, sy:e.clientY, fid:null, gx:null, gy:null, ok:false, tapGx:null, tapGy:null}, o); PDR.hgx=null;
  if (PDR.fid && prCanMove()) PDR.lp=setTimeout(()=>{ if (!PDR.armed || PDR.on) return; PDR.on=true; PDR.longPress=true; holdRing(false);
    if (!PDR.staff){ if (!PRED.on) prEditStart(); PRED.item=null; PRED.piece={fid:PDR.fid, item:PDR.item, gx:PDR.tapGx, gy:PDR.tapGy}; prEditBar(); }
    PDR.gx=PDR.gx0; PDR.gy=PDR.gy0; PDR.ok=true; sfxChime([523,784]); try{ navigator.vibrate && navigator.vibrate(40); }catch(_){}
    localMsg(PDR.staff ? 'Picked it up! Drag it where it should go. Staff moves are logged.' : 'Picked it up! Drag it where you want it.'); }, PDR.auto ? HOLD_MS : 450); }
const layerOf = item => { const D=FURN_DEF[item]||{}; return D.wall ? 'wall' : D.rug ? 'rug' : 'floor'; };
function prFits(item, gx, gy, rot, skip){ const D=FURN_DEF[item]; if (!D) return false; const wall=!!D.wall, L=layerOf(item);
  if (wall && gx!==0 && gy!==0) return false; if (wall && gx===0 && gy>=NY-2) return false;
  for (const [x,y] of furnTiles(item,gx,gy,rot)){ if (x<0||y<0||x>=N||y>=NY) return false; if (L==='floor' && x<=3 && y===NY-1) return false; }
  for (const f of FURN){ if (!f.fid || f.fid===skip || layerOf(f.item)!==L) continue; const ft=furnTiles(f.item,f.gx,f.gy,f.rot); if (ft.some(([x,y])=>furnTiles(item,gx,gy,rot).some(([u,v])=>u===x&&v===y))) return false; }
  return true; }
// how tall each piece looks (game pixels), so a new piece hangs centred on the pointer instead of standing on it
const FURN_VH={beanbag:14,barstool:22,dbed:20,coffeetable:10,roundtable:18,floorlamp:46,lavalamp:16,cubeshelf:26,dresser:24,cactus:20,flowers:18,boombox:16,rug_persian:0,rug_round:0,rug_stripe:0,rug_shag:0,rug_mat_green:0,rug_mat_red:0,rug_mat_blue:0,rug_mat_coir:0,rug_mat_pink:0,rug_mat_purple:0,chair:26,armchair:24,couch:24,sofa:24,loveseat:24,bed:20,bookshelf:38,tv:30,bigtv:40,plant:30,lamp:30,table:16,vending:46,vendrink:46,snackvend:46,adminsign:0};
function prWallTile(lx){ const u=(lx-OX)/(TW/2); return u>=0 ? [Math.max(0,Math.min(N-1,Math.floor(u))), 0] : [0, Math.max(1,Math.min(NY-3,Math.floor(-u)))]; }   // right wall, or left wall (above the door is off limits)
// base=true: the pointer marks the piece's bottom (moving a piece); otherwise the piece hangs centred on the pointer (bringing in a new one).
// Either way the spot is kept inside the room, so pulling a piece past a wall leaves it right up against that wall.
function prCentreTile(item, rot, clientX, clientY, base){ if ((FURN_DEF[item]||{}).wall) return prWallTile(clientX/S); const vh=base ? 0 : (FURN_VH[furnBase(item)]!==undefined ? FURN_VH[furnBase(item)] : 16);
  const wx=clientX/S-OX, wy=clientY/S-OY+vh/2, fx=(wx/(TW/2)+wy/(TH/2))/2, fy=(wy/(TH/2)-wx/(TW/2))/2;
  const t=furnTiles(item,0,0,rot), w=Math.max(...t.map(q=>q[0]))+1, d=Math.max(...t.map(q=>q[1]))+1;   // footprint, centred on the pointer too
  return [Math.max(0, Math.min(N-w, Math.floor(fx-(w-1)/2))), Math.max(0, Math.min(NY-d, Math.floor(fy-(d-1)/2)))]; }
function prDragAim(e){ const bar=$id('editbar').getBoundingClientRect();
  if (e.clientY>=bar.top-4 && e.clientX>=bar.left && e.clientX<=bar.right){ PDR.gx=null; return; }   // over the bar: dropping here cancels
  PDR.px=e.clientX/S; PDR.py=e.clientY/S;
  [PDR.gx,PDR.gy]=prCentreTile(PDR.item, PDR.rot, e.clientX, e.clientY, !!PDR.fid); PDR.ok=prFits(PDR.item, PDR.gx, PDR.gy, PDR.rot, PDR.fid); }
addEventListener('pointermove', e=>{
  if (PDR.armed && e.pointerId===PDR.id){ if (!PDR.on && PDR.auto && !PRED.on){ if (Math.hypot(e.clientX-PDR.sx, e.clientY-PDR.sy)>(e.pointerType==='mouse'?8:20)){ clearTimeout(PDR.lp); PDR.armed=false; holdRing(false); } return; }
    if (!PDR.on){ const dx=e.clientX-PDR.sx, dy=e.clientY-PDR.sy;
      // from the bar, a sideways swipe still scrolls the bar; pull up (or press a piece and move) to start dragging
      if (PDR.fromBar ? (dy<-14 && Math.abs(dy)>Math.abs(dx)) : Math.hypot(dx,dy)>(e.pointerType==="mouse" ? 8 : 20)){   /* a finger wobbles: a tap only turns into a drag once it really moves */ PDR.on=true; if (!PRED.on && prInMine()) prEditStart(); PRED.piece=null; PRED.item=null; prEditBar(); } }
    if (PDR.on){ prDragAim(e); e.preventDefault(); } return; }
  // mouse hover with an item picked: show where a tap would put it
  if (PRED.on && PRED.item && e.pointerType==='mouse' && e.target===cv){ const [tx,ty]=prCentreTile(PRED.item, 0, e.clientX, e.clientY); PDR.hgx=tx; PDR.hgy=ty; PDR.px=e.clientX/S; PDR.py=e.clientY/S; } else PDR.hgx=null;
}, {passive:false});
function prDragEnd(e, cancel){ holdRing(false); if (!PDR.armed || e.pointerId!==PDR.id) return; clearTimeout(PDR.lp); const was=PDR.on; PDR.armed=false; PDR.on=false;
  if (!was){ if (PDR.auto){ if (!cancel){ if (PDR.tapHit) prTapPiece(PDR.tapHit); else prTapWalk(PDR.tapGx, PDR.tapGy); } return; } if (PDR.fid && !cancel){ PRED.piece={fid:PDR.fid, item:PDR.item, gx:PDR.tapGx, gy:PDR.tapGy}; PRED.item=null; prEditBar(); } return; }   // just a tap: select it as before
  PDR.noClick=performance.now();
  if (cancel || PDR.gx===null) return;
  if (!PDR.ok){ localMsg(PDR.fid ? 'That piece doesn\'t fit there.' : 'That doesn\'t fit there.'); return; }
  if (PDR.fid){ const fid=PDR.fid, item=PDR.item, nx=PDR.gx, ny=PDR.gy; if (PDR.longPress && !PDR.staff){ PRED.piece={fid, item, gx:nx, gy:ny}; prEditBar(); } if (nx===PDR.gx0 && ny===PDR.gy0) return; NET.act('pr_move',{fid, gx:nx, gy:ny}).then(r=>{ if (!r.ok) localMsg(r.msg||'Can\'t move that there.'); }); return; }
  if (PDR.buy){ const item=PDR.item, gx=PDR.gx, gy=PDR.gy; NET.act('furn_buy',{item}).then(r=>{ if (Number.isFinite(r.tk)) tkSet(r.tk); if (!r.ok) return localMsg(r.msg||'Could not buy that.'); WD.furn=r.furn||WD.furn;
      NET.act('pr_place',{item, gx, gy, rot:0}).then(r2=>{ if (!r2.ok){ localMsg((r2.msg||'Can\'t put that there.')+' It\'s in your 🎒 ITEMS.'); return; } localMsg(`Bought a ${FURN_DEF[item].n} and put it in your room!`); if (r2.storage) PRED.storage=r2.storage; prEditBar(); }); }); return; }
  const item=PDR.item; NET.act('pr_place',{item, gx:PDR.gx, gy:PDR.gy, rot:0}).then(r=>{ if (!r.ok) return localMsg(r.msg||'Can\'t put that there.'); if (r.storage){ PRED.storage=r.storage; const s2=r.storage.find(x=>x.item===PRED.item); if (PRED.item && (!s2 || s2.n-s2.placed<=0)) PRED.item=null; } prEditBar(); }); }
addEventListener('pointerup', e=>prDragEnd(e,false)); addEventListener('pointercancel', e=>prDragEnd(e,true));
// draw the piece see-through where it would land: green floor tiles if it fits, red if it doesn't
const ghostCv=document.createElement('canvas');
function prGhost(t){ if (!PRED.on) return; let item, gx, gy, rot, ok;
  if (PDR.on && PDR.gx!==null){ item=PDR.item; gx=PDR.gx; gy=PDR.gy; rot=PDR.rot; ok=PDR.ok; }
  else if (PRED.item && PDR.hgx!==null && !PDR.on){ item=PRED.item; gx=PDR.hgx; gy=PDR.hgy; rot=0; ok=prFits(item,gx,gy,0,null); }
  else return;
  const D=FURN_DEF[item]; if (!D) return;
  if (!D.wall) for (const [x,y] of furnTiles(item,gx,gy,rot)){ if (x<0||y<0||x>=N||y>=NY) continue; g.globalAlpha=0.35; polyPx([P(x,y),P(x+1,y),P(x+1,y+1),P(x,y+1)], ok?'#3ddc75':'#f04050'); g.globalAlpha=1; }
  const c=g.canvas; if (ghostCv.width!==c.width || ghostCv.height!==c.height){ ghostCv.width=c.width; ghostCv.height=c.height; }
  const gc=ghostCv.getContext('2d'); gc.setTransform(1,0,0,1,0,0); gc.clearRect(0,0,ghostCv.width,ghostCv.height); gc.setTransform(g.getTransform()); gc.imageSmoothingEnabled=false;
  const sg=g; try { g=gc; drawFurn({...D.mk(rot), gx, gy}, t); } finally { g=sg; }
  g.save(); g.setTransform(1,0,0,1,0,0); g.globalAlpha=D.wall ? 0.3 : (ok?0.55:0.4); g.drawImage(ghostCv,0,0); g.restore();
  if (D.wall && adminSignCv && PDR.px!=null){ const W=adminSignCv.width, H=adminSignCv.height; g.globalAlpha=ok?0.8:0.5; g.drawImage(adminSignCv, Math.round(PDR.px-W/2), Math.round(PDR.py-H/2)); g.globalAlpha=1; } }
$id('editbar').addEventListener('click', e=>{ const b=e.target.closest('button'); if (!b) return; ensureAudio(); if (PDR.noClick && performance.now()-PDR.noClick<400) return;
  if (b.id==='eb_done'){ prEditStop(); localMsg('Room saved.'); return; }
  if (b.dataset.it){ PRED.item = PRED.item===b.dataset.it ? null : b.dataset.it; prEditBar(); return; }
  if (b.id==='eb_cancel'){ PRED.piece=null; prEditBar(); return; }
  if (b.id==='eb_pick'){ const pf=FURN.find(f=>f.fid===PRED.piece.fid), st=pf&&plotState(pf); if (st && !confirm(`Put this plot away? The ${(CROP_INFO[st.crop]||{n:'crop'}).n.toLowerCase()} growing in it will be lost.`)) return; }
  if (b.id==='eb_rot' || b.id==='eb_pick'){ const fid=PRED.piece.fid; NET.act(b.id==='eb_rot'?'pr_rot':'pr_pick',{fid}).then(r=>{ if (!r.ok) return localMsg(r.msg||'That did not work.'); if (r.storage) PRED.storage=r.storage; if (b.id==='eb_pick') PRED.piece=null; prEditBar(); }); return; } });
function prFurnAt(gx,gy){ const wallPick = PRED.item && FURN_DEF[PRED.item] && FURN_DEF[PRED.item].wall;
  const on=f=>furnTiles(f.item,f.gx,f.gy,f.rot).some(([x,y])=>x===gx&&y===gy);
  return FURN.find(f=>f.fid && on(f) && !!(FURN_DEF[f.item]||{}).wall===!!wallPick) || (PRED.item ? null : FURN.find(f=>f.fid && on(f))); }
function playerPointer(e){
  const lx=e.clientX/S, ly=e.clientY/S;
  // the door (left wall, by tile 0,10): walk out, then pick where to go next
  { const dy=NY-1, cx=OX-(dy+0.5)*20, cy=OY+(dy+0.5)*10; if (!PRED.on && lx>=cx-12 && lx<=cx+12 && ly>=cy-55 && ly<=cy+6){ prLeave(); return; } }
  if (!PRED.on) for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } if (me.h){ doAction('sip'); return; } break; } }
  // plots and vending machines: a quick tap uses them; in a room you can edit, holding one picks it up to move like any other piece
  const [tgx,tgy]=toGrid(e.clientX, e.clientY);
  // garden plots sit side by side, so a plain box around each one overlaps its neighbours: pick by the plot's real shape instead.
  // A plot is its raised bed (5 px tall) plus, when something grows, the crops and timer above it. The bed itself beats the
  // crops of the plot in front, and among beds the one drawn in front wins.
  if (!PRED.on){ const gf=(X,Y)=>{ const wx=X-OX, wy=Y-OY; return [(wx/(TW/2)+wy/(TH/2))/2, (wy/(TH/2)-wx/(TW/2))/2]; };
    const inPlot=(f,top)=>{ const m=top>5?0.22:0.02; for (let hh=0; hh<=top; hh++){ const [u,v]=gf(lx,ly+hh); if (u>=f.gx+m&&u<=f.gx+1-m&&v>=f.gy+m&&v<=f.gy+1-m) return true; } return false; };
    let pick=null; for (const pass of [5,30]){ for (let i=pvHits.length-1;i>=0 && !pick;i--){ const f=pvHits[i].f; if (f.item!=='plot') continue; if (pass===30 && !plotState(f)) continue; if (inPlot(f,pass)) pick=f; } if (pick) break; }
    if (pick){ const f=pick; if (prCanMove()){ prDragStart(e, {fid:f.fid, item:f.item, rot:f.rot||0, gx0:f.gx, gy0:f.gy, ox:0, oy:0, auto:true, staff:!prInMine()}); PDR.tapGx=f.gx; PDR.tapGy=f.gy; PDR.tapHit={f, tx:f.gx, ty:f.gy}; holdRing(true, e.clientX, e.clientY); return; }
      pvGo(f); return; } }
  if (!PRED.on) for (let i=pvHits.length-1;i>=0;i--){ const h=pvHits[i]; if (h.f.item==='plot') continue; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){
    if (!(tgx===h.f.gx && tgy===h.f.gy) && tgx>=0 && tgy>=0 && tgx<N && tgy<NY && walkable(tgx,tgy)) continue;   /* the floor right next to it wins: you meant to walk there */
    if (prCanMove()){ const f=h.f; prDragStart(e, {fid:f.fid, item:f.item, rot:f.rot||0, gx0:f.gx, gy0:f.gy, ox:0, oy:0, auto:true, staff:!prInMine()}); PDR.tapGx=f.gx; PDR.tapGy=f.gy; PDR.tapHit={f, tx:f.gx, ty:f.gy}; holdRing(true, e.clientX, e.clientY); return; }
    pvGo(h.f); return; } }
  const [gx,gy]=toGrid(e.clientX, e.clientY);
  // tapping a piece of furniture counts wherever you tap its picture (its back, its top), not just the floor under it
  const hit = (PRED.on && PRED.item) ? null : prHit(lx, ly); if (hit){ hit.fx=gx; hit.fy=gy; }   /* the floor tile under the tap, for decorations */
  if (!hit && (gx<0||gy<0||gx>=N||gy>=NY)) return;
  if (PRED.on){ const f=hit ? hit.f : prFurnAt(gx,gy), tx=hit?hit.tx:gx, ty=hit?hit.ty:gy;
    if (f){ prDragStart(e, {fid:f.fid, item:f.item, rot:f.rot||0, gx0:f.gx, gy0:f.gy, ox:tx-f.gx, oy:ty-f.gy}); PDR.tapGx=tx; PDR.tapGy=ty; return; }
    if (PRED.item){ const rot=0, [cx2,cy2]=prCentreTile(PRED.item, 0, e.clientX, e.clientY); NET.act('pr_place',{item:PRED.item, gx:cx2, gy:cy2, rot}).then(r=>{ if (!r.ok) return localMsg(r.msg||'Can\'t put that there.'); if (r.storage){ PRED.storage=r.storage; const s2=r.storage.find(x=>x.item===PRED.item); if (!s2 || s2.n-s2.placed<=0) PRED.item=null; } prEditBar(); }); return; }
    PRED.piece=null; prEditBar(); return; }
  // in your own room you can grab any piece and drag it somewhere else; a plain tap still walks or sits as usual
  if (hit && prCanMove()){ const f=hit.f; prDragStart(e, {fid:f.fid, item:f.item, rot:f.rot||0, gx0:f.gx, gy0:f.gy, ox:hit.tx-f.gx, oy:hit.ty-f.gy, auto:true, staff:!prInMine()}); PDR.tapGx=hit.tx; PDR.tapGy=hit.ty; PDR.tapHit=hit; holdRing(true, e.clientX, e.clientY); return; }
  if (hit){ prTapPiece(hit); return; }
  prTapWalk(gx,gy);
}
// which placed piece is drawn under this point (front-most wins), and which of its tiles is nearest the tap
function prHit(lx, ly){ let best=null;
  for (const f of FURN){ if (!f.fid) continue; const D=FURN_DEF[f.item]; if (!D) continue;
    if (D.wall){ const r=f.gy===0, [cx,cy]=r ? P(f.gx+0.5,0,52) : P(0,f.gy+0.5,52); if (Math.abs(lx-cx)<=18 && Math.abs(ly-cy)<=14 && !best) best={f, tx:f.gx, ty:f.gy, depth:-1}; continue; }
    const tl=furnTiles(f.item,f.gx,f.gy,f.rot), vh=FURN_VH[furnBase(f.item)]!==undefined?FURN_VH[furnBase(f.item)]:16; let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
    for (const [x,y] of tl) for (const [u,v] of [[0,0],[1,0],[0,1],[1,1]]){ const [px,py]=P(x+u,y+v,0); x0=Math.min(x0,px); x1=Math.max(x1,px); y0=Math.min(y0,py); y1=Math.max(y1,py); }
    if (lx<x0+2 || lx>x1-2 || ly<y0-vh || ly>y1-2) continue;
    const depth=D.rug ? -2 : Math.max(...tl.map(([x,y])=>x+y)); if (best && best.depth>=depth) continue;
    if (D.rug){ const [tx0,ty0]=toGrid(lx*S, ly*S); if (!tl.some(([x,y])=>x===tx0&&y===ty0)) continue; best={f, tx:tx0, ty:ty0, depth}; continue; }
    let tx=tl[0][0], ty=tl[0][1], bd=1e9; for (const [x,y] of tl){ const [px,py]=P(x+0.5,y+0.5,vh/3); const d=Math.hypot(px-lx,py-ly); if (d<bd){ bd=d; tx=x; ty=y; } }
    best={f, tx, ty, depth}; }
  return best; }
// tap a piece: sit on it if it's a seat (the seat you tapped, or the nearest one), otherwise walk up next to it
const FURN_SWITCH=new Set(['tv','bigtv','lamp','floorlamp','lavalamp','boombox']);
function prTapPiece(hit){ if (hit.f.item==='plot' || PV_ITEMS[hit.f.item]){ pvGo(hit.f); return; } if ((FURN_DEF[hit.f.item]||{}).wall) return; if ((FURN_DEF[hit.f.item]||{}).rug){ prTapWalk(hit.tx, hit.ty); return; }
  if (FURN_SWITCH.has(hit.f.item)){ const f=hit.f; f.off=!f.off; try{ ensureAudio(); if (actx){ const o=actx.createOscillator(), gn=actx.createGain(); o.frequency.value=f.off?320:640; gn.gain.value=0.05*(svol/100); o.connect(gn); gn.connect(actx.destination); o.start(); o.stop(actx.currentTime+0.05); } }catch(_){}
    NET.act('pr_toggle',{fid:f.fid}).then(r=>{ if (!r.ok){ f.off=!f.off; localMsg(r.msg||'That switch is stuck.'); } }); return; } const f=hit.f, tl=furnTiles(f.item,f.gx,f.gy,f.rot);
  const seats=SEATS.filter(q=>tl.some(([x,y])=>x===q.gx&&y===q.gy)); if (seats.length){ const free=seats.filter(q=>!seatTaken(q.gx,q.gy)); if (!free.length){ localMsg("Someone's already sitting there."); return; } const q=free.find(q=>q.gx===hit.tx&&q.gy===hit.ty) || free.slice().sort((a,b)=>Math.hypot(a.gx-hit.tx,a.gy-hit.ty)-Math.hypot(b.gx-hit.tx,b.gy-hit.ty))[0]; walkToSeatIn(q, tl); return; }
  if (hit.fx!=null && hit.fx>=0 && hit.fy>=0 && hit.fx<N && hit.fy<NY && walkable(hit.fx,hit.fy) && !seatAt(hit.fx,hit.fy) && !tl.some(([x,y])=>x===hit.fx&&y===hit.fy)){ walkTo(hit.fx,hit.fy); return; }   /* a decoration's picture overlaps the floor behind it: walk where you tapped */
  const near=[]; for (const [x,y] of tl) for (const [dx,dy] of [[0,1],[1,0],[-1,0],[0,-1]]){ const a=x+dx, b=y+dy; if (a>=0&&b>=0&&a<N&&b<NY&&walkable(a,b)&&!seatAt(a,b)) near.push([a,b]); }
  near.sort((p,q)=>Math.hypot(p[0]-me.gx,p[1]-me.gy)-Math.hypot(q[0]-me.gx,q[1]-me.gy)); if (near.length) walkTo(near[0][0],near[0][1]); }
/* walk to a seat; if it's boxed in (a bed's pillow end against a wall, a lamp and a plant), climb in over the piece itself */
function walkToSeatIn(q, tl){ if (walkTo(q.gx,q.gy)) return true;
  const saved=tl.map(([x,y])=>[x,y,BLOCK[y*N+x]]); for (const [x,y] of tl) if (x>=0&&y>=0&&x<N&&y<NY) BLOCK[y*N+x]=0;
  let ok=false; try { ok=walkTo(q.gx,q.gy); } finally { for (const [x,y,v] of saved) if (x>=0&&y>=0&&x<N&&y<NY) BLOCK[y*N+x]=v; }
  if (!ok) localMsg("Can't get to that spot."); return ok; }
function prTapWalk(gx,gy){
  if (walkable(gx,gy) && !seatAt(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const s2 of SEATS){ const d=Math.abs(s2.gx-gx)+Math.abs(s2.gy-gy); if(d<=1 && d<bd){ bd=d; best=s2; } }
  if (best) walkTo(best.gx,best.gy);
}
function prLeave(){ if (me.p==='sit') doAction('stand'); const [dx,dy]=DOORWAY[curRoom]||[0,NY-1]; if (!walkTo(dx,dy,'leaveroom')) prLeaveNow(); }
function prLeaveNow(){ if (!isP(curRoom)) return; entryFrom=curRoom; setRoom('lounge'); flash(); sendPresence(true); setTimeout(()=>{ showRoomPick(false); }, 250); }
function drawPlayerRoom(t){
  if (!PRED.on) return;
  // edit mode: faint grid and a highlight on the chosen piece
  for (let gx=0; gx<N; gx++) for (let gy=0; gy<NY; gy++){ const a=P(gx,gy), b=P(gx+1,gy), c=P(gx+1,gy+1), d=P(gx,gy+1); g.globalAlpha=0.18; linePx(a[0],a[1],b[0],b[1],'#ffffff'); linePx(a[0],a[1],d[0],d[1],'#ffffff'); g.globalAlpha=1; }
  for (const [gx,gy] of [[0,NY-1],[1,NY-1],[2,NY-1],[3,NY-1]]){ g.globalAlpha=0.25; polyPx([P(gx,gy),P(gx+1,gy),P(gx+1,gy+1),P(gx,gy+1)],'#e03048'); g.globalAlpha=1; }
  if (PRED.piece){ const {gx,gy}=PRED.piece, a=P(gx,gy), b=P(gx+1,gy), c=P(gx+1,gy+1), d=P(gx,gy+1), on=Math.floor(t*4)%2; const col=on?'#ffd23f':'#ffffff'; linePx(a[0],a[1],b[0],b[1],col); linePx(b[0],b[1],c[0],c[1],col); linePx(c[0],c[1],d[0],d[1],col); linePx(d[0],d[1],a[0],a[1],col); }
}
// ---- server pushes for player rooms ----
NET.handlers.prf = m => { const key='p:'+m.room; if (!PRD[key]) return; PRD[key].furn=m.furn; if (curRoom===key){ buildWorld(); if (PRED.piece && !m.furn.some(f=>f.id===PRED.piece.fid)) { PRED.piece=null; prEditBar(); } else if (PRED.piece){ const f=m.furn.find(f=>f.id===PRED.piece.fid); if (f){ PRED.piece.gx=f.gx; PRED.piece.gy=f.gy; } }
  if (!walkable(me.gx,me.gy) && !seatAt(me.gx,me.gy) && !me.moving){ const [x,y]=spawnSpot(key); me.gx=x; me.gy=y; me.x=x+0.5; me.y=y+0.5; sendPresence(true); } } };
NET.handlers.prr = m => prApplyRoom(m.room);
// ♥ like button: shows inside other people's rooms; the server only counts it while you're in the room
function likeUI(){ const R=isP(curRoom)&&PRD[curRoom]; document.body.classList.toggle('inp', !!(R && !R.mine)); if (!R) return; const b=$id('likebtn'); b.classList.toggle('on', !!R.liked); $id('like_n').textContent=R.likes||0; b.title = R.liked ? 'You like this room. Tap to unlike.' : 'Like this room'; }
$id('likebtn').addEventListener('click', e=>{ e.stopPropagation(); ensureAudio(); const key=curRoom, R=PRD[key]; if (!R || R.mine) return;
  NET.act('pr_like',{rid:+key.slice(2)}).then(r=>{ if (!r.ok){ localMsg(r.msg||'Could not like that.'); return; } R.likes=r.likes; R.liked=r.liked; likeUI(); const b=$id('likebtn'); b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); if (r.liked) localMsg(`You liked ${R.name}! ♥`); }); });
NET.handlers.prlikes = m => { const key='p:'+m.room; if (PRD[key]){ PRD[key].likes=m.likes; if (curRoom===key) likeUI(); } };
setInterval(likeUI, 700);
NET.handlers.prkick = m => { localMsg(m.msg||'You left the room.'); if (isP(curRoom)){ setRoom('lounge'); flash(); sendPresence(true); setTimeout(()=>walkTo(...spawnSpot('lounge')), 400); } };
NET.handlers.knockans = m => { if (m.yes){ localMsg(`You were let into ${m.name}!`); prGo(m.room); } else localMsg(`Nobody let you into ${m.name} this time.`); };
// a friend invited you to the room they're in: offer to go there
NET.handlers.rinv = m => { const rm=String(m.rm||''), by=String(m.by||'').toUpperCase(); if (!joined || rm===curRoom) return;
  if (isP(rm) && m.name) PRN[rm]=String(m.name);
  if (!validRoom(rm) && !isP(rm)) return;
  const nm = isP(rm) ? (m.name ? String(m.name) : 'their room') : roomName(rm);
  try{ ensureAudio(); if (actx){ const o=actx.createOscillator(), gn=actx.createGain(); o.frequency.value=660; gn.gain.value=0.06*(svol/100); o.connect(gn); gn.connect(actx.destination); o.start(); o.stop(actx.currentTime+0.12); } }catch(_){}
  if (isP(rm)){ closeAll(); swapTo=rm; } else { showSwap(rm); }
  document.getElementById('sw_text').textContent=`📨 ${by} invited you to ${nm}. GO?`; swapEl.style.display='block'; };
NET.handlers.wfwarn = m => { closeAll(); $id('wf_text').textContent=`Our word filter has caught your messages ${m.n} times. Please keep chat friendly: swear words get starred out, and slurs are never allowed. Staff can see blocked messages and can mute or ban accounts that keep breaking the rules.`; $id('wfbox').style.display='block'; sheetHead($id('wfbox')); };
NET.handlers.filtered = () => { me.bubble=null; localMsg("That message has a word that isn't allowed here, so nobody saw it."); };
NET.handlers.toast = m => { if (m && m.msg) localMsg(String(m.msg).slice(0,120)); };

// ======================= BOXING: what everyone in the gym sees, and the controls for the two fighters =======================
CHARS.rusty = { label:'Rusty', blurb:'Sparring partner (easy).', ears:'up', npc:true, tuft:true, fur:{ a:['#e8b878','#c08848','#fbe0a8'] }, tag:'#e8b878' };
CHARS.duke  = { label:'Duke',  blurb:'The gym champ (hard).', ears:'mixed', npc:true, tuft:true, look:'big', fur:{ a:['#6a4428','#46281a','#8e5c38'] }, tag:'#8e5c38' };
ITEMS.gloves_b = {s:'hands',p:0,n:'BLUE GLOVES',c:['#3a6ae8','#1c3488','#8ab0ff'],cuff:'#f8f4ea',hide:1};
ITEMS.shorts_r = {s:'legs',p:0,n:'RED SHORTS',c:['#e03a48','#a01c30','#ff8a90'],cuff:'#f8f4ea',hide:1};
const BXS = { s:null, mine:null, pick:null, out:null, outT:0, endT:0, win:null, how:null, pays:null, bellT:0, round:0, banner:null, bannerT:0 };
const BXFX = { bellT:0, bursts:[] };
const boxSideOf = n => { const S=BXS.s; if (!S || !n) return null; n=String(n).toUpperCase(); return S.a.n===n ? 'a' : (!S.b.bot && S.b.n===n) ? 'b' : null; };
const bxMe = () => (BXS.s && joined && curRoom==='gym') ? boxSideOf(me.n) : null;
const BOT_LL = { x:RING.B[0]+0.5, y:RING.B[1]+0.5, d:'bl', p:'stand', w:{}, n:'', c:'rusty', id:null, anim:0 };
// a fighter's look this frame: gloves and shorts in their corner's colour, lunges, ducks, the knockdown
function boxLook(o, isMe){ const S=BXS.s; if (!S || curRoom!=='gym') return null;
  const side = o===BOT_LL ? 'b' : boxSideOf(isMe ? me.n : o.n); if (!side) return null;
  const base = (isMe ? me.w : o.w) || {}, W = {...base, hands: side==='a' ? 'gloves' : 'gloves_b', legs: side==='a' ? 'shorts_r' : 'shorts'};
  const now=performance.now(), u=(now-BXS.outT)/1000, sg = side==='a' ? 1 : -1; let dx=0, dy=0, pose=null;
  const R = BXS.out && BXS.out[side], O = BXS.out && BXS.out[side==='a'?'b':'a'];
  if (R && u<0.45){ const k = u<0.12 ? u/0.12 : Math.max(0, 1-(u-0.12)/0.33);
    if (R.mv==='jab'){ dx=3*k*sg; dy=1.5*k*sg; }
    else if (R.mv==='hook'){ dx=5*k*sg; dy=1*k*sg; dy-=Math.round(2*k); }
    else if (R.mv==='dodge'){ dx=-4*k*sg; dy=-2*k*sg+2*k; }
    if (R.took){ const kb=Math.max(0,1-u/0.35); dx-=2*kb*sg; dy-=1*kb*sg; } }
  const P2 = S[side]; if (S.phase==='over' && BXS.win){ if (BXS.win!==P2.n && BXS.how==='ko') pose='sit'; else if (BXS.win===P2.n) dy-=Math.round(Math.abs(Math.sin(now/120))*3); }
  return { W, dx:Math.round(dx), dy:Math.round(dy), pose, dir: side==='a' ? 'fr' : 'bl', side }; }
// pixel glove (6x5) for punches and guards
function bxGlove(X, Y, side){ const C = side==='a' ? ['#e8303c','#a8141e','#ff8a90'] : ['#3a6ae8','#1c3488','#8ab0ff']; g.fillStyle=INK; g.fillRect(X-1,Y-1,8,7); g.fillStyle=C[0]; g.fillRect(X,Y,6,5); g.fillStyle=C[2]; g.fillRect(X+1,Y,2,1); g.fillStyle=C[1]; g.fillRect(X,Y+4,6,1); g.fillStyle='#f8f4ea'; g.fillRect(X+(side==='a'?0:5),Y+1,1,3); }

// comic call-outs for the fight: each word drawn once (pixel-exact, cached) on a burst that suits it
const BXW = {};
const BXW_STYLE = { hit:{b:['#ffd23f','#ff8a24'], t:'#e8303c', r:1}, big:{b:['#ffe866','#ff5a24'], t:'#ffffff', r:1.25}, cut:{b:['#d8b0ff','#9a60e0'], t:'#ffffff', r:0.9}, block:{shield:1, b:['#8ab0ff','#2c5ad8'], t:'#ffffff'}, whoosh:{lines:1, t:'#ffffff'} };
function bxWordImg(txt, kind, small){ const key=txt+'|'+kind+'|'+(small?1:0); if (BXW[key]) return BXW[key]; const S=BXW_STYLE[kind]||BXW_STYLE.hit, sc=small?1:2;
  const tw=pfW(txt,sc), th=5*sc, padX=S.shield?8:S.lines?14:Math.round(12*(S.r||1)*(small?0.6:1)), padY=S.shield?6:S.lines?4:Math.round(14*(S.r||1)*(small?0.6:1));
  const W=tw+padX*2+4, H=th+padY*2+4, c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'), cx=W/2, cy=H/2;
  const fill=(inside,col)=>{ x.fillStyle=col; for (let j=0;j<H;j++) for (let i=0;i<W;i++) if (inside(i+0.5,j+0.5)) x.fillRect(i,j,1,1); };
  if (S.shield){ const inS=(i,j,g2)=>{ const u=(i-cx)/(W/2-1-g2), v=(j-2-g2)/(H-4-2*g2); return v>=0 && v<=1 && Math.abs(u)<=(v<0.6?1:1-(v-0.6)*1.6); };
    fill((i,j)=>inS(i,j,0),INK); fill((i,j)=>inS(i,j,2),S.b[1]); fill((i,j)=>inS(i,j,3)&&j<H*0.45,S.b[0]); }
  else if (!S.lines){ const n=small?10:14, spike=(i,j,R0,R1)=>{ const a=Math.atan2((j-cy)/(H/2),(i-cx)/(W/2)), d=Math.hypot((i-cx)/(W/2),(j-cy)/(H/2)); const k=(a/(2*Math.PI)*n+n)%1, rr=R0+(R1-R0)*Math.abs(k*2-1); return d<=rr; };
    fill((i,j)=>spike(i,j,0.99,0.72),INK); fill((i,j)=>spike(i,j,0.92,0.66),S.b[1]); fill((i,j)=>spike(i,j,0.8,0.6),S.b[0]); fill((i,j)=>Math.hypot((i-cx)/(W/2),(j-cy)/(H/2))<0.5,S.b[0]); }
  else { x.fillStyle='#ffffff'; for (const [yy,len] of [[cy-4,9],[cy,12],[cy+4,8]]){ x.fillRect(1,Math.round(yy),len,1); x.fillRect(W-1-len,Math.round(yy),len,1); } x.fillStyle='#c8e8ff'; x.fillRect(3,Math.round(cy-2),5,1); x.fillRect(W-8,Math.round(cy+2),5,1); }
  const tx=Math.round(cx-tw/2), ty=Math.round(cy-th/2);
  for (const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1],[1,2],[0,2],[2,2]]) pfDraw(x,txt,tx+dx,ty+dy,INK,sc);
  pfDraw(x,txt,tx,ty,S.t,sc); if (!small && S.t==='#ffffff'){ x.fillStyle='rgba(255,255,255,0)'; }
  return BXW[key]=c; }
const BX_WORDS = { jab:['POP!','BIFF!','JAB!','THWAP!'], hook:['POW!','WHAM!','BAM!','KAPOW!'], counter:['COUNTER!'], block:['BLOCKED!'], dodge:['WHOOSH!'], cut:['CUT OFF!'] };
function bxHead(side){ const L = side==='b' && BXS.s && BXS.s.b.bot ? BOT_LL : null; let x, y;
  if (L){ x=L.x; y=L.y; } else { const n=BXS.s && BXS.s[side] && BXS.s[side].n; if (me.n && n===String(me.n).toUpperCase()){ x=me.x; y=me.y; } else { const o=[...others.values()].find(q=>sameRoom(q) && String(q.n||'').toUpperCase()===n); if (!o) return null; x=o.x; y=o.y; } }
  const [sx,sy]=P(x,y,RING.H); return [Math.round(sx), Math.round(sy)-34]; }
function drawBoxFx(t){ const S=BXS.s; if (!S || curRoom!=='gym') return; const now=performance.now();
  // the punch itself: a glove flying out to the other fighter's face
  if (BXS.out && now-BXS.outT<420) for (const side of ['a','b']){ const R=BXS.out[side]; if (!R || (R.mv!=='jab' && R.mv!=='hook')) continue; const A=bxHead(side), B=bxHead(side==='a'?'b':'a'); if (!A||!B) continue;
    const u=Math.min(1,(now-BXS.outT)/140), back=(now-BXS.outT)>220 ? Math.max(0,1-((now-BXS.outT)-220)/200) : 1, k=u*back, arc = R.mv==='hook' ? Math.sin(k*Math.PI)*-7 : 0;
    bxGlove(Math.round(A[0]+(B[0]-A[0])*0.62*k)-3, Math.round(A[1]+8+(B[1]-A[1])*0.62*k+arc), side); }
  if (BXS.out && now-BXS.outT<600) for (const side of ['a','b']){ const R=BXS.out[side]; if (R && R.mv==='block'){ const H=bxHead(side); if (H){ const sg=side==='a'?1:-1; bxGlove(H[0]+sg*5-3, H[1]+6, side); bxGlove(H[0]+sg*2-3, H[1]+11, side); } } }
  // words and stars where the hits land
  for (let i=BXFX.bursts.length-1;i>=0;i--){ const b=BXFX.bursts[i], u=(now-b.t)/900; if (u>=1){ BXFX.bursts.splice(i,1); continue; } const H=bxHead(b.side); if (!H) continue;
    const img=bxWordImg(b.txt, b.kind||'hit', u<0.07), X=H[0]+b.ox, Y=H[1]-10+(b.oy||0)-Math.round(Math.min(u,0.7)*12);
    if (b.star) for (let k=0;k<6;k++){ const a=k*1.047+u*2, r=6+u*14; g.fillStyle=k%2?'#fff6a0':'#ffd23f'; const px=Math.round(H[0]+Math.cos(a)*r), py=Math.round(H[1]+4+Math.sin(a)*r*0.6); g.fillRect(px-1,py,3,1); g.fillRect(px,py-1,1,3); }
    if (u<0.78 || Math.floor(u*30)%2===0) g.drawImage(img, Math.round(X-img.width/2), Math.round(Y-img.height/2)); }
  // dizzy stars over anyone nearly out, and over a knocked-down fighter
  for (const side of ['a','b']){ const P2=S[side]; const ko = S.phase==='over' && BXS.how==='ko' && BXS.win && BXS.win!==P2.n; if (P2.hp>25 && !ko) continue; const H=bxHead(side); if (!H) continue;
    const yy = ko ? H[1]+16 : H[1]-4; for (let k=0;k<3;k++){ const a=t*4+k*2.1, X=Math.round(H[0]+Math.cos(a)*9), Y=Math.round(yy+Math.sin(a)*3); g.fillStyle='#ffd23f'; g.fillRect(X-1,Y,3,1); g.fillRect(X,Y-1,1,3); } } }
// the HUD (everyone in the gym), the move pad (only the two fighters)
function bxHudDraw(){ const S=BXS.s, hud=$id('boxhud'), pad=$id('boxpad'); const show = !!S && curRoom==='gym' && joined;
  hud.style.display = show ? 'block' : 'none'; document.body.classList.toggle('padtop', show || (isHunt(curRoom) && joined)); document.body.classList.toggle('boxing', !!(show && bxMe() && S.phase!=='over'));
  pad.style.display = (show && bxMe() && S.phase!=='over') ? 'flex' : 'none'; if (!show) return;
  const row=(P2,side)=>`<div class="bxf ${side}"><b>${esc(P2.n)}</b><div class="bxbar"><i style="width:${Math.max(0,P2.hp)}%"></i></div><div class="bxst"><i style="width:${Math.max(0,P2.st)}%"></i></div></div>`;
  let mid; if (S.phase==='over') mid = BXS.win ? `${BXS.how==='ko'?'K.O.!':BXS.how==='forfeit'?'FORFEIT':'ON POINTS'}` : 'DRAW'; else if (S.phase==='start') mid='GET READY'; else if (S.phase==='rest') mid=`ROUND ${S.round} NEXT`; else mid=`ROUND ${S.round}/${S.rounds}`;
  hud.querySelector('#bx_row').innerHTML = row(S.a,'a') + `<div class="bxmid"><b>${mid}</b><small>${S.phase==='fight' ? `BEAT ${Math.min(S.beats,S.beat+1)}/${S.beats}` : S.phase==='over' && BXS.win ? esc(BXS.win)+' WINS' : 'VS'}</small></div>` + row(S.b,'b');
  for (const b of pad.querySelectorAll('[data-mv]')) b.classList.toggle('on', BXS.pick===b.dataset.mv); }
function bxTimer(){ const S=BXS.s, el=$id('bx_beat'); if (!S || !el) return; const left=Math.max(0,(S.next||0)-(Date.now()+(typeof SRV_OFF==='number'?SRV_OFF:0))), tot = S.phase==='fight' ? S.ms : S.phase==='rest' ? 3500 : 3000; el.style.width = (S.phase==='over'?0:Math.max(0,Math.min(100,100*left/tot)))+'%'; }
function bxPick(mv){ const side=bxMe(); if (!side || !BXS.s || BXS.s.phase!=='fight') return; BXS.pick=mv; bxHudDraw(); sfxTone(mv==='hook'?220:mv==='jab'?330:mv==='block'?180:440,0.04,'square',0.04); NET.act('box_move',{mv}); }
function bxPlaceMe(side){ const [x,y] = side==='a' ? RING.A : RING.B; me.path=[]; me.moving=false; me.pending=null; me.gx=x; me.gy=y; me.x=x+0.5; me.y=y+0.5; me.d = side==='a' ? 'fr' : 'bl'; me.p='stand'; if (typeof sendPresence==='function') sendPresence(true); }
function bxLeaveRing(side){ const [x,y] = side==='a' ? RING.outA : RING.outB; me.path=[]; me.moving=false; me.gx=x; me.gy=y; me.x=x+0.5; me.y=y+0.5; me.d='fl'; me.p='stand'; if (typeof sendPresence==='function') sendPresence(true); }
NET.handlers.bx = m => { const prevMine = bxMe(); const S=m.s; BXS.s=S;
  if (m.ev==='start'){ BXS.win=null; BXS.how=null; BXS.pays=null; BXS.out=null; BXS.pick=null; const side=bxMe(); if (side){ closeAll(); bxPlaceMe(side); localMsg('Fight! Pick a move every beat: JAB, HOOK, BLOCK or DODGE.'); } }
  if (m.ev==='bell'){ BXFX.bellT=performance.now(); sfxTone(1320,0.25,'triangle',0.06); sfxTone(1320,0.25,'triangle',0.05,0.32); }
  if (m.ev==='beat' && m.out){ BXS.out=m.out; BXS.outT=performance.now(); BXS.pick=null;
    for (const [side,o] of [['a','b'],['b','a']]){ const R=m.out[side], Q=m.out[o]; if (!R) continue;
      if (Q && Q.took){ const kind = R.mv==='dodge' ? 'counter' : R.mv; const W=BX_WORDS[kind]||BX_WORDS.jab; BXFX.bursts.push({side:o, txt:W[Math.floor(Math.random()*W.length)], kind: kind==='hook'||kind==='counter' ? 'big' : 'hit', t:performance.now(), ox:0, star: kind==='hook'||kind==='counter'});
        const L = o==='b' && S.b.bot ? BOT_LL : (S[o].n===String(me.n||'').toUpperCase() ? me : [...others.values()].find(q=>String(q.n||'').toUpperCase()===S[o].n)); if (L) L.flinch=performance.now()+260; }
      if (R.mv==='block' && Q && (Q.mv==='jab') && !R.took) BXFX.bursts.push({side, txt:'BLOCKED!', kind:'block', t:performance.now(), ox:0});
      if (R.mv==='dodge' && Q && Q.mv==='hook') BXFX.bursts.push({side, txt:'WHOOSH!', kind:'whoosh', t:performance.now(), ox:side==='a'?-16:16, oy:16});
      if (R.mv==='hook' && Q && Q.mv==='jab') BXFX.bursts.push({side, txt:'CUT OFF!', kind:'cut', t:performance.now(), ox:0, oy:-6}); }
    if (m.out.a.took || m.out.b.took) sfxTone(110,0.08,'square',0.06); }
  if (m.ev==='end'){ BXS.win=m.win; BXS.how=m.how; BXS.pays=m.pays; BXS.endT=performance.now(); BXFX.bellT=performance.now(); sfxTone(1320,0.3,'triangle',0.06); sfxTone(1320,0.3,'triangle',0.05,0.35); sfxTone(1320,0.3,'triangle',0.05,0.7);
    localMsg(m.win ? `${m.win} wins ${m.how==='ko'?'by KNOCKOUT':m.how==='forfeit'?'(the other llama left)':'on points'}!` : 'It\'s a DRAW!'); }
  if (m.ev==='clear' && prevMine) bxLeaveRing(prevMine);
  if (S && S.b.bot){ BOT_LL.c = S.b.bot==='champ' ? 'duke' : 'rusty'; BOT_LL.n = S.b.n; BOT_LL.w = {}; }
  bxHudDraw(); if ($id('boxbox').style.display==='block') boxDraw(); };
NET.handlers.bxpay = m => { if (Number.isFinite(m.tk)) tkSet(m.tk); localMsg(m.practice ? 'Practice fight: no tokens this time.' : m.earned ? `+${m.earned} TOKENS from the fight!${m.capped?' (that\'s today\'s boxing max)':''}` : m.capped ? 'You hit today\'s boxing token max.' : 'Good fight! No tokens this time.'); };
NET.handlers.bxinv = m => { const el=$id('bxinv'); $id('bxi_t').textContent=`${m.from} challenges you to a boxing match!`; el.style.display='flex'; el.dataset.from=m.from; clearTimeout(el._t); el._t=setTimeout(()=>{ el.style.display='none'; }, m.ms||15000); sfxTone(880,0.08,'square',0.05); sfxTone(1180,0.08,'square',0.05,0.1); };
$id('bxi_yes').addEventListener('click', ()=>{ const el=$id('bxinv'); el.style.display='none'; NET.act('box_answer',{yes:1}).then(r=>{ if (r && !r.ok) localMsg(r.msg||'That challenge ran out.'); }); });
$id('bxi_no').addEventListener('click', ()=>{ const el=$id('bxinv'); el.style.display='none'; NET.act('box_answer',{yes:0}); });
for (const b of document.querySelectorAll('#boxpad [data-mv]')) b.addEventListener('click', ()=>bxPick(b.dataset.mv));
$id('bx_quit').addEventListener('click', ()=>{ const q=$id('bx_quit'); if (!q.classList.contains('sure')){ q.classList.add('sure'); q.textContent='SURE?'; setTimeout(()=>{ q.classList.remove('sure'); q.textContent='QUIT'; }, 2500); return; } NET.act('box_quit'); });
const BXUI = { info:null };
function openBox(){ if (!joined) return; if (curRoom!=='gym'){ showSwap('gym'); return; } closeAll(); $id('boxbox').style.display='block'; boxDraw(); NET.act('box_info').then(r=>{ if (r && r.ok){ BXUI.info=r; if (r.s && !BXS.s) BXS.s=r.s; boxDraw(); } }); }
function boxDraw(){ const el=$id('bx_body'), I=BXUI.info, S=BXS.s; let h='';
  if (S && S.phase!=='over') h+=`<div class="bxnow"><b>${esc(S.a.n)} <span>VS</span> ${esc(S.b.n)}</b><small>Fight on! Watch from ringside, you can box after this one.</small></div>`;
  else { h+=`<div class="bxh">SPAR WITH A BOT</div><div class="bxbots">
      <button class="bxbot" data-bot="rookie"><canvas width="44" height="56" data-bxc="rusty"></canvas><b>ROOKIE RUSTY</b><small>EASY · WIN ${I?I.pay.rookie:3} 🪙</small></button>
      <button class="bxbot" data-bot="champ"><canvas width="44" height="56" data-bxc="duke"></canvas><b>CHAMP DUKE</b><small>HARD · READS YOUR MOVES · WIN ${I?I.pay.champ:8} 🪙</small></button></div>`;
    const near=[...others.values()].filter(o=>sameRoom(o) && !o.leaving && o.n); h+=`<div class="bxh">CHALLENGE A LLAMA</div>`;
    h+= near.length ? `<div class="bxppl">${near.slice(0,12).map(o=>`<div class="bxp"><span>${esc(String(o.n).toUpperCase())}</span><button class="gbbtn y" data-chal="${esc(String(o.n).toUpperCase())}">CHALLENGE</button></div>`).join('')}</div><small class="bxnote">Winner gets ${I?I.pay.win:10} 🪙, loser ${I?I.pay.lose:2} 🪙 (3 paid fights a day against the same llama).</small>` : `<small class="bxnote">Nobody else is in the gym right now. Bring a friend!</small>`; }
  h+=`<div class="bxh">HOW TO BOX</div><div class="bxrules"><div><b>JAB</b> beats <b>DODGE</b></div><div><b>DODGE</b> beats <b>HOOK</b></div><div><b>HOOK</b> beats <b>BLOCK</b></div><div><b>BLOCK</b> beats <b>JAB</b></div></div><small class="bxnote">Pick a move every beat. A JAB also cuts a HOOK short. Hooks hit hardest but tire you out; BLOCK gets your breath back. 3 rounds, or a knockout.</small>`;
  if (I) h+=`<div class="bxrec">YOUR RECORD <b>${I.me.wins}W · ${I.me.losses}L · ${I.me.draws}D · ${I.me.kos} KO</b> · TODAY <b>${I.me.earned}/${I.me.cap}</b> 🪙</div>`;
  el.innerHTML=h; iconize(el);
  for (const c of el.querySelectorAll('canvas[data-bxc]')){ const x=c.getContext('2d'); x.imageSmoothingEnabled=false; x.clearRect(0,0,44,56); const s=sprite(c.dataset.bxc,'fr',0,'stand',{hands:c.dataset.bxc==='duke'?'gloves_b':'gloves', legs:c.dataset.bxc==='duke'?'shorts':'shorts_r'}); x.drawImage(s,8,6); }
  for (const b of el.querySelectorAll('[data-bot]')) b.addEventListener('click', ()=>NET.act('box_bot',{bot:b.dataset.bot}).then(r=>{ if (r && !r.ok) localMsg(r.msg||'The ring is busy.'); }));
  for (const b of el.querySelectorAll('[data-chal]')) b.addEventListener('click', ()=>NET.act('box_invite',{n:b.dataset.chal}).then(r=>{ localMsg((r&&r.msg)||(r&&r.ok?'Challenge sent!':'That didn\'t work.')); if (r && r.ok) closeAll(); })); }
setInterval(()=>{ if (BXS.s && curRoom==='gym') bxTimer(); }, 50);

// ======================= TREASURE COVE: detector and digging =======================
const CVS = { heat:-1, last:0, on:true, digT:0, dig:null, digs:[], earned:0, cap:40 };
const HEAT_TXT = ['COLD','COOL','WARM','HOT!','RIGHT HERE!'], HEAT_COL=['#5ab0ff','#7ce0d8','#ffd23f','#ff8a48','#ff4a6a'];
function coveHud(){ const el=$id('covepad'), show = isHunt(curRoom) && joined; el.style.display = show ? 'flex' : 'none'; document.body.classList.toggle('padtop', show || $id('boxhud').style.display==='block'); if (!show) return;
  const h=CVS.heat; $id('cv_heat').innerHTML = [0,1,2,3,4].map(i=>`<i style="background:${i<=h?HEAT_COL[Math.max(0,h)]:'#2a2440'}"></i>`).join(''); $id('cv_txt').textContent = h<0 ? (CVS.on?'SCANNING...':'DETECTOR OFF') : HEAT_TXT[h]; $id('cv_txt').style.color = h<0?'#fff':HEAT_COL[h];
  $id('cv_tod').textContent=`TODAY ${CVS.earned}/${CVS.cap}`; $id('cv_det').classList.toggle('on', CVS.on); }
function coveTick(){ if (!isHunt(curRoom) || !joined || !CVS.on || CVS.dig) return; const now=performance.now(); if (now-CVS.last<1400) return; CVS.last=now;
  NET.act('cove_scan').then(r=>{ if (!r || !r.ok) return; CVS.heat=r.heat; coveHud(); if (r.heat>0) sfxTone([0,330,440,620,880][r.heat],0.05,'square',0.035+r.heat*0.004); if (r.heat>=3) sfxTone([0,330,440,620,880][r.heat],0.05,'square',0.035,0.09); }); }
setInterval(coveTick, 250);
function coveDig(){ if (!isHunt(curRoom) || CVS.dig) return; if (me.moving){ localMsg('Stop walking to dig.'); return; } if (me.p==='sit'){ localMsg('Stand up to dig.'); return; }
  const x=me.gx, y=me.gy; if (!huntDigT(x,y)){ localMsg('You can\'t dig here. Find some open sand!'); return; }
  CVS.dig={x,y,t:performance.now(), me:true}; sfxTone(160,0.06,'square',0.03); if (typeof sendPresence==='function') sendPresence(true);   /* the server checks you're standing there */
  NET.act('cove_dig',{x,y}).then(r=>{ setTimeout(()=>{ CVS.dig=null; if (!r || !r.ok){ localMsg((r&&r.msg)||'The sand\'s too hard here.'); return; }
    if (Number.isFinite(r.tk)) tkSet(r.tk); if (r.furn) WD.furn=r.furn;
    if (r.found){ CVS.earned+=r.pay||0; const nm={coins:'a pouch of coins',gold:'a pile of gold',gem:'a sparkling gem',chest:'a PIRATE CHEST',idol:'a GOLDEN IDOL'}[r.found]||'treasure';
      localMsg(r.item ? `You dug up ${r.item==='gidol'?'a GOLDEN IDOL':'a PIRATE CHEST'}! It's in your INVENTORY > ITEMS.${r.pay?` (+${r.pay} TOKENS)`:''}` : `You dug up ${nm}! ${r.pay?`+${r.pay} TOKENS`:'(that\'s today\'s cove max)'}`); sfxTone(660,0.08,'square',0.05); sfxTone(880,0.08,'square',0.05,0.09); sfxTone(1320,0.14,'square',0.05,0.18); }
    else localMsg(r.junk ? `Just ${r.junk}. Keep looking!` : 'Nothing but sand. Keep looking!');
    CVS.heat=-1; CVS.last=0; coveHud(); }, 1100); }); }
NET.handlers.cv = m => { COVEH.set(m.x+','+m.y, {t:Date.now(), f:m.f?1:0}); const mine = String(me.n||'').toUpperCase()===m.n; if (!mine) CVS.digs.push({n:m.n, x:m.x, y:m.y, t:performance.now(), f:m.f, find:m.find}); if (!mine && m.f) localMsg(`${m.n} dug up ${{coins:'some coins',gold:'a pile of gold',gem:'a gem',chest:'a PIRATE CHEST',idol:'a GOLDEN IDOL'}[m.find]||'treasure'}!`); };
function enterCove(){ CVS.heat=-1; CVS.last=0; NET.act('cove_info').then(r=>{ if (!r || !r.ok) return; COVEH.clear(); const now=Date.now(); for (const [x,y,f] of r.holes||[]) COVEH.set(x+','+y,{t:now-60000,f}); CVS.earned=r.earned; CVS.cap=r.cap; coveHud(); }); coveHud(); }
// shovel and flying sand while someone digs (you, or anyone else in the cove)
function drawCoveDigs(t){ const now=performance.now(), list=[]; if (CVS.dig) list.push({x:me.x,y:me.y,t:CVS.dig.t}); for (let i=CVS.digs.length-1;i>=0;i--){ const d=CVS.digs[i]; if (now-d.t>1200){ CVS.digs.splice(i,1); continue; } const o=[...others.values()].find(q=>String(q.n||'').toUpperCase()===d.n); if (o) list.push({x:o.x,y:o.y,t:d.t,f:d.f}); }
  for (const d of list){ const [sx,sy]=P(d.x,d.y), u=(now-d.t)/1100, ph=(now-d.t)/180, X=Math.round(sx)+10, Y=Math.round(sy)-12+Math.round(Math.sin(ph*Math.PI)*-4);
    g.fillStyle=INK; g.fillRect(X-1,Y-14,3,16); g.fillStyle='#b07a44'; g.fillRect(X,Y-13,1,14); g.fillStyle=INK; g.fillRect(X-3,Y+1,7,6); g.fillStyle='#c8ccd8'; g.fillRect(X-2,Y+2,5,4); g.fillStyle='#8a8ea0'; g.fillRect(X+1,Y+2,2,4); g.fillStyle=INK; g.fillRect(X-2,Y-16,5,2);
    for (let k=0;k<5;k++){ const a=(ph*1.7+k*1.25)%1; g.fillStyle=k%2?'#e2c488':'#f2dca6'; g.fillRect(Math.round(sx)+4+k*2-Math.round(a*8), Math.round(sy)-2-Math.round(Math.sin(a*Math.PI)*10), 2, 2); }
    if (d.f && u>0.7){ const k2=(u-0.7)/0.3; g.fillStyle='#fff6a0'; for (let k=0;k<6;k++){ const a=k*1.05+u*3; g.fillRect(Math.round(sx+Math.cos(a)*8*k2), Math.round(sy-6+Math.sin(a)*5*k2-k2*10), 2, 2); } } } }
// taps in the gym: the ring or the bell opens the boxing panel, a heavy bag gets punched, fighters stay put
function gymPointer(e){ const lx=e.clientX/S, ly=e.clientY/S;
  for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } break; } }
  if (bxMe() && BXS.s && BXS.s.phase!=='over'){ localMsg('You\'re in a fight! Use the move buttons.'); return; }
  for (const f of FURN) if (f.t==='hbag'){ const [bx,by]=P(f.gx+0.5,f.gy+0.5); if (Math.abs(lx-bx)<=10 && ly>=by-62 && ly<=by+3){ f.hitT=performance.now(); sfxTone(90,0.09,'square',0.06); sfxTone(70,0.08,'triangle',0.05,0.04); if (Math.max(Math.abs(me.gx-f.gx),Math.abs(me.gy-f.gy))>1){ const sp=[[f.gx+1,f.gy],[f.gx,f.gy+1],[f.gx+1,f.gy+1]].find(([x,y])=>walkable(x,y)); if (sp) walkTo(sp[0],sp[1]); } return; } }
  const [gx,gy]=toGrid(e.clientX, e.clientY), [rx,ry]=toGrid(e.clientX, e.clientY+RING.H*S);
  if (inRing(rx,ry) || inRing(gx,gy) || (gx===10 && gy===8)){ openBox(); return; }
  if (gx<0||gy<0||gx>=N||gy>=NY) return;
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const s2 of SEATS){ const d=Math.abs(s2.gx-gx)+Math.abs(s2.gy-gy); if(d<=1 && d<bd){ bd=d; best=s2; } } if (best) walkTo(best.gx,best.gy); }
function covePointer(e){ const lx=e.clientX/S, ly=e.clientY/S;
  for (let i=llamaHits.length-1;i>=0;i--){ const h=llamaHits[i]; if (lx>=h.x0&&lx<=h.x1&&ly>=h.y0&&ly<=h.y1){ if(h.id){ openPlayerMenu(h.id, e.clientX, e.clientY); return; } break; } }
  if (CVS.dig) return; const [gx,gy]=toGrid(e.clientX, e.clientY); if (gx<0||gy<0||gx>=N||gy>=NY) return;
  if (walkable(gx,gy)){ walkTo(gx,gy); return; }
  let best=null, bd=1e9; for (const [dx,dy] of DIRS8){ const x=gx+dx, y=gy+dy; if (walkable(x,y)){ const d=Math.abs(x-me.gx)+Math.abs(y-me.gy); if (d<bd){ bd=d; best=[x,y]; } } } if (best) walkTo(best[0],best[1]); }
$id('cv_det').addEventListener('click', ()=>{ CVS.on=!CVS.on; CVS.heat=-1; coveHud(); });
$id('cv_dig').addEventListener('click', ()=>{ ensureAudio(); coveDig(); });
iconize($id('boxpad')); iconize($id('covepad')); iconize($id('bxinv'));
NET.handlers.seattaken = m => { if (me.p==='sit'){ me.p='stand'; me.d='f'+me.d[1]; sendPresence(true); } localMsg("Someone's already sitting there."); };
NET.handlers.prinvited = m => localMsg(`🏠 ${String(m.by).toUpperCase()} invited you to ${m.name}! Find it in 🏠 ROOMS.`);
const KNQ=[];   // knocks waiting for the owner to answer
NET.handlers.knock = m => { KNQ.push(m); knShow(); try{ ensureAudio(); if (actx){ const o=actx.createOscillator(), gn=actx.createGain(); o.frequency.value=520; gn.gain.value=0.06*(svol/100); o.connect(gn); gn.connect(actx.destination); o.start(); o.stop(actx.currentTime+0.12); } }catch(_){} };
function knShow(){ const el=$id('knockbox'); if (!KNQ.length){ el.style.display='none'; return; } $id('kn_t').textContent=`${String(KNQ[0].n).toUpperCase()} is knocking on your room!`; el.style.display='flex'; }
function knAnswer(yes){ const k=KNQ.shift(); if (k) NET.act('pr_answer',{uid:k.uid, yes, rid:k.room}); knShow(); }
$id('kn_yes').addEventListener('click', e=>{ e.stopPropagation(); knAnswer(true); });
$id('kn_no').addEventListener('click', e=>{ e.stopPropagation(); knAnswer(false); });

// ---- private messages between friends ----
const DMS = { inbox:[], with:null, unread:0 }; const dmEl=$id('dmbox'), dmMsgs=$id('dm_msgs');
const dmAgo = t => { const s=(Date.now()-t)/1000; return s<60?'now':s<3600?Math.floor(s/60)+'m':s<86400?Math.floor(s/3600)+'h':Math.floor(s/86400)+'d'; };
function dmBadge(){ DMS.unread=DMS.inbox.reduce((n,c)=>n+(c.un||0),0); const b=$id('dm_un'); b.textContent=DMS.unread>99?'99+':DMS.unread; b.classList.toggle('on', DMS.unread>0);
  $id('dmbtn').setAttribute('aria-label', 'Messages' + (DMS.unread ? `: ${DMS.unread} unread` : '')); }
function dmLoad(){ return NET.act('dm_inbox').then(r=>{ if (r.ok){ DMS.inbox=r.inbox; dmBadge(); if (dmEl.style.display==='block' && !DMS.with) dmList(); } }); }
function dmList(){
  DMS.with=null; dmEl.classList.remove('th'); $id('dm_title').textContent='💬 MESSAGES';
  let h=''; const seen=new Set();
  for (const c of DMS.inbox){ seen.add(c.n); h+=`<button class="dmr${c.un?' un':''}" data-n="${esc(c.n)}"><span class="frd${frWhere(c.n)?' on':''}"></span><span class="dmn"><b>${esc(c.n)}</b><small>${c.mine?'You: ':''}${esc(c.last)}</small></span>${c.un?`<span class="dmu">${c.un}</span>`:`<span class="dmt">${dmAgo(c.t)}</span>`}</button>`; }
  if (!DMS.inbox.length) h+='<div class="fre">No messages yet.</div>';
  const rest=FR.friends.filter(n=>!seen.has(n)).sort((a,b)=>(!!frWhere(b))-(!!frWhere(a)) || a.localeCompare(b));
  if (rest.length){ h+='<div class="frh">START A CHAT</div>'; for (const n of rest) h+=`<button class="dmr" data-n="${esc(n)}"><span class="frd${frWhere(n)?' on':''}"></span><span class="dmn"><b>${esc(n)}</b><small>${frWhere(n)?'Online':'Offline'}</small></span></button>`; }
  else if (!FR.friends.length && !DMS.inbox.length) h+='<div class="fre">You can message your friends here. Add friends with the FRIENDS sign or by tapping a llama.</div>';
  $id('dm_list').innerHTML=h;
}
$id('dm_list').addEventListener('click', e=>{ const b=e.target.closest('[data-n]'); if (b){ ensureAudio(); openDM(b.dataset.n); } });
function dmBubble(m){ const d=document.createElement('div'); d.className='bm '+(m.mine?'me':'them'); d.textContent=m.text; d.title=new Date(m.t).toLocaleString(); return d; }
function dmStamp(t){ const d=document.createElement('div'); d.className='bt'; const dt=new Date(t), today=new Date().toDateString()===dt.toDateString(); d.textContent=(today?'':dt.toLocaleDateString([], {month:'short', day:'numeric'})+' · ')+dt.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'}); return d; }
let dmLastT=0;
function dmAppend(m){ if (m.t-dmLastT > 15*60000) dmMsgs.appendChild(dmStamp(m.t)); dmLastT=m.t; const empty=dmMsgs.querySelector('.fre'); if (empty) empty.remove(); dmMsgs.appendChild(dmBubble(m)); dmMsgs.scrollTop=dmMsgs.scrollHeight; }
function openDM(n){
  closeAll(); n=String(n).toUpperCase(); DMS.with=n; dmEl.classList.add('th'); $id('dm_title').textContent=n; $id('dm_note').textContent=''; dmMsgs.innerHTML='<div class="fre">Loading...</div>'; dmLastT=0;
  dmEl.style.display='block';
  NET.act('dm_thread',{n}).then(r=>{ if (DMS.with!==n) return; if (!r.ok){ dmMsgs.innerHTML=`<div class="fre">${esc(r.msg||'Could not load messages.')}</div>`; return; }
    dmMsgs.innerHTML=''; if (!r.msgs.length) dmMsgs.innerHTML=`<div class="fre">Say hi to ${esc(n)}! Only the two of you can see this chat.</div>`;
    for (const m of r.msgs) dmAppend(m);
    $id('dm_form').style.display = r.friend ? '' : 'none'; if (!r.friend) $id('dm_note').textContent='You can only message friends.';
    const c=DMS.inbox.find(c=>c.n===n); if (c){ c.un=0; dmBadge(); }
    if (r.friend && !matchMedia('(pointer:coarse)').matches) $id('dm_in').focus(); });
}
function openMessages(){ closeAll(); dmList(); dmEl.style.display='block'; dmLoad(); }
$id('dm_back').addEventListener('click', ()=>{ dmList(); dmLoad(); });
$id('dm_form').addEventListener('submit', e=>{ e.preventDefault(); const n=DMS.with, inp=$id('dm_in'), text=inp.value.trim(); if (!n||!text) return;
  inp.value=''; NET.act('dm_send',{n, text}).then(r=>{ if (!r.ok){ $id('dm_note').textContent=r.msg||'Not sent. Try again.'; inp.value=inp.value||text; return; } $id('dm_note').textContent='';
    if (DMS.with===n) dmAppend({...r.m, mine:true}); const c=DMS.inbox.find(c=>c.n===n); if (c){ c.last=text; c.t=r.m.t; c.mine=true; } else DMS.inbox.unshift({n, un:0, last:text, t:r.m.t, mine:true}); }); });
$id('dm_in').addEventListener('keydown', e=>e.stopPropagation());
$id('dmbtn').addEventListener('click', ()=>{ ensureAudio(); openMessages(); });
NET.handlers.dm = ({m}) => {
  const from=String(m.from).toUpperCase(); const open = dmEl.style.display==='block' && DMS.with===from;
  let c=DMS.inbox.find(c=>c.n===from); if (!c){ c={n:from, un:0}; DMS.inbox.unshift(c); } else { DMS.inbox.splice(DMS.inbox.indexOf(c),1); DMS.inbox.unshift(c); }
  c.last=m.text; c.t=m.t; c.mine=false;
  if (open){ dmAppend({...m, mine:false}); NET.act('dm_read',{n:from}); }
  else { c.un=(c.un||0)+1; localMsg(`💬 ${from}: ${m.text.length>60?m.text.slice(0,57)+'...':m.text}`); }
  dmBadge(); if (dmEl.style.display==='block' && !DMS.with) dmList(); };

// ---- account sheet (menu > ACCOUNT) and the "add your email" pop-up for older accounts ----
const acctEl=$id('acctbox'), acBody=$id('ac_body');
function acMsg(t, good){ const el=acBody.querySelector('.acmsg'); if (el){ el.textContent=t||''; el.classList.toggle('good', !!good); } }
function acInputs(){ for (const el of acBody.querySelectorAll('input')) el.addEventListener('keydown', e=>e.stopPropagation()); }
function openAccount(ask){
  closeAll(); const a=acct||{}; const mailOn=a.mailOn!==false;
  $id('ac_title').textContent = ask ? '📧 ADD YOUR EMAIL' : '🔐 ACCOUNT';
  if (ask){
    acBody.innerHTML = `<p>Add an email to your llama so you can reset your password if you ever forget it. Other players never see it.</p>
      <input id="ac_e" type="email" autocomplete="email" placeholder="you@example.com" maxlength="254" autocapitalize="off" spellcheck="false">
      <input id="ac_p" type="password" autocomplete="current-password" placeholder="Your password" maxlength="72">
      <div class="acmsg"></div><div class="srow"><button class="gbbtn y" id="ac_save">SAVE EMAIL</button><button class="gbbtn" id="ac_later">LATER</button></div>`;
    $id('ac_later').onclick=()=>{ try{ localStorage.setItem('ll_emailLater', String(Date.now())); }catch(_){} acctEl.style.display='none'; };
  } else {
    const st = !a.email ? '' : !mailOn ? '' : a.emailOk ? '<div class="acst ok">✅ CONFIRMED</div>' : '<div class="acst no">⏳ NOT CONFIRMED YET · <button class="aclink" id="ac_resend">SEND CONFIRM EMAIL AGAIN</button></div>';
    acBody.innerHTML = `<div class="acsec"><div class="ach">LLAMA</div><div class="acv">${esc(me.n||'')}</div></div>
      <div class="acsec"><div class="ach">EMAIL</div><div class="acv">${a.email?esc(a.email):'No email yet. Add one so you can reset your password.'}</div>${st}
        <input id="ac_e" type="email" autocomplete="email" placeholder="${a.email?'New email':'you@example.com'}" maxlength="254" autocapitalize="off" spellcheck="false">
        <input id="ac_p" type="password" autocomplete="current-password" placeholder="Your password" maxlength="72">
        <div class="srow"><button class="gbbtn y" id="ac_save">${a.email?'CHANGE EMAIL':'SAVE EMAIL'}</button></div></div>
      <div class="acsec"><div class="ach">PASSWORD</div>
        <input id="ac_op" type="password" autocomplete="current-password" placeholder="Current password" maxlength="72">
        <input id="ac_np" type="password" autocomplete="new-password" placeholder="New password (8+ characters)" maxlength="72">
        <div class="srow"><button class="gbbtn" id="ac_pw">CHANGE PASSWORD</button></div></div>
      ${me.st ? '<div class="acsec"><div class="ach">🔑 PASSKEY (STAFF LOGIN)</div><div id="ac_pk"><div class="acv">LOADING...</div></div></div>' : ''}
      <div class="acsec"><div class="ach">BLOCKED LLAMAS</div><div id="ac_blocks"><div class="acv">LOADING...</div></div></div>
      <div class="acmsg"></div><div class="srow"><button class="gbbtn" id="ac_close">DONE</button></div>`;
    const drawBlocks=()=>{ const el=$id('ac_blocks'); if (!el) return; const list=[...BLOCKS].sort();
      el.innerHTML = list.length ? list.map(n=>`<div class="acblk"><span>${esc(n)}</span><button class="gbbtn s" data-unb="${esc(n)}">UNBLOCK</button></div>`).join('') : '<div class="acv">Nobody. To block someone, tap their llama and press BLOCK.</div>';
      for (const b of el.querySelectorAll('[data-unb]')) b.addEventListener('click', ()=>{ b.disabled=true; blockDo(b.dataset.unb, false).then(drawBlocks); }); };
    NET.act('block_list').then(r=>{ if (r && r.ok) blocksSet(r.blocks); drawBlocks(); }); if (me.st) pkSection();
    $id('ac_close').onclick=()=>{ acctEl.style.display='none'; };
    $id('ac_pw').onclick=async ()=>{ const o=$id('ac_op').value, n=$id('ac_np').value; if (n.length<8) return acMsg('New passwords need 8+ characters.');
      acMsg('SAVING...'); const r=await apiPost('/api/password',{old:o,p:n}); if (!r.ok) return acMsg(r.error||'That did not work.');
      $id('ac_op').value=''; $id('ac_np').value=''; acMsg('Password changed. Other devices were logged out.', true); };
    const rs=$id('ac_resend'); if (rs) rs.onclick=async ()=>{ acMsg('SENDING...'); const r=await apiPost('/api/verify/resend'); acMsg(r.ok?'Sent! Check your inbox and spam folder.':(r.error||'That did not work.'), r.ok); };
  }
  $id('ac_save').onclick=async ()=>{ const e=$id('ac_e').value.trim(), p=$id('ac_p').value;
    if (!/^\S+@\S+\.\S+$/.test(e)) return acMsg('Enter a real email.'); if (!p) return acMsg('Enter your password to save it.');
    acMsg('SAVING...'); const r=await apiPost('/api/email',{e,p}); if (!r.ok) return acMsg(r.error||'That did not work.');
    acct.email=r.email; acct.emailOk=r.emailOk; acct.mailOn=r.mailOn;
    if (ask){ acctEl.style.display='none'; localMsg(r.mailOn ? 'Email saved! Check your inbox to confirm it.' : 'Email saved!'); }
    else { openAccount(); acMsg(r.mailOn ? 'Saved! Check your inbox to confirm it.' : 'Email saved!', true); } };
  acInputs(); acctEl.style.display='block';
}
// older accounts without an email get the pop-up once they're in a room (LATER hides it for a day)
function maybeAskEmail(){
  if (!acct || acct.email) return;
  let later=0; try{ later=+localStorage.getItem('ll_emailLater')||0; }catch(_){}
  if (Date.now()-later < 864e5) return;
  const t=setInterval(()=>{ if (!joined) return; clearInterval(t);
    setTimeout(()=>{ const busy=[...document.querySelectorAll('.gb.sheet')].some(el=>el.style.display && el.style.display!=='none'); if (!acct.email && !busy) openAccount(true); else if (!acct.email) setTimeout(maybeAskEmail, 20000); }, 2500); }, 1000);
}
function showKicked(msg){ const k=document.getElementById('kicked'); k.textContent=msg; k.style.display='flex'; NET.closedForGood=true; try{ NET.ws&&NET.ws.close(); }catch(e){} }
NET.handlers.tk = m => tkSet(m.tk, m.msg);
// ======================= STAFF DASHBOARD (owner and mods; the server checks every action) =======================
const dashEl=document.getElementById('dashbox'), dsBody=document.getElementById('ds_body');
function dashMenu(){ const el=document.getElementById('mdash'); if (el) el.style.display = me.st ? '' : 'none'; }
const ROOM_SHORT={lounge:'LOUNGE', barn:'ACRES', casino:'CASINO', arena:'ARENA', lanes:'LANES', gym:'GYM', cove:'COVE', jungle:'JUNGLE', store:'STORE', account:'ACCOUNT'};
const esc = s => String(s).replace(/[&<>"']/g, ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const badgeHtml = st => st ? `<span class="badge" title="${st==='owner'?'Owner':'Mod'}">${pix('crown')}</span>` : '<span class="badge"></span>';
function openDash(){ if (!me.st) return; closeAll(); for (const x of document.querySelectorAll('#ds_tabs button')) x.classList.toggle('on', x.dataset.t===dsTab); dsBody.innerHTML='<div class="dl">LOADING...</div>'; dashEl.style.display='block'; loadDash(); }
// BAN pop-up: pick a length in hours or PERMANENT (the server checks who can ban whom and the length again)
const BAN_OPTS=[[1,'1 HOUR',''],[6,'6 HOURS',''],[24,'24 HOURS','1 day'],[72,'72 HOURS','3 days'],[168,'168 HOURS','1 week'],[720,'720 HOURS','30 days'],[0,'PERMANENT','']];
let banName='', banHrs=null;
function openBan(n, preset){ banName=String(n).toUpperCase(); banHrs=null; const box=$id('banbox');
  $id('bn_title').textContent='🔨 BAN '+banName; $id('bn_who').textContent=`How long should ${banName} be banned? They're removed right away and can't log in until it ends.`;
  $id('bn_opts').innerHTML=BAN_OPTS.map(([h,l,sub])=>`<button type="button" data-h="${h}" class="${h?'':'perm'}">${h?'':pix('hammer')}${l}${sub?`<small>${sub}</small>`:''}</button>`).join('');
  const pick=h=>{ banHrs=h; for (const x of $id('bn_opts').querySelectorAll('button')) x.classList.toggle('on', +x.dataset.h===h && $id('bn_hours').value===''); $id('bn_msg').textContent='';
    $id('bn_go').textContent = h===0 ? 'BAN PERMANENTLY' : h ? `BAN FOR ${h} ${h===1?'HOUR':'HOURS'}` : 'BAN'; };
  for (const b of $id('bn_opts').querySelectorAll('button')) b.addEventListener('click', ()=>{ $id('bn_hours').value=''; pick(+b.dataset.h); });
  const hi=$id('bn_hours'); hi.value=''; hi.onkeydown=e=>e.stopPropagation(); hi.oninput=()=>{ const v=Math.floor(+hi.value); pick(hi.value===''?null:(v>=1&&v<=8760?v:NaN)); };
  pick(null); box.classList.remove('sure'); $id('bn_go').disabled=false; $id('bn_yes').disabled=false; box.style.display='block'; if (typeof sheetHead==='function') sheetHead(box);
  if (preset!==undefined){ const known=BAN_OPTS.some(o=>o[0]===preset); if (known) pick(preset); else { hi.value=String(preset); hi.oninput(); } $id('bn_go').click(); } }
$id('bn_cancel').addEventListener('click', ()=>{ $id('banbox').style.display='none'; });
$id('bn_go').addEventListener('click', ()=>{ const m=$id('bn_msg');
  if (banHrs===null){ m.textContent='Pick how long first.'; return; } if (Number.isNaN(banHrs)){ m.textContent='Type a whole number of hours from 1 to 8760.'; return; }
  // are you sure? (same pop-up, so it works the same on phones and computers)
  const len = banHrs===0 ? '<b>PERMANENTLY</b>' : `for <b>${banHrs} ${banHrs===1?'HOUR':'HOURS'}</b>`;
  $id('bn_q').innerHTML=`Ban <b>${esc(banName)}</b> ${len}?`;
  $id('bn_qs').textContent = banHrs===0 ? "They're removed right away and can't come back. Only the owner can undo a permanent ban." : `They're removed right away and can't log in until the ban ends.${banHrs>=24 ? (()=>{ const d=Math.round(banHrs/24*10)/10; return ` That's ${banHrs%24?'about ':''}${d} ${d===1?'day':'days'}.`; })() : ''}`;
  $id('banbox').classList.add('sure'); });
$id('bn_back').addEventListener('click', ()=>{ $id('banbox').classList.remove('sure'); });
$id('bn_yes').addEventListener('click', ()=>{ const m=$id('bn_msg'); const b=$id('bn_yes'); b.disabled=true;
  NET.act('admin',{cmd:'ban', target:banName, hours:banHrs}).then(r=>{ b.disabled=false; if (!r.ok){ $id('banbox').classList.remove('sure'); m.textContent=r.msg||'That did not work.'; return; }
    $id('banbox').style.display='none'; localMsg(r.msg||'Banned.'); if (dashEl.style.display==='block') loadDash(); }); });
function dashDo(cmd, target){
  if (cmd==='give'){ const v=prompt(`How many tokens to give ${target}? (1 to 1000)`, '10'); if (v===null) return; const n=Math.floor(+v); if (!(n>=1 && n<=1000)){ localMsg('Give between 1 and 1000 tokens.'); return; }
    NET.act('admin',{cmd:'give', target, amount:n}).then(r=>{ localMsg(r.msg||(r.ok?'Done.':'That did not work.')); loadDash(); }); return; }
  if (cmd==='ban'){ openBan(target); return; }   // pick how long first
  if ((cmd==='ban'||cmd==='mod'||cmd==='unmod'||cmd==='pkreset') && !confirm(`${{ban:'Ban',mod:'Make',unmod:'Remove',pkreset:'Clear the passkeys of'}[cmd]} ${target}${cmd==='mod'?' a mod':cmd==='unmod'?' as a mod':''}?`)) return;
  NET.act('admin',{cmd, target}).then(r=>{ localMsg(r.msg||(r.ok?'Done.':'That did not work.')); loadDash(); }); }
let dsTab=(['chat','reports','errors'].includes(store.dsTab)?store.dsTab:'players'), dsChat={lines:[], open:null, q:'', more:true}, dsTimer=null;
for (const b of document.querySelectorAll('#ds_tabs button')) b.addEventListener('click', ()=>{ dsTab=b.dataset.t; store.dsTab=dsTab; saveStore(); for (const x of document.querySelectorAll('#ds_tabs button')) x.classList.toggle('on', x===b); dsChat={lines:[], open:null, q:dsChat.q, more:true}; loadDash(); });
function chatWhen(t){ const d=new Date(t), today=new Date().toDateString()===d.toDateString(); return (today?'':d.toLocaleDateString([], {month:'short',day:'numeric'})+' ')+d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'}); }
function loadChatLog(older){
  const before = older && dsChat.lines.length ? dsChat.lines[dsChat.lines.length-1].id : 0;
  NET.act('dash_chat', {q:dsChat.q, before}).then(r=>{
    if (dsTab!=='chat' || dashEl.style.display!=='block') return;
    if (!r.ok){ dsBody.innerHTML=`<div class="dl">${esc(r.msg||'Could not load the chat log.')}</div>`; return; }
    if (older){ dsChat.lines=dsChat.lines.concat(r.lines); } else {
      // keep what was already loaded further back; only refresh the newest lines
      const top = dsChat.lines.length ? dsChat.lines[0].id : 0; const fresh = r.lines.filter(l=>l.id>top);
      dsChat.lines = top ? fresh.concat(dsChat.lines) : r.lines; for (const l of r.lines){ const o=dsChat.lines.find(x=>x.id===l.id); if (o){ o.muted=l.muted; o.banned=l.banned; } } }
    dsChat.more = r.lines.length===80; drawChatLog(r.me);
  }); }
function drawChatLog(meSt){
  const owner = meSt==='owner' || me.st==='owner', myName=(me.n||'').toUpperCase();
  const keepQ = document.activeElement && document.activeElement.id==='ds_q';
  const btn=(label,cmd,name,cls)=>`<button class="gbbtn s ${cls||''}" data-cmd="${cmd}" data-name="${esc(name)}">${label}</button>`;
  let h=`<input class="dsq" id="ds_q" placeholder="Filter by player name" maxlength="12" spellcheck="false" autocapitalize="off" value="${esc(dsChat.q)}">`;
  h+='<div class="dl">Tap a line to mute, kick or ban that player. Newest first.</div>';
  for (const l of dsChat.lines){ const act=l.text.startsWith('* ');
    h+=`<button class="cl${act?' act':''}${l.mu?' mu':''}${dsChat.open===l.id?' open':''}" data-id="${l.id}"><span class="ct">${chatWhen(l.t)} · ${ROOM_SHORT[l.rm]||''}</span>${badgeHtml(l.st)}<b>${esc(l.n)}</b>${act?' ':': '}${esc(act?l.text.slice(2):l.text)}${l.mu?'<span class="tag m">MUTED</span>':''}${l.banned?'<span class="tag">BANNED</span>':''}</button>`;
    if (dsChat.open===l.id){ const can = l.n!==myName && l.st!=='owner' && (owner || l.st!=='mod');
      h+= `<div class="clacts">${can ? (l.muted?btn('UNMUTE','unmute',l.n):btn('MUTE','mute',l.n)) + btn('KICK','kick',l.n,'bad') + (l.banned ? (owner?btn('UNBAN','unban',l.n):'') : btn('BAN','ban',l.n,'bad')) + btn('🪙 GIVE','give',l.n,'gd') + btn('SHOW ONLY '+l.n,'filter',l.n) : `<div class="dl">${l.n===myName?"That's you.":"You can't moderate "+esc(l.n)+'.'}</div>`}</div>`; } }
  if (!dsChat.lines.length) h+=`<div class="dl">${dsChat.q?'NO CHAT FROM PLAYERS STARTING WITH '+esc(dsChat.q.toUpperCase())+'.':'NO CHAT YET.'}</div>`;
  if (dsChat.more && dsChat.lines.length) h+='<div class="srow"><button class="gbbtn" id="ds_older">LOAD OLDER</button></div>';
  const sc=dashEl.scrollTop; dsBody.innerHTML=h; dashEl.scrollTop=sc;
  const q=$id('ds_q'); let qt=null; q.addEventListener('keydown', e=>e.stopPropagation());
  q.addEventListener('input', ()=>{ clearTimeout(qt); qt=setTimeout(()=>{ dsChat={lines:[], open:null, q:q.value.trim(), more:true}; loadChatLog(); }, 350); });
  if (keepQ){ q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  for (const b of dsBody.querySelectorAll('.cl')) b.addEventListener('click', ()=>{ const id=+b.dataset.id; dsChat.open = dsChat.open===id ? null : id; drawChatLog(meSt); });
  for (const b of dsBody.querySelectorAll('[data-cmd]')) b.addEventListener('click', e=>{ e.stopPropagation(); const c=b.dataset.cmd, n=b.dataset.name;
    if (c==='filter'){ dsChat={lines:[], open:null, q:n, more:true}; loadChatLog(); return; }
    dashDo(c, n); });
  const old=$id('ds_older'); if (old) old.addEventListener('click', ()=>loadChatLog(true));
}
// REPORTS tab: player reports with the reported llama's recent chat (attached by the server). Mods never get reports about staff.
const REP_WHY={rude:'Rude or bullying', hate:'Hate speech or slurs', spam:'Spam', scam:'Scam or trade trouble', name:'Bad name, room or outfit', other:'Something else'};
function repBadge(list,bugs){ const n=(list||[]).filter(r=>!r.done).length+(bugs||[]).filter(b=>!b.done).length, b=$id('ds_repn'); if (b){ b.textContent=n?String(n):''; b.style.display=''; b.classList.toggle('on', n>0); } }
function loadReports(){
  NET.act('report_list').then(r=>(r && r.ok && r.me==='owner') ? NET.act('bug_list').then(bl=>{ r.bugs=(bl && bl.ok && bl.bugs) || []; return r; }) : r).then(r=>{ if (dsTab!=='reports' || dashEl.style.display!=='block') { if (r&&r.ok) repBadge(r.reports, r.bugs); return; }
    if (!r.ok){ dsBody.innerHTML=`<div class="dl">${esc(r.msg||'Could not load reports.')}</div>`; return; }
    repBadge(r.reports, r.bugs); const owner=r.me==='owner', myName=(me.n||'').toUpperCase();
    const btn=(label,cmd,name,cls)=>`<button class="gbbtn s ${cls||''}" data-cmd="${cmd}" data-name="${esc(name)}">${label}</button>`;
    const open=r.reports.filter(x=>!x.done).length;
    let h='';
    if (owner && Array.isArray(r.bugs)){   // OWNER ONLY: bug reports from players, at the top
      const bo=r.bugs.filter(b=>!b.done).length; h+=`<h4>🐞 BUG REPORTS (${bo} OPEN)</h4>`;
      for (const b of r.bugs){ const d=new Date(b.t); h+=`<div class="dl bugr${b.done?' done':''}"><b>${esc(b.name)}</b> <small>${d.toLocaleDateString([], {month:'short',day:'numeric'})} ${d.toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})} · ${esc(roomName(b.room)||b.room||'')} · v${esc(b.ver||'?')} · ${esc(b.scr||'')}</small><br>${esc(b.text)}<br><small>${esc(b.ua||'')}</small><br><button class="gbbtn s ${b.done?'':'gd'}" data-bugdone="${b.id}" data-on="${b.done?0:1}">${b.done?'REOPEN':'✓ FIXED'}</button><button class="gbbtn s bad" data-bugdel="${b.id}">DELETE</button></div>`; }
      if (!r.bugs.length) h+='<div class="dl">NO BUG REPORTS.</div>';
      h+='<h4>PLAYER REPORTS</h4>'; }
    h+=`<div class="dl">${open} OPEN. Newest first. Mute, kick or ban right from a report, then mark it handled.${owner?'':' Reports about staff go to the owner.'}</div>`;
    for (const x of r.reports){ const d=new Date(x.t), can = x.n!==myName && x.st!=='owner' && (owner || x.st!=='mod');
      h+=`<div class="rep${x.done?' done':''}"><div class="rh">${badgeHtml(x.st)}<b>${esc(x.n)}</b>${x.muted?' <small>· MUTED</small>':''}${x.banned?' <small>· BANNED</small>':''}<br><small>reported by ${esc(x.by)} · ${chatWhen(x.t)}${x.room?' · '+esc(roomName(x.room)||ROOM_SHORT[x.room]||x.room):''}</small></div>
        <span class="rwhy">${esc(REP_WHY[x.reason]||x.reason)}</span>${x.note?`<div class="rnote">"${esc(x.note)}"</div>`:''}
        <div class="rchat">${x.chat.length ? x.chat.map(l=>`<div><small>${chatWhen(l.t)}</small> ${esc(l.text)}</div>`).join('') : `<div><small>NO CHAT FROM ${esc(x.n)} IN THE 2 HOURS BEFORE THE REPORT.</small></div>`}</div>
        <div class="racts">${can && !x.done ? (x.muted?btn('UNMUTE','unmute',x.n):btn('MUTE','mute',x.n)) + btn('KICK','kick',x.n,'bad') + (x.banned ? '' : btn('BAN','ban',x.n,'bad')) : ''}
          ${x.done ? `<small class="dl">HANDLED${x.doneBy?' BY '+esc(String(x.doneBy).toUpperCase()):''}</small> <button class="gbbtn s" data-rep="${x.id}" data-on="0">REOPEN</button>` : `<button class="gbbtn s gd" data-rep="${x.id}" data-on="1">✓ HANDLED</button>`}</div></div>`; }
    if (!r.reports.length) h+='<div class="dl">NO REPORTS. NICE!</div>';
    const sc=dashEl.scrollTop; dsBody.innerHTML=h; dashEl.scrollTop=sc;
    for (const b of dsBody.querySelectorAll('[data-cmd]')) b.addEventListener('click', ()=>dashDo(b.dataset.cmd, b.dataset.name));
    for (const b of dsBody.querySelectorAll('[data-bugdone],[data-bugdel]')) b.addEventListener('click', ()=>{ if (b.dataset.bugdel && !confirm('Delete this bug report?')) return; b.disabled=true;
      NET.act(b.dataset.bugdel?'bug_del':'bug_done',{bid:+(b.dataset.bugdel||b.dataset.bugdone), done:b.dataset.on==='1'}).then(r2=>{ if (!r2.ok) localMsg(r2.msg||'That did not work.'); loadReports(); }); });
    for (const b of dsBody.querySelectorAll('[data-rep]')) b.addEventListener('click', ()=>{ b.disabled=true; NET.act('report_done',{rpid:+b.dataset.rep, done:b.dataset.on==='1'}).then(r2=>{ if (!r2.ok) localMsg(r2.msg||'That did not work.'); loadReports(); }); });
  }); }
// ERRORS tab: crashes from players' browsers, the same error grouped with a count and who saw it
function errBadge(list){ const day=Date.now()-864e5, n=(list||[]).filter(e=>e.last>day).length, b=$id('ds_errn'); if (b){ b.textContent=n?String(n):''; b.style.display=''; b.classList.toggle('on', n>0); } }
function loadErrors(){ NET.act('err_list').then(r=>{ if (!r || !r.ok){ dsBody.innerHTML=`<div class="dl">${esc((r&&r.msg)||'Could not load errors.')}</div>`; return; } errBadge(r.errs); if (dsTab!=='errors') return;
  let h=`<div class="dl">${r.errs.length ? 'Things that broke in players\' browsers, newest first. The same error from many players shows once with a count.' : 'NO ERRORS REPORTED. NICE!'}</div>`;
  for (const e of r.errs){ h+=`<div class="rep errrow"><div class="rh"><b>${esc(e.msg)}</b><br><small>${e.n} TIME${e.n===1?'':'S'} · ${e.users.length} PLAYER${e.users.length===1?'':'S'} · LAST ${chatWhen(e.last)} · FIRST ${chatWhen(e.first)}</small></div>
    <div class="rnote">${esc((e.src||'?')+':'+e.line)}${e.room?' · ROOM '+esc(ROOM_SHORT[e.room]||e.room):''}${e.ua?' · '+esc(e.ua):''}${e.users.length?'<br>'+esc(e.users.slice(0,12).join(', '))+(e.users.length>12?' and more':''):''}</div>
    ${e.stack?`<details><summary>DETAILS</summary><pre class="errst">${esc(e.stack)}</pre></details>`:''}${r.owner?`<div class="racts"><button class="gbbtn s gd" data-errk="${esc(e.k)}">✓ FIXED, CLEAR</button></div>`:''}</div>`; }
  if (r.owner && r.errs.length>1) h+='<div class="srow"><button class="gbbtn s" id="err_all">CLEAR ALL</button></div>';
  dsBody.innerHTML=h; if (r.owner) loadHealth();
  for (const b of dsBody.querySelectorAll('[data-errk]')) b.addEventListener('click', ()=>{ b.disabled=true; NET.act('err_clear',{k:b.dataset.errk}).then(loadErrors); });
  const all=$id('err_all'); if (all) all.addEventListener('click', ()=>{ if (!confirm('Clear every error?')) return; NET.act('err_clear',{}).then(loadErrors); }); }); }
// OWNER ONLY: how the server is doing. Sits at the top of the ERRORS tab.
function loadHealth(){ NET.act('health').then(r=>{ if (!r || !r.ok || dsTab!=='errors' || dashEl.style.display!=='block') return;
  const old=$id('ds_health'); if (old) old.remove();
  const sum=k=>r.rows.reduce((a,x)=>a+(+x[k]||0),0)+(+r.now[k]||0), peak=Math.max(r.now.peak||0, ...r.rows.map(x=>+x.peak||0));
  const tile=(n,l,bad)=>`<div class="hst${bad?' bad':''}"><b>${n}</b><small>${l}</small></div>`;
  const rooms=Object.entries(r.now.rooms||{}).sort((a,b)=>b[1]-a[1]).map(([k,v])=>`${esc(ROOM_SHORT[k]||roomName(k)||k)} ${v}`).join(' · ');
  // one line per hour for the last 12 hours
  const hrs=new Map(); for (const x of r.rows){ const k=Math.floor(x.t/3600000); let o=hrs.get(k); if (!o) hrs.set(k, o={t:k*3600000, peak:0, acts:0, slow:0, errs:0, dropped:0}); o.peak=Math.max(o.peak,+x.peak||0); o.acts+=+x.acts||0; o.slow+=+x.slow||0; o.errs+=+x.errs||0; o.dropped+=+x.dropped||0; }
  const hr=[...hrs.values()].sort((a,b)=>b.t-a.t).slice(0,12);
  let h=`<h4>SERVER HEALTH</h4><div class="hsts">${tile(r.now.online,'ONLINE NOW')}${tile(peak,'PEAK, 24 HOURS')}${tile(sum('acts'),'ACTIONS, 24 HOURS')}${tile(sum('slow'),'SLOW ACTIONS',sum('slow')>0)}${tile(sum('errs'),'SERVER ERRORS',sum('errs')>0)}${tile(sum('dropped'),'BLOCKED FLOODS')}</div>`;
  if (rooms) h+=`<div class="dl">${rooms}</div>`;
  if (hr.length) h+=dgrid('auto 1fr 1fr 1fr 1fr', ['HOUR','PEAK','ACTIONS','SLOW','ERRORS'], hr.map(x=>`<span>${dgT(x.t)}</span><span class="dgnum">${x.peak}</span><span class="dgnum">${x.acts}</span><span class="dgnum">${x.slow?`<em class="dgbad">${x.slow}</em>`:0}</span><span class="dgnum">${x.errs?`<em class="dgbad">${x.errs}</em>`:0}</span>`));
  else h+='<div class="dl">A sample is saved every 5 minutes while llamas are online. Nothing saved yet.</div>';
  if (r.log.length){ h+='<h4>RECENT SERVER PROBLEMS</h4>'+dgrid('auto auto auto 1fr', ['DATE','TIME','KIND','ACTION'], r.log.map(x=>`<span>${dgD(x.t)}</span><span>${dgT(x.t)}</span><span>${x.kind==='error'?'<em class="dgbad">ERROR</em>':'SLOW'}</span><span class="dgw">${esc(x.what)}${x.ms?` · ${(x.ms/1000).toFixed(1)}s`:''}${x.detail?`<details><summary>DETAILS</summary><pre class="errst">${esc(x.detail)}</pre></details>`:''}</span>`))
    +'<div class="srow"><button class="gbbtn s" id="hl_clear">CLEAR PROBLEMS</button></div>'; }
  h+='<h4>BROWSER ERRORS</h4>';
  const box=document.createElement('div'); box.id='ds_health'; box.innerHTML=h; dsBody.insertBefore(box, dsBody.firstChild);
  const c=$id('hl_clear'); if (c) c.addEventListener('click', ()=>{ c.disabled=true; NET.act('health_clear').then(loadHealth); }); }); }
// dashboard lists as aligned grids: a header row, one row per entry, buttons in their own column (or on a full row under the entry)
const dgD=t=>new Date(t).toLocaleDateString([], {month:'short',day:'numeric'}), dgT=t=>new Date(t).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'});
const dgrid=(cols, heads, rows, wide)=>`<div class="dgrid${wide?' wideacts':''}" style="grid-template-columns:${cols}">${heads.map(h=>`<span class="dgh">${h}</span>`).join('')}${rows.join('')}</div>`;
const dgName=(st,n)=>`<b class="dgn">${badgeHtml(st)}<span>${esc(n)}</span></b>`;
function loadDash(){
  clearInterval(dsTimer); dsTimer=null;
  if (dsTab==='errors'){ dsBody.innerHTML='<div class="dl">LOADING...</div>'; loadErrors(); return; }
  if (dsTab==='reports'){ dsBody.innerHTML='<div class="dl">LOADING...</div>'; loadReports(); return; }
  NET.act('report_list').then(r=>{ if (!r || !r.ok) return; if (r.me==='owner') NET.act('bug_list').then(bl=>repBadge(r.reports, bl && bl.ok ? bl.bugs : [])); else repBadge(r.reports); });   // keep the REPORTS count fresh on the other tabs
  NET.act('err_list').then(r=>{ if (r && r.ok) errBadge(r.errs); });
  if (dsTab==='chat'){ if (!dsChat.lines.length) dsBody.innerHTML='<div class="dl">LOADING...</div>'; loadChatLog();
    dsTimer=setInterval(()=>{ if (dashEl.style.display!=='block' || dsTab!=='chat'){ clearInterval(dsTimer); return; } if (dsChat.open==null && !(document.activeElement && document.activeElement.id==='ds_q')) loadChatLog(); }, 6000); return; }
  NET.act('dash').then(r=>{
    if (!r.ok){ dsBody.innerHTML=`<div class="dl">${esc(r.msg||'Could not load the dashboard.')}</div>`; return; }
    const owner = r.me==='owner'; document.getElementById('ds_title').textContent = `${owner?'OWNER':'MOD'} DASHBOARD`;
    const myName=(me.n||'').toUpperCase(); let h='';
    const btn=(label,cmd,name,cls)=>`<button class="gbbtn s ${cls||''}" data-cmd="${cmd}" data-name="${esc(name)}">${label}</button>`;
    const canAct = (n, st) => n!==myName && st!=='owner' && (owner || st!=='mod');
    h+=`<h4>ONLINE NOW (${r.online.length})</h4>`;
    if (r.online.length) h+=dgrid('auto auto 1fr', ['LLAMA','ROOM','STATUS'], r.online.map(p=>{ const acts = !canAct(p.n,p.st) ? '' : (p.muted?btn('UNMUTE','unmute',p.n):btn('MUTE','mute',p.n)) + btn('KICK','kick',p.n,'bad') + btn('BAN','ban',p.n,'bad') + btn('🪙 GIVE','give',p.n,'gd') + (owner ? (p.st==='mod'?btn('UNMOD','unmod',p.n):btn('MOD','mod',p.n,'gd')) : '');
      return dgName(p.st,p.n)+`<span>${ROOM_SHORT[p.rm]||esc(roomName(p.rm)||'')}</span><span>${p.muted?'<em class="dgbad">MUTED</em>':(p.st?(p.st==='owner'?'OWNER':'MOD'):'')}</span>`+(acts?`<span class="dga">${acts}</span>`:''); }), true);
    if (!r.online.length) h+='<div class="dl">NOBODY ONLINE.</div>';
    if (owner && Array.isArray(r.signups)){   // OWNER ONLY: who made an account (the server never sends this to mods)
      const day=new Date().toDateString(), nToday=r.signups.filter(s2=>new Date(s2.t).toDateString()===day).length;
      h+=`<h4>NEW ACCOUNTS (${nToday} TODAY)</h4>`;
      { const list=r.signups.slice(0,30); if (list.length){ h+=dgrid('auto auto 1fr', ['DATE','TIME','LLAMA'], list.map(s2=>`<span>${dgD(s2.t)}</span><span>${dgT(s2.t)}</span><b class="dgn"><span>${esc(s2.n)}</span></b>`)); } }
      if (!r.signups.length) h+='<div class="dl">NO ACCOUNTS YET.</div>'; }
    h+='<h4>STAFF</h4>';
    h+=dgrid('auto auto 1fr', ['LLAMA','ROLE',''], r.staff.map(p=>{ const st=p.role==='admin'?'owner':'mod'; return dgName(st,p.n)+`<span>${st==='owner'?'OWNER':'MOD'}</span><span class="dga r">${owner&&st==='mod'?btn('RESET PASSKEY','pkreset',p.n)+btn('UNMOD','unmod',p.n):''}</span>`; }));
    if (owner) h+=`<div class="addrow" style="margin-top:4px"><input id="ds_new" maxlength="12" placeholder="PLAYER NAME" spellcheck="false" autocapitalize="off"><button class="gbbtn s gd" id="ds_addmod">MAKE MOD</button></div>`;
    h+=`<h4>MUTED (${r.muted.length})</h4>`;
    if (r.muted.length) h+=dgrid('auto 1fr', ['LLAMA',''], r.muted.map(p=>dgName('',p.n)+`<span class="dga r">${canAct(p.n, p.role==='mod'?'mod':'')?btn('UNMUTE','unmute',p.n):''}</span>`));
    if (!r.muted.length) h+='<div class="dl">NOBODY IS MUTED.</div>';
    h+=`<h4>BANNED (${r.banned.length})</h4>`;
    if (r.banned.length) h+=dgrid('auto auto 1fr', ['LLAMA','UNTIL',''], r.banned.map(p=>dgName('',p.n)+`<span>${p.until ? esc(chatWhen(p.until).toUpperCase()) : '<em class="dgbad">PERMANENT</em>'}</span><span class="dga r">${owner?btn('UNBAN','unban',p.n):''}</span>`));
    if (!r.banned.length) h+='<div class="dl">NOBODY IS BANNED.</div>';
    h+='<h4>🪙 TOKEN GIFTS</h4>'+`<div class="dl">${btn('🪙 GIVE MYSELF TOKENS','give',me.n,'gd')}</div>`;
    { const td=Object.entries(r.giftsToday||{}); h+=`<div class="dl">TODAY: ${td.length ? td.map(([by,n])=>`${esc(by)} gave ${n}`).join(' · ') : 'no gifts yet'}. Mods can give up to ${r.giftCap||500} a day (gifts to themselves count too).</div>`; }
    { const G=(r.gifts||[]).slice(0,30); if (G.length) h+=dgrid('auto auto auto auto auto 1fr', ['DATE','TIME','FROM','TO','TOKENS',''], G.map(gf=>{ const mine=gf.by===(me.n||'').toUpperCase();
      return `<span>${dgD(gf.t)}</span><span>${dgT(gf.t)}</span><b class="dgn"><span>${esc(gf.by)}</span></b><b class="dgn"><span>${esc(gf.to)}</span></b><span class="dgnum dgtok">${gf.n} 🪙</span><span class="dga r">${gf.undo ? `<s>UNDONE</s>` : ((owner||mine) && gf.id ? `<button class="gbbtn s" data-undo="${gf.id}" data-to="${esc(gf.to)}" data-n="${gf.n}">UNDO</button>` : '')}</span>`; })); }
    if (!(r.gifts||[]).length) h+='<div class="dl">NO TOKEN GIFTS YET.</div>';
    h+='<h4>STAFF LOG</h4>';
    const WORD={mute:'muted',unmute:'unmuted',kick:'kicked',ban:'banned',unban:'unbanned',mod:'made a mod:',unmod:'removed mod:',pkreset:'cleared the passkeys of',give:'gave tokens to',undogift:'took back a gift from',roomreset:'reset the room name of', movefurn:'moved', turnfurn:'turned', wfwarn:'warned'};
    if (r.log.length) h+=dgrid('auto auto auto 1fr', ['DATE','TIME','STAFF','ACTION'], r.log.slice(0,20).map(e=>`<span>${dgD(e.t)}</span><span>${dgT(e.t)}</span><b class="dgn"><span>${esc(e.by)}</span></b><span class="dgw">${WORD[e.cmd]||esc(e.cmd)} <b>${esc(e.target)}</b></span>`));
    if (!r.log.length) h+='<div class="dl">NO STAFF ACTIONS YET.</div>';
    if (owner) h+='<h4>💾 BACKUPS</h4><div id="ds_bk" class="dl">LOADING...</div>';
    dsBody.innerHTML=h;
    if (owner) loadBackups();
    for (const b of dsBody.querySelectorAll('[data-cmd]')) b.addEventListener('click', ()=>dashDo(b.dataset.cmd, b.dataset.name));
    for (const b of dsBody.querySelectorAll('[data-undo]')) b.addEventListener('click', ()=>{ if (!confirm(`Take back ${b.dataset.n} TOKENS from ${b.dataset.to}?`)) return; b.disabled=true;
      NET.act('gift_undo',{gid:+b.dataset.undo}).then(r2=>{ localMsg(r2.msg||(r2.ok?'Gift undone.':'Could not undo that.')); loadDash(); }); });
    const add=document.getElementById('ds_addmod'); if (add) add.addEventListener('click', ()=>{ const n=document.getElementById('ds_new').value.trim(); if (n) dashDo('mod', n); });
  }); }
// owner only: the twice-a-day database backups (the server checks it's the owner; these hold emails and password hashes)
function loadBackups(){ const el=$id('ds_bk'); if (!el) return;
  NET.act('backup_list').then(r=>{ if (!r.ok){ el.textContent=r.msg||'Could not load backups.'; return; }
    const kb=n=>n>1048576?(n/1048576).toFixed(1)+' MB':Math.max(1,Math.round(n/1024))+' KB';
    let h='Saved automatically every 12 hours. The newest 4 (2 days) are kept.<br>';
    if (r.list.length) h+=dgrid('auto auto auto auto 1fr', ['DATE','TIME','ROWS','SIZE',''], r.list.map(b=>`<span>${dgD(b.t)}</span><span>${dgT(b.t)}</span><span class="dgnum">${b.rows}</span><span class="dgnum">${kb(b.bytes)}</span><span class="dga r"><button class="gbbtn s gd" data-bk="${b.id}">DOWNLOAD</button></span>`));
    if (!r.list.length) h+='No backups yet. The first one is saved at the next 12:23.<br>';
    h+='<button class="gbbtn s" id="ds_bknow">💾 BACK UP NOW</button>';
    el.innerHTML=h;
    $id('ds_bknow').addEventListener('click', e=>{ e.target.disabled=true; e.target.textContent='SAVING...'; NET.act('backup_now').then(r2=>{ localMsg(r2.msg||(r2.ok?'Backup saved.':'Backup failed.')); loadBackups(); }); });
    for (const b of el.querySelectorAll('[data-bk]')) b.addEventListener('click', async ()=>{ b.disabled=true; b.textContent='...'; let sql='', part=0, parts=1, t=Date.now();
      try { while (part<parts){ const r2=await NET.act('backup_get',{bid:+b.dataset.bk, part}); if (!r2.ok){ localMsg(r2.msg||'Download failed.'); b.disabled=false; b.textContent='DOWNLOAD'; return; } sql+=r2.sql; parts=r2.parts; t=r2.at; part++; }
        const d=new Date(t), pad=n=>String(n).padStart(2,'0'), name=`llama-lounge-backup-${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.sql`;
        const a2=document.createElement('a'); a2.href=URL.createObjectURL(new Blob([sql],{type:'text/plain'})); a2.download=name; document.body.appendChild(a2); a2.click(); setTimeout(()=>{ URL.revokeObjectURL(a2.href); a2.remove(); }, 2000);
        b.textContent='SAVED'; } catch(e){ localMsg('Download failed.'); b.disabled=false; b.textContent='DOWNLOAD'; } }); }); }
document.getElementById('ds_refresh').addEventListener('click', loadDash);
document.getElementById('ds_close').addEventListener('click', ()=>{ dashEl.style.display='none'; });
NET.handlers.tg = m => tgServer(m);
NET.handlers.board = m => { board={hay:lbClean(m.board.hay), dash:lbClean(m.board.dash)}; renderBoard(); };
NET.handlers.hello = m => { if (Number.isFinite(+m.now)) SRV_OFF=(+m.now)-Date.now(); setTimeout(()=>dailyLoad(true), 2500); setTimeout(blocksLoad, 300); setTimeout(()=>{ if (!joined || ($id('roomsbox').style.display==='block' && PRUI.view==='list')) prRefresh(); }, 0);   /* the ROOMS pop-up may have opened before the connection was ready */ if (m.nd){ if (m.nd.rate) ND.rate=m.nd.rate; ndSet(m.nd); } if (m.v && m.v!==GAME_VERSION) setTimeout(()=>localMsg('The game was just updated. Refresh the page to get the newest version.'), 1500); board={hay:lbClean(m.board.hay), dash:lbClean(m.board.dash)}; if (joined) sendPresence(true);
  // load friends, unread messages and the outfit every time we (re)connect
  setTimeout(()=>{ frLoad(); wdLoad(); dmLoad(); }, 150); };
NET.handlers.kick = m => showKicked(m.msg);
// ---- hunger and thirst: the server keeps the real numbers; the page counts them down smoothly in between ----
const ND = { hu:100, th:100, at:performance.now(), rate:{hu:100/(75*60000), th:100/(60*60000)}, warned:{} };
const ndNow = k => Math.max(0, ND[k] - (joined ? (performance.now()-ND.at)*ND.rate[k] : 0));
const ndEmpty = () => joined && (ndNow('hu')<=0 || ndNow('th')<=0);
function ndSet(v){ const before={hu:ndNow('hu'), th:ndNow('th')}; ND.hu=+v.hu; ND.th=+v.th; ND.at=performance.now(); for (const k of ['hu','th']) if (ND[k]>before[k]+5) ND.warned[k]={}; ndUI(); }
function ndUI(){ for (const k of ['hu','th']){ const v=ndNow(k), el=document.getElementById('nd_'+k); if (!el) continue; el.querySelector('b').style.width=Math.max(0,Math.min(100,v))+'%';
    el.className='nd'+(v<=0?' empty low':v<25?' low':v<50?' mid':''); el.title=(k==='hu'?'Hunger ':'Thirst ')+Math.round(v)+'%';
    const W=ND.warned[k]||(ND.warned[k]={}), what=k==='hu'?'hungry':'thirsty', fix=k==='hu'?'Grab food at the bar or a snack in LLAMA ACRES.':'Grab a drink at the bar or cider in LLAMA ACRES.';
    if (joined && v<25 && v>0 && !W.low){ W.low=1; localMsg(`Your llama is getting ${what}! ${fix}`); }
    if (joined && v<=0 && !W.empty){ W.empty=1; localMsg(`Your llama is ${k==='hu'?'starving':'parched'}! It walks slower and games pay half until it ${k==='hu'?'eats':'drinks'}. ${fix}`); } } }
NET.handlers.nd = m => ndSet(m);
setInterval(ndUI, 2000);
NET.handlers.staff = m => { me.st = ['owner','mod'].includes(m.st) ? m.st : ''; dashMenu(); if (m.msg) localMsg(m.msg); };
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

// ======================= SPIT ARENA: 60-second spit-ball rounds =======================
// Solo you face rival llamas that spit back. Everyone who presses PLAY together shares the round and can spit at each other.
// Rival llamas, the golden llama and power-ups all come from the round's seed, so every player sees the same ones.
// A hit on another player only counts when THEIR game confirms it; the server pays tokens and caps them.
const AR = { on:false, phase:'lobby', match:null, off:0, live:null, board:null, me:null, color:'blue', humans:1,
  W:288, H:288, sc:2, t:0, marks:[], last:0, sendT:0, fires:[], events:[], remote:new Map(), bots:[], gold:[], ups:[], spits:[], parts:[], texts:[],
  p:null, shake:0, banner:null, beeps:{}, keys:new Set(), stick:{on:false,id:null,x0:0,y0:0,dx:0,dy:0}, fireHeld:false, mouse:null, result:null, ending:false };
const ARW = AR.W, ARH = AR.H, AR_MINX = 22, AR_MAXX = ARW-22, AR_MINY = 70, AR_MAXY = ARH-14;
const SPIT_COLS = { blue:['#5ab8f0','#c8f0ff'], green:['#48c058','#c8f8b8'], pink:['#f060a8','#ffd0ec'], gold:['#e8a818','#fff0a0'], rainbow:null, fire:null };
const COLOR_NAMES = { blue:'BLUE', green:'GREEN', pink:'PINK', gold:'GOLD', rainbow:'RAINBOW', fire:'FIRE' };
const COLOR_LVL = { blue:1, green:2, pink:4, gold:6, rainbow:8, fire:10 };
function spitCol(col, t, k){
  if (col==='rainbow'){ const h=Math.floor(((t*3+k*0.37)%1)*6); const R=['#ff5050','#ffa030','#ffe040','#50d860','#50a8ff','#b060f0']; return [R[h], '#ffffff']; }
  if (col==='fire'){ return (Math.floor(t*14+k)%2) ? ['#ff6018','#ffe080'] : ['#e82818','#ffb040']; }
  return SPIT_COLS[col] || SPIT_COLS.blue;
}
// ---- deterministic randomness from the round's seed ----
function mulberry(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const arRng = (...k) => mulberry(k.reduce((h,v)=>Math.imul(h^(v|0),2654435761)>>>0, (AR.match?AR.match.seed:1)>>>0));
const DUR = () => AR.match ? AR.match.dur/1000 : 60;
const mtime = () => AR.match ? (Date.now() + AR.off - AR.match.t0)/1000 : -99;
const waveAt = t => Math.max(0, Math.min(3, Math.floor(t/15)));
const botsFor = t => Math.max(2, Math.min(8, 4 + waveAt(t) - (AR.humans-1)));
const FRENZY = 50;
const GOLD_TIMES = [14, 33, 47], UP_TIMES = [6, 15, 24, 33, 42, 51];
const UP_KINDS = ['rapid','triple','shield'];
const UP_INFO = { rapid:{n:'RAPID FIRE', c:'#ff6e3a', i:'🌶'}, triple:{n:'TRIPLE SPIT', c:'#5ad0ff', i:'✳'}, shield:{n:'SHIELD', c:'#ffd23f', i:'🛡'} };
const BOT_NAMES = ['GUS','PEPE','DOLLY','KARL','LULU','BEANS','TACO','MOCHI','RAMONA','NACHO','PANCHO','ZIGGY'];

// ---- DOM: the overlay, HUD, touch controls, and the lobby/results sheet ----
const arEl=document.getElementById('arena'), arCv=document.getElementById('arcv'), arCx=arCv.getContext('2d');
const arBox=document.getElementById('arbox'), arBody=document.getElementById('ar_body');
arCv.width=ARW; arCv.height=ARH;
const arBG=document.createElement('canvas'); arBG.width=ARW; arBG.height=ARH;
function arSize(){ const W=innerWidth, H=innerHeight, touch=matchMedia('(pointer:coarse)').matches; const top=64, bot = touch ? 170 : 24;
  const dpr=devicePixelRatio||1; let sc=Math.min((W-12)/ARW, (H-top-bot)/ARH); sc=Math.max(1, Math.floor(sc*dpr))/dpr; AR.sc=sc;
  arCv.style.width=(ARW*sc)+'px'; arCv.style.height=(ARH*sc)+'px'; arCv.style.left=Math.round((W-ARW*sc)/2)+'px';
  arCv.style.top=Math.round(top + Math.max(0,(H-top-bot-ARH*sc)/2))+'px'; }
addEventListener('resize', ()=>{ if (AR.on) arSize(); });

// arena floor: sand pit, fence, cheering crowd on the bleachers
function buildArBG(){ const c=arBG.getContext('2d'); c.imageSmoothingEnabled=false; const r=mulberry(77);
  c.fillStyle='#1a1430'; c.fillRect(0,0,ARW,ARH);
  // bleachers
  for (let y=0;y<44;y+=8){ c.fillStyle= (y/8)%2 ? '#2a2250' : '#322a5c'; c.fillRect(0,y,ARW,8); c.fillStyle='#1a1430'; c.fillRect(0,y+7,ARW,1); }
  // sand
  for (let y=48;y<ARH;y++) for (let x=0;x<ARW;x++){ const n=r(); c.fillStyle = n<0.06 ? '#d8b878' : n<0.1 ? '#f4e0b0' : (((x>>3)+(y>>3))%2 ? '#ead098' : '#e6ca90'); c.fillRect(x,y,1,1); }
  // painted ring and centre spot
  const cx=ARW/2, cy=(AR_MINY+AR_MAXY)/2+6;
  for (let a=0;a<360;a+=0.5){ const rad=a*Math.PI/180; for (const [rr,col] of [[96,'#f8f0e0'],[94,'#d8304c'],[92,'#d8304c'],[90,'#f8f0e0']]) { c.fillStyle=col; c.fillRect(Math.round(cx+Math.cos(rad)*rr), Math.round(cy+Math.sin(rad)*rr*0.86), 1, 1); } }
  for (let a=0;a<360;a+=2){ const rad=a*Math.PI/180; c.fillStyle='#ff6e96'; c.fillRect(Math.round(cx+Math.cos(rad)*14), Math.round(cy+Math.sin(rad)*12), 2, 2); }
  // wooden fence along the top with posts, and side boards
  c.fillStyle='#8a5426'; c.fillRect(0,44,ARW,10); c.fillStyle='#c88a4a'; c.fillRect(0,45,ARW,4); c.fillStyle='#a86e34'; c.fillRect(0,50,ARW,3); c.fillStyle='#181020'; c.fillRect(0,54,ARW,1);
  for (let x=4;x<ARW;x+=24){ c.fillStyle='#181020'; c.fillRect(x-1,40,6,15); c.fillStyle='#d89a5a'; c.fillRect(x,41,4,13); c.fillStyle='#ffd23f'; c.fillRect(x,40,4,2); }
  for (const x of [0, ARW-6]){ c.fillStyle='#8a5426'; c.fillRect(x,54,6,ARH-54); c.fillStyle='#c88a4a'; c.fillRect(x+1,54,4,ARH-54); }
  c.fillStyle='#8a5426'; c.fillRect(0,ARH-6,ARW,6); c.fillStyle='#c88a4a'; c.fillRect(0,ARH-5,ARW,3);
}
const CROWD = []; { const r=mulberry(9); for (let y=4;y<40;y+=8) for (let x=3;x<ARW;x+=7+Math.floor(r()*4)) CROWD.push({x, y, c:['#ff5c8a','#ffd23f','#5ad0ff','#7ce07c','#f0a060','#c090f0','#e8e8f0'][Math.floor(r()*7)], p:r()*6}); }

// ---- your llama ----
function newMe(){ return { x:ARW/2, y:AR_MAXY-40, d:'br', vx:0, vy:0, cd:0, stun:0, inv:0, shield:0, rapid:0, triple:0, combo:0, comboT:0, mult:1, score:0, hits:0, bestCombo:0, walk:0 }; }
const dirOf = (dx,dy,prev) => (Math.abs(dx)<0.01 && Math.abs(dy)<0.01) ? prev : ((dy>=0?'f':'b') + (dx>=0?'r':'l'));

// ---- rival llamas: path and spit timing all come from the seed ----
function botPlan(i, L, born){ const r=arRng(11, i, L), w=waveAt(born);
  const cid = CHAR_IDS[(i + L) % CHAR_IDS.length], name = BOT_NAMES[(i*5 + L*3) % BOT_NAMES.length];
  const pts=[[AR_MINX + r()*(AR_MAXX-AR_MINX), AR_MINY - 6]]; for (let k=0;k<40;k++) pts.push([AR_MINX+10 + r()*(AR_MAXX-AR_MINX-20), AR_MINY+10 + r()*(AR_MAXY-AR_MINY-20)]);
  const seg = Math.max(0.9, 1.8 - 0.28*w - r()*0.3), fireP = Math.max(0.95, 2.1 - 0.35*w + r()*0.5), first = 0.7 + r()*0.6;
  return { i, L, born, cid, name, pts, seg, fireP, first, alive:true, lastFire:-1, dead:0 }; }
function botPos(b, t){ const u=Math.max(0, t-b.born), k=Math.floor(u/b.seg), f=(u%b.seg)/b.seg, e=f*f*(3-2*f); const a=b.pts[Math.min(k,b.pts.length-1)], c=b.pts[Math.min(k+1,b.pts.length-1)];
  return [a[0]+(c[0]-a[0])*e, a[1]+(c[1]-a[1])*e, c[0]-a[0], c[1]-a[1]]; }
function nextBorn(i, t){ let b=t, guard=0; while (i >= botsFor(b) && guard++<6) b = (waveAt(b)+1)*15; return b; }
function botsInit(){ AR.bots = []; for (let i=0;i<8;i++){ const b0 = nextBorn(i, 0.6 + i*0.8); AR.bots.push({ i, L:0, born:b0, plan:null, alive:false, dead:0 }); } }
function botsTick(t){
  for (const s of AR.bots){
    if (!s.alive && t >= s.born && s.born < DUR()-0.5){ s.alive=true; s.plan=botPlan(s.i, s.L, s.born); }
    if (!s.alive) continue;
    const b=s.plan, [x,y,dx,dy]=botPos(b,t); b.x=x; b.y=y; b.d=dirOf(dx,dy,b.d||'fr'); b.walk = (b.walk||0) + 0.016;
    // fire on schedule at the nearest llama
    const k = Math.floor((t - b.born - b.first)/b.fireP); if (k>=0 && k!==b.lastFire){ b.lastFire=k; botFire(b); }
    const nextF = b.born + b.first + (Math.max(0,k)+(k>=0?1:0))*b.fireP; b.tele = (nextF - t) < 0.4 && (nextF - t) > 0;
  }
}
function targetsFor(fromX, fromY){ const list=[]; if (AR.phase==='play') list.push({x:AR.p.x, y:AR.p.y, vx:AR.p.vx, vy:AR.p.vy, me:true}); for (const o of AR.remote.values()) if (!o.gone) list.push({x:o.x, y:o.y, vx:o.vx||0, vy:o.vy||0}); return list; }
function botFire(b){ const ts=targetsFor(b.x,b.y); if (!ts.length) return; let best=null, bd=1e9; for (const q of ts){ const d=Math.hypot(q.x-b.x,q.y-b.y); if (d<bd){ bd=d; best=q; } }
  if (bd > 220) return; const sp=135 + waveAt(mtime())*16; const lead=0.6*bd/sp; const a=Math.atan2(best.y+(best.vy||0)*lead-b.y, best.x+(best.vx||0)*lead-b.x);   // aims a little ahead of where you're running
  AR.spits.push({ x:b.x, y:b.y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1.6, own:'bot', col:'bot', k:Math.random() });
  sfxSpit(0.22); }
function killBot(i, L, tm, mine){ const s=AR.bots[i]; if (!s || !s.alive || s.L!==L) return false; s.alive=false; s.L=L+1; s.born=nextBorn(i, tm+1.6);
  arBurst(s.plan.x, s.plan.y-14, '#c8f0ff', 10); return true; }

// ---- golden llama: shows up three times a round, runs fast, worth 5 ----
function goldInit(){ AR.gold = GOLD_TIMES.map((t0,n)=>{ const r=arRng(23,n); const pts=[]; for (let k=0;k<16;k++) pts.push([AR_MINX+10+r()*(AR_MAXX-AR_MINX-20), AR_MINY+10+r()*(AR_MAXY-AR_MINY-20)]); return { n, t0, t1:t0+7, pts, seg:0.7, alive:false, done:false, born:t0 }; }); }
function goldTick(t){ for (const G of AR.gold){ if (G.done) continue; if (t>=G.t0 && t<G.t1 && !G.alive){ G.alive=true; arBanner('GOLDEN LLAMA! 5 POINTS', '#ffd23f'); sfxChime([880,1175,1568]); }
  if (G.alive && t>=G.t1){ G.alive=false; G.done=true; } if (!G.alive) continue; const [x,y,dx,dy]=botPos(G,t); G.x=x; G.y=y; G.d=dirOf(dx,dy,G.d||'fr'); } }
// ---- power-ups ----
function upsInit(){ AR.ups = UP_TIMES.map((t0,n)=>{ const r=arRng(31,n); return { n, t0, t1:t0+8, x:AR_MINX+16+r()*(AR_MAXX-AR_MINX-32), y:AR_MINY+16+r()*(AR_MAXY-AR_MINY-32), k:UP_KINDS[Math.floor(r()*3)], got:false }; }); }

// ---- effects ----
function arBurst(x,y,col,n){ for (let i=0;i<n;i++){ const a=Math.random()*Math.PI*2, v=30+Math.random()*70; AR.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v-20,life:0.35+Math.random()*0.3,col}); } }
function floatText(x,y,txt,col){ AR.texts.push({x,y,txt,col,life:1.0}); }
function arBanner(txt,col){ AR.banner={txt,col,t:0}; }
function sfxTone(f, dur, type, vol, delay){ try { if (!sfxReady()) return; const t=actx.currentTime+0.01+(delay||0); const o=actx.createOscillator(), gn=actx.createGain(); o.type=type||'square'; o.frequency.setValueAtTime(f,t);
  gn.gain.setValueAtTime(vol||0.3,t); gn.gain.exponentialRampToValueAtTime(0.0001,t+dur); o.connect(gn); gn.connect(sfxBus); o.start(t); o.stop(t+dur+0.02); } catch(e){} }
function sfxChime(notes){ notes.forEach((f,i)=>sfxTone(f, 0.16, 'square', 0.22, i*0.07)); }

// ---- spitting ----
function myFire(ax, ay, tgt){ const P=AR.p; if (AR.phase!=='play' || P.stun>0 || P.cd>0) return;
  let a; if (tgt){ const d=Math.sqrt((tgt.x-P.x)*(tgt.x-P.x)+(tgt.y-P.y)*(tgt.y-P.y)), lead=d/230; a=Math.atan2((tgt.y+(tgt.vy||0)*lead)-P.y, (tgt.x+(tgt.vx||0)*lead)-P.x); AR.marks.push({q:tgt, life:0.5}); }
  else if (ax!=null){ a=Math.atan2(ay-(P.y-14), ax-P.x); }
  else { // auto-aim: nearest rival in reach, else straight ahead
    let best=null, bd=190; const cands=[]; for (const s of AR.bots) if (s.alive) cands.push(s.plan); for (const G of AR.gold) if (G.alive) cands.push(G); for (const o of AR.remote.values()) if (!o.gone) cands.push(o);
    for (const q of cands){ const d=Math.hypot(q.x-P.x,q.y-P.y); if (d<bd){ bd=d; best=q; } }
    if (best){ const lead=bd/230; const vx=best.vx||0, vy=best.vy||0; a=Math.atan2((best.y+vy*lead)-P.y, (best.x+vx*lead)-P.x); } else { a=Math.atan2(P.d[0]==='f'?1:-1, P.d[1]==='r'?1:-1); } }
  P.d = dirOf(Math.cos(a), Math.sin(a), P.d);
  const angs = P.triple>0 ? [a-0.22, a, a+0.22] : [a];
  for (const g of angs){ const sp=230; const s={ x:P.x, y:P.y, vx:Math.cos(g)*sp, vy:Math.sin(g)*sp, life:0.85, own:'me', col:AR.color, k:Math.random() }; AR.spits.push(s); AR.fires.push([Math.round(s.x),Math.round(s.y),Math.round(s.vx),Math.round(s.vy)]); }
  P.cd = P.rapid>0 ? 0.15 : 0.42; sfxSpit(0.75);
}
function addPoints(base, x, y, label){ const P=AR.p; P.combo++; P.comboT=3.5; P.bestCombo=Math.max(P.bestCombo,P.combo); const newMult=Math.min(5, 1+Math.floor(P.combo/3));
  if (newMult>P.mult){ sfxChime([523*Math.pow(1.122,newMult),659*Math.pow(1.122,newMult)]); floatText(P.x, P.y-52, `COMBO x${newMult}!`, '#ff5c8a'); }
  P.mult=newMult; const fz = mtime()>=FRENZY ? 2 : 1; const pts=base*P.mult*fz; P.score+=pts; P.hits++;
  floatText(x, y-30, `+${pts}${label?' '+label:''}`, fz>1?'#ff5c8a':'#ffd23f'); AR.shake=Math.min(4, AR.shake+1.5); }
function gotHit(by){ const P=AR.p; if (P.inv>0 || AR.phase!=='play') return false;
  if (P.shield>0){ P.shield=0; P.inv=0.6; arBurst(P.x,P.y-16,'#ffd23f',14); floatText(P.x,P.y-50,'BLOCKED!','#ffd23f'); sfxTone(330,0.2,'triangle',0.4); return true; }
  P.stun=0.6; P.inv=1.3; if (P.combo>=3) floatText(P.x,P.y-50,'COMBO LOST','#ff8080'); P.combo=0; P.mult=1; AR.shake=5; sfxSplat(1); sfxTone(150,0.25,'sawtooth',0.25);
  if (by) AR.events.push({k:'h', by}); return true; }
function spitsTick(dt, t){
  const P=AR.p;
  for (let i=AR.spits.length-1;i>=0;i--){ const s=AR.spits[i]; s.x+=s.vx*dt; s.y+=s.vy*dt; s.life-=dt; let gone = s.life<=0 || s.x<AR_MINX-14 || s.x>AR_MAXX+14 || s.y<AR_MINY-24 || s.y>AR_MAXY+10;
    if (!gone && s.own==='me'){
      for (const b of AR.bots){ if (!b.alive) continue; const q=b.plan; if (Math.hypot(q.x-s.x,q.y-s.y)<12){ const L=b.L; if (killBot(b.i, L, t, true)){ AR.events.push({k:'b', i:b.i, L, tm:+t.toFixed(2)}); addPoints(1, q.x, q.y); sfxSplat(0.8); } gone=true; break; } }
      if (!gone) for (const G of AR.gold){ if (!G.alive) continue; if (Math.hypot(G.x-s.x,G.y-s.y)<12){ G.alive=false; G.done=true; AR.events.push({k:'g', n:G.n}); arBurst(G.x,G.y-14,'#ffd23f',22); addPoints(5, G.x, G.y, 'GOLD!'); sfxChime([784,988,1319,1568]); gone=true; break; } }
      if (!gone) for (const o of AR.remote.values()){ if (o.gone || o.inv>0) continue; if (Math.hypot(o.x-s.x,o.y-s.y)<11){ arBurst(s.x,s.y-18,spitCol(AR.color,t,0)[1],8); gone=true; break; } }   // their game decides if it counts
    } else if (!gone && (s.own==='bot' || s.from)){
      if (AR.phase==='play' && Math.hypot(P.x-s.x,P.y-s.y)<10){ if (gotHit(s.from||null)){ arBurst(P.x,P.y-18,'#c8f0ff',12); gone=true; } }
      if (!gone && s.from){ for (const b of AR.bots){ if (b.alive && Math.hypot(b.plan.x-s.x,b.plan.y-s.y)<12){ gone=true; break; } } }
    }
    if (gone){ if (s.life>0) arBurst(s.x, s.y-18, s.own==='bot'?'#c8f0ff':spitCol(s.col,t,s.k)[1], 5); AR.spits.splice(i,1); }
  }
}

// ---- multiplayer: send my moves, apply theirs ----
function arSend(now){ if (AR.phase!=='play' && AR.phase!=='count') return; if (now - AR.sendT < 100) return; AR.sendT=now; const P=AR.p;
  const m={ t:'ar', x:Math.round(P.x), y:Math.round(P.y), d:P.d, sc:P.score, st:P.stun>0?1:0, sh:P.shield>0?1:0 };
  if (AR.fires.length) m.f=AR.fires.splice(0,9); if (AR.events.length) m.e=AR.events.splice(0,8); NET.send(m); }
NET.handlers.ar = m => { if (!AR.on || !AR.match) return; const id=m.from; if (!id || id===(NET.peer||myPeer)) return;
  let o=AR.remote.get(id); if (!o){ o={ x:+m.x||ARW/2, y:+m.y||ARH/2, n:String(m.n||'LLAMA').slice(0,12), c:CHAR_IDS.includes(m.c)?m.c:'twotone', col:SPIT_COLS.hasOwnProperty(m.col)?m.col:'blue', sc:0, d:'fr', inv:0, walk:0 }; AR.remote.set(id,o); }
  o.tx=Math.max(AR_MINX,Math.min(AR_MAXX,+m.x||o.x)); o.ty=Math.max(AR_MINY-8,Math.min(AR_MAXY,+m.y||o.y)); o.d=['fr','fl','br','bl'].includes(m.d)?m.d:o.d; o.sc=Math.max(0,+m.sc||0); o.st=!!m.st; o.sh=!!m.sh; o.seen=performance.now(); o.gone=false;
  if (Array.isArray(m.f)) for (const f of m.f.slice(0,9)){ if (!Array.isArray(f)) continue; const [x,y,vx,vy]=f.map(Number); if (![x,y,vx,vy].every(Number.isFinite) || Math.hypot(vx,vy)>260) continue; AR.spits.push({x,y,vx,vy,life:0.85,own:'them',from:id,col:o.col,k:Math.random()}); sfxSpit(0.3); }
  if (Array.isArray(m.e)) for (const e of m.e.slice(0,8)){ if (!e) continue;
    if (e.k==='b') killBot(+e.i, +e.L, +e.tm||mtime(), false);
    else if (e.k==='g'){ const G=AR.gold[+e.n]; if (G && G.alive){ G.alive=false; G.done=true; arBurst(G.x,G.y-14,'#ffd23f',16); floatText(G.x,G.y-30,`${o.n} GOT IT`,'#ffd23f'); } }
    else if (e.k==='u'){ const U=AR.ups[+e.n]; if (U) U.got=true; }
    else if (e.k==='h' && e.by===(NET.peer||myPeer) && AR.phase==='play'){ addPoints(3, o.x, o.y, 'HIT '+o.n+'!'); sfxSplat(0.9); o.inv=1.3; arBurst(o.x,o.y-18,spitCol(AR.color,performance.now()/1000,0)[1],14); }
    else if (e.k==='h'){ o.inv=1.3; } }
};
NET.handlers.am = m => { AR.live = m.match || null; if (AR.on && AR.match && m.match && m.match.id===AR.match.id){ AR.humans=Math.max(1, m.match.players.length); } if (AR.on && AR.phase==='lobby') arLobby(); };
NET.handlers.ab = m => { AR.board = m.board; };

// ---- the round loop ----
function arenaTick(dt, now){
  if (!AR.on) return; const t=mtime(), P=AR.p; AR.t+=dt;
  if (AR.phase==='count'){ const left=Math.ceil(-t); if (left>0 && left<=3 && !AR.beeps[left]){ AR.beeps[left]=1; sfxTone(440,0.15,'square',0.3); }
    if (t>=0){ AR.phase='play'; arBanner('GO!', '#7ce07c'); sfxTone(880,0.3,'square',0.35); } }
  if (AR.phase==='play'){
    // waves and frenzy announcements
    const w=waveAt(t); if (w>0 && !AR.beeps['w'+w]){ AR.beeps['w'+w]=1; arBanner(`WAVE ${w+1}: FASTER RIVALS`, '#5ad0ff'); sfxChime([392,523,659]); }
    if (t>=FRENZY && !AR.beeps.fz){ AR.beeps.fz=1; arBanner('FRENZY! DOUBLE POINTS', '#ff5c8a'); sfxChime([659,784,988,1319]); }
    if (t>=DUR()-5 && t<DUR()){ const s=Math.ceil(DUR()-t); if (!AR.beeps['e'+s]){ AR.beeps['e'+s]=1; sfxTone(660,0.08,'square',0.2); } }
    // move
    let mx=0, my=0; const K=AR.keys; if (K.has('left')) mx-=1; if (K.has('right')) mx+=1; if (K.has('up')) my-=1; if (K.has('down')) my+=1;
    if (AR.stick.on){ mx=AR.stick.dx; my=AR.stick.dy; }
    const len=Math.hypot(mx,my); if (len>1){ mx/=len; my/=len; }
    const spd = P.stun>0 ? 0 : 92; P.vx=mx*spd; P.vy=my*spd; P.x=Math.max(AR_MINX,Math.min(AR_MAXX,P.x+P.vx*dt)); P.y=Math.max(AR_MINY,Math.min(AR_MAXY,P.y+P.vy*dt));
    if (len>0.15 && P.stun<=0){ P.d=dirOf(mx,my,P.d); P.walk+=dt; }
    P.cd=Math.max(0,P.cd-dt); P.stun=Math.max(0,P.stun-dt); P.inv=Math.max(0,P.inv-dt); P.rapid=Math.max(0,P.rapid-dt); P.triple=Math.max(0,P.triple-dt); P.shield=Math.max(0,P.shield-dt);
    P.comboT-=dt; if (P.comboT<=0 && P.combo>0){ P.combo=0; P.mult=1; }
    if (AR.fireHeld) myFire(AR.mouse?AR.mouse[0]:null, AR.mouse?AR.mouse[1]:null);
    // power-ups
    for (const U of AR.ups){ if (U.got || t<U.t0 || t>U.t1) continue; if (Math.hypot(U.x-P.x,U.y-P.y)<14){ U.got=true; AR.events.push({k:'u', n:U.n}); P[U.k]= U.k==='shield' ? 8 : 6; floatText(P.x,P.y-52,UP_INFO[U.k].n+'!',UP_INFO[U.k].c); sfxChime([523,784,1047]); } }
    if (t>=DUR()) arenaFinish();
  }
  if (AR.phase==='play' || AR.phase==='count'){ botsTick(Math.max(0,t)); goldTick(Math.max(0,t)); }
  spitsTick(dt, Math.max(0,t));
  for (const o of AR.remote.values()){ if (o.tx!=null){ const k=Math.min(1,dt*12); const px=o.x, py=o.y; o.x+=(o.tx-o.x)*k; o.y+=(o.ty-o.y)*k; o.vx=(o.x-px)/Math.max(dt,0.001); o.vy=(o.y-py)/Math.max(dt,0.001); if (Math.hypot(o.vx,o.vy)>8) o.walk+=dt; } o.inv=Math.max(0,(o.inv||0)-dt); if (performance.now()-(o.seen||0)>4000) o.gone=true; }
  for (let i=AR.parts.length-1;i>=0;i--){ const q=AR.parts[i]; q.x+=q.vx*dt; q.y+=q.vy*dt; q.vy+=160*dt; q.life-=dt; if (q.life<=0) AR.parts.splice(i,1); }
  for (let i=AR.texts.length-1;i>=0;i--){ const q=AR.texts[i]; q.y-=22*dt; q.life-=dt; if (q.life<=0) AR.texts.splice(i,1); }
  if (AR.banner){ AR.banner.t+=dt; if (AR.banner.t>1.8) AR.banner=null; }
  AR.shake=Math.max(0, AR.shake-dt*14);
  arSend(now); arDraw(Math.max(0,t)); arHud(t);
}

// ---- drawing ----
const goldCache=new Map();
function goldSprite(cid,dir,fr){ const k=cid+dir+fr; let c=goldCache.get(k); if (!c){ const s=sprite(cid,dir,fr,'stand'); c=document.createElement('canvas'); c.width=s.width; c.height=s.height; const x=c.getContext('2d'); x.drawImage(s,0,0); x.globalCompositeOperation='source-atop'; x.fillStyle='rgba(255,200,40,0.6)'; x.fillRect(0,0,c.width,c.height); goldCache.set(k,c); } return c; }
function arText(c, str, x, y, col, sc, center){ const w=pfW(str,sc||1); const X=center?Math.round(x-w/2):x; pfDraw(c,str,X+1,y+1,'#181020',sc||1); pfDraw(c,str,X,y,col,sc||1); }
function arLlama(c, cid, x, y, d, walk, opts){ const fr = walk>0 ? Math.floor(walk*8)%4 : 0; const im = opts&&opts.gold ? goldSprite(cid,d,fr) : sprite(cid, d, fr, 'stand');
  c.fillStyle='rgba(40,20,10,0.25)'; c.fillRect(Math.round(x-8),Math.round(y-2),16,3); c.fillRect(Math.round(x-6),Math.round(y-3),12,5);
  if (opts && opts.blink && Math.floor(performance.now()/80)%2) return; c.drawImage(im, Math.round(x-SW/2), Math.round(y-SH+2)); }
function arDraw(t){
  const c=arCx; c.imageSmoothingEnabled=false; const sx=AR.shake?Math.round((Math.random()-0.5)*AR.shake*2):0, sy=AR.shake?Math.round((Math.random()-0.5)*AR.shake*2):0;
  c.setTransform(1,0,0,1,sx,sy); c.drawImage(arBG,0,0);
  // crowd bobs, faster when you're on a combo
  const hype = AR.p ? Math.min(5, AR.p.mult) : 1; for (const q of CROWD){ const b = Math.sin(AR.t*(2+hype*1.6)+q.p) > 0.3 ? 1 : 0; c.fillStyle=q.c; c.fillRect(q.x, q.y-b, 3, 3); c.fillStyle='#f0d0b0'; c.fillRect(q.x, q.y-2-b, 3, 2); if (hype>=4 && b && q.p>4.5){ c.fillStyle=q.c; c.fillRect(q.x-1,q.y-5,1,2); c.fillRect(q.x+3,q.y-5,1,2); } }
  // power-ups on the ground
  for (const U of AR.ups){ if (U.got || t<U.t0 || t>U.t1) continue; const bob=Math.round(Math.sin(AR.t*5+U.n)*2), I=UP_INFO[U.k]; const blink = U.t1-t<2 && Math.floor(AR.t*8)%2;
    if (blink) continue; c.fillStyle='rgba(40,20,10,0.25)'; c.fillRect(U.x-6,U.y+2,12,3); c.fillStyle='#181020'; c.fillRect(U.x-7,U.y-12+bob,14,14); c.fillStyle=I.c; c.fillRect(U.x-6,U.y-11+bob,12,12); c.fillStyle='#ffffff'; c.fillRect(U.x-5,U.y-10+bob,3,2);
    c.font='9px sans-serif'; c.textAlign='center'; c.textBaseline='middle'; c.fillText(I.i, U.x, U.y-4+bob); }
  // everyone, back to front
  const ents=[];
  for (const s of AR.bots) if (s.alive) ents.push({y:s.plan.y, f:()=>{ const b=s.plan; arLlama(c, b.cid, b.x, b.y, b.d, b.walk); arText(c, b.name, b.x, b.y-SH-6, '#ff9cb8', 1, true); if (b.tele){ c.fillStyle='#181020'; c.fillRect(b.x+8,b.y-SH-2,5,9); c.fillStyle='#ff3050'; c.fillRect(b.x+9,b.y-SH-1,3,5); c.fillRect(b.x+9,b.y-SH+5,3,2); } }});
  for (const G of AR.gold) if (G.alive) ents.push({y:G.y, f:()=>{ arLlama(c, 'twotone', G.x, G.y, G.d, AR.t, {gold:true}); if (Math.floor(AR.t*10)%3===0){ c.fillStyle='#ffffff'; c.fillRect(G.x-12+Math.random()*24, G.y-40+Math.random()*30, 2, 2); } arText(c, 'GOLDEN', G.x, G.y-SH-6, '#ffd23f', 1, true); }});
  for (const o of AR.remote.values()) if (!o.gone) ents.push({y:o.y, f:()=>{ arLlama(c, o.c, o.x, o.y, o.d, o.walk, {blink:o.inv>0}); if (o.sh) arRing(c,o.x,o.y,'#ffd23f'); arText(c, o.n, o.x, o.y-SH-6, '#e8ecff', 1, true); }});
  if (AR.p && (AR.phase==='play'||AR.phase==='count'||AR.phase==='over')){ const P=AR.p; ents.push({y:P.y, f:()=>{ arLlama(c, me.c, P.x, P.y, P.d, P.vx||P.vy?P.walk:0, {blink:P.inv>0 && P.stun<=0}); if (P.shield>0) arRing(c,P.x,P.y,'#ffd23f');
    if (P.stun>0){ for (let k=0;k<3;k++){ const a=AR.t*6+k*2.1; c.fillStyle='#ffd23f'; c.fillRect(Math.round(P.x+Math.cos(a)*9), Math.round(P.y-SH-2+Math.sin(a)*3), 2, 2); } }
    arText(c, 'YOU', P.x, P.y-SH-6, '#ffd23f', 1, true); c.fillStyle='#ffd23f'; c.fillRect(P.x-1,P.y-SH+2,3,2); }}); }
  ents.sort((a,b)=>a.y-b.y); for (const e of ents) e.f();
  // spits: shadow on the ground, blob at mouth height
  for (const s of AR.spits){ const [a,b]= s.own==='bot' ? ['#90c8e0','#e8f8ff'] : spitCol(s.col, AR.t, s.k); const X=Math.round(s.x), Y=Math.round(s.y);
    c.fillStyle='rgba(40,20,10,0.22)'; c.fillRect(X-2,Y-1,4,2);
    c.fillStyle='#181020'; c.fillRect(X-3,Y-21,6,5); c.fillStyle=a; c.fillRect(X-2,Y-20,4,3); c.fillStyle=b; c.fillRect(X-1,Y-20,2,1);
    if (s.col==='fire' || s.col==='rainbow'){ c.fillStyle=a; c.fillRect(Math.round(X-s.vx*0.025)-1, Math.round(Y-18-s.vy*0.025), 2, 2); c.fillRect(Math.round(X-s.vx*0.05), Math.round(Y-18-s.vy*0.05), 1, 1); } }
  for (const q of AR.parts){ c.fillStyle=q.col; c.fillRect(Math.round(q.x),Math.round(q.y),2,2); }
  for (let i=AR.marks.length-1;i>=0;i--){ const M=AR.marks[i]; M.life-=1/60; if (M.life<=0){ AR.marks.splice(i,1); continue; } const r=8+Math.round((0.5-M.life)*10), x=Math.round(M.q.x), y=Math.round(M.q.y-20);
    c.fillStyle='#ff3050'; c.fillRect(x-r,y-1,4,2); c.fillRect(x+r-3,y-1,4,2); c.fillRect(x-1,y-r,2,4); c.fillRect(x-1,y+r-3,2,4); }
  for (const q of AR.texts){ if (q.life<0.25 && Math.floor(AR.t*20)%2) continue; arText(c, q.txt, q.x, Math.round(q.y), q.col, 1, true); }
  // countdown and banners
  const tt=mtime();
  if (AR.phase==='count'){ const n=Math.ceil(-tt); if (n>0){ const sc=6; arText(c, String(Math.min(n,9)), ARW/2, ARH/2-20, '#ffffff', sc, true); arText(c, AR.humans>1 ? `${AR.humans} LLAMAS IN THIS ROUND` : 'GET READY!', ARW/2, ARH/2+26, '#ffd23f', 1, true); } }
  if (AR.banner){ const B=AR.banner, sc=B.txt.length>12?2:3, y=ARH/2-30; if (B.t<1.5 || Math.floor(B.t*10)%2){ const w=pfW(B.txt,sc)+16; c.fillStyle='rgba(16,10,32,0.75)'; c.fillRect(ARW/2-w/2, y-8, w, 5*sc+16); arText(c, B.txt, ARW/2, y, B.col, sc, true); } }
  if (tt>=FRENZY && AR.phase==='play' && Math.floor(AR.t*4)%2){ c.fillStyle='rgba(255,92,138,0.5)'; c.fillRect(0,0,ARW,2); c.fillRect(0,ARH-2,ARW,2); c.fillRect(0,0,2,ARH); c.fillRect(ARW-2,0,2,ARH); }
  c.setTransform(1,0,0,1,0,0);
}
function arRing(c,x,y,col){ c.fillStyle=col; for (let a=0;a<360;a+=20){ const r=a*Math.PI/180+AR.t*3; c.fillRect(Math.round(x+Math.cos(r)*13), Math.round(y-18+Math.sin(r)*16), 2, 2); } }
function arHud(t){ const P=AR.p; if (!P) return;
  document.getElementById('ar_score').textContent = P.score;
  const left = AR.phase==='count' ? DUR() : Math.max(0, Math.ceil(DUR()-t)); const tm=document.getElementById('ar_time'); tm.textContent = `0:${String(Math.min(59,left)).padStart(2,'0')}`.replace('0:60','1:00'); tm.classList.toggle('low', AR.phase==='play' && left<=10);
  const cb=document.getElementById('ar_combo'); cb.textContent = P.mult>1 ? `x${P.mult}${t>=FRENZY&&AR.phase==='play'?' ×2':''}` : (t>=FRENZY&&AR.phase==='play' ? '×2' : ''); cb.style.display = cb.textContent ? '' : 'none';
  const pw=[]; if (P.rapid>0) pw.push('🌶 '+Math.ceil(P.rapid)); if (P.triple>0) pw.push('✳ '+Math.ceil(P.triple)); if (P.shield>0) pw.push('🛡'); document.getElementById('ar_pow').textContent=pw.join('  ');
  const others=[...AR.remote.values()].filter(o=>!o.gone); const rk=document.getElementById('ar_rank');
  if (others.length){ const all=[{n:'YOU',sc:P.score,me:1},...others.map(o=>({n:o.n,sc:o.sc}))].sort((a,b)=>b.sc-a.sc); rk.innerHTML=all.slice(0,4).map((q,i)=>`<div class="${q.me?'me':''}">${i+1}. ${esc(q.n)} <b>${q.sc}</b></div>`).join(''); rk.style.display=''; } else rk.style.display='none'; }

// ---- input ----
const AR_KEYS = { ArrowLeft:'left', KeyA:'left', ArrowRight:'right', KeyD:'right', ArrowUp:'up', KeyW:'up', ArrowDown:'down', KeyS:'down' };
addEventListener('keydown', e=>{ if (!AR.on) return; if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  e.stopImmediatePropagation(); const k=AR_KEYS[e.code];
  if (k){ e.preventDefault(); AR.keys.add(k); return; }
  if (e.code==='Space' || e.code==='KeyJ' || e.code==='KeyQ'){ e.preventDefault(); if (AR.phase==='play'){ AR.mouse=null; AR.fireHeld=true; myFire(); } return; }   /* starting a round is click-only (PLAY) */
  if (e.code==='Escape'){ e.preventDefault(); arenaClose(); return; } }, true);
addEventListener('keyup', e=>{ if (!AR.on) return; const k=AR_KEYS[e.code]; if (k) AR.keys.delete(k); if (e.code==='Space'||e.code==='KeyJ'||e.code==='KeyQ') AR.fireHeld=false; }, true);
const arToWorld = e => { const r=arCv.getBoundingClientRect(); return [(e.clientX-r.left)/AR.sc, (e.clientY-r.top)/AR.sc]; };
// click or tap a llama to spit at it (a miss spits toward where you clicked)
function arTapTarget(wx, wy){ const cands=[]; for (const s2 of AR.bots) if (s2.alive) cands.push(s2.plan); for (const G of AR.gold) if (G.alive) cands.push(G); for (const o of AR.remote.values()) if (!o.gone) cands.push(o);
  let best=null, bd=1e9; for (const q of cands){ if (Math.abs(wx-q.x)<15 && wy>q.y-50 && wy<q.y+8){ const d=Math.abs(wx-q.x)+Math.abs(wy-(q.y-20))*0.5; if (d<bd){ bd=d; best=q; } } } return best; }
arCv.addEventListener('pointerdown', e=>{ e.preventDefault(); e.stopPropagation(); ensureAudio(); if (AR.phase!=='play') return; const [wx,wy]=arToWorld(e); const q=arTapTarget(wx,wy);
  if (q) myFire(null, null, q); else myFire(wx, wy+14); });
// touch: drag anywhere on the left half to move (a stick appears under your thumb), hold SPIT to fire
const stickEl=document.getElementById('ar_stick'), knobEl=document.getElementById('ar_knob'), fireEl=document.getElementById('ar_fire');
arEl.addEventListener('pointerdown', e=>{ if (!AR.on || e.pointerType!=='touch' || e.target===arCv || e.target===fireEl || fireEl.contains(e.target) || e.target.closest('#arbox,#ar_exit')) return;
  AR.stick={on:true,id:e.pointerId,x0:e.clientX,y0:e.clientY,dx:0,dy:0}; stickEl.style.display='block'; stickEl.style.left=(e.clientX-56)+'px'; stickEl.style.top=(e.clientY-56)+'px'; knobEl.style.transform='translate(0,0)'; e.preventDefault(); });
arEl.addEventListener('pointermove', e=>{ const S2=AR.stick; if (!S2.on || e.pointerId!==S2.id) return; let dx=e.clientX-S2.x0, dy=e.clientY-S2.y0; const L=Math.hypot(dx,dy), R=44; if (L>R){ dx*=R/L; dy*=R/L; } S2.dx=dx/R; S2.dy=dy/R; knobEl.style.transform=`translate(${dx}px,${dy}px)`; });
const stickEnd = e=>{ const S2=AR.stick; if (S2.on && e.pointerId===S2.id){ AR.stick={on:false,id:null,dx:0,dy:0}; stickEl.style.display='none'; } };
arEl.addEventListener('pointerup', stickEnd); arEl.addEventListener('pointercancel', stickEnd);
fireEl.addEventListener('pointerdown', e=>{ e.preventDefault(); e.stopPropagation(); ensureAudio(); AR.mouse=null; AR.fireHeld=true; myFire(); fireEl.classList.add('on'); });
for (const ev of ['pointerup','pointercancel','pointerleave']) fireEl.addEventListener(ev, ()=>{ AR.fireHeld=false; fireEl.classList.remove('on'); });
document.getElementById('ar_exit').addEventListener('click', ()=>arenaClose());

// ---- lobby, joining, results ----
function openArena(){ if (!joined) return; if (curRoom!=='arena'){ showSwap('arena'); return; } closeAll(); if (arcade.on) exitArcade();
  AR.on=true; AR.phase='lobby'; AR.p=null; arEl.style.display='block'; document.body.classList.add('arena-on'); arSize(); if (!arBG.dataset.ok){ buildArBG(); arBG.dataset.ok=1; }
  AR.remote.clear(); AR.spits.length=0; AR.parts.length=0; AR.texts.length=0; AR.bots=[]; AR.gold=[]; AR.ups=[]; AR.match=null;
  arBody.innerHTML='<div class="arload">LOADING...</div>'; arBox.style.display='block'; sendPresence(true);
  NET.act('arena_info').then(r=>{ if (!r.ok){ arBody.innerHTML=`<div class="arload">${esc(r.msg||'Could not load the arena.')}</div>`; return; } AR.me=r.me; AR.board=r.board; AR.live=r.match; if (!AR.colorSet){ AR.color=r.me.color; AR.colorSet=true; } arLobby(); }); }
function arenaClose(silent){ if (!AR.on) return; AR.on=false; AR.phase='lobby'; arEl.style.display='none'; arBox.style.display='none'; document.body.classList.remove('arena-on'); AR.keys.clear(); AR.fireHeld=false; AR.stick.on=false; stickEl.style.display='none';
  if (!silent) sendPresence(true); }
function xpBar(M){ const pct=Math.max(0,Math.min(100,Math.round((M.xp-M.lo)/(M.hi-M.lo)*100))); return `<div class="xpw"><span class="lvl">LV ${M.lvl}</span><div class="xpb"><i style="width:${pct}%"></i></div><span class="xpn">${M.xp-M.lo}/${M.hi-M.lo} XP</span></div>`; }
function colorPicker(M){ return `<div class="cols">${Object.keys(COLOR_LVL).map(k=>{ const ok=M.colors.includes(k); const [a,b]=spitCol(k,0.3,0); const bg = k==='rainbow' ? 'linear-gradient(135deg,#ff5050,#ffe040,#50d860,#50a8ff,#b060f0)' : k==='fire' ? 'linear-gradient(135deg,#e82818,#ff9030,#ffe080)' : `radial-gradient(circle at 35% 35%,${b},${a})`;
  return `<button class="col ${AR.color===k?'on':''} ${ok?'':'lock'}" data-col="${k}" title="${COLOR_NAMES[k]}${ok?'':' (LEVEL '+COLOR_LVL[k]+')'}"><i style="background:${bg}"></i><small>${ok?COLOR_NAMES[k]:'LV '+COLOR_LVL[k]}</small></button>`; }).join('')}</div>`; }
function boardHtml(B){ if (!B || !B.week.length) return '<div class="arnone">No scores this week yet. Be the first!</div>'; const meN=(me.n||'').toUpperCase();
  return `<ol class="arlb">${B.week.map((q,i)=>`<li class="${q.n===meN?'me':''}"><span>${i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}</span><b>${esc(q.n)}</b><em>${q.s}</em></li>`).join('')}</ol>`; }
function liveLine(){ const L=AR.live; if (!L) return ''; const now=Date.now()+AR.off; if (now > L.t0+L.dur-25000) return '';
  const n=L.players.length; return now < L.t0 ? `<div class="arlive">🔴 A round starts in ${Math.max(1,Math.ceil((L.t0-now)/1000))}s with ${n} llama${n>1?'s':''}. Press PLAY to jump in!</div>` : `<div class="arlive">🔴 ${n} llama${n>1?'s are':' is'} playing now, ${Math.ceil((L.t0+L.dur-now)/1000)}s left. Press PLAY to join!</div>`; }
function arLobby(){ const M=AR.me; if (!M) return; AR.phase='lobby';
  const nextBonus = M.playedToday ? 0 : Math.min(5, M.streak+1);
  arBody.innerHTML = `<div class="arh"><div class="art">💦 SPIT ARENA</div><div class="ars">Spit rival llamas, dodge their spit, chain hits for combos. 60 seconds a round.</div></div>
    ${xpBar(M)}
    <div class="arstats"><div><b>${M.best}</b><small>BEST</small></div><div><b>${M.wkBest}</b><small>THIS WEEK</small></div><div><b>🔥 ${M.streak}</b><small>DAY STREAK</small></div><div><b>${M.earnedToday}/${M.cap}</b><small>TOKENS TODAY</small></div></div>
    ${nextBonus ? `<div class="arbonus">🎁 First round today: <b>+${nextBonus} bonus token${nextBonus>1?'s':''}</b>${M.streak?' to keep your streak going':''}!</div>` : `<div class="arbonus done">✅ Daily bonus collected. Come back tomorrow to grow your streak.</div>`}
    ${liveLine()}
    <button class="gbbtn y arplay" id="ar_go">▶ PLAY</button>
    <div class="arsec">SPIT COLOR</div>${colorPicker(M)}
    <div class="arsec">THIS WEEK'S TOP SPITTERS</div>${boardHtml(AR.board)}
    <div class="arhow"><b>HOW TO PLAY</b> ${matchMedia('(pointer:coarse)').matches ? 'Tap a llama to spit at it. Drag below the arena to run. The SPIT button aims for you.' : 'Click a llama to spit at it. WASD or arrows to run. SPACE spits at the nearest llama.'} Rivals flash <b style="color:#e02848">!</b> before they spit. 🌶 rapid fire, ✳ triple spit, 🛡 shield. The golden llama is worth 5. Last 10 seconds: double points.</div>
    <div class="srow"><button class="gbbtn" id="ar_leave">LEAVE</button></div>`;
  arBox.style.display='block'; arWire(); }
function arWire(){ const go=document.getElementById('ar_go'); if (go) go.addEventListener('click', arPlay);
  const lv=document.getElementById('ar_leave'); if (lv) lv.addEventListener('click', ()=>arenaClose());
  for (const b of arBody.querySelectorAll('[data-col]')) b.addEventListener('click', ()=>{ const k=b.dataset.col; if (!AR.me.colors.includes(k)){ localMsg(`Reach arena level ${COLOR_LVL[k]} to unlock ${COLOR_NAMES[k]} spit.`); return; } AR.color=k; for (const x of arBody.querySelectorAll('[data-col]')) x.classList.toggle('on', x.dataset.col===k); sfxSpit(0.6); }); }
function arPlay(){ if (AR.joining) return; AR.joining=true; ensureAudio(); const go=document.getElementById('ar_go'); if (go){ go.disabled=true; go.textContent='JOINING...'; }
  const sent=Date.now(); NET.act('arena_join',{color:AR.color}).then(r=>{ AR.joining=false;
    if (!r.ok){ localMsg(r.msg||'Could not start a round.'); if (AR.me) arLobby(); return; }
    const rtt=Date.now()-sent; AR.off = r.match.now - (sent + rtt/2);
    AR.match=r.match; AR.color=r.color; AR.me=r.me; AR.humans=Math.max(1,r.match.players.length); AR.live=r.match;
    AR.p=newMe(); { const r2=mulberry((Date.now()^ (me.n||'x').length*7919)>>>0); AR.p.x=AR_MINX+30+r2()*(AR_MAXX-AR_MINX-60); }
    AR.remote.clear(); AR.spits.length=0; AR.parts.length=0; AR.texts.length=0; AR.fires.length=0; AR.events.length=0; AR.beeps={}; AR.banner=null; AR.result=null; AR.ending=false;
    botsInit(); goldInit(); upsInit();
    // anything that already happened in a round you joined late
    const t=mtime(); for (const G of AR.gold) if (t>G.t1) G.done=true; for (const U of AR.ups) if (t>U.t1) U.got=true;
    AR.phase = t<0 ? 'count' : 'play'; if (t>=0){ AR.beeps={1:1,2:1,3:1}; for (let w=1; w<=waveAt(t); w++) AR.beeps['w'+w]=1; if (t>=FRENZY) AR.beeps.fz=1; arBanner('JOINED! GO!', '#7ce07c'); }
    arBox.style.display='none'; sendPresence(true); }); }
function arenaFinish(){ if (AR.ending) return; AR.ending=true; AR.phase='over'; AR.fireHeld=false; const P=AR.p;
  arBanner("TIME!", '#ffd23f'); sfxChime([784,659,523,784,1047]);
  // give the last moves a moment to arrive, then ask the server to score the round
  setTimeout(()=>{ NET.send({t:'ar', x:Math.round(P.x), y:Math.round(P.y), d:P.d, sc:P.score}); }, 50);
  setTimeout(()=>{ NET.act('arena_end',{mid:AR.match.id, score:P.score}).then(r=>{ if (!AR.on) return; AR.result=r; if (r.ok){ AR.me=r.me; AR.board=r.board; if (Number.isFinite(r.tk)) tkSet(r.tk); } arResults(r); }); }, 900); }
function arResults(r){ const P=AR.p;
  if (!r.ok){ arBody.innerHTML=`<div class="arh"><div class="art">ROUND OVER</div></div><div class="arbig">${P.score}</div><div class="arload">${esc(r.msg||'')}</div><button class="gbbtn y arplay" id="ar_go">▶ PLAY AGAIN</button><div class="srow"><button class="gbbtn" id="ar_leave">LEAVE</button></div>`; arBox.style.display='block'; arWire(); return; }
  const M=r.me, ord=n=>n+(['th','st','nd','rd'][(n%100-20)%10]||['th','st','nd','rd'][n%100]||'th');
  const lines=[]; const base=r.earned-r.bonus.streak-r.bonus.place;
  if (base>0) lines.push(`<li><span>Score</span><b>+${base}</b></li>`); if (r.bonus.streak) lines.push(`<li><span>🔥 Daily streak bonus</span><b>+${r.bonus.streak}</b></li>`); if (r.bonus.place) lines.push(`<li><span>${r.place===1?'🥇 Winner':'🥈 Runner-up'} bonus</span><b>+${r.bonus.place}</b></li>`);
  arBody.innerHTML = `<div class="arh"><div class="art">${r.players>1 ? (r.place===1 ? '🏆 YOU WON!' : `${ord(r.place)} OF ${r.players}`) : 'ROUND OVER'}</div>
      <div class="ars">${P.hits} hits · best combo ${P.bestCombo}</div></div>
    <div class="arbig" id="ar_count">0</div>
    <div class="arbadges">${r.best?'<span class="bdg gold">⭐ NEW PERSONAL BEST</span>':''}${r.wkBest?'<span class="bdg pink">📈 WEEKLY BEST</span>':''}${r.levelUp?`<span class="bdg blue">⬆ LEVEL ${r.levelUp}!</span>`:''}</div>
    ${r.newColors.length?`<div class="arunlock">🎨 Unlocked <b>${r.newColors.map(c=>COLOR_NAMES[c]).join(', ')}</b> spit!</div>`:''}
    <div class="artok"><div class="artk">+${r.earned} <span>TOKENS</span></div>${lines.length?`<ul>${lines.join('')}</ul>`:''}${r.capped?'<div class="arcap">You hit today\'s arena token limit. Points and XP still count!</div>':''}</div>
    ${xpBar(M)}
    <button class="gbbtn y arplay" id="ar_go">▶ PLAY AGAIN</button>
    <div class="arsec">THIS WEEK'S TOP SPITTERS</div>${boardHtml(r.board)}
    <div class="srow"><button class="gbbtn" id="ar_leave">LEAVE</button></div>`;
  arBox.style.display='block'; arWire(); AR.phase='over';
  // count the score up for a bit of drama
  const el=document.getElementById('ar_count'), goal=r.score, t0=performance.now(); const step=()=>{ const u=Math.min(1,(performance.now()-t0)/900); el.textContent=Math.round(goal*(1-Math.pow(1-u,3))); if (u<1) requestAnimationFrame(step); else if (r.best) sfxChime([1047,1319,1568,2093]); }; step();
  if (r.levelUp) setTimeout(()=>sfxChime([523,659,784,1047,1319]), 600);
  if (r.place===1 && r.players>1) sfxChime([784,988,1175,1568]); }

// ======================= HAY BALE BOWLING (LLAMA LANES) =======================
// You line up, swipe up to bowl (swipe speed = power, curve = hook), and watch it roll in a lane view from behind your llama.
// The page runs the same physics as the server to animate the roll; the server's answer is the one that counts.
const BW = { on:false, phase:'lobby', me:null, board:null, live:[], game:null, x:0, aim:0, spin:0, meter:0, meterOn:false,
  rec:null, recT:0, serverRes:null, standing:[1,1,1,1,1,1,1,1,1,1], camY:-70, swipe:null, toast:null, call:null, pending:false, crashed:false, rolling:0, result:null };
const BWW = 240, BWH = 320, BW_HOR = 70, BW_F = 250, BW_CAMH = 30;
const bwEl=document.getElementById('bowl'), bwCv=document.getElementById('bwcv'), bwCx=bwCv.getContext('2d');
const bwBox=document.getElementById('bwbox'), bwBody=document.getElementById('bw_body');
bwCv.width=BWW; bwCv.height=BWH; const bwImg=bwCx.createImageData(BWW, BWH);
function bwSize(){ const W=innerWidth, H=innerHeight, top=124, bot=matchMedia('(pointer:coarse)').matches?96:56; const dpr=devicePixelRatio||1;
  let sc=Math.min((W-12)/BWW, (H-top-bot)/BWH); sc=Math.max(1, Math.floor(sc*dpr*4)/4)/dpr; BW.sc=sc;
  bwCv.style.width=(BWW*sc)+'px'; bwCv.style.height=(BWH*sc)+'px'; bwCv.style.left=Math.round((W-BWW*sc)/2)+'px'; bwCv.style.top=Math.round(top+Math.max(0,(H-top-bot-BWH*sc)/2))+'px'; }
addEventListener('resize', ()=>{ if (BW.on) bwSize(); });

// ---- the lane, drawn row by row in perspective ----
const hexRGB=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const BWC = { m1:hexRGB('#ecc890'), m2:hexRGB('#e0b878'), seam:hexRGB('#c8a068'), deck:hexRGB('#f6e0b0'), gut:hexRGB('#3a3448'), gut2:hexRGB('#2a2438'), cap:hexRGB('#5a3a7a'), cap2:hexRGB('#4a2c68'),
  foul:hexRGB('#d83048'), arrow:hexRGB('#8a5a28'), dot:hexRGB('#8a5a28'), pit:hexRGB('#120a1c'), app:hexRGB('#d8b47a'), app2:hexRGB('#cca86c'), sky:hexRGB('#1a0f2a') };
function bwFloor(){ const D=bwImg.data, camY=BW.camY, B=BOWL;
  for (let sy=0; sy<BWH; sy++){ const row=sy*BWW*4;
    if (sy<=BW_HOR){ for (let sx=0; sx<BWW; sx++){ const i=row+sx*4; D[i]=BWC.sky[0]; D[i+1]=BWC.sky[1]; D[i+2]=BWC.sky[2]; D[i+3]=255; } continue; }
    const d=BW_CAMH*BW_F/(sy-BW_HOR), y=camY+d, k=d/BW_F;
    for (let sx=0; sx<BWW; sx++){ const x=(sx-BWW/2)*k, ax=x<0?-x:x; let c;
      if (y>B.PIT+18) c=BWC.pit;
      else if (ax<=B.HW){ if (y<0){ c = ((Math.floor(y/30)+100)%2) ? BWC.app : BWC.app2; if (y>-2) c=BWC.foul; }
        else { const bd=(x+B.HW)/1.064, bi=Math.floor(bd); c = bi%2 ? BWC.m1 : BWC.m2; if (bd-bi<0.07) c=BWC.seam;
          if (y<1.4) c=BWC.foul;
          else if (y>B.HEAD-16) c = y>B.PIT ? BWC.pit : BWC.deck;
          else if (y>186 && y<200){ for (const b of [5,10,15,20,25,30,35]){ const bx=-B.HW+(b+0.5)*1.064; if (Math.abs(x-bx) < (200-y)*0.045+0.15){ c=BWC.arrow; break; } } }
          else if (y>82 && y<86){ for (const b of [3,5,8,11,14,25,28,31,34,36]){ const bx=-B.HW+(b+0.5)*1.064; if (Math.abs(x-bx)<0.55){ c=BWC.dot; break; } } } } }
      else if (ax<=B.HW+9.2){ c = ax<B.HW+1 || ax>B.HW+8.2 ? BWC.gut2 : BWC.gut; if (y<0) c=BWC.app2; }
      else { c = (Math.floor(y/48)%2) ? BWC.cap : BWC.cap2; }
      const i=row+sx*4; D[i]=c[0]; D[i+1]=c[1]; D[i+2]=c[2]; D[i+3]=255; } }
  bwCx.putImageData(bwImg,0,0); }
const bwProj = (x,y,z) => { const d=y-BW.camY; if (d<4) return null; return [BWW/2 + x*BW_F/d, BW_HOR + (BW_CAMH-(z||0))*BW_F/d, BW_F/d]; };
// back wall over the pit, with the LLAMA LANES masking panel
function bwBackWall(t){ const p0=bwProj(-34, BOWL.PIT+18, 0), p1=bwProj(34, BOWL.PIT+18, 46); if (!p0||!p1) return; const c=bwCx;
  const x0=Math.round(p0[0]), x1=Math.round(p1[0]), yb=Math.round(p0[1]), yt=Math.round(p1[1]);
  c.fillStyle='#2a1640'; c.fillRect(x0, yt, x1-x0, yb-yt); c.fillStyle='#ff9a48'; c.fillRect(x0, yt, x1-x0, Math.max(1,Math.round((yb-yt)*0.08)));
  const s=p0[2]; if (s>0.45){ const sc=s>1.2?2:1, txt='LLAMA LANES'; const w=pfW(txt,sc); pfDraw(c, txt, Math.round((x0+x1)/2-w/2), Math.round(yt+(yb-yt)*0.35), (Math.floor(t*2)%4)?'#ffd23f':'#ffffff', sc); } }

// ---- llama pins (white, red neck stripe, little ears) ----
// pin width (inches) at a height z: base, belly, neck, head
const PIN_PROFILE = [[0,2.0],[1,3.4],[4.5,4.7],[8,2.4],[10.5,1.8],[13,2.6],[15,0.8]];
const PIN_W = z => { for (let i=1;i<PIN_PROFILE.length;i++){ const [z1,w1]=PIN_PROFILE[i], [z0,w0]=PIN_PROFILE[i-1]; if (z<=z1) return w0+(w1-w0)*(z-z0)/(z1-z0); } return 0.8; };
function bwPin(c, p, t){ const pr=bwProj(p.x, p.y, 0); if (!pr) return; const [sx,sy,s]=pr; const H=15*s;
  if (!p.down){ const h=Math.max(3, Math.round(H)); c.fillStyle='rgba(30,20,40,0.25)'; c.fillRect(Math.round(sx-2.4*s), Math.round(sy-1), Math.round(4.8*s)+1, 2);
    for (let k=0;k<h;k++){ const z=(k/h)*15, w=Math.max(1, Math.round(PIN_W(z)*s)), yy=Math.round(sy-k-1); c.fillStyle = (z>9.3 && z<10.6) ? '#e03048' : (z>8.3 && z<8.9) ? '#e03048' : '#f8f6ee'; c.fillRect(Math.round(sx-w/2), yy, w, 1);
      if (k===0 || k===h-1){ c.fillStyle='#181020'; c.fillRect(Math.round(sx-w/2), yy, w, 1); } }
    // ears
    c.fillStyle='#181020'; const e=Math.max(1,Math.round(s*0.8)); c.fillRect(Math.round(sx-1.4*s), Math.round(sy-h-e), e, e); c.fillRect(Math.round(sx+0.6*s), Math.round(sy-h-e), e, e);
    if (s>0.9){ c.fillStyle='#181020'; c.fillRect(Math.round(sx-0.8*s), Math.round(sy-h+2.2*s), Math.max(1,Math.round(s*0.5)), Math.max(1,Math.round(s*0.5))); c.fillRect(Math.round(sx+0.4*s), Math.round(sy-h+2.2*s), Math.max(1,Math.round(s*0.5)), Math.max(1,Math.round(s*0.5))); }
    return; }
  // knocked down: lying along the way it was knocked
  const dx=p.fx||0, dy=p.fy||1; const L=Math.sqrt(dx*dx+dy*dy)||1, ux=dx/L, uy=dy/L;
  for (let k=0;k<=12;k++){ const u=k/12, z=u*15; const q=bwProj(p.x+ux*z, p.y+uy*z, 2.2); if (!q) continue; const w=Math.max(1,Math.round(PIN_W(z)*q[2]));
    c.fillStyle=(z>8.3&&z<10.6)?'#e03048':'#e8e4d8'; c.fillRect(Math.round(q[0]-w/2), Math.round(q[1]-w/2), w, w); } }
// the hay bale ball
function bwBall(c, x, y, roll, t){ const pr=bwProj(x, y, BOWL.BR); if (!pr) return; const [sx,sy,s]=pr; const r=Math.max(2, BOWL.BR*s);
  const g0=bwProj(x,y,0); if (g0){ c.fillStyle='rgba(30,20,40,0.3)'; c.fillRect(Math.round(sx-r), Math.round(g0[1]-1), Math.round(r*2), 2); }
  for (let yy=-Math.ceil(r); yy<=Math.ceil(r); yy++){ const w=Math.sqrt(Math.max(0,r*r-yy*yy)); if (w<0.5) continue;
    const band = Math.floor((yy/r*3 + roll*0.35)%2+2)%2; c.fillStyle = band ? '#e8b838' : '#d8a028'; c.fillRect(Math.round(sx-w), Math.round(sy+yy), Math.round(w*2), 1);
    c.fillStyle='#a87818'; if (((yy+Math.floor(roll*3))%4+4)%4===0) c.fillRect(Math.round(sx-w), Math.round(sy+yy), Math.round(w*2), 1); }
  c.fillStyle='#fff0a0'; c.fillRect(Math.round(sx-r*0.5), Math.round(sy-r*0.6), Math.max(1,Math.round(r*0.35)), Math.max(1,Math.round(r*0.25)));
  c.strokeStyle='#181020'; c.lineWidth=1; c.beginPath(); c.arc(Math.round(sx)+0.5, Math.round(sy)+0.5, r, 0, Math.PI*2); c.stroke(); }

// ---- per-frame draw ----
function bwPinsNow(){ // standing set, or a frame of the roll's recording
  const home=bowlPins();
  if (BW.rec){ const f=BW.rec[Math.min(BW.rec.length-1, Math.floor(BW.recT*120))]; const out=f[3].map(([i,x,y,hit,pit])=>{ const h=home[i]; return {x,y,down:!!hit||pit, pit:!!pit, fx:x-h[0], fy:y-h[1]}; }); return {pins:out, ball:{x:f[0], y:f[1], gut:f[2]}}; }
  return { pins: home.map((h,i)=>BW.standing[i]?{x:h[0],y:h[1],down:false}:null).filter(Boolean), ball:null }; }
function bwDraw(t){ const c=bwCx; c.imageSmoothingEnabled=false;
  const now=bwPinsNow();
  // camera follows the ball down the lane, then holds on the pins
  let want = -62; if (now.ball) want = Math.max(-62, Math.min(BOWL.HEAD-92, now.ball.y-75)); else if (BW.phase==='roll' || BW.call) want = BW.camY; BW.camY += (want-BW.camY)*Math.min(1, frameDt*5);
  bwFloor(); bwBackWall(t);
  const items=[]; for (const p of now.pins) if (!p.pit) items.push({d:p.y, f:()=>bwPin(c,p,t)});
  const ballXY = now.ball ? now.ball : (BW.phase==='aim' ? {x:BW.x, y:6} : null);
  if (ballXY && ballXY.y < BOWL.PIT+20) items.push({d:ballXY.y+0.1, f:()=>bwBall(c, ballXY.x, ballXY.y, (ballXY.y||0)/27, t)});
  items.sort((a,b)=>b.d-a.d); for (const it of items) it.f();
  // aim guide: dotted line straight up the lane from the ball, bent by the aim and spin you've set with the keys
  if (BW.phase==='aim'){ c.fillStyle='rgba(255,255,255,0.55)'; let x=BW.x, vx=BW.aim*280; for (let y=20;y<520;y+=28){ x+=vx*(28/280); if (y>280) vx+=BW.spin*BOWL.HOOK*(28/280)*(28/280)*12; const q=bwProj(x,y,0.2); if (q) c.fillRect(Math.round(q[0]), Math.round(q[1]), q[2]>1?2:1, 1); } }
  // your llama from behind, holding the bale
  if (BW.phase==='aim' || (BW.rec && BW.recT<0.5)){ const q=bwProj(BW.x+9, BW.phase==='aim'?-6:-6, 0); if (q){ const im=sprite(me.c, 'bl', BW.phase==='aim'?0:Math.floor(t*8)%4, 'stand'); const sc=2;
      c.drawImage(im, Math.round(q[0]-SW*sc/2), Math.round(q[1]-SH*sc+6), SW*sc, SH*sc); } }
  // swipe trail
  if (BW.swipe && BW.swipe.pts.length>1){ const r=bwCv.getBoundingClientRect(); c.fillStyle='rgba(255,210,63,0.85)'; for (const [px,py] of BW.swipe.pts){ c.fillRect(Math.round((px-r.left)/BW.sc)-1, Math.round((py-r.top)/BW.sc)-1, 3, 3); } }
  // power meter (keyboard)
  if (BW.meterOn){ const h=90, x=BWW-16, y=BWH-30-h; c.fillStyle='#181020'; c.fillRect(x-1,y-1,10,h+2); c.fillStyle='#3a3448'; c.fillRect(x,y,8,h); const v=Math.round(BW.meter*h); c.fillStyle= BW.meter>0.85?'#ff5c8a':BW.meter>0.5?'#ffd23f':'#7ce07c'; c.fillRect(x, y+h-v, 8, v); }
  // big call: STRIKE / SPARE / GUTTER
  if (BW.call){ const C=BW.call; C.t+=frameDt; const sc=C.txt.length>8?2:3; const y=Math.round(BWH*0.6)-Math.max(0,(0.25-C.t))*80; if (C.t<2.2){ const w=pfW(C.txt,sc)+16; c.fillStyle='rgba(16,10,32,0.78)'; c.fillRect(BWW/2-w/2, y-8, w, 5*sc+16); pfDraw(c,C.txt,Math.round(BWW/2-pfW(C.txt,sc)/2)+1,y+1,'#181020',sc); pfDraw(c,C.txt,Math.round(BWW/2-pfW(C.txt,sc)/2),y,C.col,sc);
      if (C.txt==='STRIKE!'||C.txt==='TURKEY!'){ for (let k=0;k<14;k++){ const a=k*0.45+C.t*3, r=30+C.t*40; c.fillStyle=['#ffd23f','#ff5c8a','#5ad0ff','#7ce07c'][k%4]; c.fillRect(Math.round(BWW/2+Math.cos(a)*r), Math.round(y+8+Math.sin(a)*r*0.6), 2, 2); } } } else BW.call=null; }
}
// ---- scorecard (HTML, top of the screen) ----
function bwCard(card){ const el=document.getElementById('bw_card'); const cur = BW.game ? BW.game.frame : -1;
  el.innerHTML = card.frames.map((f,i)=>`<div class="fr ${i===cur&&BW.phase!=='over'?'cur':''}"><div class="fn">${i+1}</div><div class="mk">${(f.marks.length?f.marks:['']).map(m=>`<span class="${m==='X'?'x':m==='/'?'sp':''}">${m}</span>`).join('')}</div><div class="fs">${f.score==null?'':f.score}</div></div>`).join('') + `<div class="fr tot"><div class="fn">TOTAL</div><div class="fs big">${card.total}</div></div>`; }

// ---- the loop ----
function bowlTick(dt, nowMs){ if (!BW.on) return; const t=nowMs/1000;
  if (BW.phase==='aim'){ const K=BW.keys||(BW.keys=new Set()); if (K.has('left')) BW.x=Math.max(BOWL.MINX, BW.x-30*dt); if (K.has('right')) BW.x=Math.min(BOWL.MAXX, BW.x+30*dt);
    if (BW.meterOn){ BW.meterT=(BW.meterT||0)+dt; BW.meter=0.5-0.5*Math.cos(BW.meterT*3.2); } }
  if (BW.rec){ BW.recT += dt*1.35; const idx=Math.floor(BW.recT*120), f=BW.rec[Math.min(BW.rec.length-1, idx)];
    // sounds: rolling rumble, then the crash when the ball reaches the pins
    if (!BW.crashed && f[3].some(q=>q[3])){ BW.crashed=true; bwCrash(f[3].filter(q=>q[3]).length); }
    if ((BW.rolling+=dt) > 0.14 && f[1] < BOWL.HEAD && !f[2]){ BW.rolling=0; try { if (sfxReady()) wetNoise(actx.currentTime+0.01, 0.16, 0.18, 'lowpass', 260, 180, 0.7); } catch(e){} }
    if (idx >= BW.rec.length-1 && BW.serverRes) bwAfterRoll(); }
  bwDraw(t); }
function bwCrash(n){ try { if (!sfxReady()) return; const t=actx.currentTime+0.005; const v=Math.min(1, 0.35+n*0.08);
  for (let k=0;k<Math.min(8,2+n);k++){ wetNoise(t+k*0.035, 0.12, 0.7*v, 'bandpass', 2600-k*150, 1400, 2.5); pop(t+k*0.035, 900-k*60, 300, 0.06, 0.35*v); } wetNoise(t, 0.35, 0.6*v, 'lowpass', 1200, 200, 0.7); } catch(e){} }

// ---- throwing ----
function bwThrow(raw){ if (BW.phase!=='aim' || BW.pending) return; const th=bowlClamp(raw); BW.phase='roll'; BW.pending=true; BW.crashed=false; BW.serverRes=null;
  // play it out locally right away; the server runs the same thing and its answer counts
  const rec=[]; const local=bowlSim(th, BW.standing, rec); BW.rec=rec; BW.recT=0; BW.localDown=local.down;
  sfxTone(180,0.12,'triangle',0.3); bwHint();
  NET.act('bowl_roll', th).then(r=>{ if (!r.ok){ BW.rec=null; BW.pending=false; BW.phase='aim'; localMsg(r.msg||'That roll did not go through. Try again.'); return; } BW.serverRes=r; }); }
function bwAfterRoll(){ const r=BW.serverRes; BW.serverRes=null; BW.rec=null; BW.pending=false;
  if (JSON.stringify((BW.localDown||[]).slice().sort())!==JSON.stringify(r.down.slice().sort())) console.warn('BOWL MISMATCH', BW.localDown, r.down);
  const calls = { STRIKE:['STRIKE!','#ffd23f'], TURKEY:['TURKEY!','#ff9a48'], SPARE:['SPARE!','#5ad0ff'], GUTTER:['GUTTER BALL','#ff8080'], MISS:['MISS','#c0b8d8'] };
  let cl = calls[r.call] || (/IN A ROW/.test(r.call) ? [r.call+'!','#ff5c8a'] : null); if (!cl && r.n) cl=[`${r.n} PIN${r.n>1?'S':''}`, '#e8ecff'];
  if (cl) BW.call={txt:cl[0], col:cl[1], t:0};
  if (r.call==='STRIKE'||r.call==='TURKEY'||/IN A ROW/.test(r.call)) sfxChime([784,988,1175,1568,2093]); else if (r.call==='SPARE') sfxChime([659,880,1175]); else if (r.call==='GUTTER') { sfxTone(220,0.25,'sawtooth',0.25); sfxTone(165,0.35,'sawtooth',0.25,0.2); }
  BW.game={...BW.game, frame:r.frame, ball:r.ball, done:r.done}; bwCard(r.card); bwHint();
  // show what fell for a moment, then reset to the standing pins (or a fresh rack)
  BW.standing = r.before.map((v,i)=>v && !r.down.includes(i) ? 1 : 0);
  setTimeout(()=>{ if (!BW.on) return; BW.standing=r.standing; if (r.done){ BW.phase='over'; bwResults(r); } else { BW.phase='aim'; bwHint(); } }, 1500); }

// ---- input ----
const BW_KEYS = { ArrowLeft:'left', ArrowRight:'right' };
addEventListener('keydown', e=>{ if (!BW.on) return; if (document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return; e.stopImmediatePropagation(); const K=BW.keys||(BW.keys=new Set());
  if (BW_KEYS[e.code]){ e.preventDefault(); K.add(BW_KEYS[e.code]); return; }
  if (e.code==='KeyA'){ BW.aim=Math.max(-BOWL.MAXANG, BW.aim-0.005); return; } if (e.code==='KeyD'){ BW.aim=Math.min(BOWL.MAXANG, BW.aim+0.005); return; }
  if (e.code==='KeyQ'){ BW.spin=Math.max(-1, Math.round((BW.spin-0.25)*100)/100); bwHint(); return; } if (e.code==='KeyE'){ BW.spin=Math.min(1, Math.round((BW.spin+0.25)*100)/100); bwHint(); return; }
  if (e.code==='Space'){ e.preventDefault(); if (e.repeat) return; if (BW.phase==='aim' && !BW.meterOn){ BW.meterOn=true; BW.meterT=0; } else if ((BW.phase==='lobby' && BW.me) || (BW.phase==='over' && BW.result)) bwStart(); return; }
  if (e.code==='Escape'){ e.preventDefault(); bowlClose(); } }, true);
addEventListener('keyup', e=>{ if (!BW.on) return; const K=BW.keys||(BW.keys=new Set()); if (BW_KEYS[e.code]) K.delete(BW_KEYS[e.code]);
  if (e.code==='Space' && BW.meterOn){ BW.meterOn=false; const v=BOWL.MINV+(BOWL.MAXV-BOWL.MINV)*BW.meter; bwThrow({x:BW.x, vx:BW.aim*v, vy:v, spin:BW.spin}); } }, true);
// swipe up to bowl: drag sideways near the bottom first to line up
bwCv.addEventListener('pointerdown', e=>{ e.preventDefault(); ensureAudio(); if (BW.phase!=='aim') return; try{ bwCv.setPointerCapture(e.pointerId); }catch(_){}
  BW.swipe={pts:[[e.clientX,e.clientY]], t:[performance.now()], mode:null, x0:BW.x}; });
bwCv.addEventListener('pointermove', e=>{ const S2=BW.swipe; if (!S2) return; S2.pts.push([e.clientX,e.clientY]); S2.t.push(performance.now()); if (S2.pts.length>80){ S2.pts.shift(); S2.t.shift(); }
  const [x0,y0]=S2.pts[0], dx=e.clientX-x0, dy=y0-e.clientY;
  if (!S2.mode && Math.abs(dx)+Math.abs(dy)>10) S2.mode = Math.abs(dx)>Math.abs(dy)*1.3 ? 'move' : 'swipe';
  if (S2.mode==='move'){ BW.x=Math.max(BOWL.MINX, Math.min(BOWL.MAXX, S2.x0 + dx/BW.sc*0.25)); S2.pts=[S2.pts[0]]; S2.t=[S2.t[0]]; } });
const bwSwipeEnd = e=>{ const S2=BW.swipe; BW.swipe=null; if (!S2 || S2.mode!=='swipe' || BW.phase!=='aim') return;
  const P2=S2.pts, T=S2.t, n=P2.length; if (n<3) return; const dy=P2[0][1]-P2[n-1][1], dx=P2[n-1][0]-P2[0][0]; if (dy<40) { localMsg('Swipe UP to bowl.'); return; }
  const k0=Math.max(1,Math.floor(n*0.3)); let i0=0; for (let i=n-1;i>=0;i--){ if (T[n-1]-T[i] > 140){ i0=i; break; } }
  const speed = (P2[i0][1]-P2[n-1][1]) / Math.max(16, T[n-1]-T[i0]);   // px per ms over the last bit of the swipe
  const power = Math.max(0, Math.min(1, (speed-0.35)/1.6));
  const vy = BOWL.MINV + (BOWL.MAXV-BOWL.MINV)*power;
  const ang = Math.max(-BOWL.MAXANG, Math.min(BOWL.MAXANG, dx/dy*0.07));
  // hook: how much the end of the swipe curves compared to the start
  const s1=(P2[k0][0]-P2[0][0])/Math.max(8,P2[0][1]-P2[k0][1]), s2=(P2[n-1][0]-P2[n-1-k0][0])/Math.max(8,P2[n-1-k0][1]-P2[n-1][1]);
  const spin = Math.max(-1, Math.min(1, (s2-s1)*1.4));
  BW.lastThrow={power, spin}; bwThrow({x:BW.x, vx:ang*vy, vy, spin}); };
bwCv.addEventListener('pointerup', bwSwipeEnd); bwCv.addEventListener('pointercancel', ()=>{ BW.swipe=null; });
for (const [id,dir] of [['bw_l',-1],['bw_r',1]]){ const el=document.getElementById(id); let timer=null;
  const go=()=>{ if (BW.phase==='aim') BW.x=Math.max(BOWL.MINX, Math.min(BOWL.MAXX, BW.x+dir*1.5)); };
  el.addEventListener('pointerdown', e=>{ e.preventDefault(); go(); timer=setInterval(go, 60); }); for (const ev of ['pointerup','pointerleave','pointercancel']) el.addEventListener(ev, ()=>{ clearInterval(timer); }); }
document.getElementById('bw_exit').addEventListener('click', ()=>bowlClose());
function bwHint(){ const el=document.getElementById('bw_hint'); if (BW.phase!=='aim'){ el.textContent=''; return; }
  const touch=matchMedia('(pointer:coarse)').matches, ball = BW.game ? (BW.game.ball===0 ? 'FIRST BALL' : 'SECOND BALL') : '';
  el.innerHTML = `<b>FRAME ${(BW.game?BW.game.frame:0)+1} · ${ball}</b><br>${touch ? 'Slide sideways to line up, then <b>swipe up</b> to bowl. Curve your swipe to hook it.' : '<b>Drag up</b> on the lane to bowl, or ← → to line up, A D to aim, Q E for hook ('+(BW.spin>0?'+':'')+BW.spin+'), hold SPACE for power.'}`; }

// ---- alley board: who else is bowling ----
NET.handlers.bw = m => { BW.live = Array.isArray(m.live) ? m.live.filter(q=>q && typeof q.n==='string').slice(0,8) : BW.live; bwAlley();
  if (m.ev && m.ev.n && m.ev.n!==(me.n||'').toUpperCase() && curRoom==='lanes'){ const txt=`${m.ev.n}: ${String(m.ev.call)}`;
    if (BW.on){ const el=document.getElementById('bw_toast'); el.textContent='🎳 '+txt; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
    else if (/STRIKE|TURKEY|IN A ROW|FINAL/.test(m.ev.call)) localMsg(`🎳 ${m.ev.n} ${/FINAL/.test(m.ev.call)?'finished with '+m.ev.call.slice(6):'rolled a '+m.ev.call}!`); } };
NET.handlers.bb = m => { BW.board=m.board; };
function bwAlley(){ const el=document.getElementById('bw_alley'); if (!el) return; const meN=(me.n||'').toUpperCase(); const others=BW.live.filter(q=>q.n!==meN);
  el.innerHTML = others.length ? `<div class="aht">ALSO BOWLING</div>`+others.slice(0,4).map(q=>`<div>L${q.lane+1} ${esc(q.n)} <b>${q.sc}</b> <small>F${q.f}</small></div>`).join('') : ''; el.style.display = others.length ? '' : 'none'; }

// ---- open, lobby, start, results ----
function openBowl(){ if (!joined) return; if (curRoom!=='lanes'){ showSwap('lanes'); return; } closeAll(); if (arcade.on) exitArcade();
  BW.on=true; BW.phase='lobby'; bwEl.style.display='block'; document.body.classList.add('arena-on'); bwSize(); BW.rec=null; BW.call=null; BW.standing=[1,1,1,1,1,1,1,1,1,1]; BW.camY=-62;
  bwBody.innerHTML='<div class="arload">LOADING...</div>'; bwBox.style.display='block'; bwCard(bowlScore([])); bwHint(); sendPresence(true);
  NET.act('bowl_info').then(r=>{ if (!r.ok){ bwBody.innerHTML=`<div class="arload">${esc(r.msg||'Could not load the lanes.')}</div>`; return; } BW.me=r.me; BW.board=r.board; BW.live=r.live||[]; bwAlley(); BW.resume=r.game; bwLobby(); }); }
function bowlClose(silent){ if (!BW.on) return; BW.on=false; BW.phase='lobby'; bwEl.style.display='none'; bwBox.style.display='none'; document.body.classList.remove('arena-on'); BW.rec=null; BW.meterOn=false; if (BW.keys) BW.keys.clear(); if (!silent) sendPresence(true); }
function bwLobby(){ const M=BW.me; if (!M) return; BW.phase='lobby'; const G=BW.resume && !BW.resume.done && BW.resume.rolls.length ? BW.resume : null;
  bwBody.innerHTML = `<div class="arh"><div class="art">🎳 HAY BALE BOWLING</div><div class="ars">Five frames. Roll the hay bale, knock down the llama pins. Strikes pay!</div></div>
    <div class="arstats"><div><b>${M.best}</b><small>BEST GAME</small></div><div><b>${M.wkBest}</b><small>THIS WEEK</small></div><div><b>${M.strikes}</b><small>STRIKES</small></div><div><b>${M.earnedToday}/${M.cap}</b><small>COINS TODAY</small></div></div>
    ${M.playedToday ? `<div class="arbonus done">✅ Daily bonus collected. Every game still pays coins.</div>` : `<div class="arbonus">🎁 First game today: <b>+2 bonus coins</b>!</div>`}
    <div class="arbonus">💰 1 coin per 10 pins of score, +3 for a TURKEY (3 strikes in a row), +10 for a perfect 150.</div>
    ${G ? `<button class="gbbtn y arplay" id="bw_resume">▶ RESUME GAME (FRAME ${G.frame+1})</button><button class="gbbtn" id="bw_go" style="width:100%">START A NEW GAME</button>` : `<button class="gbbtn y arplay" id="bw_go">▶ BOWL</button>`}
    <div class="arsec">THIS WEEK'S HIGH GAMES</div>${boardHtml(BW.board)}
    <div class="arhow"><b>HOW TO BOWL</b> ${matchMedia('(pointer:coarse)').matches ? 'Slide sideways on the lane to line up. <b>Swipe up</b> to roll: a faster swipe rolls harder, a swipe that curves at the end puts hook on it.' : '<b>Drag up</b> on the lane with the mouse (faster = harder, curve the end to hook it), or use ← → to line up, A D to aim, Q E for hook and hold SPACE for power.'} Aim just off the head pin for the best chance of a strike.</div>
    <div class="srow"><button class="gbbtn" id="bw_leave">LEAVE</button></div>`;
  bwBox.style.display='block'; bwWire(); }
function bwWire(){ const go=document.getElementById('bw_go'); if (go) go.addEventListener('click', bwStart); const lv=document.getElementById('bw_leave'); if (lv) lv.addEventListener('click', ()=>bowlClose());
  const rs=document.getElementById('bw_resume'); if (rs) rs.addEventListener('click', ()=>{ const G=BW.resume; BW.game={frame:G.frame, ball:G.ball, done:false}; BW.standing=G.standing; bwCard(G.card); bwBox.style.display='none'; BW.phase='aim'; BW.x=0; bwHint(); }); }
function bwStart(){ if (BW.starting) return; BW.starting=true; ensureAudio();
  NET.act('bowl_start').then(r=>{ BW.starting=false; if (!r.ok){ localMsg(r.msg||'Could not start a game.'); return; }
    BW.game={frame:0, ball:0, done:false}; BW.standing=r.game.standing; BW.x=0; BW.aim=0; BW.spin=0; BW.result=null; bwCard(r.game.card); bwBox.style.display='none'; BW.phase='aim'; BW.camY=-62; bwHint(); sfxChime([523,659,784]); }); }
function bwResults(r){ const F=r.final; BW.result=r; BW.me=F.me; BW.board=F.board; if (Number.isFinite(F.tk)) tkSet(F.tk);
  const lines=[]; const base=F.earned-F.bonus.daily-F.bonus.turkey-F.bonus.perfect;
  if (base>0) lines.push(`<li><span>Score</span><b>+${base}</b></li>`); if (F.bonus.daily) lines.push(`<li><span>🎁 First game today</span><b>+${F.bonus.daily}</b></li>`); if (F.bonus.turkey) lines.push(`<li><span>🦃 Turkey bonus</span><b>+${F.bonus.turkey}</b></li>`); if (F.bonus.perfect) lines.push(`<li><span>💯 Perfect game</span><b>+${F.bonus.perfect}</b></li>`);
  bwBody.innerHTML = `<div class="arh"><div class="art">${F.total===150?'💯 PERFECT GAME!':F.total>=100?'🔥 GREAT GAME!':'GAME OVER'}</div><div class="ars">${F.strikes} strike${F.strikes===1?'':'s'}</div></div>
    <div class="arbig" id="bw_count">0</div>
    <div class="arbadges">${F.best?'<span class="bdg gold">⭐ NEW PERSONAL BEST</span>':''}${F.wkBest?'<span class="bdg pink">📈 WEEKLY BEST</span>':''}</div>
    <div class="artok"><div class="artk">+${F.earned} <span>COINS</span></div>${lines.length?`<ul>${lines.join('')}</ul>`:''}${F.capped?'<div class="arcap">You hit today\'s bowling coin limit. Scores still count!</div>':''}</div>
    <button class="gbbtn y arplay" id="bw_go">▶ BOWL AGAIN</button>
    <div class="arsec">THIS WEEK'S HIGH GAMES</div>${boardHtml(F.board)}
    <div class="srow"><button class="gbbtn" id="bw_leave">LEAVE</button></div>`;
  bwBox.style.display='block'; bwWire();
  const el=document.getElementById('bw_count'), goal=F.total, t0=performance.now(); const step=()=>{ const u=Math.min(1,(performance.now()-t0)/900); el.textContent=Math.round(goal*(1-Math.pow(1-u,3))); if (u<1) requestAnimationFrame(step); else if (F.best) sfxChime([1047,1319,1568,2093]); }; step(); }

// ======================= DUNK TANK (Llama Acres) =======================
// Two taps: stop the crosshair across, then up and down. A bullseye drops whoever is on the seat into the water.
const DK = { t0:-1e9, balls:[], flash:0, phase:'x', cx:0, cy:0, lx:null, ly:null, busy:false };
const DUNK_T = 2900;
function dunkDepth(){ const u=performance.now()-DK.t0; if (u<0||u>DUNK_T) return 0; if (u<260) return Math.round(26*u/260); if (u<DUNK_T-600) return 24+Math.round(Math.sin(u/160)*2); return Math.round(24*(DUNK_T-u)/600); }
function dunkSitter(){ const [x,y]=DUNK_SEAT; if (me.p==='sit' && me.gx===x && me.gy===y) return 'me'; for (const o of others.values()) if (!o.leaving && sameRoom(o) && o.p==='sit' && Math.floor(o.x)===x && Math.floor(o.y)===y) return o.id; return null; }
function dunkClip(waterY, draw){ const dp=dunkDepth(); if (dp<=0){ draw(); return; } g.save(); g.beginPath(); g.rect(-9999,-9999,99999,9999+waterY); g.clip(); draw(); g.restore(); }
function dunkSplash(x, y, t){ const u=performance.now()-DK.t0; g.fillStyle='#c8ecff'; if (u<700){ const k=u/700; for (let i=0;i<10;i++){ const a=-Math.PI*(0.1+0.8*i/9); g.fillRect(Math.round(x+Math.cos(a)*k*18), Math.round(y+Math.sin(a)*k*22+k*k*20), 2, 2); } }
  for (let i=0;i<3;i++){ const b=((t*1.5+i*0.33)%1); g.fillRect(Math.round(x-6+i*6+Math.sin(t*5+i)*2), Math.round(y-b*6), 1, 1); } }
function inDunkZone(){ if (curRoom!=='barn') return false; const [tx,ty]=DUNK_TGT; return me.gy>ty && Math.max(Math.abs(me.gx-tx), Math.abs(me.gy-ty))<=4; }
// the ball flies from the thrower to the target
function drawDunk(t){ if (curRoom!=='barn') return; const now=performance.now();
  for (let i=DK.balls.length-1;i>=0;i--){ const B=DK.balls[i], u=(now-B.t0)/550; if (u>=1){ DK.balls.splice(i,1); if (B.hit){ DK.flash=now; DK.t0=now; sfxDunk(); } else { sfxTone(300,0.08,'triangle',0.15); } continue; }
    const x=B.x0+(B.x1-B.x0)*u, y=B.y0+(B.y1-B.y0)*u - Math.sin(u*Math.PI)*22; g.fillStyle=INK; g.fillRect(OX+Math.round(x)-2,OY+Math.round(y)-2,5,5); g.fillStyle='#f8f8f8'; g.fillRect(OX+Math.round(x)-1,OY+Math.round(y)-1,3,3); g.fillStyle='#e03048'; g.fillRect(OX+Math.round(x),OY+Math.round(y)-1,1,3); } }
function sfxDunk(){ try { if (!sfxReady()) return; const t=actx.currentTime+0.01; pop(t, 1800, 900, 0.08, 0.5); wetNoise(t+0.08, 0.6, 0.9, 'lowpass', 1800, 250, 0.8); wetNoise(t+0.12, 0.35, 0.5, 'bandpass', 2600, 900, 1.5); pop(t+0.1, 220, 60, 0.25, 0.6); } catch(e){} }
NET.handlers.dk = m => { if (curRoom!=='barn') return; const thrower = m.peer===(NET.peer||myPeer) ? me : [...others.values()].find(o=>o.id===m.peer) || null;
  const [tx,ty]=proj(DUNK_TGT[0]+0.5, DUNK_TGT[1]+0.5); let x0=tx-60, y0=ty-30; if (thrower){ const p0=proj(thrower.x, thrower.y); x0=p0[0]; y0=p0[1]-30; }
  DK.balls.push({x0, y0, x1:tx, y1:ty-38, t0:performance.now(), hit:!!m.hit}); sfxTone(520,0.06,'triangle',0.15);
  if (m.hit && thrower!==me) setTimeout(()=>localMsg(`💦 SPLASH! ${m.by} dunked ${m.sitter ? m.sitter : 'DUNKY'}!`), 560); };
// ---- the throw popup ----
const dkEl=document.getElementById('dkbox'), dkCv=document.getElementById('dkcv'), dkCx=dkCv.getContext('2d');
const DUNK_BULL = 0.2;   // bullseye size (fraction of the target)
function openDunk(){ if (curRoom!=='barn') return; closeAll(); DK.phase='x'; DK.lx=null; DK.ly=null; DK.t=0; DK.ph=Math.random()*6.3; dkEl.style.display='block'; dunkMsg(`TAP TO STOP THE CROSSHAIR. HIT THE BULLSEYE TO DUNK ${dunkSitter() ? 'THE LLAMA ON THE SEAT' : 'DUNKY'}!`); dunkLoop(); }
function dunkMsg(t){ document.getElementById('dk_msg').textContent=t; }
let dkRaf=0; function dunkLoop(){ cancelAnimationFrame(dkRaf); const step=()=>{ if (dkEl.style.display!=='block') return; DK.t+=1/60; dunkDraw(); dkRaf=requestAnimationFrame(step); }; dkRaf=requestAnimationFrame(step); }
const dkSweep = (t, sp) => Math.sin(t*sp);   // -1..1
function dunkDraw(){ const c=dkCx, W=160, H=120, cx=W/2, cy=H/2, R=44; c.imageSmoothingEnabled=false; c.fillStyle='#6cb048'; c.fillRect(0,0,W,H); c.fillStyle='#5aa03c'; for (let y=0;y<H;y+=6) for (let x=(y/6)%2*3;x<W;x+=6) c.fillRect(x,y,1,1);
  for (const [r,col] of [[R+2,'#181020'],[R,'#f8f8f8'],[R*0.8,'#e03048'],[R*0.6,'#f8f8f8'],[R*0.42,'#e03048'],[R*DUNK_BULL*44/50,'#ffd23f']]){ c.fillStyle=col; for (let yy=-Math.round(r);yy<=Math.round(r);yy++){ const w=Math.round(Math.sqrt(r*r-yy*yy)); c.fillRect(cx-w, cy+yy, w*2+1, 1); } }
  const sx = DK.lx!=null ? DK.lx : dkSweep(DK.t+DK.ph, 3.3), sy = DK.ly!=null ? DK.ly : (DK.phase==='y' ? dkSweep(DK.t+DK.ph, 3.8) : 0);
  const X=Math.round(cx+sx*(R+6)), Y=Math.round(cy+sy*(R+6));
  c.fillStyle='#181020'; if (DK.phase==='x' || DK.lx!=null) c.fillRect(X,0,1,H); if (DK.phase!=='x') c.fillRect(0,Y,W,1);
  c.fillStyle='#181020'; c.fillRect(X-4,Y-4,9,9); c.fillStyle='#ffd23f'; c.fillRect(X-3,Y-3,7,7); c.fillStyle='#181020'; c.fillRect(X-1,Y-1,3,3); }
function dunkTap(){ if (DK.busy) return; ensureAudio();
  if (DK.phase==='x'){ DK.lx=dkSweep(DK.t+DK.ph, 3.3); DK.phase='y'; DK.t=0; DK.ph=Math.random()*6.3; sfxTone(660,0.05,'square',0.15); dunkMsg('NOW STOP IT UP AND DOWN!'); return; }
  if (DK.phase==='y'){ DK.ly=dkSweep(DK.t+DK.ph, 3.8); DK.phase='done'; const r=Math.sqrt(DK.lx*DK.lx+DK.ly*DK.ly)*(50/44); const hit = r <= DUNK_BULL;
    DK.busy=true; dunkMsg('THROWING...');
    NET.act('dunk_throw',{hit}).then(res=>{ DK.busy=false; if (!res.ok){ dunkMsg((res.msg||'TRY AGAIN.').toUpperCase()); DK.phase='again'; return; } tkSet(res.tk);
      dunkMsg(res.hit ? (res.won ? `BULLSEYE! SPLASH! +${res.won} COINS` : 'BULLSEYE! SPLASH! (DAILY DUNK PRIZES ALL WON)') : (r<0.5 ? 'SO CLOSE! TRY AGAIN.' : 'MISSED! TRY AGAIN.')); DK.phase='again'; });
    return; }
  if (DK.phase==='again'){ DK.phase='x'; DK.lx=null; DK.ly=null; DK.t=0; DK.ph=Math.random()*6.3; dunkMsg('TAP TO STOP THE CROSSHAIR ACROSS.'); } }
dkCv.addEventListener('pointerdown', e=>{ e.preventDefault(); dunkTap(); });
document.getElementById('dk_throw').addEventListener('click', dunkTap);
document.getElementById('dk_close').addEventListener('click', ()=>{ dkEl.style.display='none'; });
addEventListener('keydown', e=>{ if (dkEl.style.display==='block' && (e.code==='Space'||e.code==='Enter')){ e.preventDefault(); e.stopImmediatePropagation(); dunkTap(); } }, true);

// ======================= JOB BOARD: ways to earn coins in every room =======================
// Numbers match the server's payouts. GO walks you to the job (or takes you to its room first).
const JOBS = {
  lounge: [
    {i:'🍸', t:'Work the bar', h:'Tap the velvet rope by the bar and pour drinks.', p:'1 coin / 30 sec', go:()=>ropeClick()},
    {i:'🕹️', t:'Arcade high scores', h:'Hay Catch or Llama Dash at the arcade cabinet.', p:'up to 10 + 3 for a best', go:()=>walkTo(ARC_X,1,'arcade')},
    {i:'🎲', t:'Table games', h:'Sit at a lounge table and bet against THE HOUSE (or play free).', p:'win your bet', risk:true, go:()=>walkTo(2,8)} ],
  barn: [
    {i:'🥕', t:'Harvest carrots', h:'Tap a ripe carrot in the farm patch. They grow back in 90 seconds.', p:'1 coin each', go:()=>walkTo(3,12)},
    {i:'🎣', t:'Go fishing', h:'Stand by the pond and press FISH.', p:'1, 2 or 5 a fish', go:()=>walkTo(14,5,'fish')},
    {i:'⚾', t:'Dunk tank', h:'Throw at the target by the barn. A bullseye dunks the llama on the seat.', p:'1 a throw, 3 a dunk', risk:true, go:()=>walkTo(DUNK_TGT[0],DUNK_TGT[1]+2,'dunk')},
    {i:'💦', t:'Sit on the dunk tank', h:'Be the llama on the seat. Get paid every time someone dunks you.', p:'1 coin a dunk', go:()=>walkTo(DUNK_SEAT[0],DUNK_SEAT[1])} ],
  store: [ {i:'🛍️', t:'Help the cashier', h:'Go behind the counter and wipe it down for Penny.', p:'1 coin / 30 sec', go:()=>cashClick()} ],
  arena: [ {i:'💦', t:'Spit Arena rounds', h:'60-second spit-ball rounds. Bonus for your first round each day and for winning.', p:'up to 6 + bonuses', go:()=>openArena()} ],
  lanes: [ {i:'🎳', t:'Hay bale bowling', h:'5-frame games. Turkeys and a perfect game pay extra.', p:'up to 15 + bonuses', go:()=>openBowl()} ],
  gym: [ {i:'🥊', t:'Box a bot', h:'Beat ROOKIE RUSTY or CHAMP DUKE in the ring.', p:'3 or 8 a win', go:()=>openBox()},
    {i:'🥊', t:'Box another llama', h:'Challenge a llama in the gym. Winner gets the most.', p:'10 a win, 2 for the loser', go:()=>openBox()} ],
  jungle: [ {i:'🌴', t:'Dig round the ruins', h:'Follow the detector (COLD to HOT), stand on the spot and DIG. Coins, gold, gems and the odd GOLDEN IDOL.', p:'3 to 10 a find', go:()=>coveDig()} ],
  cove: [ {i:'🧰', t:'Dig for treasure', h:'Follow the detector (COLD to HOT), stand on the spot and DIG. Coins, gold, gems and the odd PIRATE CHEST.', p:'3 to 10 a find', go:()=>coveDig()} ],
  casino: [
    {i:'🎰', t:'Slot machines', h:'Three kinds of slots along the back wall. Pick your bet.', p:'games of chance', risk:true, go:()=>walkTo(5,1)},
    {i:'🎡', t:'Roulette', h:'Sit at the wheel in the middle and place a bet.', p:'games of chance', risk:true, go:()=>walkTo(5,5)},
    {i:'🃏', t:'Blackjack', h:'Sit at a blackjack table and beat the dealer.', p:'games of chance', risk:true, go:()=>walkTo(10,5)} ] };
const jobsEl=document.getElementById('jobsbox');
// ---- daily reward and quests (the server decides everything; this just shows it) ----
let DAILY=null;
function dailyHtml(D){ if (!D) return '<div class="dsec"><h5>🎁 DAILY</h5><div class="jsub">Loading...</div></div>';
  let h=`<div class="dsec"><h5><span>🎁 DAILY REWARD · DAY ${D.streak} STREAK</span>${D.claimed?'<span style="color:#1f8a4c">✔ CLAIMED</span>':`<button class="gbbtn y" id="dj_claim">CLAIM ${D.reward} 🪙</button>`}</h5>`;
  h+=`<h5 style="margin-top:12px"><span>📋 TODAY'S QUESTS</span><span style="color:${D.bonus.done?'#1f8a4c':'#a06808'}">${D.bonus.done?'✔ ':''}ALL 3: +${D.bonus.pay} BONUS</span></h5>`;
  for (const q of D.quests) h+=`<div class="dq ${q.done?'done':''}"><span class="dqt">${q.done?'✅ ':''}${esc(q.t)}<div class="bar"><i style="width:${Math.round(100*q.prog/q.n)}%"></i></div></span><span class="dqp">${q.prog}/${q.n} · +${q.pay}</span></div>`;
  return h+'</div>'; }
function dailyDot(){ const d=$id('jobs_dot'); if (!d) return; const n = DAILY ? (DAILY.claimed?0:1) : 0; d.textContent = n ? '!' : ''; d.classList.toggle('on', !!n); }
function dailyLoad(pop){ NET.act('daily_info').then(r=>{ if (!r || !r.ok) return; DAILY=r; dailyDot(); if (jobsEl.style.display==='block') openJobs(true); if (pop && !r.claimed){ if (!joined) dailyLater=true; else if (!uiOpen() && $id('roomsbox').style.display!=='block') dailyPop(); } }); }
let dailyLater=false;   // the reward waits until you've picked where to go
function dailyPop(){ const D=DAILY; if (!D) return; let h=`<div class="dpsub">Come back every day to grow your streak. Day 7 pays the most!</div><div class="dstrip">`;
  D.rewards.forEach((v,i)=>{ const day=i+1, cur=((D.streak-1)%7)+1; h+=`<div class="dd ${day<cur?'got':''} ${day===cur?'now':''} ${day===7?'big':''}">DAY ${day}<b>${v}</b></div>`; });
  h+='</div>'; $id('dp_body').innerHTML=h; $id('dp_claim').textContent=`CLAIM ${D.reward} TOKENS`; $id('dailypop').style.display='block'; }
function dailyClaim(btn){ if (btn) btn.disabled=true; NET.act('daily_claim').then(r=>{ if (!r.ok){ localMsg(r.msg||'Could not claim that.'); if (btn) btn.disabled=false; return; } DAILY=r; dailyDot(); $id('dailypop').style.display='none';
  tkSet(r.tk, `DAY ${r.streak} REWARD: +${r.paid} TOKENS! Check JOBS for today's quests.`); if (jobsEl.style.display==='block') openJobs(true); }); }
$id('dp_claim').addEventListener('click', e=>{ ensureAudio(); dailyClaim(e.target); });
$id('dp_later').addEventListener('click', ()=>{ $id('dailypop').style.display='none'; });
// ---- trading: everything is checked and done by the server; this window just shows the offers ----
const TR={tid:null, them:'', mine:{items:{},rares:[],tk:0}, theirs:{items:{},rares:[],tk:0}, ok:[false,false], have:null, rares:null, sendT:null};
function trSay(t,good){ const el=$id('tr_msg'); el.textContent=t||''; el.classList.toggle('good',!!good); }
function trLoadHave(){ NET.act('furn_info').then(r=>{ if (!r.ok) return; TR.have=r.furn; TR.rares=r.rares; trDraw(); }); }
function trOfferHtml(O){ let h=''; for (const [k,n] of Object.entries(O.items||{})) h+=`<div class="trl"><canvas data-fk="${k}"></canvas><span class="tn">${esc(itemName(k))}</span><b class="q">×${n}</b></div>`;
  for (const r of O.rares||[]) h+=`<div class="trl"><canvas data-fk="${r.item}"></canvas><span class="tn">⭐ ${esc(FURN_DEF[r.item]?FURN_DEF[r.item].n:r.item)}<small>#${r.serial}</small></span></div>`;
  if (O.tk) h+=`<div class="trl"><span style="font-size:22px">🪙</span><span class="tn">${O.tk} TOKENS</span></div>`; return h || '<div class="trnone">Nothing yet.</div>'; }
function trDraw(){ if (!TR.tid) return; $id('tr_title').textContent=`🤝 TRADE WITH ${TR.them}`;
  const M=TR.mine, rareIds=new Set((M.rares||[]).map(r=>r.id)); let mine='';
  const have=(TR.have||[]).map(x=>({item:x.item, free:Math.max(0,x.n-(x.placed||0))})).filter(x=>x.free>0 && ((FURN_DEF[x.item] && !FURN_DEF[x.item].rare) || decoOf(x.item)));
  mine+='<div class="trsub">ITEMS IN YOUR BAG</div>';
  if (!TR.have) mine+='<div class="trnone">Loading...</div>'; else if (!have.length) mine+='<div class="trnone">Nothing in your bag to trade (placed pieces and the wallpaper and floor that are up stay in your room).</div>';
  for (const x of have){ const q=(M.items||{})[x.item]||0; mine+=`<div class="trl"><canvas data-fk="${x.item}"></canvas><span class="tn">${esc(itemName(x.item))}<small>${x.free} in your bag</small></span><button data-dq="${x.item}" data-d="-1">−</button><b class="q">${q}</b><button data-dq="${x.item}" data-d="1">+</button></div>`; }
  const myR=(TR.rares&&TR.rares.mine)||[]; if (myR.length){ mine+='<div class="trsub">⭐ YOUR RARES</div>'; for (const r of myR) mine+=`<div class="trl"><canvas data-fk="${r.item}"></canvas><span class="tn">${esc(FURN_DEF[r.item]?FURN_DEF[r.item].n:r.item)}<small>#${r.serial}</small></span><button data-rr="${r.id}" class="${rareIds.has(r.id)?'on':''}">${rareIds.has(r.id)?'✓':'+'}</button></div>`; }
  mine+=`<div class="trtk">🪙<input id="tr_tk" type="number" min="0" inputmode="numeric" placeholder="Tokens to give" value="${M.tk||''}"></div>`;
  const h=`<div class="trcols"><div class="trc ${TR.ok[0]?'ok':''}"><h5><span>YOU GIVE</span>${TR.ok[0]?'<span class="rd">✓ READY</span>':''}</h5>${mine}</div><div class="trc ${TR.ok[1]?'ok':''}"><h5><span>${esc(TR.them)} GIVES</span>${TR.ok[1]?'<span class="rd">✓ READY</span>':''}</h5>${trOfferHtml(TR.theirs)}</div></div>`;
  const focus=document.activeElement && document.activeElement.id==='tr_tk'; $id('tr_body').innerHTML=h;
  for (const cv of $id('tr_body').querySelectorAll('canvas[data-fk]')){ const ic=furnIcon(cv.dataset.fk,40); cv.width=ic.width; cv.height=ic.height; cv.getContext('2d').drawImage(ic,0,0); }
  $id('tr_ready').textContent = TR.ok[0] ? 'NOT READY' : '✓ READY';
  if (focus){ const i=$id('tr_tk'); i.focus(); i.setSelectionRange && (i.type='text', i.setSelectionRange(i.value.length,i.value.length), i.type='number'); }
  $id('tr_tk').addEventListener('input', e=>{ M.tk=Math.max(0,Math.floor(+e.target.value||0)); trSend(); }); }
function trSend(){ clearTimeout(TR.sendT); TR.sendT=setTimeout(()=>{ const M=TR.mine; NET.act('trade_set',{tid:TR.tid, items:M.items, rares:(M.rares||[]).map(r=>r.id), tk:M.tk||0}).then(r=>{ if (!r.ok) trSay(r.msg||'Could not change that.'); else trSay(''); }); }, 250); }
$id('tr_body').addEventListener('click', e=>{ const b=e.target.closest('button'); if (!b) return; ensureAudio(); const M=TR.mine;
  if (b.dataset.dq){ const k=b.dataset.dq, x=(TR.have||[]).find(x=>x.item===k), free=x?Math.max(0,x.n-(x.placed||0)):0, q=Math.max(0,Math.min(free,((M.items||{})[k]||0)+(+b.dataset.d)));
    M.items={...(M.items||{})}; if (q) M.items[k]=q; else delete M.items[k]; trDraw(); trSend(); return; }
  if (b.dataset.rr){ const id=+b.dataset.rr, r=((TR.rares&&TR.rares.mine)||[]).find(x=>x.id===id); const on=(M.rares||[]).some(x=>x.id===id); M.rares = on ? M.rares.filter(x=>x.id!==id) : [...(M.rares||[]), r]; trDraw(); trSend(); } });
$id('tr_ready').addEventListener('click', ()=>{ ensureAudio(); NET.act('trade_ready',{tid:TR.tid, on:!TR.ok[0]}).then(r=>{ if (!r.ok) trSay(r.msg||'Not yet.'); }); });
$id('tr_cancel').addEventListener('click', ()=>{ if (TR.tid) NET.act('trade_cancel',{tid:TR.tid}); $id('tradebox').style.display='none'; TR.tid=null; });
// ---- BLOCK and REPORT (the server enforces blocks; this keeps the list so their chat stays hidden here) ----
const BLOCKS=new Set();
function blocksSet(list){ BLOCKS.clear(); for (const n of (list||[])) BLOCKS.add(String(n).toUpperCase()); for (const o of others.values()) if (BLOCKS.has(String(o.n||'').toUpperCase())) o.bubble=null; }
function blocksLoad(){ NET.act('block_list').then(r=>{ if (r && r.ok) blocksSet(r.blocks); }); }
function pmBlockBtn(){ const b=$id('pm_block'), o=pmTarget&&others.get(pmTarget); if (!b||!o) return; const on=BLOCKS.has(o.n.toUpperCase()); b.textContent = on ? '🚫 UNBLOCK' : '🚫 BLOCK'; b.classList.toggle('on', on);
  const st=o.st||''; b.style.display = st ? 'none' : ''; }
function blockDo(n, on){ n=String(n).toUpperCase();
  if (on && !confirm(`Block ${n}? You won't see their chat, and they can't message you, trade with you, add you as a friend or come into your rooms.`)) return Promise.resolve(null);
  return NET.act('block',{n, on:!!on}).then(r=>{ if (r.ok) blocksSet(r.blocks); localMsg(r.msg||(r.ok?'Done.':'That did not work.')); if (r.ok && typeof frLoad==='function') try{ frLoad(); }catch(e){} return r; }); }
// MOD section on a player's card: only for staff, filled from the server (which re-checks your role and checks again on every button)
function pmModLoad(o){ const el=$id('pm_mod'); el.classList.remove('on'); el.innerHTML=''; if (!me.st || !o) return; const n=o.n.toUpperCase();
  NET.act('mod_info',{n}).then(r=>{ if (!r || !r.ok || pmenuEl.style.display!=='block' || !pmTarget || (others.get(pmTarget)||{}).n?.toUpperCase()!==n) return;
    const owner=r.me==='owner', b=(label,cmd,cls)=>`<button class="gbbtn ${cls||''}" data-mc="${cmd}">${label}</button>`;
    let h=`<div class="mh">${pix('crown')} ${owner?'OWNER':'MOD'} TOOLS</div><div class="mi">${r.muted?'<b>MUTED</b> · ':''}${r.st?`<b>${r.st==='owner'?'OWNER':'MOD'}</b> · `:''}OPEN REPORTS: <b>${r.reports}</b> · FILTER CATCHES: <b>${r.wfn}</b></div>`;
    if (r.can){ h+='<div class="mb">'+(r.muted?b('UNMUTE','unmute'):b('MUTE','mute'))+b('KICK','kick','bad')+b('BAN','ban','bad')+b('🪙 GIVE','give','gd')+b('CHAT LOG','chat')+b('REPORTS','reports')+(owner?(r.st==='mod'?b('UNMOD','unmod'):b('MAKE MOD','mod','gd')):'')+'</div>'; }
    else h+=`<div class="mi">${r.st==='owner'?'Nobody can moderate the owner.':'Mods can\'t moderate other mods.'}</div><div class="mb">${b('CHAT LOG','chat')}</div>`;
    el.innerHTML=h; el.classList.add('on'); pmFit();
    for (const x of el.querySelectorAll('[data-mc]')) x.addEventListener('click', ()=>{ const c=x.dataset.mc;
      if (c==='chat'){ closeAll(); dsTab='chat'; store.dsTab='chat'; saveStore(); dsChat={lines:[], open:null, q:n, more:true}; openDash(); return; }
      if (c==='reports'){ closeAll(); dsTab='reports'; store.dsTab='reports'; saveStore(); openDash(); return; }
      closeAll(); dashDo(c, n); }); }); }
$id('pm_block').addEventListener('click', ()=>{ const o=pmTarget&&others.get(pmTarget); if (!o) return; const n=o.n.toUpperCase(), on=!BLOCKS.has(n); closeAll(); blockDo(n, on); });
const REPORT_WHY=[['rude','Rude or bullying'],['hate','Hate speech or slurs'],['spam','Spam'],['scam','Scam or trade trouble'],['name','Bad name, room or outfit'],['other','Something else']];
let rpName='', rpWhy='';
function openReport(n){ closeAll(); rpName=String(n).toUpperCase(); rpWhy='';
  $id('rp_title').textContent='🚩 REPORT '+rpName; $id('rp_who').textContent=`What did ${rpName} do? Pick one. Only staff see reports, and ${rpName} won't know who sent it.`;
  $id('rp_reasons').innerHTML=REPORT_WHY.map(([k,l])=>`<button type="button" data-k="${k}">${esc(l)}</button>`).join('');
  for (const b of $id('rp_reasons').querySelectorAll('button')) b.addEventListener('click', ()=>{ rpWhy=b.dataset.k; for (const x of $id('rp_reasons').querySelectorAll('button')) x.classList.toggle('on', x===b); $id('rp_msg').textContent=''; });
  $id('rp_note').value=''; $id('rp_msg').textContent=''; $id('rp_msg').className='prmsg'; $id('rp_send').disabled=false;
  const box=$id('repbox'); box.style.display='block'; if (typeof sheetHead==='function') sheetHead(box); }
$id('pm_report').addEventListener('click', ()=>{ const o=pmTarget&&others.get(pmTarget); if (!o) return; openReport(o.n); });
$id('rp_note').addEventListener('keydown', e=>e.stopPropagation());
$id('rp_cancel').addEventListener('click', ()=>{ $id('repbox').style.display='none'; });
$id('rp_send').addEventListener('click', ()=>{ const m=$id('rp_msg'); if (!rpWhy){ m.className='prmsg'; m.textContent='Pick what happened first.'; return; }
  const b=$id('rp_send'); b.disabled=true; m.className='prmsg'; m.textContent='SENDING...';
  NET.act('report',{n:rpName, reason:rpWhy, note:$id('rp_note').value.trim(), room:curRoom}).then(r=>{ b.disabled=false;
    if (!r.ok){ m.className='prmsg'; m.textContent=r.msg||'That did not work.'; return; }
    m.className='prmsg good'; m.textContent=r.msg||'Sent. Thanks!'; setTimeout(()=>{ $id('repbox').style.display='none';
      if (!BLOCKS.has(rpName) && others && [...others.values()].some(o=>String(o.n||'').toUpperCase()===rpName) && confirm(`Do you also want to block ${rpName}?`)) blockDo(rpName, true).catch(()=>{}); }, 900); }); });
$id('pm_trade').addEventListener('click', ()=>{ const id=pmTarget; closeAll(); const o=others.get(id); if (!o) return; NET.act('trade_req',{n:o.n}).then(r=>localMsg(r.msg||(r.ok?'Asked to trade.':'Could not ask to trade.'))); });
NET.handlers.tradereq = m => { TR.ask=m.tid; $id('ta_txt').textContent=`${m.from} wants to trade with you.`; $id('tradeask').style.display='block'; };
$id('ta_yes').addEventListener('click', ()=>{ $id('tradeask').style.display='none'; NET.act('trade_answer',{tid:TR.ask, yes:true}).then(r=>{ if (!r.ok) localMsg(r.msg||'That trade request expired.'); }); });
$id('ta_no').addEventListener('click', ()=>{ $id('tradeask').style.display='none'; NET.act('trade_answer',{tid:TR.ask, yes:false}); });
NET.handlers.trade = m => { const fresh = TR.tid!==m.tid; TR.tid=m.tid; TR.them=m.them; TR.theirs=m.theirs; TR.ok=m.ok; TR.mine=m.mine;
  if (fresh){ closeAll(); trSay('Pick what you want to give. When the offers look right, both press READY.', true); TR.have=null; trLoadHave(); $id('tradebox').style.display='block'; }
  else if ($id('tradebox').style.display!=='block') $id('tradebox').style.display='block';
  trDraw(); };
NET.handlers.tradeend = m => { if (m.tid!==TR.tid && m.tid!==TR.ask) return; $id('tradebox').style.display='none'; $id('tradeask').style.display='none'; TR.tid=null; if (m.msg && m.msg!=='TRADE DONE!') localMsg(m.msg); };
NET.handlers.tradedone = m => { tkSet(m.tk, '🤝 TRADE DONE! Your new things are in 🎒 ITEMS.'); WD.furn=m.furn||WD.furn; WD.rares=m.rares||WD.rares; };
NET.handlers.quest = m => { if (m.info){ DAILY=m.info; dailyDot(); if (jobsEl.style.display==='block') openJobs(true); } if (m.msg){ if (Number.isFinite(m.tk)) tkSet(m.tk, m.msg); else localMsg(m.msg); } };
function openJobs(keep){ if (!keep){ closeAll(); dailyLoad(false); } let h=dailyHtml(DAILY);
  /* only the daily rewards and the jobs in the room you're standing in */
  const here=JOBS[curRoom]||[], rn=ROOM_NAMES[curRoom]||roomName(curRoom);
  if (!here.length) h+=`<div class="jroom here">📍 ${esc(rn)}</div>`+emptyBox('NO JOBS IN THIS ROOM', 'Tap ROOMS > MAP to visit LLAMA ACRES, the LOUNGE, the CASINO, the ARENA, the LANES, the BOXING GYM, TREASURE COVE or the JUNGLE TEMPLE. They all have jobs.')+'<div class="srow"><button class="gbbtn y" id="jobs_map">MAP</button></div>';
  for (const r of here.length ? [curRoom] : []){ const list=JOBS[r];
    h+=`<div class="jroom here">📍 JOBS HERE IN ${ROOM_NAMES[r]}</div>`;
    list.forEach((j,k)=>{ h+=`<div class="job ${j.risk?'risk':''}"><span class="ji">${j.i}</span><span class="jt"><b>${j.t}</b><small>${j.h}</small><span class="jp">${j.p}${j.risk?' · you can lose coins':''}</span></span><button class="gbbtn y" data-r="${r}" data-k="${k}">${r===curRoom?'GO':'GO ▶'}</button></div>`; }); }
  document.getElementById('jobs_body').innerHTML=h;
  { const c=$id('dj_claim'); if (c) c.addEventListener('click', ()=>dailyClaim(c)); }
  { const m=$id('jobs_map'); if (m) m.addEventListener('click', ()=>{ jobsEl.style.display='none'; openRooms('map'); }); }
  for (const b of jobsEl.querySelectorAll('[data-r]')) b.addEventListener('click', ()=>{ const r=b.dataset.r, j=JOBS[r][+b.dataset.k]; jobsEl.style.display='none';
    if (r!==curRoom){ showSwap(r); return; } if (me.p==='sit' && !(j.t==='Sit on the dunk tank')) { me.p='stand'; sendPresence(true); } j.go(); });
  jobsEl.style.display='block'; }
document.getElementById('jobsbtn').addEventListener('click', ()=>{ ensureAudio(); openJobs(); });
// ---- hide / show the shortcut buttons (remembered on this device) ----
{ const set=off=>{ document.body.classList.toggle('signs-off', off); try{ localStorage.setItem('ll_signsOff', off?'1':''); }catch(_){} };
  try{ if (localStorage.getItem('ll_signsOff')==='1') document.body.classList.add('signs-off'); }catch(_){}
  $id('signshide').addEventListener('click', e=>{ e.stopPropagation(); set(true); });
  $id('signsshow').addEventListener('click', e=>{ e.stopPropagation(); set(false); });
  setInterval(()=>{ const on=['fr_req','dm_un'].some(k=>{ const el=$id(k); return el && el.classList.contains('on') && el.textContent.trim()!=='' && el.textContent.trim()!=='0'; }); $id('signsshow').classList.toggle('dot', on); }, 1000); }

document.getElementById('jobs_close').addEventListener('click', ()=>{ jobsEl.style.display='none'; });

// ======================= POP-UP HEADER: ✕ CLOSE + DRAG TO MOVE =======================
function closeSheet(el){ ensureAudio();
  if (el.id==='itembox'){ el.style.display='none'; return; }
  if (el===arBox) arenaClose(); else if (el===bwBox) bowlClose();
  else if (el===rulesEl){ if (joined) rulesEl.style.display='none'; }
  else if (el===pick){ if (joined) pick.style.display='none'; }
  else closeAll(); }
// drag a pop-up by its header; it always stays fully on screen, and goes back to its usual spot when it closes
const POS=['left','top','right','bottom','transform','margin'];
function sheetReset(el){ if (!el.dataset.moved) return; delete el.dataset.moved; for (const k of POS) el.style.removeProperty(k); }
function sheetClamp(el){ if (!el.dataset.moved) return; const r=el.getBoundingClientRect();
  const L=Math.max(0, Math.min(innerWidth-r.width, r.left)), T=Math.max(0, Math.min(innerHeight-r.height, r.top));
  el.style.setProperty('left', L+'px', 'important'); el.style.setProperty('top', T+'px', 'important'); }
function makeDraggable(el, handle){
  let sx=0, sy=0, ox=0, oy=0, id=null, moved=false;
  handle.addEventListener('pointerdown', e=>{ if (e.target.closest('button') || e.button>0) return; e.stopPropagation();
    const r=el.getBoundingClientRect(); sx=e.clientX; sy=e.clientY; ox=r.left; oy=r.top; id=e.pointerId; moved=false;
    try{ handle.setPointerCapture(id); }catch(_){} handle.classList.add('drag'); });
  handle.addEventListener('pointermove', e=>{ if (e.pointerId!==id) return; const dx=e.clientX-sx, dy=e.clientY-sy;
    if (!moved){ if (Math.hypot(dx,dy)<4) return; moved=true; const r=el.getBoundingClientRect();
      el.dataset.moved='1'; el.style.setProperty('transform','none','important'); el.style.setProperty('right','auto','important'); el.style.setProperty('bottom','auto','important'); el.style.setProperty('margin','0','important');
      el.style.setProperty('width', r.width+'px'); }
    const r=el.getBoundingClientRect();
    el.style.setProperty('left', Math.max(0, Math.min(innerWidth-r.width, ox+dx))+'px', 'important');
    el.style.setProperty('top', Math.max(0, Math.min(innerHeight-r.height, oy+dy))+'px', 'important'); e.preventDefault(); });
  const end=e=>{ if (e.pointerId!==id) return; id=null; handle.classList.remove('drag'); try{ handle.releasePointerCapture(e.pointerId); }catch(_){} };
  handle.addEventListener('pointerup', end); handle.addEventListener('pointercancel', end);
  new MutationObserver(()=>{ if (el.style.display==='none' && el.dataset.moved){ sheetReset(el); el.style.removeProperty('width'); } }).observe(el, {attributes:true, attributeFilter:['style']});
}
addEventListener('resize', ()=>{ for (const el of document.querySelectorAll('[data-moved]')) sheetClamp(el); });
// ======================= POP-UP LOOK =======================
// every pop-up gets a colored header: a pixel icon tile, its title and a helpful second line
const SHEET_COL={boxbox:'#e03a48', menu:'#6b4bd8', wardbox:'#ff5c8a', frbox:'#f0b020', roomsbox:'#1fa58a', dmbox:'#3a8ef0', acctbox:'#5468e8', jobsbox:'#f09a20', lboard:'#f0b020', catbox:'#ff5c8a',
  logbox:'#6c6880', sndbox:'#3a8ef0', slotbox:'#d62d6a', tblbox:'#1f8a4c', dkbox:'#1c6ad8', dailypop:'#ff5c8a', tradeask:'#1fa58a', tradebox:'#1fa58a', dashbox:'#2a2340',
  roompick:'#6b4bd8', tmenu:'#1f8a4c', itembox:'#ff5c8a', plotbox:'#4aa04a', banbox:'#e8504a', repbox:'#e8504a', plkbox:'#7a3cd8', bugbox:'#e8504a', mktbox:'#e0662a', wfbox:'#e8a020'};
const SHEET_TITLE={menu:'🦙 MENU'};
const SHEET_ICON={menu:'llama', dashbox:'shield', logbox:'chat', lboard:'trophy', tblbox:'cards', slotbox:'slots', tmenu:'dice', roompick:'door', itembox:'sofa', tradeask:'handshake', bugbox:'bug', mktbox:'stall', wfbox:'warn'};
const tokTxt=()=>{ const n=wallet.get(); return `YOU HAVE ${n} TOKEN${n===1?'':'S'}`; };
const SHEET_SUB={
  menu:()=>`${(me.n||'').toUpperCase()} · ${tokTxt().slice(9)}`,
  wardbox:()=> WD.tab==='shop' ? (WD.kind==='clothes' && curRoom!=='store' ? 'BUY CLOTHES AT THE LLAMA STORE' : tokTxt()) : (()=>{ const c=INV.owned.filter(k=>ITEMS[k]).length, f=(WD.furn||[]).reduce((n,x)=>n+(x.n||0),0); return `${c} CLOTHES · ${f} ITEM${f===1?'':'S'}`; })(),
  frbox:()=>{ const f=FR.friends||[], on=f.filter(n=>frWhere(n)).length; return f.length ? `${f.length} FRIEND${f.length>1?'S':''} · ${on} ONLINE NOW` : 'MAKE SOME FRIENDS!'; },
  roomsbox:()=> !joined ? 'WHERE TO?' : PRUI.view==='map' ? 'PICK A PLACE TO GO' : 'FIND A ROOM TO HANG OUT IN', dmbox:()=>'PRIVATE CHATS WITH FRIENDS', acctbox:()=>`SIGNED IN AS ${(me.n||'').toUpperCase()}`,
  jobsbox:tokTxt, slotbox:tokTxt, plkbox:tokTxt, tblbox:tokTxt, dkbox:tokTxt, lboard:()=>'THE BEST LLAMAS IN THE LOUNGE', logbox:()=>'EVERYTHING SAID IN THIS ROOM',
  sndbox:()=>'MUSIC AND SOUND EFFECTS', dailypop:()=>'COME BACK EVERY DAY FOR MORE', tradebox:()=>'BOTH LLAMAS PRESS READY TO SWAP', tradeask:()=>'SWAP ITEMS AND TOKENS SAFELY',
  catbox:()=>'REAL SHIRTS FROM LA LLAMA P.I.C.', bugbox:()=>'TELL US WHAT WENT WRONG', wfbox:()=>'A FRIENDLY WARNING', mktbox:()=>MK.tab==='sell' ? `THE MARKET KEEPS ${Math.round((MK.fee||0.05)*100)}% OF EACH SALE` : tokTxt(), dashbox:()=>'STAFF ONLY', roompick:()=>'PICK A ROOM TO VISIT', tmenu:()=>'PICK A GAME TO PLAY',
  itembox:()=>ITD.k&&FURN_DEF[ITD.k] ? (FURN_CATS.find(c=>c[0]===FURN_DEF[ITD.k].cat)||[0,''])[1].replace(/^\S+\s/,'') : '' };
const lightCol=c=>{ const n=parseInt(c.slice(1),16); return ((n>>16)*299+(n>>8&255)*587+(n&255)*114)/1000 > 165; };
function sheetHead(el){ if (!el || !el._head) return; let col=SHEET_COL[el.id]||'#6b4bd8'; if (el.id==='wardbox') col = WD.tab==='shop' ? (WD.kind==='rares' ? '#e0a418' : WD.kind==='furn' ? '#f0742a' : '#ff5c8a') : '#8a5cf0';
  el.style.setProperty('--hc', col); el.style.setProperty('--ht', lightCol(col)?'#1d1530':'#fff'); headDecor(el);
  { const B=bodyPattern(col); el.style.setProperty('--bpat', `url(${B.url})`); el.style.setProperty('--bpw', B.w+'px'); el.style.setProperty('--bph', B.h+'px'); }
  const f=SHEET_SUB[el.id]; let t=''; try{ t=f?f():''; }catch(_){} const sb=el._head.sub; if (sb.textContent!==t) sb.textContent=t; sb.style.display=t?'':'none'; }

// header patterns: each pop-up's header gets a tiled pixel pattern of its own little motif, drawn at whole-pixel sizes
const HEAD_MOTIF={boxbox:'glove', menu:'llama', frbox:'star', roomsbox:'house', dmbox:'chat', acctbox:'key', jobsbox:'coin', lboard:'trophy', catbox:'shirt', logbox:'chat', sndbox:'music',
  slotbox:'slots', tblbox:'cards', dkbox:'splash', dailypop:'gift', tradeask:'handshake', tradebox:'handshake', dashbox:'crown', roompick:'pin', tmenu:'dice', itembox:'sofa', plkbox:'plinko', bugbox:'bug', mktbox:'stall', wfbox:'warn'};
const HPAT={}, HDPR=window.devicePixelRatio||1, HK=Math.max(1,Math.round(2*HDPR));   // one art pixel = HK real pixels (about 2 CSS px)
function headPattern(motif){ if (HPAT[motif]) return HPAT[motif]; const W=36, H=26, c=document.createElement('canvas'); c.width=W*HK; c.height=H*HK; const x=c.getContext('2d');
  const px=(i,j,a)=>{ x.fillStyle=`rgba(255,255,255,${a})`; x.fillRect(i*HK,j*HK,HK,HK); };
  const rows=(PIXSRC[motif]||PIXSRC.star).split('/');
  const stamp=(ox,oy)=>rows.forEach((r,j)=>{ for (let i=0;i<r.length;i++){ const ch=r[i]; if (ch==='.') continue; px(ox+i,oy+j, ch==='k' ? .22 : .12); } });
  stamp(2,1); stamp(20,14);
  for (const [i,j] of [[16,4],[33,9],[9,20],[27,2]]){ px(i,j,.35); px(i-1,j,.16); px(i+1,j,.16); px(i,j-1,.16); px(i,j+1,.16); }   /* little twinkles */
  return (HPAT[motif]={url:c.toDataURL(), w:W*HK/HDPR, h:H*HK/HDPR}); }
{ const c=document.createElement('canvas'); c.width=4*HK; c.height=3*HK; const x=c.getContext('2d'); x.fillStyle='rgba(20,10,40,.22)';
  for (const [i,j] of [[0,0],[2,0],[1,1],[3,1],[0,2],[1,2],[2,2],[3,2]]) x.fillRect(i*HK,j*HK,HK,HK);   /* dithered shading along the bottom edge */
  document.documentElement.style.setProperty('--hdith', `url(${c.toDataURL()})`); document.documentElement.style.setProperty('--hdw', `${4*HK/HDPR}px`); document.documentElement.style.setProperty('--hdh', `${3*HK/HDPR}px`); }
// pop-up bodies: a soft tint of the header colour with a faint pixel quilt in that colour (little diamonds, dots and a gentle checker), drawn at whole-pixel sizes
const BPAT={};
function bodyPattern(col){ if (BPAT[col]) return BPAT[col]; const W=20, H=20, c=document.createElement('canvas'); c.width=W*HK; c.height=H*HK; const x=c.getContext('2d');
  const n=parseInt(col.slice(1),16), rgb=`${n>>16},${(n>>8)&255},${n&255}`, px=(i,j,a)=>{ x.fillStyle=`rgba(${rgb},${a})`; x.fillRect(((i%W)+W)%W*HK,((j%H)+H)%H*HK,HK,HK); };
  for (let j=0;j<H;j++) for (let i=0;i<W;i++) if (((i<10)!==(j<10))) px(i,j,.035);   // quilt checker
  const diamond=(cx,cy,a)=>{ px(cx,cy,a); for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) px(cx+dx,cy+dy,a*.55); };
  diamond(5,5,.16); diamond(15,15,.16);   // a little pixel diamond in each square
  for (const [i,j] of [[15,4],[5,14],[0,0],[10,10]]) px(i,j,.12);   // dots between them
  return (BPAT[col]={url:c.toDataURL(), w:W*HK/HDPR, h:H*HK/HDPR}); }
function headDecor(el){ const m = el.id==='wardbox' ? (WD.tab==='shop' ? (WD.kind==='furn'?'sofa':WD.kind==='rares'?'star':'shirt') : 'backpack') : HEAD_MOTIF[el.id]; const P=headPattern(m||'star');
  el.style.setProperty('--hpat', `url(${P.url})`); el.style.setProperty('--hpw', P.w+'px'); el.style.setProperty('--hph', P.h+'px'); }
function popSnd(){ sfxTone(660,0.05,'square',0.05); sfxTone(990,0.06,'square',0.04,0.045); }
for (const el of document.querySelectorAll('.gb.sheet')){
  const h=document.createElement('div'); h.className='shead';
  const tt0=el.querySelector('.slt, .lbt, .dpt, #rp_title, #tm_title');
  if (tt0 || SHEET_TITLE[el.id]){
    h.classList.add('band'); el.classList.add('hasband');
    h.innerHTML='<span class="sgrip"></span><span class="sico"></span><div class="stx"></div><button class="sheetx" type="button" aria-label="Close"><span class="pi pi-x" aria-hidden="true"></span></button>';
    const stx=h.querySelector('.stx'), ico=h.querySelector('.sico');
    let tt=tt0; if (!tt){ tt=document.createElement('div'); tt.className='slt'; tt.textContent=SHEET_TITLE[el.id]; iconize(tt); }
    stx.appendChild(tt.parentNode && tt.parentNode.classList && tt.parentNode.classList.contains('dmhead') ? tt.parentNode : tt);
    const sub=document.createElement('div'); sub.className='ssub'; stx.appendChild(sub); h.sub=sub; el._head=h;
    /* the title's own leading icon moves into the big tile, even when the title text changes later */
    const grab=()=>{ const f=tt.firstElementChild; if (f && f.classList.contains('pi')) ico.replaceChildren(f); else if (!ico.firstChild) ico.innerHTML=pix(SHEET_ICON[el.id]||'star'); };
    new MutationObserver(grab).observe(tt, {childList:true, subtree:true, characterData:true}); grab();
  } else h.innerHTML='<span class="sgrip"></span><button class="sheetx" type="button" aria-label="Close"><span class="pi pi-x" aria-hidden="true"></span></button>';
  const x=h.querySelector('.sheetx'); x.addEventListener('pointerdown', e=>e.stopPropagation()); x.addEventListener('click', e=>{ e.stopPropagation(); closeSheet(el); });
  el.insertBefore(h, el.firstChild); makeDraggable(el, h);
  new MutationObserver(()=>{ const vis=!!el.style.display && el.style.display!=='none'; if (vis && !el._vis){ el.scrollTop=0; requestAnimationFrame(()=>{ el.scrollTop=0; }); sheetHead(el); if (el._head) popSnd(); } el._vis=vis; }).observe(el, {attributes:true, attributeFilter:['style']}); }
// the little pop-up you get by tapping a llama already has its own ✕; drag it by the name
makeDraggable(pmenuEl, document.getElementById('pm_name'));

startGate();
let last = performance.now();
function loop(now){
  const dt = Math.min(0.05, (now-last)/1000); last = now; const t = now/1000; frameDt=dt;
  if (joined){ updateMe(dt); updateArcade(dt); }
  tgTick(); updateTip();
  updateOthers(dt); updateRope(dt); updateText(dt); updateBars(dt);
  if (pendingSend && performance.now()-lastSent>=90) sendPresence(true);
  scheduleMusic();
  arenaTick(dt, now); bowlTick(dt, now);
  if (!AR.on && !BW.on) render(t); drawPreviews(t); drawPlinko(t);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
if (location.protocol==='file:') window.__ll={me,walkTo,doAction,cupHits,arcade,juke,startArcade,startGame,addBar:(n,t,c,x,y)=>addBar(n,t,c,x,y,false)};
initRoom();
initBoard();
setInterval(updateStatus, 2000);
})();
