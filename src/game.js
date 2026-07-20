(function(){

// ════════════════════════════════════════
// BACKGROUND CANVAS — Parallax Stars + Nebula
// ════════════════════════════════════════
(function(){
  const canvas=document.getElementById('bg-canvas');
  const ctx=canvas.getContext('2d');
  const DPR=Math.min(window.devicePixelRatio||1,2);
  let W,H,stars=[],neb=[],shoot=null,t=0;
  function build(){
    stars=[];
    const count=Math.round(Math.min(300,(W*H)/8200));
    for(let i=0;i<count;i++){
      const depth=Math.random();           // 0 = lejos/tenue, 1 = cerca/brillante
      stars.push({
        x:Math.random()*W,y:Math.random()*H,
        r:depth<.78?Math.random()*.9+.25:Math.random()*1.7+.9,
        a:Math.random(),
        da:(.0035+Math.random()*.011)*(Math.random()<.5?1:-1),
        depth:.12+depth*.88,
        col:Math.random()<.84?'255,255,255':(Math.random()<.5?'190,212,255':'255,214,240'),
      });
    }
    // Nebulosas en capas (centro, fríos y cálidos)
    neb=[
      {x:.5,y:.46,r:.95,c:'42,32,96',a:.22},
      {x:.18,y:.2,r:.6,c:'70,120,255',a:.11},
      {x:.84,y:.26,r:.55,c:'150,90,255',a:.10},
      {x:.72,y:.82,r:.62,c:'255,80,190',a:.08},
      {x:.26,y:.8,r:.52,c:'50,210,160',a:.06},
    ];
  }
  function resize(){
    W=window.innerWidth;H=window.innerHeight;
    canvas.width=W*DPR;canvas.height=H*DPR;
    canvas.style.width=W+'px';canvas.style.height=H+'px';
    ctx.setTransform(DPR,0,0,DPR,0,0);
    build();
  }
  function maybeShoot(){
    if(shoot||Math.random()>.0035)return;
    shoot={x:Math.random()*W*.8,y:-20,vx:3+Math.random()*3,vy:4+Math.random()*3,life:0,max:55+Math.random()*30};
  }
  function frame(){
    t+=.0015;
    // Espacio profundo de base (sin bordes ni contraste plano)
    const bg=ctx.createRadialGradient(W*.5,H*.4,0,W*.5,H*.55,Math.max(W,H)*.8);
    bg.addColorStop(0,'#0b0922');bg.addColorStop(.55,'#070518');bg.addColorStop(1,'#040310');
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    // Nebulosas suaves a la deriva
    ctx.globalCompositeOperation='lighter';
    neb.forEach((n,i)=>{
      const cx=n.x*W+Math.sin(t*.6+i)*W*.018, cy=n.y*H+Math.cos(t*.5+i*1.3)*H*.018;
      const rad=n.r*Math.max(W,H)*.55;
      const g=ctx.createRadialGradient(cx,cy,0,cx,cy,rad);
      g.addColorStop(0,`rgba(${n.c},${n.a})`);g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    });
    ctx.globalCompositeOperation='source-over';
    // Estrellas con parpadeo suave y leve parallax
    stars.forEach(s=>{
      s.a+=s.da;if(s.a>1){s.a=1;s.da=-s.da;}else if(s.a<.08){s.a=.08;s.da=-s.da;}
      s.x+=s.depth*.04;if(s.x>W+2)s.x=-2;
      ctx.globalAlpha=s.a*(.4+s.depth*.6);
      ctx.fillStyle='rgba('+s.col+',1)';
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fill();
      if(s.r>1.4){ // halo en estrellas brillantes
        ctx.globalAlpha=s.a*.22;
        ctx.beginPath();ctx.arc(s.x,s.y,s.r*2.8,0,6.283);ctx.fill();
      }
    });
    ctx.globalAlpha=1;
    // Estrella fugaz ocasional
    maybeShoot();
    if(shoot){
      shoot.life++;shoot.x+=shoot.vx;shoot.y+=shoot.vy;
      const tail=9;
      const grd=ctx.createLinearGradient(shoot.x,shoot.y,shoot.x-shoot.vx*tail,shoot.y-shoot.vy*tail);
      grd.addColorStop(0,'rgba(255,255,255,.85)');grd.addColorStop(1,'rgba(255,255,255,0)');
      ctx.strokeStyle=grd;ctx.lineWidth=2;ctx.lineCap='round';
      ctx.beginPath();ctx.moveTo(shoot.x,shoot.y);ctx.lineTo(shoot.x-shoot.vx*tail,shoot.y-shoot.vy*tail);ctx.stroke();
      if(shoot.life>shoot.max||shoot.y>H+30||shoot.x>W+30)shoot=null;
    }
    requestAnimationFrame(frame);
  }
  resize();window.addEventListener('resize',resize);
  frame();
})();

// ════════════════════════════════════════
// AUDIO
// ════════════════════════════════════════

// ════════════════════════════════════════════════════════
// PWA: Dynamic manifest (enables "Add to Home Screen")
// ════════════════════════════════════════════════════════
(function(){
  try{
    // Use the logo as icon (already embedded)
    const logoImg=document.querySelector('.splash-logo');
    const iconSrc=logoImg?logoImg.src:'';
    const manifest={
      name:'Math Rush Arena',short_name:'MathRush',
      description:'Juego educativo de matemáticas',
      start_url:'.',display:'fullscreen',orientation:'any',
      background_color:'#05040E',theme_color:'#05040E',
      icons:iconSrc?[{src:iconSrc,sizes:'512x512',type:'image/png',purpose:'any maskable'}]:[]
    };
    const blob=new Blob([JSON.stringify(manifest)],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('link');
    link.rel='manifest';link.href=url;
    document.head.appendChild(link);
    // Apple touch icon
    if(iconSrc){
      const al=document.createElement('link');al.rel='apple-touch-icon';al.href=iconSrc;
      document.head.appendChild(al);
    }
  }catch(e){}
})();

const bgm=document.getElementById('bgm');
let musicOn=false;
function startMusic(){musicOn=true;bgm.volume=.6;const p=bgm.play();if(p?.catch)p.catch(()=>{});updateMusicBtns();}
function stopMusic(){musicOn=false;bgm.pause();updateMusicBtns();}
function toggleMusic(){musicOn?stopMusic():startMusic();}
function updateMusicBtns(){
  ['music-btn','cs-music'].forEach(id=>{const b=document.getElementById(id);if(b){b.textContent=musicOn?'🔊':'🔇';b.classList.toggle('music-on',musicOn);}});
}
document.addEventListener('touchstart',()=>{if(musicOn&&bgm.paused)bgm.play()?.catch(()=>{});},{passive:true});
document.addEventListener('click',()=>{if(musicOn&&bgm.paused)bgm.play()?.catch(()=>{});});

// ════════════════════════════════════════════════════════
// PERSISTENT PROGRESSION (localStorage)
// ════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════
// SFX — Efectos de sonido sintetizados (WebAudio, sin assets)
// ════════════════════════════════════════════════════════
const SFX=(()=>{
  let ctx=null,ok=true;
  function ac(){
    if(!ok)return null;
    if(!ctx){try{ctx=new (window.AudioContext||window.webkitAudioContext)();}catch(e){ok=false;return null;}}
    if(ctx.state==='suspended')ctx.resume();
    return ctx;
  }
  function tone(f,dur,type,vol,delay,slideTo){
    const c=ac();if(!c)return;
    const t=c.currentTime+(delay||0);
    const o=c.createOscillator(),g=c.createGain();
    o.type=type||'sine';o.frequency.setValueAtTime(f,t);
    if(slideTo)o.frequency.exponentialRampToValueAtTime(Math.max(40,slideTo),t+dur);
    g.gain.setValueAtTime(vol||.12,t);
    g.gain.exponentialRampToValueAtTime(.0001,t+dur);
    o.connect(g);g.connect(c.destination);
    o.start(t);o.stop(t+dur+.05);
  }
  return{
    unlock(){ac();},
    click(){tone(640,.05,'triangle',.06);},
    tick(){tone(300+Math.random()*80,.035,'square',.035);},
    dice(){tone(520,.09,'triangle',.12);tone(780,.14,'triangle',.1,.07);},
    move(){tone(430+Math.random()*60,.05,'triangle',.05);},
    correct(){tone(523,.12,'sine',.13);tone(659,.12,'sine',.13,.09);tone(784,.22,'sine',.13,.18);},
    wrong(){tone(220,.22,'sawtooth',.09,0,140);tone(165,.3,'sawtooth',.07,.12,110);},
    combo(n){tone(560+n*70,.09,'square',.06);tone(760+n*70,.14,'square',.06,.07);},
    urgent(){tone(880,.07,'square',.07);},
    timeout(){tone(330,.4,'sine',.11,0,150);},
    win(){[523,659,784,1047,784,1047,1319].forEach((f,i)=>tone(f,.22,'triangle',.11,i*.12));},
    chest(){[392,494,587,784].forEach((f,i)=>tone(f,.16,'triangle',.11,i*.09));tone(1175,.4,'sine',.1,.4);},
    powerup(){tone(440,.1,'triangle',.1,0,880);tone(880,.18,'triangle',.09,.1,1320);},
  };
})();
document.addEventListener('pointerdown',()=>SFX.unlock(),{once:true});
document.addEventListener('click',e=>{const b=e.target.closest('button');if(b&&!b.disabled)SFX.click();},true);

// ════════════════════════════════════════════════════════
// CONFETI DE VICTORIA
// ════════════════════════════════════════════════════════
function launchConfetti(n=90){
  const palette=['#5B9FFF','#FF5BC8','#3FE88A','#FFD23F','#B06FFF','#FF4E6A','#FFFFFF'];
  for(let i=0;i<n;i++){
    const c=document.createElement('div');c.className='confetti';
    const w=5+Math.floor(Math.random()*6);
    c.style.cssText=`left:${Math.random()*100}vw;background:${palette[Math.floor(Math.random()*palette.length)]};width:${w}px;height:${w+4+Math.floor(Math.random()*8)}px;animation-delay:${(Math.random()*1.2).toFixed(2)}s;animation-duration:${(2.2+Math.random()*1.6).toFixed(2)}s;`;
    document.body.appendChild(c);
    setTimeout(()=>c.remove(),5200);
  }
}

const SAVE_KEY='mra_save_v5';
let SAVE={
  coins:0,gems:0,xp:0,level:1,
  unlockedChars:['mago'],// always start with Matemago
  charLevels:{},// charId -> level
  collection:{chars:[],trophies:[],avatars:[],badges:[],fx:[]},
  chestProgress:0,// games until next free chest
  totalGames:0,totalWins:0,bestCombo:0,
  ownedChests:[],
};
function loadSave(){
  try{const s=localStorage.getItem(SAVE_KEY);if(s)SAVE={...SAVE,...JSON.parse(s)};}catch(e){}
  if(!SAVE.charLevels)SAVE.charLevels={};
  if(!SAVE.collection)SAVE.collection={chars:[],trophies:[],avatars:[],badges:[],fx:[]};
  unlockEverything();
}
// ── MODELO LIBERADO: todo desbloqueado para el dueño del juego ──
function unlockEverything(){
  try{
    // Todos menos el Dragón Dorado ONEX (solo se gana con código del gimnasio)
    const hasDragon=(()=>{try{return localStorage.getItem('onex_dragon')==='1';}catch(e){return false;}})();
    const unlockable=CHARS.filter(c=>c.id!=='dragon_onex'||hasDragon).map(c=>c.id);
    SAVE.unlockedChars=unlockable;                          // todos los personajes
    SAVE.collection.chars=unlockable;                       // colección completa
    SAVE.collection.cards=CARDS.map(c=>c.id);
    if((SAVE.coins||0)<99999)SAVE.coins=99999;             // monedas de sobra
    if((SAVE.gems||0)<9999)SAVE.gems=9999;                 // gemas de sobra
    // Varios cofres de cada tipo listos para abrir
    const want=['legend','epic','rare','common','legend','epic','rare','common','legend','epic'];
    if(!SAVE.ownedChests)SAVE.ownedChests=[];
    if(SAVE.ownedChests.length<6)SAVE.ownedChests=want.slice();
    if((SAVE.level||1)<20)SAVE.level=20;                   // nivel alto
    persist();
  }catch(e){}
}
function persist(){try{localStorage.setItem(SAVE_KEY,JSON.stringify(SAVE));}catch(e){}}

function xpForLevel(lv){return lv*100;}
function addXP(amt){
  SAVE.xp+=amt;
  let leveledUp=false;
  while(SAVE.xp>=xpForLevel(SAVE.level)){
    SAVE.xp-=xpForLevel(SAVE.level);SAVE.level++;leveledUp=true;
  }
  persist();
  return leveledUp;
}
function charLevel(id){return SAVE.charLevels[id]||1;}
function addCharXP(id,amt){
  if(!SAVE.charLevels[id])SAVE.charLevels[id]=1;
  // simplistic: every 3 games = +1 level up to 20
  persist();
}

// ════════════════════════════════════════════════════════
// CHESTS
// ════════════════════════════════════════════════════════
const CHEST_TYPES={
  common:{name:'Cofre Común',icon:'📦',color:'#9aa5b8',cards:3,coins:[10,30],gemChance:.05,glow:'#9aa5b8'},
  rare:{name:'Cofre Raro',icon:'🎁',color:'#5B9FFF',cards:4,coins:[30,60],gemChance:.15,glow:'#5B9FFF'},
  epic:{name:'Cofre Épico',icon:'💜',color:'#B06FFF',cards:5,coins:[60,120],gemChance:.4,glow:'#B06FFF'},
  legend:{name:'Cofre Legendario',icon:'👑',color:'#FFD23F',cards:6,coins:[120,250],gemChance:1,glow:'#FFD23F'},
};
function openChest(type){
  const ch=CHEST_TYPES[type];
  const rewards={coins:0,gems:0,cards:[],newChar:null};
  rewards.coins=ch.coins[0]+rnd(ch.coins[1]-ch.coins[0]);
  if(Math.random()<ch.gemChance)rewards.gems=1+rnd(3);
  // Cards by rarity weighted by chest tier
  const tierWeights={
    common:{common:70,rare:25,epic:5,legend:0},
    rare:{common:50,rare:35,epic:13,legend:2},
    epic:{common:30,rare:40,epic:25,legend:5},
    legend:{common:10,rare:35,epic:40,legend:15},
  };
  const w=tierWeights[type];
  for(let i=0;i<ch.cards;i++){
    const r=rnd(100);let acc=0,rar='common';
    for(const[k,v]of Object.entries(w)){acc+=v;if(r<acc){rar=k;break;}}
    const pool=CARDS.filter(c=>c.rarity===rar);
    rewards.cards.push(pool.length?pick(pool):pick(CARDS));
  }
  // Chance to unlock a character
  const locked=CHARS.filter(c=>!SAVE.unlockedChars.includes(c.id));
  if(locked.length&&Math.random()<(type==='legend'?.5:type==='epic'?.25:.1)){
    const nc=pick(locked);rewards.newChar=nc;SAVE.unlockedChars.push(nc.id);
    if(!SAVE.collection.chars.includes(nc.id))SAVE.collection.chars.push(nc.id);
  }
  SAVE.coins+=rewards.coins;SAVE.gems+=rewards.gems;persist();
  return rewards;
}

// ════════════════════════════════════════════════════════
// 50+ RANDOM EVENTS
// ════════════════════════════════════════════════════════
const MEGA_EVENTS=[
  {e:'⭐',t:'LLUVIA DE ESTRELLAS',d:'¡Todos ganan 10 puntos!',fx:'all_pts_10'},
  {e:'👾',t:'INVASIÓN ALIENÍGENA',d:'Todos retroceden 2 casillas',fx:'all_back2'},
  {e:'🌀',t:'PORTAL ESPACIAL',d:'¡Posiciones intercambiadas!',fx:'swap_all'},
  {e:'🌪️',t:'TORMENTA MATEMÁTICA',d:'Pregunta sorpresa para el líder',fx:'leader_q'},
  {e:'🔄',t:'DIMENSIÓN INVERTIDA',d:'¡El último pasa a primero!',fx:'reverse_lead'},
  {e:'🕳️',t:'AGUJERO NEGRO',d:'El líder retrocede 4 casillas',fx:'leader_back4'},
  {e:'🏴‍☠️',t:'NAVE PIRATA ESPACIAL',d:'¡Roba 5 pts a todos los demás!',fx:'pirate'},
  {e:'⚡',t:'HORA DEL GENIO',d:'Puntos x2 esta ronda',fx:'double_pts'},
  {e:'💰',t:'TESORO PERDIDO',d:'¡Todos reciben una carta!',fx:'all_cards'},
  {e:'🚀',t:'RUSH TURBO',d:'¡Todos avanzan 2 casillas!',fx:'all_fwd2'},
  {e:'🎰',t:'RULETA CÓSMICA',d:'Un jugador al azar gana 20 pts',fx:'random_20'},
  {e:'❄️',t:'ERA DE HIELO',d:'El líder pierde su próximo turno',fx:'freeze_leader'},
  {e:'🔥',t:'METEORITO ARDIENTE',d:'Todos pierden 5 pts',fx:'all_lose5'},
  {e:'🌈',t:'ARCOÍRIS DE SUERTE',d:'¡El último recibe carta legendaria!',fx:'last_legend'},
  {e:'💎',t:'MINA DE DIAMANTES',d:'Todos ganan 1 gema',fx:'all_gem'},
  {e:'🎭',t:'INTERCAMBIO CAÓTICO',d:'Las puntuaciones se mezclan',fx:'shuffle_pts'},
  {e:'⏰',t:'TIEMPO ACELERADO',d:'Próximas preguntas valen doble',fx:'double_pts'},
  {e:'🛸',t:'ABDUCCIÓN',d:'Un jugador al azar avanza 5',fx:'random_fwd5'},
  {e:'🌟',t:'SUPERNOVA',d:'¡Reinicia combos de todos!',fx:'reset_combos'},
  {e:'🎁',t:'GENEROSIDAD CÓSMICA',d:'Todos ganan 15 pts',fx:'all_pts_15'},
  {e:'🪐',t:'ALINEACIÓN PLANETARIA',d:'El líder gana 25 pts extra',fx:'leader_25'},
  {e:'☄️',t:'COMETA VELOZ',d:'El último avanza 4 casillas',fx:'last_fwd4'},
  {e:'🔮',t:'PROFECÍA',d:'Próxima respuesta correcta vale x3',fx:'triple_next'},
  {e:'🎪',t:'CIRCO ESPACIAL',d:'Todos cambian de posición en círculo',fx:'rotate_pos'},
  {e:'💫',t:'POLVO ESTELAR',d:'Todos reciben +1 carta y +5 pts',fx:'dust'},
  {e:'🌑',t:'ECLIPSE TOTAL',d:'Nadie gana puntos esta ronda',fx:'no_pts'},
  {e:'🎆',t:'FUEGOS ARTIFICIALES',d:'¡Doble puntos + carta para el líder!',fx:'leader_combo'},
  {e:'🧲',t:'CAMPO MAGNÉTICO',d:'Todos se acercan al centro',fx:'magnetize'},
  {e:'🎯',t:'DIANA PERFECTA',d:'Jugador al azar gana carta épica',fx:'random_epic'},
  {e:'🌋',t:'ERUPCIÓN VOLCÁNICA',d:'Los 2 primeros retroceden 3',fx:'top2_back'},
  {e:'🦄',t:'UNICORNIO MÁGICO',d:'El último gana 30 pts',fx:'last_30'},
  {e:'⚓',t:'ANCLA ESPACIAL',d:'El líder no avanza el próximo turno',fx:'freeze_leader'},
  {e:'🎲',t:'DADOS DE LA FORTUNA',d:'¡Todos lanzan de nuevo!',fx:'all_roll'},
  {e:'🏆',t:'COPA RELÁMPAGO',d:'Primera respuesta correcta +20',fx:'first_correct_20'},
  {e:'🌙',t:'NOCHE TRANQUILA',d:'Todos descansan, +5 pts',fx:'all_pts_5'},
  {e:'💥',t:'EXPLOSIÓN CÓSMICA',d:'Posiciones y puntos se mezclan',fx:'chaos'},
  {e:'🔋',t:'CARGA DE ENERGÍA',d:'Todos los combos +1',fx:'combo_boost'},
  {e:'🎨',t:'LIENZO MÁGICO',d:'El último recibe carta épica',fx:'last_epic'},
  {e:'🗝️',t:'LLAVE MAESTRA',d:'Todos reciben un cofre común',fx:'all_chest'},
  {e:'🌊',t:'MAREA CÓSMICA',d:'Todos retroceden al múltiplo de 5',fx:'tide'},
  {e:'🎺',t:'FANFARRIA',d:'El líder gana 20 pts',fx:'leader_20'},
  {e:'🕯️',t:'LUZ GUÍA',d:'Próxima pregunta da pista',fx:'hint_next'},
  {e:'🧨',t:'DINAMITA',d:'Líder pierde 10 pts',fx:'leader_lose10'},
  {e:'🎈',t:'GLOBOS DE FIESTA',d:'Todos avanzan 1 casilla',fx:'all_fwd1'},
  {e:'🌌',t:'GALAXIA INFINITA',d:'Doble XP esta partida',fx:'double_xp'},
  {e:'🦾',t:'POTENCIADOR',d:'Jugador al azar gana carta legendaria',fx:'random_legend'},
  {e:'🎬',t:'CÁMARA LENTA',d:'Más tiempo en próximas preguntas',fx:'slow_time'},
  {e:'🪙',t:'LLUVIA DE MONEDAS',d:'Todos ganan 20 monedas',fx:'all_coins'},
  {e:'🌠',t:'DESEO ESTELAR',d:'El último jugador pide un deseo (+25)',fx:'last_25'},
  {e:'⚙️',t:'ENGRANAJE CÓSMICO',d:'Rotación de posiciones',fx:'rotate_pos'},
  {e:'🎵',t:'MELODÍA MÁGICA',d:'Todos +8 pts',fx:'all_pts_8'},
  {e:'🔱',t:'TRIDENTE DIVINO',d:'Top 3 reciben carta',fx:'top3_cards'},
];

function applyMegaEvent(ev){
  addLog('🌍 '+ev.t);
  const players=G.players;
  const leader=[...players].sort((a,b)=>b.points-a.points)[0];
  const last=[...players].sort((a,b)=>a.points-b.points)[0];
  switch(ev.fx){
    case'all_pts_5':players.forEach(p=>p.points+=5);break;
    case'all_pts_8':players.forEach(p=>p.points+=8);break;
    case'all_pts_10':players.forEach(p=>p.points+=10);break;
    case'all_pts_15':players.forEach(p=>p.points+=15);break;
    case'all_lose5':players.forEach(p=>p.points=Math.max(0,p.points-5));break;
    case'all_back2':players.forEach(p=>p.pos=relMove(p.pos,-2));updateAllPawns();break;
    case'all_fwd1':players.forEach(p=>p.pos=relMove(p.pos,1));updateAllPawns();break;
    case'all_fwd2':players.forEach(p=>p.pos=Math.min(47,p.pos+2));updateAllPawns();break;
    case'swap_all':{const pos=players.map(p=>p.pos).sort(()=>Math.random()-.5);players.forEach((p,i)=>p.pos=pos[i]);updateAllPawns();break;}
    case'rotate_pos':{const pos=players.map(p=>p.pos);players.forEach((p,i)=>p.pos=pos[(i+1)%players.length]);updateAllPawns();break;}
    case'leader_back4':leader.pos=Math.max(0,leader.pos-4);updateAllPawns();break;
    case'leader_25':leader.points+=25;break;
    case'leader_20':leader.points+=20;break;
    case'leader_lose10':leader.points=Math.max(0,leader.points-10);break;
    case'last_30':last.points+=30;break;
    case'last_25':last.points+=25;break;
    case'last_fwd4':last.pos=Math.min(47,last.pos+4);updateAllPawns();break;
    case'last_legend':{const lg=CARDS.filter(c=>c.rarity==='legend');if(!last.cards)last.cards=[];last.cards.push({...pick(lg)});break;}
    case'last_epic':{const ep=CARDS.filter(c=>c.rarity==='epic');if(!last.cards)last.cards=[];last.cards.push({...pick(ep)});break;}
    case'pirate':players.forEach(p=>{if(p.id!==leader.id){const s=Math.min(5,p.points);p.points-=s;leader.points+=s;}});break;
    case'double_pts':G.doubleRound=true;break;
    case'double_xp':G.doubleXP=true;break;
    case'all_cards':players.forEach(p=>{if(!p.cards)p.cards=[];p.cards.push({...pick(CARDS)});});break;
    case'all_gem':SAVE.gems+=players.length;persist();break;
    case'all_coins':SAVE.coins+=20;persist();break;
    case'random_20':pick(players).points+=20;break;
    case'random_fwd5':{const rp=pick(players);rp.pos=Math.min(47,rp.pos+5);updateAllPawns();break;}
    case'random_epic':{const rp=pick(players);const ep=CARDS.filter(c=>c.rarity==='epic');if(!rp.cards)rp.cards=[];rp.cards.push({...pick(ep)});break;}
    case'random_legend':{const rp=pick(players);const lg=CARDS.filter(c=>c.rarity==='legend');if(!rp.cards)rp.cards=[];rp.cards.push({...pick(lg)});break;}
    case'freeze_leader':G.frozen.push(leader.id);break;
    case'reset_combos':players.forEach(p=>p.combo=0);break;
    case'combo_boost':players.forEach(p=>p.combo=(p.combo||0)+1);break;
    case'reverse_lead':{const tmp=leader.points;leader.points=last.points;last.points=tmp;break;}
    case'shuffle_pts':{const pts=players.map(p=>p.points).sort(()=>Math.random()-.5);players.forEach((p,i)=>p.points=pts[i]);break;}
    case'chaos':{const pts=players.map(p=>p.points).sort(()=>Math.random()-.5);const pos=players.map(p=>p.pos).sort(()=>Math.random()-.5);players.forEach((p,i)=>{p.points=pts[i];p.pos=pos[i];});updateAllPawns();break;}
    case'top2_back':{const sorted=[...players].sort((a,b)=>b.points-a.points);sorted.slice(0,2).forEach(p=>{p.pos=Math.max(0,p.pos-3);});updateAllPawns();break;}
    case'top3_cards':{const sorted=[...players].sort((a,b)=>b.points-a.points);sorted.slice(0,3).forEach(p=>{if(!p.cards)p.cards=[];p.cards.push({...pick(CARDS)});});break;}
    case'tide':players.forEach(p=>{p.pos=Math.max(0,Math.floor(p.pos/5)*5);});updateAllPawns();break;
    case'magnetize':players.forEach(p=>{if(p.pos<24)p.pos=Math.min(24,p.pos+2);else p.pos=Math.max(24,p.pos-2);});updateAllPawns();break;
    case'no_pts':G.noPtsRound=true;break;
    case'triple_next':G.tripleNext=true;break;
    case'dust':players.forEach(p=>{if(!p.cards)p.cards=[];p.cards.push({...pick(CARDS)});p.points+=5;});break;
    default:break;
  }
  renderScore();renderPanel();
}

// ════════════════════════════════════════
// CHARACTERS
// ════════════════════════════════════════
const CHARS=[
  {id:'mago',name:'Matemago',emoji:'🧙',desc:'+10% puntos en cada respuesta',ability:'bonus_pts',rarity:'epic'},
  {id:'astro',name:'Astronauta',emoji:'👨‍🚀',desc:'Una vez por partida: avanza 5 casillas',ability:'teleport5',rarity:'rare'},
  {id:'robot',name:'Robot IA',emoji:'🤖',desc:'Puede repetir una respuesta incorrecta',ability:'retry',rarity:'epic'},
  {id:'dragon',name:'Dragón Matemático',emoji:'🐲',desc:'Roba una carta al acertar',ability:'steal_card',rarity:'legend'},
  {id:'ninja',name:'Ninja Numérico',emoji:'🥷',desc:'Evita la siguiente trampa',ability:'dodge_trap',rarity:'rare'},
  {id:'alien',name:'Alienígena',emoji:'👾',desc:'Las preguntas dan +5 pts extra',ability:'extra5',rarity:'epic'},
  // Skin exclusiva del gimnasio ONEX — se desbloquea con código de staff (solo visual, sin ventaja)
  {id:'dragon_onex',name:'Dragón Dorado ONEX',emoji:'🐉',desc:'Skin exclusiva del gimnasio ONEX',ability:'none',rarity:'legend'},
];

// ════════════════════════════════════════
// CARDS
// ════════════════════════════════════════
const CARDS=[
  {id:'turbo3',name:'Turbo x3',icon:'🚀',desc:'Avanza 3 casillas',rarity:'common',color:'#5B9FFF'},
  {id:'turbo5',name:'Turbo x5',icon:'⚡',desc:'Avanza 5 casillas',rarity:'uncommon',color:'#3FE88A'},
  {id:'shield',name:'Escudo',icon:'🛡️',desc:'Protege del siguiente ataque',rarity:'common',color:'#5B9FFF'},
  {id:'freeze',name:'Congelar',icon:'❄️',desc:'Congela un turno de un rival',rarity:'uncommon',color:'#8ACDFF'},
  {id:'steal',name:'Ladrón',icon:'💎',desc:'Roba 8 pts de un rival',rarity:'uncommon',color:'#FFD23F'},
  {id:'double',name:'Doble Turno',icon:'🔄',desc:'Juegas dos veces seguidas',rarity:'epic',color:'#B06FFF'},
  {id:'teleport',name:'Teletransporte',icon:'🌀',desc:'Avanza 8 casillas',rarity:'legend',color:'#FFD23F'},
  {id:'divine',name:'Escudo Divino',icon:'✨',desc:'Ignora trampas por 2 turnos',rarity:'legend',color:'#FFD23F'},
  {id:'swap',name:'Cambio de Destino',icon:'🔀',desc:'Intercambia posición con un rival',rarity:'legend',color:'#FF8800'},
  {id:'genius',name:'Doble Genio',icon:'🧠',desc:'Duplica puntos de la siguiente respuesta',rarity:'epic',color:'#B06FFF'},
];
const RARITY_STYLE={
  common:{label:'COMÚN',bg:'#5B9FFF18',color:'#5B9FFF',border:'#5B9FFF33'},
  rare:{label:'RARO',bg:'#5B9FFF18',color:'#5B9FFF',border:'#5B9FFF33'},
  uncommon:{label:'POCO COMÚN',bg:'#3FE88A18',color:'#3FE88A',border:'#3FE88A33'},
  epic:{label:'ÉPICA',bg:'#B06FFF18',color:'#B06FFF',border:'#B06FFF33'},
  legend:{label:'LEGENDARIA',bg:'#FFD23F18',color:'#FFD23F',border:'#FFD23F33'},
};

// ════════════════════════════════════════
// QUESTIONS — 100% MATH
// ════════════════════════════════════════
const EQ=[
  {q:"¿Cuánto es 6 + 7?",o:["11","12","13","14"],a:"13"},
  {q:"¿Cuánto es 15 + 28?",o:["41","43","44","45"],a:"43"},
  {q:"¿Cuánto es 50 − 17?",o:["31","33","35","37"],a:"33"},
  {q:"¿Cuánto es 100 − 37?",o:["61","63","65","67"],a:"63"},
  {q:"¿Cuánto es 45 + 55?",o:["95","98","100","102"],a:"100"},
  {q:"¿Cuánto es 6 × 7?",o:["38","42","45","48"],a:"42"},
  {q:"¿Cuánto es 12 × 3?",o:["34","36","38","40"],a:"36"},
  {q:"¿Cuánto es 7 × 8?",o:["54","56","58","60"],a:"56"},
  {q:"¿Cuánto es 9 × 9?",o:["72","81","80","79"],a:"81"},
  {q:"¿Cuánto es 13 × 4?",o:["48","50","52","54"],a:"52"},
  {q:"¿Cuánto es 81 ÷ 9?",o:["7","8","9","10"],a:"9"},
  {q:"¿Cuánto es 100 ÷ 4?",o:["20","25","30","35"],a:"25"},
  {q:"¿Cuánto es 64 ÷ 8?",o:["6","7","8","9"],a:"8"},
  {q:"¿Cuánto es 72 ÷ 6?",o:["10","11","12","13"],a:"12"},
  {q:"¿Cuánto es 8²?",o:["56","60","64","68"],a:"64"},
  {q:"¿Cuánto es √64?",o:["6","7","8","9"],a:"8"},
  {q:"¿Cuánto es √121?",o:["10","11","12","13"],a:"11"},
  {q:"¿La mitad de 80?",o:["35","40","45","50"],a:"40"},
  {q:"¿Cuánto es ¼ de 100?",o:["20","25","30","35"],a:"25"},
  {q:"¿Cuánto es 11 × 11?",o:["112","121","131","111"],a:"121"},
  {q:"¿Cuánto es 3³?",o:["9","18","27","33"],a:"27"},
  {q:"¿Cuánto es 15 × 6?",o:["80","85","90","95"],a:"90"},
  {q:"¿Cuánto es 4 × 4 × 4?",o:["48","54","64","72"],a:"64"},
  {q:"¿Cuánto es 200 − 75?",o:["115","120","125","130"],a:"125"},
  {q:"¿Cuánto es 144 ÷ 12?",o:["10","11","12","13"],a:"12"},
  {q:"¿Cuánto es ⅓ de 90?",o:["25","28","30","33"],a:"30"},
  {q:"¿Cuánto es 99 + 11?",o:["108","110","112","120"],a:"110"},
  {q:"¿Cuánto es 56 ÷ 7?",o:["6","7","8","9"],a:"8"},
  {q:"¿Cuánto es 225 ÷ 15?",o:["13","14","15","16"],a:"15"},
  {q:"¿Cuánto es 12²?",o:["132","140","144","148"],a:"144"},
];
const HQ=[
  {q:"Si 3x + 5 = 20, ¿x = ?",o:["4","5","6","7"],a:"5"},
  {q:"Si 2x − 8 = 14, ¿x = ?",o:["9","10","11","12"],a:"11"},
  {q:"Si x² = 81, ¿x = ?",o:["7","8","9","10"],a:"9"},
  {q:"Si 5x = 125, ¿x = ?",o:["20","22","25","30"],a:"25"},
  {q:"Si x/4 = 12, ¿x = ?",o:["36","42","48","54"],a:"48"},
  {q:"¿Cuánto es 2¹⁰?",o:["512","1024","2048","256"],a:"1024"},
  {q:"¿Cuánto es 2⁸?",o:["128","256","512","64"],a:"256"},
  {q:"¿Cuánto es 3⁵?",o:["125","213","243","270"],a:"243"},
  {q:"¿Cuánto es √225?",o:["13","14","15","16"],a:"15"},
  {q:"¿Cuánto es ³√27?",o:["2","3","4","5"],a:"3"},
  {q:"¿Cuánto es 5!?",o:["60","100","120","150"],a:"120"},
  {q:"¿Cuánto es 6!?",o:["480","620","720","820"],a:"720"},
  {q:"¿El 15% de 200?",o:["25","30","35","40"],a:"30"},
  {q:"¿El 25% de 480?",o:["100","110","115","120"],a:"120"},
  {q:"¿El 40% de 250?",o:["90","95","100","110"],a:"100"},
  {q:"log₁₀(1000) = ?",o:["2","3","4","10"],a:"3"},
  {q:"log₂(32) = ?",o:["4","5","6","7"],a:"5"},
  {q:"Ángulos internos triángulo:",o:["90°","120°","180°","360°"],a:"180°"},
  {q:"Ángulos internos pentágono:",o:["450°","540°","630°","360°"],a:"540°"},
  {q:"¿Cuánto es 17 × 13?",o:["211","221","231","241"],a:"221"},
  {q:"¿Cuánto es 999 × 9?",o:["8981","8991","9001","8901"],a:"8991"},
  {q:"¿Cuánto es 33²?",o:["1069","1089","1099","1109"],a:"1089"},
  {q:"¿Cuánto es 0.25 × 400?",o:["80","90","100","110"],a:"100"},
  {q:"¿Cuánto es π × 2 ≈?",o:["5.28","6.28","7.28","8.28"],a:"6.28"},
  {q:"Si 4x − 3 = 17, ¿x = ?",o:["4","5","6","7"],a:"5"},
  {q:"¿Cuánto es 7!?",o:["2520","4040","5040","6048"],a:"5040"},
  {q:"¿El 8% de 400?",o:["28","30","32","34"],a:"32"},
  {q:"¿Cuánto es ³√125?",o:["4","5","6","7"],a:"5"},
  {q:"Ángulos internos cuadrado:",o:["180°","270°","360°","450°"],a:"360°"},
  {q:"¿Cuánto es 125 × 8?",o:["900","950","1000","1050"],a:"1000"},
];

// Boss questions (extra hard)
const BQ=[
  {q:"¿Cuánto es 23 × 17?",o:["381","391","401","411"],a:"391"},
  {q:"Si 2x² = 50, ¿x = ?",o:["3","4","5","6"],a:"5"},
  {q:"¿Cuánto es 12³?",o:["1528","1728","1928","2128"],a:"1728"},
  {q:"log₁₀(10000) = ?",o:["3","4","5","6"],a:"4"},
  {q:"¿El 35% de 600?",o:["180","200","210","220"],a:"210"},
];

// Global events
const GLOBAL_EVENTS=[
  {emoji:'⚡',title:'¡HORA DEL GENIO!',desc:'Las preguntas valen el DOBLE esta ronda.',effect:'double_pts'},
  {emoji:'🌪️',title:'TORMENTA MATEMÁTICA',desc:'Todos los jugadores retroceden 2 casillas.',effect:'all_back'},
  {emoji:'🌀',title:'AGUJERO NEGRO',desc:'¡Las posiciones se intercambian aleatoriamente!',effect:'swap_all'},
  {emoji:'🚀',title:'¡RUSH MATEMÁTICO!',desc:'Todos tiran el dado nuevamente ahora.',effect:'all_roll'},
  {emoji:'💰',title:'TESORO PERDIDO',desc:'¡Todos reciben una carta aleatoria!',effect:'all_cards'},
];

// Achievements
const ACHIEVEMENTS=[
  {id:'first_genius',name:'Primer Genio',desc:'5 respuestas seguidas correctas',icon:'🧠',trigger:'combo5'},
  {id:'unstoppable',name:'¡Imparable!',desc:'10 casillas en un turno',icon:'💨',trigger:'move10'},
  {id:'survivor',name:'Superviviente',desc:'3 trampas sobrevividas',icon:'🛡️',trigger:'traps3'},
  {id:'champion',name:'Campeón Matemático',desc:'Ganar la partida',icon:'🏆',trigger:'win'},
  {id:'boss_slayer',name:'Mata Jefes',desc:'Ganar una batalla de jefe',icon:'⚔️',trigger:'boss_win'},
];

// ════════════════════════════════════════
// TABLERO BASADO EN IMAGEN (assets/board.png)
// Recorrido de 46 casillas: 1–29, 31–47 (no existe 30).
// El orden del recorrido se define por PATH; cada casilla tiene
// coordenadas en % sobre la imagen del tablero.
// ════════════════════════════════════════
const BOSS_SQS=[]; // Este tablero no tiene jefes (fiel al arte)
const SQ_DEF=[];
// Tipos mapeados a los iconos dibujados en la imagen:
//  ⚡ rayo→power(velocidad) · 🚀 cohete→power(turbo) · ◄◄→trap(retroceso)
//  ? →mystery · ★→bonus · META→goal · resto→math
const SPEC={
  1:{type:'start',icon:'🏁',lbl:'INICIO'},
  3:{type:'trap',icon:'◄◄',lbl:'RETROCESO'},
  7:{type:'power',icon:'⚡',lbl:'RAYO'},
  11:{type:'mystery',icon:'❓',lbl:'MISTERIO'},
  15:{type:'power',icon:'⚡',lbl:'RAYO'},
  18:{type:'trap',icon:'◄◄',lbl:'RETROCESO'},
  21:{type:'mystery',icon:'❓',lbl:'MISTERIO'},
  25:{type:'bonus',icon:'⭐',lbl:'ESTRELLA'},
  29:{type:'power',icon:'🚀',lbl:'COHETE'},
  33:{type:'mystery',icon:'❓',lbl:'MISTERIO'},
  36:{type:'bonus',icon:'⭐',lbl:'ESTRELLA'},
  42:{type:'trap',icon:'◄◄',lbl:'RETROCESO'},
  47:{type:'goal',icon:'🏆',lbl:'¡META!'},
};
// Orden del recorrido (índice de avance del dado)
const PATH=[];
for(let n=1;n<=29;n++)PATH.push(n);
for(let n=31;n<=47;n++)PATH.push(n);
PATH.forEach(n=>{
  const sp=SPEC[n];
  const mi=['+','−','×','÷'][n%4];
  SQ_DEF.push(sp?{n,...sp}:{n,type:'math',icon:mi});
});
const LAST_IDX=PATH.length-1;
function pIdx(sqNum){return PATH.indexOf(sqNum);}
function pAt(i){return PATH[Math.max(0,Math.min(i,LAST_IDX))];}
function relMove(sqNum,delta){const i=sqNum<=0?-1:pIdx(sqNum);return pAt(i+delta);}

// Coordenadas (centro, en % de la imagen 1448×1086) de cada casilla
const POS_IMG={
  // Borde izquierdo (abajo→arriba)
  1:{x:8.6,y:90},2:{x:6.5,y:79},3:{x:7.0,y:66.5},4:{x:7.0,y:54},5:{x:7.0,y:41.5},6:{x:7.2,y:29},7:{x:9.0,y:17.5},
  // Borde superior (izq→der)
  8:{x:14.5,y:12.5},9:{x:24.5,y:11.5},10:{x:34.5,y:11.5},11:{x:44.5,y:11.5},12:{x:55,y:11.5},13:{x:65,y:11.5},14:{x:74.5,y:11.5},15:{x:86,y:13},16:{x:93.5,y:12.5},
  // Borde derecho (arriba→abajo)
  17:{x:93.5,y:24},18:{x:93.8,y:34.8},19:{x:93.8,y:45.6},20:{x:93.8,y:56.4},21:{x:93.8,y:67.2},22:{x:92.5,y:78.5},23:{x:93,y:90},
  // Borde inferior (der→izq)
  24:{x:83.3,y:90},25:{x:71.1,y:90},26:{x:59.0,y:90},27:{x:46.8,y:90},28:{x:34.4,y:90},29:{x:20.8,y:90},
  // Interior — columna izquierda (abajo→arriba)
  31:{x:20,y:73},32:{x:20,y:60},33:{x:20,y:47},34:{x:20,y:35},35:{x:22,y:24},
  // Interior — fila superior (izq→der)
  36:{x:32,y:23},37:{x:42,y:23},38:{x:51,y:23},39:{x:60,y:23},40:{x:69,y:23},41:{x:78.5,y:24},
  // Interior — columna derecha (arriba→abajo)
  42:{x:79,y:35},43:{x:79,y:47},44:{x:78,y:59},45:{x:78,y:72},
  // Interior — fila inferior (der→izq)
  46:{x:62,y:73},47:{x:47,y:74},
};

const COLORS=['#5B9FFF','#FF5BC8','#3FE88A','#FFD23F','#B06FFF','#FF4E6A'];
const PAWNS=['🔵','🩷','🟢','🟡','🟣','🔴'];
const DICE_F=['⚀','⚁','⚂','⚃','⚄','⚅'];

function sqTypeColor(t){return{math:'#5B9FFF',bonus:'#FFD23F',power:'#3FE88A',trap:'#FF4E6A',mystery:'#B06FFF',start:'#5B9FFF',goal:'#FFD23F',boss:'#FF6600'}[t]||'#fff';}

// ════════════════════════════════════════
// GAME STATE
// ════════════════════════════════════════
let G={
  np:2,mode:'hard',selectedChar:0,
  players:[],cur:0,round:1,
  rolling:false,frozen:[],log:[],winner:null,
  showCards:false,doubleRound:false,
  roundEventCount:0,nextEventAt:3+Math.floor(Math.random()*3),
  trapImmune:[],// playerIds with trap immunity
  achievements:{},// playerId -> set of unlocked
  trapSurvived:{},// count per player
};
let qTimer=null,qData=null,qDone=false;
let bossActive=false,bossAnswered=false,bossTimer=null;
let pendingAtkMode='random';

const rnd=n=>Math.floor(Math.random()*n);
const d6=()=>rnd(6)+1;
function addLog(m){G.log.unshift(m);if(G.log.length>10)G.log.pop();renderLog();}
function pick(arr){return arr[rnd(arr.length)];}

// ════════════════════════════════════════
// PARTICLES & FX
// ════════════════════════════════════════
function spawnParticles(x,y,color,n=10){
  for(let i=0;i<n;i++){
    const p=document.createElement('div');p.className='particle';
    const a=(i/n)*Math.PI*2,d=40+rnd(40);
    p.style.cssText=`left:${x}px;top:${y}px;width:${4+rnd(5)}px;height:${4+rnd(5)}px;background:${color};--tx:${Math.cos(a)*d}px;--ty:${Math.sin(a)*d-25}px;--d:${.5+Math.random()*.5}s;`;
    document.body.appendChild(p);setTimeout(()=>p.remove(),1100);
  }
}
function flashScreen(color){
  const f=document.createElement('div');f.className='screen-flash';f.style.background=color+'55';
  document.body.appendChild(f);setTimeout(()=>f.remove(),500);
}
function floatText(txt,color,x,y){
  const f=document.createElement('div');f.className='float-txt';f.textContent=txt;
  f.style.cssText=`color:${color};left:${x||40+rnd(20)}%;top:${y||'40%'};`;
  document.body.appendChild(f);setTimeout(()=>f.remove(),950);
}
function showComboFlare(n){
  const labels=['','','🔥 COMBO x2','🔥 COMBO x3','🔥🔥 COMBO x4','🔥🔥 COMBO x5','🔥🔥🔥 ¡GENIO!'];
  if(n<2)return;
  const el=document.createElement('div');el.className='combo-burst';
  el.style.color=n>=5?'#FFD23F':'#FF5BC8';
  el.textContent=labels[Math.min(n,6)]||`🔥 COMBO x${n}`;
  document.body.appendChild(el);setTimeout(()=>el.remove(),800);
}
function showAchievement(ach){
  const t=document.createElement('div');t.className='achievement-toast';
  t.innerHTML=`<span class="toast-icon">${ach.icon}</span><div><div class="toast-name">🏆 ${ach.name}</div><div class="toast-desc">${ach.desc}</div></div>`;
  document.body.appendChild(t);setTimeout(()=>{t.style.animation='toastIn .4s ease reverse both';setTimeout(()=>t.remove(),400);},3000);
}
function checkAchievement(pid,trigger){
  const p=G.players.find(x=>x.id===pid);if(!p)return;
  if(!p.achievements)p.achievements=new Set();
  ACHIEVEMENTS.filter(a=>a.trigger===trigger&&!p.achievements.has(a.id)).forEach(a=>{
    p.achievements.add(a.id);showAchievement(a);addLog(`🏆 ${p.name} desbloqueó: ${a.name}`);
  });
}

// ════════════════════════════════════════
// BOARD (imagen assets/board.png + hotspots por %)
// ════════════════════════════════════════
// HTML interno de un peón-miniatura (figura + base brillante)
function pawnInner(p){
  return `<span class="pawn-fig">${p.charEmoji||p.icon}</span><span class="pawn-base"></span>`;
}
// Foco cinematográfico sobre una casilla (energía + zoom suave)
function cinematicFocus(squareNum){
  const sqEl=document.getElementById('sq-'+squareNum);
  if(!sqEl)return;
  sqEl.classList.add('activating');
  setTimeout(()=>sqEl.classList.remove('activating'),650);
  // Anillo de energía emergiendo de la casilla
  const ring=document.createElement('div');ring.className='energy-ring';
  sqEl.appendChild(ring);setTimeout(()=>ring.remove(),720);
  // Cámara: en celular hace scroll; en escritorio un leve pulse-zoom
  cameraFollow(squareNum);
  if(window.innerWidth>900){
    const board=document.getElementById('board');
    const p=POS_IMG[squareNum];
    if(board && p && !board.dataset.zooming){
      board.dataset.zooming='1';
      const prev=board.style.transform||'';
      board.style.transition='transform .5s cubic-bezier(.22,1,.36,1)';
      board.style.transformOrigin=`${p.x}% ${p.y}%`;
      board.style.transform=(prev?prev+' ':'')+'scale(1.06)';
      setTimeout(()=>{board.style.transform=prev;setTimeout(()=>{board.style.transition='';board.style.transformOrigin='';delete board.dataset.zooming;},520);},620);
    }
  }
}
function renderBoard(){
  const board=document.getElementById('board');
  board.className='img-board';
  board.style.width='';board.style.height='';board.style.transform='';
  board.innerHTML='';
  SQ_DEF.forEach(sq=>{
    const pos=POS_IMG[sq.n];if(!pos)return;
    const el=document.createElement('div');
    el.className=`sq t-${sq.type}`;el.id='sq-'+sq.n;el.dataset.n=sq.n;
    el.style.cssText=`left:${pos.x}%;top:${pos.y}%;`;
    el.innerHTML=`<div class="sq-hot"></div><div class="sq-pawns" id="pawns-${sq.n}"></div>`;
    board.appendChild(el);
  });
  updateAllPawns();
}

function updateAllPawns(){
  PATH.forEach(n=>{
    const el=document.getElementById('pawns-'+n);if(!el)return;
    const pawns=G.players.filter(p=>p.pos===n);
    el.innerHTML=pawns.map(p=>`<span class="pawn-sprite" id="pawn-${p.id}" style="--pc:${p.color}">${pawnInner(p)}</span>`).join('');
    const sq=document.getElementById('sq-'+n);
    if(sq)sq.classList.toggle('has-pawn',pawns.length>0);
  });
}

// Avanza el peón casilla por casilla siguiendo PATH.
// pos se fija ANTES de llamar (el render final usa player.pos).
function animateMove(pid,fromPos,toPos,cb){
  const player=G.players.find(p=>p.id===pid);
  if(!player){cb?.();return;}
  let i=fromPos<=0?-1:pIdx(fromPos);
  const ti=toPos<=0?-1:pIdx(toPos);
  if(ti<=i){updateAllPawns();cb?.();return;} // retroceso o sin movimiento: ajustar y salir
  function step(){
    const sp=document.getElementById('pawn-'+pid);if(sp)sp.remove();
    i=Math.min(i+1,ti);SFX.move();
    const n=PATH[i];
    const sqEl=document.getElementById('sq-'+n);
    if(sqEl){sqEl.classList.remove('has-pawn');void sqEl.offsetWidth;sqEl.classList.add('has-pawn');}
    const newEl=document.getElementById('pawns-'+n);
    if(newEl){
      const s=document.createElement('span');
      s.className='pawn-sprite arrive';s.id='pawn-'+pid;
      s.style.setProperty('--pc',player.color);s.innerHTML=pawnInner(player);
      newEl.appendChild(s);setTimeout(()=>s.classList.remove('arrive'),500);
    }
    if(sqEl){
      sqEl.classList.add('land-impact');setTimeout(()=>sqEl.classList.remove('land-impact'),450);
      const r=sqEl.getBoundingClientRect();
      spawnParticles(r.left+r.width/2,r.top+r.height/2,player.color,3);
    }
    if(i<ti)setTimeout(step,180);
    else setTimeout(()=>{updateAllPawns();cb?.();},250);
  }
  step();
}

// ════════════════════════════════════════
// UI RENDER
// ════════════════════════════════════════
function renderScore(){
  document.getElementById('scoreboard').innerHTML=G.players.map((p,i)=>{
    const act=i===G.cur;
    const comboStr=p.combo>1?`<span class="s-combo">🔥${p.combo}</span>`:'';
    return `<div class="s-row ${act?'cur':''}" style="--c:${p.color};background:${act?p.color+'18':'transparent'};border-left-color:${act?p.color:'transparent'}">
      <span class="s-icon">${p.icon}</span>
      <span class="s-name" style="color:${p.color}">${p.charEmoji} ${p.name}</span>
      <span class="s-pts">${p.points}</span>${comboStr}
      ${G.frozen.includes(p.id)?'<span style="font-size:10px">❄️</span>':''}
    </div>`;
  }).join('');
}
function renderCombo(){
  const cp=G.players[G.cur];if(!cp)return;
  const cd=document.getElementById('combo-display');
  const cn=document.getElementById('combo-num');
  if(cp.combo>0){cd.style.display='block';cn.textContent=cp.combo;}
  else cd.style.display='none';
}
function renderLog(){
  document.getElementById('glog').innerHTML=G.log.map((l,i)=>`<div class="log-line" style="opacity:${(1-i*.09).toFixed(1)}">${l}</div>`).join('');
}
function renderPanel(){
  const cp=G.players[G.cur];if(!cp)return;
  document.getElementById('t-em').textContent=cp.icon;
  document.getElementById('t-nm').textContent=cp.name;
  document.getElementById('t-nm').style.color=cp.color;
  document.getElementById('t-sub').textContent=cp.charName;
  document.getElementById('action-panel').style.borderColor=cp.color;
  const rb=document.getElementById('roll-btn');
  rb.style.background=`linear-gradient(135deg,${cp.color},${cp.color}cc)`;
  rb.style.boxShadow=`0 4px 0 ${cp.color}88`;rb.disabled=G.rolling;
  // Cards
  const cb=document.getElementById('card-btn');
  if(cp.cards?.length){cb.classList.remove('hidden');cb.textContent=`🃏 Cartas (${cp.cards.length})`;}
  else cb.classList.add('hidden');
  // Round
  document.getElementById('round-badge').textContent=`Ronda ${G.round}`;
}
function renderCards(){
  const hand=document.getElementById('cards-hand');
  const cp=G.players[G.cur];
  if(!G.showCards||!cp?.cards?.length){hand.classList.add('hidden');return;}
  hand.classList.remove('hidden');
  const rs=RARITY_STYLE;
  hand.innerHTML=cp.cards.map((c,i)=>{
    const r=rs[c.rarity];
    return `<div class="hand-card" onclick="useCard(${i})" style="border-color:${r.border}">
      <span class="hand-card-icon">${c.icon}</span>
      <span style="flex:1;font-size:11px;color:${r.color}">${c.name}</span>
      <span class="hand-card-rarity" style="background:${r.bg};color:${r.color};border:1px solid ${r.border}">${r.label}</span>
    </div>`;
  }).join('');
}

// ════════════════════════════════════════
// GLOBAL EVENTS
// ════════════════════════════════════════
function maybeGlobalEvent(){
  G.roundEventCount++;
  if(G.roundEventCount<G.nextEventAt)return;
  G.roundEventCount=0;
  G.nextEventAt=2+rnd(3);
  const ev=pick(MEGA_EVENTS);
  showEventOverlay(ev.e,ev.t,ev.d,()=>applyMegaEvent(ev));
}
function showEventOverlay(emoji,title,desc,cb){
  document.getElementById('ev-emoji').textContent=emoji;
  document.getElementById('ev-title').textContent=title;
  document.getElementById('ev-desc').textContent=desc;
  document.getElementById('event-overlay').classList.remove('hidden');
  document.getElementById('ev-ok').onclick=()=>{
    document.getElementById('event-overlay').classList.add('hidden');
    cb?.();
  };
}
function applyGlobalEvent(ev){
  addLog(`🌍 EVENTO: ${ev.title}`);
  if(ev.effect==='double_pts'){G.doubleRound=true;addLog('⚡ ¡Preguntas valen x2 esta ronda!');}
  else if(ev.effect==='all_back'){
    G.players.forEach(p=>{p.pos=relMove(p.pos,-2);});updateAllPawns();renderScore();
    addLog('🌪️ ¡Todos retrocedieron 2 casillas!');
  }
  else if(ev.effect==='swap_all'){
    if(G.players.length>1){
      const positions=G.players.map(p=>p.pos);
      const shuffled=[...positions].sort(()=>Math.random()-.5);
      G.players.forEach((p,i)=>p.pos=shuffled[i]);
      updateAllPawns();renderScore();addLog('🌀 ¡Posiciones intercambiadas!');
    }
  }
  else if(ev.effect==='all_cards'){
    G.players.forEach(p=>{
      const c=pick(CARDS);if(!p.cards)p.cards=[];p.cards.push({...c});
    });renderPanel();addLog('💰 ¡Todos recibieron una carta!');
  }
  else if(ev.effect==='all_roll'){addLog('🚀 ¡Rush! Todos lanzan de nuevo!'); /* handled externally */}
}

// ════════════════════════════════════════
// DICE & MOVEMENT
// ════════════════════════════════════════
function handleRoll(){
  if(G.rolling||!G.players.length)return;
  const cp=G.players[G.cur];
  if(G.frozen.includes(cp.id)){
    addLog(`❄️ ${cp.name} pierde su turno`);
    G.frozen=G.frozen.filter(id=>id!==cp.id);
    nextTurn();return;
  }
  G.rolling=true;haptic(20);
  const rb=document.getElementById('roll-btn');rb.disabled=true;
  const di=document.getElementById('dice');di.classList.add('rolling');
  let c=0;
  const iv=setInterval(()=>{
    di.textContent=DICE_F[rnd(6)];c++;SFX.tick();
    if(c>=14){
      clearInterval(iv);di.classList.remove('rolling');
      const val=d6();di.textContent=DICE_F[val-1];
      SFX.dice();
      di.classList.add('result-pop');setTimeout(()=>di.classList.remove('result-pop'),500);
      const dr=di.getBoundingClientRect();
      spawnParticles(dr.left+dr.width/2,dr.top+dr.height/2,cp.color,8);
      G.rolling=false;rb.disabled=false;
      addLog(`${cp.icon} ${cp.name} sacó ${val}`);
      if(cp.abilityUsed!==true&&cp.charAbility==='teleport5'){
        // Offer ability
        cp.abilityUsed=true;
      }
      doMove(cp.id,val);
    }
  },70);
}

function doMove(pid,steps){
  const cp=G.players.find(p=>p.id===pid);
  const from=cp.pos;
  const toIdx=Math.min((from<=0?-1:pIdx(from))+steps,LAST_IDX);
  const to=PATH[toIdx];
  cp.pos=to; // fijar antes de animar (el render final usa player.pos)
  if(steps>=10)checkAchievement(pid,'move10');
  animateMove(pid,from,to,()=>{
    renderScore();cameraFollow(to);
    if(toIdx>=LAST_IDX){winGame(cp);return;}
    if(toIdx>=LAST_IDX-3)cinematicMoment('⚡ ¡CASI EN LA META!','#FF5BC8');
    const sq=SQ_DEF.find(s=>s.n===cp.pos);
    setTimeout(()=>triggerSquare(sq,pid),300);
  });
}

// ════════════════════════════════════════
// SQUARE TRIGGERS
// ════════════════════════════════════════
function triggerSquare(sq,pid){
  if(!sq){nextTurn();return;}
  const p=G.players.find(x=>x.id===pid);
  switch(sq.type){
    case 'math':{ openQ(pid,false);break; }
    case 'power':{
      if([7,15].includes(sq.n)) openQ(pid,true); // ⚡ rayo → pregunta de velocidad
      else if(sq.n===29){ // 🚀 cohete → turbo +3
        const fromP=p.pos; p.pos=relMove(p.pos,3);
        const sqElP=document.getElementById('sq-'+p.pos);
        if(sqElP){const rP=sqElP.getBoundingClientRect();spawnParticles(rP.left+rP.width/2,rP.top,'#3FE88A',12);}
        floatText('🚀 TURBO +3','#3FE88A'); addLog('🚀 '+p.name+' Turbo +3 → C'+p.pos);
        animateMove(pid,fromP,p.pos,()=>{renderScore();if(pIdx(p.pos)>=LAST_IDX){winGame(p);return;}nextTurn();});
      } else { grantCard(pid); nextTurn(); }
      break;
    }
    case 'bonus':{
      const bPts=G.doubleRound?30:15;
      const bSqEl=document.getElementById('sq-'+p.pos);
      if(bSqEl){const bR=bSqEl.getBoundingClientRect();spawnParticles(bR.left+bR.width/2,bR.top,G.doubleRound?'#FF5BC8':'#FFD23F',14);}
      floatText('⭐ +'+bPts+'pts',G.doubleRound?'#FF5BC8':'#FFD23F');
      p.points+=bPts; addLog('⭐ '+p.name+' BONUS +'+bPts+'pts');
      renderScore(); nextTurn(); break;
    }
    case 'trap':{
      if(G.trapImmune.includes(pid)){
        G.trapImmune=G.trapImmune.filter(id=>id!==pid);
        floatText('🛡️ INMUNE','#3FE88A'); addLog('🛡️ '+p.name+' es inmune a la trampa');
        nextTurn(); return;
      }
      if(!p.trapsSurvived)p.trapsSurvived=0; p.trapsSurvived++;
      if(p.trapsSurvived>=3)checkAchievement(pid,'traps3');
      flashScreen('#FF4E6A');
      const tSqEl=document.getElementById('sq-'+p.pos);
      if(tSqEl){const tR=tSqEl.getBoundingClientRect();spawnParticles(tR.left+tR.width/2,tR.top,'#FF4E6A',10);}
      { // ◄◄ retroceso: retrocede 3 casillas en el recorrido
        const fromT=p.pos; p.pos=relMove(p.pos,-3);
        floatText('◄◄ −3 CASILLAS','#FF4E6A'); addLog('◄◄ '+p.name+' retrocede 3 → C'+p.pos);
        animateMove(pid,fromT,p.pos,()=>{renderScore();nextTurn();});
      }
      break;
    }
    case 'mystery':{
      const effects=['question','card','bonus10','forward2'];
      const eff=pick(effects);
      if(eff==='question'){ openQ(pid,false); }
      else if(eff==='card'){ grantCard(pid); floatText('🎁 ¡SORPRESA!','#B06FFF'); nextTurn(); }
      else if(eff==='bonus10'){ p.points+=10; floatText('🎁 +10pts','#B06FFF'); renderScore(); nextTurn(); }
      else{ const fM=p.pos; p.pos=relMove(p.pos,2); floatText('🎁 +2 CASILLAS','#B06FFF'); animateMove(pid,fM,p.pos,()=>{renderScore();if(pIdx(p.pos)>=LAST_IDX){winGame(p);return;}nextTurn();}); }
      break;
    }
    case 'boss':{ triggerBoss(pid); break; }
    case 'start':{ nextTurn(); break; }
    case 'goal':{ winGame(p); break; }
    default:{ nextTurn(); }
  }
}


// ════════════════════════════════════════
// BOSS FIGHT
// ════════════════════════════════════════
function triggerBoss(triggererPid){
  bossActive=true;bossAnswered=false;
  const q=pick(BQ);
  const bs=document.getElementById('boss-screen');
  const bossEmojis=['💀','🦹','🧟','👹','🤖'];
  document.getElementById('boss-emoji').textContent=pick(bossEmojis);
  document.getElementById('boss-sub').textContent='¡Todos los jugadores compiten! El más rápido gana.';
  document.getElementById('boss-q-text').textContent=q.q;
  document.getElementById('boss-res').classList.add('hidden');
  window._bossQ=q;
  const og=document.getElementById('boss-opts');
  og.innerHTML=['A','B','C','D'].map((l,i)=>`<button class="opt" id="bo${i}" onclick="bosAnswer(${i})">${l}) ${q.o[i]}</button>`).join('');
  // Cámara cinematográfica: zoom al tablero antes del jefe
  const cboard=document.getElementById('board');
  if(cboard){const cur=cboard.style.transform||'';cboard.classList.add('cam-focus');cboard.style.transform=cur+' scale(1.08)';setTimeout(()=>{cboard.style.transform=cur;},600);}
  const bcard=document.querySelector('#boss-screen .boss-card');
  if(bcard){bcard.classList.add('cat-boss');}
  bs.classList.remove('hidden');
  flashScreen('#FF6600');
  addLog(`💀 ¡JEFE MATEMÁTICO en C${G.players[G.cur]?.pos}!`);
}

function bosAnswer(idx){
  if(bossAnswered||!window._bossQ)return;bossAnswered=true;
  clearTimeout(bossTimer);
  for(let i=0;i<4;i++){const b=document.getElementById('bo'+i);if(b)b.disabled=true;}
  const q=window._bossQ;
  const chosen=q.o[idx];const correct=q.a;
  const isCorrect=chosen===correct;
  const res=document.getElementById('boss-res');res.classList.remove('hidden');
  const pid=G.players[G.cur].id;const p=G.players[G.cur];
  if(isCorrect){
    res.style.color='#3FE88A';res.textContent='✅ ¡DERROTASTE AL JEFE! +25pts + Carta Legendaria';
    p.points+=25;
    const legendCards=CARDS.filter(c=>c.rarity==='legend');
    if(!p.cards)p.cards=[];p.cards.push({...pick(legendCards)});
    addLog(`⚔️ ${p.name} derrota al jefe: +25pts + Carta Legendaria`);
    floatText('💀 JEFE DERROTADO','#FFD23F');
    checkAchievement(pid,'boss_win');
    spawnParticles(window.innerWidth/2,window.innerHeight/2,'#FFD23F',20);
  } else {
    res.style.color='#FF4E6A';res.textContent='❌ El jefe te golpea. −1 casilla';
    p.pos=Math.max(0,p.pos-1);
    addLog(`💀 ${p.name} pierde contra el jefe`);
  }
  setTimeout(()=>{
    document.getElementById('boss-screen').classList.add('hidden');
    bossActive=false;renderScore();renderPanel();
    maybeGlobalEvent();nextTurn();
  },2200);
}

// ════════════════════════════════════════
// QUESTION ENGINE
// ════════════════════════════════════════
function openQ(pid,fast){
  const pool=G.mode==='easy'?EQ:HQ;
  const q=pick(pool);qData={...q,pid,fast};qDone=false;
  const p=G.players.find(x=>x.id===pid);
  const maxT=fast?7:20;
  // Secuencia: casilla se ilumina → energía → cámara enfoca → carta emerge
  cinematicFocus(p.pos);
  const sqEl=document.getElementById('sq-'+p.pos);
  if(sqEl){const r=sqEl.getBoundingClientRect();spawnParticles(r.left+r.width/2,r.top+r.height/2,fast?'#FF4E6A':'#5B9FFF',10);}
  // Apply category frame to card
  const card=document.querySelector('#qscreen .q-card');
  if(card){card.classList.remove('cat-math','cat-fast','cat-boss');card.classList.add(fast?'cat-fast':'cat-math');}
  document.getElementById('qp-em').textContent=p.icon;
  document.getElementById('qp-nm').textContent=p.name;
  document.getElementById('qp-nm').style.color=p.color;
  const badge=document.getElementById('q-badge');
  if(fast){badge.textContent='⚡ VELOCIDAD';badge.className='q-badge badge-fast';}
  else{badge.textContent='➕ MATEMÁTICAS';badge.className='q-badge badge-math';}
  // Combo indicator
  const ci=document.getElementById('q-combo-ind');
  if(p.combo>0){ci.style.display='block';ci.textContent=`🔥 Racha de ${p.combo} — ¡no la rompas!`;}
  else ci.style.display='none';
  // Double round indicator
  if(G.doubleRound)badge.textContent+=' 2X';
  document.getElementById('q-text').textContent=q.q;
  document.getElementById('q-res').classList.add('hidden');
  const og=document.getElementById('opts');
  og.innerHTML=['A','B','C','D'].map((l,i)=>`<button class="opt" id="oa${i}" onclick="ansQ(${i})">${l}) ${q.o[i]}</button>`).join('');
  setTimer(maxT,maxT);
  showScreen('qscreen');
  clearInterval(qTimer);let t=maxT;
  qTimer=setInterval(()=>{t--;setTimer(t,maxT);if(t<=0){clearInterval(qTimer);if(!qDone)timeoutQ();}},1000);
}

function setTimer(t,max){
  const pct=(t/max)*100;
  const f=document.getElementById('t-fill');
  f.style.width=pct+'%';f.style.background=pct>50?'#3FE88A':pct>25?'#FFD23F':'#FF4E6A';
  f.parentElement.classList.toggle('low',pct<=25);
  if(t<=5&&t>0&&t<max)SFX.urgent();
  document.getElementById('t-num').textContent=t;
}

function ansQ(idx){
  if(qDone||!qData)return;
  clearInterval(qTimer);qDone=true;
  const q=qData,chosen=q.o[idx],correct=chosen===q.a;
  for(let i=0;i<4;i++){const b=document.getElementById('oa'+i);if(b){if(q.o[i]===q.a)b.classList.add('correct');else if(q.o[i]===chosen)b.classList.add('wrong');b.disabled=true;}}
  const p=G.players.find(x=>x.id===q.pid);
  const res=document.getElementById('q-res');res.classList.remove('hidden');
  if(correct){
    // Base points
    let pts=q.fast?15:10;
    // Combo
    p.combo=(p.combo||0)+1;
    const comboBonus=[0,0,1,2,4,6,10];pts+=comboBonus[Math.min(p.combo,6)];
    // Double round
    if(G.doubleRound)pts*=2;
    // Character ability
    if(p.charAbility==='bonus_pts')pts=Math.round(pts*1.1);
    if(p.charAbility==='extra5')pts+=5;
    if(p.charAbility==='steal_card')grantCard(p.id);
    // Genius double card
    const geniusIdx=(p.cards||[]).findIndex(c=>c.id==='genius');
    if(geniusIdx>=0){pts*=2;p.cards.splice(geniusIdx,1);floatText('🧠 x2','#B06FFF');}
    p.points+=pts;haptic([15,40,15]);
    SFX.correct();if(p.combo>1)SFX.combo(p.combo);
    // Puntos ONEX: solo notifica el EVENTO; el servidor decide los puntos
    if(window.ONEX&&!G.classroom&&q.pid===0){ONEX.event('correct');if(p.combo===5)ONEX.event('combo5');}
    // Classroom goal-points win
    if(G.classroom&&G.goalPoints>0&&p.points>=G.goalPoints){
      res.style.color='#3FE88A';res.textContent=`🏆 ¡${p.name} alcanzó ${G.goalPoints} pts!`;
      addLog(`🏆 ${p.name} ganó con ${p.points} pts`);
      setTimeout(()=>winGame(p),1500);return;
    }
    res.style.color='#3FE88A';
    let resMsg=`✅ ¡CORRECTO! +${pts}pts`;
    if(p.combo>1)resMsg+=` 🔥×${p.combo}`;
    res.textContent=resMsg;
    addLog(`✅ ${p.name} +${pts}pts`);
    floatText(`+${pts}`,p.combo>=3?'#FFD23F':'#3FE88A');
    showComboFlare(p.combo);
    if(p.combo===5)cinematicMoment('🔥 ¡MODO GENIO!','#FFD23F');
    if(p.combo>=5)checkAchievement(p.id,'combo5');
    const sqEl=document.getElementById('sq-'+p.pos);
    if(sqEl){const r=sqEl.getBoundingClientRect();spawnParticles(r.left+r.width/2,r.top,'#3FE88A',10);}
  } else {
    p.combo=0;
    // Retry ability
    if(p.charAbility==='retry'&&!p.retryUsed){
      p.retryUsed=true;res.style.color='#FFD23F';res.textContent='🤖 Robot IA: ¡intento de nuevo!';
      setTimeout(()=>{qDone=false;openQ(q.pid,q.fast);},1500);return;
    }
    if(!G.classroom)p.pos=relMove(p.pos,-2);
    haptic(120);SFX.wrong();
    res.style.color='#FF4E6A';
    res.textContent=G.classroom?`❌ La respuesta correcta era: ${q.a}`:`❌ Incorrecto — Respuesta: ${q.a}`;
    addLog(`❌ ${p.name}: respuesta era ${q.a}`);floatText('❌','#FF4E6A');
    flashScreen('#FF4E6A');updateAllPawns();
  }
  renderCombo();
  setTimeout(()=>{
    showScreen('game');renderScore();renderPanel();renderCards();
    G.doubleRound=false;
    maybeGlobalEvent();nextTurn();
  },2000);
}

function timeoutQ(){
  qDone=true;const p=G.players.find(x=>x.id===qData.pid);
  p.combo=0;renderCombo();
  const res=document.getElementById('q-res');res.classList.remove('hidden');
  res.style.color='#FF8800';res.textContent='⏱ ¡Tiempo agotado!';SFX.timeout();
  addLog(`⏱ ${p.name} — sin tiempo`);
  setTimeout(()=>{showScreen('game');renderPanel();nextTurn();},1600);
}

// ════════════════════════════════════════
// CARDS
// ════════════════════════════════════════
function grantCard(pid){
  // Weighted random — legendary is rare
  const weights={common:50,uncommon:30,epic:15,legend:5};
  const total=100,r=rnd(total);
  let acc=0,rarity='common';
  for(const [k,v] of Object.entries(weights)){acc+=v;if(r<acc){rarity=k;break;}}
  const pool=CARDS.filter(c=>c.rarity===rarity);
  const card={...pick(pool||CARDS)};
  const p=G.players.find(x=>x.id===pid);
  if(!p.cards)p.cards=[];p.cards.push(card);
  const rs=RARITY_STYLE[rarity];
  addLog(`🃏 ${p.name} obtuvo ${card.icon} ${card.name} [${rs.label}]`);
  floatText(`${card.icon} ${card.name}`,rs.color);
}

function useCard(idx){
  const cp=G.players[G.cur];if(!cp?.cards?.length)return;
  const card=cp.cards.splice(idx,1)[0];
  G.showCards=false;renderCards();renderPanel();
  addLog(`${cp.name} usó ${card.icon} ${card.name}`);
  if(card.id==='turbo3'){doMove(cp.id,3);return;}
  if(card.id==='turbo5'){doMove(cp.id,5);return;}
  if(card.id==='teleport'){doMove(cp.id,8);return;}
  if(card.id==='shield'){G.trapImmune.push(cp.id);floatText('🛡️ INMUNE','#3FE88A');}
  if(card.id==='divine'){G.trapImmune.push(cp.id,cp.id);floatText('✨ ESCUDO DIVINO','#FFD23F');}
  if(card.id==='freeze'){pendingAtkMode='freeze';showAtkModal();}
  if(card.id==='steal'){pendingAtkMode='steal';showAtkModal();}
  if(card.id==='swap'){pendingAtkMode='swap';showAtkModal();}
  if(card.id==='double'){addLog(`⚡ ${cp.name} juega de nuevo!`);/*next turn skips*/}
  if(card.id==='genius'){if(!cp.cards)cp.cards=[];cp.cards.unshift({...CARDS.find(c=>c.id==='genius')});floatText('🧠 x2 ACTIVADO','#B06FFF');}
}

// ════════════════════════════════════════
// ATTACK MODAL
// ════════════════════════════════════════
function showAtkModal(){
  const cp=G.players[G.cur];
  document.getElementById('atk-targets').innerHTML=G.players.filter(p=>p.id!==cp.id).map(p=>`<button class="modal-btn" style="border-color:${p.color};color:${p.color}" onclick="doAtk(${p.id})">${p.icon} ${p.name} — C${p.pos} — ${p.points}pts</button>`).join('');
  document.getElementById('atk-overlay').classList.remove('hidden');
}
function doAtk(tid){
  document.getElementById('atk-overlay').classList.add('hidden');
  const att=G.players[G.cur],tgt=G.players.find(p=>p.id===tid);
  if(!tgt){nextTurn();return;}
  if(pendingAtkMode==='freeze'){G.frozen.push(tid);addLog(`❄️ ${att.name} congela a ${tgt.name}`);flashScreen('#8ACDFF');}
  else if(pendingAtkMode==='steal'){const s=Math.min(8,tgt.points);att.points+=s;tgt.points-=s;addLog(`💎 ${att.name} roba ${s}pts a ${tgt.name}`);floatText(`+${s}pts`,'#FFD23F');}
  else if(pendingAtkMode==='swap'){const tmp=att.pos;att.pos=tgt.pos;tgt.pos=tmp;updateAllPawns();addLog(`🔀 ${att.name} intercambia posición con ${tgt.name}`);flashScreen('#B06FFF');}
  else{
    const moves=[
      ()=>{G.frozen.push(tid);flashScreen('#8ACDFF');addLog(`❄️ ${att.name} congela a ${tgt.name}`);},
      ()=>{const f=tgt.pos;tgt.pos=Math.max(0,tgt.pos-3);addLog(`⏪ ${att.name} retrocede a ${tgt.name} 3`);animateMove(tid,f,tgt.pos,()=>{updateAllPawns();});},
      ()=>{const s=Math.min(8,tgt.points);att.points+=s;tgt.points-=s;addLog(`💎 ${att.name} roba ${s}pts`);floatText(`+${s}pts`,'#FFD23F');},
    ];pick(moves)();
  }
  renderScore();nextTurn();
}

function nextTurn(){
  G.round++;
  G.cur=(G.cur+1)%G.players.length;
  G.showCards=false;
  document.getElementById('dice').textContent='🎲';
  renderPanel();renderCards();renderScore();renderCombo();
  if(G.classroom)setTimeout(announceTurn,150);
}

function winGame(winner){
  stopMusic();SFX.win();launchConfetti();
  // Classroom mode: no persistent rewards, just celebrate
  if(G.classroom){
    const sorted=[...G.players].sort((a,b)=>b.points-a.points);
    document.getElementById('go-winner').textContent=`${winner.icon} ${winner.name}`;
    document.getElementById('go-winner').style.color=winner.color;
    const medals=['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'];
    document.getElementById('go-rank').innerHTML=sorted.map((p,i)=>`<div class="rank-row"><span style="font-size:20px">${medals[i]}</span><span style="font-size:18px">${p.icon}</span><span style="color:${p.color};font-size:14px;font-weight:900;flex:1">${p.name}</span><span style="font-weight:900;color:#FFD23F">${p.points}pts</span></div>`).join('');
    const rwEl=document.getElementById('go-rewards');if(rwEl)rwEl.innerHTML='';
    showScreen('gameover');
    setTimeout(()=>cinematicMoment('🏆 ¡'+winner.name+' GANA!','#FFD23F'),300);
    G.classroom=false;
    return;
  }
  checkAchievement(winner.id,'win');
  if(window.ONEX&&winner.id===0)ONEX.event('win'); // Puntos ONEX: victoria del jugador principal
  // Persistent rewards
  SAVE.totalGames++;
  const isPlayerWin=winner.id===0;
  if(isPlayerWin)SAVE.totalWins++;
  const coinReward=isPlayerWin?50:20;
  SAVE.coins+=coinReward;
  const xpReward=(isPlayerWin?100:40)*(G.doubleXP?2:1);
  const lvUp=addXP(xpReward);
  SAVE.chestProgress++;
  if(winner.combo>SAVE.bestCombo)SAVE.bestCombo=winner.combo;
  persist();
  window._lastRewards={coins:coinReward,xp:xpReward,lvUp,freeChest:SAVE.chestProgress>=2};
  if(SAVE.chestProgress>=2){SAVE.chestProgress=0;SAVE.ownedChests.push(isPlayerWin?'rare':'common');persist();}
  const sorted=[...G.players].sort((a,b)=>b.points-a.points);
  document.getElementById('go-winner').textContent=`${winner.charEmoji} ${winner.name}`;
  document.getElementById('go-winner').style.color=winner.color;
  const medals=['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣'];
  document.getElementById('go-rank').innerHTML=sorted.map((p,i)=>`<div class="rank-row"><span style="font-size:20px">${medals[i]}</span><span style="font-size:18px">${p.icon}</span><span style="color:${p.color};font-size:14px;font-weight:900;flex:1">${p.charEmoji} ${p.name}</span><span style="font-weight:900;color:#FFD23F">${p.points}pts</span></div>`).join('');
  // Show rewards earned
  const rw=window._lastRewards||{coins:0,xp:0};
  const rewardHtml=`<div style="margin-top:16px;padding:14px;background:#0E0C1E;border:1px solid #FFD23F33;border-radius:14px;max-width:380px;width:100%">
    <div style="font-size:11px;color:#5a5880;letter-spacing:2px;margin-bottom:8px;">RECOMPENSAS</div>
    <div style="display:flex;justify-content:center;gap:20px;">
      <span style="color:#FFD23F;font-weight:900;">🪙 +${rw.coins}</span>
      <span style="color:#5B9FFF;font-weight:900;">⭐ +${rw.xp} XP</span>
      ${rw.lvUp?'<span style="color:#3FE88A;font-weight:900;">🆙 ¡SUBISTE DE NIVEL!</span>':''}
      ${rw.freeChest?'<span style="color:#B06FFF;font-weight:900;">🎁 ¡COFRE GRATIS!</span>':''}
    </div>
  </div>`;
  let rwEl=document.getElementById('go-rewards');
  if(!rwEl){rwEl=document.createElement('div');rwEl.id='go-rewards';document.getElementById('go-rank').after(rwEl);}
  rwEl.innerHTML=rewardHtml;
  showScreen('gameover');
  if(winner.id===0)setTimeout(()=>cinematicMoment('🏆 ¡VICTORIA!','#FFD23F'),300);
}

// ════════════════════════════════════════
// SCREENS
// ════════════════════════════════════════

// ════════════════════════════════════════════════════════
// LOBBY / HOME
// ════════════════════════════════════════════════════════
function renderLobby(){
  document.getElementById('lb-coins').textContent=SAVE.coins;
  document.getElementById('lb-gems').textContent=SAVE.gems;
  document.getElementById('lb-level').textContent=SAVE.level;
  document.getElementById('lb-level-num').textContent=SAVE.level;
  document.getElementById('lb-xp').textContent=SAVE.xp;
  document.getElementById('lb-xp-max').textContent=xpForLevel(SAVE.level);
  document.getElementById('lb-xp-fill').style.width=Math.min(100,(SAVE.xp/xpForLevel(SAVE.level))*100)+'%';
  // Chest badge
  const cb=document.getElementById('chest-badge');
  if(SAVE.ownedChests.length>0){cb.classList.remove('hidden');cb.textContent=SAVE.ownedChests.length;}
  else cb.classList.add('hidden');
  // Collection count
  document.getElementById('coll-count').textContent=SAVE.unlockedChars.length+'/'+CHARS.length+' personajes';
  document.getElementById('stats-sub').textContent=SAVE.totalGames+' partidas · '+SAVE.totalWins+' victorias';
  // Near-win indicators
  renderNearWin();
}

function renderNearWin(){
  const items=[];
  // Char unlock progress
  const locked=CHARS.filter(c=>!SAVE.unlockedChars.includes(c.id));
  if(locked.length){
    const pct=Math.round((SAVE.unlockedChars.length/CHARS.length)*100);
    items.push({label:'🎭 Colección de personajes',pct,note:'Te falta '+locked.length});
  }
  // Level progress
  const lvPct=Math.round((SAVE.xp/xpForLevel(SAVE.level))*100);
  items.push({label:'⭐ Nivel '+(SAVE.level+1),pct:lvPct,note:(xpForLevel(SAVE.level)-SAVE.xp)+' XP'});
  // Chest progress
  const chestPct=Math.round((SAVE.chestProgress/2)*100);
  items.push({label:'🎁 Cofre gratis',pct:chestPct,note:(2-SAVE.chestProgress)+' partidas'});

  document.getElementById('nearwin-items').innerHTML=items.map(it=>`
    <div class="nearwin-item">
      <span style="min-width:130px">${it.label}</span>
      <div class="nearwin-bar"><div class="nearwin-bar-fill" style="width:${it.pct}%"></div></div>
      <span class="nearwin-pct">${it.pct}%</span>
    </div>`).join('');
}

// ════════════════════════════════════════════════════════
// CHEST OPENING
// ════════════════════════════════════════════════════════
let pendingChestType=null;
function showChestOpen(type){
  pendingChestType=type;
  const ch=CHEST_TYPES[type];
  const big=document.getElementById('chest-big');
  big.textContent=ch.icon;
  big.style.setProperty('--chest-glow',ch.glow);
  big.classList.remove('opening');
  document.getElementById('chest-hint').classList.remove('hidden');
  document.getElementById('chest-rewards').innerHTML='';
  document.getElementById('chest-continue').classList.add('hidden');
  showScreen('chest-screen');
}
function doOpenChest(){
  if(!pendingChestType)return;
  const big=document.getElementById('chest-big');
  big.classList.add('opening');SFX.chest();
  document.getElementById('chest-hint').classList.add('hidden');
  // burst particles
  spawnParticles(window.innerWidth/2,window.innerHeight/2,CHEST_TYPES[pendingChestType].glow,25);
  flashScreen(CHEST_TYPES[pendingChestType].glow);
  setTimeout(()=>{
    const rewards=openChest(pendingChestType);
    const rs=RARITY_STYLE;
    let html='';
    html+=`<div class="reward-item" style="border-color:#FFD23F"><div class="reward-icon">🪙</div><div class="reward-name">${rewards.coins}</div><div class="reward-rarity" style="color:#FFD23F">MONEDAS</div></div>`;
    if(rewards.gems>0)html+=`<div class="reward-item" style="border-color:#5B9FFF"><div class="reward-icon">💎</div><div class="reward-name">${rewards.gems}</div><div class="reward-rarity" style="color:#5B9FFF">GEMAS</div></div>`;
    rewards.cards.forEach(c=>{
      const r=rs[c.rarity]||rs.common;
      html+=`<div class="reward-item" data-rar="${c.rarity}" style="border-color:${r.color}"><div class="reward-icon">${c.icon}</div><div class="reward-name">${c.name}</div><div class="reward-rarity" style="color:${r.color}">${r.label}</div></div>`;
    });
    if(rewards.newChar)html+=`<div class="reward-item" style="border-color:#FFD23F;background:#FFD23F18"><div class="reward-icon">${rewards.newChar.emoji}</div><div class="reward-name">${rewards.newChar.name}</div><div class="reward-rarity" style="color:#FFD23F">¡NUEVO!</div></div>`;
    document.getElementById('chest-rewards').innerHTML=html;
    document.getElementById('chest-continue').classList.remove('hidden');
    // Remove the chest from owned
    const idx=SAVE.ownedChests.indexOf(pendingChestType);
    if(idx>=0){SAVE.ownedChests.splice(idx,1);persist();}
  },650);
}

// ════════════════════════════════════════════════════════
// COLLECTION
// ════════════════════════════════════════════════════════
let collTab='chars';
function renderCollection(){
  const grid=document.getElementById('coll-grid');
  const prog=document.getElementById('coll-progress');
  if(collTab==='chars'){
    prog.textContent=`${SAVE.unlockedChars.length} de ${CHARS.length} personajes desbloqueados`;
    grid.innerHTML=CHARS.map(c=>{
      const owned=SAVE.unlockedChars.includes(c.id);
      return `<div class="coll-item ${owned?'':'locked'}">
        <div class="coll-item-icon">${owned?c.emoji:'🔒'}</div>
        <div class="coll-item-name">${owned?c.name:'???'}</div>
      </div>`;
    }).join('');
  } else if(collTab==='cards'){
    prog.textContent=`${CARDS.length} cartas en el juego`;
    grid.innerHTML=CARDS.map(c=>{
      const rs=RARITY_STYLE[c.rarity]||RARITY_STYLE.common;
      return `<div class="coll-item" style="border-color:${rs.color}44">
        <div class="coll-item-icon">${c.icon}</div>
        <div class="coll-item-name" style="color:${rs.color}">${c.name}</div>
      </div>`;
    }).join('');
  } else if(collTab==='trophies'){
    prog.textContent=`${ACHIEVEMENTS.length} logros disponibles`;
    grid.innerHTML=ACHIEVEMENTS.map(a=>`<div class="coll-item">
      <div class="coll-item-icon">${a.icon}</div>
      <div class="coll-item-name">${a.name}</div>
    </div>`).join('');
  }
}

// ════════════════════════════════════════════════════════
// SHOP (simple — buy chests with coins/gems)
// ════════════════════════════════════════════════════════
function buyChest(type){
  const prices={common:50,rare:150,epic:400,legend:1000};
  const price=prices[type];
  if(SAVE.coins>=price){
    SAVE.coins-=price;SAVE.ownedChests.push(type);persist();
    renderLobby();
    floatText('🎁 ¡Cofre comprado!','#FFD23F');
  } else {
    floatText('🪙 Monedas insuficientes','#FF4E6A');
  }
}

// ════════════════════════════════════════════════════════
// CINEMATIC MOMENTS
// ════════════════════════════════════════════════════════
function cinematicMoment(text,color){
  const c=document.createElement('div');c.className='cinematic';
  c.innerHTML=`<div class="cinematic-text" style="color:${color}">${text}</div>`;
  document.body.appendChild(c);
  spawnParticles(window.innerWidth/2,window.innerHeight/2,color,30);
  setTimeout(()=>{c.style.transition='opacity .4s';c.style.opacity='0';setTimeout(()=>c.remove(),400);},1400);
}



// ════════════════════════════════════════════════════════
// MODO AULA (CLASSROOM)
// ════════════════════════════════════════════════════════
let CLASS={
  teamMode:'individual',// individual | teams
  participants:[
    {name:'Alumno 1',emoji:'🦊'},
    {name:'Alumno 2',emoji:'🐼'},
  ],
  mode:'easy',
  goalPoints:50,
};
const CLASS_EMOJIS=['🦊','🐼','🐯','🦁','🐸','🐵','🦄','🐨','🐧','🦉','🐙','🦖','🦕','🐳','🦅','🐝'];
const TEAM_NAMES=['Equipo Rojo','Equipo Azul','Equipo Verde','Equipo Dorado','Equipo Morado','Equipo Naranja'];

function renderTeamList(){
  const list=document.getElementById('team-list');
  list.innerHTML=CLASS.participants.map((p,i)=>`
    <div class="team-input-row">
      <button class="team-emoji-pick" onclick="cycleEmoji(${i})">${p.emoji}</button>
      <input class="team-name-input" value="${(p.name||'').replace(/"/g,'&quot;')}" oninput="updateTeamName(${i},this.value)" maxlength="18"/>
      ${CLASS.participants.length>2?`<button class="team-remove" onclick="removeTeam(${i})">✕</button>`:''}
    </div>`).join('');
  // Update label
  const lbl=document.getElementById('participants-lbl');
  if(lbl)lbl.textContent=(CLASS.teamMode==='teams'?'EQUIPOS':'ALUMNOS')+' (2–6)';
}
function cycleEmoji(i){
  const cur=CLASS_EMOJIS.indexOf(CLASS.participants[i].emoji);
  CLASS.participants[i].emoji=CLASS_EMOJIS[(cur+1)%CLASS_EMOJIS.length];
  renderTeamList();
}
function updateTeamName(i,val){CLASS.participants[i].name=val;}
function removeTeam(i){
  if(CLASS.participants.length<=2)return;
  CLASS.participants.splice(i,1);renderTeamList();
}
function addTeam(){
  if(CLASS.participants.length>=6)return;
  const idx=CLASS.participants.length;
  const usedEmojis=CLASS.participants.map(p=>p.emoji);
  const freeEmoji=CLASS_EMOJIS.find(e=>!usedEmojis.includes(e))||CLASS_EMOJIS[idx%CLASS_EMOJIS.length];
  const defName=CLASS.teamMode==='teams'?(TEAM_NAMES[idx]||('Equipo '+(idx+1))):('Alumno '+(idx+1));
  CLASS.participants.push({name:defName,emoji:freeEmoji});
  renderTeamList();
}
function setTeamMode(m){
  CLASS.teamMode=m;
  // Rename defaults if they're still defaults
  CLASS.participants.forEach((p,i)=>{
    const isDefault=/^(Alumno|Equipo)/.test(p.name);
    if(isDefault){
      p.name=m==='teams'?(TEAM_NAMES[i]||('Equipo '+(i+1))):('Alumno '+(i+1));
    }
  });
  renderTeamList();
}

function startClassroom(){
  // Build players from CLASS config
  G.players=CLASS.participants.map((p,i)=>({
    id:i,
    name:(p.name||'').trim()||('Jugador '+(i+1)),
    color:COLORS[i],icon:p.emoji,
    charEmoji:p.emoji,charName:CLASS.teamMode==='teams'?'Equipo':'Alumno',
    charAbility:null,
    pos:0,points:0,combo:0,cards:[],achievements:new Set(),retryUsed:false,trapsSurvived:0,
  }));
  G.np=G.players.length;
  G.mode=CLASS.mode;
  G.cur=0;G.log=[];G.winner=null;G.frozen=[];G.rolling=false;
  G.round=1;G.roundEventCount=0;G.nextEventAt=3+rnd(3);
  G.doubleRound=false;G.trapImmune=[];G.showCards=false;
  G.classroom=true;
  G.goalPoints=CLASS.goalPoints;
  showScreen('game');
  setTimeout(()=>{
    renderBoard();renderScore();renderPanel();renderLog();renderCombo();fitBoard();showRotateHint();
    // Add classroom badge to board
    const board=document.getElementById('board');
    if(board&&!document.getElementById('class-badge')){
      const badge=document.createElement('div');
      badge.id='class-badge';badge.className='classroom-badge';
      badge.textContent='🏫 MODO AULA';
      board.appendChild(badge);
    }
    addLog('🏫 ¡Clase iniciada! '+G.players.length+(CLASS.teamMode==='teams'?' equipos':' alumnos'));
    if(G.goalPoints>0)addLog('🎯 Meta: '+G.goalPoints+' puntos para ganar');
    announceTurn();
  },50);
}

// Turn announcement (big visual for projection)
function announceTurn(){
  if(!G.classroom)return;
  const cp=G.players[G.cur];if(!cp)return;
  const a=document.createElement('div');a.className='turn-announce';
  a.innerHTML=`<div class="turn-announce-inner">
    <span class="turn-announce-emoji">${cp.icon}</span>
    <div class="turn-announce-name" style="color:${cp.color}">${cp.name}</div>
    <div class="turn-announce-sub">¡Es tu turno! Lanza el dado</div>
  </div>`;
  document.body.appendChild(a);
  setTimeout(()=>{a.style.transition='opacity .4s';a.style.opacity='0';setTimeout(()=>a.remove(),400);},1600);
}



// ════════════════════════════════════════════════════════
// MOBILE: Board auto-fit scaling
// ════════════════════════════════════════════════════════

// ════════════════════════════════════════════════════════
// MOBILE: Dynamic camera (follow active player)
// ════════════════════════════════════════════════════════
function cameraFollow(squareNum){
  if(window.innerWidth>640)return; // only on phones
  const col=document.querySelector('.board-col');
  const sq=document.getElementById('sq-'+squareNum);
  if(!col||!sq)return;
  const sr=sq.getBoundingClientRect();
  const cr=col.getBoundingClientRect();
  const dx=(sr.left+sr.width/2)-(cr.left+cr.width/2);
  const dy=(sr.top+sr.height/2)-(cr.top+cr.height/2);
  col.scrollBy({left:dx,top:dy,behavior:'smooth'});
}

function fitBoard(){
  const board=document.getElementById('board');
  const col=document.querySelector('.board-col');
  if(!board||!col)return;
  // Tablero-imagen: ajustar al contenedor preservando el aspecto 1448×1086.
  if(board.classList.contains('img-board')){
    const cw=col.clientWidth-10,ch=col.clientHeight-10;
    if(cw<=0||ch<=0)return;
    const ar=1448/1086;
    let w=cw,h=w/ar;
    if(h>ch){h=ch;w=h*ar;}
    board.style.transform='';
    board.style.width=Math.round(w)+'px';
    board.style.height=Math.round(h)+'px';
    return;
  }
  // Reset transform to measure natural size
  board.style.transform='';
  const bw=board.offsetWidth||board.getBoundingClientRect().width;
  const bh=board.offsetHeight||board.getBoundingClientRect().height;
  if(!bw||!bh)return;
  const cw=col.clientWidth-12;
  const ch=col.clientHeight-12;
  if(cw<=0||ch<=0)return; // pantalla oculta o sin medir: no aplicar escala inválida
  const phone=window.innerWidth<=640;
  let scale;
  if(phone){
    // Vista celular: zoom inteligente — casillas grandes y legibles;
    // la cámara (cameraFollow) sigue la acción en lugar de encoger todo.
    const fit=Math.min(cw/bw,ch/bh);
    scale=Math.min(Math.max(cw/(6.4*(CELL+GAP)),fit),1.5);
    col.classList.add('cam-zoom');
  } else {
    scale=Math.min(cw/bw,ch/bh,1.6);
  }
  if(!scale||!isFinite(scale)||scale<0.2)return; // medición inválida: conservar la anterior
  board.style.transform=`scale(${scale.toFixed(3)})`;
  board.style.transformOrigin='center center';
  if(phone&&G.players&&G.players.length){
    setTimeout(()=>cameraFollow(G.players[G.cur]?.pos||1),60);
  }
}
let _fitTimer=null;
function scheduleFit(){clearTimeout(_fitTimer);_fitTimer=setTimeout(fitBoard,80);}
window.addEventListener('resize',scheduleFit);
window.addEventListener('orientationchange',()=>setTimeout(fitBoard,250));

// ════════════════════════════════════════════════════════
// MOBILE: Haptic feedback
// ════════════════════════════════════════════════════════
function haptic(ms){
  try{if(navigator.vibrate)navigator.vibrate(ms||15);}catch(e){}
}

// ════════════════════════════════════════════════════════
// MOBILE: Performance mode (auto-detect low-end)
// ════════════════════════════════════════════════════════
function detectPerfMode(){
  const lowCores=(navigator.hardwareConcurrency||4)<=4;
  const lowMem=(navigator.deviceMemory||4)<=2;
  const smallScreen=Math.min(window.innerWidth,window.innerHeight)<=400;
  if(lowMem||(lowCores&&smallScreen)){
    document.body.classList.add('perf-mode');
  }
}
function togglePerfMode(){
  document.body.classList.toggle('perf-mode');
  haptic();
}

// ════════════════════════════════════════════════════════
// MOBILE: Rotate hint (shown briefly in portrait during game)
// ════════════════════════════════════════════════════════
function showRotateHint(){
  const isPortrait=window.innerHeight>window.innerWidth;
  const isSmall=window.innerWidth<=640;
  let hint=document.getElementById('rotate-hint');
  if(!hint){
    hint=document.createElement('div');hint.id='rotate-hint';hint.className='rotate-hint';
    hint.textContent='📱 Gira el celular para ver mejor el tablero';
    document.body.appendChild(hint);
  }
  if(isPortrait&&isSmall&&G.players&&G.players.length){
    hint.style.display='block';
    setTimeout(()=>{if(hint)hint.style.display='none';},4000);
  } else {
    hint.style.display='none';
  }
}


function showScreen(id){
  const screens=['splash','lobby','classroom-setup','char-select','game','qscreen','boss-screen','gameover','chest-screen','collection-screen'];
  screens.forEach(s=>{
    const e=document.getElementById(s);
    if(!e)return;
    e.style.display='none';
    e.classList.add('hidden');
  });
  const e=document.getElementById(id);
  if(!e)return;
  e.classList.remove('hidden');
  // Transición de entrada
  e.classList.remove('screen-enter');void e.offsetWidth;e.classList.add('screen-enter');
  // Set correct display type per screen
  const flexScreens=['splash','lobby','classroom-setup','char-select','game','gameover','chest-screen','collection-screen'];
  const fixedScreens=['qscreen','boss-screen'];
  if(flexScreens.includes(id))e.style.display='flex';
  else if(fixedScreens.includes(id))e.style.display='flex';
  else e.style.display='block';
}

// ════════════════════════════════════════
// GAME INIT
// ════════════════════════════════════════
let selectedCharId=0;
function buildCharGrid(){
  const grid=document.getElementById('chars-grid');
  // Find first unlocked for default selection
  const firstUnlocked=CHARS.findIndex(c=>SAVE.unlockedChars.includes(c.id));
  selectedCharId=firstUnlocked>=0?firstUnlocked:0;
  grid.innerHTML=CHARS.map((c,i)=>{
    const rs=RARITY_STYLE[c.rarity]||RARITY_STYLE.common;
    const owned=SAVE.unlockedChars.includes(c.id);
    return `<div class="char-card${i===selectedCharId?' selected':''}${owned?'':' locked'}" ${owned?`onclick="selectChar(${i})"`:''} id="cc-${i}" style="${owned?'':'opacity:.4;filter:grayscale(1);'}">
      <span class="char-emoji">${owned?c.emoji:'🔒'}</span>
      <div class="char-name">${owned?c.name:'Bloqueado'}</div>
      <div class="char-ability">${owned?c.desc:'Ábrelo en un cofre'}</div>
      <span class="char-rarity" style="background:${rs.bg};color:${rs.color};border:1px solid ${rs.border}">${rs.label}</span>
    </div>`;
  }).join('');
}
function selectChar(i){
  if(!SAVE.unlockedChars.includes(CHARS[i].id))return;
  selectedCharId=i;
  document.querySelectorAll('.char-card').forEach(c=>c.classList.remove('selected'));
  document.getElementById('cc-'+i).classList.add('selected');
}

function startGame(){
  const char=CHARS[selectedCharId];
  G.players=Array.from({length:G.np},(_,i)=>({
    id:i,name:`Jugador ${i+1}`,color:COLORS[i],icon:PAWNS[i],
    charEmoji:i===0?char.emoji:CHARS[i%CHARS.length].emoji,
    charName:i===0?char.name:CHARS[i%CHARS.length].name,
    charAbility:i===0?char.ability:CHARS[i%CHARS.length].ability,
    pos:0,points:0,combo:0,cards:[],achievements:new Set(),retryUsed:false,trapsSurvived:0,
  }));
  G.cur=0;G.log=[];G.winner=null;G.frozen=[];G.rolling=false;
  G.round=1;G.roundEventCount=0;G.nextEventAt=3+rnd(3);
  G.doubleRound=false;G.trapImmune=[];G.showCards=false;
  G.classroom=false;G.goalPoints=0;
  // Remove classroom badge if present
  const cb=document.getElementById('class-badge');if(cb)cb.remove();
  showScreen('game');
  setTimeout(()=>{renderBoard();renderScore();renderPanel();renderLog();renderCombo();fitBoard();showRotateHint();},50);
  addLog('🎮 ¡Math Rush Arena ha comenzado!');
  addLog(`🎭 Tu personaje: ${char.emoji} ${char.name}`);
  if(window.ONEX)ONEX.sessionStart(); // Puntos ONEX: abre sesión firmada en el servidor
}

// ════════════════════════════════════════
// EVENTS
// ════════════════════════════════════════
function goToSetup(){
  startMusic();
  renderLobby();
  showScreen('lobby');
}
function goToCharSelect(){
  buildCharGrid();
  showScreen('char-select');
}
document.getElementById('splash-btn').addEventListener('click',goToSetup);
document.getElementById('splash').addEventListener('click',goToSetup);
document.getElementById('splash').addEventListener('touchend',e=>{e.preventDefault();goToSetup();},{passive:false});

document.querySelectorAll('#np-btns .opt-btn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('#np-btns .opt-btn').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');G.np=parseInt(b.dataset.n);
}));
document.querySelectorAll('.mode-btn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.mode-btn').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');G.mode=b.dataset.m;
}));
document.getElementById('play-btn').addEventListener('click',startGame);
document.getElementById('roll-btn').addEventListener('click',handleRoll);
document.getElementById('music-btn').addEventListener('click',toggleMusic);
document.getElementById('cs-music').addEventListener('click',toggleMusic);
document.getElementById('menu-btn').addEventListener('click',()=>{renderLobby();showScreen('lobby');});

