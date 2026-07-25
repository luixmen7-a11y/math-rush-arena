// ════════════════════════════════════════════════════════════
// PUNTOS ONEX — capa de fidelización (gimnasio ONEX, Alto Hospicio)
// Independiente del juego: si el servidor no responde, el juego
// funciona normal. El saldo REAL vive en el servidor; aquí solo
// se muestran datos consultados en vivo (nunca saldo cacheado).
// ════════════════════════════════════════════════════════════
(function(){
'use strict';
const API='/api';
const LS_ID='onex_player';
let sessionToken=null;     // token de la partida en curso (solo en memoria)
let lastBalance=null;      // solo para textos "hoy X/60" tras un evento, no como saldo oficial

function getPlayer(){try{return JSON.parse(localStorage.getItem(LS_ID))||null;}catch(e){return null;}}
function setPlayer(p){try{localStorage.setItem(LS_ID,JSON.stringify(p));}catch(e){}}

async function post(path,body){
  const r=await fetch(API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body||{})});
  return r.json();
}
async function get(path){const r=await fetch(API+path);return r.json();}

// ── Sesión de juego: se abre al iniciar partida (solo si está registrado) ──
async function sessionStart(){
  sessionToken=null;
  const p=getPlayer();if(!p)return;
  try{
    const j=await post('/session/start',{playerId:p.playerId});
    if(j.ok)sessionToken=j.token;
  }catch(e){}
}

// ── Reportar evento (el servidor decide los puntos) ──
async function event(type){
  if(!sessionToken)return;
  try{
    const j=await post('/events/report',{token:sessionToken,type});
    if(j.ok){
      lastBalance=j;
      if(j.granted>0)toast(`🏋️ +${j.granted} Puntos ONEX${j.capReached?' (tope diario)':''} · Hoy ${j.today}/${j.cap}`);
      else if(j.capReached)toast('🏋️ Tope diario de Puntos ONEX alcanzado (60)');
      if(j.streakBonus)toast(`🔥 ¡Racha de 3 días! +${j.streakBonus} Puntos ONEX`);
    }
  }catch(e){}
}

// ── Toast propio (negro/rojo ONEX) ──
function toast(msg){
  const t=document.createElement('div');t.className='onex-toast';t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>{t.style.opacity='0';setTimeout(()=>t.remove(),400);},2600);
}

// ── UI: pantalla ONEX ──
let ui=null;
function ensureUI(){
  if(ui)return ui;
  ui=document.createElement('div');ui.id='onex-screen';ui.className='onex-hidden';
  ui.innerHTML=`
  <div class="onex-panel">
    <div class="onex-hdr">
      <div class="onex-brand">🏋️ <b>PUNTOS ONEX</b></div>
      <button class="onex-x" id="onex-close">✕</button>
    </div>
    <div class="onex-body" id="onex-body"></div>
  </div>`;
  document.body.appendChild(ui);
  ui.querySelector('#onex-close').addEventListener('click',close);
  return ui;
}
function open(){ensureUI().classList.remove('onex-hidden');render();}
function close(){if(ui)ui.classList.add('onex-hidden');}

function fmt(ts){const d=new Date(ts);return d.toLocaleDateString('es-CL',{day:'2-digit',month:'2-digit'})+' '+d.toLocaleTimeString('es-CL',{hour:'2-digit',minute:'2-digit'});}
const REASONS={correct:'Respuesta correcta',win:'Victoria',combo5:'Combo x5',racha_3_dias:'Racha 3 días',bonus_agua:'Bonus compra Agua',bonus_score:'Bonus compra Score',bonus_score2:'Bonus compra 2 Scores',canje_expirado:'Devolución canje expirado'};

