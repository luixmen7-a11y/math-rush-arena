// ════════════════════════════════════════════════════════════════
//  CAPA DE INTERFAZ — menú principal, selección de modo,
//  asistente de configuración, carrusel de personajes, nav inferior.
//  Orquesta pantallas usando window.MRAGame (el motor no se toca).
// ════════════════════════════════════════════════════════════════
(function(){
'use strict';
const CFG=window.MRA||{};
const $=id=>document.getElementById(id);
const esc=s=>String(s==null?'':s).replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));
function Game(){return window.MRAGame;}

// ── Estado del asistente ──
let WZ={mode:'solo',step:0,steps:[],np:2,names:[],chars:[],charSlot:0,
        category:'mixto',difficulty:'medium',duration:'normal'};

// ════════════════════════════════════════
// Cuántas preguntas hay por categoría (para no ofrecer categorías vacías)
// ════════════════════════════════════════
function poolCount(catId,diffId){
  const g=Game();if(!g)return 0;
  const diff=(CFG.DIFFICULTIES||[]).find(d=>d.id===diffId);
  let base;
  if(diff&&diff.bank==='EQ')base=g.EQ;
  else if(diff&&diff.bank==='HQ')base=g.HQ;
  else base=g.EQ.concat(g.HQ);
  const cat=(CFG.CATEGORIES||[]).find(c=>c.id===catId);
  if(!cat||!cat.match)return base.length;
  return base.filter(q=>cat.match.test(q.q)).length;
}
function categoryAvailable(catId,diffId){
  return poolCount(catId,diffId)>=(CFG.MIN_POOL||6);
}

// ════════════════════════════════════════
// MENÚ PRINCIPAL — tarjeta del jugador + misión
// ════════════════════════════════════════
function renderHero(){
  const g=Game();if(!g)return;
  const SAVE=g.SAVE;
  const chId=(SAVE.lastChar)||(SAVE.unlockedChars&&SAVE.unlockedChars[0])||'mago';
  const ch=g.CHARS.find(c=>c.id===chId)||g.CHARS[0];
  const av=$('hero-avatar');if(av)av.textContent=ch.emoji;
  const nm=$('hero-name');if(nm)nm.textContent=SAVE.playerName||'Jugador';
  const cc=$('hero-char');if(cc)cc.textContent=ch.name;
  const lv=$('hero-lvl');if(lv)lv.textContent='Nivel '+(SAVE.level||1);
  const need=(SAVE.level||1)*100;
  const xp=$('hero-xp');if(xp)xp.textContent=`${SAVE.xp||0} / ${need} XP`;
  const pct=Math.min(100,Math.round((SAVE.xp||0)/need*100));
  const bar=$('hero-xp-bar');if(bar)bar.setAttribute('aria-valuenow',String(pct));
  const fill=$('lb-xp-fill');if(fill)fill.style.width=pct+'%';
}

// Misión diaria (progreso local, se reinicia cada día)
function todayKey(){return new Date().toISOString().slice(0,10);}
const MISSIONS=[
  {id:'answer5',name:'Responde 5 preguntas correctas',goal:5,reward:'+30 XP'},
  {id:'play1',name:'Completa 1 partida',goal:1,reward:'+50 monedas'},
  {id:'combo3',name:'Consigue una racha de 3',goal:3,reward:'+1 cofre'},
];
function getMission(){
  const g=Game();if(!g)return null;
  const SAVE=g.SAVE;
  if(!SAVE.mission||SAVE.mission.date!==todayKey()){
    const m=MISSIONS[new Date().getDate()%MISSIONS.length];
    SAVE.mission={date:todayKey(),id:m.id,progress:0};
    g.persist();
  }
  const def=MISSIONS.find(m=>m.id===SAVE.mission.id)||MISSIONS[0];
  return {def,progress:Math.min(SAVE.mission.progress||0,def.goal)};
}
function renderMission(){
  const m=getMission();const el=$('mission-body');
  if(!m||!el)return;
  const pct=Math.round(m.progress/m.def.goal*100);
  const done=m.progress>=m.def.goal;
  el.innerHTML=`
    <div class="mission-name">${esc(m.def.name)}</div>
    <div class="mission-prog">
      <div class="mission-track" role="progressbar" aria-valuemin="0" aria-valuemax="${m.def.goal}" aria-valuenow="${m.progress}">
        <div class="mission-fill" style="width:${pct}%"></div>
      </div>
      <span class="mission-count">${m.progress}/${m.def.goal}</span>
    </div>
    <div class="mission-rw">${done?'✅ ¡Completada!':'Recompensa: '+esc(m.def.reward)}</div>`;
}