// Init — show splash
loadSave();
detectPerfMode();
(function(){
  const screens=['splash','lobby','classroom-setup','char-select','game','qscreen','boss-screen','gameover','chest-screen','collection-screen'];
  screens.forEach(s=>{const e=document.getElementById(s);if(e){e.style.display='none';e.classList.add('hidden');}});
  showScreen('splash');
})();
document.getElementById('go-back').addEventListener('click',()=>{const cb=document.getElementById('class-badge');if(cb)cb.remove();renderLobby();showScreen('lobby');});
document.getElementById('atk-cancel').addEventListener('click',()=>{document.getElementById('atk-overlay').classList.add('hidden');nextTurn();});
document.getElementById('card-btn').addEventListener('click',()=>{G.showCards=!G.showCards;renderCards();});

// Init — show splash
loadSave();
detectPerfMode();
(function(){
  const screens=['splash','lobby','classroom-setup','char-select','game','qscreen','boss-screen','gameover','chest-screen','collection-screen'];
  screens.forEach(s=>{const e=document.getElementById(s);if(e){e.style.display='none';e.classList.add('hidden');}});
  showScreen('splash');
})();

// ── Lobby navigation ──
const lp=document.getElementById('lobby-play');if(lp)lp.addEventListener('click',goToCharSelect);
const tc=document.getElementById('tile-chests');if(tc)tc.addEventListener('click',()=>{
  if(SAVE.ownedChests.length>0){showChestOpen(SAVE.ownedChests[SAVE.ownedChests.length-1]);}
  else{floatText('🎁 No tienes cofres. ¡Gana partidas!','#FFD23F');}
});
const tcol=document.getElementById('tile-collection');if(tcol)tcol.addEventListener('click',()=>{collTab='chars';renderCollection();showScreen('collection-screen');});
const tsh=document.getElementById('tile-shop');if(tsh)tsh.addEventListener('click',()=>{
  // Simple shop: buy a rare chest for 150 coins
  if(SAVE.coins>=150){buyChest('rare');}else{floatText('🪙 Necesitas 150 monedas','#FF4E6A');}
});
const tst=document.getElementById('tile-stats');if(tst)tst.addEventListener('click',()=>{
  floatText('📊 '+SAVE.totalWins+'/'+SAVE.totalGames+' victorias · Mejor combo: '+SAVE.bestCombo,'#5B9FFF');
});
const cc=document.getElementById('chest-continue');if(cc)cc.addEventListener('click',()=>{renderLobby();showScreen('lobby');});
const cbig=document.getElementById('chest-big');if(cbig)cbig.addEventListener('click',doOpenChest);
const cback=document.getElementById('coll-back');if(cback)cback.addEventListener('click',()=>{renderLobby();showScreen('lobby');});
document.querySelectorAll('.coll-tab').forEach(t=>t.addEventListener('click',()=>{
  document.querySelectorAll('.coll-tab').forEach(x=>x.classList.remove('on'));
  t.classList.add('on');collTab=t.dataset.tab;renderCollection();
}));