async function render(){
  const body=document.getElementById('onex-body');
  const p=getPlayer();
  if(!p){renderRegister(body);return;}
  body.innerHTML='<div class="onex-loading">Consultando tus puntos…</div>';
  let j=null;
  try{j=await get('/points/balance?playerId='+encodeURIComponent(p.playerId));}catch(e){}
  if(!j||!j.ok){
    body.innerHTML=`<div class="onex-offline">📡 Conéctate para ver tus puntos<br><small>El saldo real se consulta al servidor y ahora no hay conexión.</small>
    <button class="onex-btn" id="onex-retry">Reintentar</button></div>`;
    body.querySelector('#onex-retry').addEventListener('click',render);
    return;
  }
  const next=j.prizes.filter(x=>x.cost>j.balance).sort((a,b)=>a.cost-b.cost)[0];
  const pct=Math.min(100,Math.round(j.today/j.cap*100));
  body.innerHTML=`
    <div class="onex-hello">Hola, <b>${esc(j.name)}</b>${j.dragonUnlocked?' · 🐲 Dragón Dorado':''}</div>
    <div class="onex-balance"><span class="onex-num">${j.balance}</span><span class="onex-unit">Puntos ONEX</span></div>
    ${next?`<div class="onex-next">Te faltan <b>${next.cost-j.balance} pts</b> para tu ${esc(next.name)}</div>`:''}
    <div class="onex-daily"><div class="onex-daily-lbl">Hoy: ${j.today}/${j.cap} pts</div>
      <div class="onex-track"><div class="onex-fill" style="width:${pct}%"></div></div></div>
    ${j.streakDays?`<div class="onex-streak">🔥 Racha: ${j.streakDays} día(s) — a los 3 seguidos ganas +10</div>`:''}
    ${j.pendingRedeem?`<div class="onex-pending">🎟️ Código activo: <b class="onex-code-sm">${j.pendingRedeem.code}</b> (${esc(j.pendingRedeem.prize)}) — muéstralo en recepción</div>`:''}
    <div class="onex-sec">CATÁLOGO DE PREMIOS</div>
    <div class="onex-prizes">${j.prizes.map(x=>`
      <div class="onex-prize">
        <div class="onex-prize-name">${esc(x.name)}</div>
        <div class="onex-prize-cost">${x.cost} pts</div>
        <button class="onex-btn onex-btn-sm" data-prize="${x.id}" ${j.balance<x.cost||j.pendingRedeem?'disabled':''}>Canjear</button>
      </div>`).join('')}</div>
    <div class="onex-sec">CÓDIGO DE BONUS</div>
    <div class="onex-claim"><input id="onex-code-in" maxlength="6" placeholder="ABC123" autocomplete="off"/>
      <button class="onex-btn" id="onex-claim-btn">Canjear código</button></div>
    <div class="onex-sec">HISTORIAL</div>
    <div class="onex-hist">${(j.history||[]).slice(0,15).map(h=>`
      <div class="onex-h-row"><span>${esc(REASONS[h.reason]||h.reason||h.type)}</span>
      <span class="${h.pts>=0?'onex-pos':'onex-neg'}">${h.pts>=0?'+':''}${h.pts}</span>
      <span class="onex-h-ts">${fmt(h.ts)}</span></div>`).join('')||'<div class="onex-h-empty">Aún sin movimientos — ¡juega para ganar puntos!</div>'}</div>`;
  body.querySelectorAll('[data-prize]').forEach(btn=>btn.addEventListener('click',()=>redeem(btn.dataset.prize,btn)));
  body.querySelector('#onex-claim-btn').addEventListener('click',claim);
}