// ════════════════════════════════════════
// NAVEGACIÓN INFERIOR
// ════════════════════════════════════════
function setNavActive(key){
  document.querySelectorAll('#bottom-nav .nav-item').forEach(b=>{
    const on=b.dataset.nav===key;
    b.classList.toggle('on',on);
    if(on)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
}
function goHome(){const g=Game();g.renderLobby();renderHero();renderMission();g.showScreen('lobby');setNavActive('home');}

function initNav(){
  document.querySelectorAll('#bottom-nav .nav-item').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const g=Game();if(!g)return;
      const k=btn.dataset.nav;
      if(k==='home')goHome();
      else if(k==='collection'){g.renderCollection();g.showScreen('collection-screen');setNavActive('collection');}
      else if(k==='play')openModeSelect();
      else if(k==='shop'){renderProfile('shop');g.showScreen('profile-screen');setNavActive('shop');}
      else if(k==='profile'){renderProfile('stats');g.showScreen('profile-screen');setNavActive('profile');}
    });
  });
}

// ════════════════════════════════════════
// PERFIL (estadísticas, tienda y ajustes)
// ════════════════════════════════════════
function renderProfile(tab){
  const g=Game();if(!g)return;
  const SAVE=g.SAVE;
  const el=$('profile-body');if(!el)return;
  const t=tab||'stats';
  const winRate=SAVE.totalGames?Math.round((SAVE.totalWins||0)/SAVE.totalGames*100):0;
  el.innerHTML=`
    <div class="prof-tabs" role="tablist">
      <button class="coll-tab${t==='stats'?' on':''}" data-ptab="stats" role="tab" aria-selected="${t==='stats'}">Estadísticas</button>
      <button class="coll-tab${t==='shop'?' on':''}" data-ptab="shop" role="tab" aria-selected="${t==='shop'}">Tienda</button>
      <button class="coll-tab${t==='set'?' on':''}" data-ptab="set" role="tab" aria-selected="${t==='set'}">Ajustes</button>
    </div>
    <div id="prof-panel"></div>`;
  const panel=$('prof-panel');
  if(t==='stats'){
    panel.innerHTML=`
      <div class="stat-grid">
        ${statCard('Nivel',SAVE.level||1)}
        ${statCard('Partidas',SAVE.totalGames||0)}
        ${statCard('Victorias',SAVE.totalWins||0)}
        ${statCard('% Victorias',winRate+'%')}
        ${statCard('Mejor racha','🔥 '+(SAVE.bestCombo||0))}
        ${statCard('Récord solitario',SAVE.soloBest||0)}
        ${statCard('Monedas','🪙 '+(SAVE.coins||0))}
        ${statCard('Diamantes','💎 '+(SAVE.gems||0))}
      </div>
      <div class="prof-name-row">
        <label for="prof-name">TU NOMBRE EN EL JUEGO</label>
        <input id="prof-name" maxlength="18" value="${esc(SAVE.playerName||'')}" placeholder="Jugador"/>
        <button class="ghost-btn" id="prof-save">Guardar</button>
      </div>`;
    const sv=$('prof-save');
    if(sv)sv.addEventListener('click',()=>{
      SAVE.playerName=($('prof-name').value||'').trim().slice(0,18);
      g.persist();renderHero();sv.textContent='✓ Guardado';
      setTimeout(()=>sv.textContent='Guardar',1500);
    });
  } else if(t==='shop'){
    panel.innerHTML=`<div class="shop-note">Compra cofres con monedas 🪙</div>
      <div class="shop-grid">
        ${shopItem('common','Cofre Común',100)}
        ${shopItem('rare','Cofre Raro',300)}
        ${shopItem('epic','Cofre Épico',800)}
      </div>
      <div class="shop-hint">Los Puntos ONEX (premios reales del gimnasio) están en el menú principal.</div>`;
    panel.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>{
      const type=b.dataset.buy,cost=parseInt(b.dataset.cost,10);
      if((SAVE.coins||0)<cost){b.textContent='Sin monedas';setTimeout(()=>renderProfile('shop'),1200);return;}
      SAVE.coins-=cost;if(!SAVE.ownedChests)SAVE.ownedChests=[];SAVE.ownedChests.push(type);
      g.persist();renderProfile('shop');
    }));
  } else {
    panel.innerHTML=`
      <div class="set-list">
        <button class="set-row" id="set-music"><span>🔊 Música</span><b id="set-music-st">—</b></button>
        <button class="set-row" id="set-perf"><span>⚡ Modo rendimiento</span><b id="set-perf-st">—</b></button>
        <div class="set-info">Reduce animaciones y efectos para equipos lentos.</div>
      </div>`;
    const mb=$('set-music');
    if(mb)mb.addEventListener('click',()=>{g.toggleMusic();updateSetStates();});
    const pb=$('set-perf');
    if(pb)pb.addEventListener('click',()=>{document.body.classList.toggle('perf-mode');updateSetStates();});
    updateSetStates();
  }
  el.querySelectorAll('[data-ptab]').forEach(b=>b.addEventListener('click',()=>renderProfile(b.dataset.ptab)));
}
function updateSetStates(){
  const m=$('set-music-st');if(m)m.textContent=document.querySelector('.music-on')?'Activada':'Desactivada';
  const p=$('set-perf-st');if(p)p.textContent=document.body.classList.contains('perf-mode')?'Activado':'Desactivado';
}
function statCard(l,v){return `<div class="stat-card"><b>${esc(v)}</b><small>${esc(l)}</small></div>`;}
function shopItem(type,name,cost){
  return `<div class="shop-item"><div class="shop-ico" aria-hidden="true">${type==='common'?'📦':type==='rare'?'🎁':'💜'}</div>
    <div class="shop-name">${esc(name)}</div>
    <button class="onex-btn onex-btn-sm" data-buy="${type}" data-cost="${cost}">🪙 ${cost}</button></div>`;
}