// ── Classroom mode navigation ──
const pfb=document.getElementById('perf-btn');if(pfb)pfb.addEventListener('click',function(){togglePerfMode();this.classList.toggle('on',document.body.classList.contains('perf-mode'));});
const tcl=document.getElementById('tile-classroom');if(tcl)tcl.addEventListener('click',()=>{renderTeamList();showScreen('classroom-setup');});
const csb=document.getElementById('cs-back');if(csb)csb.addEventListener('click',()=>{renderLobby();showScreen('lobby');});
const csa=document.getElementById('team-add');if(csa)csa.addEventListener('click',addTeam);
const css=document.getElementById('cs-start');if(css)css.addEventListener('click',startClassroom);
document.querySelectorAll('.team-mode-btn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.team-mode-btn').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');setTeamMode(b.dataset.tm);
}));
document.querySelectorAll('.cs-mode').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.cs-mode').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');CLASS.mode=b.dataset.m;
}));
document.querySelectorAll('.goal-btn').forEach(b=>b.addEventListener('click',()=>{
  document.querySelectorAll('.goal-btn').forEach(x=>x.classList.remove('on'));
  b.classList.add('on');CLASS.goalPoints=parseInt(b.dataset.goal);
}));

// Expose to global for onclick handlers
window.bosAnswer=bosAnswer;
window.ansQ=ansQ;
window.selectChar=selectChar;
window.doAtk=doAtk;
window.useCard=useCard;
window.cycleEmoji=cycleEmoji;
window.updateTeamName=updateTeamName;
window.removeTeam=removeTeam;

})();