function esc(s){return String(s||'').replace(/[<>&"]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;'}[c]));}

function renderRegister(body){
  body.innerHTML=`
    <div class="onex-hello">Acumula puntos jugando y canjéalos por premios reales en el gimnasio 💪</div>
    <div class="onex-reg">
      <label>Tu nombre</label><input id="onex-name" maxlength="40" placeholder="Nombre y apellido"/>
      <label>Tu teléfono</label><input id="onex-phone" maxlength="12" inputmode="numeric" placeholder="9 1234 5678"/>
      <small>En recepción te pediremos tu nombre y los últimos 4 dígitos para entregarte los premios.</small>
      <button class="onex-btn" id="onex-reg-btn">Crear mi cuenta ONEX</button>
      <div class="onex-reg-err" id="onex-reg-err"></div>
    </div>`;
  body.querySelector('#onex-reg-btn').addEventListener('click',async()=>{
    const name=body.querySelector('#onex-name').value.trim();
    const phone=body.querySelector('#onex-phone').value.replace(/\D/g,'');
    const err=body.querySelector('#onex-reg-err');
    if(name.length<2||phone.length<8){err.textContent='Completa tu nombre y un teléfono válido.';return;}
    err.textContent='';
    try{
      const j=await post('/session/start',{name,phone});
      if(j.ok){setPlayer({playerId:j.playerId,name:j.name});sessionToken=j.token;render();}
      else err.textContent='No se pudo registrar: '+(j.error||'intenta de nuevo');
    }catch(e){err.textContent='Sin conexión. Intenta de nuevo.';}
  });
}

async function redeem(prizeId,btn){
  const p=getPlayer();if(!p)return;
  btn.disabled=true;btn.textContent='…';
  try{
    const j=await post('/redeem/create',{playerId:p.playerId,prize:prizeId});
    if(j.ok){
      const body=document.getElementById('onex-body');
      body.innerHTML=`
        <div class="onex-redeem-ok">
          <div class="onex-redeem-title">🎟️ ¡Canje creado!</div>
          <div class="onex-redeem-prize">${esc(j.prize)}</div>
          <div class="onex-code-big">${j.code}</div>
          <div class="onex-redeem-note">Muestra este código en recepción.<br>⏱ Válido por <b>15 minutos</b>. Si expira, tus puntos se devuelven solos.</div>
          <button class="onex-btn" id="onex-back">← Volver</button>
        </div>`;
      body.querySelector('#onex-back').addEventListener('click',render);
    } else {
      const msgs={saldo_insuficiente:'No te alcanzan los puntos.',frecuencia_excedida:'Ya canjeaste este premio recientemente (revisa las reglas de frecuencia).',canje_pendiente:'Ya tienes un código activo — úsalo o espera a que expire.'};
      toast('⚠️ '+(msgs[j.error]||'No se pudo canjear.'));render();
    }
  }catch(e){toast('⚠️ Sin conexión.');render();}
}

async function claim(){
  const p=getPlayer();if(!p)return;
  const inp=document.getElementById('onex-code-in');
  const code=(inp.value||'').toUpperCase().trim();
  if(code.length!==6){toast('⚠️ El código tiene 6 caracteres.');return;}
  try{
    const j=await post('/bonus/claim',{playerId:p.playerId,code});
    if(j.ok){
      toast(`✅ ${j.label}: +${j.pts} Puntos ONEX${j.dragon?' · 🐲 ¡Dragón Dorado desbloqueado!':''}`);
      if(j.dragon){try{localStorage.setItem('onex_dragon','1');}catch(e){}}
      render();
    } else {
      const msgs={codigo_invalido_o_usado:'Código inválido o ya usado.',demasiados_intentos:'Demasiados intentos, espera unos minutos.'};
      toast('⚠️ '+(msgs[j.error]||'Código inválido.'));
    }
  }catch(e){toast('⚠️ Sin conexión.');}
}

// ── Tarjeta en el lobby ──
// La tarjeta puede venir ya en el HTML (menú v2): en ese caso solo
// conectamos el clic. Si no existe, la creamos.
function injectLobbyTile(){
  const existing=document.getElementById('tile-onex');
  if(existing){
    if(!existing.dataset.onexBound){
      existing.dataset.onexBound='1';
      existing.addEventListener('click',open);
    }
    return;
  }
  const grid=document.querySelector('.lobby-grid');
  if(!grid)return;
  const tile=document.createElement('button');
  tile.className='lobby-tile onex-tile';tile.id='tile-onex';
  tile.dataset.onexBound='1';
  tile.innerHTML=`<span class="lobby-tile-icon" aria-hidden="true">🏋️</span>
    <span class="lobby-tile-name">Puntos ONEX</span>
    <span class="lobby-tile-sub">Canjea premios reales</span>`;
  grid.insertBefore(tile,grid.firstChild);
  tile.addEventListener('click',open);
}
document.addEventListener('DOMContentLoaded',injectLobbyTile);
if(document.readyState!=='loading')injectLobbyTile();

window.ONEX={sessionStart,event,open};
})();