// ════════════════════════════════════════
// SELECCIÓN DE MODO
// ════════════════════════════════════════
function openModeSelect(){
  const g=Game();if(!g)return;
  g.showScreen('mode-select');setNavActive('play');
}

// ════════════════════════════════════════
// ASISTENTE DE CONFIGURACIÓN
// ════════════════════════════════════════
function startWizard(mode){
  const g=Game();
  WZ.mode=mode;WZ.step=0;
  WZ.steps=mode==='solo'?['Personaje','Desafío','Resumen']:['Jugadores','Personajes','Desafío','Resumen'];
  WZ.np=2;WZ.names=[];WZ.charSlot=0;
  // Personaje inicial: el último usado, si está desbloqueado
  const SAVE=g.SAVE;
  const firstUnlocked=g.CHARS.findIndex(c=>SAVE.unlockedChars.includes(c.id));
  const last=g.CHARS.findIndex(c=>c.id===SAVE.lastChar);
  const def=last>=0&&SAVE.unlockedChars.includes(g.CHARS[last].id)?last:(firstUnlocked>=0?firstUnlocked:0);
  WZ.chars=[def,1,2,3,4,5].slice(0,6);
  if(!categoryAvailable(WZ.category,WZ.difficulty))WZ.category='mixto';
  $('wz-title').textContent=mode==='solo'?'MODO SOLITARIO':'PARTIDA CON AMIGOS';
  g.showScreen('setup-wizard');
  renderWizard();
}
function renderSteps(){
  const el=$('wz-steps');if(!el)return;
  el.innerHTML=WZ.steps.map((s,i)=>`
    <div class="wz-step${i===WZ.step?' on':''}${i<WZ.step?' done':''}" role="listitem"
         aria-current="${i===WZ.step?'step':'false'}">
      <span class="wz-dot">${i<WZ.step?'✓':i+1}</span><span class="wz-lbl">${esc(s)}</span>
    </div>`).join('');
}
function renderWizard(){
  renderSteps();
  const body=$('wz-body'),next=$('wz-next'),hint=$('wz-hint');
  const step=WZ.steps[WZ.step];
  hint.textContent='';
  next.disabled=false;
  next.textContent=WZ.step===WZ.steps.length-1?'COMENZAR PARTIDA':'CONTINUAR';
  if(step==='Jugadores')renderStepPlayers(body,hint,next);
  else if(step==='Personaje'||step==='Personajes')renderStepChars(body,hint,next);
  else if(step==='Desafío')renderStepChallenge(body,hint,next);
  else renderStepSummary(body,hint,next);
}

// ── Paso: jugadores ──
function renderStepPlayers(body,hint,next){
  body.innerHTML=`
    <div class="section-lbl">¿CUÁNTOS JUGADORES?</div>
    <div class="opt-row" id="wz-np" role="group" aria-label="Cantidad de jugadores">
      ${[2,3,4,5,6].map(n=>`<button class="opt-btn${n===WZ.np?' on':''}" data-n="${n}" aria-pressed="${n===WZ.np}">${n}</button>`).join('')}
    </div>
    <div class="section-lbl" style="margin-top:16px;">NOMBRES (OPCIONAL)</div>
    <div class="wz-names" id="wz-names"></div>`;
  const paint=()=>{
    const wrap=$('wz-names');
    wrap.innerHTML=Array.from({length:WZ.np},(_,i)=>{
      const col=['#5B9FFF','#FF5BC8','#3FE88A','#FFD23F','#B06FFF','#FF4E6A'][i];
      return `<div class="wz-name-row">
        <span class="wz-dot-col" style="background:${col}" aria-hidden="true"></span>
        <label class="sr-only" for="wzn${i}">Nombre del jugador ${i+1}</label>
        <input id="wzn${i}" maxlength="14" placeholder="Jugador ${i+1}" value="${esc(WZ.names[i]||'')}"/>
      </div>`;
    }).join('');
    wrap.querySelectorAll('input').forEach((inp,i)=>{
      inp.addEventListener('input',()=>{WZ.names[i]=inp.value;validate();});
    });
    validate();
  };
  const validate=()=>{
    const used=WZ.names.slice(0,WZ.np).map(n=>(n||'').trim().toLowerCase()).filter(Boolean);
    const dup=used.length!==new Set(used).size;
    next.disabled=dup;
    hint.textContent=dup?'⚠️ Hay nombres repetidos: cámbialos para continuar.':'';
  };
  body.querySelectorAll('#wz-np .opt-btn').forEach(b=>b.addEventListener('click',()=>{
    WZ.np=parseInt(b.dataset.n,10);
    body.querySelectorAll('#wz-np .opt-btn').forEach(x=>{const on=x===b;x.classList.toggle('on',on);x.setAttribute('aria-pressed',String(on));});
    paint();
  }));
  paint();
}

// ── Paso: personajes (carrusel) ──
function renderStepChars(body,hint,next){
  const g=Game();const SAVE=g.SAVE;
  const multi=WZ.mode!=='solo';
  if(multi&&WZ.charSlot>=WZ.np)WZ.charSlot=0;
  const idx=multi?WZ.chars[WZ.charSlot]:WZ.chars[0];
  const ch=g.CHARS[idx]||g.CHARS[0];
  const owned=SAVE.unlockedChars.includes(ch.id);
  const rs=g.RARITY_STYLE[ch.rarity]||g.RARITY_STYLE.common;
  // Personajes ya tomados por otros jugadores (evitar duplicados)
  const taken=multi?WZ.chars.slice(0,WZ.np).filter((_,i)=>i!==WZ.charSlot):[];
  const dupe=multi&&taken.includes(idx);
  body.innerHTML=`
    ${multi?`<div class="wz-slot-row" role="group" aria-label="Jugador que elige">
      ${Array.from({length:WZ.np},(_,i)=>`<button class="wz-slot${i===WZ.charSlot?' on':''}" data-slot="${i}">J${i+1}</button>`).join('')}
    </div>`:''}
    <div class="char-hero" aria-live="polite">
      <button class="car-nav" id="car-prev" aria-label="Personaje anterior">‹</button>
      <div class="char-hero-card ${owned?'':'locked'}">
        <div class="char-hero-art" aria-hidden="true">${owned?ch.emoji:'🔒'}</div>
        <div class="char-hero-name">${owned?esc(ch.name):'Bloqueado'}</div>
        <div class="char-hero-ability">${owned?esc(ch.desc):'Consíguelo en un cofre'}</div>
        <span class="char-rarity" style="background:${rs.bg};color:${rs.color};border:1px solid ${rs.border}">${rs.label}</span>
        <div class="char-hero-state">${!owned?'No disponible':dupe?'Ya elegido por otro jugador':'✓ Seleccionado'}</div>
      </div>
      <button class="car-nav" id="car-next" aria-label="Personaje siguiente">›</button>
    </div>
    <div class="car-dots" aria-hidden="true">${g.CHARS.map((c,i)=>`<span class="car-dot${i===idx?' on':''}"></span>`).join('')}</div>`;
  const move=d=>{
    const n=g.CHARS.length;
    let i=idx;
    for(let k=0;k<n;k++){
      i=(i+d+n)%n;
      if(SAVE.unlockedChars.includes(g.CHARS[i].id))break;
    }
    if(multi)WZ.chars[WZ.charSlot]=i;else WZ.chars[0]=i;
    renderWizard();
  };
  $('car-prev').addEventListener('click',()=>move(-1));
  $('car-next').addEventListener('click',()=>move(1));
  body.querySelectorAll('[data-slot]').forEach(b=>b.addEventListener('click',()=>{
    WZ.charSlot=parseInt(b.dataset.slot,10);renderWizard();
  }));
  // Validación
  if(!owned){next.disabled=true;hint.textContent='⚠️ Elige un personaje desbloqueado.';}
  else if(multi){
    const list=WZ.chars.slice(0,WZ.np);
    const hasDupe=list.length!==new Set(list).size;
    next.disabled=hasDupe;
    hint.textContent=hasDupe?'⚠️ Dos jugadores tienen el mismo personaje: cámbialos.':'';
  }
}

// ── Paso: desafío ──
function renderStepChallenge(body,hint,next){
  const cats=(CFG.CATEGORIES||[]);
  const diffs=(CFG.DIFFICULTIES||[]);
  const durs=(CFG.DURATIONS||[]);
  body.innerHTML=`
    <div class="section-lbl">CATEGORÍA</div>
    <div class="chip-row" id="wz-cat" role="group" aria-label="Categoría">
      ${cats.map(c=>{
        const n=poolCount(c.id,WZ.difficulty);
        const ok=n>=(CFG.MIN_POOL||6);
        return `<button class="chip${c.id===WZ.category?' on':''}" data-cat="${c.id}" ${ok?'':'disabled'}
          aria-pressed="${c.id===WZ.category}" title="${ok?n+' preguntas':'Sin preguntas suficientes'}">
          ${esc(c.name)}<small>${ok?n+' preg.':'no disp.'}</small></button>`;
      }).join('')}
    </div>
    <div class="section-lbl" style="margin-top:16px;">DIFICULTAD</div>
    <div class="chip-row" id="wz-diff" role="group" aria-label="Dificultad">
      ${diffs.map(d=>`<button class="chip${d.id===WZ.difficulty?' on':''}" data-diff="${d.id}" aria-pressed="${d.id===WZ.difficulty}">
        ${esc(d.name)}<small>${esc(d.desc)}</small></button>`).join('')}
    </div>
    <div class="section-lbl" style="margin-top:16px;">DURACIÓN</div>
    <div class="chip-row" id="wz-dur" role="group" aria-label="Duración">
      ${durs.map(d=>`<button class="chip${d.id===WZ.duration?' on':''}" data-dur="${d.id}" aria-pressed="${d.id===WZ.duration}">
        ${esc(d.name)}<small>${esc(d.desc)}</small></button>`).join('')}
    </div>`;
  body.querySelectorAll('[data-cat]').forEach(b=>b.addEventListener('click',()=>{WZ.category=b.dataset.cat;renderWizard();}));
  body.querySelectorAll('[data-diff]').forEach(b=>b.addEventListener('click',()=>{
    WZ.difficulty=b.dataset.diff;
    if(!categoryAvailable(WZ.category,WZ.difficulty))WZ.category='mixto';
    renderWizard();
  }));
  body.querySelectorAll('[data-dur]').forEach(b=>b.addEventListener('click',()=>{WZ.duration=b.dataset.dur;renderWizard();}));
}

// ── Paso: resumen ──
function renderStepSummary(body,hint,next){
  const g=Game();
  const cat=(CFG.CATEGORIES||[]).find(c=>c.id===WZ.category);
  const diff=(CFG.DIFFICULTIES||[]).find(d=>d.id===WZ.difficulty);
  const dur=(CFG.DURATIONS||[]).find(d=>d.id===WZ.duration);
  const A=CFG.ATTEMPTS||{start:3};
  const chNames=(WZ.mode==='solo'?[WZ.chars[0]]:WZ.chars.slice(0,WZ.np))
    .map(i=>(g.CHARS[i]||g.CHARS[0]).name);
  const row=(l,v)=>`<div class="sum-row"><span>${esc(l)}</span><b>${esc(v)}</b></div>`;
  body.innerHTML=`
    <div class="sum-card">
      ${row('Modo',WZ.mode==='solo'?'Solitario':'Con amigos')}
      ${WZ.mode!=='solo'?row('Jugadores',WZ.np):''}
      ${row(chNames.length>1?'Personajes':'Personaje',chNames.join(' · '))}
      ${row('Categoría',cat?cat.name:'Mixto')}
      ${row('Dificultad',diff?diff.name:'—')}
      ${row('Duración',(dur?dur.name:'')+' · ~'+(dur?dur.minutes:10)+' min')}
      ${WZ.mode==='solo'?row('Intentos','❤️ '+A.start):''}
      ${row('Preguntas disponibles',poolCount(WZ.category,WZ.difficulty))}
    </div>
    <p class="sum-line">${esc(WZ.mode==='solo'?'Modo solitario':'Con amigos')} · ${esc(chNames[0])} · ${esc(cat?cat.name:'Mixto')} · ${esc(diff?diff.name:'')} · ~${dur?dur.minutes:10} min</p>`;
}

// ── Lanzar la partida con la configuración del asistente ──
function launchGame(){
  const g=Game();const G=g.G;
  G.category=WZ.category;
  G.difficulty=WZ.difficulty;
  G.duration=WZ.duration;
  G.mode=WZ.difficulty==='easy'?'easy':'hard'; // compatibilidad con el motor
  G.playerNames=WZ.mode==='solo'?[]:WZ.names.slice(0,WZ.np);
  G.playerChars=WZ.mode==='solo'?[WZ.chars[0]]:WZ.chars.slice(0,WZ.np);
  // Recordar el personaje elegido
  const ch=g.CHARS[WZ.chars[0]];
  if(ch){g.SAVE.lastChar=ch.id;g.persist();}
  window.__mraSelectedChar=WZ.chars[0];
  if(window.selectChar)window.selectChar(WZ.chars[0]);
  if(WZ.mode==='solo'){g.startSolo();}
  else{G.solo=false;G.np=WZ.np;g.startGame();}
}

// ════════════════════════════════════════
// CABLEADO
// ════════════════════════════════════════
function init(){
  initNav();
  // Menú → modo
  const lp=$('lobby-play');
  if(lp){const c=lp.cloneNode(true);lp.parentNode.replaceChild(c,lp);c.addEventListener('click',openModeSelect);}
  const st=$('lb-settings');if(st)st.addEventListener('click',()=>{renderProfile('stats');Game().showScreen('profile-screen');setNavActive('profile');});
  const pb=$('prof-back');if(pb)pb.addEventListener('click',goHome);
  const mm=$('mission-more');if(mm)mm.addEventListener('click',()=>{renderProfile('stats');Game().showScreen('profile-screen');});
  // Modo
  const msb=$('ms-back');if(msb)msb.addEventListener('click',goHome);
  const solo=$('mode-solo');if(solo)solo.addEventListener('click',()=>startWizard('solo'));
  const fr=$('mode-friends');if(fr)fr.addEventListener('click',()=>startWizard('friends'));
  // Asistente
  const wb=$('wz-back');
  if(wb)wb.addEventListener('click',()=>{
    if(WZ.step>0){WZ.step--;renderWizard();}
    else openModeSelect();
  });
  const wn=$('wz-next');
  if(wn)wn.addEventListener('click',()=>{
    if(WZ.step<WZ.steps.length-1){WZ.step++;renderWizard();}
    else launchGame();
  });
  // Resultado solitario
  const ra=$('res-again');if(ra)ra.addEventListener('click',launchGame);
  const rc=$('res-config');if(rc)rc.addEventListener('click',()=>{WZ.step=0;Game().showScreen('setup-wizard');renderWizard();});
  const rh=$('res-home');if(rh)rh.addEventListener('click',goHome);
  const rp=$('res-prizes');if(rp)rp.addEventListener('click',()=>{if(window.ONEX)window.ONEX.open();});
  // Menú del juego → inicio
  const mb=$('menu-btn');
  if(mb){const c=mb.cloneNode(true);mb.parentNode.replaceChild(c,mb);c.addEventListener('click',goHome);}
  renderHero();renderMission();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
else init();

// Progreso de misión (llamado por el motor a través de eventos simples)
window.MRAUI={
  missionTick(kind,value){
    const g=Game();if(!g)return;
    const m=getMission();if(!m)return;
    const map={answer5:'answer5',play1:'play1',combo3:'combo3'};
    if(m.def.id==='answer5'&&kind==='correct')g.SAVE.mission.progress=(g.SAVE.mission.progress||0)+1;
    if(m.def.id==='play1'&&kind==='win')g.SAVE.mission.progress=(g.SAVE.mission.progress||0)+1;
    if(m.def.id==='combo3'&&kind==='combo'&&value>=3)g.SAVE.mission.progress=Math.max(g.SAVE.mission.progress||0,value);
    g.persist();
  },
  renderHero,renderMission,goHome,openModeSelect,renderProfile,
};
})();
